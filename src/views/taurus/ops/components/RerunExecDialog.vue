<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    :width="isBatch ? '780px' : '680px'"
    :close-on-click-modal="false"
    destroy-on-close
    top="5vh"
    class="rerun-exec-dialog"
  >
    <!-- Batch mode: host table + overwrite hint -->
    <template v-if="isBatch">
      <BatchHostTable v-model="items" :template-item="templateItem" />

      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px" size="small">
        {{ t('rerunAlertHint') }}
      </el-alert>

      <el-form :model="form" label-width="auto" label-position="right" class="rerun-form" size="small">
        <ExecutionContentSection
          v-model:form="form"
          :command-placeholder="t('rerunCmdPh')"
          :script-placeholder="t('rerunScriptPh')"
        />

        <ExecModeSelector v-model="execModeSubset" />

        <CustomParamsEditor
          ref="paramsEditorRef"
          :args-json="argsJsonRef"
          :empty-text="t('rerunEmptyNoOverride')"
          :preview-empty-text="t('rerunEmptyPreview')"
        />

        <ExecAdvancedSettings
          v-model="form"
          tri-state
          :fallback-record="templateItem"
          :work-dir-placeholder="t('rerunWorkDirPh')"
          :timeout-placeholder="t('rerunTimeoutPh')"
          :timeout-hint="t('rerunTimeoutHint')"
          :env-placeholder="t('rerunEnvPh')"
          :timeout-max="86400"
        />
      </el-form>
    </template>

    <!-- Single mode: target host info + form -->
    <template v-else>
      <TargetHostInfoBar
        :display-text="hostDisplayText"
        :tag-type="row && row._isBatch ? 'warning' : 'info'"
      />

      <ExecFormSections ref="execFormRef" v-model:form="form" />
    </template>

    <template #footer>
      <el-button @click="visible = false">{{ t('cancel') }}</el-button>
      <el-button
        type="primary"
        :disabled="isBatch && items.length === 0"
        @click="handleSubmit"
      >
        {{ isBatch ? t('confirmExecuteN', {n: items.length}) : t('confirmExecute') }}
      </el-button>
    </template>
  </el-dialog>

  <!-- Batch mode: confirmation dialog -->
  <ExecutionConfirmDialog
    v-if="isBatch"
    v-model="showConfirm"
    :title="t('rerunConfirmExecHosts', {count: items.length})"
    :data="confirmData"
    @confirm="doSubmit"
  />
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { ref, computed, watch, toRef } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
import { ElMessage } from 'element-plus';
import {
  fillRerunFormFromRecord,
  fillBatchRerunFormFromRecord,
  validateAndParseEnvironment,
  createDefaultRerunForm,
  type RerunFormData
} from './historyUtils';
import TargetHostInfoBar from './TargetHostInfoBar.vue';
import ExecFormSections from './ExecFormSections.vue';
import BatchHostTable from './BatchHostTable.vue';
import ExecutionContentSection from './ExecutionContentSection.vue';
import ExecModeSelector from './ExecModeSelector.vue';
import CustomParamsEditor from './CustomParamsEditor.vue';
import ExecAdvancedSettings from './ExecAdvancedSettings.vue';
import ExecutionConfirmDialog from './ExecutionConfirmDialog.vue';

const props = defineProps<{
  modelValue: boolean;
  row?: any;
  items?: any[];
  form?: RerunFormData;
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'submit', form: RerunFormData, payload: any): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const isBatch = computed(() => (props.items?.length ?? 0) > 0);

const items = ref<any[]>([]);
const form = ref<RerunFormData>(createDefaultRerunForm());
const execFormRef = ref<InstanceType<typeof ExecFormSections> | null>(null);
const paramsEditorRef = ref<InstanceType<typeof CustomParamsEditor> | null>(null);
const showConfirm = ref(false);

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
    Object.assign(form.value, val);
  },
});

const templateItem = computed(() => items.value[0] || {});

const dialogTitle = computed(() => {
  if (props.title) return props.title;
  if (isBatch.value) {
    const ids = (props.items || []).map((item) => item.execution_id).filter(Boolean);
    if (ids.length === 0) return t('rerunTitleBatch');
    if (ids.length === 1) return t('rerunTitleSingle', { id: ids[0] });
    return t('rerunTitleBatchWithN', { n: ids.length });
  }
  const r = props.row;
  if (!r) return t('rerunTitleExecConfig');
  if (r._isBatch) return t('rerunTitleBatchRerun', { id: r.batch_id || '' });
  return t('rerunTitleRerun', { id: r.execution_id || t('rerunTask') });
});

