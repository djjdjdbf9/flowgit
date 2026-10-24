import { execGit, execGitOrThrow } from './executor'
import type { Branch, Tag, Remote } from '../../shared/types/git.types'
import { createLogger } from '../logger'

const logger = createLogger('git:branches')

/**
 * List all branches (local + remote) with tracking info.
 */
export async function listBranches(repoPath: string): Promise<Branch[]> {
  const result = await execGit(
    ['branch', '-a', '--format=%(refname:short)%09%(HEAD)%09%(upstream:short)%09%(upstream:track)%09%(objectname:short)%09%(subject)'],
    { cwd: repoPath }
  )
  if (result.exitCode !== 0) return []

  const branches: Branch[] = []
  const lines = result.stdout.trim().split('\n').filter(Boolean)

  for (const line of lines) {
    const parts = line.split('\t')
    if (parts.length < 5) continue

    const [fullName, headMarker, upstream, trackInfo, shortHash, ...messageParts] = parts
    const message = messageParts ? messageParts.join('\t') : ''
    const isCurrent = headMarker === '*'
    const isRemote = fullName.startsWith('remotes/')
    const name = isRemote ? fullName.replace(/^remotes\//, '') : fullName

    const aheadMatch = (trackInfo ?? '').match(/ahead (\d+)/)
    const behindMatch = (trackInfo ?? '').match(/behind (\d+)/)
    const ahead = aheadMatch ? parseInt(aheadMatch[1], 10) : 0
    const behind = behindMatch ? parseInt(behindMatch[1], 10) : 0

    branches.push({
      name,
      fullName,
      isRemote,
      isCurrent: isCurrent && !isRemote,
      upstream: upstream || undefined,
      ahead,
      behind,
      headCommit: shortHash ?? '',
      headMessage: message ?? '',
    })
  }

  return branches
}

/** Create a branch. */
export async function createBranch(repoPath: string, name: string, from?: string): Promise<void> {
  const args = ['checkout', '-b', name]
  if (from) args.push(from)
  await execGitOrThrow(args, { cwd: repoPath })
}

/** Rename a branch. */
export async function renameBranch(repoPath: string, oldName: string, newName: string): Promise<void> {
  await execGitOrThrow(['branch', '-m', oldName, newName], { cwd: repoPath })
}

/** Switch branches. */
export async function switchBranch(repoPath: string, name: string): Promise<void> {
  // Try new git switch first, fallback to checkout
  const result = await execGit(['switch', name], { cwd: repoPath })
  if (result.exitCode !== 0) {
    await execGitOrThrow(['checkout', name], { cwd: repoPath })
  }
}

/** Delete a branch. */
export async function deleteBranch(repoPath: string, name: string, force = false): Promise<void> {
  const flag = force ? '-D' : '-d'
  await execGitOrThrow(['branch', flag, name], { cwd: repoPath })
}

/** Merge a branch into the current branch. */
export async function mergeBranch(
  repoPath: string,
  source: string,
  options: { strategy?: string; noFF?: boolean } = {}
): Promise<{ success: boolean; conflicts: boolean }> {
  const args = ['merge']
  if (options.noFF) args.push('--no-ff')
  if (options.strategy) args.push(`--strategy=${options.strategy}`)
  args.push(source)

  const result = await execGit(args, { cwd: repoPath })
  if (result.exitCode === 0) return { success: true, conflicts: false }

  // Check for conflicts
  if (result.stdout.includes('CONFLICT') || result.stderr.includes('conflict')) {
    return { success: false, conflicts: true }
  }

  throw new Error(result.stderr || result.stdout)
}

/** Rebase current branch onto another. */
export async function rebaseBranch(repoPath: string, onto: string): Promise<{ success: boolean; conflicts: boolean }> {
  const result = await execGit(['rebase', onto], { cwd: repoPath })
  if (result.exitCode === 0) return { success: true, conflicts: false }
  if (result.stdout.includes('CONFLICT') || result.stderr.includes('conflict')) {
    return { success: false, conflicts: true }
  }
  throw new Error(result.stderr || result.stdout)
}

/** List tags. */
export async function listTags(repoPath: string): Promise<Tag[]> {
  const result = await execGit(
    ['tag', '-l', '--sort=-creatordate', '--format=%(refname:short)%09%(objectname:short)%09%(*objectname:short)%09%(subject)%09%(creatordate:iso)%09%(taggername)%09%(taggeremail)'],
    { cwd: repoPath }
  )
  if (result.exitCode !== 0) return []

  return result.stdout.trim().split('\n').filter(Boolean).map((line) => {
    const parts = line.split('\t')
    const isAnnotated = Boolean(parts[2])
    return {
      name: parts[0],
      hash: parts[2] || parts[1],
      tagHash: parts[2] ? parts[1] : undefined,
      message: parts[3],
      isAnnotated,
      date: parts[4],
      taggerName: parts[5] || undefined,
      taggerEmail: parts[6] || undefined,
    }
  })
}

/** Create a tag. */
export async function createTag(
  repoPath: string,
  name: string,
  ref: string,
  message?: string
): Promise<void> {
  if (message) {
    await execGitOrThrow(['tag', '-a', name, ref, '-m', message], { cwd: repoPath })
  } else {
    await execGitOrThrow(['tag', name, ref], { cwd: repoPath })
  }
}

/** Delete a tag. */
export async function deleteTag(repoPath: string, name: string): Promise<void> {
  await execGitOrThrow(['tag', '-d', name], { cwd: repoPath })
}

/** Push a tag to a remote. */
export async function pushTag(repoPath: string, remote: string, tagName: string): Promise<void> {
  await execGitOrThrow(['push', remote, `refs/tags/${tagName}`], { cwd: repoPath })
}

/** List remotes. */
export async function listRemotes(repoPath: string): Promise<Remote[]> {
  const result = await execGit(['remote', '-v'], { cwd: repoPath })
  if (result.exitCode !== 0) return []

  const remotes = new Map<string, Remote>()
  for (const line of result.stdout.trim().split('\n').filter(Boolean)) {
    const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)$/)
    if (!match) continue
    const [, name, url, type] = match
    if (!remotes.has(name)) remotes.set(name, { name, fetchUrl: '', pushUrl: '' })
    const r = remotes.get(name)!
    if (type === 'fetch') r.fetchUrl = url
    else r.pushUrl = url
  }

  return Array.from(remotes.values())
}

/** Add a remote. */
export async function addRemote(repoPath: string, name: string, url: string): Promise<void> {
  await execGitOrThrow(['remote', 'add', name, url], { cwd: repoPath })
}

/** Remove a remote. */
export async function removeRemote(repoPath: string, name: string): Promise<void> {
  await execGitOrThrow(['remote', 'remove', name], { cwd: repoPath })
}
