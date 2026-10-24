import { execFile } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import { createLogger } from '../logger'

const logger = createLogger('git:detector')
const execFileAsync = promisify(execFile)

let cachedGitPath: string | null = null
let detectionDone = false

const COMMON_GIT_PATHS = [
  'C:\\Program Files\\Git\\bin\\git.exe',
  'C:\\Program Files\\Git\\cmd\\git.exe',
  'C:\\Program Files (x86)\\Git\\bin\\git.exe',
  'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
]

export interface GitDetectionResult {
  found: boolean
  path: string | null
  version: string | null
  error?: string
}

/**
 * Detect the Git executable. Checks:
 * 1. Cached result from previous detection
 * 2. Custom path from settings
 * 3. `git` on PATH
 * 4. Common Windows installation locations
 */
export async function detectGit(customPath?: string | null): Promise<GitDetectionResult> {
  // Try custom path first
  if (customPath) {
    if (existsSync(customPath)) {
      const version = await getGitVersion(customPath)
      if (version) {
        cachedGitPath = customPath
        detectionDone = true
        logger.info(`Git found at custom path: ${customPath} (${version})`)
        return { found: true, path: customPath, version }
      }
    }
    return { found: false, path: null, version: null, error: `Git not found at: ${customPath}` }
  }

  // Try PATH
  const pathVersion = await getGitVersion('git')
  if (pathVersion) {
    const resolvedPath = await resolveGitPath()
    cachedGitPath = resolvedPath ?? 'git'
    detectionDone = true
    logger.info(`Git found on PATH (${pathVersion})`)
    return { found: true, path: cachedGitPath, version: pathVersion }
  }

  // Try common Windows paths
  for (const gitPath of COMMON_GIT_PATHS) {
    if (existsSync(gitPath)) {
      const version = await getGitVersion(gitPath)
      if (version) {
        cachedGitPath = gitPath
        detectionDone = true
        logger.info(`Git found at: ${gitPath} (${version})`)
        return { found: true, path: gitPath, version }
      }
    }
  }

  logger.warn('Git not found on system')
  return {
    found: false,
    path: null,
    version: null,
    error: 'Git is not installed or not in PATH. Please install Git for Windows from https://git-scm.com/'
  }
}

async function getGitVersion(gitPath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(gitPath, ['--version'], {
      timeout: 5000,
      windowsHide: true,
    })
    const match = stdout.trim().match(/git version (.+)/)
    return match ? match[1] : stdout.trim()
  } catch {
    return null
  }
}

async function resolveGitPath(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('where', ['git'], {
      timeout: 3000,
      windowsHide: true,
    })
    const paths = stdout.trim().split('\r\n').filter(Boolean)
    return paths[0] ?? null
  } catch {
    return null
  }
}

/**
 * Get the cached Git executable path. Returns null if not yet detected.
 * Call detectGit() first.
 */
export function getGitExecutable(): string | null {
  return cachedGitPath ?? 'git'
}

/**
 * Set a custom Git path (called from settings).
 */
export function setGitPath(path: string | null): void {
  cachedGitPath = path
}
