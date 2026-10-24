import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'

export class JsonStore<T extends object> {
  private filePath: string
  private data: T

  constructor(name: string, defaults: T) {
    let dir = ''
    try {
      dir = app.getPath('userData')
    } catch {
      dir = join(process.cwd(), '.flowgit-data')
    }
    mkdirSync(dir, { recursive: true })
    this.filePath = join(dir, `${name}.json`)

    if (existsSync(this.filePath)) {
      try {
        const raw = readFileSync(this.filePath, 'utf8')
        this.data = { ...defaults, ...JSON.parse(raw) }
      } catch {
        this.data = { ...defaults }
      }
    } else {
      this.data = { ...defaults }
      this.save()
    }
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.data[key]
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.data[key] = value
    this.save()
  }

  getAll(): T {
    return { ...this.data }
  }

  private save(): void {
    try {
      writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8')
    } catch (err) {
      console.error(`Failed to write store to ${this.filePath}:`, err)
    }
  }
}
