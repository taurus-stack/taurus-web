<template>
  <div>
    <el-form-item :label="label || t('execMode')">
      <el-radio-group :model-value="modelValue.exec_mode" @update:model-value="updateField('exec_mode', $event)" class="mode-group">
        <el-radio value="serial" class="mode-card">
          <div class="mode-radio-dot" />
          <div class="mode-content">
            <span class="mode-name">{{ t('serialExec') }}</span>
            <span class="mode-desc">{{ t('serialDesc') }}</span>
          </div>
        </el-radio>
        <el-radio value="parallel" class="mode-card">
          <div class="mode-radio-dot" />
          <div class="mode-content">
            <span class="mode-name">{{ t('parallelExec') }}</span>
            <span class="mode-desc">{{ t('parallelDesc') }}</span>
          </div>
        </el-radio>
        <el-radio :disabled="!hasFeature('OPS_PILOT_CANARY')"
                  value="pilot"
                  class="mode-card ee-gate-card"
                  :class="{ 'is-ee-gate': !hasFeature('OPS_PILOT_CANARY') }"
                  :title="!hasFeature('OPS_PILOT_CANARY') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                  @click.capture="onPilotCardClick">
          <div class="mode-radio-dot" />
          <div class="mode-content">
            <span class="mode-name">
              {{ t('grayRelease') }}
              <el-tag v-if="!hasFeature('OPS_PILOT_CANARY')" size="small" type="warning" effect="plain" style="margin-left:4px;">EE</el-tag>
            </span>
            <span class="mode-desc">{{ t('grayReleaseDesc') }}</span>
          </div>
        </el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item v-if="modelValue.exec_mode === 'parallel'" :label="concurrentLabel || t('concurrentNum')">
      <el-input-number
        :model-value="modelValue.concurrent"
        @update:model-value="updateField('concurrent', $event)"
        :min="1" :max="50" size="small"
      />
      <span class="field-hint">{{ t('hostsAtOnce') }}</span>
    </el-form-item>

    <template v-if="modelValue.exec_mode === 'pilot'">
      <el-form-item :label="pilotCountLabel || t('verifyHosts')">
        <el-input-number
          :model-value="modelValue.pilot_count"
          @update:model-value="updateField('pilot_count', $event)"
          :min="1" :max="10" size="small"
        />
        <span class="field-hint">{{ t('pilotSerialHint') }}</span>
      </el-form-item>
      <el-form-item :label="pilotSuccessLabel || t('successThreshold')">
        <el-input-number
          :model-value="modelValue.pilot_success_rate"
          @update:model-value="updateField('pilot_success_rate', $event)"
          :min="1" :max="100" :step="10" size="small"
        />
        <span class="field-hint">{{ t('thresholdHint') }}</span>
      </el-form-item>
      <el-form-item :label="pilotConcurrentLabel || t('grayConcurrency')">
        <el-input-number
          :model-value="modelValue.concurrent"
          @update:model-value="updateField('concurrent', $event)"
          :min="1" :max="50" size="small"
        />
        <span class="field-hint">{{ t('grayPhaseHint') }}</span>
      </el-form-item>
    </template>

    <el-form-item :label="failStrategyLabel || t('failStrategy')">
      <el-select
        :model-value="modelValue.fail_strategy"
        @update:model-value="updateField('fail_strategy', $event)"
        size="small" style="width: 160px"
      >
        <el-option :label="t('failStopAll')" value="stop" />
        <el-option :label="t('failContinue')" value="continue" />
      </el-select>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import type { RerunFormData } from './historyUtils';
import { ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
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
const onPilotCardClick = (e?: MouseEvent) => {
  if (hasFeature('OPS_PILOT_CANARY')) return;
  if (e) e.stopPropagation();
  triggerEeUpgrade('OPS_PILOT_CANARY');
};

const props = withDefaults(defineProps<{
  modelValue: Pick<RerunFormData, 'exec_mode' | 'concurrent' | 'fail_strategy' | 'pilot_count' | 'pilot_success_rate'>;
  label?: string;
  concurrentLabel?: string;
  pilotCountLabel?: string;
  pilotSuccessLabel?: string;
  pilotConcurrentLabel?: string;
  failStrategyLabel?: string;
}>(), {});

const emit = defineEmits<{
  (e: 'update:modelValue', value: Partial<RerunFormData>): void;
}>();

function updateField<K extends keyof typeof props.modelValue>(key: K, value: any) {
  emit('update:modelValue', { ...props.modelValue, [key]: value } as any);
}
</script>

<style scoped lang="scss">
.field-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.mode-group {
  display: flex;
  gap: 10px;
  width: 100%;

  :deep(.el-radio) {
    flex: 1 1 0%;
    margin: 0 !important;
    min-width: 0;
  }
}

.mode-card {
  box-sizing: border-box;
  width: 100%;
  min-height: 62px;
  padding: 10px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
  position: relative;
  overflow: hidden;

  :deep(.el-radio__input) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: 0 !important;
    padding: 0;
    width: auto;
    height: auto;
    line-height: inherit;

    .el-radio__inner {
      display: none !important;
    }

    .el-radio__original {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      cursor: pointer;
    }
  }

  :deep(.el-radio__label) {
    display: flex !important;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 8px;
    padding: 0 !important;
    height: auto !important;
    line-height: 1.4 !important;
    pointer-events: none;
    white-space: normal;
    width: 100%;
  }

  &:hover {
    border-color: #c6e2ff;
    background: #f5faff;
  }

  .mode-radio-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #dcdfe6;
    flex-shrink: 0;
    margin-top: 3px;
    position: relative;
    pointer-events: none;
  }

  .mode-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    pointer-events: none;
    flex: 1;
    min-width: 0;
  }

  .mode-name {
    font-size: 13px;
    font-weight: 500;
    color: #303133;
    line-height: 1.3;
  }

  .mode-desc {
    font-size: 11px;
    color: #909399;
    line-height: 1.3;
  }

  &.is-checked {
    border-color: #409eff;
    background: #ecf5ff;

    .mode-radio-dot {
      border-color: #409eff;

      &::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        right: 2px;
        bottom: 2px;
        border-radius: 50%;
        background: #409eff;
      }
    }

    .mode-name {
      color: #409eff;
    }
  }
}
</style>