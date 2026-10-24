// IPC contract types — typed request/response pairs for every channel

import type {
  GitDetectionResult,
  RepoStatus,
  ChangedFile,
  Commit,
  CommitDetail,
  CommitFile,
  Branch,
  Tag,
  Remote,
  StashEntry,
  FileDiff,
  GraphData,
  ConflictFile,
  BlameEntry,
  Repository,
} from './git.types'
import type { ProviderAccount, ProviderRepo, PullRequest, CreatePRInput } from './provider.types'

// Generic IPC result wrapper
export interface IpcResult<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

// App settings shape
export interface AppSettings {
  gitPath: string | null        // null = auto-detect
  theme: 'dark'                 // only dark for now
  diffLayout: 'split' | 'unified'
  preferredEditor: string | null
  preferredTerminal: string | null
  autoFetch: boolean
  autoFetchInterval: number     // minutes
  pullStrategy: 'merge' | 'rebase' | 'ff-only'
  showHiddenFiles: boolean
  confirmDestructive: boolean
}

// Clone progress
export interface CloneProgress {
  phase: string
  percent: number
  receivedObjects: number
  totalObjects: number
}

// Operation progress (fetch/pull/push)
export interface OperationProgress {
  operation: 'fetch' | 'pull' | 'push'
  phase: string
  percent: number
  message: string
}

