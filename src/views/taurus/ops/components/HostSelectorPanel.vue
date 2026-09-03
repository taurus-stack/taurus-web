<template>
  <div class="config-card host-card">
    <div class="card-header">
      <span class="card-title">
        <span class="title-icon title-icon-primary">
          <el-icon><Monitor /></el-icon>
        </span>
        {{ t('message.pages.opsExecution.hostSelector.title') }}
      </span>
      <span v-if="selectedHosts.length > 0" class="card-badge">{{ selectedHosts.length }}</span>
    </div>
    <div class="card-body">
      <div class="host-quick-actions">
        <el-select
          :model-value="selectedHostFromHistory"
          @update:model-value="$emit('host-history-select', $event)"
          :placeholder="t('message.pages.opsExecution.hostSelector.placeholderFromHistory')"
          size="small"
          filterable
          clearable
          :loading="quickHistoryLoading"
          class="host-history-select"
          @visible-change="(val: boolean) => $emit('host-history-visible', val)"
        >
          <el-option-group :label="t('message.pages.opsExecution.hostSelector.batchGroup')">
            <el-option
              v-for="batch in displayedBatchOptions"
              :key="`batch:${batch.batchId}`"
              :label="`${batch.command.substring(0, 20)}... (${t('message.pages.opsExecution.hostSelector.batchCount', { count: batch.hostCount })})`"
              :value="`batch:${batch.batchId}`"
            >
              <div class="quick-history-option">
                <el-tag size="small" type="success" class="quick-history-tag">{{ t('message.pages.opsExecution.hostSelector.batchLabel') }}</el-tag>
                <span class="quick-history-text">
                  {{ batch.command.substring(0, 20) }}... ({{ t('message.pages.opsExecution.hostSelector.batchCount', { count: batch.hostCount }) }}) · {{ batch.time }}
                </span>
              </div>
            </el-option>
            <el-option v-if="hasMoreBatchOptions" value="" disabled>
              <div class="quick-history-more">{{ t('message.pages.opsExecution.hostSelector.batchCountSuffix', { count: historyBatchOptions.length - maxDropdownItems }) }}</div>
            </el-option>
          </el-option-group>
          <el-option-group :label="t('message.pages.opsExecution.hostSelector.hostGroup')">
            <el-option
              v-for="host in displayedHostOptions"
              :key="host.id"
              :label="`${host.host_name} (${host.host_ip})`"
              :value="host.id"
            >
              <div class="quick-history-option">
                <el-tag size="small" type="primary" class="quick-history-tag">{{ t('message.pages.opsExecution.hostSelector.hostTag') }}</el-tag>
                <span class="quick-history-text">
                  {{ host.host_name }} ({{ host.host_ip }})
                </span>
              </div>
            </el-option>
            <el-option v-if="hasMoreHostOptions" value="" disabled>
              <div class="quick-history-more">{{ t('message.pages.opsExecution.hostSelector.hostCountSuffix', { count: historyHostOptions.length - maxDropdownItems }) }}</div>
            </el-option>
          </el-option-group>
          <template #empty>
            <div class="quick-history-empty">
              <el-empty :description="t('message.pages.opsExecution.hostSelector.noHistoryHost')" :image-size="40" />
            </div>
          </template>
        </el-select>
        <el-button type="primary" size="small" @click="$emit('show-selector')">
          <el-icon><Plus /></el-icon>
          {{ t('message.pages.opsExecution.hostSelector.select') }}
        </el-button>
      </div>
      <div v-if="selectedHosts.length > 0" class="selected-hosts-compact">
        <div class="host-tags-scroll">
          <el-tag
            v-for="host in selectedHosts"
            :key="host.id"
            closable
            size="small"
            @close="$emit('remove-host', host)"
            class="host-tag"
          >
            {{ host.host_name }} ({{ host.host_ip }})
          </el-tag>
        </div>
        <div class="host-actions-row">
          <span class="host-count">{{ t('message.pages.opsExecution.hostSelector.hostCountTotal', { count: selectedHosts.length }) }}</span>
          <div class="host-set-actions">
            <el-button size="small" text @click="$emit('save-host-set')">
              <el-icon><Plus /></el-icon>{{ t('message.pages.opsExecution.hostSelector.save') }}
            </el-button>
            <el-dropdown trigger="click" @command="$emit('load-host-set', $event)" size="small">
              <el-button size="small" text>
                {{ t('message.pages.opsExecution.hostSelector.load') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="set in savedHostSets"
                    :key="set.name"
                    :command="set.name"
                  >
                    {{ t('message.pages.opsExecution.hostSelector.savedHosts', { name: set.name, count: set.hosts.length }) }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="savedHostSets.length === 0" disabled>
                    {{ t('message.pages.opsExecution.hostSelector.noSavedHosts') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button size="small" text type="danger" @click="$emit('clear-hosts')">
              {{ t('message.pages.opsExecution.hostSelector.clear') }}
            </el-button>
          </div>
        </div>
      </div>
      <div v-else class="no-host-compact">
        <el-icon :size="24" color="#c0c4cc"><Monitor /></el-icon>
        <span>{{ t('message.pages.opsExecution.hostSelector.noHostTip') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Monitor, Plus, ArrowDown } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

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

defineProps<{
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
}>();

defineEmits<{
  'show-selector': [];
  'remove-host': [host: Host];
  'clear-hosts': [];
  'save-host-set': [];
  'load-host-set': [name: string];
  'host-history-visible': [visible: boolean];
  'host-history-select': [value: string];
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

  &.title-icon-primary {
    background: #ecf5ff;
    color: #409eff;
  }
}

.config-card.host-card {
  .card-header {
    .card-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      background: #409eff;
      color: #fff;
      font-size: 12px;
      line-height: 1;
      border-radius: 10px;
    }
  }

  .host-quick-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;

    .host-history-select {
      flex: 1;
    }
  }

  .selected-hosts-compact {
    .host-tags-scroll {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-height: 110px;
      overflow-y: auto;
      padding: 6px 0;

      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: #dcdfe6;
        border-radius: 2px;
      }

      .host-tag {
        max-width: 280px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .host-actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #e4e7ed;

      .host-count {
        font-size: 12px;
        color: #909399;
      }

      .host-set-actions {
        display: flex;
        gap: 6px;
      }
    }
  }

  .no-host-compact {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px 0;
    color: #c0c4cc;
    font-size: 13px;
  }
}
</style>