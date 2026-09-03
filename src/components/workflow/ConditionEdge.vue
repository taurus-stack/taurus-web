<template>
  <g v-bind="$attrs">
    <BaseEdge
      :path="path"
      :style="edgeStyle"
      :marker-end="markerEnd"
    />
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge, getBezierPath } from '@vue-flow/core'

defineOptions({
  inheritAttrs: false
})

const props = defineProps({
  id: { type: String, required: true },
  sourceX: { type: Number, required: true },
  sourceY: { type: Number, required: true },
  targetX: { type: Number, required: true },
  targetY: { type: Number, required: true },
  sourcePosition: { type: [Number, String], default: undefined },
  targetPosition: { type: [Number, String], default: undefined },
  style: { type: Object, default: () => ({}) },
  selected: { type: Boolean, default: false },
  animated: { type: Boolean, default: false },
  data: { type: Object, default: () => ({}) },
  markerEnd: { type: [String, Object], default: undefined },
  markerStart: { type: [String, Object], default: undefined },
  path: { type: String, default: '' },
  source: { type: String, default: '' },
  target: { type: String, default: '' },
  sourceHandleId: { type: String, default: undefined },
  targetHandleId: { type: String, default: undefined },
  interactionWidth: { type: Number, default: 20 },
})

const condition = computed(() => {
  if (!props.data) return ''
  return (props.data as any).condition || ''
})

const edgeStyle = computed(() => {
  const c = condition.value
  if (c === '__else__') return { stroke: '#E6A23C', strokeWidth: 2 }
  if (c) return { stroke: '#409EFF', strokeWidth: 2 }
  return { stroke: '#b1b3b8', strokeWidth: 1.5 }
})

const path = computed(() => {
  if (props.sourceX == null || props.sourceY == null || props.targetX == null || props.targetY == null) return ''
  const [edgePath] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition as any,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition as any,
  })
  return edgePath
})
</script>