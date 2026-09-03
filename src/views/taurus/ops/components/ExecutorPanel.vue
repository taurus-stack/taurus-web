<template>
  <div class="executor-panel">
    <TopToolbar
      :mode="mode"
      :selected-hosts-count="selectedHosts.length"
      :command-preview="commandPreview"
      :advanced-options-count="advancedOptionsCount"
      :executing="executing"
      :can-execute="canExecute"
      :all-tabs-not-executing="allTabsNotExecuting"
      :has-any-output="hasAnyOutput"
      @focus-section="openDrawerWithFocus"
      @execute="execute"
      @terminate-all="terminateAllTabs"
      @copy-output="copyAllOutput"
      @export-output="exportAllOutput"
      @show-history="showHistoryDialog = true"
    />

    <div class="main-content">
      <ConfigDrawer
        v-model:collapsed="drawerCollapsed"
        :focus-section="drawerFocusSection"
        :executing="executing"
        :can-execute="canExecute"
        :all-tabs-not-executing="allTabsNotExecuting"
        :selected-hosts="selectedHosts"
        :selected-host-from-history="selectedHostFromHistory"
        :quick-history-loading="quickHistoryLoading"
        :history-batch-options="historyBatchOptions"
        :history-host-options="historyHostOptions"
        :displayed-batch-options="displayedBatchOptions"
        :displayed-host-options="displayedHostOptions"
        :has-more-batch-options="hasMoreBatchOptions"
        :has-more-host-options="hasMoreHostOptions"
        :max-dropdown-items="MAX_DROPDOWN_ITEMS"
        :saved-host-sets="savedHostSets"
        :mode="mode"
        :command-input="commandInput"
        :script-type="scriptType"
        :script-content="scriptContent"
        :selected-quick-history="selectedQuickHistory"
        :displayed-history-commands="displayedHistoryCommands"
        :deduped-history-items="dedupedHistoryItems"
        :has-more-history-commands="hasMoreHistoryCommands"
        :working-directory="workingDirectory"
        :timeout-seconds="timeoutSeconds"
        :env-vars-text="envVarsText"
        :load-profile="loadProfile"
        :merge-streams="mergeStreams"
        :privileged-execution="privilegedExecution"
        :su-user="suUser"
        :su-password="suPassword"
        :exec-mode="execMode"
        :concurrent="concurrent"
        :fail-strategy="failStrategy"
        :pilot-count="pilotCount"
        :pilot-success-rate="pilotSuccessRate"
        :need-audit="needAudit"
        :auto-notify="autoNotify"
        :approval-mode="approvalMode"
        :approver-ids="approverIds"
        :countersign-ids="countersignIds"
        :submit-desc="submitDesc"
        @execute="execute"
        @terminate-all="terminateAllTabs"
        @show-history="showHistoryDialog = true"
        @show-selector="showHostSelector = true"
        @remove-host="removeHost"
        @clear-hosts="clearAllHosts"
        @save-host-set="saveCurrentHostSet"
        @load-host-set="loadHostSet"
        @host-history-visible="onHostHistoryVisible"
        @host-history-select="onHostHistorySelect"
        @quick-history-visible="onQuickHistoryVisible"
        @quick-history-select="onQuickHistorySelect"
        @update:selected-quick-history="selectedQuickHistory = $event"
        @update:command-input="commandInput = $event"
        @update:script-type="scriptType = $event"
        @update:script-content="scriptContent = $event"
        @update:working-directory="workingDirectory = $event"
        @update:timeout-seconds="timeoutSeconds = $event"
        @update:env-vars-text="envVarsText = $event"
        @update:load-profile="loadProfile = $event"
        @update:merge-streams="mergeStreams = $event"
        @update:privileged-execution="privilegedExecution = $event"
        @update:su-user="suUser = $event"
        @update:su-password="suPassword = $event"
        @update:exec-mode="execMode = $event"
        @update:concurrent="concurrent = $event"
        @update:fail-strategy="failStrategy = $event"
        @update:pilot-count="pilotCount = $event"
        @update:pilot-success-rate="pilotSuccessRate = $event"
        @update:need-audit="needAudit = $event"
        @update:auto-notify="autoNotify = $event"
        @update:approval-mode="approvalMode = $event"
        @update:approver-ids="approverIds = $event"
        @update:countersign-ids="countersignIds = $event"
        @update:submit-desc="submitDesc = $event"
      />

      <div class="output-panel">
        <ExecutionOutput
          :execution-tabs="executionTabs"
          :active-tab="activeTab"
          :xterm-refs="xtermRefs"
          @tab-remove="handleTabRemove"
          @tab-click="handleTabClick"
          @terminate="terminateExecution"
          @load-running="loadRunningExecutions"
          @terminate-running="terminateRunningExecution"
          @go-parent-dir="goToParentDirectory"
          @load-files="loadFileList"
          @file-select="handleFileSelect"
          @upload-files="uploadFiles"
          @enter-dir="enterDirectory"
          @download-file="downloadFileItem"
          @rerun-tab="rerunSingleTab"
        />
      </div>
    </div>

    <el-dialog
      v-model="showHistoryDialog"
      :title="t('message.pages.opsExecution.history.title')"
      width="95%"
      top="5vh"
      destroy-on-close
      class="history-dialog-wrapper"
    >
      <ExecutionHistoryPanel
        mode="panel"
        :fetch-list="executionApi.GetList"
        :fetch-detail="executionApi.GetObj"
        :execute-command-fn="executeCommand"
        :execute-script-fn="executeScript"
        :terminate-command-fn="terminateCommand"
        :get-web-socket-url="getOpsWebSocketUrl"
        :show-export="true"
        :show-copy-command="true"
        :show-live-output="true"
        :load-children-mode="'server'"
        @fill-from-history="fillFromHistory"
      />
    </el-dialog>

    <HostSelectDialog
      v-model="showHostSelector"
      @confirm="handleHostSelectConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch, defineAsyncComponent } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useEditionStore } from '/@/editions';
const { t } = useI18n();
import {
  executeCommand,
  executeScript,
  terminateCommand,
  executionHistory,
  listExecutions,
  getOpsWebSocketUrl,
  uploadFile,
  listFiles,
  downloadFile,
  type FileEntry,
} from '/@/api/taurus/ops';

