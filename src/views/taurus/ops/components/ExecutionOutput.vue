<template>
  <div class="output-section">
    <div v-if="executionTabs.length > 0" class="tab-container">
      <el-tabs
        :model-value="props.activeTab"
        @update:model-value="$emit('tab-click', { host: { id: $event } })"
        type="border-card"
        tab-position="top"
        closable
        :lazy="false"
        @tab-remove="$emit('tab-remove', $event)"
        @tab-click="$emit('tab-click', $event)"
      >
        <el-tab-pane
          v-for="tab in executionTabs"
          :key="tab.host.id"
          :name="tab.host.id"
          :label="`${tab.host.host_name} (${tab.host.host_ip})`"
        >
          <div class="tab-content-area">
            <div class="left-panel log-box">
              <div class="log-toolbar">
                <span class="log-title">{{ t('message.pages.opsExecution.output.realtimeLog') }}</span>
                <div class="log-btn-group">
                  <el-switch
                    :model-value="(tabAutoScroll[tab.host.id] ?? true)"
                    @update:model-value="setTabAutoScroll(tab.host.id, $event)"
                    :active-text="t('message.pages.opsExecution.output.autoScroll')"
                    size="small"
                  />
                  <el-button size="small" @click="copyTabOutput(tab)" :disabled="tab.outputChunks.length === 0">
                    <el-icon><CopyDocument /></el-icon>
                    {{ t('message.pages.opsExecution.output.copy') }}
                  </el-button>
                  <el-button size="small" @click="clearLog(tab)">
                    <el-icon><Delete /></el-icon>
                    {{ t('message.pages.opsExecution.output.clearLog') }}
                  </el-button>
                  <el-button size="small" @click="downloadLog(tab)">
                    <el-icon><Download /></el-icon>
                    {{ t('message.pages.opsExecution.output.exportLog') }}
                  </el-button>
                  <el-button
                    v-if="tab.exitCode !== null && tab.exitCode !== 0"
                    size="small"
                    type="primary"
                    @click="$emit('rerun-tab', tab)"
                  >
                    <el-icon><RefreshRight /></el-icon>
                    {{ t('message.pages.opsExecution.output.rerunSingle') }}
                  </el-button>
                </div>
              </div>

              <div class="log-status-strip">
                <el-tag
                  :type="getTabStatusTagType(tab)"
                  size="small"
                  class="status-tag"
                >
                  {{ getTabStatusText(tab) }}
                </el-tag>
                <el-tag
                  v-if="tab.exitCode !== null"
                  :type="tab.exitCode === 0 ? 'success' : 'danger'"
                  size="small"
                  class="exit-tag"
                >
                  {{ t('message.pages.opsExecution.output.exitCode', { code: tab.exitCode }) }}
                </el-tag>
                <div class="tab-controls">
                  <el-button
                    v-if="tab.executing"
                    type="danger"
                    size="small"
                    :icon="CloseBold"
                    @click="$emit('terminate', tab)"
                  >
                    {{ t('message.pages.opsExecution.output.terminate') }}
                  </el-button>
                </div>
              </div>

              <div class="output-container log-content">
                <template v-if="!tab.executing && tab.outputChunks.length === 0">
                  <div class="log-empty">{{ t('message.pages.opsExecution.output.noLogEmpty') }}</div>
                </template>
                <XtermOutput
                  v-else
                  :ref="(el: any) => setXtermRef(tab.host.id, el)"
                  :output-chunks="tab.outputChunks"
                  :auto-scroll="(tabAutoScroll[tab.host.id] ?? true)"
                />
              </div>
            </div>
            <div class="side-tab-panel" :class="{ collapsed: tab.sidePanelCollapsed }">
              <div v-if="tab.sidePanelCollapsed" class="collapsed-bar" @click="tab.sidePanelCollapsed = false">
                <el-icon class="collapse-icon"><ArrowLeft /></el-icon>
                <span class="vertical-text">{{ t('message.pages.opsExecution.output.collapsedBar') }}</span>
              </div>
              <template v-else>
                <el-tabs :model-value="tab.sideActiveTab" @update:model-value="(name) => handleFileTabChange(tab, name)" class="side-tabs">
                  <el-tab-pane name="running">
                    <template #label>
                      <div class="side-tab-label">
                        <el-icon><VideoPlay /></el-icon>
                        <span>{{ t('message.pages.opsExecution.output.cmdStatus') }}</span>
                        <el-badge v-if="tab.runningList.length > 0" :value="tab.runningList.length" class="side-badge" />
                      </div>
                    </template>
                    <div class="side-tab-content">
                      <div class="side-content-header">
                        <span>{{ t('message.pages.opsExecution.output.runningCount', { count: tab.runningList.length }) }}</span>
                        <el-button size="small" @click="$emit('load-running', tab)">
                          <el-icon><Refresh /></el-icon>
                          {{ t('message.pages.opsExecution.output.refresh') }}
                        </el-button>
                      </div>
                      <div v-if="tab.runningLoading" class="side-loading-inner">
                        <el-skeleton :rows="1" animated />
                      </div>
                      <div v-else-if="tab.runningList.length === 0" class="no-running-inner">
                        <el-empty :description="t('message.pages.opsExecution.output.noRunning')" :image-size="40" />
                      </div>
                      <div v-else class="running-list-inner">
                        <div
                          v-for="item in tab.runningList"
                          :key="item.execution_id"
                          class="running-card"
                        >
                          <div class="running-card-header">
                            <span class="running-card-id" :title="item.execution_id">{{ item.execution_id?.substring(0, 16) }}...</span>
                            <el-tag size="small" type="warning">{{ t('message.pages.opsExecution.output.statusRunning') }}</el-tag>
                          </div>
                          <div class="running-card-command" :title="item.command">{{ item.command || '-' }}</div>
                          <div class="running-card-footer">
                            <span class="running-card-time">{{ formatTimestamp(item.started_at) }}</span>
                            <el-button
                              size="small"
                              type="danger"
                              @click="$emit('terminate-running', tab, item)"
                            >
                              <el-icon><CloseBold /></el-icon>
                              {{ t('message.pages.opsExecution.output.terminate') }}
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>
                  <el-tab-pane name="upload">
                    <template #label>
                      <div class="side-tab-label">
                        <el-icon><Upload /></el-icon>
                        <span>{{ t('message.pages.opsExecution.output.fileManager') }}</span>
                      </div>
                    </template>
                    <div class="side-tab-content file-manager-content">
                      <div class="file-header-row">
                        <el-button
                          size="small"
                          :disabled="!tab.currentPath || tab.currentPath === '/' || tab.fileListLoading"
                          @click="$emit('go-parent-dir', tab)"
                        >
                          <el-icon><ArrowUp /></el-icon>
                          {{ t('message.pages.opsExecution.output.parentDir') }}
                        </el-button>
                        <el-input
                          :model-value="tab.currentPath"
                          @update:model-value="handlePathChange(tab, $event)"
                          :placeholder="t('message.pages.opsExecution.output.pathPlaceholder')"
                          size="small"
                          class="path-input"
                          @keyup.enter="$emit('load-files', tab)"
                        />
                        <el-button size="small" :loading="tab.fileListLoading" @click="$emit('load-files', tab)">
                          <el-icon><Refresh /></el-icon>
                          {{ t('message.pages.opsExecution.output.refresh') }}
                        </el-button>
                        <el-button size="small" type="primary" @click="tab.showUploadPanel = !tab.showUploadPanel">
                          <el-icon><Upload /></el-icon>
                          {{ t('message.pages.opsExecution.output.upload') }}
                        </el-button>
                      </div>
                      <div v-if="tab.showUploadPanel" class="file-upload-row">
                        <el-upload
                          drag
                          action=""
                          :auto-upload="false"
                          :on-change="(file: any) => $emit('file-select', tab, file)"
                          :file-list="tab.uploadFileList"
                          multiple
                          class="side-upload-compact"
                        >
                          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                          <div class="el-upload__text">{{ t('message.pages.opsExecution.output.dragOrClick') }}</div>
                        </el-upload>
                        <div class="upload-action-row">
                          <span class="file-count-label">{{ t('message.pages.opsExecution.output.fileCount', { count: tab.uploadFileList.length }) }}</span>
                          <el-button
                            type="primary"
                            size="small"
                            :loading="tab.uploading"
                            :disabled="tab.uploadFileList.length === 0 || !tab.currentPath"
                            @click="$emit('upload-files', tab)"
                          >
                            {{ t('message.pages.opsExecution.output.uploadToCurrent') }}
                          </el-button>
                        </div>
                      </div>
                      <div v-if="tab.fileListLoading" class="file-list-loading">
                        <el-skeleton :rows="3" animated />
                      </div>
                      <div v-else-if="tab.fileList.length === 0 && tab.currentPath" class="file-list-empty">
                        <el-empty :description="t('message.pages.opsExecution.output.noFileEmpty')" :image-size="40" />
                      </div>
                      <div v-else-if="!tab.currentPath" class="file-list-empty">
                        <el-empty :description="t('message.pages.opsExecution.output.noPathTip')" :image-size="40" />
                      </div>
                      <div v-else class="file-list-container">
                        <div
                          v-for="item in tab.fileList"
                          :key="item.name"
                          class="file-item"
                          :class="{ 'is-dir': item.is_dir }"
                          @click="item.is_dir ? $emit('enter-dir', tab, item.name) : null"
                        >
                          <el-icon v-if="item.is_dir" class="file-item-icon dir-icon">
                            <Folder />
                          </el-icon>
                          <el-icon v-else class="file-item-icon">
                            <Document />
                          </el-icon>
                          <div class="file-item-info">
                            <div class="file-item-name">
                              {{ item.name }}
                              <span v-if="item.is_dir" class="dir-badge">{{ t('message.pages.opsExecution.output.dirTag') }}</span>
                            </div>
                            <div class="file-item-meta">
                              <span v-if="item.permissions" class="file-meta-perm">{{ item.permissions }}</span>
                              <span v-if="item.owner" class="file-meta-owner">{{ item.owner }}</span>
                              <span>{{ item.is_dir ? '-' : formatFileSize(item.size) }}</span>
                              <span class="file-meta-sep">·</span>
                              <span>{{ formatTimestamp(item.modified_at) }}</span>
                            </div>
                          </div>
                          <div v-if="!item.is_dir" class="file-item-actions" @click.stop>
                            <el-button
                              size="small"
                              type="primary"
                              link
                              @click="$emit('download-file', tab, item)"
                            >
                              <el-icon><Download /></el-icon>
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
                <div class="collapse-sidebar" @click="tab.sidePanelCollapsed = true">
                <el-icon class="collapse-icon"><ArrowRight /></el-icon>
                <span class="vertical-text">{{ t('message.pages.opsExecution.output.collapseSidebar') }}</span>
              </div>
              </template>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div v-if="executionTabs.length > 0" class="log-stat">
      <span>{{ t('message.pages.opsExecution.output.totalHosts', { total: stat.total }) }}</span>
      <span class="stat-success">{{ t('message.pages.opsExecution.output.successHosts', { count: stat.success }) }}</span>
      <span class="stat-fail">{{ t('message.pages.opsExecution.output.failHosts', { count: stat.fail }) }}</span>
      <span class="stat-pending">{{ t('message.pages.opsExecution.output.pendingHosts', { count: stat.pending }) }}</span>
    </div>

    <div v-else class="no-output">
      <el-empty :description="t('message.pages.opsExecution.output.noOutput')" :image-size="100" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import {
  CloseBold, ArrowLeft, ArrowRight, VideoPlay, Refresh, Upload, UploadFilled,
  Folder, Document, ArrowUp, Download, Delete, RefreshRight, CopyDocument,
} from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import XtermOutput from './XtermOutput.vue';
import { formatTimestamp } from './historyUtils';

