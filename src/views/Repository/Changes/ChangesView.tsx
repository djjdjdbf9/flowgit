import React, { useState, useEffect, useCallback } from 'react'
import { useRepoStore } from '../../../store/repo.store'
import { useUiStore } from '../../../store/ui.store'
import Button from '../../../components/Button'
import FileStatusIcon from '../../../components/FileStatusIcon'
import DiffViewer from '../../../components/DiffViewer'
import Spinner from '../../../components/Spinner'
import type { ChangedFile, FileDiff, RepoStatus } from '@shared/types/git.types'

export interface ChangesViewProps {
  repoPath: string
}

export const ChangesView: React.FC<ChangesViewProps> = ({ repoPath }) => {
  const { status, setStatus } = useRepoStore()
  const { showToast, openConfirmModal } = useUiStore()

  const [selectedFile, setSelectedFile] = useState<{ path: string; staged: boolean } | null>(null)
  const [diff, setDiff] = useState<FileDiff | null>(null)
  const [loadingDiff, setLoadingDiff] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(false)

  // Commit panel state
  const [commitMessage, setCommitMessage] = useState('')
  const [isAmend, setIsAmend] = useState(false)
  const [committing, setCommitting] = useState(false)

  const refreshStatus = useCallback(async () => {
    if (!repoPath) return
    setLoadingStatus(true)
    try {
      const res = await window.flowgit.repo.getStatus(repoPath)
      if (res.success && res.data) {
        const repoStatus = res.data as RepoStatus
        setStatus(repoStatus)
      }
    } catch (e: unknown) {
      showToast({
        type: 'error',
        title: 'Failed to refresh status',
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoadingStatus(false)
    }
  }, [repoPath, setStatus, showToast])

  // Load status on mount or when repoPath changes
  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  // Load diff when selected file changes
  const loadDiff = useCallback(
    async (file: { path: string; staged: boolean }) => {
      setLoadingDiff(true)
      try {
        const res = await window.flowgit.diff.file(repoPath, file.path, {
          staged: file.staged,
        })
        if (res.success && res.data) {
          setDiff(res.data as FileDiff)
        } else {
          setDiff(null)
          if (res.error) {
            showToast({ type: 'error', title: 'Cannot load diff', message: res.error })
          }
        }
      } catch (e: unknown) {
        setDiff(null)
        showToast({
          type: 'error',
          title: 'Error loading diff',
          message: e instanceof Error ? e.message : String(e),
        })
      } finally {
        setLoadingDiff(false)
      }
    },
    [repoPath, showToast]
  )

  useEffect(() => {
    if (selectedFile) {
      loadDiff(selectedFile)
    } else {
      setDiff(null)
    }
  }, [selectedFile, loadDiff])

  // File action handlers
  const handleStageFile = async (filePath: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const res = await window.flowgit.changes.stage(repoPath, filePath)
      if (res.success) {
        await refreshStatus()
        if (selectedFile?.path === filePath) {
          setSelectedFile({ path: filePath, staged: true })
        }
      } else {
        showToast({ type: 'error', title: 'Stage failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleUnstageFile = async (filePath: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const res = await window.flowgit.changes.unstage(repoPath, filePath)
      if (res.success) {
        await refreshStatus()
        if (selectedFile?.path === filePath) {
          setSelectedFile({ path: filePath, staged: false })
        }
      } else {
        showToast({ type: 'error', title: 'Unstage failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleStageAll = async () => {
    try {
      const res = await window.flowgit.changes.stageAll(repoPath)
      if (res.success) {
        await refreshStatus()
      } else {
        showToast({ type: 'error', title: 'Stage all failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleUnstageAll = async () => {
    try {
      const res = await window.flowgit.changes.unstageAll(repoPath)
      if (res.success) {
        await refreshStatus()
      } else {
        showToast({ type: 'error', title: 'Unstage all failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleDiscardFile = (filePath: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    openConfirmModal({
      title: 'Discard Changes',
      message: `Are you sure you want to discard all changes in "${filePath}"? This action cannot be undone.`,
      confirmText: 'Discard Changes',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const res = await window.flowgit.changes.discard(repoPath, filePath)
          if (res.success) {
            showToast({ type: 'info', title: 'Changes discarded', message: filePath })
            await refreshStatus()
            if (selectedFile?.path === filePath) {
              setSelectedFile(null)
            }
          } else {
            showToast({ type: 'error', title: 'Discard failed', message: res.error })
          }
        } catch (err: unknown) {
          showToast({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : String(err) })
        }
      },
    })
  }

  const handleStageHunk = async (hunkIndex: number) => {
    if (!selectedFile) return
    try {
      const res = await window.flowgit.changes.stageHunk(repoPath, selectedFile.path, hunkIndex)
      if (res.success) {
        await refreshStatus()
        loadDiff(selectedFile)
      } else {
        showToast({ type: 'error', title: 'Stage hunk failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleUnstageHunk = async (hunkIndex: number) => {
    if (!selectedFile) return
    try {
      const res = await window.flowgit.changes.unstageHunk(repoPath, selectedFile.path, hunkIndex)
      if (res.success) {
        await refreshStatus()
        loadDiff(selectedFile)
      } else {
        showToast({ type: 'error', title: 'Unstage hunk failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      showToast({ type: 'warning', title: 'Empty Commit Message', message: 'Please enter a commit message.' })
      return
    }

    const stagedCount = status?.staged.length ?? 0
    if (stagedCount === 0 && !isAmend) {
      showToast({ type: 'warning', title: 'No Staged Changes', message: 'Stage changes before committing.' })
      return
    }

    setCommitting(true)
    try {
      const res = await window.flowgit.commit.create(repoPath, commitMessage.trim(), { amend: isAmend })
      if (res.success) {
        showToast({ type: 'success', title: isAmend ? 'Commit amended' : 'Committed successfully' })
        setCommitMessage('')
        setIsAmend(false)
        await refreshStatus()
      } else {
        showToast({ type: 'error', title: 'Commit Failed', message: res.error })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error committing', message: e instanceof Error ? e.message : String(e) })
    } finally {
      setCommitting(false)
    }
  }

  const stagedFiles = status?.staged ?? []
  const unstagedFiles = status?.unstaged ?? []
  const untrackedFiles = status?.untracked ?? []
  const conflictedFiles = status?.conflicted ?? []

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
      {/* ── Left Panel (280px): File Lists ── */}
      <div
        style={{
          width: '280px',
          background: '#111111',
          borderRight: '1px solid #202020',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header with Refresh */}
        <div
          style={{
            padding: '10px 14px',
            background: '#141414',
            borderBottom: '1px solid #202020',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#eeeeee', letterSpacing: '0.04em' }}>
            CHANGES
          </span>
          <button
            onClick={refreshStatus}
            disabled={loadingStatus}
            style={{
              background: 'none',
              border: 'none',
              color: '#7e7e7e',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'var(--font-mono, monospace)',
            }}
            title="Refresh Status"
          >
            {loadingStatus ? 'Refreshing…' : '↻'}
          </button>
        </div>

        {/* Scrollable File Sections */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Conflicted Section */}
          {conflictedFiles.length > 0 && (
            <div style={{ borderBottom: '1px solid #202020' }}>
              <div style={sectionHeaderStyle}>
                <span style={{ color: '#da5c2c', fontWeight: 700 }}>
                  CONFLICTS ({conflictedFiles.length})
                </span>
              </div>
              {conflictedFiles.map((file) => (
                <FileRow
                  key={`conflicted-${file.path}`}
                  file={file}
                  isSelected={selectedFile?.path === file.path}
                  onClick={() => setSelectedFile({ path: file.path, staged: false })}
                />
              ))}
            </div>
          )}

          {/* Staged Section */}
          <div style={{ borderBottom: '1px solid #202020' }}>
            <div style={sectionHeaderStyle}>
              <span style={{ color: '#eeeeee' }}>
                STAGED ({stagedFiles.length})
              </span>
              {stagedFiles.length > 0 && (
                <button onClick={handleUnstageAll} style={sectionActionBtnStyle}>
                  Unstage All
                </button>
              )}
            </div>
            {stagedFiles.map((file) => (
              <FileRow
                key={`staged-${file.path}`}
                file={file}
                isSelected={selectedFile?.path === file.path && selectedFile.staged}
                onClick={() => setSelectedFile({ path: file.path, staged: true })}
                onAction={(e) => handleUnstageFile(file.path, e)}
                actionLabel="-"
                actionTitle="Unstage file"
              />
            ))}
          </div>

          {/* Unstaged Section */}
          <div style={{ borderBottom: '1px solid #202020' }}>
            <div style={sectionHeaderStyle}>
              <span style={{ color: '#b4b4b4' }}>
                UNSTAGED ({unstagedFiles.length})
              </span>
              {unstagedFiles.length > 0 && (
                <button onClick={handleStageAll} style={sectionActionBtnStyle}>
                  Stage All
                </button>
              )}
            </div>
            {unstagedFiles.map((file) => (
              <FileRow
                key={`unstaged-${file.path}`}
                file={file}
                isSelected={selectedFile?.path === file.path && !selectedFile.staged}
                onClick={() => setSelectedFile({ path: file.path, staged: false })}
                onAction={(e) => handleStageFile(file.path, e)}
                actionLabel="+"
                actionTitle="Stage file"
                onDiscard={(e) => handleDiscardFile(file.path, e)}
              />
            ))}
          </div>

          {/* Untracked Section */}
          <div>
            <div style={sectionHeaderStyle}>
              <span style={{ color: '#7e7e7e' }}>
                UNTRACKED ({untrackedFiles.length})
              </span>
            </div>
            {untrackedFiles.map((file) => (
              <FileRow
                key={`untracked-${file.path}`}
                file={file}
                isSelected={selectedFile?.path === file.path}
                onClick={() => setSelectedFile({ path: file.path, staged: false })}
                onAction={(e) => handleStageFile(file.path, e)}
                actionLabel="+"
                actionTitle="Track & stage file"
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Center Panel: Diff Viewer ── */}
      <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
        <DiffViewer
          diff={diff}
          filePath={selectedFile?.path}
          isStaged={selectedFile?.staged}
          onStageHunk={handleStageHunk}
          onUnstageHunk={handleUnstageHunk}
          isLoading={loadingDiff}
        />
      </div>

      {/* ── Right Panel (260px): Commit Panel ── */}
      <div
        style={{
          width: '260px',
          background: '#111111',
          borderLeft: '1px solid #202020',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          padding: '14px',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#eeeeee',
            letterSpacing: '0.04em',
            marginBottom: '12px',
          }}
        >
          COMMIT
        </div>

        {/* Commit Message Textarea */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minHeight: '140px' }}>
          <textarea
            placeholder="Commit message (monospace)…"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            style={{
              width: '100%',
              flex: 1,
              background: '#202020',
              border: '1px solid #3a3a3a',
              borderRadius: '2px',
              color: '#eeeeee',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '12px',
              padding: '10px',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.5,
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#606060',
              marginTop: '4px',
            }}
          >
            <span>Characters: {commitMessage.length}</span>
            {commitMessage.length > 50 && (
              <span style={{ color: '#e5c07b' }}>&gt;50 summary</span>
            )}
          </div>
        </div>

        {/* Options & Warnings */}
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#b4b4b4',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={isAmend}
              onChange={(e) => setIsAmend(e.target.checked)}
              style={{ accentColor: '#da5c2c' }}
            />
            <span>Amend previous commit</span>
          </label>

          {stagedFiles.length === 0 && !isAmend && (
            <div
              style={{
                fontSize: '11px',
                color: '#e5c07b',
                background: '#1c1b14',
                border: '1px solid #3d351e',
                borderRadius: '2px',
                padding: '6px 8px',
                lineHeight: 1.4,
              }}
            >
              ⚠ No staged changes. Stage files to commit.
            </div>
          )}

          {/* Commit Button */}
          <Button
            variant="primary"
            size="md"
            onClick={handleCommit}
            disabled={committing || (!isAmend && stagedFiles.length === 0) || !commitMessage.trim()}
            loading={committing}
            showArrow
            style={{ width: '100%', marginTop: '4px' }}
          >
            {isAmend ? 'Amend Commit' : `Commit (${stagedFiles.length})`}
          </Button>
        </div>
      </div>
    </div>
  )
}

function FileRow({
  file,
  isSelected,
  onClick,
  onAction,
  actionLabel,
  actionTitle,
  onDiscard,
}: {
  file: ChangedFile
  isSelected: boolean
  onClick: () => void
  onAction?: (e: React.MouseEvent) => void
  actionLabel?: string
  actionTitle?: string
  onDiscard?: (e: React.MouseEvent) => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        background: isSelected ? '#191919' : hovered ? '#141414' : 'transparent',
        borderLeft: isSelected ? '2px solid #da5c2c' : '2px solid transparent',
        cursor: 'pointer',
        gap: '8px',
        fontSize: '12px',
        transition: 'background-color 0.08s ease',
      }}
    >
      <FileStatusIcon status={file.status} />
      <span
        style={{
          flex: 1,
          color: isSelected ? '#eeeeee' : '#b4b4b4',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={file.path}
      >
        {file.path}
      </span>

      {/* Hover Action Buttons */}
      {hovered && (
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {onDiscard && (
            <button
              onClick={onDiscard}
              style={iconBtnStyle}
              title="Discard changes"
            >
              ×
            </button>
          )}
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              style={iconBtnStyle}
              title={actionTitle}
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const sectionHeaderStyle: React.CSSProperties = {
  padding: '6px 12px',
  background: '#161616',
  fontSize: '11px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  letterSpacing: '0.04em',
}

const sectionActionBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#7e7e7e',
  cursor: 'pointer',
  fontSize: '11px',
  fontFamily: 'var(--font-mono, monospace)',
}

const iconBtnStyle: React.CSSProperties = {
  background: '#202020',
  border: '1px solid #3a3a3a',
  borderRadius: '2px',
  color: '#eeeeee',
  cursor: 'pointer',
  fontSize: '11px',
  width: '18px',
  height: '18px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}

export default ChangesView
