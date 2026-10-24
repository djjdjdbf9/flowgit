import { execGit, execGitOrThrow } from './executor'
import type { Commit, CommitDetail, CommitFile, GraphData, GraphNode, GraphEdge } from '../../shared/types/git.types'
import { createLogger } from '../logger'

const logger = createLogger('git:history')

const LOG_FORMAT =
  '%H%n%h%n%s%n%b%n%aN%n%aE%n%aI%n%cN%n%cE%n%cI%n%P%n%D%n---COMMIT---'

export interface LogOptions {
  skip?: number
  limit?: number
  ref?: string
  author?: string
  search?: string
  path?: string
}

/**
 * Get commit log.
 */
export async function getLog(repoPath: string, options: LogOptions = {}): Promise<Commit[]> {
  const args = ['log', `--format=${LOG_FORMAT}`, '--no-walk=unsorted']

  if (options.limit) args.push(`-${options.limit}`)
  if (options.skip) args.push(`--skip=${options.skip}`)
  if (options.author) args.push(`--author=${options.author}`)
  if (options.search) args.push(`--grep=${options.search}`, '--regexp-ignore-case')
  if (options.ref) args.push(options.ref)
  else args.push('--all')
  if (options.path) args.push('--', options.path)

  // Remove --no-walk for actual log
  const actualArgs = args.filter(a => a !== '--no-walk=unsorted')
  actualArgs.splice(1, 0, '--all')

  const result = await execGit(
    ['log', `--format=${LOG_FORMAT}`, '--all',
      ...(options.limit ? [`-${options.limit}`] : []),
      ...(options.skip ? [`--skip=${options.skip}`] : []),
      ...(options.author ? [`--author=${options.author}`] : []),
      ...(options.search ? [`--grep=${options.search}`, '--regexp-ignore-case'] : []),
      ...(options.ref ? [options.ref] : []),
      ...(options.path ? ['--', options.path] : []),
    ],
    { cwd: repoPath }
  )

  if (result.exitCode !== 0) return []
  return parseLog(result.stdout)
}

function parseLog(output: string): Commit[] {
  const commits: Commit[] = []
  const entries = output.split('---COMMIT---\n').filter(Boolean)

  for (const entry of entries) {
    const lines = entry.split('\n')
    if (lines.length < 11) continue

    const hash = lines[0].trim()
    const shortHash = lines[1].trim()
    const message = lines[2].trim()
    const body = lines[3].trim()
    const author = lines[4].trim()
    const authorEmail = lines[5].trim()
    const authorDate = lines[6].trim()
    const committer = lines[7].trim()
    const committerEmail = lines[8].trim()
    const committerDate = lines[9].trim()
    const parents = lines[10].trim().split(' ').filter(Boolean)
    const refStr = lines[11]?.trim() ?? ''
    const refs = refStr ? refStr.split(', ').map(r => r.trim()).filter(Boolean) : []

    if (!hash) continue

    commits.push({
      hash,
      shortHash,
      message,
      body,
      author,
      authorEmail,
      authorDate,
      committer,
      committerEmail,
      committerDate,
      parents,
      refs,
      isMerge: parents.length > 1,
    })
  }

  return commits
}

/**
 * Get detailed commit info including file stats.
 */
export async function getCommitDetail(repoPath: string, hash: string): Promise<CommitDetail | null> {
  const [infoResult, filesResult] = await Promise.all([
    execGit(['log', '--format=%H%n%h%n%s%n%b%n%aN%n%aE%n%aI%n%cN%n%cE%n%cI%n%P%n%D', '-1', hash], { cwd: repoPath }),
    execGit(['diff-tree', '--no-commit-id', '-r', '--name-status', '-M', '-C', '--numstat', hash], { cwd: repoPath }),
  ])

  if (infoResult.exitCode !== 0) return null

  const infoLines = infoResult.stdout.split('\n')
  const hash_ = infoLines[0].trim()
  const files = parseCommitFiles(filesResult.stdout)
  const stats = {
    additions: files.reduce((s, f) => s + f.additions, 0),
    deletions: files.reduce((s, f) => s + f.deletions, 0),
    files: files.length,
  }

  return {
    hash: hash_,
    shortHash: infoLines[1].trim(),
    message: infoLines[2].trim(),
    body: infoLines[3].trim(),
    author: infoLines[4].trim(),
    authorEmail: infoLines[5].trim(),
    authorDate: infoLines[6].trim(),
    committer: infoLines[7].trim(),
    committerEmail: infoLines[8].trim(),
    committerDate: infoLines[9].trim(),
    parents: infoLines[10].trim().split(' ').filter(Boolean),
    refs: infoLines[11]?.trim().split(', ').filter(Boolean) ?? [],
    isMerge: infoLines[10].trim().split(' ').filter(Boolean).length > 1,
    files,
    stats,
  }
}

function parseCommitFiles(output: string): CommitFile[] {
  const files: CommitFile[] = []
  const lines = output.trim().split('\n').filter(Boolean)

  for (const line of lines) {
    const parts = line.split('\t')
    if (parts.length < 2) continue

    const stats = parts[0].split('\t')
    // numstat: additions\tdeletions\tpath or additions\tdeletions\t{old => new}
    if (parts.length === 3 && /^\d+/.test(parts[0])) {
      const additions = parseInt(parts[0], 10) || 0
      const deletions = parseInt(parts[1], 10) || 0
      const path = parts[2]
      files.push({ path, status: 'modified', additions, deletions })
    }
  }

  return files
}

