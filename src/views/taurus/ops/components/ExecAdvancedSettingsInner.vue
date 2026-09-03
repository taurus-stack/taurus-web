<template>
  <div>
    <SectionBlock :title="basicTitle || t('basicOptions')" sub>
      <el-form-item :label="workDirLabel || t('workDir')">
        <el-input
          :model-value="modelValue.working_directory"
          @update:model-value="updateField('working_directory', $event)"
          size="small"
          :placeholder="workDirPlaceholder || t('defaultDirPlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="timeoutLabel || t('timeoutSec')">
        <el-input-number
          :model-value="normalizedModel.timeout_seconds"
          @update:model-value="updateField('timeout_seconds', $event)"
          :min="10"
          :max="timeoutMax"
          :step="10"
          size="small"
          :controls="true"
          :placeholder="timeoutPlaceholder"
          style="width: 160px"
        />
        <span class="field-hint" style="margin-left: 8px">{{ timeoutHint || t('sec') }}</span>
      </el-form-item>
      <el-form-item :label="envLabel || t('envVars')">
        <el-input
          :model-value="modelValue.environment"
          @update:model-value="updateField('environment', $event)"
          type="textarea"
          :rows="2"
          size="small"
          :placeholder="envPlaceholder || t('envPlaceholder')"
        />
      </el-form-item>
    </SectionBlock>

    <SectionBlock :title="execOptionsTitle || t('execOptions')" sub>
      <div class="exec-opts-row">
        <el-form-item :label="loadProfileLabel || t('loadEnv')" label-width="120px" class="exec-opts-item">
          <el-select
            :model-value="normalizedModel.load_profile"
            @update:model-value="updateField('load_profile', $event)"
            size="small"
            style="width: 100%"
            :clearable="false"
            :placeholder="t('selectPlease')"
          >
            <el-option :label="t('cleanEnv')" value="false" />
            <el-option :label="t('loadBashrc')" value="true" />
            <el-option :label="t('loginShell')" value="login" />
          </el-select>
        </el-form-item>
        <el-form-item :label="mergeStreamsLabel || t('mergeOutput')" label-width="120px" class="exec-opts-item">
          <el-radio-group :model-value="normalizedModel.merge_streams" @update:model-value="updateField('merge_streams', $event)" size="small" class="no-wrap">
            <el-radio-button :value="false">{{ t('off') }}</el-radio-button>
            <el-radio-button :value="true">{{ t('on') }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="privilegedLabel || t('privExec')" label-width="120px" class="exec-opts-item">
          <el-radio-group :model-value="normalizedModel.privileged" @update:model-value="updateField('privileged', $event)" size="small" class="no-wrap">
            <el-radio-button :value="false">{{ t('off') }}</el-radio-button>
            <el-radio-button :value="true">{{ t('on') }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="useShellLabel || t('shellExec')" label-width="120px" class="exec-opts-item">
          <el-radio-group :model-value="normalizedModel.use_shell" @update:model-value="updateField('use_shell', $event)" size="small" class="no-wrap">
            <el-radio-button :value="false">{{ t('off') }}</el-radio-button>
            <el-radio-button :value="true">{{ t('on') }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </div>

      <template v-if="showSuFields">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="suUserLabel || t('switchUser')">
              <el-input
                :model-value="modelValue.su_user"
                @update:model-value="updateField('su_user', $event)"
                size="small"
                :placeholder="t('emptyNoSwitch')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="suPasswordLabel || t('userPassword')">
              <el-input
                :model-value="modelValue.su_password"
                @update:model-value="updateField('su_password', $event)"
                type="password"
                show-password
                size="small"
                :placeholder="t('emptyNopasswd')"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </template>
    </SectionBlock>

    <SectionBlock :title="approvalTitle || t('approvalNotify')" sub>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="needAuditLabel || t('enableApproval')" label-width="auto">
            <el-radio-group :model-value="displayModel.need_audit" @update:model-value="updateField('need_audit', $event)" size="small">
              <el-radio-button :value="false">{{ t('off') }}</el-radio-button>
              <el-radio-button :value="true">{{ t('on') }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="autoNotifyLabel || t('autoNotify')" label-width="auto">
            <el-radio-group :model-value="displayModel.auto_notify" @update:model-value="updateField('auto_notify', $event)" size="small">
              <el-radio-button :value="false">{{ t('off') }}</el-radio-button>
              <el-radio-button :value="true">{{ t('on') }}</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <div v-if="showAuditHint" class="approval-config-section">
        <div class="hint-bar">
          <el-icon><Warning /></el-icon>
          <span>{{ t('advApprovalHint') }}</span>
        </div>

        <el-form-item label-width="0" style="margin-top: 10px; margin-bottom: 0">
          <el-button
            size="small"
            :disabled="!displayModel.need_audit"
            @click="openApprovalConfig"
          >
            <el-icon style="margin-right: 4px"><User /></el-icon>
            {{ t('advApprovalBtn') }}
            <el-tag
              v-if="approvalConfigSummary"
              size="small"
              type="success"
              effect="dark"
              round
              style="margin-left: 6px"
            >
              {{ approvalConfigSummary }}
            </el-tag>
          </el-button>
          <el-link
            v-if="displayModel.need_audit"
            type="primary"
            style="margin-left: 8px; font-size: 12px"
            @click="openApprovalConfig"
          >{{ t('advOrAllLink') }}</el-link>
        </el-form-item>
      </div>
    </SectionBlock>

    <!-- {{ t('advApprovalBtn') }} dialog -->
    <el-dialog
      v-model="approvalConfigDialogVisible"
      :title="t('advApprovalTitle')"
      width="640px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="auto">
        <el-form-item :label="t('advReviewMode')">
          <el-radio-group v-model="tempApproval.approval_mode">
            <el-radio-button label="any">
              {{ t('advOrSign') }}
            </el-radio-button>
            <el-radio-button label="all">
              {{ t('advAllSign') }}
            </el-radio-button>
          </el-radio-group>
          <div style="font-size: 12px; color: #909399; margin-top: 6px">
            {{ t('advOrHint') }}
          </div>
        </el-form-item>

        <el-form-item
          v-if="tempApproval.approval_mode === 'any' || (tempApproval.approver_ids || []).length > 0"
          :label="t('advOrReviewers')"
        >
          <UserSearch
            v-model="tempApproval.approver_ids"
            multiple
            :placeholder="t('advSelectOrAny')"
          />
        </el-form-item>

        <el-form-item
          v-if="tempApproval.approval_mode === 'all' || (tempApproval.countersign_ids || []).length > 0"
          :label="t('advAllReviewers')"
        >
          <UserSearch
            v-model="tempApproval.countersign_ids"
            multiple
            :placeholder="t('advSelectAll')"
          />
        </el-form-item>

        <el-form-item :label="t('advSubmitDesc')">
          <el-input
            v-model="tempApproval.submit_desc"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            :placeholder="t('advSubmitDescPh')"
          />
        </el-form-item>

        <el-form-item :label="t('advTip')">
          <div style="font-size: 13px; color: #606266; line-height: 1.8" v-html="t('advTipContent')"></div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="approvalConfigDialogVisible = false">{{ t('cancel') }}</el-button>
        <el-button type="primary" @click="saveApprovalConfig">{{ t('advSave') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
import { Warning, User } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import SectionBlock from './SectionBlock.vue';
import UserSearch from '/@/components/UserSearch/index.vue';
import type { RerunFormData } from './historyUtils';

const props = withDefaults(defineProps<{
  modelValue: RerunFormData;
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
  triState: false,
  originalText: '',
  selectOriginalText: '',
  workDirPlaceholder: '',
  timeoutPlaceholder: '',
  timeoutHint: '',
  envPlaceholder: '',
  timeoutMax: 3600,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: RerunFormData): void;
}>();

const DEFAULT_FORM: Partial<RerunFormData> = {
  working_directory: '',
  timeout_seconds: 300,
  environment: '',
  load_profile: 'false',
  merge_streams: false,
  privileged: false,
  use_shell: true,
  su_user: '',
  su_password: '',
  need_audit: false,
  auto_notify: false,
  approval_mode: 'any',
  approver_ids: [],
  countersign_ids: [],
  submit_desc: '',
};

function normalizeForm(raw: RerunFormData): RerunFormData {
  const result: any = { ...raw };
  for (const [k, v] of Object.entries(DEFAULT_FORM)) {
    if (k === 'need_audit' || k === 'auto_notify' || k === 'approval_mode' ||
        k === 'approver_ids' || k === 'countersign_ids' || k === 'submit_desc') {
      continue;
    }
    if (result[k] === undefined || result[k] === null || result[k] === '') {
      if (k !== 'working_directory' && k !== 'environment' && k !== 'su_user' && k !== 'su_password') {
        result[k] = v;
      }
    }
  }
  if (result.timeout_seconds === undefined || result.timeout_seconds === null || result.timeout_seconds === '') {
    result.timeout_seconds = DEFAULT_FORM.timeout_seconds;
  }
  if (!result.load_profile || result.load_profile === '') {
    result.load_profile = DEFAULT_FORM.load_profile;
  }
  if (typeof result.merge_streams !== 'boolean') {
    result.merge_streams = DEFAULT_FORM.merge_streams;
  }
  if (typeof result.privileged !== 'boolean') {
    result.privileged = DEFAULT_FORM.privileged;
  }
  if (typeof result.use_shell !== 'boolean') {
    result.use_shell = DEFAULT_FORM.use_shell;
  }
  return result;
}

const normalizedModel = computed(() => normalizeForm(props.modelValue));

const APPROVAL_TRISTATE_KEYS: (keyof RerunFormData)[] = [
  'need_audit', 'auto_notify', 'approval_mode',
  'approver_ids', 'countersign_ids', 'submit_desc',
];

function isApprovalTriState() {
  if (!props.triState) return false;
  const m = props.modelValue;
  return APPROVAL_TRISTATE_KEYS.some((k) => (m as any)[k] === undefined);
}

const displayModel = computed(() => {
  const base: any = { ...normalizedModel.value };
  if (!isApprovalTriState()) return base;
  const rec: any = props.fallbackRecord || {};
  const m: any = props.modelValue;
  base.need_audit = typeof m.need_audit === 'boolean' ? m.need_audit : !!rec.need_audit;
  base.auto_notify = typeof m.auto_notify === 'boolean' ? m.auto_notify : !!rec.auto_notify;
  base.approval_mode = m.approval_mode || rec.approval_mode || DEFAULT_FORM.approval_mode;
  base.approver_ids = Array.isArray(m.approver_ids) ? m.approver_ids : (Array.isArray(rec.approver_ids) ? rec.approver_ids : []);
  base.countersign_ids = Array.isArray(m.countersign_ids) ? m.countersign_ids : (Array.isArray(rec.countersign_ids) ? rec.countersign_ids : []);
  base.submit_desc = (m.submit_desc !== undefined && m.submit_desc !== null) ? m.submit_desc : (rec.submit_desc ?? DEFAULT_FORM.submit_desc);
  return base;
});

function updateField<K extends keyof RerunFormData>(key: K, value: any) {
  const merged: any = { ...props.modelValue, [key]: value };
  emit('update:modelValue', normalizeForm(merged));
}

const showSuFields = computed(() => {
  return !!normalizedModel.value.privileged;
});

const showAuditHint = computed(() => {
  return !!displayModel.value.need_audit;
});

function getEffectiveApprovalSnapshot() {
  const tri = isApprovalTriState();
  const d = displayModel.value;
  return {
    isUsingFallback: tri,
    approval_mode: d.approval_mode || 'any',
    approver_ids: Array.isArray(d.approver_ids) ? d.approver_ids : [],
    countersign_ids: Array.isArray(d.countersign_ids) ? d.countersign_ids : [],
    submit_desc: d.submit_desc || '',
  };
}

const approvalConfigDialogVisible = ref(false);
const tempApproval = reactive<{
  approval_mode: 'any' | 'all';
  approver_ids: number[];
  countersign_ids: number[];
  submit_desc: string;
}>({
  approval_mode: 'any',
  approver_ids: [],
  countersign_ids: [],
  submit_desc: '',
});

function openApprovalConfig() {
  const snap = getEffectiveApprovalSnapshot();
  tempApproval.approval_mode = (snap.approval_mode as any) || 'any';
  tempApproval.approver_ids = [...(snap.approver_ids || [])];
  tempApproval.countersign_ids = [...(snap.countersign_ids || [])];
  tempApproval.submit_desc = snap.submit_desc || '';
  approvalConfigDialogVisible.value = true;
}

function saveApprovalConfig() {
  const anyUsers = tempApproval.approver_ids || [];
  const allUsers = tempApproval.countersign_ids || [];
  if (anyUsers.length === 0 && allUsers.length === 0) {
    ElMessage.warning(t('advMsgNeedApprover'));
  }
  if (allUsers.length > 0 && tempApproval.approval_mode !== 'all') {
    tempApproval.approval_mode = 'all';
  }
  updateField('approval_mode', tempApproval.approval_mode);
  updateField('approver_ids', [...tempApproval.approver_ids]);
  updateField('countersign_ids', [...tempApproval.countersign_ids]);
  updateField('submit_desc', tempApproval.submit_desc);
  approvalConfigDialogVisible.value = false;
}

const approvalConfigSummary = computed(() => {
  const snap = getEffectiveApprovalSnapshot();
  const anyCount = (snap.approver_ids || []).length;
  const allCount = (snap.countersign_ids || []).length;
  if (!anyCount && !allCount) return snap.isUsingFallback ? t('advFollowEachTask') : '';
  const parts: string[] = [];
  if (anyCount) parts.push(t('advOrAllFollow', { n: anyCount }));
  if (allCount) parts.push(t('advAllFollow', { n: allCount }));
  return parts.join(' / ') + (snap.isUsingFallback ? t('advFollowSuffix') : '');
});
</script>

<style scoped lang="scss">
.field-hint {
  font-size: 12px;
  color: #909399;
}

.hint-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 6px;
  font-size: 12px;
  color: #e6a23c;

  .el-icon {
    flex-shrink: 0;
    font-size: 14px;
  }
}

.approval-config-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.exec-opts-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 0;

  .exec-opts-item {
    flex: 1 1 200px;
    min-width: 0;
    margin-bottom: 8px;

    :deep(.el-form-item__content) {
      flex-wrap: nowrap;
      min-width: 0;
    }

    :deep(.el-radio-group.no-wrap) {
      display: inline-flex;
      flex-wrap: nowrap;
      white-space: nowrap;
      flex-shrink: 0;

      .el-radio-button {
        flex-shrink: 0;
      }
    }
  }
}
</style>