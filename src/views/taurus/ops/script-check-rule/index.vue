<template>
  <EditionLockedPage feature="SCRIPT_SECURITY_CHECK" :label="t('message.pages.edition.lockedPageLabels.scriptCheckRule')">
  <div class="script-check-rule-page">
    <div class="page-header">
      <div class="title">
        <h2>{{ t('message.pages.scriptCheckRule.pageTitle') }}</h2>
        <span class="desc">{{ t('message.pages.scriptCheckRule.pageDesc') }}</span>
      </div>
      <div class="actions">
        <el-button type="success" @click="handleInitDefault">
          <el-icon><MagicStick /></el-icon>
          {{ t('message.pages.scriptCheckRule.btnInitDefault') }}
        </el-button>
        <el-button type="primary" @click="openRuleForm(null)">
          <el-icon><Plus /></el-icon>
          {{ t('message.pages.scriptCheckRule.btnAddRule') }}
        </el-button>
        <el-button @click="loadRuleList">
          <el-icon><Refresh /></el-icon>
          {{ t('message.pages.scriptCheckRule.btnRefresh') }}
        </el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm">
        <el-form-item :label="t('message.pages.scriptCheckRule.filterNameLabel')">
          <el-input v-model="filterForm.name" :placeholder="t('message.pages.scriptCheckRule.filterNamePlaceholder')" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item :label="t('message.pages.scriptCheckRule.filterSeverityLabel')">
          <el-select v-model="filterForm.severity" :placeholder="t('message.pages.scriptCheckRule.filterAll')" clearable style="width: 140px">
            <el-option :label="t('message.pages.scriptCheckRule.severityError')" value="error" />
            <el-option :label="t('message.pages.scriptCheckRule.severityWarning')" value="warning" />
            <el-option :label="t('message.pages.scriptCheckRule.severityInfo')" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('message.pages.scriptCheckRule.filterScopeLabel')">
          <el-select v-model="filterForm.scope" :placeholder="t('message.pages.scriptCheckRule.filterAll')" clearable style="width: 160px">
            <el-option :label="t('message.pages.scriptCheckRule.scopeAll')" value="all" />
            <el-option :label="t('message.pages.scriptCheckRule.scopeShell')" value="shell" />
            <el-option :label="t('message.pages.scriptCheckRule.scopePython')" value="python" />
            <el-option :label="t('message.pages.scriptCheckRule.scopeSql')" value="sql" />
            <el-option :label="t('message.pages.scriptCheckRule.scopePowershell')" value="powershell" />
            <el-option :label="t('message.pages.scriptCheckRule.scopeJavascript')" value="javascript" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('message.pages.scriptCheckRule.filterStatusLabel')">
          <el-select v-model="filterForm.is_active" :placeholder="t('message.pages.scriptCheckRule.filterAll')" clearable style="width: 120px">
            <el-option :label="t('message.pages.scriptCheckRule.filterEnabled')" :value="true" />
            <el-option :label="t('message.pages.scriptCheckRule.filterDisabled')" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadRuleList">
            <el-icon><Search /></el-icon>
            {{ t('message.pages.scriptCheckRule.btnQuery') }}
          </el-button>
          <el-button @click="resetFilter">{{ t('message.pages.scriptCheckRule.btnReset') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="rule-list">
      <el-table :data="ruleList" border stripe v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column type="index" :label="t('message.pages.scriptCheckRule.colIndex')" width="60" align="center" />
        <el-table-column prop="name" :label="t('message.pages.scriptCheckRule.colName')" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="rule-name-cell">
              <span class="name">{{ row.name }}</span>
              <el-tag v-if="row.is_builtin" type="info" size="small" effect="plain" style="margin-left: 6px">{{ t('message.pages.scriptCheckRule.tagBuiltin') }}</el-tag>
              <el-tag v-if="!row.is_active" type="info" size="small" effect="plain" style="margin-left: 6px">{{ t('message.pages.scriptCheckRule.tagDisabled') }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="rule_key" :label="t('message.pages.scriptCheckRule.colRuleKey')" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="rule-key">{{ row.rule_key }}</code>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.scriptCheckRule.colMatchType')" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.match_type === 'regex' ? 'warning' : 'info'" effect="plain">
              {{ row.match_type_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.scriptCheckRule.colSeverity')" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="severityTagType(row.severity)" effect="dark">
              {{ row.severity_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.scriptCheckRule.colScope')" width="120" align="center">
          <template #default="{ row }">
            {{ row.scope_display }}
          </template>
        </el-table-column>
        <el-table-column prop="pattern" :label="t('message.pages.scriptCheckRule.colPattern')" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="pattern">{{ row.pattern }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" :label="t('message.pages.scriptCheckRule.colSort')" width="80" align="center" />
        <el-table-column prop="create_datetime" :label="t('message.pages.scriptCheckRule.colCreateTime')" width="170" align="center" />
        <el-table-column :label="t('message.pages.scriptCheckRule.colAction')" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openRuleForm(row)">{{ t('message.pages.scriptCheckRule.actionEdit') }}</el-button>
            <el-button size="small" :type="row.is_active ? 'warning' : 'success'" @click="toggleRuleStatus(row)">
              {{ row.is_active ? t('message.pages.scriptCheckRule.actionDisable') : t('message.pages.scriptCheckRule.actionToggle') }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteRule(row)">{{ t('message.pages.scriptCheckRule.actionDelete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <div class="batch-actions" v-if="selectedIds.length > 0">
          <span>{{ t('message.pages.scriptCheckRule.batchSelected', { n: selectedIds.length }) }}</span>
          <el-button size="small" type="success" @click="batchToggle(true)">{{ t('message.pages.scriptCheckRule.batchEnable') }}</el-button>
          <el-button size="small" type="warning" @click="batchToggle(false)">{{ t('message.pages.scriptCheckRule.batchDisable') }}</el-button>
        </div>
        <el-pagination
          v-model:current-page="page.current"
          v-model:page-size="page.size"
          :total="page.total"
          layout="prev, pager, next, total, sizes"
          :page-sizes="[10, 20, 50, 100]"
          background
          @current-change="loadRuleList"
          @size-change="loadRuleList"
        />
      </div>
    </div>

    <!-- Rule form dialog -->
    <el-dialog
      v-model="ruleFormVisible"
      :title="ruleForm.id ? t('message.pages.scriptCheckRule.formTitleEdit') : t('message.pages.scriptCheckRule.formTitleNew')"
      width="680px"
      top="8vh"
      destroy-on-close
    >
      <el-form :model="ruleForm" :rules="ruleFormRules" ref="ruleFormRef" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('message.pages.scriptCheckRule.formNameLabel')" prop="name">
              <el-input v-model="ruleForm.name" :placeholder="t('message.pages.scriptCheckRule.formNamePlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('message.pages.scriptCheckRule.formRuleKeyLabel')" prop="rule_key">
              <el-input v-model="ruleForm.rule_key" :placeholder="t('message.pages.scriptCheckRule.formRuleKeyPlaceholder')" :disabled="!!ruleForm.id" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="t('message.pages.scriptCheckRule.formIssueDescLabel')" prop="description">
          <el-input v-model="ruleForm.description" :placeholder="t('message.pages.scriptCheckRule.formIssueDescPlaceholder')" type="textarea" :rows="2" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('message.pages.scriptCheckRule.formMatchTypeLabel')" prop="match_type">
              <el-radio-group v-model="ruleForm.match_type">
                <el-radio value="keyword">{{ t('message.pages.scriptCheckRule.formMatchKeyword') }}</el-radio>
                <el-radio value="regex">{{ t('message.pages.scriptCheckRule.formMatchRegex') }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('message.pages.scriptCheckRule.formSeverityLabel')" prop="severity">
              <el-select v-model="ruleForm.severity" style="width: 100%">
                <el-option :label="t('message.pages.scriptCheckRule.formSeverityError')" value="error" />
                <el-option :label="t('message.pages.scriptCheckRule.formSeverityWarning')" value="warning" />
                <el-option :label="t('message.pages.scriptCheckRule.formSeverityInfo')" value="info" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="t('message.pages.scriptCheckRule.formPatternLabel')" prop="pattern">
          <el-input v-model="ruleForm.pattern" :placeholder="t('message.pages.scriptCheckRule.formPatternPlaceholder')" />
          <div v-if="ruleForm.match_type === 'regex'" style="font-size: 12px; color: #909399; margin-top: 4px">
            {{ t('message.pages.scriptCheckRule.formRegexHint') }}
          </div>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('message.pages.scriptCheckRule.formScopeLabel')" prop="scope">
              <el-select v-model="ruleForm.scope" style="width: 100%">
                <el-option :label="t('message.pages.scriptCheckRule.formScopeAll')" value="all" />
                <el-option :label="t('message.pages.scriptCheckRule.formScopeShell')" value="shell" />
                <el-option :label="t('message.pages.scriptCheckRule.formScopePython')" value="python" />
                <el-option :label="t('message.pages.scriptCheckRule.formScopeSql')" value="sql" />
                <el-option :label="t('message.pages.scriptCheckRule.formScopePowershell')" value="powershell" />
                <el-option :label="t('message.pages.scriptCheckRule.formScopeJavascript')" value="javascript" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('message.pages.scriptCheckRule.formSortLabel')" prop="sort_order">
              <el-input-number v-model="ruleForm.sort_order" :min="1" :max="9999" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="t('message.pages.scriptCheckRule.formFixSuggestionLabel')" prop="fix_suggestion">
          <el-input v-model="ruleForm.fix_suggestion" :placeholder="t('message.pages.scriptCheckRule.formFixSuggestionPlaceholder')" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item :label="t('message.pages.scriptCheckRule.formStatusLabel')">
          <el-switch v-model="ruleForm.is_active" :active-text="t('message.pages.scriptCheckRule.formStatusEnabled')" :inactive-text="t('message.pages.scriptCheckRule.formStatusDisabled')" />
        </el-form-item>

        <el-form-item :label="t('message.pages.scriptCheckRule.formRemarkLabel')">
          <el-input v-model="ruleForm.remark" :placeholder="t('message.pages.scriptCheckRule.formRemarkPlaceholder')" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleFormVisible = false">{{ t('message.pages.scriptCheckRule.formCancel') }}</el-button>
        <el-button type="primary" @click="saveRule" :loading="saving">{{ t('message.pages.scriptCheckRule.formSave') }}</el-button>
      </template>
    </el-dialog>
  </div>
  </EditionLockedPage>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import EditionLockedPage from '/@/components/EditionLockedPage.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh, Search, MagicStick } from '@element-plus/icons-vue';
import * as ruleApi from '/@/api/taurus/script-library/check-rule';
import { useEditionStore } from '/@/editions/index';
const { GetList, AddObj, UpdateObj, DelObj } = ruleApi;
const { t } = useI18n();

const loading = ref(false);
const saving = ref(false);
const ruleList = ref<any[]>([]);
const selectedIds = ref<number[]>([]);

const page = reactive({
  current: 1,
  size: 20,
  total: 0,
});

const filterForm = reactive({
  name: '',
  severity: '',
  scope: '',
  is_active: undefined as boolean | undefined,
});

const ruleFormVisible = ref(false);
const ruleFormRef = ref();
const ruleForm = reactive<any>({
  id: null,
  name: '',
  rule_key: '',
  description: '',
  pattern: '',
  match_type: 'keyword',
  severity: 'warning',
  scope: 'all',
  fix_suggestion: '',
  is_active: true,
  sort_order: 100,
  remark: '',
});

const ruleFormRules = {
  name: [{ required: true, message: t('message.pages.scriptCheckRule.ruleRequiredName'), trigger: 'blur' }],
  rule_key: [{ required: true, message: t('message.pages.scriptCheckRule.ruleRequiredKey'), trigger: 'blur' }],
  pattern: [{ required: true, message: t('message.pages.scriptCheckRule.ruleRequiredPattern'), trigger: 'blur' }],
  severity: [{ required: true, message: t('message.pages.scriptCheckRule.ruleRequiredSeverity'), trigger: 'change' }],
  match_type: [{ required: true, message: t('message.pages.scriptCheckRule.ruleRequiredMatchType'), trigger: 'change' }],
  scope: [{ required: true, message: t('message.pages.scriptCheckRule.ruleRequiredScope'), trigger: 'change' }],
};

function severityTagType(severity: string) {
  const map: Record<string, string> = {
    error: 'danger',
    warning: 'warning',
    info: 'info',
  };
  return map[severity] || 'info';
}

async function loadRuleList() {
  loading.value = true;
  try {
    const params: any = {
      page: page.current,
      limit: page.size,
    };
    if (filterForm.name) params.search = filterForm.name;
    if (filterForm.severity) params.severity = filterForm.severity;
    if (filterForm.scope) params.scope = filterForm.scope;
    if (filterForm.is_active !== undefined) params.is_active = filterForm.is_active;

    const res: any = await GetList(params);
    ruleList.value = res.data || [];
    page.total = res.total || res.count || ruleList.value.length;
  } finally {
    loading.value = false;
  }
}

function resetFilter() {
  filterForm.name = '';
  filterForm.severity = '';
  filterForm.scope = '';
  filterForm.is_active = undefined;
  page.current = 1;
  loadRuleList();
}

function handleSelectionChange(selection: any[]) {
  selectedIds.value = selection.map(r => r.id);
}

function openRuleForm(row: any) {
  if (row) {
    Object.assign(ruleForm, row);
  } else {
    ruleForm.id = null;
    ruleForm.name = '';
    ruleForm.rule_key = '';
    ruleForm.description = '';
    ruleForm.pattern = '';
    ruleForm.match_type = 'keyword';
    ruleForm.severity = 'warning';
    ruleForm.scope = 'all';
    ruleForm.fix_suggestion = '';
    ruleForm.is_active = true;
    ruleForm.sort_order = 100;
    ruleForm.remark = '';
  }
  ruleFormVisible.value = true;
}

async function saveRule() {
  await ruleFormRef.value?.validate();
  saving.value = true;
  try {
    if (ruleForm.id) {
      await UpdateObj(ruleForm);
      ElMessage.success(t('message.pages.scriptCheckRule.msgUpdateSuccess'));
    } else {
      await AddObj(ruleForm);
      ElMessage.success(t('message.pages.scriptCheckRule.msgCreateSuccess'));
    }
    ruleFormVisible.value = false;
    loadRuleList();
  } finally {
    saving.value = false;
  }
}

async function toggleRuleStatus(row: any) {
  try {
    await ruleApi.toggleRule(row.id);
    ElMessage.success(t('message.pages.scriptCheckRule.msgOperationSuccess'));
    loadRuleList();
  } catch {}
}

async function deleteRule(row: any) {
  try {
    await ElMessageBox.confirm(
      t('message.pages.scriptCheckRule.msgConfirmDelete', { name: row.name }),
      t('message.pages.scriptCheckRule.msgConfirmDeleteTitle'),
      { type: 'warning' }
    );
  } catch {
    return;
  }
  try {
    await DelObj(row.id);
    ElMessage.success(t('message.pages.scriptCheckRule.msgDeleteSuccess'));
    loadRuleList();
  } catch {}
}

async function batchToggle(enable: boolean) {
  if (!selectedIds.value.length) return;
  try {
    if (enable) {
      await ruleApi.batchEnable(selectedIds.value);
    } else {
      await ruleApi.batchDisable(selectedIds.value);
    }
    ElMessage.success(t('message.pages.scriptCheckRule.msgOperationSuccess'));
    loadRuleList();
  } catch {}
}

async function handleInitDefault() {
  try {
    const res: any = await ruleApi.initDefaultRules();
    const created = res.data?.created || 0;
    ElMessage.success(
      created > 0
        ? t('message.pages.scriptCheckRule.msgInitSuccess', { count: created })
        : t('message.pages.scriptCheckRule.msgInitNoDuplicate')
    );
    loadRuleList();
  } catch {}
}

onMounted(() => {
  if (!useEditionStore().hasFeature('SCRIPT_SECURITY_CHECK')) return;
  loadRuleList();
});
</script>

<style scoped lang="scss">
.script-check-rule-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .title {
      h2 {
        margin: 0 0 6px 0;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }
      .desc {
        font-size: 13px;
        color: #909399;
      }
    }

    .actions {
      display: flex;
      gap: 10px;
    }
  }

  .filter-bar {
    background: #fff;
    padding: 16px 20px;
    border-radius: 6px;
    margin-bottom: 16px;
    border: 1px solid #ebeef5;
  }

  .rule-list {
    background: #fff;
    padding: 20px;
    border-radius: 6px;
    border: 1px solid #ebeef5;

    .rule-name-cell {
      display: flex;
      align-items: center;

      .name {
        font-weight: 500;
      }
    }

    .rule-key {
      font-family: monospace;
      font-size: 12px;
      color: #409eff;
      background: #ecf5ff;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .pattern {
      font-family: monospace;
      font-size: 12px;
      color: #606266;
    }

    .pagination-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;

      .batch-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        color: #606266;
      }
    }
  }
}
</style>