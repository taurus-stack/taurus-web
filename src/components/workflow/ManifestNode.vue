<template>
  <div
    class="manifest-node"
    :class="[`node-${manifest?.nodeType}`, { active: selected }]"
    :style="{ borderColor: manifest?.color }"
  >
    <div class="node-header">
      <span class="node-icon">{{ manifest?.icon }}</span>
      <span class="node-label" :title="data.label || manifest?.displayName">
        {{ data.label || manifest?.displayName }}
      </span>
    </div>
    <div class="node-body">
      <div v-if="manifest?.description" class="node-desc" :title="manifest.description">
        {{ manifest.description }}
      </div>
      <div v-if="data.config?.nodeType" class="node-type-tag">{{ data.config.nodeType }}</div>
    </div>
    <Handle
      v-for="input in safeInputs"
      :key="'in-' + input.id"
      :type="'target'"
      :position="input.position as any"
      :id="input.id"
      class="handle-in"
      :style="input.style"
    />
    <Handle
      v-for="output in safeOutputs"
      :key="'out-' + output.id"
      :type="'source'"
      :position="output.position as any"
      :id="output.id"
      class="handle-out"
      :style="output.style"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onErrorCaptured } from 'vue'
import { useI18n } from 'vue-i18n'
import { Handle, Position, type HandleProps } from '@vue-flow/core'
import { getNodeManifest } from '../../views/taurus/workflow/manifest/registry.ts'
import { translateManifest } from '../../views/taurus/workflow/manifest/translate.ts'

const { t } = useI18n()

type NormalizedHandle = { id: string; position: HandleProps['position']; style?: Record<string, any> }

/**
 * NodeManifest.inputs/outputs can be string[] (handle ids) or undefined.
 * Rules:
 * - undefined/null: treat as "default single in/out", add {Left in}/{Right out}
 * - empty array []: means "no ports", keep as-is
 * - strings: normalize to {id, position: Left in / Right out}
 */
const normalizeHandles = (
  raw: any,
  side: 'in' | 'out'
): NormalizedHandle[] => {
  const fallback: NormalizedHandle[] = side === 'in'
    ? [{ id: 'in', position: Position.Left }]
    : [{ id: 'out', position: Position.Right }]
  if (raw === undefined || raw === null) return fallback
  if (!Array.isArray(raw)) return fallback
  if (raw.length === 0) return []
  return raw.map((item: any): NormalizedHandle => {
    // support object format {id, position?, style?}
    if (item && typeof item === 'object') {
      const pos = (item as any).position ?? (side === 'in' ? Position.Left : Position.Right)
      return {
        id: String((item as any).id ?? (side === 'in' ? 'in' : 'out')),
        position: pos,
        style: (item as any).style,
      }
    }
    return {
      id: String(item),
      position: side === 'in' ? Position.Left : Position.Right,
    }
  })
}

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, default: () => ({}) },
  type: { type: [String, Object], default: undefined },
  position: { type: Object, default: () => ({ x: 0, y: 0 }) },
  positionAbsolute: { type: Object, default: undefined },
  selected: { type: Boolean, default: false },
  dragging: { type: Boolean, default: false },
  selectable: { type: Boolean, default: true },
  connectable: { type: Boolean, default: true },
  deletable: { type: Boolean, default: true },
})

onErrorCaptured((err, vm, info) => {
  console.error('[ManifestNode] 子组件错误捕获:', {
    err,
    info,
    data: props.data,
    id: props.id,
  })
  return true
})

const manifest = computed(() => {
  let nodeType: string | undefined
  try {
    nodeType = (props.data as any)?.config?.nodeType || (props.data as any)?.nodeType
    if (!nodeType) return null
    const raw = getNodeManifest(nodeType)
    return raw ? translateManifest(t, raw) : null
  } catch (e) {
    console.error('[ManifestNode] getNodeManifest 失败:', nodeType, e)
    return null
  }
})

const safeInputs = computed<NormalizedHandle[]>(() => normalizeHandles(manifest.value?.inputs, 'in'))
const safeOutputs = computed<NormalizedHandle[]>(() => normalizeHandles(manifest.value?.outputs, 'out'))
</script>

<style scoped lang="scss">
.manifest-node {
  /* Uniform node size for visual consistency */
  width: 260px;
  min-width: 260px;
  max-width: 260px;
  min-height: 110px;
  max-height: 110px;
  height: 110px;
  box-sizing: border-box;
  background: #fff;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
  font-size: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  &.active {
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  .node-header {
    box-sizing: border-box;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px solid #f0f0f0;
    font-weight: 500;
    height: 36px;
    flex-shrink: 0;

    .node-icon {
      font-size: 14px;
      flex-shrink: 0;
      width: 16px;
      text-align: center;
    }
    .node-label {
      color: #333;
      font-size: 13px;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 18px;
    }
  }

  .node-body {
    box-sizing: border-box;
    padding: 8px 12px;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .node-desc {
      color: #909399;
      font-size: 11px;
      line-height: 14px;
      height: 42px; /* ~3 rows, unified description height */
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      word-break: break-word;
      text-overflow: ellipsis;
    }

    .node-type-tag {
      display: inline-block;
      padding: 1px 6px;
      background: #f4f4f5;
      border-radius: 3px;
      font-size: 10px;
      color: #606266;
      align-self: flex-start;
      white-space: nowrap;
      flex-shrink: 0;
      line-height: 16px;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.node-start,
.node-end,
.node-approval,
.node-condition,
.node-loop,
.node-sub_workflow {
  border-width: 2px;
}

/* VueFlow handles do not affect node size */
:deep(.vue-flow__handle) {
  width: 8px;
  height: 8px;
}
</style>