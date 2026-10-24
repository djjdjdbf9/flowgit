// Shared IPC channel constants — used by both main and renderer

export const IPC = {
  // Git detection
  GIT_DETECT: 'git:detect',
  GIT_VERSION: 'git:version',

  // Repository management
  REPO_OPEN: 'repo:open',
  REPO_INIT: 'repo:init',
  REPO_CLONE: 'repo:clone',
  REPO_STATUS: 'repo:status',
  REPO_LIST: 'repo:list',
  REPO_ADD: 'repo:add',
  REPO_REMOVE: 'repo:remove',
  REPO_REFRESH: 'repo:refresh',

  // Changes & staging
  CHANGES_GET: 'changes:get',
  CHANGES_STAGE: 'changes:stage',
  CHANGES_UNSTAGE: 'changes:unstage',
  CHANGES_STAGE_ALL: 'changes:stageAll',
  CHANGES_UNSTAGE_ALL: 'changes:unstageAll',
  CHANGES_DISCARD: 'changes:discard',
  CHANGES_DISCARD_ALL: 'changes:discardAll',
  CHANGES_STAGE_HUNK: 'changes:stageHunk',
  CHANGES_UNSTAGE_HUNK: 'changes:unstageHunk',

  // Commits
  COMMIT_CREATE: 'commit:create',
  COMMIT_AMEND: 'commit:amend',

  // Diff
  DIFF_FILE: 'diff:file',
  DIFF_COMMIT: 'diff:commit',
  DIFF_COMMITS: 'diff:commits',
  DIFF_BRANCH: 'diff:branch',

  // History
  HISTORY_LOG: 'history:log',
  HISTORY_GRAPH: 'history:graph',
  HISTORY_COMMIT: 'history:commit',
  HISTORY_COMMIT_FILES: 'history:commitFiles',

  // Branches
  BRANCH_LIST: 'branch:list',
  BRANCH_CREATE: 'branch:create',
  BRANCH_RENAME: 'branch:rename',
  BRANCH_SWITCH: 'branch:switch',
  BRANCH_DELETE: 'branch:delete',
  BRANCH_MERGE: 'branch:merge',
  BRANCH_REBASE: 'branch:rebase',

  // Tags
  TAG_LIST: 'tag:list',
  TAG_CREATE: 'tag:create',
  TAG_DELETE: 'tag:delete',
  TAG_PUSH: 'tag:push',

  // Stash
  STASH_LIST: 'stash:list',
  STASH_CREATE: 'stash:create',
  STASH_APPLY: 'stash:apply',
  STASH_POP: 'stash:pop',
  STASH_DROP: 'stash:drop',

  // Remote
  REMOTE_LIST: 'remote:list',
  REMOTE_ADD: 'remote:add',
  REMOTE_REMOVE: 'remote:remove',
  REMOTE_FETCH: 'remote:fetch',
  REMOTE_PULL: 'remote:pull',
  REMOTE_PUSH: 'remote:push',

  // Conflict resolution
  CONFLICT_LIST: 'conflict:list',
  CONFLICT_MARK_RESOLVED: 'conflict:markResolved',
  CONFLICT_CONTINUE: 'conflict:continue',
  CONFLICT_ABORT: 'conflict:abort',

  // Cherry-pick / revert
  COMMIT_CHERRY_PICK: 'commit:cherryPick',
  COMMIT_REVERT: 'commit:revert',

  // Providers
  PROVIDER_LIST: 'provider:list',
  PROVIDER_CONNECT: 'provider:connect',
  PROVIDER_DISCONNECT: 'provider:disconnect',
  PROVIDER_REPOS: 'provider:repos',
  PROVIDER_PRS: 'provider:prs',
  PROVIDER_CREATE_PR: 'provider:createPr',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // Terminal
  TERMINAL_CREATE: 'terminal:create',
  TERMINAL_INPUT: 'terminal:input',
  TERMINAL_RESIZE: 'terminal:resize',
  TERMINAL_DESTROY: 'terminal:destroy',
  TERMINAL_DATA: 'terminal:data',

  // Blame
  BLAME_FILE: 'blame:file',

  // Dialog
  DIALOG_OPEN_DIR: 'dialog:openDir',
  DIALOG_SAVE_FILE: 'dialog:saveFile',

  // Shell
  SHELL_OPEN: 'shell:open',

  // App
  APP_VERSION: 'app:version',
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]

export const APP_NAME = 'FlowGit'
export const APP_DATA_DIR = 'FlowGit'
export const DB_FILENAME = 'flowgit.db'
export const SETTINGS_FILENAME = 'settings'
