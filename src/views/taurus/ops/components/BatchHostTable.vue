<template>
  <div class="batch-host-summary">
    <div class="summary-bar" :class="{ 'is-empty': items.length === 0 }">
      <div class="summary-left">
        <div class="host-icon-wrap">
          <el-icon class="host-icon"><Monitor /></el-icon>
        </div>
        <div class="summary-info">
          <div class="summary-primary">
            <span class="label">{{ t('batchTargetHosts') }}</span>
            <el-tag type="primary" effect="dark" size="small" round class="count-tag">
              {{ items.length }}{{ t('countUnits').replace('{n}','') }}
            </el-tag>
            <el-button
              v-if="items.length > 0"
              type="primary"
              link
              size="small"
              class="detail-link"
              @click="showDetailDialog = true"
            >
              {{ t('viewDetail') }}
              <el-icon class="arrow-right"><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div v-if="items.length > 0" class="summary-secondary">
            <el-tooltip
              v-for="(seg, i) in statusSegments"
              :key="i"
              :content="seg.label + t('segCount', { label: '', n: seg.count }).replace('{label}', '')"
              placement="top"
            >
              <span class="seg-item" :style="{ color: seg.color, background: seg.bgColor }">
                {{ seg.count }} {{ seg.short }}
              </span>
            </el-tooltip>
            <span v-if="summaryDetailText" class="seg-full">{{ t('totalBatchHosts', { summary: summaryDetailText }) }}</span>
          </div>
          <div v-else class="summary-secondary empty-tip">
            {{ t('noHostsHint') }}
          </div>
        </div>
      </div>
      <div class="summary-actions">
        <el-button type="primary" size="small" :icon="Plus" @click="showHostSelector = true">
          {{ t('addHosts') }}
        </el-button>
        <el-button
          v-if="items.length > 0"
          size="small"
          :icon="Delete"
          @click="clearAll"
        >
          {{ t('empty') }}
        </el-button>
      </div>
    </div>
  </div>

  <el-dialog
    v-model="showDetailDialog"
    :title="t('batchHostDialogTitle')"
    width="820px"
    :close-on-click-modal="true"
    destroy-on-close
    top="8vh"
    class="host-detail-dialog"
  >
    <div class="detail-dialog-summary">
      <el-tag type="primary" effect="light" round size="small">{{ t('batchHostTotal', { n: items.length }) }}</el-tag>
      <el-tag
        v-for="(seg, i) in statusSegments"
        :key="i"
        :color="seg.bgColor"
        effect="plain"
        round
        size="small"
        :style="{ color: seg.color, borderColor: seg.color + '55' }"
      >
        {{ seg.label }} {{ seg.count }}
      </el-tag>
    </div>
    <el-table
      :data="paginatedItems"
      size="small"
      border
      stripe
      max-height="360px"
      class="detail-host-table"
    >
      <el-table-column label="#" width="50" type="index" align="center"
        :index="calcDetailIndex"
      />
      <el-table-column :label="t('colHostName')" min-width="200">
        <template #default="scope">
          <span class="host-name">{{ scope.row.host_name || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('colHostIp')" width="140">
        <template #default="scope">
          <span class="text-muted">{{ scope.row.host_ip || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('colHostType')" width="80" align="center">
        <template #default="scope">
          <el-tag
            size="small"
            :type="scope.row.execution_type === 'script' ? 'primary' : 'success'"
            effect="light"
            round
          >
            {{ scope.row.execution_type === 'script' ? t('colScript') : t('colCommand') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('colOrigStatus')" width="100" align="center">
        <template #default="scope">
          <el-tag
            size="small"
            :type="scope.row._is_new_host ? 'info' : historyStatusTagType(scope.row.status, scope.row.exit_code)"
            effect="light"
            round
          >
            {{ scope.row._is_new_host ? t('segNewHost') : historyStatusText(scope.row.status, scope.row.exit_code) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('batchColActions')" width="70" align="center" fixed="right">
        <template #default="scope">
          <el-button
            type="danger"
            size="small"
            link
            @click="removeAt(scope.$index)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="detail-pagination" v-if="items.length > 0">
      <el-pagination
        v-model:current-page="detailPage"
        v-model:page-size="detailPageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="items.length"
        layout="total, sizes, prev, pager, next, jumper"
        background
        small
      />
    </div>
    <template #footer>
      <div class="detail-dialog-footer">
        <el-button size="small" :icon="Delete" type="danger" plain @click="clearAll">
          {{ t('empty') }}{{ t('all') }}
        </el-button>
        <el-button size="small" :icon="Plus" type="primary" plain @click="showHostSelector = true; showDetailDialog = false">
          {{ t('continueAdd') }}
        </el-button>
        <el-button type="primary" size="small" @click="showDetailDialog = false">
          {{ t('ok') }}
        </el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog
    v-model="showHostSelector"
    :title="t('hostSelectorTitle')"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
    top="5vh"
    class="batch-host-select-dialog"
  >
    <CommonHostSelector
      :height="620"
      @select="handleHostSelect"
      @confirm="handleSelectorInnerConfirm"
      :selected-host-ids="selectedHostIds"
    />
    <template #footer>
      <el-button @click="showHostSelector = false">{{ t('cancel') }}</el-button>
      <el-button type="primary" @click="confirmHostSelect">{{ t('ok') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Monitor, ArrowRight } from '@element-plus/icons-vue';
import CommonHostSelector from './CommonHostSelector.vue';
import { historyStatusTagType, historyStatusText } from './historyUtils';

interface HostLikeItem {
  host_id?: any;
  host?: any;
  host_uuid?: any;
  host_name?: any;
  host_ip?: any;
  execution_type?: string;
  command?: string;
  script_type?: string;
  script_content?: string;
  status?: number;
  exit_code?: number;
  _is_new_host?: boolean;
  [key: string]: any;
}

const props = withDefaults(defineProps<{
  modelValue: HostLikeItem[];
  /** Template item used when adding hosts, for filling execution_type/command etc. fields of new entries */
  templateItem?: HostLikeItem;
}>(), {});

const emit = defineEmits<{
  (e: 'update:modelValue', val: HostLikeItem[]): void;
}>();

const items = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val),
});

const showHostSelector = ref(false);
const showDetailDialog = ref(false);
const tempHosts = ref<any[]>([]);

const selectedHostIds = computed(() =>
  items.value
    .map((item) => item.host_id || item.host?.id)
    .filter(Boolean)
);

const detailPage = ref(1);
const detailPageSize = ref(20);

const paginatedItems = computed(() => {
  const start = (detailPage.value - 1) * detailPageSize.value;
  return items.value.slice(start, start + detailPageSize.value);
});

function calcDetailIndex(index: number) {
  return (detailPage.value - 1) * detailPageSize.value + index + 1;
}

const counts = computed(() => {
  const arr = items.value || [];
  return {
    total: arr.length,
    success: arr.filter((i) => i.status === 2).length,
    failed: arr.filter((i) => i.status === 3).length,
    interrupted: arr.filter((i) => i.status === 4).length,
    running: arr.filter((i) => i.status === 1).length,
    pending: arr.filter((i) => i.status === 0).length,
    newHost: arr.filter((i) => i._is_new_host).length,
  };
});

const statusSegments = computed(() => {
  const segs: { label: string; short: string; count: number; color: string; bgColor: string }[] = [];
  const c = counts.value;
  if (c.success > 0) segs.push({ label: t('segSuccess'), short: t('segSuccess'), count: c.success, color: '#67c23a', bgColor: '#f0f9eb' });
  if (c.failed > 0) segs.push({ label: t('segFailed'), short: t('segFailed'), count: c.failed, color: '#f56c6c', bgColor: '#fef0f0' });
  if (c.interrupted > 0) segs.push({ label: t('segInterrupted'), short: t('segInterrupted'), count: c.interrupted, color: '#e6a23c', bgColor: '#fdf6ec' });
  if (c.running > 0) segs.push({ label: t('segRunning'), short: t('segRunning'), count: c.running, color: '#409eff', bgColor: '#ecf5ff' });
  if (c.pending > 0) segs.push({ label: t('segPending'), short: t('segPending'), count: c.pending, color: '#909399', bgColor: '#f4f4f5' });
  if (c.newHost > 0) segs.push({ label: t('segNewHost'), short: t('segNewHost'), count: c.newHost, color: '#909399', bgColor: '#f4f4f5' });
  return segs;
});

const summaryDetailText = computed(() => {
  const c = counts.value;
  const parts: string[] = [];
  if (c.success) parts.push(`${c.success} ${t('segSuccess')}`);
  if (c.failed) parts.push(`${c.failed} ${t('segFailed')}`);
  if (c.interrupted) parts.push(`${c.interrupted} ${t('segInterrupted')}`);
  if (c.running) parts.push(`${c.running} ${t('segRunning')}`);
  if (c.pending) parts.push(`${c.pending} ${t('segPending')}`);
  if (c.newHost) parts.push(`${c.newHost} ${t('segNewHost')}`);
  return parts.join('、');
});

function removeAt(index: number) {
  const globalIndex = (detailPage.value - 1) * detailPageSize.value + index;
  const next = [...items.value];
  next.splice(globalIndex, 1);
  items.value = next;
  if (detailPage.value > 1 && paginatedItems.value.length === 0) {
    detailPage.value--;
  }
}

async function clearAll() {
  try {
    await ElMessageBox.confirm(t('clearConfirmMsg', { n: items.value.length }), t('clearConfirmTitle'), {
      type: 'warning',
      confirmButtonText: t('ok'),
      cancelButtonText: t('cancel'),
    });
    items.value = [];
    showDetailDialog.value = false;
  } catch (_e) {
    /* cancelled */
  }
}

function normalizeHostId(id: any): string {
  return id ? String(id) : '';
}

function getItemIdentifiers(item: HostLikeItem): Set<string> {
  const ids = new Set<string>();
  const addIfValid = (val: any) => {
    if (val) ids.add(normalizeHostId(val));
  };
  addIfValid(item?.host_id);
  addIfValid(item?.host?.id);
  addIfValid(item?.host_uuid);
  addIfValid(item?.host);
  addIfValid(item?.host_name);
  addIfValid(item?.host_ip);
  return ids;
}

function handleHostSelect(_ids: any[], hosts: any[]) {
  tempHosts.value = hosts;
}

function handleSelectorInnerConfirm(_ids: any[], hosts: any[]) {
  tempHosts.value = hosts;
  confirmHostSelect();
}

function confirmHostSelect() {
  showHostSelector.value = false;

  const allExistingIds = new Set<string>();
  items.value.forEach((item) => {
    getItemIdentifiers(item).forEach((id) => allExistingIds.add(id));
  });

  const firstItem = props.templateItem || items.value[0] || {};
  let duplicateCount = 0;
  const next = [...items.value];

  for (const host of tempHosts.value) {
    const newHostId = normalizeHostId(host.id);
    const newHostName = host.host_name || '';
    const newHostIp = host.host_ip || '';

    const isDuplicate =
      allExistingIds.has(newHostId) ||
      allExistingIds.has(newHostName) ||
      allExistingIds.has(newHostIp);

    if (isDuplicate) {
      duplicateCount++;
      continue;
    }

    next.push({
      host_id: host.id,
      host_name: host.host_name,
      host_ip: host.host_ip,
      host: host,
      execution_type: firstItem.execution_type || 'command',
      command: firstItem.command || '',
      script_type: firstItem.script_type || 'sh',
      script_content: firstItem.script_content || '',
      status: 2,
      exit_code: 0,
      _is_new_host: true,
    });
  }

  if (duplicateCount > 0) {
    ElMessage.warning(t('msgSkippedDuplicate', { n: duplicateCount }));
  }

  items.value = next;
  tempHosts.value = [];

  const maxPage = Math.max(1, Math.ceil(items.value.length / detailPageSize.value));
  if (detailPage.value > maxPage) {
    detailPage.value = maxPage;
  }
}
</script>

<style scoped lang="scss">
.batch-host-summary {
  margin-bottom: 12px;

  .summary-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: linear-gradient(135deg, #f5f9ff 0%, #ffffff 100%);
    border: 1px solid #e4ebf5;
    border-radius: 10px;
    transition: all 0.2s ease;

    &:hover {
      border-color: #b3d4ff;
      box-shadow: 0 2px 10px rgba(64, 158, 255, 0.1);
    }

    &.is-empty {
      background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
      border-color: #ebeef5;
    }

    .summary-left {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;

      .host-icon-wrap {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);

        .host-icon {
          font-size: 22px;
          color: #fff;
        }
      }

      .summary-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;

        .summary-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #303133;

          .label {
            white-space: nowrap;
          }

          .count-tag {
            padding: 2px 10px;
            font-weight: 600;
          }

          .detail-link {
            margin-left: 4px;
            font-size: 13px;
            font-weight: normal;
            display: inline-flex;
            align-items: center;
            gap: 2px;

            .arrow-right {
              font-size: 12px;
              transition: transform 0.2s ease;
            }

            &:hover .arrow-right {
              transform: translateX(3px);
            }
          }
        }

        .summary-secondary {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 12px;

          &.empty-tip {
            color: #909399;
          }

          .seg-item {
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 12px;
            line-height: 1.5;
            cursor: default;
            transition: transform 0.15s ease;

            &:hover {
              transform: translateY(-1px);
            }
          }

          .seg-full {
            color: #909399;
            margin-left: 4px;
            font-size: 12px;
          }
        }
      }
    }

    .summary-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
  }
}
</style>

<style lang="scss">
.host-detail-dialog {
  .el-dialog__body {
    padding: 16px 20px 8px;
  }

  .el-dialog__footer {
    padding: 8px 20px 16px;
  }

  .detail-dialog-summary {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
    padding: 8px 12px;
    background: #f5f9ff;
    border-radius: 8px;
    border: 1px solid #e4ebf5;
  }

  .detail-host-table {
    margin-bottom: 12px;

    .host-name {
      font-weight: 500;
      color: #303133;
    }

    .text-muted {
      color: #909399;
      font-family: 'SF Mono', Consolas, monospace;
      font-size: 12px;
    }
  }

  .detail-dialog-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }

  .detail-pagination {
    display: flex;
    justify-content: flex-end;
    padding: 6px 0 2px;
  }
}
</style>