import type { FlowGitApi } from '@shared/types/ipc.types'

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag'
  }
}

declare global {
  interface Window {
    flowgit: FlowGitApi
  }
}
