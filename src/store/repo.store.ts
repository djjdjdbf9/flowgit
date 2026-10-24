import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Repository } from '@shared/types/git.types'
import type { RepoStatus } from '@shared/types/git.types'

interface RepoState {
  // Repository list
  repositories: Repository[]
  activeRepoId: string | null
  activeRepoPath: string | null

  // Current repo state
  status: RepoStatus | null
  isLoadingStatus: boolean

  // Git detection
  gitFound: boolean
  gitPath: string | null
  gitVersion: string | null

  // Actions
  setRepositories: (repos: Repository[]) => void
  setActiveRepo: (repo: Repository | null) => void
  setStatus: (status: RepoStatus | null) => void
  setLoadingStatus: (loading: boolean) => void
  setGitInfo: (found: boolean, path: string | null, version: string | null) => void
  addRepository: (repo: Repository) => void
  removeRepository: (id: string) => void
}

export const useRepoStore = create<RepoState>()(
  immer((set) => ({
    repositories: [],
    activeRepoId: null,
    activeRepoPath: null,
    status: null,
    isLoadingStatus: false,
    gitFound: false,
    gitPath: null,
    gitVersion: null,

    setRepositories: (repos) => set((state) => { state.repositories = repos }),
    setActiveRepo: (repo) => set((state) => {
      state.activeRepoId = repo?.id ?? null
      state.activeRepoPath = repo?.path ?? null
      state.status = null
    }),
    setStatus: (status) => set((state) => { state.status = status }),
    setLoadingStatus: (loading) => set((state) => { state.isLoadingStatus = loading }),
    setGitInfo: (found, path, version) => set((state) => {
      state.gitFound = found
      state.gitPath = path
      state.gitVersion = version
    }),
    addRepository: (repo) => set((state) => {
      const exists = state.repositories.findIndex(r => r.id === repo.id)
      if (exists >= 0) state.repositories[exists] = repo
      else state.repositories.unshift(repo)
    }),
    removeRepository: (id) => set((state) => {
      state.repositories = state.repositories.filter(r => r.id !== id)
      if (state.activeRepoId === id) {
        state.activeRepoId = null
        state.activeRepoPath = null
        state.status = null
      }
    }),
  }))
)
