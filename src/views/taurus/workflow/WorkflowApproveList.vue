<template>
  <div class="wf-approve-page" v-if="hasFeature('WORKFLOW_APPROVAL_FLOW')">
    <div class="page-header">
      <div class="header-left">
        <div class="title">
          <h2>{{ t('message.pages.workflowApproveList.walPageTitle') }}</h2>
          <span class="desc">{{ t('message.pages.workflowApproveList.walPageDesc') }}</span>
        </div>
        <div class="quick-stats">
          <div class="quick-stat-item">
            <el-icon :size="14" color="#e6a23c"><Clock /></el-icon>
            <span class="quick-stat-value">{{ statCounts.pending }}</span>
            <span class="quick-stat-label">{{ t('message.pages.workflowApproveList.walPending') }}</span>
          </div>
          <div class="quick-stat-item">
            <el-icon :size="14" color="#67c23a"><CircleCheckFilled /></el-icon>
            <span class="quick-stat-value">{{ statCounts.approved }}</span>
            <span class="quick-stat-label">{{ t('message.pages.workflowApproveList.walApproved') }}</span>
          </div>
          <div class="quick-stat-item">
            <el-icon :size="14" color="#909399"><Document /></el-icon>
            <span class="quick-stat-value">{{ totalAll }}</span>
            <span class="quick-stat-label">{{ t('message.pages.workflowApproveList.walTotal') }}</span>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="loadList" circle>
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="stats-row">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="stat-card"
        :class="{ 'is-active': filterStatus === card.key }"
        @click="onStatCardClick(card.key)"
      >
        <div class="stat-icon" :style="{ background: card.gradient }">
          <el-icon :size="22"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ card.count }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
        <div v-if="filterStatus === card.key" class="stat-indicator"></div>
      </div>
    </div>

    <div class="approval-toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKey"
          :placeholder="t('message.pages.workflowApproveList.walSearchPh')"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterStatus" :placeholder="t('message.pages.workflowApproveList.walFilterStatus')" clearable class="status-filter" @change="handleSearch">
          <el-option :label="t('message.pages.workflowApproveList.walAllStatus')" value="" />
          <el-option :label="t('message.pages.workflowApproveList.walPending')" value="pending" />
          <el-option :label="t('message.pages.workflowApproveList.walApproved')" value="approved" />
          <el-option :label="t('message.pages.workflowApproveList.walRejected')" value="rejected" />
        </el-select>
        <el-select v-model="filterRisk" :placeholder="t('message.pages.workflowApproveList.walFilterRisk')" clearable class="status-filter" @change="handleSearch">
          <el-option :label="t('message.pages.workflowApproveList.walAllRisk')" value="" />
          <el-option :label="t('message.pages.workflowApproveList.walRiskHigh')" value="high" />
          <el-option :label="t('message.pages.workflowApproveList.walRiskMedium')" value="medium" />
          <el-option :label="t('message.pages.workflowApproveList.walRiskLow')" value="low" />
        </el-select>
        <el-radio-group v-model="viewType" @change="handleSearch" size="default">
          <el-radio-button value="all">{{ t('message.pages.workflowApproveList.walViewAll') }}</el-radio-button>
          <el-radio-button value="pending">{{ t('message.pages.workflowApproveList.walViewPending') }}</el-radio-button>
          <el-radio-button value="mine">{{ t('message.pages.workflowApproveList.walViewMine') }}</el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-button size="small" :disabled="!canReset" @click="resetFilters">
          <el-icon><RefreshLeft /></el-icon>
          {{ t('reset') }}
        </el-button>
      </div>
    </div>

    <div class="table-card">
      <el-table v-loading="loading" :data="tableData" stripe class="approval-table" style="width: 100%" @row-click="handleRowClick">
        <el-table-column :label="t('message.pages.workflowApproveList.walColWorkflow')" min-width="220">
          <template #default="{ row }">
            <div class="batch-cell">
              <span class="batch-id">{{ row.workflow?.name || '-' }}</span>
              <div class="host-info">
                <span class="host-name">{{ t('message.pages.workflowApproveList.walCategoryLabel') }}{{ row.workflow?.category_name || row.category_name || '-' }}</span>
                <span class="host-ip">{{ (row.workflow?.auth_type || row.auth_type) === 'public' ? t('message.global.public') : t('message.global.private') }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.workflowApproveList.walColRiskLevel')" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.risk_level" size="small" effect="dark" round :type="riskTagType(row.risk_level)">
              {{ riskLevelText(row.risk_level) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.workflowApproveList.walColRiskPoints')" width="100" align="center">
          <template #default="{ row }">
            <span class="risk-count" :class="riskCountClass(row)">{{ (row.risk_points || []).length }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.workflowApproveList.walColSubmitter')" width="110" align="center">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="24" :style="{ background: avatarColor(row.submitter_name || row.submitter_username) }" class="user-avatar">
                {{ (row.submitter_name || row.submitter_username || '?').charAt(0).toUpperCase() }}
              </el-avatar>
              <span>{{ row.submitter_name || row.submitter_username || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.workflowApproveList.walColStatus')" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType(row.status)" effect="dark" round>{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.workflowApproveList.walColApprover')" width="110" align="center">
          <template #default="{ row }">
            {{ row.approver_name || row.approver_username || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.workflowApproveList.walColTime')" width="170" align="center">
          <template #default="{ row }">
            <div class="time-cell">
              <div class="time-sub"><span class="time-label">{{ t('message.pages.workflowApproveList.walTimeSubmit') }}</span>{{ formatTime(row.create_datetime) }}</div>
              <div class="time-sub" v-if="row.approve_time"><span class="time-label">{{ t('message.pages.workflowApproveList.walTimeApprove') }}</span>{{ formatTime(row.approve_time) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.workflowApproveList.walColActions')" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click.stop="openDetail(row)">{{ t('detail') }}</el-button>
            <el-button v-if="row.status === 'pending'" size="small" type="success" link @click.stop="openApproveDialog(row)">{{ t('message.pages.workflowApproveList.walBtnApprove') }}</el-button>
            <el-button v-if="row.status === 'pending'" size="small" type="danger" link @click.stop="openRejectDialog(row)">{{ t('message.pages.workflowApproveList.walBtnReject') }}</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty v-if="!loading" :image-size="160" :description="t('message.pages.workflowApproveList.walEmptyTitle')">
            <div class="empty-hint">
              <el-icon :size="32" color="#c0c4cc"><Document /></el-icon>
              <p>{{ t('message.pages.workflowApproveList.walEmptyDesc') }}</p>
              <el-button type="primary" size="small" @click="resetFilters">{{ t('message.pages.workflowApproveList.walBtnResetFilter') }}</el-button>
            </div>
          </el-empty>
        </template>
      </el-table>
    </div>

    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="page.current"
        v-model:page-size="page.size"
        :total="page.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        small
        @current-change="loadList"
        @size-change="loadList"
      />
    </div>

    <!-- Details -->
    <el-dialog v-model="detailVisible" :title="t('message.pages.workflowApproveList.walDialogDetailTitle')" width="860px" top="4vh" destroy-on-close class="detail-dialog">
      <div v-if="currentRow" class="detail-content">
        <div class="detail-header">
          <div class="detail-title-area">
            <el-tag size="small" :type="statusTagType(currentRow.status)" effect="dark" round>{{ statusLabel(currentRow.status) }}</el-tag>
            <span class="detail-batch-id">{{ currentRow.workflow?.name || '-' }}</span>
            <el-tag v-if="currentRow.risk_level" size="small" effect="plain" round :type="riskTagType(currentRow.risk_level)" style="margin-left: 8px;">
              {{ t('message.pages.workflowApproveList.walRiskLabel') }}{{ riskLevelText(currentRow.risk_level) }}（{{ (currentRow.risk_points || []).length }}）
            </el-tag>
          </div>
          <div class="detail-host-area">
            <span class="detail-host-name">{{ currentRow.workflow?.category_name || currentRow.category_name || '' }}</span>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-title"><el-icon><Setting /></el-icon>{{ t('message.pages.workflowApproveList.walSectionBasic') }}</div>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item :label="t('message.pages.workflowApproveList.walColSubmitter')">{{ currentRow.submitter_name || currentRow.submitter_username || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.workflowApproveList.walColApprover')">{{ currentRow.approver_name || currentRow.approver_username || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.workflowApproveList.walColSubmitTime')">{{ formatTime(currentRow.create_datetime) }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.workflowApproveList.walColApproveTime')">{{ formatTime(currentRow.approve_time) }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.workflowApproveList.walColVisibility')">{{ (currentRow.workflow?.auth_type || currentRow.auth_type) === 'public' ? t('message.global.public') : t('message.global.private') }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.workflowApproveList.walColFlowMode')">{{ currentRow.workflow?.workflow_mode || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.workflowApproveList.walColExecCount')">{{ currentRow.workflow?.exec_count ?? 0 }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.workflowApproveList.walColLastExec')">{{ formatTime(currentRow.workflow?.last_exec_time) }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.workflowApproveList.walColHostCount')">{{ currentRow.workflow?.hosts_count ?? '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section" v-if="(currentRow.risk_points || []).length > 0">
          <div class="section-title"><el-icon><Warning /></el-icon>{{ t('message.pages.workflowApproveList.walSectionRisk') }}</div>
          <div class="risk-points">
            <div v-for="(p, idx) in currentRow.risk_points" :key="idx" class="risk-point-item" :class="pointClass(p)">
              <span class="badge">{{ pointBadge(p) }}</span>
              <span class="text">{{ stripPrefix(p) }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="currentRow.submit_desc || currentRow.approve_reason">
          <div class="section-title"><el-icon><ChatDotRound /></el-icon>{{ t('message.pages.workflowApproveList.walSectionDesc') }}</div>
          <div v-if="currentRow.submit_desc" class="desc-item">
            <span class="desc-label">{{ t('message.pages.workflowApproveList.walDescSubmit') }}</span>
            <span class="desc-text">{{ currentRow.submit_desc }}</span>
          </div>
          <div v-if="currentRow.approve_reason" class="desc-item">
            <span class="desc-label">{{ t('message.pages.workflowApproveList.walDescApprove') }}</span>
            <span class="desc-text">{{ currentRow.approve_reason }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- Approve -->
    <el-dialog v-model="approveVisible" :title="t('message.pages.workflowApproveList.walDialogApproveTitle')" width="480px" destroy-on-close>
      <el-form :model="approveForm" label-width="80px">
        <el-form-item :label="t('message.pages.workflowApproveList.walFormOpinion')">
          <el-input v-model="approveForm.approve_reason" type="textarea" :rows="3" :placeholder="t('message.pages.workflowApproveList.walApprovePh')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible = false">{{ t('cancel') }}</el-button>
        <el-button type="success" :loading="submitting" @click="doApprove">{{ t('message.pages.workflowApproveList.walBtnConfirmApprove') }}</el-button>
      </template>
    </el-dialog>

    <!-- Reject -->
    <el-dialog v-model="rejectVisible" :title="t('message.pages.workflowApproveList.walDialogRejectTitle')" width="480px" destroy-on-close>
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item :label="t('message.pages.workflowApproveList.walFormRejectReason')">
          <el-input v-model="rejectForm.approve_reason" type="textarea" :rows="4" :placeholder="t('message.pages.workflowApproveList.walRejectPh')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">{{ t('cancel') }}</el-button>
        <el-button type="danger" :loading="submitting" :disabled="!rejectForm.approve_reason?.trim()" @click="doReject">{{ t('message.pages.workflowApproveList.walBtnConfirmReject') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditionStore } from '/@/editions'
import { ElMessage, ElMessageBox } from 'element-plus'

const { t } = useI18n()
const hasFeature = (code: string) => useEditionStore().hasFeature(code)
import {
  Clock, Refresh, Search, RefreshLeft, CircleCheckFilled, Document,
  Warning, Setting, ChatDotRound,
} from '@element-plus/icons-vue'
import * as Api from '/@/api/taurus/workflow/approve'

const loading = ref(false)
const tableData = ref<any[]>([])
const page = reactive({ current: 1, size: 20, total: 0 })
const searchKey = ref('')
const filterStatus = ref<string>('')
const filterRisk = ref<string>('')
const viewType = ref<'all' | 'pending' | 'mine'>('all')
const statCounts = reactive({ pending: 0, approved: 0 })
const totalAll = ref(0)

const canReset = computed(() => !!(searchKey.value || filterStatus.value || filterRisk.value || viewType.value !== 'all'))

const statCards = computed(() => ([
  { key: '', label: t('message.pages.workflowApproveList.walAllRecords'), count: totalAll.value, icon: Document, gradient: 'linear-gradient(135deg,#409EFF,#1d72c9)' },
  { key: 'pending', label: t('message.pages.workflowApproveList.walPending'), count: statCounts.pending, icon: Clock, gradient: 'linear-gradient(135deg,#E6A23C,#d48806)' },
  { key: 'approved', label: t('message.pages.workflowApproveList.walApproved'), count: statCounts.approved, icon: CircleCheckFilled, gradient: 'linear-gradient(135deg,#67C23A,#4c9a2a)' },
]))

const avatarColor = (name: string) => {
  const str = (name || '?').toString()
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xfffffff
  return `hsl(${h % 360}, 60%, 55%)`
}

const formatTime = (t: any) => {
  if (!t) return '-'
  return (typeof t === 'string' ? t : new Date(t).toISOString()).replace('T', ' ').slice(0, 16)
}

const statusLabel = (s: string) => {
  if (s === 'pending') return t('message.pages.workflowApproveList.walPending')
  if (s === 'approved') return t('message.pages.workflowApproveList.walApproved')
  if (s === 'rejected') return t('message.pages.workflowApproveList.walRejected')
  return s || '-'
}
const statusTagType = (s: string) => {
  if (s === 'pending') return 'warning'
  if (s === 'approved') return 'success'
  if (s === 'rejected') return 'danger'
  return 'info'
}
const riskLevelText = (lv: string) => lv === 'high' ? t('message.pages.workflowApproveList.walRiskHigh') : lv === 'medium' ? t('message.pages.workflowApproveList.walRiskMedium') : t('message.pages.workflowApproveList.walRiskLow')
const riskTagType = (lv: string) => lv === 'high' ? 'danger' : lv === 'medium' ? 'warning' : 'success'
const riskCountClass = (row: any) => {
  const n = (row.risk_points || []).length
  if (n >= 5 || row.risk_level === 'high') return 'rc-high'
  if (n >= 2 || row.risk_level === 'medium') return 'rc-warning'
  return 'rc-low'
}

const pointClass = (p: string) => {
  if (p.includes('[high]')) return 'pt-high'
  if (p.includes('[warning]')) return 'pt-warning'
  return 'pt-info'
}
const pointBadge = (p: string) => (p.includes('[high]') ? t('message.pages.workflowApproveList.walRiskHigh') : p.includes('[warning]') ? t('message.pages.workflowApproveList.walPointWarning') : t('message.pages.workflowApproveList.walPointTip'))
const stripPrefix = (p: string) => p.replace(/^\[(high|warning|tip)\]\s*/, '').trim()

const loadList = async () => {
  loading.value = true
  try {
    const params: any = { page: page.current, limit: page.size }
    if (searchKey.value) params.search = searchKey.value
    if (filterStatus.value) params.status = filterStatus.value
    if (filterRisk.value) params.risk_level = filterRisk.value
    if (viewType.value !== 'all') params.view_type = viewType.value
    const res = await Api.GetList(params)
    // dvadmin paginated structure: { code,msg,page,limit,total,is_next,is_previous, data: [records] }
    // dvadmin non-paginated SuccessResponse: { code,msg,data: [records] }
    const records = Array.isArray(res?.data) ? res.data : (res?.data?.results || res?.data || [])
    tableData.value = records
    page.total = (res as any)?.total ?? (res as any)?.count ?? records.length
    // pending_count / approved_count / total_count are custom backend extension fields (not paginated).
    // Prefer top-level extension fields; fall back to data layer (if backend places custom fields alongside data).
    const top = (res && !Array.isArray(res) && typeof res === 'object') ? res : {}
    statCounts.pending = Number((top as any).pending_count ?? (res?.data && !Array.isArray(res.data) ? (res.data as any).pending_count : undefined) ?? 0)
    statCounts.approved = Number((top as any).approved_count ?? (res?.data && !Array.isArray(res.data) ? (res.data as any).approved_count : undefined) ?? 0)
    totalAll.value = Number((top as any).total_count ?? (res?.data && !Array.isArray(res.data) ? (res.data as any).total_count : undefined) ?? page.total)
  } catch (e: any) {
    ElMessage.error(t('message.pages.workflowApproveList.walMsgLoadFail') + ': ' + (e?.message || ''))
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.current = 1
  loadList()
}
const resetFilters = () => {
  searchKey.value = ''
  filterStatus.value = ''
  filterRisk.value = ''
  viewType.value = 'all'
  handleSearch()
}
const onStatCardClick = (k: string) => {
  filterStatus.value = k
  handleSearch()
}
const handleRowClick = (row: any) => openDetail(row)

// Details
const detailVisible = ref(false)
const currentRow = ref<any>(null)
const openDetail = async (row: any) => {
  try {
    const res = await Api.GetObj(row.id)
    currentRow.value = (res?.data || res || row)
    detailVisible.value = true
  } catch (e: any) {
    currentRow.value = row
    detailVisible.value = true
  }
}

// Approve / Reject
const submitting = ref(false)
const approveVisible = ref(false)
const rejectVisible = ref(false)
const approveTarget = ref<any>(null)
const approveForm = reactive({ approve_reason: t('message.pages.workflowApproveList.walDefaultApproveReason') })
const rejectForm = reactive({ approve_reason: '' })

const openApproveDialog = (row: any) => {
  approveTarget.value = row
  approveForm.approve_reason = t('message.pages.workflowApproveList.walDefaultApproveReason')
  approveVisible.value = true
}
const openRejectDialog = (row: any) => {
  approveTarget.value = row
  rejectForm.approve_reason = ''
  rejectVisible.value = true
}
const doApprove = async () => {
  if (!approveTarget.value) return
  submitting.value = true
  try {
    await Api.approve(approveTarget.value.id, approveForm.approve_reason || t('message.pages.workflowApproveList.walDefaultApproveReason'))
    ElMessage.success(t('message.pages.workflowApproveList.walMsgApproved'))
    approveVisible.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(t('message.pages.workflowApproveList.walMsgApproveFail') + ': ' + (e?.message || ''))
  } finally {
    submitting.value = false
  }
}
const doReject = async () => {
  if (!approveTarget.value || !rejectForm.approve_reason?.trim()) return
  submitting.value = true
  try {
    await Api.reject(approveTarget.value.id, rejectForm.approve_reason)
    ElMessage.success(t('message.pages.workflowApproveList.walMsgRejected'))
    rejectVisible.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(t('message.pages.workflowApproveList.walMsgRejectFail') + ': ' + (e?.message || ''))
  } finally {
    submitting.value = false
  }
}

onMounted(() => loadList())
</script>

<style scoped lang="scss">
@import '/@/assets/style/common.scss';
.wf-approve-page {
  width: 100%;
  min-height: 100%;
  padding: 16px;
  box-sizing: border-box;
  background: #f5f7fa;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
  .header-left { display: flex; align-items: center; gap: 24px; flex: 1; flex-wrap: wrap; }
  .title h2 { margin: 0 0 4px 0; font-size: 18px; color: #333; }
  .desc { font-size: 12px; color: #999; }
  .quick-stats { display: flex; gap: 16px; }
  .quick-stat-item { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: #fff; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,.05); }
  .quick-stat-value { font-size: 16px; font-weight: 700; color: #303133; }
  .quick-stat-label { font-size: 12px; color: #909399; }
  .header-actions { display: flex; gap: 8px; }
}
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  padding: 18px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,.05);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all .2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.1); }
  &.is-active { box-shadow: 0 0 0 2px #409EFF; }
  .stat-icon {
    width: 44px; height: 44px; border-radius: 10px; color: #fff;
    display: flex; align-items: center; justify-content: center; margin-right: 14px; flex-shrink: 0;
  }
  .stat-info { flex: 1; }
  .stat-value { font-size: 22px; font-weight: 700; color: #303133; }
  .stat-label { font-size: 13px; color: #909399; margin-top: 2px; }
  .stat-indicator {
    position: absolute; right: 0; top: 0; bottom: 0; width: 4px; background: #409EFF;
  }
}
.approval-toolbar {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  padding: 10px 14px; background: #fff; border-radius: 8px; margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
  .toolbar-left { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .search-input { width: 260px; }
  .status-filter { width: 130px; }
}
.table-card {
  background: #fff; border-radius: 8px; padding: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}
.batch-cell {
  .batch-id { font-weight: 600; color: #303133; margin-bottom: 4px; display: inline-block; }
  .host-info { font-size: 12px; color: #909399; display: flex; gap: 10px; }
}
.user-cell { display: inline-flex; align-items: center; gap: 6px; }
.user-avatar { font-size: 12px; }
.time-cell {
  display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; color: #606266;
  .time-label { color: #909399; margin-right: 4px; }
  .time-sub { display: flex; align-items: center; }
}
.risk-count { font-weight: 700; font-size: 14px; &.rc-high { color: #f56c6c; } &.rc-warning { color: #e6a23c; } &.rc-low { color: #67c23a; } }
.pagination-bar { margin-top: 14px; background: #fff; padding: 10px 14px; border-radius: 8px; display: flex; justify-content: flex-end; box-shadow: 0 1px 4px rgba(0,0,0,.04); }

.detail-content { display: flex; flex-direction: column; gap: 16px; }
.detail-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; background: linear-gradient(135deg,#f0f7ff,#ecf5ff); border-radius: 8px;
  .detail-title-area { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .detail-batch-id { font-size: 16px; font-weight: 600; color: #303133; }
  .detail-host-name { font-size: 13px; color: #606266; }
}
.detail-section {
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #303133; }
}
.risk-points { display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto; }
.risk-point-item {
  display: flex; gap: 10px; padding: 8px 12px; border-radius: 6px;
  .badge { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 10px; color: #fff; }
  .text { flex: 1; color: #303133; font-size: 13px; line-height: 1.55; word-break: break-all; }
  &.pt-high { background: #fef0f0; border: 1px solid #fbc4c4; .badge { background: #f56c6c; } }
  &.pt-warning { background: #fdf6ec; border: 1px solid #f5dab1; .badge { background: #e6a23c; } }
  &.pt-info { background: #ecf5ff; border: 1px solid #d9ecff; .badge { background: #409eff; } }
}
.desc-item {
  display: flex; gap: 12px; padding: 10px 12px; background: #fafafa; border-radius: 6px; margin-bottom: 8px;
  .desc-label { flex: 0 0 80px; color: #909399; font-size: 12px; padding-top: 2px; }
  .desc-text { flex: 1; color: #303133; font-size: 13px; line-height: 1.6; white-space: pre-wrap; }
}
</style>