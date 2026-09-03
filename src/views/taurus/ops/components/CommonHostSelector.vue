<script setup lang="ts" name="common-host-selector">

import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElTag } from 'element-plus';
import {
  Search,
  RefreshLeft,
  Refresh,
  CircleCheckFilled,
  WarningFilled,
  CircleCloseFilled,
  InfoFilled,
  Remove,
  Monitor,
  User,
  Calendar,
  Check,
} from '@element-plus/icons-vue';
import { request } from '/@/utils/service';
import { GetList, GetObj } from '/@/api/taurus/host/api';

const props = defineProps({
  height: {
    type: Number,
    default: 700,
  },
  selectedHostIds: {
    type: Array,
    default: () => [] as any[],
  },
});

const emits = defineEmits(['select', 'confirm']);

const { t } = useI18n();

const approvalStatusDict = computed(() => [
  { id: 0, text: t('message.pages.opsExecution.commonHost.approvalPending'), color: 'warning' },
  { id: 1, text: t('message.pages.opsExecution.commonHost.approvalApproved'), color: 'success' },
  { id: 2, text: t('message.pages.opsExecution.commonHost.approvalRejected'), color: 'danger' },
  { id: 3, text: t('message.pages.opsExecution.commonHost.approvalDisabled'), color: 'info' },
]);
const onlineStatusDict = computed(() => [
  { id: 0, text: t('message.pages.opsExecution.commonHost.onlineOffline'), color: 'info' },
  { id: 1, text: t('message.pages.opsExecution.commonHost.onlineOnline'), color: 'success' },
]);
const certificateStatusDict = computed(() => [
  { id: 'valid', text: t('message.pages.opsExecution.commonHost.certValid'), color: 'success' },
  { id: 'revoked', text: t('message.pages.opsExecution.commonHost.certRevoked'), color: 'danger' },
  { id: 'expired', text: t('message.pages.opsExecution.commonHost.certExpired'), color: 'warning' },
]);
const hostTypeDict = ref<any[]>([]);
const fetchHostTypeDict = async () => {
  try {
    const res: any = await request({
      url: '/api/system/dict/host_type/',
      method: 'get',
    });
    const data = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.results)
      ? res.data.results
      : [];
    hostTypeDict.value = data.map((d: any) => ({
      label: d.label ?? d.text ?? d.name ?? String(d.value ?? d.id),
      value: d.value ?? d.id,
    }));
  } catch (e) {
    hostTypeDict.value = [];
  }
};

const searchForm = reactive({
  search: '',
  host_name: '',
  host_ip: '',
  host_username: '',
  host_type: undefined as string | number | undefined,
  status: undefined as number | undefined,
  online_status: undefined as number | undefined,
});

const pageState = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

const tableLoading = ref(false);
const tableData = ref<any[]>([]);
const tableRef = ref<any>(null);
const mountedDone = ref(false);

const selectedIds = ref<any[]>([]);
const selectedHosts = ref<any[]>([]);

const drawerVisible = ref(false);
const detailLoading = ref(false);
const hostDetail = ref<any>({});

const idSelectedSet = computed(() => new Set(selectedIds.value));
const selectedCount = computed(() => selectedIds.value.length);
const enrichedDisplayHosts = computed(() => {
  const rowMap = new Map<string, any>(
    (tableData.value || [])
      .filter((r) => r && r.id != null)
      .map((r) => [String(r.id), r] as const)
  );
  return (selectedHosts.value || []).map((h: any) => {
    if (!h || h.id == null) return h;
    const full = rowMap.get(String(h.id));
    if (!full) return h;
    const merged: any = { ...full };
    for (const [k, v] of Object.entries(h)) {
      if (v != null && v !== '' && merged[k] == null) merged[k] = v;
    }
    return merged;
  });
});
const onlineSelectedCount = computed(() =>
  enrichedDisplayHosts.value.filter((h) => h.online_status === 1).length
);

