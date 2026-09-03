<template>
  <div class="workflow-editor-page">
    <div class="editor-header">
      <div class="header-left">
        <el-button text @click="goBack">{{ t('message.global.backToList') }}</el-button>
        <el-divider direction="vertical" />
        <el-input v-model="flowForm.name" :placeholder="t('message.pages.workflowEditor.weNamePlaceholder')" class="flow-name-input" :disabled="!canEditBasic" />
        <el-tag v-if="flowForm.status === 'published'" type="success">{{ t('message.pages.workflowEditor.wePublished') }}</el-tag>
        <el-tag v-else-if="flowForm.status === 'pending'" type="warning">{{ t('message.pages.workflowEditor.wePendingApproval') }}</el-tag>
        <el-tag v-else type="info">{{ t('message.pages.workflowEditor.weDraft') }}</el-tag>
      </div>
      <div class="header-center">
        <el-button-group>
          <el-button :disabled="!canUndo || graphReadonly" @click="onUndo">{{ t('message.global.undo') }}</el-button>
          <el-button :disabled="!canRedo || graphReadonly" @click="onRedo">{{ t('message.global.redo') }}</el-button>
        </el-button-group>
        <el-divider direction="vertical" />
        <el-button-group>
          <el-button :title="t('message.pages.workflowEditor.weZoomOut')" @click="onZoomOut">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <el-button :title="t('message.pages.workflowEditor.weZoomReset')" @click="onZoomReset" style="min-width:64px;">
            <span v-if="zoomPct">{{ zoomPct }}%</span>
            <span v-else>100%</span>
          </el-button>
          <el-button :title="t('message.pages.workflowEditor.weZoomIn')" @click="onZoomIn">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
        </el-button-group>
        <el-button :title="t('message.pages.workflowEditor.weFitCanvas')" @click="onFitView">
          <el-icon><FullScreen /></el-icon>
          <span style="margin-left:4px;">{{ t('message.pages.workflowEditor.weFit') }}</span>
        </el-button>
        <el-button :disabled="graphReadonly" @click="autoLayout">{{ t('message.pages.workflowEditor.weAutoLayout') }}</el-button>
      </div>
      <div class="header-right">
        <el-tooltip v-if="flowForm.status === 'pending'" :content="t('message.pages.workflowEditor.wePendingNoEdit')" placement="bottom">
          <el-button disabled>{{ t('message.pages.workflowEditor.weImport') }}</el-button>
        </el-tooltip>
        <el-button v-else :disabled="!canEditAnything" @click="importFlow">{{ t('message.pages.workflowEditor.weImport') }}</el-button>
        <el-tooltip v-if="!canImportExport" :content="t('message.pages.workflowEditor.weNoShareExport')" placement="bottom">
          <el-button disabled>{{ t('message.pages.workflowEditor.weExport') }}</el-button>
        </el-tooltip>
        <el-button v-else @click="exportFlow">{{ t('message.pages.workflowEditor.weExport') }}</el-button>
        <el-tooltip v-if="hasFeature('WORKFLOW_SHARING') && !hasManageSharePerm" :content="t('message.pages.workflowEditor.weNoShareManage')" placement="bottom">
          <el-button disabled>
            <el-icon style="margin-right: 2px"><Share /></el-icon>{{ t('message.pages.workflowEditor.weShare') }}
          </el-button>
        </el-tooltip>
        <el-button v-if="hasFeature('WORKFLOW_SHARING') && hasManageSharePerm" type="warning" @click="openShareManage">
          <el-icon style="margin-right: 2px"><Share /></el-icon>{{ t('message.pages.workflowEditor.weShare') }}
        </el-button>
        <el-tooltip v-if="flowForm.status === 'pending'" :content="t('message.pages.workflowEditor.wePendingNoEdit')" placement="bottom">
          <el-button disabled>{{ t('message.pages.workflowEditor.weSaveDraft') }}</el-button>
        </el-tooltip>
        <el-tooltip v-else-if="!canEditBasic && !canEditGraph && !canEditSteps" :content="t('message.pages.workflowEditor.weNoShareEdit')" placement="bottom">
          <el-button disabled>{{ t('message.pages.workflowEditor.weSaveDraft') }}</el-button>
        </el-tooltip>
        <el-button v-else @click="saveFlow">{{ t('message.pages.workflowEditor.weSaveDraft') }}</el-button>
        <el-tooltip v-if="flowForm.status === 'pending'" :content="t('message.pages.workflowEditor.wePendingNoPublish')" placement="bottom">
          <el-button disabled type="primary">{{ t('message.pages.workflowEditor.wePublish') }}</el-button>
        </el-tooltip>
        <el-tooltip v-else-if="!canPublish" :content="t('message.pages.workflowEditor.weNoSharePublish')" placement="bottom">
          <el-button disabled type="primary">{{ t('message.pages.workflowEditor.wePublish') }}</el-button>
        </el-tooltip>
        <el-button v-else type="primary" @click="publishFlow">{{ t('message.pages.workflowEditor.wePublish') }}</el-button>
        <el-tooltip v-if="flowForm.status === 'pending'" :content="t('message.pages.workflowEditor.wePendingNoTrialRun')" placement="bottom">
          <el-button disabled type="success">{{ t('message.pages.workflowEditor.weTrialRun') }}</el-button>
        </el-tooltip>
        <el-tooltip v-else-if="flowForm.status !== 'published'" :content="t('message.pages.workflowEditor.weTrialRunNeedPublish')" placement="bottom">
          <el-button disabled type="success">{{ t('message.pages.workflowEditor.weTrialRun') }}</el-button>
        </el-tooltip>
        <el-tooltip v-else-if="!canTrialRun" :content="t('message.pages.workflowEditor.weNoShareTrialRun')" placement="bottom">
          <el-button disabled type="success">{{ t('message.pages.workflowEditor.weTrialRun') }}</el-button>
        </el-tooltip>
        <el-button v-else type="success" @click="runFlow">{{ t('message.pages.workflowEditor.weTrialRun') }}</el-button>
      </div>
    </div>

    <div class="editor-main">
      <div
        class="left-panel-wrapper"
        :class="{ collapsed: leftCollapsed }"
        :style="{ width: leftCollapsed ? '0px' : `${leftWidth}px` }"
      >
        <NodePalette v-show="!leftCollapsed" @add-node="addNodeFromPalette" />
        <div
          class="panel-resizer left-resizer"
          v-show="!leftCollapsed"
          @mousedown="startLeftResize"
          :title="t('message.pages.workflowEditor.weDragToResize')"
        />
        <div class="panel-toggle left-toggle" @click="leftCollapsed = !leftCollapsed" :title="leftCollapsed ? t('message.pages.workflowEditor.weExpandPalette') : t('message.pages.workflowEditor.weCollapsePalette')">
          <el-icon><component :is="leftCollapsed ? 'ArrowRight' : 'ArrowLeft'" /></el-icon>
        </div>
      </div>

      <div
        ref="canvasContainerRef"
        class="canvas-container"
      >
        <VueFlow
          :default-viewport="{ zoom: 1, x: 0, y: 0 }"
          :min-zoom="0.3"
          :max-zoom="2"
          :snap-to-grid="true"
          :snap-grid="[15, 15]"
          :node-types="nodeTypes"
          :edge-types="edgeTypes"
          :pan-on-drag="true"
          :pan-on-scroll="false"
          :zoom-on-scroll="true"
          :zoom-on-pinch="true"
          :select-nodes-on-drag="true"
          :selection-on-drag="true"
          :nodes-draggable="!graphReadonly"
          :nodes-connectable="!graphReadonly"
          :connect-on-click="!graphReadonly"
          @node-click="onNodeClick"
          @node-double-click="onNodeDoubleClick"
          @pane-click="onPaneClick"
          @edge-click="onEdgeClick"
          @connect="onConnectHandler"
          @connect-start="() => {}"
          @connect-end="() => {}"
          @connect-click="() => {}"
          @nodes-change="handleNodesChanges"
          @edges-change="handleEdgesChanges"
          @selection-change="() => {}"
          @node-drag-start="() => {}"
          @node-drag="() => {}"
          @node-drag-stop="onNodeDragStop"
          @move-start="() => {}"
          @move="() => {}"
          @move-end="onMoveEnd"
          @pane-scroll="() => {}"
          @pane-ready="() => {}"
          @viewport-changed="onViewportChanged"
          @error="onVueFlowError"
        >
          <Background :gap="20" :size="1" pattern-color="#e0e0e0" />
          <!-- MiniMap accesses node measured.width after undo/redo causing VueFlow computed race — disabled for now -->
          <!-- <MiniMap v-if="nodes && nodes.length > 0" /> -->
        </VueFlow>
      </div>

      <div
        class="right-panel-wrapper"
        :class="{ collapsed: rightCollapsed }"
        :style="{ width: rightCollapsed ? '0px' : `${rightWidth}px` }"
      >
        <div class="panel-toggle right-toggle" @click="rightCollapsed = !rightCollapsed" :title="rightCollapsed ? t('message.pages.workflowEditor.weExpandProps') : t('message.pages.workflowEditor.weCollapseProps')">
          <el-icon><component :is="rightCollapsed ? 'ArrowLeft' : 'ArrowRight'" /></el-icon>
        </div>
        <div
          class="panel-resizer right-resizer"
          v-show="!rightCollapsed"
          @mousedown="startRightResize"
          :title="t('message.pages.workflowEditor.weDragToResize')"
        />
        <div class="property-panel" v-show="!rightCollapsed" :style="{ width: `${rightWidth}px` }">
          <div class="panel-title">
            <span>{{ selectedNodeData ? t('message.pages.workflowEditor.weNodeProps') : (selectedEdgeData ? t('message.pages.workflowEditor.weEdgeProps') : t('message.pages.workflowEditor.weGlobalProps')) }}</span>
            <div class="panel-title-actions">
              <el-button v-if="selectedNodeData && !graphReadonly" size="small" text type="warning" @click="validateCurrentNode">{{ t('message.pages.workflowEditor.weValidateNode') }}</el-button>
              <el-button v-if="selectedNodeData && !graphReadonly" size="small" text type="danger" @click="deleteSelectedNode">{{ t('message.global.delete') }}</el-button>
            </div>
          </div>

          <div v-if="!selectedNodeData && !selectedEdgeData" class="property-content">
          <el-form :model="flowForm" label-width="120px" size="small" :disabled="!canEditBasic">
            <el-form-item :label="t('message.pages.workflowEditor.weName')">
              <el-input v-model="flowForm.name" />
            </el-form-item>
            <el-form-item :label="t('message.pages.workflowEditor.weCategory')">
              <el-tree-select
                v-model="flowForm.categoryId"
                :data="categoryTreeOptions"
                :props="{ label: 'label', value: 'value', children: 'children' }"
                :placeholder="t('message.pages.workflowEditor.weSelectCategory')"
                clearable
                check-strictly
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item :label="t('message.pages.workflowEditor.weVisibility')">
              <el-radio-group v-model="flowForm.authType">
                <el-radio value="private">{{ t('message.global.private') }}</el-radio>
                <el-radio value="public">{{ t('message.global.public') }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item :label="t('message.pages.workflowEditor.weNeedApproval')">
              <el-switch
                v-model="needAuditSwitch"
                :disabled="!canEditBasic || flowForm.authType === 'public'"
              />
              <div v-if="flowForm.authType === 'public'" class="form-item-hint" style="margin-top: 4px;">
                <small style="color:#909399">{{ t('wePublicFlowApprovalHint') }}</small>
              </div>
            </el-form-item>
            <el-form-item :label="t('message.pages.workflowEditor.weDesignatedReviewers')" v-if="flowForm.needAudit">
              <UserSearch
                v-model="flowForm.customApproverIds"
                multiple
                :disabled="!canEditBasic"
                :placeholder="t('message.pages.workflowEditor.weNoReviewerHint')"
              />
              <div class="form-item-hint" style="margin-top: 4px;">
                <small style="color:#909399">{{ t('message.pages.workflowEditor.weReviewerHint') }}</small>
              </div>
            </el-form-item>
            <el-form-item :label="t('message.pages.workflowEditor.weDesc')">
              <el-input v-model="flowForm.desc" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span>{{ t('message.pages.workflowEditor.weGlobalTimeout') }}</span>
                <el-tooltip :content="t('message.pages.workflowEditor.weDefaultUseThis')" placement="top" :show-after="200">
                  <el-icon :size="14" color="#909399" style="margin-left: 4px; vertical-align: middle; cursor: help;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-input-number
                  :model-value="getTimeoutDisplay()"
                  :min="1"
                  :max="9999"
                  @update:model-value="(val: number | null) => setTimeoutFromDisplay(val)"
                  style="width: 140px;"
                />
                <el-select
                  :model-value="timeoutUnit"
                  style="width: 80px;"
                  @update:model-value="(val: string) => onTimeoutUnitChange(val)"
                >
                  <el-option :label="t('message.unitSec')" value="second" />
                  <el-option :label="t('message.unitMin')" value="minute" />
                  <el-option :label="t('message.unitHour')" value="hour" />
                  <el-option :label="t('message.unitDay')" value="day" />
                </el-select>
              </div>
            </el-form-item>
            <el-form-item>
              <template #label>
                <span>{{ t('message.pages.workflowEditor.weFailureStrategy') }}</span>
                <el-tooltip :content="t('message.pages.workflowEditor.weFailPolicyDesc')" placement="top" :show-after="200">
                  <el-icon :size="14" color="#909399" style="margin-left: 4px; vertical-align: middle; cursor: help;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-radio-group v-model="flowForm.failStrategy">
                <el-radio value="stop">{{ t('message.pages.workflowEditor.weAbortOnFail') }}</el-radio>
                <el-radio value="continue">{{ t('message.pages.workflowEditor.weContinueOnFail') }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-divider content-position="left">
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                {{ t('message.pages.workflowEditor.weScheduledTrigger') }}
                <el-tooltip :content="t('message.pages.workflowEditor.weScheduleDesc')" placement="top" :show-after="200">
                  <el-icon :size="14" color="#909399" style="vertical-align: middle; cursor: help;"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
            </el-divider>
            <el-form-item>
              <el-switch v-model="flowForm.hasSchedule" />
              <span style="margin-left: 8px;">{{ t('message.pages.workflowEditor.weEnableSchedule') }}</span>
              <span style="margin-left: 8px; color: #909399; font-size: 12px;">{{ t('message.pages.workflowEditor.weEnableDisableHint') }}</span>
            </el-form-item>
            <template v-if="flowForm.hasSchedule">
              <el-form-item :label="t('message.pages.workflowEditor.weScheduleType')">
                <el-radio-group v-model="flowForm.scheduleType">
                  <el-radio value="cron">{{ t('message.pages.workflowEditor.weCronExpr') }}</el-radio>
                  <el-radio value="interval">{{ t('message.pages.workflowEditor.weFixedInterval') }}</el-radio>
                  <el-radio value="once">{{ t('message.pages.workflowEditor.weScheduleOnce') }}</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="flowForm.scheduleType === 'cron'" :label="t('message.pages.workflowEditor.weCronExpr')">
                <el-input v-model="flowForm.cronExpression" placeholder="0 0 2 * * ?" />
                <div class="field-hint">{{ t('message.pages.workflowEditor.weCronHintPrefix') }}<code>0 0 2 * * ?</code> = {{ t('message.pages.workflowEditor.weCronExample') }}</div>
              </el-form-item>
              <el-form-item v-if="flowForm.scheduleType === 'interval'" :label="t('message.pages.workflowEditor.weIntervalSeconds')">
                <el-input-number v-model="flowForm.intervalSeconds" :min="60" :max="31536000" />
                <span class="unit">{{ t('message.unitSec') }}</span>
              </el-form-item>
              <el-form-item v-if="flowForm.scheduleType === 'once'" :label="t('message.pages.workflowEditor.weOnceTime')">
                <el-date-picker
                  v-model="flowForm.runOnceAt"
                  type="datetime"
                  :placeholder="t('message.pages.workflowEditor.weSelectExecTime')"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  format="YYYY-MM-DD HH:mm:ss"
                  :disabled-date="disablePastDate"
                  style="width: 100%"
                />
              </el-form-item>
            </template>
            <el-divider content-position="left">
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                {{ t('message.pages.workflowEditor.weGlobalVars') }}
                <el-icon class="vars-help-icon" :size="14" color="#909399" @click.stop.prevent="varsHelpVisible = true"><QuestionFilled /></el-icon>
              </span>
            </el-divider>
            <el-alert
              v-if="variableErrorList.length"
              type="error"
              :closable="false"
              show-icon
              size="small"
              style="margin-bottom: 8px;"
            >
              <template #title>
                <div style="line-height: 1.7;">
                  <div v-for="(err, i) in variableErrorList" :key="i" style="font-size: 12px;">
                    {{ t('message.pages.workflowEditor.weVarRowError', { n: err.index + 1, msg: err.message }) }}
                  </div>
                </div>
              </template>
            </el-alert>
            <el-table :data="flowForm.variables" border size="small" style="width: 100%; table-layout: fixed;" :row-class-name="({ rowIndex }) => getVariableRowClass(rowIndex)">
              <el-table-column label="#" width="42" align="center">
                <template #default="{ $index }">
                  <span class="var-row-num">{{ $index + 1 }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="t('message.pages.workflowEditor.weVarName')">
                <template #default="{ $index }">
                  <el-tooltip
                    v-if="variableErrors[$index]?.key"
                    :content="variableErrors[$index].key"
                    placement="top"
                  >
                    <el-input
                      v-model="flowForm.variables[$index].key"
                      size="small"
                      :placeholder="t('message.pages.workflowEditor.weVarKeyPlaceholder')"
                      @blur="validateVariables"
                      status="error"
                    />
                  </el-tooltip>
                  <el-input
                    v-else
                    v-model="flowForm.variables[$index].key"
                    size="small"
                    :placeholder="t('message.pages.workflowEditor.weVarKeyPlaceholder')"
                    @blur="validateVariables"
                  />
                </template>
              </el-table-column>
              <el-table-column :label="t('message.pages.workflowEditor.weDefaultValue')">
                <template #default="{ $index }">
                  <el-input
                    v-model="flowForm.variables[$index].value"
                    size="small"
                    :placeholder="t('message.pages.workflowEditor.weDefaultValueOptional')"
                    @blur="validateVariables"
                  />
                </template>
              </el-table-column>
              <el-table-column :label="t('message.global.actions')" width="60" align="center" fixed="right">
                <template #default="{ $index }">
                  <el-button size="small" text type="danger" :disabled="!canEditBasic" @click="flowForm.variables.splice($index, 1); validateVariables()">{{ t('deleteShort') }}</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="variables-bar">
              <el-button size="small" :disabled="!canEditBasic" @click="addVariable">{{ t('message.pages.workflowEditor.weAddVariable') }}</el-button>
              <div class="var-hint">{{ t('message.pages.workflowEditor.weVarNamingRule') }}</div>
            </div>

            <el-divider content-position="left">{{ t('message.pages.workflowEditor.weVersionHistory') }}</el-divider>
            <div v-if="!canViewVersion" class="version-empty">{{ t('message.pages.workflowEditor.weNoSharePerm') }}: workflow:view_version</div>
            <div v-else-if="dagVersions.length === 0" class="version-empty">{{ t('message.pages.workflowEditor.weNoPublishVersions') }}</div>
            <div v-for="ver in dagVersions" :key="ver.id" class="version-item">
              <div class="version-header">
                <span class="version-tag">v{{ ver.version }}</span>
                <span class="version-time">{{ ver.create_datetime?.slice(0, 16) }}</span>
              </div>
              <div v-if="ver.release_note" class="version-note">{{ ver.release_note }}</div>
              <div class="version-actions">
                <el-button size="small" text type="primary" :disabled="graphReadonly" @click="loadVersion(ver)">{{ t('message.pages.workflowEditor.weBtnLoadVersion') }}</el-button>
                <el-tooltip v-if="flowForm.status === 'pending'" :content="t('message.pages.workflowEditor.weTooltipPendingNoRollback')" placement="top">
                  <el-button size="small" text type="warning" disabled>{{ t('message.pages.workflowEditor.weBtnRollback') }}</el-button>
                </el-tooltip>
                <el-tooltip v-else-if="!canRollback" :content="t('message.pages.workflowEditor.weTooltipNoRollbackPerm')" placement="top">
                  <el-button size="small" text type="warning" disabled>{{ t('message.pages.workflowEditor.weBtnRollback') }}</el-button>
                </el-tooltip>
                <el-button v-else size="small" text type="warning" @click="onRollbackVersion(ver)">{{ t('message.pages.workflowEditor.weBtnRollback') }}</el-button>
              </div>
            </div>
          </el-form>
        </div>

        <div v-if="selectedNodeData" class="property-content" ref="nodePropContentRef">
          <div class="node-basic-section">
            <el-form label-width="120px" size="small" :disabled="graphReadonly">
              <el-form-item :label="t('message.pages.workflowEditor.weColNodeName')">
                <el-input v-model="selectedNodeLabel" />
              </el-form-item>
              <el-form-item :label="t('message.pages.workflowEditor.weColNodeType')">
                <el-tag :color="selectedManifest?.color" effect="dark">
                  {{ selectedManifest?.displayName || selectedNodeData?.data?.config?.nodeType }}
                </el-tag>
              </el-form-item>
              <el-form-item :label="t('message.pages.workflowEditor.weColNodeKey')">
                <el-input :model-value="selectedNodeId" readonly>
                  <template #append>
                    <el-button
                      :icon="CopyDocument"
                      size="small"
                      text
                      type="primary"
                      @click.stop="copyNodeKey"
                      :title="t('message.pages.workflowEditor.weCopyNodeKey')"
                    />
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <template #label>
                  <span>{{ t('message.pages.workflowEditor.weFailureStrategy') }}</span>
                  <el-tooltip :content="t('message.pages.workflowEditor.weTooltipNodeFailStrategy')" placement="top" :show-after="200">
                    <el-icon :size="14" color="#909399" style="margin-left: 4px; vertical-align: middle; cursor: help;"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </template>
                <el-select
                  :model-value="nodeFailStrategy"
                  :placeholder="t('message.pages.workflowEditor.weInheritGlobal')"
                  clearable
                  style="width: 100%"
                  @update:model-value="(val: string | undefined) => nodeFailStrategy = val || undefined"
                >
                  <el-option :label="t('message.failFast')" value="fail_fast" />
                  <el-option :label="t('message.continueExec')" value="continue" />
                </el-select>
                <div class="field-hint" style="font-size: 12px; color: #909399; margin-top: 4px;">
                  {{ t('message.pages.workflowEditor.weCurrentFailStrategy') }}{{ nodeFailStrategy === 'fail_fast' ? t('message.pages.workflowEditor.weFsFailFast') : nodeFailStrategy === 'continue' ? t('message.pages.workflowEditor.weFsContinue') : t('message.pages.workflowEditor.weFsInherit') }}
                </div>
              </el-form-item>
            </el-form>
          </div>
          <div
            v-if="globalNodeErrors.length"
            class="global-errors"
          >
            <div
              v-for="(err, idx) in globalNodeErrors"
              :key="idx"
              class="global-error-item"
            >
              <el-icon color="#F56C6C" style="margin-right:6px;flex-shrink:0;"><WarningFilled /></el-icon>
              <span>{{ err }}</span>
            </div>
          </div>
          <div v-if="selectedManifest?.params?.length" class="node-params-section">
            <el-divider content-position="left" class="params-divider">{{ t('message.pages.workflowEditor.weParamsConfig') }}</el-divider>
            <AutoNodeForm
              :manifest="selectedManifest"
              :config="selectedNodeData?.data?.config"
              :errors="fieldNodeErrors"
              :nodes="nodes"
              :edges="edges"
              :current-node-id="selectedNodeId || undefined"
              :global-vars="flowForm.variables"
              :readonly="graphReadonly"
              @update:config="onNodeConfigUpdate"
            />
          </div>
          <div class="node-edge-section" ref="nodeEdgeSectionRef">
            <div class="edge-section-card">
              <div class="edge-section-card-header">
                <div class="edge-section-card-title">
                  <el-icon color="#409EFF"><Connection /></el-icon>
                  <span>{{ t('message.pages.workflowEditor.weOutgoingCondition') }}</span>
                  <el-tag size="small" type="primary" effect="light" round>{{ outgoingEdgesWithCondition.length }} {{ t('message.pages.workflowEditor.weEdgeCount', { n: outgoingEdgesWithCondition.length }) }}</el-tag>
                </div>
                <el-button size="small" text type="primary" @click="scrollToPropTop">
                  <el-icon style="margin-right:2px;"><ArrowUp /></el-icon>
                  {{ t('message.pages.workflowEditor.weBackToTop') }}
                </el-button>
              </div>
            </div>
            <div v-if="outgoingEdgesWithCondition.length === 0" class="edge-info">
              <el-empty :description="t('message.pages.workflowEditor.weNoOutgoingEdge')" :image-size="60" />
            </div>
            <div
              v-for="(oe, idx) in outgoingEdgesWithCondition"
              :key="oe.id"
              class="edge-condition-item"
              :class="{ 'with-divider': idx < outgoingEdgesWithCondition.length - 1 }"
            >
              <div class="edge-header">
                <span class="edge-target-arrow">→</span>
                <span class="edge-target">{{ oe.targetLabel }}</span>
                <el-tag
                  v-if="oe.condition === '__else__'"
                  size="small"
                  type="info"
                  effect="plain"
                  class="edge-badge"
                >{{ t('message.pages.workflowEditor.weDefaultBranch') }}</el-tag>
                <el-tag
                  v-else-if="!oe.condition"
                  size="small"
                  type="success"
                  effect="plain"
                  class="edge-badge"
                >{{ t('message.pages.workflowEditor.weUnconditional') }}</el-tag>
                <el-tooltip v-else :content="oe.condition" placement="top">
                  <el-tag size="small" effect="plain" class="edge-badge">
                    {{ oe.conditionPreview }}
                  </el-tag>
                </el-tooltip>
              </div>
              <div class="edge-expr">
                <ConditionExprEditor
                  :model-value="oe.condition"
                  :nodes="nodes"
                  :edges="edges"
                  :current-node-id="selectedNodeId || undefined"
                  :rows="2"
                  :readonly="graphReadonly"
                  :placeholder="t('message.pages.workflowEditor.wePhEdgeExpr')"
                  @update:model-value="(val: string) => onEdgeConditionChange(oe.id, val)"
                />
              </div>
            </div>
            <div class="edge-bottom-spacer" />
          </div>
        </div>

        <div v-if="selectedEdgeData && !selectedNodeData" class="property-content">
          <el-form label-width="120px" size="small" :disabled="graphReadonly">
            <el-form-item :label="t('message.pages.workflowEditor.weColSourceNode')">
              <el-tag>{{ selectedEdgeData.sourceLabel }}</el-tag>
            </el-form-item>
            <el-form-item :label="t('message.pages.workflowEditor.weColTargetNode')">
              <el-tag>{{ selectedEdgeData.targetLabel }}</el-tag>
            </el-form-item>
            <el-form-item :label="t('message.pages.workflowEditor.weColEdgeExpr')">
              <ConditionExprEditor
                :model-value="selectedEdgeData.condition"
                :nodes="nodes"
                :edges="edges"
                :current-node-id="selectedEdgeData.source || undefined"
                :rows="2"
                :readonly="graphReadonly"
                @update:model-value="(val: string) => onEdgeConditionChange(selectedEdgeData.id, val)"
              />
              <div class="condition-hint">
                {{ t('message.pages.workflowEditor.weEdgeHint') }}
              </div>
            </el-form-item>
            <el-button size="small" type="danger" :disabled="graphReadonly" @click="deleteSelectedEdge">{{ t('message.pages.workflowEditor.weBtnDeleteEdge') }}</el-button>
          </el-form>
        </div>
        </div>
      </div>
    </div>

    <!-- Share management dialog -->
    <ShareManageDialog
      v-if="hasFeature('WORKFLOW_SHARING')"
      v-model="shareManageVisible"
      resource-type="workflow"
      :resource-id="currentShareWorkflow?.id ?? null"
      :resource-name="currentShareWorkflow?.name ?? ''"
    />

    <el-drawer
      v-model="edgeHelpDrawerVisible"
      :title="t('message.pages.workflowEditor.weEdgeHelpTitle')"
      direction="rtl"
      :size="520"
      :with-header="true"
      destroy-on-close
    >
      <div class="edge-help-drawer-content">
        <ul class="edge-help-list">
          <li><b>{{ t('message.pages.workflowEditor.weEhEmpty') }}</b>{{ t('message.pages.workflowEditor.weEhEmptyDesc') }}</li>
          <li><code>__else__</code>{{ t('message.pages.workflowEditor.weEhElseDesc') }}</li>
          <li>
            <b>{{ t('message.pages.workflowEditor.weEhExprTitle') }}</b>：
            {{ t('message.pages.workflowEditor.weEhExprIntro1') }}
            <b>{{ t('message.pages.workflowEditor.weEhNoDollarWrap') }}</b>{{ t('message.pages.workflowEditor.weEhNoDollarWrapDesc') }}

            <div class="edge-help-section">
              <p class="edge-help-section-title">
                <span class="edge-help-idx">①</span>
                {{ t('message.pages.workflowEditor.weEhRefPaths') }}
                <small class="edge-help-sub">
                  {{ t('message.pages.workflowEditor.weEhNodeKeyExplain') }}
                  {{ t('message.pages.workflowEditor.weEhNodeKeyCopyHint') }}
                </small>
              </p>
              <ul class="edge-help-items">
                <li><code>nodeKey.status</code><span>{{ t('message.pages.workflowEditor.weEhRefStatus') }}</span></li>
                <li><code>nodeKey.output.xxx</code><span>{{ t('message.pages.workflowEditor.weEhRefOutput') }}</span></li>
                <li><code>workflow.env.XXX</code><span>{{ t('message.pages.workflowEditor.weEhRefWorkflowEnv') }}</span></li>
                <li><code>trigger.XXX</code><span>{{ t('message.pages.workflowEditor.weEhRefTrigger') }}</span></li>
              </ul>
            </div>

            <div class="edge-help-section">
              <p class="edge-help-section-title">
                <span class="edge-help-idx">②</span>
                {{ t('message.pages.workflowEditor.weEhBuiltinFns') }}
              </p>
              <ul class="edge-help-items">
                <li><code>success(nodeKey)</code><span>{{ t('message.pages.workflowEditor.weEhFnSuccess') }}</span></li>
                <li><code>failed(nodeKey)</code><span>{{ t('message.pages.workflowEditor.weEhFnFailed') }}</span></li>
                <li><code>skipped(nodeKey)</code><span>{{ t('message.pages.workflowEditor.weEhFnSkipped') }}</span></li>
                <li><code>cancelled(nodeKey)</code><span>{{ t('message.pages.workflowEditor.weEhFnCancelled') }}</span></li>
                <li><code>status(nodeKey, 'SUCCESS')</code><span>{{ t('message.pages.workflowEditor.weEhFnStatus') }}</span></li>
                <li><code>AND(a, b)</code> / <code>OR(a, b)</code> / <code>NOT(x)</code><span>{{ t('message.pages.workflowEditor.weEhFnLogic') }}</span></li>
                <li><code>success(__from__)</code><span>{{ t('message.pages.workflowEditor.weEhFnSugar') }}</span></li>
              </ul>
            </div>

            <div class="edge-help-section">
              <p class="edge-help-section-title">
                <span class="edge-help-idx">③</span>
                {{ t('message.pages.workflowEditor.weEhCompOps') }} &amp; {{ t('message.pages.workflowEditor.weEhSyntaxLimit') }}
              </p>
              <ul class="edge-help-items">
                <li><code>== != &lt; &lt;= &gt; &gt;=</code><span>{{ t('message.pages.workflowEditor.weEhOnlyBinary') }}</span></li>
                <li><code>true/false True/False null/None</code><span>{{ t('message.pages.workflowEditor.weEhLiterals') }}</span></li>
                <li><code>'hello'</code> / <code>"world"</code><span>{{ t('message.pages.workflowEditor.weEhStringLit') }}</span></li>
                <li style="color:#c0392b"><code>{{ t('message.pages.workflowEditor.weEhNotSupported') }}</code><span>{{ t('message.pages.workflowEditor.weEhNotSupportedDesc') }}</span></li>
              </ul>
            </div>

            <div class="edge-help-section">
              <p class="edge-help-section-title">
                <span class="edge-help-idx">④</span>
                {{ t('message.pages.workflowEditor.weEhExamples') }}
              </p>
              <div class="edge-help-example">
                <label>{{ t('message.pages.workflowEditor.weEhEx1Label') }}</label>
                <span class="edge-help-desc">{{ t('message.pages.workflowEditor.weEhEx1Desc') }}</span>
                <code>__from__.output.exit_code == 0</code>
                <small class="edge-help-alias">{{ t('message.pages.workflowEditor.weEhMoreRecommended') }}</small>
                <code class="edge-help-code-good">success(__from__)</code>
              </div>
              <div class="edge-help-example">
                <label>{{ t('message.pages.workflowEditor.weEhEx2Label') }}</label>
                <span class="edge-help-desc">{{ t('message.pages.workflowEditor.weEhEx2Desc') }}</span>
                <code>node_xxx.output.exit_code == 0</code>
              </div>
              <div class="edge-help-example">
                <label>{{ t('message.pages.workflowEditor.weEhEx3Label') }}</label>
                <span class="edge-help-desc">{{ t('message.pages.workflowEditor.weEhEx3Desc') }}</span>
                <code>AND(success(node_http_xxx), node_http_xxx.output.status_code &gt;= 200)</code>
              </div>
              <div class="edge-help-example">
                <label>{{ t('message.pages.workflowEditor.weEhEx4Label') }}</label>
                <span class="edge-help-desc">{{ t('message.pages.workflowEditor.weEhEx4Desc') }}</span>
                <code>node_check_xxx.output.branch == 'true'</code>
              </div>
              <div class="edge-help-example">
                <label>{{ t('message.pages.workflowEditor.weEhEx5Label') }}</label>
                <span class="edge-help-desc">{{ t('message.pages.workflowEditor.weEhEx5Desc') }}</span>
                <code>workflow.env.ENV == 'prod'</code>
              </div>
              <div class="edge-help-example">
                <label>{{ t('message.pages.workflowEditor.weEhEx6Label') }}</label>
                <span class="edge-help-desc">{{ t('message.pages.workflowEditor.weEhEx6Desc') }}</span>
                <code>__else__</code>
              </div>
            </div>
          </li>
        </ul>
        <p class="edge-help-tip">
          {{ t('message.pages.workflowEditor.weEhTip') }}
        </p>
      </div>
    </el-drawer>

    <el-drawer
      v-model="varsHelpVisible"
      :title="t('message.pages.workflowEditor.weGvHelpTitle')"
      direction="rtl"
      :size="520"
      :with-header="true"
      destroy-on-close
    >
      <div class="edge-help-drawer-content">
        <ul class="edge-help-list">
          <li>
            <b>{{ t('message.pages.workflowEditor.weGlobalVars') }}</b>{{ t('message.pages.workflowEditor.weGvDesc') }}

            <div class="edge-help-section">
              <p class="edge-help-section-title">
                <span class="edge-help-idx">①</span>
                {{ t('message.pages.workflowEditor.weGvRefSyntax') }}
              </p>
              <ul class="edge-help-items">
                <li><code>${workflow.env.VAR_NAME}</code><span>{{ t('message.pages.workflowEditor.weGvRefParamField') }}</span></li>
                <li><code>workflow.env.VAR_NAME</code><span>{{ t('message.pages.workflowEditor.weGvRefCondExpr') }}</span></li>
              </ul>
            </div>

            <div class="edge-help-section">
              <p class="edge-help-section-title">
                <span class="edge-help-idx">②</span>
                {{ t('message.pages.workflowEditor.weEhExamples') }}
              </p>
              <div class="edge-help-example">
                <label>{{ t('message.pages.workflowEditor.weGvEx1Label') }}</label>
                <span class="edge-help-desc">{{ t('message.pages.workflowEditor.weGvExCmd') }}</span>
                <code>echo Deploy ${workflow.env.APP_NAME}</code>
              </div>
              <div class="edge-help-example">
                <label>{{ t('message.pages.workflowEditor.weGvEx2Label') }}</label>
                <span class="edge-help-desc">{{ t('message.pages.workflowEditor.weGvExWorkDir') }}</span>
                <code>${workflow.env.APP_HOME}/logs</code>
              </div>
              <div class="edge-help-example">
                <label>{{ t('message.pages.workflowEditor.weGvEx3Label') }}</label>
                <span class="edge-help-desc">{{ t('message.pages.workflowEditor.weGvExApprovalTitle') }}</span>
                <code>{{ t('message.pages.workflowEditor.wePublish') }} ${workflow.env.VER}</code>
              </div>
              <div class="edge-help-example">
                <label>{{ t('message.pages.workflowEditor.weGvEx4Label') }}</label>
                <span class="edge-help-desc">{{ t('message.pages.workflowEditor.weGvExCondRef') }}</span>
                <code>workflow.env.REGION == 'cn'</code>
              </div>
              <div class="edge-help-example">
                <label>{{ t('message.pages.workflowEditor.weGvEx5Label') }}</label>
                <span class="edge-help-desc">{{ t('message.pages.workflowEditor.weGvExEnvMap') }}</span>
                <code>GREETING=hi-${workflow.env.NAME}</code>
              </div>
            </div>

            <div class="edge-help-section">
              <p class="edge-help-section-title">
                <span class="edge-help-idx">③</span>
                {{ t('message.pages.workflowEditor.weGvNamingRule') }}
              </p>
              <ul class="edge-help-items">
                <li><code>{{ t('message.pages.workflowEditor.weGvLetterUnderscore') }}</code><span>{{ t('message.pages.workflowEditor.weGvNamingStart') }}</span></li>
                <li><code>{{ t('message.pages.workflowEditor.weGvCaseSensitive') }}</code><span>{{ t('message.pages.workflowEditor.weGvNamingStyle') }}</span></li>
                <li><code>{{ t('message.pages.workflowEditor.weGvNotUsable') }}</code><span>{{ t('message.pages.workflowEditor.weGvNamingNoSpecial') }}</span></li>
              </ul>
            </div>
          </li>
        </ul>
        <p class="edge-help-tip">
          {{ t('message.pages.workflowEditor.weGvTipUnique') }}
        </p>
      </div>
    </el-drawer>

    <!-- Publish + approver selection dialog -->
    <el-dialog
      v-if="hasFeature('WORKFLOW_APPROVAL_FLOW')"
      v-model="publishApprovalDialogVisible"
      :title="t('message.pages.workflowList.wlPublishApprovalTitle', { name: flowForm.name })"
      width="640px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="120px">
        <el-form-item :label="t('message.pages.workflowList.wlColReleaseNote')">
          <el-input
            v-model="publishApprovalTemp.release_note"
            type="textarea"
            :rows="2"
            maxlength="200"
            show-word-limit
            :placeholder="t('message.pages.workflowList.wlPhReleaseNote')"
          />
        </el-form-item>

        <el-divider content-position="left">{{ t('message.pages.workflowList.wlDividerAuditConfig') }}</el-divider>

        <el-form-item :label="t('message.pages.workflowList.wlColAuditMode')">
          <el-radio-group v-model="publishApprovalTemp.approval_mode">
            <el-radio-button label="any">{{ t('message.pages.workflowList.wlModeOr') }}</el-radio-button>
            <el-radio-button label="all">{{ t('message.pages.workflowList.wlModeAnd') }}</el-radio-button>
          </el-radio-group>
          <div style="font-size: 12px; color: #909399; margin-top: 6px">
              {{ t('message.pages.workflowEditor.weApprovalModeHint') }}
            </div>
        </el-form-item>

        <el-form-item
          v-if="publishApprovalTemp.approval_mode === 'any' || (publishApprovalTemp.approver_ids || []).length > 0"
          :label="t('message.pages.workflowList.wlColOrSigner')"
        >
          <UserSearch
            v-model="publishApprovalTemp.approver_ids"
            multiple
            :placeholder="t('message.pages.workflowList.wlPhSelectOrSigner')"
          />
        </el-form-item>

        <el-form-item
          v-if="publishApprovalTemp.approval_mode === 'all' || (publishApprovalTemp.countersign_ids || []).length > 0"
          :label="t('message.pages.workflowList.wlColAndSigner')"
        >
          <UserSearch
            v-model="publishApprovalTemp.countersign_ids"
            multiple
            :placeholder="t('message.pages.workflowList.wlPhSelectAndSigner')"
          />
        </el-form-item>

        <el-form-item :label="t('message.pages.workflowList.wlColSubmitDesc')">
          <el-input
            v-model="publishApprovalTemp.submit_desc"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            :placeholder="t('message.pages.workflowList.wlPhSubmitReason')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publishApprovalDialogVisible = false">{{ t('message.global.cancel') }}</el-button>
        <el-button
          type="primary"
          :loading="publishApprovalSubmitting"
          @click="confirmPublishWithApproval"
        >
          {{ t('message.pages.workflowEditor.weSubmitApprovalAndPublish') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, toRef, markRaw, watch, h } from 'vue'
import { VueFlow, useVueFlow, applyChanges, applyEdgeChanges, applyNodeChanges } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import type { Edge, Node, NodeChange, EdgeChange } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/minimap/dist/style.css'
import { ElMessage, ElIcon, ElNotification, ElButton } from 'element-plus'
import { WarningFilled, ZoomIn, ZoomOut, FullScreen, QuestionFilled, ArrowLeft, ArrowRight, Share, Connection, ArrowDown, ArrowUp, CopyDocument } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useEditionStore } from '/@/editions'
import { Session } from '/@/utils/storage'

const editionStore = useEditionStore()
const hasFeature = (code: string) => editionStore.hasFeature(code)

const leftCollapsed = ref(false)
const rightCollapsed = ref(false)

// ======== Resizable panels ========
const LEFT_WIDTH_MIN = 160
const LEFT_WIDTH_MAX = 480
const LEFT_WIDTH_DEFAULT = 220
const RIGHT_WIDTH_MIN = 280
const RIGHT_WIDTH_MAX = 800
const RIGHT_WIDTH_DEFAULT = 360
const LS_KEY_LEFT = 'taurus_workflow_left_width'
const LS_KEY_RIGHT = 'taurus_workflow_right_width'

function _clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}
function _lsNum(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    const n = Number(raw)
    return isFinite(n) && n > 0 ? n : fallback
  } catch {
    return fallback
  }
}
function _lsSet(key: string, val: number) {
  try { localStorage.setItem(key, String(val)) } catch { /* ignore */ }
}

const leftWidth = ref(_clamp(_lsNum(LS_KEY_LEFT, LEFT_WIDTH_DEFAULT), LEFT_WIDTH_MIN, LEFT_WIDTH_MAX))
const rightWidth = ref(_clamp(_lsNum(LS_KEY_RIGHT, RIGHT_WIDTH_DEFAULT), RIGHT_WIDTH_MIN, RIGHT_WIDTH_MAX))

watch(leftWidth, (v) => { _lsSet(LS_KEY_LEFT, v) }, { flush: 'post' })
watch(rightWidth, (v) => { _lsSet(LS_KEY_RIGHT, v) }, { flush: 'post' })

function startLeftResize(e: MouseEvent) {
  if (e.button !== 0) return
  e.preventDefault()
  const startX = e.clientX
  const startW = leftWidth.value
  const moveHandler = (ev: MouseEvent) => {
    const delta = ev.clientX - startX
    leftWidth.value = _clamp(startW + delta, LEFT_WIDTH_MIN, LEFT_WIDTH_MAX)
  }
  const upHandler = () => {
    window.removeEventListener('mousemove', moveHandler)
    window.removeEventListener('mouseup', upHandler)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', moveHandler)
  window.addEventListener('mouseup', upHandler)
}

function startRightResize(e: MouseEvent) {
  if (e.button !== 0) return
  e.preventDefault()
  const startX = e.clientX
  const startW = rightWidth.value
  const moveHandler = (ev: MouseEvent) => {
    const delta = startX - ev.clientX
    rightWidth.value = _clamp(startW + delta, RIGHT_WIDTH_MIN, RIGHT_WIDTH_MAX)
  }
  const upHandler = () => {
    window.removeEventListener('mousemove', moveHandler)
    window.removeEventListener('mouseup', upHandler)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', moveHandler)
  window.addEventListener('mouseup', upHandler)
}

import NodePalette from '/@/components/workflow/NodePalette.vue'
import ManifestNode from '/@/components/workflow/ManifestNode.vue'
import AutoNodeForm from '/@/components/workflow/AutoNodeForm.vue'
import ConditionExprEditor from '/@/components/workflow/ConditionExprEditor.vue'
import ConditionEdge from '/@/components/workflow/ConditionEdge.vue'
import ShareManageDialog from '/@/views/taurus/components/ShareManageDialog.vue'
import UserSearch from '/@/components/UserSearch/index.vue'

import '/@/views/taurus/workflow/manifests/index.ts'
import {
  getNodeManifest,
  getAllNodeManifests,
  registerNodeManifest,
  cleanConfigForValidateStep,
} from '/@/views/taurus/workflow/manifest/registry.ts'
import { translateManifest } from '/@/views/taurus/workflow/manifest/translate.ts'
import type { NodeManifest } from '/@/views/taurus/workflow/manifest/types.ts'
import { request } from '/@/utils/service'
import { fetchManifests, validateStep } from '/@/api/taurus/workflow/manifest'
import { TriggerWorkflow, GetObj, GetList } from '/@/api/taurus/workflow/api'
import { GetTree as GetCategoryTree } from '/@/api/taurus/workflow/category'

import { useHistory, MANIFEST_NODE_WIDTH, MANIFEST_NODE_HEIGHT } from './composables/useHistory'
import { useDagVersions } from './composables/useDagVersions'
import { useFlowPersistence } from './composables/useFlowPersistence'
import { useDagOperations } from './composables/useDagOperations'

const router = useRouter()

const canvasContainerRef = ref<HTMLDivElement | null>(null)
const _dropBusyFlag = { value: false }

const _createNodeFromDragPayload = (
  payloadRaw: string | null | undefined,
  clientX: number,
  clientY: number,
): boolean => {
  if (!payloadRaw) return false
  let parsed: any = null
  try {
    parsed = JSON.parse(payloadRaw)
  } catch (_e) {
    return false
  }
  const data = parsed?.data || parsed
  if (!data || !data?.nodeType || typeof data.nodeType !== 'string') {
    return false
  }
  const registered = getNodeManifest(data.nodeType)
  if (!registered) {
    console.warn('[WorkflowEditor._createNodeFromDragPayload] 节点类型未注册:', data.nodeType)
    ElMessage.warning(t('message.pages.workflowEditor.weUnregisteredType', { type: data.nodeType }))
    return false
  }
  const pos = project({ x: clientX, y: clientY })
  const rawX = pos ? pos.x - 80 : 200
  const rawY = pos ? pos.y - 30 : 200
  const position = {
    x: Number.isFinite(rawX) ? rawX : 200,
    y: Number.isFinite(rawY) ? rawY : 200,
  }
  createNewNodeFromManifest(registered, position)
  return true
}

const _isHitCanvasArea = (clientX: number, clientY: number): boolean => {
  const el = canvasContainerRef.value
  if (!el) return false
  const r = el.getBoundingClientRect()
  return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
}

const _onNativeDragOver = (event: DragEvent) => {
  if (graphReadonly.value) return
  try {
    const types = event.dataTransfer?.types
    const arr = types ? Array.from(types) : []
    if (arr.length === 0) return
    const hasKnown = arr.some((t: string) => t === 'application/vueflow' || t === 'text/plain' || t === 'text' || t === 'Files')
    if (!hasKnown) return
    const clientX = Number(event.clientX ?? 0)
    const clientY = Number(event.clientY ?? 0)
    const hit = _isHitCanvasArea(clientX, clientY)
    console.log('[WF] dragover: types=', arr, 'hitCanvas=', hit, 'pos=', clientX, clientY)
    if (!hit) return
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
      event.dataTransfer.effectAllowed = 'move'
    }
  } catch (_e) {
    // ignore
  }
}

const _readPayloadFromDataTransfer = (dt: DataTransfer | null | undefined): string | null => {
  if (!dt) return null
  let payload: string | null = null
  try { payload = dt.getData('application/vueflow') } catch (_e) { /* ignore */ }
  if (!payload) { try { payload = dt.getData('text/plain') } catch (_e) { /* ignore */ } }
  if (!payload) { try { payload = dt.getData('text') } catch (_e) { /* ignore */ } }
  return payload
}

const _onNativeDrop = (event: DragEvent) => {
  if (graphReadonly.value) return
  if (_dropBusyFlag.value) return
  try {
    event.preventDefault()
    event.stopPropagation()
    const dt = event.dataTransfer
    const clientX = Number(event.clientX ?? 0)
    const clientY = Number(event.clientY ?? 0)
    const hit = _isHitCanvasArea(clientX, clientY)
    const typesArr = dt ? Array.from(dt.types || []) : []
    console.log('[WF] drop: 触发! hitCanvas=', hit, 'types=', typesArr, 'pos=', clientX, clientY)
    if (!hit) return
    const payload = _readPayloadFromDataTransfer(dt)
    console.log('[WF] drop: payload=', payload ? payload.slice(0, 200) : null)
    if (!payload) return
    _dropBusyFlag.value = true
    const ok = _createNodeFromDragPayload(payload, clientX, clientY)
    if (!ok) {
      _dropBusyFlag.value = false
    } else {
      setTimeout(() => { _dropBusyFlag.value = false }, 100)
    }
  } catch (e) {
    _dropBusyFlag.value = false
    console.error('[WorkflowEditor._onNativeDrop] 拖拽处理失败:', e)
    ElMessage.error(t('message.pages.workflowEditor.weDragAddFail'))
  }
}

// ======================== Share Management ========================
import { useUserInfo } from '/@/stores/userInfo'
const { t } = useI18n()
/** Get translated manifest (UI display only, never modifies original registry) */
const getTranslatedManifest = (nodeType: string | undefined | null) => {
  if (!nodeType) return null
  const raw = getNodeManifest(nodeType)
  return raw ? translateManifest(t, raw) : null
}
const shareUserStore = useUserInfo()
const shareManageVisible = ref(false)
const currentShareWorkflow = ref<any>(null)
function canManageShare(): { ok: boolean; reason?: string } {
  if (!flowForm.workflowId) return { ok: false, reason: t('message.pages.workflowEditor.weSaveFlowFirstForShare') }
  if (hasSharePerm('workflow:manage_share')) {
    return { ok: true }
  }
  return { ok: false, reason: t('message.pages.workflowEditor.weNoShareManage') + ': workflow:manage_share' }
}
function openShareManage() {
  const check = canManageShare()
  if (!check.ok) {
    ElMessage.warning(check.reason || t('message.pages.workflowEditor.weNoShareManage'))
    return
  }
  currentShareWorkflow.value = {
    id: flowForm.workflowId,
    name: flowForm.name || t('message.pages.workflowEditor.weWorkflowPrefix', { id: flowForm.workflowId }),
  }
  shareManageVisible.value = true
}

const {
  nodes,
  edges,
  addNodes,
  addEdges,
  fitView,
  project,
  setNodes,
  setEdges,
  updateNodeData,
  updateEdgeData,
  updateNode,
  updateEdge,
  removeNodes,
  removeEdges,
  zoomIn,
  zoomOut,
  zoomTo,
  getViewport,
} = useVueFlow()

const currentZoom = ref<number>(1)
const zoomPct = computed(() => {
  const z = Number(currentZoom.value)
  if (!Number.isFinite(z) || z <= 0) return 100
  return Math.round(z * 100)
})

const readCurrentZoom = () => {
  try {
    if (typeof getViewport === 'function') {
      const vp = getViewport()
      if (vp && typeof vp.zoom === 'number' && Number.isFinite(vp.zoom)) {
        currentZoom.value = vp.zoom
      }
    }
  } catch (e) {
    // ignore
  }
}

const onViewportChanged = (_evt?: any, viewport?: any) => {
  if (viewport && typeof viewport.zoom === 'number' && Number.isFinite(viewport.zoom)) {
    currentZoom.value = viewport.zoom
    return
  }
  readCurrentZoom()
}

const onZoomIn = () => {
  try {
    if (typeof zoomIn === 'function') {
      zoomIn({ duration: 200, factor: 1.2 })
      nextTick(readCurrentZoom)
    } else {
      readCurrentZoom()
      const next = Math.min(currentZoom.value * 1.2, 4)
      typeof zoomTo === 'function' && zoomTo(next, { duration: 200 })
      currentZoom.value = next
    }
  } catch (e) {
    console.warn('[WorkflowEditor] 放大失败:', e)
  }
}

const onZoomOut = () => {
  try {
    if (typeof zoomOut === 'function') {
      zoomOut({ duration: 200, factor: 1.2 })
      nextTick(readCurrentZoom)
    } else {
      readCurrentZoom()
      const next = Math.max(currentZoom.value / 1.2, 0.2)
      typeof zoomTo === 'function' && zoomTo(next, { duration: 200 })
      currentZoom.value = next
    }
  } catch (e) {
    console.warn('[WorkflowEditor] 缩小失败:', e)
  }
}

const onZoomReset = () => {
  try {
    if (typeof zoomTo === 'function') {
      zoomTo(1, { duration: 200 })
    }
    currentZoom.value = 1
  } catch (e) {
    console.warn('[WorkflowEditor] 缩放重置失败:', e)
  }
}

const onFitView = () => {
  try {
    if (typeof fitView === 'function') {
      fitView({ padding: 0.25, duration: 300 })
      nextTick(readCurrentZoom)
    }
  } catch (e) {
    console.warn('[WorkflowEditor] 适应画布失败:', e)
  }
}

const _origSetNodes = setNodes
const NODE_DIM_FALLBACK = { width: MANIFEST_NODE_WIDTH, height: MANIFEST_NODE_HEIGHT } as const
const safeSetNodes = (arg: any) => {
  try {
    if (typeof arg === 'function') {
      return _origSetNodes((curr: Node[]) => {
        const out = (arg as any)(curr)
        if (!Array.isArray(out)) return curr
        return out.map(n => {
          const a = (n || {}) as any
          const dim = (a.dimensions && typeof a.dimensions.width === 'number')
            ? { width: a.dimensions.width, height: a.dimensions.height }
            : NODE_DIM_FALLBACK
          const meas = (a.measured && typeof a.measured.width === 'number')
            ? { width: a.measured.width, height: a.measured.height }
            : dim
          return {
            ...n,
            dimensions: dim,
            measured: meas,
            width: typeof a.width === 'number' ? a.width : dim.width,
            height: typeof a.height === 'number' ? a.height : dim.height,
            selected: typeof a.selected === 'boolean' ? a.selected : false,
            dragging: typeof a.dragging === 'boolean' ? a.dragging : false,
            selectable: typeof a.selectable === 'boolean' ? a.selectable : true,
            connectable: typeof a.connectable === 'boolean' ? a.connectable : true,
            deletable: typeof a.deletable === 'boolean' ? a.deletable : true,
            draggable: typeof a.draggable === 'boolean' ? a.draggable : true,
            focusable: typeof a.focusable === 'boolean' ? a.focusable : true,
          } as Node
        })
      })
    }
    if (Array.isArray(arg)) {
      const normalized = arg.map(n => {
        const a = (n || {}) as any
        const dim = (a.dimensions && typeof a.dimensions.width === 'number')
          ? { width: a.dimensions.width, height: a.dimensions.height }
          : NODE_DIM_FALLBACK
        const meas = (a.measured && typeof a.measured.width === 'number')
          ? { width: a.measured.width, height: a.measured.height }
          : dim
        return {
          ...n,
          dimensions: dim,
          measured: meas,
          width: typeof a.width === 'number' ? a.width : dim.width,
          height: typeof a.height === 'number' ? a.height : dim.height,
          selected: typeof a.selected === 'boolean' ? a.selected : false,
          dragging: typeof a.dragging === 'boolean' ? a.dragging : false,
          selectable: typeof a.selectable === 'boolean' ? a.selectable : true,
          connectable: typeof a.connectable === 'boolean' ? a.connectable : true,
          deletable: typeof a.deletable === 'boolean' ? a.deletable : true,
          draggable: typeof a.draggable === 'boolean' ? a.draggable : true,
          focusable: typeof a.focusable === 'boolean' ? a.focusable : true,
        } as Node
      })
      return _origSetNodes(normalized)
    }
    return _origSetNodes(arg as any)
  } catch (e) {
    console.error('[safeSetNodes] 失败:', e, arg)
    try { return _origSetNodes(arg) } catch (_) { /* ignore */ }
  }
}

const nodeTypes = markRaw({ manifest: markRaw(ManifestNode) })
const edgeTypes = markRaw({ default: markRaw(ConditionEdge) })

interface FlowVariable {
  key: string
  value: string
}

const categoryTreeOptions = ref<any[]>([])

const flattenCategoryTree = (nodes: any[]): any[] => {
  const walk = (list: any[]): any[] => {
    const out: any[] = []
    list.forEach(n => {
      if (n?.id !== 'all' && n?.virtual_root !== true && typeof n?.id === 'number') {
        const children = n.children?.length ? walk(n.children) : undefined
        out.push({
          value: Number(n.id),
          label: `${n.name}${n.category_code ? ' [' + n.category_code + ']' : ''}`,
          children: children && children.length > 0 ? children : undefined,
        })
      } else if (n.children?.length) {
        out.push(...walk(n.children))
      }
    })
    return out
  }
  return walk(nodes)
}

const flowForm = reactive({
  name: t('message.pages.workflowEditor.weNewWorkflow'),
  desc: '',
  status: 'draft' as 'draft' | 'published' | 'pending',
  timeout: 3600,
  failStrategy: 'stop' as 'stop' | 'continue',
  variables: [] as FlowVariable[],
  workflowId: null as number | null,
  categoryId: null as number | null,
  authType: 'private' as 'private' | 'public',
  needAudit: false,
  customApproverIds: [] as number[],
  hasSchedule: false,
  scheduleType: 'cron' as 'cron' | 'interval' | 'once',
  cronExpression: '',
  intervalSeconds: 3600,
  runOnceAt: '',
  scheduleEnabled: true,
})
const timeoutUnit = ref('hour')

const disablePastDate = (date: Date) => {
  return date.getTime() < Date.now() - 24 * 60 * 60 * 1000
}

const TIMEOUT_UNIT_TO_SECONDS: Record<string, number> = {
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400
}

function getTimeoutDisplay(): number {
  const divisor = TIMEOUT_UNIT_TO_SECONDS[timeoutUnit.value] || 1
  return Math.round(flowForm.timeout / divisor)
}

function setTimeoutFromDisplay(val: number | null) {
  if (val == null) val = 0
  const multiplier = TIMEOUT_UNIT_TO_SECONDS[timeoutUnit.value] || 1
  flowForm.timeout = val * multiplier
}

function onTimeoutUnitChange(newUnit: string) {
  const seconds = flowForm.timeout
  timeoutUnit.value = newUnit
  const newDivisor = TIMEOUT_UNIT_TO_SECONDS[newUnit] || 1
  const displayVal = Math.round(seconds / newDivisor)
  flowForm.timeout = displayVal * newDivisor
}

// Publish + approver selection dialog
const publishApprovalDialogVisible = ref(false)
const publishApprovalSubmitting = ref(false)
const approverUserList = ref<any[]>([])
const publishApprovalTemp = reactive({
  release_note: '',
  approval_mode: 'any' as 'any' | 'all',
  approver_ids: [] as number[],
  countersign_ids: [] as number[],
  submit_desc: '',
})
async function loadPublishApprovalUsers(keyword = '') {
  try {
    const res: any = await request({
      url: '/api/taurus/user-options/',
      method: 'get',
      params: { limit: 300, search: keyword },
    })
    approverUserList.value = res.data?.results || res.data || []
  } catch (_e) {
    // ignore
  }
}
function detectNeedApproval(): boolean {
  // Local quick check: marked needAudit OR visibility is public → approval required
  // Backend need_approval is authoritative (it also checks whether the category is public, etc.)
  return !!flowForm.needAudit || flowForm.authType === 'public'
}
function openPublishApprovalDialog() {
  publishApprovalTemp.release_note = ''
  publishApprovalTemp.approval_mode = 'any'
  publishApprovalTemp.approver_ids = Array.isArray(flowForm.customApproverIds) ? [...flowForm.customApproverIds] : []
  publishApprovalTemp.countersign_ids = []
  publishApprovalTemp.submit_desc = ''
  publishApprovalDialogVisible.value = true
  if (approverUserList.value.length === 0) loadPublishApprovalUsers()
}
async function confirmPublishWithApproval() {
  const anyCount = (publishApprovalTemp.approver_ids || []).length
  const allCount = (publishApprovalTemp.countersign_ids || []).length
  // Approver not required; if empty, backend falls back to custom_approver_ids or default admin
  publishApprovalSubmitting.value = true
  try {
    await _publishFlow({
      release_note: publishApprovalTemp.release_note,
      approver_ids: anyCount > 0 ? publishApprovalTemp.approver_ids : undefined,
      countersign_ids: allCount > 0 ? publishApprovalTemp.countersign_ids : undefined,
      approval_mode: allCount > 0 ? 'all' : (publishApprovalTemp.approval_mode || 'any'),
      submit_desc: publishApprovalTemp.submit_desc,
    })
    publishApprovalDialogVisible.value = false
  } finally {
    publishApprovalSubmitting.value = false
  }
}

const shareCurrentPerms = ref<string[] | undefined>()
function hasSharePerm(permCode: string): boolean {
  // New workflow (workflowId empty) treated as self-authored — all permissions granted
  if (!flowForm.workflowId) return true
  // Permission aliases: execute implies trial_run (subset of execute)
  // Having edit (edit basic info / save) implies edit_graph / edit_steps / edit_hosts
  // But publish / rollback are independent — not implied by edit
  const aliasMap: Record<string, string[]> = {
    'workflow:trial_run': ['workflow:execute'],
    'workflow:edit_graph': ['workflow:edit'],
    'workflow:edit_steps': ['workflow:edit'],
    'workflow:edit_hosts': ['workflow:edit'],
  }
  const needPerms = [permCode, ...(aliasMap[permCode] || [])]
  // Only enable strict matching when backend explicitly returns a non-empty current_perms array
  // Empty/undefined = backend not injected or API mismatch — permissive by default, backend API gates it
  if (shareCurrentPerms.value && Array.isArray(shareCurrentPerms.value) && shareCurrentPerms.value.length > 0) {
    return needPerms.some((p) => shareCurrentPerms.value!.includes(p))
  }
  return true
}
const canEditBasic = computed(() => flowForm.status !== 'pending' && hasSharePerm('workflow:edit'))
const canEditGraph = computed(() => flowForm.status !== 'pending' && hasSharePerm('workflow:edit_graph'))
const canEditSteps = computed(() => flowForm.status !== 'pending' && hasSharePerm('workflow:edit_steps'))
const canPublish = computed(() => flowForm.status !== 'pending' && hasSharePerm('workflow:publish'))
const canRollback = computed(() => flowForm.status !== 'pending' && hasSharePerm('workflow:rollback'))
const canTrialRun = computed(() => flowForm.status !== 'pending' && flowForm.status === 'published' && hasSharePerm('workflow:trial_run'))
const needAuditSwitch = computed({
  get: () => !!flowForm.needAudit,
  set: (val: boolean) => {
    if (flowForm.authType === 'public') return
    flowForm.needAudit = val
  },
})
watch(
  () => flowForm.authType,
  (nxt) => {
    if (nxt === 'public') flowForm.needAudit = true
  },
)
const canExecute = computed(() => flowForm.status !== 'pending' && hasSharePerm('workflow:execute'))
const canImportExport = computed(() => hasSharePerm('workflow:export'))
const hasManageSharePerm = computed(() => hasSharePerm('workflow:manage_share'))
const canViewVersion = computed(() => hasSharePerm('workflow:view_version'))
// Whether canvas allows interactive editing (add/move/delete nodes, edges, edit properties, etc.)
const graphReadonly = computed(() => {
  if (flowForm.status === 'pending') return true
  if (!flowForm.workflowId) return false
  return !(canEditGraph.value || canEditSteps.value)
})
// Any write permission? import/auto-layout needs at least one edit permission or self-created
const canEditAnything = computed(() => {
  if (flowForm.status === 'pending') return false
  if (!flowForm.workflowId) return true
  return canEditBasic.value || canEditGraph.value || canEditSteps.value || canEditHosts.value
})

const loadCategoryOptions = async () => {
  try {
    const res = await GetCategoryTree()
    const data = Array.isArray(res) ? res : (res?.data || res || [])
    const tree = Array.isArray(data) ? data : []
    categoryTreeOptions.value = flattenCategoryTree(tree)
  } catch (_e) {
    categoryTreeOptions.value = []
  }
}

const selectedNodeId = ref<string | null>(null)
const selectedEdgeId = ref<string | null>(null)
const nodeErrors = ref<Record<string, string>>({})
const nodePropContentRef = ref<HTMLElement | null>(null)
const nodeEdgeSectionRef = ref<HTMLElement | null>(null)
const smoothScrollTo = (targetY: number) => {
  const container = nodePropContentRef.value
  if (!container) return
  const duration = 260
  const start = container.scrollTop
  const diff = targetY - start
  if (Math.abs(diff) < 3) return
  let rafId = 0
  let t0 = 0
  const step = (ts: number) => {
    if (!t0) t0 = ts
    const p = Math.min(1, (ts - t0) / duration)
    const ease = 1 - Math.pow(1 - p, 3)
    container.scrollTop = start + diff * ease
    if (p < 1) rafId = requestAnimationFrame(step)
  }
  rafId = requestAnimationFrame(step)
}
const scrollToEdgeSection = () => {
  const container = nodePropContentRef.value
  const target = nodeEdgeSectionRef.value
  if (!container || !target) return
  const diffTop = target.getBoundingClientRect().top - container.getBoundingClientRect().top
  smoothScrollTo(Math.max(0, container.scrollTop + diffTop - 8))
}
const scrollToPropTop = () => smoothScrollTo(0)

const copyNodeKey = async () => {
  if (!selectedNodeId.value) return
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(selectedNodeId.value)
    } else {
      const ta = document.createElement('textarea')
      ta.value = selectedNodeId.value
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    ElMessage.success(t('message.pages.workflowEditor.weNodeKeyCopied', { key: selectedNodeId.value }))
  } catch {
    ElMessage.error(t('message.pages.workflowEditor.weCopyFailManual'))
  }
}

const edgeHelpDrawerVisible = ref(false)
const varsHelpVisible = ref(false)
watch(selectedNodeId, () => {
  edgeHelpDrawerVisible.value = false
  varsHelpVisible.value = false
})
watch(selectedEdgeId, () => {
  edgeHelpDrawerVisible.value = false
  varsHelpVisible.value = false
})

const normalizeNodeShape = (n: Node): Node => {
  const a = (n || {}) as any
  const dim = (a.dimensions && typeof a.dimensions.width === 'number' && typeof a.dimensions.height === 'number')
    ? { width: Number(a.dimensions.width), height: Number(a.dimensions.height) }
    : NODE_DIM_FALLBACK
  const meas = (a.measured && typeof a.measured.width === 'number' && typeof a.measured.height === 'number')
    ? { width: Number(a.measured.width), height: Number(a.measured.height) }
    : dim
  const width = typeof a.width === 'number' && Number.isFinite(a.width) ? Number(a.width) : dim.width
  const height = typeof a.height === 'number' && Number.isFinite(a.height) ? Number(a.height) : dim.height
  return {
    ...n,
    dimensions: dim,
    measured: meas,
    width,
    height,
    selected: typeof a.selected === 'boolean' ? a.selected : false,
    dragging: typeof a.dragging === 'boolean' ? a.dragging : false,
    selectable: typeof a.selectable === 'boolean' ? a.selectable : true,
    connectable: typeof a.connectable === 'boolean' ? a.connectable : true,
    deletable: typeof a.deletable === 'boolean' ? a.deletable : true,
    draggable: typeof a.draggable === 'boolean' ? a.draggable : true,
    focusable: typeof a.focusable === 'boolean' ? a.focusable : true,
  } as Node
}

let _nodeShapePatchTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => (nodes && typeof (nodes as any).value !== 'undefined' ? (nodes as any).value as Node[] : []),
  (arr) => {
    if (!Array.isArray(arr)) return
    let dirty = false
    const normalized = arr.map(n => {
      const a = (n || {}) as any
      const hasDim = !!(a.dimensions && typeof a.dimensions.width === 'number')
      const hasMeas = !!(a.measured && typeof a.measured.width === 'number')
      const hasW = typeof a.width === 'number' && Number.isFinite(a.width)
      if (hasDim && hasMeas && hasW) return n
      dirty = true
      return normalizeNodeShape(n)
    })
    if (!dirty) return
    if (_nodeShapePatchTimer) clearTimeout(_nodeShapePatchTimer)
    _nodeShapePatchTimer = setTimeout(() => {
      _nodeShapePatchTimer = null
      try { safeSetNodes(normalized) } catch (_) { /* ignore */ }
    }, 0)
  },
  { deep: true, immediate: false },
)

