import { execGit, execGitOrThrow } from './executor'
import { createLogger } from '../logger'

const logger = createLogger('git:remote')

export interface PushOptions {
  force?: boolean
  forceWithLease?: boolean
  setUpstream?: boolean
}

/** Fetch from remote(s). */
export async function fetchRemote(repoPath: string, remote?: string): Promise<void> {
  const args = ['fetch', '--prune']
  if (remote) args.push(remote)
  else args.push('--all')
  await execGitOrThrow(args, { cwd: repoPath, timeout: 60_000 })
}

/** Pull from remote. */
export async function pullRemote(
  repoPath: string,
  remote?: string,
  branch?: string
): Promise<{ success: boolean; conflicts: boolean }> {
  const args = ['pull']
  if (remote) args.push(remote)
  if (branch) args.push(branch)

  const result = await execGit(args, { cwd: repoPath, timeout: 60_000 })
  if (result.exitCode === 0) return { success: true, conflicts: false }
  if (result.stdout.includes('CONFLICT') || result.stderr.includes('conflict')) {
    return { success: false, conflicts: true }
  }
  throw new Error(classifyError(result.stderr || result.stdout))
}

/** Push to remote. */
export async function pushRemote(
  repoPath: string,
  remote = 'origin',
  branch?: string,
  options: PushOptions = {}
): Promise<void> {
  const args = ['push']

  if (options.forceWithLease) {
    args.push('--force-with-lease')
  } else if (options.force) {
    args.push('--force')
  }

  if (options.setUpstream) {
    args.push('--set-upstream')
  }

  args.push(remote)
  if (branch) args.push(branch)

  const result = await execGit(args, { cwd: repoPath, timeout: 60_000 })
  if (result.exitCode !== 0) {
    throw new Error(classifyError(result.stderr || result.stdout))
  }
}

/** Classify network errors into user-friendly messages. */
function classifyError(output: string): string {
  const lower = output.toLowerCase()
  if (lower.includes('authentication failed') || lower.includes('could not read username')) {
    return 'Authentication failed. Check your credentials in settings.'
  }
  if (lower.includes('permission denied') || lower.includes('403')) {
    return 'Permission denied. You may not have access to this repository.'
  }
  if (lower.includes('could not resolve host') || lower.includes('network is unreachable')) {
    return 'Network error. Check your internet connection.'
  }
  if (lower.includes('rejected') && lower.includes('non-fast-forward')) {
    return 'Push rejected: remote contains work you do not have locally. Pull first.'
  }
  if (lower.includes('remote: repository not found') || lower.includes('not found')) {
    return 'Repository not found on remote. Check the remote URL.'
  }
  return output
}
