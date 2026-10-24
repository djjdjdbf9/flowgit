import { ipcMain, BrowserWindow } from 'electron'
import { IPC } from '../../shared/constants'
import { spawn, ChildProcess } from 'child_process'
import { randomUUID } from 'crypto'
import { createLogger } from '../logger'

const logger = createLogger('ipc:terminal')

const terminals = new Map<string, ChildProcess>()

export function registerTerminalIpc(): void {
  ipcMain.handle(IPC.TERMINAL_CREATE, async (event, repoPath: string) => {
    const id = randomUUID()

    // Determine shell
    const shell = process.env.COMSPEC ?? 'cmd.exe'

    const proc = spawn(shell, [], {
      cwd: repoPath,
      env: { ...process.env },
      windowsHide: false,
    })

    terminals.set(id, proc)

    const window = BrowserWindow.fromWebContents(event.sender)

    proc.stdout?.on('data', (data: Buffer) => {
      window?.webContents.send(IPC.TERMINAL_DATA + ':' + id, data.toString())
    })

    proc.stderr?.on('data', (data: Buffer) => {
      window?.webContents.send(IPC.TERMINAL_DATA + ':' + id, data.toString())
    })

    proc.on('exit', () => {
      terminals.delete(id)
      window?.webContents.send(IPC.TERMINAL_DATA + ':' + id, '\r\n[Process exited]\r\n')
    })

    return id
  })

  ipcMain.on(IPC.TERMINAL_INPUT, (_, id: string, data: string) => {
    const proc = terminals.get(id)
    if (proc?.stdin) {
      proc.stdin.write(data)
    }
  })

  ipcMain.on(IPC.TERMINAL_RESIZE, (_event, _id: string, _cols: number, _rows: number) => {
    // PTY resize would require node-pty; basic terminal doesn't support this
  })

  ipcMain.on(IPC.TERMINAL_DESTROY, (_, id: string) => {
    const proc = terminals.get(id)
    if (proc) {
      proc.kill()
      terminals.delete(id)
    }
  })
}