// [Node global uniqueness] Do NOT dedupe at runtime via 'watch nodes → safeSetNodes bulk replace',
// it would conflict with VueFlow internals: nodeLookup, measurement, selection, dragging state,
// causing nodes to exist in nodes.value but not render (ghost 0x0 nodes, dangling dashed edges).
//
// Dedupe unified into 'three sources of node persistence':
//  1. createNewNodeFromManifest on creation (WorkflowEditor.vue:1087-1094) — unique label already computed.
//  2. selectedNodeLabel setter on manual rename (WorkflowEditor.vue:692-711) — auto-fallback on duplicates.
//  3. useDagOperations.loadDagDefinition on load (import / rollback / open draft) — scan BEFORE addNodes,
//     Dedupe dagNodes' labels — VueFlow receives clean nodes, no mid-flight mutation needed.

const historyApi = useHistory(nodes, edges, safeSetNodes, setEdges, {
  addNodes,
  removeNodes,
  updateNode,
  addEdges,
  removeEdges,
  updateEdge,
})
const canUndo = computed<boolean>(() => !!(historyApi.canUndo && historyApi.canUndo.value))
const canRedo = computed<boolean>(() => !!(historyApi.canRedo && historyApi.canRedo.value))
const safeResetHistory = () => {
  try {
    if (typeof (historyApi as any).resetHistory === 'function') (historyApi as any).resetHistory()
    else console.warn('[WorkflowEditor] historyApi.resetHistory 不存在:', Object.keys(historyApi))
  } catch (e) { console.error('[safeResetHistory] error:', e) }
}
const safeSaveHistory = (debounceMs?: number) => {
  try {
    if (typeof (historyApi as any).saveHistory === 'function') (historyApi as any).saveHistory(debounceMs)
    else console.warn('[WorkflowEditor] historyApi.saveHistory 不存在:', Object.keys(historyApi))
  } catch (e) { console.error('[safeSaveHistory] error:', e) }
}
const safeUndo = () => {
  try {
    if (typeof (historyApi as any).undo === 'function') (historyApi as any).undo()
    else console.warn('[WorkflowEditor] historyApi.undo 不存在:', Object.keys(historyApi))
  } catch (e) { console.error('[safeUndo] error:', e) }
}
const safeRedo = () => {
  try {
    if (typeof (historyApi as any).redo === 'function') (historyApi as any).redo()
    else console.warn('[WorkflowEditor] historyApi.redo 不存在:', Object.keys(historyApi))
  } catch (e) { console.error('[safeRedo] error:', e) }
}
const safeNormalizeNode = (raw: any) => {
  try {
    if (typeof (historyApi as any).normalizeNode === 'function') return (historyApi as any).normalizeNode(raw)
  } catch (e) { console.error('[safeNormalizeNode] error:', e) }
  // fallback: construct minimal viable Node to avoid node-drag failure
  return {
    id: raw?.id || `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: raw?.type || 'default',
    position: raw?.position || { x: 0, y: 0 },
    data: raw?.data || {},
    dimensions: { ...NODE_DIM_FALLBACK },
    measured: { ...NODE_DIM_FALLBACK },
    width: NODE_DIM_FALLBACK.width, height: NODE_DIM_FALLBACK.height,
  }
}

const resetHistoryToCurrent = () => {
  safeResetHistory()
  nextTick(() => { setTimeout(() => safeSaveHistory(), 30) })
}

const onVueFlowError = (err: unknown) => {
  console.error('[VueFlow] 内部错误:', err)
}

const onUndo = () => {
  if (!canUndo.value) return
  try {
    safeUndo()
    selectedNodeId.value = null
    selectedEdgeId.value = null
    nextTick(() => {
      try { fitView({ padding: 0.2, duration: 150 }) } catch (e) {
        console.error('[onUndo] fitView error:', e)
      }
    })
  } catch (e) {
    console.error('[onUndo] 撤销失败:', e)
    ElMessage.error(t('message.pages.workflowEditor.weUndoFail'))
  }
}
const onRedo = () => {
  if (!canRedo.value) return
  try {
    safeRedo()
    selectedNodeId.value = null
    selectedEdgeId.value = null
    nextTick(() => {
      try { fitView({ padding: 0.2, duration: 150 }) } catch (e) {
        console.error('[onRedo] fitView error:', e)
      }
    })
  } catch (e) {
    console.error('[onRedo] 重做失败:', e)
    ElMessage.error(t('message.pages.workflowEditor.weRedoFail'))
  }
}

const { dagVersions, loadDagVersions, rollbackVersion } = useDagVersions(toRef(flowForm, 'workflowId'))
const { autoLayout, buildDagDefinition, loadDagDefinition, exportFlow, importFlow } = useDagOperations(
  nodes, edges, addNodes, addEdges, fitView, (debounceMs?: number) => safeSaveHistory(debounceMs), flowForm, safeSetNodes, setEdges, () => safeResetHistory(),
)

const selectedNodeData = computed<Node | null>(() => {
  if (!selectedNodeId.value) return null
  return nodes.value.find((n: Node) => n.id === selectedNodeId.value) || null
})

const selectedNodeLabel = computed({
  get: () => selectedNodeData.value?.data?.label || '',
  set: (val: string) => {
    if (!selectedNodeId.value || !selectedNodeData.value) return
    const cur = selectedNodeData.value
    const raw = String(val || '').trim()
    const baseLabel = raw || (getTranslatedManifest(String(cur.data?.config?.nodeType || cur.data?.nodeType || '')))?.displayName || cur.id
    // Global dedupe: node names already taken on canvas excluding current node
    const taken = new Set(
      nodes.value
        .filter((n: Node) => n.id !== cur.id)
        .map((n: Node) => (n.data?.label || '').toString())
        .filter((s) => s.length > 0),
    )
    const newLabel = uniquifyNodeLabel(baseLabel, taken)
    updateNodeData(cur.id, { ...(cur.data || {}), label: newLabel })
    if (newLabel !== raw && raw.length > 0) {
      ElMessage.warning(t('message.pages.workflowEditor.weNodeNameDupAutoRename', { name: newLabel }))
    }
    // Rename node → push history + trigger throttled draft save (consistent with onNodeConfigUpdate).
    // Prevents: 'renamed node but no param change → auto-save skipped → name lost on reopen'.
    safeSaveHistory(300)
  },
})

/**
 * Per-node DAG failure strategy: controls whether downstream nodes continue executing after this node fails.
 * Values: undefined=inherit global, fail_fast=halt on failure, continue=keep going
 */
const nodeFailStrategy = computed({
  get: () => {
    if (!selectedNodeData.value) return undefined
    const v = selectedNodeData.value.data?.config?.fail_strategy
    return v === 'fail_fast' || v === 'continue' ? v : undefined
  },
  set: (val: string | undefined) => {
    if (!selectedNodeId.value || !selectedNodeData.value) return
    const node = selectedNodeData.value
    const curConfig = { ...(node.data?.config || {}) }
    if (val) {
      curConfig.fail_strategy = val
    } else {
      delete curConfig.fail_strategy
    }
    updateNodeData(node.id, { ...(node.data || {}), config: curConfig })
    safeSaveHistory(300)
  },
})

/**
 * Assign a 'globally unique' display name to a node.
 *
 * Strict mode (user-specified: do NOT tolerate legacy nodes with identical labels):
 *  - Do NOT strip numeric suffixes, do NOT fall back to root, do NOT 'fix' historical dirty data;
 *  - On conflict, simply increment from `2`: `${baseLabel} 2 / 3 / 4 ...`;
 *  - Pick the smallest available positive integer.
 */
const uniquifyNodeLabel = (baseLabel: string, takenSet: Set<string>): string => {
  const base = String(baseLabel || t('message.pages.workflowEditor.weUnnamedNode')).trim() || t('message.pages.workflowEditor.weUnnamedNode')
  if (!takenSet.has(base)) return base
  let n = 2
  while (takenSet.has(`${base} ${n}`)) {
    n += 1
  }
  return `${base} ${n}`
}

/**
 * Batch-scan node list and perform strict-mode global label dedupe in order of appearance.
 * Return a new array only if changes were made; null otherwise.
 * IMPORTANT: caller MUST invoke BEFORE addNodes, to avoid runtime setNodes bulk replacement
 * conflicting with VueFlow internals.nodeLookup → ghost 0×0 nodes.
 */
const dedupeAllNodeLabels = (nodeList: Node[]): Node[] | null => {
  if (!Array.isArray(nodeList) || nodeList.length === 0) return null
  const used = new Set<string>()
  let changed = false
  const next: Node[] = nodeList.map((orig) => {
    const n = (orig || {}) as any
    const rawLabel = String(n.data?.label || n.id || '').trim()
    const fallback = n.id || t('message.pages.workflowEditor.weUnnamedNode')
    const curLabel = rawLabel.length > 0 ? rawLabel : fallback
    const newLabel = uniquifyNodeLabel(curLabel, used)
    used.add(newLabel)
    if (newLabel !== curLabel) {
      changed = true
      // Only data.label changed; all other VueFlow state fields inherited as-is
      return {
        ...orig,
        data: { ...(n.data || {}), label: newLabel },
      } as Node
    }
    return orig
  })
  return changed ? next : null
}

const selectedManifest = computed<NodeManifest | undefined>(() => {
  if (!selectedNodeData.value) return undefined
  const nodeType = selectedNodeData.value.data?.config?.nodeType || selectedNodeData.value.data?.nodeType
  if (!nodeType) return undefined
  const tr = getTranslatedManifest(nodeType)
  return tr || getNodeManifest(nodeType)
})

const GLOBAL_ERROR_KEYS = ['__all__', 'non_field_errors', 'detail']

const globalNodeErrors = computed<string[]>(() => {
  const result: string[] = []
  GLOBAL_ERROR_KEYS.forEach((key) => {
    const v = nodeErrors.value[key]
    if (!v) return
    if (Array.isArray(v)) {
      v.forEach((item) => {
        if (typeof item === 'string') result.push(item)
      })
    } else if (typeof v === 'string') {
      result.push(v)
    } else {
      result.push(String(v))
    }
  })
  return result
})

const fieldNodeErrors = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {}
  Object.entries(nodeErrors.value).forEach(([key, value]) => {
    if (GLOBAL_ERROR_KEYS.includes(key)) return
    out[key] = typeof value === 'string' ? value : (Array.isArray(value) ? value.join('; ') : String(value))
  })
  return out
})

const selectedEdgeData = computed(() => {
  if (!selectedEdgeId.value) return null
  const edge = edges.value.find((e: Edge) => e.id === selectedEdgeId.value)
  if (!edge) return null
  const sourceNode = nodes.value.find((n: Node) => n.id === edge.source)
  const targetNode = nodes.value.find((n: Node) => n.id === edge.target)
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceLabel: sourceNode?.data?.label || edge.source,
    targetLabel: targetNode?.data?.label || edge.target,
    condition: (edge.data as any)?.condition || '',
  }
})

const getOutgoingEdges = (nodeId: string): Edge[] => {
  return edges.value.filter((e: Edge) => e.source === nodeId)
}

/**
 * Inject visual line style (color, thickness) onto edges; condition text no longer shown on canvas,
 * Always viewed/edited via the right-side property panel after clicking an edge.
 * This function is idempotent — safe to call repeatedly on the same edge.
 */
const decorateEdgeForDisplay = (edgeIn: Edge, allNodes: Node[] = nodes.value): Edge => {
  const e: Edge = { ...edgeIn }
  const raw: string = ((e.data as any)?.condition || '') as string
  const cond = raw.trim()
  ;(e as any).label = undefined
  ;(e as any).labelShowBg = false
  ;(e as any).labelBgStyle = undefined
  if ((e as any).style && typeof (e as any).style === 'object') {
    (e as any).style = { ...(e as any).style }
  } else {
    (e as any).style = {}
  }
  (e as any).style.stroke = cond
    ? (cond === '__else__' ? '#E6A23C' : '#409EFF')
    : '#b1b3b8'
  ;(e as any).style.strokeWidth = cond ? 2 : 1.5
  return e
}

const refreshEdgesDisplay = () => {
  setEdges(edges.value.map((e) => decorateEdgeForDisplay(e)))
}

watch(
  () => edges.value.map((e) => `${e.id}:${((e.data as any)?.condition as string) || ''}:${e.source}→${e.target}`).join('|'),
  () => {
    // Re-label only when edges exist AND label/style out of sync (condition changed, node renamed, new node)
    const needSync = edges.value.some((e) => {
      const expected = decorateEdgeForDisplay(e, nodes.value)
      return (
        ((e as any).label || '') !== ((expected as any).label || '') ||
        JSON.stringify(((e as any).style)?.stroke) !== JSON.stringify(((expected as any).style)?.stroke)
      )
    })
    if (needSync) setEdges(edges.value.map((e) => decorateEdgeForDisplay(e, nodes.value)))
  },
  { flush: 'post' },
)

const buildUniqueTargetLabels = (nodeId: string): { id: string; displayLabel: string }[] => {
  const outs = getOutgoingEdges(nodeId)
  const byLabel = new Map<string, number>()
  for (const e of outs) {
    const tNode = nodes.value.find((n: Node) => n.id === e.target)
    const lbl = tNode?.data?.label || e.target
    byLabel.set(lbl, (byLabel.get(lbl) || 0) + 1)
  }
  const counter = new Map<string, number>()
  return outs.map((e) => {
    const tNode = nodes.value.find((n: Node) => n.id === e.target)
    const label = tNode?.data?.label || e.target
    const key = e.target
    const total = byLabel.get(label) || 1
    if (total <= 1) return { id: e.id, displayLabel: label }
    const seq = (counter.get(label) || 0) + 1
    counter.set(label, seq)
    return { id: e.id, displayLabel: `${label} (#${seq} ${t('message.pages.workflowEditor.weNode')}: ${key})` }
  })
}