const { t } = useI18n();

interface Host {
  id: string;
  host_uuid: string;
  host_name: string;
  host_ip: string;
}

interface RunningExecution {
  execution_id: string;
  command: string;
  started_at?: string;
}

interface UploadFileItem {
  name: string;
  raw: File;
}

interface FileEntry {
  name: string;
  is_dir: boolean;
  size?: number;
  permissions?: string;
  owner?: string;
  modified_at?: number;
}

interface ExecutionTab {
  host: Host;
  executionId: string | null;
  exitCode: number | null;
  executing: boolean;
  ws: WebSocket | null;
  outputChunks: string[];
  runningList: RunningExecution[];
  runningLoading: boolean;
  runningExpanded: boolean;
  sideActiveTab: string;
  uploadFileList: UploadFileItem[];
  uploadRemotePath: string;
  uploading: boolean;
  sidePanelCollapsed: boolean;
  fileList: FileEntry[];
  fileListLoading: boolean;
  currentPath: string;
  pathHistory: string[];
  showUploadPanel: boolean;
}

const props = defineProps<{
  executionTabs: ExecutionTab[];
  activeTab: string;
  xtermRefs: Record<string, any>;
}>();

const emit = defineEmits<{
  'tab-remove': [hostId: string];
  'tab-click': [tab: any];
  terminate: [tab: ExecutionTab];
  'load-running': [tab: ExecutionTab];
  'terminate-running': [tab: ExecutionTab, row: RunningExecution];
  'go-parent-dir': [tab: ExecutionTab];
  'load-files': [tab: ExecutionTab];
  'file-select': [tab: ExecutionTab, file: any];
  'upload-files': [tab: ExecutionTab];
  'enter-dir': [tab: ExecutionTab, dirName: string];
  'download-file': [tab: ExecutionTab, item: FileEntry];
  'rerun-tab': [tab: ExecutionTab];
}>();