const resolvePageData = (res: any) => {
  const results =
    (res && Array.isArray(res.data?.results) && res.data.results) ||
    (res && Array.isArray(res.results) && res.results) ||
    (res && Array.isArray(res.data?.records) && res.data.records) ||
    (res && Array.isArray(res.records) && res.records) ||
    (res && Array.isArray(res.data) && res.data) ||
    (Array.isArray(res) && res) ||
    [];
  const total = Number(
    (res && res.data?.count) ??
    (res && res.count) ??
    (res && res.data?.total) ??
    (res && res.total) ??
    results.length
  );
  return { results, total };
};

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const query: any = {
      page: pageState.page,
      limit: pageState.limit,
    };
    if (searchForm.search) query.search = searchForm.search;
    if (searchForm.host_name) query.host_name = searchForm.host_name;
    if (searchForm.host_ip) query.host_ip = searchForm.host_ip;
    if (searchForm.host_username) query.host_username = searchForm.host_username;
    if (searchForm.host_type !== undefined && searchForm.host_type !== '' && searchForm.host_type !== null)
      query.host_type = searchForm.host_type;
    if (searchForm.status !== undefined && searchForm.status !== null)
      query.status = searchForm.status;
    if (searchForm.online_status !== undefined && searchForm.online_status !== null)
      query.online_status = searchForm.online_status;
    const res: any = await GetList(query as any);
    const { results, total } = resolvePageData(res);
    tableData.value = results;
    pageState.total = total;
  } catch (e: any) {
    ElMessage.error(e?.message || t('message.pages.opsExecution.commonHost.loadFail'));
    tableData.value = [];
    pageState.total = 0;
  } finally {
    tableLoading.value = false;
    if (mountedDone.value) {
      nextTick(() => {
        restoreInProgress.value = true;
        try { restoreSelection(); } finally { restoreInProgress.value = false; }
      });
    }
  }
};

const selectedIdsStringSet = computed(
  () => new Set((selectedIds.value || []).filter((v) => v != null).map((v) => String(v)))
);
const restoreSelection = () => {
  if (!mountedDone.value) return;
  const table = tableRef.value;
  if (!table || typeof table.toggleRowSelection !== 'function') return;
  if (!tableData.value || tableData.value.length === 0) {
    return;
  }
  if (selectedIds.value.length === 0) {
    try { table.clearSelection?.(); } catch (_) { /* noop */ }
    const idSet = new Set<string>();
    selectedHosts.value = selectedHosts.value.filter(
      (h) => h?.id != null && idSet.add(String(h.id)) && false
    );
    return;
  }
  try {
    table.clearSelection?.();
  } catch (_) { /* noop */ }
  const curPageMap = new Map<string, any>();
  for (const row of tableData.value) {
    if (row == null || row.id == null) continue;
    curPageMap.set(String(row.id), row);
  }
  const syncedIds = new Set<string>();
  for (const row of tableData.value) {
    if (row == null || row.id == null) continue;
    if (selectedIdsStringSet.value.has(String(row.id))) {
      syncedIds.add(String(row.id));
      try {
        table.toggleRowSelection(row, true);
      } catch (_) { /* Single-row failure does not affect other rows */ }
    }
  }
  const prevMap = new Map<string, any>(
    (selectedHosts.value || []).filter((h) => h && h.id != null).map((h) => [String(h.id), h] as const)
  );
  const nextHosts: any[] = [];
  const seen = new Set<string>();
  for (const oldHost of selectedHosts.value || []) {
    if (!oldHost || oldHost.id == null) continue;
    const k = String(oldHost.id);
    if (seen.has(k)) continue;
    seen.add(k);
    const cur = curPageMap.get(k);
    if (cur) {
      const merged: any = { ...cur };
      for (const [kk, vv] of Object.entries(oldHost)) {
        if (vv != null && vv !== '' && merged[kk] == null) merged[kk] = vv;
      }
      nextHosts.push(merged);
    } else {
      nextHosts.push(oldHost);
    }
    prevMap.delete(k);
  }
  selectedHosts.value = nextHosts;
};

const onSearch = () => {
  pageState.page = 1;
  fetchList();
};
const onReset = () => {
  searchForm.search = '';
  searchForm.host_name = '';
  searchForm.host_ip = '';
  searchForm.host_username = '';
  searchForm.host_type = undefined;
  searchForm.status = undefined;
  searchForm.online_status = undefined;
  pageState.page = 1;
  fetchList();
};
const onRefresh = () => fetchList();

const restoreInProgress = ref(false);

const enrichSelectedHosts = () => [...enrichedDisplayHosts.value];
const emitEnrichedSelect = () => {
  const enriched = enrichSelectedHosts();
  const ids = enriched.filter((h) => h && h.id != null).map((h) => h.id);
  emits('select', ids, enriched);
};

const onSelectionChange = (rows: any[]) => {
  if (restoreInProgress.value) return;
  const otherPageSelected = selectedHosts.value.filter(
    (h) => h?.id != null && !tableData.value.find((r) => r?.id === h.id)
  );
  const validRows = (rows || []).filter((r) => r?.id != null);
  selectedHosts.value = [...otherPageSelected, ...validRows];
  selectedIds.value = selectedHosts.value.map((h) => h.id).filter((v) => v != null);
  emitEnrichedSelect();
};

