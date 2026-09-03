<template>
  <div class="loop-body-form">
    <div class="loop-body-toolbar">
      <div class="toolbar-left">
        <el-icon class="toolbar-icon"><Setting /></el-icon>
        <span class="toolbar-label">{{ t('message.loopBodyParams') }}（{{ bodyManifest?.displayName || t('message.notSelected') }}）</span>
      </div>
      <div class="toolbar-right">
        <el-popover
          placement="bottom-end"
          :width="340"
          trigger="click"
          popper-class="loop-var-popover"
        >
          <template #reference>
            <el-button size="small" type="primary" text :disabled="!bodyNodeType">
              <el-icon style="margin-right:2px;"><MagicStick /></el-icon>{{ t('message.insertLoopVariable') }}</el-button>
          </template>
          <div class="loop-var-panel">
            <div class="loop-var-title">{{ t('message.loopBuiltinVars') }}</div>
            <div class="loop-var-desc">{{ t('message.clickToInsertPlaceholder') }}</div>
            <div class="loop-var-list">
              <div
                v-for="v in loopVars"
                :key="v.token"
                class="loop-var-item"
                @click="insertVariable(v.token)"
              >
                <div class="loop-var-token">{{ v.token }}</div>
                <div class="loop-var-desc">{{ v.desc }}</div>
              </div>
            </div>
          </div>
        </el-popover>
      </div>
    </div>

    <div v-if="!bodyNodeType" class="loop-body-empty">
      <el-icon :size="32" color="#C0C4CC"><WarningFilled /></el-icon>
      <div class="empty-text">{{ t('message.pleaseSelectLoopNodeType') }}</div>
    </div>

    <template v-else-if="bodyManifest">
      <AutoNodeForm
        ref="bodyFormRef"
        :manifest="bodyManifest"
        :config="innerConfig"
        :global-vars="globalVars"
        :readonly="false"
        @update:config="onBodyConfigChange"
      />
    </template>

    <div v-else class="loop-body-unsupported">
      <el-icon :size="32" color="#E6A23C"><InfoFilled /></el-icon>
      <div class="unsupported-text">
        {{ t('message.loopNoConfigForm', { type: bodyNodeType }) }}
        <el-link type="primary" :underline="false" @click="toggleJsonMode">
          {{ t('message.useJsonEditMode') }}
        </el-link>
      </div>
    </div>

    <div v-if="showJsonFallback" class="json-fallback">
      <el-input
        v-model="jsonFallback"
        type="textarea"
        :rows="8"
        placeholder="JSON"
        class="json-editor"
        @change="onJsonFallbackChange"
      />
      <el-button size="small" @click="toggleJsonMode">{{ t('message.backToFormMode') }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Setting, MagicStick, WarningFilled, InfoFilled } from '@element-plus/icons-vue'
import AutoNodeForm from './AutoNodeForm.vue'
import { getNodeManifest } from '/@/views/taurus/workflow/manifest/registry.ts'
import { translateManifest } from '/@/views/taurus/workflow/manifest/translate.ts'
import type { NodeManifest } from '/@/views/taurus/workflow/manifest/types.ts'

const { t } = useI18n()

interface LoopVar {
  token: string
  desc: string
}

const props = defineProps<{
  bodyNodeType: string
  modelValue: Record<string, any>
  globalVars?: { key: string; value: string }[]
}>()

const emit = defineEmits<{
  (_e: 'update:modelValue', value: Record<string, any>): void
}>()

const loopVars: LoopVar[] = [
  { token: '${loop.index}', desc: t('message.loopVarIndex') },
  { token: '${loop.item}', desc: t('message.loopVarItem') },
  { token: '${loop.total}', desc: t('message.loopVarTotal') },
  { token: '${loop.parent_output}', desc: t('message.loopVarParentOutput') },
]

const bodyFormRef = ref<InstanceType<typeof AutoNodeForm> | null>(null)
const showJsonFallback = ref(false)
const jsonFallback = ref('{}')

const innerConfig = ref<Record<string, any>>({})

const bodyManifest = computed<NodeManifest | null>(() => {
  if (!props.bodyNodeType) return null
  const m = getNodeManifest(props.bodyNodeType)
  if (!m) return null
  return translateManifest(t, m)
})

watch(
  () => props.modelValue,
  (val) => {
    if (val && typeof val === 'object') {
      const newVal = { ...val }
      Object.keys(innerConfig.value).forEach(k => {
        if (!(k in newVal)) delete innerConfig.value[k]
      })
      Object.keys(newVal).forEach(k => {
        if (innerConfig.value[k] !== newVal[k]) innerConfig.value[k] = newVal[k]
      })
    }
    if (!bodyManifest.value) {
      jsonFallback.value = val ? JSON.stringify(val, null, 2) : '{}'
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.bodyNodeType,
  () => {
    innerConfig.value = {}
    showJsonFallback.value = false
    emit('update:modelValue', {})
  }
)

const onBodyConfigChange = (config: Record<string, any>) => {
  innerConfig.value = { ...config }
  emit('update:modelValue', { ...config })
}

const insertVariable = (token: string) => {
  ElMessage.info(t('message.copiedVariable', { token }))
  try {
    navigator.clipboard.writeText(token)
  } catch {
    // fallback: try to copy via execCommand
    const ta = document.createElement('textarea')
    ta.value = token
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

const toggleJsonMode = () => {
  if (!showJsonFallback.value) {
    jsonFallback.value = props.modelValue ? JSON.stringify(props.modelValue, null, 2) : '{}'
    showJsonFallback.value = true
  } else {
    try {
      const parsed = JSON.parse(jsonFallback.value || '{}')
      emit('update:modelValue', parsed)
      showJsonFallback.value = false
    } catch {
      ElMessage.error(t('message.jsonFormatErrorCheckAndRetry'))
    }
  }
}

const onJsonFallbackChange = () => {
  try {
    const parsed = JSON.parse(jsonFallback.value || '{}')
    emit('update:modelValue', parsed)
  } catch {
    // silently ignore until valid
  }
}

import { ElMessage } from 'element-plus'
</script>

<style scoped lang="scss">
.loop-body-form {
  width: 100%;

  .loop-body-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;
    margin-bottom: 10px;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 6px;
      .toolbar-icon {
        color: var(--el-color-primary);
      }
      .toolbar-label {
        font-size: 13px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
    }
  }

  .loop-body-empty,
  .loop-body-unsupported {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 20px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;
    gap: 10px;

    .empty-text,
    .unsupported-text {
      font-size: 13px;
      color: var(--el-text-color-regular);
    }
  }

  .json-fallback {
    margin-top: 10px;
    .json-editor textarea {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
    }
    :deep(.el-button) {
      margin-top: 6px;
    }
  }
}

.loop-var-panel {
  .loop-var-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }
  .loop-var-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 10px;
  }
  .loop-var-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .loop-var-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 10px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
    }

    .loop-var-token {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: var(--el-color-primary);
      font-weight: 500;
    }
    .loop-var-desc {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }
  }
}
</style>
