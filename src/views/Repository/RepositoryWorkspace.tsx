import React, { useEffect, useCallback } from 'react'
import { useRepoStore } from '../../store/repo.store'
import { useUiStore } from '../../store/ui.store'
import Sidebar from '../../components/Sidebar'
import TitleBar from '../../components/TitleBar'
import ChangesView from './Changes/ChangesView'
import HistoryView from './History/HistoryView'
import GraphView from './Graph/GraphView'
import BranchesView from './Branches/BranchesView'
import StashView from './Stash/StashView'
import RemotesView from './Remotes/RemotesView'
import FileBrowserView from './FileBrowser/FileBrowserView'
import type { RepoStatus } from '@shared/types/git.types'

export const RepositoryWorkspace: React.FC = () => {
  const { activeRepoPath, setStatus } = useRepoStore()
  const { activeView, showToast } = useUiStore()

  // Poll or refresh status periodically/on mount
  const refreshStatus = useCallback(async () => {
    if (!activeRepoPath) return
    try {
      const res = await window.flowgit.repo.getStatus(activeRepoPath)
      if (res.success && res.data) {
        setStatus(res.data as RepoStatus)
      }
    } catch {
      // Ignore background refresh errors
    }
  }, [activeRepoPath, setStatus])

  useEffect(() => {
    refreshStatus()
    // Periodic light status poll every 15s
    const timer = setInterval(refreshStatus, 15000)
    return () => clearInterval(timer)
  }, [refreshStatus])

  if (!activeRepoPath) {
    return null
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#000000',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      {/* Top Title Bar */}
      <TitleBar />

      {/* Main Workspace: Left Sidebar + Right Active View */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Sidebar (240px) */}
        <Sidebar />

        {/* Right: Active View */}
        <main
          style={{
            flex: 1,
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: '#000000',
          }}
        >
          {activeView === 'changes' && <ChangesView repoPath={activeRepoPath} />}
          {activeView === 'history' && <HistoryView repoPath={activeRepoPath} />}
          {activeView === 'graph' && <GraphView repoPath={activeRepoPath} />}
          {activeView === 'branches' && <BranchesView repoPath={activeRepoPath} />}
          {activeView === 'stash' && <StashView repoPath={activeRepoPath} />}
          {activeView === 'remotes' && <RemotesView repoPath={activeRepoPath} />}
          {activeView === 'filebrowser' && <FileBrowserView repoPath={activeRepoPath} />}
        </main>
      </div>
    </div>
  )
}

export default RepositoryWorkspace
