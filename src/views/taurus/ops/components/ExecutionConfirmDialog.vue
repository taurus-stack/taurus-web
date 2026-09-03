<template>
  <el-dialog
    v-model="visible"
    :title="title || t('execConfigConfirm')"
    width="720px"
    :close-on-click-modal="false"
    destroy-on-close
    top="6vh"
  >
    <div v-if="data" class="confirm-run-panel">
      <el-descriptions :column="1" border size="default">
        <el-descriptions-item v-if="data.content" :label="data.content.label">
          <div class="content-area">
            <div v-if="data.content.name" style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px; line-height: 1.8">
              <span class="mono content-name">{{ data.content.name }}</span>
              <el-tag v-if="data.content.display" size="small" type="info">
                {{ data.content.display }}
              </el-tag>
            </div>
            <div v-if="data.content.lines !== undefined || data.content.chars !== undefined" style="margin-top: 6px; color: #909399; font-size: 12px">
              <template v-if="data.content.lines !== undefined">{{ t('execConfirmLines', { n: data.content.lines }) }}</template>
              <template v-if="data.content.chars !== undefined">{{ t('execConfirmChars', { n: data.content.chars }) }}</template>
            </div>
            <div v-if="data.content.preview" class="content-preview">{{ data.content.preview }}</div>
          </div>
        </el-descriptions-item>

        <el-descriptions-item :label="t('execConfirmTargetHosts', { n: data.hosts.length })">
          <div class="host-tags-scroll">
            <el-tag
              v-for="(h, idx) in data.hosts"
              :key="h.id || idx"
              size="small"
              type="success"
              effect="plain"
              class="host-tag-item"
            >
              {{ h.host_name ? h.host_name + ' / ' : '' }}{{ h.host_ip || h.identifier || h.id }}
            </el-tag>
            <span v-if="data.hosts.length === 0" style="color: #f56c6c">{{ t('execConfirmNoValidHost') }}</span>
          </div>
        </el-descriptions-item>

        <el-descriptions-item :label="t('execConfirmStrategy')">
          <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px; line-height: 1.8">
            <el-tag size="small" :type="data.strategy.execModeTagType || 'primary'" effect="dark">
              {{ data.strategy.execModeDisplay }}
            </el-tag>
            <span v-if="data.strategy.execMode !== 'serial'" class="strategy-chip">
              {{ t('execConfirmConcurrency', { n: data.strategy.concurrent }) }}
            </span>
            <span v-if="data.strategy.execMode === 'pilot'" class="strategy-chip">
              {{ t('execConfirmPilot', { n: data.strategy.pilotCount, rate: data.strategy.pilotSuccessRate }) }}
            </span>
          </div>
          <div style="margin-top: 6px; color: #909399; font-size: 12px">
            {{ t('execConfirmTimeout', { sec: data.strategy.timeoutSeconds, strategy: data.strategy.failStrategyDisplay }) }}
            <span v-if="data.strategy.needAudit" style="color: #e6a23c">{{ t('execConfirmNeedAudit') }}</span>
          </div>
        </el-descriptions-item>

        <el-descriptions-item v-if="data.args && data.args.length" :label="t('execConfirmCustomArgs', { n: data.args.length })">
          <div style="color: #606266; font-size: 12px; margin-bottom: 6px">
            {{ t('execConfirmArgsHint') }}
          </div>
          <code class="args-preview">{{ data.argsPreview || data.args.join(' ') }}</code>
        </el-descriptions-item>
        <el-descriptions-item v-else-if="data.args !== undefined" :label="t('execConfirmCustomArgs', { n: 0 })">
          <span style="color: #909399">{{ t('execConfirmArgsEmpty') }}</span>
        </el-descriptions-item>

        <el-descriptions-item v-if="data.envsCount !== undefined" :label="t('execConfirmEnvVars', { n: data.envsCount })">
          <div v-if="data.envsCount > 0" style="margin-bottom: 6px; color: #606266; font-size: 12px">
            {{ t('execConfirmEnvHint') }}
          </div>
          <div v-if="data.envsCount > 0" class="envs-preview">
            <div
              v-for="(item, idx) in data.envsPreview"
              :key="idx"
              class="env-line"
            >
              <span class="env-key">{{ item.key }}</span>
              <span class="env-eq">=</span>
              <span class="env-value">{{ item.value }}</span>
            </div>
            <div v-if="data.envsCount > (data.envsPreview?.length || 0)" style="color: #909399; font-size: 12px; margin-top: 4px">
              {{ t('envPreviewTruncated', { n: data.envsPreview?.length || 0, remain: data.envsCount - (data.envsPreview?.length || 0) }) }}
            </div>
          </div>
          <div v-else style="color: #909399">
            {{ t('envNotSet') }}
          </div>
        </el-descriptions-item>

        <el-descriptions-item v-if="data.approvalNotify?.length" :label="t('approvalAndNotify')">
          <div class="exec-opts-detailed">
            <div
              v-for="(opt, idx) in data.approvalNotify"
              :key="idx"
              class="opt-row"
              :class="{ 'is-active': opt.active }"
            >
              <span class="opt-label">{{ opt.label }}</span>
              <span class="opt-sep">:</span>
              <span class="opt-value" :class="{ 'opt-value-muted': !opt.active }">{{ opt.value }}</span>
            </div>
          </div>
        </el-descriptions-item>

        <el-descriptions-item v-if="data.approvalDetailed?.enabled" :label="t('approvalConfigDetail')">
          <div class="approval-detailed-box">
            <div class="approval-mode-row">
              <span class="label">{{ t('approvalMode') }}</span>
              <el-tag
                size="small"
                effect="dark"
                round
                :type="data.approvalDetailed.mode === 'all' ? 'warning' : (data.approvalDetailed.mode === 'any' ? 'primary' : 'info')"
              >
                {{ data.approvalDetailed.modeText }}
              </el-tag>
            </div>

            <div v-if="data.approvalDetailed.any_approvers?.length" class="approval-group">
              <div class="group-title">
                <el-tag size="small" type="primary" effect="plain">{{ t('anyApprovers', { n: data.approvalDetailed.any_approvers.length }) }}</el-tag>
              </div>
              <div class="approver-tags">
                <el-tag
                  v-for="u in data.approvalDetailed.any_approvers"
                  :key="'any-' + u.id"
                  size="small"
                  type="primary"
                  effect="light"
                  round
                  class="approver-tag"
                >
                  {{ u.name || u.username }}
                  <span v-if="u.name && u.username !== u.name" class="sub">({{ u.username }})</span>
                </el-tag>
              </div>
            </div>

            <div v-if="data.approvalDetailed.all_approvers?.length" class="approval-group">
              <div class="group-title">
                <el-tag size="small" type="warning" effect="plain">{{ t('allApprovers', { n: data.approvalDetailed.all_approvers.length }) }}</el-tag>
              </div>
              <div class="approver-tags">
                <el-tag
                  v-for="u in data.approvalDetailed.all_approvers"
                  :key="'all-' + u.id"
                  size="small"
                  type="warning"
                  effect="light"
                  round
                  class="approver-tag"
                >
                  {{ u.name || u.username }}
                  <span v-if="u.name && u.username !== u.name" class="sub">({{ u.username }})</span>
                </el-tag>
              </div>
            </div>

            <div v-if="!data.approvalDetailed.any_approvers?.length && !data.approvalDetailed.all_approvers?.length" class="approval-group">
              <el-tag size="small" type="info" effect="plain">{{ t('noApproversSpecified') }}</el-tag>
            </div>

            <div v-if="data.approvalDetailed.submit_desc" class="approval-desc">
              <div class="desc-label">{{ t('submitDesc') }}</div>
              <div class="desc-content">{{ data.approvalDetailed.submit_desc }}</div>
            </div>
          </div>
        </el-descriptions-item>

        <el-descriptions-item v-if="data.execOptions?.length" :label="t('advancedExecOptions')">
          <div class="exec-opts-detailed">
            <div
              v-for="(opt, idx) in data.execOptions"
              :key="idx"
              class="opt-row"
              :class="{ 'is-active': opt.active }"
            >
              <span class="opt-label">{{ opt.label }}</span>
              <span class="opt-sep">:</span>
              <span class="opt-value" :class="{ 'opt-value-muted': !opt.active }">{{ opt.value }}</span>
            </div>
          </div>
        </el-descriptions-item>
      </el-descriptions>

      <el-alert
        v-if="data.isRisky"
        type="error"
        :closable="false"
        show-icon
        style="margin-top: 16px"
        :title="t('riskyKeywordDetected')"
        :description="t('pleaseVerifyExecConfigRisky')"
      />
      <el-alert
        v-else
        type="info"
        :closable="false"
        show-icon
        style="margin-top: 16px"
        :title="t('pleaseVerifyExecConfig')"
        :description="data.tip || t('batchIrreversible') + t('clickConfirmExecute')"
      />
    </div>

    <template #footer>
      <el-button @click="visible = false">{{ t('cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="handleConfirm">
        {{ confirmText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

interface HostInfo {
  id?: string;
  host_name?: string;
  host_ip?: string;
  identifier?: string;
}

interface ContentInfo {
  label: string;
  name?: string;
  display?: string;
  lines?: number;
  chars?: number;
  preview?: string;
}

interface StrategyInfo {
  execMode: string;
  execModeDisplay: string;
  execModeTagType?: string;
  concurrent: number;
  pilotCount?: number;
  pilotSuccessRate?: number;
  timeoutSeconds: number;
  failStrategyDisplay: string;
  needAudit: boolean;
}

interface OptRow {
  label: string;
  value: string;
  active: boolean;
}

interface ApproverUser {
  id: number;
  username: string;
  name?: string;
}

interface ApprovalDetailed {
  enabled: boolean;
  mode: 'any' | 'all' | 'single';
  modeText: string;
  any_approvers: ApproverUser[];
  all_approvers: ApproverUser[];
  submit_desc: string;
}

interface ConfirmData {
  content?: ContentInfo;
  hosts: HostInfo[];
  strategy: StrategyInfo;
  args?: string[];
  argsPreview?: string;
  envsCount?: number;
  envsPreview?: Array<{ key: string; value: string }>;
  approvalNotify?: OptRow[];
  approvalDetailed?: ApprovalDetailed;
  execOptions?: OptRow[];
  isRisky?: boolean;
  tip?: string;
}

const props = withDefaults(defineProps<{
  modelValue: boolean;
  title?: string;
  data: ConfirmData | null;
  confirmText?: string;
  loading?: boolean;
}>(), {
  title: undefined,
  confirmText: undefined,
  loading: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'confirm'): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const handleConfirm = () => {
  emit('confirm');
};
</script>

<style scoped lang="scss">
.confirm-run-panel {
  .mono {
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
  }

  .content-area {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .content-name {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .content-preview {
    margin-top: 6px;
    display: inline-block;
    max-width: 100%;
    word-break: break-all;
    padding: 8px 12px;
    background: #f5f7fa;
    border-radius: 4px;
    border: 1px solid #ebeef5;
    font-size: 12px;
    color: #303133;
    white-space: pre-wrap;
    line-height: 1.7;
    max-height: 200px;
    overflow-y: auto;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  }

  .host-tags-scroll {
    max-height: 150px;
    overflow-y: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 2px;

    .host-tag-item {
      flex: 0 0 auto;
    }
  }

  .strategy-chip {
    display: inline-block;
    padding: 1px 8px;
    background: #f0f9ff;
    color: #409eff;
    border-radius: 10px;
    font-size: 12px;
    line-height: 1.6;
  }

  .args-preview {
    display: inline-block;
    max-width: 100%;
    word-break: break-all;
    padding: 8px 12px;
    background: #f5f7fa;
    border-radius: 4px;
    border: 1px solid #ebeef5;
    font-size: 12px;
    color: #303133;
    white-space: pre-wrap;
    line-height: 1.7;
  }

  .envs-preview {
    max-height: 200px;
    overflow-y: auto;
    background: #f5f7fa;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 8px 12px;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 12px;

    .env-line {
      display: flex;
      line-height: 1.8;

      .env-key {
        color: #409eff;
        flex-shrink: 0;
        max-width: 40%;
        word-break: break-all;
        font-weight: 600;
      }

      .env-eq {
        color: #909399;
        margin: 0 4px;
        flex-shrink: 0;
      }

      .env-value {
        color: #67c23a;
        word-break: break-all;
        flex: 1;
      }
    }
  }

  .exec-opts-detailed {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: #fafbfc;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    padding: 8px 12px;

    .opt-row {
      display: flex;
      align-items: flex-start;
      line-height: 1.9;
      font-size: 13px;
      padding: 3px 0;

      & + & {
        border-top: 1px dashed #ebeef5;
      }

      .opt-label {
        flex-shrink: 0;
        width: 120px;
        color: #909399;
        font-weight: 500;
      }

      .opt-sep {
        flex-shrink: 0;
        color: #dcdfe6;
        margin-right: 12px;
      }

      .opt-value {
        flex: 1;
        word-break: break-all;
        color: #606266;
      }

      .opt-value-muted {
        color: #a8abb2;
      }

      &.is-active {
        .opt-label {
          color: #409eff;
        }

        .opt-value {
          color: #303133;
          font-weight: 500;
        }
      }
    }
  }

  .approval-detailed-box {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #fdf6ec;
    border: 1px solid #faecd8;
    border-radius: 6px;
    padding: 10px 12px;

    .approval-mode-row {
      display: flex;
      align-items: center;
      gap: 10px;
      .label {
        font-size: 13px;
        font-weight: 500;
        color: #909399;
        width: 70px;
        flex-shrink: 0;
      }
    }

    .approval-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .group-title {
        display: flex;
      }

      .approver-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding-left: 4px;

        .approver-tag {
          .sub {
            color: #909399;
            font-size: 11px;
            opacity: 0.85;
          }
        }
      }
    }

    .approval-desc {
      background: #ffffff;
      border: 1px dashed #ebeef5;
      border-radius: 4px;
      padding: 6px 10px;

      .desc-label {
        font-size: 12px;
        font-weight: 500;
        color: #909399;
        margin-bottom: 2px;
      }

      .desc-content {
        font-size: 13px;
        line-height: 1.7;
        color: #606266;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
  }
}
</style>