import { ref, computed, nextTick } from 'vue'
import type { Ref } from 'vue'
import type { Edge, Node } from '@vue-flow/core'

export interface UseHistoryOptions {
  addNodes?: (nodes: Node[]) => void
  removeNodes?: (nodeIds: string[]) => void
  updateNode?: (id: string, updater: (node: Node) => Node | Partial<Node>) => void
  addEdges?: (edges: Edge[]) => void
  removeEdges?: (edgeIds: string[]) => void
  updateEdge?: (id: string, updater: (edge: Edge) => Edge | Partial<Edge>) => void
}

// Editor ManifestNode.vue actual render size 260×110 (including border, box-sizing: border-box)
// vue-flow computes Handle anchor centers from measured.width/height — this constant MUST match CSS
// Otherwise Top/Bottom handle horizontal centers / Left/Right handle vertical centers will misalign
export const MANIFEST_NODE_WIDTH = 260
export const MANIFEST_NODE_HEIGHT = 110

const DEFAULT_NODE_WIDTH = MANIFEST_NODE_WIDTH
const DEFAULT_NODE_HEIGHT = MANIFEST_NODE_HEIGHT

const ensureNodeShape = <T extends Node | Record<string, any>>(raw: T): Node => {
  const r = raw as any
  const position = (r.position && typeof r.position.x === 'number' && typeof r.position.y === 'number')
    ? { x: r.position.x, y: r.position.y }
    : { x: 0, y: 0 }

  const data = (r.data && typeof r.data === 'object') ? { ...r.data } : {}
  const dimensions = (r.dimensions && typeof r.dimensions.width === 'number' && typeof r.dimensions.height === 'number')
    ? { width: r.dimensions.width, height: r.dimensions.height }
    : { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT }

  const measuredRaw = r.measured
  let measured: { width: number; height: number }
  if (measuredRaw && typeof measuredRaw.width === 'number' && typeof measuredRaw.height === 'number') {
    measured = { width: measuredRaw.width, height: measuredRaw.height }
  } else {
    measured = dimensions
  }

  return {
    id: String(r.id || `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
    type: typeof r.type === 'string' ? r.type : 'default',
    position,
    data,
    dimensions,
    measured,
    width: typeof r.width === 'number' ? r.width : dimensions.width,
    height: typeof r.height === 'number' ? r.height : dimensions.height,
    selected: typeof r.selected === 'boolean' ? r.selected : false,
    dragging: typeof r.dragging === 'boolean' ? r.dragging : false,
    selectable: typeof r.selectable === 'boolean' ? r.selectable : true,
    connectable: typeof r.connectable === 'boolean' ? r.connectable : true,
    deletable: typeof r.deletable === 'boolean' ? r.deletable : true,
    draggable: typeof r.draggable === 'boolean' ? r.draggable : true,
    focusable: typeof r.focusable === 'boolean' ? r.focusable : true,
  } as Node
}

const normalizeNode = (n: any): Node => ensureNodeShape(n)

export function useHistory(
  nodes: Ref<Node[]>,
  edges: Ref<Edge[]>,
  setNodes?: (nodes: Node[]) => void,
  setEdges?: (edges: Edge[]) => void,
  options: UseHistoryOptions = {},
) {
  const state = {
    historyStack: [] as string[],
    historyIndex: -1,
  }
  const historyStack = ref<string[]>(state.historyStack)
  const historyIndex = ref<number>(state.historyIndex)
  const canUndo = computed<boolean>(() => historyIndex.value > 0)
  const canRedo = computed<boolean>(() =>
    historyIndex.value < (historyStack.value ? historyStack.value.length - 1 : -1),
  )

  let isApplyingSnapshot = false
  let lastDebounceTimer: ReturnType<typeof setTimeout> | null = null

  const syncRefsFromState = () => {
    if (historyStack) historyStack.value = state.historyStack
    if (historyIndex) historyIndex.value = state.historyIndex
  }

  const cloneSnapshot = (val: any) => {
    try {
      return JSON.parse(JSON.stringify(val))
    } catch {
      return val
    }
  }

  const equalsCurrentTop = (snapshot: string): boolean => {
    if (state.historyIndex < 0) return false
    return state.historyStack[state.historyIndex] === snapshot
  }

  const saveHistoryImmediate = () => {
    if (isApplyingSnapshot) return
    if (!nodes || typeof (nodes as any).value === 'undefined') return
    const snapshot = JSON.stringify({
      nodes: Array.isArray(nodes.value) ? nodes.value.map((n: Node) => ({
        id: n.id,
        type: n.type,
        position: cloneSnapshot(n.position),
        data: cloneSnapshot(n.data),
      })) : [],
      edges: Array.isArray(edges.value) ? edges.value.map((e: Edge) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        data: cloneSnapshot((e as any).data),
        animated: (e as any).animated,
        type: (e as any).type,
      })) : [],
    })
    if (equalsCurrentTop(snapshot)) return
    state.historyStack.splice(state.historyIndex + 1)
    state.historyStack.push(snapshot)
    state.historyIndex = state.historyStack.length - 1
    syncRefsFromState()
  }

  const saveHistory = (debounceMs = 0) => {
    if (isApplyingSnapshot) return
    if (lastDebounceTimer) {
      clearTimeout(lastDebounceTimer)
      lastDebounceTimer = null
    }
    if (debounceMs > 0) {
      lastDebounceTimer = setTimeout(() => {
        lastDebounceTimer = null
        try { saveHistoryImmediate() } catch (_) { /* ignore */ }
      }, debounceMs)
    } else {
      saveHistoryImmediate()
    }
  }

  const applyNodesSnapshot = (nextNodes: Node[]) => {
    const { addNodes, removeNodes, updateNode } = options
    const current = nodes.value || []
    const currentIds = new Set(current.map((n: Node) => n.id))
    const snapshotIds = new Set(nextNodes.map(n => n.id))

    const toRemoveIds = current.filter((n: Node) => !snapshotIds.has(n.id)).map((n: Node) => n.id)
    const toAdd = nextNodes
      .filter(n => !currentIds.has(n.id))
      .map(n => normalizeNode(n))
    const commonIds = nextNodes
      .filter(n => currentIds.has(n.id))
      .map(n => n.id)

    if (toRemoveIds.length) {
      if (removeNodes) {
        try { removeNodes(toRemoveIds) } catch (_) { /* ignore */ }
      } else if (setNodes) {
        setNodes(current.filter((n: Node) => snapshotIds.has(n.id)))
      }
    }

    if (toAdd.length) {
      if (addNodes) {
        try { addNodes(toAdd) } catch (_) { /* ignore */ }
      } else if (setNodes) {
        const byId = new Map((nodes.value || []).map((n: Node) => [n.id, n]))
        const merged: Node[] = []
        snapshotIds.forEach(id => {
          const snap = nextNodes.find(n => n.id === id)!
          if (byId.has(id)) merged.push(byId.get(id) as Node)
          else merged.push(normalizeNode(snap))
        })
        setNodes(merged)
      }
    }

    if (commonIds.length && updateNode) {
      const snapById = new Map(nextNodes.map(n => [n.id, n]))
      commonIds.forEach(id => {
        const snap = snapById.get(id)
        if (!snap) return
        try {
          updateNode(id, (node: Node) => {
            const existing = (node || {}) as any
            return {
              ...existing,
              id: existing.id ?? id,
              type: snap.type ?? existing.type ?? 'default',
              position: snap.position ? { ...snap.position } : (existing.position ?? { x: 0, y: 0 }),
              data: snap.data ? { ...snap.data } : (existing.data ?? {}),
              dimensions: existing.dimensions ?? { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
              measured: existing.measured ?? existing.dimensions ?? { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
              width: typeof existing.width === 'number' ? existing.width : DEFAULT_NODE_WIDTH,
              height: typeof existing.height === 'number' ? existing.height : DEFAULT_NODE_HEIGHT,
              selected: typeof existing.selected === 'boolean' ? existing.selected : false,
              dragging: typeof existing.dragging === 'boolean' ? existing.dragging : false,
              selectable: typeof existing.selectable === 'boolean' ? existing.selectable : true,
              connectable: typeof existing.connectable === 'boolean' ? existing.connectable : true,
              deletable: typeof existing.deletable === 'boolean' ? existing.deletable : true,
              draggable: typeof existing.draggable === 'boolean' ? existing.draggable : true,
              focusable: typeof existing.focusable === 'boolean' ? existing.focusable : true,
            }
          })
        } catch (_) { /* ignore */ }
      })
    } else if (commonIds.length && setNodes) {
      const byId = new Map((nodes.value || []).map((n: Node) => [n.id, n]))
      const merged: Node[] = nextNodes.map(snap => {
        const existing = byId.get(snap.id)
        if (!existing) return normalizeNode(snap)
        const e = (existing || {}) as any
        return {
          ...e,
          type: snap.type ?? e.type ?? 'default',
          position: snap.position ? { ...snap.position } : (e.position ?? { x: 0, y: 0 }),
          data: snap.data ? { ...snap.data } : (e.data ?? {}),
          dimensions: e.dimensions ?? { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
          measured: e.measured ?? e.dimensions ?? { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
          width: typeof e.width === 'number' ? e.width : DEFAULT_NODE_WIDTH,
          height: typeof e.height === 'number' ? e.height : DEFAULT_NODE_HEIGHT,
        } as Node
      })
      setNodes(merged)
    }
  }

  const applyEdgesSnapshot = (nextEdges: Edge[]) => {
    const { addEdges, removeEdges, updateEdge } = options
    const current = edges.value || []
    const currentIds = new Set(current.map((e: Edge) => e.id))
    const snapshotIds = new Set(nextEdges.map(e => e.id))

    const toRemoveIds = current.filter((e: Edge) => !snapshotIds.has(e.id)).map((e: Edge) => e.id)
    const toAdd = nextEdges.filter(e => !currentIds.has(e.id))
    const commonIds = nextEdges.filter(e => currentIds.has(e.id)).map(e => e.id)

    if (toRemoveIds.length) {
      if (removeEdges) {
        try { removeEdges(toRemoveIds) } catch (_) { /* ignore */ }
      } else if (setEdges) {
        setEdges(current.filter((e: Edge) => snapshotIds.has(e.id)))
      }
    }

    if (toAdd.length) {
      if (addEdges) {
        try { addEdges(toAdd) } catch (_) { /* ignore */ }
      } else if (setEdges) {
        const byId = new Map((edges.value || []).map((e: Edge) => [e.id, e]))
        const merged: Edge[] = []
        snapshotIds.forEach(id => {
          const snap = nextEdges.find(e => e.id === id)!
          if (byId.has(id)) merged.push(byId.get(id) as Edge)
          else merged.push(snap)
        })
        setEdges(merged)
      }
    }

    if (commonIds.length && updateEdge) {
      const snapById = new Map(nextEdges.map(e => [e.id, e]))
      commonIds.forEach(id => {
        const snap = snapById.get(id)
        if (!snap) return
        try {
          updateEdge(id, (edge: Edge) => ({
            ...edge,
            source: snap.source ?? edge.source,
            target: snap.target ?? edge.target,
            sourceHandle: snap.sourceHandle ?? edge.sourceHandle,
            targetHandle: snap.targetHandle ?? edge.targetHandle,
            type: (snap as any).type ?? (edge as any).type,
            animated: (snap as any).animated ?? (edge as any).animated,
            data: (snap as any).data ? { ...(snap as any).data } : (edge as any).data,
          }))
        } catch (_) { /* ignore */ }
      })
    } else if (commonIds.length && setEdges) {
      const byId = new Map((edges.value || []).map((e: Edge) => [e.id, e]))
      const merged: Edge[] = nextEdges.map(snap => {
        const existing = byId.get(snap.id)
        if (!existing) return snap
        return {
          ...existing,
          source: snap.source ?? (existing as any).source,
          target: snap.target ?? (existing as any).target,
          sourceHandle: snap.sourceHandle ?? (existing as any).sourceHandle,
          targetHandle: snap.targetHandle ?? (existing as any).targetHandle,
          type: (snap as any).type ?? (existing as any).type,
          animated: (snap as any).animated ?? (existing as any).animated,
          data: (snap as any).data ? { ...(snap as any).data } : (existing as any).data,
        } as Edge
      })
      setEdges(merged)
    }
  }

  const applySnapshot = (raw: string) => {
    isApplyingSnapshot = true
    try {
      const snapshot = JSON.parse(raw)
      const currNodes: Node[] = Array.isArray(nodes.value) ? nodes.value : []
      const currDimById = new Map<string, { dimensions: any; measured: any; width: number; height: number }>()
      currNodes.forEach((n: Node) => {
        const a = (n as any)
        const dimensions = (a.dimensions && typeof a.dimensions.width === 'number')
          ? { width: a.dimensions.width, height: a.dimensions.height }
          : null
        const measured = (a.measured && typeof a.measured.width === 'number')
          ? { width: a.measured.width, height: a.measured.height }
          : null
        currDimById.set(n.id, {
          dimensions: dimensions || { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
          measured: measured || dimensions || { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
          width: typeof a.width === 'number' ? a.width : (dimensions?.width || DEFAULT_NODE_WIDTH),
          height: typeof a.height === 'number' ? a.height : (dimensions?.height || DEFAULT_NODE_HEIGHT),
        })
      })

      const nextNodes: Node[] = (snapshot.nodes || []).map((n: any) => {
        const baseId = String(n.id || '')
        const saved = baseId ? currDimById.get(baseId) : null
        const dim = saved?.dimensions || { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT }
        const meas = saved?.measured || dim
        const raw = {
          id: baseId || `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: typeof n.type === 'string' ? n.type : 'manifest',
          position: (n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number')
            ? { x: n.position.x, y: n.position.y }
            : { x: 0, y: 0 },
          data: (n.data && typeof n.data === 'object') ? { ...n.data } : {},
          dimensions: dim,
          measured: meas,
          width: saved?.width ?? dim.width,
          height: saved?.height ?? dim.height,
          selected: false,
          dragging: false,
          selectable: true,
          connectable: true,
          deletable: true,
          draggable: true,
          focusable: true,
        }
        return raw as Node
      })

      const nextEdges: Edge[] = (snapshot.edges || []).map((e: any) => ({
        id: String(e.id || `edge_${e.source}_${e.target}_${Math.random().toString(36).slice(2, 6)}`),
        source: String(e.source || ''),
        target: String(e.target || ''),
        sourceHandle: typeof e.sourceHandle === 'string' ? e.sourceHandle : undefined,
        targetHandle: typeof e.targetHandle === 'string' ? e.targetHandle : undefined,
        type: typeof e.type === 'string' ? e.type : 'default',
        animated: typeof e.animated === 'boolean' ? e.animated : true,
        data: (e.data && typeof e.data === 'object') ? { ...e.data } : undefined,
      } as Edge))

      try {
        if (setNodes) setNodes(nextNodes)
        else (nodes as any).value = nextNodes
      } catch (e) {
        console.error('[useHistory.applySnapshot] setNodes 失败:', e)
        try { (nodes as any).value = nextNodes } catch (_) { /* ignore */ }
      }
      try {
        if (setEdges) setEdges(nextEdges)
        else (edges as any).value = nextEdges
      } catch (e) {
        console.error('[useHistory.applySnapshot] setEdges 失败:', e)
        try { (edges as any).value = nextEdges } catch (_) { /* ignore */ }
      }
    } catch (e) {
      console.error('[useHistory.applySnapshot] 快照解析/应用失败:', e)
    } finally {
      nextTick(() => {
        setTimeout(() => { isApplyingSnapshot = false }, 0)
      })
    }
  }

  const undo = () => {
    try {
      if (!state.historyStack || state.historyIndex <= 0) return
      state.historyIndex--
      syncRefsFromState()
      applySnapshot(state.historyStack[state.historyIndex])
    } catch (e) {
      console.error('[useHistory.undo] 失败:', e)
    }
  }

  const redo = () => {
    try {
      if (!state.historyStack || state.historyIndex >= state.historyStack.length - 1) return
      state.historyIndex++
      syncRefsFromState()
      applySnapshot(state.historyStack[state.historyIndex])
    } catch (e) {
      console.error('[useHistory.redo] 失败:', e)
    }
  }

  const resetHistory = () => {
    try {
      if (lastDebounceTimer) {
        clearTimeout(lastDebounceTimer)
        lastDebounceTimer = null
      }
      state.historyStack = []
      state.historyIndex = -1
      syncRefsFromState()
    } catch (e) {
      console.error('[useHistory.resetHistory] 失败:', e)
    }
  }

  return { historyStack, historyIndex, canUndo, canRedo, saveHistory, undo, redo, resetHistory, normalizeNode, applySnapshot }
}