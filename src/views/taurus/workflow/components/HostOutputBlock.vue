<template>
  <div class="host-output-block">
    <!-- Four-cell summary: exit code / duration / start time / attempts -->
    <div v-if="row" class="summary-grid">
      <div class="grid-cell">
        <div class="cell-label">{{ t('exitCode') }}</div>
        <div
          class="cell-value exit-code"
          :class="{ ok: isExitOK, bad: !isExitOK }"
        >
          {{ displayExitCode }}
        </div>
      </div>
      <div class="grid-cell">
        <div class="cell-label">{{ t('duration') }}</div>
        <div class="cell-value mono">{{ displayDuration }}</div>
      </div>
      <div class="grid-cell">
        <div class="cell-label">{{ t('startTime') }}</div>
        <div class="cell-value small">{{ startedAtDisplay }}</div>
      </div>
      <div class="grid-cell">
        <div class="cell-label">{{ t('attempt') }}</div>
        <div class="cell-value">
          #{{ attemptNo }}
          <span v-if="attemptNo > 1" class="retry-mini">{{ t('retried') }}</span>
        </div>
      </div>
    </div>

    <!-- stdout / stderr / JSON switcher -->
    <div v-if="row?.output || hostDetail" class="output-wrap">
      <div class="output-tools">
        <el-radio-group v-model="tab" size="small" class="mode-switch">
          <el-radio-button label="stdout">
            stdout
            <span v-if="stdoutLen > 0" class="len-chip">{{ formatBytes(stdoutLen) }}</span>
          </el-radio-button>
          <el-radio-button label="stderr">
            stderr
            <span v-if="stderrLen > 0" class="len-chip warn">{{ formatBytes(stderrLen) }}</span>
          </el-radio-button>
          <el-radio-button label="json">{{ t('structured') }}</el-radio-button>
        </el-radio-group>
        <div class="tools-right">
          <el-button size="small" text @click="copyTab">{{ t('copy') }}</el-button>
        </div>
      </div>

      <!-- stdout dark box -->
      <div v-show="tab === 'stdout'" class="ansi-box">
        <pre v-if="output?.stdout" class="ansi-pre stdout">{{ output.stdout }}</pre>
        <div v-else-if="loaded && !output?.stdout" class="empty-hint">
          <span class="hint-icon">📭</span>
          <span class="hint-text">{{ emptyLabels.stdout }}</span>
        </div>
      </div>
      <!-- stderr red-dark box -->
      <div v-show="tab === 'stderr'" class="ansi-box stderr-box">
        <pre v-if="output?.stderr" class="ansi-pre stderr">{{ output.stderr }}</pre>
        <div v-else-if="loaded && !output?.stderr" class="empty-hint">
          <span class="hint-icon">✨</span>
          <span class="hint-text">{{ emptyLabels.stderr }}</span>
        </div>
      </div>
      <!-- Structured JSON -->
      <div v-show="tab === 'json'" class="json-box">
        <pre v-if="output" class="json-pre">{{ prettyJSON }}</pre>
        <div v-else-if="loaded" class="empty-hint">
          <span class="hint-icon">❏</span>
          <span class="hint-text">{{ emptyLabels.json }}</span>
        </div>
      </div>
    </div>

    <div v-else class="no-output">
      <el-empty :image-size="60" :description="t('noOutputData')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
import { ElMessage } from 'element-plus'

const props = defineProps<{
  row: any
  hostDetail: any
}>()

const tab = ref<'stdout' | 'stderr' | 'json'>('stdout')
const loaded = computed(() => props.row != null)

const output = computed(() => props.row?.output || null)
const stdoutLen = computed(() => (output.value?.stdout || '').length)
const stderrLen = computed(() => (output.value?.stderr || '').length)

// Auto-switch to stderr when host changes (if stderr has content)
watch(
  () => props.row?.id || props.row?.host_id,
  () => {
    if (stderrLen.value > 0 && stdoutLen.value === 0) tab.value = 'stderr'
    else tab.value = 'stdout'
  },
  { immediate: false }
)