const outgoingEdgesWithCondition = computed(() => {
  if (!selectedNodeData.value) return []
  const labelMap = new Map(buildUniqueTargetLabels(selectedNodeData.value.id).map((x) => [x.id, x.displayLabel]))
  return getOutgoingEdges(selectedNodeData.value.id).map((e: Edge) => {
    const targetNode = nodes.value.find((n: Node) => n.id === e.target)
    const condition = (e.data as any)?.condition || ''
    return {
      id: e.id,
      target: e.target,
      targetLabel: labelMap.get(e.id) || targetNode?.data?.label || e.target,
      condition,
      conditionPreview: condition.length > 40 ? condition.slice(0, 40) + '…' : condition,
    }
  })
})

const onNodeConfigUpdate = (newConfig: Record<string, any>) => {
  if (!selectedNodeId.value) return
  const node = nodes.value.find((n: Node) => n.id === selectedNodeId.value)
  if (!node) return
  const nextData = { ...(node.data || {}), config: { ...newConfig } }
  updateNodeData(node.id, nextData)
  nodeErrors.value = {}
  safeSaveHistory(300)
}

const validateCurrentNode = async () => {
  if (!selectedNodeId.value) {
    ElMessage.warning(t('message.pages.workflowEditor.weSelectNodeFirst'))
    return
  }
  const node = nodes.value.find((n: Node) => n.id === selectedNodeId.value)
  if (!node) return
  const nodeType = node.data.config?.nodeType
  if (!nodeType) {
    ElMessage.warning(t('message.pages.workflowEditor.weNodeTypeUndefined'))
    return
  }
  try {
    const cleanedConfig = cleanConfigForValidateStep(nodeType, node.data.config || {})
    const result = await validateStep(nodeType, cleanedConfig)
    if (result.valid) {
      nodeErrors.value = {}
      ElMessage.success(t('message.pages.workflowEditor.weNodeValidatePass'))
    } else {
      if (result.field_errors) {
        // Backend error paths like /params/args — prefixes need stripping
        // so they match manifest.params keys and error hints align with form fields in AutoNodeForm
        const stripPathPrefix = (key: string): string => {
          if (!key) return key
          // Take the last path segment
          const parts = key.split('/').filter(Boolean)
          if (parts.length === 0) return key
          // Strip top-level params, then take the final field
          const withoutParams = parts[0] === 'params' ? parts.slice(1) : parts
          if (withoutParams.length === 0) return key
          return withoutParams.join('.')
        }
        const normalizedErrors: Record<string, any> = {}
        Object.entries(result.field_errors).forEach(([key, val]) => {
          normalizedErrors[stripPathPrefix(key)] = val
        })
        nodeErrors.value = normalizedErrors

        const errorEntries = Object.entries(normalizedErrors)
        const errorCount = errorEntries.length
        const manifest = selectedManifest.value
        const formatMsg = (msg: any): string => {
          if (Array.isArray(msg)) return msg.map(String).join('; ')
          return String(msg)
        }
        const getFieldLabel = (key: string): string => {
          if (GLOBAL_ERROR_KEYS.includes(key)) return t('message.pages.workflowEditor.weGlobal')
          if (!manifest) return key
          const tr = getTranslatedManifest(manifest.nodeType)
          const f = (tr || manifest).params.find(p => p.key === key)
          return f?.label || key
        }
        const errorPreview = errorEntries
          .slice(0, 3)
          .map(([field, msg]) => `<div style="margin:2px 0;">• <b>${getFieldLabel(field)}</b>: ${formatMsg(msg)}</div>`)
          .join('')
        const moreHint = errorCount > 3 ? `<div style="margin:2px 0;color:#999;">... ${t('message.pages.workflowEditor.weMoreErrors', { n: errorCount - 3 })}</div>` : ''
        ElMessage({
          type: 'error',
          dangerouslyUseHTMLString: true,
          message: `<div>${t('message.pages.workflowEditor.weNodeValidateErrorSummary', { n: errorCount })}</div>${errorPreview}${moreHint}`,
          duration: 8000,
          showClose: true,
        })
      } else {
        nodeErrors.value = {}
        ElMessage.error(t('message.pages.workflowEditor.weNodeValidateFail'))
      }
    }
  } catch (_e) {
    ElMessage.warning(t('message.pages.workflowEditor.weNodeValidateReqFail'))
  }
}

