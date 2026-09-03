import { ref } from 'vue'
import type { Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { GetDAGVersions, RollbackDAG } from '/@/api/taurus/workflow/api'
import { i18n } from '/@/i18n'
const t = i18n.global.t

export function useDagVersions(workflowId: Ref<number | null>) {
  const dagVersions = ref<any[]>([])

  const loadDagVersions = async () => {
    if (!workflowId.value) return
    try {
      const res = await GetDAGVersions(workflowId.value)
      dagVersions.value = res?.data || res || []
    } catch {
      dagVersions.value = []
    }
  }

  const rollbackVersion = async (ver: any) => {
    if (!workflowId.value) return
    await ElMessageBox.confirm(
      t('dvRollbackConfirmMsg', { v: ver.version }),
      t('dvRollbackConfirmTitle'),
      { type: 'warning' },
    )
    try {
      await RollbackDAG(workflowId.value, ver.id)
      ElMessage.success(t('dvRollbackSuccess', { v: ver.version }))
      return true
    } catch (e: any) {
      ElMessage.error(t('dvRollbackFail', { m: e?.message || '' }))
      return false
    }
  }

  return { dagVersions, loadDagVersions, rollbackVersion }
}