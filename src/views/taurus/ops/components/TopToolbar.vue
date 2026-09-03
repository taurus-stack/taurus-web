<template>
  <div class="top-toolbar">
    <div class="toolbar-section left-section">
      <!-- Host badge -->
      <div
        class="status-chip host-chip"
        :class="{ 'is-empty': selectedHostsCount === 0 }"
        @click="$emit('focus-section', 'host')"
      >
        <el-icon class="chip-icon"><Monitor /></el-icon>
        <span class="chip-label">{{ t('message.pages.opsExecution.toolbar.host') }}</span>
        <span class="chip-value">{{ selectedHostsCount === 0 ? t('message.pages.opsExecution.toolbar.noHostSelected') : t('message.pages.opsExecution.toolbar.hostCount', { count: selectedHostsCount }) }}</span>
      </div>

      <!-- Command/script preview -->
      <div
        class="status-chip preview-chip"
        :class="{ 'is-empty': !hasCommandContent }"
        @click="$emit('focus-section', 'command')"
      >
        <el-icon class="chip-icon">
          <Edit v-if="mode === 'command'" />
          <Document v-else />
        </el-icon>
        <span class="chip-label">{{ mode === 'command' ? t('message.pages.opsExecution.toolbar.command') : t('message.pages.opsExecution.toolbar.script') }}</span>
        <span class="chip-value preview-value" :title="commandPreview">{{ commandPreview }}</span>
      </div>

      <!-- Advanced options button -->
      <div
        class="status-chip advanced-chip"
        :class="{ 'has-options': advancedOptionsCount > 0 }"
        @click="$emit('focus-section', 'advanced')"
      >
        <el-icon class="chip-icon"><Setting /></el-icon>
        <span class="chip-label">{{ t('message.pages.opsExecution.toolbar.advanced') }}</span>
        <span v-if="advancedOptionsCount > 0" class="chip-badge">{{ advancedOptionsCount }}</span>
      </div>
    </div>

    <!-- <div class="toolbar-section right-section">
      <el-button @click="$emit('export-output')" :disabled="!hasAnyOutput">
        <el-icon><Download /></el-icon>
        <span>{{ t('export') }}</span>
      </el-button>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Monitor, Edit, Document, Setting, Clock, CopyDocument, Download,
  CloseBold, VideoPlay,
} from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const props = defineProps<{
  mode: 'command' | 'script';
  selectedHostsCount: number;
  commandPreview: string;
  advancedOptionsCount: number;
  executing: boolean;
  canExecute: boolean;
  allTabsNotExecuting: boolean;
  hasAnyOutput: boolean;
}>();

// Check whether command/script preview is empty (align with parent commandPreview placeholder, both use t())
const hasCommandContent = computed(() => {
  const preview = props.commandPreview;
  if (!preview) return false;
  if (props.mode === 'command') {
    return preview !== t('message.pages.opsExecution.toolbar.promptCommand');
  }
  // Script mode: placeholder varies with scriptType, compare against both
  return preview !== t('message.pages.opsExecution.toolbar.promptScriptSh')
      && preview !== t('message.pages.opsExecution.toolbar.promptScriptPy');
});

defineEmits<{
  'focus-section': [section: 'host' | 'command' | 'advanced'];
  execute: [];
  'terminate-all': [];
  'copy-output': [];
  'export-output': [];
  'show-history': [];
}>();
</script>

<style scoped lang="scss">
.top-toolbar {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
  gap: 8px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;

  &.right-section {
    margin-left: auto;
  }
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  max-width: 280px;
  min-height: 32px;
  box-sizing: border-box;

  &:hover {
    background: #ecf5ff;
    border-color: #409eff;
  }

  &.is-empty {
    color: #909399;

    .chip-value {
      color: #c0c4cc;
    }
  }

  &.has-options {
    background: #fdf6ec;
    border-color: #e6a23c;
    color: #e6a23c;

    .chip-icon {
      color: #e6a23c;
    }
  }

  .chip-icon {
    font-size: 14px;
    color: #409eff;
    flex-shrink: 0;
  }

  .chip-label {
    font-size: 12px;
    color: #909399;
    flex-shrink: 0;
  }

  .chip-value {
    font-size: 13px;
    color: #303133;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .preview-value {
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    font-weight: 400;
  }

  .chip-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: #e6a23c;
    color: #fff;
    font-size: 11px;
    line-height: 1;
    border-radius: 8px;
    flex-shrink: 0;
  }
}

.host-chip {
  .chip-icon {
    color: #409eff;
  }
}

.preview-chip {
  max-width: 360px;
}

.advanced-chip {
  padding: 6px 12px;
}

.toolbar-divider {
  margin: 0 4px;
  height: 24px;
}

.right-section {
  :deep(.el-button) {
    height: 32px;
    padding: 0 12px;

    .el-icon + span {
      margin-left: 4px;
    }
  }
}

.run-btn {
  min-width: 96px;
  height: 36px !important;
  font-weight: 600;
  font-size: 14px;

  :deep(.el-icon) {
    font-size: 16px;
  }
}
</style>