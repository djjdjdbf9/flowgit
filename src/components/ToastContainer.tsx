import React, { useEffect } from 'react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}

export interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

const TYPE_CONFIG: Record<string, { border: string; symbol: string; text: string }> = {
  success: { border: '#4caf50', symbol: '✓', text: '#4caf50' },
  error: { border: '#da5c2c', symbol: '✗', text: '#da5c2c' },
  info: { border: '#61afef', symbol: 'i', text: '#61afef' },
  warning: { border: '#e5c07b', symbol: '!', text: '#e5c07b' },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const duration = toast.duration ?? 4000
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  const config = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.info

  return (
    <div
      style={{
        background: '#191919',
        border: '1px solid #202020',
        borderLeft: `2px solid ${config.border}`,
        borderRadius: '2px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        minWidth: '280px',
        maxWidth: '380px',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 12px 0px',
        fontFamily: 'var(--font-mono, monospace)',
        animation: 'flowgit-toast-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <span
        style={{
          color: config.text,
          fontSize: '13px',
          fontWeight: 700,
          flexShrink: 0,
          lineHeight: '18px',
        }}
      >
        [{config.symbol}]
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: '#eeeeee',
            fontSize: '13px',
            fontWeight: 700,
            lineHeight: '18px',
          }}
        >
          {toast.title}
        </div>
        {toast.message && (
          <div
            style={{
              color: '#b4b4b4',
              fontSize: '12px',
              marginTop: '4px',
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}
          >
            {toast.message}
          </div>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: '#606060',
          cursor: 'pointer',
          fontSize: '16px',
          lineHeight: '18px',
          padding: '0 2px',
          flexShrink: 0,
        }}
        title="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <>
      <style>{`
        @keyframes flowgit-toast-in {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 99999,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={toast} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
    </>
  )
}

export default ToastContainer
