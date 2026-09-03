<template>
  <div class="condition-expr-editor">
    <div class="editor-header" v-if="!readonly">
      <span class="editor-tip">{{ t('message.pages.workflowEditor.weCondExpression') }}</span>
      <el-icon class="help-icon" :size="14" @click.stop="helpDrawerVisible = true">
        <QuestionFilled />
      </el-icon>
    </div>
    <div class="editor-wrapper" ref="wrapperRef">
      <el-input
        ref="inputRef"
        v-model="innerValue"
        type="textarea"
        :rows="rows"
        :placeholder="placeholder || t('message.pages.workflowEditor.weCondPlaceholder')"
        :disabled="readonly"
        :readonly="readonly"
        @input="readonly ? undefined : onInput"
        @focus="readonly ? undefined : onFocus"
        @blur="onBlur"
        @click="readonly ? undefined : showDropdown"
      />
      <div
        v-if="!readonly && showSuggestions && filteredSuggestions.length > 0"
        class="suggestions-dropdown"
        :style="dropdownStyle"
        @mousedown.prevent
      >
        <div
          v-for="(s, i) in filteredSuggestions"
          :key="s.value"
          class="suggestion-item"
          :class="{ active: i === activeIndex }"
          @mouseenter="activeIndex = i"
          @click="selectSuggestion(s)"
        >
          <span class="s-icon">{{ s.icon }}</span>
          <span class="s-label">{{ s.label }}</span>
          <span class="s-value">{{ s.value }}</span>
        </div>
      </div>
    </div>
    <div v-if="!readonly && showDropdown && groupedSuggestions.length > 0" class="var-tree">
      <div class="var-tree-title">{{ t('message.pages.workflowEditor.weCondAvailableVars') }}</div>
      <div v-for="group in groupedSuggestions" :key="group.nodeId" class="var-group">
        <div class="var-group-title">
          <span class="v-icon">{{ group.icon }}</span>
          <span>{{ group.nodeLabel }}</span>
          <span class="v-id">[{{ group.nodeId }}]</span>
        </div>
        <div
          v-for="field in group.fields"
          :key="field.value"
          class="var-field"
          @click="insertVariable(field.value)"
        >
          <span class="field-key">{{ field.key }}</span>
          <span class="field-label">{{ field.label }}</span>
        </div>
      </div>
      <div v-if="groupedSuggestions.length === 0" class="var-empty">{{ t('message.pages.workflowEditor.weCondNoUpstream') }}</div>
    </div>

    <el-drawer
      v-model="helpDrawerVisible"
      :title="t('message.pages.workflowEditor.weCondHelpTitle')"
      direction="rtl"
      :size="520"
      :with-header="true"
      destroy-on-close
    >
      <div class="help-drawer-content">
        <ul class="help-list">
          <li>
            <b>{{ t('message.pages.workflowEditor.weCondSyntaxGuide') }}</b>：{{ t('message.pages.workflowEditor.weCondSyntaxDesc') }}
            <div class="help-section">
              <p class="help-section-title">
                <span class="help-idx">①</span>{{ t('message.pages.workflowEditor.weCondAvailablePaths') }}<small class="help-sub">
                  <code>nodeKey</code> {{ t('message.pages.workflowEditor.weCondNodeKeyDesc') }}
                </small>
              </p>
              <ul class="help-items">
                <li><code>nodeKey.status</code><span>{{ t('message.pages.workflowEditor.weCondPathStatus') }} {{ t('message.pages.workflowEditor.weCondMoreIntuitive') }}</span></li>
                <li><code>nodeKey.output.xxx</code><span>{{ t('message.pages.workflowEditor.weCondPathOutput') }}</span></li>
                <li><code>workflow.env.XXX</code><span>{{ t('message.pages.workflowEditor.weCondPathEnv') }}</span></li>
                <li><code>trigger.XXX</code><span>{{ t('message.pages.workflowEditor.weCondPathTrigger') }}</span></li>
              </ul>
            </div>

            <div class="help-section">
              <p class="help-section-title">
                <span class="help-idx">②</span>
                {{ t('message.pages.workflowEditor.weCondBuiltinFns') }}
              </p>
              <ul class="help-items">
                <li><code>success(nodeKey)</code><span>{{ t('message.pages.workflowEditor.weCondFnSuccess') }}</span></li>
                <li><code>failed(nodeKey)</code><span>{{ t('message.pages.workflowEditor.weCondFnFailed') }}</span></li>
                <li><code>skipped(nodeKey)</code><span>{{ t('message.pages.workflowEditor.weCondFnSkipped') }}</span></li>
                <li><code>cancelled(nodeKey)</code><span>{{ t('message.pages.workflowEditor.weCondFnCancelled') }}</span></li>
                <li><code>status(nodeKey, 'SUCCESS')</code><span>{{ t('message.pages.workflowEditor.weCondFnStatus') }}</span></li>
                <li><code>AND(a, b)</code> / <code>OR(a, b)</code> / <code>NOT(x)</code><span>{{ t('message.pages.workflowEditor.weCondFnLogic') }}</span></li>
                <li><code>__from__</code><span>{{ t('message.pages.workflowEditor.weCondFnSugar') }}</span></li>
              </ul>
            </div>

            <div class="help-section">
              <p class="help-section-title">
                <span class="help-idx">③</span>
                {{ t('message.pages.workflowEditor.weCondCompOps') }}
              </p>
              <ul class="help-items">
                <li><code>== != < <= > >=</code><span>{{ t('message.pages.workflowEditor.weCondOpBinary') }}</span></li>
                <li><code>&& || !</code><span>{{ t('message.pages.workflowEditor.weCondOpLogic') }}</span></li>
                <li><code>true/false</code><span>{{ t('message.pages.workflowEditor.weCondOpBool') }}</span></li>
                <li><code>'hello'</code> / <code>"world"</code><span>{{ t('message.pages.workflowEditor.weCondOpString') }}</span></li>
              </ul>
            </div>

            <div class="help-section">
              <p class="help-section-title">
                <span class="help-idx">④</span>
                {{ t('message.pages.workflowEditor.weCondExamples') }}
              </p>
              <div class="help-example">
                <label>{{ t('message.pages.workflowEditor.weCondEx1') }}</label>
                <span class="help-desc">{{ t('message.pages.workflowEditor.weCondEx1Desc') }}</span>
                <code>success(__from__)</code>
              </div>
              <div class="help-example">
                <label>{{ t('message.pages.workflowEditor.weCondEx2') }}</label>
                <span class="help-desc">{{ t('message.pages.workflowEditor.weCondEx2Desc') }}</span>
                <code>node_xxx.output.exit_code == 0</code>
              </div>
              <div class="help-example">
                <label>{{ t('message.pages.workflowEditor.weCondEx3') }}</label>
                <span class="help-desc">{{ t('message.pages.workflowEditor.weCondEx3Desc') }}</span>
                <code>AND(success(node_http), node_http.output.status_code >= 200)</code>
              </div>
              <div class="help-example">
                <label>{{ t('message.pages.workflowEditor.weCondEx4') }}</label>
                <span class="help-desc">{{ t('message.pages.workflowEditor.weCondEx4Desc') }}</span>
                <code>node_check.output.branch == 'true'</code>
              </div>
              <div class="help-example">
                <label>{{ t('message.pages.workflowEditor.weCondEx5') }}</label>
                <span class="help-desc">{{ t('message.pages.workflowEditor.weCondEx5Desc') }}</span>
                <code>workflow.env.ENV == 'prod'</code>
              </div>
            </div>
          </li>
        </ul>
        <p class="help-tip">
          {{ t('message.pages.workflowEditor.weCondHelpTip') }}
        </p>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
