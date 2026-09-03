<template>
  <EditionLockedPage feature="WORKFLOW_APPROVAL_FLOW" label="工作流审批中心">
  <div class="wf-approval-instance-page">
    <div class="page-header">
      <div class="header-left">
        <div class="title">
          <h2>{{ t('message.pages.workflowApprovalInstance.waiPageTitle') }}</h2>
          <span class="desc">{{ t('message.pages.workflowApprovalInstance.waiPageDesc') }}</span>
        </div>
        <div class="quick-stats">
          <div class="quick-stat-item">
            <el-icon :size="14" color="#e6a23c"><Clock /></el-icon>
            <span class="quick-stat-value">{{ stats.pending }}</span>
            <span class="quick-stat-label">{{ t('message.pages.workflowApprovalInstance.waiPendingApproval') }}</span>
          </div>
          <div class="quick-stat-item">
            <el-icon :size="14" color="#67c23a"><CircleCheckFilled /></el-icon>
            <span class="quick-stat-value">{{ stats.approved }}</span>
            <span class="quick-stat-label">{{ t('message.pages.workflowApprovalInstance.waiApproved') }}</span>
          </div>
          <div class="quick-stat-item">
            <el-icon :size="14" color="#f56c6c"><CircleCloseFilled /></el-icon>
            <span class="quick-stat-value">{{ stats.rejected }}</span>
            <span class="quick-stat-label">{{ t('message.pages.workflowApprovalInstance.waiRejected') }}</span>
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
          :placeholder="t('message.pages.workflowApprovalInstance.waiSearchPlaceholder')"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterStatus" :placeholder="t('message.pages.workflowApprovalInstance.waiFilterStatus')" clearable class="status-filter" @change="handleSearch">
          <el-option :label="t('message.pages.workflowApprovalInstance.waiAllStatus')" value="" />
          <el-option :label="t('message.pages.workflowApprovalInstance.waiStatusPending')" value="pending" />
          <el-option :label="t('message.pages.workflowApprovalInstance.waiStatusApproving')" value="approving" />
          <el-option :label="t('waiOptionApproved')" value="approved" />
          <el-option :label="t('message.pages.workflowApprovalInstance.waiStatusRejected')" value="rejected" />
          <el-option :label="t('waiOptionCancelled')" value="cancelled" />
        </el-select>
        <el-select v-model="filterRisk" :placeholder="t('message.pages.workflowApprovalInstance.waiFilterRisk')" clearable class="status-filter" @change="handleSearch">
          <el-option :label="t('message.pages.workflowApprovalInstance.waiAllRisk')" value="" />
          <el-option :label="t('message.pages.workflowApprovalInstance.waiRiskHigh')" value="high" />
          <el-option :label="t('message.pages.workflowApprovalInstance.waiRiskMedium')" value="medium" />
          <el-option :label="t('message.pages.workflowApprovalInstance.waiRiskLow')" value="low" />
        </el-select>
        <el-radio-group v-model="viewType" @change="handleSearch" size="default">
          <el-radio-button value="all">{{ t('message.global.all') }}</el-radio-button>
          <el-radio-button value="pending">{{ t('message.pages.workflowApprovalInstance.waiRadioPendingMe') }}</el-radio-button>
          <el-radio-button value="mine">{{ t('message.pages.workflowApprovalInstance.waiRadioMine') }}</el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-button size="small" :disabled="!canReset" @click="resetFilters">
          <el-icon><RefreshLeft /></el-icon>
          {{ t('message.global.reset') }}
        </el-button>
      </div>
    </div>

    <div class="table-card">
      <el-table v-loading="loading" :data="tableData" stripe class="approval-table" style="width: 100%" @row-click="handleRowClick">
        <el-table-column :label="t('message.pages.workflowApprovalInstance.waiColFlowRule')" min-width="240">
          <template #default="{ row }">
            <div class="batch-cell">
              <span class="batch-id">{{ row.workflow?.name || '-' }}</span>
              <div class="host-info">
                <span class="host-name">{{ row.rule_name || t('waiDefaultRule') }}</span>
                <el-tag size="small" effect="plain">{{ stepText(row) }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.workflowApprovalInstance.waColRiskLevel')" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.risk_level" size="small" effect="dark" round :type="riskTagType(row.risk_level)">
              {{ riskLevelText(row.risk_level) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.workflowApprovalInstance.waColRiskCount')" width="100" align="center">
          <template #default="{ row }">
            <span class="risk-count" :class="riskCountClass(row)">{{ (row.risk_points || []).length }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.workflowApprovalInstance.waColSubmitter')" width="110" align="center">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="24" :style="{ background: avatarColor(row.submitter_name || row.submitter_username) }" class="user-avatar">
                {{ (row.submitter_name || row.submitter_username || '?').charAt(0).toUpperCase() }}
              </el-avatar>
              <span>{{ row.submitter_name || row.submitter_username || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.workflowApprovalInstance.waColCurrentNode')" width="160" align="center">
          <template #default="{ row }">
            <span v-if="row.status === 'pending' || row.status === 'approving'">
              {{ t('waiSectionIndex', { n: (row.current_node_index ?? 0) + 1 }) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.workflowApprovalInstance.waColStatus')" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType(row.status)" effect="dark" round>{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.workflowApprovalInstance.waColTime')" width="170" align="center">
          <template #default="{ row }">
            <div class="time-cell">
              <div class="time-sub"><span class="time-label">{{ t('message.pages.workflowApprovalInstance.waTimeSubmit') }}</span>{{ formatTime(row.create_datetime) }}</div>
              <div class="time-sub" v-if="row.finish_datetime"><span class="time-label">{{ t('message.pages.workflowApprovalInstance.waTimeEnd') }}</span>{{ formatTime(row.finish_datetime) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.global.operation')" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click.stop="openDetail(row)">{{ t('message.global.detail') }}</el-button>
            <el-button v-if="canHandle(row)" size="small" type="success" link @click.stop="openApproveDialog(row)">{{ t('message.global.approve') }}</el-button>
            <el-button v-if="canHandle(row)" size="small" type="danger" link @click.stop="openRejectDialog(row)">{{ t('message.global.reject') }}</el-button>
            <el-button v-if="row.status === 'pending' && isSubmitter(row)" size="small" link @click.stop="doCancel(row)">{{ t('message.global.cancel') }}</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty v-if="!loading" :image-size="160" :description="t('message.pages.workflowApprovalInstance.waEmptyNoRecords')">
            <div class="empty-hint">
              <el-icon :size="32" color="#c0c4cc"><Document /></el-icon>
              <p>{{ t('message.pages.workflowApprovalInstance.waEmptyNoMatch') }}</p>
              <el-button type="primary" size="small" @click="resetFilters">{{ t('message.pages.workflowApprovalInstance.waBtnResetFilter') }}</el-button>
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

    <!-- Details (with node transition timeline) -->
    <el-dialog v-model="detailVisible" :title="t('message.pages.workflowApprovalInstance.waDetailTitle')" width="900px" top="3vh" destroy-on-close class="detail-dialog">
      <div v-if="currentRow" class="detail-content">
        <div class="detail-header">
          <div class="detail-title-area">
            <el-tag size="small" :type="statusTagType(currentRow.status)" effect="dark" round>{{ statusLabel(currentRow.status) }}</el-tag>
            <span class="detail-batch-id">{{ currentRow.workflow?.name || t('waiDefaultWorkflowName') }}</span>
            <el-tag v-if="currentRow.risk_level" size="small" effect="plain" round :type="riskTagType(currentRow.risk_level)" style="margin-left: 8px;">
              {{ t('waiRiskLabelPrefix') }}{{ riskLevelText(currentRow.risk_level) }}（{{ (currentRow.risk_points || []).length }}）
            </el-tag>
          </div>
          <div class="detail-host-area">
            <span class="detail-host-name">{{ t('message.pages.workflowApprovalInstance.waiRuleLabel') }}{{ currentRow.rule_name || t('message.pages.workflowApprovalInstance.waiDefaultReview') }}</span>
          </div>
        </div>

        <el-tabs v-model="detailTab" type="border-card">
          <el-tab-pane :label="t('message.pages.workflowApprovalInstance.waTabFlow')" name="flow">
            <div v-loading="nodeLoading" class="node-timeline-area">
              <div v-if="nodeList.length === 0" class="empty-nodes">
                <el-empty :description="t('message.pages.workflowApprovalInstance.waEmptyNoNodes')" :image-size="80" />
              </div>
              <div v-else class="approval-timeline">
                <div
                  v-for="(node, idx) in nodeList"
                  :key="node.id"
                  class="timeline-item"
                >
                  <div class="timeline-node" :class="nodeStatusClass(node.status)">
                    <div class="node-order">{{ idx + 1 }}</div>
                  </div>
                  <div v-if="idx < nodeList.length - 1" class="timeline-connector" :class="nodeStatusClass(node.status)"></div>
                  <div class="node-card" :class="{ 'is-current': isCurrentNode(node, idx) }">
                    <div class="node-card-header">
                      <div class="node-title-row">
                        <h4>{{ node.node_name }}</h4>
                        <el-tag size="small" effect="plain">{{ node.approver_type_display }}</el-tag>
                        <el-tag size="small" :type="modeTagType(node.approval_mode)">{{ node.approval_mode_display }}</el-tag>
                        <el-tag size="small" :type="statusTagType(node.status)">{{ statusLabel(node.status) }}</el-tag>
                      </div>
                    </div>
                    <div class="node-card-body">
                      <div class="approvers-row" v-if="node.candidate_approvers?.length">
                        <div class="approvers-label">{{ t('message.pages.workflowApprovalInstance.waCandidateLabel') }}</div>
                        <div class="approvers-list">
                          <el-tag v-for="a in node.candidate_approvers" :key="a.user_id" size="small" type="info">
                            {{ a.name || a.username }}
                          </el-tag>
                        </div>
                      </div>
                      <div class="approvers-row" v-if="node.approved_by || node.approval_actions?.length">
                        <div class="approvers-label">{{ t('message.pages.workflowApprovalInstance.waResultLabel') }}</div>
                        <div class="approvers-list">
                          <template v-if="Array.isArray(node.approval_actions) && node.approval_actions.length > 0">
                            <div v-for="(action, ai) in node.approval_actions" :key="ai" class="action-chip" :class="'act-' + action.action">
                              <span class="act-user">{{ action.approver_name || action.approver_username }}</span>
                              <span class="act-action">{{ actionLabel(action.action) }}</span>
                              <span class="act-time" v-if="action.time">{{ formatTime(action.time) }}</span>
                              <span class="act-reason" v-if="action.reason">{{ action.reason }}</span>
                            </div>
                          </template>
                          <span v-else-if="node.approved_by">{{ node.approved_by }}</span>
                        </div>
                      </div>
                      <div v-if="node.reason" class="node-reason">
                        {{ t('waiReasonLabelPrefix') }}{{ node.reason }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="t('message.pages.workflowApprovalInstance.waTabBasic')" name="basic">
            <div class="detail-section">
              <el-descriptions :column="3" border size="small">
                <el-descriptions-item :label="t('waiLabelSubmitter')">{{ currentRow.submitter_name || currentRow.submitter_username || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('message.pages.workflowApprovalInstance.waColSubmitTime')">{{ formatTime(currentRow.create_datetime) }}</el-descriptions-item>
                <el-descriptions-item :label="t('message.pages.workflowApprovalInstance.waColEndTime')">{{ formatTime(currentRow.finish_datetime) }}</el-descriptions-item>
                <el-descriptions-item :label="t('waiLabelAuditRule')">{{ currentRow.rule_name || t('waiDefaultRule') }}</el-descriptions-item>
                <el-descriptions-item :label="t('waiLabelAuthType')">{{ currentRow.workflow?.auth_type === 'public' ? t('message.global.public') : t('message.global.private') }}</el-descriptions-item>
                <el-descriptions-item :label="t('waiLabelFlowMode')">{{ currentRow.workflow?.workflow_mode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('message.pages.workflowApprovalInstance.waColCurrentNode')" :span="3">
                  {{ t('waiSectionIndexWithTotal', { n: (currentRow.current_node_index ?? 0) + 1, total: nodeList.length }) }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="t('message.pages.workflowApprovalInstance.waTabRisk')" name="risk" v-if="(currentRow.risk_points || []).length > 0">
            <div class="risk-points">
              <div v-for="(p, idx) in currentRow.risk_points" :key="idx" class="risk-point-item" :class="pointClass(p)">
                <span class="badge">{{ pointBadge(p) }}</span>
                <span class="text">{{ stripPrefix(p) }}</span>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="t('message.pages.workflowApprovalInstance.waTabDesc')" name="desc" v-if="currentRow.submit_desc || currentRow.reject_reason || currentRow.cancel_reason">
            <div v-if="currentRow.submit_desc" class="desc-item">
              <span class="desc-label">{{ t('message.pages.workflowApprovalInstance.waDescSubmit') }}</span>
              <span class="desc-text">{{ currentRow.submit_desc }}</span>
            </div>
            <div v-if="currentRow.reject_reason" class="desc-item">
              <span class="desc-label">{{ t('message.pages.workflowApprovalInstance.waDescReject') }}</span>
              <span class="desc-text">{{ currentRow.reject_reason }}</span>
            </div>
            <div v-if="currentRow.cancel_reason" class="desc-item">
              <span class="desc-label">{{ t('message.pages.workflowApprovalInstance.waDescCancel') }}</span>
              <span class="desc-text">{{ currentRow.cancel_reason }}</span>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button-group v-if="canHandle(currentRow)">
          <el-button type="success" @click="openApproveDialog(currentRow)">{{ t('message.global.approve') }}</el-button>
          <el-button type="danger" @click="openRejectDialog(currentRow)">{{ t('message.global.reject') }}</el-button>
          <el-button @click="openDelegateDialog(currentRow)">{{ t('message.pages.workflowApprovalInstance.waBtnDelegate') }}</el-button>
          <el-button @click="openAddSignDialog(currentRow)">{{ t('message.pages.workflowApprovalInstance.waBtnAddSign') }}</el-button>
        </el-button-group>
        <el-button @click="detailVisible = false">{{ t('message.global.close') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="approveVisible" :title="t('message.pages.workflowApprovalInstance.waTitleApprove')" width="480px" destroy-on-close>
      <el-form :model="approveForm" label-width="80px">
        <el-form-item :label="t('message.pages.workflowApprovalInstance.waOpinion')">
          <el-input v-model="approveForm.reason" type="textarea" :rows="3" :placeholder="t('message.pages.workflowApprovalInstance.waPhApproveOpinion')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible = false">{{ t('message.global.cancel') }}</el-button>
        <el-button type="success" :loading="submitting" @click="doApprove">{{ t('message.pages.workflowApprovalInstance.waBtnConfirmApprove') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectVisible" :title="t('message.pages.workflowApprovalInstance.waTitleReject')" width="480px" destroy-on-close>
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item :label="t('message.pages.workflowApprovalInstance.waRejectReason')" required>
          <el-input v-model="rejectForm.reason" type="textarea" :rows="4" :placeholder="t('message.pages.workflowApprovalInstance.waPhRejectReason')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">{{ t('message.global.cancel') }}</el-button>
        <el-button type="danger" :loading="submitting" :disabled="!rejectForm.reason?.trim()" @click="doReject">{{ t('message.pages.workflowApprovalInstance.waBtnConfirmReject') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="delegateVisible" :title="t('message.pages.workflowApprovalInstance.waTitleDelegate')" width="480px" destroy-on-close>
      <el-form :model="delegateForm" label-width="80px">
        <el-form-item :label="t('message.pages.workflowApprovalInstance.waColDelegateTo')" required>
          <el-select v-model="delegateForm.to_user_id" filterable :placeholder="t('message.pages.workflowApprovalInstance.waPhSelectUser')" style="width: 100%">
            <el-option
              v-for="u in userList"
              :key="u.id"
              :label="u.username + (u.name ? ` (${u.name})` : '')"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('message.pages.workflowApprovalInstance.waColDelegateReason')">
          <el-input v-model="delegateForm.reason" type="textarea" :rows="2" :placeholder="t('message.pages.workflowApprovalInstance.waPhDelegateReason')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="delegateVisible = false">{{ t('message.global.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" :disabled="!delegateForm.to_user_id" @click="doDelegate">{{ t('message.pages.workflowApprovalInstance.waBtnConfirmDelegate') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="addSignVisible" :title="t('message.pages.workflowApprovalInstance.waTitleAddSign')" width="480px" destroy-on-close>
      <el-form :model="addSignForm" label-width="80px">
        <el-form-item :label="t('message.pages.workflowApprovalInstance.waColAddSignUsers')" required>
          <el-select v-model="addSignForm.user_ids" multiple filterable :placeholder="t('message.pages.workflowApprovalInstance.waPhSelectUser')" style="width: 100%">
            <el-option
              v-for="u in userList"
              :key="u.id"
              :label="u.username + (u.name ? ` (${u.name})` : '')"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('message.pages.workflowApprovalInstance.waColAddSignReason')">
          <el-input v-model="addSignForm.reason" type="textarea" :rows="2" :placeholder="t('message.pages.workflowApprovalInstance.waPhAddSignReason')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addSignVisible = false">{{ t('message.global.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" :disabled="!(addSignForm.user_ids||[]).length" @click="doAddSign">{{ t('message.pages.workflowApprovalInstance.waBtnConfirmAddSign') }}</el-button>
      </template>
    </el-dialog>
  </div>
  </EditionLockedPage>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import EditionLockedPage from '/@/components/EditionLockedPage.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Clock, Refresh, Search, RefreshLeft, CircleCheckFilled, CircleCloseFilled, Document,
  Warning,
} from '@element-plus/icons-vue'
import { request } from '/@/utils/service'
import * as Api from '/@/api/taurus/workflow/approval-instance'
import { useUserInfo } from '/@/stores/userInfo'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const userStore = useUserInfo()
const { userInfos } = storeToRefs(userStore)

const loading = ref(false)
const nodeLoading = ref(false)
const submitting = ref(false)
const tableData = ref<any[]>([])
const page = reactive({ current: 1, size: 20, total: 0 })
const searchKey = ref('')
const filterStatus = ref<string>('')
const filterRisk = ref<string>('')
const viewType = ref<'all' | 'pending' | 'mine'>('all')
const stats = reactive({ pending: 0, approved: 0, rejected: 0 })
const userList = ref<any[]>([])

const canReset = computed(() => !!(searchKey.value || filterStatus.value || filterRisk.value || viewType.value !== 'all'))

const statCards = computed(() => ([
  { key: '', label: t('message.pages.workflowApprovalInstance.waiAllRecords'), count: page.total, icon: Document, gradient: 'linear-gradient(135deg,#409EFF,#1d72c9)' },
  { key: 'pending', label: t('message.pages.workflowApprovalInstance.waiStatPendingMe'), count: stats.pending, icon: Clock, gradient: 'linear-gradient(135deg,#E6A23C,#d48806)' },
  { key: 'approved', label: t('waiOptionApproved'), count: stats.approved, icon: CircleCheckFilled, gradient: 'linear-gradient(135deg,#67C23A,#4c9a2a)' },
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
  switch (s) {
    case 'pending': return t('message.pages.workflowApprovalInstance.waiStatusPending')
    case 'approving': return t('message.pages.workflowApprovalInstance.waiStatusApproving')
    case 'approved': return t('message.pages.workflowApprovalInstance.waiStatusApproved')
    case 'rejected': return t('message.pages.workflowApprovalInstance.waiStatusRejected')
    case 'cancelled': return t('message.pages.workflowApprovalInstance.waiStatusCancelled')
    default: return s || '-'
  }
}
const statusTagType = (s: string) => {
  switch (s) {
    case 'pending':
    case 'approving': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    case 'cancelled': return 'info'
    default: return 'info'
  }
}
const modeTagType = (m: string) => {
  switch (m) {
    case 'any': return 'success'
    case 'all': return 'warning'
    case 'first': return 'info'
    default: return ''
  }
}
const actionLabel = (a: string) => {
  switch (a) {
    case 'approve': return t('message.pages.workflowApprovalInstance.waiActionApprove')
    case 'reject': return t('message.pages.workflowApprovalInstance.waiActionReject')
    case 'delegate': return t('message.pages.workflowApprovalInstance.waiActionDelegate')
    case 'add_sign': return t('message.pages.workflowApprovalInstance.waiActionAddSign')
    case 'cancel': return t('message.pages.workflowApprovalInstance.waiActionCancel')
    default: return a || '-'
  }
}
const nodeStatusClass = (s: string) => {
  switch (s) {
    case 'approved': return 'node-approved'
    case 'rejected': return 'node-rejected'
    case 'cancelled': return 'node-cancelled'
    case 'pending': return 'node-pending'
    default: return 'node-pending'
  }
}
const riskLevelText = (lv: string) => lv === 'high' ? t('message.pages.workflowApprovalInstance.waiRiskHigh') : lv === 'medium' ? t('message.pages.workflowApprovalInstance.waiRiskMedium') : t('message.pages.workflowApprovalInstance.waiRiskLow')
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
const pointBadge = (p: string) => (p.includes('[high]') ? t('message.pages.workflowApprovalInstance.waiRiskHigh') : p.includes('[warning]') ? t('message.pages.workflowApprovalInstance.waiRiskWarn') : t('message.pages.workflowApprovalInstance.waiHint'))
const stripPrefix = (p: string) => p.replace(/^\[(high|warning|tip)\]\s*/, '').trim()

const stepText = (row: any) => {
  if (row.status === 'approved') return t('message.pages.workflowApprovalInstance.waiStepCompleted')
  if (row.status === 'rejected') return t('message.pages.workflowApprovalInstance.waiStepRejected')
  if (row.status === 'cancelled') return t('message.pages.workflowApprovalInstance.waiStepCancelled')
  const ci = row.current_node_index ?? 0
  return t('message.pages.workflowApprovalInstance.waiStepOf', { n: ci + 1 })
}

const isSubmitter = (row: any) => {
  const id = row.submitter_id ?? row.submitter?.id
  return false
}

const canHandle = (row: any) => {
  if (!row || (row.status !== 'pending' && row.status !== 'approving')) return false
  const currentUserId = userInfos.value?.id
  if (!currentUserId) return false
  const candidates = row.candidate_approvers || []
  if (!candidates.length) return false
  return candidates.some((a: any) => a.user_id === currentUserId)
}

const currentNodeIdx = ref<number>(0)
const isCurrentNode = (node: any, idx: number) => {
  return (
    (currentRow.value?.status === 'pending' || currentRow.value?.status === 'approving') &&
    idx === (currentRow.value?.current_node_index ?? 0)
  )
}

const loadUsers = async () => {
  try {
    const res: any = await request({ url: '/api/taurus/user-options/', method: 'get', params: { size: 200 } })
    userList.value = res.data?.results || res.data || []
  } catch (e) { /* noop */ }
}

const loadStats = async () => {
  try {
    const res: any = await Api.getStatsCount()
    const d = res?.data || {}
    stats.pending = Number(d.pending || d.pending_count || 0)
    stats.approved = Number(d.approved || d.approved_count || 0)
    stats.rejected = Number(d.rejected || d.rejected_count || 0)
  } catch (e) { /* noop */ }
}

const loadList = async () => {
  loading.value = true
  try {
    const params: any = { page: page.current, size: page.size }
    if (searchKey.value) params.search = searchKey.value
    if (filterStatus.value) params.status = filterStatus.value
    if (filterRisk.value) params.risk_level = filterRisk.value
    if (viewType.value !== 'all') params.view_type = viewType.value
    const res = await Api.GetList(params)
    const records = Array.isArray(res?.data) ? res.data : (res?.data?.results || res?.data || [])
    tableData.value = records
    page.total = (res as any)?.total ?? (res as any)?.count ?? records.length
  } catch (e: any) {
    ElMessage.error(t('message.pages.workflowApprovalInstance.waiLoadFail') + ': ' + (e?.message || ''))
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

const detailVisible = ref(false)
const detailTab = ref('flow')
const currentRow = ref<any>(null)
const nodeList = ref<any[]>([])
const handleRowClick = (row: any) => openDetail(row)

const openDetail = async (row: any) => {
  currentRow.value = row
  detailTab.value = 'flow'
  detailVisible.value = true
  nodeList.value = []
  nodeLoading.value = true
  try {
    const res = await Api.getNodes(row.id)
    nodeList.value = res?.data || []
  } catch (e) {
    nodeList.value = []
  } finally {
    nodeLoading.value = false
  }
}

const approveVisible = ref(false)
const rejectVisible = ref(false)
const delegateVisible = ref(false)
const addSignVisible = ref(false)
const approveTarget = ref<any>(null)
const approveForm = reactive({ reason: t('message.pages.workflowApprovalInstance.waiDefaultReason') })
const rejectForm = reactive({ reason: '' })
const delegateForm = reactive({ to_user_id: null as any, reason: '' })
const addSignForm = reactive({ user_ids: [] as number[], reason: '' })

const openApproveDialog = (row: any) => {
  approveTarget.value = row
  approveForm.reason = t('message.pages.workflowApprovalInstance.waiDefaultReason')
  approveVisible.value = true
}
const openRejectDialog = (row: any) => {
  approveTarget.value = row
  rejectForm.reason = ''
  rejectVisible.value = true
}
const openDelegateDialog = (row: any) => {
  approveTarget.value = row
  delegateForm.to_user_id = null
  delegateForm.reason = ''
  delegateVisible.value = true
}
const openAddSignDialog = (row: any) => {
  approveTarget.value = row
  addSignForm.user_ids = []
  addSignForm.reason = ''
  addSignVisible.value = true
}

const doApprove = async () => {
  if (!approveTarget.value) return
  submitting.value = true
  try {
    await Api.approve(approveTarget.value.id, approveForm.reason || t('message.pages.workflowApprovalInstance.waiDefaultReason'))
    ElMessage.success(t('message.pages.workflowApprovalInstance.waiApproved'))
    approveVisible.value = false
    loadList(); loadStats()
    if (detailVisible.value) openDetail(currentRow.value)
  } catch (e: any) {
    ElMessage.error(t('message.pages.workflowApprovalInstance.waiOpFail') + ': ' + (e?.message || ''))
  } finally {
    submitting.value = false
  }
}
const doReject = async () => {
  if (!approveTarget.value || !rejectForm.reason?.trim()) return
  submitting.value = true
  try {
    await Api.reject(approveTarget.value.id, rejectForm.reason)
    ElMessage.success(t('message.pages.workflowApprovalInstance.waiRejected'))
    rejectVisible.value = false
    loadList(); loadStats()
    if (detailVisible.value) openDetail(currentRow.value)
  } catch (e: any) {
    ElMessage.error(t('message.pages.workflowApprovalInstance.waiOpFail') + ': ' + (e?.message || ''))
  } finally {
    submitting.value = false
  }
}
const doDelegate = async () => {
  if (!approveTarget.value || !delegateForm.to_user_id) return
  submitting.value = true
  try {
    await Api.delegate(approveTarget.value.id, Number(delegateForm.to_user_id), delegateForm.reason)
    ElMessage.success(t('message.pages.workflowApprovalInstance.waiDelegated'))
    delegateVisible.value = false
    loadList(); loadStats()
    if (detailVisible.value) openDetail(currentRow.value)
  } catch (e: any) {
    ElMessage.error(t('message.pages.workflowApprovalInstance.waiOpFail') + ': ' + (e?.message || ''))
  } finally {
    submitting.value = false
  }
}
const doAddSign = async () => {
  if (!approveTarget.value || !(addSignForm.user_ids || []).length) return
  submitting.value = true
  try {
    await Api.addSign(approveTarget.value.id, addSignForm.user_ids, addSignForm.reason)
    ElMessage.success(t('message.pages.workflowApprovalInstance.waiAddSigned'))
    addSignVisible.value = false
    loadList(); loadStats()
    if (detailVisible.value) openDetail(currentRow.value)
  } catch (e: any) {
    ElMessage.error(t('message.pages.workflowApprovalInstance.waiOpFail') + ': ' + (e?.message || ''))
  } finally {
    submitting.value = false
  }
}
const doCancel = async (row: any) => {
  try {
    await ElMessageBox.confirm(t('message.pages.workflowApprovalInstance.waiRevokeConfirmMsg'), t('message.pages.workflowApprovalInstance.waiConfirm'), { type: 'warning' })
    await Api.cancel(row.id)
    ElMessage.success(t('message.pages.workflowApprovalInstance.waiRevoked'))
    loadList(); loadStats()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(t('message.pages.workflowApprovalInstance.waiOpFail') + ': ' + (e?.message || ''))
  }
}

onMounted(async () => {
  await Promise.all([loadUsers(), loadStats()])
  loadList()
})
</script>

<style scoped lang="scss">
@import '/@/assets/style/common.scss';
.wf-approval-instance-page {
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
.table-card { background: #fff; border-radius: 8px; padding: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.04); }
.batch-cell {
  .batch-id { font-weight: 600; color: #303133; margin-bottom: 4px; display: inline-block; }
  .host-info { font-size: 12px; color: #909399; display: flex; gap: 10px; align-items: center; }
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
.detail-section { .section-title { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #303133; } }

.node-timeline-area { padding: 8px 0; }
.empty-nodes { min-height: 200px; display: flex; align-items: center; justify-content: center; }
.approval-timeline { position: relative; padding-left: 44px; }
.timeline-item { position: relative; padding-bottom: 20px; }
.timeline-node {
  position: absolute; left: -44px; top: 0;
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 600; z-index: 2;
  background: #909399;
  &.node-pending { background: #e6a23c; }
  &.node-approved { background: #67c23a; }
  &.node-rejected { background: #f56c6c; }
  &.node-cancelled { background: #909399; }
  .node-order { font-size: 13px; }
}
.timeline-connector {
  position: absolute; left: -31px; top: 32px; bottom: 0; width: 2px;
  background: #e4e7ed;
  &.node-approved { background: #c2e7b0; }
  &.node-rejected { background: #fbc4c4; }
  &.node-pending { background: #f5dab1; }
}
.node-card {
  background: #fff; border-radius: 8px; padding: 14px;
  border: 1px solid #ebeef5; transition: all .2s;
  &:hover { box-shadow: 0 4px 12px rgba(0,0,0,.06); }
  &.is-current {
    border-color: #409eff;
    box-shadow: 0 0 0 1px rgba(64,158,255,.2), 0 4px 12px rgba(64,158,255,.1);
  }
  .node-card-header {
    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;
    .node-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    h4 { margin: 0; font-size: 14px; color: #303133; font-weight: 600; }
  }
  .node-card-body { display: flex; flex-direction: column; gap: 8px; }
  .approvers-row { display: flex; gap: 10px; font-size: 13px; align-items: flex-start; }
  .approvers-label { color: #909399; flex-shrink: 0; padding-top: 2px; }
  .approvers-list { flex: 1; display: flex; flex-wrap: wrap; gap: 6px; }
  .action-chip {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 4px 10px; border-radius: 12px; font-size: 12px; background: #f5f7fa;
    .act-user { color: #303133; font-weight: 500; }
    .act-action { padding: 0 6px; border-radius: 4px; color: #fff; }
    &.act-approve .act-action { background: #67c23a; }
    &.act-reject .act-action { background: #f56c6c; }
    &.act-delegate .act-action, &.act-add_sign .act-action { background: #909399; }
    .act-time { color: #909399; }
    .act-reason { color: #606266; }
  }
  .node-reason { font-size: 12px; color: #606266; background: #fafafa; padding: 6px 10px; border-radius: 4px; }
}

.risk-points { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; padding: 4px; }
.risk-point-item {
  display: flex; gap: 10px; padding: 8px 12px; border-radius: 6px;
  .badge { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 10px; color: #fff; flex-shrink: 0; }
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