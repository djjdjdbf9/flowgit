import React from 'react'
import type { FileStatus } from '@shared/types/git.types'

export interface FileStatusIconProps {
  status: FileStatus | string
  className?: string
  style?: React.CSSProperties
  showTooltip?: boolean
}

export const FileStatusIcon: React.FC<FileStatusIconProps> = ({
  status,
  className = '',
  style,
  showTooltip = true,
}) => {
  const getStatusConfig = (
    st: string
  ): { char: string; color: string; label: string } => {
    switch (st.toLowerCase()) {
      case 'modified':
      case 'm':
        return { char: 'M', color: '#e5c07b', label: 'Modified' }
      case 'added':
      case 'a':
        return { char: 'A', color: '#4caf50', label: 'Added' }
      case 'deleted':
      case 'd':
        return { char: 'D', color: '#ef5350', label: 'Deleted' }
      case 'renamed':
      case 'r':
        return { char: 'R', color: '#61afef', label: 'Renamed' }
      case 'copied':
        return { char: 'C', color: '#61afef', label: 'Copied' }
      case 'untracked':
      case 'u':
      case '?':
        return { char: 'U', color: '#7e7e7e', label: 'Untracked' }
      case 'conflicted':
      case 'conflict':
      case 'c':
        return { char: 'C', color: '#da5c2c', label: 'Conflict' }
      case 'ignored':
        return { char: 'I', color: '#505050', label: 'Ignored' }
      default:
        return { char: '·', color: '#606060', label: st }
    }
  }

  const { char, color, label } = getStatusConfig(status)

  return (
    <span
      title={showTooltip ? label : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '11px',
        fontWeight: 700,
        color: color,
        width: '14px',
        height: '14px',
        lineHeight: 1,
        userSelect: 'none',
        ...style,
      }}
      className={`flowgit-file-status ${className}`}
    >
      {char}
    </span>
  )
}

export default FileStatusIcon
