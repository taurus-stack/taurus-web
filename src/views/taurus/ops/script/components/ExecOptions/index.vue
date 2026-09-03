<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface ExecOptionsData {
  working_directory: string;
  load_profile: string;
  merge_streams: boolean;
  privileged: boolean;
  su_user: string;
  su_password: string;
}

const props = defineProps<{
  modelValue: ExecOptionsData;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: ExecOptionsData): void;
}>();

const showDialog = ref(false);
const tempData = ref<ExecOptionsData>({ ...props.modelValue });

watch(
  () => props.modelValue,
  (val) => {
    tempData.value = { ...val };
  },
  { immediate: true, deep: true }
);

function openDialog() {
  tempData.value = { ...props.modelValue };
  showDialog.value = true;
}

function handleSave() {
  emit('update:modelValue', { ...tempData.value });
  showDialog.value = false;
}

const activeCount = computed(() => {
  let count = 0;
  if (tempData.value.working_directory?.trim()) count++;
  if (tempData.value.load_profile !== 'false') count++;
  if (tempData.value.merge_streams) count++;
  if (tempData.value.privileged) count++;
  return count;
});
</script>

<template>
  <div>
    <el-button size="large" @click="openDialog">
      <template #icon>
        <fs-iconify icon="ion:settings-outline" />
      </template>
      {{ t('message.pages.opsScript.execBtn') }}
      <el-tag v-if="activeCount > 0" size="small" type="danger" effect="dark" round style="margin-left: 6px">
        {{ activeCount }}
      </el-tag>
    </el-button>

    <el-dialog v-model="showDialog" :title="t('message.pages.opsScript.execDialogTitle')" width="520px" :close-on-click-modal="false">
      <el-form label-width="90px">
        <el-form-item :label="t('message.pages.opsScript.execWorkdirLabel')">
          <el-input v-model="tempData.working_directory" :placeholder="t('message.pages.opsScript.execWorkdirPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('message.pages.opsScript.execLoadProfileLabel')">
          <el-select v-model="tempData.load_profile" style="width: 100%">
            <el-option :label="t('message.pages.opsScript.execLoadClean')" value="false" />
            <el-option :label="t('message.pages.opsScript.execLoadBashrc')" value="true" />
            <el-option label="Login Shell" value="login" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('message.pages.opsScript.execMergeLabel')">
          <el-switch v-model="tempData.merge_streams" />
          <span style="margin-left: 8px; font-size: 12px; color: #909399">{{ t('message.pages.opsScript.execMergeHint') }}</span>
        </el-form-item>
        <el-form-item :label="t('message.pages.opsScript.execPrivilegedLabel')">
          <el-switch v-model="tempData.privileged" />
        </el-form-item>
        <template v-if="tempData.privileged">
          <el-form-item :label="t('message.pages.opsScript.execSuUserLabel')">
            <el-input v-model="tempData.su_user" :placeholder="t('message.pages.opsScript.execSuUserPlaceholder')" />
          </el-form-item>
          <el-form-item :label="t('message.pages.opsScript.execSuPasswordLabel')">
            <el-input v-model="tempData.su_password" type="password" show-password :placeholder="t('message.pages.opsScript.execSuPasswordPlaceholder')" />
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">{{ t('message.pages.opsScript.execCancel') }}</el-button>
        <el-button type="primary" @click="handleSave">{{ t('message.pages.opsScript.execSave') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
</style>
