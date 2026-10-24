import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants'
import { getSettings, getSetting, setSetting } from '../settings/settings-store'
import { setGitPath } from '../git/detector'
import { createLogger } from '../logger'
import type { AppSettings } from '../../shared/types/ipc.types'

const logger = createLogger('ipc:settings')

export function registerSettingsIpc(): void {
  ipcMain.handle(IPC.SETTINGS_GET, () => {
    return getSettings()
  })

  ipcMain.handle(IPC.SETTINGS_SET, (_, key: keyof AppSettings, value: unknown) => {
    try {
      // Type guard — validate the key exists
      const current = getSettings()
      if (!(key in current)) throw new Error(`Unknown setting: ${key}`)

      setSetting(key, value as AppSettings[typeof key])

      // Side effects for specific settings
      if (key === 'gitPath') {
        setGitPath(value as string | null)
      }

      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })
}