const hostDisplayText = computed(() => {
  const r = props.row;
  if (!r) return '';
  if (r._isBatch) {
    const count = r._batchCount || r._batchSummary?.success || 0;
    const summary = r._batchSummary;
    if (summary) {
      const parts: string[] = [];
      if (summary.success) parts.push(t('rerunCountSuccess', { n: summary.success }));
      if (summary.failed) parts.push(t('rerunCountFailed', { n: summary.failed }));
      if (summary.interrupted) parts.push(t('rerunCountInterrupted', { n: summary.interrupted }));
      if (summary.running) parts.push(t('rerunCountRunning', { n: summary.running }));
      return t('rerunHosts', { count, summary: parts.join('、') });
    }
    return t('rerunHostsSimple', { count });
  }
  const name = r.host_name || r.host?.host_name || '';
  const ip = r.host_ip || r.host?.host_ip || '';
  return name + (ip ? ` (${ip})` : '');
});

function initializeForm() {
  if (props.form) {
    form.value = { ...props.form };
    return;
  }
  if (isBatch.value) {
    items.value = [...(props.items || [])];
    form.value = fillBatchRerunFormFromRecord(items.value[0]);
  } else if (props.row) {
    form.value = fillRerunFormFromRecord(props.row);
  }
}

watch(() => props.items, (val) => {
  if (val && val.length > 0) {
    items.value = [...val];
  }
}, { immediate: true });

watch(() => props.form, (newForm) => {
  if (newForm) {
    form.value = { ...newForm };
  }
});

watch(() => props.modelValue, (val) => {
  if (val) {
    initializeForm();
  }
});

const open = (newItemsOrRow: any, newForm?: RerunFormData) => {
  if (Array.isArray(newItemsOrRow)) {
    items.value = [...newItemsOrRow];
    if (newItemsOrRow.length > 0) {
      if (newForm) {
        form.value = { ...newForm };
      } else if (props.form) {
        form.value = { ...props.form };
      } else {
        form.value = fillBatchRerunFormFromRecord(newItemsOrRow[0]);
      }
    }
  } else {
    if (newForm) {
      form.value = { ...newForm };
    } else {
      form.value = fillRerunFormFromRecord(newItemsOrRow);
    }
  }
};

const doSubmit = () => {
  if (paramsEditorRef.value?.syncArgsToForm) {
    paramsEditorRef.value.syncArgsToForm();
  }
  const env = validateAndParseEnvironment(form.value.environment);
  if (env === null) {
    ElMessage.error(t('rerunMsgEnvFormat'));
    return;
  }
  emit('submit', form.value, isBatch.value ? items.value : props.row);
  visible.value = false;
};

const handleSubmit = () => {
  if (isBatch.value) {
    if (items.value.length === 0) {
      ElMessage.warning(t('rerunMsgNoTasks'));
      return;
    }
    if (paramsEditorRef.value?.syncArgsToForm) {
      paramsEditorRef.value.syncArgsToForm();
    }
    showConfirm.value = true;
    return;
  }
  if (execFormRef.value?.syncArgsToForm) {
    execFormRef.value.syncArgsToForm();
  }
  const env = validateAndParseEnvironment(form.value.environment);
  if (env === null) {
    ElMessage.error(t('rerunMsgEnvFormat'));
    return;
  }
  emit('submit', form.value, props.row);
  visible.value = false;
};

