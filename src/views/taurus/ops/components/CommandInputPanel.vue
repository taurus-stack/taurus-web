<template>
  <div class="config-card input-card">
    <div class="card-header">
      <span class="card-title">
        <span class="title-icon title-icon-success">
          <el-icon><Edit /></el-icon>
        </span>
        {{ mode === 'command' ? t('message.pages.opsExecution.commandInput.titleCommand') : t('message.pages.opsExecution.commandInput.titleScript') }}
      </span>
      <el-select
        :model-value="selectedQuickHistory"
        @update:model-value="$emit('update:selectedQuickHistory', $event)"
        :placeholder="t('message.pages.opsExecution.commandInput.historyFill')"
        size="small"
        filterable
        clearable
        :loading="quickHistoryLoading"
        :popper-class="'quick-history-popper'"
        class="history-fill-select"
        @visible-change="$emit('quick-history-visible', $event)"
        @change="$emit('quick-history-select', $event)"
      >
        <el-option
          v-for="item in displayedHistoryCommands"
          :key="item.command"
          :label="item.command.length > 30 ? item.command.substring(0, 30) + '...' : item.command"
          :value="item.command"
        >
          <div class="quick-history-option">
            <el-tag
              size="small"
              :type="item.execution_type === 'command' ? 'primary' : 'info'"
              class="quick-history-tag"
            >
              {{ item.execution_type === 'command' ? t('message.pages.opsExecution.commandInput.typeCommand') : t('message.pages.opsExecution.commandInput.typeScript') }}
            </el-tag>
            <span class="quick-history-text" :title="item.command">{{ item.command }}</span>
            <span class="quick-history-time">{{ item.started_at ? formatTimestamp(item.started_at) : '-' }}</span>
          </div>
        </el-option>
        <el-option v-if="hasMoreHistoryCommands" value="" disabled>
          <div class="quick-history-more">{{ t('message.pages.opsExecution.commandInput.historyMore', { count: dedupedHistoryItems.length - maxDropdownItems }) }}</div>
        </el-option>
        <template #empty>
          <div class="quick-history-empty">
            <el-empty :description="t('message.pages.opsExecution.commandInput.noHistory')" :image-size="40" />
          </div>
        </template>
      </el-select>
    </div>
    <div class="card-body">
      <div v-if="mode === 'command'" class="command-input">
        <el-input
          :model-value="commandInput"
          @update:model-value="$emit('update:commandInput', $event)"
          type="textarea"
          :rows="4"
          :placeholder="t('message.pages.opsExecution.commandInput.commandPlaceholder')"
          resize="vertical"
          clearable
        />
      </div>
      <div v-else class="script-input">
        <div class="script-type-selector">
          <el-radio-group :model-value="scriptType" @update:model-value="$emit('update:scriptType', $event)" size="small">
            <el-radio-button value="sh">Shell</el-radio-button>
            <el-radio-button value="python">Python</el-radio-button>
          </el-radio-group>
        </div>
        <el-input
          :model-value="scriptContent"
          @update:model-value="$emit('update:scriptContent', $event)"
          type="textarea"
          :rows="6"
          :placeholder="scriptPlaceholder"
          resize="vertical"
          clearable
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Edit } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { formatTimestamp } from './historyUtils';

const { t } = useI18n();

const props = defineProps<{
  mode: 'command' | 'script';
  commandInput: string;
  scriptType: 'sh' | 'python';
  scriptContent: string;
  selectedQuickHistory: string;
  quickHistoryLoading: boolean;
  displayedHistoryCommands: any[];
  dedupedHistoryItems: any[];
  hasMoreHistoryCommands: boolean;
  maxDropdownItems: number;
}>();

const scriptPlaceholder = computed(() =>
  props.scriptType === 'sh'
    ? t('message.pages.opsExecution.commandInput.shPlaceholder')
    : t('message.pages.opsExecution.commandInput.pyPlaceholder'),
);

defineEmits<{
  'quick-history-visible': [visible: boolean];
  'quick-history-select': [command: string];
  'update:selectedQuickHistory': [value: string];
  'update:commandInput': [value: string];
  'update:scriptType': [value: 'sh' | 'python'];
  'update:scriptContent': [value: string];
}>();
</script>

<style scoped lang="scss">
.config-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #e4e7ed;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f2f5;

  .card-title {
    font-weight: 600;
    font-size: 14px;
    color: #303133;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.card-body {
  padding: 14px 16px;
}

.title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;

  .el-icon {
    font-size: 14px;
  }

  &.title-icon-success {
    background: #f0f9eb;
    color: #67c23a;
  }
}

.config-card.input-card {
  .card-header {
    .history-fill-select {
      width: 180px;
    }
  }

  .script-type-selector {
    margin-bottom: 10px;
  }

  :deep(.el-textarea__inner) {
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
    max-height: 200px;
    overflow-y: auto;
  }
}
</style>