import TopToolbar from './TopToolbar.vue';
import ConfigDrawer from './ConfigDrawer.vue';
import ExecutionOutput from './ExecutionOutput.vue';
import ExecutionHistoryPanel from './ExecutionHistoryPanel.vue';
import * as executionApi from '/@/api/taurus/ops-execution/api';

const HostSelectDialog = defineAsyncComponent(() => import('./HostSelectDialog.vue'));

import { formatTimestamp } from './historyUtils';

interface Host {
  id: string;
  host_uuid: string;
  host_name: string;
  host_ip: string;
  host_type?: string;
  online_status?: number;
  remark?: string;
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
  pendingApproval?: boolean;
  approvalId?: number | null;
  batchId?: string | null;
  approvalMode?: 'any' | 'all' | null;
  approvalCandidateApprovers?: any[];
}

const props = defineProps<{
  mode: 'command' | 'script';
}>();

const selectedHosts = ref<Host[]>([]);
const showHostSelector = ref(false);

const commandInput = ref('');
const scriptType = ref<'sh' | 'python'>('sh');
const scriptContent = ref('');

const workingDirectory = ref('');
const timeoutSeconds = ref(300);
const envVarsText = ref('');
const useShell = ref(true);
const loadProfile = ref('false');
const mergeStreams = ref(false);
const privilegedExecution = ref(false);
const suUser = ref('');
const suPassword = ref('');

const execMode = ref<'serial' | 'parallel' | 'pilot'>('parallel');
const concurrent = ref(10);
const failStrategy = ref<'stop' | 'continue'>('continue');
const pilotCount = ref(2);
const pilotSuccessRate = ref(100);
const needAudit = ref(false);
const autoNotify = ref(false);
const approvalMode = ref<'any' | 'all'>('any');
const approverIds = ref<number[]>([]);
const countersignIds = ref<number[]>([]);
const submitDesc = ref('');

// Edition gate: reset EE-only state when Edition Store says feature is unavailable
const editionStore = useEditionStore();
watch(() => editionStore.hasFeature('OPS_PILOT_CANARY'), (ok) => {
  if (!ok && execMode.value === 'pilot') execMode.value = 'parallel';
});

const executing = ref(false);
const executionTabs = ref<ExecutionTab[]>([]);
const activeTab = ref('');
const xtermRefs = ref<Record<string, any>>({});

// Drawer collapsed state: collapsed by default, expand and focus the relevant section when toolbar badge/preview/advanced button is clicked
const drawerCollapsed = ref(false);
const drawerFocusSection = ref<'host' | 'command' | 'advanced' | 'strategy' | null>(null);

const openDrawerWithFocus = (section: 'host' | 'command' | 'advanced' | 'strategy') => {
  drawerFocusSection.value = section;
  drawerCollapsed.value = false;
};

const showHistoryDialog = ref(false);
const historyItems = ref<any[]>([]);
const historyPage = ref(1);
const historyLimit = ref(20);
const historyLoading = ref(false);

const selectedQuickHistory = ref('');
const quickHistoryLoading = ref(false);
const selectedHostFromHistory = ref('');

const batchId = ref('');
const savedHostSets = ref<Array<{ name: string; hosts: Host[] }>>([]);

const setXtermRef = (hostId: string, el: any) => {
  if (el) {
    xtermRefs.value[hostId] = el;
  } else {
    delete xtermRefs.value[hostId];
  }
};

watch(() => Object.keys(xtermRefs.value).length, (count) => {
  console.log('xtermRefs count:', count, Object.keys(xtermRefs.value));
});

watch(selectedHosts, (hosts) => {
  executionTabs.value.forEach(tab => {
    if (tab.ws) {
      tab.ws.close();
      tab.ws = null;
    }
  });
  executionTabs.value = hosts.map(host => createExecutionTab(host));
  if (executionTabs.value.length > 0) {
    if (!executionTabs.value.some(tab => tab.host.id === activeTab.value)) {
      activeTab.value = executionTabs.value[0].host.id;
    }
    executionTabs.value.forEach(tab => {
      loadRunningExecutions(tab);
    });
  }
}, { deep: true });

const canExecute = computed(() => {
  if (selectedHosts.value.length === 0) return false;
  if (props.mode === 'command') {
    return commandInput.value.trim().length > 0;
  } else {
    return scriptContent.value.trim().length > 0;
  }
});

// Derived state needed for toolbar badge/preview
const commandPreview = computed(() => {
  if (props.mode === 'command') {
    const cmd = commandInput.value.trim();
    if (!cmd) return t('message.pages.opsExecution.toolbar.promptCommand');
    return cmd.length > 30 ? cmd.substring(0, 30) + '...' : cmd;
  } else {
    const trimmed = scriptContent.value.trim();
    const placeholder = scriptType.value === 'sh'
      ? t('message.pages.opsExecution.toolbar.promptScriptSh')
      : t('message.pages.opsExecution.toolbar.promptScriptPy');
    if (!trimmed) return placeholder;
    const lines = trimmed.split('\n');
    return t('message.pages.opsExecution.toolbar.scriptPreview', {
      type: scriptType.value === 'sh' ? t('message.pages.opsExecution.toolbar.scriptTypeSh') : t('message.pages.opsExecution.toolbar.scriptTypePy'),
      lines: lines.length,
    });
  }
});

const advancedOptionsCount = computed(() => {
  let count = 0;
  if (workingDirectory.value.trim()) count++;
  if (timeoutSeconds.value !== 300) count++;
  if (envVarsText.value.trim()) count++;
  if (loadProfile.value !== 'false') count++;
  if (mergeStreams.value) count++;
  if (privilegedExecution.value) count++;
  if (suUser.value.trim()) count++;
  if (execMode.value !== 'parallel') count++;
  if (concurrent.value !== 10) count++;
  if (failStrategy.value !== 'continue') count++;
  if (execMode.value === 'pilot') {
    if (pilotCount.value !== 2) count++;
    if (pilotSuccessRate.value !== 100) count++;
  }
  if (needAudit.value) count++;
  if (autoNotify.value) count++;
  if (approverIds.value.length > 0) count++;
  if (countersignIds.value.length > 0) count++;
  if (submitDesc.value.trim()) count++;
  return count;
});

