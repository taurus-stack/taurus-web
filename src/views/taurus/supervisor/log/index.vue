<template>
  <fs-page>
    <fs-crud ref="crudRef" v-bind="crudBinding">
      <template #actionbar-right>
        <el-button-group>
          <el-button type="success" size="default" @click="showCollectDialog = true">
            <template #icon><fs-iconify icon="ion:play"></fs-iconify></template>
            {{ t('logStartCollect') }}
          </el-button>
          <el-button type="danger" size="default" @click="handleStopCollect">
            <template #icon><fs-iconify icon="ion:stop"></fs-iconify></template>
            {{ t('logStopCollect') }}
          </el-button>
          <el-button type="info" size="default" @click="handleToggleAutoRefresh">
            <template #icon>
              <fs-iconify :icon="autoRefresh ? 'ion:pause' : 'ion:play'"></fs-iconify>
            </template>
            {{ autoRefresh ? t('logStopRefresh') : t('logAutoRefresh') }}
          </el-button>
        </el-button-group>
      </template>
    </fs-crud>

    <!-- Log collection config dialog -->
    <el-dialog
      v-model="showCollectDialog"
      :title="t('logCollectConfig')"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="collectForm" label-width="120px">
        <el-form-item v-if="!collectForm.host" :label="t('logHostLabel')">
          <el-select v-model="collectForm.host" :placeholder="t('logHostPlaceholder')" style="width: 100%">
            <el-option
              v-for="item in hostList"
              :key="item.id"
              :label="item.host_name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-else :label="t('logHostLabel')">
          <el-tag type="success" size="large">{{ collectForm.host_name }}</el-tag>
        </el-form-item>
        <el-form-item :label="t('logMinLevel')">
          <el-select v-model="collectForm.min_level" style="width: 100%">
            <el-option label="DEBUG" value="DEBUG" />
            <el-option label="INFO" value="INFO" />
            <el-option label="WARNING" value="WARNING" />
            <el-option label="ERROR" value="ERROR" />
            <el-option label="CRITICAL" value="CRITICAL" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('logProgramName')">
          <el-input v-model="collectForm.programs_str" :placeholder="t('logProgramPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('logCollectDuration')">
          <el-input-number v-model="collectForm.duration" :min="0" :max="7200" :step="300" />
          <span style="margin-left: 8px; color: #909399; font-size: 12px;">{{ t('logDurationHint') }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCollectDialog = false">{{ t('cancel') }}</el-button>
        <el-button type="primary" @click="handleStartCollect" :loading="collectLoading">{{ t('ok') }}</el-button>
      </template>
    </el-dialog>
  </fs-page>
</template>

<script lang="ts" setup name="supervisor-log">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { useFs } from '@fast-crud/fast-crud';
import { createCrudOptions } from './crud';
import * as logApi from '/@/api/taurus/supervisor/log';
import * as logCommandApi from '/@/api/taurus/supervisor/log_command';
import { request } from '/@/utils/service';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRoute } from 'vue-router';

const route = useRoute();
const { crudBinding, crudRef, crudExpose } = useFs({ createCrudOptions });

// Get host info from URL query params
const urlHostId = route.query.host_id as string;
const urlHostName = route.query.host_name as string;

// Auto-refresh
const autoRefresh = ref(false);
let refreshTimer: ReturnType<typeof setInterval> | null = null;

function handleToggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value;
  if (autoRefresh.value) {
    refreshTimer = setInterval(() => {
      crudExpose.doRefresh();
    }, 5000);
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }
}

// Host list (for selection when no host specified)
const hostList = ref<any[]>([]);

// Collection dialog
const showCollectDialog = ref(false);
const collectLoading = ref(false);
const collectForm = ref({
  host: urlHostId ? parseInt(urlHostId) : undefined as number | undefined,
  host_name: urlHostName || '',
  min_level: 'INFO',
  programs_str: '',
  duration: 1800,
});

// Load host list
async function loadHostList() {
  try {
    const res = await request({ url: '/api/taurus/host/', method: 'get', params: { limit: 100 } });
    hostList.value = res.data || [];
  } catch (e) {
    // ignore
  }
}

// Start collection
async function handleStartCollect() {
  if (!collectForm.value.host) {
    ElMessage.warning(t('logHostPlaceholder'));
    return;
  }
  collectLoading.value = true;
  try {
    const programs = collectForm.value.programs_str
      ? collectForm.value.programs_str.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    await logCommandApi.AddObj({
      host: collectForm.value.host,
      action: 'start',
      min_level: collectForm.value.min_level,
      programs: programs,
      duration: collectForm.value.duration,
    });
    ElMessage.success(t('msgCollectStart'));
    showCollectDialog.value = false;
  } catch (e: any) {
    ElMessage.error(e.message || t('msgCollectFail'));
  } finally {
    collectLoading.value = false;
  }
}

// Stop collection
async function handleStopCollect() {
  if (!collectForm.value.host) {
    ElMessage.warning(t('logHostPlaceholder'));
    return;
  }
  try {
    await ElMessageBox.confirm(t('msgCollectStopConfirmMsg'), t('msgCollectStopConfirmTitle'), { type: 'warning' });
    await logCommandApi.AddObj({
      host: collectForm.value.host,
      action: 'stop',
      min_level: 'INFO',
      programs: [],
      duration: 0,
    });
    ElMessage.success(t('msgCollectStopped'));
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || t('msgCollectFail'));
    }
  }
}

onMounted(() => {
  crudExpose.doRefresh();
  loadHostList();
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>
