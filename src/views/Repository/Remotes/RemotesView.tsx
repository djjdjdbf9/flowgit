import React, { useState, useEffect, useCallback } from 'react'
import { useRepoStore } from '../../../store/repo.store'
import { useUiStore } from '../../../store/ui.store'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import Spinner from '../../../components/Spinner'
import Tag from '../../../components/Tag'
import type { Remote, RepoStatus } from '@shared/types/git.types'

export interface RemotesViewProps {
  repoPath: string
}

export const RemotesView: React.FC<RemotesViewProps> = ({ repoPath }) => {
  const { status, setStatus } = useRepoStore()
  const { showToast, openConfirmModal } = useUiStore()

  const [remotes, setRemotes] = useState<Remote[]>([])
  const [loading, setLoading] = useState(false)
  const [activeOp, setActiveOp] = useState<string | null>(null)

  // Add Remote modal
  const [addModal, setAddModal] = useState(false)
  const [newRemoteName, setNewRemoteName] = useState('')
  const [newRemoteUrl, setNewRemoteUrl] = useState('')

  const loadRemotes = useCallback(async () => {
    if (!repoPath) return
    setLoading(true)
    try {
      const [remoteRes, statusRes] = await Promise.all([
        window.flowgit.remote.list(repoPath),
        window.flowgit.repo.getStatus(repoPath),
      ])

      if (remoteRes.success && remoteRes.data) {
        setRemotes(remoteRes.data as Remote[])
      } else {
        showToast({ type: 'error', title: 'Cannot load remotes', message: remoteRes.error })
      }

      if (statusRes.success && statusRes.data) {
        setStatus(statusRes.data as RepoStatus)
      }
    } catch (e: unknown) {
      showToast({
        type: 'error',
        title: 'Error loading remotes',
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoading(false)
    }
  }, [repoPath, setStatus, showToast])

  useEffect(() => {
    loadRemotes()
  }, [loadRemotes])

  // Remote operations
  const handleFetch = async (remoteName?: string) => {
    const opKey = `fetch-${remoteName ?? 'all'}`
    setActiveOp(opKey)
    try {
      const res = await window.flowgit.remote.fetch(repoPath, remoteName)
      if (res.success) {
        showToast({ type: 'success', title: `Fetch completed (${remoteName ?? 'all remotes'})` })
        loadRemotes()
      } else {
        showToast({ type: 'error', title: 'Fetch failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Fetch error', message: e instanceof Error ? e.message : String(e) })
    } finally {
      setActiveOp(null)
    }
  }

  const handlePull = async (remoteName?: string) => {
    const opKey = `pull-${remoteName ?? 'current'}`
    setActiveOp(opKey)
    try {
      const res = await window.flowgit.remote.pull(repoPath, remoteName)
      if (res.success) {
        showToast({ type: 'success', title: 'Pull completed successfully' })
        loadRemotes()
      } else {
        showToast({ type: 'error', title: 'Pull failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Pull error', message: e instanceof Error ? e.message : String(e) })
    } finally {
      setActiveOp(null)
    }
  }

  const handlePush = async (remoteName?: string) => {
    const opKey = `push-${remoteName ?? 'current'}`
    setActiveOp(opKey)
    try {
      const res = await window.flowgit.remote.push(repoPath, remoteName)
      if (res.success) {
        showToast({ type: 'success', title: 'Push completed successfully' })
        loadRemotes()
      } else {
        showToast({ type: 'error', title: 'Push failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Push error', message: e instanceof Error ? e.message : String(e) })
    } finally {
      setActiveOp(null)
    }
  }

  const handleAddRemote = async () => {
    if (!newRemoteName.trim() || !newRemoteUrl.trim()) {
      showToast({ type: 'warning', title: 'Missing Fields', message: 'Name and URL are required.' })
      return
    }

    try {
      const res = await window.flowgit.remote.add(repoPath, newRemoteName.trim(), newRemoteUrl.trim())
      if (res.success) {
        showToast({ type: 'success', title: `Added remote "${newRemoteName.trim()}"` })
        setAddModal(false)
        setNewRemoteName('')
        setNewRemoteUrl('')
        loadRemotes()
      } else {
        showToast({ type: 'error', title: 'Failed to add remote', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleRemoveRemote = (remote: Remote) => {
    openConfirmModal({
      title: 'Remove Remote',
      message: `Are you sure you want to remove remote "${remote.name}"? Tracking branches associated with this remote will be affected.`,
      confirmText: 'Remove Remote',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const res = await window.flowgit.remote.remove(repoPath, remote.name)
          if (res.success) {
            showToast({ type: 'info', title: `Removed remote "${remote.name}"` })
            loadRemotes()
          } else {
            showToast({ type: 'error', title: 'Remove remote failed', message: res.error })
          }
        } catch (e: unknown) {
          showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
        }
      },
    })
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#eeeeee', letterSpacing: '0.04em' }}>
            REMOTES & TRACKING
          </span>
          {loading && <Spinner size="sm" />}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFetch()}
            loading={activeOp === 'fetch-all'}
          >
            Fetch All
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddModal(true)}
            showArrow
          >
            + Add Remote
          </Button>
        </div>
      </div>

      {/* Tracking info strip for current branch */}
      {status?.branch && (
        <div
          style={{
            padding: '10px 20px',
            background: '#161616',
            borderBottom: '1px solid #202020',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#7e7e7e', fontSize: '12px' }}>Current Branch Tracking:</span>
            <Tag label={status.branch} variant="branch" size="sm" />
            <span style={{ fontSize: '12px', display: 'inline-flex', gap: '8px' }}>
              <span style={{ color: status.ahead > 0 ? '#4caf50' : '#606060' }}>
                ↑ {status.ahead} ahead
              </span>
              <span style={{ color: status.behind > 0 ? '#ef5350' : '#606060' }}>
                ↓ {status.behind} behind
              </span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePull()}
              loading={activeOp === 'pull-current'}
            >
              Pull ↓
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handlePush()}
              loading={activeOp === 'push-current'}
              showArrow
            >
              Push ↑
            </Button>
          </div>
        </div>
      )}

      {/* Remotes List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {remotes.length === 0 && !loading && (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: '#606060',
              fontSize: '13px',
            }}
          >
            No remotes configured for this repository. Click "+ Add Remote" to connect to GitHub, GitLab, or a remote server.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {remotes.map((r) => (
            <div
              key={r.name}
              style={{
                background: '#111111',
                border: '1px solid #202020',
                borderRadius: '2px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Tag label={r.name} variant="remote" size="md" />
                  <span style={{ color: '#da5c2c', fontSize: '13px', fontWeight: 700 }}>
                    {r.name === 'origin' ? '[DEFAULT REMOTE]' : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFetch(r.name)}
                    loading={activeOp === `fetch-${r.name}`}
                  >
                    Fetch
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePull(r.name)}
                    loading={activeOp === `pull-${r.name}`}
                  >
                    Pull
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePush(r.name)}
                    loading={activeOp === `push-${r.name}`}
                    showArrow
                  >
                    Push
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveRemote(r)}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              {/* URLs */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '12px',
                  background: '#161616',
                  padding: '10px 12px',
                  borderRadius: '2px',
                  border: '1px solid #1f1f1f',
                }}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#7e7e7e', width: '50px', flexShrink: 0 }}>FETCH:</span>
                  <span style={{ color: '#eeeeee', wordBreak: 'break-all' }}>{r.fetchUrl}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#7e7e7e', width: '50px', flexShrink: 0 }}>PUSH:</span>
                  <span style={{ color: '#eeeeee', wordBreak: 'break-all' }}>{r.pushUrl}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Remote Modal */}
      {addModal && (
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
          onClick={() => setAddModal(false)}
        >
          <div
            style={{
              background: '#191919',
              border: '1px solid #202020',
              borderRadius: '2px',
              padding: '24px',
              width: '440px',
              fontFamily: 'var(--font-mono, monospace)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: '#eeeeee', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
              Add Remote
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input
                label="REMOTE NAME"
                placeholder="origin, upstream, backup…"
                value={newRemoteName}
                onChange={(e) => setNewRemoteName(e.target.value)}
                autoFocus
              />
              <Input
                label="REMOTE URL"
                placeholder="https://github.com/owner/repo.git or git@github.com:owner/repo.git"
                value={newRemoteUrl}
                onChange={(e) => setNewRemoteUrl(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="ghost" size="sm" onClick={() => setAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleAddRemote} showArrow>
                Add Remote
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RemotesView
