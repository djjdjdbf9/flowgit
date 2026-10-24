import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { registerGitIpc } from './ipc/git.ipc'
import { registerRepoIpc } from './ipc/repo.ipc'
import { registerSettingsIpc } from './ipc/settings.ipc'
import { registerProviderIpc } from './ipc/provider.ipc'
import { registerTerminalIpc } from './ipc/terminal.ipc'
import { initDatabase } from './persistence/database'
import { getSettings } from './settings/settings-store'
import { createLogger } from './logger'
import { IPC } from '../shared/constants'

const logger = createLogger('main')

let mainWindow: BrowserWindow | null = null

function createWindow(): BrowserWindow {
  const settings = getSettings()

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    frame: false, // We use custom title bar
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#000000',
      symbolColor: '#eeeeee',
      height: 40
    },
    backgroundColor: '#000000',
    icon: join(__dirname, '../../resources/icon.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false, // Required for Node.js APIs in preload
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: false,
      spellcheck: false,
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
    if (is.dev) {
      mainWindow!.webContents.openDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Open external URLs in system browser, not in app
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Security: prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const appUrl = is.dev ? 'http://localhost:5173' : `file://`
    if (!url.startsWith(appUrl)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// Register global IPC handlers
function registerIpcHandlers(): void {
  // App info
  ipcMain.handle(IPC.APP_VERSION, () => app.getVersion())

  // Window controls
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })
  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false
  })

  // File/directory dialogs
  ipcMain.handle(IPC.DIALOG_OPEN_DIR, async (_, options?: { title?: string }) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: options?.title ?? 'Select Directory',
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // Shell
  ipcMain.handle(IPC.SHELL_OPEN, async (_, path: string) => {
    await shell.openPath(path)
  })

  // Register domain-specific IPC
  registerGitIpc()
  registerRepoIpc()
  registerSettingsIpc()
  registerProviderIpc()
  registerTerminalIpc()
}

app.whenReady().then(async () => {
  logger.info('FlowGit starting up')

  // Initialize persistence
  await initDatabase()

  // Register all IPC handlers
  registerIpcHandlers()

  // Create the main window
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  logger.info('FlowGit shutting down')
})
