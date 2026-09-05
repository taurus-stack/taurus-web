<template>
  <EditionLockedPage feature="WORKFLOW_APPROVAL_FLOW" :label="t('message.pages.edition.lockedPageLabels.workflowApprovalRule')">
  <div class="wf-approval-rule-page">
    <div class="page-header">
      <div class="header-left">
        <div class="title">
          <h2>{{ t('message.pages.workflowApprovalRule.warPageTitle') }}</h2>
          <span class="desc">{{ t('message.pages.workflowApprovalRule.warPageDesc') }}</span>
        </div>
        <div class="stats">
          <div class="stat-item">
            <div class="stat-icon total-icon">
              <el-icon :size="16"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ page.total }}</div>
              <div class="stat-label">{{ t('message.pages.workflowApprovalRule.warTotalRules') }}</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon active-icon">
              <el-icon :size="16"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ activeCount }}</div>
              <div class="stat-label">{{ t('message.pages.workflowApprovalRule.warActive') }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="openRuleForm(null)">
          <el-icon><Plus /></el-icon>
          {{ t('message.pages.workflowApprovalRule.warAddRule') }}
        </el-button>
        <el-button @click="loadRuleList">
          <el-icon><Refresh /></el-icon>
          {{ t('message.global.refresh') }}
        </el-button>
      </div>
    </div>

    <div class="card-list-wrap">
      <div v-if="ruleList.length === 0" class="empty-state">
        <el-empty :description="t('message.pages.workflowApprovalRule.warNoRules')">
          <el-button type="primary" @click="openRuleForm(null)">{{ t('message.pages.workflowApprovalRule.warCreateFirst') }}</el-button>
        </el-empty>
      </div>
      <div v-else class="rule-cards">
        <div
          v-for="row in ruleList"
          :key="row.id"
          class="rule-card"
          :class="{ 'card-inactive': !row.is_active }"
        >
          <div class="card-accent" :style="{ background: getPriorityColor(row.priority) }"></div>
          
          <div class="card-body">
            <div class="card-header">
              <div class="card-title-row">
                <h3 class="rule-name">{{ row.name }}</h3>
                <el-tag
                  v-if="!row.is_active"
                  type="info"
                  effect="plain"
                  class="status-tag"
                >
                  <span class="status-dot"></span>{{ t('message.pages.workflowApprovalRule.warInactive') }}
                </el-tag>
                <el-tag v-else type="success" effect="plain" class="status-tag active">
                  <span class="status-dot"></span>{{ t('message.pages.workflowApprovalRule.warActive') }}
                </el-tag>
              </div>
              <div class="card-meta">
                <el-tag size="small" type="warning" effect="light">{{ t('message.pages.workflowApprovalRule.warPriority') }}: {{ row.priority }}</el-tag>
                <el-tag size="small" effect="plain">{{ (row.condition_groups || []).length }}  {{ t('message.pages.workflowApprovalRule.warCondGroups') }}</el-tag>
                <el-tag size="small" type="info" effect="plain">{{ row.node_count }}  {{ t('message.pages.workflowApprovalRule.warApprovalNodes') }}</el-tag>
              </div>
            </div>

            <div v-if="row.description" class="card-desc">
              {{ row.description }}
            </div>

            <div class="card-chips">
              <div v-for="(group, gIdx) in (row.condition_groups || []).slice(0, 2)" :key="gIdx" class="group-chip">
                <span class="chip-label">{{ t('message.pages.workflowApprovalRule.warGroup') }}{{ Number(gIdx) + 1 }}:</span>
                <span class="chip-count">{{ Object.keys(group).length }}  {{ t('message.pages.workflowApprovalRule.warConditions') }}</span>
              </div>
              <div v-if="(row.condition_groups || []).length > 2" class="group-chip more">
                +{{ Number((row.condition_groups || []).length) - 2 }} {{ t('message.pages.workflowApprovalRule.warGroup') }}
              </div>
            </div>

            <div class="card-footer">
              <div class="card-creator">
                <el-icon><User /></el-icon>
                <span>{{ row.creator_name || t('message.pages.workflowApprovalRule.warSystem') }}</span>
                <span class="card-time">{{ formatTime(row.create_datetime) }}</span>
              </div>
              <div class="card-actions">
                <el-button type="primary" link size="small" @click="openNodeManager(row)">
                  <el-icon><Connection /></el-icon>{{ t('message.pages.workflowApprovalRule.warNodeManage') }}
                </el-button>
                <el-button link size="small" @click="openRuleForm(row)">
                  <el-icon><Edit /></el-icon>{{ t('message.global.edit') }}
                </el-button>
                <el-button
                  link
                  size="small"
                  :type="row.is_active ? 'warning' : 'success'"
                  @click="toggleRuleStatus(row)"
                >
                  {{ row.is_active ? t('message.pages.workflowApprovalRule.warDeactivate') : t('message.pages.workflowApprovalRule.warActivate') }}
                </el-button>
                <el-button link size="small" type="danger" @click="deleteRule(row)">
                  <el-icon><Delete /></el-icon>{{ t('message.global.delete') }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="ruleList.length > 0" class="pagination-bar">
        <el-pagination
          v-model:current-page="page.current"
          v-model:page-size="page.size"
          :total="page.total"
          layout="prev, pager, next, total"
          background
          class="modern-pagination"
          @current-change="loadRuleList"
          @size-change="loadRuleList"
        />
      </div>
    </div>

    <el-dialog
      v-model="ruleFormVisible"
      :title="ruleForm.id ? t('message.global.edit') + t('message.pages.workflowApprovalRule.warRule') : t('message.pages.workflowApprovalRule.warAddRule')"
      width="800px"
      top="5vh"
      destroy-on-close
      class="modern-dialog"
    >
      <el-form :model="ruleForm" :rules="ruleFormRules" ref="ruleFormRef" label-width="100px">
        <el-form-item :label="t('message.pages.workflowApprovalRule.warColRuleName')" prop="name">
          <el-input v-model="ruleForm.name" :placeholder="t('message.pages.workflowApprovalRule.warPhRuleName')" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item :label="t('message.global.description')">
          <el-input v-model="ruleForm.description" type="textarea" :rows="2" :placeholder="t('message.pages.workflowApprovalRule.warPhDescOptional')" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item :label="t('message.pages.workflowApprovalRule.warPriority')" prop="priority">
          <el-input-number v-model="ruleForm.priority" :min="1" :max="9999" />
          <span style="margin-left: 12px; font-size: 12px; color: #909399"> {{ t('message.pages.workflowApprovalRule.warPriorityHint') }}</span>
        </el-form-item>
        <el-form-item :label="t('message.global.status')">
          <el-switch v-model="ruleForm.is_active" :active-text="t('message.pages.workflowApprovalRule.warActivate')" :inactive-text="t('message.pages.workflowApprovalRule.warDeactivate')" />
        </el-form-item>

        <el-form-item :label="t('message.pages.workflowApprovalRule.warCondGroups')">
          <div class="condition-groups">
            <div v-if="ruleForm.condition_groups.length > 1" class="or-label">
              <el-tag type="warning" effect="dark">{{ t('message.pages.workflowApprovalRule.warOrHint') }}</el-tag>
            </div>

            <div
              v-for="(group, gIndex) in ruleForm.condition_groups"
              :key="gIndex"
              class="condition-group"
            >
              <div class="group-header">
                <span class="group-title">{{ t('message.pages.workflowApprovalRule.warCondGroup') }}{{ gIndex + 1 }}</span>
                <el-tag size="small" type="info" effect="plain">{{ t('message.pages.workflowApprovalRule.warAndHint') }}</el-tag>
                <el-button
                  v-if="ruleForm.condition_groups.length > 1"
                  type="danger"
                  size="small"
                  text
                  @click="removeConditionGroup(gIndex)"
                >
                  {{ t('message.pages.workflowApprovalRule.warDeleteGroup') }}
                </el-button>
              </div>

              <div class="condition-list">
                <div
                  v-for="(cond, cIndex) in group.conditions"
                  :key="cIndex"
                  class="condition-item"
                >
                  <el-select v-model="cond.field" style="width: 150px" @change="onConditionFieldChange(Number(gIndex), Number(cIndex))">
                    <el-option :label="t('message.pages.workflowApprovalRule.warFieldCategory')" value="category_ids" />
                    <el-option :label="t('message.pages.workflowApprovalRule.warFieldMode')" value="workflow_modes" />
                    <el-option v-if="hasFeature('WORKFLOW_RISK_ASSESSMENT')" :label="t('message.pages.workflowApprovalRule.warFieldRisk')" value="risk_levels" />
                    <el-option v-if="hasFeature('WORKFLOW_RISK_ASSESSMENT')" :label="t('message.pages.workflowApprovalRule.warFieldMinRisk')" value="min_risk_points" />
                    <el-option :label="t('message.pages.workflowApprovalRule.warFieldAuth')" value="auth_types" />
                    <el-option :label="t('message.pages.workflowApprovalRule.warFieldWf')" value="workflow_ids" />
                    <el-option :label="t('message.pages.workflowApprovalRule.warFieldScript')" value="script_ids" />
                    <el-option :label="t('message.pages.workflowApprovalRule.warFieldTags')" value="tags" />
                  </el-select>

                  <div class="condition-value">
                    <el-select
                      v-if="cond.field === 'category_ids'"
                      v-model="cond.value"
                      multiple
                      filterable
                      :placeholder="t('message.pages.workflowApprovalRule.warPhSelectCategory')"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="cat in categoryOptions"
                        :key="cat.id"
                        :label="cat.name"
                        :value="cat.id"
                      />
                    </el-select>

                    <el-select
                      v-else-if="cond.field === 'workflow_modes'"
                      v-model="cond.value"
                      multiple
                      :placeholder="t('message.pages.workflowApprovalRule.warPhSelectMode')"
                      style="width: 100%"
                    >
                      <el-option :label="t('message.pages.workflowApprovalRule.warModeDag')" value="dag" />
                      <el-option :label="t('message.pages.workflowApprovalRule.warModeLinear')" value="linear" />
                    </el-select>

                    <el-select
                      v-else-if="cond.field === 'risk_levels'"
                      v-model="cond.value"
                      multiple
                      :placeholder="t('message.pages.workflowApprovalRule.warPhSelectRisk')"
                      style="width: 100%"
                    >
                      <el-option :label="t('message.pages.workflowApprovalRule.warRiskHigh')" value="high" />
                      <el-option :label="t('message.pages.workflowApprovalRule.warRiskMedium')" value="medium" />
                      <el-option :label="t('message.pages.workflowApprovalRule.warRiskLow')" value="low" />
                    </el-select>

                    <el-select
                      v-else-if="cond.field === 'auth_types'"
                      v-model="cond.value"
                      multiple
                      :placeholder="t('message.pages.workflowApprovalRule.warPhSelectAuth')"
                      style="width: 100%"
                    >
                      <el-option :label="t('message.global.private')" value="private" />
                      <el-option :label="t('message.global.public')" value="public" />
                    </el-select>

                    <el-input-number
                      v-else-if="cond.field === 'min_risk_points'"
                      v-model="cond.value"
                      :min="1"
                      :max="20"
                      style="width: 100%"
                    />

                    <el-select
                      v-else-if="cond.field === 'workflow_ids'"
                      v-model="cond.value"
                      multiple
                      filterable
                      remote
                      :placeholder="t('message.pages.workflowApprovalRule.warPhSearchWf')"
                      style="width: 100%"
                      :remote-method="(kw: string) => loadWorkflowOptions(kw)"
                      :loading="workflowOptionsLoading"
                    >
                      <el-option
                        v-for="wf in workflowOptions"
                        :key="wf.id"
                        :label="wf.name"
                        :value="wf.id"
                      />
                    </el-select>

                    <el-select
                      v-else-if="cond.field === 'script_ids'"
                      v-model="cond.value"
                      multiple
                      filterable
                      remote
                      :placeholder="t('message.pages.workflowApprovalRule.warPhSearchScript')"
                      style="width: 100%"
                      :remote-method="(kw: string) => loadScriptOptions(kw)"
                      :loading="scriptOptionsLoading"
                    >
                      <el-option
                        v-for="s in scriptOptions"
                        :key="s.id"
                        :label="s.template_name || s.name"
                        :value="s.id"
                      />
                    </el-select>

                    <el-select
                      v-else-if="cond.field === 'tags'"
                      v-model="cond.value"
                      multiple
                      filterable
                      allow-create
                      default-first-option
                      :placeholder="t('message.pages.workflowApprovalRule.warPhTags')"
                      style="width: 100%"
                    >
                      <el-option v-for="tag in tagSuggestions" :key="tag" :label="tag" :value="tag" />
                    </el-select>
                  </div>

                  <el-button type="danger" text @click="removeCondition(gIndex as number, cIndex as number)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>

                <el-button size="small" @click="addCondition(gIndex)">
                  <el-icon><Plus /></el-icon>
                  {{ t('message.pages.workflowApprovalRule.warAddCondition') }}
                </el-button>
              </div>
            </div>

            <el-button type="primary" plain @click="addConditionGroup">
              <el-icon><Plus /></el-icon>
              {{ t('message.pages.workflowApprovalRule.warAddCondGroup') }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleFormVisible = false">{{ t('message.global.cancel') }}</el-button>
        <el-button type="primary" @click="saveRule" :loading="saving">{{ t('message.global.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="nodeDialogVisible"
      :title="t('message.pages.workflowApprovalRule.warNodeFlowTitle', { name: currentRule?.name || '' })"
      width="720px"
      top="5vh"
      destroy-on-close
      class="modern-dialog"
    >
      <div class="node-timeline-manager">
        <div class="node-header">
          <div class="node-header-info">
            <el-icon :size="20" color="#409eff"><Connection /></el-icon>
            <span>{{ t('message.pages.workflowApprovalRule.warNodeFlowDesc') }}</span>
          </div>
          <el-button type="primary" @click="openNodeForm(null)">
            <el-icon><Plus /></el-icon>
            {{ t('message.pages.workflowApprovalRule.warBtnAddNode') }}
          </el-button>
        </div>

        <div v-loading="nodeLoading" class="timeline-container">
          <div v-if="nodeList.length === 0" class="empty-state">
            <el-empty :description="t('message.pages.workflowApprovalRule.warNoNodes')" />
          </div>
          
          <div v-else class="approval-timeline">
            <div
              v-for="(node, index) in nodeList"
              :key="node.id"
              class="timeline-item"
            >
              <div class="timeline-node">
                <div class="node-order">{{ index + 1 }}</div>
              </div>
              
              <div v-if="index < nodeList.length - 1" class="timeline-connector"></div>
              
              <div class="node-card">
                <div class="node-card-header">
                  <div class="node-title-row">
                    <h4>{{ node.node_name }}</h4>
                    <el-tag size="small" :type="getModeTagType(node.approval_mode)">
                      {{ node.approval_mode_display }}
                    </el-tag>
                  </div>
                  <div class="node-actions">
                    <el-button
                      size="small"
                      text
                      :disabled="index === 0"
                      @click="moveNode(index, -1)"
                    >
                      <el-icon><ArrowUp /></el-icon>
                    </el-button>
                    <el-button
                      size="small"
                      text
                      :disabled="index === nodeList.length - 1"
                      @click="moveNode(index, 1)"
                    >
                      <el-icon><ArrowDown /></el-icon>
                    </el-button>
                    <el-button size="small" text @click="openNodeForm(node)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button size="small" text type="danger" @click="deleteNode(node)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
                
                <div class="node-card-body">
                  <el-descriptions :column="2" size="small" border>
                    <el-descriptions-item :label="t('message.pages.workflowApprovalRule.warColApproverType')" :span="2">
                      {{ node.approver_type_display }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="t('message.pages.workflowApprovalRule.warColStepOrder')">
                      {{ t('message.pages.workflowApprovalRule.warStepN', { n: node.step_order }) }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="t('message.pages.workflowApprovalRule.warColNodeId')">
                      {{ node.id }}
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="nodeDialogVisible = false">{{ t('message.global.close') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="nodeFormVisible"
      :title="nodeForm.id ? t('message.global.edit') + t('message.pages.workflowApprovalRule.warNode') : t('message.pages.workflowApprovalRule.warAddNode')"
      width="560px"
      destroy-on-close
      class="modern-dialog"
    >
      <el-form :model="nodeForm" :rules="nodeFormRules" ref="nodeFormRef" label-width="100px">
        <el-form-item :label="t('message.pages.workflowApprovalRule.warColNodeName')" prop="node_name">
          <el-input v-model="nodeForm.node_name" :placeholder="t('message.pages.workflowApprovalRule.warPhNodeNameExample')" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item :label="t('message.pages.workflowApprovalRule.warColApproverType')" prop="approver_type">
          <el-select v-model="nodeForm.approver_type" style="width: 100%" @change="onApproverTypeChange">
            <el-option :label="t('message.pages.workflowApprovalRule.warApproverCategory')" value="category_reviewer" />
            <el-option :label="t('message.pages.workflowApprovalRule.warColSpecificUsers')" value="specific_users" />
            <el-option :label="t('message.pages.workflowApprovalRule.warColSpecificRoles')" value="role" />
            <el-option :label="t('message.pages.workflowApprovalRule.warApproverManager')" value="submitter_manager" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="nodeForm.approver_type === 'specific_users'" :label="t('message.pages.workflowApprovalRule.warColSpecificUsers')">
          <el-select
            v-model="nodeForm.approver_config.user_ids"
            multiple
            filterable
            :placeholder="t('message.pages.workflowApprovalRule.warPhSelectUser')"
            style="width: 100%"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.username + (user.name ? ` (${user.name})` : '')"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="nodeForm.approver_type === 'role'" :label="t('message.pages.workflowApprovalRule.warColSpecificRoles')">
          <el-select
            v-model="nodeForm.approver_config.role_codes"
            multiple
            filterable
            :placeholder="t('message.pages.workflowApprovalRule.warPhSelectRole')"
            style="width: 100%"
          >
            <el-option :label="t('message.pages.workflowApprovalRule.warRoleSuperAdmin')" value="superadmin" />
            <el-option :label="t('message.pages.workflowApprovalRule.warRoleAdmin')" value="admin" />
            <el-option :label="t('message.pages.workflowApprovalRule.warRoleOps')" value="ops" />
            <el-option :label="t('message.pages.workflowApprovalRule.warRoleDev')" value="dev" />
            <el-option :label="t('message.pages.workflowApprovalRule.warRoleDba')" value="dba" />
            <el-option :label="t('message.pages.workflowApprovalRule.warRoleSecurity')" value="security" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="nodeForm.approver_type === 'submitter_manager'" :label="t('message.pages.workflowApprovalRule.warColManagerLevel')">
          <el-input-number v-model="nodeForm.approver_config.levels" :min="1" :max="5" />
          <span style="margin-left: 12px; font-size: 12px; color: #909399">{{ t('message.pages.workflowApprovalRule.warManagerLevelHint') }}</span>
        </el-form-item>

        <el-form-item :label="t('message.pages.workflowApprovalRule.warColApprovalMode')" prop="approval_mode">
          <el-radio-group v-model="nodeForm.approval_mode">
            <el-radio value="any">{{ t('message.pages.workflowApprovalRule.warModeOr') }}</el-radio>
            <el-radio value="all">{{ t('message.pages.workflowApprovalRule.warModeAnd') }}</el-radio>
            <el-radio value="first">{{ t('message.pages.workflowApprovalRule.warModeFirst') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="nodeFormVisible = false">{{ t('message.global.cancel') }}</el-button>
        <el-button type="primary" @click="saveNode" :loading="nodeSaving">{{ t('message.global.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
  </EditionLockedPage>
</template>

<script setup lang="ts" name="WorkflowApprovalRule">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Plus, Refresh, Delete, Document, CircleCheck, 
  User, Connection, Edit, ArrowUp, ArrowDown 
} from '@element-plus/icons-vue';
import { request } from '/@/utils/service';
import * as ruleApi from '/@/api/taurus/workflow/approval-rule';
import * as nodeApi from '/@/api/taurus/workflow/approval-node';
import * as categoryApi from '/@/api/taurus/workflow/category';
import { useI18n } from 'vue-i18n';
import { useEditionStore } from '/@/editions';
import EditionLockedPage from '/@/components/EditionLockedPage.vue';

const { t } = useI18n();
const editionStore = useEditionStore();
const hasFeature = (code: string) => editionStore.hasFeature(code);

const loading = ref(false);
const saving = ref(false);
const nodeLoading = ref(false);
const nodeSaving = ref(false);

const ruleList = ref<any[]>([]);
const page = reactive({ current: 1, size: 10, total: 0 });

const activeCount = computed(() => {
  return ruleList.value.filter(r => r.is_active).length;
});

function getPriorityColor(priority: number) {
  if (priority <= 10) return '#f56c6c';
  if (priority <= 50) return '#e6a23c';
  if (priority <= 100) return '#409eff';
  return '#67c23a';
}

function formatTime(dateStr: string) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', { 
    year: 'numeric', month: '2-digit', day: '2-digit', 
    hour: '2-digit', minute: '2-digit' 
  });
}

function getModeTagType(mode: string) {
  switch (mode) {
    case 'any': return 'success';
    case 'all': return 'warning';
    case 'first': return 'info';
    default: return '';
  }
}

const ruleFormVisible = ref(false);
const ruleFormRef = ref<any>(null);
const ruleForm = reactive({
  id: null as number | null,
  name: '',
  description: '',
  priority: 100,
  is_active: true,
  condition_groups: [] as any[],
});

const ruleFormRules = {
  name: [
    { required: true, message: t('message.pages.workflowApprovalRule.warPhRuleName'), trigger: 'blur' },
    { min: 2, max: 100, message: t('message.pages.workflowApprovalRule.warRuleNameLenHint'), trigger: 'blur' },
  ],
};

const categoryOptions = ref<any[]>([]);
const userList = ref<any[]>([]);

const workflowOptions = ref<any[]>([]);
const workflowOptionsLoading = ref(false);
const scriptOptions = ref<any[]>([]);
const scriptOptionsLoading = ref(false);
const tagSuggestions = computed(() => [
  t('message.pages.workflowApprovalRule.warTagProdChange'), t('message.pages.workflowApprovalRule.warTagDatabase'), t('message.pages.workflowApprovalRule.warTagRelease'),
  t('message.pages.workflowApprovalRule.warTagRestart'), t('message.pages.workflowApprovalRule.warTagConfigUpdate'), t('message.pages.workflowApprovalRule.warTagHighRisk'), t('message.pages.workflowApprovalRule.warTagUrgent')
]);

const nodeDialogVisible = ref(false);
const nodeFormVisible = ref(false);
const nodeFormRef = ref<any>(null);
const currentRule = ref<any>(null);
const nodeList = ref<any[]>([]);
const nodeForm = reactive({
  id: null as number | null,
  rule: null as number | null,
  node_name: '',
  approver_type: 'category_reviewer',
  approver_config: {} as any,
  approval_mode: 'any',
  step_order: 1,
});

const nodeFormRules = {
  node_name: [
    { required: true, message: t('message.pages.workflowApprovalRule.warPhNodeName'), trigger: 'blur' },
  ],
  approver_type: [
    { required: true, message: t('message.pages.workflowApprovalRule.warPhApproverType'), trigger: 'change' },
  ],
  approval_mode: [
    { required: true, message: t('message.pages.workflowApprovalRule.warPhApprovalMode'), trigger: 'change' },
  ],
};

onMounted(() => {
  if (!editionStore.hasFeature('WORKFLOW_APPROVAL_FLOW')) return;
  loadRuleList();
  loadCategories();
  loadUsers();
});

async function loadCategories() {
  try {
    const res = await categoryApi.GetTree();
    const cats: any[] = [];
    const flatten = (list: any[]) => {
      list.forEach((item) => {
        if (item.is_system !== true) {
          cats.push(item);
        }
        if (item.children?.length) {
          flatten(item.children);
        }
      });
    };
    flatten(res.data || []);
    categoryOptions.value = cats;
  } catch (e) {
    // silently ignore
  }
}

async function loadUsers() {
  try {
    const res: any = await request({
      url: '/api/taurus/user-options/',
      method: 'get',
      params: { size: 200 },
    });
    userList.value = res.data?.results || res.data || [];
  } catch (e) {
    // silently ignore
  }
}

let _wfTimer: any = null;
async function loadWorkflowOptions(keyword = '') {
  if (_wfTimer) clearTimeout(_wfTimer);
  workflowOptionsLoading.value = true;
  _wfTimer = setTimeout(async () => {
    try {
      const res: any = await request({
        url: '/api/taurus/workflow/',
        method: 'get',
        params: { search: keyword, size: 50 },
      });
      workflowOptions.value = (res.data?.results || res.data || []).map((x: any) => ({
        id: x.id,
        name: x.name,
      }));
    } finally {
      workflowOptionsLoading.value = false;
    }
  }, 200);
}

let _scriptTimer: any = null;
// Clean up debounce timer on unmount to prevent callbacks after unmount
onUnmounted(() => {
  if (_wfTimer) clearTimeout(_wfTimer);
  if (_scriptTimer) clearTimeout(_scriptTimer);
});

async function loadScriptOptions(keyword = '') {
  if (_scriptTimer) clearTimeout(_scriptTimer);
  scriptOptionsLoading.value = true;
  _scriptTimer = setTimeout(async () => {
    try {
      const res: any = await request({
        url: '/api/taurus/template/',
        method: 'get',
        params: { search: keyword, size: 50 },
      });
      scriptOptions.value = (res.data?.results || res.data || []).map((x: any) => ({
        id: x.id,
        template_name: x.template_name || x.name,
      }));
    } catch (e) {
      try {
        const res2: any = await request({
          url: '/api/taurus/script/',
          method: 'get',
          params: { search: keyword, size: 50 },
        });
        scriptOptions.value = (res2.data?.results || res2.data || []).map((x: any) => ({
          id: x.id,
          template_name: x.name,
        }));
      } finally {
        scriptOptionsLoading.value = false;
      }
    } finally {
      scriptOptionsLoading.value = false;
    }
  }, 200);
}

async function loadRuleList() {
  loading.value = true;
  try {
    const res = await ruleApi.GetList({
      page: page.current,
      size: page.size,
    });
    ruleList.value = res.data?.results || res.data || [];
    page.total = res.data?.total || ruleList.value.length;
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.workflowApprovalRule.warLoadRulesFail'));
  } finally {
    loading.value = false;
  }
}

function openRuleForm(row: any) {
  if (ruleFormRef.value) {
    ruleFormRef.value.clearValidate();
  }
  if (row && row.id) {
    ruleForm.id = row.id;
    ruleForm.name = row.name;
    ruleForm.description = row.description || '';
    ruleForm.priority = row.priority ?? 100;
    ruleForm.is_active = row.is_active !== false;
    ruleForm.condition_groups = (row.condition_groups || []).map((g: any) => ({
      conditions: Object.entries(g).map(([field, value]) => ({ field, value })),
    }));
    if (ruleForm.condition_groups.length === 0) {
      ruleForm.condition_groups = [{ conditions: [] }];
    }
  } else {
    ruleForm.id = null;
    ruleForm.name = '';
    ruleForm.description = '';
    ruleForm.priority = 100;
    ruleForm.is_active = true;
    ruleForm.condition_groups = [{ conditions: [] }];
  }
  ruleFormVisible.value = true;
}

function addConditionGroup() {
  ruleForm.condition_groups.push({ conditions: [] });
}

function removeConditionGroup(index: number) {
  ruleForm.condition_groups.splice(index, 1);
}

function addCondition(groupIndex: number) {
  ruleForm.condition_groups[groupIndex].conditions.push({
    field: 'workflow_modes',
    value: [],
  });
}

function removeCondition(groupIndex: number, condIndex: number) {
  ruleForm.condition_groups[groupIndex].conditions.splice(condIndex, 1);
}

function onConditionFieldChange(groupIndex: number, condIndex: number) {
  const cond = ruleForm.condition_groups[groupIndex].conditions[condIndex];
  if (cond.field === 'min_risk_points') {
    cond.value = 1;
  } else {
    cond.value = [];
  }
}

function buildConditionGroups() {
  return ruleForm.condition_groups
    .filter((g: any) => g.conditions.length > 0)
    .map((g: any) => {
      const group: any = {};
      g.conditions.forEach((c: any) => {
        group[c.field] = c.value;
      });
      return group;
    });
}

async function saveRule() {
  if (!ruleFormRef.value) return;
  try {
    await ruleFormRef.value.validate();
  } catch {
    return;
  }

  const condition_groups = buildConditionGroups();

  saving.value = true;
  try {
    if (ruleForm.id) {
      await ruleApi.UpdateObj({
        id: ruleForm.id,
        name: ruleForm.name,
        description: ruleForm.description,
        priority: ruleForm.priority,
        is_active: ruleForm.is_active,
        condition_groups,
      });
      ElMessage.success(t('message.pages.workflowApprovalRule.warUpdateSuccess'));
    } else {
      await ruleApi.AddObj({
        name: ruleForm.name,
        description: ruleForm.description,
        priority: ruleForm.priority,
        is_active: ruleForm.is_active,
        condition_groups,
      });
      ElMessage.success(t('message.pages.workflowApprovalRule.warCreateSuccess'));
    }
    ruleFormVisible.value = false;
    loadRuleList();
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.workflowApprovalRule.warSaveFail'));
  } finally {
    saving.value = false;
  }
}

async function toggleRuleStatus(row: any) {
  try {
    const action = row.is_active ? t('message.pages.workflowApprovalRule.warDeactivate') : t('message.pages.workflowApprovalRule.warActivate');
    await ElMessageBox.confirm(t('message.pages.workflowApprovalRule.warToggleRuleConfirm', { action, name: row.name }), t('message.global.confirm'), { type: 'warning' });
    await ruleApi.UpdateObj({
      id: row.id,
      is_active: !row.is_active,
    });
    ElMessage.success(t('message.pages.workflowApprovalRule.warToggleSuccess', { action }));
    loadRuleList();
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || t('message.pages.workflowApprovalRule.warOpFail'));
    }
  }
}

async function deleteRule(row: any) {
  try {
    await ElMessageBox.confirm(t('message.pages.workflowApprovalRule.warDeleteRuleConfirm', { name: row.name }), t('message.pages.workflowApprovalRule.warDeleteConfirm'), {
      type: 'error',
      confirmButtonText: t('message.pages.workflowApprovalRule.warConfirmDelete'),
    });
    await ruleApi.DelObj(row.id);
    ElMessage.success(t('message.pages.workflowApprovalRule.warDeleteSuccess'));
    loadRuleList();
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || t('message.pages.workflowApprovalRule.warDeleteFail'));
    }
  }
}

async function openNodeManager(row: any) {
  currentRule.value = row;
  nodeDialogVisible.value = true;
  await loadNodeList(row.id);
}

async function loadNodeList(ruleId: number) {
  nodeLoading.value = true;
  try {
    const res = await nodeApi.GetList({ rule: ruleId, size: 50 });
    nodeList.value = res.data?.results || res.data || [];
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.workflowApprovalRule.warLoadNodesFail'));
  } finally {
    nodeLoading.value = false;
  }
}

function openNodeForm(row: any) {
  if (nodeFormRef.value) {
    nodeFormRef.value.clearValidate();
  }
  if (row && row.id) {
    nodeForm.id = row.id;
    nodeForm.rule = currentRule.value?.id;
    nodeForm.node_name = row.node_name;
    nodeForm.approver_type = row.approver_type;
    nodeForm.approver_config = { ...(row.approver_config || {}) };
    nodeForm.approval_mode = row.approval_mode;
    nodeForm.step_order = row.step_order;
  } else {
    nodeForm.id = null;
    nodeForm.rule = currentRule.value?.id;
    nodeForm.node_name = '';
    nodeForm.approver_type = 'category_reviewer';
    nodeForm.approver_config = {};
    nodeForm.approval_mode = 'any';
    nodeForm.step_order = nodeList.value.length + 1;
  }
  nodeFormVisible.value = true;
}

function onApproverTypeChange() {
  nodeForm.approver_config = {};
}

async function saveNode() {
  if (!nodeFormRef.value) return;
  try {
    await nodeFormRef.value.validate();
  } catch {
    return;
  }

  nodeSaving.value = true;
  try {
    if (nodeForm.id) {
      await nodeApi.UpdateObj({
        id: nodeForm.id,
        rule: currentRule.value?.id,
        node_name: nodeForm.node_name,
        approver_type: nodeForm.approver_type,
        approver_config: nodeForm.approver_config,
        approval_mode: nodeForm.approval_mode,
        step_order: nodeForm.step_order,
      });
      ElMessage.success(t('message.pages.workflowApprovalRule.warUpdateSuccess'));
    } else {
      await nodeApi.AddObj({
        rule: currentRule.value?.id,
        node_name: nodeForm.node_name,
        approver_type: nodeForm.approver_type,
        approver_config: nodeForm.approver_config,
        approval_mode: nodeForm.approval_mode,
        step_order: nodeList.value.length + 1,
      });
      ElMessage.success(t('message.pages.workflowApprovalRule.warCreateSuccess'));
    }
    nodeFormVisible.value = false;
    loadNodeList(currentRule.value?.id);
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.workflowApprovalRule.warSaveFail'));
  } finally {
    nodeSaving.value = false;
  }
}

async function deleteNode(row: any) {
  try {
    await ElMessageBox.confirm(t('message.pages.workflowApprovalRule.warDeleteNodeConfirm', { name: row.node_name }), t('message.pages.workflowApprovalRule.warDeleteConfirm'), { type: 'warning' });
    await nodeApi.DelObj(row.id);
    ElMessage.success(t('message.pages.workflowApprovalRule.warDeleteSuccess'));
    loadNodeList(currentRule.value?.id);
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || t('message.pages.workflowApprovalRule.warDeleteFail'));
    }
  }
}

async function moveNode(index: number, direction: number) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= nodeList.value.length) return;

  const nodeOrders = nodeList.value.map((node, i) => {
    if (i === index) return { id: node.id, step_order: newIndex + 1 };
    if (i === newIndex) return { id: node.id, step_order: index + 1 };
    return { id: node.id, step_order: i + 1 };
  });

  try {
    await ruleApi.updateNodeOrder(currentRule.value?.id, nodeOrders);
    loadNodeList(currentRule.value?.id);
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.workflowApprovalRule.warSortFail'));
  }
}
</script>

<style scoped lang="scss">
.wf-approval-rule-page {
  width: 100%;
  height: calc(100vh - 85px - 50px);
  padding: 16px;
  box-sizing: border-box;
  min-height: 0;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    flex-shrink: 0;
    min-height: 0;

    .header-left {
      display: flex;
      align-items: center;
      gap: 24px;

      .title {
        h2 {
          margin: 0;
          font-size: 18px;
          color: #303133;
        }
        .desc {
          font-size: 12px;
          color: #909399;
          margin-left: 12px;
        }
      }

      .stats {
        display: flex;
        gap: 24px;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f5f7fa;
          border-radius: 8px;

          .stat-icon {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;

            &.total-icon {
              background: #ecf5ff;
              color: #409eff;
            }
            &.active-icon {
              background: #f0f9eb;
              color: #67c23a;
            }
          }

          .stat-info {
            .stat-value {
              font-size: 16px;
              font-weight: 600;
              color: #303133;
              line-height: 1.2;
            }
            .stat-label {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .card-list-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 0;

    .empty-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      border-radius: 8px;
      padding: 60px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }

  .rule-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 16px;
  }

  .rule-card {
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.3s;
    display: flex;
    position: relative;
    border: 1px solid #ebeef5;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    &.card-inactive {
      opacity: 0.75;
    }

    .card-accent {
      width: 4px;
      flex-shrink: 0;
    }

    .card-body {
      flex: 1;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .card-header {
      .card-title-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        .rule-name {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          flex-shrink: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 200px;
        }

        .status-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          
          .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
          }
        }
      }

      .card-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }

    .card-desc {
      color: #606266;
      font-size: 13px;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .group-chip {
        background: #f5f7fa;
        border-radius: 4px;
        padding: 4px 10px;
        font-size: 12px;
        color: #606266;
        display: flex;
        gap: 4px;

        &.more {
          background: #ebeef5;
          color: #909399;
        }
      }
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #ebeef5;

      .card-creator {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #909399;
        font-size: 12px;

        .card-time {
          margin-left: 8px;
        }
      }

      .card-actions {
        display: flex;
        gap: 4px;
      }
    }
  }

  .pagination-bar {
    flex-shrink: 0;
    background: #fff;
    border-radius: 8px;
    padding: 10px 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .condition-groups {
    width: 100%;

    .or-label {
      margin-bottom: 16px;
    }

    .condition-group {
      border: 1px solid #ebeef5;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      background: #fafbfc;
      border-left: 4px solid #409eff;

      .group-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;

        .group-title {
          font-weight: 600;
          color: #303133;
          font-size: 14px;
        }
      }

      .condition-list {
        .condition-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
          background: #fff;
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #ebeef5;

          .condition-value {
            flex: 1;
          }
        }
      }
    }
  }

  .node-timeline-manager {
    .node-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #ebeef5;

      .node-header-info {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        color: #303133;
        font-size: 14px;
      }
    }

    .timeline-container {
      min-height: 200px;
    }

    .approval-timeline {
      position: relative;
      padding-left: 40px;

      .timeline-item {
        position: relative;
        padding-bottom: 32px;

        .timeline-node {
          position: absolute;
          left: -40px;
          top: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #409eff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 600;
          z-index: 2;

          .node-order {
            font-size: 13px;
          }
        }

        .timeline-connector {
          position: absolute;
          left: -23px;
          top: 32px;
          bottom: 0;
          width: 2px;
          background: #e4e7ed;
        }

        .node-card {
          background: #fff;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #ebeef5;
          transition: all 0.3s;

          &:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }

          .node-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;

            .node-title-row {
              display: flex;
              align-items: center;
              gap: 12px;

              h4 {
                margin: 0;
                font-size: 14px;
                color: #303133;
                font-weight: 600;
              }
            }

            .node-actions {
              display: flex;
              gap: 4px;
            }
          }
        }
      }
    }
  }
}

:deep(.modern-dialog) {
  .el-dialog__body {
    padding: 20px;
  }
  .el-form-item__label {
    font-weight: 500;
    color: #606266;
  }
}

:deep(.el-descriptions) {
  .el-descriptions__label {
    color: #909399;
  }
}
</style>