const confirmData = computed(() => {
  const f = form.value;
  const totalHosts = items.value.length;
  const execTypeText = f.execution_type === 'script' ? t('rerunScript') : t('rerunCommand');
  const isOverrideContent = (f.execution_type === 'command' && !!f.command) || (f.execution_type === 'script' && !!f.script_content);

  const execModeDisplayMap: Record<string, string> = {
    serial: t('rerunSerial'),
    parallel: t('rerunParallel'),
    pilot: t('rerunPilot'),
  };
  const execModeTagTypeMap: Record<string, string> = {
    serial: 'warning',
    pilot: 'success',
  };
  const failText = f.fail_strategy === 'stop' ? t('rerunFailStop') : t('rerunFailContinue');

  const hostInfos = items.value.map((item: any) => ({
    id: item.host?.id || item.host_id || item.host_uuid || item.host,
    host_name: item.host_name || item.host?.host_name || '',
    host_ip: item.host_ip || item.host?.host_ip || '',
  }));

  const argsLen = (() => {
    try {
      const arr = JSON.parse(f.args_json || '[]');
      return Array.isArray(arr) ? arr.length : 0;
    } catch {
      return 0;
    }
  })();

  const argsPreview = (() => {
    try {
      const arr = JSON.parse(f.args_json || '[]');
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map((i: any) => (typeof i === 'string' ? i : i?.value ?? String(i))).join(' ');
      }
    } catch {}
    return '';
  })();

  const envCount = (f.environment || '').split('\n').filter((l) => l.trim() && l.includes('=')).length;
  const envPreview = (f.environment || '').split('\n').filter((l) => l.trim() && l.includes('=')).slice(0, 50).map((line) => {
    const idx = line.indexOf('=');
    return { key: line.slice(0, idx), value: line.slice(idx + 1) };
  });

  const execOptions: Array<{ label: string; value: string; active: boolean }> = [
    {
      label: t('rerunLabelWorkDir'),
      value: f.working_directory || t('rerunUnspecified'),
      active: !!f.working_directory,
    },
    {
      label: t('rerunLabelTimeout'),
      value: (f.timeout_seconds !== undefined && f.timeout_seconds !== null) ? t('rerunSeconds', { n: f.timeout_seconds }) : t('rerunUnset'),
      active: f.timeout_seconds !== undefined && f.timeout_seconds !== null && f.timeout_seconds !== 300,
    },
    {
      label: t('rerunLabelLoadProfile'),
      value: f.load_profile === 'true' ? t('rerunYesLoadBashrc') : f.load_profile === 'login' ? t('rerunYesLogin') : t('rerunNo'),
      active: f.load_profile !== 'false' && f.load_profile !== '',
    },
    {
      label: t('rerunLabelMergeStreams'),
      value: f.merge_streams ? t('rerunYesMerge') : t('rerunNoMerge'),
      active: !!f.merge_streams,
    },
    {
      label: t('rerunLabelPrivileged'),
      value: f.privileged ? t('rerunYesPriv', { user: f.su_user ? t('rerunSwitchToUser', { user: f.su_user }) : '' }) : t('rerunNoPriv'),
      active: !!f.privileged,
    },
  ];

  const approvalNotify: Array<{ label: string; value: string; active: boolean }> = [
    {
      label: t('rerunLabelApproval'),
      value: f.need_audit ? t('rerunApprovalOn') : t('rerunApprovalOff'),
      active: !!f.need_audit,
    },
    {
      label: t('rerunLabelAutoNotify'),
      value: f.auto_notify ? t('rerunNotifyOn') : t('rerunNotifyOff'),
      active: !!f.auto_notify,
    },
  ];

  const anyApproverIds = (f.approver_ids || []) as number[];
  const allApproverIds = (f.countersign_ids || []) as number[];
  const modeFromApproval: 'any' | 'all' | 'single' =
    allApproverIds.length > 0
      ? 'all'
      : anyApproverIds.length > 0
        ? (f.approval_mode || 'any') as any
        : 'single';
  const approvalDetailed = {
    enabled: !!f.need_audit,
    mode: modeFromApproval,
    modeText:
      modeFromApproval === 'all' ? t('rerunModeAll')
        : modeFromApproval === 'any' ? t('rerunModeAny')
        : t('rerunModeSingle'),
    any_approvers: anyApproverIds.map((id: number) => ({ id, username: `user${id}`, name: t('userHash', { id }) })),
    all_approvers: allApproverIds.map((id: number) => ({ id, username: `user${id}`, name: t('userHash', { id }) })),
    submit_desc: f.submit_desc || '',
  };

  return {
    content: {
      label: t('rerunLabelExecContent'),
      name: isOverrideContent
        ? (f.execution_type === 'script' ? t('rerunOverrideScript') : t('rerunOverrideCommand'))
        : t('rerunUseOriginal'),
      display: execTypeText,
      preview: isOverrideContent
        ? (f.execution_type === 'command' ? f.command?.slice(0, 500) : f.script_content?.slice(0, 500))
        : '',
      lines: f.script_content ? f.script_content.split(/\r?\n/).length : undefined,
      chars: f.script_content ? f.script_content.length : undefined,
    },
    hosts: hostInfos,
    strategy: {
      execMode: f.exec_mode || 'parallel',
      execModeDisplay: execModeDisplayMap[f.exec_mode || 'parallel'] || t('rerunParallel'),
      execModeTagType: execModeTagTypeMap[f.exec_mode || 'parallel'] || 'primary',
      concurrent: f.concurrent || 10,
      pilotCount: f.pilot_count,
      pilotSuccessRate: f.pilot_success_rate,
      timeoutSeconds: f.timeout_seconds ?? 300,
      failStrategyDisplay: failText,
      needAudit: !!f.need_audit,
    },
    args: argsLen > 0 ? new Array(argsLen).fill('') : undefined,
    argsPreview: argsPreview || undefined,
    envsCount: envCount,
    envsPreview: envPreview,
    approvalNotify: approvalNotify,
    approvalDetailed: approvalDetailed,
    execOptions: execOptions,
    tip: t('rerunConfirmTip', { count: totalHosts }),
  };
});

defineExpose({ open });
</script>

<style scoped lang="scss">
.rerun-exec-dialog {
  :deep(.el-dialog) {
    margin: 0 auto !important;
    max-height: 88vh;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-dialog__header) {
    flex-shrink: 0;
    padding: 14px 20px;
    margin-right: 0;
    border-bottom: 1px solid #ebeef5;
  }

  :deep(.el-dialog__body) {
    flex: 1 1 auto;
    max-height: none !important;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px 20px 10px !important;
  }

  :deep(.el-dialog__footer) {
    flex-shrink: 0;
    padding: 10px 20px 16px;
    border-top: 1px solid #ebeef5;
  }
}

.rerun-form {
  :deep(.el-form-item) {
    margin-bottom: 10px;
  }

  :deep(.el-form-item__label) {
    color: #606266;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }

  .field-hint {
    margin-left: 6px;
    font-size: 12px;
    color: #909399;
  }
}
</style>