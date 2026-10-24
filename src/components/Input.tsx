import React, { forwardRef, useState } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, style, className = '', disabled, ...props }, ref) => {
    const [focused, setFocused] = useState(false)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        {label && (
          <label
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '12px',
              color: '#b4b4b4',
              userSelect: 'none',
            }}
          >
            {label}
          </label>
        )}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            background: '#111111',
            border: `1px solid ${error ? '#ef5350' : focused ? '#da5c2c' : '#202020'}`,
            borderRadius: '2px',
            transition: 'border-color 0.15s ease',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {leftIcon && (
            <div
              style={{
                paddingLeft: '10px',
                display: 'flex',
                alignItems: 'center',
                color: '#606060',
              }}
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#eeeeee',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              padding: leftIcon || rightIcon ? '8px 10px' : '8px 12px',
              borderRadius: '2px',
              ...style,
            }}
            className={`flowgit-input ${className}`}
            onFocus={(e) => {
              setFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />
          {rightIcon && (
            <div
              style={{
                paddingRight: '10px',
                display: 'flex',
                alignItems: 'center',
                color: '#606060',
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              color: '#ef5350',
            }}
          >
            {error}
          </span>
        ) : helperText ? (
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              color: '#7e7e7e',
            }}
          >
            {helperText}
          </span>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
