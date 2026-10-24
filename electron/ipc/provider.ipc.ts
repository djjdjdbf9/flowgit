import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants'
import { createLogger } from '../logger'

const logger = createLogger('ipc:provider')

// Provider IPC handlers — stub for Phase 5 (provider integrations)
export function registerProviderIpc(): void {
  ipcMain.handle(IPC.PROVIDER_LIST, () => {
    return { success: true, data: [] }
  })

  ipcMain.handle(IPC.PROVIDER_CONNECT, async (_, type: string, token: string, baseUrl?: string) => {
    // Phase 5: implement actual provider auth
    return { success: false, error: 'Provider connections coming in Phase 5' }
  })

  ipcMain.handle(IPC.PROVIDER_DISCONNECT, async (_, id: string) => {
    return { success: true, data: null }
  })

  ipcMain.handle(IPC.PROVIDER_REPOS, async (_, accountId: string) => {
    return { success: true, data: [] }
  })

  ipcMain.handle(IPC.PROVIDER_PRS, async () => {
    return { success: true, data: [] }
  })

  ipcMain.handle(IPC.PROVIDER_CREATE_PR, async () => {
    return { success: false, error: 'PR creation coming in Phase 5' }
  })
}
