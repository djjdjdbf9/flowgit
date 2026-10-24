import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useUiStore } from '../../../store/ui.store'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import Spinner from '../../../components/Spinner'
import Tag from '../../../components/Tag'
import FileStatusIcon from '../../../components/FileStatusIcon'
import type { GraphData, GraphNode, GraphEdge, CommitDetail, CommitFile } from '@shared/types/git.types'

export interface GraphViewProps {
  repoPath: string
}

const NODE_WIDTH = 240
const NODE_HEIGHT = 80
const COL_WIDTH = 280
const ROW_HEIGHT = 120
const PADDING = 80

export const GraphView: React.FC<GraphViewProps> = ({ repoPath }) => {
  const { showToast, openConfirmModal } = useUiStore()

  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedHash, setSelectedHash] = useState<string | null>(null)
  const [commitDetail, setCommitDetail] = useState<CommitDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Pan and Zoom
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 50, y: 50 })
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load graph data
  const loadGraph = useCallback(async () => {
    if (!repoPath) return
    setLoading(true)
    try {
      const res = await window.flowgit.history.graph(repoPath, { limit: 300 })
      if (res.success && res.data) {
        const data = res.data as GraphData
        setGraphData(data)
        // Select HEAD if present
        const headNode = data.nodes.find((n) => n.isHead)
        if (headNode) {
          setSelectedHash(headNode.hash)
        } else if (data.nodes.length > 0) {
          setSelectedHash(data.nodes[0].hash)
        }
      } else {
        showToast({ type: 'error', title: 'Cannot load graph', message: res.error })
      }
    } catch (e: unknown) {
      showToast({
        type: 'error',
        title: 'Error loading graph',
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoading(false)
    }
  }, [repoPath, showToast])

  useEffect(() => {
    loadGraph()
  }, [loadGraph])

  // Fetch commit details when selectedHash changes
  useEffect(() => {
    if (!selectedHash || !repoPath) {
      setCommitDetail(null)
      return
    }

    let isMounted = true
    setLoadingDetail(true)
    window.flowgit.history
      .getCommit(repoPath, selectedHash)
      .then((res) => {
        if (!isMounted) return
        if (res.success && res.data) {
          setCommitDetail(res.data as CommitDetail)
        }
      })
      .catch((e: unknown) => {
        if (!isMounted) return
        showToast({
          type: 'error',
          title: 'Error loading commit details',
          message: e instanceof Error ? e.message : String(e),
        })
      })
      .finally(() => {
        if (isMounted) setLoadingDetail(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedHash, repoPath, showToast])

  // Node position map
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode & { x: number; y: number }>()
    if (!graphData) return map
    for (const node of graphData.nodes) {
      const x = PADDING + (node.column ?? 0) * COL_WIDTH
      const y = PADDING + (node.row ?? 0) * ROW_HEIGHT
      map.set(node.hash, { ...node, x, y })
    }
    return map
  }, [graphData])

  // Filtered nodes by search query
  const matchingNodeHashes = useMemo(() => {
    if (!searchQuery.trim() || !graphData) return null
    const query = searchQuery.toLowerCase()
    const matches = new Set<string>()
    for (const node of graphData.nodes) {
      if (
        node.message.toLowerCase().includes(query) ||
        node.author.toLowerCase().includes(query) ||
        node.shortHash.toLowerCase().includes(query) ||
        node.refs.some((r) => r.toLowerCase().includes(query))
      ) {
        matches.add(node.hash)
      }
    }
    return matches
  }, [graphData, searchQuery])

  // Pan by dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Left click only
    // If clicked on canvas background
    const target = e.target as HTMLElement
    if (target.tagName === 'svg' || target.getAttribute('data-canvas-bg') === 'true') {
      isDraggingRef.current = true
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    })
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  // Zoom with wheel (0.25x to 3x)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
    const newZoom = Math.min(3, Math.max(0.25, zoom * zoomFactor))

    // Zoom toward cursor point
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom)
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom)
      setZoom(newZoom)
      setPan({ x: newPanX, y: newPanY })
    } else {
      setZoom(newZoom)
    }
  }

  // Jump to HEAD
  const handleJumpToHead = () => {
    if (!graphData) return
    const head = graphData.nodes.find((n) => n.isHead) ?? graphData.nodes[0]
    if (!head) return
    zoomToNode(head.hash)
  }

  // Fit to view
  const handleFitToView = () => {
    if (!graphData || !containerRef.current || graphData.nodes.length === 0) return
    const rect = containerRef.current.getBoundingClientRect()
    const totalCols = Math.max(1, graphData.columns || 1)
    const totalRows = Math.max(1, Math.min(graphData.totalRows || 1, 20)) // fit initial window
    const contentW = PADDING * 2 + totalCols * COL_WIDTH
    const contentH = PADDING * 2 + totalRows * ROW_HEIGHT

    const scaleX = rect.width / contentW
    const scaleY = rect.height / contentH
    const newScale = Math.min(1.2, Math.max(0.35, Math.min(scaleX, scaleY)))

    setZoom(newScale)
    setPan({ x: 40, y: 40 })
  }

  // Zoom to specific node
  const zoomToNode = (hash: string) => {
    const node = nodeMap.get(hash)
    if (!node || !containerRef.current) return
    setSelectedHash(hash)
    const rect = containerRef.current.getBoundingClientRect()
    const targetX = rect.width / 2 - (node.x + NODE_WIDTH / 2) * zoom
    const targetY = rect.height / 2 - (node.y + NODE_HEIGHT / 2) * zoom
    setPan({ x: targetX, y: targetY })
  }

  // Action handlers
  const handleCherryPick = async () => {
    if (!selectedHash) return
    openConfirmModal({
      title: 'Cherry-pick Node',
      message: `Apply commit ${selectedHash.substring(0, 7)} onto current HEAD?`,
      confirmText: 'Cherry-pick',
      onConfirm: async () => {
        try {
          const res = await window.flowgit.commit.cherryPick(repoPath, selectedHash)
          if (res.success) {
            showToast({ type: 'success', title: 'Cherry-pick complete' })
            loadGraph()
          } else {
            showToast({ type: 'error', title: 'Cherry-pick failed', message: res.error })
          }
        } catch (e: unknown) {
          showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
        }
      },
    })
  }

  const handleCheckout = () => {
    if (!selectedHash) return
    openConfirmModal({
      title: 'Checkout Commit',
      message: `Checkout commit ${selectedHash.substring(0, 7)}? This will detach HEAD.`,
      confirmText: 'Checkout',
      onConfirm: async () => {
        try {
          const res = await window.flowgit.branch.switch(repoPath, selectedHash)
          if (res.success) {
            showToast({ type: 'info', title: 'Switched to commit', message: selectedHash.substring(0, 7) })
            loadGraph()
          } else {
            showToast({ type: 'error', title: 'Checkout failed', message: res.error })
          }
        } catch (e: unknown) {
          showToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : String(e) })
        }
      },
    })
  }

  // Minimap calculations
  const minimapNodes = useMemo(() => {
    if (!graphData || graphData.nodes.length === 0) return []
    const totalW = Math.max(1, (graphData.columns + 1) * COL_WIDTH)
    const totalH = Math.max(1, (graphData.totalRows + 1) * ROW_HEIGHT)
    const scaleX = 100 / totalW
    const scaleY = 80 / totalH

    return graphData.nodes.map((n) => {
      const pos = nodeMap.get(n.hash)
      return {
        hash: n.hash,
        x: (pos?.x ?? 0) * scaleX,
        y: (pos?.y ?? 0) * scaleY,
        color: n.color || '#da5c2c',
        isHead: n.isHead,
        isSelected: n.hash === selectedHash,
      }
    })
  }, [graphData, nodeMap, selectedHash])

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: '#000000',
        fontFamily: 'var(--font-mono, monospace)',
        position: 'relative',
      }}
    >
      {/* ── Main Canvas Workspace ── */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          cursor: isDraggingRef.current ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Top Control Bar */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '16px',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(17, 17, 17, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #202020',
            borderRadius: '2px',
            padding: '6px 10px',
          }}
        >
          <Input
            placeholder="Search commits…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: '11px', padding: '4px 8px', width: '160px' }}
          />

          <Button variant="ghost" size="sm" onClick={handleJumpToHead} title="Jump to HEAD">
            HEAD
          </Button>

          <Button variant="ghost" size="sm" onClick={handleFitToView} title="Fit to screen">
            Fit
          </Button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderLeft: '1px solid #202020',
              paddingLeft: '6px',
            }}
          >
            <button
              onClick={() => setZoom((z) => Math.max(0.25, z - 0.15))}
              style={toolIconBtn}
              title="Zoom Out"
            >
              -
            </button>
            <span style={{ fontSize: '11px', color: '#b4b4b4', minWidth: '36px', textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.15))}
              style={toolIconBtn}
              title="Zoom In"
            >
              +
            </button>
          </div>

          {loading && <Spinner size="sm" />}
        </div>

        {/* SVG Canvas */}
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ display: 'block', background: '#000000' }}
        >
          <defs>
            {/* Dot Grid Pattern (dots at 20px intervals in #191919) */}
            <pattern
              id="blueprintGrid"
              width={20 * zoom}
              height={20 * zoom}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${pan.x}, ${pan.y})`}
            >
              <circle cx={10 * zoom} cy={10 * zoom} r={1} fill="#191919" />
            </pattern>

            {/* Arrowhead marker */}
            <marker
              id="arrowhead"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 6 3, 0 6" fill="#da5c2c" />
            </marker>
          </defs>

          {/* Background dot grid rect */}
          <rect
            data-canvas-bg="true"
            width="100%"
            height="100%"
            fill="url(#blueprintGrid)"
          />

          {/* Scaled/Panned Graph Container */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* ── Edges / Connections ── */}
            {graphData?.edges.map((edge: GraphEdge, idx: number) => {
              const src = nodeMap.get(edge.from)
              const dst = nodeMap.get(edge.to)
              if (!src || !dst) return null

              // Coordinates from bottom-center of src to top-center of dst
              const x1 = src.x + NODE_WIDTH / 2
              const y1 = src.y + NODE_HEIGHT
              const x2 = dst.x + NODE_WIDTH / 2
              const y2 = dst.y

              // Bezier curve
              const dy = y2 - y1
              const path = `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.5}, ${x2} ${y1 + dy * 0.5}, ${x2} ${y2}`

              const strokeColor = edge.color || '#3a3a3a'

              return (
                <path
                  key={`edge-${idx}`}
                  d={path}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={2}
                  strokeOpacity={0.8}
                />
              )
            })}

            {/* ── Nodes ── */}
            {graphData?.nodes.map((node: GraphNode) => {
              const pos = nodeMap.get(node.hash)
              if (!pos) return null

              const isSelected = selectedHash === node.hash
              const isMatch = matchingNodeHashes ? matchingNodeHashes.has(node.hash) : true

              return (
                <g
                  key={node.hash}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedHash(node.hash)}
                  onDoubleClick={() => zoomToNode(node.hash)}
                  style={{ cursor: 'pointer', opacity: isMatch ? 1 : 0.3 }}
                >
                  {/* Node Background Box */}
                  <rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={2}
                    ry={2}
                    fill={isSelected ? '#191919' : '#111111'}
                    stroke={isSelected ? '#da5c2c' : '#202020'}
                    strokeWidth={1}
                  />

                  {/* Left accent border for selected node */}
                  {isSelected && (
                    <rect
                      x={0}
                      y={0}
                      width={2}
                      height={NODE_HEIGHT}
                      fill="#da5c2c"
                    />
                  )}

                  {/* Top Header Strip */}
                  <rect
                    x={isSelected ? 2 : 0}
                    y={0}
                    width={isSelected ? NODE_WIDTH - 2 : NODE_WIDTH}
                    height={24}
                    fill="#161616"
                  />

                  {/* Branch Color Accent Bar */}
                  <rect
                    x={isSelected ? 2 : 0}
                    y={0}
                    width={3}
                    height={24}
                    fill={node.color || '#da5c2c'}
                  />

                  {/* Short Hash */}
                  <text
                    x={10}
                    y={16}
                    fill="#da5c2c"
                    fontSize={11}
                    fontWeight={700}
                    fontFamily="var(--font-mono, monospace)"
                  >
                    {node.shortHash}
                  </text>

                  {/* HEAD Badge */}
                  {node.isHead && (
                    <g transform="translate(70, 4)">
                      <rect
                        width={36}
                        height={16}
                        rx={1}
                        fill="#da5c2c"
                      />
                      <text
                        x={18}
                        y={12}
                        fill="#ffffff"
                        fontSize={9}
                        fontWeight={700}
                        textAnchor="middle"
                        fontFamily="var(--font-mono, monospace)"
                      >
                        HEAD
                      </text>
                    </g>
                  )}

                  {/* Refs / Branch Tags on Right */}
                  {node.refs && node.refs.length > 0 && (
                    <g transform={`translate(${NODE_WIDTH - 8}, 16)`}>
                      <text
                        x={0}
                        y={0}
                        fill="#61afef"
                        fontSize={10}
                        textAnchor="end"
                        fontFamily="var(--font-mono, monospace)"
                      >
                        {node.refs[0]}
                      </text>
                    </g>
                  )}

                  {/* Commit Message */}
                  <text
                    x={10}
                    y={44}
                    fill="#eeeeee"
                    fontSize={12}
                    fontWeight={400}
                    fontFamily="var(--font-mono, monospace)"
                  >
                    {node.message.length > 28
                      ? `${node.message.substring(0, 26)}…`
                      : node.message}
                  </text>

                  {/* Author + Date */}
                  <text
                    x={10}
                    y={66}
                    fill="#b4b4b4"
                    fontSize={10}
                    fontFamily="var(--font-mono, monospace)"
                  >
                    {node.author}
                  </text>

                  <text
                    x={NODE_WIDTH - 10}
                    y={66}
                    fill="#606060"
                    fontSize={10}
                    textAnchor="end"
                    fontFamily="var(--font-mono, monospace)"
                  >
                    {node.authorDate}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        {/* ── Minimap (Bottom-Right, 100x80px) ── */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: selectedHash ? '336px' : '16px', // adjust when detail panel is open
            width: '100px',
            height: '80px',
            background: '#111111',
            border: '1px solid #202020',
            borderRadius: '2px',
            overflow: 'hidden',
            zIndex: 30,
            pointerEvents: 'none',
          }}
        >
          <svg width="100" height="80">
            {minimapNodes.map((mn) => (
              <rect
                key={`mini-${mn.hash}`}
                x={Math.max(2, Math.min(94, mn.x))}
                y={Math.max(2, Math.min(74, mn.y))}
                width={mn.isSelected ? 5 : 3}
                height={mn.isSelected ? 5 : 3}
                fill={mn.isSelected ? '#ffffff' : mn.isHead ? '#da5c2c' : mn.color}
                opacity={mn.isSelected ? 1 : 0.7}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* ── Right Panel: Commit Details ── */}
      {selectedHash && (
        <div
          style={{
            width: '320px',
            background: '#111111',
            borderLeft: '1px solid #202020',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            height: '100%',
            overflowY: 'auto',
            padding: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#eeeeee', letterSpacing: '0.04em' }}>
              COMMIT DETAIL
            </span>
            <button
              onClick={() => setSelectedHash(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#606060',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px 6px',
              }}
            >
              ×
            </button>
          </div>

          {loadingDetail ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <Spinner size="sm" label="Loading…" />
            </div>
          ) : commitDetail ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ color: '#eeeeee', fontSize: '14px', fontWeight: 700, lineHeight: 1.4 }}>
                  {commitDetail.message}
                </div>
                {commitDetail.body && (
                  <div
                    style={{
                      color: '#b4b4b4',
                      fontSize: '12px',
                      lineHeight: 1.5,
                      marginTop: '6px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {commitDetail.body}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                <div style={{ color: '#7e7e7e' }}>
                  Author: <span style={{ color: '#eeeeee' }}>{commitDetail.author}</span>
                </div>
                <div style={{ color: '#7e7e7e' }}>
                  Date: <span style={{ color: '#b4b4b4' }}>{commitDetail.authorDate}</span>
                </div>
                <div style={{ color: '#7e7e7e' }}>
                  SHA:{' '}
                  <span
                    onClick={() => {
                      navigator.clipboard.writeText(commitDetail.hash)
                      showToast({ type: 'info', title: 'SHA copied' })
                    }}
                    style={{ color: '#da5c2c', cursor: 'pointer', textDecoration: 'underline' }}
                    title="Click to copy"
                  >
                    {commitDetail.hash.substring(0, 10)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                <Button variant="ghost" size="sm" onClick={handleCherryPick} style={{ flex: 1 }}>
                  Cherry-pick
                </Button>
                <Button variant="secondary" size="sm" onClick={handleCheckout} style={{ flex: 1 }}>
                  Checkout
                </Button>
              </div>

              {/* Changed files */}
              <div style={{ borderTop: '1px solid #202020', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', color: '#7e7e7e', marginBottom: '8px' }}>
                  FILES ({commitDetail.files?.length ?? 0})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {commitDetail.files?.map((f: CommitFile) => (
                    <div
                      key={f.path}
                      style={{
                        padding: '4px 6px',
                        background: '#161616',
                        borderRadius: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <FileStatusIcon status={f.status} />
                        <span
                          style={{
                            color: '#b4b4b4',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={f.path}
                        >
                          {f.path}
                        </span>
                      </div>
                      <span style={{ display: 'inline-flex', gap: '4px', flexShrink: 0, fontSize: '10px' }}>
                        {f.additions > 0 && <span style={{ color: '#4caf50' }}>+{f.additions}</span>}
                        {f.deletions > 0 && <span style={{ color: '#ef5350' }}>-{f.deletions}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

const toolIconBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#eeeeee',
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: '14px',
  cursor: 'pointer',
  padding: '0 4px',
}

export default GraphView
