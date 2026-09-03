<template>
  <fs-page v-if="hasFeature('TASK_CENTER')">
    <div class="task-center-page">
      <!-- Page header -->
      <div class="page-header">
        <div class="title">
          <h2>{{ t('message.pages.taskCenter.tcenterPageTitle') }}</h2>
          <span class="desc">{{ t('message.pages.taskCenter.tcenterPageDesc1') }}</span>
        </div>
      </div>

      <!-- Stats cards -->
      <div class="stat-board">
        <div class="stat-card">
          <div class="stat-icon stat-icon-total">
            <el-icon :size="24"><Clock /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-num">{{ total }}</div>
            <div class="stat-label">{{ t('message.pages.taskCenter.tcenterTotal') }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-running">
            <el-icon :size="24"><CircleCheck /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-num stat-green">{{ runningCount }}</div>
            <div class="stat-label">{{ t('message.pages.taskCenter.tcenterRunning') }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-paused">
            <el-icon :size="24"><VideoPause /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-num stat-gray">{{ pausedCount }}</div>
            <div class="stat-label">{{ t('message.pages.taskCenter.tcenterPaused') }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-script">
            <el-icon :size="24"><Document /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-num stat-blue">{{ scriptTaskCount }}</div>
            <div class="stat-label">{{ t('message.pages.taskCenter.tcenterTabScript') }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-wf">
            <el-icon :size="24"><SetUp /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-num stat-orange">{{ workflowCount }}</div>
            <div class="stat-label">{{ t('message.pages.taskCenter.tcenterTabWorkflow') }}</div>
          </div>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="filter-group">
            <span class="filter-label">{{ t('message.pages.taskCenter.tcenterFilterType') }}</span>
            <el-radio-group v-model="filterType" size="default" @change="handleSearch">
              <el-radio-button value="">{{ t('message.pages.taskCenter.tcenterFilterAll') }}</el-radio-button>
              <el-radio-button value="script_task">{{ t('message.pages.taskCenter.tcenterTypeScript') }}</el-radio-button>
              <el-radio-button value="workflow">{{ t('message.pages.taskCenter.tcenterTypeWorkflow') }}</el-radio-button>
            </el-radio-group>
          </div>
          <div class="filter-group">
            <span class="filter-label">{{ t('message.pages.taskCenter.tcenterFilterStatus') }}</span>
            <el-radio-group v-model="filterStatus" size="default" @change="handleSearch">
              <el-radio-button value="">{{ t('message.pages.taskCenter.tcenterFilterAll') }}</el-radio-button>
              <el-radio-button value="1">{{ t('message.pages.taskCenter.tcenterRunning') }}</el-radio-button>
              <el-radio-button value="0">{{ t('message.pages.taskCenter.tcenterPaused') }}</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <div class="filter-right">
          <el-input
            v-model="searchKey"
            :placeholder="t('message.pages.taskCenter.tcenterSearchPh')"
            style="width: 280px"
            clearable
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button @click="loadData">
            <el-icon><Refresh /></el-icon>
            {{ t('message.pages.taskCenter.tcenterRefresh') }}
          </el-button>
        </div>
      </div>

      <!-- Main table -->
      <div class="table-card">
        <el-table
          v-loading="loading"
          :data="tableData"
          style="width: 100%"
          row-key="rowKey"
          :header-cell-style="{ background: '#fafbfc', color: '#606266', fontWeight: 600 }"
          :row-style="{ cursor: 'pointer' }"
          @row-click="goDetail"
          :empty-text="t('message.pages.taskCenter.tcenterEmpty')"
        >
          <el-table-column :label="t('message.pages.taskCenter.tcenterColName')" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="task-name-cell">
                <div class="task-name-row">
                  <el-tag
                    :type="row.item_type === 'script_task' ? '' : 'success'"
                    size="small"
                    effect="dark"
                    class="type-tag"
                  >
                    <el-icon v-if="row.item_type === 'script_task'"><Document /></el-icon>
                    <el-icon v-else><SetUp /></el-icon>
                    {{ row.item_type === 'script_task' ? t('message.pages.taskCenter.tcenterTypeScript') : t('message.pages.taskCenter.tcenterTypeWorkflow') }}
                  </el-tag>
                  <span class="task-name">{{ row.name }}</span>
                </div>
                <div v-if="row.description" class="task-desc">{{ row.description }}</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column :label="t('message.pages.taskCenter.tcenterColTarget')" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.target_name }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="t('message.pages.taskCenter.tcenterColScheduleType')" width="120" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="info" effect="plain">
                {{ row.schedule_type_display }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column :label="t('message.pages.taskCenter.tcenterColSchedule')" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.schedule_type === 'cron' && row.cron_expression" class="mono">
                {{ row.cron_expression }}
              </span>
              <span v-else-if="row.schedule_type === 'interval' && row.interval_seconds">
                {{ t('message.every') }} {{ formatInterval(row.interval_seconds) }}
              </span>
              <span v-else-if="row.schedule_type === 'once' && row.run_once_at">
                {{ formatDateTime(row.run_once_at) }}
              </span>
              <span v-else class="empty-cell">-</span>
            </template>
          </el-table-column>

          <el-table-column :label="t('message.pages.taskCenter.tcenterColStatus')" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 1 ? 'success' : 'info'"
                size="small"
                effect="light"
                class="status-tag"
              >
                <span class="status-dot" :class="row.status === 1 ? 'dot-running' : 'dot-paused'" />
                {{ row.status_display }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="exec_count" :label="t('message.pages.taskCenter.tcenterColExecCount')" width="90" align="center" />

          <el-table-column :label="t('message.pages.taskCenter.tcenterColLastRun')" width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.last_exec_time">{{ formatDateTime(row.last_exec_time) }}</span>
              <span v-else class="empty-cell">-</span>
            </template>
          </el-table-column>

          <el-table-column :label="t('message.pages.taskCenter.tcenterColNextRun')" width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.next_exec_time">{{ formatDateTime(row.next_exec_time) }}</span>
              <span v-else class="empty-cell">-</span>
            </template>
          </el-table-column>

          <el-table-column :label="t('message.pages.taskCenter.tcenterColLastResult')" width="90" align="center">
            <template #default="{ row }">
              <el-tag
                v-if="row.last_exec_result"
                :type="row.last_exec_result === 'success' ? 'success' : 'danger'"
                size="small"
                effect="light"
              >
                {{ row.last_exec_result_display }}
              </el-tag>
              <span v-else class="empty-cell">-</span>
            </template>
          </el-table-column>

          <el-table-column :label="t('message.pages.taskCenter.tcenterColOwner')" width="100" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.creator_name }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="t('message.pages.taskCenter.tcenterColActions')" width="200" fixed="right" align="center" :show-overflow-tooltip="false">
            <template #default="{ row }">
              <el-button
                link
                :type="row.status === 1 ? 'warning' : 'success'"
                size="small"
                @click.stop="handleToggle(row)"
                :loading="togglingId === row.rowKey"
              >
                {{ row.status === 1 ? t('message.pages.taskCenter.tcenterPause') : t('message.pages.taskCenter.tcenterResume') }}
              </el-button>
              <el-button
                link
                type="primary"
                size="small"
                @click.stop="handleRunNow(row)"
                :loading="runningId === row.rowKey"
              >
                {{ t('message.pages.taskCenter.tcenterRunNow') }}
              </el-button>
              <el-button link type="info" size="small" @click.stop="goDetail(row)">{{ t('message.pages.taskCenter.tcenterViewDetail') }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            background
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadData"
            @current-change="loadData"
          />
        </div>
      </div>
    </div>
  </fs-page>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEditionStore } from '/@/editions';

const { t } = useI18n();
const hasFeature = (code: string) => useEditionStore().hasFeature(code);
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search, Refresh, Document, SetUp, Clock, CircleCheck, VideoPause } from '@element-plus/icons-vue';
import * as taskCenterApi from '/@/api/taurus/task-center/api';
import * as scriptTaskApi from '/@/api/taurus/script-library/task';
import * as workflowApi from '/@/api/taurus/workflow/api';

const router = useRouter();

const loading = ref(false);
const tableData = ref<any[]>([]);
const searchKey = ref('');
const filterType = ref<string>('');
const filterStatus = ref<string>('');
const togglingId = ref<string | number | null>(null);
const runningId = ref<string | number | null>(null);

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
});

const total = computed(() => pagination.total);
const scriptTaskCount = computed(() => tableData.value.filter((t) => t.item_type === 'script_task').length);
const workflowCount = computed(() => tableData.value.filter((t) => t.item_type === 'workflow').length);
const runningCount = computed(() => tableData.value.filter((t) => t.status === 1).length);
const pausedCount = computed(() => tableData.value.filter((t) => t.status === 0).length);

const buildRowKey = (row: any) => `${row.item_type}-${row.id}`;

const loadData = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit,
    };
    if (searchKey.value) params.keyword = searchKey.value;
    if (filterType.value) params.type = filterType.value;
    if (filterStatus.value !== '') params.status = filterStatus.value;

    const res = await taskCenterApi.GetList(params);
    const data = res?.data || res || {};
    const results = data.results || data || [];
    tableData.value = Array.isArray(results)
      ? results.map((item: any) => ({ ...item, rowKey: buildRowKey(item) }))
      : [];
    pagination.total = data.count ?? (Array.isArray(results) ? results.length : 0);
  } catch (e: any) {
    ElMessage.error(t('message.pages.taskCenter.tcenterMsgLoadFail') + ': ' + (e?.message || ''));
    tableData.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

const handleToggle = async (row: any) => {
  const action = row.status === 1 ? t('message.pages.taskCenter.tcenterPause') : t('message.pages.taskCenter.tcenterResume');
  togglingId.value = row.rowKey;
  try {
    if (row.item_type === 'script_task') {
      await scriptTaskApi.toggleEnabled(row.id);
    } else {
      await workflowApi.toggleScheduleEnabled(row.id);
    }
    ElMessage.success(t('message.every') + action);
    await loadData();
  } catch (e: any) {
    ElMessage.error(`${action}${t('message.pages.taskCenter.tcenterActionFail')}: ` + (e?.message || ''));
  } finally {
    togglingId.value = null;
  }
};

const handleRunNow = async (row: any) => {
  runningId.value = row.rowKey;
  try {
    if (row.item_type === 'script_task') {
      await scriptTaskApi.executeNow(row.id);
      ElMessage.success(t('message.pages.taskCenter.tcenterMsgRunSubmitted'));
    } else {
      await workflowApi.TriggerWorkflow(row.id);
      ElMessage.success(t('message.pages.taskCenter.tcenterMsgWfSubmitted'));
    }
    await loadData();
  } catch (e: any) {
    ElMessage.error(t('message.pages.taskCenter.tcenterMsgRunFail') + ': ' + (e?.message || ''));
  } finally {
    runningId.value = null;
  }
};

const goDetail = (row: any) => {
  if (row.item_type === 'workflow') {
    router.push(`/workflow/editor/${row.id}`);
  } else if (row.item_type === 'script_task') {
    router.push('/ops/script-library');
  }
};

const formatInterval = (seconds: number): string => {
  if (seconds < 60) return `${seconds}${t('message.secondsUnit')}`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}${t('message.pages.taskCenter.tcenterMin')}`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}${t('message.pages.taskCenter.tcenterHour')}`;
  return `${Math.floor(seconds / 86400)}${t('message.daysUnit')}`;
};

