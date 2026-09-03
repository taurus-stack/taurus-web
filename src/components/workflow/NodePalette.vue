<template>
  <div class="node-palette">
    <div class="palette-title">
      {{ t('message.pages.workflowEditor.wePaletteTitle') }}
      <span class="tip">{{ t('message.pages.workflowEditor.wePaletteTip') }}</span>
    </div>

    <div v-for="category in sortedCategories" :key="category" class="palette-group">
      <div class="group-title">{{ tCategory(t, category, categoryFallback[category] || category) }}</div>
      <div
        v-for="manifest in getManifestsByCategory(category)"
        :key="manifest.nodeType"
        class="node-item"
        :draggable="true"
        :title="`${translateManifest(t, manifest)?.displayName || manifest.displayName}｜${t('message.pages.workflowEditor.wePaletteDoubleClickTip')}`"
        @dblclick="onDoubleClick(manifest)"
        @dragstart="onDragStart($event, manifest)"
      >
        <span class="node-icon">{{ manifest.icon }}</span>
        <span class="node-label">{{ translateManifest(t, manifest)?.displayName || manifest.displayName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  getSortedCategories,
  getNodeManifestsByCategory
} from '../../views/taurus/workflow/manifest/registry.ts'
import { translateManifest, tCategory } from '../../views/taurus/workflow/manifest/translate.ts'
import type { NodeManifest } from '../../views/taurus/workflow/manifest/types.ts'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'add-node', manifest: NodeManifest): void
}>()

/** Chinese fallback for categories (used when i18n key is missing) */
const categoryFallback: Record<string, string> = {
  control: t('message.categoryControl'),
  execution: t('message.categoryExecution'),
  notification: t('message.categoryNotification'),
  approval: t('message.categoryApproval'),
  integration: t('message.categoryIntegration'),
  transform: t('message.categoryTransform'),
}

const sortedCategories = computed(() => getSortedCategories())

const getManifestsByCategory = (category: string) => {
  return getNodeManifestsByCategory(category as any)
}

const buildPayload = (manifest: NodeManifest) => {
  const tr = translateManifest(t, manifest)
  const m = tr || manifest
  return {
    nodeType: m.nodeType,
    data: {
      nodeType: m.nodeType,
      displayName: m.displayName,
      category: m.category,
      color: m.color,
      icon: m.icon,
      description: m.description,
      inputs: m.inputs,
      outputs: m.outputs,
      params: m.params,
      requiresHost: m.requiresHost,
      isAsynchronousHuman: m.isAsynchronousHuman,
    },
  }
}

const onDoubleClick = (manifest: NodeManifest) => {
  emit('add-node', manifest)
}

const onDragStart = (e: DragEvent, manifest: NodeManifest) => {
  try {
    const payload = buildPayload(manifest)
    const payloadStr = JSON.stringify(payload)
    if (e.dataTransfer) {
      try { e.dataTransfer.setData('application/vueflow', payloadStr) } catch (_e) { /* ignore */ }
      try { e.dataTransfer.setData('text/plain', payloadStr) } catch (_e) { /* ignore */ }
      try { e.dataTransfer.setData('text', payloadStr) } catch (_e) { /* ignore */ }
      e.dataTransfer.effectAllowed = 'move'
    }
  } catch (err) {
    console.error('[NodePalette] 拖拽序列化失败:', err, manifest)
  }
}
</script>

<style scoped lang="scss">
.node-palette {
  width: 220px;
  background: #fff;
  overflow-y: auto;
  flex-shrink: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;

  .palette-title {
    padding: 16px;
    font-weight: 600;
    font-size: 15px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
    display: flex;
    align-items: baseline;
    gap: 6px;
    .tip {
      font-size: 11px;
      color: #999;
      font-weight: 400;
    }
  }
  .palette-group {
    padding: 8px 12px;
    .group-title {
      font-size: 12px;
      color: #999;
      padding: 8px 4px;
      font-weight: 500;
    }
  }
  .node-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: grab;
    margin-bottom: 4px;
    transition: all 0.2s;
    user-select: none;
    &:hover {
      background: #ecf5ff;
      color: #409EFF;
    }
    &:active {
      cursor: grabbing;
    }
    .node-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }
    .node-label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>