const allTabsNotExecuting = computed(() =>
  executionTabs.value.every(tab => !tab.executing),
);

const hasAnyOutput = computed(() =>
  executionTabs.value.some(tab => tab.outputChunks.length > 0),
);

const dedupedHistoryItems = computed(() => {
  const seen = new Set<string>();
  const result: any[] = [];
  const targetType = props.mode === 'command' ? 'command' : 'script';
  for (const item of historyItems.value) {
    if (!item.command) continue;
    if (item.execution_type !== targetType) continue;
    if (seen.has(item.command)) continue;
    seen.add(item.command);
    result.push(item);
    if (result.length >= 50) break;
  }
  return result;
});

const parseEnvVars = (): Record<string, string> => {
  const env: Record<string, string> = {};
  if (!envVarsText.value.trim()) return env;
  
  envVarsText.value.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  return env;
};

const handleHostSelectConfirm = (hosts: Host[]) => {
  selectedHosts.value = hosts;
};

const removeHost = (host: Host) => {
  const index = selectedHosts.value.findIndex(h => h.id === host.id);
  if (index > -1) {
    selectedHosts.value.splice(index, 1);
  }
};

const clearAllHosts = () => {
  selectedHosts.value = [];
  ElMessage.success(t('message.pages.opsExecution.messages.clearHostsSuccess'));
};

const saveCurrentHostSet = async () => {
  if (selectedHosts.value.length === 0) {
    ElMessage.warning(t('message.pages.opsExecution.messages.selectHostFirst'));
    return;
  }
  try {
    const { value: name } = await ElMessageBox.prompt(
      t('message.pages.opsExecution.messages.saveHostSetPrompt'),
      t('message.pages.opsExecution.messages.saveHostSetTitle'),
      {
        confirmButtonText: t('message.pages.opsExecution.messages.saveHostSetConfirm'),
        cancelButtonText: t('message.pages.opsExecution.messages.saveHostSetCancel'),
        inputValidator: (val: string) => {
          if (!val || !val.trim()) return t('message.pages.opsExecution.messages.saveHostNameEmpty');
          if (savedHostSets.value.some(s => s.name === val.trim())) return t('message.pages.opsExecution.messages.saveHostNameExists');
          return true;
        },
      },
    );
    savedHostSets.value.push({
      name: name.trim(),
      hosts: [...selectedHosts.value],
    });
    ElMessage.success(t('message.pages.opsExecution.messages.saveHostSuccess'));
  } catch {
    // User cancelled
  }
};

const loadHostSet = (name: string) => {
  const set = savedHostSets.value.find(s => s.name === name);
  if (!set) return;
  selectedHosts.value = [...set.hosts];
  ElMessage.success(t('message.pages.opsExecution.messages.loadHostSetSuccess', { name, count: set.hosts.length }));
};

const copyAllOutput = () => {
  const allText: string[] = [];
  executionTabs.value.forEach(tab => {
    const xterm = xtermRefs.value[tab.host.id];
    if (xterm && xterm.getOutputText) {
      const text = xterm.getOutputText();
      if (text) {
        allText.push(`## ${tab.host.host_name} (${tab.host.host_ip})\n${text}`);
      }
    }
  });

  if (allText.length === 0) {
    ElMessage.warning(t('message.pages.opsExecution.messages.noOutputToCopy'));
    return;
  }

  const combinedText = allText.join('\n\n');
  navigator.clipboard.writeText(combinedText).then(() => {
    ElMessage.success(t('message.pages.opsExecution.messages.copySuccess'));
  }).catch(() => {
    ElMessage.error(t('message.pages.opsExecution.messages.copyFail'));
  });
};