const tabAutoScroll = reactive<Record<string, boolean>>({});
const setTabAutoScroll = (hostId: string, v: boolean) => {
  tabAutoScroll[hostId] = v;
};

const stat = computed(() => {
  const total = props.executionTabs.length;
  let success = 0;
  let fail = 0;
  let pending = 0;
  for (const tab of props.executionTabs) {
    if (tab.executing) {
      pending++;
    } else if (tab.exitCode === 0) {
      success++;
    } else if (tab.exitCode !== null) {
      fail++;
    } else {
      pending++;
    }
  }
  return { total, success, fail, pending };
});

const clearLog = (tab: ExecutionTab) => {
  tab.outputChunks.splice(0, tab.outputChunks.length);
};

const copyTabOutput = async (tab: ExecutionTab) => {
  const xtermEl = props.xtermRefs[tab.host.id];
  const raw: string = typeof xtermEl?.getOutputText === 'function'
    ? xtermEl.getOutputText()
    : (tab.outputChunks || []).join('');
  const text = (raw || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!text.trim()) {
    ElMessage.warning(t('message.pages.opsExecution.messages.noOutputToCopy'));
    return;
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    ElMessage.success(t('message.pages.opsExecution.messages.copySuccess'));
  } catch (e) {
    ElMessage.error(t('message.pages.opsExecution.messages.copyFail'));
  }
};

