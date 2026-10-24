import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants'
import { execGit, execGitOrThrow } from '../git/executor'
import { getRepoStatus, stageFile, unstageFile, stageAll, unstageAll, discardFile, discardAll, applyPatch } from '../git/changes'
import { getLog, getGraphData, getCommitDetail } from '../git/history'
import { getFileDiff, getCommitDiff, getCommitsDiff, getBranchDiff } from '../git/diff'
import { listBranches, createBranch, renameBranch, switchBranch, deleteBranch, mergeBranch, rebaseBranch, listTags, createTag, deleteTag, pushTag, listRemotes, addRemote, removeRemote } from '../git/branches'
import { listStash, createStash, applyStash, popStash, dropStash } from '../git/stash'
import { fetchRemote, pullRemote, pushRemote } from '../git/remote'
import { listConflicts, markResolved, continueOperation, abortOperation } from '../git/conflict'
import { blameFile } from '../git/blame'
import { upsertRepository, getAllRepositories, getRepository, removeRepository } from '../persistence/database'
import { statSync, existsSync } from 'fs'
import { basename, resolve as resolvePath } from 'path'
import { randomUUID } from 'crypto'
import { createLogger } from '../logger'
import type { IpcResult } from '../../shared/types/ipc.types'

const logger = createLogger('ipc:repo')

function ok<T>(data: T): IpcResult<T> {
  return { success: true, data }
}

function err(error: string, code?: string): IpcResult<never> {
  return { success: false, error, code }
}

async function isValidGitRepo(path: string): Promise<boolean> {
  try {
    const result = await execGit(['rev-parse', '--git-dir'], { cwd: path, timeout: 5000 })
    return result.exitCode === 0
  } catch {
    return false
  }
}

