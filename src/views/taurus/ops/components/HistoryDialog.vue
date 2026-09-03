<template>
  <el-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    :width="historyDialogMaximized ? '95%' : '900px'"
    :height="historyDialogMaximized ? '95vh' : 'auto'"
    :close-on-click-modal="true"
    :show-close="false"
    class="history-dialog"
  >
    <template #header>
      <div class="history-header">
        <span class="history-title">{{ t('execHistory') }}</span>
        <div class="history-header-actions">
          <el-button
            link
            size="small"
            @click="$emit('toggle-maximize')"
            class="icon-btn"
          >
            <el-icon :size="16">
              <ZoomOut v-if="historyDialogMaximized" />
              <FullScreen v-else />
            </el-icon>
          </el-button>
          <el-button
            link
            size="small"
            @click="$emit('update:show', false)"
            class="icon-btn close-btn"
          >
            <el-icon :size="16"><CloseBold /></el-icon>
          </el-button>
        </div>
      </div>
    </template>
    <div class="history-toolbar">
      <el-input
        :model-value="historyHostSearch"
        @update:model-value="$emit('update:history-host-search', $event)"
        :placeholder="t('historySearchPlaceholder')"
        clearable
        size="small"
        style="width: 200px; margin-right: 12px;"
        @keyup.enter="$emit('load-history')"
        @clear="$emit('load-history')"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button size="small" @click="$emit('load-history')">
        <el-icon><Refresh /></el-icon>
        {{ t('refresh') }}
      </el-button>
      <el-button size="small" @click="$emit('export-history')" :disabled="historyItems.length === 0">
        <el-icon><Download /></el-icon>
        {{ t('export') }}
      </el-button>
    </div>
    <el-table
      :data="historyTableData"
      stripe
      size="small"
      v-loading="historyLoading"
      :max-height="historyDialogMaximized ? 'calc(95vh - 220px)' : 400"
      row-key="rowKey"
      :expand-row-keys="expandedHistoryRows"
      @expand-change="$emit('history-expand', $event)"
      style="width: 100%"
      class="history-main-table"
    >
      <el-table-column type="expand" width="55">
        <template #default="scope">
          <template v-if="scope.row._isBatch">
            <div class="batch-children">
              <el-table
                :data="scope.row._children"
                size="small"
                :border="false"
                class="history-child-table"
                row-key="rowKey"
              >
                <el-table-column type="expand" width="55">
                  <template #default="childScope">
                    <HistoryDetail :row="childScope.row" />
                  </template>
                </el-table-column>
                <el-table-column :label="t('colExecId')" width="180">
                  <template #default="childScope">
                    <span class="execution-id">{{ childScope.row.execution_id }}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="t('colType')" width="80">
                  <template #default="childScope">
                    <el-tag size="small" :type="historyExecTypeTagType(childScope.row.execution_type)">
                      {{ historyExecTypeText(childScope.row.execution_type) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column :label="t('colCmdScript')" width="220">
                  <template #default="childScope">
                    <el-tooltip :content="historyFormatCommand(childScope.row)" placement="top" effect="light">
                      <span class="command-cell">{{ historyFormatCommand(childScope.row) }}</span>
                    </el-tooltip>
                  </template>
                </el-table-column>
                <el-table-column :label="t('colHost')" width="150">
                  <template #default="childScope">
                    <span class="host-cell">{{ childScope.row.host_name }}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="t('colIp')" width="130">
                  <template #default="childScope">
                    <span class="ip-cell">{{ childScope.row.host_ip }}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="t('colStatus')" width="90">
                  <template #default="childScope">
                    <el-tag size="small" :type="historyStatusTagType(childScope.row.status, childScope.row.exit_code)">
                      {{ historyStatusText(childScope.row.status, childScope.row.exit_code) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column :label="t('colExitCode')" width="80">
                  <template #default="childScope">
                    <span v-if="childScope.row.exit_code !== null && childScope.row.exit_code !== undefined"
                      :class="childScope.row.exit_code === 0 ? 'text-success' : 'text-danger'"
                    >
                      {{ childScope.row.exit_code }}
                    </span>
                    <span v-else class="text-muted">-</span>
                  </template>
                </el-table-column>
                <el-table-column :label="t('colActions')" width="280" fixed="right">
                  <template #default="childScope">
                    <template v-if="childScope.row.execution_type !== 'upload' && childScope.row.execution_type !== 'download'">
                      <el-button size="small" type="primary" link @click.stop="$emit('history-run', childScope.row)" :disabled="childScope.row.status === 1">
                        <el-icon><VideoPlay /></el-icon>
                        {{ childScope.row.status >= 2 ? t('actionRerun') : t('actionRun') }}
                      </el-button>
                      <el-button size="small" type="info" link @click.stop="$emit('history-live-output', childScope.row.execution_id)" :disabled="!childScope.row.execution_id">
                        <el-icon><Monitor /></el-icon>
                        {{ t('actionLiveOutput') }}
                      </el-button>
                      <el-button size="small" type="danger" link @click.stop="$emit('history-stop', childScope.row)" :disabled="childScope.row.status !== 1">
                        <el-icon><CloseBold /></el-icon>
                        {{ t('actionTerminate') }}
                      </el-button>
                      <el-button size="small" type="success" link @click.stop="$emit('fill-from-history', childScope.row)">
                        <el-icon><CopyDocument /></el-icon>
                        {{ t('copyCommand') }}
                      </el-button>
                    </template>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
          <template v-else>
            <HistoryDetail :row="scope.row" />
          </template>
        </template>
      </el-table-column>

      <el-table-column :label="t('colExecId')" width="170">
        <template #default="scope">
          <template v-if="scope.row._isBatch">
            <div class="batch-id-row">
              <el-tag size="small" type="success" class="batch-tag">{{ t('historyBatchTag') }}</el-tag>
              <span class="batch-id">{{ scope.row.batch_id }}</span>
            </div>
          </template>
          <template v-else>
            <span class="execution-id">{{ scope.row.execution_id }}</span>
          </template>
        </template>
      </el-table-column>

      <el-table-column :label="t('colType')" width="90">
        <template #default="scope">
          <template v-if="scope.row._isBatch">
            <span class="count-badge">{{ scope.row._children.length }}{{ t('historyHostUnit') }}</span>
          </template>
          <template v-else>
            <el-tag size="small" :type="historyExecTypeTagType(scope.row.execution_type)">
              {{ historyExecTypeText(scope.row.execution_type) }}
            </el-tag>
          </template>
        </template>
      </el-table-column>

      <el-table-column :label="t('colCmdScript')" min-width="260" show-overflow-tooltip>
        <template #default="scope">
          <template v-if="scope.row._isBatch">
            <el-tooltip :content="historyFormatCommand(scope.row)" placement="top" effect="light">
              <span class="command-cell">{{ historyFormatCommand(scope.row) }}</span>
            </el-tooltip>
          </template>
          <template v-else>
            <el-tooltip :content="historyFormatCommand(scope.row)" placement="top" effect="light">
              <span class="command-cell">{{ historyFormatCommand(scope.row) }}</span>
            </el-tooltip>
          </template>
        </template>
      </el-table-column>

      <el-table-column :label="t('colHost')" width="150">
        <template #default="scope">
          <template v-if="!scope.row._isBatch">
            <span class="host-cell">{{ scope.row.host_name }}</span>
          </template>
        </template>
      </el-table-column>

      <el-table-column :label="t('colIp')" width="130">
        <template #default="scope">
          <template v-if="!scope.row._isBatch">
            <span class="ip-cell">{{ scope.row.host_ip }}</span>
          </template>
        </template>
      </el-table-column>

      <el-table-column :label="t('colStatus')" width="100">
        <template #default="scope">
          <template v-if="scope.row._isBatch">
            <el-tag size="small" :type="historyBatchStatusTagType(scope.row)">
              {{ historyBatchStatusText(scope.row) }}
            </el-tag>
          </template>
          <template v-else>
            <el-tag size="small" :type="historyStatusTagType(scope.row.status, scope.row.exit_code)">
              {{ historyStatusText(scope.row.status, scope.row.exit_code) }}
            </el-tag>
          </template>
        </template>
      </el-table-column>

      <el-table-column :label="t('colExitCode')" width="90">
        <template #default="scope">
          <template v-if="scope.row._isBatch">
            <span class="batch-host-count">{{ t('historySuccess') }} {{ scope.row._successCount }} / {{ t('historyFailed') }} {{ scope.row._failCount }}</span>
          </template>
          <template v-else>
            <span v-if="scope.row.exit_code !== null && scope.row.exit_code !== undefined"
              :class="scope.row.exit_code === 0 ? 'text-success' : 'text-danger'"
            >
              {{ scope.row.exit_code }}
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </template>
      </el-table-column>

      <el-table-column :label="t('colStartTime')" width="170">
        <template #default="scope">
          <span class="batch-time">{{ scope.row._time || formatTimestamp(scope.row.started_at) }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="t('colActions')" width="280" fixed="right">
        <template #default="scope">
          <template v-if="scope.row._isBatch">
            <el-button size="small" type="primary" link @click.stop="$emit('history-rerun-batch', scope.row)">
              <el-icon><VideoPlay /></el-icon>
              {{ t('historyReRunBatch') }}
            </el-button>
            <el-button size="small" type="danger" link @click.stop="$emit('history-stop-batch', scope.row)" :disabled="!scope.row._children?.some((c: any) => c.status === 1)">
              <el-icon><CloseBold /></el-icon>
              {{ t('actionTerminate') }}
            </el-button>
          </template>
          <template v-else>
            <template v-if="scope.row.execution_type !== 'upload' && scope.row.execution_type !== 'download'">
              <el-button size="small" type="primary" link @click.stop="$emit('history-run', scope.row)" :disabled="scope.row.status === 1">
                <el-icon><VideoPlay /></el-icon>
                {{ scope.row.status >= 2 ? t('actionRerun') : t('actionRun') }}
              </el-button>
              <el-button size="small" type="info" link @click.stop="$emit('history-live-output', scope.row.execution_id)" :disabled="!scope.row.execution_id">
                <el-icon><Monitor /></el-icon>
                {{ t('actionLiveOutput') }}
              </el-button>
              <el-button size="small" type="danger" link @click.stop="$emit('history-stop', scope.row)" :disabled="scope.row.status !== 1">
                <el-icon><CloseBold /></el-icon>
                {{ t('actionTerminate') }}
              </el-button>
              <el-button size="small" type="success" link @click.stop="$emit('fill-from-history', scope.row)">
                <el-icon><CopyDocument /></el-icon>
               {{ t('copyCommand') }}
              </el-button>
            </template>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <div class="history-pagination">
      <el-pagination
        :current-page="historyPage"
        :page-size="historyLimit"
        :page-sizes="[10, 20, 50, 100]"
        :total="historyTotal"
        layout="total, sizes, prev, pager, next"
        size="small"
        @current-change="$emit('history-page-change', $event)"
        @size-change="$emit('history-size-change', $event)"
      />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { 
  CloseBold, ZoomOut, FullScreen, Search, Refresh, Download, 
  VideoPlay, Monitor, CopyDocument 
} from '@element-plus/icons-vue';
import {
  historyStatusTagType,
  historyStatusText,
  historyExecTypeTagType,
  historyExecTypeText,
  historyFormatCommand,
  historyBatchStatusTagType,
  historyBatchStatusText,
  formatTimestamp,
} from './historyUtils';
import HistoryDetail from './HistoryDetail.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  show: boolean;
  historyDialogMaximized: boolean;
  historyItems: any[];
  historyTotal: number;
  historyPage: number;
  historyLimit: number;
  historyHostSearch: string;
  historyLoading: boolean;
  historyTableData: any[];
  expandedHistoryRows: string[];
}>();

defineEmits<{
  'update:show': [value: boolean];
  'update:history-host-search': [value: string];
  'toggle-maximize': [];
  'load-history': [];
  'export-history': [];
  'history-page-change': [page: number];
  'history-size-change': [size: number];
  'history-expand': [expandedRows: any[]];
  'history-run': [row: any];
  'history-live-output': [executionId: string];
  'history-stop': [row: any];
  'history-stop-batch': [batch: any];
  'history-rerun-batch': [batch: any];
  'fill-from-history': [row: any];
}>();
</script>

<style scoped lang="scss">
.history-dialog {
  :deep(.el-dialog__header) {
    padding: 12px 16px 10px;
    margin-right: 0;
  }

  :deep(.el-dialog__body) {
    padding: 8px 16px 16px;
  }
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .history-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .history-header-actions {
    display: flex;
    align-items: center;
    gap: 4px;

    .icon-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #606266;
      border-radius: 4px;

      &:hover {
        color: #409eff;
        background: #ecf5ff;
      }

      &.close-btn:hover {
        color: #f56c6c;
        background: #fef0f0;
      }
    }
  }
}

.history-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 12px;
  border-bottom: 1px solid #f0f2f5;
  margin-bottom: 10px;
}

.history-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}

.batch-id-row {
  display: flex;
  align-items: center;
  gap: 6px;

  .batch-tag {
    flex-shrink: 0;
  }

  .batch-id {
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 12px;
  }
}

.count-badge {
  font-size: 12px;
  color: #909399;
}

.batch-host-count {
  font-size: 12px;
  color: #606266;
}

.batch-time {
  font-size: 12px;
  color: #909399;
}

.command-cell,
.execution-id,
.host-cell,
.ip-cell {
  font-size: 13px;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

.text-muted {
  color: #c0c4cc;
}
</style>