const downloadLog = (tab: ExecutionTab) => {
  const xtermEl = props.xtermRefs[tab.host.id];
  const raw: string = typeof xtermEl?.getOutputText === 'function'
    ? xtermEl.getOutputText()
    : (tab.outputChunks || []).join('');
  const text = (raw || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!text.trim()) {
    // Allow downloading empty file even when no content, to avoid no-UI-feedback scenario
  }
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeHost = `${tab.host.host_name || tab.host.host_ip || 'host'}`.replace(/[^a-zA-Z0-9._-]/g, '_');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `${safeHost}__${ts}.log`;
  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

const handlePathChange = (tab: ExecutionTab, newPath: string) => {
  tab.currentPath = newPath;
};

const toggleSidePanel = (tab: ExecutionTab, collapsed: boolean) => {
  tab.sidePanelCollapsed = collapsed;
};

const setXtermRef = (hostId: string, el: any) => {
  if (el) {
    props.xtermRefs[hostId] = el;
  } else {
    delete props.xtermRefs[hostId];
  }
};

const getTabStatusTagType = (tab: ExecutionTab): string => {
  if (tab.executing) return 'warning';
  if (tab.exitCode === 0) return 'success';
  if (tab.exitCode !== null) return 'danger';
  return 'info';
};

const getTabStatusText = (tab: ExecutionTab): string => {
  if (tab.executing) return t('message.pages.opsExecution.output.statusExecuting');
  if (tab.exitCode === 0) return t('message.pages.opsExecution.output.statusSuccess');
  if (tab.exitCode !== null) return t('message.pages.opsExecution.output.statusFailed');
  return t('message.pages.opsExecution.output.statusWaiting');
};

const handleFileTabChange = (tab: ExecutionTab, name: string) => {
  if (name === 'upload' && tab.fileList.length === 0 && !tab.fileListLoading) {
    emit('load-files', tab);
  } else if (name === 'running' && !tab.runningLoading) {
    emit('load-running', tab);
  }
};

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};
</script>

