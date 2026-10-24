import { JsonStore } from '../persistence/json-store'
import type { AppSettings } from '../../shared/types/ipc.types'

const defaults: AppSettings = {
  gitPath: null,
  theme: 'dark',
  diffLayout: 'split',
  preferredEditor: null,
  preferredTerminal: null,
  autoFetch: false,
  autoFetchInterval: 15,
  pullStrategy: 'merge',
  showHiddenFiles: false,
  confirmDestructive: true,
}

let store: JsonStore<AppSettings> | null = null

function getStore(): JsonStore<AppSettings> {
  if (!store) {
    store = new JsonStore<AppSettings>('settings', defaults)
  }
  return store
}

export function getSettings(): AppSettings {
  return getStore().getAll()
}

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return getStore().get(key)
}

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  getStore().set(key, value)
}