watch(
  () => props.selectedHostIds,
  (newIds: any[]) => {
    const ids = Array.isArray(newIds) ? newIds.filter((v) => v != null) : [];
    selectedIds.value = [...ids];
    const haveMap = new Map(selectedHosts.value.filter((h) => h?.id != null).map((h) => [h.id, h]));
    const nextHosts: any[] = [];
    for (const id of ids) {
      nextHosts.push(haveMap.get(id) || { id });
    }
    selectedHosts.value = nextHosts;
    if (mountedDone.value) {
      nextTick(() => {
        restoreInProgress.value = true;
        try { restoreSelection(); } finally { restoreInProgress.value = false; }
      });
    }
  }
);

const quickToggleRow = (row: any) => {
  if (!row || row.id == null) return;
  const isSelected = idSelectedSet.value.has(row.id);
  if (isSelected) {
    selectedIds.value = selectedIds.value.filter((id) => id !== row.id);
    selectedHosts.value = selectedHosts.value.filter((h) => h.id !== row.id);
  } else {
    selectedIds.value = Array.from(new Set([...selectedIds.value, row.id]));
    const existing = selectedHosts.value.find((h) => h.id === row.id);
    if (!existing) selectedHosts.value.push(row);
    ElMessage.success(t('message.pages.opsExecution.commonHost.quickSelectSuccess', { name: row.host_name || row.host_ip || row.id }));
  }
  emitEnrichedSelect();
  nextTick(() => {
    restoreInProgress.value = true;
    try { restoreSelection(); } finally { restoreInProgress.value = false; }
  });
};

const removeOneSelected = (hostId: any) => {
  if (hostId == null) return;
  selectedIds.value = selectedIds.value.filter((id) => id !== hostId);
  selectedHosts.value = selectedHosts.value.filter((h) => h.id !== hostId);
  emitEnrichedSelect();
  nextTick(() => {
    restoreInProgress.value = true;
    try { restoreSelection(); } finally { restoreInProgress.value = false; }
  });
};
const clearAllSelected = () => {
  if (selectedIds.value.length === 0) return;
  selectedIds.value = [];
  selectedHosts.value = [];
  emits('select', [], []);
  ElMessage.info(t('message.pages.opsExecution.commonHost.clearSuccess'));
  nextTick(() => {
    restoreInProgress.value = true;
    try {
      const table = tableRef.value;
      table?.clearSelection?.();
    } finally {
      restoreInProgress.value = false;
    }
  });
};
const confirmSelection = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning(t('message.pages.opsExecution.commonHost.selectAtLeastOne'));
    return;
  }
  const enriched = enrichSelectedHosts();
  const ids = enriched.filter((h) => h && h.id != null).map((h) => h.id);
  emits('confirm', ids, enriched);
};

const hostTagLabel = (h: any) => {
  if (!h) return '';
  const sub = h.host_ip || h.identifier || `#${h.id}`;
  if (h.host_name) return `${h.host_name} (${sub})`;
  return String(sub);
};
const dictFind = (dict: { id: any; text: string; color?: string }[], val: any) =>
  dict.find((d) => d.id === val);
const hostTypeLabel = (val: any) => {
  if (val === null || val === undefined || val === '') return '—';
  const item = hostTypeDict.value.find((d) => d.value === val);
  if (item) return item.label;
  return String(val);
};

const approvalTagMeta = (val: any) => {
  const d = dictFind(approvalStatusDict.value, val);
  if (!d) return { text: t('message.pages.opsExecution.commonHost.unknown'), type: 'info' as any, icon: InfoFilled };
  const icon = d.color === 'success'
    ? CircleCheckFilled
    : d.color === 'danger'
    ? CircleCloseFilled
    : d.color === 'warning'
    ? WarningFilled
    : InfoFilled;
  return { text: d.text, type: (d.color || 'info') as any, icon };
};
const onlineTagMeta = (val: any) => {
  const d = dictFind(onlineStatusDict.value, val);
  if (!d) return { text: t('message.pages.opsExecution.commonHost.unknown'), type: 'info' as any };
  return { text: d.text, type: (d.color || 'info') as any };
};
const certificateStatusMeta = (val: any) => {
  const d = certificateStatusDict.value.find((x) => x.id === val);
  if (!d) return { text: t('message.pages.opsExecution.commonHost.unknown'), type: 'info' as any };
  return { text: d.text, type: (d.color || 'info') as any };
};

const resolveDetailData = (res: any) => {
  if (res && res.data && typeof res.data === 'object' && !Array.isArray(res.data) && res.data.id !== undefined) {
    return res.data;
  }
  if (res && res.data && res.data.data && typeof res.data.data === 'object' && res.data.data.id !== undefined) {
    return res.data.data;
  }
  return res || {};
};

const onViewRow = async (row: any) => {
  if (!row) {
    ElMessage.warning(t('message.pages.opsExecution.commonHost.detailNoHost'));
    return;
  }
  const lookupKey = row.host_uuid ?? row.id;
  if (lookupKey == null || lookupKey === '') {
    ElMessage.warning(t('message.pages.opsExecution.commonHost.detailNoUuid'));
    return;
  }
  drawerVisible.value = true;
  detailLoading.value = true;
  hostDetail.value = { ...row };
  try {
    const res: any = await GetObj(lookupKey as any);
    hostDetail.value = resolveDetailData(res);
  } catch (e: any) {
    ElMessage.error(e?.message || t('message.pages.opsExecution.commonHost.detailLoadFail'));
  } finally {
    detailLoading.value = false;
  }
};

const onPageChange = (p: number) => {
  pageState.page = p;
  fetchList();
};
const onSizeChange = (s: number) => {
  pageState.limit = s;
  pageState.page = 1;
  fetchList();
};

const mainAreaHeight = computed(() => {
  const summaryH = selectedCount.value > 0 ? 108 : 0;
  return props.height - 44 - 132 - 56 - 28 - summaryH;
});

const onPanelKeydown = (ev: KeyboardEvent) => {
  if (ev.key === 'Enter' && ev.ctrlKey) confirmSelection();
};

const tableRowClassName = ({ row }: { row: any }) => {
  if (row && row.id != null && idSelectedSet.value.has(row.id)) {
    return 'row-selected-highlight';
  }
  return '';
};

const initExternalSelection = () => {
  const newIds = Array.isArray(props.selectedHostIds)
    ? props.selectedHostIds.filter((v) => v != null)
    : [];
  if (newIds.length === 0) return;
  selectedIds.value = [...newIds];
  selectedHosts.value = newIds.map((id) => ({ id }));
};

onMounted(async () => {
  initExternalSelection();
  await fetchHostTypeDict();
  mountedDone.value = true;
  fetchList();
});
</script>

