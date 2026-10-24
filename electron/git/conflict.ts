import { execGit, execGitOrThrow } from './executor'
import type { ConflictFile, BlameEntry } from '../../shared/types/git.types'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { createLogger } from '../logger'

const logger = createLogger('git:conflict')

/** List files with unresolved merge conflicts. */
export async function listConflicts(repoPath: string): Promise<ConflictFile[]> {
  const result = await execGit(['diff', '--name-only', '--diff-filter=U'], { cwd: repoPath })
  if (result.exitCode !== 0 || !result.stdout.trim()) return []

  const conflictFiles: ConflictFile[] = []
  const paths = result.stdout.trim().split('\n').filter(Boolean)

  for (const filePath of paths) {
    try {
      const content = await readFile(join(repoPath, filePath), 'utf8')
      const conflictMarkers = (content.match(/^<<<<<<< /gm) ?? []).length

      // Extract ours and theirs versions
      const oursResult = await execGit(['show', `:2:${filePath}`], { cwd: repoPath })
      const theirsResult = await execGit(['show', `:3:${filePath}`], { cwd: repoPath })

      conflictFiles.push({
        path: filePath,
        ours: oursResult.stdout,
        theirs: theirsResult.stdout,
        conflictCount: conflictMarkers,
      })
    } catch {
      conflictFiles.push({ path: filePath, ours: '', theirs: '', conflictCount: 0 })
    }
  }

  return conflictFiles
}

/** Mark a file as resolved (git add). */
export async function markResolved(repoPath: string, filePath: string): Promise<void> {
  await execGitOrThrow(['add', '--', filePath], { cwd: repoPath })
}

/** Continue a merge/rebase/cherry-pick after resolving conflicts. */
export async function continueOperation(repoPath: string): Promise<void> {
  // Detect operation type
  const mergeHead = await execGit(['rev-parse', '--verify', 'MERGE_HEAD'], { cwd: repoPath })
  if (mergeHead.exitCode === 0) {
    await execGitOrThrow(['commit', '--no-edit'], { cwd: repoPath })
    return
  }

  const rebaseHead = await execGit(['rev-parse', '--verify', 'REBASE_HEAD'], { cwd: repoPath })
  if (rebaseHead.exitCode === 0) {
    await execGitOrThrow(['rebase', '--continue'], {
      cwd: repoPath,
      env: { GIT_EDITOR: 'true' },
    })
    return
  }

  const cherryPickHead = await execGit(['rev-parse', '--verify', 'CHERRY_PICK_HEAD'], { cwd: repoPath })
  if (cherryPickHead.exitCode === 0) {
    await execGitOrThrow(['cherry-pick', '--continue'], { cwd: repoPath })
    return
  }

  throw new Error('No merge, rebase, or cherry-pick in progress')
}

/** Abort a merge/rebase/cherry-pick. */
export async function abortOperation(repoPath: string): Promise<void> {
  const mergeHead = await execGit(['rev-parse', '--verify', 'MERGE_HEAD'], { cwd: repoPath })
  if (mergeHead.exitCode === 0) {
    await execGitOrThrow(['merge', '--abort'], { cwd: repoPath })
    return
  }

  const rebaseHead = await execGit(['rev-parse', '--verify', 'REBASE_HEAD'], { cwd: repoPath })
  if (rebaseHead.exitCode === 0) {
    await execGitOrThrow(['rebase', '--abort'], { cwd: repoPath })
    return
  }

  const cherryPickHead = await execGit(['rev-parse', '--verify', 'CHERRY_PICK_HEAD'], { cwd: repoPath })
  if (cherryPickHead.exitCode === 0) {
    await execGitOrThrow(['cherry-pick', '--abort'], { cwd: repoPath })
    return
  }

  throw new Error('No operation to abort')
}
