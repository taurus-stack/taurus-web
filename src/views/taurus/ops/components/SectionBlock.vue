<template>
  <div class="section-block" :class="{ 'sub-block': sub }">
    <div v-if="title" class="section-title" :class="{ 'sub-title': sub }">
      <el-icon v-if="icon && !sub"><component :is="icon" /></el-icon>
      <span>{{ title }}</span>
    </div>
    <div class="form-section">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  icon?: any;
  sub?: boolean;
}>();
</script>

<style scoped lang="scss">
.section-block {
  padding: 12px 14px;
  background: #fafbfc;
  border-radius: 8px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  &.sub-block {
    background: #fff;
    border: 1px solid #ebeef5;
    padding: 10px 12px;
    margin-bottom: 8px;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;

  .el-icon {
    color: #409eff;
    font-size: 15px;
  }

  &.sub-title {
    font-size: 13px;
    font-weight: 600;
    color: #606266;
    margin-bottom: 8px;
    padding-left: 4px;
    padding-bottom: 0;
    border-left: 3px solid #409eff;
    border-bottom: none;
    line-height: 1;
  }
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>