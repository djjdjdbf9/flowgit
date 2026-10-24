import React, { useEffect } from 'react'
import Button from './Button'

export interface ConfirmModalProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#191919',
          border: `1px solid ${isDangerous ? '#da5c2c' : '#202020'}`,
          borderRadius: '2px',
          padding: '24px',
          width: '420px',
          maxWidth: '100%',
          fontFamily: 'var(--font-mono, monospace)',
          boxShadow: 'rgba(0, 0, 0, 0.5) 0px 8px 24px 0px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            color: isDangerous ? '#da5c2c' : '#eeeeee',
            fontSize: '16px',
            fontWeight: 700,
            marginBottom: '12px',
            letterSpacing: '0.02em',
          }}
        >
          {title}
        </div>
        <p
          style={{
            color: '#b4b4b4',
            fontSize: '13px',
            lineHeight: 1.6,
            marginBottom: '24px',
            wordBreak: 'break-word',
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="md" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={isDangerous ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            showArrow
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
