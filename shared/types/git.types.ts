// Shared Git types — used by both main process and renderer

export interface GitDetectionResult {
  found: boolean
  path: string | null
  version: string | null
  error?: string
}

export type FileStatus =
  | 'added'
  | 'modified'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'untracked'
  | 'conflicted'
  | 'ignored'

export interface ChangedFile {
  path: string
  originalPath?: string // for renames
  status: FileStatus
  staged: boolean
  unstaged: boolean
  // x = index status, y = working tree status (raw git codes)
  indexStatus: string
  workingStatus: string
}

export interface RepoStatus {
  branch: string | null
  detachedHead: boolean
  headCommit: string | null
  ahead: number
  behind: number
  staged: ChangedFile[]
  unstaged: ChangedFile[]
  untracked: ChangedFile[]
  conflicted: ChangedFile[]
  mergeInProgress: boolean
  rebaseInProgress: boolean
  cherryPickInProgress: boolean
  revertInProgress: boolean
}

export interface Commit {
  hash: string
  shortHash: string
  message: string
  body: string
  author: string
  authorEmail: string
  authorDate: string
  committer: string
  committerEmail: string
  committerDate: string
  parents: string[]
  refs: string[] // branch/tag refs pointing to this commit
  isMerge: boolean
}

export interface Branch {
  name: string
  fullName: string
  isRemote: boolean
  isCurrent: boolean
  upstream?: string
  ahead: number
  behind: number
  headCommit: string
  headMessage: string
}

export interface Tag {
  name: string
  hash: string
  tagHash?: string
  message?: string
  isAnnotated: boolean
  date: string
  taggerName?: string
  taggerEmail?: string
}

export interface Remote {
  name: string
  fetchUrl: string
  pushUrl: string
}

export interface StashEntry {
  index: number
  hash: string
  message: string
  branch: string
  date: string
}

export interface DiffHunk {
  header: string
  oldStart: number
  oldCount: number
  newStart: number
  newCount: number
  lines: DiffLine[]
}

export interface DiffLine {
  type: 'context' | 'added' | 'removed' | 'no-newline'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

export interface FileDiff {
  oldPath: string
  newPath: string
  status: FileStatus
  hunks: DiffHunk[]
  isBinary: boolean
  isLarge: boolean
  additions: number
  deletions: number
}

export interface CommitDetail extends Commit {
  files: CommitFile[]
  stats: { additions: number; deletions: number; files: number }
}

export interface CommitFile {
  path: string
  oldPath?: string
  status: FileStatus
  additions: number
  deletions: number
}

// Graph node for Blueprint-inspired visualization
export interface GraphNode {
  hash: string
  shortHash: string
  message: string
  author: string
  authorDate: string
  parents: string[]
  children: string[]
  refs: string[]
  column: number // layout column
  row: number    // layout row
  color: string  // branch color
  isMerge: boolean
  isHead: boolean
}

export interface GraphEdge {
  from: string
  to: string
  color: string
  type: 'parent' | 'merge'
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  columns: number
  totalRows: number
}

export interface ConflictFile {
  path: string
  ours: string
  theirs: string
  base?: string
  conflictCount: number
}

export interface BlameEntry {
  hash: string
  shortHash: string
  author: string
  authorEmail: string
  date: string
  message: string
  lineNumber: number
  lineContent: string
}

export interface Repository {
  id: string
  path: string
  name: string
  lastOpened: string
  isPinned: boolean
  remotes: Remote[]
  currentBranch: string | null
  isValid: boolean
}
