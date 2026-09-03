<template>
  <SectionBlock v-if="wrapSection" :title="sectionTitle || t('advancedSettings')" :icon="sectionIcon || Bell">
    <ExecAdvancedSettingsInner
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event)"
      :tri-state="triState"
      :fallback-record="fallbackRecord"
      :original-text="originalText || t('original')"
      :select-original-text="selectOriginalText || t('useOriginal')"
      :work-dir-placeholder="workDirPlaceholder || t('defaultDirPlaceholder')"
      :timeout-placeholder="timeoutPlaceholder"
      :timeout-hint="timeoutHint || t('sec')"
      :env-placeholder="envPlaceholder || t('envPlaceholder')"
      :timeout-max="timeoutMax"
      :basic-title="basicTitle"
      :exec-options-title="execOptionsTitle"
      :approval-title="approvalTitle"
      :work-dir-label="workDirLabel"
      :timeout-label="timeoutLabel"
      :env-label="envLabel"
      :load-profile-label="loadProfileLabel"
      :merge-streams-label="mergeStreamsLabel"
      :privileged-label="privilegedLabel"
      :use-shell-label="useShellLabel"
      :su-user-label="suUserLabel"
      :su-password-label="suPasswordLabel"
      :need-audit-label="needAuditLabel"
      :auto-notify-label="autoNotifyLabel"
    />
  </SectionBlock>
  <ExecAdvancedSettingsInner
    v-else
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :tri-state="triState"
    :fallback-record="fallbackRecord"
    :original-text="originalText || t('original')"
    :select-original-text="selectOriginalText || t('useOriginal')"
    :work-dir-placeholder="workDirPlaceholder || t('defaultDirPlaceholder')"
    :timeout-placeholder="timeoutPlaceholder"
    :timeout-hint="timeoutHint || t('sec')"
    :env-placeholder="envPlaceholder || t('envPlaceholder')"
    :timeout-max="timeoutMax"
    :basic-title="basicTitle"
    :exec-options-title="execOptionsTitle"
    :approval-title="approvalTitle"
    :work-dir-label="workDirLabel"
    :timeout-label="timeoutLabel"
    :env-label="envLabel"
    :load-profile-label="loadProfileLabel"
    :merge-streams-label="mergeStreamsLabel"
    :privileged-label="privilegedLabel"
    :use-shell-label="useShellLabel"
    :su-user-label="suUserLabel"
    :su-password-label="suPasswordLabel"
    :need-audit-label="needAuditLabel"
    :auto-notify-label="autoNotifyLabel"
  />
</template>

<script setup lang="ts">
import { Bell } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import SectionBlock from './SectionBlock.vue';
import ExecAdvancedSettingsInner from './ExecAdvancedSettingsInner.vue';
import type { RerunFormData } from './historyUtils';

const props = withDefaults(defineProps<{
  modelValue: RerunFormData;
  wrapSection?: boolean;
  sectionTitle?: string;
  sectionIcon?: any;
  triState?: boolean;
  fallbackRecord?: any;
  originalText?: string;
  selectOriginalText?: string;
  workDirPlaceholder?: string;
  timeoutPlaceholder?: string;
  timeoutHint?: string;
  envPlaceholder?: string;
  timeoutMax?: number;
  basicTitle?: string;
  execOptionsTitle?: string;
  approvalTitle?: string;
  workDirLabel?: string;
  timeoutLabel?: string;
  envLabel?: string;
  loadProfileLabel?: string;
  mergeStreamsLabel?: string;
  privilegedLabel?: string;
  useShellLabel?: string;
  suUserLabel?: string;
  suPasswordLabel?: string;
  needAuditLabel?: string;
  autoNotifyLabel?: string;
}>(), {
  wrapSection: true,
  triState: false,
  originalText: undefined,
  selectOriginalText: undefined,
  workDirPlaceholder: undefined,
  timeoutPlaceholder: '',
  timeoutHint: undefined,
  envPlaceholder: undefined,
  timeoutMax: 3600,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: RerunFormData): void;
}>();
</script>