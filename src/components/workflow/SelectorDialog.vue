<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="780px"
    :close-on-click-modal="false"
    append-to-body
    @close="onClose"
  >
    <div class="selector-content">
      <CommonHostSelector
        v-if="currentType === 'host-selector'"
        :key="`host-${currentType}`"
        :selected-host-ids="selectedIds"
        @select="onHostSelect"
        @confirm="onHostConfirm"
      />
      <CommonHostSelector
        v-else-if="currentType === 'host-group-selector'"
        :key="`host-group-${currentType}`"
        :selected-host-ids="selectedIds"
        @select="onHostSelect"
        @confirm="onHostConfirm"
      />
      <div v-else-if="currentType === 'script-selector'" class="script-selector">
        <div class="script-toolbar">
          <el-tree-select
            v-model="selectedCategory"
            :data="scriptCategories"
            :props="{ label: 'name', children: 'children', value: 'id' }"
            node-key="id"
            :placeholder="t('message.allCategories')"
            clearable
            filterable
            check-strictly
            :render-after-expand="false"
            style="width: 200px"
            @change="onCategoryChange"
          />
          <el-input
            v-model="scriptSearch"
            :placeholder="t('message.searchScriptNameDesc')"
            clearable
            style="flex: 1"
            @keyup.enter="onScriptSearch"
          />
          <el-button type="primary" :icon="Search" @click="onScriptSearch">{{ t('message.search') }}</el-button>
        </div>
        <div class="script-table-wrapper">
          <el-table
            v-loading="scriptLoading"
            :data="scripts"
            highlight-current-row
            row-key="id"
            :current-row-key="currentScriptId"
            size="small"
            height="380"
            @row-click="onScriptRowClick"
          >
            <el-table-column prop="name" :label="t('message.importExcel.scriptName')" min-width="160">
              <template #default="{ row }">
                <span :class="{ 'selected-name': row.id === currentScriptId }">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="category_name" :label="t('message.categoryLabel')" width="110" show-overflow-tooltip />
            <el-table-column prop="type_display" :label="t('message.type')" width="80" />
            <el-table-column prop="desc" :label="t('message.global.description')" show-overflow-tooltip />
            <el-table-column :label="t('message.global.operation')" width="70" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click.stop="onViewScript(row)">{{ t('message.view') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="script-footer">
          <div class="selected-info" v-if="currentScriptId">
            {{ t('message.selected') }}: <span class="selected-name">{{ currentScriptName }}</span>
          </div>
          <div class="selected-info" v-else>
            {{ t('message.noScriptSelected') }}
          </div>
          <el-pagination
            v-model:current-page="scriptPage"
            v-model:page-size="scriptPageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="scriptTotal"
            layout="total, sizes, prev, pager, next"
            small
            background
            @size-change="onScriptPageChange"
            @current-change="onScriptPageChange"
          />
        </div>
      </div>
      <div v-else-if="currentType === 'credential-selector'" class="credential-list">
        <el-input
          v-model="credentialSearch"
          :placeholder="t('message.searchCredentialName')"
          clearable
          style="margin-bottom: 12px"
        />
        <el-table
          :data="filteredCredentials"
          @selection-change="onCredentialSelectionChange"
          size="small"
          max-height="400"
        >
          <el-table-column type="selection" width="48" />
          <el-table-column prop="name" :label="t('message.credentialName')" />
          <el-table-column prop="credential_type" :label="t('message.type')" />
          <el-table-column prop="username" :label="t('message.username')" />
        </el-table>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">{{ t('message.global.cancel') }}</el-button>
      <el-button type="primary" @click="onConfirm">{{ t('message.confirm') }}</el-button>
    </template>

    <el-dialog
      v-model="detailVisible"
      :title="detailScript?.name || t('message.scriptDetail')"
      width="680px"
      :close-on-click-modal="false"
      append-to-body
      destroy-on-close
    >
      <div class="script-detail" v-if="detailScript">
        <el-descriptions :column="2" border size="small" style="margin-bottom: 12px">
          <el-descriptions-item :label="t('message.scriptNameLabel')">{{ detailScript.name }}</el-descriptions-item>
          <el-descriptions-item :label="t('message.scriptType')">{{ detailScript.type_display || detailScript.script_type }}</el-descriptions-item>
          <el-descriptions-item :label="t('message.categoryLabel')">{{ detailScript.category_name || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('message.authType')">{{ detailScript.auth_type_display || detailScript.auth_type }}</el-descriptions-item>
          <el-descriptions-item :label="t('message.global.description')" :span="2">{{ detailScript.desc || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-section-title">{{ t('message.scriptContent') }}</div>
        <pre class="script-content-preview">{{ detailScript.content }}</pre>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">{{ t('message.close') }}</el-button>
        <el-button type="primary" @click="onConfirmFromDetail">{{ t('message.selectThisScript') }}</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import CommonHostSelector from '/@/views/taurus/ops/components/CommonHostSelector.vue'
import { GetList as getScriptList, GetObj as getScriptObj } from '/@/api/taurus/script-library/api'
import { GetList as getCategoryList } from '/@/api/taurus/script-library/category'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  modelValue: any
  type: 'host-selector' | 'host-group-selector' | 'credential-selector' | 'script-selector'
  multiple?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const visible = ref(false)
const selectedIds = ref<any[]>([])
const currentType = ref<typeof props.type>('host-selector')
const currentMultiple = ref(false)

const scriptSearch = ref('')
const scriptLoading = ref(false)
const scripts = ref<any[]>([])
const scriptTotal = ref(0)
const scriptPage = ref(1)
const scriptPageSize = ref(20)

const scriptCategories = ref<any[]>([])
const selectedCategory = ref<any>(null)

const currentScriptId = ref<any>(null)
const currentScriptRow = ref<any>(null)

const credentialSearch = ref('')
const credentials = ref<any[]>([])
const selectedCredentials = ref<any[]>([])

const detailVisible = ref(false)
const detailScript = ref<any>(null)

const dialogTitle = computed(() => {
  switch (currentType.value) {
    case 'host-selector': return t('message.selectTargetHost')
    case 'host-group-selector': return t('message.selectHostGroup')
    case 'script-selector': return t('message.selectScript')
    case 'credential-selector': return t('message.selectCredential')
    default: return t('message.select')
  }
})

const currentScriptName = computed(() => {
  if (currentScriptRow.value) return currentScriptRow.value.name || t('message.untitledScript')
  const found = scripts.value.find(s => s.id === currentScriptId.value)
  return found ? found.name || t('message.untitledScript') : String(currentScriptId.value || '')
})

const filteredCredentials = computed(() => {
  if (!credentialSearch.value) return credentials.value
  const q = credentialSearch.value.toLowerCase()
  return credentials.value.filter((c) =>
    (c.name || '').toLowerCase().includes(q)
  )
})

watch(
  () => props.modelValue,
  (val) => {
    if (Array.isArray(val)) {
      selectedIds.value = val.map((v: any) => (typeof v === 'object' ? v.id : v))
    } else if (val) {
      selectedIds.value = [typeof val === 'object' ? val.id : val]
    } else {
      selectedIds.value = []
    }
  },
  { immediate: true }
)

const open = async (opts?: { type?: typeof props.type; multiple?: boolean; modelValue?: any }) => {
  if (opts?.type) currentType.value = opts.type
  if (opts?.multiple !== undefined) currentMultiple.value = opts.multiple
  lastPickedIds.value = []
  lastPickedHosts.value = []
  scripts.value = []
  selectedCredentials.value = []
  currentScriptId.value = null
  currentScriptRow.value = null
  scriptPage.value = 1
  selectedCategory.value = null
  const val = opts?.modelValue !== undefined ? opts.modelValue : props.modelValue
  if (val) {
    currentScriptId.value = typeof val === 'object' ? val.id : val
    selectedIds.value = [currentScriptId.value]
  } else {
    selectedIds.value = []
  }
  visible.value = true
  await Promise.all([loadCategories(), loadScripts()])
  if (currentScriptId.value) {
    const targetRow = scripts.value.find(s => s.id === currentScriptId.value)
    if (targetRow) {
      currentScriptRow.value = targetRow
    } else {
      currentScriptRow.value = null
    }
  }
}

const loadCategories = async () => {
  if (currentType.value !== 'script-selector') return
  try {
    const res = await getCategoryList({ page: 1, limit: 500 } as any)
    const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.results) ? res.data.results : (Array.isArray(res) ? res : []))
    scriptCategories.value = data
  } catch {
    scriptCategories.value = []
  }
}

const loadScripts = async () => {
  if (currentType.value !== 'script-selector') return
  scriptLoading.value = true
  try {
    const params: any = { page: scriptPage.value, limit: scriptPageSize.value }
    if (scriptSearch.value) {
      params.search = scriptSearch.value
    }
    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }
    const res = await getScriptList(params)
    const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.results) ? res.data.results : (Array.isArray(res) ? res : []))
    scripts.value = data
    scriptTotal.value = res?.data?.count ?? res?.count ?? (Array.isArray(res) ? res.length : 0)
    if (!scriptTotal.value && Array.isArray(res?.data)) {
      scriptTotal.value = res.data.length
    }
  } catch {
    scripts.value = []
    scriptTotal.value = 0
  } finally {
    scriptLoading.value = false
  }
}

const onCategoryChange = () => {
  scriptPage.value = 1
  loadScripts()
}

const onScriptSearch = () => {
  scriptPage.value = 1
  loadScripts()
}

const onScriptPageChange = () => {
  loadScripts()
}

const lastPickedHosts = ref<any[]>([])
const lastPickedIds = ref<any[]>([])

const onHostSelect = (ids: any[], enriched: any[]) => {
  lastPickedIds.value = Array.isArray(ids) ? [...ids] : []
  lastPickedHosts.value = Array.isArray(enriched) && enriched.length
    ? [...enriched]
    : (lastPickedIds.value.map((id) => ({ id })))
  selectedIds.value = currentMultiple.value
    ? lastPickedIds.value
    : (lastPickedIds.value.slice(0, 1))
}

const onHostConfirm = (ids: any[], enriched: any[]) => {
  lastPickedIds.value = Array.isArray(ids) ? [...ids] : []
  lastPickedHosts.value = Array.isArray(enriched) && enriched.length
    ? [...enriched]
    : (lastPickedIds.value.map((id) => ({ id })))
  const finalIds = currentMultiple.value
    ? lastPickedIds.value
    : (lastPickedIds.value.slice(0, 1))
  selectedIds.value = finalIds
  let result: any
  if (currentType.value === 'script-selector') {
    result = currentMultiple.value
      ? (currentScriptId.value ? [currentScriptId.value] : [])
      : (currentScriptId.value || null)
  } else if (currentType.value === 'credential-selector') {
    result = currentMultiple.value
      ? selectedCredentials.value.map((c: any) => c.id)
      : (selectedCredentials.value[0]?.id || null)
  } else {
    result = currentMultiple.value ? finalIds : (finalIds[0] || null)
  }
  emit('update:modelValue', result)
  visible.value = false
}

const onScriptRowClick = (row: any) => {
  if (!row) return
  currentScriptId.value = row.id
  currentScriptRow.value = row
}

const onViewScript = async (row: any) => {
  try {
    const res = await getScriptObj(row.id)
    detailScript.value = res?.data || res
    detailVisible.value = true
  } catch {
    detailScript.value = row
    detailVisible.value = true
  }
}

const onConfirmFromDetail = () => {
  if (detailScript.value) {
    currentScriptId.value = detailScript.value.id
    currentScriptRow.value = detailScript.value
  }
  detailVisible.value = false
}

const onCredentialSelectionChange = (rows: any[]) => {
  selectedCredentials.value = rows
}

const onConfirm = () => {
  let result: any
  if (currentType.value === 'script-selector') {
    result = currentMultiple.value
      ? (currentScriptId.value ? [currentScriptId.value] : [])
      : (currentScriptId.value || null)
  } else if (currentType.value === 'credential-selector') {
    result = currentMultiple.value
      ? selectedCredentials.value.map((c: any) => c.id)
      : (selectedCredentials.value[0]?.id || null)
  } else {
    const useIds = lastPickedIds.value.length > 0 ? lastPickedIds.value : selectedIds.value
    const finalIds = currentMultiple.value ? useIds : useIds.slice(0, 1)
    result = currentMultiple.value ? finalIds : (finalIds[0] || null)
  }
  emit('update:modelValue', result)
  visible.value = false
}

const onClose = () => {
  visible.value = false
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.script-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .script-toolbar {
    display: flex;
    gap: 8px;
  }

  .script-table-wrapper {
    flex: 1;
    min-height: 0;
  }

  .script-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--el-border-color-lighter);

    .selected-info {
      font-size: 13px;
      color: var(--el-text-color-secondary);

      .selected-name {
        color: var(--el-color-primary);
        font-weight: 500;
      }
    }
  }

  .selected-name {
    color: var(--el-color-primary);
    font-weight: 500;
  }
}

.script-detail {
  .detail-section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 6px;
  }

  .script-content-preview {
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    padding: 12px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    line-height: 1.5;
    max-height: 320px;
    overflow: auto;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.script-list,
.credential-list {
  min-height: 200px;
}
</style>
