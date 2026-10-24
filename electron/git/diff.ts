import { execGit, execGitOrThrow } from './executor'
import type { FileDiff, DiffHunk, DiffLine } from '../../shared/types/git.types'
import { createLogger } from '../logger'

const logger = createLogger('git:diff')

const LARGE_FILE_THRESHOLD = 500 * 1024 // 500 KB of diff output

export interface DiffOptions {
  staged?: boolean     // diff against index
  ref?: string         // compare against a specific ref
  ignoreWhitespace?: boolean
}

/**
 * Get diff for a single file.
 */
export async function getFileDiff(
  repoPath: string,
  filePath: string,
  options: DiffOptions = {}
): Promise<FileDiff> {
  const args = ['diff', '--unified=3', '-M', '-C', '--no-color']

  if (options.ignoreWhitespace) args.push('-w')

  if (options.staged) {
    args.push('--cached')
    if (options.ref) args.push(options.ref)
  } else if (options.ref) {
    args.push(options.ref)
  }

  args.push('--', filePath)

  const result = await execGit(args, { cwd: repoPath })

  if (result.stdout.length > LARGE_FILE_THRESHOLD) {
    return {
      oldPath: filePath,
      newPath: filePath,
      status: 'modified',
      hunks: [],
      isBinary: false,
      isLarge: true,
      additions: 0,
      deletions: 0,
    }
  }

  const parsed = parseDiff(result.stdout)
  return parsed[0] ?? {
    oldPath: filePath,
    newPath: filePath,
    status: 'modified',
    hunks: [],
    isBinary: false,
    isLarge: false,
    additions: 0,
    deletions: 0,
  }
}

/**
 * Get diff for a commit (vs its first parent).
 */
export async function getCommitDiff(repoPath: string, hash: string): Promise<FileDiff[]> {
  const args = ['diff', '--unified=3', '-M', '-C', '--no-color', `${hash}^`, hash, '--']
  const result = await execGit(args, { cwd: repoPath })
  if (result.exitCode !== 0 && result.stderr.includes('unknown revision')) {
    // Initial commit: compare to empty tree
    const emptyTree = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'
    const r2 = await execGit(
      ['diff', '--unified=3', '-M', '-C', '--no-color', emptyTree, hash, '--'],
      { cwd: repoPath }
    )
    return parseDiff(r2.stdout)
  }
  return parseDiff(result.stdout)
}

/**
 * Get diff between two commits.
 */
export async function getCommitsDiff(
  repoPath: string,
  fromHash: string,
  toHash: string
): Promise<FileDiff[]> {
  const result = await execGitOrThrow(
    ['diff', '--unified=3', '-M', '-C', '--no-color', fromHash, toHash, '--'],
    { cwd: repoPath }
  )
  return parseDiff(result.stdout)
}

/**
 * Get diff between two branches.
 */
export async function getBranchDiff(
  repoPath: string,
  branchA: string,
  branchB: string
): Promise<FileDiff[]> {
  const result = await execGitOrThrow(
    ['diff', '--unified=3', '-M', '-C', '--no-color', branchA, branchB, '--'],
    { cwd: repoPath }
  )
  return parseDiff(result.stdout)
}

/**
 * Parse unified diff output into structured FileDiff objects.
 */
export function parseDiff(rawDiff: string): FileDiff[] {
  const files: FileDiff[] = []
  if (!rawDiff.trim()) return files

  // Split by 'diff --git' header
  const sections = rawDiff.split(/^(?=diff --git )/m).filter(Boolean)

  for (const section of sections) {
    const lines = section.split('\n')
    let i = 0

    // Parse diff --git a/... b/...
    const headerLine = lines[i++]
    const headerMatch = headerLine.match(/^diff --git a\/(.*?) b\/(.*)$/)
    if (!headerMatch) continue

    let oldPath = headerMatch[1]
    let newPath = headerMatch[2]
    let isBinary = false
    let status: FileDiff['status'] = 'modified'

    // Parse extended headers
    while (i < lines.length && !lines[i].startsWith('---') && !lines[i].startsWith('@@ ')) {
      const line = lines[i]
      if (line.startsWith('new file mode')) status = 'added'
      else if (line.startsWith('deleted file mode')) status = 'deleted'
      else if (line.startsWith('rename from ')) { status = 'renamed'; oldPath = line.slice('rename from '.length) }
      else if (line.startsWith('rename to ')) newPath = line.slice('rename to '.length)
      else if (line.includes('Binary files')) { isBinary = true }
      i++
    }

    if (isBinary) {
      files.push({ oldPath, newPath, status, hunks: [], isBinary: true, isLarge: false, additions: 0, deletions: 0 })
      continue
    }

    // Skip --- and +++ lines
    if (lines[i]?.startsWith('---')) i++
    if (lines[i]?.startsWith('+++')) i++

    // Parse hunks
    const hunks: DiffHunk[] = []
    let additions = 0
    let deletions = 0

    while (i < lines.length) {
      const line = lines[i]
      if (!line.startsWith('@@ ')) { i++; continue }

      const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/)
      if (!hunkMatch) { i++; continue }

      const oldStart = parseInt(hunkMatch[1], 10)
      const oldCount = parseInt(hunkMatch[2] ?? '1', 10)
      const newStart = parseInt(hunkMatch[3], 10)
      const newCount = parseInt(hunkMatch[4] ?? '1', 10)
      const header = line

      i++

      const hunkLines: DiffLine[] = []
      let oldLineNum = oldStart
      let newLineNum = newStart

      while (i < lines.length && !lines[i].startsWith('@@ ') && !lines[i].startsWith('diff --git ')) {
        const hunkLine = lines[i]
        if (hunkLine.startsWith('+')) {
          hunkLines.push({ type: 'added', content: hunkLine.slice(1), newLineNumber: newLineNum++ })
          additions++
        } else if (hunkLine.startsWith('-')) {
          hunkLines.push({ type: 'removed', content: hunkLine.slice(1), oldLineNumber: oldLineNum++ })
          deletions++
        } else if (hunkLine.startsWith('\\')) {
          hunkLines.push({ type: 'no-newline', content: hunkLine.slice(1) })
        } else {
          hunkLines.push({ type: 'context', content: hunkLine.slice(1), oldLineNumber: oldLineNum++, newLineNumber: newLineNum++ })
        }
        i++
      }

      hunks.push({ header, oldStart, oldCount, newStart, newCount, lines: hunkLines })
    }

    files.push({ oldPath, newPath, status, hunks, isBinary: false, isLarge: false, additions, deletions })
  }

  return files
}
