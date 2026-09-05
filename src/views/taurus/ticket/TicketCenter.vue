<template>
  <EditionLockedPage feature="TICKET_CENTER" :label="t('message.pages.edition.lockedPageLabels.ticketCenter')">
  <div class="ticket-center-page">
    <!-- Top action filter bar -->
    <div class="page-header">
      <h2>{{ t('message.pages.ticketCenter.tcPageTitle') }}</h2>
      <div class="header-operate">
        <el-button type="primary" @click="openCreateTicket">{{ t('message.pages.ticketCenter.tcBtnNewTicket') }}</el-button>
      </div>
    </div>

    <!-- Tab categories -->
    <div class="tab-card">
      <el-tabs v-model="activeTab" @tab-change="getTicketList">
        <el-tab-pane :label="t('message.pages.ticketCenter.tcTabMine')" name="my">
          <span class="tab-text">{{ t('message.pages.ticketCenter.tcTabMine') }} <el-badge :value="4" class="tab-badge" /></span>
        </el-tab-pane>
        <el-tab-pane :label="t('message.pages.ticketCenter.tcTabPending')" name="pending">
          <span class="tab-text">{{ t('message.pages.ticketCenter.tcTabPending') }} <el-badge :value="3" type="warning" class="tab-badge" /></span>
        </el-tab-pane>
        <el-tab-pane :label="t('message.pages.ticketCenter.tcTabDone')" name="done">
          <span class="tab-text">{{ t('message.pages.ticketCenter.tcTabDone') }}</span>
        </el-tab-pane>
        <el-tab-pane :label="t('message.pages.ticketCenter.tcTabRejected')" name="reject">
          <span class="tab-text">{{ t('message.pages.ticketCenter.tcTabRejected') }}</span>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Filter bar -->
    <div class="filter-card">
      <el-form inline size="small">
        <el-form-item :label="t('message.pages.ticketCenter.tcFormType')">
          <el-select v-model="filterForm.type" :placeholder="t('message.pages.ticketCenter.tcAll')" clearable style="width: 140px">
            <el-option :label="t('message.pages.ticketCenter.tcTypeHost')" value="host" />
            <el-option :label="t('message.pages.ticketCenter.tcTypeScript')" value="script" />
            <el-option :label="t('message.pages.ticketCenter.tcTypeResource')" value="resource" />
            <el-option :label="t('message.pages.ticketCenter.tcTypeAccount')" value="account" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('message.pages.ticketCenter.tcFormTitle')">
          <el-input v-model="filterForm.title" :placeholder="t('message.pages.ticketCenter.tcTitlePh')" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item :label="t('message.pages.ticketCenter.tcFormTime')">
          <el-date-picker
            v-model="filterForm.timeRange"
            type="daterange"
            :range-separator="t('message.pages.ticketCenter.tcRangeTo')"
            :start-placeholder="t('message.pages.ticketCenter.tcStartDate')"
            :end-placeholder="t('message.pages.ticketCenter.tcEndDate')"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="getTicketList">{{ t('query') }}</el-button>
          <el-button size="small" @click="resetFilter">{{ t('reset') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- Ticket list -->
    <div class="table-wrap">
      <div class="table-card">
        <el-table :data="ticketList" border stripe size="small" height="100%">
          <el-table-column prop="ticketNo" :label="t('message.pages.ticketCenter.tcColTicketNo')" width="160" />
          <el-table-column prop="title" :label="t('message.pages.ticketCenter.tcColTitle')" min-width="220" show-overflow-tooltip />
          <el-table-column prop="type" :label="t('message.pages.ticketCenter.tcColType')" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ typeTextMap[row.type] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" :label="t('message.pages.ticketCenter.tcColStatus')" width="100">
            <template #default="{ row }">
              <el-tag :type="statusTypeMap[row.status]" size="small">{{ statusTextMap[row.status] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="submitUser" :label="t('message.pages.ticketCenter.tcColSubmitter')" width="100" />
          <el-table-column prop="submitTime" :label="t('message.pages.ticketCenter.tcColSubmitTime')" min-width="160" />
          <el-table-column prop="currentNode" :label="t('message.pages.ticketCenter.tcColCurrentNode')" width="120" />
          <el-table-column :label="t('message.pages.ticketCenter.tcColActions')" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="viewTicketDetail(row)">{{ t('detail') }}</el-button>
              <el-button v-if="activeTab==='pending'" size="small" text type="success" @click="approveTicket(row)">{{ t('message.pages.ticketCenter.tcBtnApprove') }}</el-button>
              <el-button v-if="row.status==='reject'" size="small" text @click="reSubmit(row)">{{ t('message.pages.ticketCenter.tcBtnResubmit') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="page.current"
          v-model:page-size="page.size"
          :total="page.total"
          layout="total, prev, pager, next, jumper"
          @change="getTicketList"
        />
      </div>
    </div>

    <!-- Ticket details drawer -->
    <el-drawer v-model="detailVisible" :title="t('message.pages.ticketCenter.tcDrawerDetailTitle')" size="50%" direction="rtl" destroy-on-close>
      <div class="ticket-detail" v-if="currentTicket">
        <div class="detail-section">
          <div class="section-title">{{ t('message.pages.ticketCenter.tcSectionBasic') }}</div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item :label="t('message.pages.ticketCenter.tcColTicketNo')">{{ currentTicket.ticketNo }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.ticketCenter.tcColType')">{{ typeTextMap[currentTicket.type] }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.ticketCenter.tcColSubmitter')">{{ currentTicket.submitUser }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.ticketCenter.tcColSubmitTime')">{{ currentTicket.submitTime }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.ticketCenter.tcColCurrentStatus')">
              <el-tag :type="statusTypeMap[currentTicket.status]" size="small">{{ statusTextMap[currentTicket.status] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.ticketCenter.tcColCurrentNode')">{{ currentTicket.currentNode }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="section-title">{{ t('message.pages.ticketCenter.tcSectionContent') }}</div>
          <div class="content-box">{{ currentTicket.content }}</div>
        </div>

        <div class="detail-section">
          <div class="section-title">{{ t('message.pages.ticketCenter.tcSectionFlow') }}</div>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in currentTicket.flowList"
              :key="index"
              :timestamp="item.time"
              :type="item.type"
            >
              <div class="flow-item">
                <div class="flow-node">{{ item.node }}</div>
                <div class="flow-user">{{ t('message.pages.ticketCenter.tcFlowHandler') }}{{ item.user }}</div>
                <div class="flow-remark" v-if="item.remark">{{ t('message.pages.ticketCenter.tcFlowRemark') }}{{ item.remark }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- Approval action area -->
        <div class="approve-section" v-if="activeTab === 'pending'">
          <el-divider>{{ t('message.pages.ticketCenter.tcDividerApprove') }}</el-divider>
          <el-form label-width="80px" size="small">
            <el-form-item :label="t('message.pages.ticketCenter.tcFormOpinion')">
              <el-input v-model="approveRemark" type="textarea" :rows="3" :placeholder="t('message.pages.ticketCenter.tcOpinionPh')" />
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="confirmApprove">{{ t('message.pages.ticketCenter.tcBtnAgree') }}</el-button>
              <el-button type="danger" @click="confirmReject">{{ t('message.pages.ticketCenter.tcBtnReject') }}</el-button>
              <el-button @click="detailVisible = false">{{ t('cancel') }}</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-drawer>
  </div>
  </EditionLockedPage>
  </template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditionStore } from '/@/editions'
import EditionLockedPage from '/@/components/EditionLockedPage.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const { t } = useI18n()
const hasFeature = (code) => useEditionStore().hasFeature(code)

const activeTab = ref('my')
const detailVisible = ref(false)
const currentTicket = ref(null)
const approveRemark = ref('')

const page = reactive({ current: 1, size: 10, total: 0 })
const ticketList = ref([])

const filterForm = reactive({
  type: '',
  title: '',
  timeRange: []
})

const typeTextMap = {
  host: t('message.pages.ticketCenter.tcTypeHost'),
  script: t('message.pages.ticketCenter.tcTypeScript'),
  resource: t('message.pages.ticketCenter.tcTypeResource'),
  account: t('message.pages.ticketCenter.tcTypeAccount')
}

const statusTextMap = {
  pending: t('message.pages.ticketCenter.tcStatusPending'),
  processing: t('message.pages.ticketCenter.tcStatusProcessing'),
  done: t('message.pages.ticketCenter.tcStatusDone'),
  reject: t('message.pages.ticketCenter.tcStatusRejected')
}

const statusTypeMap = {
  pending: 'warning',
  processing: 'primary',
  done: 'success',
  reject: 'danger'
}

onMounted(() => {
  if (!useEditionStore().hasFeature('TICKET_CENTER')) return
  getTicketList()
})

const getTicketList = () => {
  const mockData = [
    {
      ticketNo: 'WD202607160001', title: '生产环境10台业务服务器纳管申请', type: 'host',
      status: 'pending', submitUser: 'dev01', submitTime: '2026-07-16 09:15:00',
      currentNode: 'Admin approval',
      content: '因业务扩容需要，申请将10台新增业务服务器纳入运维平台统一管理，IP段：192.168.1.100-109。',
      flowList: [
        { node: 'Submitted', user: 'dev01', time: '2026-07-16 09:15:00', type: 'primary', remark: '' },
        { node: 'Dept leader approval', user: 'dev-leader', time: '2026-07-16 09:45:00', type: 'success', remark: '同意' }
      ]
    },
    {
      ticketNo: 'WD202607150003', title: '磁盘清理脚本执行权限申请', type: 'script',
      status: 'processing', submitUser: 'ops02', submitTime: '2026-07-15 14:20:00',
      currentNode: 'Executing',
      content: '申请获取生产环境磁盘清理脚本的执行权限，用于日常磁盘巡检维护。',
      flowList: [
        { node: 'Submitted', user: 'ops02', time: '2026-07-15 14:20:00', type: 'primary', remark: '' },
        { node: 'Ops admin approval', user: 'ops-leader', time: '2026-07-15 15:00:00', type: 'success', remark: '同意，注意操作规范' }
      ]
    },
    {
      ticketNo: 'WD202607100008', title: '数据库账号开通申请', type: 'account',
      status: 'done', submitUser: 'dba01', submitTime: '2026-07-10 10:00:00',
      currentNode: 'Completed',
      content: '申请开通生产库只读账号，用于数据查询与报表统计。',
      flowList: [
        { node: 'Submitted', user: 'dba01', time: '2026-07-10 10:00:00', type: 'primary', remark: '' },
        { node: 'DBA admin approval', user: 'dba-leader', time: '2026-07-10 10:30:00', type: 'success', remark: '同意，仅开放只读权限' },
        { node: 'Account provisioned', user: 'system', time: '2026-07-10 11:00:00', type: 'success', remark: '账号已开通' }
      ]
    },
    {
      ticketNo: 'WD202607080005', title: '测试环境资源扩容申请', type: 'resource',
      status: 'reject', submitUser: 'test01', submitTime: '2026-07-08 16:30:00',
      currentNode: 'Rejected',
      content: '申请测试环境服务器CPU从4核升级到8核，内存从8G升级到16G。',
      flowList: [
        { node: 'Submitted', user: 'test01', time: '2026-07-08 16:30:00', type: 'primary', remark: '' },
        { node: 'Ops admin approval', user: 'ops-leader', time: '2026-07-08 17:00:00', type: 'danger', remark: '资源使用率不足30%，暂不扩容' }
      ]
    }
  ]

  ticketList.value = mockData
  page.total = 18
}

const resetFilter = () => {
  filterForm.type = ''
  filterForm.title = ''
  filterForm.timeRange = []
  getTicketList()
}

const viewTicketDetail = (row) => {
  currentTicket.value = row
  detailVisible.value = true
  approveRemark.value = ''
}

const approveTicket = (row) => {
  viewTicketDetail(row)
}

const confirmApprove = () => {
  ElMessageBox.confirm(t('message.pages.ticketCenter.tcConfirmApproveMsg'), t('message.pages.ticketCenter.tcConfirmTitle'), { type: 'success' }).then(() => {
    detailVisible.value = false
    ElMessage.success(t('message.pages.ticketCenter.tcMsgApproved'))
    getTicketList()
  })
}

const confirmReject = () => {
  if (!approveRemark.value) return ElMessage.warning(t('message.pages.ticketCenter.tcMsgRejectReasonRequired'))
  ElMessageBox.confirm(t('message.pages.ticketCenter.tcConfirmRejectMsg'), t('message.pages.ticketCenter.tcConfirmTitle'), { type: 'warning' }).then(() => {
    detailVisible.value = false
    ElMessage.success(t('message.pages.ticketCenter.tcMsgRejected'))
    getTicketList()
  })
}

const reSubmit = (row) => {
  ElMessage.info(t('message.pages.ticketCenter.tcMsgResubmit'))
}

const openCreateTicket = () => {
  ElMessage.info(t('message.pages.ticketCenter.tcMsgOpenNew'))
}
</script>

<style scoped lang="scss">
.ticket-center-page {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;

  h2 {
    margin: 0;
    font-size: 18px;
    color: #333;
  }
}

.tab-card {
  background: #fff;
  border-radius: 8px 8px 0 0;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  flex-shrink: 0;

  .tab-text {
    font-size: 14px;
  }
  .tab-badge {
    margin-left: 6px;
  }
}

.filter-card {
  background: #fff;
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
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
  overflow: hidden;
  min-height: 0;
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

// Details drawer
.ticket-detail {
  padding: 0 10px;

  .detail-section {
    margin-bottom: 20px;

    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
      padding-left: 8px;
      border-left: 3px solid #409EFF;
    }
  }

  .content-box {
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;
    line-height: 1.6;
    color: #333;
  }

  .flow-item {
    .flow-node {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .flow-user, .flow-remark {
      font-size: 12px;
      color: #666;
      line-height: 1.6;
    }
  }

  .approve-section {
    margin-top: 20px;
  }
}
</style>