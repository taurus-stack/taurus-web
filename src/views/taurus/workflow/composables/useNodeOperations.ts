import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CancelExecution, RerunExecution, RetryNode, SkipNode, ApproveNode } from '/@/api/taurus/workflow/execution'

export function useNodeOperations(detail: any, loadExecution: () => Promise<void>) {
  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()
  const logDialogVisible = ref(false)
  const PREFIX = 'message.pages.workflowRecordDetail'

  const fullLog = computed(() => {
    const lines: string[] = []
    lines.push(`=== ${t(PREFIX + '.logHeader')} ===`)
    lines.push(`${t(PREFIX + '.logFlow')}: ${detail.flowName}`)
    lines.push(`${t(PREFIX + '.logStatus')}: ${detail.status}`)
    lines.push(`${t(PREFIX + '.logStart')}: ${detail.startTime || '-'}`)
    lines.push(`${t(PREFIX + '.logEnd')}: ${detail.endTime || '-'}`)
    lines.push(`${t(PREFIX + '.logDuration')}: ${detail.duration || '-'}`)
    lines.push('')
    return lines.join('\n')
  })

  const viewLog = () => {
    logDialogVisible.value = true
  }

  const copyLog = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success(t(PREFIX + '.logCopied'))
    })
  }

  const stopExec = async () => {
    await ElMessageBox.confirm(
      t(PREFIX + '.stopConfirmMsg'),
      t(PREFIX + '.stopConfirmTitle'),
      { type: 'warning' },
    )
    const execId = parseInt(route.params.id as string, 10)
    try {
      await CancelExecution(execId)
      detail.status = 'cancelled'
      ElMessage.success(t(PREFIX + '.stopSuccess'))
      loadExecution()
    } catch (e: any) {
      ElMessage.error(t(PREFIX + '.stopFail') + ': ' + (e?.message || ''))
    }
  }

  const rerun = async () => {
    const execId = parseInt(route.params.id as string, 10)
    if (isNaN(execId)) return
    if ((detail as any).isLatestDagVersion === false) {
      const execVer = (detail as any).dagVersionVersion
      const latestVer = (detail as any).latestDagVersionVersion
      let tip = t(PREFIX + '.rerunBlockedNoLatest')
      if (execVer != null && latestVer != null) {
        tip = t(PREFIX + '.rerunBlockedOldVer', { execVer, latestVer })
      }
      ElMessage.warning(tip)
      return
    }
    try {
      const status = String(detail.status || '')
      if (status === 'success') {
        // Success: direct full rerun (new execution)
        await ElMessageBox.confirm(
          t(PREFIX + '.rerunFullConfirmMsg'),
          t(PREFIX + '.rerunConfirmTitle'),
          { type: 'warning' },
        )
        const res = await RerunExecution(execId, 'full') as any
        if (res?.data?.new_execution_id) {
          ElMessage.success(t(PREFIX + '.rerunFullSuccessJump'))
          router.replace(`/workflow/record/${res.data.new_execution_id}`)
        } else {
          ElMessage.success(t(PREFIX + '.rerunStarted'))
          loadExecution()
        }
        return
      }
      // Other statuses (failed/aborted/cancelled/skipped): show selection dialog
      await showRerunSelectDialog(execId)
    } catch (e: any) {
      if (e === 'cancel' || e === 'close') return
      if (e?.action === 'cancel' || e?.action === 'close') return
      ElMessage.error(t(PREFIX + '.rerunFail') + ': ' + (e?.message || ''))
    }
  }

  const showRerunSelectDialog = async (execId: number) => {
    let actionRes: string = 'close'
    try {
      await ElMessageBox({
        title: t(PREFIX + '.rerunSelectTitle'),
        dangerouslyUseHTMLString: true,
        message: `
          <div style="line-height:1.9;text-align:left">
            <div style="margin-bottom:6px"><b>${t(PREFIX + '.rerunMode1Title')}</b>${t(PREFIX + '.rerunMode1Hint')}</div>
            <div style="color:#909399;font-size:12px;margin-bottom:14px;padding-left:4px">${t(PREFIX + '.rerunMode1Detail')}</div>
            <div style="margin-bottom:6px"><b>${t(PREFIX + '.rerunMode2Title')}</b>${t(PREFIX + '.rerunMode2Hint')}</div>
            <div style="color:#909399;font-size:12px;padding-left:4px">${t(PREFIX + '.rerunMode2Detail')}</div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: t(PREFIX + '.rerunMode1Btn'),
        cancelButtonText: t(PREFIX + '.rerunMode2Btn'),
        distinguishCancelAndClose: true,
        customClass: 'rerun-select-dialog',
      } as any)
      actionRes = 'confirm'
    } catch (err: any) {
      if (err === 'cancel' || (err && err.action === 'cancel')) actionRes = 'cancel'
      else actionRes = 'close'
    }
    if (actionRes === 'close') return
    const mode: 'full' | 'failed_only' = actionRes === 'confirm' ? 'full' : 'failed_only'
    const res = await RerunExecution(execId, mode) as any
    if (mode === 'full') {
      if (res?.data?.new_execution_id) {
        ElMessage.success(t(PREFIX + '.rerunFullSuccessJump'))
        router.replace(`/workflow/record/${res.data.new_execution_id}`)
      } else {
        ElMessage.success(t(PREFIX + '.rerunStarted'))
        loadExecution()
      }
    } else {
      const cnt = res?.data?.reset_node_count ?? 0
      ElMessage.success(cnt > 0
        ? t(PREFIX + '.rerunPartialResetNodes', { n: cnt })
        : t(PREFIX + '.rerunPartialNoNodes'))
      loadExecution()
    }
  }

  const retryNode = async (nodeKey: string) => {
    const execId = parseInt(route.params.id as string, 10)
    try {
      await RetryNode(execId, nodeKey)
      ElMessage.success(t(PREFIX + '.nodeRetrySuccess', { nodeKey }))
      loadExecution()
    } catch (e: any) {
      ElMessage.error(t(PREFIX + '.nodeRetryFail') + ': ' + (e?.message || ''))
    }
  }

  const skipNode = async (nodeKey: string) => {
    const execId = parseInt(route.params.id as string, 10)
    try {
      await SkipNode(execId, nodeKey)
      ElMessage.success(t(PREFIX + '.nodeSkipSuccess', { nodeKey }))
      loadExecution()
    } catch (e: any) {
      ElMessage.error(t(PREFIX + '.nodeSkipFail') + ': ' + (e?.message || ''))
    }
  }

  const approveNode = async (nodeKey: string, comment?: string) => {
    const execId = parseInt(route.params.id as string, 10)
    try {
      await ApproveNode(execId, nodeKey, comment)
      ElMessage.success(t(PREFIX + '.nodeApproveSuccess', { nodeKey }))
      loadExecution()
    } catch (e: any) {
      ElMessage.error(t(PREFIX + '.nodeApproveFail') + ': ' + (e?.message || ''))
    }
  }

  return {
    logDialogVisible,
    fullLog,
    viewLog,
    copyLog,
    stopExec,
    rerun,
    retryNode,
    skipNode,
    approveNode,
  }
}