const exportAllOutput = () => {
  const allText: string[] = [];
  executionTabs.value.forEach(tab => {
    const xterm = xtermRefs.value[tab.host.id];
    if (xterm && xterm.getOutputText) {
      const text = xterm.getOutputText();
      if (text) {
        allText.push(`====== ${tab.host.host_name} (${tab.host.host_ip}) ======\n${text}\n`);
      }
    }
  });

  if (allText.length === 0) {
    ElMessage.warning(t('message.pages.opsExecution.messages.noOutputToCopy'));
    return;
  }

  const combinedText = allText.join('\n');
  const blob = new Blob([combinedText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const elink = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  elink.download = `ops-output-${timestamp}.txt`;
  elink.style.display = 'none';
  elink.href = url;
  document.body.appendChild(elink);
  elink.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(elink);
  ElMessage.success(t('message.pages.opsExecution.messages.exportSuccess'));
};

const fillFromHistory = (row: any) => {
  if (!row.command) {
    ElMessage.warning(t('message.pages.opsExecution.messages.fillNoCommand'));
    return;
  }
  if (row.execution_type === 'command') {
    commandInput.value = row.command;
  } else {
    scriptContent.value = row.command;
  }

  if (typeof row.working_directory === 'string') workingDirectory.value = row.working_directory;
  if (typeof row.timeout_seconds === 'number') timeoutSeconds.value = row.timeout_seconds;
  if (typeof row.load_profile === 'string' || typeof row.load_profile === 'boolean') {
    loadProfile.value = String(row.load_profile);
  }
  if (typeof row.merge_streams === 'boolean') mergeStreams.value = row.merge_streams;
  if (typeof row.privileged === 'boolean') privilegedExecution.value = row.privileged;
  if (typeof row.su_user === 'string') suUser.value = row.su_user;
  if (typeof row.exec_mode === 'string') execMode.value = row.exec_mode as any;
  if (typeof row.concurrent === 'number') concurrent.value = row.concurrent;
  if (typeof row.fail_strategy === 'string') failStrategy.value = row.fail_strategy as any;
  if (typeof row.pilot_count === 'number') pilotCount.value = row.pilot_count;
  if (typeof row.pilot_success_rate === 'number') pilotSuccessRate.value = row.pilot_success_rate;
  if (typeof row.need_audit === 'boolean') needAudit.value = row.need_audit;
  if (typeof row.auto_notify === 'boolean') autoNotify.value = row.auto_notify;
  if (row.approval_mode === 'any' || row.approval_mode === 'all') approvalMode.value = row.approval_mode;
  if (Array.isArray(row.approver_ids)) approverIds.value = [...row.approver_ids];
  if (Array.isArray(row.countersign_ids)) countersignIds.value = [...row.countersign_ids];
  if (typeof row.submit_desc === 'string') submitDesc.value = row.submit_desc;

  showHistoryDialog.value = false;
  ElMessage.success(t('message.pages.opsExecution.messages.fillHistorySuccess'));
};

const onQuickHistoryVisible = (visible: boolean) => {
  if (!visible) return;
  if (historyItems.value.length === 0) {
    quickHistoryLoading.value = true;
    const originalPage = historyPage.value;
    const originalLimit = historyLimit.value;
    historyPage.value = 1;
    historyLimit.value = 50;
    loadHistory().finally(() => {
      historyPage.value = originalPage;
      historyLimit.value = originalLimit;
      quickHistoryLoading.value = false;
    });
  }
};

const onQuickHistorySelect = (command: string) => {
  if (!command) return;
  if (props.mode === 'command') {
    commandInput.value = command;
  } else {
    scriptContent.value = command;
  }
  ElMessage.success(t('message.pages.opsExecution.messages.fillQuickSuccess'));
};

const onHostHistoryVisible = (visible: boolean) => {
  if (!visible) return;
  if (historyItems.value.length === 0) {
    quickHistoryLoading.value = true;
    const originalPage = historyPage.value;
    const originalLimit = historyLimit.value;
    historyPage.value = 1;
    historyLimit.value = 50;
    loadHistory().finally(() => {
      historyPage.value = originalPage;
      historyLimit.value = originalLimit;
      quickHistoryLoading.value = false;
    });
  }
};

const onHostHistorySelect = (value: string) => {
  if (!value) return;

  if (value.startsWith('batch:')) {
    const batchId = value.substring(6);
    const batchOption = historyBatchOptions.value.find(b => b.batchId === batchId);
    if (!batchOption) return;

    const hostsToAdd: Host[] = [];
    historyItems.value.forEach(item => {
      if (item.batch_id === batchId && item.host_id && item.host_name) {
        const existingHost = historyHostOptions.value.find(h => h.id === item.host_id);
        const host: Host = existingHost ? { ...existingHost } : {
          id: item.host_id,
          host_uuid: item.host_uuid || '',
          host_name: item.host_name,
          host_ip: item.host_ip || '',
        };
        if (!selectedHosts.value.some(h => h.id === item.host_id)) {
          hostsToAdd.push(host);
        }
      }
    });

    if (hostsToAdd.length === 0) {
      ElMessage.warning(t('message.pages.opsExecution.messages.batchHostsAlreadyAdded'));
      return;
    }
    selectedHosts.value.push(...hostsToAdd);
    ElMessage.success(t('message.pages.opsExecution.messages.addHostCount', { count: hostsToAdd.length }));
  } else {
    const host = historyHostOptions.value.find(h => h.id === value);
    if (!host) return;
    if (selectedHosts.value.some(h => h.id === value)) {
      ElMessage.warning(t('message.pages.opsExecution.messages.addHostAlready'));
      return;
    }
    selectedHosts.value.push(host);
    ElMessage.success(t('message.pages.opsExecution.messages.addHostName', { name: host.host_name }));
  }

  selectedHostFromHistory.value = '';
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

const terminateExecution = async (tab: ExecutionTab) => {
  if (!tab.executionId) return;
  try {
    await ElMessageBox.confirm(
      t('message.pages.opsExecution.messages.terminateConfirmMsg'),
      t('message.pages.opsExecution.messages.terminateConfirmTitle'),
      {
        confirmButtonText: t('message.pages.opsExecution.messages.terminateConfirmBtn'),
        cancelButtonText: t('message.pages.opsExecution.messages.saveHostSetCancel'),
        type: 'warning',
      },
    );
  } catch {
    return;
  }
  await loadRunningExecutions(tab);
  const stillRunning = tab.runningList.some(r => r.execution_id === tab.executionId);
  if (!stillRunning) {
    ElMessage.info(t('message.pages.opsExecution.messages.terminateAlreadyEnded'));
    if (tab.executing) {
      tab.executing = false;
      checkAllFinished();
    }
    return;
  }
  try {
    const res = await terminateCommand({ host_id: tab.host.host_uuid, execution_id: tab.executionId });
    if (res.data?.code === 2000 || res.code === 2000) {
      tab.executing = false;
      tab.exitCode = -1;
      if (tab.ws) {
        tab.ws.close();
        tab.ws = null;
      }
      tab.outputChunks.push('\n' + t('message.pages.opsExecution.messages.commandTerminated') + '\n');
      ElMessage.success(t('message.pages.opsExecution.messages.terminateSuccess'));
      checkAllFinished();
    } else {
      ElMessage.error(res.msg || t('message.pages.opsExecution.messages.terminateFail'));
    }
  } catch (e: any) {
    ElMessage.error(t('message.pages.opsExecution.messages.terminateFailReason', { reason: e.message || t('message.pages.opsExecution.history.batchUnknown') }));
  }
};

const loadHistory = async () => {
  historyLoading.value = true;
  try {
    const params: any = {
      page: historyPage.value,
      limit: historyLimit.value,
    };
    const res = await executionHistory(params);
    const data = res.data?.data || res.data || {};
    const items = data.items ?? data.data ?? [];
    historyItems.value = Array.isArray(items) ? items : [];
  } catch (e: any) {
    ElMessage.error(t('message.pages.opsExecution.messages.loadHistoryFail', { reason: e.message || t('message.pages.opsExecution.history.batchUnknown') }));
  } finally {
    historyLoading.value = false;
  }
};

const historyHostOptions = computed(() => {
  const hostMap = new Map<string, Host>();
  historyItems.value.forEach(item => {
    if (item.host_id && item.host_name) {
      hostMap.set(item.host_id, {
        id: item.host_id,
        host_uuid: item.host_uuid || '',
        host_name: item.host_name,
        host_ip: item.host_ip || '',
      });
    }
  });
  return Array.from(hostMap.values());
});

interface BatchOption {
  batchId: string;
  command: string;
  hostCount: number;
  time: string;
}

const historyBatchOptions = computed<BatchOption[]>(() => {
  const batchMap = new Map<string, { command: string; hostIds: Set<string>; time: string }>();
  historyItems.value.forEach(item => {
    if (item.batch_id) {
      if (!batchMap.has(item.batch_id)) {
        batchMap.set(item.batch_id, {
          command: item.command || '-',
          hostIds: new Set(),
          time: item.started_at ? formatTimestamp(item.started_at) : '-',
        });
      }
      const entry = batchMap.get(item.batch_id)!;
      if (item.host_id) {
        entry.hostIds.add(item.host_id);
      }
    }
  });
  const result: BatchOption[] = [];
  batchMap.forEach((entry, batchId) => {
    result.push({
      batchId,
      command: entry.command,
      hostCount: entry.hostIds.size,
      time: entry.time,
    });
  });
  return result;
});

const MAX_DROPDOWN_ITEMS = 20;
const displayedBatchOptions = computed(() => historyBatchOptions.value.slice(0, MAX_DROPDOWN_ITEMS));
const displayedHostOptions = computed(() => historyHostOptions.value.slice(0, MAX_DROPDOWN_ITEMS));
const displayedHistoryCommands = computed(() => dedupedHistoryItems.value.slice(0, MAX_DROPDOWN_ITEMS));
const hasMoreBatchOptions = computed(() => historyBatchOptions.value.length > MAX_DROPDOWN_ITEMS);
const hasMoreHostOptions = computed(() => historyHostOptions.value.length > MAX_DROPDOWN_ITEMS);
const hasMoreHistoryCommands = computed(() => dedupedHistoryItems.value.length > MAX_DROPDOWN_ITEMS);

watch(showHistoryDialog, (val) => {
  if (val) {
    loadHistory();
  }
});

const handleTabRemove = (hostId: string) => {
  const hostIndex = selectedHosts.value.findIndex(host => host.id === hostId);
  if (hostIndex > -1) {
    selectedHosts.value.splice(hostIndex, 1);
  }
};

const handleTabClick = (tab: any) => {
  activeTab.value = tab.name;
};

const createExecutionTab = (host: Host): ExecutionTab => {
  return {
    host,
    executionId: null,
    exitCode: null,
    executing: false,
    ws: null,
    outputChunks: [],
    runningList: [],
    runningLoading: false,
    runningExpanded: false,
    sideActiveTab: 'running',
    uploadFileList: [],
    uploadRemotePath: '/tmp/',
    uploading: false,
    sidePanelCollapsed: false,
    fileList: [],
    fileListLoading: false,
    currentPath: '/',
    pathHistory: [],
    showUploadPanel: false,
    pendingApproval: false,
    approvalId: null,
    batchId: null,
    approvalMode: null,
    approvalCandidateApprovers: [],
  };
};

const closeAllWebSockets = () => {
  executionTabs.value.forEach(tab => {
    if (tab.ws) {
      tab.ws.close();
      tab.ws = null;
    }
  });
};

const runOneHost = async (
  host: Host,
  options?: {
    batch_id?: string;
    override_environment?: Record<string, string>;
    override_command?: string;
    override_script_type?: 'sh' | 'python';
    override_script_content?: string;
    override_exec_mode?: 'serial' | 'parallel' | 'pilot';
  },
): Promise<{ tab: any; exitCode: number | null; failed: boolean }> => {
  const tab = executionTabs.value.find(t => t.host.id === host.id);
  if (!tab) return { tab: null as any, exitCode: null, failed: true };

  let failed = false;

  try {
    const environment = { ...parseEnvVars(), ...(options?.override_environment || {}) };
    const mode = props.mode;
    const effectiveBatchId = options?.batch_id ?? batchId.value;
    const execModeEffective = options?.override_exec_mode ?? execMode.value;

    let response: any;

    if (mode === 'command') {
      response = await executeCommand({
        host_id: host.host_uuid || host.id,
        command: options?.override_command ?? commandInput.value,
        working_directory: workingDirectory.value || undefined,
        timeout_seconds: timeoutSeconds.value,
        environment: Object.keys(environment).length > 0 ? environment : undefined,
        use_shell: useShell.value,
        merge_streams: mergeStreams.value || undefined,
        load_profile: loadProfile.value !== 'false' ? loadProfile.value : undefined,
        privileged: privilegedExecution.value || undefined,
        su_user: suUser.value || undefined,
        su_password: suPassword.value || undefined,
        exec_mode: execModeEffective,
        concurrent: concurrent.value,
        fail_strategy: failStrategy.value,
        pilot_count: pilotCount.value,
        pilot_success_rate: pilotSuccessRate.value,
        need_audit: needAudit.value || undefined,
        auto_notify: autoNotify.value || undefined,
        approval_mode: approvalMode.value || undefined,
        approver_ids: approverIds.value.length > 0 ? approverIds.value : undefined,
        countersign_ids: countersignIds.value.length > 0 ? countersignIds.value : undefined,
        submit_desc: submitDesc.value.trim() || undefined,
        batch_id: effectiveBatchId,
      });
    } else {
      response = await executeScript({
        host_id: host.host_uuid || host.id,
        script_type: options?.override_script_type ?? scriptType.value,
        script_content: options?.override_script_content ?? scriptContent.value,
        working_directory: workingDirectory.value || undefined,
        timeout_seconds: timeoutSeconds.value,
        environment: Object.keys(environment).length > 0 ? environment : undefined,
        merge_streams: mergeStreams.value || undefined,
        load_profile: loadProfile.value !== 'false' ? loadProfile.value : undefined,
        privileged: privilegedExecution.value || undefined,
        su_user: suUser.value || undefined,
        su_password: suPassword.value || undefined,
        exec_mode: execModeEffective,
        concurrent: concurrent.value,
        fail_strategy: failStrategy.value,
        pilot_count: pilotCount.value,
        pilot_success_rate: pilotSuccessRate.value,
        need_audit: needAudit.value || undefined,
        auto_notify: autoNotify.value || undefined,
        approval_mode: approvalMode.value || undefined,
        approver_ids: approverIds.value.length > 0 ? approverIds.value : undefined,
        countersign_ids: countersignIds.value.length > 0 ? countersignIds.value : undefined,
        submit_desc: submitDesc.value.trim() || undefined,
        batch_id: effectiveBatchId,
      });
    }

    if (response.data?.pending_approval) {
      tab.executionId = response.data.execution_id || null;
      tab.executing = false;
      tab.exitCode = null;
      tab.pendingApproval = true;
      tab.approvalId = response.data.approval_id ?? null;
      tab.batchId = response.data.batch_id ?? null;
      tab.approvalMode = response.data.approval_mode ?? null;
      tab.approvalCandidateApprovers = response.data.candidate_approvers ?? [];
      const modeLabel = tab.approvalMode === 'all'
        ? t('message.pages.opsExecution.messages.modeAllLabel')
        : t('message.pages.opsExecution.messages.modeAnyLabel');
      const approverLine = tab.approvalCandidateApprovers?.length
        ? t('message.pages.opsExecution.messages.approverLabel', { names: tab.approvalCandidateApprovers.map((u: any) => u.name || u.username).join('、') })
        : t('message.pages.opsExecution.messages.defaultApprovalFlow');
      tab.outputChunks.push(
        t('message.pages.opsExecution.messages.pendingApproval') + '\n' +
        '   ' + t('message.pages.opsExecution.messages.approvalModeLabel', { mode: modeLabel }) + '\n' +
        '   ' + approverLine + '\n' +
        '   ' + t('message.pages.opsExecution.messages.approvalCheckPage') + '\n',
      );
      checkAllFinished();
      return { tab, exitCode: null, failed: false, pendingApproval: true };
    }

    const executionId = response.data?.execution_id;
    if (!executionId) {
      throw new Error(t('message.pages.opsExecution.messages.noExecutionId'));
    }

    tab.executionId = executionId;
    tab.pendingApproval = false;

    const wsUrl = getOpsWebSocketUrl(executionId);
    console.log('[execute] Tab WebSocket 连接:', wsUrl);
    tab.ws = new WebSocket(wsUrl);

    setTimeout(() => {
      loadRunningExecutions(tab);
    }, 500);

    tab.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.stdout) {
          tab.outputChunks.push(data.stdout);
        }
        if (data.stderr) {
          const processed = data.stderr.replace(
            /::TAURUS_ERROR::LINE=(\d+)::CMD=(.*?)::EXIT=(\d+)::/g,
            (_match: string, line: string, cmd: string, exitCode: string) =>
              '\n' + t('message.pages.opsExecution.messages.scriptErrorLine', { line, cmd, code: exitCode }) + '\n',
          );
          tab.outputChunks.push(processed);
        }
        if (data.error) {
          tab.outputChunks.push(t('message.pages.opsExecution.messages.stdoutError', { error: data.error }) + '\n');
        }
        if (data.finished !== undefined) {
          tab.exitCode = data.finished;
          tab.executing = false;
          if (tab.exitCode !== 0) failed = true;
          if (tab.ws) {
            tab.ws.close();
            tab.ws = null;
          }
          checkAllFinished();
        }
      } catch (e) {
        console.error('解析 WebSocket 消息失败:', e);
      }
    };

    tab.ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
      tab.outputChunks.push(t('message.pages.opsExecution.messages.wsError') + '\n');
      tab.executing = false;
      failed = true;
      checkAllFinished();
    };

    tab.ws.onclose = () => {
      if (tab.executing) {
        tab.executing = false;
        if (tab.exitCode === null) {
          tab.outputChunks.push(t('message.pages.opsExecution.messages.connectionClosed') + '\n');
        }
        failed = true;
        checkAllFinished();
      }
    };

    // Wait for tab to finish executing
    await new Promise<void>((resolve) => {
      const iv = trackInterval(() => {
        if (!tab.executing) {
          clearInterval(iv);
          pendingTimers.intervals.delete(iv);
          resolve();
        }
      }, 80);
    });

    return { tab, exitCode: tab.exitCode, failed: failed || tab.exitCode !== 0 };
  } catch (error: any) {
    tab.outputChunks.push(t('message.pages.opsExecution.messages.executeFail', { reason: error.message || t('message.pages.opsExecution.history.batchUnknown') }) + '\n');
    tab.executing = false;
    failed = true;
    checkAllFinished();
    return { tab, exitCode: null, failed: true };
  }
};

