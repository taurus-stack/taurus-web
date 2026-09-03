import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { GetExecutionDetail, GetNodeExecutions } from '/@/api/taurus/workflow/execution'

const STATUS_MAP: Record<number, string> = {
  0: 'pending',
  1: 'running',
  2: 'success',
  3: 'fail',
  4: 'cancelled',
  5: 'cancelled',
  6: 'skipped',
}

export const statusTextMap: Record<string, string> = {
  pending: 'Pending',
  running: 'Running',
  success: 'Success',
  fail: 'Failed',
  cancelled: 'Cancelled',
  skipped: 'Skipped',
  stopped: 'Stopped',
}

export const statusTypeMap: Record<string, string> = {
  pending: 'info',
  running: '',
  success: 'success',
  fail: 'danger',
  cancelled: 'info',
  skipped: 'info',
  stopped: 'info',
}

export function useExecutionDetail() {
  const route = useRoute()
  const { t } = useI18n()

  const detail = reactive({
    instanceId: '',
    flowName: '',
    executor: '',
    startTime: '',
    endTime: '',
    duration: '',
    status: 'pending',
    errorMsg: '',
    isLatestDagVersion: true as boolean,
    dagVersionVersion: null as number | null,
    latestDagVersionVersion: null as number | null,
    versionBlockedTip: '' as string,
  })

  const nodeList = ref<any[]>([])
  const lineList = ref<any[]>([])
  const nodeExecutionGroups = ref<any[]>([])
  const stepExecutions = ref<any[]>([])
  let pollTimer: number | null = null

  const selectedNodeId = ref('')
  const selectedHostId = ref<string>('')
  const selectedNode = computed(() => nodeList.value.find(n => n.id === selectedNodeId.value))

  const groupByNodeKey = computed(() =>
    Object.fromEntries((nodeExecutionGroups.value || []).map((g: any) => [g.node_key, g]))
  )
  const selectedGroup = computed(() =>
    selectedNodeId.value ? groupByNodeKey.value[selectedNodeId.value] : undefined
  )
  const stepsByNodeHost = computed(() => {
    const m = new Map<string, any>()
    for (const s of stepExecutions.value) {
      const key = `${String(s.node_key || '')}@@${String(s.host_id || '__NO_HOST__')}`
      m.set(key, s)
    }
    return m
  })
  const selectedHostRow = computed(() => {
    if (!selectedNodeId.value) return undefined
    const hid = selectedHostId.value || selectedGroup.value?.hosts?.[0]?.host_id
    if (!hid) return undefined
    // 1) Prefer step_executions (full fields: complete output)
    let row = stepsByNodeHost.value.get(`${selectedNodeId.value}@@${hid}`)
    if (row) return row
    // 2) Otherwise take directly from group.hosts (leaner but include output / host_detail / exit_code)
    const group = selectedGroup.value
    if (group?.hosts) {
      const slim = group.hosts.find((h: any) => String(h.host_id) === String(hid))
      if (slim) {
        return {
          id: slim.id || slim.workflow_node_execution_id,
          host_id: slim.host_id,
          host_detail: slim.host_detail,
          status: slim.status,
          status_display: slim.status_display,
          attempt_no: slim.attempt_no,
          started_at: slim.started_at,
          finished_at: slim.finished_at,
          duration_ms: slim.duration_ms,
          exit_code: slim.exit_code,
          error_message: slim.error_message,
          output: slim.output,
        }
      }
    }
    return undefined
  })

  const formatDuration = (ms: number): string => {
    const sec = Math.floor(ms / 1000)
    return sec >= 60 ? `${Math.floor(sec / 60)}分${sec % 60}秒` : `${sec}秒`
  }

  const layoutDagNodes = (nodes: any[], edges: any[]) => {
    if (nodes.length === 0) return
    const nodeMap = new Map<string, any>()
    nodes.forEach((n) => nodeMap.set(n.id, n))

    const inDegree = new Map<string, number>()
    const children = new Map<string, string[]>()
    const parents = new Map<string, string[]>()
    nodes.forEach((n) => {
      inDegree.set(n.id, 0)
      children.set(n.id, [])
      parents.set(n.id, [])
    })
    edges.forEach((e) => {
      if (nodeMap.has(e.from) && nodeMap.has(e.to)) {
        inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1)
        children.get(e.from)!.push(e.to)
        parents.get(e.to)!.push(e.from)
      }
    })

    // Longest-path layering (critical path): ensure sink is always in the last column
    const levels = new Map<string, number>()
    const indeg = new Map(inDegree)
    const q: string[] = nodes.filter((n) => (indeg.get(n.id) || 0) === 0).map((n) => n.id)
    q.forEach((id) => levels.set(id, 0))
    while (q.length > 0) {
      const id = q.shift()!
      for (const c of children.get(id) || []) {
        levels.set(c, Math.max(levels.get(c) || 0, (levels.get(id) || 0) + 1))
        indeg.set(c, (indeg.get(c) || 1) - 1)
        if (indeg.get(c) === 0) q.push(c)
      }
    }
    nodes.forEach((n) => { if (!levels.has(n.id)) levels.set(n.id, 0) })

    const levelGroups = new Map<number, string[]>()
    nodes.forEach((n) => {
      const lvl = levels.get(n.id) || 0
      if (!levelGroups.has(lvl)) levelGroups.set(lvl, [])
      levelGroups.get(lvl)!.push(n.id)
    })

    const SORT_WEIGHT: Record<string, number> = {
      start: 0, wait: 1, noop: 2, condition: 3, loop: 4, approval: 5,
      command: 6, script: 7, program: 8, sub_workflow: 9, http: 10,
      http_callback: 11, email_notification: 12, webhook_notification: 13,
      file_op: 14, transform: 15, end: 9999,
    }
    const idxInOriginal = new Map<string, number>()
    nodes.forEach((n, i) => idxInOriginal.set(n.id, i))
    const getTypeOf = (id: string): string => String(nodeMap.get(id)?.nodeType || nodeMap.get(id)?.type || '')
    const sortedLevels = [...levelGroups.keys()].sort((a, b) => a - b)

    // Stable intra-layer sort
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

    // Barycenter 2-pass sweep reduces edge crossings
    for (let scan = 0; scan < 2; scan++) {
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
          return (idxInOriginal.get(a) ?? 0) - (idxInOriginal.get(b) ?? 0)
        })
      }
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
          return (idxInOriginal.get(a) ?? 0) - (idxInOriginal.get(b) ?? 0)
        })
      }
    }

    const xStep = 320  // NODE_W(220) + 100 gap
    const PAD_X = 60
    const PAD_Y = 60
    const GAP_Y = 37
    // Determine if multi-host node (consistent with ExecutionDagTopo.vue)
    const isMH = (n: any): boolean => {
      const total = Number(n?.group?.total_hosts ?? 0)
      const hosts = n?.group?.hosts
      if (!Array.isArray(hosts) || hosts.length === 0) return false
      if (total <= 1) return false
      return hosts.some((h: any) => h.host_id && h.host_id !== '__NO_HOST__')
    }
    const nodeH = (n: any) => (isMH(n) ? 108 : 72)
    // Compute cumulative Y per layer (node heights + gaps) to avoid overlap
    const colHeights = new Map<number, number>()
    const colYAccum = new Map<number, number[]>()
    for (const lvl of sortedLevels) {
      const group = levelGroups.get(lvl)!
      let acc = 0
      const ys: number[] = []
      group.forEach((id, i) => {
        const node = nodeMap.get(id)
        const h = node ? nodeH(node) : 72
        ys.push(acc)
        if (i < group.length - 1) acc += h + GAP_Y
        else acc += h
      })
      colHeights.set(lvl, acc)
      colYAccum.set(lvl, ys)
    }
    const maxColH = Math.max(...colHeights.values(), 72)
    sortedLevels.forEach((lvl) => {
      const group = levelGroups.get(lvl)!
      const colHeight = colHeights.get(lvl) || 0
      const startY = PAD_Y + Math.max(0, (maxColH - colHeight) / 2)
      const ys = colYAccum.get(lvl) || []
      group.forEach((id, i) => {
        const node = nodeMap.get(id)
        if (node) {
          node.x = PAD_X + lvl * xStep
          node.y = startY + (ys[i] || 0)
        }
      })
    })
  }

  const loadExecution = async () => {
    const execId = parseInt(route.params.id as string, 10)
    if (isNaN(execId)) return

    try {
      const res = await GetExecutionDetail(execId)
      const data = res?.data || res
      detail.instanceId = String(data.id)
      detail.flowName = data.workflow_name || ''
      detail.executor = data.creator_name || data.creator?.username || data.creator?.name || data.creator || ''
      detail.startTime = data.start_time || ''
      detail.endTime = data.end_time || ''
      detail.status = STATUS_MAP[data.status] || 'pending'
      detail.errorMsg = data.error_message || ''

      const isLatest = data.is_latest_dag_version !== false
      const execVer = data.dag_version_version
      const latestVer = data.latest_dag_version_version
      detail.isLatestDagVersion = isLatest
      detail.dagVersionVersion = execVer
      detail.latestDagVersionVersion = latestVer
      detail.versionBlockedTip = !isLatest && execVer != null && latestVer != null
        ? t('message.pages.workflowRecordDetail.wrdVersionBlockedNew', { execVer, latestVer })
        : !isLatest
          ? t('message.pages.workflowRecordDetail.wrdVersionBlockedOld')
          : ''

      if (data.start_time && data.end_time) {
        const ms = new Date(data.end_time).getTime() - new Date(data.start_time).getTime()
        detail.duration = formatDuration(ms)
      }

      // First build complete topology (nodes+edges) from dag_version_detail.definition
      const definition = data.dag_version_detail?.definition || {}
      const defNodes: any[] = Array.isArray(definition.nodes) ? definition.nodes : []
      const defEdges: any[] = Array.isArray(definition.edges) ? definition.edges : []

      // Save aggregated groups + flat host details (with host_detail)
      nodeExecutionGroups.value = data.node_execution_groups || []
      stepExecutions.value = data.step_executions || []

      const nodeRes = await GetNodeExecutions(execId)
      const nodeData = nodeRes?.data || nodeRes || []
      const execNodes = Array.isArray(nodeData) ? nodeData : (nodeData.results || [])
      // If node_executions API returns no data (backend may not provide it, fall back to step_executions)
      const actualExecNodes = (execNodes && execNodes.length > 0) ? execNodes : (data.step_executions || [])
      // Build node_key -> aggregated status map; prefer group.overall_status, else first host
      const groupsByKey = new Map<string, any>()
      for (const g of (data.node_execution_groups || [])) {
        groupsByKey.set(String(g.node_key), g)
      }
      // Build node_key -> one representative execution (for output / startTime etc.)
      const execByKey = new Map<string, any>()
      for (const g of (data.node_execution_groups || [])) {
        const firstHost = g.hosts?.[0]
        if (firstHost?.workflow_node_execution_id) {
          const match = (data.step_executions || []).find(
            (s: any) => s.id === firstHost.workflow_node_execution_id
          )
          if (match) execByKey.set(String(g.node_key), match)
        }
      }
      // If no groups, fall back to legacy logic: take first entry per (node_key, host_id)
      if (execByKey.size === 0) {
        const hitKeys = new Set<string>()
        actualExecNodes.forEach((n: any) => {
          const key = String(n.node_key || n.id)
          if (!hitKeys.has(key)) {
            hitKeys.add(key)
            execByKey.set(key, n)
          }
        })
      }

      // Prefer rendering topology from DAG definition's full node set (so unexecuted nodes are visible)
      if (defNodes.length > 0) {
        nodeList.value = defNodes.map((dn: any) => {
          const key = String(dn.node_key || dn.id || '')
          const n = execByKey.get(key) || {}
          const g = groupsByKey.get(key)
          let duration = '-'
          if (n.duration_ms != null) {
            duration = formatDuration(n.duration_ms)
          } else if (g?.total_duration_ms != null) {
            duration = formatDuration(g.total_duration_ms)
          } else if (n.started_at && n.finished_at) {
            const ms = new Date(n.finished_at).getTime() - new Date(n.started_at).getTime()
            duration = formatDuration(ms)
          }
          // Node overall status: aggregated > single host > pending
          const rawStatus = (g?.overall_status != null)
            ? g.overall_status
            : ((n.status != null) ? n.status : 0)
          return {
            id: key,
            type: dn.node_type || n.node_type || g?.node_type || 'script',
            label: dn.node_name || n.node_name || g?.node_name || key,
            x: 0,
            y: 0,
            status: STATUS_MAP[rawStatus] || 'pending',
            startTime: g?.first_started_at || n.started_at || '',
            endTime: g?.last_finished_at || n.finished_at || '',
            duration,
            output: n.output || null,
            errorMsg: n.error_message || '',
            group: g || null,  // For topology nodes: host stats, badges, progress bar
          }
        })

        lineList.value = defEdges.map((e: any, i: number) => {
          const fromKey = String(e.from_key || e.from || '')
          const toKey = String(e.to_key || e.to || '')
          const fromNode = nodeList.value.find(n => n.id === fromKey)
          const toNode = nodeList.value.find(n => n.id === toKey)
          let lineStatus = 'pending'
          if (fromNode?.status === 'success' && toNode?.status === 'success') lineStatus = 'success'
          else if (fromNode?.status === 'fail' || toNode?.status === 'fail') lineStatus = 'fail'
          else if (fromNode?.status === 'running' || toNode?.status === 'running') lineStatus = 'running'
          return { id: `line-${i}`, from: fromKey, to: toKey, condition: e.condition || '', status: lineStatus }
        })
      } else {
        // Fallback mode when no DAG definition (compatible with linear mode)
        // Dedupe by node_key first; take first host per group as representative
        const seenKeys = new Set<string>()
        nodeList.value = actualExecNodes
          .filter((n: any) => {
            const k = String(n.node_key || n.id)
            if (seenKeys.has(k)) return false
            seenKeys.add(k)
            return true
          })
          .map((n: any) => {
            const key = String(n.node_key || n.id)
            const g = groupsByKey.get(key)
            let duration = '-'
            if (n.duration_ms != null) duration = formatDuration(n.duration_ms)
            else if (g?.total_duration_ms != null) duration = formatDuration(g.total_duration_ms)
            else if (n.started_at && n.finished_at) {
              duration = formatDuration(new Date(n.finished_at).getTime() - new Date(n.started_at).getTime())
            }
            const rawStatus = (g?.overall_status != null) ? g.overall_status : n.status
            return {
              id: key,
              type: n.node_type || g?.node_type || 'script',
              label: n.node_name || g?.node_name || key,
              x: 0, y: 0,
              status: STATUS_MAP[rawStatus] || 'pending',
              startTime: g?.first_started_at || n.started_at || '',
              endTime: g?.last_finished_at || n.finished_at || '',
              duration,
              output: n.output || null,
              errorMsg: n.error_message || '',
              group: g || null,
            }
          })
        lineList.value = []
      }

      layoutDagNodes(nodeList.value, lineList.value)

      if (detail.status === 'running' && !pollTimer) {
        startPolling()
      } else if (detail.status !== 'running') {
        stopPolling()
      }
    } catch (e: any) {
      ElMessage.error(t('message.global.loadExecDetailFail') + ': ' + (e?.message || ''))
    }
  }

  const startPolling = () => {
    stopPolling()
    pollTimer = window.setInterval(async () => {
      await loadExecution()
      if (detail.status !== 'running') {
        stopPolling()
      }
    }, 3000)
  }

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  const selectNode = (node: any) => {
    selectedNodeId.value = node.id
    // On node switch: default select 'first failed host', else first running, else first one
    selectedHostId.value = ''
    const g = node?.group
    const hosts = g?.hosts
    if (Array.isArray(hosts) && hosts.length > 0) {
      const firstFailed = hosts.find((h: any) => h.status_display === 'failed' || STATUS_MAP[h.status] === 'fail')
      const firstRunning = hosts.find((h: any) => h.status_display === 'running' || STATUS_MAP[h.status] === 'running')
      const pick = firstFailed || firstRunning || hosts[0]
      if (pick?.host_id) selectedHostId.value = pick.host_id
    }
  }

  const selectHost = (hostId: string) => {
    selectedHostId.value = hostId
  }

  onMounted(() => {
    loadExecution()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    detail,
    nodeList,
    lineList,
    nodeExecutionGroups,
    stepExecutions,
    stepsByNodeHost,
    groupByNodeKey,
    selectedNodeId,
    selectedNode,
    selectedGroup,
    selectedHostId,
    selectedHostRow,
    selectNode,
    selectHost,
    loadExecution,
    startPolling,
    stopPolling,
  }
}