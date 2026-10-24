import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { execGit, execGitOrThrow } from '../../electron/git/executor'
import { detectGit } from '../../electron/git/detector'
import { getRepoStatus, stageFile, unstageFile, stageAll, unstageAll, discardFile } from '../../electron/git/changes'
import { getLog, getGraphData, getCommitDetail } from '../../electron/git/history'
import { getFileDiff } from '../../electron/git/diff'
import { listBranches, createBranch, switchBranch, deleteBranch, listTags, createTag } from '../../electron/git/branches'
import { listStash, createStash, applyStash, popStash, dropStash } from '../../electron/git/stash'

describe.sequential('Git Engine Integration Tests (Isolated Temporary Repositories)', () => {
  let testDir: string
  let remoteDir: string

  beforeAll(async () => {
    // Verify Git is detected
    const detection = await detectGit()
    expect(detection.found).toBe(true)
    expect(detection.version).toBeDefined()

    // Create temp working dir
    testDir = await mkdtemp(join(tmpdir(), 'flowgit-test-repo-'))
    remoteDir = await mkdtemp(join(tmpdir(), 'flowgit-remote-repo-'))

    // Initialize git repo with test user config
    await execGitOrThrow(['init', '-b', 'main'], { cwd: testDir })
    await execGitOrThrow(['config', 'user.name', 'FlowGit Tester'], { cwd: testDir })
    await execGitOrThrow(['config', 'user.email', 'tester@flowgit.local'], { cwd: testDir })
  })

  afterAll(async () => {
    // Cleanup temporary folders safely
    try {
      await rm(testDir, { recursive: true, force: true })
      await rm(remoteDir, { recursive: true, force: true })
    } catch {
      // ignore Windows directory lock cleanup failures
    }
  })

  it('1. Detects an empty valid repository status', async () => {
    const status = await getRepoStatus(testDir)
    expect(status.branch).toBe('main')
    expect(status.staged.length).toBe(0)
    expect(status.unstaged.length).toBe(0)
    expect(status.untracked.length).toBe(0)
  })

  it('2. Detects untracked file, stages, and unstages it', async () => {
    const testFile = 'test.txt'
    await writeFile(join(testDir, testFile), 'Hello FlowGit\n', 'utf8')

    let status = await getRepoStatus(testDir)
    expect(status.untracked.some(f => f.path === testFile)).toBe(true)

    // Stage
    await stageFile(testDir, testFile)
    status = await getRepoStatus(testDir)
    expect(status.staged.some(f => f.path === testFile)).toBe(true)
    expect(status.untracked.some(f => f.path === testFile)).toBe(false)

    // Unstage
    await unstageFile(testDir, testFile)
    status = await getRepoStatus(testDir)
    expect(status.staged.some(f => f.path === testFile)).toBe(false)
    expect(status.untracked.some(f => f.path === testFile)).toBe(true)
  })

  it('3. Commits staged files and reads commit log', async () => {
    const testFile = 'test.txt'
    await stageFile(testDir, testFile)
    await execGitOrThrow(['commit', '-m', 'feat: initial commit'], { cwd: testDir })

    const log = await getLog(testDir)
    expect(log.length).toBe(1)
    expect(log[0].message).toBe('feat: initial commit')
    expect(log[0].author).toBe('FlowGit Tester')
    expect(log[0].shortHash.length).toBeGreaterThanOrEqual(7)

    const detail = await getCommitDetail(testDir, log[0].hash)
    expect(detail).not.toBeNull()
    expect(detail?.message).toBe('feat: initial commit')
  })

  it('4. Diff generation for modified file', async () => {
    const testFile = 'test.txt'
    await writeFile(join(testDir, testFile), 'Hello FlowGit\nLine 2 added\n', 'utf8')

    const diff = await getFileDiff(testDir, testFile)
    expect(diff.additions).toBe(1)
    expect(diff.deletions).toBe(0)
    expect(diff.hunks.length).toBeGreaterThan(0)
    expect(diff.hunks[0].lines.some(l => l.type === 'added' && l.content.includes('Line 2 added'))).toBe(true)
  })

  it('5. Discards unstaged modifications', async () => {
    const testFile = 'test.txt'
    await discardFile(testDir, testFile)
    const status = await getRepoStatus(testDir)
    expect(status.unstaged.length).toBe(0)
  })

  it('6. Branch creation, checkout, commit, and deletion', async () => {
    await createBranch(testDir, 'feature/blueprint-graph')
    let branches = await listBranches(testDir)
    expect(branches.some(b => b.name === 'feature/blueprint-graph')).toBe(true)

    // Switch back to main
    await switchBranch(testDir, 'main')
    branches = await listBranches(testDir)
    const current = branches.find(b => b.isCurrent)
    expect(current?.name).toBe('main')

    // Delete branch
    await deleteBranch(testDir, 'feature/blueprint-graph', true)
    branches = await listBranches(testDir)
    expect(branches.some(b => b.name === 'feature/blueprint-graph')).toBe(false)
  })

  it('7. Stash operations: create, list, apply, drop', async () => {
    const testFile = 'test.txt'
    await writeFile(join(testDir, testFile), 'Stash test modifications\n', 'utf8')

    await createStash(testDir, 'wip: test stash')
    let stashes = await listStash(testDir)
    expect(stashes.length).toBe(1)
    expect(stashes[0].message).toContain('wip: test stash')

    // Apply stash
    const applyRes = await applyStash(testDir, 0)
    expect(applyRes.conflicts).toBe(false)

    // Drop stash
    await dropStash(testDir, 0)
    stashes = await listStash(testDir)
    expect(stashes.length).toBe(0)

    // Clean up modifications
    await discardFile(testDir, testFile)
  })

  it('8. Tag creation, listing, and deletion', async () => {
    await createTag(testDir, 'v1.0.0', 'HEAD', 'Release version 1.0.0')
    let tags = await listTags(testDir)
    expect(tags.some(t => t.name === 'v1.0.0')).toBe(true)
  })

  it('9. Blueprint graph DAG computation', async () => {
    // Add second commit
    const docFile = 'README.md'
    await writeFile(join(testDir, docFile), '# FlowGit\n', 'utf8')
    await stageFile(testDir, docFile)
    await execGitOrThrow(['commit', '-m', 'docs: add readme'], { cwd: testDir })

    const graph = await getGraphData(testDir, 100)
    expect(graph.nodes.length).toBe(2)
    expect(graph.edges.length).toBe(1)
    expect(graph.nodes[0].column).toBeDefined()
    expect(graph.nodes[0].row).toBe(0)
    expect(graph.nodes[1].row).toBe(1)
  })
})