const onNodeClick = ({ node }: { node: Node }) => {
  edgeHelpDrawerVisible.value = false
  varsHelpVisible.value = false
  selectedNodeId.value = node.id
  selectedEdgeId.value = null
  nodeErrors.value = {}
}

const onNodeDoubleClick = ({ node }: { node: Node }) => {
  edgeHelpDrawerVisible.value = false
  varsHelpVisible.value = false
  selectedNodeId.value = node.id
  ElMessage.info(t('message.pages.workflowEditor.weEditNode', { name: node.data?.label || node.id }))
}

const onPaneClick = () => {
  edgeHelpDrawerVisible.value = false
  varsHelpVisible.value = false
  selectedNodeId.value = null
  selectedEdgeId.value = null
}

const onEdgeClick = ({ edge }: { edge: Edge }) => {
  edgeHelpDrawerVisible.value = false
  varsHelpVisible.value = false
  selectedNodeId.value = null
  selectedEdgeId.value = edge.id
}

const onEdgeConditionChange = (edgeId: string, condition: string) => {
  const edge = edges.value.find((e: Edge) => e.id === edgeId)
  if (!edge) return
  updateEdgeData(edgeId, { ...(edge.data || {}), condition })
  safeSaveHistory(300)
}

const deleteSelectedEdge = () => {
  if (!selectedEdgeId.value) return
  setEdges(edges.value.filter((e: Edge) => e.id !== selectedEdgeId.value))
  selectedEdgeId.value = null
  safeSaveHistory()
}