<style scoped lang="scss">
.output-section {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-container {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;

  :deep(.el-tabs) {
    width: 100%;
    height: 100%;
  }

  :deep(.el-tabs__content) {
    height: calc(100% - 40px);
    overflow: hidden;
  }

  :deep(.el-tab-pane) {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}

.no-output {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Tab content area: left (status + terminal) vs right (aux panel) ── */
.tab-content-area {
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  padding: 8px 14px 14px;
  gap: 10px;
}

/* ── Left container: toolbar + status bar + terminal + global stats ─────── */
.left-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
  background: #ffffff;
}

/* ── Log top toolbar (consistent with script execution) ──────────── */
.log-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
  flex: 0 0 auto;

  .log-title {
    font-weight: 600;
    font-size: 14px;
    color: #303133;
  }

  .log-btn-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

/* ── Host execution status bar (status/exit code/terminate button) ─── */
.log-status-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: #2d2d2d;
  border-bottom: 1px solid #404040;
  flex: 0 0 auto;

  .status-tag {
    font-size: 12px;
    border: none;
    background: rgba(64, 158, 255, 0.2);
    color: #9ecbff;
  }
  .exit-tag {
    font-size: 12px;
    background: transparent;
    border: 1px solid #67c23a;
    color: #b3e19d;
  }
  .tab-controls {
    margin-left: auto;
  }
}

/* ── Terminal output area (fill remaining space, unified dark theme) ── */
.log-content {
  flex: 1;
  min-height: 0;
  display: flex;
  background: #1e1e1e;
  overflow: hidden;
}

.output-container {
  flex: 1;
  min-height: 0;
  display: flex;
}

/* ── Empty state hint ──────────────────────────────────── */
.log-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #909399;
  font-size: 13px;
  background: #1e1e1e;
}

/* ── Global host execution status bar (consistent with script execution) */
.log-stat {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 16px;
  background: #f8f9fa;
  border-top: 1px solid #ebeef5;
  border-left: 1px solid #ebeef5;
  border-right: 1px solid #ebeef5;
  border-bottom: 0;
  border-radius: 0 0 6px 6px;
  margin: 0 14px 14px;
  font-size: 12px;
  color: #606266;
  flex: 0 0 auto;

  .stat-success {
    color: #67c23a;
    font-weight: 500;
  }
  .stat-fail {
    color: #f56c6c;
    font-weight: 500;
  }
  .stat-pending {
    color: #e6a23c;
    font-weight: 500;
  }
}

