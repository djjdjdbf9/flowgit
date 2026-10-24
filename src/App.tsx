import React, { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRepoStore } from './store/repo.store'
import { useUiStore } from './store/ui.store'
import WelcomeView from './views/Welcome/WelcomeView'
import RepositoryWorkspace from './views/Repository/RepositoryWorkspace'
import SettingsView from './views/Settings/SettingsView'
import ToastContainer from './components/ToastContainer'
import ConfirmModal from './components/ConfirmModal'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App(): JSX.Element {
  const { activeRepoPath, setGitInfo, setRepositories } = useRepoStore()
  const { toasts, dismissToast, confirmModal, closeConfirmModal } = useUiStore()

  // Detect Git and load repository list on startup
  useEffect(() => {
    async function init() {
      try {
        const detection = await window.flowgit.detectGit()
        setGitInfo(detection.found, detection.path, detection.version)
      } catch (e) {
        setGitInfo(false, null, null)
      }

      try {
        const result = await window.flowgit.repo.list()
        if (result.success && result.data) {
          setRepositories(result.data)
        }
      } catch {
        // ignore
      }
    }
    init()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000000', overflow: 'hidden' }}>
          <Routes>
            <Route path="/" element={activeRepoPath ? <Navigate to="/repo" replace /> : <WelcomeView />} />
            <Route path="/welcome" element={<WelcomeView />} />
            <Route path="/repo" element={activeRepoPath ? <RepositoryWorkspace /> : <Navigate to="/" replace />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>

          <ToastContainer toasts={toasts} onDismiss={dismissToast} />

          {confirmModal.open && (
            <ConfirmModal
              title={confirmModal.title}
              message={confirmModal.message}
              confirmText={confirmModal.confirmText}
              isDangerous={confirmModal.isDangerous}
              onConfirm={() => {
                confirmModal.onConfirm?.()
                closeConfirmModal()
              }}
              onCancel={closeConfirmModal}
            />
          )}
        </div>
      </HashRouter>
    </QueryClientProvider>
  )
}
