import { JsonStore } from './json-store'
import { createLogger } from '../logger'
import type { Repository } from '../../shared/types/git.types'

const logger = createLogger('persistence:database')

interface DatabaseSchema {
  repositories: Repository[]
  uiState: Record<string, string>
  graphLayout: Record<string, { x: number; y: number }>
}

let store: JsonStore<DatabaseSchema> | null = null

export function getDb(): JsonStore<DatabaseSchema> {
  if (!store) {
    store = new JsonStore<DatabaseSchema>('flowgit-data', {
      repositories: [],
      uiState: {},
      graphLayout: {},
    })
  }
  return store
}

export async function initDatabase(): Promise<void> {
  logger.info('Initializing persistence store')
  getDb()
  logger.info('Persistence store initialized successfully')
}

// ——— Repository CRUD ———

export function getAllRepositories(): Repository[] {
  const repos = getDb().get('repositories') ?? []
  return [...repos].sort((a, b) => new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime())
}

export function getRepository(id: string): Repository | null {
  const repos = getAllRepositories()
  return repos.find(r => r.id === id) ?? null
}

export function upsertRepository(repo: Omit<Repository, 'remotes'>): void {
  const db = getDb()
  const repos = [...(db.get('repositories') ?? [])]
  const existingIndex = repos.findIndex(r => r.id === repo.id || r.path === repo.path)

  const fullRepo: Repository = {
    id: repo.id,
    path: repo.path,
    name: repo.name,
    lastOpened: repo.lastOpened,
    isPinned: repo.isPinned,
    currentBranch: repo.currentBranch,
    isValid: repo.isValid,
    remotes: [],
  }

  if (existingIndex >= 0) {
    repos[existingIndex] = fullRepo
  } else {
    repos.unshift(fullRepo)
  }

  db.set('repositories', repos)
}

export function removeRepository(id: string): void {
  const db = getDb()
  const repos = db.get('repositories') ?? []
  db.set('repositories', repos.filter(r => r.id !== id))
}

export function pinRepository(id: string, pinned: boolean): void {
  const db = getDb()
  const repos = [...(db.get('repositories') ?? [])]
  const repo = repos.find(r => r.id === id)
  if (repo) {
    repo.isPinned = pinned
    db.set('repositories', repos)
  }
}

// ——— UI State ———

export function getUiState(key: string): string | null {
  const state = getDb().get('uiState') ?? {}
  return state[key] ?? null
}

export function setUiState(key: string, value: string): void {
  const db = getDb()
  const state = { ...(db.get('uiState') ?? {}) }
  state[key] = value
  db.set('uiState', state)
}
