import Store from 'electron-store'
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

const store = new Store<AppSettings>({
  name: 'settings',
  defaults,
  clearInvalidConfig: true,
})

export function getSettings(): AppSettings {
  return store.store
}

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return store.get(key)
}

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  store.set(key, value)
}