const rerunSingleTab = async (tab: any) => {
  if (!tab?.host) return;
  if (tab.executing) {
    ElMessage.warning(t('message.pages.opsExecution.messages.hostExecutingRetry'));
    return;
  }

  const host = tab.host;

  if (tab.ws) {
    try { tab.ws.close(); } catch {}
    tab.ws = null;
  }
  tab.executionId = null;
  tab.exitCode = null;
  tab.executing = true;
  tab.outputChunks.length = 0;
  tab.sideActiveTab = 'running';
  loadRunningExecutions(tab);

  executing.value = true;
  if (!batchId.value) {
    batchId.value = crypto.randomUUID();
  }
  try {
    await runOneHost(host);
  } finally {
    trackTimeout(() => {
      if (executionTabs.value.every(t => !t.executing)) {
        executing.value = false;
      }
    }, 300);
  }
};

const waitForTabFinished = (tab: any, timeoutMs = 3_600_000): Promise<{ exitCode: number | null; failed: boolean }> =>
  new Promise((resolve) => {
    const start = Date.now();
    const iv = trackInterval(() => {
      if (!tab.executing) {
        clearInterval(iv);
        pendingTimers.intervals.delete(iv);
        resolve({ exitCode: tab.exitCode, failed: tab.exitCode === null ? true : tab.exitCode !== 0 });
        return;
      }
      if (Date.now() - start > timeoutMs) {
        clearInterval(iv);
        pendingTimers.intervals.delete(iv);
        resolve({ exitCode: tab.exitCode, failed: true });
      }
    }, 80);
  });