import type { Edge, Node } from '@vue-flow/core'
import { getNodeManifest } from '/@/views/taurus/workflow/manifest/registry.ts'
import type { NodeFieldSchema } from '/@/views/taurus/workflow/manifest/types.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Suggestion {
  value: string
  label: string
  icon: string
  nodeId: string
  fieldKey?: string
}

interface GroupedSuggestion {
  nodeId: string
  nodeLabel: string
  icon: string
  fields: { key: string; label: string; value: string }[]
}

const props = defineProps<{
  modelValue: string
  nodes: Node[]
  edges: Edge[]
  currentNodeId?: string
  placeholder?: string
  rows?: number
  readonly?: boolean
}>()

const readonly = computed(() => !!props.readonly)

const emit = defineEmits<{
  (_evt: 'update:modelValue', val: string): void
}>()
void emit

const innerValue = ref(props.modelValue)
const inputRef = ref()
const wrapperRef = ref<HTMLElement | null>(null)
const showDropdown = ref(false)
const showSuggestions = ref(false)
const activeIndex = ref(0)
const cursorPos = ref(0)
const rows = ref(props.rows || 3)
const helpDrawerVisible = ref(false)
const isEditing = ref(false)

watch(
  () => props.modelValue,
  (val) => {
    if (isEditing.value) return
    if (innerValue.value !== val) innerValue.value = val
  }
)

watch(
  innerValue,
  (val, oldVal) => {
    if (val !== oldVal && !props.readonly) {
      isEditing.value = true
      emit('update:modelValue', val)
      checkTrigger(val)
    }
  }
)

