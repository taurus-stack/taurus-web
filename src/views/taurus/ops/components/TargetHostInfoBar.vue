<template>
  <div class="target-host-info-bar" :class="{ 'warn-style': tagType === 'warning' }">
    <el-icon class="info-icon"><Monitor /></el-icon>
    <span class="info-label">{{ t('targetHostLabel') }}</span>
    <el-tag :type="tagType" effect="light" size="small" class="info-tag">
      <slot>{{ displayText || '-' }}</slot>
    </el-tag>
  </div>
</template>

<script setup lang="ts">
import { Monitor } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import type { TagType } from 'element-plus';

withDefaults(defineProps<{
  displayText?: string;
  tagType?: TagType | '';
}>(), {
  displayText: '',
  tagType: 'info',
});
</script>

<style scoped lang="scss">
.target-host-info-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 12px;
  border: 1px solid #d9ecff;
  background: #f0f5ff;

  &.warn-style {
    background: #ecf5ff;
    border-color: #d9ecff;
  }

  .info-icon {
    color: #409eff;
    font-size: 14px;
    flex-shrink: 0;
  }

  .info-label {
    font-size: 13px;
    color: #606266;
    font-weight: 500;
    white-space: nowrap;
  }

  .info-tag {
    flex: 1;
    text-align: left;
    max-width: 100%;
    word-break: break-all;
    white-space: normal;
  }
}
</style>