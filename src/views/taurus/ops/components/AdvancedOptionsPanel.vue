<template>
  <div class="config-card options-card">
    <el-collapse>
      <el-collapse-item name="advanced">
        <template #title>
          <span class="options-title">
            <span class="title-icon title-icon-warning">
              <el-icon><Setting /></el-icon>
            </span>
            {{ t('message.pages.opsExecution.advanced.titleAdvanced') }}
          </span>
        </template>
        <el-form label-width="90px" size="small" class="compact-form">
          <el-form-item :label="t('message.pages.opsExecution.advanced.workingDir')">
            <el-input :model-value="workingDirectory" @update:model-value="$emit('update:workingDirectory', $event)" :placeholder="t('message.pages.opsExecution.advanced.workingDirPlaceholder')" />
          </el-form-item>
          <el-form-item :label="t('message.pages.opsExecution.advanced.timeout')">
            <el-input-number :model-value="timeoutSeconds" @update:model-value="$emit('update:timeoutSeconds', $event)" :min="1" :max="3600" />
          </el-form-item>
          <el-form-item :label="t('message.pages.opsExecution.advanced.envVars')">
            <el-input
              :model-value="envVarsText"
              @update:model-value="$emit('update:envVarsText', $event)"
              type="textarea"
              :rows="2"
              :placeholder="t('message.pages.opsExecution.advanced.envVarsPlaceholder')"
            />
          </el-form-item>
          <el-form-item :label="t('message.pages.opsExecution.advanced.loadProfile')">
            <el-select :model-value="loadProfile" @update:model-value="$emit('update:loadProfile', $event)" style="width: 100%">
              <el-option :label="t('message.pages.opsExecution.advanced.loadProfileClean')" value="false" />
              <el-option :label="t('message.pages.opsExecution.advanced.loadProfileBashrc')" value="true" />
              <el-option :label="t('message.pages.opsExecution.advanced.loadProfileLogin')" value="login" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('message.pages.opsExecution.advanced.mergeStreams')">
            <el-switch :model-value="mergeStreams" @update:model-value="$emit('update:mergeStreams', $event)" />
          </el-form-item>
          <el-form-item :label="t('message.pages.opsExecution.advanced.privileged')">
            <el-switch :model-value="privilegedExecution" @update:model-value="$emit('update:privilegedExecution', $event)" />
          </el-form-item>
          <template v-if="privilegedExecution">
            <el-form-item :label="t('message.pages.opsExecution.advanced.suUser')">
              <el-input :model-value="suUser" @update:model-value="$emit('update:suUser', $event)" :placeholder="t('message.pages.opsExecution.advanced.suUserPlaceholder')" />
            </el-form-item>
            <el-form-item :label="t('message.pages.opsExecution.advanced.suPassword')">
              <el-input :model-value="suPassword" @update:model-value="$emit('update:suPassword', $event)" type="password" show-password :placeholder="t('message.pages.opsExecution.advanced.suPasswordPlaceholder')" />
            </el-form-item>
          </template>
        </el-form>
      </el-collapse-item>

      <el-collapse-item name="strategy">
        <template #title>
          <span class="options-title">
            <span class="title-icon title-icon-primary">
              <el-icon><Cpu /></el-icon>
            </span>
            {{ t('message.pages.opsExecution.advanced.titleStrategy') }}
            <el-tag v-if="strategyCount > 0" size="small" type="primary" effect="light" class="options-badge">
              {{ strategyCount }}
            </el-tag>
          </span>
        </template>
        <el-form label-width="90px" size="small" class="compact-form">
          <el-form-item :label="t('message.pages.opsExecution.advanced.execMode')">
            <el-radio-group :model-value="execMode" @update:model-value="$emit('update:execMode', $event)" class="strategy-mode-group">
              <el-radio value="serial" border>{{ t('message.pages.opsExecution.advanced.serial') }}</el-radio>
              <el-radio value="parallel" border>{{ t('message.pages.opsExecution.advanced.parallel') }}</el-radio>
              <el-radio :disabled="!hasFeature('OPS_PILOT_CANARY')"
                        value="pilot"
                        border
                        class="ee-gate-card"
                        :class="{ 'is-ee-gate': !hasFeature('OPS_PILOT_CANARY') }"
                        :title="!hasFeature('OPS_PILOT_CANARY') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                        @click.capture="onAdvancedPilotClick">
                {{ t('message.pages.opsExecution.advanced.pilot') }}
                <el-tag v-if="!hasFeature('OPS_PILOT_CANARY')" size="small" type="warning" effect="plain" style="margin-left:4px;">EE</el-tag>
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <template v-if="execMode === 'parallel' || execMode === 'pilot'">
            <el-form-item :label="t('message.pages.opsExecution.advanced.concurrent')">
              <el-input-number :model-value="concurrent" @update:model-value="$emit('update:concurrent', $event)" :min="1" :max="50" />
            </el-form-item>
          </template>

          <template v-if="hasFeature('OPS_PILOT_CANARY') && execMode === 'pilot'">
            <el-divider content-position="left" style="margin: 8px 0">{{ t('message.pages.opsExecution.advanced.pilotParams') }}</el-divider>
            <el-form-item :label="t('message.pages.opsExecution.advanced.pilotCount')">
              <el-input-number :model-value="pilotCount" @update:model-value="$emit('update:pilotCount', $event)" :min="1" :max="10" />
            </el-form-item>
            <el-form-item :label="t('message.pages.opsExecution.advanced.pilotRate')">
              <el-input-number :model-value="pilotSuccessRate" @update:model-value="$emit('update:pilotSuccessRate', $event)" :min="1" :max="100" :step="10" />
              <span class="form-meta" style="margin-left: 8px">%</span>
            </el-form-item>
          </template>

          <el-form-item :label="t('message.pages.opsExecution.advanced.failStrategy')">
            <el-select :model-value="failStrategy" @update:model-value="$emit('update:failStrategy', $event)" style="width: 100%">
              <el-option :label="t('message.pages.opsExecution.advanced.failStop')" value="stop" />
              <el-option :label="t('message.pages.opsExecution.advanced.failContinue')" value="continue" />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('message.pages.opsExecution.advanced.needAudit')"
                        class="ee-gate-card"
                        :class="{ 'is-ee-gate': !hasFeature('OPS_EXECUTION_APPROVAL') }"
                        :title="!hasFeature('OPS_EXECUTION_APPROVAL') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                        @click.capture="onApprovalFormItemClick">
            <el-switch :model-value="needAudit" @update:model-value="hasFeature('OPS_EXECUTION_APPROVAL') && $emit('update:needAudit', $event)" :active-text="t('message.pages.opsExecution.advanced.needAuditActive')" :disabled="!hasFeature('OPS_EXECUTION_APPROVAL')" />
            <el-tag v-if="!hasFeature('OPS_EXECUTION_APPROVAL')" size="small" type="warning" effect="plain" style="margin-left:12px;">EE</el-tag>
          </el-form-item>
          <el-form-item :label="t('message.pages.opsExecution.advanced.autoNotify')"
                        class="ee-gate-card"
                        :class="{ 'is-ee-gate': !hasFeature('OPS_EXECUTION_NOTIFICATION') }"
                        :title="!hasFeature('OPS_EXECUTION_NOTIFICATION') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                        @click.capture="onNotifyFormItemClick">
            <el-switch :model-value="autoNotify" @update:model-value="hasFeature('OPS_EXECUTION_NOTIFICATION') && $emit('update:autoNotify', $event)" :active-text="t('message.pages.opsExecution.advanced.autoNotifyActive')" :disabled="!hasFeature('OPS_EXECUTION_NOTIFICATION')" />
            <el-tag v-if="!hasFeature('OPS_EXECUTION_NOTIFICATION')" size="small" type="warning" effect="plain" style="margin-left:12px;">EE</el-tag>
          </el-form-item>

          <template v-if="needAudit">
            <el-alert v-if="hasFeature('OPS_EXECUTION_APPROVAL')" type="warning" :closable="false" show-icon class="approval-alert">
              <template #title>{{ t('message.pages.opsExecution.advanced.approvalAlert') }}</template>
            </el-alert>
            <el-form-item v-if="hasFeature('OPS_EXECUTION_APPROVAL')" label-width="0" style="margin-top: 8px; margin-bottom: 0">
              <el-button size="small" @click="openApprovalConfig">
                <el-icon style="margin-right: 4px"><User /></el-icon>
                {{ t('message.pages.opsExecution.advanced.approvalConfig') }}
                <el-tag
                  v-if="approvalConfigSummary"
                  size="small"
                  type="success"
                  effect="dark"
                  round
                  style="margin-left: 6px"
                >{{ approvalConfigSummary }}</el-tag>
              </el-button>
              <el-link type="primary" style="margin-left: 8px; font-size: 12px" @click="openApprovalConfig">
                {{ t('message.pages.opsExecution.advanced.approvalTipLink') }}
              </el-link>
            </el-form-item>
          </template>
        </el-form>
      </el-collapse-item>
    </el-collapse>

    <el-dialog v-if="hasFeature('OPS_EXECUTION_APPROVAL')" v-model="approvalDialogVisible" :title="t('message.pages.opsExecution.advanced.approvalDialogTitle')" width="560px" destroy-on-close>
      <el-form label-width="96px" size="default">
        <el-form-item :label="t('message.pages.opsExecution.advanced.approvalMode')" required>
          <el-radio-group v-model="tempApproval.approval_mode">
            <el-radio value="any">{{ t('message.pages.opsExecution.advanced.modeAny') }}</el-radio>
            <el-radio value="all">{{ t('message.pages.opsExecution.advanced.modeAll') }}</el-radio>
          </el-radio-group>
          <div class="approval-hint">
            {{ t('message.pages.opsExecution.advanced.modeHint') }}
          </div>
        </el-form-item>
        <el-form-item
          v-if="tempApproval.approval_mode === 'any' || (tempApproval.approver_ids || []).length > 0"
          :label="t('message.pages.opsExecution.advanced.approverAny')"
        >
          <UserSearch v-model="tempApproval.approver_ids" multiple :placeholder="t('message.pages.opsExecution.advanced.approverAnyPlaceholder')" />
        </el-form-item>
        <el-form-item
          v-if="tempApproval.approval_mode === 'all' || (tempApproval.countersign_ids || []).length > 0"
          :label="t('message.pages.opsExecution.advanced.approverAll')"
        >
          <UserSearch v-model="tempApproval.countersign_ids" multiple :placeholder="t('message.pages.opsExecution.advanced.approverAllPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('message.pages.opsExecution.advanced.submitDesc')">
          <el-input
            v-model="tempApproval.submit_desc"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            :placeholder="t('message.pages.opsExecution.advanced.submitDescPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('message.pages.opsExecution.advanced.approvalRulesTitle')">
          <div class="approval-hint">
            {{ t('message.pages.opsExecution.advanced.approvalRules') }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approvalDialogVisible = false">{{ t('message.pages.opsExecution.advanced.cancel') }}</el-button>
        <el-button type="primary" @click="saveApprovalConfig">{{ t('message.pages.opsExecution.advanced.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Setting, Cpu, User } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import UserSearch from '/@/components/UserSearch/index.vue';
import { useEditionStore } from '/@/editions';

const { t } = useI18n();
const editionStore = useEditionStore();
const hasFeature = (code: string) => editionStore.hasFeature(code);

// ---------- EE 升级拦截通用 helpers ----------
const eeT = (key: string, fallback: string) => {
  try {
    const v = t(`message.pages.edition.${key}`);
    if (typeof v === 'string' && v && v !== `message.pages.edition.${key}`) return v;
  } catch (_e) { /* noop */ }
  return fallback;
};
const triggerEeUpgrade = (code: string, customDesc?: string) => {
  ElMessageBox.confirm(
    customDesc || eeT('enterpriseOnlyDesc', '该功能仅在 Taurus Ops 企业版中提供。升级到企业版即可解锁灰度执行、审批流、通知等全部高级能力。'),
    eeT('enterpriseOnlyTitle', '企业版专属功能'),
    { confirmButtonText: eeT('upgradeAction', '立即升级'), cancelButtonText: eeT('dismiss', '稍后再说'), type: 'info', showCancelButton: true, closeOnClickModal: true }
  ).then(() => window.dispatchEvent(new CustomEvent('taurus:edition-upgrade', { detail: { code } }))).catch(() => {});
};
const onAdvancedPilotClick = (e?: MouseEvent) => {
  if (hasFeature('OPS_PILOT_CANARY')) return;
  if (e) e.stopPropagation();
  triggerEeUpgrade('OPS_PILOT_CANARY');
};
const onApprovalFormItemClick = (e?: MouseEvent) => {
  if (hasFeature('OPS_EXECUTION_APPROVAL')) return;
  if (e) e.stopPropagation();
  triggerEeUpgrade('OPS_EXECUTION_APPROVAL');
};
const onNotifyFormItemClick = (e?: MouseEvent) => {
  if (hasFeature('OPS_EXECUTION_NOTIFICATION')) return;
  if (e) e.stopPropagation();
  triggerEeUpgrade('OPS_EXECUTION_NOTIFICATION');
};

const props = defineProps<{
  workingDirectory: string;
  timeoutSeconds: number;
  envVarsText: string;
  loadProfile: string;
  mergeStreams: boolean;
  privilegedExecution: boolean;
  suUser: string;
  suPassword: string;
  execMode: 'serial' | 'parallel' | 'pilot';
  concurrent: number;
  failStrategy: 'stop' | 'continue';
  pilotCount: number;
  pilotSuccessRate: number;
  needAudit: boolean;
  autoNotify: boolean;
  approvalMode?: 'any' | 'all';
  approverIds?: number[];
  countersignIds?: number[];
  submitDesc?: string;
}>();

const emit = defineEmits<{
  'update:workingDirectory': [value: string];
  'update:timeoutSeconds': [value: number];
  'update:envVarsText': [value: string];
  'update:loadProfile': [value: string];
  'update:mergeStreams': [value: boolean];
  'update:privilegedExecution': [value: boolean];
  'update:suUser': [value: string];
  'update:suPassword': [value: string];
  'update:execMode': [value: 'serial' | 'parallel' | 'pilot'];
  'update:concurrent': [value: number];
  'update:failStrategy': [value: 'stop' | 'continue'];
  'update:pilotCount': [value: number];
  'update:pilotSuccessRate': [value: number];
  'update:needAudit': [value: boolean];
  'update:autoNotify': [value: boolean];
  'update:approvalMode': [value: 'any' | 'all'];
  'update:approverIds': [value: number[]];
  'update:countersignIds': [value: number[]];
  'update:submitDesc': [value: string];
}>();

const strategyCount = computed(() => {
  let n = 0;
  if (props.execMode !== 'parallel') n++;
  if (props.concurrent !== 10) n++;
  if (props.failStrategy !== 'continue') n++;
  if (props.execMode === 'pilot') {
    if (props.pilotCount !== 2) n++;
    if (props.pilotSuccessRate !== 100) n++;
  }
  if (props.needAudit) n++;
  if (props.autoNotify) n++;
  if ((props.approverIds?.length ?? 0) > 0) n++;
  if ((props.countersignIds?.length ?? 0) > 0) n++;
  if (props.submitDesc?.trim()) n++;
  return n;
});

const approvalDialogVisible = ref(false);
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
  tempApproval.approval_mode = props.approvalMode || 'any';
  tempApproval.approver_ids = [...(props.approverIds || [])];
  tempApproval.countersign_ids = [...(props.countersignIds || [])];
  tempApproval.submit_desc = props.submitDesc || '';
  approvalDialogVisible.value = true;
}

function saveApprovalConfig() {
  const anyUsers = tempApproval.approver_ids || [];
  const allUsers = tempApproval.countersign_ids || [];
  if (anyUsers.length === 0 && allUsers.length === 0) {
    ElMessage.warning(t('message.pages.opsExecution.advanced.saveWarning'));
  }
  if (allUsers.length > 0 && tempApproval.approval_mode !== 'all') {
    tempApproval.approval_mode = 'all';
  }
  emit('update:approvalMode', tempApproval.approval_mode);
  emit('update:approverIds', [...tempApproval.approver_ids]);
  emit('update:countersignIds', [...tempApproval.countersign_ids]);
  emit('update:submitDesc', tempApproval.submit_desc);
  approvalDialogVisible.value = false;
}

const approvalConfigSummary = computed(() => {
  const anyCount = (props.approverIds || []).length;
  const allCount = (props.countersignIds || []).length;
  if (!anyCount && !allCount) return '';
  const parts: string[] = [];
  if (anyCount) parts.push(t('message.pages.opsExecution.advanced.summaryAny', { n: anyCount }));
  if (allCount) parts.push(t('message.pages.opsExecution.advanced.summaryAll', { n: allCount }));
  return parts.join(' / ');
});
</script>

<style scoped lang="scss">
.config-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #e4e7ed;
  overflow: hidden;
}

.title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;

  .el-icon {
    font-size: 14px;
  }

  &.title-icon-warning {
    background: #fdf6ec;
    color: #e6a23c;
  }

  &.title-icon-primary {
    background: #ecf5ff;
    color: #409eff;
  }
}

.form-meta {
  color: #909399;
  font-size: 12px;
}

.config-card.options-card {
  :deep(.el-collapse) {
    border: none;
  }

  :deep(.el-collapse-item__header) {
    background: #fff;
    border: none;
    border-bottom: 1px solid #f0f2f5;
    padding: 0 16px;
    height: 44px;
    line-height: 44px;
    font-size: 14px;
    color: #303133;
    font-weight: 600;
  }

  :deep(.el-collapse-item__wrap) {
    border: none;
  }

  :deep(.el-collapse-item__content) {
    padding: 14px 16px 16px;
  }

  .options-title {
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;

    .options-badge {
      margin-left: auto;
    }
  }

  .strategy-mode-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .compact-form {
    :deep(.el-form-item) {
      margin-bottom: 12px;
    }

    :deep(.el-form-item__label) {
      font-size: 13px;
      padding-right: 10px;
    }
  }

  .approval-alert {
    margin: -4px 0 10px;
  }

  .approval-hint {
    color: #909399;
    font-size: 12px;
    line-height: 1.6;
    margin-top: 6px;
  }
}
</style>