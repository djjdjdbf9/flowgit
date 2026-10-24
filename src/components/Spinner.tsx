import React from 'react'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | number
  color?: string
  className?: string
  style?: React.CSSProperties
  label?: string
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = '#da5c2c',
  className = '',
  style,
  label,
}) => {
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 14
      : size === 'lg'
      ? 32
      : 20

  const strokeWidth = pixelSize <= 16 ? 2 : 2.5

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-mono, monospace)',
        ...style,
      }}
      className={`flowgit-spinner ${className}`}
    >
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: 'flowgit-spin 0.75s linear infinite',
          flexShrink: 0,
        }}
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeOpacity="0.2"
        />
        <path
          d="M12 3C7.02944 3 3 7.02944 3 12"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="square"
        />
      </svg>
      {label && (
        <span style={{ fontSize: '12px', color: '#b4b4b4' }}>
          {label}
        </span>
      )}
    </div>
  )
}

export default Spinner
