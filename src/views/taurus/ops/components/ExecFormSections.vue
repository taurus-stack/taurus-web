<template>
  <el-form :model="normalizedForm" label-width="auto" class="exec-form-sections">
    <ExecutionContentSection
      v-model:form="form"
      execution-type-mode="display"
    />

    <ExecModeSelector v-model="execModeSubset" />

    <CustomParamsEditor ref="paramsEditorRef" :args-json="argsJsonRef" />

    <ExecAdvancedSettings v-model="form" />
  </el-form>
</template>

<script setup lang="ts">
import { ref, computed, toRef, watch } from 'vue';
import type { RerunFormData } from './historyUtils';
import ExecutionContentSection from './ExecutionContentSection.vue';
import ExecModeSelector from './ExecModeSelector.vue';
import CustomParamsEditor from './CustomParamsEditor.vue';
import ExecAdvancedSettings from './ExecAdvancedSettings.vue';

const props = defineProps<{
  form: RerunFormData;
}>();

const emit = defineEmits<{
  (e: 'update:form', value: RerunFormData): void;
}>();

const form = computed({
  get: () => props.form,
  set: (val) => emit('update:form', val),
});

const normalizedForm = computed(() => {
  const result: any = { ...props.form };
  if (!result.execution_type) {
    result.execution_type = result.script_content ? 'script' : 'command';
  }
  return result;
});

const paramsEditorRef = ref<InstanceType<typeof CustomParamsEditor> | null>(null);

const argsJsonRef = toRef(form, 'args_json') as any as { value: string };

const execModeSubset = computed({
  get: () => ({
    exec_mode: form.value.exec_mode,
    concurrent: form.value.concurrent,
    fail_strategy: form.value.fail_strategy,
    pilot_count: form.value.pilot_count,
    pilot_success_rate: form.value.pilot_success_rate,
  }),
  set: (val) => {
    emit('update:form', { ...form.value, ...val });
  },
});

watch(() => props.form, (newVal) => {
  if (!newVal.execution_type) {
    const nextType = newVal.script_content ? 'script' : 'command';
    emit('update:form', { ...newVal, execution_type: nextType });
  }
}, { immediate: true });

defineExpose({
  syncArgsToForm: () => {
    if (paramsEditorRef.value?.syncArgsToForm) {
      paramsEditorRef.value.syncArgsToForm();
    }
  },
});
</script>

<style scoped lang="scss">
.exec-form-sections {
  :deep(.el-form-item) {
    margin-bottom: 10px;
  }

  :deep(.el-form-item__label) {
    color: #606266;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }
}
</style>