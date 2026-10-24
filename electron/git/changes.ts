import { execGit, execGitOrThrow } from './executor'
import type { RepoStatus, ChangedFile, FileStatus } from '../../shared/types/git.types'
import { createLogger } from '../logger'

const logger = createLogger('git:changes')

/**
 * Parse git status --porcelain=v1 output into structured ChangedFile objects.
 * XY format: X = index status, Y = work tree status
 */
export function parseStatus(output: string): ChangedFile[] {
  const files: ChangedFile[] = []
  const lines = output.split('\n').filter((l) => l.length > 0)

  for (const line of lines) {
    if (line.length < 3) continue

    const x = line[0]  // index (staged) status
    const y = line[1]  // working tree (unstaged) status
    let path = line.slice(3)
    let originalPath: string | undefined

    // Handle rename/copy: "R old -> new" or "R100 old\0new"
    if (path.includes(' -> ')) {
      const parts = path.split(' -> ')
      originalPath = parts[0].trim()
      path = parts[1].trim()
    }

    // Remove surrounding quotes (git adds them for special chars)
    if (path.startsWith('"') && path.endsWith('"')) {
      path = path.slice(1, -1)
    }

    const staged = x !== ' ' && x !== '?'
    const unstaged = y !== ' ' && y !== '?'
    const isUntracked = x === '?' && y === '?'
    const isConflicted = (x === 'U' || y === 'U' || (x === 'A' && y === 'A') || (x === 'D' && y === 'D'))

    files.push({
      path,
      originalPath,
      status: getFileStatus(x, y),
      staged,
      unstaged,
      indexStatus: x,
      workingStatus: y,
    })
  }

  return files
}

function getFileStatus(x: string, y: string): FileStatus {
  if (x === '?' && y === '?') return 'untracked'
  if (x === '!' && y === '!') return 'ignored'
  if (x === 'U' || y === 'U' || (x === 'A' && y === 'A') || (x === 'D' && y === 'D')) return 'conflicted'
  if (x === 'D' || y === 'D') return 'deleted'
  if (x === 'R' || y === 'R') return 'renamed'
  if (x === 'C' || y === 'C') return 'copied'
  if (x === 'A') return 'added'
  if (x === 'M' || y === 'M') return 'modified'
  return 'modified'
}

/**
 * Get the full repository status including branch info.
 */
export async function getRepoStatus(repoPath: string): Promise<RepoStatus> {
  const [statusResult, branchResult] = await Promise.all([
    execGit(['status', '--porcelain=v1', '-u', '--renames'], { cwd: repoPath }),
    execGit(['status', '--branch', '--porcelain=v1'], { cwd: repoPath }),
  ])

  // Parse branch info from first line of --branch output
  let branch: string | null = null
  let detachedHead = false
  let ahead = 0
  let behind = 0

  const branchLines = branchResult.stdout.split('\n')
  const branchLine = branchLines[0] ?? ''

  if (branchLine.startsWith('## HEAD (no branch)')) {
    detachedHead = true
  } else if (branchLine.startsWith('## ')) {
    let branchInfo = branchLine.slice(3).trim()
    if (branchInfo.startsWith('No commits yet on ')) {
      branchInfo = branchInfo.replace('No commits yet on ', '')
    }
    const aheadMatch = branchInfo.match(/\[ahead (\d+)/)
    const behindMatch = branchInfo.match(/behind (\d+)/)
    if (aheadMatch) ahead = parseInt(aheadMatch[1], 10)
    if (behindMatch) behind = parseInt(behindMatch[1], 10)
    branch = branchInfo.split('...')[0].split(' [')[0].trim()
  }

  const headResult = await execGit(['rev-parse', 'HEAD'], { cwd: repoPath })
  const headCommit = headResult.exitCode === 0 ? headResult.stdout.trim() : null

  const files = parseStatus(statusResult.stdout)

  // Detect in-progress operations
  const mergeInProgress = (await execGit(['rev-parse', '--verify', 'MERGE_HEAD'], { cwd: repoPath })).exitCode === 0
  const rebaseInProgress = (await execGit(['rev-parse', '--verify', 'REBASE_HEAD'], { cwd: repoPath })).exitCode === 0
  const cherryPickInProgress = (await execGit(['rev-parse', '--verify', 'CHERRY_PICK_HEAD'], { cwd: repoPath })).exitCode === 0
  const revertInProgress = (await execGit(['rev-parse', '--verify', 'REVERT_HEAD'], { cwd: repoPath })).exitCode === 0

  return {
    branch,
    detachedHead,
    headCommit,
    ahead,
    behind,
    staged: files.filter((f) => f.staged && f.status !== 'conflicted'),
    unstaged: files.filter((f) => f.unstaged && !f.staged && f.status !== 'untracked' && f.status !== 'conflicted'),
    untracked: files.filter((f) => f.status === 'untracked'),
    conflicted: files.filter((f) => f.status === 'conflicted'),
    mergeInProgress,
    rebaseInProgress,
    cherryPickInProgress,
    revertInProgress,
  }
}

/** Stage a file. */
export async function stageFile(repoPath: string, filePath: string): Promise<void> {
  await execGitOrThrow(['add', '--', filePath], { cwd: repoPath })
}

/** Unstage a file. */
export async function unstageFile(repoPath: string, filePath: string): Promise<void> {
  const result = await execGit(['restore', '--staged', '--', filePath], { cwd: repoPath })
  if (result.exitCode !== 0) {
    // Fallback for older git: reset HEAD
    await execGitOrThrow(['reset', 'HEAD', '--', filePath], { cwd: repoPath })
  }
}

/** Stage all changes. */
export async function stageAll(repoPath: string): Promise<void> {
  await execGitOrThrow(['add', '-A'], { cwd: repoPath })
}

/** Unstage all changes. */
export async function unstageAll(repoPath: string): Promise<void> {
  const result = await execGit(['restore', '--staged', '.'], { cwd: repoPath })
  if (result.exitCode !== 0) {
    await execGitOrThrow(['reset', 'HEAD', '.'], { cwd: repoPath })
  }
}

/** Discard changes to a file (restore working tree). */
export async function discardFile(repoPath: string, filePath: string): Promise<void> {
  const result = await execGit(['restore', '--', filePath], { cwd: repoPath })
  if (result.exitCode !== 0) {
    await execGitOrThrow(['checkout', 'HEAD', '--', filePath], { cwd: repoPath })
  }
}

/** Discard all working tree changes. */
export async function discardAll(repoPath: string): Promise<void> {
  await execGitOrThrow(['restore', '.'], { cwd: repoPath })
  // Also clean untracked files? We'll ask in UI first.
}

/** Apply a patch to the index (for partial staging). */
export async function applyPatch(repoPath: string, patch: string, reverse = false): Promise<void> {
  const args = ['apply', '--cached', '--whitespace=nowarn']
  if (reverse) args.push('--reverse')
  args.push('-')
  await execGitOrThrow(args, { cwd: repoPath, stdin: patch })
}
