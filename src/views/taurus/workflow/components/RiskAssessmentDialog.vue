<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('message.pages.workflow.riskDialogTitle', { name: workflowName || '-' })"
    width="720px"
    top="6vh"
    destroy-on-close
    class="risk-dialog"
  >
    <div v-loading="loading" class="risk-body">
      <!-- Level banner -->
      <div class="risk-banner" :class="bannerClass">
        <div class="banner-left">
          <div class="banner-label">{{ t('message.pages.workflow.riskLevel') }}</div>
          <div class="banner-level">{{ riskLevelDisplay }}</div>
        </div>
        <div class="banner-right">
          <div class="suggestion-title">{{ t('message.pages.workflow.suggestion') }}</div>
          <div class="suggestion-text">{ suggestion || t('message.pages.workflow.noSuggestion') }</div>
        </div>
      </div>

      <!-- Stats card -->
      <div class="stats-row">
        <div class="mini-stat high">
          <span class="mini-num">{{ stats.high || 0 }}</span>
          <span class="mini-label">{{ t('message.pages.workflow.highRisk') }}</span>
        </div>
        <div class="mini-stat warning">
          <span class="mini-num">{{ stats.warning || 0 }}</span>
          <span class="mini-label">{{ t('message.pages.workflow.warning') }}</span>
        </div>
        <div class="mini-stat info">
          <span class="mini-num">{{ stats.info || 0 }}</span>
          <span class="mini-label">{{ t('message.pages.workflow.hint') }}</span>
        </div>
        <div class="mini-stat total">
          <span class="mini-num">{{ stats.total || 0 }}</span>
          <span class="mini-label">{{ t('message.pages.workflow.total') }}</span>
        </div>
      </div>

      <!-- Risk point list -->
      <div class="risk-list-wrap">
        <div class="section-title">{{ t('message.pages.workflow.riskPointsDetail', { count: riskPoints.length }) }}</div>
        <el-empty v-if="riskPoints.length === 0" :description="t('message.pages.workflow.noRiskPoints')" />
        <div v-else class="risk-points">
          <div
            v-for="(p, idx) in riskPoints"
            :key="idx"
            class="risk-point-item"
            :class="pointClass(p)"
          >
            <div class="point-badge">{{ pointBadge(p) }}</div>
            <div class="point-text">{{ stripPrefix(p) }}</div>
          </div>
        </div>
      </div>

      <div class="assessed-tip" v-if="assessedAt">
        <el-icon><Clock /></el-icon>
        {{ t('message.pages.workflow.assessedAt', { time: assessedAt }) }}
      </div>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">{{ t('message.pages.workflow.close') }}</el-button>
      <el-button v-if="withSyncPending && workflowId" type="primary" @click="handleSyncPending" :disabled="loading">
        <el-icon><Refresh /></el-icon>
        {{ t('message.pages.workflow.syncToApproval') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { GetRiskAssessment, PostRiskAssessment } from '/@/api/taurus/workflow/api'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  modelValue: boolean
  workflowId?: number | string | null
  workflowName?: string
  draftPayload?: any
  withSyncPending?: boolean
}>(), {
  workflowId: null,
  workflowName: '',
  withSyncPending: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'refreshed'): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const loading = ref(false)
const riskLevel = ref<'low' | 'medium' | 'high'>('low')
const riskLevelDisplay = ref(t('message.pages.workflow.riskLow'))
const suggestion = ref('')
const riskPoints = ref<string[]>([])
const stats = ref<{ high?: number; warning?: number; info?: number; total?: number }>({})
const assessedAt = ref('')

const bannerClass = computed(() => {
  if (riskLevel.value === 'high') return 'banner-high'
  if (riskLevel.value === 'medium') return 'banner-medium'
  return 'banner-low'
})

const pointClass = (p: string) => {
  if (p.includes('[high]')) return 'pt-high'
  if (p.includes('[warning]')) return 'pt-warning'
  return 'pt-info'
}
const pointBadge = (p: string) => {
  if (p.includes('[high]')) return t('message.pages.workflow.riskHigh')
  if (p.includes('[warning]')) return t('message.pages.workflow.warning')
  return t('message.pages.workflow.hint')
}
const stripPrefix = (p: string) =>
  p.replace(/^\[(high|warning|tip)\]\s*/, '').trim()

const resetState = () => {
  riskLevel.value = 'low'
  riskLevelDisplay.value = t('message.pages.workflow.riskLow')
  suggestion.value = ''
  riskPoints.value = []
  stats.value = {}
  assessedAt.value = ''
}

const doAssessment = async () => {
  resetState()
  loading.value = true
  try {
    let res: any
    if (props.draftPayload) {
      res = props.workflowId
        ? await PostRiskAssessment(props.workflowId, props.draftPayload)
        : await PostRiskAssessment('_draft', props.draftPayload)
    } else if (props.workflowId) {
      res = await GetRiskAssessment(props.workflowId)
    } else {
      loading.value = false
      return
    }
    const data = res?.data || res || {}
    riskLevel.value = (data.risk_level || 'low') as any
    riskLevelDisplay.value = data.risk_level_display || riskLevelMap[riskLevel.value]
    suggestion.value = data.suggestion || ''
    riskPoints.value = Array.isArray(data.risk_points) ? data.risk_points : []
    stats.value = data.stats || {}
    assessedAt.value = (data.assessed_at || '').replace('T', ' ').slice(0, 19)
  } catch (e: any) {
    ElMessage.error(t('message.pages.workflow.riskAssessFail') + ': ' + (e?.message || ''))
  } finally {
    loading.value = false
  }
}

const riskLevelMap: Record<string, string> = {
  low: t('message.pages.workflow.riskLow'),
  medium: t('message.pages.workflow.riskMedium'),
  high: t('message.pages.workflow.riskHigh'),
}

const handleSyncPending = async () => {
  if (!props.workflowId) return
  loading.value = true
  try {
    const res = await GetRiskAssessment(props.workflowId, { sync_pending: 1 })
    ElMessage.success(t('message.pages.workflow.riskSyncMsg'))
    const data = res?.data || res || {}
    if (Array.isArray(data.risk_points)) riskPoints.value = data.risk_points
    emit('refreshed')
  } catch (e: any) {
    ElMessage.error(t('message.pages.workflow.riskSyncFail') + ': ' + (e?.message || ''))
  } finally {
    loading.value = false
  }
}

watch(
  () => dialogVisible.value,
  (v) => {
    if (v) doAssessment()
  },
)
</script>

<style scoped lang="scss">
.risk-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.risk-banner {
  display: flex;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 10px;
  color: #fff;
  align-items: center;
  .banner-left {
    flex: 0 0 170px;
    .banner-label { font-size: 12px; opacity: .85; margin-bottom: 6px; }
    .banner-level { font-size: 28px; font-weight: 700; letter-spacing: 2px; }
  }
  .banner-right {
    flex: 1;
    border-left: 1px solid rgba(255,255,255,0.25);
    padding-left: 20px;
    .suggestion-title { font-size: 12px; opacity: .85; margin-bottom: 4px; }
    .suggestion-text { line-height: 1.7; font-size: 13px; }
  }
  &.banner-high { background: linear-gradient(135deg, #f56c6c, #c0392b); }
  &.banner-medium { background: linear-gradient(135deg, #e6a23c, #d48806); }
  &.banner-low { background: linear-gradient(135deg, #67c23a, #529b2e); }
}
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.mini-stat {
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f5f7fa;
  .mini-num { font-size: 22px; font-weight: 700; }
  .mini-label { font-size: 12px; color: #909399; margin-top: 4px; }
  &.high { background: #fef0f0; color: #f56c6c; }
  &.warning { background: #fdf6ec; color: #e6a23c; }
  &.info { background: #ecf5ff; color: #409eff; }
  &.total { background: #f0f9eb; color: #67c23a; }
}
.section-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  margin-bottom: 10px;
}
.risk-points {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
}
.risk-point-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  .point-badge {
    flex: 0 0 42px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    line-height: 20px;
    height: 20px;
    border-radius: 10px;
    color: #fff;
  }
  .point-text { flex: 1; color: #303133; line-height: 1.6; font-size: 13px; word-break: break-all; }
  &.pt-high {
    background: #fef0f0;
    border-color: #fbc4c4;
    .point-badge { background: #f56c6c; }
  }
  &.pt-warning {
    background: #fdf6ec;
    border-color: #f5dab1;
    .point-badge { background: #e6a23c; }
  }
  &.pt-info {
    background: #ecf5ff;
    border-color: #d9ecff;
    .point-badge { background: #409eff; }
  }
}
.assessed-tip {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}
</style>