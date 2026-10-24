import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants'
import { detectGit, setGitPath } from '../git/detector'
import { getSetting } from '../settings/settings-store'
import { createLogger } from '../logger'

const logger = createLogger('ipc:git')

export function registerGitIpc(): void {
  ipcMain.handle(IPC.GIT_DETECT, async () => {
    const customPath = getSetting('gitPath')
    return detectGit(customPath)
  })

  ipcMain.handle(IPC.GIT_VERSION, async () => {
    const result = await detectGit(getSetting('gitPath'))
    return result.version
  })
}
