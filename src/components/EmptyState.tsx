import React from 'react'
import Button from './Button'

export interface EmptyStateProps {
  symbol?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  actionIcon?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  symbol = '∅',
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className = '',
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        textAlign: 'center',
        fontFamily: 'var(--font-mono, monospace)',
        height: '100%',
        minHeight: '160px',
        ...style,
      }}
      className={`flowgit-empty-state ${className}`}
    >
      {symbol && (
        <div
          style={{
            fontSize: '28px',
            color: '#505050',
            marginBottom: '12px',
            userSelect: 'none',
            lineHeight: 1,
          }}
        >
          {symbol}
        </div>
      )}
      <div
        style={{
          color: '#eeeeee',
          fontSize: '13px',
          fontWeight: 700,
          marginBottom: description ? '6px' : '0px',
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </div>
      {description && (
        <div
          style={{
            color: '#7e7e7e',
            fontSize: '12px',
            maxWidth: '360px',
            lineHeight: 1.6,
            marginBottom: actionLabel ? '16px' : '0px',
          }}
        >
          {description}
        </div>
      )}
      {actionLabel && onAction && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAction}
          icon={actionIcon}
          showArrow
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