const hasUnconditionalEdge = (source: string, target: string): boolean => {
  return edges.value.some((e: Edge) => {
    if (e.source !== source || e.target !== target) return false
    const cond = ((e.data as any)?.condition || '') as string
    return !cond.trim()
  })
}

const dedupeUnconditionalEdges = (opts?: { silent?: boolean }): number => {
  const seen = new Set<string>()
  const keep: Edge[] = []
  let removed = 0
  for (const e of edges.value) {
    const cond = ((e.data as any)?.condition || '') as string
    const key = `${e.source}→${e.target}`
    if (!cond.trim()) {
      if (seen.has(key)) {
        removed++
        continue
      }
      seen.add(key)
    }
    keep.push(e)
  }
  if (removed > 0) {
    setEdges(keep)
    if (!opts?.silent) {
      ElMessage.success(t('message.pages.workflowEditor.weAutoCleanDupEdges', { removed }))
    }
    safeSaveHistory()
  }
  return removed
}

const isValidConnection = (params: { source?: string; target?: string }): boolean => {
  if (graphReadonly.value) return false
  const { source, target } = params
  if (!source || !target) return false
  if (source === target) return false
  return !hasUnconditionalEdge(source, target)
}

const onConnectHandler = (params: any) => {
  const { source, target } = params
  if (!source || !target) {
    ElMessage.warning(t('message.pages.workflowEditor.weEdgeParamsMissing'))
    return
  }
  if (source === target) {
    ElMessage.warning(t('message.pages.workflowEditor.weNodeConnectSelf'))
    return
  }
  if (hasUnconditionalEdge(source, target)) {
    const srcNode = nodes.value.find((n: Node) => n.id === source)
    const tgtNode = nodes.value.find((n: Node) => n.id === target)
    const s = srcNode?.data?.label || source
    const t = tgtNode?.data?.label || target
    ElMessage.warning(t('message.pages.workflowEditor.weEdgeExistsDup', { s, t }))
    return
  }
  safeSaveHistory()
  addEdges([{
    id: `edge_${params.source}_${params.target}_${Date.now()}`,
    source: params.source,
    target: params.target,
    sourceHandle: params.sourceHandle,
    targetHandle: params.targetHandle,
    type: 'default',
    animated: true,
    data: { condition: '' },
  }])
}

