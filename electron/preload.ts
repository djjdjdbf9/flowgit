import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/constants'
import type { AppSettings, FlowGitApi } from '../shared/types/ipc.types'
import type { CreatePRInput } from '../shared/types/provider.types'

// Typed IPC invoker helpers
function invoke<T = any>(channel: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args)
}

function on(channel: string, callback: (...args: unknown[]) => void): () => void {
  const sub = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void => callback(...args)
  ipcRenderer.on(channel, sub)
  return () => ipcRenderer.removeListener(channel, sub)
}

// The typed API surface exposed to the renderer via window.flowgit
const api: FlowGitApi = {
  // App
  getVersion: () => invoke<string>(IPC.APP_VERSION),

  // Window controls
  window: {
    minimize: () => invoke<void>('window:minimize'),
    maximize: () => invoke<void>('window:maximize'),
    close: () => invoke<void>('window:close'),
    isMaximized: () => invoke<boolean>('window:isMaximized'),
  },

  // Dialogs
  openDirectory: (options?: { title?: string }) =>
    invoke<string | null>(IPC.DIALOG_OPEN_DIR, options),

  // Shell
  openPath: (path: string) => invoke<void>(IPC.SHELL_OPEN, path),

  // Git detection
  detectGit: () => invoke(IPC.GIT_DETECT),
  getGitVersion: () => invoke<string | null>(IPC.GIT_VERSION),

  // Repository
  repo: {
    open: (path: string) => invoke(IPC.REPO_OPEN, path),
    init: (path: string) => invoke(IPC.REPO_INIT, path),
    clone: (url: string, targetPath: string, onProgress?: (p: unknown) => void) => {
      if (onProgress) {
        const unsub = on(IPC.REPO_CLONE + ':progress', onProgress)
        return invoke(IPC.REPO_CLONE, url, targetPath).finally(unsub)
      }
      return invoke(IPC.REPO_CLONE, url, targetPath)
    },
    getStatus: (repoPath: string) => invoke(IPC.REPO_STATUS, repoPath),
    list: () => invoke(IPC.REPO_LIST),
    add: (repoPath: string) => invoke(IPC.REPO_ADD, repoPath),
    remove: (repoId: string) => invoke(IPC.REPO_REMOVE, repoId),
    refresh: (repoPath: string) => invoke(IPC.REPO_REFRESH, repoPath),
  },

  // Changes & staging
  changes: {
    get: (repoPath: string) => invoke(IPC.CHANGES_GET, repoPath),
    stage: (repoPath: string, filePath: string) => invoke(IPC.CHANGES_STAGE, repoPath, filePath),
    unstage: (repoPath: string, filePath: string) => invoke(IPC.CHANGES_UNSTAGE, repoPath, filePath),
    stageAll: (repoPath: string) => invoke(IPC.CHANGES_STAGE_ALL, repoPath),
    unstageAll: (repoPath: string) => invoke(IPC.CHANGES_UNSTAGE_ALL, repoPath),
    discard: (repoPath: string, filePath: string) => invoke(IPC.CHANGES_DISCARD, repoPath, filePath),
    discardAll: (repoPath: string) => invoke(IPC.CHANGES_DISCARD_ALL, repoPath),
    stageHunk: (repoPath: string, filePath: string, hunkIndex: number) =>
      invoke(IPC.CHANGES_STAGE_HUNK, repoPath, filePath, hunkIndex),
    unstageHunk: (repoPath: string, filePath: string, hunkIndex: number) =>
      invoke(IPC.CHANGES_UNSTAGE_HUNK, repoPath, filePath, hunkIndex),
  },

  // Commits
  commit: {
    create: (repoPath: string, message: string, options?: { amend?: boolean }) =>
      invoke(IPC.COMMIT_CREATE, repoPath, message, options),
    amend: (repoPath: string, message: string) => invoke(IPC.COMMIT_AMEND, repoPath, message),
    cherryPick: (repoPath: string, hash: string) => invoke(IPC.COMMIT_CHERRY_PICK, repoPath, hash),
    revert: (repoPath: string, hash: string) => invoke(IPC.COMMIT_REVERT, repoPath, hash),
  },

  // Diff
  diff: {
    file: (repoPath: string, filePath: string, options?: { staged?: boolean; ref?: string }) =>
      invoke(IPC.DIFF_FILE, repoPath, filePath, options),
    commit: (repoPath: string, hash: string) => invoke(IPC.DIFF_COMMIT, repoPath, hash),
    commits: (repoPath: string, fromHash: string, toHash: string) =>
      invoke(IPC.DIFF_COMMITS, repoPath, fromHash, toHash),
    branch: (repoPath: string, branchA: string, branchB: string) =>
      invoke(IPC.DIFF_BRANCH, repoPath, branchA, branchB),
  },

  // History
  history: {
    log: (repoPath: string, options?: { skip?: number; limit?: number; ref?: string; author?: string; search?: string }) =>
      invoke(IPC.HISTORY_LOG, repoPath, options),
    graph: (repoPath: string, options?: { limit?: number }) =>
      invoke(IPC.HISTORY_GRAPH, repoPath, options),
    getCommit: (repoPath: string, hash: string) => invoke(IPC.HISTORY_COMMIT, repoPath, hash),
    getCommitFiles: (repoPath: string, hash: string) => invoke(IPC.HISTORY_COMMIT_FILES, repoPath, hash),
  },

  // Branches
  branch: {
    list: (repoPath: string) => invoke(IPC.BRANCH_LIST, repoPath),
    create: (repoPath: string, name: string, from?: string) =>
      invoke(IPC.BRANCH_CREATE, repoPath, name, from),
    rename: (repoPath: string, oldName: string, newName: string) =>
      invoke(IPC.BRANCH_RENAME, repoPath, oldName, newName),
    switch: (repoPath: string, name: string) => invoke(IPC.BRANCH_SWITCH, repoPath, name),
    delete: (repoPath: string, name: string, force?: boolean) =>
      invoke(IPC.BRANCH_DELETE, repoPath, name, force),
    merge: (repoPath: string, source: string, options?: { strategy?: string }) =>
      invoke(IPC.BRANCH_MERGE, repoPath, source, options),
    rebase: (repoPath: string, onto: string) => invoke(IPC.BRANCH_REBASE, repoPath, onto),
  },

  // Tags
  tag: {
    list: (repoPath: string) => invoke(IPC.TAG_LIST, repoPath),
    create: (repoPath: string, name: string, ref: string, message?: string) =>
      invoke(IPC.TAG_CREATE, repoPath, name, ref, message),
    delete: (repoPath: string, name: string) => invoke(IPC.TAG_DELETE, repoPath, name),
    push: (repoPath: string, remote: string, tagName: string) =>
      invoke(IPC.TAG_PUSH, repoPath, remote, tagName),
  },

  // Stash
  stash: {
    list: (repoPath: string) => invoke(IPC.STASH_LIST, repoPath),
    create: (repoPath: string, message?: string, includeUntracked?: boolean) =>
      invoke(IPC.STASH_CREATE, repoPath, message, includeUntracked),
    apply: (repoPath: string, index: number) => invoke(IPC.STASH_APPLY, repoPath, index),
    pop: (repoPath: string, index: number) => invoke(IPC.STASH_POP, repoPath, index),
    drop: (repoPath: string, index: number) => invoke(IPC.STASH_DROP, repoPath, index),
  },

  // Remotes
  remote: {
    list: (repoPath: string) => invoke(IPC.REMOTE_LIST, repoPath),
    add: (repoPath: string, name: string, url: string) => invoke(IPC.REMOTE_ADD, repoPath, name, url),
    remove: (repoPath: string, name: string) => invoke(IPC.REMOTE_REMOVE, repoPath, name),
    fetch: (repoPath: string, remote?: string) => invoke(IPC.REMOTE_FETCH, repoPath, remote),
    pull: (repoPath: string, remote?: string, branch?: string) =>
      invoke(IPC.REMOTE_PULL, repoPath, remote, branch),
    push: (repoPath: string, remote?: string, branch?: string, force?: boolean) =>
      invoke(IPC.REMOTE_PUSH, repoPath, remote, branch, force),
  },

  // Conflicts
  conflict: {
    list: (repoPath: string) => invoke(IPC.CONFLICT_LIST, repoPath),
    markResolved: (repoPath: string, filePath: string) =>
      invoke(IPC.CONFLICT_MARK_RESOLVED, repoPath, filePath),
    continue: (repoPath: string) => invoke(IPC.CONFLICT_CONTINUE, repoPath),
    abort: (repoPath: string) => invoke(IPC.CONFLICT_ABORT, repoPath),
  },

  // Providers
  provider: {
    list: () => invoke(IPC.PROVIDER_LIST),
    connect: (type: string, token: string, baseUrl?: string) =>
      invoke(IPC.PROVIDER_CONNECT, type, token, baseUrl),
    disconnect: (id: string) => invoke(IPC.PROVIDER_DISCONNECT, id),
    getRepos: (accountId: string) => invoke(IPC.PROVIDER_REPOS, accountId),
    getPRs: (repoPath: string, accountId: string) => invoke(IPC.PROVIDER_PRS, repoPath, accountId),
    createPR: (repoPath: string, accountId: string, input: CreatePRInput) =>
      invoke(IPC.PROVIDER_CREATE_PR, repoPath, accountId, input),
  },

  // Settings
  settings: {
    get: () => invoke<AppSettings>(IPC.SETTINGS_GET),
    set: (key: keyof AppSettings, value: unknown) => invoke(IPC.SETTINGS_SET, key, value),
  },

  // Terminal
  terminal: {
    create: (repoPath: string) => invoke<string>(IPC.TERMINAL_CREATE, repoPath),
    sendInput: (id: string, data: string) => ipcRenderer.send(IPC.TERMINAL_INPUT, id, data),
    resize: (id: string, cols: number, rows: number) =>
      ipcRenderer.send(IPC.TERMINAL_RESIZE, id, cols, rows),
    destroy: (id: string) => ipcRenderer.send(IPC.TERMINAL_DESTROY, id),
    onData: (id: string, callback: (data: string) => void) =>
      on(IPC.TERMINAL_DATA + ':' + id, (data) => callback(data as string)),
  },

  // Blame
  blame: {
    file: (repoPath: string, filePath: string, ref?: string) =>
      invoke(IPC.BLAME_FILE, repoPath, filePath, ref),
  },
}

contextBridge.exposeInMainWorld('flowgit', api)
export { api }
