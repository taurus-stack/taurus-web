<template>
  <div class="history-panel-body">
    <!-- Top stats cards -->
    <div class="stat-row">
      <div class="stat-card stat-total">
        <div class="stat-icon-box">
          <el-icon :size="24"><Files /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-num">{{ statCards.total }}</div>
          <div class="stat-label">{{ t('message.pages.opsExecution.history.statTotal') }}</div>
        </div>
      </div>
      <div class="stat-card stat-pending">
        <div class="stat-icon-box">
          <el-icon :size="24"><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-num">{{ statCards.pending }}</div>
          <div class="stat-label">{{ t('message.pages.opsExecution.history.statPending') }}</div>
        </div>
      </div>
      <div class="stat-card stat-running">
        <div class="stat-icon-box">
          <el-icon :size="24" class="spin"><Loading /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-num">{{ statCards.running }}</div>
          <div class="stat-label">{{ t('message.pages.opsExecution.history.statRunning') }}</div>
        </div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-icon-box">
          <el-icon :size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-num">{{ statCards.success }}</div>
          <div class="stat-label">{{ t('message.pages.opsExecution.history.statSuccess') }}</div>
        </div>
      </div>
      <div class="stat-card stat-failed">
        <div class="stat-icon-box">
          <el-icon :size="24"><WarningFilled /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-num">{{ statCards.failed }}</div>
          <div class="stat-label">{{ t('message.pages.opsExecution.history.statFailed') }}</div>
        </div>
      </div>
    </div>

    <!-- Search filter bar -->
    <div class="search-bar card-block">
      <el-form
        :model="queryForm"
        size="default"
        label-width="85px"
        label-position="right"
        class="search-form"
        @submit.prevent="handleSearch"
      >
        <el-form-item :label="t('message.pages.opsExecution.history.searchKeyword')" class="sf-item sf-kw">
          <el-input
            v-model="queryForm.search"
            :placeholder="t('message.pages.opsExecution.history.searchKeywordPlaceholder')"
            clearable
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('message.pages.opsExecution.history.searchHostIp')" class="sf-item sf-host">
          <el-input
            v-model="queryForm.host_ip"
            :placeholder="t('message.pages.opsExecution.history.searchHostIpPlaceholder')"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('message.pages.opsExecution.history.searchType')" class="sf-item sf-type">
          <el-select v-model="executionTypeRef" :placeholder="t('message.pages.opsExecution.history.searchTypeAll')" clearable @update:model-value="onExecutionTypeChange">
            <el-option
              v-for="opt in EXECUTION_TYPE_OPTIONS.filter((o) => o.value)"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('message.pages.opsExecution.history.searchBatchId')" class="sf-item sf-batch">
          <el-input
            v-model="queryForm.batch_id"
            :placeholder="t('message.pages.opsExecution.history.searchBatchIdPlaceholder')"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <div class="sf-item sf-btn">
          <el-button type="primary" size="default" @click="handleSearch">{{ t('message.pages.opsExecution.history.btnSearch') }}</el-button>
          <el-button size="default" @click="handleResetSearch">{{ t('message.pages.opsExecution.history.btnReset') }}</el-button>
          <el-button size="default" :icon="Refresh" @click="handleSearch">{{ t('message.pages.opsExecution.history.btnRefresh') }}</el-button>
          <el-button v-if="showExport" size="default" :icon="Download" :loading="exporting" @click="handleExport">{{ t('message.pages.opsExecution.history.btnExport') }}</el-button>
        </div>
      </el-form>
    </div>

    <!-- Status tabs -->
    <el-tabs v-model="activeTab" type="card" class="status-tabs card-block" @tab-change="handleTabChange">
      <el-tab-pane :label="t('message.pages.opsExecution.history.tabAll')" name="all" />
      <el-tab-pane v-for="opt in STATUS_OPTIONS" :key="opt.value" :name="String(opt.value)">
        <template #label>
          <span style="display: inline-flex; align-items: center; gap: 6px">
            <el-icon :size="14"><component :is="opt.icon" /></el-icon>
            <el-tag size="small" :type="opt.type as any" effect="plain">{{ opt.label }}</el-tag>
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- Pagination -->
    <div class="pagination-bar card-block">
      <el-pagination
        v-model:current-page="pageIndex"
        v-model:page-size="pageSize"
        :page-sizes="[10, 15, 25, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- Data table -->
    <div class="card-block table-card">
      <el-table
        :data="pagedTableData"
        v-loading="loading"
        border
        stripe
        row-key="rowKey"
        style="width: 100%"
        size="default"
        :row-class-name="getRowClassName"
      >
        <el-table-column :label="t('message.pages.opsExecution.history.colBatchId')" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.batch_id" class="mono-text batch-id">{{ row.batch_id }}</span>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsExecution.history.colHostCount')" min-width="100" align="center">
          <template #default="{ row }">
            <span v-if="row._isBatch">{{ getBatchCount(row) }} {{ t('message.pages.opsExecution.history.colHostCountSingle').replace('1 ', '') }}</span>
            <span v-else>{{ t('message.pages.opsExecution.history.colHostCountSingle') }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsExecution.history.colExecUser')" min-width="110" align="center">
          <template #default="{ row }">
            <el-icon :size="13" color="#909399" style="vertical-align: -2px; margin-right: 2px"><User /></el-icon>
            {{ row.username || row.creator_name || '-' }}
          </template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsExecution.history.colRunResult')" min-width="160" align="center">
          <template #default="{ row }">
            <template v-if="row._isBatch">
              <el-tag :type="getBatchStatusTagType(row)" size="small">{{ getBatchStatusText(row) }}</el-tag>
              <div class="summary-row" v-if="getBatchChildrenCount(row)">
                <el-tag v-if="batchSuccessCount(getBatchChildren(row))" size="small" type="success" style="margin-top: 4px">✓ {{ batchSuccessCount(getBatchChildren(row)) }}</el-tag>
                <el-tag v-if="batchFailCount(getBatchChildren(row))" size="small" type="danger" style="margin-top: 4px; margin-left: 2px">✗ {{ batchFailCount(getBatchChildren(row)) }}</el-tag>
                <el-tag v-if="batchRunningCount(getBatchChildren(row))" size="small" type="warning" style="margin-top: 4px; margin-left: 2px">⟳ {{ batchRunningCount(getBatchChildren(row)) }}</el-tag>
              </div>
            </template>
            <template v-else>
              <el-tag :type="historyStatusTagType(row.status, row.exit_code) as any" size="small">{{ historyStatusText(row.status, row.exit_code) }}</el-tag>
              <div v-if="row.exit_code != null" class="exit-code">exit: {{ row.exit_code }}</div>
            </template>
          </template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsExecution.history.colStartTime')" min-width="165" show-overflow-tooltip>
          <template #default="{ row }">{{ formatTime(getRowStartTime(row)) }}</template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsExecution.history.colEndTime')" min-width="165" show-overflow-tooltip>
          <template #default="{ row }">{{ formatTime(getRowEndTime(row)) }}</template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsExecution.history.colDuration')" min-width="90" align="center">
          <template #default="{ row }">
            <el-icon :size="13" color="#909399" style="vertical-align: -2px; margin-right: 3px"><Timer /></el-icon>
            {{ getRowDuration(row) }}
          </template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsExecution.history.colActions')" width="340" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" :icon="View" @click="handleViewDetail(row)">{{ t('message.pages.opsExecution.history.actionView') }}</el-button>
            <el-button
              v-if="showLiveOutput && !row._isBatch"
              type="info"
              link
              size="small"
              :icon="Monitor"
              :disabled="!row.execution_id || row.execution_type === 'upload' || row.execution_type === 'download'"
              @click.stop="connectOutputWebSocket(row.execution_id, t('message.pages.opsExecution.history.liveOutputTitle'))"
            >{{ t('message.pages.opsExecution.history.actionRealtime') }}</el-button>
            <el-button
              v-if="!row._isBatch"
              type="primary"
              link
              size="small"
              :icon="RefreshRight"
              :disabled="row.status === 1 || row.execution_type === 'upload' || row.execution_type === 'download'"
              @click="handleRerun(row)"
            >{{ row.status === 0 ? t('message.pages.opsExecution.history.actionRun') : t('message.pages.opsExecution.history.actionRerun') }}</el-button>
            <el-button
              v-if="row._isBatch"
              type="primary"
              link
              size="small"
              :icon="RefreshRight"
              :disabled="hasRunningTasks(row)"
              @click="handleRerunBatch(row)"
            >{{ t('message.pages.opsExecution.history.actionRerun') }}</el-button>
            <el-button
              v-if="row._isBatch && hasBatchFailed(row)"
              type="success"
              link
              size="small"
              :icon="RefreshRight"
              @click="handleRerunFailedBatch(row)"
            >{{ t('message.pages.opsExecution.history.actionRerunFail') }}</el-button>
            <el-button
              v-if="showCopyCommand && !row._isBatch"
              type="success"
              link
              size="small"
              :icon="CopyDocument"
              @click="$emit('fill-from-history', row)"
            >{{ t('message.pages.opsExecution.history.actionCopyCmd') }}</el-button>
            <el-button
              v-if="!row._isBatch"
              type="danger"
              link
              size="small"
              :icon="Close"
              :disabled="row.status !== 1"
              @click="handleStop(row)"
            >{{ t('message.pages.opsExecution.history.actionTerminate') }}</el-button>
            <el-button
              v-if="row._isBatch"
              type="danger"
              link
              size="small"
              :icon="Close"
              :disabled="!hasRunningTasks(row)"
              @click="handleStopBatch(row)"
            >{{ t('message.pages.opsExecution.history.actionTerminate') }}</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty :description="t('message.pages.opsExecution.history.noRecords')" />
        </template>
      </el-table>
    </div>

    <LiveOutputDialog v-if="showLiveOutput" v-model="showLiveOutputDialog" :title="liveOutputTitle" :content="liveOutputContent" />

    <RerunExecDialog v-model="showRerunConfirm" :row="rerunRow" :items="batchRerunItems" @submit="handleRerunDialogSubmit" />

    <!-- Execution detail dialog -->
    <el-dialog
      v-model="detailVisible"
      :title="viewingRow?._isBatch ? t('message.pages.opsExecution.history.detailTitleBatch', { id: viewingRow.batch_id || '' }) : t('message.pages.opsExecution.history.detailTitleSingle', { id: viewingRow?.execution_id || '' })"
      width="800px"
      :close-on-click-modal="false"
      @close="handleDetailClose"
      class="detail-dialog"
      destroy-on-close
    >
      <div v-loading="detailLoading" class="detail-dialog-body">
        <template v-if="viewingRow">
          <el-descriptions :column="3" border size="small" class="detail-descriptions">
            <el-descriptions-item :label="t('message.pages.opsExecution.history.detailRunningId')" v-if="!viewingRow._isBatch">
              <span class="mono-text">{{ viewingRow.execution_id || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.history.detailBatchId')" v-if="viewingRow._isBatch">
              <span class="mono-text">{{ viewingRow.batch_id || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.history.detailRecordId')">{{ viewingRow.id ?? '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.history.detailExecType')">
              <el-tag size="small" :type="historyExecTypeTagType(viewingRow.execution_type)">{{ historyExecTypeText(viewingRow.execution_type) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.history.detailHost')" v-if="!viewingRow._isBatch">
              <span v-if="viewingRow.host_ip">{{ viewingRow.host_ip }}<span v-if="viewingRow.host_name" class="muted-text">({{ viewingRow.host_name }})</span></span>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.history.detailHost')" v-if="viewingRow._isBatch">
              <span>{{ getBatchChildrenCount(viewingRow) }} {{ t('message.pages.opsExecution.history.colHostCountSingle').replace('1 ', '') }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.history.detailRunUser')">{{ viewingRow.username || viewingRow.creator_name || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.history.detailStatus')" :span="viewingRow._isBatch ? 2 : 1">
              <template v-if="viewingRow._isBatch">
                <el-tag :type="getBatchStatusTagType(viewingRow)" effect="dark">{{ getBatchStatusText(viewingRow) }}</el-tag>
                <el-tag v-if="batchSuccessCount(getBatchChildren(viewingRow))" size="small" type="success" effect="plain" class="detail-status-tag">{{ t('message.pages.opsExecution.history.statusDone') }} {{ batchSuccessCount(getBatchChildren(viewingRow)) }}</el-tag>
                <el-tag v-if="batchFailCount(getBatchChildren(viewingRow))" size="small" type="danger" effect="plain" class="detail-status-tag">{{ t('message.pages.opsExecution.history.statusFailed') }} {{ batchFailCount(getBatchChildren(viewingRow)) }}</el-tag>
                <el-tag v-if="batchRunningCount(getBatchChildren(viewingRow))" size="small" type="warning" effect="plain" class="detail-status-tag">{{ t('message.pages.opsExecution.history.statusRunning') }} {{ batchRunningCount(getBatchChildren(viewingRow)) }}</el-tag>
              </template>
              <template v-else>
                <el-tag :type="historyStatusTagType(viewingRow.status)" effect="dark">{{ historyStatusText(viewingRow.status) }}</el-tag>
                <el-tag v-if="viewingRow.exit_code != null" size="small" effect="plain" class="detail-status-tag">{{ t('message.pages.opsExecution.history.colExitCode', { code: viewingRow.exit_code }) }}</el-tag>
              </template>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.history.detailExitCode')" v-if="!viewingRow._isBatch">{{ viewingRow.exit_code != null ? viewingRow.exit_code : '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.history.detailStartTime')">{{ getRowStartTime(viewingRow) || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.history.detailEndTime')">{{ getRowEndTime(viewingRow) || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.history.detailTimeout')" v-if="viewingRow.timeout_seconds">{{ t('message.pages.opsExecution.history.detailTimeoutSuffix', { sec: viewingRow.timeout_seconds }) }}</el-descriptions-item>
          </el-descriptions>

          <!-- Single execution detail -->
          <template v-if="!viewingRow._isBatch">
            <div v-if="viewingRow.command || viewingRow.script_content || viewingRow.file_path" class="detail-section">
              <div class="detail-section-title">{{ viewingRow.execution_type === 'upload' || viewingRow.execution_type === 'download' ? t('message.pages.opsExecution.history.detailFileInfo') : t('message.pages.opsExecution.history.detailContent') }}</div>
              <div v-if="viewingRow.execution_type === 'upload' || viewingRow.execution_type === 'download'" class="file-info">
                <div v-if="viewingRow.file_path" class="file-info-item"><span class="muted-text">{{ t('message.pages.opsExecution.history.detailFilePath') }}</span><span class="mono-text">{{ viewingRow.file_path }}</span></div>
                <div v-if="viewingRow.file_size != null" class="file-info-item"><span class="muted-text">{{ t('message.pages.opsExecution.history.detailFileSize', { size: viewingRow.file_size, kb: (viewingRow.file_size / 1024).toFixed(2) }) }}</span></div>
              </div>
              <div v-else>
                <pre v-if="viewingRow.script_content" class="mono-text code-pre">{{ viewingRow.script_content }}</pre>
                <pre v-else-if="viewingRow.command" class="mono-text code-pre">{{ viewingRow.command }}</pre>
              </div>
            </div>
            <div v-if="viewingRow.args && viewingRow.args.length" class="detail-section">
              <div class="detail-section-title">{{ t('message.pages.opsExecution.history.detailScriptArgs') }}</div>
              <pre class="mono-text output-pre">{{ JSON.stringify(viewingRow.args, null, 2) }}</pre>
            </div>
            <div v-if="viewingRow.error_message" class="detail-section">
              <div class="detail-section-title error-title">{{ t('message.pages.opsExecution.history.detailErrorInfo') }}</div>
              <pre class="mono-text error-pre">{{ viewingRow.error_message }}</pre>
            </div>
            <div v-if="viewingRow.output_buffer" class="detail-section">
              <div class="detail-section-title">{{ t('message.pages.opsExecution.history.detailOutput') }}</div>
              <pre class="mono-text output-pre output-stdout">{{ getViewingOutput.stdout }}</pre>
              <pre v-if="getViewingOutput.stderr" class="mono-text output-pre output-stderr">{{ getViewingOutput.stderr }}</pre>
              <div v-if="!getViewingOutput.stdout && !getViewingOutput.stderr" class="no-output">{{ t('message.pages.opsExecution.history.detailNoOutput') }}</div>
            </div>
            <div v-if="viewingRow.environment && Object.keys(viewingRow.environment).length" class="detail-section">
              <div class="detail-section-title">{{ t('message.pages.opsExecution.history.detailEnvVars') }}</div>
              <div class="env-tags">
                <el-tag v-for="(val, key) in viewingRow.environment" :key="key" size="small" class="env-tag">{{ key }}={{ val }}</el-tag>
              </div>
            </div>
          </template>

          <!-- Batch subtask list -->
          <template v-else>
            <div v-if="getBatchChildrenCount(viewingRow) > 0 || (loadChildrenMode === 'server' && childTotal > 0)" class="detail-section">
              <div class="detail-section-title">{{ t('message.pages.opsExecution.history.detailBatchDetail', { count: loadChildrenMode === 'server' ? childTotal : getBatchChildrenCount(viewingRow) }) }}</div>
              <el-table
                v-loading="loadChildrenMode === 'server' && childLoading"
                :data="loadChildrenMode === 'server' ? childList : getBatchChildren(viewingRow)"
                size="small"
                :border="false"
                class="detail-child-table"
              >
                <el-table-column width="60" :label="t('message.pages.opsExecution.history.detailSeq')">
                  <template #default="childScope"><span>{{ childScope.$index + 1 }}</span></template>
                </el-table-column>
                <el-table-column min-width="200" :label="t('message.pages.opsExecution.history.detailHostCol')">
                  <template #default="childScope">
                    <span>{{ childScope.row.host_ip }}</span>
                    <span v-if="childScope.row.host_name" class="muted-text"> ({{ childScope.row.host_name }})</span>
                  </template>
                </el-table-column>
                <el-table-column width="100" :label="t('message.pages.opsExecution.history.detailStatusCol')">
                  <template #default="childScope">
                    <el-tag size="small" :type="historyStatusTagType(childScope.row.status)">{{ historyStatusText(childScope.row.status) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column width="60" :label="t('message.pages.opsExecution.history.detailExitCol')">
                  <template #default="childScope">
                    <span v-if="childScope.row.exit_code !== null && childScope.row.exit_code !== undefined" :class="childScope.row.exit_code === 0 ? 'text-success' : 'text-danger'">{{ childScope.row.exit_code }}</span>
                    <span v-else class="muted-text">-</span>
                  </template>
                </el-table-column>
                <el-table-column width="180" :label="t('message.pages.opsExecution.history.detailActionCol')">
                  <template #default="childScope">
                    <el-button size="small" type="info" link @click.stop="handleViewDetail(childScope.row)"><el-icon><View /></el-icon>{{ t('message.pages.opsExecution.history.detailActionDetail') }}</el-button>
                    <el-button size="small" type="primary" link @click.stop="handleRerun(childScope.row)" :disabled="childScope.row.status === 1"><el-icon><Refresh /></el-icon>{{ t('message.pages.opsExecution.history.detailActionRerun') }}</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <!-- Subtask pagination -->
              <div v-if="loadChildrenMode === 'memory' && getBatchChildrenTotal(viewingRow) > 0" class="detail-child-pagination">
                <el-pagination
                  :current-page="batchPageConfigs[viewingRow.rowKey]?.page || 1"
                  :page-size="batchPageConfigs[viewingRow.rowKey]?.pageSize || BATCH_CHILD_PAGE_SIZE"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="getBatchChildrenTotal(viewingRow)"
                  layout="total, sizes, prev, pager, next, jumper"
                  small
                  background
                  @current-change="(p: number) => handleBatchPageChange(viewingRow, p)"
                  @size-change="(s: number) => handleBatchSizeChange(viewingRow, s)"
                />
              </div>
              <div v-if="loadChildrenMode === 'server' && childTotal > 0" class="detail-child-pagination">
                <el-pagination
                  :current-page="childPage"
                  :page-size="childLimit"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="childTotal"
                  layout="total, sizes, prev, pager, next, jumper"
                  small
                  background
                  @current-change="onChildPageChange"
                  @size-change="onChildLimitChange"
                />
              </div>
            </div>
          </template>
        </template>
      </div>
      <template #footer>
        <el-button v-if="detailStack.length > 0" @click="handleDetailBack"><el-icon><ArrowLeft /></el-icon>{{ t('message.pages.opsExecution.history.detailBack') }}</el-button>
        <el-button @click="handleDetailClose">{{ t('message.pages.opsExecution.history.detailClose') }}</el-button>
        <el-button
          v-if="viewingRow && !viewingRow._isBatch"
          type="primary"
          :icon="RefreshRight"
          @click="handleRerun(viewingRow)"
          :disabled="viewingRow.status === 1 || viewingRow.execution_type === 'upload' || viewingRow.execution_type === 'download'"
        >{{ viewingRow.status === 0 ? t('message.pages.opsExecution.history.actionRun') : t('message.pages.opsExecution.history.actionRerun') }}</el-button>
        <el-button
          v-if="viewingRow && viewingRow._isBatch"
          type="primary"
          :icon="RefreshRight"
          :disabled="hasRunningTasks(viewingRow)"
          @click="handleRerunBatch(viewingRow)"
        >{{ t('message.pages.opsExecution.history.actionRerun') }}</el-button>
        <el-button
          v-if="viewingRow && viewingRow._isBatch && hasBatchFailed(viewingRow)"
          type="success"
          :icon="RefreshRight"
          @click="handleRerunFailedBatch(viewingRow)"
        >{{ t('message.pages.opsExecution.history.actionRerunFail') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import {
  Refresh, Download, Search, Close, Monitor, View, ArrowLeft, RefreshRight,
  CircleCheck, WarningFilled, Clock, Loading, Files, User, Timer, CopyDocument,
} from '@element-plus/icons-vue';
import {
  historyStatusTagType, historyStatusText, historyExecTypeTagType, historyExecTypeText,
  historyFormatCommand, formatOutputBuffer, validateAndParseEnvironment,
  type RerunFormData,
} from './historyUtils';

const LiveOutputDialog = defineAsyncComponent(() => import('./LiveOutputDialog.vue'));
const RerunExecDialog = defineAsyncComponent(() => import('./RerunExecDialog.vue'));

const props = withDefaults(defineProps<{
  fetchList: (params: any) => Promise<any>;
  fetchDetail: (id: number | string) => Promise<any>;
  executeCommandFn: (params: any) => Promise<any>;
  executeScriptFn: (params: any) => Promise<any>;
  terminateCommandFn: (params: any) => Promise<any>;
  getWebSocketUrl: (executionId: string) => string;
  showExport?: boolean;
  showCopyCommand?: boolean;
  showLiveOutput?: boolean;
  loadChildrenMode?: 'memory' | 'server';
  refreshEventName?: string;
}>(), {
  showExport: false,
  showCopyCommand: false,
  showLiveOutput: true,
  loadChildrenMode: 'memory',
  refreshEventName: '',
});

defineEmits<{
  (e: 'fill-from-history', row: any): void;
}>();

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  host_ip?: string;
  status?: number | string;
  execution_type: string;
  batch_id?: string;
}

const STATUS_OPTIONS = computed(() => [
  { value: 0, label: t('message.pages.opsExecution.history.statusWaiting'), type: 'info', icon: Clock },
  { value: 1, label: t('message.pages.opsExecution.history.statusRunning'), type: 'warning', icon: Loading },
  { value: 2, label: t('message.pages.opsExecution.history.statusDone'), type: 'success', icon: CircleCheck },
  { value: 3, label: t('message.pages.opsExecution.history.statusFailed'), type: 'danger', icon: WarningFilled },
  { value: 4, label: t('message.pages.opsExecution.history.statusInterrupted'), type: 'info', icon: WarningFilled },
]);

const EXECUTION_TYPE_OPTIONS = computed(() => [
  { value: '', label: t('message.pages.opsExecution.history.searchTypeAll'), icon: Files },
  { value: 'command', label: t('message.pages.opsExecution.history.searchTypeCommand'), icon: Files },
  { value: 'script', label: t('message.pages.opsExecution.history.searchTypeScript'), icon: Files },
  { value: 'upload', label: t('message.pages.opsExecution.history.searchTypeUpload'), icon: Files },
  { value: 'download', label: t('message.pages.opsExecution.history.searchTypeDownload'), icon: Files },
]);

const pageIndex = ref(1);
const pageSize = ref(10);
const rawList = ref<any[]>([]);
const loading = ref(false);
const exporting = ref(false);
const viewingRow = ref<any>(null);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailStack = ref<any[]>([]);
const activeTab = ref('all');
const executionTypeRef = ref<string>('');
const queryForm = reactive<QueryParams>({ search: '', host_ip: '', execution_type: '', batch_id: '' });
const statCards = reactive({ total: 0, pending: 0, running: 0, success: 0, failed: 0 });

const showRerunConfirm = ref(false);
const rerunRow = ref<any>(null);
const batchRerunItems = ref<any[]>([]);

const showLiveOutputDialog = ref(false);
const liveOutputTitle = ref(t('message.pages.opsExecution.history.liveOutputTitle'));
const liveOutputContent = ref('');
let liveOutputWs: WebSocket | null = null;

// Batch subtasks - memory mode
interface BatchPageConfig { page: number; pageSize: number; }
const batchPageConfigs = reactive<Record<string, BatchPageConfig>>({});
const BATCH_CHILD_PAGE_SIZE = 10;

// Batch subtasks - server mode
const childList = ref<any[]>([]);
const childTotal = ref(0);
const childPage = ref(1);
const childLimit = ref(20);
const childLoading = ref(false);
const childBatchId = ref('');

function formatTime(time: string): string {
  if (!time) return '-';
  return String(time).replace('T', ' ').slice(0, 19);
}

function formatDuration(start?: string, end?: string): string {
  if (!start || !end) return '-';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (isNaN(diff) || diff < 0) return '-';
  if (diff < 1000) return diff + 'ms';
  if (diff < 60000) return (diff / 1000).toFixed(2) + 's';
  const min = Math.floor(diff / 60000);
  const sec = ((diff % 60000) / 1000).toFixed(0);
  return `${min}m${sec}s`;
}

const getRowClassName = ({ row }: { row: any }) => (row._isBatch ? 'batch-row' : '');

function getRowStartTime(row: any): string {
  if (row._isBatch) return row._create_datetime || row._started_at || '';
  return row.started_at || row.create_datetime || '';
}

function getRowEndTime(row: any): string {
  if (row._isBatch) return row._finished_at || getBatchFinishedTime(row);
  return row.finished_at || '';
}

function getRowDuration(row: any): string {
  if (row._isBatch) return row._duration || formatDuration(row._create_datetime || row._started_at, row._finished_at);
  return row.duration || formatDuration(row.started_at || row.create_datetime, row.finished_at);
}

function getBatchCount(row: any): number {
  if (row._batchCount !== undefined) return row._batchCount;
  return row._children?.length || 0;
}

function getBatchChildrenCount(row: any): number {
  if (row._batchCount !== undefined) return row._batchCount;
  return row._children?.length || 0;
}

function getBatchChildren(row: any): any[] {
  return row._children || [];
}

function getBatchChildrenTotal(row: any): number {
  return row._children?.length || 0;
}

function getBatchChildrenPaged(row: any): any[] {
  const key = row.rowKey || `batch-${row.batch_id}`;
  const config = batchPageConfigs[key] || { page: 1, pageSize: BATCH_CHILD_PAGE_SIZE };
  const children = row._children || [];
  const start = (config.page - 1) * config.pageSize;
  return children.slice(start, start + config.pageSize);
}

function ensureBatchPageConfig(key: string): BatchPageConfig {
  if (!batchPageConfigs[key]) {
    batchPageConfigs[key] = { page: 1, pageSize: BATCH_CHILD_PAGE_SIZE };
  }
  return batchPageConfigs[key];
}

function handleBatchPageChange(row: any, page: number) {
  const key = row.rowKey || `batch-${row.batch_id}`;
  ensureBatchPageConfig(key).page = page;
}

function handleBatchSizeChange(row: any, size: number) {
  const key = row.rowKey || `batch-${row.batch_id}`;
  const config = ensureBatchPageConfig(key);
  config.pageSize = size;
  config.page = 1;
}

function getBatchFinishedTime(batch: any): string {
  const children = batch._children || [];
  if (!children.length) return '-';
  const times = children.filter((c: any) => c.finished_at).map((c: any) => c.finished_at);
  if (!times.length) return '-';
  return formatTime(times.reduce((max: string, t: string) => (t > max ? t : max), times[0]));
}

function getBatchStatusTagType(batch: any): string {
  const children = batch._children || [];
  if (!children.length) {
    if (batch._batchStatus !== undefined) {
      const meta = STATUS_OPTIONS.value.find((s) => s.value === batch._batchStatus);
      return meta?.type || 'info';
    }
    return 'info';
  }
  const total = children.length;
  const successCount = children.filter((c: any) => c.status === 2).length;
  const failCount = children.filter((c: any) => c.status === 3).length;
  const hasRunning = children.some((c: any) => c.status === 1);
  const hasPending = children.some((c: any) => c.status === 0);
  if (successCount === total) return 'success';
  if (failCount === total) return 'danger';
  if (hasRunning || hasPending) return 'primary';
  if (failCount > 0) return 'warning';
  return 'info';
}

function getBatchStatusText(batch: any): string {
  const children = batch._children || [];
  if (!children.length) {
    if (batch._batchStatus !== undefined) {
      const meta = STATUS_OPTIONS.value.find((s) => s.value === batch._batchStatus);
      return meta?.label || t('message.pages.opsExecution.history.batchUnknown');
    }
    return t('message.pages.opsExecution.history.batchNone');
  }
  const total = children.length;
  const successCount = children.filter((c: any) => c.status === 2).length;
  const failCount = children.filter((c: any) => c.status === 3).length;
  const hasRunning = children.some((c: any) => c.status === 1);
  const hasPending = children.some((c: any) => c.status === 0);
  if (successCount === total) return t('message.pages.opsExecution.history.batchAllSuccess', { success: successCount, total });
  if (failCount === total) return t('message.pages.opsExecution.history.batchAllFail', { fail: failCount, total });
  if (hasRunning || hasPending) return t('message.pages.opsExecution.history.batchRunning', { success: successCount, total });
  if (failCount > 0) return t('message.pages.opsExecution.history.batchPartialSuccess', { success: successCount, total });
  return t('message.pages.opsExecution.history.batchPending', { total });
}

function batchSuccessCount(children: any[]): number {
  return children?.filter((c: any) => c.status === 2).length || 0;
}
function batchFailCount(children: any[]): number {
  return children?.filter((c: any) => c.status === 3).length || 0;
}
function batchRunningCount(children: any[]): number {
  return children?.filter((c: any) => c.status === 1).length || 0;
}

function hasBatchFailed(batch: any): boolean {
  if (batch._batchSummary) {
    return (batch._batchSummary.failed || 0) > 0 || (batch._batchSummary.interrupted || 0) > 0;
  }
  return batchFailCount(batch._children) > 0 || (batch._children || []).some((c: any) => c.status === 4);
}

function hasRunningTasks(batch: any): boolean {
  if (batch._batchSummary) return (batch._batchSummary.running || 0) > 0;
  return (batch._children || []).some((c: any) => c.status === 1);
}

const getViewingOutput = computed(() => {
  if (!viewingRow.value?.output_buffer) return { stdout: '', stderr: '' };
  return formatOutputBuffer(viewingRow.value.output_buffer);
});

const genRowKey = (row: any) => {
  if (row._isBatch) return `batch-${row.batch_id}`;
  return `row-${row.id}`;
};

const tableData = computed(() => {
  const rows: any[] = [];
  const batchMap = new Map<string, any[]>();
  for (const item of rawList.value) {
    if (item.batch_id) {
      if (!batchMap.has(item.batch_id)) batchMap.set(item.batch_id, []);
      batchMap.get(item.batch_id)!.push(item);
    } else {
      rows.push({ ...item, _isBatch: false, rowKey: genRowKey(item) });
    }
  }
  for (const [batchId, children] of batchMap.entries()) {
    const sortedChildren = [...children].sort((a, b) => {
      if (a.status !== b.status) {
        const order: Record<number, number> = { 3: 0, 1: 1, 0: 2, 2: 3 };
        return (order[a.status] ?? 5) - (order[b.status] ?? 5);
      }
      return (b.create_datetime || '').localeCompare(a.create_datetime || '');
    });
    const minTime = sortedChildren.reduce((min: string, c: any) => {
      if (!c.create_datetime) return min;
      if (!min || c.create_datetime < min) return c.create_datetime;
      return min;
    }, '');
    const maxFinishTime = sortedChildren.reduce((max: string, c: any) => {
      if (!c.finished_at) return max;
      if (!max || c.finished_at > max) return c.finished_at;
      return max;
    }, '');
    const firstChild = sortedChildren[0] || {};
    rows.push({
      ...firstChild,
      _isBatch: true,
      batch_id: batchId,
      _create_datetime: minTime,
      _finished_at: maxFinishTime,
      _children: sortedChildren.map((c: any) => ({ ...c, _isBatch: false, rowKey: genRowKey(c) })),
      rowKey: `batch-${batchId}`,
    });
  }
  rows.sort((a: any, b: any) => {
    const ta = a._isBatch ? a._create_datetime : a.create_datetime;
    const tb = b._isBatch ? b._create_datetime : b.create_datetime;
    return (tb || '').localeCompare(ta || '');
  });
  return rows;
});

const pagedTableData = computed(() => {
  const start = (pageIndex.value - 1) * pageSize.value;
  return tableData.value.slice(start, start + pageSize.value);
});

const total = computed(() => tableData.value.length);

async function loadStats() {
  try {
    const res: any = await props.fetchList({ page: 1, limit: 500 });
    const list = res?.data ?? [];
    statCards.total = list.length;
    statCards.pending = list.filter((r: any) => r.status === 0).length;
    statCards.running = list.filter((r: any) => r.status === 1).length;
    statCards.success = list.filter((r: any) => r.status === 2).length;
    statCards.failed = list.filter((r: any) => r.status === 3).length;
  } catch { /* ignore */ }
}

async function loadList() {
  loading.value = true;
  try {
    const allData: any[] = [];
    let fetchPage = 1;
    const fetchLimit = 500;
    let fetchedTotal = 0;
    while (true) {
      const params: any = { page: fetchPage, limit: fetchLimit };
      if (queryForm.search?.trim()) params.search = queryForm.search.trim();
      if (queryForm.host_ip?.trim()) params.host_ip = queryForm.host_ip.trim();
      if (executionTypeRef.value) params.execution_type = executionTypeRef.value;
      if (queryForm.batch_id?.trim()) params.batch_id = queryForm.batch_id.trim();
      if (activeTab.value !== 'all') params.status = activeTab.value;
      const res: any = await props.fetchList(params);
      const data = res?.data || [];
      if (!Array.isArray(data) || data.length === 0) break;
      allData.push(...data);
      fetchedTotal += data.length;
      const backendTotal = res?.total || 0;
      if (fetchedTotal >= backendTotal || data.length < fetchLimit) break;
      fetchPage++;
    }
    rawList.value = allData;
    pageIndex.value = 1;
  } catch {
    ElMessage.error(t('message.pages.opsExecution.history.loadFail'));
  } finally {
    loading.value = false;
  }
}

function onExecutionTypeChange(val: string | undefined | null) {
  executionTypeRef.value = val ?? '';
}
function handleSearch() { pageIndex.value = 1; loadList(); loadStats(); }
function handleResetSearch() {
  queryForm.search = ''; queryForm.host_ip = ''; queryForm.execution_type = ''; queryForm.batch_id = '';
  executionTypeRef.value = '';
  pageIndex.value = 1; activeTab.value = 'all'; loadList(); loadStats();
}
function handleTabChange() { pageIndex.value = 1; loadList(); }
function handlePageChange(p: number) { pageIndex.value = p; }
function handleSizeChange(size: number) { pageSize.value = size; pageIndex.value = 1; }

const statusMap = computed<Record<number, string>>(() => ({
  0: t('message.pages.opsExecution.history.statusMap.pending'),
  1: t('message.pages.opsExecution.history.statusMap.running'),
  2: t('message.pages.opsExecution.history.statusMap.done'),
  3: t('message.pages.opsExecution.history.statusMap.failed'),
}));

function handleExport() {
  if (!rawList.value.length) { ElMessage.warning(t('message.pages.opsExecution.history.exportNoData')); return; }
  exporting.value = true;
  try {
    const headers = [
      t('message.pages.opsExecution.history.csvHeaders.executionId'),
      t('message.pages.opsExecution.history.csvHeaders.type'),
      t('message.pages.opsExecution.history.csvHeaders.host'),
      t('message.pages.opsExecution.history.csvHeaders.ip'),
      t('message.pages.opsExecution.history.csvHeaders.status'),
      t('message.pages.opsExecution.history.csvHeaders.exitCode'),
      t('message.pages.opsExecution.history.csvHeaders.command'),
      t('message.pages.opsExecution.history.csvHeaders.time'),
    ];
    const rows: string[][] = rawList.value.map((item: any) => [
      item.execution_id || item.batch_id || '',
      historyExecTypeText(item.execution_type),
      item.host?.host_name || item.host_name || '',
      item.host?.host_ip || item.host_ip || '',
      statusMap.value[item.status] || String(item.status),
      item.exit_code !== null && item.exit_code !== undefined ? String(item.exit_code) : '',
      (historyFormatCommand(item) || '').replace(/[\r\n,]/g, ' '),
      item.create_datetime || '',
    ]);
    const csvContent = '\uFEFF' + [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `ops-execution-${Date.now()}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
    ElMessage.success(t('message.pages.opsExecution.history.exportSuccess', { count: rows.length }));
  } catch { ElMessage.error(t('message.pages.opsExecution.history.exportFail')); } finally { exporting.value = false; }
}

function closeLiveOutput() {
  showLiveOutputDialog.value = false;
  liveOutputContent.value = '';
  if (liveOutputWs) { try { liveOutputWs.close(); } catch { /* ignore */ } liveOutputWs = null; }
}

function connectOutputWebSocket(executionId: string, title: string = t('message.pages.opsExecution.history.liveOutputTitle')) {
  closeLiveOutput();
  liveOutputTitle.value = title;
  showLiveOutputDialog.value = true;
  liveOutputContent.value = t('message.pages.opsExecution.history.wsConnecting') + '\n';
  const wsUrl = props.getWebSocketUrl(executionId);
  liveOutputWs = new WebSocket(wsUrl);
  liveOutputWs.onopen = () => { liveOutputContent.value += t('message.pages.opsExecution.history.wsConnected') + '\n'; };
  liveOutputWs.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.stdout !== undefined) liveOutputContent.value += typeof data.stdout === 'string' ? data.stdout : JSON.stringify(data.stdout);
      if (data.stderr !== undefined) {
        const raw = typeof data.stderr === 'string' ? data.stderr : JSON.stringify(data.stderr);
        const processed = raw.replace(/::TAURUS_ERROR::LINE=(\d+)::CMD=(.*?)::EXIT=(\d+)::/g, (_m: string, line: string, cmd: string, exitCode: string) => '\n' + t('message.pages.opsExecution.history.scriptErrorLine', { line, cmd, code: exitCode }) + '\n');
        liveOutputContent.value += processed;
      }
      if (data.error !== undefined) liveOutputContent.value += t('message.pages.opsExecution.history.outputError', { error: data.error }) + '\n';
      if (data.finished !== undefined) { liveOutputContent.value += t('message.pages.opsExecution.history.outputDone', { code: data.finished }) + '\n'; loadList(); }
    } catch { /* ignore */ }
  };
  liveOutputWs.onerror = () => { liveOutputContent.value += t('message.pages.opsExecution.history.wsError') + '\n'; };
  liveOutputWs.onclose = () => { liveOutputContent.value += t('message.pages.opsExecution.history.wsClosed') + '\n'; loadList(); };
}

async function handleViewDetail(row: any) {
  if (viewingRow.value && detailVisible.value) detailStack.value.push(viewingRow.value);
  viewingRow.value = row;
  detailVisible.value = true;
  detailLoading.value = true;
  if (!row._isBatch && row.id) {
    try {
      const res: any = await props.fetchDetail(row.id);
      viewingRow.value = res?.data || res || row;
    } catch { /* use row data */ }
  } else if (row._isBatch && props.loadChildrenMode === 'server') {
    childBatchId.value = row.batch_id;
    childPage.value = 1;
    childList.value = [];
    await loadChildrenPage();
  }
  detailLoading.value = false;
}

async function loadChildrenPage() {
  if (!childBatchId.value) return;
  childLoading.value = true;
  try {
    const res: any = await props.fetchList({ page: childPage.value, limit: childLimit.value, batch_id: childBatchId.value });
    childList.value = res?.data ?? [];
    childTotal.value = res?.total ?? 0;
  } catch { childList.value = []; } finally { childLoading.value = false; }
}

function onChildPageChange(page: number) { childPage.value = page; loadChildrenPage(); }
function onChildLimitChange(limit: number) { childLimit.value = limit; childPage.value = 1; loadChildrenPage(); }

function handleDetailBack() {
  if (detailStack.value.length > 0) viewingRow.value = detailStack.value.pop()!;
}
function handleDetailClose() { detailStack.value = []; viewingRow.value = null; detailVisible.value = false; detailLoading.value = false; }

async function fetchAllChildrenByBatch(batchId: string): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  let total = 0;
  do {
    const res: any = await props.fetchList({ page, limit: 200, batch_id: batchId });
    const items = res?.data ?? [];
    total = res?.total ?? 0;
    all.push(...items);
    page++;
  } while (all.length < total);
  return all;
}

async function handleRerun(row: any) {
  if (row.status === 1) { ElMessage.warning(t('message.pages.opsExecution.history.rerunRunning')); return; }
  if (row.status === 0) {
    ElMessageBox.confirm(
      t('message.pages.opsExecution.history.rerunConfirmMsg'),
      t('message.pages.opsExecution.history.rerunConfirmTitle'),
      { type: 'info' },
    )
      .then(async () => {
        const executionId = row.execution_id;
        if (!executionId) { ElMessage.error(t('message.pages.opsExecution.history.rerunNoExecutionId')); return; }
        if (props.showLiveOutput) connectOutputWebSocket(executionId, t('message.pages.opsExecution.history.wsRunTitle', { id: executionId }));
        ElMessage.success(t('message.pages.opsExecution.history.rerunTriggered'));
      }).catch(() => {});
    return;
  }
  rerunRow.value = row;
  batchRerunItems.value = [];
  showRerunConfirm.value = true;
}

async function handleRerunBatch(batch: any) {
  let allItems: any[];
  if (props.loadChildrenMode === 'server' && batch.batch_id) {
    allItems = await fetchAllChildrenByBatch(batch.batch_id);
  } else {
    allItems = batch._children || [];
  }
  if (allItems.length === 0) { ElMessage.warning(t('message.pages.opsExecution.history.rerunNoTasks')); return; }
  const nonRunningItems = allItems.filter((item: any) => item.status !== 1);
  if (nonRunningItems.length === 0) { ElMessage.warning(t('message.pages.opsExecution.history.rerunAllRunning')); return; }
  const pendingItems = nonRunningItems.filter((item: any) => item.status === 0);
  const failedItems = nonRunningItems.filter((item: any) => item.status === 3);
  let itemsToRerun = nonRunningItems;
  if (pendingItems.length > 0 && pendingItems.length < nonRunningItems.length) {
    const result = await ElMessageBox.confirm(
      t('message.pages.opsExecution.history.rerunPendBatchConfirm', { pending: pendingItems.length, total: nonRunningItems.length }),
      t('message.pages.opsExecution.history.rerunPendBatchTitle'),
      { type: 'info', showCancelButton: true, confirmButtonText: t('message.pages.opsExecution.history.rerunPendOnlyConfirm'), cancelButtonText: t('message.pages.opsExecution.history.rerunAllConfirm'), distinguishCancelAndClose: true },
    ).catch(() => 'cancel');
    if (result === 'close') return;
    itemsToRerun = result === 'confirm' ? pendingItems : nonRunningItems;
  } else if (failedItems.length > 0 && failedItems.length < itemsToRerun.length) {
    const result = await ElMessageBox.confirm(
      t('message.pages.opsExecution.history.rerunFailBatchConfirm', { fail: failedItems.length, total: itemsToRerun.length }),
      t('message.pages.opsExecution.history.rerunFailBatchTitle'),
      { type: 'info', showCancelButton: true, confirmButtonText: t('message.pages.opsExecution.history.rerunFailOnlyConfirm'), cancelButtonText: t('message.pages.opsExecution.history.rerunAllConfirm'), distinguishCancelAndClose: true },
    ).catch(() => 'cancel');
    if (result === 'close') return;
    itemsToRerun = result === 'confirm' ? failedItems : itemsToRerun;
  }
  batchRerunItems.value = itemsToRerun;
  rerunRow.value = null;
  showRerunConfirm.value = true;
}

async function handleRerunFailedBatch(batch: any) {
  let allItems: any[];
  if (props.loadChildrenMode === 'server' && batch.batch_id) {
    allItems = await fetchAllChildrenByBatch(batch.batch_id);
  } else {
    allItems = batch._children || [];
  }
  const failedItems = allItems.filter((item: any) => item.status === 3 || item.status === 4);
  if (failedItems.length === 0) { ElMessage.warning(t('message.pages.opsExecution.history.rerunFailNoTask')); return; }
  rerunRow.value = null;
  batchRerunItems.value = failedItems;
  showRerunConfirm.value = true;
}

async function handleRerunDialogSubmit(form: RerunFormData, payload: any) {
  if (Array.isArray(payload)) await handleBatchRerunSubmit(form, payload);
  else await handleRerunSubmit(form, payload);
}

async function handleRerunSubmit(form: RerunFormData, record: any) {
  if (!record) return;
  const hostId = record.host?.id || record.host_id || record.host;
  if (!hostId) { ElMessage.error(t('message.pages.opsExecution.history.rerunNoHostId')); return; }
  const env = validateAndParseEnvironment(form.environment);
  if (env === null) { ElMessage.error(t('message.pages.opsExecution.history.rerunEnvFormatError')); return; }
  const isScript = form.execution_type === 'script';
  const approver_ids = ((form.approver_ids || []) as number[]).filter(Boolean);
  const countersign_ids = ((form.countersign_ids || []) as number[]).filter(Boolean);
  const approval_mode_val =
    countersign_ids.length > 0 ? 'all' : (form.approval_mode || (approver_ids.length ? 'any' : undefined));
  const submit_desc_val = form.submit_desc || '';
  const params: any = {
    host_id: hostId,
    command: isScript ? undefined : form.command,
    script_content: isScript ? form.script_content : undefined,
    script_type: isScript ? form.script_type : undefined,
    working_directory: form.working_directory || record.working_directory || undefined,
    timeout_seconds: form.timeout_seconds,
    environment: Object.keys(env).length > 0 ? env : undefined,
    use_shell: form.use_shell,
    merge_streams: form.merge_streams,
    load_profile: form.load_profile !== 'false' ? form.load_profile : undefined,
    privileged: form.privileged,
    su_user: form.su_user || undefined,
    su_password: form.su_password || undefined,
    exec_mode: form.exec_mode,
    concurrent: form.concurrent,
    fail_strategy: form.fail_strategy,
    pilot_count: form.pilot_count,
    pilot_success_rate: form.pilot_success_rate,
    need_audit: form.need_audit,
    auto_notify: form.auto_notify,
    approver_ids: approver_ids.length > 0 ? approver_ids : undefined,
    countersign_ids: countersign_ids.length > 0 ? countersign_ids : undefined,
    approval_mode: approval_mode_val as any,
    submit_desc: submit_desc_val || undefined,
    batch_id: crypto.randomUUID(),
  };
  try {
    const apiFunc = isScript ? props.executeScriptFn : props.executeCommandFn;
    const res = await apiFunc(params);
    const executionId = res.data?.execution_id;
    ElMessage.success(t('message.pages.opsExecution.history.rerunSubmitSuccess'));
    if (executionId && props.showLiveOutput) connectOutputWebSocket(executionId, t('message.pages.opsExecution.history.wsRerunTitle', { id: executionId }));
    else loadList();
  } catch { /* handled by interceptor */ }
}

async function handleBatchRerunSubmit(form: RerunFormData, items: any[]) {
  const env = validateAndParseEnvironment(form.environment);
  if (env === null) { ElMessage.error(t('message.pages.opsExecution.history.rerunEnvFormatError')); return; }
  const newBatchId = crypto.randomUUID();
  let firstExecutionId: string | null = null;
  for (const item of items) {
    const executionId = item.execution_id;
    if (item.status === 0 && executionId && !item._is_new_host) {
      if (props.showLiveOutput) connectOutputWebSocket(executionId, t('message.pages.opsExecution.history.wsRunTitle', { id: executionId }));
      if (!firstExecutionId) firstExecutionId = executionId;
      continue;
    }
    const hostId = item.host?.id || item.host_id || item.host;
    if (!hostId) { ElMessage.warning(t('message.pages.opsExecution.history.batchSkipNoHostId', { id: item.execution_id })); continue; }
    const overrideType = form.execution_type;
    const effectiveType = overrideType || (item.execution_type || 'command');
    const isScript = effectiveType === 'script';
    let command: string | undefined;
    let script_content: string | undefined;
    let script_type: string | undefined;
    if (overrideType === 'script') {
      script_content = form.script_content || item.script_content;
      script_type = form.script_type || item.script_type || 'sh';
    } else if (overrideType === 'command') {
      command = form.command || item.command;
    } else {
      if (isScript) { script_content = item.script_content; script_type = item.script_type || 'sh'; }
      else { command = item.command; }
    }
    const effectiveWorkingDirectory = form.working_directory?.trim() ? form.working_directory : (item.working_directory || undefined);
    const effectiveTimeout = form.timeout_seconds != null ? form.timeout_seconds : (item.timeout_seconds || 300);
    const effectiveUseShell = form.use_shell !== undefined ? form.use_shell : (item.use_shell ?? true);
    const effectiveMergeStreams = form.merge_streams !== undefined ? form.merge_streams : (item.merge_streams ?? false);
    let effectiveLoadProfile: any;
    if (form.load_profile && form.load_profile !== 'false') effectiveLoadProfile = form.load_profile;
    else if (form.load_profile === 'false') effectiveLoadProfile = undefined;
    else effectiveLoadProfile = item.load_profile && item.load_profile !== 'false' ? item.load_profile : undefined;
    const effectivePrivileged = form.privileged !== undefined ? form.privileged : (item.privileged ?? false);
    const effectiveNeedAudit = form.need_audit !== undefined ? form.need_audit : (item.need_audit ?? false);
    const effectiveAutoNotify = form.auto_notify !== undefined ? form.auto_notify : (item.auto_notify ?? false);
    const effectiveApproverIds = form.approver_ids !== undefined ? form.approver_ids : (item.approver_ids || []);
    const effectiveCountersignIds = form.countersign_ids !== undefined ? form.countersign_ids : (item.countersign_ids || []);
    const approver_ids = ((effectiveApproverIds || []) as number[]).filter(Boolean);
    const countersign_ids = ((effectiveCountersignIds || []) as number[]).filter(Boolean);
    const effectiveApprovalMode = form.approval_mode !== undefined ? form.approval_mode : (item.approval_mode || 'any');
    const approval_mode_val =
      countersign_ids.length > 0 ? 'all' : (effectiveApprovalMode || (approver_ids.length ? 'any' : undefined));
    const submit_desc_val = form.submit_desc !== undefined ? form.submit_desc : (item.submit_desc || '');
    const effectiveSuUser = (form.privileged === true || effectivePrivileged) ? (form.su_user?.trim() || item.su_user || '').trim() || undefined : undefined;
    const effectiveSuPassword = (form.privileged === true || effectivePrivileged) ? (form.su_password || undefined) : undefined;
    const itemEnv = item.environment || {};
    const effectiveEnv = Object.keys(env).length > 0 ? { ...itemEnv, ...env } : (Object.keys(itemEnv).length > 0 ? itemEnv : undefined);
    const params: any = {
      host_id: hostId, command, script_content, script_type,
      working_directory: effectiveWorkingDirectory, timeout_seconds: effectiveTimeout,
      environment: effectiveEnv, use_shell: effectiveUseShell, merge_streams: effectiveMergeStreams,
      load_profile: effectiveLoadProfile, privileged: effectivePrivileged,
      su_user: effectiveSuUser, su_password: effectiveSuPassword,
      exec_mode: form.exec_mode, concurrent: form.concurrent, fail_strategy: form.fail_strategy,
      pilot_count: form.pilot_count, pilot_success_rate: form.pilot_success_rate,
      need_audit: effectiveNeedAudit, auto_notify: effectiveAutoNotify,
      approver_ids: approver_ids.length > 0 ? approver_ids : undefined,
      countersign_ids: countersign_ids.length > 0 ? countersign_ids : undefined,
      approval_mode: approval_mode_val as any,
      submit_desc: submit_desc_val || undefined,
      batch_id: newBatchId,
    };
    const apiFunc = isScript ? props.executeScriptFn : props.executeCommandFn;
    try {
      const res = await apiFunc(params);
      if (!firstExecutionId && res.data?.execution_id) firstExecutionId = res.data.execution_id;
    } catch { /* single task failed, continue */ }
  }
  ElMessage.success(t('message.pages.opsExecution.history.rerunBatchSubmitSuccess', { count: items.length }));
  if (!firstExecutionId) loadList();
}

async function handleStop(row: any) {
  if (row.status !== 1) { ElMessage.warning(t('message.pages.opsExecution.history.terminateOnlyRunning')); return; }
  try {
    await ElMessageBox.confirm(t('message.pages.opsExecution.history.terminateConfirmMsg'), t('message.pages.opsExecution.history.terminateConfirmTitle'), { type: 'warning' });
    await props.terminateCommandFn({ host_id: row.host?.id || row.host_id, execution_id: row.execution_id });
    ElMessage.success(t('message.pages.opsExecution.history.terminateSuccess'));
    loadList();
  } catch (e: any) { if (e !== 'cancel') ElMessage.error(t('message.pages.opsExecution.history.terminateFail')); }
}

async function handleStopBatch(batch: any) {
  let runningItems: any[];
  if (props.loadChildrenMode === 'server' && batch.batch_id) {
    const allChildren = await fetchAllChildrenByBatch(batch.batch_id);
    runningItems = allChildren.filter((item: any) => item.status === 1);
  } else {
    runningItems = (batch._children || []).filter((item: any) => item.status === 1);
  }
  if (runningItems.length === 0) { ElMessage.warning(t('message.pages.opsExecution.history.terminateBatchNoRunning')); return; }
  try {
    await ElMessageBox.confirm(
      t('message.pages.opsExecution.history.terminateBatchConfirm', { count: runningItems.length }),
      t('message.pages.opsExecution.history.terminateConfirmTitle'),
      { type: 'warning' },
    );
    let successCount = 0;
    for (const item of runningItems) {
      try {
        await props.terminateCommandFn({ host_id: item.host?.id || item.host_id, execution_id: item.execution_id });
        successCount++;
      } catch { /* continue */ }
    }
    ElMessage.success(t('message.pages.opsExecution.history.terminateBatchSuccess', { count: successCount }));
    loadList();
  } catch (e: any) { if (e !== 'cancel') ElMessage.error(t('message.pages.opsExecution.history.terminateBatchFail')); }
}

function onRefreshEvent() { loadList(); loadStats(); }

onMounted(() => {
  loadList();
  loadStats();
  if (props.refreshEventName) window.addEventListener(props.refreshEventName, onRefreshEvent);
});

onBeforeUnmount(() => {
  closeLiveOutput();
  if (props.refreshEventName) window.removeEventListener(props.refreshEventName, onRefreshEvent);
});

defineExpose({
  refresh: () => { loadList(); loadStats(); },
});
</script>

<style scoped lang="scss">
.history-panel-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-block {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02);
  border: 1px solid #ebeef5;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 8px -2px rgba(0, 0, 0, 0.03);
  border: 1px solid #ebeef5;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
}

.stat-icon-box {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-total .stat-icon-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
.stat-pending .stat-icon-box { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: #fff; }
.stat-running .stat-icon-box { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #fff; }
.stat-success .stat-icon-box { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: #fff; }
.stat-failed .stat-icon-box { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: #fff; }

.stat-info {
  display: flex;
  flex-direction: column;
  .stat-num { font-size: 22px; font-weight: 700; color: #303133; line-height: 1.2; }
  .stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
}

.spin { animation: spin 1.5s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.search-bar {
  .search-form {
    display: flex !important;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;
  }
  .sf-item { margin-bottom: 0; }
  .sf-item.sf-kw    { flex: 2 1 280px; }
  .sf-item.sf-host  { flex: 1 1 200px; }
  .sf-item.sf-type  { flex: 0 1 160px; }
  .sf-item.sf-batch { flex: 1 1 220px; }
  .sf-item :deep(.el-input),
  .sf-item :deep(.el-select) { min-width: 0; width: 100%; }
  .sf-item :deep(.el-form-item__content) { min-width: 80px; }
  .sf-item :deep(.el-form-item__label) {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sf-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
    flex-shrink: 0;
    margin-left: auto;
    margin-bottom: 0;
  }
}

.status-tabs {
  :deep(.el-tabs__header) { margin-bottom: 0; }
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
}

.table-card {
  :deep(.batch-row) { background: #f8faff; }
  :deep(.batch-row:hover > td) { background: #ecf5ff !important; }
}

.mono-text { font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 13px; }
.muted { color: #c0c4cc; }
.muted-text { color: #909399; font-size: 12px; }
.batch-id { color: #409eff; }
.exit-code { font-size: 11px; color: #909399; margin-top: 2px; }
.summary-row { display: flex; justify-content: center; flex-wrap: wrap; }

.detail-dialog {
  :deep(.el-dialog__body) { max-height: 60vh; overflow-y: auto; }
}

.detail-dialog-body { min-height: 200px; }

.detail-descriptions {
  margin-bottom: 16px;
}

.detail-status-tag { margin-left: 6px; }

.detail-section {
  margin-top: 16px;
  .detail-section-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
    padding-left: 8px;
    border-left: 3px solid #409eff;
  }
  .error-title { border-left-color: #f56c6c; color: #f56c6c; }
}

.code-pre, .output-pre, .error-pre {
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

.output-stdout { color: #303133; }
.output-stderr { color: #f56c6c; }
.error-pre { color: #f56c6c; }

.no-output { color: #c0c4cc; text-align: center; padding: 20px; }

.env-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.env-tag { font-family: 'Menlo', 'Monaco', monospace; }

.detail-child-table {
  :deep(.el-table) { border: none; }
}

.detail-child-pagination {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.text-success { color: #67c23a; }
.text-danger { color: #f56c6c; }

@media (max-width: 768px) {
  .stat-row { grid-template-columns: repeat(2, 1fr); }
}
</style>