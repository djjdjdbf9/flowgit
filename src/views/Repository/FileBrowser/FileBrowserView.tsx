import React, { useState, useEffect } from 'react'
import { useUiStore } from '../../../store/ui.store'
import Button from '../../../components/Button'
import Spinner from '../../../components/Spinner'
import type { BlameEntry } from '@shared/types/git.types'

export interface FileBrowserViewProps {
  repoPath: string
}

export const FileBrowserView: React.FC<FileBrowserViewProps> = ({ repoPath }) => {
  const { showToast } = useUiStore()
  const [blameFilePath, setBlameFilePath] = useState('')
  const [blameEntries, setBlameEntries] = useState<BlameEntry[]>([])
  const [loading, setLoading] = useState(false)

  const handleOpenExplorer = async () => {
    try {
      await window.flowgit.openPath(repoPath)
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Cannot open folder', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleRunBlame = async () => {
    if (!blameFilePath.trim()) return
    setLoading(true)
    try {
      const res = await window.flowgit.blame.file(repoPath, blameFilePath.trim())
      if (res.success && res.data) {
        setBlameEntries(res.data as BlameEntry[])
      } else {
        setBlameEntries([])
        showToast({ type: 'error', title: 'Blame failed', message: res.error || 'File not found or has no history' })
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
    } finally {
      setLoading(false)
    }
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
      {/* Top Header */}
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
            FILE EXPLORER & GIT BLAME
          </span>
          <span style={{ fontSize: '12px', color: '#606060' }}>{repoPath}</span>
        </div>

        <Button variant="ghost" size="sm" onClick={handleOpenExplorer}>
          Open in System Explorer ↗
        </Button>
      </div>

      {/* Blame Search Strip */}
      <div
        style={{
          padding: '10px 20px',
          background: '#161616',
          borderBottom: '1px solid #202020',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '12px', color: '#b4b4b4' }}>Inspect File Blame:</span>
        <input
          type="text"
          placeholder="e.g. src/index.ts, package.json…"
          value={blameFilePath}
          onChange={(e) => setBlameFilePath(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRunBlame()}
          style={{
            background: '#111111',
            border: '1px solid #202020',
            borderRadius: '2px',
            color: '#eeeeee',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            padding: '5px 10px',
            width: '280px',
            outline: 'none',
          }}
        />
        <Button variant="secondary" size="sm" onClick={handleRunBlame} loading={loading}>
          Blame
        </Button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Spinner size="md" label="Analyzing file history and blame…" />
          </div>
        ) : blameEntries.length > 0 ? (
          <div
            style={{
              background: '#0d0d0d',
              border: '1px solid #202020',
              borderRadius: '2px',
              overflow: 'hidden',
              fontSize: '12px',
            }}
          >
            {blameEntries.map((b, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid #141414',
                  lineHeight: 1.5,
                }}
              >
                <div
                  style={{
                    width: '70px',
                    padding: '2px 8px',
                    color: '#da5c2c',
                    borderRight: '1px solid #1a1a1a',
                    flexShrink: 0,
                  }}
                >
                  {b.shortHash}
                </div>
                <div
                  style={{
                    width: '120px',
                    padding: '2px 8px',
                    color: '#7e7e7e',
                    borderRight: '1px solid #1a1a1a',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {b.author}
                </div>
                <div
                  style={{
                    width: '40px',
                    padding: '2px 8px',
                    color: '#505050',
                    textAlign: 'right',
                    borderRight: '1px solid #1a1a1a',
                    flexShrink: 0,
                  }}
                >
                  {b.lineNumber}
                </div>
                <pre
                  style={{
                    flex: 1,
                    margin: 0,
                    padding: '2px 8px',
                    color: '#eeeeee',
                    fontFamily: 'var(--font-mono, monospace)',
                    whiteSpace: 'pre',
                  }}
                >
                  {b.lineContent}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#606060',
              fontSize: '13px',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '28px', opacity: 0.5 }}>▤</span>
            <span>Enter a relative file path above to view git blame history</span>
            <Button variant="ghost" size="sm" onClick={handleOpenExplorer}>
              Open repository folder in File Explorer →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileBrowserView
