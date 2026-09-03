<script setup lang="ts" name="target-host">

import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElTag } from 'element-plus';
import { useI18n } from 'vue-i18n';
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

const { t } = useI18n();

// —— Input props
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

// —— Emitted events
const emits = defineEmits(['select', 'confirm']);

// —— Dict data: approval status, online status, host type (computed for language switching)
const approvalStatusDict = computed(() => [
  { id: 0, text: t('message.pages.opsScript.hostApprovalPending'), color: 'warning' },
  { id: 1, text: t('message.pages.opsScript.hostApprovalApproved'), color: 'success' },
  { id: 2, text: t('message.pages.opsScript.hostApprovalRejected'), color: 'danger' },
  { id: 3, text: t('message.pages.opsScript.hostApprovalDisabled'), color: 'info' },
]);
const onlineStatusDict = computed(() => [
  { id: 0, text: t('message.pages.opsScript.hostOnlineOffline'), color: 'info' },
  { id: 1, text: t('message.pages.opsScript.hostOnlineOnline'), color: 'success' },
]);
const certificateStatusDict = computed(() => [
  { id: 'valid', text: t('message.pages.opsScript.hostCertValid'), color: 'success' },
  { id: 'revoked', text: t('message.pages.opsScript.hostCertRevoked'), color: 'danger' },
  { id: 'expired', text: t('message.pages.opsScript.hostCertExpired'), color: 'warning' },
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

// —— Search conditions
const searchForm = reactive({
  search: '',
  host_name: '',
  host_ip: '',
  host_username: '',
  host_type: undefined as string | number | undefined,
  status: undefined as number | undefined,
  online_status: undefined as number | undefined,
});

// —— Pagination (dvadmin convention: page + limit)
const pageState = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

// —— Table data
const tableLoading = ref(false);
const tableData = ref<any[]>([]);
const tableRef = ref<any>(null);
const mountedDone = ref(false);

// —— Selected data (single source of truth: selectedIds decides everything; UI only reflects)
const selectedIds = ref<any[]>([]);
const selectedHosts = ref<any[]>([]);

// —— Detail drawer
const drawerVisible = ref(false);
const detailLoading = ref(false);
const hostDetail = ref<any>({});

// —— Selected state (ID set)
const idSelectedSet = computed(() => new Set(selectedIds.value));
const selectedCount = computed(() => selectedIds.value.length);
// enrichedDisplayHosts: backfill selectedHosts with current page tableData; all internal display uses this
const enrichedDisplayHosts = computed(() => {
  // Type-insensitive Map keys: normalize to String, avoid Number/String mismatch
  const rowMap = new Map<string, any>(
    (tableData.value || [])
      .filter((r) => r && r.id != null)
      .map((r) => [String(r.id), r] as const)
  );
  return (selectedHosts.value || []).map((h: any) => {
    if (!h || h.id == null) return h;
    const full = rowMap.get(String(h.id));
    if (!full) return h;
    // Find row with same id: use tableData full row as base, then fill in h's unique fields
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

// —— Parse paginated list response, support multiple structures
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

// —— Fetch list
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
    ElMessage.error(e?.message || t('message.pages.opsScript.hostErrLoadFail'));
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

// —— Selected id set (type-insensitive: convert all selectedIds to String for comparison)
const selectedIdsStringSet = computed(
  () => new Set((selectedIds.value || []).filter((v) => v != null).map((v) => String(v)))
);
// —— Auto-check current page data based on selectedIds (single reflection entry point)
const restoreSelection = () => {
  if (!mountedDone.value) return;
  const table = tableRef.value;
  if (!table || typeof table.toggleRowSelection !== 'function') return;
  if (!tableData.value || tableData.value.length === 0) {
    // Current page is empty; if there are selected placeholder objects in memory, try to find previous full rows (cached in selectedHosts) and leave them alone
    return;
  }
  if (selectedIds.value.length === 0) {
    try { table.clearSelection?.(); } catch (_) { /* noop */ }
    // Sync: clear selectedHosts (avoid leftover placeholders)
    const idSet = new Set<string>();
    selectedHosts.value = selectedHosts.value.filter(
      (h) => h?.id != null && idSet.add(String(h.id)) && false // Clear but preserve reference
    );
    return;
  }
  try {
    table.clearSelection?.();
  } catch (_) { /* noop */ }
  // First build current page full row cache
  const curPageMap = new Map<string, any>();
  for (const row of tableData.value) {
    if (row == null || row.id == null) continue;
    curPageMap.set(String(row.id), row);
  }
  // UI check + collect full rows of checked items on current page
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
  // —— Key: merge current page full rows back into selectedHosts, replace {id} placeholder objects
  const prevMap = new Map<string, any>(
    (selectedHosts.value || []).filter((h) => h && h.id != null).map((h) => [String(h.id), h] as const)
  );
  const nextHosts: any[] = [];
  const seen = new Set<string>();
  // Iterate all ids in memory (preserve original order), replace each with full row
  for (const oldHost of selectedHosts.value || []) {
    if (!oldHost || oldHost.id == null) continue;
    const k = String(oldHost.id);
    if (seen.has(k)) continue;
    seen.add(k);
    const cur = curPageMap.get(k);
    if (cur) {
      // Current page has full row: use full row as base, fill in old object's unique fields
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

// —— Search & Reset & Refresh
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

// —— Reflection lock: when restoreSelection manually changes selection, prevent onSelectionChange from writing back causing a loop
const restoreInProgress = ref(false);

// —— Backfill selectedHosts with current tableData full rows, avoid emitting {id} placeholder objects
// (Internal display uniformly uses enrichedDisplayHosts computed; this is only for pre-emit copy)
const enrichSelectedHosts = () => [...enrichedDisplayHosts.value];
const emitEnrichedSelect = () => {
  const enriched = enrichSelectedHosts();
  const ids = enriched.filter((h) => h && h.id != null).map((h) => h.id);
  emits('select', ids, enriched);
};

// —— Selection changed (UI check → write to truth source selectedIds)
const onSelectionChange = (rows: any[]) => {
  if (restoreInProgress.value) return;
  // Hosts selected on other pages (not in current page tableData) are preserved
  const otherPageSelected = selectedHosts.value.filter(
    (h) => h?.id != null && !tableData.value.find((r) => r?.id === h.id)
  );
  const validRows = (rows || []).filter((r) => r?.id != null);
  selectedHosts.value = [...otherPageSelected, ...validRows];
  selectedIds.value = selectedHosts.value.map((h) => h.id).filter((v) => v != null);
  emitEnrichedSelect();
};

// —— Sync when external selectedHostIds changes (parent changes default selection)
// Note: no longer immediate, initial init triggered uniformly by onMounted
watch(
  () => props.selectedHostIds,
  (newIds: any[]) => {
    const ids = Array.isArray(newIds) ? newIds.filter((v) => v != null) : [];
    selectedIds.value = [...ids];
    // Sync selectedHosts: keep those with existing details, otherwise placeholder { id }
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

// —— Quick: single-row "select/deselect" (uniformly change truth source, then reflect via restoreSelection)
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
    const displayName = row.host_name || row.host_ip || row.id;
    ElMessage.success(t('message.pages.opsScript.hostSelectedMsg', { name: displayName }));
  }
  emitEnrichedSelect();
  nextTick(() => {
    restoreInProgress.value = true;
    try { restoreSelection(); } finally { restoreInProgress.value = false; }
  });
};

// —— Summary bar operations (uniformly change truth source, restoreSelection reflects uniformly)
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
  ElMessage.info(t('message.pages.opsScript.hostClearSelected'));
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
    ElMessage.warning(t('message.pages.opsScript.hostSelectAtLeastOne'));
    return;
  }
  const enriched = enrichSelectedHosts();
  const ids = enriched.filter((h) => h && h.id != null).map((h) => h.id);
  emits('confirm', ids, enriched);
};

// —— Host display label formatting
const hostTagLabel = (h: any) => {
  if (!h) return '';
  const sub = h.host_ip || h.identifier || `#${h.id}`;
  if (h.host_name) return `${h.host_name} (${sub})`;
  return String(sub);
};
const dictFind = (dict: { id: any; text: string; color?: string }[], val: any) =>
  dict.find((d) => d.id === val);
const hostTypeLabel = (val: any) => {
  if (val === null || val === undefined || val === '') return t('message.pages.opsScript.hostDash');
  const item = hostTypeDict.value.find((d) => d.value === val);
  if (item) return item.label;
  return String(val);
};

// Approval status tag
const approvalTagMeta = (val: any) => {
  const d = dictFind(approvalStatusDict.value, val);
  if (!d) return { text: t('message.pages.opsScript.hostUnknown'), type: 'info' as any, icon: InfoFilled };
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
  if (!d) return { text: t('message.pages.opsScript.hostUnknown'), type: 'info' as any };
  return { text: d.text, type: (d.color || 'info') as any };
};
const certificateStatusMeta = (val: any) => {
  const d = certificateStatusDict.value.find((x) => x.id === val);
  if (!d) return { text: t('message.pages.opsScript.hostUnknown'), type: 'info' as any };
  return { text: d.text, type: (d.color || 'info') as any };
};

// —— Detail data compatibility: support data.data nested structure
const resolveDetailData = (res: any) => {
  if (res && res.data && typeof res.data === 'object' && !Array.isArray(res.data) && res.data.id !== undefined) {
    return res.data;
  }
  if (res && res.data && res.data.data && typeof res.data.data === 'object' && res.data.data.id !== undefined) {
    return res.data.data;
  }
  return res || {};
};

// —— Row action: view detail
const onViewRow = async (row: any) => {
  if (!row) {
    ElMessage.warning(t('message.pages.opsScript.hostErrNoData'));
    return;
  }
  // HostViewSet uses lookup_field = 'host_uuid', detail API looks up by host_uuid
  const lookupKey = row.host_uuid ?? row.id;
  if (lookupKey == null || lookupKey === '') {
    ElMessage.warning(t('message.pages.opsScript.hostErrNoId'));
    return;
  }
  drawerVisible.value = true;
  detailLoading.value = true;
  hostDetail.value = { ...row };
  try {
    const res: any = await GetObj(lookupKey as any);
    hostDetail.value = resolveDetailData(res);
  } catch (e: any) {
    ElMessage.error(e?.message || t('message.pages.opsScript.hostErrDetailFail'));
  } finally {
    detailLoading.value = false;
  }
};

// —— Pagination changed
const onPageChange = (p: number) => {
  pageState.page = p;
  fetchList();
};
const onSizeChange = (s: number) => {
  pageState.limit = s;
  pageState.page = 1;
  fetchList();
};

// —— Height allocation
const mainAreaHeight = computed(() => {
  const summaryH = selectedCount.value > 0 ? 108 : 0;
  return props.height - 44 - 132 - 56 - 28 - summaryH;
});

// —— Shortcut: Enter to confirm
const onPanelKeydown = (ev: KeyboardEvent) => {
  if (ev.key === 'Enter' && ev.ctrlKey) confirmSelection();
};

// —— Table row style: highlight selected rows
const tableRowClassName = ({ row }: { row: any }) => {
  if (row && row.id != null && idSelectedSet.value.has(row.id)) {
    return 'row-selected-highlight';
  }
  return '';
};

// —— Initialize external default selection (one-shot, avoid watch immediate race condition)
const initExternalSelection = () => {
  const newIds = Array.isArray(props.selectedHostIds)
    ? props.selectedHostIds.filter((v) => v != null)
    : [];
  if (newIds.length === 0) return;
  selectedIds.value = [...newIds];
  selectedHosts.value = newIds.map((id) => ({ id }));
};

onMounted(async () => {
  // 1. First load external default selection (in-memory)
  initExternalSelection();
  // 2. Load dictionaries
  await fetchHostTypeDict();
  // 3. Fetch list (allow reflection only after DOM is mounted)
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
    <!-- 1 Top hint -->
    <div class="panel-header">
      <div class="header-left">
        <el-icon color="#409eff" :size="18"><Monitor /></el-icon>
        <span class="header-title">{{ t('message.pages.opsScript.hostPanelTitle') }}</span>
        <el-tag size="small" type="info" effect="plain" class="header-tip">
          {{ t('message.pages.opsScript.hostPanelTip') }}
        </el-tag>
      </div>
      <div class="header-right">
        <el-tag v-if="selectedCount > 0" type="success" effect="dark" size="small">
          {{ t('message.pages.opsScript.hostSelectedCount', { count: selectedCount }) }}
          <span v-if="onlineSelectedCount > 0">{{ t('message.pages.opsScript.hostOnlineCount', { count: onlineSelectedCount }) }}</span>
        </el-tag>
        <el-tag v-else size="small" type="info" effect="plain">
          {{ t('message.pages.opsScript.hostTotalCount', { count: pageState.total }) }}
        </el-tag>
      </div>
    </div>

    <!-- 2 Search area -->
    <div class="search-wrap">
      <el-form :model="searchForm" label-width="72px" size="small" @submit.prevent="onSearch">
        <el-row :gutter="10">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item :label="t('message.pages.opsScript.hostSearchKeyword')">
              <el-input
                v-model="searchForm.search"
                :placeholder="t('message.pages.opsScript.hostSearchKeywordPlaceholder')"
                clearable
                :prefix-icon="Search"
                @keyup.enter="onSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item :label="t('message.pages.opsScript.hostSearchIp')">
              <el-input
                v-model="searchForm.host_ip"
                :placeholder="t('message.pages.opsScript.hostSearchIpPlaceholder')"
                clearable
                @keyup.enter="onSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item :label="t('message.pages.opsScript.hostSearchUsername')">
              <el-input
                v-model="searchForm.host_username"
                :placeholder="t('message.pages.opsScript.hostSearchUsernamePlaceholder')"
                clearable
                :prefix-icon="User"
                @keyup.enter="onSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item :label="t('message.pages.opsScript.hostSearchType')">
              <el-select
                v-model="searchForm.host_type"
                :placeholder="t('message.pages.opsScript.hostSearchTypeAll')"
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
            <el-form-item :label="t('message.pages.opsScript.hostSearchApproval')">
              <el-select
                v-model="searchForm.status"
                :placeholder="t('message.pages.opsScript.hostSearchAllStatus')"
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
            <el-form-item :label="t('message.pages.opsScript.hostSearchOnline')">
              <el-select
                v-model="searchForm.online_status"
                :placeholder="t('message.pages.opsScript.hostSearchAllStatus')"
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
          <el-button type="primary" :icon="Search" size="small" @click="onSearch">{{ t('message.pages.opsScript.hostBtnSearch') }}</el-button>
          <el-button :icon="RefreshLeft" size="small" @click="onReset">{{ t('message.pages.opsScript.hostBtnReset') }}</el-button>
          <el-tooltip :content="t('message.pages.opsScript.hostBtnRefreshTip')" placement="top">
            <el-button :icon="Refresh" size="small" circle @click="onRefresh" />
          </el-tooltip>
        </div>
      </el-form>
    </div>

    <!-- 3 Table area -->
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

        <el-table-column prop="host_name" :label="t('message.pages.opsScript.hostColName')" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="cell-hostname">
              <el-icon color="#409eff" :size="16"><Monitor /></el-icon>
              <span class="hostname-text">{{ row.host_name || t('message.pages.opsScript.hostUnnamedHost') }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="host_ip" :label="t('message.pages.opsScript.hostColIp')" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="cell-ip">{{ row.host_ip || t('message.pages.opsScript.hostDash') }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="host_username" :label="t('message.pages.opsScript.hostColUsername')" width="110" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="cell-username">
              <el-icon color="#909399" :size="14"><User /></el-icon>
              {{ row.host_username || t('message.pages.opsScript.hostDash') }}
            </span>
          </template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsScript.hostColType')" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain" round>
              {{ hostTypeLabel(row.host_type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsScript.hostColApproval')" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="approvalTagMeta(row.status).type" effect="light" round>
              <el-icon style="vertical-align: -1px; margin-right: 2px" :size="12">
                <component :is="approvalTagMeta(row.status).icon" />
              </el-icon>
              {{ approvalTagMeta(row.status).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsScript.hostColOnline')" width="80" align="center">
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

        <el-table-column :label="t('message.pages.opsScript.hostColHeartbeat')" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.last_heartbeat_at" class="cell-heartbeat">
              <el-icon color="#909399" :size="13"><Calendar /></el-icon>
              <span>{{ row.last_heartbeat_at }}</span>
            </div>
            <span v-else class="cell-dim">{{ t('message.pages.opsScript.hostDash') }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="t('message.pages.opsScript.hostColAction')" width="130" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="idSelectedSet.has(row.id) ? 'warning' : 'success'"
              :icon="Check"
              link
              @click="quickToggleRow(row)"
            >
              {{ idSelectedSet.has(row.id) ? t('message.pages.opsScript.hostActionToggle') : t('message.pages.opsScript.hostActionSelect') }}
            </el-button>
            <el-button size="small" link type="primary" @click="onViewRow(row)">{{ t('message.pages.opsScript.hostActionDetail') }}</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty :description="t('message.pages.opsScript.hostTableEmpty')" :image-size="80">
            <el-button type="primary" :icon="RefreshLeft" size="small" @click="onRefresh">
              {{ t('message.pages.opsScript.hostReload') }}
            </el-button>
          </el-empty>
        </template>
      </el-table>

      <!-- Pagination -->
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

    <!-- 4 Bottom selection summary -->
    <transition name="summary-fade">
      <div v-if="selectedCount > 0" class="selected-summary">
        <div class="summary-info">
          <div class="summary-count-row">
            <el-tag type="primary" effect="dark" size="default" round>
              {{ t('message.pages.opsScript.hostSummarySelected', { count: selectedCount }) }}
            </el-tag>
            <el-tag v-if="onlineSelectedCount > 0" type="success" effect="light" size="small" round>
              {{ t('message.pages.opsScript.hostSummaryOnline', { count: onlineSelectedCount }) }}
            </el-tag>
            <el-tag
              v-if="selectedCount - onlineSelectedCount > 0"
              type="info"
              effect="light"
              size="small"
              round
            >
              {{ t('message.pages.opsScript.hostSummaryOffline', { count: selectedCount - onlineSelectedCount }) }}
            </el-tag>
            <el-button link type="danger" size="small" :icon="Remove" @click="clearAllSelected">
              {{ t('message.pages.opsScript.hostSummaryClearAll') }}
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
              {{ t('message.pages.opsScript.hostSummaryWait', { count: enrichedDisplayHosts.length }) }}
            </el-tag>
          </div>
        </div>
        <div class="summary-action">
          <el-button type="primary" size="large" @click="confirmSelection">
            <el-icon><Check /></el-icon>
            <span>{{ t('message.pages.opsScript.hostConfirmSelect') }}</span>
            <span class="shortcut-tip">(Ctrl+Enter)</span>
          </el-button>
        </div>
      </div>
    </transition>

    <!-- 5 Detail drawer -->
    <el-drawer
      v-model="drawerVisible"
      :title="t('message.pages.opsScript.hostDetailTitle')"
      direction="rtl"
      size="48%"
      :with-header="true"
      destroy-on-close
    >
      <template #header>
        <div class="drawer-header-custom">
          <el-icon color="#409eff" :size="20"><Monitor /></el-icon>
          <span class="drawer-title">{{ hostDetail.host_name || t('message.pages.opsScript.hostDetailTitle') }}</span>
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
        <!-- Host basic info -->
        <div class="detail-section">
          <div class="section-title">
            <el-icon color="#409eff"><InfoFilled /></el-icon>
            <span>{{ t('message.pages.opsScript.hostSectionBasic') }}</span>
          </div>
          <el-descriptions :column="1" border size="default" class="detail-descriptions">
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldId')">
              <span class="mono-text">{{ hostDetail.id ?? t('message.pages.opsScript.hostDash') }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldUuid')">
              <span class="mono-text small-text" v-if="hostDetail.host_uuid">
                {{ hostDetail.host_uuid }}
              </span>
              <span v-else>{{ t('message.pages.opsScript.hostDash') }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldName')">
              {{ hostDetail.host_name || t('message.pages.opsScript.hostDash') }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldIp')">
              <span class="mono-text" v-if="hostDetail.host_ip">{{ hostDetail.host_ip }}</span>
              <span v-else>{{ t('message.pages.opsScript.hostDash') }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldUsername')">
              <span class="mono-text" v-if="hostDetail.host_username">
                {{ hostDetail.host_username }}
              </span>
              <span v-else>{{ t('message.pages.opsScript.hostDash') }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldType')">
              <el-tag v-if="hostDetail.host_type" size="small" type="info" effect="plain" round>
                {{ hostTypeLabel(hostDetail.host_type) }}
              </el-tag>
              <span v-else>{{ t('message.pages.opsScript.hostDash') }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Status info -->
        <div class="detail-section">
          <div class="section-title">
            <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
            <span>{{ t('message.pages.opsScript.hostSectionStatus') }}</span>
          </div>
          <el-descriptions :column="2" border size="default" class="detail-descriptions">
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldApprovalStatus')">
              <el-tag :type="approvalTagMeta(hostDetail.status).type" effect="light" size="small">
                <el-icon style="vertical-align: -1px; margin-right: 2px" :size="12">
                  <component :is="approvalTagMeta(hostDetail.status).icon" />
                </el-icon>
                {{ approvalTagMeta(hostDetail.status).text }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldOnlineStatus')">
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
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldSupervisorVersion')">
              <span class="mono-text" v-if="hostDetail.supervisor_version">
                v{{ hostDetail.supervisor_version }}
              </span>
              <span v-else>{{ t('message.pages.opsScript.hostDash') }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldHeartbeat')">
              <div v-if="hostDetail.last_heartbeat_at" class="cell-heartbeat">
                <el-icon color="#909399" :size="13"><Calendar /></el-icon>
                <span>{{ hostDetail.last_heartbeat_at }}</span>
              </div>
              <span v-else class="cell-dim">{{ t('message.pages.opsScript.hostDash') }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Certificate info -->
        <div class="detail-section">
          <div class="section-title">
            <el-icon color="#e6a23c"><WarningFilled /></el-icon>
            <span>{{ t('message.pages.opsScript.hostSectionCert') }}</span>
          </div>
          <el-descriptions :column="1" border size="default" class="detail-descriptions">
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldCertSerial')">
              <span class="mono-text small-text" v-if="hostDetail.certificate_serial">
                {{ hostDetail.certificate_serial }}
              </span>
              <span v-else>{{ t('message.pages.opsScript.hostDash') }}</span>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldCertStatus')">
              <el-tag
                :type="certificateStatusMeta(hostDetail.certificate_status).type"
                effect="light"
                size="small"
              >
                {{ certificateStatusMeta(hostDetail.certificate_status).text }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldCertRevokedAt')" v-if="hostDetail.certificate_revoked_at">
              {{ hostDetail.certificate_revoked_at }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldCertRevocationReason')" v-if="hostDetail.certificate_revocation_reason">
              {{ hostDetail.certificate_revocation_reason }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Heartbeat server -->
        <div class="detail-section" v-if="hostDetail.heartbeat_server || hostDetail.create_datetime">
          <div class="section-title">
            <el-icon color="#909399"><Calendar /></el-icon>
            <span>{{ t('message.pages.opsScript.hostSectionOther') }}</span>
          </div>
          <el-descriptions :column="1" border size="default" class="detail-descriptions">
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldHeartbeatServer')" v-if="hostDetail.heartbeat_server">
              <template v-if="typeof hostDetail.heartbeat_server === 'object'">
                {{ hostDetail.heartbeat_server.name || hostDetail.heartbeat_server.id || t('message.pages.opsScript.hostDash') }}
              </template>
              <template v-else>
                <span class="mono-text">{{ hostDetail.heartbeat_server }}</span>
              </template>
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldCreateTime')" v-if="hostDetail.create_datetime">
              {{ hostDetail.create_datetime }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldUpdateTime')" v-if="hostDetail.update_datetime">
              {{ hostDetail.update_datetime }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('message.pages.opsScript.hostFieldCreatedBy')" v-if="hostDetail.created_by">
              <template v-if="typeof hostDetail.created_by === 'object'">
                {{ hostDetail.created_by.username || hostDetail.created_by.name || hostDetail.created_by.id }}
              </template>
              <template v-else>
                <span class="mono-text">{{ hostDetail.created_by }}</span>
              </template>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Extra info JSON -->
        <div class="detail-section" v-if="hostDetail.extra_info && Object.keys(hostDetail.extra_info).length > 0">
          <div class="section-title">
            <el-icon color="#909399"><InfoFilled /></el-icon>
            <span>{{ t('message.pages.opsScript.hostSectionExtra') }}</span>
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

  /* 1 Top title bar */
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

  /* 2 Search area */
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
        margin-left: 0; /* Uniform spacing controlled by gap */
      }
    }
  }

  /* 3 Table area */
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

  /* 4 Bottom summary bar */
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

  /* Detail drawer */
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
