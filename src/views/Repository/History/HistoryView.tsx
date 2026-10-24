import React, { useState, useEffect, useCallback } from 'react'
import { useRepoStore } from '../../../store/repo.store'
import { useUiStore } from '../../../store/ui.store'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import Tag from '../../../components/Tag'
import Spinner from '../../../components/Spinner'
import DiffViewer from '../../../components/DiffViewer'
import FileStatusIcon from '../../../components/FileStatusIcon'
import type { Commit, CommitDetail, CommitFile, FileDiff } from '@shared/types/git.types'

export interface HistoryViewProps {
  repoPath: string
}

export const HistoryView: React.FC<HistoryViewProps> = ({ repoPath }) => {
  const { showToast, openConfirmModal } = useUiStore()

  const [commits, setCommits] = useState<Commit[]>([])
  const [selectedHash, setSelectedHash] = useState<string | null>(null)
  const [commitDetail, setCommitDetail] = useState<CommitDetail | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingLog, setLoadingLog] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Selected file diff inside commit
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileDiff, setFileDiff] = useState<FileDiff | null>(null)
  const [loadingDiff, setLoadingDiff] = useState(false)

  // Branch creation modal state
  const [newBranchModal, setNewBranchModal] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')

  const fetchLog = useCallback(async () => {
    if (!repoPath) return
    setLoadingLog(true)
    try {
      const res = await window.flowgit.history.log(repoPath, {
        limit: 200,
        search: searchQuery.trim() || undefined,
      })
      if (res.success && res.data) {
        const list = res.data as Commit[]
        setCommits(list)
        if (list.length > 0 && !selectedHash) {
          setSelectedHash(list[0].hash)
        }
      }
    } catch (e: unknown) {
      showToast({
        type: 'error',
        title: 'Failed to fetch history',
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoadingLog(false)
    }
  }, [repoPath, searchQuery, selectedHash, showToast])

  useEffect(() => {
    fetchLog()
  }, [fetchLog])

  // Fetch commit details when selectedHash changes
  useEffect(() => {
    if (!selectedHash || !repoPath) {
      setCommitDetail(null)
      return
    }

    let isMounted = true
    setLoadingDetail(true)
    setSelectedFile(null)
    setFileDiff(null)

    window.flowgit.history
      .getCommit(repoPath, selectedHash)
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) {
          setCommitDetail(res.data as CommitDetail)
        } else {
          setCommitDetail(null)
        }
      })
      .catch((e: unknown) => {
        if (!isMounted) return
        showToast({
          type: 'error',
          title: 'Error loading commit details',
          message: e instanceof Error ? e.message : String(e),
        })
      })
      .finally(() => {
        if (isMounted) setLoadingDetail(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedHash, repoPath, showToast])

  // Fetch diff when selectedFile in commitDetail changes
  useEffect(() => {
    if (!selectedFile || !selectedHash || !repoPath) {
      setFileDiff(null)
      return
    }

    let isMounted = true
    setLoadingDiff(true)

    window.flowgit.diff
      .file(repoPath, selectedFile, { ref: selectedHash })
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) {
          setFileDiff(res.data as FileDiff)
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        showToast({
          type: 'error',
          title: 'Error loading file diff',
          message: err instanceof Error ? err.message : String(err),
        })
      })
      .finally(() => {
        if (isMounted) setLoadingDiff(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedFile, selectedHash, repoPath, showToast])

  // Actions
  const handleCherryPick = () => {
    if (!selectedHash) return
    openConfirmModal({
      title: 'Cherry-pick Commit',
      message: `Apply commit ${selectedHash.substring(0, 7)} onto current HEAD?`,
      confirmText: 'Cherry-pick',
      onConfirm: async () => {
        try {
          const res = await window.flowgit.commit.cherryPick(repoPath, selectedHash)
          if (res.success) {
            showToast({ type: 'success', title: 'Cherry-pick complete' })
            fetchLog()
          } else {
            showToast({ type: 'error', title: 'Cherry-pick failed', message: res.error })
          }
        } catch (e: unknown) {
          showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
        }
      },
    })
  }

  const handleRevert = () => {
    if (!selectedHash) return
    openConfirmModal({
      title: 'Revert Commit',
      message: `Create a reverting commit for ${selectedHash.substring(0, 7)}?`,
      confirmText: 'Revert',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const res = await window.flowgit.commit.revert(repoPath, selectedHash)
          if (res.success) {
            showToast({ type: 'success', title: 'Commit reverted' })
            fetchLog()
          } else {
            showToast({ type: 'error', title: 'Revert failed', message: res.error })
          }
        } catch (e: unknown) {
          showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
        }
      },
    })
  }

  const handleCheckoutCommit = () => {
    if (!selectedHash) return
    openConfirmModal({
      title: 'Checkout Commit (Detached HEAD)',
      message: `Switch HEAD to commit ${selectedHash.substring(0, 7)}? Your repository will enter a detached HEAD state.`,
      confirmText: 'Checkout',
      onConfirm: async () => {
        try {
          const res = await window.flowgit.branch.switch(repoPath, selectedHash)
          if (res.success) {
            showToast({ type: 'info', title: 'Switched to commit', message: selectedHash.substring(0, 7) })
            fetchLog()
          } else {
            showToast({ type: 'error', title: 'Checkout failed', message: res.error })
          }
        } catch (e: unknown) {
          showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
        }
      },
    })
  }

  const handleCreateBranch = async () => {
    if (!selectedHash || !newBranchName.trim()) return
    try {
      const res = await window.flowgit.branch.create(repoPath, newBranchName.trim(), selectedHash)
      if (res.success) {
        showToast({ type: 'success', title: 'Branch created', message: newBranchName })
        setNewBranchModal(false)
        setNewBranchName('')
        fetchLog()
      } else {
        showToast({ type: 'error', title: 'Failed to create branch', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: '#000000',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      {/* ── Left: Commit List Panel ── */}
      <div
        style={{
          width: '500px',
          background: '#111111',
          borderRight: '1px solid #202020',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {/* Search header */}
        <div
          style={{
            padding: '10px 14px',
            background: '#141414',
            borderBottom: '1px solid #202020',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <Input
            placeholder="Search commits by message, author, hash…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: '12px', padding: '6px 10px' }}
          />
          {loadingLog && <Spinner size="sm" />}
        </div>

        {/* Scrollable Commit Rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {commits.length === 0 && !loadingLog && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#606060', fontSize: '13px' }}>
              No commits found.
            </div>
          )}

          {commits.map((c) => {
            const isSelected = selectedHash === c.hash
            return (
              <div
                key={c.hash}
                onClick={() => setSelectedHash(c.hash)}
                style={{
                  padding: '10px 14px',
                  background: isSelected ? '#191919' : 'transparent',
                  borderLeft: isSelected ? '2px solid #da5c2c' : '2px solid transparent',
                  borderBottom: '1px solid #1a1a1a',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'background-color 0.08s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#141414'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent'
                }}
              >
                {/* Row 1: Hash + Message + Refs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      color: '#da5c2c',
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {c.shortHash}
                  </span>
                  <span
                    style={{
                      color: '#eeeeee',
                      fontSize: '13px',
                      fontWeight: isSelected ? 700 : 400,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={c.message}
                  >
                    {c.message}
                  </span>

                  {/* Branch/tag badges */}
                  {c.refs && c.refs.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      {c.refs.map((ref, idx) => (
                        <Tag key={idx} label={ref} size="sm" variant={ref.includes('tag:') ? 'tag' : 'branch'} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Row 2: Author + Date */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                  }}
                >
                  <span style={{ color: '#b4b4b4' }}>{c.author}</span>
                  <span style={{ color: '#606060' }}>{c.authorDate}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Right: Commit Detail & Diff Panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {loadingDetail ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner size="md" label="Loading commit details…" />
          </div>
        ) : commitDetail ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Commit Header & Actions Strip */}
            <div
              style={{
                padding: '16px 20px',
                background: '#141414',
                borderBottom: '1px solid #202020',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#eeeeee', fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>
                    {commitDetail.message}
                  </div>
                  {commitDetail.body && (
                    <div
                      style={{
                        color: '#b4b4b4',
                        fontSize: '12px',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        marginBottom: '8px',
                      }}
                    >
                      {commitDetail.body}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
                    <span style={{ color: '#7e7e7e' }}>
                      Author: <span style={{ color: '#eeeeee' }}>{commitDetail.author}</span> &lt;{commitDetail.authorEmail}&gt;
                    </span>
                    <span style={{ color: '#606060' }}>{commitDetail.authorDate}</span>
                  </div>
                </div>

                {/* Commit Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <Button variant="ghost" size="sm" onClick={() => setNewBranchModal(true)}>
                    + Branch
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCherryPick}>
                    Cherry-pick
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleRevert}>
                    Revert
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleCheckoutCommit}>
                    Checkout
                  </Button>
                </div>
              </div>

              {/* Hash and Parents */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  fontSize: '11px',
                  color: '#606060',
                  paddingTop: '6px',
                  borderTop: '1px solid #1e1e1e',
                }}
              >
                <span>
                  Commit:{' '}
                  <span
                    onClick={() => {
                      navigator.clipboard.writeText(commitDetail.hash)
                      showToast({ type: 'info', title: 'Hash copied to clipboard' })
                    }}
                    style={{ color: '#da5c2c', cursor: 'pointer', textDecoration: 'underline' }}
                    title="Click to copy full SHA"
                  >
                    {commitDetail.hash}
                  </span>
                </span>
                {commitDetail.parents && commitDetail.parents.length > 0 && (
                  <span>
                    Parents:{' '}
                    {commitDetail.parents.map((p) => (
                      <span
                        key={p}
                        onClick={() => setSelectedHash(p)}
                        style={{ color: '#61afef', cursor: 'pointer', marginRight: '6px' }}
                      >
                        {p.substring(0, 7)}
                      </span>
                    ))}
                  </span>
                )}
                <span style={{ marginLeft: 'auto' }}>
                  {commitDetail.stats?.files ?? commitDetail.files?.length ?? 0} files changed (
                  <span style={{ color: '#4caf50' }}>+{commitDetail.stats?.additions ?? 0}</span>,{' '}
                  <span style={{ color: '#ef5350' }}>-{commitDetail.stats?.deletions ?? 0}</span>)
                </span>
              </div>
            </div>

            {/* Changed files + Diff split */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Changed files list (240px) */}
              <div
                style={{
                  width: '240px',
                  background: '#111111',
                  borderRight: '1px solid #202020',
                  display: 'flex',
                  flexDirection: 'column',
                  flexShrink: 0,
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    color: '#7e7e7e',
                    borderBottom: '1px solid #202020',
                    letterSpacing: '0.04em',
                  }}
                >
                  CHANGED FILES ({commitDetail.files?.length ?? 0})
                </div>
                {commitDetail.files?.map((f: CommitFile) => {
                  const isFileSelected = selectedFile === f.path
                  return (
                    <div
                      key={f.path}
                      onClick={() => setSelectedFile(f.path)}
                      style={{
                        padding: '6px 12px',
                        background: isFileSelected ? '#191919' : 'transparent',
                        borderLeft: isFileSelected ? '2px solid #da5c2c' : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        fontSize: '12px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isFileSelected) e.currentTarget.style.background = '#141414'
                      }}
                      onMouseLeave={(e) => {
                        if (!isFileSelected) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <FileStatusIcon status={f.status} />
                        <span
                          style={{
                            color: isFileSelected ? '#eeeeee' : '#b4b4b4',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={f.path}
                        >
                          {f.path}
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', display: 'inline-flex', gap: '4px', flexShrink: 0 }}>
                        {f.additions > 0 && <span style={{ color: '#4caf50' }}>+{f.additions}</span>}
                        {f.deletions > 0 && <span style={{ color: '#ef5350' }}>-{f.deletions}</span>}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Diff Viewer for selected file */}
              <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
                <DiffViewer
                  diff={fileDiff}
                  filePath={selectedFile ?? undefined}
                  isLoading={loadingDiff}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#606060',
              fontSize: '13px',
            }}
          >
            Select a commit to view details
          </div>
        )}
      </div>

      {/* New Branch Modal */}
      {newBranchModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setNewBranchModal(false)}
        >
          <div
            style={{
              background: '#191919',
              border: '1px solid #202020',
              borderRadius: '2px',
              padding: '20px',
              width: '380px',
              fontFamily: 'var(--font-mono, monospace)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: '#eeeeee', fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
              Create Branch from {selectedHash?.substring(0, 7)}
            </div>
            <Input
              label="BRANCH NAME"
              placeholder="feature/branch-name"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button variant="ghost" size="sm" onClick={() => setNewBranchModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateBranch} showArrow>
                Create Branch
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryView
