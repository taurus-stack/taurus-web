import { nextTick } from 'vue'
import type { Ref } from 'vue'
import type { Edge, Node } from '@vue-flow/core'
import { ElMessage } from 'element-plus'
import { normalizeParamsByManifest, getNodeManifest } from '../manifest/registry'
import { translateManifest } from '../manifest/translate'
import { i18n } from '/@/i18n'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _rawT: any = i18n.global.t
const t = (key: string, def?: string): string => _rawT(key, def ?? '')

interface FlowVariable {
  key: string
  value: string
}

export function useDagOperations(
  nodes: Ref<Node[]>,
  edges: Ref<Edge[]>,
  addNodes: (nodes: Node[]) => void,
  addEdges: (edges: Edge[]) => void,
  fitView: (opts?: any) => void,
  saveHistory: (debounceMs?: number) => void,
  flowForm: {
    name: string
    desc: string
    variables: FlowVariable[]
  },
  setNodes?: (nodes: Node[]) => void,
  setEdges?: (edges: Edge[]) => void,
  resetHistory?: () => void,
) {
  /**
   * Assign globally unique display names to a batch of dagNodes (strict mode: no legacy duplicate tolerance).
   * Rules:
   *  - Do NOT strip numeric suffixes, do NOT fall back to root, do NOT 'fix' historical dirty data;
   *  - On name collision, **in original definition order**, simply increment from `2`: `${label} 2 / 3 / 4 ...`;
   *  - Also avoid labels of nodes already on the canvas (compatible with callers that don't clear nodes before loading).
   *
   * User requirement is clear: do NOT tolerate legacy nodes with identical labels — keep behavior simple and predictable.
   */
  const assignUniqueNodeLabels = (newNodeCandidates: Node[], currentNodes: Node[] = nodes.value || []): Node[] => {
    const taken = new Set<string>()
    for (const n of currentNodes) {
      const lbl = String((n as any)?.data?.label || n.id || '').trim()
      if (lbl) taken.add(lbl)
    }
    return newNodeCandidates.map((cand) => {
      const base = String((cand as any)?.data?.label || cand.id || t('duUnnamedNode')).trim() || t('duUnnamedNode')
      if (!taken.has(base)) {
        taken.add(base)
        return cand
      }
      // Strict mode: simply `${base} N` increment, no root/suffix parsing.
      let n = 2
      while (taken.has(`${base} ${n}`)) {
        n += 1
      }
      const nextLabel = `${base} ${n}`
      taken.add(nextLabel)
      return {
        ...cand,
        data: { ...((cand as any).data || {}), label: nextLabel },
      } as Node
    })
  }
  const autoLayout = () => {
    if (nodes.value.length === 0) return
    saveHistory()
    const nodeMap = new Map<string, Node>()
    nodes.value.forEach((n: Node) => nodeMap.set(n.id, { ...n, position: { ...n.position } }))

    const inDegree = new Map<string, number>()
    const outDegree = new Map<string, number>()
    const children = new Map<string, string[]>()
    const parents = new Map<string, string[]>()
    nodes.value.forEach((n: Node) => {
      inDegree.set(n.id, 0)
      outDegree.set(n.id, 0)
      children.set(n.id, [])
      parents.set(n.id, [])
    })
    edges.value.forEach((e: Edge) => {
      if (nodeMap.has(e.source) && nodeMap.has(e.target)) {
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1)
        outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1)
        children.get(e.source)!.push(e.target)
        parents.get(e.target)!.push(e.source)
      }
    })

    // --- ① Longest-path (critical path) layering: ensure sink (terminal) is always in the last column ---
    // Replaces original in-degree BFS to avoid intermediate nodes being incorrectly pushed up when 'path lengths differ'
    // Rule: L(u) = max(0, max{L(v) + 1 for v in preds(u)})
    const levels = new Map<string, number>()
    const indeg = new Map(inDegree)
    const order: string[] = []
    const q: string[] = nodes.value
      .filter((n: Node) => (indeg.get(n.id) || 0) === 0)
      .map((n: Node) => n.id)
    q.forEach((id) => levels.set(id, 0))
    while (q.length > 0) {
      const id = q.shift()!
      order.push(id)
      for (const c of children.get(id) || []) {
        const newLvl = Math.max(levels.get(c) || 0, (levels.get(id) || 0) + 1)
        levels.set(c, newLvl)
        indeg.set(c, (indeg.get(c) || 1) - 1)
        if (indeg.get(c) === 0) q.push(c)
      }
    }
    // Isolated nodes (no edges): fall back to level 0
    nodes.value.forEach((n: Node) => {
      if (!levels.has(n.id)) levels.set(n.id, 0)
    })

    // --- ② Group by layer ---
    const levelGroups = new Map<number, string[]>()
    nodes.value.forEach((n: Node) => {
      const lvl = levels.get(n.id) || 0
      if (!levelGroups.has(lvl)) levelGroups.set(lvl, [])
      levelGroups.get(lvl)!.push(n.id)
    })

    // --- ③ Stable intra-layer sort: start/end semantics > nodeType alphabetical > original order as tiebreaker ---
    const SORT_WEIGHT: Record<string, number> = {
      start: 0,
      wait: 1,
      noop: 2,
      condition: 3,
      loop: 4,
      approval: 5,
      command: 6,
      script: 7,
      program: 8,
      sub_workflow: 9,
      http: 10,
      http_callback: 11,
      email_notification: 12,
      webhook_notification: 13,
      file_op: 14,
      transform: 15,
      end: 9999,
    }
    const idxInOriginal = new Map<string, number>()
    nodes.value.forEach((n, i) => idxInOriginal.set(n.id, i))
    const getTypeOf = (id: string): string => {
      const n = nodeMap.get(id)
      if (!n) return ''
      return String((n.data?.config?.nodeType) || (n.data?.nodeType) || '')
    }
    const sortedLevels = [...levelGroups.keys()].sort((a, b) => a - b)
    sortedLevels.forEach((lvl) => {
      const group = levelGroups.get(lvl)!
      group.sort((a, b) => {
        const ta = getTypeOf(a)
        const tb = getTypeOf(b)
        const wa = SORT_WEIGHT[ta] ?? 500
        const wb = SORT_WEIGHT[tb] ?? 500
        if (wa !== wb) return wa - wb
        if (ta !== tb) return ta.localeCompare(tb)
        const ia = idxInOriginal.get(a) ?? 0
        const ib = idxInOriginal.get(b) ?? 0
        return ia - ib
      })
    })

    // --- ④ Cross-layer barycenter sweep (2 rounds) to reduce edge crossings: align y with parents as much as possible ---
    // First assign each group member initial index (0,1,2...), then reorder using average parent index
    for (let scan = 0; scan < 2; scan++) {
      // forward: top-down (layer 0 → max)
      for (let i = 1; i < sortedLevels.length; i++) {
        const lvl = sortedLevels[i]!
        const group = levelGroups.get(lvl)!
        const indexPrev = new Map<string, number>()
        levelGroups.get(sortedLevels[i - 1]!)!.forEach((id, k) => indexPrev.set(id, k))
        group.sort((a, b) => {
          const pAs = parents.get(a) || []
          const pBs = parents.get(b) || []
          const baryA = pAs.length === 0 ? -1 : pAs.reduce((s, p) => s + (indexPrev.get(p) ?? 0), 0) / pAs.length
          const baryB = pBs.length === 0 ? -1 : pBs.reduce((s, p) => s + (indexPrev.get(p) ?? 0), 0) / pBs.length
          if (baryA !== baryB) return baryA - baryB
          const ia = idxInOriginal.get(a) ?? 0
          const ib = idxInOriginal.get(b) ?? 0
          return ia - ib
        })
        group.forEach((id, k) => indexPrev.set(id, k))
      }
      // backward: bottom-up (align end's parent (wait) toward end to avoid overlap)
      for (let i = sortedLevels.length - 2; i >= 0; i--) {
        const lvl = sortedLevels[i]!
        const group = levelGroups.get(lvl)!
        const indexNext = new Map<string, number>()
        levelGroups.get(sortedLevels[i + 1]!)!.forEach((id, k) => indexNext.set(id, k))
        group.sort((a, b) => {
          const cAs = children.get(a) || []
          const cBs = children.get(b) || []
          const baryA = cAs.length === 0 ? -1 : cAs.reduce((s, c) => s + (indexNext.get(c) ?? 0), 0) / cAs.length
          const baryB = cBs.length === 0 ? -1 : cBs.reduce((s, c) => s + (indexNext.get(c) ?? 0), 0) / cBs.length
          if (baryA !== baryB) return baryA - baryB
          const ia = idxInOriginal.get(a) ?? 0
          const ib = idxInOriginal.get(b) ?? 0
          return ia - ib
        })
      }
    }

    // --- ⑤ Generate coordinates: xStep/yStep leave gap based on ManifestNode size (260x110) ---
    const NODE_W = 260, NODE_H = 110
    const GAP_X = 100, GAP_Y = 50
    const xStep = NODE_W + GAP_X // 360
    const yStep = NODE_H + GAP_Y // 160
    const PAD_X = 60
    const PAD_Y = 60
    let maxLvl = 0
    const maxPerLvl = new Map<number, number>()
    sortedLevels.forEach((lvl) => {
      maxLvl = Math.max(maxLvl, lvl)
      maxPerLvl.set(lvl, (levelGroups.get(lvl) || []).length)
    })
    const totalHeight = Math.max(...sortedLevels.map((lvl) => (levelGroups.get(lvl) || []).length * yStep), yStep)
    const centerOffset = Math.max(PAD_Y, 0)
    sortedLevels.forEach((lvl) => {
      const group = levelGroups.get(lvl)!
      const colHeight = group.length * yStep
      const startY = centerOffset + Math.max(0, (totalHeight - colHeight) / 2)
      group.forEach((id, i) => {
        const node = nodeMap.get(id)
        if (node) {
          node.position = {
            x: PAD_X + lvl * xStep,
            y: startY + i * yStep,
          }
        }
      })
    })

    const newNodes = nodes.value.map((n: Node) => nodeMap.get(n.id) || n)
    if (setNodes) setNodes(newNodes)
    else nodes.value = newNodes
    nextTick(() => fitView({ padding: 0.25 }))
    ElMessage.success(t('message.importExcel.autoLayoutDone'))
  }

  const buildDagDefinition = () => {
    const dagNodes = nodes.value.map((n: Node) => {
      const config: Record<string, any> = { ...(n.data?.config || {}) }
      const nodeType: string | undefined = config.nodeType || n.data?.nodeType
      const manifest = nodeType ? getNodeManifest(nodeType) : undefined
      const params = normalizeParamsByManifest(config, manifest)
      const pos = (n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number')
        ? { x: Math.round(n.position.x), y: Math.round(n.position.y) }
        : null
      return {
        node_key: n.id,
        node_name: n.data?.label || n.id,
        node_type: nodeType || 'noop',
        params,
        host_ids: config.host_ids || null,
        timeout_sec: config.timeout_sec || 0,
        // Per-node failure strategy: write to definition only when explicitly set,
        // otherwise backend inherits from Workflow.fail_strategy (ultimate fallback fail_fast)
        ...(config.fail_strategy ? { fail_strategy: config.fail_strategy } : {}),
        // Canvas coordinates: positions after auto-layout / manual drag are restored exactly via x/y on reopen
        // If missing, loader falls back to idx waterfall layout (compatible with legacy data)
        ...(pos ? { x: pos.x, y: pos.y } : {}),
      }
    })
    const dagEdges = edges.value
      .filter((e: Edge) => !!e.source && !!e.target)
      .map((e: Edge) => ({
        from_key: e.source,
        to_key: e.target,
        condition: (e.data as any)?.condition || '',
      }))
    return { nodes: dagNodes, edges: dagEdges }
  }

  const loadDagDefinition = (definition: { nodes?: any[]; edges?: any[] }) => {
    const dagNodes = (definition.nodes || []).map((n: any, idx: number) => {
      const nodeType = n.node_type
      // NOTE: n.params may historically contain control fields like nodeType (e.g. old normalizeParamsByManifest didn't filter),
      // so MUST **force-overwrite** top-level reserved fields AFTER expansion, to keep config fields clean.
      const paramsClean: Record<string, any> = { ...(n.params || {}) }
      delete paramsClean.nodeType
      delete paramsClean.host_ids
      delete paramsClean.timeout_sec
      delete paramsClean.fail_strategy
      delete paramsClean.node_key
      delete paramsClean.node_name
      delete paramsClean.node_type
      const manifest = nodeType ? getNodeManifest(nodeType) : undefined
      const trManifest = manifest ? translateManifest(t, manifest) : undefined
      // Strictly respect the user-saved node_name — do NOT 'auto-fix historical dirty data'.
      // Only when node_name is completely missing do we fall back to the TRANSLATED manifest.displayName.
      // Otherwise: user changed 'delay wait 10' → saved draft → reopened — it MUST still show 'delay wait 10'.
      const nodeName = String(n.node_name || n.node_key || trManifest?.displayName || t('duUnnamedNode')).trim() || trManifest?.displayName || n.node_key || t('duUnnamedNode')
      // Canvas coordinates: prefer x/y saved in definition (persisted after auto-layout / manual drag),
      // fall back to legacy waterfall idx layout if missing (compatible with definitions that have no x/y).
      const hasPos = typeof n?.x === 'number' && typeof n?.y === 'number'
      const position = hasPos
        ? { x: Number(n.x), y: Number(n.y) }
        : { x: 100 + idx * 280, y: 100 + (idx % 3) * 120 }
      // Old buildDagDefinition wrote fail_strategy='fail_fast' for all nodes by default,
      // Now: only non-default values count as per-node explicit settings; otherwise leave empty for backend to inherit global strategy.
      const nodeFailStrategy = n.fail_strategy && n.fail_strategy !== 'fail_fast'
        ? n.fail_strategy
        : undefined
      return ({
        id: n.node_key || `node_${idx}`,
        type: 'manifest' as const,
        position,
        data: {
          label: nodeName,
          config: {
            ...paramsClean,
            nodeType,
            host_ids: n.host_ids,
            timeout_sec: n.timeout_sec,
            ...(nodeFailStrategy ? { fail_strategy: nodeFailStrategy } : {}),
          },
          nodeType,
        },
      })
    })
    const dagEdges = (definition.edges || []).map((e: any, idx: number) => {
      const src = e.from_key ?? e.from
      const dst = e.to_key ?? e.to
      return ({
        id: `edge_${src ?? 'null'}_${dst ?? 'null'}_${idx}`,
        source: src,
        target: dst,
        type: 'default' as const,
        animated: true,
        data: { condition: e.condition || '' },
      })
    }).filter((e: any) => !!e.source && !!e.target)
    const dedupedEdges: typeof dagEdges = []
    const seenUnconditional = new Set<string>()
    let removedCount = 0
    for (const e of dagEdges) {
      const cond = ((e.data as any)?.condition || '') as string
      const key = `${e.source}→${e.target}`
      if (!cond.trim()) {
        if (seenUnconditional.has(key)) {
          removedCount++
          continue
        }
        seenUnconditional.add(key)
      }
      dedupedEdges.push(e)
    }
    // Strict mode: dedupe labels globally in order when loading definition — duplicates become `${label} 2 / 3`,
    // no legacy compatibility / suffix stripping; only compare within this batch since callers usually clear canvas first.
    const labeled = assignUniqueNodeLabels(dagNodes, [])
    addNodes(labeled)
    addEdges(dedupedEdges)
    if (removedCount > 0) {
      ElMessage.warning(t('duDedupUnconditionalEdges', { n: removedCount }))
    }
    nextTick(() => fitView({ padding: 0.2 }))
  }

  const exportFlow = () => {
    const definition = buildDagDefinition()
    const exportData = {
      name: flowForm.name,
      description: flowForm.desc,
      global_envs: flowForm.variables.reduce((acc: Record<string, string>, v: FlowVariable) => {
        if (v.key) acc[v.key] = v.value
        return acc
      }, {}),
      definition,
      exported_at: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${flowForm.name || 'workflow'}_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success(t('message.importExcel.flowExported'))
  }

  const importFlow = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string)
          if (!data.definition?.nodes) {
            ElMessage.error(t('message.invalidWorkflowMissingNodes'))
            return
          }
          if (resetHistory) resetHistory()
          if (data.name) flowForm.name = data.name
          if (data.description) flowForm.desc = data.description
          if (data.global_envs && typeof data.global_envs === 'object') {
            flowForm.variables = Object.entries(data.global_envs).map(([key, value]) => ({ key, value: String(value) }))
          }
          if (setNodes) setNodes([])
          else nodes.value = []
          if (setEdges) setEdges([])
          else edges.value = []
          nextTick(() => {
            loadDagDefinition(data.definition)
            // Store initial snapshot as undo baseline after nodes/edges are persisted
            setTimeout(() => saveHistory(), 50)
            ElMessage.success(t('message.importExcel.flowImported'))
          })
        } catch {
          ElMessage.error(t('duFileParseFail'))
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return { autoLayout, buildDagDefinition, loadDagDefinition, exportFlow, importFlow }
}