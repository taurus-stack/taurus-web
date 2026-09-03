<template>
  <fs-page>
    <fs-crud ref="crudRef" v-bind="crudBinding">
      <template #actionbar-right>
        <el-button type="info" @click="showExecutions = true">{{ t('message.pages.schedule.btnViewExecutions') }}</el-button>
      </template>
    </fs-crud>

    <!-- Execution records dialog -->
    <el-dialog
      v-model="showExecutions"
      :title="t('message.pages.schedule.execDialogTitle')"
      width="80%"
    >
      <el-table :data="executionList" v-loading="executionLoading">
        <el-table-column prop="id" :label="t('message.pages.schedule.execColId')" width="60" />
        <el-table-column prop="schedule_name" :label="t('message.pages.schedule.execColScheduleName')" width="150" />
        <el-table-column prop="status_display" :label="t('message.pages.schedule.execColStatus')" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" :label="t('message.pages.schedule.execColStartTime')" width="180" />
        <el-table-column prop="end_time" :label="t('message.pages.schedule.execColEndTime')" width="180" />
        <el-table-column prop="error_message" :label="t('message.pages.schedule.execColErrorMessage')" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </fs-page>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useFs } from '@fast-crud/fast-crud';
import { createCrudOptions } from './crud';
import * as api from '../../../api/taurus/schedule/api';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const showExecutions = ref(false);
const executionList = ref([]);
const executionLoading = ref(false);

const getStatusType = (status: number) => {
  const types: Record<number, string> = {
    0: 'info',
    1: 'primary',
    2: 'success',
    3: 'danger',
  };
  return types[status] || 'info';
};

const { crudBinding, crudRef } = useFs({ createCrudOptions });

onMounted(() => {
  // Listen for execution records dialog open
  const watchExecutions = async () => {
    if (showExecutions.value) {
      executionLoading.value = true;
      try {
        const res = await api.GetList({ limit: 50 });
        executionList.value = res.data || [];
      } catch (e) {
        ElMessage.error(t('message.pages.schedule.msgLoadExecutionsFailed'));
      } finally {
        executionLoading.value = false;
      }
    }
  };
});
</script>
