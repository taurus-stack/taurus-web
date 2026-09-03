<template>
  <div class="workflow-record-page">
    <div class="page-header">
      <h2>{{ t('message.pages.workflowRecordList.wrlPageTitle') }}</h2>
    </div>

    <div class="stat-row">
      <div class="stat-card" :class="{ active: filter.status === '' && !filter.triggerType }" @click="filterByStatus('')">
        <div class="num">{{ stat.total }}</div>
        <div class="label">{{ t('message.pages.workflowRecordList.wrlTotalExecCount') }}</div>
      </div>
      <div class="stat-card" :class="{ active: filter.status === 'running' && !filter.triggerType }" @click="filterByStatus('running')">
        <div class="num blue">{{ stat.running }}</div>
        <div class="label">{{ t('message.pages.workflowRecordList.wrlStatusRunning') }}</div>
      </div>
      <div class="stat-card" :class="{ active: filter.status === 'success' && !filter.triggerType }" @click="filterByStatus('success')">
        <div class="num green">{{ stat.success }}</div>
        <div class="label">{{ t('message.pages.workflowRecordList.wrlStatusSuccess') }}</div>
      </div>
      <div class="stat-card" :class="{ active: filter.status === 'fail' && !filter.triggerType }" @click="filterByStatus('fail')">
        <div class="num red">{{ stat.fail }}</div>
        <div class="label">{{ t('message.pages.workflowRecordList.wrlStatusFail') }}</div>
      </div>
      <div class="stat-card" :class="{ active: filter.triggerType === 'dryrun' }" @click="filterByDryrun()">
        <div class="num orange">{{ stat.dryrun }}</div>
        <div class="label">{{ t('message.pages.workflowRecordList.wrlTrialRun') }}</div>
      </div>
    </div>

    <div class="filter-card">
      <el-form inline size="small">
        <el-form-item :label="t('message.pages.workflowRecordList.wrlColFlowName')">
          <el-input v-model="filter.flowName" :placeholder="t('message.pages.workflowRecordList.wrlSearchPlaceholder')"" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item :label="t('message.pages.workflowRecordList.wrlColExecType')">
          <el-select v-model="filter.triggerType" :placeholder="t('message.global.all')" clearable style="width: 130px">
            <el-option :label="t('message.pages.workflowRecordList.wrlManualTrigger')" value="manual" />
            <el-option :label="t('message.pages.workflowRecordList.wrlTrialRun')" value="dryrun" />
            <el-option :label="t('message.pages.workflowRecordList.wrlColScheduleTask')" value="schedule" />
            <el-option :label="t('message.apiCall')" value="api" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('message.pages.workflowRecordList.wrlColExecStatus')">
          <el-select v-model="filter.status" :placeholder="t('message.global.all')" clearable style="width: 120px">
            <el-option :label="t('message.pages.workflowRecordList.wrlStatusRunning')" value="running" />
            <el-option :label="t('message.pages.workflowRecordList.wrlStatusSuccess')" value="success" />
            <el-option :label="t('message.pages.workflowRecordList.wrlStatusFail')" value="fail" />
            <el-option :label="t('message.pages.workflowRecordList.wrlStatusTerminated')" value="stopped" />
            <el-option v-if="hasFeature('WORKFLOW_APPROVAL_FLOW')" :label="t('message.pages.workflowRecordList.wrlStatusPendingApproval')" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('message.pages.workflowRecordList.wrlColExecutor')">
          <el-input v-model="filter.executor" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item :label="t('message.pages.workflowRecordList.wrlColExecTime')">
          <el-date-picker
            v-model="filter.timeRange"
            type="daterange"
            :range-separator="t('message.pages.workflowRecordList.wrlRangeSeparator')"
            :start-placeholder="t('message.pages.workflowRecordList.wrlColStartDate')"
            :end-placeholder="t('message.pages.workflowRecordList.wrlColEndDate')"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="onSearch">{{ t('message.global.query') }}</el-button>
          <el-button size="small" @click="resetFilter">{{ t('message.global.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-wrap">
      <div class="table-card">
        <div class="table-operate">
          <el-button size="small" type="danger" @click="batchStop" :disabled="!canBatchStop">{{ t('message.pages.workflowRecordList.wrlBatchTerminate') }}</el-button>
          <el-button size="small" @click="batchRerun" :disabled="!canBatchRerun">{{ t('message.pages.workflowRecordList.wrlBatchRerun') }}</el-button>
        </div>
        <el-table
          v-model:selection="selectionList"
          :data="recordList"
          border
          stripe
          size="small"
          height="100%"
          row-key="id"
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="instanceId" :label="t('message.pages.workflowRecordList.wrlColInstanceId')" width="180" />
          <el-table-column prop="flowName" :label="t('message.pages.workflowRecordList.wrlColFlowName')" min-width="200">
            <template #default="{ row }">
              <span class="link-text" @click="goDetail(row)">{{ row.flowName }}</span>
              <el-tag
                v-if="row.isDryrun"
                type="warning"
                effect="dark"
                size="small"
                style="margin-left: 6px; --el-tag-padding-horizontal: 5px; --el-tag-height: 18px; font-size: 11px;"
              >{{ t('message.pages.workflowRecordList.wrlTrialRun') }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('message.pages.workflowRecordList.wrlColTriggerMethod')" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.triggerType === 'dryrun'" type="warning" size="small">{{ t('message.pages.workflowRecordList.wrlTrialRun') }}</el-tag>
              <span v-else>{{ row.triggerTypeDisplay }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="executor" :label="t('message.pages.workflowRecordList.wrlColExecutor')" width="100" />
          <el-table-column prop="startTime" :label="t('message.pages.workflowRecordList.wrlColStartTime')" min-width="160" />
          <el-table-column prop="endTime" :label="t('message.pages.workflowRecordList.wrlColEndTime')" min-width="160" />
          <el-table-column prop="duration" :label="t('message.pages.workflowRecordList.wrlColDuration')" width="100" align="center" />
          <el-table-column prop="status" :label="t('message.pages.workflowRecordList.wrlColStatus')" width="100">
            <template #default="{ row }">
              <el-tag :type="statusTypeMap[row.status]" size="small">{{ statusTextMap[row.status] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('message.global.operation')" width="240" fixed="right">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="goDetail(row)">{{ t('message.global.detail') }}</el-button>
              <el-button size="small" text @click="viewLog(row)">{{ t('message.pages.workflowRecordList.wrlBtnLog') }}</el-button>
              <el-button
                v-if="STOPPABLE_STATUSES.has(row.status)"
                size="small"
                text
                type="danger"
                @click="stopExec(row)"
              >{{ t('message.pages.workflowRecordList.wrlBtnTerminate') }}</el-button>
              <el-button
                v-if="RERUNNABLE_STATUSES.has(row.status)"
                size="small"
                text
                :type="row.isLatestDagVersion ? 'success' : 'info'"
                :disabled="!row.isLatestDagVersion"
                @click="rerun(row)"
              >
                <el-tooltip
                  v-if="!row.isLatestDagVersion"
                  :content="row.versionBlockedTip || t('message.pages.workflowRecordList.wrVersionNotAllowRerun')"
                  placement="top"
                >
                  <span style="color:#909399">{{ t('message.pages.workflowRecordList.wrRerun') }}</span>
                </el-tooltip>
                <template v-else>{{ t('message.pages.workflowRecordList.wrRerun') }}</template>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="page.current"
          v-model:page-size="page.size"
          :total="page.total"
          :page-sizes="[15, 30, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </div>

    <!-- Rerun mode selection Dialog (shared by single instance + batch) -->
    <el-dialog
      v-model="rerunSelectVisible"
      :title="rerunSelectTitle"
      width="560px"
      :close-on-click-modal="true"
      destroy-on-close
      append-to-body
      @close="closeRerunSelectDialog"
    >
      <div class="rerun-select-dialog">
        <div v-if="rerunSelectSkippedHint" class="skipped-hint">{{ rerunSelectSkippedHint }}</div>
        <div class="rerun-mode-list">
          <div
            v-for="mode in [
              { key: 'full', titleKey: 'wrMode1All', hintKey: 'wrMode1HintParams', detail: rerunSelectDetail1 },
              { key: 'failed_only', titleKey: 'wrMode2Fail', hintKey: 'wrMode2HintFix', detail: rerunSelectDetail2 },
            ]"
            :key="mode.key"
            :class="['rerun-mode-card', { active: rerunSelectMode === mode.key }]"
            @click="rerunSelectMode = mode.key as 'full' | 'failed_only'"
          >
            <div class="rmc-radio">
              <el-radio :value="mode.key" v-model="rerunSelectMode" @click.stop />
            </div>
            <div class="rmc-body">
              <div class="rmc-title">{{ t('message.pages.workflowRecordList.' + mode.titleKey) }}</div>
              <div class="rmc-hint">{{ t('message.pages.workflowRecordList.' + mode.hintKey) }}</div>
              <div class="rmc-detail">{{ mode.detail }}</div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeRerunSelectDialog">{{ t('message.global.cancel') }}</el-button>
        <el-button type="primary" :disabled="!rerunSelectMode" @click="confirmRerunSelect">{{ t('message.pages.workflowRecordList.wrStartRerun') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useEditionStore } from '/@/editions'
import { GetList, CancelExecution, RerunExecution } from '/@/api/taurus/workflow/execution'
const { t } = useI18n()
const editionStore = useEditionStore()
const hasFeature = (code: string) => editionStore.hasFeature(code)

const router = useRouter()
const route = useRoute()
const recordList = ref<any[]>([])
const selectionList = ref<any[]>([])
const selectedStatusSnapshot = ref<{ hasStoppable: boolean; hasRerunnable: boolean }>({
  hasStoppable: false,
  hasRerunnable: false,
})
const page = reactive({ current: 1, size: 15, total: 0 })

const filter = reactive({
  flowName: '',
  triggerType: '',
  status: '',
  executor: '',
  timeRange: [] as string[],
  flowId: '' as string,
})

const stat = reactive({
  total: 0,
  running: 0,
  success: 0,
  fail: 0,
  dryrun: 0,
})

const STATUS_MAP: Record<number, string> = {
  0: 'pending',
  1: 'running',
  2: 'success',
  3: 'fail',
  4: 'cancelled',
}

const statusTextMap: Record<string, string> = {
  pending: 'Pending',
  running: 'Running',
  success: 'Success',
  fail: 'Failed',
  cancelled: 'Cancelled',
  stopped: 'Cancelled',
  skipped: 'Skipped',
}

const statusTypeMap: Record<string, string> = {
  pending: 'warning',
  running: 'primary',
  success: 'success',
  fail: 'danger',
  cancelled: 'info',
  stopped: 'info',
  skipped: 'warning',
}

const STOPPABLE_STATUSES = new Set(['running', 'pending'])
const RERUNNABLE_STATUSES = new Set(['success', 'fail', 'stopped', 'cancelled', 'skipped'])

const onSelectionChange = (val: any[]) => {
  selectionList.value = val
  selectedStatusSnapshot.value = {
    hasStoppable: val.some(item => STOPPABLE_STATUSES.has(item.status)),
    hasRerunnable: val.some(item => RERUNNABLE_STATUSES.has(item.status) && item.isLatestDagVersion !== false),
  }
}

const canBatchStop = computed(() => {
  if (selectedStatusSnapshot.value.hasStoppable) return true
  return selectionList.value.some(item => STOPPABLE_STATUSES.has(item.status))
})

const canBatchRerun = computed(() => {
  if (selectedStatusSnapshot.value.hasRerunnable) return true
  return selectionList.value.some(item => RERUNNABLE_STATUSES.has(item.status) && item.isLatestDagVersion !== false)
})

onMounted(() => {
  if (route.query.triggerType) {
    filter.triggerType = String(route.query.triggerType)
  }
  if (route.query.flowId) {
    filter.flowId = String(route.query.flowId)
  }
  if (route.query.status) {
    filter.status = String(route.query.status)
  }
  getRecordList()
})

const buildFilterParams = (extra: Record<string, any> = {}) => {
  const params: any = { ...extra }
  if (filter.flowName) params.workflow_name__icontains = filter.flowName
  if (filter.executor) params.creator__name__icontains = filter.executor
  if (filter.flowId) params.workflow = filter.flowId
  if (filter.timeRange && filter.timeRange.length === 2 && filter.timeRange[0] && filter.timeRange[1]) {
    const start = new Date(filter.timeRange[0])
    const end = new Date(filter.timeRange[1])
    end.setHours(23, 59, 59, 999)
    params.start_time__gte = start.toISOString().slice(0, 19).replace('T', ' ')
    params.start_time__lte = end.toISOString().slice(0, 19).replace('T', ' ')
  }
  if (filter.triggerType) params.trigger_type = filter.triggerType
  if (filter.status) {
    const rs = reverseStatusMap(filter.status)
    if (rs !== undefined) params.status = rs
  }
  return params
}

const applyStat = (source: any[], totalOverride?: number) => {
  const statSource = Array.isArray(source) ? source : []
  stat.total = typeof totalOverride === 'number' ? totalOverride : statSource.length
  stat.running = statSource.filter((r: any) => r.status === 1).length
  stat.success = statSource.filter((r: any) => r.status === 2).length
  stat.fail = statSource.filter((r: any) => r.status === 3).length
  stat.dryrun = statSource.filter((r: any) => (r.trigger_type || 'manual') === 'dryrun').length
}

const buildStatParams = () => {
  const params: any = { limit: 1000 }
  if (filter.flowName) params.workflow_name__icontains = filter.flowName
  if (filter.executor) params.creator__name__icontains = filter.executor
  if (filter.flowId) params.workflow = filter.flowId
  if (filter.timeRange && filter.timeRange.length === 2 && filter.timeRange[0] && filter.timeRange[1]) {
    const start = new Date(filter.timeRange[0])
    const end = new Date(filter.timeRange[1])
    end.setHours(23, 59, 59, 999)
    params.start_time__gte = start.toISOString().slice(0, 19).replace('T', ' ')
    params.start_time__lte = end.toISOString().slice(0, 19).replace('T', ' ')
  }
  return params
}

const getRecordList = async () => {
  try {
    const pageParams = buildFilterParams({ page: page.current, limit: page.size })
    const pagePromise = GetList(pageParams)
    const res = await pagePromise
    const pageArr = Array.isArray(res?.data) ? res.data : (res?.data?.results || res?.data || [])
    const total = (res as any)?.total ?? (res as any)?.count ?? pageArr.length
    page.total = total
    const results = pageArr as any[]

    const hasStatusOrTypeFilter = !!filter.status || !!filter.triggerType
    let statAllResults: any[] = []
    if (!hasStatusOrTypeFilter && total <= page.size && page.current === 1) {
      statAllResults = results
    } else {
      try {
        const statAllParams = buildStatParams()
        const statAllRes = await GetList(statAllParams)
        const statAllData = statAllRes?.data || statAllRes || {}
        statAllResults = Array.isArray(statAllData) ? statAllData : (statAllData.results || [])
      } catch {
        statAllResults = results
      }
    }

    recordList.value = results.map((item: any) => {
      const status = STATUS_MAP[item.status] || 'pending'
      let duration = '-'
      if (item.start_time && item.end_time) {
        const ms = new Date(item.end_time).getTime() - new Date(item.start_time).getTime()
        const sec = Math.floor(ms / 1000)
        duration = sec >= 60 ? `${Math.floor(sec / 60)}${t('message.pages.workflowRecordList.wrlDurationMin')}${sec % 60}${t('message.pages.workflowRecordList.wrlDurationSec')}` : `${sec}${t('message.pages.workflowRecordList.wrlDurationSec')}`
      }
      const isLatest = item.is_latest_dag_version !== false
      const execVer = item.dag_version_version
      const latestVer = item.latest_dag_version_version
      const versionBlockedTip = !isLatest && execVer != null && latestVer != null
        ? t('message.pages.workflowRecordList.wrVersionBlockedNew', { execVer, latestVer })
        : !isLatest
          ? t('message.pages.workflowRecordList.wrVersionNotAllowRerun')
          : ''
      return {
        id: item.id,
        instanceId: `WF${item.id}`,
        flowName: item.workflow_name || '-',
        executor: item.creator_name || item.creator?.name || item.creator || '-',
        startTime: item.start_time?.slice(0, 19) || '-',
        endTime: item.end_time?.slice(0, 19) || '-',
        duration,
        status,
        triggerType: item.trigger_type || 'manual',
        triggerTypeDisplay: item.trigger_type_display || (item.trigger_type === 'dryrun' ? t('message.pages.workflowRecordList.wrlTrialRun') : item.trigger_type === 'manual' ? t('message.pages.workflowRecordList.wrlManualTrigger') : item.trigger_type || '-'),
        isDryrun: !!item.is_dryrun || item.trigger_type === 'dryrun',
        isLatestDagVersion: isLatest,
        dagVersionVersion: execVer,
        latestDagVersionVersion: latestVer,
        versionBlockedTip,
      }
    })

    const statTotal = statAllResults.length ? statAllResults.length : total
    applyStat(statAllResults.length ? statAllResults : (total <= page.size && page.current === 1 ? results : []), statTotal)
  } catch {
    recordList.value = []
    page.total = 0
    applyStat([], 0)
  }
}

const reverseStatusMap = (s: string): number | undefined => {
  const map: Record<string, number> = { pending: 0, running: 1, success: 2, fail: 3, stopped: 4, cancelled: 4 }
  return map[s]
}

const onSearch = () => {
  page.current = 1
  getRecordList()
}

const filterByStatus = (status: string) => {
  filter.status = status
  filter.triggerType = ''
  page.current = 1
  getRecordList()
}

const filterByDryrun = () => {
  filter.status = ''
  filter.triggerType = filter.triggerType === 'dryrun' ? '' : 'dryrun'
  page.current = 1
  getRecordList()
}

const resetFilter = () => {
  filter.flowName = ''
  filter.triggerType = ''
  filter.status = ''
  filter.executor = ''
  filter.timeRange = []
  filter.flowId = ''
  page.current = 1
  getRecordList()
}

const onPageChange = (val: number) => {
  page.current = val
  getRecordList()
}

const onSizeChange = (val: number) => {
  page.size = val
  page.current = 1
  getRecordList()
}

const goDetail = (row: any) => {
  router.push(`/workflow/record/${row.id}`)
}

const viewLog = (row: any) => {
  router.push({ path: `/workflow/record/${row.id}`, query: { tab: 'log' } })
}

const stopExec = async (row: any) => {
  await ElMessageBox.confirm(t('message.pages.workflowRecordList.wrTerminateConfirmMsg', { id: row.instanceId }), t('message.pages.workflowRecordList.wrTerminateConfirm'), { type: 'warning' })
  try {
    await CancelExecution(row.id)
    row.status = 'stopped'
    ElMessage.success(t('message.pages.workflowRecordList.wrTerminated'))
    getRecordList()
  } catch (e: any) {
    ElMessage.error(t('message.pages.workflowRecordList.wrTerminateFail') + ': ' + (e?.message || ''))
  }
}

/* ========== Rerun mode selection Dialog ========== */
const rerunSelectVisible = ref(false)
const rerunSelectMode = ref<'full' | 'failed_only' | ''>('')
const rerunSelectTitle = ref('')
const rerunSelectDetail1 = ref('')
const rerunSelectDetail2 = ref('')
const rerunSelectSkippedHint = ref('')
let _rerunSelectResolver: ((_: 'full' | 'failed_only' | 'close') => void) | null = null

function openRerunSelectDialog(opts: {
  title: string
  detail1: string
  detail2: string
  skippedHint?: string
  defaultMode?: 'full' | 'failed_only'
}): Promise<'full' | 'failed_only' | 'close'> {
  rerunSelectTitle.value = opts.title
  rerunSelectDetail1.value = opts.detail1
  rerunSelectDetail2.value = opts.detail2
  rerunSelectSkippedHint.value = opts.skippedHint || ''
  rerunSelectMode.value = opts.defaultMode || 'failed_only'
  rerunSelectVisible.value = true
  return new Promise((resolve) => {
    _rerunSelectResolver = resolve
  })
}
function confirmRerunSelect() {
  const mode = rerunSelectMode.value as 'full' | 'failed_only'
  rerunSelectVisible.value = false
  _rerunSelectResolver?.(mode)
  _rerunSelectResolver = null
}
// When Dialog closes (click mask / top-right x / ESC), resolves to close
function closeRerunSelectDialog() {
  rerunSelectVisible.value = false
  _rerunSelectResolver?.('close')
  _rerunSelectResolver = null
}

const showRerunSelectDialog = (_execId: number, instanceLabel: string): Promise<'full' | 'failed_only' | 'close'> => {
  return openRerunSelectDialog({
    title: t('message.pages.workflowRecordList.wrRerunDialogTitle', { name: instanceLabel }),
    detail1: t('message.pages.workflowRecordList.wrBatchMode1DetailAlt'),
    detail2: t('message.pages.workflowRecordList.wrMode2DetailSingle'),
  })
}

const rerun = async (row: any) => {
  if (row.isLatestDagVersion === false) {
    ElMessage.warning(row.versionBlockedTip || t('message.pages.workflowRecordList.wrVersionNotAllowRerun'))
    return
  }
  try {
    let mode: 'full' | 'failed_only' = 'full'
    const status = String(row.status || '')
    if (status === 'success') {
      await ElMessageBox.confirm(t('message.pages.workflowRecordList.wrRerunConfirmMsgNew', { id: row.instanceId }), t('message.pages.workflowRecordList.wrRerunConfirm'), { type: 'warning' })
      mode = 'full'
    } else {
      const choice = await showRerunSelectDialog(row.id, row.instanceId)
      if (choice === 'close') return
      mode = choice
    }
    const res = await RerunExecution(row.id, mode) as any
    if (mode === 'full' && res?.data?.new_execution_id) {
      ElMessage.success(t('message.pages.workflowRecordList.wrRerunStarted', { id: res.data.new_execution_id }))
    } else if (mode === 'failed_only') {
      const cnt = res?.data?.reset_node_count ?? 0
      ElMessage.success(cnt > 0 ? t('message.pages.workflowRecordList.wrResetNodesAndResume', { n: cnt }) : t('message.pages.workflowRecordList.wrResumedExecution'))
    } else {
      ElMessage.success(t('message.pages.workflowRecordList.wrReranInstance', { id: row.instanceId }))
    }
    getRecordList()
  } catch (e: any) {
    if (e === 'cancel' || e === 'close') return
    if (e?.action === 'cancel' || e?.action === 'close') return
    ElMessage.error(t('message.pages.workflowRecordList.wrRerunFail') + ': ' + (e?.message || ''))
  }
}

const batchStop = async () => {
  const targets = selectionList.value.filter(item => STOPPABLE_STATUSES.has(item.status))
  if (targets.length === 0) {
    ElMessage.warning(t('message.pages.workflowRecordList.wrSelectRunningOrPending'))
    return
  }
  const ids = targets.map((x) => x.instanceId).join(t('wrlSep'))
  await ElMessageBox.confirm(t('message.pages.workflowRecordList.wrBatchTerminateMsg', { n: targets.length, ids }), t('message.pages.workflowRecordList.wrBatchTerminate'), { type: 'warning' })
  const promises = targets.map(item => CancelExecution(item.id).catch(() => {}))
  await Promise.all(promises)
  ElMessage.success(t('message.pages.workflowRecordList.wrBatchTerminateSuccess'))
  getRecordList()
}

const batchRerun = async () => {
  const eligible = selectionList.value.filter(item => RERUNNABLE_STATUSES.has(item.status))
  const targets = eligible.filter(item => item.isLatestDagVersion !== false)
  const skippedCount = eligible.length - targets.length
  if (targets.length === 0) {
    if (skippedCount > 0) {
      ElMessage.warning(t('message.pages.workflowRecordList.wrBatchVersionNotLatest', { n: skippedCount }))
    } else {
      ElMessage.warning(t('message.pages.workflowRecordList.wrSelectRerunnable'))
    }
    return
  }
  const allSuccess = targets.every(t => t.status === 'success')
  const anyFailed = targets.some(t => ['fail', 'stopped', 'cancelled', 'skipped'].includes(t.status))
  let mode: 'full' | 'failed_only' = 'full'

  const skippedHint = skippedCount > 0 ? t('message.pages.workflowRecordList.wrSkippedHint', { n: skippedCount }) : ''

  if (allSuccess) {
    await ElMessageBox.confirm(t('message.pages.workflowRecordList.wrBatchRerunConfirmMsg', { n: targets.length, skipped: skippedHint }), t('message.pages.workflowRecordList.wrBatchRerunConfirm'), { type: 'warning' })
    mode = 'full'
  } else if (anyFailed) {
    const choice = await openRerunSelectDialog({
      title: t('message.pages.workflowRecordList.wrBatchRerunDialogTitle'),
      detail1: t('message.pages.workflowRecordList.wrBatchMode1Detail', { n: targets.length }),
      detail2: t('message.pages.workflowRecordList.wrBatchMode2Detail'),
      skippedHint: skippedHint,
    })
    if (choice === 'close') return
    mode = choice
  }

  const promises = targets.map(item => {
    const effectiveMode = (mode === 'failed_only' && item.status === 'success') ? 'full' : mode
    return RerunExecution(item.id, effectiveMode).catch(() => {})
  })
  await Promise.all(promises)
  ElMessage.success(t('message.pages.workflowRecordList.wrBatchRerunSubmitted', { n: targets.length, skipped: skippedHint }))
  getRecordList()
}
</script>

<style scoped lang="scss">
.workflow-record-page {
  width: 100%;
  height: calc(100vh - 85px - 50px);
  padding: 16px;
  box-sizing: border-box;
  min-height: 0;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.page-header {
  flex-shrink: 0;
  h2 { margin: 0; font-size: 18px; color: #333; }
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  flex-shrink: 0;
}

.stat-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  min-height: 0;

  &:hover, &.active {
    border-color: #409EFF;
  }

  &:hover:has(.num.orange), &.active:has(.num.orange) {
    border-color: #E6A23C;
  }

  .num {
    font-size: 26px;
    font-weight: 600;
    color: #333;
    margin-bottom: 6px;
    &.blue { color: #409EFF; }
    &.green { color: #67C23A; }
    &.red { color: #F56C6C; }
    &.orange { color: #E6A23C; }
  }
  .label { font-size: 13px; color: #666; }
}

.filter-card {
  background: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  flex-shrink: 0;
}

.table-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  min-height: 0;
}

.table-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-operate {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.pagination-bar {
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  padding: 10px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.link-text { color: #409EFF; cursor: pointer; &:hover { text-decoration: underline; } }

/* Rerun mode selection Dialog */
.rerun-select-dialog {
  padding: 4px 0 12px;
  .skipped-hint {
    color: #E6A23C;
    margin-bottom: 14px;
    padding: 8px 12px;
    background: #fdf6ec;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.5;
  }
  .rerun-mode-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .rerun-mode-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 18px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    cursor: pointer;
    transition: border-color .15s, background .15s;
    min-height: 88px;
    &:hover { border-color: #c0c4cc; }
    &.active {
      border-color: var(--el-color-primary);
      background: #ecf5ff;
    }
    .rmc-radio {
      flex-shrink: 0;
      padding-top: 2px;
      :deep(.el-radio) {
        margin-right: 0;
        padding: 0;
        line-height: 1;
        span[class*="__label"] { display: none; }
      }
    }
    .rmc-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .rmc-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      line-height: 1.4;
    }
    .rmc-hint {
      font-size: 12px;
      color: #909399;
      line-height: 1.4;
    }
    .rmc-detail {
      font-size: 13px;
      color: #606266;
      line-height: 1.55;
      white-space: normal;
      word-break: break-word;
    }
  }
}
</style>