/* ── Right aux panel ──────────────────────────────── */
.side-tab-panel {
  flex: 0 0 360px;
  width: 360px;
  min-width: 360px;
  max-width: 360px;
  display: flex;
  flex-direction: row;
  overflow: visible;
  box-sizing: border-box;

  &.collapsed {
    flex: 0 0 20px;
    width: 20px;
    min-width: 20px;
    max-width: 20px;
    height: 100%;
    flex-direction: column;
  }

  .collapsed-bar {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    color: #909399;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    transition: all 0.2s;

    &:hover {
      background: #ecf5ff;
      color: #409eff;
    }

    .collapse-icon {
      font-size: 14px;
    }

    .vertical-text {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-size: 11px;
      letter-spacing: 1px;
    }
  }

  .collapse-sidebar {
    margin-left: 1px;
    flex: 0 0 20px;
    width: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    color: #909399;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 0 6px 6px 0;
    transition: all 0.2s;

    &:hover {
      background: #ecf5ff;
      color: #409eff;
    }

    .collapse-icon {
      font-size: 14px;
    }

    .vertical-text {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-size: 11px;
      letter-spacing: 1px;
    }
  }

  :deep(.side-tabs) {
    flex: 1;
    min-height: 0;
    height: 100%;
    display: block;
    min-width: 0;
    width: 100%;
    border: 1px solid #e4e7ed;
    border-radius: 6px 0 0 6px;
    overflow: hidden;
    box-sizing: border-box;
    background: #fff;
  }

  :deep(.side-tabs .el-tabs) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :deep(.side-tabs .el-tabs__header) {
    padding: 0;
    margin: 0;
    background: #f8f9fa;
    border-bottom: 1px solid #e4e7ed;
    flex: 0 0 auto;
  }

  :deep(.side-tabs .el-tabs__nav) {
    border: none !important;
  }

  :deep(.side-tabs .el-tabs__item) {
    padding: 0 16px;
    font-size: 13px;
    height: 40px;
    line-height: 40px;
    border-right: 1px solid #e4e7ed;
    background: #f8f9fa;
    transition: background 0.2s;

    &:last-child {
      border-right: none;
    }

    &.is-active {
      background: #ffffff;
      color: #409eff;
      border-bottom: 2px solid #409eff;
      font-weight: 500;
    }

    &:hover:not(.is-active) {
      background: #ecf5ff;
      color: #409eff;
    }
  }

  :deep(.side-tabs .el-tabs__content) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.side-tabs .el-tab-pane) {
    height: 100%;
    overflow: hidden;
  }
}

.side-tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;

  .el-icon {
    font-size: 14px;
  }

  .side-badge {
    margin-left: 2px;
  }
}

.side-tab-content {
  height: 100%;
  overflow-y: auto;
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;
  }
}

/* ── Command status sub-panel ───────────────────────── */
.side-content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  padding: 4px 0 6px;
  border-bottom: 1px dashed #ebeef5;
}

.side-loading-inner,
.no-running-inner,
.running-list-inner {
  flex: 1;
}

.no-running-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;

  :deep(.el-empty) {
    padding: 0;
  }
}

.running-list-inner {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.running-card {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px 10px;
  background: #fafafa;

  .running-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;

    .running-card-id {
      font-size: 12px;
      font-family: 'Menlo', 'Monaco', monospace;
      color: #606266;
      max-width: 70%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .running-card-command {
    font-size: 13px;
    color: #303133;
    padding: 4px 6px;
    background: #f0f2f5;
    border-radius: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 6px;
  }

  .running-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .running-card-time {
      font-size: 12px;
      color: #909399;
    }
  }
}

/* ── File management sub-panel ──────────────────────── */
.file-manager-content {
  padding: 8px 12px;
  gap: 10px;
}

.file-header-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;

  .path-input {
    flex: 1;
    min-width: 0;
  }

  :deep(.el-button) {
    flex: 0 0 auto;
    white-space: nowrap;
  }
}

.file-upload-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;

  .side-upload-compact {
    :deep(.el-upload-dragger) {
      padding: 12px;
    }
  }

  .upload-action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .file-count-label {
      font-size: 12px;
      color: #606266;
    }
  }
}

.file-list-loading,
.file-list-empty,
.file-list-container {
  flex: 1;
  min-height: 0;
}

.file-list-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;

  :deep(.el-empty) {
    padding: 0;
  }
}

.file-list-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;
  }
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: default;

  &:hover {
    background: #f5f7fa;
  }

  &.is-dir {
    cursor: pointer;

    &:hover {
      background: #ecf5ff;
    }

    .dir-icon {
      color: #e6a23c;
    }
  }

  .file-item-icon {
    flex: 0 0 auto;
    color: #909399;
  }

  .file-item-info {
    flex: 1;
    min-width: 0;

    .file-item-name {
      font-size: 13px;
      color: #303133;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      .dir-badge {
        margin-left: 4px;
        font-size: 11px;
        color: #909399;
      }
    }

    .file-item-meta {
      font-size: 11px;
      color: #909399;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 2px;

      .file-meta-sep {
        color: #c0c4cc;
      }
    }
  }

  .file-item-actions {
    flex: 0 0 auto;
    display: flex;
    gap: 4px;

    :deep(.el-button) {
      padding: 4px 8px;
    }
  }
}
</style>