<template>
  <div
    class="target-host-panel"
    :style="{ height: height + 'px' }"
    tabindex="0"
    @keydown="onPanelKeydown"
  >
    <div class="panel-header">
      <div class="header-left">
        <el-icon color="#409eff" :size="18"><Monitor /></el-icon>
        <span class="header-title">{{ t('message.pages.opsExecution.commonHost.panelTitle') }}</span>
        <el-tag size="small" type="info" effect="plain" class="header-tip">
          {{ t('message.pages.opsExecution.commonHost.panelTip') }}
        </el-tag>
      </div>
      <div class="header-right">
        <el-tag v-if="selectedCount > 0" type="success" effect="dark" size="small">
          {{ t('message.pages.opsExecution.commonHost.selectedCount', { count: selectedCount }) }}
          <span v-if="onlineSelectedCount > 0">{{ t('message.pages.opsExecution.commonHost.onlineCount', { count: onlineSelectedCount }) }}</span>
        </el-tag>
        <el-tag v-else size="small" type="info" effect="plain">
          {{ t('message.pages.opsExecution.commonHost.totalCount', { count: pageState.total }) }}
        </el-tag>
      </div>
    </div>

    <div class="search-wrap">
      <el-form :model="searchForm" label-width="72px" size="small" @submit.prevent="onSearch">
        <el-row :gutter="10">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item :label="t('message.pages.opsExecution.commonHost.keyword')">
              <el-input
                v-model="searchForm.search"
                :placeholder="t('message.pages.opsExecution.commonHost.keywordPlaceholder')"
                clearable
                :prefix-icon="Search"
                @keyup.enter="onSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item :label="t('message.pages.opsExecution.commonHost.hostIp')">
              <el-input
                v-model="searchForm.host_ip"
                :placeholder="t('message.pages.opsExecution.commonHost.hostIpPlaceholder')"
                clearable
                @keyup.enter="onSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item :label="t('message.pages.opsExecution.commonHost.username')">
              <el-input
                v-model="searchForm.host_username"
                :placeholder="t('message.pages.opsExecution.commonHost.usernamePlaceholder')"
                clearable
                :prefix-icon="User"
                @keyup.enter="onSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item :label="t('message.pages.opsExecution.commonHost.hostType')">
              <el-select
                v-model="searchForm.host_type"
                :placeholder="t('message.pages.opsExecution.commonHost.hostTypePlaceholder')"
                clearable
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="d in hostTypeDict"
                  :key="d.value"
                  :label="d.label"
                  :value="d.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item :label="t('message.pages.opsExecution.commonHost.approvalStatus')">
              <el-select
                v-model="searchForm.status"
                :placeholder="t('message.pages.opsExecution.commonHost.approvalStatusPlaceholder')"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="d in approvalStatusDict"
                  :key="d.id"
                  :label="d.text"
                  :value="d.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item :label="t('message.pages.opsExecution.commonHost.onlineStatus')">
              <el-select
                v-model="searchForm.online_status"
                :placeholder="t('message.pages.opsExecution.commonHost.onlineStatusPlaceholder')"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="d in onlineStatusDict"
                  :key="d.id"
                  :label="d.text"
                  :value="d.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="search-actions-bar">
          <el-button type="primary" :icon="Search" size="small" @click="onSearch">{{ t('message.pages.opsExecution.commonHost.btnSearch') }}</el-button>
          <el-button :icon="RefreshLeft" size="small" @click="onReset">{{ t('message.pages.opsExecution.commonHost.btnReset') }}</el-button>
          <el-tooltip :content="t('message.pages.opsExecution.commonHost.btnRefreshTip')" placement="top">
            <el-button :icon="Refresh" size="small" circle @click="onRefresh" />
          </el-tooltip>
        </div>
      </el-form>
    </div>

    <div class="table-wrap" :style="{ minHeight: mainAreaHeight + 'px' }">
      <el-table
        ref="tableRef"
        :data="tableData"
        v-loading="tableLoading"
        size="default"
        stripe
        border
        row-key="id"
        :row-class-name="tableRowClassName"
        @selection-change="onSelectionChange"
        style="width: 100%"
        class="host-table"
      >
        <el-table-column type="selection" width="46" align="center" reserve-selection />

        <el-table-column prop="host_name" :label="t('message.pages.opsExecution.commonHost.colHostName')" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="cell-hostname">
              <el-icon color="#409eff" :size="16"><Monitor /></el-icon>
              <span class="hostname-text">{{ row.host_name || t('message.pages.opsExecution.commonHost.noNameHost') }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="host_ip" :label="t('message.pages.opsExecution.commonHost.colIpAddr')" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="cell-ip">{{ row.host_ip || t('message.pages.opsExecution.commonHost.dash') }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="host_username" :label="t('message.pages.opsExecution.commonHost.colUsername')" width="110" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="cell-username">
              <el-icon color="#909399" :size="14"><User /></el-icon>
              {{ row.host_username || t('message.pages.opsExecution.commonHost.dash') }}
            </span>
          </template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsExecution.commonHost.colType')" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain" round>
              {{ hostTypeLabel(row.host_type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsExecution.commonHost.colApproval')" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="approvalTagMeta(row.status).type" effect="light" round>
              <el-icon style="vertical-align: -1px; margin-right: 2px" :size="12">
                <component :is="approvalTagMeta(row.status).icon" />
              </el-icon>
              {{ approvalTagMeta(row.status).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsExecution.commonHost.colOnline')" width="80" align="center">
          <template #default="{ row }">
            <span class="online-dot-wrap">
              <span
                class="online-dot"
                :class="row.online_status === 1 ? 'dot-online' : 'dot-offline'"
              ></span>
              <span :class="row.online_status === 1 ? 'text-online' : 'text-offline'">
                {{ onlineTagMeta(row.online_status).text }}
              </span>
            </span>
          </template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsExecution.commonHost.colLastHeartbeat')" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.last_heartbeat_at" class="cell-heartbeat">
              <el-icon color="#909399" :size="13"><Calendar /></el-icon>
              <span>{{ row.last_heartbeat_at }}</span>
            </div>
            <span v-else class="cell-dim">{{ t('message.pages.opsExecution.commonHost.dash') }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsExecution.commonHost.colAction')" width="130" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="idSelectedSet.has(row.id) ? 'warning' : 'success'"
              :icon="Check"
              link
              @click="quickToggleRow(row)"
            >
              {{ idSelectedSet.has(row.id) ? t('message.pages.opsExecution.commonHost.actionCancelSelect') : t('message.pages.opsExecution.commonHost.actionSelect') }}
            </el-button>
            <el-button size="small" link type="primary" @click="onViewRow(row)">{{ t('message.pages.opsExecution.commonHost.actionDetail') }}</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty :description="t('message.pages.opsExecution.commonHost.noHostEmpty')" :image-size="80">
            <el-button type="primary" :icon="RefreshLeft" size="small" @click="onRefresh">
              {{ t('message.pages.opsExecution.commonHost.reload') }}
            </el-button>
          </el-empty>
        </template>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pageState.page"
          v-model:page-size="pageState.limit"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pageState.total"
          small
          background
          @current-change="onPageChange"
          @size-change="onSizeChange"
        />
      </div>
    </div>

    <transition name="summary-fade">
      <div v-if="selectedCount > 0" class="selected-summary">
        <div class="summary-info">
          <div class="summary-count-row">
            <el-tag type="primary" effect="dark" size="default" round>
              {{ t('message.pages.opsExecution.commonHost.summaryTitle', { count: selectedCount }) }}
            </el-tag>
            <el-tag v-if="onlineSelectedCount > 0" type="success" effect="light" size="small" round>
              {{ t('message.pages.opsExecution.commonHost.onlineSelected', { count: onlineSelectedCount }) }}
            </el-tag>
            <el-tag
              v-if="selectedCount - onlineSelectedCount > 0"
              type="info"
              effect="light"
              size="small"
              round
            >
              {{ t('message.pages.opsExecution.commonHost.offlineSelected', { count: selectedCount - onlineSelectedCount }) }}
            </el-tag>
            <el-button link type="danger" size="small" :icon="Remove" @click="clearAllSelected">
              {{ t('message.pages.opsExecution.commonHost.clearAll') }}
            </el-button>
          </div>
          <div class="summary-chips">
            <el-tag
              v-for="(h, idx) in enrichedDisplayHosts.slice(0, 20)"
              :key="h.id ?? idx"
              class="host-chip"
              :title="hostTagLabel(h)"
              closable
              size="small"
              :type="h.online_status === 1 ? 'success' : 'info'"
              effect="light"
              @close="removeOneSelected(h.id)"
            >
              <el-icon v-if="h.online_status === 1" :size="11" color="#67c23a">
                <Monitor />
              </el-icon>
              <span>{{ hostTagLabel(h) }}</span>
            </el-tag>
            <el-tag
              v-if="enrichedDisplayHosts.length > 20"
              class="host-chip"
              size="small"
              type="info"
              effect="plain"
            >
              {{ t('message.pages.opsExecution.commonHost.andMore', { count: enrichedDisplayHosts.length }) }}
            </el-tag>
          </div>
        </div>
        <div class="summary-action">
          <el-button type="primary" size="large" @click="confirmSelection">
            <el-icon><Check /></el-icon>
            <span>{{ t('message.pages.opsExecution.commonHost.confirmSelect') }}</span>
            <span class="shortcut-tip">(Ctrl+Enter)</span>
          </el-button>
        </div>
      </div>
    </transition>

    <el-drawer
      v-model="drawerVisible"
      :title="t('message.pages.opsExecution.commonHost.detailTitle')"
      direction="rtl"
      size="48%"
      :with-header="true"
      destroy-on-close
    >
      <template #header>
        <div class="drawer-header-custom">
          <el-icon color="#409eff" :size="20"><Monitor /></el-icon>
          <span class="drawer-title">{{ hostDetail.host_name || t('message.pages.opsExecution.commonHost.detailTitle') }}</span>
          <el-tag
            v-if="hostDetail.host_ip"
            size="small"
            type="info"
            effect="plain"
            round
            style="margin-left: 8px"
          >
            {{ hostDetail.host_ip }}
          </el-tag>
        </div>
      </template>

      <div v-loading="detailLoading" class="detail-content">
        <div class="detail-section">
          <div class="section-title">
            <el-icon color="#409eff"><InfoFilled /></el-icon>
            <span>{{ t('message.pages.opsExecution.commonHost.basicInfo') }}</span>
          </div>
          <el-descriptions :column="1" border size="default" class="detail-descriptions">
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.hostId')">
              <span class="mono-text">{{ hostDetail.id ?? t('message.pages.opsExecution.commonHost.dash') }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.hostUuid')">
              <span class="mono-text small-text" v-if="hostDetail.host_uuid">
                {{ hostDetail.host_uuid }}
              </span>
              <span v-else>{{ t('message.pages.opsExecution.commonHost.dash') }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.hostName')">
              {{ hostDetail.host_name || t('message.pages.opsExecution.commonHost.dash') }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.ipAddress')">
              <span class="mono-text" v-if="hostDetail.host_ip">{{ hostDetail.host_ip }}</span>
              <span v-else>{{ t('message.pages.opsExecution.commonHost.dash') }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.loginUsername')">
              <span class="mono-text" v-if="hostDetail.host_username">
                {{ hostDetail.host_username }}
              </span>
              <span v-else>{{ t('message.pages.opsExecution.commonHost.dash') }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.hostTypeDetail')">
              <el-tag v-if="hostDetail.host_type" size="small" type="info" effect="plain" round>
                {{ hostTypeLabel(hostDetail.host_type) }}
              </el-tag>
              <span v-else>{{ t('message.pages.opsExecution.commonHost.dash') }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
            <span>{{ t('message.pages.opsExecution.commonHost.statusInfo') }}</span>
          </div>
          <el-descriptions :column="2" border size="default" class="detail-descriptions">
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.approvalStatusDetail')">
              <el-tag :type="approvalTagMeta(hostDetail.status).type" effect="light" size="small">
                <el-icon style="vertical-align: -1px; margin-right: 2px" :size="12">
                  <component :is="approvalTagMeta(hostDetail.status).icon" />
                </el-icon>
                {{ approvalTagMeta(hostDetail.status).text }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.onlineStatusDetail')">
              <span class="online-dot-wrap">
                <span
                  class="online-dot"
                  :class="hostDetail.online_status === 1 ? 'dot-online' : 'dot-offline'"
                ></span>
                <el-tag :type="onlineTagMeta(hostDetail.online_status).type" effect="light" size="small">
                  {{ onlineTagMeta(hostDetail.online_status).text }}
                </el-tag>
              </span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.supervisorVersion')">
              <span class="mono-text" v-if="hostDetail.supervisor_version">
                v{{ hostDetail.supervisor_version }}
              </span>
              <span v-else>{{ t('message.pages.opsExecution.commonHost.dash') }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.lastHeartbeat')">
              <div v-if="hostDetail.last_heartbeat_at" class="cell-heartbeat">
                <el-icon color="#909399" :size="13"><Calendar /></el-icon>
                <span>{{ hostDetail.last_heartbeat_at }}</span>
              </div>
              <span v-else class="cell-dim">{{ t('message.pages.opsExecution.commonHost.dash') }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon color="#e6a23c"><WarningFilled /></el-icon>
            <span>{{ t('message.pages.opsExecution.commonHost.certInfo') }}</span>
          </div>
          <el-descriptions :column="1" border size="default" class="detail-descriptions">
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.certSerial')">
              <span class="mono-text small-text" v-if="hostDetail.certificate_serial">
                {{ hostDetail.certificate_serial }}
              </span>
              <span v-else>{{ t('message.pages.opsExecution.commonHost.dash') }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.certStatus')">
              <el-tag
                :type="certificateStatusMeta(hostDetail.certificate_status).type"
                effect="light"
                size="small"
              >
                {{ certificateStatusMeta(hostDetail.certificate_status).text }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.certRevokedAt')" v-if="hostDetail.certificate_revoked_at">
              {{ hostDetail.certificate_revoked_at }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.certRevocationReason')" v-if="hostDetail.certificate_revocation_reason">
              {{ hostDetail.certificate_revocation_reason }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section" v-if="hostDetail.heartbeat_server || hostDetail.create_datetime">
          <div class="section-title">
            <el-icon color="#909399"><Calendar /></el-icon>
            <span>{{ t('message.pages.opsExecution.commonHost.otherInfo') }}</span>
          </div>
          <el-descriptions :column="1" border size="default" class="detail-descriptions">
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.heartbeatServer')" v-if="hostDetail.heartbeat_server">
              <template v-if="typeof hostDetail.heartbeat_server === 'object'">
                {{ hostDetail.heartbeat_server.name || hostDetail.heartbeat_server.id || t('message.pages.opsExecution.commonHost.dash') }}
              </template>
              <template v-else>
                <span class="mono-text">{{ hostDetail.heartbeat_server }}</span>
              </template>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.createTime')" v-if="hostDetail.create_datetime">
              {{ hostDetail.create_datetime }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.updateTime')" v-if="hostDetail.update_datetime">
              {{ hostDetail.update_datetime }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsExecution.commonHost.createdBy')" v-if="hostDetail.created_by">
              <template v-if="typeof hostDetail.created_by === 'object'">
                {{ hostDetail.created_by.username || hostDetail.created_by.name || hostDetail.created_by.id }}
              </template>
              <template v-else>
                <span class="mono-text">{{ hostDetail.created_by }}</span>
              </template>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section" v-if="hostDetail.extra_info && Object.keys(hostDetail.extra_info).length > 0">
          <div class="section-title">
            <el-icon color="#909399"><InfoFilled /></el-icon>
            <span>{{ t('message.pages.opsExecution.commonHost.extraInfo') }}</span>
          </div>
          <div class="extra-info-box">
            <pre class="json-pre">{{ JSON.stringify(hostDetail.extra_info, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.target-host-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  box-sizing: border-box;
  outline: none;
  background: #f5f7fa;

  .panel-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: linear-gradient(135deg, #ffffff 0%, #f0f5ff 100%);
    border: 1px solid #e4e7ed;
    border-radius: 8px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      .header-title {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }
      .header-tip {
        margin-left: 4px;
      }
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .search-wrap {
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 10px 12px 0;

    .search-actions-bar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      flex-wrap: nowrap;
      padding: 2px 0 12px;
      border-top: 1px dashed #ebedf0;
      margin-top: 2px;

      .el-button + .el-button {
        margin-left: 0;
      }
    }
  }

  .table-wrap {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;

    .host-table {
      flex: 1;
      min-height: 0;

      :deep(.el-table__row.row-selected-highlight) {
        --el-table-tr-bg-color: #ecf5ff !important;
        > td {
          background-color: #ecf5ff !important;
        }
        &:hover > td {
          background-color: #d9ecff !important;
        }
      }

      .cell-hostname {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        .hostname-text {
          font-weight: 500;
          color: #303133;
        }
      }
      .cell-ip {
        font-family: 'Courier New', monospace;
        color: #606266;
        font-size: 13px;
      }
      .cell-username {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #606266;
      }
      .cell-dim {
        color: #c0c4cc;
      }
      .cell-heartbeat {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #606266;
      }
      .online-dot-wrap {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        .online-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          &.dot-online {
            background: #67c23a;
            box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.18);
          }
          &.dot-offline {
            background: #c0c4cc;
          }
        }
        .text-online {
          color: #67c23a;
          font-size: 12px;
          font-weight: 500;
        }
        .text-offline {
          color: #909399;
          font-size: 12px;
        }
      }
    }

    .pagination-wrap {
      flex-shrink: 0;
      display: flex;
      justify-content: flex-end;
      padding: 10px 14px;
      border-top: 1px solid #f0f2f5;
      background: #fafbfc;
    }
  }

  .selected-summary {
    flex-shrink: 0;
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 16px;
    background: linear-gradient(180deg, #ffffff 0%, #f0f7ff 100%);
    border: 1px solid #c6e2ff;
    border-radius: 10px;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);

    .summary-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .summary-count-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .summary-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        max-height: 54px;
        overflow-y: auto;
        padding-right: 4px;

        .host-chip {
          max-width: 260px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          :deep(.el-tag__content) {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            max-width: 220px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            > span {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }
      }
    }

    .summary-action {
      flex-shrink: 0;
      display: flex;
      align-items: center;

      .el-button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;
        padding-left: 20px;
        padding-right: 20px;

        .shortcut-tip {
          font-size: 11px;
          opacity: 0.8;
          font-weight: normal;
          margin-left: 4px;
        }
      }
    }
  }

  .summary-fade-enter-active,
  .summary-fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .summary-fade-enter-from,
  .summary-fade-leave-to {
    opacity: 0;
    transform: translateY(8px);
  }

  :deep(.el-drawer) {
    .drawer-header-custom {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      .drawer-title {
        margin-left: 8px;
      }
    }
  }
  .detail-content {
    padding: 4px 4px 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;

    .detail-section {
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      overflow: hidden;

      .section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 14px;
        background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
        border-bottom: 1px solid #ebeef5;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }
      .detail-descriptions {
        :deep(.el-descriptions__label) {
          background: #fafbfc;
          color: #606266;
          font-weight: 500;
          width: 120px;
        }
        :deep(.el-descriptions__content) {
          color: #303133;
        }
      }
    }
    .extra-info-box {
      padding: 12px 14px;
      background: #fafbfc;
      border-top: 1px solid #ebeef5;
      .json-pre {
        margin: 0;
        padding: 12px;
        background: #282c34;
        color: #abb2bf;
        border-radius: 6px;
        font-size: 12px;
        line-height: 1.6;
        max-height: 260px;
        overflow: auto;
        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      }
    }
  }

  .mono-text {
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    color: #606266;
    &.small-text {
      font-size: 12px;
      word-break: break-all;
    }
  }
}
</style>