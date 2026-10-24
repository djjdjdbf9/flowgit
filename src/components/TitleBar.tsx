import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRepoStore } from '../store/repo.store'
import Tag from './Tag'

export interface TitleBarProps {
  showRepoSwitcher?: boolean
}

interface DragCSSProperties extends React.CSSProperties {
  WebkitAppRegion?: 'drag' | 'no-drag'
}

export const TitleBar: React.FC<TitleBarProps> = ({ showRepoSwitcher = true }) => {
  const navigate = useNavigate()
  const { repositories, activeRepoId, status } = useRepoStore()
  const [isMaximized, setIsMaximized] = useState(false)

  const activeRepo = repositories.find((r) => r.id === activeRepoId)

  useEffect(() => {
    // Check initial maximized state if available
    window.flowgit?.window?.isMaximized?.().then((max) => {
      setIsMaximized(max)
    }).catch(() => {})
  }, [])

  const handleMinimize = () => {
    window.flowgit?.window?.minimize?.()
  }

  const handleMaximize = async () => {
    try {
      await window.flowgit?.window?.maximize?.()
      const max = await window.flowgit?.window?.isMaximized?.()
      setIsMaximized(!!max)
    } catch {
      // Fallback
    }
  }

  const handleClose = () => {
    if (window.flowgit?.window?.close) {
      window.flowgit.window.close()
    } else {
      window.close()
    }
  }

  const containerStyle: DragCSSProperties = {
    height: '40px',
    background: '#000000',
    borderBottom: '1px solid #202020',
    display: 'flex',
    alignItems: 'center',
    padding: '0 0 0 16px',
    WebkitAppRegion: 'drag',
    flexShrink: 0,
    fontFamily: 'var(--font-mono, monospace)',
    userSelect: 'none',
    zIndex: 50,
  }

  const noDragStyle: DragCSSProperties = {
    WebkitAppRegion: 'no-drag',
  }

  return (
    <div style={containerStyle} className="flowgit-titlebar">
      {/* Left: App Logo & Brand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          ...noDragStyle,
        }}
      >
        <button
          onClick={() => navigate('/welcome')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          title="Home / Welcome"
        >
          <span
            style={{
              color: '#da5c2c',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            FlowGit
          </span>
        </button>

        {activeRepo && (
          <>
            <span style={{ color: '#3a3a3a', fontSize: '13px' }}>/</span>
            <span
              style={{
                color: '#eeeeee',
                fontSize: '13px',
                fontWeight: 700,
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {activeRepo.name}
            </span>
          </>
        )}
      </div>

      {/* Center: Repository Context & Branch Status */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          overflow: 'hidden',
          padding: '0 12px',
        }}
      >
        {status?.branch && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              ...noDragStyle,
            }}
          >
            <Tag
              label={status.branch}
              variant={status.detachedHead ? 'head' : 'branch'}
              size="sm"
            />
            {(status.ahead > 0 || status.behind > 0) && (
              <span
                style={{
                  fontSize: '11px',
                  color: '#b4b4b4',
                  display: 'inline-flex',
                  gap: '4px',
                }}
              >
                {status.ahead > 0 && <span style={{ color: '#4caf50' }}>↑{status.ahead}</span>}
                {status.behind > 0 && <span style={{ color: '#ef5350' }}>↓{status.behind}</span>}
              </span>
            )}
            {status.mergeInProgress && (
              <span style={{ color: '#e5c07b', fontSize: '11px' }}>[MERGING]</span>
            )}
            {status.rebaseInProgress && (
              <span style={{ color: '#e5c07b', fontSize: '11px' }}>[REBASING]</span>
            )}
            {status.conflicted && status.conflicted.length > 0 && (
              <span style={{ color: '#da5c2c', fontSize: '11px', fontWeight: 700 }}>
                [{status.conflicted.length} CONFLICT{status.conflicted.length > 1 ? 'S' : ''}]
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Window Controls in Axiom dark style */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          height: '100%',
          ...noDragStyle,
        }}
      >
        <button
          onClick={handleMinimize}
          style={windowBtnStyle}
          title="Minimize"
          onMouseEnter={(e) => (e.currentTarget.style.background = '#202020')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="none">
            <rect width="10" height="1" fill="#b4b4b4" />
          </svg>
        </button>

        <button
          onClick={handleMaximize}
          style={windowBtnStyle}
          title={isMaximized ? 'Restore' : 'Maximize'}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#202020')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M2 0H10V8H8V10H0V2H2V0ZM2 2H8V0.8H2.8V2H2ZM1 3H7V9H1V3Z"
                fill="#b4b4b4"
              />
            </svg>
          ) : (
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <rect x="0.5" y="0.5" width="8" height="8" stroke="#b4b4b4" strokeWidth="1" />
            </svg>
          )}
        </button>

        <button
          onClick={handleClose}
          style={{ ...windowBtnStyle, paddingRight: '14px', paddingLeft: '14px' }}
          title="Close"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#da5c2c'
            const svg = e.currentTarget.querySelector('svg path') as SVGPathElement | null
            if (svg) svg.setAttribute('stroke', '#ffffff')
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            const svg = e.currentTarget.querySelector('svg path') as SVGPathElement | null
            if (svg) svg.setAttribute('stroke', '#b4b4b4')
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="#b4b4b4" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </div>
  )
}

const windowBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  width: '42px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
  outline: 'none',
}

export default TitleBar
