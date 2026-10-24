import React, { useState, useRef } from 'react'

export interface TooltipProps {
  content: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  children: React.ReactElement
  className?: string
  style?: React.CSSProperties
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  delay = 200,
  children,
  className = '',
  style,
}) => {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<number | null>(null)

  const show = () => {
    timerRef.current = window.setTimeout(() => {
      setVisible(true)
    }, delay)
  }

  const hide = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setVisible(false)
  }

  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case 'bottom':
        return {
          top: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
        }
      case 'left':
        return {
          right: 'calc(100% + 6px)',
          top: '50%',
          transform: 'translateY(-50%)',
        }
      case 'right':
        return {
          left: 'calc(100% + 6px)',
          top: '50%',
          transform: 'translateY(-50%)',
        }
      case 'top':
      default:
        return {
          bottom: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
        }
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        ...style,
      }}
      className={`flowgit-tooltip-wrapper ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && content && (
        <div
          style={{
            position: 'absolute',
            zIndex: 9999,
            background: '#191919',
            border: '1px solid #202020',
            color: '#eeeeee',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: 'rgba(0, 0, 0, 0.4) 0px 4px 10px',
            ...getPositionStyles(),
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}

export default Tooltip