export function registerRepoIpc(): void {
  // ——— Repository management ———

  ipcMain.handle(IPC.REPO_LIST, () => {
    return ok(getAllRepositories())
  })

  ipcMain.handle(IPC.REPO_OPEN, async (_, path: string) => {
    try {
      if (!existsSync(path)) return err(`Path does not exist: ${path}`)
      const isRepo = await isValidGitRepo(path)
      if (!isRepo) return err(`Not a Git repository: ${path}`)

      const id = randomUUID()
      const statusResult = await getRepoStatus(path)

      const repo = {
        id,
        path,
        name: basename(path),
        lastOpened: new Date().toISOString(),
        isPinned: false,
        currentBranch: statusResult.branch,
        isValid: true,
      }

      upsertRepository(repo)
      return ok({ ...repo, remotes: [] })
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.REPO_INIT, async (_, path: string) => {
    try {
      await execGitOrThrow(['init', path])
      const id = randomUUID()
      const repo = {
        id,
        path: resolvePath(path),
        name: basename(path),
        lastOpened: new Date().toISOString(),
        isPinned: false,
        currentBranch: 'main',
        isValid: true,
      }
      upsertRepository(repo)
      return ok({ ...repo, remotes: [] })
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.REPO_CLONE, async (_, url: string, targetPath: string) => {
    try {
      await execGitOrThrow(['clone', url, targetPath], { timeout: 300_000 })
      const repoPath = resolvePath(targetPath)
      const id = randomUUID()
      const statusResult = await getRepoStatus(repoPath)
      const repo = {
        id,
        path: repoPath,
        name: basename(repoPath),
        lastOpened: new Date().toISOString(),
        isPinned: false,
        currentBranch: statusResult.branch,
        isValid: true,
      }
      upsertRepository(repo)
      return ok({ ...repo, remotes: [] })
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.REPO_STATUS, async (_, repoPath: string) => {
    try {
      const status = await getRepoStatus(repoPath)
      return ok(status)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.REPO_ADD, async (_, repoPath: string) => {
    try {
      if (!existsSync(repoPath)) return err('Path does not exist')
      const isRepo = await isValidGitRepo(repoPath)
      if (!isRepo) return err('Not a Git repository')

      const existing = getAllRepositories().find(r => r.path === repoPath)
      if (existing) return ok(existing)

      const id = randomUUID()
      const statusResult = await getRepoStatus(repoPath)
      const repo = {
        id,
        path: repoPath,
        name: basename(repoPath),
        lastOpened: new Date().toISOString(),
        isPinned: false,
        currentBranch: statusResult.branch,
        isValid: true,
      }
      upsertRepository(repo)
      return ok({ ...repo, remotes: [] })
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.REPO_REMOVE, async (_, id: string) => {
    try {
      removeRepository(id)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.REPO_REFRESH, async (_, repoPath: string) => {
    try {
      const status = await getRepoStatus(repoPath)
      return ok(status)
    } catch (e: any) {
      return err(e.message)
    }
  })

  // ——— Changes & Staging ———

  ipcMain.handle(IPC.CHANGES_GET, async (_, repoPath: string) => {
    try {
      const status = await getRepoStatus(repoPath)
      return ok(status)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.CHANGES_STAGE, async (_, repoPath: string, filePath: string) => {
    try {
      await stageFile(repoPath, filePath)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.CHANGES_UNSTAGE, async (_, repoPath: string, filePath: string) => {
    try {
      await unstageFile(repoPath, filePath)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.CHANGES_STAGE_ALL, async (_, repoPath: string) => {
    try {
      await stageAll(repoPath)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.CHANGES_UNSTAGE_ALL, async (_, repoPath: string) => {
    try {
      await unstageAll(repoPath)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.CHANGES_DISCARD, async (_, repoPath: string, filePath: string) => {
    try {
      await discardFile(repoPath, filePath)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.CHANGES_DISCARD_ALL, async (_, repoPath: string) => {
    try {
      await discardAll(repoPath)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  // ——— Commits ———

  ipcMain.handle(IPC.COMMIT_CREATE, async (_, repoPath: string, message: string, options?: { amend?: boolean }) => {
    try {
      if (!message.trim()) return err('Commit message cannot be empty')
      const args = ['commit', '-m', message]
      if (options?.amend) args.push('--amend')
      await execGitOrThrow(args, { cwd: repoPath })
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.COMMIT_AMEND, async (_, repoPath: string, message: string) => {
    try {
      await execGitOrThrow(['commit', '--amend', '-m', message], { cwd: repoPath })
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.COMMIT_CHERRY_PICK, async (_, repoPath: string, hash: string) => {
    try {
      const result = await execGit(['cherry-pick', hash], { cwd: repoPath })
      if (result.exitCode === 0) return ok({ conflicts: false })
      if (result.stdout.includes('CONFLICT')) return ok({ conflicts: true })
      return err(result.stderr)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.COMMIT_REVERT, async (_, repoPath: string, hash: string) => {
    try {
      await execGitOrThrow(['revert', hash, '--no-edit'], { cwd: repoPath })
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  // ——— Diff ———

  ipcMain.handle(IPC.DIFF_FILE, async (_, repoPath: string, filePath: string, options?: { staged?: boolean; ref?: string }) => {
    try {
      const diff = await getFileDiff(repoPath, filePath, options)
      return ok(diff)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.DIFF_COMMIT, async (_, repoPath: string, hash: string) => {
    try {
      const diffs = await getCommitDiff(repoPath, hash)
      return ok(diffs)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.DIFF_COMMITS, async (_, repoPath: string, fromHash: string, toHash: string) => {
    try {
      const diffs = await getCommitsDiff(repoPath, fromHash, toHash)
      return ok(diffs)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.DIFF_BRANCH, async (_, repoPath: string, branchA: string, branchB: string) => {
    try {
      const diffs = await getBranchDiff(repoPath, branchA, branchB)
      return ok(diffs)
    } catch (e: any) {
      return err(e.message)
    }
  })

  // ——— History ———

  ipcMain.handle(IPC.HISTORY_LOG, async (_, repoPath: string, options?: object) => {
    try {
      const commits = await getLog(repoPath, options ?? {})
      return ok(commits)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.HISTORY_GRAPH, async (_, repoPath: string, options?: { limit?: number }) => {
    try {
      const graph = await getGraphData(repoPath, options?.limit ?? 500)
      return ok(graph)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.HISTORY_COMMIT, async (_, repoPath: string, hash: string) => {
    try {
      const commit = await getCommitDetail(repoPath, hash)
      if (!commit) return err(`Commit not found: ${hash}`)
      return ok(commit)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.HISTORY_COMMIT_FILES, async (_, repoPath: string, hash: string) => {
    try {
      const commit = await getCommitDetail(repoPath, hash)
      return ok(commit?.files ?? [])
    } catch (e: any) {
      return err(e.message)
    }
  })

  // ——— Branches ———

  ipcMain.handle(IPC.BRANCH_LIST, async (_, repoPath: string) => {
    try {
      const branches = await listBranches(repoPath)
      return ok(branches)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.BRANCH_CREATE, async (_, repoPath: string, name: string, from?: string) => {
    try {
      await createBranch(repoPath, name, from)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.BRANCH_RENAME, async (_, repoPath: string, oldName: string, newName: string) => {
    try {
      await renameBranch(repoPath, oldName, newName)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.BRANCH_SWITCH, async (_, repoPath: string, name: string) => {
    try {
      await switchBranch(repoPath, name)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.BRANCH_DELETE, async (_, repoPath: string, name: string, force?: boolean) => {
    try {
      await deleteBranch(repoPath, name, force)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.BRANCH_MERGE, async (_, repoPath: string, source: string, options?: object) => {
    try {
      const result = await mergeBranch(repoPath, source, options ?? {})
      return ok(result)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.BRANCH_REBASE, async (_, repoPath: string, onto: string) => {
    try {
      const result = await rebaseBranch(repoPath, onto)
      return ok(result)
    } catch (e: any) {
      return err(e.message)
    }
  })

  // ——— Tags ———

  ipcMain.handle(IPC.TAG_LIST, async (_, repoPath: string) => {
    try {
      const tags = await listTags(repoPath)
      return ok(tags)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.TAG_CREATE, async (_, repoPath: string, name: string, ref: string, message?: string) => {
    try {
      await createTag(repoPath, name, ref, message)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.TAG_DELETE, async (_, repoPath: string, name: string) => {
    try {
      await deleteTag(repoPath, name)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.TAG_PUSH, async (_, repoPath: string, remote: string, tagName: string) => {
    try {
      await pushTag(repoPath, remote, tagName)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  // ——— Stash ———

  ipcMain.handle(IPC.STASH_LIST, async (_, repoPath: string) => {
    try {
      const stashes = await listStash(repoPath)
      return ok(stashes)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.STASH_CREATE, async (_, repoPath: string, message?: string, includeUntracked?: boolean) => {
    try {
      await createStash(repoPath, message, includeUntracked)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.STASH_APPLY, async (_, repoPath: string, index: number) => {
    try {
      const result = await applyStash(repoPath, index)
      return ok(result)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.STASH_POP, async (_, repoPath: string, index: number) => {
    try {
      const result = await popStash(repoPath, index)
      return ok(result)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.STASH_DROP, async (_, repoPath: string, index: number) => {
    try {
      await dropStash(repoPath, index)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  // ——— Remotes ———

  ipcMain.handle(IPC.REMOTE_LIST, async (_, repoPath: string) => {
    try {
      const remotes = await listRemotes(repoPath)
      return ok(remotes)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.REMOTE_ADD, async (_, repoPath: string, name: string, url: string) => {
    try {
      await addRemote(repoPath, name, url)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.REMOTE_REMOVE, async (_, repoPath: string, name: string) => {
    try {
      await removeRemote(repoPath, name)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.REMOTE_FETCH, async (_, repoPath: string, remote?: string) => {
    try {
      await fetchRemote(repoPath, remote)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.REMOTE_PULL, async (_, repoPath: string, remote?: string, branch?: string) => {
    try {
      const result = await pullRemote(repoPath, remote, branch)
      return ok(result)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.REMOTE_PUSH, async (_, repoPath: string, remote?: string, branch?: string, force?: boolean) => {
    try {
      await pushRemote(repoPath, remote, branch, { forceWithLease: force })
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  // ——— Conflicts ———

  ipcMain.handle(IPC.CONFLICT_LIST, async (_, repoPath: string) => {
    try {
      const conflicts = await listConflicts(repoPath)
      return ok(conflicts)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.CONFLICT_MARK_RESOLVED, async (_, repoPath: string, filePath: string) => {
    try {
      await markResolved(repoPath, filePath)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.CONFLICT_CONTINUE, async (_, repoPath: string) => {
    try {
      await continueOperation(repoPath)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  ipcMain.handle(IPC.CONFLICT_ABORT, async (_, repoPath: string) => {
    try {
      await abortOperation(repoPath)
      return ok(null)
    } catch (e: any) {
      return err(e.message)
    }
  })

  // ——— Blame ———

  ipcMain.handle(IPC.BLAME_FILE, async (_, repoPath: string, filePath: string, ref?: string) => {
    try {
      const blame = await blameFile(repoPath, filePath, ref)
      return ok(blame)
    } catch (e: any) {
      return err(e.message)
    }
  })
}
