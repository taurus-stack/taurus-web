<template>
  <div class="config-drawer" :class="{ collapsed }">
    <div v-if="collapsed" class="expand-handle" @click="$emit('update:collapsed', false)">
      <el-icon class="expand-icon"><ArrowRight /></el-icon>
      <span class="vertical-text">{{ t('message.pages.opsExecution.drawer.expanded') }}</span>
    </div>

    <div class="drawer-content">
      <HostSelectorPanel
        ref="hostRef"
        :selected-hosts="selectedHosts"
        :selected-host-from-history="selectedHostFromHistory"
        :quick-history-loading="quickHistoryLoading"
        :history-batch-options="historyBatchOptions"
        :history-host-options="historyHostOptions"
        :displayed-batch-options="displayedBatchOptions"
        :displayed-host-options="displayedHostOptions"
        :has-more-batch-options="hasMoreBatchOptions"
        :has-more-host-options="hasMoreHostOptions"
        :max-dropdown-items="maxDropdownItems"
        :saved-host-sets="savedHostSets"
        @show-selector="$emit('show-selector')"
        @remove-host="$emit('remove-host', $event)"
        @clear-hosts="$emit('clear-hosts')"
        @save-host-set="$emit('save-host-set')"
        @load-host-set="$emit('load-host-set', $event)"
        @host-history-visible="$emit('host-history-visible', $event)"
        @host-history-select="$emit('host-history-select', $event)"
      />

      <CommandInputPanel
        ref="commandRef"
        :mode="mode"
        :command-input="commandInput"
        :script-type="scriptType"
        :script-content="scriptContent"
        :selected-quick-history="selectedQuickHistory"
        :quick-history-loading="quickHistoryLoading"
        :displayed-history-commands="displayedHistoryCommands"
        :deduped-history-items="dedupedHistoryItems"
        :has-more-history-commands="hasMoreHistoryCommands"
        :max-dropdown-items="maxDropdownItems"
        @quick-history-visible="$emit('quick-history-visible', $event)"
        @quick-history-select="$emit('quick-history-select', $event)"
        @update:selected-quick-history="$emit('update:selected-quick-history', $event)"
        @update:command-input="$emit('update:command-input', $event)"
        @update:script-type="$emit('update:script-type', $event)"
        @update:script-content="$emit('update:script-content', $event)"
      />

      <AdvancedOptionsPanel
        ref="advancedRef"
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
        @update:working-directory="$emit('update:working-directory', $event)"
        @update:timeout-seconds="$emit('update:timeout-seconds', $event)"
        @update:env-vars-text="$emit('update:env-vars-text', $event)"
        @update:load-profile="$emit('update:load-profile', $event)"
        @update:merge-streams="$emit('update:merge-streams', $event)"
        @update:privileged-execution="$emit('update:privileged-execution', $event)"
        @update:su-user="$emit('update:su-user', $event)"
        @update:su-password="$emit('update:su-password', $event)"
        @update:exec-mode="$emit('update:exec-mode', $event)"
        @update:concurrent="$emit('update:concurrent', $event)"
        @update:fail-strategy="$emit('update:fail-strategy', $event)"
        @update:pilot-count="$emit('update:pilot-count', $event)"
        @update:pilot-success-rate="$emit('update:pilot-success-rate', $event)"
        @update:need-audit="$emit('update:need-audit', $event)"
        @update:auto-notify="$emit('update:auto-notify', $event)"
        @update:approval-mode="$emit('update:approval-mode', $event)"
        @update:approver-ids="$emit('update:approver-ids', $event)"
        @update:countersign-ids="$emit('update:countersign-ids', $event)"
        @update:submit-desc="$emit('update:submit-desc', $event)"
      />

      <!-- Drawer bottom action area -->
      <div class="drawer-footer">
        <div class="footer-action-row">

           <el-button
            type="primary"
            :loading="executing"
            :disabled="!canExecute"
            size="default"
            @click="$emit('execute')"
            class="footer-run-btn"
          >
            <el-icon><VideoPlay /></el-icon>
            <span>{{ executing ? t('message.pages.opsExecution.drawer.running') : t('message.pages.opsExecution.drawer.run') }}</span>
          </el-button>
          <el-button
            type="danger"
            :disabled="allTabsNotExecuting"
            size="default"
            @click="$emit('terminate-all')"
          >
            <el-icon><CloseBold /></el-icon>
            <span>{{ t('message.pages.opsExecution.drawer.terminate') }}</span>
          </el-button>
                    <el-button @click="$emit('show-history')" size="default">
            <el-icon><Clock /></el-icon>
            <span>{{ t('message.pages.opsExecution.drawer.history') }}</span>
          </el-button>
         
        </div>
        <div class="collapse-trigger" @click="$emit('update:collapsed', true)">
          <el-icon class="collapse-icon"><ArrowUp /></el-icon>
          <span class="collapse-text">{{ t('message.pages.opsExecution.drawer.collapsed') }}</span>
          <el-icon class="collapse-icon"><ArrowUp /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { ArrowUp, ArrowRight, Clock, CloseBold, VideoPlay } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import HostSelectorPanel from './HostSelectorPanel.vue';
import CommandInputPanel from './CommandInputPanel.vue';
import AdvancedOptionsPanel from './AdvancedOptionsPanel.vue';

const { t } = useI18n();

interface Host {
  id: string;
  host_uuid: string;
  host_name: string;
  host_ip: string;
  host_type?: string;
  online_status?: number;
  remark?: string;
}

interface BatchOption {
  batchId: string;
  command: string;
  hostCount: number;
  time: string;
}