const createNewNodeFromManifest = (
  manifestParam: NodeManifest | string,
  position?: { x: number; y: number },
) => {
  const nodeType = typeof manifestParam === 'string' ? manifestParam : manifestParam.nodeType
  const registered = getNodeManifest(nodeType)
  if (!registered) {
    console.warn('[WorkflowEditor.createNewNodeFromManifest] 节点类型未注册:', nodeType)
    ElMessage.warning(t('message.pages.workflowEditor.weUnregisteredType', { type: nodeType }))
    return null
  }
  let pos = position
  if (!pos) {
    const screenCenterX = window.innerWidth / 2
    const screenCenterY = window.innerHeight / 2
    const fallback = project({ x: screenCenterX, y: screenCenterY })
    const baseX = (fallback?.x ?? 300) - 80
    const baseY = (fallback?.y ?? 200) - 30
    const jitterX = nodes.value.length * 24
    const jitterY = nodes.value.length * 18
    pos = {
      x: Number.isFinite(baseX) ? baseX + jitterX : 200 + jitterX,
      y: Number.isFinite(baseY) ? baseY + jitterY : 200 + jitterY,
    }
  }
  // Global node-name dedupe: existing names must not collide with new nodes
  const takenLabels = new Set(
    nodes.value
      .map((n: Node) => (n.data?.label || '').toString())
      .filter((s) => s.length > 0),
  )
  const baseLabel = (getTranslatedManifest(nodeType)?.displayName || registered.displayName) || nodeType || t('message.pages.workflowEditor.weUnnamedNode')
  const uniqueLabel = uniquifyNodeLabel(baseLabel, takenLabels)
  const rawNode = {
    id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'manifest',
    position: pos,
    data: {
      label: uniqueLabel,
      config: { nodeType },
      nodeType,
    },
  }
  const newNode = safeNormalizeNode(rawNode)
  addNodes([newNode])
  nextTick(() => {
    safeSaveHistory()
    try { fitView({ padding: 0.2, duration: 300 }) } catch (_) { /* ignore */ }
  })
  selectedNodeId.value = newNode.id
  ElMessage.success(t('message.pages.workflowEditor.weNodeAdded', { name: getTranslatedManifest(nodeType)?.displayName || registered.displayName || nodeType }))
  return newNode
}

