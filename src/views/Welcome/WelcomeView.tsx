import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRepoStore } from '../../store/repo.store'
import { useUiStore } from '../../store/ui.store'
import TitleBar from '../../components/TitleBar'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Spinner from '../../components/Spinner'
import type { Repository } from '@shared/types/git.types'

export const WelcomeView: React.FC = () => {
  const navigate = useNavigate()
  const { repositories, setActiveRepo, addRepository, gitFound, gitVersion, gitPath } = useRepoStore()
  const { showToast } = useUiStore()

  const [cloneOpen, setCloneOpen] = useState(false)
  const [cloneUrl, setCloneUrl] = useState('')
  const [clonePath, setClonePath] = useState('')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleOpenRepo = useCallback(async () => {
    setLoadingAction('open')
    try {
      const selectedDir = await window.flowgit.openDirectory({ title: 'Open Existing Git Repository' })
      if (!selectedDir) {
        setLoadingAction(null)
        return
      }

      const res = await window.flowgit.repo.open(selectedDir)
      if (!res.success || !res.data) {
        showToast({
          type: 'error',
          title: 'Cannot Open Repository',
          message: res.error || 'The selected folder is not a valid Git repository.',
        })
        return
      }

      const repo = res.data as Repository
      addRepository(repo)
      setActiveRepo(repo)
      navigate('/repo')
    } catch (e: unknown) {
      showToast({
        type: 'error',
        title: 'Error Opening Repository',
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoadingAction(null)
    }
  }, [addRepository, setActiveRepo, navigate, showToast])

  const handleInitRepo = useCallback(async () => {
    setLoadingAction('init')
    try {
      const selectedDir = await window.flowgit.openDirectory({ title: 'Select Directory to Initialize Git' })
      if (!selectedDir) {
        setLoadingAction(null)
        return
      }

      const res = await window.flowgit.repo.init(selectedDir)
      if (!res.success || !res.data) {
        showToast({
          type: 'error',
          title: 'Initialization Failed',
          message: res.error || 'Failed to initialize git repository in selected folder.',
        })
        return
      }

      const repo = res.data as Repository
      addRepository(repo)
      setActiveRepo(repo)
      showToast({
        type: 'success',
        title: 'Repository Initialized',
        message: `Created Git repository at ${selectedDir}`,
      })
      navigate('/repo')
    } catch (e: unknown) {
      showToast({
        type: 'error',
        title: 'Error Initializing Repository',
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoadingAction(null)
    }
  }, [addRepository, setActiveRepo, navigate, showToast])

  const handleBrowseClonePath = useCallback(async () => {
    const selected = await window.flowgit.openDirectory({ title: 'Select Target Directory For Clone' })
    if (selected) {
      setClonePath(selected)
    }
  }, [])

  const handleCloneRepo = useCallback(async () => {
    if (!cloneUrl.trim()) {
      showToast({ type: 'warning', title: 'URL Required', message: 'Please enter a Git repository URL.' })
      return
    }
    if (!clonePath.trim()) {
      showToast({ type: 'warning', title: 'Target Directory Required', message: 'Please specify where to clone the repository.' })
      return
    }

    setLoadingAction('clone')
    try {
      const res = await window.flowgit.repo.clone(cloneUrl.trim(), clonePath.trim())
      if (!res.success || !res.data) {
        showToast({
          type: 'error',
          title: 'Clone Failed',
          message: res.error || 'Could not clone repository from the specified URL.',
        })
        return
      }

      const repo = res.data as Repository
      addRepository(repo)
      setActiveRepo(repo)
      showToast({
        type: 'success',
        title: 'Clone Complete',
        message: `Cloned into ${clonePath}`,
      })
      navigate('/repo')
    } catch (e: unknown) {
      showToast({
        type: 'error',
        title: 'Clone Exception',
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoadingAction(null)
    }
  }, [cloneUrl, clonePath, addRepository, setActiveRepo, navigate, showToast])

  const handleOpenRecent = useCallback(
    async (repo: Repository) => {
      setLoadingAction(repo.id)
      try {
        const res = await window.flowgit.repo.open(repo.path)
        if (!res.success) {
          showToast({
            type: 'error',
            title: 'Repository Not Accessible',
            message: res.error || `Could not open ${repo.path}`,
          })
          return
        }
        setActiveRepo(repo)
        navigate('/repo')
      } catch (e: unknown) {
        showToast({
          type: 'error',
          title: 'Error Opening Repository',
          message: e instanceof Error ? e.message : String(e),
        })
      } finally {
        setLoadingAction(null)
      }
    },
    [setActiveRepo, navigate, showToast]
  )

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-mono, monospace)',
        overflow: 'hidden',
      }}
    >
      {/* Title bar */}
      <TitleBar showRepoSwitcher={false} />

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          padding: '40px 24px',
        }}
      >
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div
            style={{
              fontSize: '12px',
              color: '#606060',
              marginBottom: '10px',
              letterSpacing: '0.08em',
            }}
          >
            ~/FLOWGIT/TERMINAL
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#eeeeee',
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}
          >
            FlowGit
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#b4b4b4',
              maxWidth: '460px',
              lineHeight: 1.6,
            }}
          >
            A high-performance, Blueprint-inspired Git desktop client designed for precision.
          </p>
        </div>

        {/* Action Cards */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            width: '100%',
            maxWidth: '560px',
            marginBottom: '40px',
          }}
        >
          {/* Card 1: Open Repository */}
          <div
            onClick={handleOpenRepo}
            style={{
              background: '#191919',
              border: '1px solid #202020',
              borderLeft: '2px solid #da5c2c',
              borderRadius: '2px',
              padding: '18px 24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background-color 0.12s ease, border-color 0.12s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#202020')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#191919')}
          >
            <div>
              <div
                style={{
                  color: '#eeeeee',
                  fontSize: '15px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Open Repository</span>
                <span style={{ color: '#da5c2c' }}>→</span>
              </div>
              <div style={{ color: '#7e7e7e', fontSize: '12px', marginTop: '4px' }}>
                Open an existing local Git repository from your disk
              </div>
            </div>
            {loadingAction === 'open' && <Spinner size="sm" />}
          </div>

          {/* Card 2: Clone Repository */}
          <div
            style={{
              background: '#191919',
              border: '1px solid #202020',
              borderRadius: '2px',
              overflow: 'hidden',
              transition: 'border-color 0.12s ease',
            }}
          >
            <div
              onClick={() => setCloneOpen(!cloneOpen)}
              style={{
                padding: '18px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderLeft: cloneOpen ? '2px solid #da5c2c' : '2px solid transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#202020')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div
                  style={{
                    color: '#eeeeee',
                    fontSize: '15px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Clone Repository</span>
                  <span style={{ color: '#b4b4b4' }}>{cloneOpen ? '↓' : '→'}</span>
                </div>
                <div style={{ color: '#7e7e7e', fontSize: '12px', marginTop: '4px' }}>
                  Clone from a remote Git URL (GitHub, GitLab, SSH, or HTTPS)
                </div>
              </div>
              {loadingAction === 'clone' && <Spinner size="sm" />}
            </div>

            {/* Expandable Clone Form */}
            {cloneOpen && (
              <div
                style={{
                  padding: '16px 24px 20px',
                  borderTop: '1px solid #202020',
                  background: '#141414',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <Input
                  label="REPOSITORY URL"
                  placeholder="https://github.com/owner/repository.git"
                  value={cloneUrl}
                  onChange={(e) => setCloneUrl(e.target.value)}
                  disabled={loadingAction === 'clone'}
                />

                <div>
                  <label
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '12px',
                      color: '#b4b4b4',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    TARGET DIRECTORY
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Input
                      placeholder="c:\projects\my-repo"
                      value={clonePath}
                      onChange={(e) => setClonePath(e.target.value)}
                      disabled={loadingAction === 'clone'}
                      style={{ flex: 1 }}
                    />
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={handleBrowseClonePath}
                      disabled={loadingAction === 'clone'}
                      type="button"
                    >
                      Browse…
                    </Button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCloneRepo}
                    loading={loadingAction === 'clone'}
                    showArrow
                  >
                    Clone
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Initialize Repository */}
          <div
            onClick={handleInitRepo}
            style={{
              background: '#191919',
              border: '1px solid #202020',
              borderRadius: '2px',
              padding: '18px 24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background-color 0.12s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#202020')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#191919')}
          >
            <div>
              <div
                style={{
                  color: '#eeeeee',
                  fontSize: '15px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Initialize Repository</span>
                <span style={{ color: '#b4b4b4' }}>→</span>
              </div>
              <div style={{ color: '#7e7e7e', fontSize: '12px', marginTop: '4px' }}>
                Create a new Git repository in an existing directory
              </div>
            </div>
            {loadingAction === 'init' && <Spinner size="sm" />}
          </div>
        </div>

        {/* Recent Repositories Section */}
        {repositories.length > 0 && (
          <div style={{ width: '100%', maxWidth: '560px' }}>
            <div
              style={{
                color: '#606060',
                fontSize: '11px',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
              }}
            >
              Recent Repositories
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {repositories.slice(0, 8).map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => handleOpenRecent(repo)}
                  style={{
                    background: '#111111',
                    border: '1px solid #202020',
                    borderRadius: '2px',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border-color 0.1s ease, background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3a3a3a'
                    e.currentTarget.style.background = '#141414'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#202020'
                    e.currentTarget.style.background = '#111111'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#eeeeee', fontSize: '13px', fontWeight: 700 }}>
                        {repo.name}
                      </span>
                      {repo.currentBranch && (
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#61afef',
                            background: '#141c24',
                            border: '1px solid #1e2c3a',
                            borderRadius: '9999px',
                            padding: '1px 6px',
                          }}
                        >
                          {repo.currentBranch}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        color: '#606060',
                        fontSize: '11px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '2px',
                      }}
                    >
                      {repo.path}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {loadingAction === repo.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <span style={{ color: '#505050', fontSize: '13px' }}>→</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Git Detection Status Strip */}
      <div
        style={{
          height: '28px',
          background: '#0d0d0d',
          borderTop: '1px solid #202020',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          fontSize: '11px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {gitFound ? (
            <span style={{ color: '#4caf50', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✓</span>
              <span>Git {gitVersion} detected</span>
              {gitPath && <span style={{ color: '#505050' }}>({gitPath})</span>}
            </span>
          ) : (
            <span style={{ color: '#da5c2c', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✗</span>
              <span>Git binary not found in PATH</span>
              <a
                href="https://git-scm.com/downloads"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#da5c2c', textDecoration: 'underline', marginLeft: '6px' }}
              >
                Install Git →
              </a>
            </span>
          )}
        </div>
        <div style={{ color: '#505050' }}>Void Theme · Axiom Design System</div>
      </div>
    </div>
  )
}

export default WelcomeView
