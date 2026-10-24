import React from 'react'

export interface TagProps {
  label: string
  variant?: 'branch' | 'tag' | 'remote' | 'head' | 'default' | 'stash'
  color?: string
  icon?: React.ReactNode
  size?: 'sm' | 'md'
  onRemove?: () => void
  className?: string
  style?: React.CSSProperties
}

export const Tag: React.FC<TagProps> = ({
  label,
  variant = 'default',
  color,
  icon,
  size = 'sm',
  onRemove,
  className = '',
  style,
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'head':
        return {
          background: 'rgba(218, 92, 44, 0.15)',
          color: '#da5c2c',
          border: '1px solid #da5c2c',
        }
      case 'branch':
        return {
          background: '#141c24',
          color: '#61afef',
          border: '1px solid #1e2c3a',
        }
      case 'tag':
        return {
          background: '#242114',
          color: '#e5c07b',
          border: '1px solid #3d351e',
        }
      case 'remote':
        return {
          background: '#191919',
          color: '#b4b4b4',
          border: '1px solid #3a3a3a',
        }
      case 'stash':
        return {
          background: '#1a1924',
          color: '#c678dd',
          border: '1px solid #2e2a42',
        }
      default:
        return {
          background: '#191919',
          color: '#d9d9d9',
          border: '1px solid #202020',
        }
    }
  }

  const isSmall = size === 'sm'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: isSmall ? '1px 8px' : '3px 10px',
        borderRadius: '9999px',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: isSmall ? '11px' : '12px',
        fontWeight: variant === 'head' ? 700 : 400,
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
        userSelect: 'none',
        ...(color
          ? {
              background: `${color}18`,
              color: color,
              border: `1px solid ${color}40`,
            }
          : getVariantStyles()),
        ...style,
      }}
      className={`flowgit-tag ${className}`}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: 0,
            marginLeft: '2px',
            fontSize: '11px',
            lineHeight: 1,
            opacity: 0.7,
          }}
        >
          ×
        </button>
      )}
    </span>
  )
}

export default Tag