watch(
  () => [props.nodes.length, props.edges.length, props.currentNodeId],
  () => {
    showDropdown.value = false
    showSuggestions.value = false
  }
)

const upstreamNodes = computed(() => {
  if (!props.currentNodeId) return []
  const incomingEdges = props.edges.filter((e) => e.target === props.currentNodeId)
  const upstreamIds = new Set(incomingEdges.map((e) => e.source))
  return props.nodes.filter((n) => upstreamIds.has(n.id))
})

const groupedSuggestions = computed<GroupedSuggestion[]>(() => {
  const groups: GroupedSuggestion[] = []
  for (const node of upstreamNodes.value) {
    const nodeType = node.data?.config?.nodeType
    if (!nodeType) continue
    const manifest = getNodeManifest(nodeType)
    if (!manifest) continue
    const outputFields = manifest.outputSchema || []
    if (outputFields.length === 0) continue
    const fields = outputFields.map((f: NodeFieldSchema) => ({
      key: f.key,
      label: f.label,
      value: `${node.id}.${f.key}`
    }))
    groups.push({
      nodeId: node.id,
      nodeLabel: node.data?.label || manifest.displayName,
      icon: manifest.icon,
      fields
    })
  }
  return groups
})

const allSuggestions = computed<Suggestion[]>(() => {
  const list: Suggestion[] = []
  for (const group of groupedSuggestions.value) {
    for (const field of group.fields) {
      list.push({
        value: field.value,
        label: `${group.nodeLabel} / ${field.label}`,
        icon: group.icon,
        nodeId: group.nodeId,
        fieldKey: field.key
      })
    }
  }
  return list
})

const filteredSuggestions = computed(() => {
  const query = currentQuery.value.toLowerCase()
  if (!query) return allSuggestions.value.slice(0, 10)
  return allSuggestions.value
    .filter(
      (s) =>
        s.value.toLowerCase().includes(query) ||
        s.label.toLowerCase().includes(query) ||
        s.fieldKey?.toLowerCase().includes(query)
    )
    .slice(0, 10)
})

const currentQuery = ref('')

const dropdownStyle = computed(() => {
  if (!wrapperRef.value) return {}
  return {
    position: 'absolute',
    top: `${(cursorPos.value || 0) * 0}px`,
    left: '0',
    width: '100%',
    zIndex: 100
  } as unknown as Record<string, string | number>
})

const onInput = (val: string) => {
  isEditing.value = true
  checkTrigger(val)
}

const onFocus = () => {
  showDropdown.value = true
}

const onBlur = () => {
  setTimeout(() => {
    isEditing.value = false
    showDropdown.value = false
    showSuggestions.value = false
  }, 300)
}

const showDropdownPanel = () => {
  showDropdown.value = true
}
void showDropdownPanel

const checkTrigger = (val?: string) => {
  const text = val ?? innerValue.value
  const caret = getCaretPosition()
  if (caret <= 0) {
    showSuggestions.value = false
    return
  }
  const textBefore = text.substring(0, caret)
  const lastSpace = Math.max(
    textBefore.lastIndexOf(' '),
    textBefore.lastIndexOf('\n'),
    textBefore.lastIndexOf('('),
    textBefore.lastIndexOf(','),
    textBefore.lastIndexOf(')'),
  )
  const queryStart = lastSpace === -1 ? 0 : lastSpace + 1
  currentQuery.value = textBefore.substring(queryStart)
  if (currentQuery.value.length > 0) {
    showSuggestions.value = true
    activeIndex.value = 0
  } else {
    showSuggestions.value = false
  }
}

const getCaretPosition = (): number => {
  const el = inputRef.value as HTMLTextAreaElement | undefined
  if (!el) return 0
  return el.selectionStart || 0
}

const selectSuggestion = (s: Suggestion) => {
  insertVariable(s.value)
}

const insertVariable = (template: string) => {
  const el = inputRef.value as HTMLTextAreaElement | undefined
  if (!el) return
  const caret = getCaretPosition()
  const textBefore = innerValue.value.substring(0, caret)
  const textAfter = innerValue.value.substring(caret)
  const lastSpace = Math.max(
    textBefore.lastIndexOf(' '),
    textBefore.lastIndexOf('\n'),
    textBefore.lastIndexOf('('),
    textBefore.lastIndexOf(','),
    textBefore.lastIndexOf(')'),
  )
  const queryStart = lastSpace === -1 ? 0 : lastSpace + 1
  let newVal: string
  newVal = textBefore.substring(0, queryStart) + template + textAfter
  innerValue.value = newVal
  emit('update:modelValue', newVal)
  showSuggestions.value = false
  showDropdown.value = false
  nextTick(() => {
    const newCaret = queryStart + template.length
    el.setSelectionRange(newCaret, newCaret)
    currentQuery.value = ''
  })
}
</script>

