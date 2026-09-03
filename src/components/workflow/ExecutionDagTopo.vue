<template>
  <div class="topology-canvas">
    <div
      v-for="node in nodes"
      :key="node.id"
      :class="['topo-node', node.status, { selected: selectedNodeId === node.id, 'has-multi': isMultiHost(node) }]"
      :style="{ left: node.x + 'px', top: node.y + 'px', width: NODE_W + 'px', height: NODE_H_TALL + 'px' }"
      @click="$emit('select', node)"
    >
      <div class="node-top-line">
        <div class="node-icon" :title="node.label">{{ iconMap[node.type] || '⚙' }}</div>
        <div class="node-label" :title="node.label">{{ node.label }}</div>
        <div class="node-dot" :class="node.status"></div>
      </div>

      <!-- multi-host: show stats + progress -->
      <div v-if="isMultiHost(node)" class="node-host-bar">
        <div class="host-count">
          <span v-if="node.group.attempts_max > 1" class="retry-tag" :title="t('message.importExcel.hasHostRetried', { count: node.group.attempts_max })">
            ⚠×{{ node.group.attempts_max }}
          </span>
          <span class="count-text">
            {{ node.group.completed_hosts }}/{{ node.group.total_hosts }} {{ t('dagHostUnit') }}
          </span>
        </div>
        <div class="host-progress">
          <div
            class="host-progress-bar"
            :class="node.status === 'fail' ? 'fail' : node.status === 'running' ? 'running' : ''"
            :style="{ width: pct(node) }"
          />
        </div>
        <div class="host-legend">
          <span v-if="node.group.status_counts?.success > 0" class="badge success">
            ✔{{ node.group.status_counts.success }}
          </span>
          <span v-if="node.group.status_counts?.failed > 0" class="badge failed">
            ✘{{ node.group.status_counts.failed }}
          </span>
          <span v-if="node.group.status_counts?.running > 0" class="badge running">
            {{ t('message.runningAbbr') }}{{ node.group.status_counts.running }}
          </span>
          <span v-if="node.group.status_counts?.pending > 0" class="badge pending">
            {{ t('message.pendingAbbr') }}{{ node.group.status_counts.pending }}
          </span>
          <span v-if="node.group.status_counts?.skipped > 0" class="badge skipped">
            {{ t('message.skippedAbbr') }}{{ node.group.status_counts.skipped }}
          </span>
        </div>
      </div>
      <!-- single/no-host: keep meta -->
      <div v-else class="node-meta-single">
        <span class="dur">{{ node.duration || '-' }}</span>
      </div>
    </div>

    <svg class="topo-lines" :width="svgWidth" :height="svgHeight">
      <path
        v-for="line in lines"
        :key="line.id"
        :d="getLinePath(line)"
        :stroke="getLineColor(line)"
        stroke-width="2"
        fill="none"
        stroke-linecap="round"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  nodes: any[]
  lines: any[]
  selectedNodeId: string
  iconMap: Record<string, string>
}>()

defineEmits<{
  select: [node: any]
}>()

/* Execution topology is a "thumbnail view", nodes keep uniform width/height (same ~2.4:1 ratio as ManifestNode in editor).

   Note: modifying NODE_W/NODE_H_TALL here must sync useExecutionDetail:layoutDagNodes

   xStep/yStep in that, otherwise edge endpoints/coverage will misalign.

   NODE_H_LEGACY keeps vertical center baseline = old node height 72. */

const NODE_W = 220
const NODE_H_TALL = 108   // multi-host node height (icon 24 + count 18 + progress 10 + legend 22 + padding ≈ 96)
const NODE_H_LEGACY = 72

const isMultiHost = (node: any): boolean => {
  const total = Number(node?.group?.total_hosts ?? 0)
  const hosts = node?.group?.hosts
  if (!Array.isArray(hosts) || hosts.length === 0) return false
  // show multi-host bar only when total > 1
  if (total <= 1) return false
  const hasReal = hosts.some((h: any) => h.host_id && h.host_id !== '__NO_HOST__')
  return hasReal
}
const pct = (node: any) => {
  const t = Number(node?.group?.total_hosts ?? 0)
  if (t <= 0) return '0%'
  const c = Number(node?.group?.completed_hosts ?? 0)
  return Math.min(100, Math.round(c / t * 100)) + '%'
}

const svgWidth = computed(() => {
  if (props.nodes.length === 0) return 800
  const maxX = Math.max(...props.nodes.map((n) => n.x || 0))
  return Math.max(maxX + NODE_W + 60, 800)
})

