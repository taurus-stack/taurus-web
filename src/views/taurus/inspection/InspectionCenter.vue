<template>
  <EditionLockedPage feature="INSPECTION_CENTER" label="巡检中心">
  <div class="inspection-page">
    <!-- Stats cards -->
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-num">{{ statData.taskCount }}</div>
        <div class="stat-label">{{ t('message.pages.inspectionCenter.icTaskCount') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-num stat-blue">{{ statData.todayCount }}</div>
        <div class="stat-label">{{ t('message.pages.inspectionCenter.icTodayCount') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-num stat-green">{{ statData.avgScore }}{{ t('message.pages.inspectionCenter.icScoreUnit') }}</div>
        <div class="stat-label">{{ t('message.pages.inspectionCenter.icAvgScore') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-num stat-red">{{ statData.abnormalCount }}</div>
        <div class="stat-label">{{ t('message.pages.inspectionCenter.icAbnormalCount') }}</div>
      </div>
    </div>

    <!-- Main content area -->
    <div class="content-wrap">
      <div class="main-card">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="tabs-flex">
          <!-- Inspection tasks -->
          <el-tab-pane :label="t('message.pages.inspectionCenter.icTabTask')" name="task" class="tab-pane-flex">
            <div class="tab-inner">
              <div class="operate-bar">
                <div class="filter-left">
                  <el-input v-model="searchKey" :placeholder="t('message.pages.inspectionCenter.icSearchPh')" clearable style="width: 220px" />
                </div>
                <div class="filter-right">
                  <el-button type="primary" @click="openCreateTask">{{ t('message.pages.inspectionCenter.icNewTask') }}</el-button>
                </div>
              </div>
              <el-table :data="taskList" border stripe size="small" height="100%">
                <el-table-column prop="taskName" :label="t('message.pages.inspectionCenter.icColTaskName')" min-width="180" />
                <el-table-column prop="cycle" :label="t('message.pages.inspectionCenter.icColCycle')" width="120" />
                <el-table-column prop="hostCount" :label="t('message.pages.inspectionCenter.icColHostCount')" width="90" align="center" />
                <el-table-column prop="checkItems" :label="t('message.pages.inspectionCenter.icColCheckItems')" width="100" align="center" />
                <el-table-column prop="status" :label="t('message.pages.inspectionCenter.icColStatus')" width="90">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'Enabled' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="lastExecTime" :label="t('message.pages.inspectionCenter.icColLastExec')" min-width="160" />
                <el-table-column prop="lastScore" :label="t('message.pages.inspectionCenter.icColLastScore')" width="100" align="center">
                  <template #default="{ row }">
                    <span :class="scoreClass(row.lastScore)">{{ row.lastScore }}{{ t('message.pages.inspectionCenter.icScoreUnit') }}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="t('message.pages.inspectionCenter.icColActions')" width="240" fixed="right">
                  <template #default="{ row }">
                    <el-button size="small" text @click="viewReport(row)">{{ t('message.pages.inspectionCenter.icBtnViewReport') }}</el-button>
                    <el-button size="small" text type="primary" @click="execOnce(row)">{{ t('message.pages.inspectionCenter.icBtnRunNow') }}</el-button>
                    <el-button size="small" text @click="editTask(row)">{{ t('edit') }}</el-button>
                    <el-button size="small" text type="danger" @click="deleteTask(row)">{{ t('delete') }}</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>

          <!-- Inspection reports -->
          <el-tab-pane :label="t('message.pages.inspectionCenter.icTabReport')" name="report" class="tab-pane-flex">
            <div class="tab-inner">
              <div class="operate-bar">
                <div class="filter-left">
                  <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    :range-separator="t('message.pages.inspectionCenter.icRangeTo')"
                    :start-placeholder="t('message.pages.inspectionCenter.icStartDate')"
                    :end-placeholder="t('message.pages.inspectionCenter.icEndDate')"
                    style="width: 260px"
                    size="small"
                  />
                </div>
                <div class="filter-right">
                  <el-button @click="exportReport">{{ t('message.pages.inspectionCenter.icBtnExportReport') }}</el-button>
                </div>
              </div>
              <el-table :data="reportList" border stripe size="small" height="100%">
                <el-table-column prop="reportNo" :label="t('message.pages.inspectionCenter.icColReportNo')" width="160" />
                <el-table-column prop="taskName" :label="t('message.pages.inspectionCenter.icColOwnTask')" min-width="180" />
                <el-table-column prop="hostCount" :label="t('message.pages.inspectionCenter.icColReportHosts')" width="100" align="center" />
                <el-table-column prop="score" :label="t('message.pages.inspectionCenter.icColScore')" width="100" align="center">
                  <template #default="{ row }">
                    <span :class="scoreClass(row.score)">{{ row.score }}{{ t('message.pages.inspectionCenter.icScoreUnit') }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="abnormalCount" :label="t('message.pages.inspectionCenter.icColAbnormalCount')" width="100" align="center" />
                <el-table-column prop="execTime" :label="t('message.pages.inspectionCenter.icColExecTime')" min-width="160" />
                <el-table-column prop="executor" :label="t('message.pages.inspectionCenter.icColExecutor')" width="100" />
                <el-table-column :label="t('message.pages.inspectionCenter.icColActions')" width="140" fixed="right">
                  <template #default="{ row }">
                    <el-button size="small" text type="primary" @click="viewReportDetail(row)">{{ t('message.pages.inspectionCenter.icBtnViewDetail') }}</el-button>
                    <el-button size="small" text @click="exportReport(row)">{{ t('message.pages.inspectionCenter.icBtnExport') }}</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="page.current"
          v-model:page-size="page.size"
          :total="page.total"
          layout="total, prev, pager, next, jumper"
          @change="getDataList"
        />
      </div>
    </div>

    <!-- Report details dialog -->
    <el-dialog v-model="reportDetailVisible" :title="t('message.pages.inspectionCenter.icDialogReportDetail')" width="80%" top="5vh" destroy-on-close>
      <div class="report-detail" v-if="currentReport">
        <!-- Score overview -->
        <div class="score-overview">
          <div class="score-circle">
            <div class="score-num">{{ currentReport.score }}</div>
            <div class="score-label">{{ t('message.pages.inspectionCenter.icOverallHealth') }}</div>
          </div>
          <div class="score-stats">
            <div class="stat-item">
              <span class="label">{{ t('message.pages.inspectionCenter.icStatHostCount') }}</span>
              <span class="value">{{ currentReport.hostCount }}{{ t('message.pages.inspectionCenter.icUnitHost') }}</span>
            </div>
            <div class="stat-item">
              <span class="label">{{ t('message.pages.inspectionCenter.icStatItemTotal') }}</span>
              <span class="value">{{ currentReport.itemTotal }}{{ t('message.pages.inspectionCenter.icUnitItem') }}</span>
            </div>
            <div class="stat-item">
              <span class="label">{{ t('message.pages.inspectionCenter.icStatNormal') }}</span>
              <span class="value green">{{ currentReport.normalCount }}{{ t('message.pages.inspectionCenter.icUnitItem') }}</span>
            </div>
            <div class="stat-item">
              <span class="label">{{ t('message.pages.inspectionCenter.icStatAbnormal') }}</span>
              <span class="value red">{{ currentReport.abnormalCount }}{{ t('message.pages.inspectionCenter.icUnitItem') }}</span>
            </div>
            <div class="stat-item">
              <span class="label">{{ t('message.pages.inspectionCenter.icStatDuration') }}</span>
              <span class="value">{{ currentReport.duration }}</span>
            </div>
          </div>
        </div>

        <!-- Abnormal details -->
        <div class="section-title">{{ t('message.pages.inspectionCenter.icAbnormalDetail') }}</div>
        <el-table :data="currentReport.abnormalList" border size="small">
          <el-table-column prop="hostIp" :label="t('message.pages.inspectionCenter.icColHostIp')" width="120" />
          <el-table-column prop="checkItem" :label="t('message.pages.inspectionCenter.icColCheckItem')" width="140" />
          <el-table-column prop="level" :label="t('message.pages.inspectionCenter.icColRiskLevel')" width="100">
            <template #default="{ row }">
              <el-tag :type="row.level === 'high' ? 'danger' : 'warning'" size="small">{{ row.level }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="actualValue" :label="t('message.pages.inspectionCenter.icColActualValue')" width="120" />
          <el-table-column prop="threshold" :label="t('message.pages.inspectionCenter.icColThreshold')" width="120" />
          <el-table-column prop="suggestion" :label="t('message.pages.inspectionCenter.icColSuggestion')" min-width="200" />
          <el-table-column :label="t('message.pages.inspectionCenter.icColActions')" width="120">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="handleAbnormal(row)">{{ t('message.pages.inspectionCenter.icBtnGenerateTicket') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
  </EditionLockedPage>
  </template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditionStore } from '/@/editions'
import EditionLockedPage from '/@/components/EditionLockedPage.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const { t } = useI18n()
const hasFeature = (code) => useEditionStore().hasFeature(code)

const activeTab = ref('task')
const searchKey = ref('')
const dateRange = ref([])
const reportDetailVisible = ref(false)
const currentReport = ref(null)

const page = reactive({ current: 1, size: 10, total: 0 })
const taskList = ref([])
const reportList = ref([])

const statData = reactive({
  taskCount: 12,
  todayCount: 28,
  avgScore: 92.5,
  abnormalCount: 8
})

onMounted(() => {
  if (!useEditionStore().hasFeature('INSPECTION_CENTER')) return
  getDataList()
})

const handleTabChange = () => {
  page.current = 1
  getDataList()
}

const getDataList = () => {
  if (activeTab.value === 'task') {
    taskList.value = [
      { id: 1, taskName: '每日系统健康巡检', cycle: '每天 02:00', hostCount: 32, checkItems: 28, status: 'Enabled', lastExecTime: '2026-07-16 02:00:15', lastScore: 94 },
      { id: 2, taskName: '每周数据库巡检', cycle: '每周一 03:00', hostCount: 8, checkItems: 35, status: 'Enabled', lastExecTime: '2026-07-14 03:00:20', lastScore: 88 },
      { id: 3, taskName: '生产环境深度巡检', cycle: '每月1号', hostCount: 56, checkItems: 62, status: 'Enabled', lastExecTime: '2026-07-01 01:00:00', lastScore: 91 },
      { id: 4, taskName: '测试环境巡检', cycle: '每小时', hostCount: 15, checkItems: 18, status: 'Disabled', lastExecTime: '2026-07-15 18:00:00', lastScore: 96 }
    ]
    page.total = 12
  } else {
    reportList.value = [
      { reportNo: 'XJ20260716001', taskName: '每日系统健康巡检', hostCount: 32, score: 94, abnormalCount: 2, execTime: '2026-07-16 02:00:15', executor: 'system' },
      { reportNo: 'XJ20260715001', taskName: '每日系统健康巡检', hostCount: 32, score: 92, abnormalCount: 3, execTime: '2026-07-15 02:00:10', executor: 'system' },
      { reportNo: 'XJ20260714001', taskName: '每周数据库巡检', hostCount: 8, score: 88, abnormalCount: 5, execTime: '2026-07-14 03:00:20', executor: 'system' }
    ]
    page.total = 36
  }
}

const scoreClass = (score) => {
  if (score >= 90) return 'score-good'
  if (score >= 80) return 'score-normal'
  return 'score-bad'
}

const viewReport = (row) => {
  ElMessage.success(t('message.pages.inspectionCenter.icMsgJumpReport'))
}

const viewReportDetail = (row) => {
  currentReport.value = {
    ...row,
    itemTotal: 28,
    normalCount: 26,
    abnormalCount: 2,
    duration: '2分15秒',
    abnormalList: [
      { hostIp: '192.168.1.101', checkItem: '磁盘使用率', level: 'medium', actualValue: '87%', threshold: '85%', suggestion: '清理历史日志与临时文件，扩容磁盘' },
      { hostIp: '192.168.1.105', checkItem: '内存使用率', level: 'high', actualValue: '92%', threshold: '90%', suggestion: '排查内存泄漏进程，优化应用内存配置' }
    ]
  }
  reportDetailVisible.value = true
}

const execOnce = (row) => {
  ElMessage.success(t('message.pages.inspectionCenter.icMsgTriggered', { name: row.taskName }))
}

const editTask = (row) => {
  ElMessage.info(t('message.pages.inspectionCenter.icMsgOpenEdit'))
}

const openCreateTask = () => {
  ElMessage.info(t('message.pages.inspectionCenter.icMsgOpenNew'))
}

const deleteTask = async (row) => {
  await ElMessageBox.confirm(t('message.pages.inspectionCenter.icConfirmDeleteTask', { name: row.taskName }), t('deleteConfirmTitle'), { type: 'warning' })
  ElMessage.success(t('deleteOk'))
  getDataList()
}

const exportReport = (row) => {
  ElMessage.success(t('message.pages.inspectionCenter.icMsgExporting'))
}

const handleAbnormal = (row) => {
  ElMessage.success(t('message.pages.inspectionCenter.icMsgTicketGenerated'))
}
</script>

<style scoped lang="scss">
.inspection-page {
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

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  flex-shrink: 0;
}
.stat-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  min-height: 0;
  .stat-num {
    font-size: 26px;
    font-weight: 600;
    color: #333;
    margin-bottom: 6px;
    &.stat-blue { color: #409EFF; }
    &.stat-green { color: #67C23A; }
    &.stat-red { color: #F56C6C; }
  }
  .stat-label { font-size: 13px; color: #666; }
}

.content-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  min-height: 0;
}

.main-card {
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

.tabs-flex {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  :deep(.el-tabs__content) {
    flex: 1;
    overflow: hidden;
    min-height: 0;
  }
}

.tab-pane-flex, :deep(.el-tab-pane) {
  height: 100%;
  min-height: 0;
}

.tab-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.operate-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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

.score-good { color: #67C23A; font-weight: 600; }
.score-normal { color: #E6A23C; font-weight: 600; }
.score-bad { color: #F56C6C; font-weight: 600; }

// Report details
.report-detail {
  .score-overview {
    display: flex;
    gap: 40px;
    align-items: center;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  .score-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: #fff;
    border: 6px solid #67C23A;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    .score-num { font-size: 32px; font-weight: 700; color: #333; }
    .score-label { font-size: 12px; color: #999; }
  }
  .score-stats {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      .label { font-size: 12px; color: #999; }
      .value { font-size: 16px; font-weight: 600; color: #333;
        &.green { color: #67C23A; }
        &.red { color: #F56C6C; }
      }
    }
  }
  .section-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 12px;
    padding-left: 8px;
    border-left: 3px solid #409EFF;
  }
}
</style>