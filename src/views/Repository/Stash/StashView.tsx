import React, { useState, useEffect, useCallback } from 'react'
import { useUiStore } from '../../../store/ui.store'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import Spinner from '../../../components/Spinner'
import Tag from '../../../components/Tag'
import type { StashEntry } from '@shared/types/git.types'

export interface StashViewProps {
  repoPath: string
}

export const StashView: React.FC<StashViewProps> = ({ repoPath }) => {
  const { showToast, openConfirmModal } = useUiStore()

  const [stashes, setStashes] = useState<StashEntry[]>([])
  const [loading, setLoading] = useState(false)

  // New Stash Form
  const [newStashOpen, setNewStashOpen] = useState(false)
  const [stashMessage, setStashMessage] = useState('')
  const [includeUntracked, setIncludeUntracked] = useState(true)
  const [creating, setCreating] = useState(false)

  const loadStashes = useCallback(async () => {
    if (!repoPath) return
    setLoading(true)
    try {
      const res = await window.flowgit.stash.list(repoPath)
      if (res.success && res.data) {
        setStashes(res.data as StashEntry[])
      } else {
        showToast({ type: 'error', title: 'Cannot list stashes', message: res.error })
      }
    } catch (e: unknown) {
      showToast({
        type: 'error',
        title: 'Error loading stash',
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoading(false)
    }
  }, [repoPath, showToast])

  useEffect(() => {
    loadStashes()
  }, [loadStashes])

  const handleCreateStash = async () => {
    setCreating(true)
    try {
      const res = await window.flowgit.stash.create(
        repoPath,
        stashMessage.trim() || undefined,
        includeUntracked
      )
      if (res.success) {
        showToast({ type: 'success', title: 'Changes stashed successfully' })
        setNewStashOpen(false)
        setStashMessage('')
        loadStashes()
      } else {
        showToast({ type: 'error', title: 'Stash creation failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    } finally {
      setCreating(false)
    }
  }

  const handleApplyStash = async (index: number) => {
    try {
      const res = await window.flowgit.stash.apply(repoPath, index)
      if (res.success) {
        showToast({ type: 'success', title: `Stash@{${index}} applied` })
      } else {
        showToast({ type: 'error', title: 'Apply stash failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handlePopStash = async (index: number) => {
    try {
      const res = await window.flowgit.stash.pop(repoPath, index)
      if (res.success) {
        showToast({ type: 'success', title: `Stash@{${index}} popped` })
        loadStashes()
      } else {
        showToast({ type: 'error', title: 'Pop stash failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleDropStash = (index: number, message: string) => {
    openConfirmModal({
      title: 'Drop Stash Entry',
      message: `Are you sure you want to drop stash@{${index}} ("${message}")? This change cannot be recovered.`,
      confirmText: 'Drop Stash',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const res = await window.flowgit.stash.drop(repoPath, index)
          if (res.success) {
            showToast({ type: 'info', title: `Dropped stash@{${index}}` })
            loadStashes()
          } else {
            showToast({ type: 'error', title: 'Drop failed', message: res.error })
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#eeeeee', letterSpacing: '0.04em' }}>
            STASH ({stashes.length})
          </span>
          {loading && <Spinner size="sm" />}
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setNewStashOpen(!newStashOpen)}
          showArrow
        >
          {newStashOpen ? 'Cancel' : '+ New Stash'}
        </Button>
      </div>

      {/* Expandable New Stash Form */}
      {newStashOpen && (
        <div
          style={{
            padding: '16px 20px',
            background: '#161616',
            borderBottom: '1px solid #202020',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#eeeeee' }}>
            Create New Stash Entry
          </div>
          <Input
            label="STASH MESSAGE (OPTIONAL)"
            placeholder="WIP on feature branch…"
            value={stashMessage}
            onChange={(e) => setStashMessage(e.target.value)}
            disabled={creating}
            autoFocus
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#b4b4b4',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={includeUntracked}
                onChange={(e) => setIncludeUntracked(e.target.checked)}
                style={{ accentColor: '#da5c2c' }}
                disabled={creating}
              />
              <span>Include untracked files (-u)</span>
            </label>

            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateStash}
              loading={creating}
              showArrow
            >
              Stash Changes
            </Button>
          </div>
        </div>
      )}

      {/* Stash List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {stashes.length === 0 && !loading && (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: '#606060',
              fontSize: '13px',
            }}
          >
            No stash entries found. Stash saves your uncommitted changes for later.
          </div>
        )}

        {stashes.map((s) => (
          <div
            key={s.index}
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag label={`stash@{${s.index}}`} variant="stash" size="sm" />
                <span style={{ color: '#eeeeee', fontSize: '13px', fontWeight: 700 }}>
                  {s.message}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '11px',
                  color: '#606060',
                  marginTop: '4px',
                }}
              >
                <span>Branch: <span style={{ color: '#b4b4b4' }}>{s.branch}</span></span>
                <span>Date: <span style={{ color: '#7e7e7e' }}>{s.date}</span></span>
                <span>SHA: <span style={{ color: '#da5c2c' }}>{s.hash?.substring(0, 7)}</span></span>
              </div>
            </div>

            {/* Actions per entry: Apply, Pop, Drop */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleApplyStash(s.index)}
                title="Apply changes without removing from stash"
              >
                Apply
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePopStash(s.index)}
                title="Apply changes and delete from stash"
              >
                Pop
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDropStash(s.index, s.message)}
                title="Discard this stash entry"
              >
                Drop
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StashView
