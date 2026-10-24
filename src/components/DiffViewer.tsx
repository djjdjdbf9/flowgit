import React from 'react'
import type { FileDiff, DiffHunk, DiffLine } from '@shared/types/git.types'
import FileStatusIcon from './FileStatusIcon'

export interface DiffViewerProps {
  diff: FileDiff | null
  filePath?: string
  isStaged?: boolean
  onStageHunk?: (hunkIndex: number) => void
  onUnstageHunk?: (hunkIndex: number) => void
  isLoading?: boolean
  className?: string
  style?: React.CSSProperties
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diff,
  filePath,
  isStaged,
  onStageHunk,
  onUnstageHunk,
  isLoading = false,
  className = '',
  style,
}) => {
  if (isLoading) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111111',
          color: '#7e7e7e',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '13px',
          ...style,
        }}
      >
        Loading diff…
      </div>
    )
  }

  if (!diff) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0d0d',
          color: '#606060',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '13px',
          gap: '8px',
          ...style,
        }}
      >
        <span style={{ fontSize: '24px', opacity: 0.5 }}>▤</span>
        <span>Select a file to inspect diff</span>
      </div>
    )
  }

  if (diff.isBinary) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111111',
          color: '#b4b4b4',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '13px',
          padding: '24px',
          ...style,
        }}
      >
        <span style={{ color: '#e5c07b', marginBottom: '8px', fontSize: '20px' }}>[BINARY]</span>
        <div style={{ color: '#eeeeee', fontWeight: 700 }}>Binary file not shown</div>
        <div style={{ color: '#7e7e7e', fontSize: '12px', marginTop: '4px' }}>
          {diff.newPath || diff.oldPath || filePath}
        </div>
      </div>
    )
  }

  if (diff.isLarge) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111111',
          color: '#b4b4b4',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '13px',
          padding: '24px',
          ...style,
        }}
      >
        <span style={{ color: '#da5c2c', marginBottom: '8px', fontSize: '20px' }}>[LARGE]</span>
        <div style={{ color: '#eeeeee', fontWeight: 700 }}>File is too large to display inline</div>
        <div style={{ color: '#7e7e7e', fontSize: '12px', marginTop: '4px' }}>
          {diff.additions} additions, {diff.deletions} deletions
        </div>
      </div>
    )
  }

  if (!diff.hunks || diff.hunks.length === 0) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111111',
          color: '#7e7e7e',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '13px',
          padding: '24px',
          ...style,
        }}
      >
        <span>No visible differences found in file</span>
        <span style={{ color: '#505050', fontSize: '11px', marginTop: '4px' }}>
          {diff.newPath || diff.oldPath}
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0d0d0d',
        fontFamily: 'var(--font-mono, monospace)',
        overflow: 'hidden',
        ...style,
      }}
      className={`flowgit-diff-viewer ${className}`}
    >
      {/* File Header Bar */}
      <div
        style={{
          padding: '8px 16px',
          background: '#141414',
          borderBottom: '1px solid #202020',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <FileStatusIcon status={diff.status} />
          <span
            style={{
              color: '#eeeeee',
              fontSize: '12px',
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {diff.newPath || diff.oldPath}
          </span>
          {diff.oldPath && diff.newPath && diff.oldPath !== diff.newPath && (
            <span style={{ color: '#606060', fontSize: '11px' }}>
              (was {diff.oldPath})
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', display: 'inline-flex', gap: '6px' }}>
            <span style={{ color: '#4caf50' }}>+{diff.additions}</span>
            <span style={{ color: '#ef5350' }}>-{diff.deletions}</span>
          </span>
        </div>
      </div>

      {/* Diff Hunks Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          userSelect: 'text',
        }}
      >
        {diff.hunks.map((hunk: DiffHunk, hunkIndex: number) => (
          <div key={hunkIndex} style={{ marginBottom: '16px' }}>
            {/* Hunk Header */}
            <div
              style={{
                background: '#202020',
                color: '#b4b4b4',
                fontSize: '12px',
                padding: '4px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid #2a2a2a',
                borderBottom: '1px solid #2a2a2a',
                userSelect: 'none',
              }}
            >
              <span>{hunk.header}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {isStaged && onUnstageHunk && (
                  <button
                    onClick={() => onUnstageHunk(hunkIndex)}
                    style={hunkActionBtnStyle}
                    title="Unstage this hunk"
                  >
                    Unstage Hunk
                  </button>
                )}
                {!isStaged && onStageHunk && (
                  <button
                    onClick={() => onStageHunk(hunkIndex)}
                    style={hunkActionBtnStyle}
                    title="Stage this hunk"
                  >
                    Stage Hunk
                  </button>
                )}
              </div>
            </div>

            {/* Hunk Lines */}
            <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
              {hunk.lines.map((line: DiffLine, lineIdx: number) => {
                const isAdded = line.type === 'added'
                const isRemoved = line.type === 'removed'

                const rowBg = isAdded
                  ? '#0d1f0d'
                  : isRemoved
                  ? '#1f0d0d'
                  : '#111111'

                const textColor = isAdded
                  ? '#4caf50'
                  : isRemoved
                  ? '#ef5350'
                  : '#eeeeee'

                const symbol = isAdded ? '+' : isRemoved ? '-' : ' '

                return (
                  <div
                    key={lineIdx}
                    style={{
                      display: 'flex',
                      background: rowBg,
                      borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    {/* Old line number */}
                    <div
                      style={{
                        width: '44px',
                        padding: '0 8px',
                        textAlign: 'right',
                        color: '#606060',
                        userSelect: 'none',
                        borderRight: '1px solid #1a1a1a',
                        flexShrink: 0,
                      }}
                    >
                      {line.oldLineNumber ?? ''}
                    </div>

                    {/* New line number */}
                    <div
                      style={{
                        width: '44px',
                        padding: '0 8px',
                        textAlign: 'right',
                        color: '#606060',
                        userSelect: 'none',
                        borderRight: '1px solid #1a1a1a',
                        flexShrink: 0,
                      }}
                    >
                      {line.newLineNumber ?? ''}
                    </div>

                    {/* Diff indicator (+/-/space) */}
                    <div
                      style={{
                        width: '20px',
                        textAlign: 'center',
                        color: textColor,
                        userSelect: 'none',
                        flexShrink: 0,
                      }}
                    >
                      {symbol}
                    </div>

                    {/* Code line content */}
                    <pre
                      style={{
                        flex: 1,
                        margin: 0,
                        padding: '0 8px',
                        color: textColor,
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '12px',
                        whiteSpace: 'pre',
                        wordBreak: 'normal',
                      }}
                    >
                      {line.content || ' '}
                    </pre>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const hunkActionBtnStyle: React.CSSProperties = {
  background: '#141414',
  border: '1px solid #3a3a3a',
  borderRadius: '2px',
  color: '#eeeeee',
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: '11px',
  padding: '2px 8px',
  cursor: 'pointer',
}

export default DiffViewer