const addNodeFromPalette = (manifest: NodeManifest | any) => {
  if (!manifest || !manifest.nodeType) {
    console.warn('[WorkflowEditor.addNodeFromPalette] manifest 无效:', manifest)
    ElMessage.warning(t('message.pages.workflowEditor.weNodeConfigInvalid'))
    return
  }
  createNewNodeFromManifest(manifest as NodeManifest)
}

const handleNodesChanges = (changes: NodeChange[]) => {
  try {
    if (!Array.isArray(changes) || changes.length === 0) return
    safeSetNodes(currNodes => {
      const next = applyNodeChanges(changes, currNodes as Node[])
      if (!Array.isArray(next)) {
        console.warn('[WorkflowEditor.handleNodesChanges] applyNodeChanges 返回非数组:', next)
        return currNodes as Node[]
      }
      return next
    })
    if (changes.some(c => c.type === 'remove' || c.type === 'add' || c.type === 'replace')) {
      safeSaveHistory()
    }
  } catch (e) {
    console.error('[WorkflowEditor.handleNodesChanges] 节点变化处理失败:', e, changes)
  }
}
const handleEdgesChanges = (changes: EdgeChange[]) => {
  try {
    if (!Array.isArray(changes) || changes.length === 0) return
    setEdges(currEdges => {
      const next = applyEdgeChanges(changes, currEdges as Edge[])
      if (!Array.isArray(next)) {
        console.warn('[WorkflowEditor.handleEdgesChanges] applyEdgeChanges 返回非数组:', next)
        return currEdges as Edge[]
      }
      return next.map((e: Edge) => {
        const existing = (currEdges as Edge[]).find(c => c.id === e.id)
        if (existing?.data && !e.data) {
          return { ...e, data: existing.data }
        }
        if (existing?.data && e.data) {
          return { ...e, data: { ...existing.data, ...e.data } }
        }
        return e
      })
    })
    if (changes.some(c => c.type === 'remove' || c.type === 'add' || c.type === 'replace')) {
      safeSaveHistory()
    }
  } catch (e) {
    console.error('[WorkflowEditor.handleEdgesChanges] 边变化处理失败:', e, changes)
  }
}

const onNodeDragStop = () => { safeSaveHistory() }
const onMoveEnd = (_evt: any, _viewport: any) => {
  // Canvas pan/zoom must not pollute node/edge history stack
}

const deleteSelectedNode = () => {
  if (!selectedNodeId.value) return
  const node = nodes.value.find((n: Node) => n.id === selectedNodeId.value)
  if (!node) return
  const nodeType = node.data?.config?.nodeType || node.data?.nodeType
  if (nodeType === 'start' || nodeType === 'end' || nodeType === 'virtual_start' || nodeType === 'virtual_end') {
    const canonical = (nodeType === 'virtual_start') ? 'start' : (nodeType === 'virtual_end') ? 'end' : nodeType
    const sameTypeCount = nodes.value.filter((n: Node) => {
      const t = n.data?.config?.nodeType || n.data?.nodeType
      return (t === canonical || (canonical === 'start' && t === 'virtual_start') || (canonical === 'end' && t === 'virtual_end'))
    }).length
    if (sameTypeCount <= 1) {
      ElMessage.warning(canonical === 'start' ? t('message.pages.workflowEditor.weNeedAtLeastOneStart') : t('message.pages.workflowEditor.weNeedAtLeastOneEnd'))
      return
    }
  }
  safeSaveHistory()
  safeSetNodes(nodes.value.filter((n: Node) => n.id !== selectedNodeId.value))
  setEdges(edges.value.filter(
    (e: Edge) => e.source !== selectedNodeId.value && e.target !== selectedNodeId.value,
  ))
  selectedNodeId.value = null
  ElMessage.success(t('message.pages.workflowEditor.weNodeDeleted'))
}

const goBack = () => router.back()

const loadVersion = (ver: any) => {
  if (!ver.definition) return
  safeSetNodes([])
  setEdges([])
  nextTick(() => {
    loadDagDefinition(ver.definition)
    if (ver.global_envs && typeof ver.global_envs === 'object') {
      flowForm.variables = Object.entries(ver.global_envs).map(([key, value]) => ({ key, value: String(value) }))
    }
    resetHistoryToCurrent()
    nextTick(validateVariables)
    ElMessage.success(t('message.pages.workflowEditor.weVersionLoaded', { v: ver.version }))
  })
}

const onRollbackVersion = async (ver: any) => {
  const ok = await rollbackVersion(ver)
  if (ok) {
    flowForm.status = 'published'
    loadVersion(ver)
  }
}

const { saveFlow: _saveFlow, publishFlow: _publishFlow } = useFlowPersistence(
  nodes, edges, flowForm, selectedNodeId, nodeErrors, buildDagDefinition, loadDagVersions,
  async () => {
    try {
      const r = await GetList({ page: 1, perPage: 0 } as any)
      const total = (r as any)?.total ?? (r as any)?.data?.total ?? (Array.isArray((r as any)?.data) ? (r as any).data.length : 0)
      return Number(total) || 0
    } catch (_e) { return 0 }
  },
)

const saveFlow = async () => {
  if (!validateVariables()) {
    ElMessage.error(t('message.pages.workflowEditor.weGlobalVarInvalid'))
    return
  }
  await _saveFlow()
}

const publishFlow = async () => {
  if (!validateVariables()) {
    ElMessage.error(t('message.pages.workflowEditor.weGlobalVarInvalid'))
    return
  }
  if (detectNeedApproval()) {
    openPublishApprovalDialog()
  } else {
    await _publishFlow()
  }
}

const runFlow = async () => {
  if (!flowForm.workflowId) { ElMessage.error(t('message.pages.workflowEditor.weSaveAndPublishFirst')); return }
  if (flowForm.status === 'pending') { ElMessage.error(t('message.pages.workflowEditor.wePendingNoTrialRun')); return }
  if (flowForm.status !== 'published') { ElMessage.error(t('message.pages.workflowEditor.wePublishFirst')); return }
  try {
    const res: any = await TriggerWorkflow(flowForm.workflowId, {
      trigger_params: {},
      trigger_type: 'dryrun',
    })
    const execId = res?.data?.execution_id || res?.execution_id
    const wfId = flowForm.workflowId
    const wfName = flowForm.name || t('message.pages.workflowEditor.weUnnamedWorkflow')
    ElNotification({
      title: t('message.pages.workflowEditor.weTrialRunStartedTitle'),
      message: h('div', { style: 'line-height: 1.6;' }, [
        h('p', { style: 'margin: 4px 0;' }, t('message.pages.workflowEditor.weTrialRunStartedBody', { name: wfName })),
        h('div', { style: 'margin-top: 8px; display: flex; gap: 8px;' }, [
          h(ElButton, {
            size: 'small',
            type: 'primary',
            onClick: () => {
              if (execId) router.push(`/workflow/record/${execId}`)
              else router.push(`/workflow/record?flowId=${wfId}&triggerType=dryrun`)
            }
          }, () => t('message.pages.workflowEditor.weViewThisTrialDetail')),
          h(ElButton, {
            size: 'small',
            onClick: () => router.push(`/workflow/record?flowId=${wfId}&triggerType=dryrun`)
          }, () => t('message.pages.workflowEditor.weViewAllTrialRuns')),
        ])
      ]),
      type: 'warning',
      duration: 10000,
      showClose: true,
    })
  } catch (e: any) {
    ElMessage.error(e?.message || t('message.pages.workflowEditor.weTriggerFail'))
  }
}

const variableErrors = ref<Record<number, { key?: string }>>({})

const variableErrorList = computed(() => {
  const out: { index: number; message: string }[] = []
  flowForm.variables.forEach((_, idx) => {
    const msg = variableErrors.value[idx]?.key
    if (msg) out.push({ index: idx, message: msg })
  })
  return out
})

const VARIABLE_KEY_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/

const validateVariables = (): boolean => {
  const errors: Record<number, { key?: string }> = {}
  const seen = new Map<string, number>()
  let valid = true

  flowForm.variables.forEach((v, idx) => {
    const key = String(v.key || '').trim()
    if (!key) {
      errors[idx] = { key: t('message.pages.workflowEditor.weVarNameRequired') }
      valid = false
      return
    }
    if (!VARIABLE_KEY_REGEX.test(key)) {
      errors[idx] = { key: t('message.pages.workflowEditor.weVarNameRegexHint') }
      valid = false
      return
    }
    if (seen.has(key)) {
      errors[idx] = { key: t('message.pages.workflowEditor.weVarNameDup', { n: seen.get(key)! + 1 }) }
      const prevIdx = seen.get(key)!
      if (!errors[prevIdx]) {
        errors[prevIdx] = { key: t('message.pages.workflowEditor.weVarNameDup', { n: idx + 1 }) }
      }
      valid = false
      return
    }
    seen.set(key, idx)
  })

  variableErrors.value = errors
  return valid
}

const getVariableRowClass = (rowIndex: number) => {
  return variableErrors.value[rowIndex] ? 'variable-row-error' : ''
}

const addVariable = () => {
  flowForm.variables.push({ key: '', value: '' })
  nextTick(validateVariables)
}

onMounted(async () => {
  if (canvasContainerRef.value) {
    canvasContainerRef.value.addEventListener('dragover', _onNativeDragOver, true)
    canvasContainerRef.value.addEventListener('drop', _onNativeDrop, true)
  }
  document.addEventListener('dragover', _onNativeDragOver, true)
  document.addEventListener('drop', _onNativeDrop, true)
  console.log('[WF] onMounted: 原生拖拽监听器已挂载（canvas-container + document capture 双路）')
  const staticCount = getAllNodeManifests().length
  try {
    const backendManifests = await fetchManifests()
    let backendCount = 0
    for (const m of backendManifests) {
      const existing = getNodeManifest(m.node_type)
      if (!existing) {
        const category = (m.category && ['control','execution','notification','approval','integration','transform'].includes(m.category))
          ? m.category
          : 'execution'
        registerNodeManifest({
          nodeType: m.node_type,
          displayName: m.display_name,
          category,
          color: '#409EFF',
          icon: '⚙️',
          description: `${m.display_name} (${t('message.pages.workflowEditor.weBackendRegistered')})`,
          requiresHost: m.requires_host,
          isAsynchronousHuman: m.is_asynchronous_human,
          inputs: ['in'],
          outputs: ['out'],
          params: [],
        })
        backendCount++
      }
    }
    const total = getAllNodeManifests().length
    ElMessage.info(t('message.pages.workflowEditor.weNodeTypesLoaded', { total, staticCount, backendCount }))
  } catch {
    ElMessage.info(t('message.pages.workflowEditor.weNodeTypesLoadedStatic', { staticCount }))
  }

  loadCategoryOptions()
  // 预加载审批人选择列表（用户 picker，不阻塞后续关键 GetObj 加载）。
  // * 先判断 Session 里有没有token——路由刚完成登录时可能同步到 Session 的时间点还没到（竞态），避免 401 被 service 全局拦截清掉 Session
  // * 传 _noGlobalError=true：第一次 401 不清 Session、不弹框
  // * 失败后 200ms 重试一次（等 token 已经在 Session 里就绪）
  const tryLoadApproverUsers = async (retryLeft = 1) => {
    const hasToken = !!Session.get('token')
    if (!hasToken) {
      if (retryLeft > 0) {
        setTimeout(() => tryLoadApproverUsers(retryLeft - 1), 200)
      }
      return
    }
    try {
      const res: any = await request({
        url: '/api/taurus/user-options/',
        method: 'get',
        params: { size: 200 },
        _noGlobalError: true,
      } as any)
      approverUserList.value = res.data?.results || res.data || []
    } catch (e: any) {
      if (retryLeft > 0 && e?.response?.status === 401) {
        setTimeout(() => tryLoadApproverUsers(retryLeft - 1), 200)
      } else {
        approverUserList.value = []
      }
    }
  }
  tryLoadApproverUsers(1)
  const routeId = router.currentRoute.value.params.id as string
  if (routeId && routeId !== 'new') {
    const wfId = parseInt(routeId, 10)
    if (!isNaN(wfId)) {
      try {
        const res = await GetObj(wfId)
        const wf = res?.data || res
        flowForm.workflowId = wfId
        flowForm.name = wf.name || ''
        flowForm.desc = wf.description || ''
        flowForm.categoryId = wf.category ?? (wf.category_id ?? null)
        flowForm.authType = (wf.auth_type === 'public' ? 'public' : 'private')
        flowForm.needAudit = !!wf.need_audit
        flowForm.customApproverIds = Array.isArray(wf.custom_approver_ids)
          ? wf.custom_approver_ids.map((x: any) => Number(x)).filter((x: number) => !isNaN(x))
          : []
        flowForm.hasSchedule = !!wf.has_schedule
        flowForm.scheduleType = wf.schedule_type || 'cron'
        flowForm.cronExpression = wf.cron_expression || ''
        flowForm.intervalSeconds = Number(wf.interval_seconds) || 3600
        flowForm.runOnceAt = wf.run_once_at || ''
        flowForm.scheduleEnabled = wf.schedule_enabled !== false
        flowForm.timeout = Number(wf.global_timeout_sec) || 3600
        flowForm.failStrategy = wf.fail_strategy || 'stop'
        if (wf.status === 2) {
          flowForm.status = 'pending'
        } else if (wf.dag_published_version_id && wf.status === 0) {
          flowForm.status = 'published'
        } else {
          flowForm.status = 'draft'
        }
        shareCurrentPerms.value = (() => {
          if (Array.isArray(wf.current_perms)) return wf.current_perms
          if (wf.current_perms === null || wf.current_perms === undefined) return undefined as any
          return undefined as any
        })()
        if (wf.global_envs && typeof wf.global_envs === 'object') {
          flowForm.variables = Object.entries(wf.global_envs).map(([key, value]) => ({ key, value: String(value) }))
        }
        if (wf.graph_definition) {
          loadDagDefinition(wf.graph_definition)
          resetHistoryToCurrent()
          setTimeout(() => {
            const n = dedupeUnconditionalEdges({ silent: true })
            if (n > 0) ElMessage.warning(t('message.pages.workflowEditor.weAutoCleanDupOut', { n }))
          }, 200)
        } else {
          nextTick(() => {
            setTimeout(() => {
              fitView({ padding: 0.2 })
              resetHistoryToCurrent()
              readCurrentZoom()
            }, 50)
          })
        }
        nextTick(validateVariables)
        loadDagVersions()
      } catch (e: any) {
        ElMessage.error(t('message.pages.workflowEditor.weLoadWorkflowFail') + ': ' + (e?.message || ''))
      }
    } else {
      nextTick(() => {
        setTimeout(() => {
          fitView({ padding: 0.2 })
          resetHistoryToCurrent()
          readCurrentZoom()
        }, 50)
      })
    }
  } else {
    nextTick(() => {
      setTimeout(() => {
        fitView({ padding: 0.2 })
        resetHistoryToCurrent()
        readCurrentZoom()
      }, 50)
    })
  }
})