const svgHeight = computed(() => {
  if (props.nodes.length === 0) return 400
  const bottom = Math.max(...props.nodes.map((n) => (n.y || 0) + nodeH(n)))
  return Math.max(bottom + 60, 400)
})

/**
 * Draw Bezier edges between nodes: from "right midpoint" → to "left midpoint".

 * Multi-host nodes use NODE_H_TALL, single/non-host nodes use NODE_H_LEGACY.

 */
const nodeH = (n: any) => (isMultiHost(n) ? NODE_H_TALL : NODE_H_LEGACY)
const getLinePath = (line: any) => {
  const from = props.nodes.find((n) => n.id === line.from)
  const to = props.nodes.find((n) => n.id === line.to)
  if (!from || !to) return ''
  const x1 = (from.x || 0) + NODE_W
  const y1 = (from.y || 0) + nodeH(from) / 2
  const x2 = to.x || 0
  const y2 = (to.y || 0) + nodeH(to) / 2
  const dx = Math.max(Math.abs(x2 - x1) * 0.5, 30)
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}

const getLineColor = (line: any) => {
  const map: Record<string, string> = {
    success: '#67C23A',
    fail: '#F56C6C',
    running: '#409EFF',
    pending: '#C0C4CC',
    skipped: '#909399',
    cancelled: '#E6A23C',
  }
  return map[line.status] || '#dcdfe6'
}
</script>

<style scoped lang="scss">
.topology-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
  overflow: auto;
  box-sizing: border-box;
}

.topo-node {
  position: absolute;
  box-sizing: border-box;
  background: #fff;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
  user-select: none;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
  &.selected {
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.4);
  }
  &.success   { border-color: #67C23A; background: #f0f9eb; }
  &.fail      { border-color: #F56C6C; background: #fef0f0; }
  &.running   { border-color: #409EFF; background: #ecf5ff; }
  &.pending   { border-color: #C0C4CC; background: #f5f7fa; }
  &.skipped   { border-color: #909399; background: #f4f4f5; }
  &.cancelled { border-color: #E6A23C; background: #fdf6ec; }

  .node-top-line {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 22px;
    position: relative;

    .node-icon {
      font-size: 14px;
      flex-shrink: 0;
    }
    .node-label {
      flex: 1;
      min-width: 0;
      font-size: 12px;
      color: #303133;
      line-height: 16px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .node-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      &.success   { background: #67C23A; }
      &.fail      { background: #F56C6C; }
      &.running   { background: #409EFF; animation: blink 1s infinite; }
      &.pending   { background: #C0C4CC; }
      &.skipped   { background: #909399; }
      &.cancelled { background: #E6A23C; }
    }
  }

  .node-meta-single {
    font-size: 11px;
    color: #909399;
    padding-left: 20px;
    display: flex;
    align-items: center;
    flex: 1;
    min-height: 36px;
    .dur { font-family: Consolas, Monaco, monospace; }
  }

  .node-host-bar {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-height: 0;

    .host-count {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;

      .retry-tag {
        font-size: 10px;
        padding: 0 4px;
        background: #fef0f0;
        color: #f56c6c;
        border-radius: 3px;
        line-height: 15px;
        font-weight: 600;
        flex-shrink: 0;
      }
      .count-text {
        font-size: 11px;
        color: #606266;
        font-weight: 500;
        margin-left: auto;
        font-family: Consolas, Monaco, monospace;
      }
    }

    .host-progress {
      width: 100%;
      height: 6px;
      background: #ebeef5;
      border-radius: 3px;
      overflow: hidden;
      .host-progress-bar {
        height: 100%;
        background: #67C23A;
        transition: width 0.4s ease;
        border-radius: 3px;
        &.running { background: #409EFF; }
        &.fail    { background: #F56C6C; }
      }
    }

    .host-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      .badge {
        font-size: 10px;
        padding: 1px 4px;
        border-radius: 3px;
        line-height: 14px;
        font-weight: 600;
        font-family: Consolas, Monaco, monospace;
        &.success { background: #f0f9eb; color: #67C23A; }
        &.failed  { background: #fef0f0; color: #f56c6c; }
        &.running { background: #ecf5ff; color: #409EFF; }
        &.pending { background: #f5f7fa; color: #909399; }
        &.skipped { background: #f4f4f5; color: #606266; }
      }
    }
  }
}

.topo-lines {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.3; }
}
</style>