const runInParallelWithLimit = async (
  hosts: Host[],
  limit: number,
  opts?: { failStrategy: 'stop' | 'continue' },
) => {
  const fstrat = opts?.failStrategy ?? failStrategy.value;
  const results: { host: Host; exitCode: number | null; failed: boolean }[] = [];
  let aborted = false;
  let i = 0;
  const pool: Promise<void>[] = [];

  const doneNext = async (host: Host) => {
    if (aborted && fstrat === 'stop') return;
    const { exitCode, failed } = await runOneHost(host);
    results.push({ host, exitCode, failed });
    if (failed && fstrat === 'stop') aborted = true;
  };

  while (i < hosts.length) {
    const host = hosts[i++];
    const promise = doneNext(host);
    pool.push(promise);
    promise.finally(() => {
      const idx = pool.indexOf(promise);
      if (idx >= 0) pool.splice(idx, 1);
    });
    if (pool.length >= limit || (aborted && fstrat === 'stop')) {
      await Promise.race([...pool, Promise.resolve()]);
      // Keep waiting until pool has capacity or abort
      while (pool.length >= limit && !(aborted && fstrat === 'stop')) {
        await new Promise(r => setTimeout(r, 30));
      }
    }
  }
  await Promise.all(pool);
  return results;
};

const execute = async () => {
  if (selectedHosts.value.length === 0) {
    ElMessage.warning(t('message.pages.opsExecution.messages.selectHostFirst'));
    return;
  }

  executing.value = true;
  batchId.value = crypto.randomUUID();

  const hostsToExecute = [...selectedHosts.value];

  executionTabs.value.forEach(tab => {
    if (tab.ws) {
      tab.ws.close();
      tab.ws = null;
    }
    tab.executionId = null;
    tab.exitCode = null;
    tab.executing = true;
    tab.outputChunks = [];
    loadRunningExecutions(tab);
  });

  try {
    const mode = execMode.value;

    if (mode === 'serial') {
      // Serial
      for (const host of hostsToExecute) {
        const res = await runOneHost(host);
        if (res.failed && failStrategy.value === 'stop') break;
      }
    } else if (mode === 'parallel') {
      // Parallel + concurrency limit + fail strategy
      await runInParallelWithLimit(hostsToExecute, Math.max(1, concurrent.value), { failStrategy: failStrategy.value });
    } else if (mode === 'pilot') {
      // Gradual rollout
      const pilotTotal = Math.min(Math.max(1, pilotCount.value), hostsToExecute.length);
      const pilotHosts = hostsToExecute.slice(0, pilotTotal);
      const restHosts = hostsToExecute.slice(pilotTotal);
      const pilotResults = await runInParallelWithLimit(pilotHosts, Math.max(1, concurrent.value), { failStrategy: failStrategy.value });
      const done = pilotResults.filter(r => !r.failed).length;
      const rate = pilotResults.length === 0 ? 0 : Math.round((done / pilotResults.length) * 100);
      if (rate < pilotSuccessRate.value) {
        ElMessage.warning(t('message.pages.opsExecution.messages.pilotFail', { rate, threshold: pilotSuccessRate.value, count: restHosts.length }));
        // Mark remaining tabs as skipped
        restHosts.forEach(h => {
          const tab = executionTabs.value.find(t => t.host.id === h.id);
          if (tab) {
            tab.executing = false;
            tab.outputChunks.push(t('message.pages.opsExecution.messages.skipByPilot') + '\n');
          }
        });
      } else {
        ElMessage.success(t('message.pages.opsExecution.messages.pilotPass', { rate, count: restHosts.length }));
        if (restHosts.length > 0) {
          await runInParallelWithLimit(restHosts, Math.max(1, concurrent.value), { failStrategy: failStrategy.value });
        }
      }
    }
  } finally {
    // Final fallback: set executing to false (in case some WebSocket did not trigger finished)
    setTimeout(() => {
      if (executionTabs.value.every(t => !t.executing)) {
        executing.value = false;
      }
    }, 300);
  }
};

