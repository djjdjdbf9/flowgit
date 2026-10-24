import { execGit, execGitOrThrow } from './executor'
import type { StashEntry } from '../../shared/types/git.types'
import { createLogger } from '../logger'

const logger = createLogger('git:stash')

export async function listStash(repoPath: string): Promise<StashEntry[]> {
  const result = await execGit(
    ['stash', 'list', '--format=%gd%n%H%n%s%n%aI'],
    { cwd: repoPath }
  )
  if (result.exitCode !== 0 || !result.stdout.trim()) return []

  const entries: StashEntry[] = []
  const lines = result.stdout.trim().split('\n')

  for (let i = 0; i < lines.length; i += 4) {
    const stashRef = lines[i]?.trim()
    const hash = lines[i + 1]?.trim()
    const message = lines[i + 2]?.trim() ?? ''
    const date = lines[i + 3]?.trim() ?? ''

    if (!stashRef) continue

    const indexMatch = stashRef.match(/stash@\{(\d+)\}/)
    const index = indexMatch ? parseInt(indexMatch[1], 10) : entries.length

    const branchMatch = message.match(/^WIP on (.+?):/)
    const branch = branchMatch ? branchMatch[1] : 'unknown'

    entries.push({ index, hash, message, branch, date })
  }

  return entries
}

export async function createStash(
  repoPath: string,
  message?: string,
  includeUntracked = false
): Promise<void> {
  const args = ['stash', 'push']
  if (includeUntracked) args.push('--include-untracked')
  if (message) args.push('-m', message)
  await execGitOrThrow(args, { cwd: repoPath })
}

export async function applyStash(repoPath: string, index: number): Promise<{ conflicts: boolean }> {
  const result = await execGit(['stash', 'apply', `stash@{${index}}`], { cwd: repoPath })
  if (result.exitCode === 0) return { conflicts: false }
  if (result.stdout.includes('CONFLICT')) return { conflicts: true }
  throw new Error(result.stderr || result.stdout)
}

export async function popStash(repoPath: string, index: number): Promise<{ conflicts: boolean }> {
  const result = await execGit(['stash', 'pop', `stash@{${index}}`], { cwd: repoPath })
  if (result.exitCode === 0) return { conflicts: false }
  if (result.stdout.includes('CONFLICT')) return { conflicts: true }
  throw new Error(result.stderr || result.stdout)
}

export async function dropStash(repoPath: string, index: number): Promise<void> {
  await execGitOrThrow(['stash', 'drop', `stash@{${index}}`], { cwd: repoPath })
}
