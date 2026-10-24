import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

type ActiveView = 'changes' | 'history' | 'graph' | 'branches' | 'stash' | 'remotes' | 'filebrowser'

interface UiState {
  // Toast notifications
  toasts: Toast[]

  // Active view in the repo workspace
  activeView: ActiveView

  // Selected items
  selectedCommitHash: string | null
  selectedFilePath: string | null

  // Diff layout
  diffLayout: 'split' | 'unified'

  // Sidebar collapsed
  sidebarCollapsed: boolean

  // Modals
  confirmModal: {
    open: boolean
    title: string
    message: string
    confirmText: string
    isDangerous: boolean
    onConfirm: (() => void) | null
  }

  // Actions
  showToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  setActiveView: (view: ActiveView) => void
  setSelectedCommit: (hash: string | null) => void
  setSelectedFile: (path: string | null) => void
  setDiffLayout: (layout: 'split' | 'unified') => void
  setSidebarCollapsed: (collapsed: boolean) => void
  openConfirmModal: (opts: { title: string; message: string; confirmText: string; isDangerous?: boolean; onConfirm: () => void }) => void
  closeConfirmModal: () => void
}

let toastId = 0

export const useUiStore = create<UiState>()(
  immer((set) => ({
    toasts: [],
    activeView: 'changes',
    selectedCommitHash: null,
    selectedFilePath: null,
    diffLayout: 'split',
    sidebarCollapsed: false,
    confirmModal: {
      open: false,
      title: '',
      message: '',
      confirmText: 'Confirm',
      isDangerous: false,
      onConfirm: null,
    },

    showToast: (toast) => set((state) => {
      state.toasts.push({ ...toast, id: String(++toastId) })
      // Auto-dismiss after duration
    }),

    dismissToast: (id) => set((state) => {
      state.toasts = state.toasts.filter(t => t.id !== id)
    }),

    setActiveView: (view) => set((state) => { state.activeView = view }),
    setSelectedCommit: (hash) => set((state) => { state.selectedCommitHash = hash }),
    setSelectedFile: (path) => set((state) => { state.selectedFilePath = path }),
    setDiffLayout: (layout) => set((state) => { state.diffLayout = layout }),
    setSidebarCollapsed: (collapsed) => set((state) => { state.sidebarCollapsed = collapsed }),

    openConfirmModal: (opts) => set((state) => {
      state.confirmModal = {
        open: true,
        title: opts.title,
        message: opts.message,
        confirmText: opts.confirmText,
        isDangerous: opts.isDangerous ?? false,
        onConfirm: opts.onConfirm,
      }
    }),

    closeConfirmModal: () => set((state) => {
      state.confirmModal.open = false
      state.confirmModal.onConfirm = null
    }),
  }))
)
