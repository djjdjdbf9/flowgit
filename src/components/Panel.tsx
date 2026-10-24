import React from 'react'

export interface PanelProps {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  variant?: 'carbon' | 'graphite' | 'void'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  accentBorder?: boolean
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  actions,
  variant = 'carbon',
  padding = 'md',
  accentBorder = false,
  children,
  className = '',
  style,
  onClick,
}) => {
  const bgMap = {
    void: '#000000',
    carbon: '#111111',
    graphite: '#191919',
  }

  const paddingMap = {
    none: '0px',
    sm: '8px 12px',
    md: '16px',
    lg: '24px',
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: bgMap[variant],
        border: '1px solid #202020',
        borderLeft: accentBorder ? '2px solid #da5c2c' : '1px solid #202020',
        borderRadius: '2px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-mono, monospace)',
        overflow: 'hidden',
        ...style,
      }}
      className={`flowgit-panel ${className}`}
    >
      {(title || subtitle || actions) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderBottom: '1px solid #202020',
            background: variant === 'carbon' ? '#141414' : '#1c1c1c',
          }}
        >
          <div>
            {title && (
              <div
                style={{
                  color: '#eeeeee',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}
              >
                {title}
              </div>
            )}
            {subtitle && (
              <div
                style={{
                  color: '#7e7e7e',
                  fontSize: '11px',
                  marginTop: '2px',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{actions}</div>}
        </div>
      )}
      <div style={{ padding: paddingMap[padding], flex: 1, overflow: 'auto' }}>
        {children}
      </div>
    </div>
  )
}

export default Panel
