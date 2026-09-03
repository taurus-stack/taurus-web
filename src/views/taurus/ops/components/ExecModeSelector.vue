<template>
  <SectionBlock v-if="wrapSection" :title="sectionTitle || t('execStrategyLabel')" :icon="sectionIcon || Operation">
    <template #default>
      <ExecModeInner :model-value="modelValue" @update:model-value="innerUpdate" />
    </template>
  </SectionBlock>
  <template v-else>
    <ExecModeInner
      :model-value="modelValue"
      @update:model-value="innerUpdate"
      :label="label"
      :concurrent-label="concurrentLabel"
      :pilot-count-label="pilotCountLabel"
      :pilot-success-label="pilotSuccessLabel"
      :pilot-concurrent-label="pilotConcurrentLabel"
      :fail-strategy-label="failStrategyLabel"
    />
  </template>
</template>

<script setup lang="ts">
import { Operation } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import SectionBlock from './SectionBlock.vue';
import ExecModeInner from './ExecModeSelectorInner.vue';
import type { RerunFormData } from './historyUtils';

const props = withDefaults(defineProps<{
  modelValue: Pick<RerunFormData, 'exec_mode' | 'concurrent' | 'fail_strategy' | 'pilot_count' | 'pilot_success_rate'>;
  wrapSection?: boolean;
  sectionTitle?: string;
  sectionIcon?: any;
  label?: string;
  concurrentLabel?: string;
  pilotCountLabel?: string;
  pilotSuccessLabel?: string;
  pilotConcurrentLabel?: string;
  failStrategyLabel?: string;
}>(), {
  wrapSection: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: Partial<RerunFormData>): void;
}>();

function innerUpdate(val: Partial<RerunFormData>) {
  emit('update:modelValue', val);
}
</script>