<style scoped lang="scss">
.condition-expr-editor {
  position: relative;
  width: 100%;

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
    .editor-tip {
      font-size: 12px;
      color: #606266;
      font-weight: 500;
    }
    .help-icon {
      cursor: pointer;
      color: #909399;
      transition: color .15s ease;
      &:hover {
        color: #409EFF;
      }
    }
  }

  .editor-wrapper {
    position: relative;
    width: 100%;
  }
  .suggestions-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    max-height: 200px;
    overflow-y: auto;
    z-index: 100;
    margin-top: 4px;
    .suggestion-item {
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 13px;
      &:hover,
      &.active {
        background: #ecf5ff;
      }
      .s-icon {
        font-size: 14px;
      }
      .s-label {
        flex: 1;
        color: #303133;
      }
      .s-value {
        color: #909399;
        font-family: monospace;
        font-size: 12px;
      }
    }
  }
  .var-tree {
    margin-top: 8px;
    padding: 8px;
    background: #f5f7fa;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
    max-height: 240px;
    overflow-y: auto;
    .var-tree-title {
      font-size: 12px;
      color: #606266;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .var-group {
      margin-bottom: 8px;
      .var-group-title {
        font-size: 12px;
        color: #303133;
        padding: 4px 0;
        border-bottom: 1px solid #e4e7ed;
        margin-bottom: 4px;
        display: flex;
        gap: 6px;
        align-items: center;
        .v-icon {
          font-size: 14px;
        }
        .v-id {
          color: #909399;
          font-size: 11px;
        }
      }
      .var-field {
        padding: 4px 8px;
        cursor: pointer;
        display: flex;
        gap: 8px;
        font-size: 12px;
        border-radius: 3px;
        &:hover {
          background: #ecf5ff;
        }
        .field-key {
          font-family: monospace;
          color: #409eff;
          font-weight: 500;
        }
        .field-label {
          color: #606266;
        }
      }
    }
    .var-empty {
      text-align: center;
      color: #909399;
      font-size: 12px;
      padding: 12px;
    }
  }
}

.help-drawer-content {
  font-size: 13px;
  color: #303133;
  line-height: 1.7;

  .help-list {
    list-style: none;
    padding: 0;
    margin: 0;
    > li {
      margin-bottom: 16px;
    }
  }

  .help-section {
    margin-top: 12px;
    padding: 10px 12px;
    background: #f5f7fa;
    border-radius: 6px;
    border: 1px solid #ebeef5;

    .help-section-title {
      margin: 0 0 8px 0;
      font-size: 13px;
      font-weight: 600;
      color: #1f2d3d;
      display: flex;
      align-items: flex-start;
      gap: 6px;

      .help-idx {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #409eff;
        color: #fff;
        font-size: 11px;
        flex-shrink: 0;
      }

      .help-sub {
        font-size: 12px;
        font-weight: normal;
        color: #606266;
        display: block;
        margin-top: 4px;
        line-height: 1.5;
        code {
          background: #e4e7ed;
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 12px;
          font-family: 'Consolas', 'Monaco', monospace;
        }
      }
    }

    .help-items {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        display: flex;
        align-items: baseline;
        gap: 8px;
        padding: 6px 0;
        border-bottom: 1px dashed #ebeef5;
        font-size: 12px;
        &:last-child {
          border-bottom: none;
        }
        code {
          background: #ecf5ff;
          color: #409eff;
          padding: 1px 6px;
          border-radius: 3px;
          font-size: 12px;
          font-family: 'Consolas', 'Monaco', monospace;
          white-space: nowrap;
          flex-shrink: 0;
        }
        span {
          color: #606266;
        }
      }
    }
  }

  .help-example {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 6px;
    font-size: 12px;

    label {
      color: #909399;
      font-weight: 500;
      flex-shrink: 0;
    }

    .help-desc {
      color: #606266;
      flex-shrink: 0;
    }

    code {
      background: #ecf5ff;
      color: #409eff;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-family: 'Consolas', 'Monaco', monospace;
      flex: 1;
      text-align: right;
      overflow-x: auto;
    }
  }

  .help-tip {
    margin-top: 16px;
    padding: 10px 14px;
    background: #fdf6ec;
    border: 1px solid #faecd8;
    border-radius: 6px;
    color: #e6a23c;
    font-size: 12px;
  }
}
</style>
