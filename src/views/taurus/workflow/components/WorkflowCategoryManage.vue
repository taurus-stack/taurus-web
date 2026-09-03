<template>
  <div class="wf-cat-manage">
    <div class="top-bar">
      <el-form :inline="true" size="default">
        <el-form-item :label="t('message.pages.workflowCategoryManage.wcmSearch')">
          <el-input
            v-model="searchKeyword"
            :placeholder="t('message.pages.workflowCategoryManage.wcmSearchPh')"
            clearable
            style="width: 240px;"
            @keyup.enter="loadList"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="loadList">{{ t('message.pages.workflowCategoryManage.wcmQuery') }}</el-button>
        </el-form-item>
      </el-form>
      <div class="actions">
        <el-button type="primary" @click="openForm(null, false)">{{ t('message.pages.workflowCategoryManage.wcmNewRoot') }}</el-button>
        <el-button type="warning" plain :loading="ensureLoading" @click="ensureDefaults">{{ t('message.pages.workflowCategoryManage.wcmResetDefault') }}</el-button>
      </div>
    </div>

    <div class="table-wrap">
      <el-table
        :data="flatList"
        border
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        default-expand-all
        style="width: 100%;"
        size="default"
      >
        <el-table-column prop="name" :label="t('message.pages.workflowCategoryManage.wcmColName')" min-width="200">
          <template #default="{ row }">
            <span style="font-weight: 500;">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category_code" :label="t('message.pages.workflowCategoryManage.wcmColCode')" width="140">
          <template #default="{ row }">
            <el-tag v-if="row.category_code" size="small" type="info" effect="plain">{{ row.category_code }}</el-tag>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" :label="t('message.pages.workflowCategoryManage.wcmColSort')" width="80" align="center" />
        <el-table-column prop="workflow_count" :label="t('message.pages.workflowCategoryManage.wcmColWorkflowCount')" width="90" align="center">
          <template #default="{ row }">
            <span :style="{ color: (row.workflow_count || 0) > 0 ? '#409eff' : '#c0c4cc', fontWeight: 600 }">
              {{ row.workflow_count || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.workflowCategoryManage.wcmColSystemBuiltin')" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.is_system" size="small" type="success" effect="light">{{ t('message.pages.workflowCategoryManage.wcmYes') }}</el-tag>
            <span v-else style="color: #c0c4cc;">{{ t('message.pages.workflowCategoryManage.wcmNo') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" :label="t('message.pages.workflowCategoryManage.wcmColRemark')" min-width="180" show-overflow-tooltip />
        <el-table-column prop="create_datetime" :label="t('message.pages.workflowCategoryManage.wcmColCreateTime')" width="160">
          <template #default="{ row }">
            {{ row.create_datetime ? row.create_datetime.slice(0, 16) : '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.workflowCategoryManage.wcmColActions')" width="230" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openForm(row, false)">{{ t('message.pages.workflowCategoryManage.wcmActionEdit') }}</el-button>
            <el-button size="small" text type="success" @click="openForm(row, true)">{{ t('message.pages.workflowCategoryManage.wcmActionAddChild') }}</el-button>
            <el-button
              size="small"
              text
              type="danger"
              :disabled="row.is_system"
              @click="handleDelete(row)"
            >{{ t('message.pages.workflowCategoryManage.wcmActionDelete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="formVisible" :title="formTitle" width="560px" destroy-on-close>
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="90px"
        label-position="right"
      >
        <el-form-item :label="t('message.pages.workflowCategoryManage.wcmFormParent')" prop="parent">
          <el-tree-select
            v-model="form.parent"
            :data="parentOptions"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            node-key="id"
            check-strictly
            clearable
            :placeholder="t('message.pages.workflowCategoryManage.wcmFormParentRoot')"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item :label="t('message.pages.workflowCategoryManage.wcmColName')" prop="name">
          <el-input v-model="form.name" :placeholder="t('message.pages.workflowCategoryManage.wcmFormNamePh')" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item :label="t('message.pages.workflowCategoryManage.wcmColCode')" prop="category_code">
          <el-input
            v-model="form.category_code"
            :placeholder="t('message.pages.workflowCategoryManage.wcmFormCodePh')"
            maxlength="64"
          />
        </el-form-item>
        <el-form-item :label="t('message.pages.workflowCategoryManage.wcmColSort')" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="9999" controls-position="right" />
        </el-form-item>
        <el-form-item :label="t('message.pages.workflowCategoryManage.wcmColRemark')" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            maxlength="500"
            :placeholder="t('message.pages.workflowCategoryManage.wcmFormRemarkPh')"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">{{ t('cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ t('message.pages.workflowCategoryManage.wcmFormSave') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import * as api from '/@/api/taurus/workflow/category'

const emit = defineEmits<{ (e: 'refresh'): void }>()

const searchKeyword = ref('')
const treeData = ref<any[]>([])
const parentOptions = ref<any[]>([])
const formVisible = ref(false)
const formRef = ref<FormInstance>()
const saving = ref(false)
const ensureLoading = ref(false)
const formMode = ref<'create' | 'edit' | 'create-child'>('create')

const form = reactive({
  id: null as number | null,
  name: '',
  parent: null as number | null,
  category_code: '',
  sort: 0,
  remark: '',
})

const formRules: FormRules = {
  name: [{ required: true, message: t('message.pages.workflowCategoryManage.wcmValNameRequired'), trigger: 'blur' }],
}

const formTitle = computed(() => {
  if (formMode.value === 'edit') return t('message.pages.workflowCategoryManage.wcmFormTitleEdit')
  if (formMode.value === 'create-child') return t('message.pages.workflowCategoryManage.wcmFormTitleNewChild')
  return t('message.pages.workflowCategoryManage.wcmFormTitleNew')
})

const flattenNodes = (nodes: any[], depth = 0): any[] => {
  const result: any[] = []
  for (const n of nodes) {
    const clone = { ...n, _depth: depth }
    if (n.children && n.children.length > 0) {
      clone.children = flattenNodes(n.children, depth + 1)
    }
    result.push(clone)
  }
  return result
}

const applyFilterToTree = (nodes: any[], keyword: string): any[] => {
  if (!keyword) return nodes
  const kw = keyword.toLowerCase()
  const match = (n: any): boolean => {
    return (
      (n.name || '').toLowerCase().includes(kw) ||
      (n.category_code || '').toLowerCase().includes(kw)
    )
  }
  const walk = (list: any[]): any[] => {
    const out: any[] = []
    for (const n of list) {
      const children = n.children ? walk(n.children) : []
      if (match(n) || children.length > 0) {
        out.push({ ...n, children: children.length ? children : undefined })
      }
    }
    return out
  }
  return walk(nodes)
}

const flatList = computed(() => {
  const filtered = applyFilterToTree(treeData.value, searchKeyword.value)
  return flattenNodes(filtered)
})

const buildParentOptions = (nodes: any[], excludeId?: number | null): any[] => {
  const excludeSet = new Set<number>()
  if (excludeId) {
    const collect = (list: any[]): boolean => {
      for (const n of list) {
        if (n.id === excludeId) {
          excludeSet.add(n.id)
          const pushAll = (c: any[]) => c.forEach(x => {
            excludeSet.add(x.id)
            if (x.children) pushAll(x.children)
          })
          if (n.children) pushAll(n.children)
          return true
        }
        if (n.children && collect(n.children)) return true
      }
      return false
    }
    collect(nodes)
  }
  const walk = (list: any[]): any[] => {
    const out: any[] = []
    for (const n of list) {
      if (excludeSet.has(n.id)) continue
      const children = n.children ? walk(n.children) : []
      out.push({ id: n.id, name: n.name, children: children.length ? children : undefined })
    }
    return out
  }
  return walk(nodes)
}

onMounted(() => {
  loadList()
})

const loadList = async () => {
  try {
    const res = await api.GetTree()
    const data = res?.data || res || []
    const root = Array.isArray(data) && data.length > 0 ? data[0] : null
    const realData = root?.children && root.virtual_root ? root.children : (root ? [root] : [])
    treeData.value = realData
  } catch (e: any) {
    treeData.value = []
  }
}

const openForm = async (row: any, isChild: boolean) => {
  if (formRef.value) formRef.value.clearValidate()
  if (!row || isChild) {
    formMode.value = isChild ? 'create-child' : 'create'
    form.id = null
    form.name = ''
    form.category_code = ''
    form.sort = 0
    form.remark = ''
    form.parent = row?.id ? Number(row.id) : null
  } else {
    formMode.value = 'edit'
    form.id = row.id
    form.name = row.name
    form.category_code = row.category_code || ''
    form.sort = row.sort ?? 0
    form.remark = row.remark || ''
    form.parent = row.parent ? Number(row.parent) : null
  }
  await nextTick()
  parentOptions.value = buildParentOptions(treeData.value, form.id)
  formVisible.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      parent: form.parent ?? null,
      category_code: form.category_code?.trim() || null,
      sort: Number(form.sort) || 0,
      remark: form.remark || '',
    }
    if (form.id) {
      await api.UpdateObj({ id: form.id, ...payload })
      ElMessage.success(t('message.pages.workflowCategoryManage.wcmMsgSaveOk'))
    } else {
      await api.AddObj(payload)
      ElMessage.success(t('message.pages.workflowCategoryManage.wcmMsgCreateOk'))
    }
    formVisible.value = false
    await loadList()
    emit('refresh')
  } catch (e: any) {
    ElMessage.error(e?.message || t('message.pages.workflowCategoryManage.wcmMsgSaveFail'))
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row: any) => {
  if (row.is_system) {
    ElMessage.warning(t('message.pages.workflowCategoryManage.wcmMsgSystemBuiltinNoDelete'))
    return
  }
  const hasChildren = row.children && row.children.length > 0
  const cnt = row.workflow_count || 0
  const warnLine = hasChildren
    ? t('message.pages.workflowCategoryManage.wcmDelWarnChildren', { n: row.children.length })
    : cnt > 0
      ? t('message.pages.workflowCategoryManage.wcmDelWarnWorkflows', { n: cnt })
      : ''
  try {
    await ElMessageBox.confirm(
      t('message.pages.workflowCategoryManage.wcmDelConfirmMsg', { name: row.name }) + (warnLine ? '\n' + warnLine : ''),
      t('message.pages.workflowCategoryManage.wcmDelConfirmTitle'),
      { type: 'warning', confirmButtonText: t('message.pages.workflowCategoryManage.wcmDelBtn'), cancelButtonText: t('cancel') }
    )
    await api.DelObj(row.id)
    ElMessage.success(t('message.pages.workflowCategoryManage.wcmMsgDelOk'))
    await loadList()
    emit('refresh')
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.message || t('message.pages.workflowCategoryManage.wcmMsgDelFail'))
    }
  }
}

const ensureDefaults = async () => {
  try {
    ensureLoading.value = true
    await api.EnsureDefaults()
    ElMessage.success(t('message.pages.workflowCategoryManage.wcmMsgResetOk'))
    await loadList()
    emit('refresh')
  } catch (e: any) {
    ElMessage.error(e?.message || t('message.pages.workflowCategoryManage.wcmMsgResetFail'))
  } finally {
    ensureLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.wf-cat-manage {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  :deep(.el-form-item) { margin-bottom: 0; }
}
.table-wrap {
  background: #fff;
  border-radius: 6px;
  overflow: auto;
  max-height: 560px;
}
</style>