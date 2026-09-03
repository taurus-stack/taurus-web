<template>
  <el-dialog
    v-model="visible"
    :title="t('message.pages.opsExecution.hostSelectDialog.title')"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
    top="5vh"
    class="host-select-dialog"
  >
    <CommonHostSelector
      ref="selectorRef"
      :height="dialogHeight"
      @select="handleSelect"
      @confirm="handleInnerConfirm"
      :selected-host-ids="effectiveSelectedHostIds"
    />
    <template #footer>
      <el-button @click="visible = false">{{ t('message.pages.opsExecution.hostSelectDialog.cancel') }}</el-button>
      <el-button type="primary" @click="handleConfirm">{{ t('message.pages.opsExecution.hostSelectDialog.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CommonHostSelector from './CommonHostSelector.vue';

const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
  selectedHostIds?: string[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'confirm', hosts: any[]): void;
  (e: 'select', hosts: any[]): void;
}>();

const selectorRef = ref<any>(null);
const dialogHeight = 620;

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const tempHosts = ref<any[]>([]);

const effectiveSelectedHostIds = computed(() => props.selectedHostIds || []);

const handleSelect = (_ids: any[], hosts: any[]) => {
  tempHosts.value = hosts;
  emit('select', hosts);
};

const handleInnerConfirm = (_ids: any[], hosts: any[]) => {
  tempHosts.value = hosts;
  handleConfirm();
};

const handleConfirm = () => {
  visible.value = false;
  emit('confirm', tempHosts.value);
};
</script>

<style scoped lang="scss">
.host-select-dialog {
  :deep(.el-dialog) {
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }
  :deep(.el-dialog__body) {
    padding: 10px 14px;
    flex: 1;
    overflow: hidden;
  }
}
</style>