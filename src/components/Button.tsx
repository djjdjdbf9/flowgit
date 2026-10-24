import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  showArrow?: boolean
  loading?: boolean
  icon?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  showArrow = false,
  loading = false,
  icon,
  children,
  disabled,
  style,
  className = '',
  ...props
}) => {
  const isDisabled = disabled || loading

  // Sizing definitions
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: '4px 10px',
      fontSize: '12px',
      height: '28px',
      gap: '6px',
    },
    md: {
      padding: '8px 16px',
      fontSize: '13px',
      height: '36px',
      gap: '8px',
    },
    lg: {
      padding: '10px 20px',
      fontSize: '14px',
      height: '42px',
      gap: '10px',
    },
  }

  // Variant definitions
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: '#da5c2c',
      color: '#eeeeee',
      border: '1px solid #da5c2c',
      fontWeight: 700,
    },
    ghost: {
      background: 'transparent',
      color: '#eeeeee',
      border: '1px solid #3a3a3a',
      fontWeight: 400,
    },
    secondary: {
      background: '#191919',
      color: '#eeeeee',
      border: '1px solid #202020',
      fontWeight: 400,
    },
    danger: {
      background: 'transparent',
      color: '#ef5350',
      border: '1px solid #ef5350',
      fontWeight: 700,
    },
  }

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono, monospace)',
    borderRadius: '2px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.6 : 1,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    transition: 'background-color 0.1s ease, border-color 0.1s ease, opacity 0.1s ease',
    outline: 'none',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  }

  return (
    <button
      {...props}
      disabled={isDisabled}
      style={baseStyle}
      className={`flowgit-btn ${className}`}
      onMouseEnter={(e) => {
        if (isDisabled) return
        if (variant === 'primary') {
          e.currentTarget.style.background = '#e66835'
          e.currentTarget.style.borderColor = '#e66835'
        } else if (variant === 'ghost') {
          e.currentTarget.style.background = '#191919'
          e.currentTarget.style.borderColor = '#505050'
        } else if (variant === 'secondary') {
          e.currentTarget.style.background = '#202020'
          e.currentTarget.style.borderColor = '#3a3a3a'
        } else if (variant === 'danger') {
          e.currentTarget.style.background = 'rgba(239, 83, 80, 0.1)'
        }
        props.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        if (isDisabled) return
        const def = variantStyles[variant]
        e.currentTarget.style.background = def.background as string
        e.currentTarget.style.borderColor = def.border ? (def.border as string).split(' ')[2] : 'transparent'
        props.onMouseLeave?.(e)
      }}
    >
      {loading ? (
        <span
          style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            border: '2px solid rgba(238, 238, 238, 0.3)',
            borderTopColor: '#eeeeee',
            borderRadius: '50%',
            animation: 'flowgit-spin 0.6s linear infinite',
            marginRight: children ? '6px' : 0,
          }}
        />
      ) : (
        icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      )}
      {children}
      {showArrow && !loading && (
        <span style={{ marginLeft: '4px', display: 'inline-block' }}>→</span>
      )}
    </button>
  )
}

export default Button