// BRANCH COLOR PALETTE — distinct, dark-theme friendly
const BRANCH_COLORS = [
  '#4a9eff', // blue
  '#da5c2c', // ember (FlowGit accent)
  '#50c878', // green
  '#b47aff', // purple
  '#ff9f43', // orange
  '#ff6b9d', // pink
  '#26c6da', // cyan
  '#ffeb3b', // yellow
]

/**
 * Build a graph data structure for the Blueprint-inspired visualization.
 * Uses a topological column-assignment algorithm.
 */
export async function getGraphData(repoPath: string, limit = 500): Promise<GraphData> {
  const result = await execGit(
    ['log', '--all', '--format=%H%n%P%n%s%n%aN%n%aI%n%D', `-${limit}`],
    { cwd: repoPath }
  )

  if (result.exitCode !== 0 || !result.stdout.trim()) {
    return { nodes: [], edges: [], columns: 0, totalRows: 0 }
  }

  // Parse simplified log
  interface RawCommit {
    hash: string
    parents: string[]
    message: string
    author: string
    date: string
    refs: string[]
  }

  const rawCommits: RawCommit[] = []
  const blocks = result.stdout.trim().split('\n\n').filter(Boolean)

  for (const block of blocks) {
    const lines = block.split('\n')
    rawCommits.push({
      hash: lines[0]?.trim() ?? '',
      parents: (lines[1]?.trim() ?? '').split(' ').filter(Boolean),
      message: lines[2]?.trim() ?? '',
      author: lines[3]?.trim() ?? '',
      date: lines[4]?.trim() ?? '',
      refs: (lines[5]?.trim() ?? '').split(', ').filter(Boolean),
    })
  }

  // Also parse with our main log parser for robustness
  const commits = await getLog(repoPath, { limit })
  if (!commits.length) return { nodes: [], edges: [], columns: 0, totalRows: 0 }

  // Get HEAD
  const headResult = await execGit(['rev-parse', 'HEAD'], { cwd: repoPath })
  const headHash = headResult.exitCode === 0 ? headResult.stdout.trim() : null

  // Assign columns using a simple lane algorithm
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const hashToRow = new Map<string, number>()
  const hashToColumn = new Map<string, number>()
  const lanes: (string | null)[] = [] // lane[col] = hash of commit currently occupying that lane

  // Assign branch colors based on refs
  const branchColorMap = new Map<string, string>()
  let colorIndex = 0

  function getBranchColor(branchName: string): string {
    if (!branchColorMap.has(branchName)) {
      branchColorMap.set(branchName, BRANCH_COLORS[colorIndex % BRANCH_COLORS.length])
      colorIndex++
    }
    return branchColorMap.get(branchName)!
  }

  for (let row = 0; row < commits.length; row++) {
    const commit = commits[row]
    hashToRow.set(commit.hash, row)

    // Find which lane this commit is in (if a child already reserved a lane for it)
    let col = hashToColumn.get(commit.hash) ?? -1
    if (col === -1) {
      // Find first empty lane
      col = lanes.findIndex((l) => l === null)
      if (col === -1) col = lanes.length
      lanes[col] = commit.hash
      hashToColumn.set(commit.hash, col)
    }

    // Determine color
    const branchRef = commit.refs.find(r => !r.startsWith('HEAD') && !r.startsWith('tag:'))
    const color = branchRef ? getBranchColor(branchRef) : BRANCH_COLORS[col % BRANCH_COLORS.length]

    nodes.push({
      hash: commit.hash,
      shortHash: commit.shortHash,
      message: commit.message,
      author: commit.author,
      authorDate: commit.authorDate,
      parents: commit.parents,
      children: [],
      refs: commit.refs,
      column: col,
      row,
      color,
      isMerge: commit.isMerge,
      isHead: commit.hash === headHash,
    })

    // Mark lane as free if no parents in this lane
    if (commit.parents.length === 0) {
      lanes[col] = null
    }

    // Assign lanes for parents
    for (let pi = 0; pi < commit.parents.length; pi++) {
      const parent = commit.parents[pi]
      if (!hashToColumn.has(parent)) {
        if (pi === 0) {
          // First parent stays in same lane
          hashToColumn.set(parent, col)
          lanes[col] = parent
        } else {
          // Subsequent parents (merge) get new lane
          const newCol = lanes.findIndex((l) => l === null)
          const mergeCol = newCol === -1 ? lanes.length : newCol
          hashToColumn.set(parent, mergeCol)
          lanes[mergeCol] = parent
        }
      }
    }
  }

  // Build child relationships and edges
  const nodeMap = new Map(nodes.map(n => [n.hash, n]))

  for (const node of nodes) {
    for (const parentHash of node.parents) {
      const parentNode = nodeMap.get(parentHash)
      if (parentNode) {
        parentNode.children.push(node.hash)
      }
      edges.push({
        from: node.hash,
        to: parentHash,
        color: node.color,
        type: node.isMerge && node.parents.indexOf(parentHash) > 0 ? 'merge' : 'parent',
      })
    }
  }

  const maxCol = nodes.reduce((m, n) => Math.max(m, n.column), 0)

  return {
    nodes,
    edges,
    columns: maxCol + 1,
    totalRows: nodes.length,
  }
}
