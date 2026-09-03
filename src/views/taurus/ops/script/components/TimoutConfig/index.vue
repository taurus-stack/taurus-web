<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  modelValue: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: number): void;
}>();

const showDialog = ref(false);
const tempData = ref(0);

watch(
  () => props.modelValue, (val) => {
    tempData.value = val ?? 0;
  }, { immediate: true }
);

function openDialog() {
  tempData.value = props.modelValue ?? 0;
  showDialog.value = true;
}

function handleSave() {
  emit('update:modelValue', tempData.value);
  showDialog.value = false;
}
</script>

<template>
  <div>
    <el-button size="large" @click="openDialog">
      <template #icon>
        <fs-iconify icon="ion:time-outline" />
      </template>
      {{ t('message.pages.opsScript.timeoutBtn') }}
      <el-tag v-if="tempData > 0" size="small" type="danger" effect="dark" round style="margin-left: 6px">
        {{ tempData }} {{ t('message.pages.opsScript.timeoutUnit') }}
      </el-tag>
    </el-button>

    <el-dialog v-model="showDialog" :title="t('message.pages.opsScript.timeoutDialogTitle')" width="420px" :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item :label="t('message.pages.opsScript.timeoutLabel')">
          <el-input-number
            v-model="tempData" :min="0" style="width: 220px">
            <template #append>{{ t('message.pages.opsScript.timeoutUnit') }}</template>
          </el-input-number>
        </el-form-item>
        <el-form-item :label="t('message.pages.opsScript.timeoutDescLabel')">
          <div style="font-size: 12px; color: #909399; line-height: 1.5">
            {{ t('message.pages.opsScript.timeoutDesc') }}
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">{{ t('message.pages.opsScript.timeoutCancel') }}</el-button>
        <el-button type="primary" @click="handleSave">{{ t('message.pages.opsScript.timeoutSave') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
</style>