// ---- Computed display fields ----
const attemptNo = computed(() => {
  const raw = props.row?.attempt_no
  if (raw == null) return 1
  const n = Number(raw)
  return Number.isFinite(n) ? n : 1
})
const isExitOK = computed(() => {
  const code = props.row?.exit_code ?? output.value?.exit_code
  return code == null || code === 0
})
const displayExitCode = computed(() => {
  const code = props.row?.exit_code ?? output.value?.exit_code
  return code == null ? '—' : String(code)
})
const displayDuration = computed(() => {
  const ms = props.row?.duration_ms
  if (ms == null) {
    const st = props.row?.started_at || props.row?.startTime
    const fi = props.row?.finished_at || props.row?.endTime
    if (st && fi) {
      const diff = new Date(fi).getTime() - new Date(st).getTime()
      if (!Number.isNaN(diff) && diff >= 0) return formatMs(diff)
    }
    return '—'
  }
  const n = Number(ms)
  return Number.isFinite(n) ? formatMs(n) : '—'
})
const startedAtDisplay = computed(() => {
  const s = props.row?.started_at || props.row?.startTime
  if (!s) return '—'
  return String(s).replace('T', ' ').slice(0, 19)
})

// ---- Utilities ----
function formatMs(ms: number): string {
  if (ms >= 60_000) {
    const m = Math.floor(ms / 60_000)
    const s = ((ms % 60_000) / 1000).toFixed(1)
    return `${m}${t('min')}${s}${t('sec')}`
  }
  return (ms / 1000).toFixed(ms < 1_000 ? 3 : 2) + ' ' + t('sec')
}
function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + 'KB'
  return (n / 1024 / 1024).toFixed(2) + 'MB'
}
const prettyJSON = computed(() => {
  try { return JSON.stringify(output.value, null, 2) }
  catch { return String(output.value) }
})
function copyTab() {
  let text = ''
  if (tab.value === 'stdout') text = output.value?.stdout || ''
  else if (tab.value === 'stderr') text = output.value?.stderr || ''
  else text = prettyJSON.value
  if (!text) { ElMessage.info(t('msgNoContent')); return }
  navigator.clipboard.writeText(text)
    .then(() => ElMessage.success(t('msgCopiedShort')))
    .catch(() => ElMessage.error(t('msgCopyFail')))
}

// Empty-state text (precomputed so inline template can access setup's t)
const emptyLabels = {
  stdout: t('noOutputStdout'),
  stderr: t('noOutputStderr'),
  json: t('noStructuredOutput'),
}
</script>

<style scoped lang="scss">
.host-output-block {
  padding: 10px 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid #f0f0f0;
  background: #fafbfc;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  .grid-cell {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    padding: 8px 10px;
    .cell-label {
      font-size: 11px;
      color: #909399;
      margin-bottom: 4px;
    }
    .cell-value {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      line-height: 1.3;
      display: flex;
      align-items: baseline;
      gap: 6px;
      &.mono, &.small { font-family: Consolas, Monaco, monospace; }
      &.small { font-size: 12px; color: #606266; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      &.exit-code.ok  { color: #67c23a; }
      &.exit-code.bad { color: #f56c6c; }
      .retry-mini {
        font-size: 10px;
        padding: 0 4px;
        background: #fef0f0;
        color: #f56c6c;
        border-radius: 3px;
        font-weight: 500;
      }
    }
  }
}

.output-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;

  .output-tools {
    padding: 6px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f5f7fa;
    border-bottom: 1px solid #ebeef5;
    flex-shrink: 0;
    .mode-switch {
      :deep(.el-radio-button__inner) {
        padding: 0 10px !important;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .len-chip {
        font-size: 10px;
        padding: 0 4px;
        border-radius: 3px;
        background: #e6f3ff;
        color: #409EFF;
        font-family: Consolas, Monaco, monospace;
      }
      .len-chip.warn {
        background: #fef0f0;
        color: #f56c6c;
      }
    }
    .tools-right { display: flex; }
  }

  .ansi-box, .json-box {
    max-height: 320px;
    overflow-y: auto;
    background: #1e1e1e;
    color: #d4d4d4;
    font-size: 12px;
    line-height: 1.65;
    font-family: Consolas, Monaco, 'SF Mono', monospace;
    padding: 10px 12px;
    margin: 0;
    &.stderr-box { background: #2a1a1a; }
    .ansi-pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;
      min-height: 40px;
      &.stdout { color: #e8e8e8; }
      &.stderr { color: #ffb3b3; }
    }
    .json-pre {
      margin: 0;
      color: #b5cea8;
      white-space: pre-wrap;
      word-break: break-all;
      background: transparent;
      padding: 0;
    }
  }
  .json-box { background: #1e1e1e; }

  .empty-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28px 0;
    color: #909399;
    gap: 8px;
    font-size: 12px;
    .hint-icon { font-size: 22px; opacity: 0.6; }
    .hint-text { font-size: 12px; color: #a8abb2; }
  }
}

.no-output {
  padding: 18px 12px;
  border-top: 1px solid #f0f0f0;
  :deep(.el-empty__description) { color: #a8abb2; font-size: 12px; }
}

@media (max-width: 520px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>