<template>
  <div class="host-selector">
    <!-- Filter bar -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        :placeholder="t('hostSearchPlaceholder')"
        clearable
        prefix-icon="Search"
        style="width: 300px"
        @keyup.enter="handleSearch"
      />
      <el-select
        v-model="statusFilter"
        :placeholder="t('hostStatusFilter')"
        clearable
        style="width: 120px; margin-left: 12px"
        @change="handleSearch"
      >
        <el-option :label="t('all')" value="" />
        <el-option :label="t('online')" :value="1" />
        <el-option :label="t('offline')" :value="0" />
      </el-select>
      <el-button type="primary" style="margin-left: 12px" @click="handleSearch">{{ t('search') }}</el-button>
    </div>

    <el-table
      :data="hosts"
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="host_name" :label="t('hostName')" width="200" />
      <el-table-column prop="host_ip" :label="t('ipAddr')" width="150" />
      <el-table-column prop="host_type" :label="t('type')" width="100" />
      <el-table-column prop="online_status" :label="t('colStatus')" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.online_status === 1 ? 'success' : 'danger'" size="small">
            {{ scope.row.online_status === 1 ? t('online') : t('offline') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" :label="t('remark')" show-overflow-tooltip />
    </el-table>

    <!-- Pagination -->
    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadHosts"
        @current-change="loadHosts"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { GetList } from '/@/api/taurus/host/api';
import { ElMessage } from 'element-plus';

interface Host {
  id: string;
  host_uuid: string;
  host_name: string;
  host_ip: string;
  host_type: string;
  online_status: number;
  remark?: string;
}

const props = defineProps<{
  selectedHostIds?: string[];
}>();

const emit = defineEmits<{
  (e: 'select', hosts: Host[]): void;
}>();

const hosts = ref<Host[]>([]);
const loading = ref(false);
const selectedHosts = ref<Host[]>([]);
const searchKeyword = ref('');
const statusFilter = ref<number | ''>('');

// Pagination related
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

watch(() => props.selectedHostIds, (newIds) => {
  if (newIds && newIds.length > 0) {
    selectedHosts.value = hosts.value.filter(h => newIds.includes(h.id));
  }
}, { immediate: true });

const handleSearch = () => {
  currentPage.value = 1;
  loadHosts();
};

const loadHosts = async () => {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: pageSize.value,
    };

    // Add search condition
    if (searchKeyword.value) {
      params.search = searchKeyword.value;
    }

    // Add status filter
    if (statusFilter.value !== '') {
      params.online_status = statusFilter.value;
    }

    const res = await GetList(params);
    // Process paginated response data
    if (res.data) {
      // Support two response formats: { data: { items: [], total: 0 } } or { data: [], total: 0 }
      if (Array.isArray(res.data)) {
        hosts.value = res.data;
        total.value = res.total || res.data.length;
      } else if (res.data.items) {
        hosts.value = res.data.items;
        total.value = res.data.total || 0;
      } else {
        hosts.value = res.data.data || [];
        total.value = res.data.total || 0;
      }
    }
  } catch (error: any) {
    ElMessage.error(t('msgHostLoadFail'));
  } finally {
    loading.value = false;
  }
};

const handleSelectionChange = (selectedItems: Host[]) => {
  const validHosts = selectedItems.filter(h => h.online_status === 1);
  if (validHosts.length !== selectedItems.length) {
    ElMessage.warning(t('msgFilterOffline'));
  }
  selectedHosts.value = validHosts;
  emit('select', validHosts);
};

onMounted(() => {
  loadHosts();
});
</script>

<style scoped lang="scss">
.host-selector {
  height: 500px;
  display: flex;
  flex-direction: column;
}

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-table) {
  flex: 1;
  overflow: auto;

  .disabled-row {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}
</style>