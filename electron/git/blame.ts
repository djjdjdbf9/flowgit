import { execGitOrThrow } from './executor'
import type { BlameEntry } from '../../shared/types/git.types'
import { createLogger } from '../logger'

const logger = createLogger('git:blame')

export async function blameFile(
  repoPath: string,
  filePath: string,
  ref = 'HEAD'
): Promise<BlameEntry[]> {
  const result = await execGitOrThrow(
    ['blame', '--line-porcelain', ref, '--', filePath],
    { cwd: repoPath }
  )

  const entries: BlameEntry[] = []
  const lines = result.stdout.split('\n')
  let i = 0

  while (i < lines.length) {
    const headerLine = lines[i]
    if (!headerLine || headerLine.startsWith('\t')) { i++; continue }

    const headerMatch = headerLine.match(/^([0-9a-f]{40}) \d+ (\d+)(?: \d+)?$/)
    if (!headerMatch) { i++; continue }

    const hash = headerMatch[1]
    const lineNumber = parseInt(headerMatch[2], 10)

    i++

    let author = ''
    let authorEmail = ''
    let date = ''
    let message = ''

    while (i < lines.length && !lines[i].startsWith('\t')) {
      const metaLine = lines[i]
      if (metaLine.startsWith('author ')) author = metaLine.slice(7)
      else if (metaLine.startsWith('author-mail ')) authorEmail = metaLine.slice(12).replace(/[<>]/g, '')
      else if (metaLine.startsWith('author-time ')) date = new Date(parseInt(metaLine.slice(12), 10) * 1000).toISOString()
      else if (metaLine.startsWith('summary ')) message = metaLine.slice(8)
      i++
    }

    // The line content starts with \t
    const lineContent = lines[i]?.startsWith('\t') ? lines[i].slice(1) : ''
    i++

    entries.push({
      hash,
      shortHash: hash.slice(0, 7),
      author,
      authorEmail,
      date,
      message,
      lineNumber,
      lineContent,
    })
  }

  return entries
}