const props = defineProps<{
  collapsed: boolean;
  focusSection: 'host' | 'command' | 'advanced' | 'strategy' | null;
  executing: boolean;
  canExecute: boolean;
  allTabsNotExecuting: boolean;
  // HostSelectorPanel props
  selectedHosts: Host[];
  selectedHostFromHistory: string;
  quickHistoryLoading: boolean;
  historyBatchOptions: BatchOption[];
  historyHostOptions: Host[];
  displayedBatchOptions: BatchOption[];
  displayedHostOptions: Host[];
  hasMoreBatchOptions: boolean;
  hasMoreHostOptions: boolean;
  maxDropdownItems: number;
  savedHostSets: Array<{ name: string; hosts: Host[] }>;
  // CommandInputPanel props
  mode: 'command' | 'script';
  commandInput: string;
  scriptType: 'sh' | 'python';
  scriptContent: string;
  selectedQuickHistory: string;
  displayedHistoryCommands: any[];
  dedupedHistoryItems: any[];
  hasMoreHistoryCommands: boolean;
  // AdvancedOptionsPanel props
  workingDirectory: string;
  timeoutSeconds: number;
  envVarsText: string;
  loadProfile: string;
  mergeStreams: boolean;
  privilegedExecution: boolean;
  suUser: string;
  suPassword: string;
  execMode: 'serial' | 'parallel' | 'pilot';
  concurrent: number;
  failStrategy: 'stop' | 'continue';
  pilotCount: number;
  pilotSuccessRate: number;
  needAudit: boolean;
  autoNotify: boolean;
  approvalMode?: 'any' | 'all';
  approverIds?: number[];
  countersignIds?: number[];
  submitDesc?: string;
}>();

defineEmits<{
  'update:collapsed': [value: boolean];
  execute: [];
  'terminate-all': [];
  'show-history': [];
  // HostSelectorPanel emits
  'show-selector': [];
  'remove-host': [host: Host];
  'clear-hosts': [];
  'save-host-set': [];
  'load-host-set': [name: string];
  'host-history-visible': [visible: boolean];
  'host-history-select': [value: string];
  // CommandInputPanel emits
  'quick-history-visible': [visible: boolean];
  'quick-history-select': [command: string];
  'update:selected-quick-history': [value: string];
  'update:command-input': [value: string];
  'update:script-type': [value: 'sh' | 'python'];
  'update:script-content': [value: string];
  // AdvancedOptionsPanel emits
  'update:working-directory': [value: string];
  'update:timeout-seconds': [value: number];
  'update:env-vars-text': [value: string];
  'update:load-profile': [value: string];
  'update:merge-streams': [value: boolean];
  'update:privileged-execution': [value: boolean];
  'update:su-user': [value: string];
  'update:su-password': [value: string];
  'update:exec-mode': [value: 'serial' | 'parallel' | 'pilot'];
  'update:concurrent': [value: number];
  'update:fail-strategy': [value: 'stop' | 'continue'];
  'update:pilot-count': [value: number];
  'update:pilot-success-rate': [value: number];
  'update:need-audit': [value: boolean];
  'update:auto-notify': [value: boolean];
  'update:approval-mode': [value: 'any' | 'all'];
  'update:approver-ids': [value: number[]];
  'update:countersign-ids': [value: number[]];
  'update:submit-desc': [value: string];
}>();

const hostRef = ref<InstanceType<typeof HostSelectorPanel> | null>(null);
const commandRef = ref<InstanceType<typeof CommandInputPanel> | null>(null);
const advancedRef = ref<InstanceType<typeof AdvancedOptionsPanel> | null>(null);

// Auto-scroll to the relevant section when focusSection changes
watch(
  () => props.focusSection,
  async (section) => {
    if (!section) return;
    await nextTick();
    const elMap = {
      host: hostRef.value?.$el as HTMLElement | undefined,
      command: commandRef.value?.$el as HTMLElement | undefined,
      advanced: advancedRef.value?.$el as HTMLElement | undefined,
    };
    const target = elMap[section];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },
);
</script>

<style scoped lang="scss">
.config-drawer {
  flex-shrink: 0;
  width: 480px;
  height: calc(100% - 24px);
  margin: 12px 8px 12px 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  display: flex;
  transition: width 0.25s ease;
  overflow: hidden;
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

  &.collapsed {
    width: 28px;
    margin: 12px 8px 12px 12px;

    .drawer-content {
      display: none;
    }
  }
}

.drawer-content {
  width: 480px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  background: #fff;
  box-sizing: border-box;
  flex-shrink: 0;
  transition: opacity 0.2s ease;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;

    &:hover {
      background: #c0c4cc;
    }
  }
}

.drawer-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 0 6px;
  margin-top: auto;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

.footer-action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 4px 4px 6px;
  box-sizing: border-box;

  .el-button {
    flex: 1;
  }

  .footer-run-btn {
    flex: 1.4;
    font-weight: 600;
  }
}

.collapse-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 16px;
  cursor: pointer;
  color: #909399;
  border-radius: 16px;
  transition: all 0.2s;
  font-size: 12px;
  user-select: none;

  &:hover {
    background: #ecf5ff;
    color: #409eff;
  }

  &:active {
    transform: scale(0.96);
  }

  .collapse-icon {
    font-size: 12px;
  }

  .collapse-text {
    font-size: 12px;
    letter-spacing: 0.5px;
  }
}

.expand-handle {
  width: 28px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  color: #909399;
  transition: all 0.2s;
  background: #fff;

  &:hover {
    background: #ecf5ff;
    color: #409eff;
  }

  .expand-icon {
    font-size: 14px;
  }

  .vertical-text {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: 11px;
    letter-spacing: 1px;
  }
}
</style>