const checkAllFinished = () => {
  const allFinished = executionTabs.value.every(tab => !tab.executing);
  if (allFinished) {
    executing.value = false;
  }
};

const terminateAllTabs = async () => {
  const running = executionTabs.value.filter(tab => tab.executing);
  if (running.length === 0) return;

  try {
    await ElMessageBox.confirm(
      t('message.pages.opsExecution.messages.terminateAllConfirm', { count: running.length }),
      t('message.pages.opsExecution.messages.terminateConfirmTitle'),
      {
        confirmButtonText: t('message.pages.opsExecution.messages.terminateConfirmBtn'),
        cancelButtonText: t('message.pages.opsExecution.messages.saveHostSetCancel'),
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  for (const tab of running) {
    if (tab.executionId) {
      try {
        await terminateCommand({ host_id: tab.host.host_uuid, execution_id: tab.executionId });
        tab.executing = false;
        tab.exitCode = -1;
        if (tab.ws) {
          tab.ws.close();
          tab.ws = null;
        }
        tab.outputChunks.push('\n' + t('message.pages.opsExecution.messages.commandTerminated') + '\n');
      } catch (e: any) {
        tab.outputChunks.push('\n' + t('message.pages.opsExecution.messages.terminateFailReason', { reason: e.message || t('message.pages.opsExecution.history.batchUnknown') }) + '\n');
      }
    }
  }
  ElMessage.success(t('message.pages.opsExecution.messages.terminateAllSubmit'));
  checkAllFinished();
};

const loadRunningExecutions = async (tab: ExecutionTab) => {
  tab.runningLoading = true;
  try {
    const res = await listExecutions({ host_id: tab.host.host_uuid });
    const data = res.data?.data || res.data || {};
    tab.runningList = Array.isArray(data) ? data : [];
  } catch (e: any) {
    console.error('加载正在执行的任务失败:', e);
  } finally {
    tab.runningLoading = false;
  }
};

const terminateRunningExecution = async (tab: ExecutionTab, row: RunningExecution) => {
  if (!row.execution_id) return;
  try {
    await ElMessageBox.confirm(
      t('message.pages.opsExecution.messages.terminateConfirmMsg'),
      t('message.pages.opsExecution.messages.terminateConfirmTitle'),
      {
        confirmButtonText: t('message.pages.opsExecution.messages.terminateConfirmBtn'),
        cancelButtonText: t('message.pages.opsExecution.messages.saveHostSetCancel'),
        type: 'warning',
      },
    );
  } catch {
    return;
  }
  await loadRunningExecutions(tab);
  const stillRunning = tab.runningList.some(r => r.execution_id === row.execution_id);
  if (!stillRunning) {
    ElMessage.info(t('message.pages.opsExecution.messages.terminateAlreadyEnded'));
    return;
  }
  try {
    const res = await terminateCommand({ host_id: tab.host.host_uuid, execution_id: row.execution_id });
    if (res.data?.code === 2000 || res.code === 2000) {
      tab.runningList = tab.runningList.filter(r => r.execution_id !== row.execution_id);
      ElMessage.success(t('message.pages.opsExecution.messages.terminateAllSubmit'));
    } else {
      ElMessage.error(res.msg || t('message.pages.opsExecution.messages.terminateFail'));
    }
  } catch (e: any) {
    ElMessage.error(t('message.pages.opsExecution.messages.terminateFailReason', { reason: e.message || t('message.pages.opsExecution.history.batchUnknown') }));
  }
};

const handleFileSelect = (tab: ExecutionTab, file: any) => {
  if (file?.raw) {
    tab.uploadFileList.push({ name: file.name, raw: file.raw });
  }
};

const handleFileTabChange = (tab: ExecutionTab, name: string) => {
  if (name === 'upload' && tab.fileList.length === 0 && !tab.fileListLoading) {
    loadFileList(tab);
  } else if (name === 'running' && !tab.runningLoading) {
    loadRunningExecutions(tab);
  }
};

const loadFileList = async (tab: ExecutionTab) => {
  if (!tab.currentPath) {
    ElMessage.warning(t('message.pages.opsExecution.messages.filePathRequired'));
    return;
  }
  tab.fileListLoading = true;
  try {
    const res = await listFiles({
      host_id: tab.host.host_uuid,
      path: tab.currentPath,
    });
    tab.fileList = Array.isArray(res.data?.entries) ? res.data.entries : [];
  } catch (e: any) {
    ElMessage.error(t('message.pages.opsExecution.messages.loadFileListFail', { reason: e.message || t('message.pages.opsExecution.history.batchUnknown') }));
  } finally {
    tab.fileListLoading = false;
  }
};

const enterDirectory = (tab: ExecutionTab, dirName: string) => {
  const basePath = tab.currentPath.endsWith('/') ? tab.currentPath : tab.currentPath + '/';
  tab.currentPath = basePath + dirName;
  tab.pathHistory.push(tab.currentPath);
  loadFileList(tab);
};

const goToParentDirectory = (tab: ExecutionTab) => {
  if (!tab.currentPath || tab.currentPath === '/') return;
  const path = tab.currentPath.endsWith('/')
    ? tab.currentPath.slice(0, -1)
    : tab.currentPath;
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash <= 0) {
    tab.currentPath = '/';
  } else {
    tab.currentPath = path.slice(0, lastSlash + 1);
  }
  loadFileList(tab);
};

const downloadFileItem = async (tab: ExecutionTab, item: FileEntry) => {
  const basePath = tab.currentPath.endsWith('/') ? tab.currentPath : tab.currentPath + '/';
  const fullPath = basePath + item.name;
  try {
    const res = await downloadFile({
      host_id: tab.host.host_uuid,
      path: fullPath,
    });
    const blob = res.data || res;
    if (!(blob instanceof Blob)) {
      ElMessage.error(t('message.pages.opsExecution.messages.downloadFail'));
      return;
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    ElMessage.success(t('message.pages.opsExecution.messages.downloadStart', { name: item.name }));
  } catch (e: any) {
    ElMessage.error(t('message.pages.opsExecution.messages.downloadFailReason', { reason: e.message || t('message.pages.opsExecution.history.batchUnknown') }));
  }
};

const uploadFiles = async (tab: ExecutionTab) => {
  if (tab.uploadFileList.length === 0) {
    ElMessage.warning(t('message.pages.opsExecution.messages.uploadNoFiles'));
    return;
  }
  const targetPath = tab.currentPath || tab.uploadRemotePath;
  if (!targetPath.trim()) {
    ElMessage.warning(t('message.pages.opsExecution.messages.uploadRemotePath'));
    return;
  }
  tab.uploading = true;
  try {
    for (const file of tab.uploadFileList) {
      const formData = new FormData();
      formData.append('host_id', tab.host.host_uuid);
      formData.append('file_path', targetPath.endsWith('/')
        ? targetPath + file.name
        : targetPath + '/' + file.name);
      formData.append('file', file.raw, file.name);
      await uploadFile(formData);
    }
    ElMessage.success(t('message.pages.opsExecution.messages.uploadSuccess', { count: tab.uploadFileList.length }));
    tab.uploadFileList = [];
    tab.showUploadPanel = false;
    loadFileList(tab);
  } catch (e: any) {
    ElMessage.error(t('message.pages.opsExecution.messages.uploadFail', { reason: e.message || t('message.pages.opsExecution.history.batchUnknown') }));
  } finally {
    tab.uploading = false;
  }
};

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

// Track intervals/timeouts created during component lifecycle, clean up on unmount to prevent callbacks from firing after unmount
const pendingTimers = { intervals: new Set<number>(), timeouts: new Set<number>() };
const trackInterval = (fn: () => void, ms: number): number => {
  const id = setInterval(fn, ms) as unknown as number;
  pendingTimers.intervals.add(id);
  return id;
};
const trackTimeout = (fn: () => void, ms: number): number => {
  const id = setTimeout(() => {
    pendingTimers.timeouts.delete(id);
    fn();
  }, ms) as unknown as number;
  pendingTimers.timeouts.add(id);
  return id;
};

onUnmounted(() => {
  closeAllWebSockets();
  pendingTimers.intervals.forEach((id) => clearInterval(id));
  pendingTimers.intervals.clear();
  pendingTimers.timeouts.forEach((id) => clearTimeout(id));
  pendingTimers.timeouts.clear();
});
</script>

<style scoped lang="scss">
.executor-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #f5f7fa;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: row;
  min-height: 0;
  gap: 0;
  transition: all 0.25s ease;
}

.output-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  margin: 12px 12px 12px 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: margin 0.25s ease;

  & > * {
    width: 100%;
  }
}

.output-panel .no-output {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>