onBeforeUnmount(() => {
  if (canvasContainerRef.value) {
    canvasContainerRef.value.removeEventListener('dragover', _onNativeDragOver, true)
    canvasContainerRef.value.removeEventListener('drop', _onNativeDrop, true)
  }
  document.removeEventListener('dragover', _onNativeDragOver, true)
  document.removeEventListener('drop', _onNativeDrop, true)
})
</script>

<style scoped lang="scss">
.workflow-editor-page {
  width: 100%;
  height: calc(100vh - 150px);
  height: calc(100dvh - 150px);
  min-height: 600px;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
  box-sizing: border-box;
}

.editor-header {
  min-height: 56px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px 16px;
  gap: 8px 16px;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 auto;
    min-width: 240px;
  }
  .header-center {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
    flex-wrap: wrap;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
    flex-wrap: wrap;
  }
  .flow-name-input {
    flex: 1 1 200px;
    min-width: 180px;
    max-width: 320px;
  }
}

.editor-main {
  flex: 1 1 auto;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  min-height: 0;
}

.left-panel-wrapper,
.right-panel-wrapper {
  position: relative;
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  transition: width 0.25s ease;
  background: #fff;
}

.left-panel-wrapper {
  border-right: 1px solid #e4e7ed;

  &.collapsed {
    width: 0 !important;
    border-right: none;
  }
}

.right-panel-wrapper {
  border-left: 1px solid #e4e7ed;

  &.collapsed {
    width: 0 !important;
    border-left: none;
  }
}

.panel-resizer {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  z-index: 20;
  cursor: col-resize;
  user-select: none;
  background: transparent;
  transition: background-color 0.15s;

  &:hover,
  &:active {
    background: rgba(64, 158, 255, 0.25);
  }
}
.left-resizer { right: -3px; }
.right-resizer { left: -3px; }

.panel-toggle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 48px;
  background: #fff;
  border: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  color: #909399;
  transition: all 0.2s;
  user-select: none;

  &:hover {
    background: #409EFF;
    color: #fff;
    border-color: #409EFF;
  }

  .el-icon {
    font-size: 12px;
  }
}

.left-toggle {
  right: -18px;
  border-radius: 0 4px 4px 0;
  border-left: none;
}

.right-toggle {
  left: -18px;
  border-radius: 4px 0 0 4px;
  border-right: none;
}

.canvas-container {
  flex: 1 1 auto;
  position: relative;
  overflow: hidden;
  min-width: 0;
  min-height: 500px;
  width: auto;
  height: auto;
  box-sizing: border-box;
}

.canvas-container > :deep(.vue-flow) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.property-panel {
  max-height: 100vh;
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-sizing: border-box;

  .panel-title {
    padding: 12px 16px;
    font-weight: 600;
    font-size: 14px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;

    .panel-title-actions {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }

  .property-content {
    padding: 12px 16px 220px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;
  }
}

.unit {
  margin-left: 8px;
  color: #999;
  font-size: 12px;
}

.global-errors {
  margin: 12px 0;
  padding: 10px 12px;
  background: #FEF0F0;
  border: 1px solid #FBC4C4;
  border-radius: 4px;

  .global-error-item {
    display: flex;
    align-items: flex-start;
    font-size: 12px;
    color: #F56C6C;
    line-height: 1.5;
    margin: 2px 0;

    &:first-child { margin-top: 0; }
    &:last-child { margin-bottom: 0; }
  }
}

.node-basic-section {
  padding-bottom: 4px;
  border-bottom: 1px dashed #f0f1f5;
  margin-bottom: 8px;
}

.node-params-section {
  padding-bottom: 6px;
  margin-bottom: 4px;
}

.params-divider {
  margin: 10px 0 !important;
}

.node-edge-section {
  margin-top: 6px;
  padding-top: 4px;
}

.edge-divider {
  margin: 12px 0 8px 0 !important;
}

.edge-section-card {
  margin: 10px -16px 6px -16px;
  padding: 10px 16px 8px;
  background: linear-gradient(180deg, #ECF5FF 0%, #F5FAFF 100%);
  border-top: 1px solid #D9ECFF;
  border-bottom: 1px solid #D9ECFF;

  .edge-section-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .edge-section-card-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #409EFF;
    font-weight: 600;
    font-size: 13px;
  }
}

.edge-info {
  color: #999;
  font-size: 12px;
  padding: 8px 0;
}

.edge-condition-item {
  padding: 10px 0 4px 0;
  position: relative;

  &.with-divider::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -2px;
    height: 1px;
    background: #f0f1f5;
  }

  .edge-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .edge-target-arrow {
    color: #b1b3b8;
    font-weight: 600;
    font-size: 12px;
    flex-shrink: 0;
  }

  .edge-target {
    font-size: 13px;
    color: #2c3e50;
    font-weight: 600;
    margin-right: auto;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .edge-badge {
    flex-shrink: 0;
  }

  .edge-help-icon {
    margin-left: 4px;
    cursor: pointer;
    color: #a8abb2;
    font-size: 14px;
    flex-shrink: 0;
    transition: color .15s ease;
    &:hover {
      color: #409EFF;
    }
  }

  .edge-expr {
    display: block;
    width: 100%;
  }
}

.edge-help-content {
  font-size: 12px;
  color: #4a5058;
  line-height: 1.6;

  .edge-help-title {
    font-size: 13px;
    font-weight: 600;
    color: #1f2d3d;
    margin: 0 0 8px 0;
  }

  .edge-help-list {
    padding-left: 18px;
    margin: 0 0 8px 0;

    li {
      margin-bottom: 6px;

      code {
        background: #f4f7fb;
        padding: 1px 5px;
        border-radius: 3px;
        color: #c7254e;
        font-size: 11px;
      }
    }
  }

  .edge-help-samples,
  .edge-help-section {
    margin: 10px 0 4px;
    padding: 8px 10px;
    background: #fafbfd;
    border-radius: 6px;
    border: 1px solid #eef1f5;

    & + .edge-help-section {
      margin-top: 8px;
    }

    > div {
      font-size: 11px;
      color: #83878e;
      margin-top: 4px;
      &:first-child { margin-top: 0; }
    }
  }

  .edge-help-samples code,
  .edge-help-section code,
  .edge-help-example code {
    display: inline-block;
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 3px;
    padding: 2px 7px;
    color: #2c3e50;
    font-size: 11px;
    white-space: nowrap;
    vertical-align: middle;
  }

  .edge-help-section-title {
    margin: 0 0 6px 0;
    font-size: 12px;
    font-weight: 600;
    color: #1f2d3d;
    display: flex;
    align-items: baseline;
    gap: 6px;
    border-bottom: 1px dashed #e4e8ed;
    padding-bottom: 4px;

    .edge-help-idx {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #409EFF;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .edge-help-sub {
      font-size: 10px;
      color: #909399;
      font-weight: 400;
      margin-left: auto;
    }
  }

  .edge-help-items {
    list-style: none;
    margin: 0;
    padding: 0;

    li {
      margin: 0 0 5px 0;
      padding: 0;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 6px 10px;
      align-items: start;
      font-size: 11px;
      line-height: 1.6;

      > code {
        grid-column: 1;
      }
      > span {
        grid-column: 2;
        color: #6b7280;
        code {
          background: #f4f7fb;
          border: none;
          color: #c7254e;
          padding: 0 4px;
        }
        b {
          color: #c0392b;
        }
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .edge-help-example {
    margin: 0 0 6px 0;
    padding: 5px 6px 5px 8px;
    background: #fff;
    border: 1px solid #eef1f5;
    border-radius: 4px;
    border-left: 3px solid #409EFF;
    display: grid;
    grid-template-columns: auto auto 1fr;
    gap: 4px 8px;
    align-items: center;
    font-size: 11px;
    line-height: 1.65;

    &:last-child { margin-bottom: 0; }

    > label {
      grid-column: 1;
      font-weight: 700;
      color: #409EFF;
      font-size: 11px;
    }
    > .edge-help-desc {
      grid-column: 2;
      color: #555;
      font-size: 11px;
    }
    > code {
      grid-column: 3;
      justify-self: start;
      font-size: 11px;
      background: #f6f8fa;
      border: 1px solid #e5e8ec;
      color: #2c3e50;
    }
    > .edge-help-alias {
      grid-column: 2;
      text-align: right;
      color: #67C23A;
      font-size: 10px;
      font-weight: 600;
    }
    > code.edge-help-code-good {
      grid-column: 3;
      justify-self: start;
      background: #f0f9eb;
      border-color: #c2e7b0;
      color: #529b2e;
    }
  }

  .edge-help-tip {
    margin: 4px 0 0 0;
    padding: 6px 8px;
    background: #ecf5ff;
    color: #606266;
    border-radius: 4px;
    font-size: 11px;
    border-left: 3px solid #409EFF;

    b {
      color: #409EFF;
    }
  }
}

.condition-hint {
  margin-top: 4px;
  font-size: 11px;
  color: #999;
  code {
    background: #f5f5f5;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 11px;
  }
}

.version-empty {
  color: #999;
  font-size: 12px;
  text-align: center;
  padding: 16px 0;
}

.version-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child { border-bottom: none; }

  .version-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .version-tag {
    background: #409EFF;
    color: #fff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .version-time {
    color: #999;
    font-size: 12px;
  }

  .version-note {
    font-size: 12px;
    color: #666;
    margin-bottom: 6px;
  }

  .version-actions {
    display: flex;
    gap: 8px;
  }
}

:deep(.variable-row-error) {
  background: #fef0f0 !important;

  td {
    background: #fef0f0 !important;
  }
}

.variables-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  margin-bottom: 16px;
  gap: 20px;

  .var-hint {
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
    flex: 1;
  }
}

.var-row-num {
  display: inline-block;
  min-width: 20px;
  text-align: center;
  font-size: 12px;
  color: #909399;
  font-variant-numeric: tabular-nums;
}

.vars-help-icon {
  cursor: pointer;
  vertical-align: middle;
  transition: color 0.15s;

  &:hover {
    color: #409EFF !important;
  }
}

.edge-help-drawer-content {
  font-size: 13px;
  color: #4a5058;
  line-height: 1.7;
  padding-right: 4px;

  .edge-help-list {
    padding-left: 20px;
    margin: 0 0 10px 0;

    li {
      margin-bottom: 8px;

      code {
        background: #f4f7fb;
        padding: 1px 6px;
        border-radius: 3px;
        color: #c7254e;
        font-size: 12px;
      }
    }
  }

  .edge-help-section {
    margin: 10px 0 6px;
    padding: 10px 12px;
    background: #fafbfd;
    border-radius: 6px;
    border: 1px solid #eef1f6;
  }

  .edge-help-section-title {
    margin: 0 0 8px 0;
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .edge-help-idx {
    display: inline-flex;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #409EFF;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .edge-help-sub {
    color: #909399;
    font-weight: 400;
    font-size: 11px;
  }

  .edge-help-items {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 4px 0;
      margin-bottom: 0;
      font-size: 12px;
      line-height: 1.6;

      > code {
        flex-shrink: 0;
        max-width: 55%;
        background: #fff;
        border: 1px solid #ebeef5;
        word-break: break-all;
        white-space: normal;
      }

      > span {
        color: #606266;
        flex: 1 1 auto;
        min-width: 0;
        word-break: break-word;
      }
    }
  }

  .edge-help-example {
    display: grid;
    grid-template-columns: 40px 1fr auto;
    grid-template-rows: auto auto;
    gap: 2px 10px;
    align-items: center;
    padding: 8px 10px;
    margin: 6px 0;
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 5px;

    label {
      grid-column: 1;
      grid-row: 1 / span 2;
      display: inline-flex;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #ecf5ff;
      color: #409EFF;
      font-weight: 700;
      font-size: 12px;
      align-items: center;
      justify-content: center;
    }

    .edge-help-desc {
      grid-column: 2;
      grid-row: 1;
      font-size: 11px;
      color: #909399;

      code {
        font-size: 11px;
        background: #f4f4f5;
        color: #606266;
        padding: 0 4px;
        border-radius: 3px;
      }
    }

    > code {
      grid-column: 2;
      grid-row: 2;
      justify-self: start;
    }

    .edge-help-alias {
      grid-column: 3;
      grid-row: 1;
      font-size: 11px;
      color: #909399;
      justify-self: end;
    }

    .edge-help-code-good {
      grid-column: 3;
      grid-row: 2;
      background: #f0f9eb;
      border-color: #e1f3d8;
      color: #67c23a;
      justify-self: end;
    }
  }

  .edge-help-tip {
    margin: 12px 0 0 0;
    padding: 8px 12px;
    background: #ecf5ff;
    color: #606266;
    border-radius: 4px;
    font-size: 12px;
    border-left: 3px solid #409EFF;
    line-height: 1.6;

    b {
      color: #409EFF;
    }
  }
}

.edge-bottom-spacer {
  height: 180px;
  flex-shrink: 0;
}
</style>

<!-- Global styles: el-popover (edge-help-popover) teleported to body can only be targeted here -->
<style lang="scss">
.edge-help-popover.el-popper {
  max-height: 62vh !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;

  /* Target the real content container inside Element Plus popover (multi-version compatible)*/
  .el-popper__body,
  .el-popover__body,
  > .el-popper__arrow + div,
  > div:not(.el-popper__arrow) {
    max-height: 62vh !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    padding: 12px 14px !important;
    box-sizing: border-box !important;
  }

  /* Custom scrollbar so users 'can see it's scrollable' */
  .el-popper__body::-webkit-scrollbar,
  .el-popover__body::-webkit-scrollbar,
  > div::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .el-popper__body::-webkit-scrollbar-thumb,
  .el-popover__body::-webkit-scrollbar-thumb,
  > div::-webkit-scrollbar-thumb {
    background: #c9ccd1;
    border-radius: 3px;
  }
  .el-popper__body::-webkit-scrollbar-track,
  .el-popover__body::-webkit-scrollbar-track,
  > div::-webkit-scrollbar-track {
    background: #f2f3f5;
  }
}
</style>