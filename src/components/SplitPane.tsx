import React, { useState, useRef, useEffect, useCallback } from 'react'

export interface SplitPaneProps {
  direction?: 'horizontal' | 'vertical'
  initialSplit?: number // percentage (0 to 100) or pixels if > 100
  minSize?: number // pixels
  maxSize?: number // pixels
  first: React.ReactNode
  second: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onResize?: (size: number) => void
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  direction = 'horizontal',
  initialSplit = 50,
  minSize = 150,
  maxSize,
  first,
  second,
  className = '',
  style,
  onResize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isHorizontal = direction === 'horizontal'
  const [split, setSplit] = useState<number>(initialSplit)
  const isDraggingRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    setIsDragging(true)
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }, [isHorizontal])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      let newSize: number

      if (isHorizontal) {
        newSize = e.clientX - rect.left
      } else {
        newSize = e.clientY - rect.top
      }

      const totalSize = isHorizontal ? rect.width : rect.height
      if (newSize < minSize) newSize = minSize
      if (maxSize && newSize > maxSize) newSize = maxSize
      if (newSize > totalSize - minSize) newSize = totalSize - minSize

      setSplit(newSize)
      onResize?.(newSize)
    }

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        setIsDragging(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isHorizontal, minSize, maxSize, onResize])

  const firstPaneStyle: React.CSSProperties = isHorizontal
    ? typeof split === 'number' && split <= 100
      ? { width: `${split}%`, flexShrink: 0 }
      : { width: `${split}px`, flexShrink: 0 }
    : typeof split === 'number' && split <= 100
    ? { height: `${split}%`, flexShrink: 0 }
    : { height: `${split}px`, flexShrink: 0 }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
      className={`flowgit-split-pane ${className}`}
    >
      <div
        style={{
          ...firstPaneStyle,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {first}
      </div>

      {/* Divider */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          flexShrink: 0,
          background: isDragging ? '#da5c2c' : '#202020',
          cursor: isHorizontal ? 'col-resize' : 'row-resize',
          width: isHorizontal ? '4px' : '100%',
          height: isHorizontal ? '100%' : '4px',
          position: 'relative',
          zIndex: 10,
          transition: isDragging ? 'none' : 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!isDragging) e.currentTarget.style.backgroundColor = '#3a3a3a'
        }}
        onMouseLeave={(e) => {
          if (!isDragging) e.currentTarget.style.backgroundColor = '#202020'
        }}
      />

      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {second}
      </div>
    </div>
  )
}

export default SplitPane
