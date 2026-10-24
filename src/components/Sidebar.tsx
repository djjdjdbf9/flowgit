import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRepoStore } from '../store/repo.store'
import { useUiStore } from '../store/ui.store'
import type { Repository } from '@shared/types/git.types'

interface NavItem {
  id: 'changes' | 'history' | 'graph' | 'branches' | 'stash' | 'remotes' | 'filebrowser'
  label: string
  symbol: string
  badge?: number | string
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const { repositories, activeRepoId, setActiveRepo, status } = useRepoStore()
  const { activeView, setActiveView } = useUiStore()
  const [repoMenuOpen, setRepoMenuOpen] = useState(false)

  const activeRepo = repositories.find((r) => r.id === activeRepoId)

  const changedCount =
    (status?.staged.length ?? 0) +
    (status?.unstaged.length ?? 0) +
    (status?.untracked.length ?? 0) +
    (status?.conflicted.length ?? 0)

  const navItems: NavItem[] = [
    {
      id: 'changes',
      label: 'Changes',
      symbol: '±',
      badge: changedCount > 0 ? changedCount : undefined,
    },
    { id: 'history', label: 'History', symbol: '◉' },
    { id: 'graph', label: 'Graph', symbol: '⬡' },
    { id: 'branches', label: 'Branches', symbol: '⑂' },
    { id: 'stash', label: 'Stash', symbol: '⊞' },
    { id: 'remotes', label: 'Remotes', symbol: '⇅' },
    { id: 'filebrowser', label: 'File Browser', symbol: '▤' },
  ]

  const handleSelectRepo = (repo: Repository) => {
    setActiveRepo(repo)
    setRepoMenuOpen(false)
  }

  return (
    <aside
      style={{
        width: '240px',
        background: '#111111',
        borderRight: '1px solid #202020',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%',
        overflow: 'hidden',
        fontFamily: 'var(--font-mono, monospace)',
        userSelect: 'none',
        position: 'relative',
      }}
      className="flowgit-sidebar"
    >
      {/* Top: Repo Switcher */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #202020',
          background: '#0d0d0d',
          position: 'relative',
        }}
      >
        <button
          onClick={() => setRepoMenuOpen(!repoMenuOpen)}
          style={{
            width: '100%',
            background: repoMenuOpen ? '#191919' : 'transparent',
            border: '1px solid #202020',
            borderRadius: '2px',
            padding: '6px 10px',
            color: '#eeeeee',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          title={activeRepo?.path ?? 'Select Repository'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <span style={{ color: '#da5c2c', fontSize: '13px' }}>◇</span>
            <span
              style={{
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {activeRepo?.name ?? 'No repo'}
            </span>
          </div>
          <span style={{ color: '#606060', fontSize: '10px' }}>▼</span>
        </button>

        {/* Dropdown Menu */}
        {repoMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: '14px',
              right: '14px',
              background: '#191919',
              border: '1px solid #202020',
              borderRadius: '2px',
              zIndex: 100,
              boxShadow: 'rgba(0, 0, 0, 0.5) 0px 8px 16px',
              maxHeight: '260px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                padding: '6px 10px',
                fontSize: '11px',
                color: '#7e7e7e',
                borderBottom: '1px solid #202020',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Recent Repositories
            </div>
            {repositories.map((repo) => (
              <button
                key={repo.id}
                onClick={() => handleSelectRepo(repo)}
                style={{
                  width: '100%',
                  background: repo.id === activeRepoId ? '#202020' : 'transparent',
                  border: 'none',
                  borderLeft: repo.id === activeRepoId ? '2px solid #da5c2c' : '2px solid transparent',
                  padding: '8px 10px',
                  color: repo.id === activeRepoId ? '#eeeeee' : '#b4b4b4',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
                onMouseEnter={(e) => {
                  if (repo.id !== activeRepoId) e.currentTarget.style.background = '#141414'
                }}
                onMouseLeave={(e) => {
                  if (repo.id !== activeRepoId) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={{ fontWeight: repo.id === activeRepoId ? 700 : 400 }}>{repo.name}</span>
                <span
                  style={{
                    fontSize: '10px',
                    color: '#606060',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {repo.path}
                </span>
              </button>
            ))}
            <div style={{ borderTop: '1px solid #202020', padding: '4px' }}>
              <button
                onClick={() => {
                  setRepoMenuOpen(false)
                  navigate('/welcome')
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 8px',
                  color: '#da5c2c',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                + Open / Clone another repo →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation items */}
      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={{
                width: '100%',
                background: isActive ? '#191919' : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${isActive ? '#da5c2c' : 'transparent'}`,
                color: isActive ? '#eeeeee' : '#b4b4b4',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '13px',
                padding: '9px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background-color 0.1s ease, color 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#202020'
                  e.currentTarget.style.color = '#eeeeee'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#b4b4b4'
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '14px',
                    width: '16px',
                    textAlign: 'center',
                    color: isActive ? '#da5c2c' : '#7e7e7e',
                  }}
                >
                  {item.symbol}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  style={{
                    fontSize: '11px',
                    color: isActive ? '#da5c2c' : '#7e7e7e',
                    fontWeight: 700,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom strip: Settings gear & Quick Status */}
      <div
        style={{
          borderTop: '1px solid #202020',
          padding: '10px 16px',
          background: '#0d0d0d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => navigate('/settings')}
          style={{
            background: 'none',
            border: 'none',
            color: '#7e7e7e',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono, monospace)',
            padding: 0,
          }}
          title="App Settings"
          onMouseEnter={(e) => (e.currentTarget.style.color = '#eeeeee')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#7e7e7e')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Settings</span>
        </button>

        <span style={{ fontSize: '11px', color: '#505050' }}>v1.0.0</span>
      </div>
    </aside>
  )
}

export default Sidebar
