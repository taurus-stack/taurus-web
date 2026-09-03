<template>
  <div>
    <div class="params-toolbar">
      <el-radio-group v-model="argsMode" size="small">
        <el-radio-button value="positional">{{ t('positionalArgs') }}</el-radio-button>
        <el-radio-button value="kv">{{ t('namedArgs') }}</el-radio-button>
      </el-radio-group>
      <el-tag v-if="effectiveArgCount > 0" size="small" type="primary" effect="light" class="params-count">
        {{ t('argsDetected', { n: effectiveArgCount }) }}
      </el-tag>
      <span v-else class="params-empty">{{ emptyText || t('argsNotFilled') }}</span>
    </div>

    <el-form-item v-if="argsMode === 'positional'" :label="positionalLabel || t('argsValue')" class="params-form-item">
      <el-input
        v-model="argsPositional"
        type="textarea"
        :rows="3"
        :placeholder="positionalPlaceholder || t('argsPlaceholder')"
        resize="vertical"
      />
    </el-form-item>

    <el-form-item v-if="argsMode === 'kv'" :label="kvLabel || t('argsList')" class="params-form-item">
      <div class="kv-container">
        <div v-for="(row, idx) in argsKvRows" :key="idx" class="kv-row">
          <el-select v-model="row.prefix" size="small" style="width: 60px">
            <el-option label="--" value="--" />
            <el-option label="-" value="-" />
            <el-option label="/" value="/" />
            <el-option :label="t('none')" value="" />
          </el-select>
          <el-input v-model="row.key" size="small" :placeholder="t('paramName')" style="width: 140px" />
          <span class="kv-eq">=</span>
          <el-input v-model="row.value" size="small" :placeholder="t('paramValue')" style="flex: 1" />
          <el-button
            link type="danger" size="small"
            :disabled="argsKvRows.length <= 1"
            @click="removeKvRow(idx)"
          >
            {{ t('delete') }}
          </el-button>
        </div>
        <el-button size="small" class="kv-add-btn" @click="addKvRow">
          + {{ t('addParam') }}
        </el-button>
      </div>
    </el-form-item>

    <div class="params-preview-wrap">
      <span class="preview-label">{{ t('argsPreview') }}</span>
      <code class="args-preview">{{ argsPreview || previewEmptyText || t('noParams') }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCustomParams } from './useCustomParams';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const props = withDefaults(defineProps<{
  argsJson: Ref<string>;
  positionalLabel?: string;
  kvLabel?: string;
  positionalPlaceholder?: string;
  emptyText?: string;
  previewEmptyText?: string;
}>(), {});

const {
  argsMode,
  argsPositional,
  argsKvRows,
  argsPreview,
  effectiveArgCount,
  addKvRow,
  removeKvRow,
  syncArgsToForm,
} = useCustomParams(props.argsJson);

defineExpose({
  syncArgsToForm,
});
</script>

<style scoped lang="scss">
.params-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;

  .params-count {
    font-size: 12px;
  }

  .params-empty {
    font-size: 12px;
    color: #909399;
  }
}

.params-form-item {
  margin-bottom: 8px !important;
  margin-top: 4px;
}

.kv-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.kv-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.kv-eq {
  color: #909399;
  font-size: 14px;
}

.kv-add-btn {
  align-self: flex-start;
  margin-top: 4px;
}

.params-preview-wrap {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 4px;
  padding: 10px 12px;
  background: #fafafa;
  border: 1px dashed #ebeef5;
  border-radius: 6px;
}

.preview-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
  line-height: 24px;
  white-space: nowrap;
}

.args-preview {
  flex: 1;
  display: block;
  font-family: Menlo, Consolas, monospace;
  font-size: 12px;
  color: #303133;
  background: #fff;
  padding: 6px 8px;
  border-radius: 4px;
  word-break: break-all;
  white-space: pre-wrap;
  min-height: 24px;
  line-height: 1.5;
}
</style>