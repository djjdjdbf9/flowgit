import { createLogger } from '../logger'
import { spawn, ChildProcess } from 'child_process'
import { getGitExecutable } from './detector'

const logger = createLogger('git:executor')

export interface GitResult {
  stdout: string
  stderr: string
  exitCode: number
}

export class GitError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number,
    public readonly stderr: string,
    public readonly command: string[]
  ) {
    super(message)
    this.name = 'GitError'
  }
}

export interface ExecOptions {
  cwd?: string
  env?: Record<string, string>
  signal?: AbortSignal
  timeout?: number // ms
  stdin?: string
}

/**
 * Execute a Git command safely using an argument array (never a shell string).
 * The gitExecutable and all arguments are passed as separate argv entries.
 */
export async function execGit(args: string[], options: ExecOptions = {}): Promise<GitResult> {
  const gitPath = getGitExecutable()
  if (!gitPath) {
    throw new GitError('Git executable not found', -1, '', args)
  }

  // Log sanitized command (no credentials)
  const sanitizedArgs = sanitizeArgs(args)
  logger.debug('git', sanitizedArgs.join(' '), options.cwd ? `in ${options.cwd}` : '')

  return new Promise<GitResult>((resolve, reject) => {
    let proc: ChildProcess | null = null
    let timedOut = false

    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      GIT_TERMINAL_PROMPT: '0', // Prevent interactive prompts
      GIT_ASKPASS: 'echo',       // Prevent credential pop-ups
      ...(options.env ?? {}),
    }

    try {
      proc = spawn(gitPath, args, {
        cwd: options.cwd,
        env,
        windowsHide: true,
      })
    } catch (err) {
      reject(new GitError(`Failed to spawn git: ${err}`, -1, '', args))
      return
    }

    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
    })

    proc.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
    })

    if (options.stdin && proc.stdin) {
      proc.stdin.write(options.stdin)
      proc.stdin.end()
    }

    const timeout = options.timeout
    let timer: NodeJS.Timeout | null = null
    if (timeout) {
      timer = setTimeout(() => {
        timedOut = true
        proc?.kill()
      }, timeout)
    }

    // Handle AbortSignal
    const abortHandler = (): void => {
      proc?.kill()
      reject(new GitError('Git operation aborted', -2, '', args))
    }
    options.signal?.addEventListener('abort', abortHandler)

    proc.on('close', (code) => {
      if (timer) clearTimeout(timer)
      options.signal?.removeEventListener('abort', abortHandler)

      if (options.signal?.aborted) {
        reject(new GitError('Git operation aborted', -2, '', args))
        return
      }

      if (timedOut) {
        reject(new GitError('Git operation timed out', -3, '', args))
        return
      }

      const exitCode = code ?? -1
      logger.debug(`git exit ${exitCode}${exitCode !== 0 ? ` stderr: ${stderr.slice(0, 200)}` : ''}`)

      resolve({ stdout, stderr, exitCode })
    })

    proc.on('error', (err) => {
      if (timer) clearTimeout(timer)
      reject(new GitError(`Git process error: ${err.message}`, -1, '', args))
    })
  })
}

/**
 * Execute git and throw if exit code is non-zero.
 */
export async function execGitOrThrow(args: string[], options: ExecOptions = {}): Promise<GitResult> {
  const result = await execGit(args, options)
  if (result.exitCode !== 0) {
    throw new GitError(
      `git ${args[0]} failed: ${result.stderr || result.stdout}`,
      result.exitCode,
      result.stderr,
      args
    )
  }
  return result
}

/**
 * Remove credential-bearing arguments from log output.
 * Redacts anything that looks like a URL with credentials (user:token@host).
 */
function sanitizeArgs(args: string[]): string[] {
  return args.map((arg) =>
    arg.replace(/\/\/[^@\s]+@/, '//***@')
  )
}
