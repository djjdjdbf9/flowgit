import React, { useState, useEffect, useCallback } from 'react'
import { useUiStore } from '../../../store/ui.store'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import Tag from '../../../components/Tag'
import Spinner from '../../../components/Spinner'
import type { Branch, Tag as GitTag, Remote } from '@shared/types/git.types'

export interface BranchesViewProps {
  repoPath: string
}

export const BranchesView: React.FC<BranchesViewProps> = ({ repoPath }) => {
  const { showToast, openConfirmModal } = useUiStore()

  const [branches, setBranches] = useState<Branch[]>([])
  const [tags, setTags] = useState<GitTag[]>([])
  const [remotes, setRemotes] = useState<Remote[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // New Branch modal
  const [newBranchModal, setNewBranchModal] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [fromRef, setFromRef] = useState('')

  // Rename modal
  const [renameBranchModal, setRenameBranchModal] = useState<Branch | null>(null)
  const [renamedName, setRenamedName] = useState('')

  // New Tag modal
  const [newTagModal, setNewTagModal] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [tagRef, setTagRef] = useState('')
  const [tagMessage, setTagMessage] = useState('')

  const loadData = useCallback(async () => {
    if (!repoPath) return
    setLoading(true)
    try {
      const [branchRes, tagRes, remoteRes] = await Promise.all([
        window.flowgit.branch.list(repoPath),
        window.flowgit.tag.list(repoPath),
        window.flowgit.remote.list(repoPath),
      ])

      if (branchRes.success && branchRes.data) {
        setBranches(branchRes.data as Branch[])
      }
      if (tagRes.success && tagRes.data) {
        setTags(tagRes.data as GitTag[])
      }
      if (remoteRes.success && remoteRes.data) {
        setRemotes(remoteRes.data as Remote[])
      }
    } catch (e: unknown) {
      showToast({
        type: 'error',
        title: 'Error loading branches',
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoading(false)
    }
  }, [repoPath, showToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Branch operations
  const handleSwitchBranch = async (b: Branch) => {
    if (b.isCurrent) return
    try {
      const res = await window.flowgit.branch.switch(repoPath, b.name)
      if (res.success) {
        showToast({ type: 'success', title: `Switched to branch "${b.name}"` })
        loadData()
      } else {
        showToast({ type: 'error', title: 'Checkout failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleMergeBranch = (b: Branch) => {
    openConfirmModal({
      title: 'Merge Branch',
      message: `Merge "${b.name}" into current branch?`,
      confirmText: 'Merge',
      onConfirm: async () => {
        try {
          const res = await window.flowgit.branch.merge(repoPath, b.name)
          if (res.success) {
            showToast({ type: 'success', title: `Merged "${b.name}" successfully` })
            loadData()
          } else {
            showToast({ type: 'error', title: 'Merge failed', message: res.error })
          }
        } catch (e: unknown) {
          showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
        }
      },
    })
  }

  const handleRebaseBranch = (b: Branch) => {
    openConfirmModal({
      title: 'Rebase Onto Branch',
      message: `Rebase current branch onto "${b.name}"?`,
      confirmText: 'Rebase',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const res = await window.flowgit.branch.rebase(repoPath, b.name)
          if (res.success) {
            showToast({ type: 'success', title: `Rebased onto "${b.name}"` })
            loadData()
          } else {
            showToast({ type: 'error', title: 'Rebase failed', message: res.error })
          }
        } catch (e: unknown) {
          showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
        }
      },
    })
  }

  const handleDeleteBranch = (b: Branch) => {
    openConfirmModal({
      title: 'Delete Branch',
      message: `Are you sure you want to delete branch "${b.name}"?`,
      confirmText: 'Delete Branch',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const res = await window.flowgit.branch.delete(repoPath, b.name, true)
          if (res.success) {
            showToast({ type: 'info', title: `Deleted branch "${b.name}"` })
            loadData()
          } else {
            showToast({ type: 'error', title: 'Delete failed', message: res.error })
          }
        } catch (e: unknown) {
          showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
        }
      },
    })
  }

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return
    try {
      const res = await window.flowgit.branch.create(
        repoPath,
        newBranchName.trim(),
        fromRef.trim() || undefined
      )
      if (res.success) {
        showToast({ type: 'success', title: `Created branch "${newBranchName.trim()}"` })
        setNewBranchModal(false)
        setNewBranchName('')
        setFromRef('')
        loadData()
      } else {
        showToast({ type: 'error', title: 'Failed to create branch', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleRenameBranch = async () => {
    if (!renameBranchModal || !renamedName.trim()) return
    try {
      const res = await window.flowgit.branch.rename(
        repoPath,
        renameBranchModal.name,
        renamedName.trim()
      )
      if (res.success) {
        showToast({ type: 'success', title: `Renamed to "${renamedName.trim()}"` })
        setRenameBranchModal(null)
        setRenamedName('')
        loadData()
      } else {
        showToast({ type: 'error', title: 'Rename failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  // Tag operations
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    try {
      const res = await window.flowgit.tag.create(
        repoPath,
        newTagName.trim(),
        tagRef.trim() || 'HEAD',
        tagMessage.trim() || undefined
      )
      if (res.success) {
        showToast({ type: 'success', title: `Created tag "${newTagName.trim()}"` })
        setNewTagModal(false)
        setNewTagName('')
        setTagRef('')
        setTagMessage('')
        loadData()
      } else {
        showToast({ type: 'error', title: 'Failed to create tag', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleDeleteTag = (tagName: string) => {
    openConfirmModal({
      title: 'Delete Tag',
      message: `Delete tag "${tagName}"?`,
      confirmText: 'Delete Tag',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const res = await window.flowgit.tag.delete(repoPath, tagName)
          if (res.success) {
            showToast({ type: 'info', title: `Deleted tag "${tagName}"` })
            loadData()
          } else {
            showToast({ type: 'error', title: 'Delete tag failed', message: res.error })
          }
        } catch (e: unknown) {
          showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
        }
      },
    })
  }

  const handlePushTag = async (tagName: string) => {
    const remote = remotes.length > 0 ? remotes[0].name : 'origin'
    try {
      const res = await window.flowgit.tag.push(repoPath, remote, tagName)
      if (res.success) {
        showToast({ type: 'success', title: `Pushed tag "${tagName}" to ${remote}` })
      } else {
        showToast({ type: 'error', title: 'Push tag failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const localBranches = branches.filter((b) => !b.isRemote)
  const remoteBranches = branches.filter((b) => b.isRemote)

  const filterText = search.toLowerCase()
  const filteredLocal = localBranches.filter((b) => b.name.toLowerCase().includes(filterText))
  const filteredRemote = remoteBranches.filter((b) => b.name.toLowerCase().includes(filterText))
  const filteredTags = tags.filter((t) => t.name.toLowerCase().includes(filterText))

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: '#000000',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          padding: '12px 20px',
          background: '#141414',
          borderBottom: '1px solid #202020',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#eeeeee', letterSpacing: '0.04em' }}>
            BRANCHES & TAGS
          </span>
          <Input
            placeholder="Filter branches & tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: '12px', padding: '4px 10px', width: '220px' }}
          />
          {loading && <Spinner size="sm" />}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={() => setNewTagModal(true)}>
            + New Tag
          </Button>
          <Button variant="primary" size="sm" onClick={() => setNewBranchModal(true)} showArrow>
            + New Branch
          </Button>
        </div>
      </div>

      {/* Main Content Area: 3 Columns / Sections */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Local Branches (40%) */}
        <div
          style={{
            flex: 2,
            borderRight: '1px solid #202020',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={colHeaderStyle}>LOCAL BRANCHES ({filteredLocal.length})</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredLocal.map((b) => {
              const isCurrent = b.isCurrent
              return (
                <div
                  key={b.name}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid #1a1a1a',
                    borderLeft: isCurrent ? '2px solid #da5c2c' : '2px solid transparent',
                    background: isCurrent ? '#191919' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          color: isCurrent ? '#da5c2c' : '#eeeeee',
                          fontWeight: isCurrent ? 700 : 400,
                          fontSize: '13px',
                        }}
                      >
                        {b.name}
                      </span>
                      {isCurrent && <Tag label="CURRENT" variant="head" size="sm" />}
                      {(b.ahead > 0 || b.behind > 0) && (
                        <span style={{ fontSize: '11px', color: '#b4b4b4' }}>
                          {b.ahead > 0 && <span style={{ color: '#4caf50' }}>↑{b.ahead} </span>}
                          {b.behind > 0 && <span style={{ color: '#ef5350' }}>↓{b.behind}</span>}
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#606060', fontSize: '11px', marginTop: '2px' }}>
                      {b.headMessage || b.headCommit?.substring(0, 7)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {!isCurrent && (
                      <button
                        onClick={() => handleSwitchBranch(b)}
                        style={branchActionBtn}
                        title="Checkout branch"
                      >
                        Checkout
                      </button>
                    )}
                    {!isCurrent && (
                      <button
                        onClick={() => handleMergeBranch(b)}
                        style={branchActionBtn}
                        title="Merge into current"
                      >
                        Merge
                      </button>
                    )}
                    {!isCurrent && (
                      <button
                        onClick={() => handleRebaseBranch(b)}
                        style={branchActionBtn}
                        title="Rebase onto this"
                      >
                        Rebase
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setRenameBranchModal(b)
                        setRenamedName(b.name)
                      }}
                      style={branchActionBtn}
                      title="Rename branch"
                    >
                      Rename
                    </button>
                    {!isCurrent && (
                      <button
                        onClick={() => handleDeleteBranch(b)}
                        style={{ ...branchActionBtn, color: '#ef5350' }}
                        title="Delete branch"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Remote Branches (30%) */}
        <div
          style={{
            flex: 1.5,
            borderRight: '1px solid #202020',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={colHeaderStyle}>REMOTE BRANCHES ({filteredRemote.length})</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredRemote.map((b) => (
              <div
                key={b.fullName || b.name}
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid #1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: '#b4b4b4', fontSize: '12px', fontWeight: 400 }}>
                    {b.name}
                  </div>
                  <div style={{ color: '#505050', fontSize: '10px', marginTop: '2px' }}>
                    {b.headCommit?.substring(0, 7)}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const localName = b.name.replace(/^origin\//, '').replace(/^remotes\/[^/]+\//, '')
                    setNewBranchModal(true)
                    setNewBranchName(localName)
                    setFromRef(b.name)
                  }}
                  style={branchActionBtn}
                  title="Checkout as local branch"
                >
                  Checkout
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tags Section (30%) */}
        <div
          style={{
            flex: 1.5,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={colHeaderStyle}>TAGS ({filteredTags.length})</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredTags.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#606060', fontSize: '12px' }}>
                No tags created yet.
              </div>
            )}
            {filteredTags.map((t) => (
              <div
                key={t.name}
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid #1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag label={t.name} variant="tag" size="sm" />
                    <span style={{ color: '#606060', fontSize: '11px' }}>{t.hash?.substring(0, 7)}</span>
                  </div>
                  {t.message && (
                    <div style={{ color: '#7e7e7e', fontSize: '11px', marginTop: '2px' }}>
                      {t.message}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => handlePushTag(t.name)} style={branchActionBtn} title="Push tag">
                    Push
                  </button>
                  <button
                    onClick={() => handleDeleteTag(t.name)}
                    style={{ ...branchActionBtn, color: '#ef5350' }}
                    title="Delete tag"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Branch Modal */}
      {newBranchModal && (
        <div style={modalBackdropStyle} onClick={() => setNewBranchModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalTitleStyle}>Create New Branch</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input
                label="BRANCH NAME"
                placeholder="feature/your-branch"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                autoFocus
              />
              <Input
                label="FROM REF (BRANCH OR COMMIT, LEAVE BLANK FOR HEAD)"
                placeholder="HEAD, main, or hash"
                value={fromRef}
                onChange={(e) => setFromRef(e.target.value)}
              />
            </div>
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

      {/* Rename Branch Modal */}
      {renameBranchModal && (
        <div style={modalBackdropStyle} onClick={() => setRenameBranchModal(null)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalTitleStyle}>Rename Branch "{renameBranchModal.name}"</div>
            <Input
              label="NEW BRANCH NAME"
              value={renamedName}
              onChange={(e) => setRenamedName(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button variant="ghost" size="sm" onClick={() => setRenameBranchModal(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleRenameBranch} showArrow>
                Rename
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Tag Modal */}
      {newTagModal && (
        <div style={modalBackdropStyle} onClick={() => setNewTagModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalTitleStyle}>Create New Tag</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input
                label="TAG NAME"
                placeholder="v1.0.0"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                autoFocus
              />
              <Input
                label="TARGET REF (COMMIT OR BRANCH, DEFAULT: HEAD)"
                placeholder="HEAD"
                value={tagRef}
                onChange={(e) => setTagRef(e.target.value)}
              />
              <Input
                label="ANNOTATION MESSAGE (OPTIONAL)"
                placeholder="Release 1.0.0"
                value={tagMessage}
                onChange={(e) => setTagMessage(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button variant="ghost" size="sm" onClick={() => setNewTagModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateTag} showArrow>
                Create Tag
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const colHeaderStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: '#161616',
  fontSize: '11px',
  fontWeight: 700,
  color: '#7e7e7e',
  borderBottom: '1px solid #202020',
  letterSpacing: '0.04em',
}

const branchActionBtn: React.CSSProperties = {
  background: '#191919',
  border: '1px solid #2a2a2a',
  borderRadius: '2px',
  color: '#b4b4b4',
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: '11px',
  padding: '3px 8px',
  cursor: 'pointer',
}

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
}

const modalBoxStyle: React.CSSProperties = {
  background: '#191919',
  border: '1px solid #202020',
  borderRadius: '2px',
  padding: '24px',
  width: '400px',
  fontFamily: 'var(--font-mono, monospace)',
}

const modalTitleStyle: React.CSSProperties = {
  color: '#eeeeee',
  fontSize: '15px',
  fontWeight: 700,
  marginBottom: '16px',
}

export default BranchesView
