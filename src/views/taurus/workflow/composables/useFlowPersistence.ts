import type { Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type { Edge, Node } from '@vue-flow/core'
import { cleanConfigForValidateStep } from '/@/views/taurus/workflow/manifest/registry'
import { validateStep } from '/@/api/taurus/workflow/manifest'
import { PublishWorkflow, AddObj, UpdateObj } from '/@/api/taurus/workflow/api'
import { triggerEeUpgrade, useEditionStore } from '/@/editions/index'

interface FlowForm {
  name: string
  desc: string
  status: 'draft' | 'published' | 'pending'
  timeout: number
  failStrategy: 'stop' | 'continue'
  variables: { key: string; value: string }[]
  workflowId: number | null
  categoryId: number | null
  authType: 'private' | 'public'
  needAudit: boolean
  customApproverIds: number[]
  hasSchedule: boolean
  scheduleType: 'cron' | 'interval' | 'once'
  cronExpression: string
  intervalSeconds: number
  runOnceAt: string
  scheduleEnabled: boolean
}

export function useFlowPersistence(
  nodes: Ref<Node[]>,
  edges: Ref<Edge[]>,
  flowForm: FlowForm,
  selectedNodeId: Ref<string | null>,
  nodeErrors: Ref<Record<string, string>>,
  buildDagDefinition: () => any,
  loadDagVersions: () => Promise<void>,
  getWorkflowTotal?: () => Promise<number> | number,
) {
  const { t } = useI18n()
  const edition = useEditionStore()

  const _isWorkflowsQuotaExceeded = async (): Promise<{ ok: boolean; limit: number | null; current: number | null }> => {
    const limit = edition.getQuota('max_workflows')
    if (limit == null) return { ok: true, limit: null, current: null }
    let current = -1
    try {
      if (typeof getWorkflowTotal === 'function') {
        const v = await getWorkflowTotal()
        if (typeof v === 'number') current = v
      }
    } catch (_e) { /* ignore */ }
    if (current >= 0 && current >= limit) return { ok: false, limit, current }
    return { ok: true, limit, current: current >= 0 ? current : null }
  }

  const checkDagCycle = (): string | null => {
    const nodeIds = new Set(nodes.value.map((n: any) => n.id))
    const adj = new Map<string, string[]>()
    nodes.value.forEach((n: any) => adj.set(n.id, []))
    edges.value.forEach((e: any) => {
      if (nodeIds.has(e.source) && nodeIds.has(e.target)) {
        adj.get(e.source)?.push(e.target)
      }
    })
    const WHITE = 0, GRAY = 1, BLACK = 2
    const color = new Map<string, number>()
    nodeIds.forEach(id => color.set(id, WHITE))
    let cycleNode: string | null = null
    const dfs = (id: string): boolean => {
      color.set(id, GRAY)
      for (const next of (adj.get(id) || [])) {
        if (color.get(next) === GRAY) { cycleNode = next; return true }
        if (color.get(next) === WHITE && dfs(next)) return true
      }
      color.set(id, BLACK)
      return false
    }
    for (const id of nodeIds) {
      if (color.get(id) === WHITE && dfs(id)) return cycleNode
    }
    return null
  }

  const checkOrphanNodes = (): string[] => {
    if (nodes.value.length <= 1) return []
    const connectedIds = new Set<string>()
    edges.value.forEach((e: any) => { connectedIds.add(e.source); connectedIds.add(e.target) })
    return nodes.value
      .filter((n: any) => !connectedIds.has(n.id))
      .map((n: any) => n.data?.label || n.id)
  }

  const validateAllNodes = async (): Promise<boolean> => {
    let hasErrors = false
    for (const node of nodes.value) {
      const nodeType = node.data?.config?.nodeType
      if (!nodeType) continue
      try {
        const cleaned = cleanConfigForValidateStep(nodeType, node.data?.config || {})
        const result = await validateStep(nodeType, cleaned)
        if (!result.valid && result.field_errors) {
          hasErrors = true
          if (node.id === selectedNodeId.value) {
            nodeErrors.value = result.field_errors
          }
        }
      } catch (_e) {
        hasErrors = true
      }
    }
    return !hasErrors
  }

  const saveFlow = async () => {
    const allValid = await validateAllNodes()
    const definition = buildDagDefinition()
    const payload: Record<string, any> = {
      name: flowForm.name,
      description: flowForm.desc,
      workflow_mode: 'dag',
      status: 0,
      hosts: [],
      auth_type: flowForm.authType || 'private',
      need_audit: !!flowForm.needAudit,
      custom_approver_ids: Array.isArray(flowForm.customApproverIds)
        ? flowForm.customApproverIds.map((x: any) => Number(x)).filter((x: number) => !isNaN(x))
        : [],
      global_envs: flowForm.variables.reduce((acc: Record<string, string>, v: { key: string; value: string }) => {
        if (v.key) acc[v.key] = v.value
        return acc
      }, {}),
      global_timeout_sec: flowForm.timeout,
      fail_strategy: flowForm.failStrategy,
      graph_definition: definition,
      has_schedule: !!flowForm.hasSchedule,
      schedule_type: flowForm.hasSchedule ? flowForm.scheduleType : null,
      cron_expression: flowForm.hasSchedule && flowForm.scheduleType === 'cron' ? flowForm.cronExpression : null,
      interval_seconds: flowForm.hasSchedule && flowForm.scheduleType === 'interval' ? Number(flowForm.intervalSeconds) || null : null,
      run_once_at: flowForm.hasSchedule && flowForm.scheduleType === 'once' ? flowForm.runOnceAt || null : null,
    }
    if (flowForm.categoryId !== null && flowForm.categoryId !== undefined) {
      payload.category = Number(flowForm.categoryId)
    }

    try {
      if (flowForm.workflowId) {
        await UpdateObj({ id: flowForm.workflowId, ...payload })
      } else {
        const quota = await _isWorkflowsQuotaExceeded()
        if (!quota.ok && quota.limit != null) {
          const desc = t('message.pages.edition.workflowQuotaExceededDesc', {
            limit: String(quota.limit),
            current: quota.current ?? String(quota.limit),
            fallback: `社区版工作流配额已用满（上限 ${quota.limit} 条），升级企业版可解锁更多配额。`,
          } as any)
          triggerEeUpgrade('WORKFLOW_DAG_ENGINE', desc)
          return
        }
        const res = await AddObj(payload)
        flowForm.workflowId = res?.data?.id || res?.id || null
      }
      if (allValid) {
        ElMessage.success(t('message.pages.workflowEditor.weSaveDraftAllValid'))
      } else {
        ElMessage.warning(t('message.pages.workflowEditor.weSaveDraftPartialInvalid'))
      }
    } catch (e: any) {
      const msg = e?.message || ''
      const isQuotaErr = typeof msg === 'string' && (/工作流.*配额|max_workflows|quota.*workflow/i).test(msg)
      if (!flowForm.workflowId && isQuotaErr) {
        triggerEeUpgrade('WORKFLOW_DAG_ENGINE', msg)
        return
      }
      ElMessage.error(msg || t('message.pages.workflowEditor.weSaveDraftFailed'))
    }
    flowForm.status = 'draft'
  }

  const publishFlow = async (opts?: {
    release_note?: string;
    approver_ids?: number[];
    countersign_ids?: number[];
    approval_mode?: 'any' | 'all';
    submit_desc?: string;
  }) => {
    const cycleNode = checkDagCycle()
    if (cycleNode) {
      ElMessage.error(t('message.pages.workflowEditor.weDagHasCycle', { node: cycleNode }))
      return
    }
    const orphans = checkOrphanNodes()
    if (orphans.length > 0) {
      ElMessage.warning(t('message.pages.workflowEditor.weOrphanNodesDetected', { nodes: orphans.join(', ') }))
    }
    const allValid = await validateAllNodes()
    if (!allValid) {
      ElMessage.error(t('message.pages.workflowEditor.wePublishValidationFail'))
      return
    }
    if (!flowForm.workflowId) {
      ElMessage.error(t('message.pages.workflowEditor.wePublishSaveFirst'))
      return
    }
    try {
      const basicPayload: Record<string, any> = {
        id: flowForm.workflowId,
        name: flowForm.name,
        description: flowForm.desc,
        workflow_mode: 'dag',
        status: 0,
        hosts: [],
        auth_type: flowForm.authType || 'private',
        need_audit: !!flowForm.needAudit,
        custom_approver_ids: Array.isArray(flowForm.customApproverIds)
          ? flowForm.customApproverIds.map((x: any) => Number(x)).filter((x: number) => !isNaN(x))
          : [],
        global_envs: flowForm.variables.reduce((acc: Record<string, string>, v: { key: string; value: string }) => {
          if (v.key) acc[v.key] = v.value
          return acc
        }, {}),
        global_timeout_sec: flowForm.timeout,
        fail_strategy: flowForm.failStrategy,
        has_schedule: !!flowForm.hasSchedule,
        schedule_type: flowForm.hasSchedule ? flowForm.scheduleType : null,
        cron_expression: flowForm.hasSchedule && flowForm.scheduleType === 'cron' ? flowForm.cronExpression : null,
        interval_seconds: flowForm.hasSchedule && flowForm.scheduleType === 'interval' ? Number(flowForm.intervalSeconds) || null : null,
        run_once_at: flowForm.hasSchedule && flowForm.scheduleType === 'once' ? flowForm.runOnceAt || null : null,
      }
      if (flowForm.categoryId !== null && flowForm.categoryId !== undefined) {
        basicPayload.category = Number(flowForm.categoryId)
      }
      await UpdateObj(basicPayload)
      const definition = buildDagDefinition()
      const resp: any = await PublishWorkflow(flowForm.workflowId, {
        definition,
        global_envs: flowForm.variables.reduce((acc: Record<string, string>, v: { key: string; value: string }) => {
          if (v.key) acc[v.key] = v.value
          return acc
        }, {}),
        release_note: opts?.release_note || '',
        approver_ids: opts?.approver_ids,
        countersign_ids: opts?.countersign_ids,
        approval_mode: opts?.approval_mode,
        submit_desc: opts?.submit_desc,
      })
      const needApproval = resp?.data?.need_approval === true
      if (needApproval) {
        flowForm.status = 'pending'
      } else {
        flowForm.status = 'published'
      }
      loadDagVersions()
      ElMessage.success(resp?.msg || (needApproval ? t('message.pages.workflowEditor.wePublishNeedApproval') : t('message.pages.workflowEditor.wePublishSuccess')))
    } catch (e: any) {
      ElMessage.error(e?.message || t('message.pages.workflowEditor.wePublishFailed'))
    }
  }

  return { checkDagCycle, checkOrphanNodes, validateAllNodes, saveFlow, publishFlow }
}