const formatDateTime = (val: string): string => {
  if (!val) return '-';
  try {
    const d = new Date(val);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return val;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.task-center-page {
  padding: 0;
}

/* ===== Page header ===== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.page-header .title h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.page-header .title .desc {
  font-size: 13px;
  color: #909399;
}

/* ===== Stats cards ===== */
.stat-board {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: box-shadow 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.stat-icon-total {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.stat-icon-running {
  background: linear-gradient(135deg, #43cea2, #185a9d);
}

.stat-icon-paused {
  background: linear-gradient(135deg, #b8b8b8, #7a7a7a);
}

.stat-icon-script {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.stat-icon-wf {
  background: linear-gradient(135deg, #fa709a, #fee140);
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.stat-green {
  color: #67c23a;
}

.stat-gray {
  color: #909399;
}

.stat-blue {
  color: #409eff;
}

.stat-orange {
  color: #e6a23c;
}

/* ===== Filter bar ===== */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 10px 16px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  gap: 16px;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

/* ===== Table card ===== */
.table-card {
  background: #fff;
  border-radius: 10px;
  padding: 4px 0 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-card :deep(.el-table) {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: #fafbfc;
  font-size: 13px;
}

.table-card :deep(.el-table tr:hover > td) {
  background: #f5f7fa !important;
}

.table-card :deep(.el-table tr) {
  transition: background-color 0.2s;
}

/* ===== Table content styles ===== */
.task-name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}

.task-name {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}

.task-desc {
  font-size: 12px;
  color: #909399;
  margin-left: 0;
  padding-left: 0;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.dot-running {
  background: #67c23a;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
}

.dot-paused {
  background: #909399;
}

.mono {
  font-family: 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', monospace;
  background: #f5f7fa;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  display: inline-block;
}

.empty-cell {
  color: #c0c4cc;
}

/* ===== Pagination ===== */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  padding-top: 12px;
}

/* ===== Responsive ===== */
@media (max-width: 1200px) {
  .stat-board {
    flex-wrap: wrap;
  }
  .stat-card {
    min-width: calc(33.333% - 8px);
  }
}

@media (max-width: 768px) {
  .stat-board {
    flex-direction: column;
  }
  .stat-card {
    min-width: 100%;
  }
  .filter-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>