// The complete, strongly typed API surface exposed to the renderer via window.flowgit
export interface FlowGitApi {
  getVersion: () => Promise<string>
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
  }
  openDirectory: (options?: { title?: string }) => Promise<string | null>
  openPath: (path: string) => Promise<void>
  detectGit: () => Promise<GitDetectionResult>
  getGitVersion: () => Promise<string | null>
  repo: {
    open: (path: string) => Promise<IpcResult<Repository>>
    init: (path: string) => Promise<IpcResult<Repository>>
    clone: (url: string, targetPath: string, onProgress?: (p: unknown) => void) => Promise<IpcResult<Repository>>
    getStatus: (repoPath: string) => Promise<IpcResult<RepoStatus>>
    list: () => Promise<IpcResult<Repository[]>>
    add: (repoPath: string) => Promise<IpcResult<Repository>>
    remove: (repoId: string) => Promise<IpcResult<null>>
    refresh: (repoPath: string) => Promise<IpcResult<RepoStatus>>
  }
  changes: {
    get: (repoPath: string) => Promise<IpcResult<RepoStatus>>
    stage: (repoPath: string, filePath: string) => Promise<IpcResult<null>>
    unstage: (repoPath: string, filePath: string) => Promise<IpcResult<null>>
    stageAll: (repoPath: string) => Promise<IpcResult<null>>
    unstageAll: (repoPath: string) => Promise<IpcResult<null>>
    discard: (repoPath: string, filePath: string) => Promise<IpcResult<null>>
    discardAll: (repoPath: string) => Promise<IpcResult<null>>
    stageHunk: (repoPath: string, filePath: string, hunkIndex: number) => Promise<IpcResult<null>>
    unstageHunk: (repoPath: string, filePath: string, hunkIndex: number) => Promise<IpcResult<null>>
  }
  commit: {
    create: (repoPath: string, message: string, options?: { amend?: boolean }) => Promise<IpcResult<null>>
    amend: (repoPath: string, message: string) => Promise<IpcResult<null>>
    cherryPick: (repoPath: string, hash: string) => Promise<IpcResult<{ conflicts: boolean }>>
    revert: (repoPath: string, hash: string) => Promise<IpcResult<null>>
  }
  diff: {
    file: (repoPath: string, filePath: string, options?: { staged?: boolean; ref?: string }) => Promise<IpcResult<FileDiff>>
    commit: (repoPath: string, hash: string) => Promise<IpcResult<FileDiff[]>>
    commits: (repoPath: string, fromHash: string, toHash: string) => Promise<IpcResult<FileDiff[]>>
    branch: (repoPath: string, branchA: string, branchB: string) => Promise<IpcResult<FileDiff[]>>
  }
  history: {
    log: (repoPath: string, options?: { skip?: number; limit?: number; ref?: string; author?: string; search?: string }) => Promise<IpcResult<Commit[]>>
    graph: (repoPath: string, options?: { limit?: number }) => Promise<IpcResult<GraphData>>
    getCommit: (repoPath: string, hash: string) => Promise<IpcResult<CommitDetail>>
    getCommitFiles: (repoPath: string, hash: string) => Promise<IpcResult<CommitFile[]>>
  }
  branch: {
    list: (repoPath: string) => Promise<IpcResult<Branch[]>>
    create: (repoPath: string, name: string, from?: string) => Promise<IpcResult<null>>
    rename: (repoPath: string, oldName: string, newName: string) => Promise<IpcResult<null>>
    switch: (repoPath: string, name: string) => Promise<IpcResult<null>>
    delete: (repoPath: string, name: string, force?: boolean) => Promise<IpcResult<null>>
    merge: (repoPath: string, source: string, options?: { strategy?: string }) => Promise<IpcResult<{ success: boolean; conflicts: boolean }>>
    rebase: (repoPath: string, onto: string) => Promise<IpcResult<{ success: boolean; conflicts: boolean }>>
  }
  tag: {
    list: (repoPath: string) => Promise<IpcResult<Tag[]>>
    create: (repoPath: string, name: string, ref: string, message?: string) => Promise<IpcResult<null>>
    delete: (repoPath: string, name: string) => Promise<IpcResult<null>>
    push: (repoPath: string, remote: string, tagName: string) => Promise<IpcResult<null>>
  }
  stash: {
    list: (repoPath: string) => Promise<IpcResult<StashEntry[]>>
    create: (repoPath: string, message?: string, includeUntracked?: boolean) => Promise<IpcResult<null>>
    apply: (repoPath: string, index: number) => Promise<IpcResult<{ conflicts: boolean }>>
    pop: (repoPath: string, index: number) => Promise<IpcResult<{ conflicts: boolean }>>
    drop: (repoPath: string, index: number) => Promise<IpcResult<null>>
  }
  remote: {
    list: (repoPath: string) => Promise<IpcResult<Remote[]>>
    add: (repoPath: string, name: string, url: string) => Promise<IpcResult<null>>
    remove: (repoPath: string, name: string) => Promise<IpcResult<null>>
    fetch: (repoPath: string, remote?: string) => Promise<IpcResult<null>>
    pull: (repoPath: string, remote?: string, branch?: string) => Promise<IpcResult<{ success: boolean; conflicts: boolean }>>
    push: (repoPath: string, remote?: string, branch?: string, force?: boolean) => Promise<IpcResult<null>>
  }
  conflict: {
    list: (repoPath: string) => Promise<IpcResult<ConflictFile[]>>
    markResolved: (repoPath: string, filePath: string) => Promise<IpcResult<null>>
    continue: (repoPath: string) => Promise<IpcResult<null>>
    abort: (repoPath: string) => Promise<IpcResult<null>>
  }
  provider: {
    list: () => Promise<IpcResult<ProviderAccount[]>>
    connect: (type: string, token: string, baseUrl?: string) => Promise<IpcResult<never>>
    disconnect: (id: string) => Promise<IpcResult<null>>
    getRepos: (accountId: string) => Promise<IpcResult<ProviderRepo[]>>
    getPRs: (repoPath: string, accountId: string) => Promise<IpcResult<PullRequest[]>>
    createPR: (repoPath: string, accountId: string, input: CreatePRInput) => Promise<IpcResult<never>>
  }
  settings: {
    get: () => Promise<AppSettings>
    set: (key: keyof AppSettings, value: unknown) => Promise<{ success: boolean; error?: string }>
  }
  terminal: {
    create: (repoPath: string) => Promise<string>
    sendInput: (id: string, data: string) => void
    resize: (id: string, cols: number, rows: number) => void
    destroy: (id: string) => void
    onData: (id: string, callback: (data: string) => void) => () => void
  }
  blame: {
    file: (repoPath: string, filePath: string, ref?: string) => Promise<IpcResult<BlameEntry[]>>
  }
}
