<template>
  <div class="script-exec-page">
    <!-- Top action bar -->
    <div class="page-header">
      <div class="title">
        <h2>{{ t('message.pages.opsScript.pageTitle') }}</h2>
        <span class="desc">{{ t('message.pages.opsScript.pageDesc') }}</span>
      </div>
      <div class="header-btn-group">
        <el-button @click="handleNewScript">
          <template #icon><fs-iconify icon="ion:add-circle-outline" /></template>
          {{ t('message.pages.opsScript.btnNewScript') }}
        </el-button>
        <el-button type="success" @click="openSaveDialog">
          <template #icon><fs-iconify icon="ion:save-outline" /></template>
          {{ t('message.pages.opsScript.btnSaveScript') }}
        </el-button>
        <div class="ee-gate-card"
             :class="{ 'is-ee-gate': !hasFeature('SCRIPT_SHARING') }"
             :title="!hasFeature('SCRIPT_SHARING') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
             @click.capture="onShareBlockClick">
          <el-tooltip v-if="hasFeature('SCRIPT_SHARING') && !canManageShareCurrent().ok" :content="canManageShareCurrent().reason" placement="bottom">
            <el-button disabled>
              <template #icon><Share /></template>
              {{ t('message.pages.opsScript.btnShare') }}
            </el-button>
          </el-tooltip>
          <el-button v-else-if="hasFeature('SCRIPT_SHARING')" type="warning" @click.stop="openShareManageCurrent">
            <template #icon><Share /></template>
            {{ t('message.pages.opsScript.btnShare') }}
          </el-button>
          <el-button v-else type="warning" :disabled="true" @click.stop.prevent>
            <template #icon><Share /></template>
            {{ t('message.pages.opsScript.btnShare') }} · EE
          </el-button>
        </div>
        <el-button @click="showHistory = true">
          <template #icon><fs-iconify icon="ion:time-outline" /></template>
          {{ t('message.pages.opsScript.btnHistory') }}
        </el-button>
      </div>
    </div>

    <div class="page-main">
      <!-- Left script tree -->
      <div
        class="left-tree-box"
        :class="{ 'is-collapsed': sidebarCollapsed }"
        :style="{ width: sidebarWidth + 'px' }"
      >
        <div class="tree-title">
          <span v-if="!sidebarCollapsed">{{ t('message.pages.opsScript.treeTitle') }}</span>
          <div style="margin-left: auto; display: flex; align-items: center; gap: 4px">
            <el-button
              v-if="!treeLoading && !sidebarCollapsed"
              size="small"
              link
              @click="loadTreeData"
            >
              <fs-iconify icon="ion:refresh-outline" />
            </el-button>
            <el-button
              size="small"
              link
              @click="toggleSidebar"
              :title="sidebarCollapsed ? t('message.pages.opsScript.treeCollapsed') : t('message.pages.opsScript.treeExpanded')"
            >
              <fs-iconify
                :icon="sidebarCollapsed ? 'ion:chevron-forward-outline' : 'ion:chevron-back-outline'"
              />
            </el-button>
          </div>
        </div>

        <!-- Script search: hidden when collapsed -->
        <div v-show="!sidebarCollapsed" class="tree-search-box">
          <el-input
            v-model="searchKeyword"
            size="small"
            clearable
            :placeholder="t('message.pages.opsScript.treeSearchPlaceholder')"
          >
            <template #prefix>
              <fs-iconify icon="ion:search-outline" />
            </template>
          </el-input>
        </div>

        <el-tree
          ref="treeRef"
          :data="treeData"
          node-key="id"
          default-expand-all
          :filter-node-method="filterTreeNode"
          @node-click="handleTreeClick"
          v-loading="treeLoading"
          v-show="!sidebarCollapsed"
        >
          <template #default="{ data }">
            <span class="custom-tree-node">
              <fs-iconify
                v-if="data.type === 'category' || data.type === 'system'"
                icon="ion:folder-outline"
                style="margin-right: 4px; color: #e6a23c"
              />
              <fs-iconify
                v-else
                icon="ion:document-text-outline"
                style="margin-right: 4px; color: #409eff"
              />
              <span class="node-label" :title="data.label">{{ data.label }}</span>
              <span
                v-if="(data.type === 'category' || data.type === 'system') && typeof data.count === 'number' && data.count >= 0"
                class="node-count"
              >
                ({{ data.count }})
              </span>
              <el-tag
                v-if="data.type === 'script' && data.script_type"
                size="small"
                effect="plain"
                style="margin-left: 4px; transform: scale(0.8)"
              >
                {{ data.script_type }}
              </el-tag>
            </span>
          </template>
        </el-tree>
      </div>

      <!-- Sidebar drag-to-resize handle -->
      <div
        class="sidebar-resizer"
        :class="{ disabled: sidebarCollapsed }"
        @mousedown="startSidebarResize"
      />

      <!-- Right main content area -->
      <div class="right-main">
        <!-- Script editor -->
        <div class="editor-card" v-loading="loadingScript">
          <div class="editor-toolbar">
            <el-select v-model="form.script_type" :placeholder="t('message.pages.opsScript.editorSelectTypePlaceholder')" style="width: 160px">
              <el-option label="Shell" value="sh" />
              <el-option label="Python3" value="python" />
            </el-select>
            <div class="toolbar-info" v-if="currentLoadedScriptId">
              <el-tag size="small" type="info" effect="plain">
                {{ t('message.pages.opsScript.editorLoadedTag', { id: currentLoadedScriptId }) }}
                <span v-if="saveForm.name">{{ t('message.pages.opsScript.editorLoadedTagWithName', { name: saveForm.name }) }}</span>
              </el-tag>
            </div>
            <div style="margin-left: auto; display: flex; gap: 8px">
              <el-tooltip :content="t('message.pages.opsScript.editorTooltipTheme')">
                <el-button size="small" type="info" @click="form.editor_theme = form.editor_theme === 'github_light_default' ? 'github_dark' : 'github_light_default'">
                  <fs-iconify :icon="form.editor_theme === 'github_light_default' ? 'ion:moon-outline' : 'ion:sunny-outline'" />
                </el-button>
              </el-tooltip>
              <el-button size="small" type="warning" :loading="riskChecking && hasFeature('SCRIPT_SECURITY_CHECK')"
                         :disabled="!hasFeature('SCRIPT_SECURITY_CHECK')"
                         :title="!hasFeature('SCRIPT_SECURITY_CHECK') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                         class="ee-gate-card"
                         :class="{ 'is-ee-gate': !hasFeature('SCRIPT_SECURITY_CHECK') }"
                         @click.capture="onRiskCheckBtnClick">{{ hasFeature('SCRIPT_SECURITY_CHECK') ? t('message.pages.opsScript.editorBtnRiskCheck') : t('message.pages.opsScript.editorBtnRiskCheck') + ' · EE' }}</el-button>
              <el-button size="small" type="danger" plain @click="clearEditor">{{ t('message.pages.opsScript.editorBtnClear') }}</el-button>
            </div>
          </div>
          <v-ace-editor
            v-model:value="form.script_content"
            :lang="form.script_type"
            :theme="form.editor_theme"
            :options="editorOptions"
            class="monaco-editor-box"
          />
        </div>

        <!-- Config + log area -->
        <div class="config-log-box">
          <!-- Execution config -->
          <div class="config-box">
            <el-tabs v-model="activeTab" type="border-card">
              <el-tab-pane :label="t('message.pages.opsScript.tabTargetHost')" name="host">
                <div class="form-item host-select-type-row">
                  <el-radio-group v-model="hostSelectType">
                    <el-radio :label="t('message.pages.opsScript.hostSelectLabel')" value="group" />
                    <el-radio :label="t('message.pages.opsScript.hostInputLabel')" value="input" />
                  </el-radio-group>
                </div>
                <div class="form-item host-group-row" v-if="hostSelectType === 'group'">
                  <el-button type="primary" @click="showTargetHosts = true" style="width: 100%">
                    {{ t('message.pages.opsScript.hostSelectBtn', { count: selectedHosts.length }) }}
                  </el-button>
                  <div v-if="selectedHosts.length > 0" class="selected-host-tags">
                    <el-tag
                      v-for="host in selectedHosts"
                      :key="host.id"
                      closable
                      size="small"
                      @close="removeHost(host.id)"
                    >
                      {{ host.host_name || host.host_ip }}
                    </el-tag>
                  </div>
                </div>
                <div class="form-item host-input-item" v-if="hostSelectType === 'input'">
                  <el-input
                    v-model="form.ip_list"
                    type="textarea"
                    rows="6"
                    :placeholder="t('message.pages.opsScript.hostInputPlaceholder')"
                  />
                  <div class="host-input-actions">
                    <input
                      ref="hostFileInputRef"
                      type="file"
                      accept=".txt,.csv,.log,.hosts"
                      style="display: none"
                      @change="handleHostFileImport"
                    />
                    <el-button size="small" @click="triggerHostFileImport">
                      <el-icon><Plus /></el-icon>
                      {{ t('message.pages.opsScript.hostBtnImport') }}
                    </el-button>
                    <el-button
                      size="small"
                      type="primary"
                      :loading="hostValidateLoading"
                      @click="handleValidateHosts"
                    >
                      <el-icon><CircleCheck /></el-icon>
                      {{ t('message.pages.opsScript.hostBtnValidate') }}
                    </el-button>
                    <el-button
                      size="small"
                      type="danger"
                      plain
                      :disabled="(hostValidateResult.not_found.length + hostValidateResult.no_permission.length) === 0"
                      :loading="hostCleanInvalidLoading"
                      @click="handleCleanInvalidHosts"
                    >
                      <el-icon><Delete /></el-icon>
                      {{ t('message.pages.opsScript.hostBtnCleanInvalid') }}
                    </el-button>
                  </div>
                  <div v-if="hostValidateResult.valid.length + hostValidateResult.not_found.length + hostValidateResult.no_permission.length > 0" class="host-input-stats">
                    <span
                      v-if="hostValidateResult.valid.length > 0"
                      class="host-stat host-stat-valid"
                    >
                      {{ t('message.pages.opsScript.hostValidCount', { count: hostValidateResult.valid.length }) }}
                    </span>
                    <span
                      v-if="hostValidateResult.not_found.length > 0"
                      class="host-stat host-stat-notfound"
                      :title="t('message.pages.opsScript.hostNotFoundTooltip', { list: hostValidateResult.not_found.join('\n') })"
                    >
                      {{ t('message.pages.opsScript.hostNotFoundCount', { count: hostValidateResult.not_found.length }) }}
                    </span>
                    <span
                      v-if="hostValidateResult.no_permission.length > 0"
                      class="host-stat host-stat-noperm"
                      :title="t('message.pages.opsScript.hostNoPermissionTooltip', { list: hostValidateResult.no_permission.map((h:any) => h.identifier).join('\n') })"
                    >
                      {{ t('message.pages.opsScript.hostNoPermissionCount', { count: hostValidateResult.no_permission.length }) }}
                    </span>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane :label="t('message.pages.opsScript.tabStrategy')" name="strategy">
                <div class="form-item">
                  <span class="label">{{ t('message.pages.opsScript.strategyExecModeLabel') }}</span>
                  <el-radio-group v-model="form.exec_mode" class="exec-mode-group">
                    <el-radio value="serial" class="exec-mode-radio">
                      <div class="exec-mode-title">{{ t('message.pages.opsScript.strategySerialTitle') }}</div>
                      <div class="exec-mode-desc">{{ t('message.pages.opsScript.strategySerialDesc') }}</div>
                    </el-radio>
                    <el-radio value="parallel" class="exec-mode-radio">
                      <div class="exec-mode-title">{{ t('message.pages.opsScript.strategyParallelTitle') }}</div>
                      <div class="exec-mode-desc">{{ t('message.pages.opsScript.strategyParallelDesc') }}</div>
                    </el-radio>
                    <el-radio :disabled="!hasFeature('OPS_PILOT_CANARY')"
                              value="pilot"
                              class="exec-mode-radio ee-gate-card"
                              :class="{ 'is-ee-gate': !hasFeature('OPS_PILOT_CANARY') }"
                              :title="!hasFeature('OPS_PILOT_CANARY') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                              @click.capture="onPilotRadioClick">
                      <div class="exec-mode-title pilot-title">
                        {{ t('message.pages.opsScript.strategyPilotTitle') }}
                        <el-tag v-if="!hasFeature('OPS_PILOT_CANARY')" size="small" type="warning" effect="plain" style="margin-left:4px;">EE</el-tag>
                      </div>
                      <div class="exec-mode-desc">{{ t('message.pages.opsScript.strategyPilotDesc') }}</div>
                    </el-radio>
                  </el-radio-group>
                </div>

                <template v-if="form.exec_mode === 'parallel'">
                  <div class="form-item">
                    <span class="label">{{ t('message.pages.opsScript.strategyConcurrentLabel') }}</span>
                    <el-input-number v-model="form.concurrent" :min="1" :max="50" />
                    <span class="form-meta" style="margin-left: 8px">{{ t('message.pages.opsScript.strategyConcurrentMeta') }}</span>
                  </div>
                </template>

                <template v-if="form.exec_mode === 'pilot'">
                  <el-divider content-position="left" style="margin: 12px 0">{{ t('message.pages.opsScript.strategyPilotDivider') }}</el-divider>
                  <div class="form-item">
                    <span class="label">{{ t('message.pages.opsScript.strategyPilotCountLabel') }}</span>
                    <el-input-number v-model="form.pilot_count" :min="1" :max="10" />
                    <span class="form-meta" style="margin-left: 8px">{{ t('message.pages.opsScript.strategyPilotCountMeta') }}</span>
                  </div>
                  <div class="form-item">
                    <span class="label">{{ t('message.pages.opsScript.strategyPilotSuccessLabel') }}</span>
                    <el-input-number v-model="form.pilot_success_rate" :min="1" :max="100" :step="10" />
                    <span class="form-meta" style="margin-left: 8px">{{ t('message.pages.opsScript.strategyPilotSuccessMeta') }}</span>
                  </div>
                  <div class="form-item" style="margin-top: 4px">
                    <span class="label">{{ t('message.pages.opsScript.strategyPilotConcurrentLabel') }}</span>
                    <el-input-number v-model="form.concurrent" :min="1" :max="50" />
                    <span class="form-meta" style="margin-left: 8px">{{ t('message.pages.opsScript.strategyPilotConcurrentMeta') }}</span>
                  </div>
                  <el-alert
                    type="success"
                    :closable="false"
                    show-icon
                    style="margin-top: 4px; margin-bottom: 12px"
                    :title="t('message.pages.opsScript.strategyPilotFlowTitle')"
                    :description="t('message.pages.opsScript.strategyPilotFlowDesc', { pilotCount: form.pilot_count, successRate: form.pilot_success_rate, concurrent: form.concurrent })"
                  />
                </template>

                <div class="form-item">
                  <span class="label">{{ t('message.pages.opsScript.strategyTimeoutLabel') }}</span>
                  <el-input-number v-model="form.timeout_seconds" :min="10" :max="3600" :step="10" />
                </div>
                <div class="form-item">
                  <span class="label">{{ t('message.pages.opsScript.strategyFailLabel') }}</span>
                  <el-select v-model="form.fail_strategy" style="width: 100%">
                    <el-option :label="t('message.pages.opsScript.strategyFailStop')" value="stop" />
                    <el-option :label="t('message.pages.opsScript.strategyFailContinue')" value="continue" />
                  </el-select>
                </div>
              </el-tab-pane>
              <el-tab-pane :label="t('message.pages.opsScript.tabParams')" name="params">
                <div class="form-item params-entry">
                  <div class="params-panel">
                    <div class="params-panel-header">
                      <div class="params-title">
                        <fs-iconify icon="ion:terminal-outline" style="margin-right: 4px" />
                        <span>{{ t('message.pages.opsScript.paramsQuickTitle') }}</span>
                      </div>
                      <el-radio-group v-model="argsQuickMode" size="small">
                        <el-radio-button value="positional">{{ t('message.pages.opsScript.paramsPositional') }}</el-radio-button>
                        <el-radio-button value="kv">{{ t('message.pages.opsScript.paramsKeyvalue') }}</el-radio-button>
                      </el-radio-group>
                    </div>

                    <el-input
                      v-if="argsQuickMode === 'positional'"
                      v-model="argsQuickPositional"
                      type="textarea"
                      :rows="4"
                      :placeholder="t('message.pages.opsScript.paramsPositionalPlaceholder')"
                      resize="vertical"
                    />

                    <div v-else class="kv-quick-grid">
                      <div
                        v-for="(row, idx) in argsQuickKv"
                        :key="idx"
                        class="kv-row"
                      >
                        <el-select v-model="row.prefix" size="small" style="width: 70px">
                          <el-option label="--" value="--" />
                          <el-option label="-" value="-" />
                          <el-option label="/" value="/" />
                          <el-option :label="t('message.pages.opsScript.scriptArgPrefixNone')" value="" />
                        </el-select>
                        <el-input
                          v-model="row.key"
                          size="small"
                          :placeholder="t('message.pages.opsScript.paramsKeyPlaceholder')"
                          style="width: 180px"
                        />
                        <span class="kv-eq">=</span>
                        <el-input
                          v-model="row.value"
                          size="small"
                          :placeholder="t('message.pages.opsScript.paramsValuePlaceholder')"
                          style="flex: 1"
                        />
                        <el-button
                          link
                          type="danger"
                          size="small"
                          @click="removeKvRow(idx)"
                          :disabled="argsQuickKv.length <= 1"
                        >
                          <fs-iconify icon="ion:close-outline" />
                        </el-button>
                      </div>
                      <el-button
                        size="small"
                        style="align-self: flex-start; margin-top: 4px"
                        @click="addKvRow"
                      >
                        <template #icon>
                          <fs-iconify icon="ion:add-outline" />
                        </template>
                        {{ t('message.pages.opsScript.paramsAddRow') }}
                      </el-button>
                    </div>

                    <div class="params-panel-footer">
                      <div class="quick-count-tip">
                        <el-tag v-if="quickArgsCount > 0" size="small" type="primary" effect="light">
                          {{ t('message.pages.opsScript.paramsIdentified', { count: quickArgsCount }) }}
                        </el-tag>
                        <span v-else style="color: #909399; font-size: 12px">{{ t('message.pages.opsScript.paramsEmpty') }}</span>
                        <el-tooltip
                          v-if="argsQuickMode === 'kv'"
                          :content="t('message.pages.opsScript.paramsSceneTip')"
                          placement="top"
                        >
                          <el-button link type="primary" size="small" style="margin-left: 6px">
                            {{ t('message.pages.opsScript.paramsSceneExplain') }}
                          </el-button>
                        </el-tooltip>
                      </div>
                      <div class="advanced-btn-wrap">
                        <ScriptArgument v-model="form.args_json" :preset-label="t('message.pages.opsScript.scriptArgPresetLabel')" />
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="form.args_json && form.args_json !== '[]'" class="form-item">
                  <el-divider content-position="left">{{ t('message.pages.opsScript.paramsDividerPreview') }}</el-divider>
                  <pre class="params-preview">{{ form.args_json }}</pre>
                </div>
              </el-tab-pane>
              <el-tab-pane :label="t('message.pages.opsScript.tabAdvanced')" name="advance">
                <div class="form-item">
                  <span class="label">{{ t('message.pages.opsScript.advancedExecParamsLabel') }}</span>
                  <div class="advanced-btns">
                    <TimoutConfig v-model="form.timeout_minutes" />
                    <Environment v-model="form.envs_json" />
                    <ExecOptions v-model="form.exec_options" />
                    <el-button
                      size="large"
                      :disabled="!hasFeature('OPS_EXECUTION_APPROVAL') || !form.need_audit"
                      :title="!hasFeature('OPS_EXECUTION_APPROVAL') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                      class="ee-gate-card"
                      :class="{ 'is-ee-gate': !hasFeature('OPS_EXECUTION_APPROVAL') }"
                      @click.capture="onAdvancedApprovalBtnClick"
                    >
                      <template #icon>
                        <fs-iconify icon="ion:people-outline" />
                      </template>
                      {{ hasFeature('OPS_EXECUTION_APPROVAL') ? t('message.pages.opsScript.advancedApprovalBtn') : t('message.pages.opsScript.advancedApprovalBtn') + ' · EE' }}
                      <el-tag
                        v-if="approvalConfigSummary && hasFeature('OPS_EXECUTION_APPROVAL')"
                        size="small"
                        type="success"
                        effect="dark"
                        round
                        style="margin-left: 6px"
                      >
                        {{ approvalConfigSummary }}
                      </el-tag>
                    </el-button>
                  </div>
                </div>
                <div v-if="form.envs_json && form.envs_json !== '[]'" class="form-item">
                  <el-divider content-position="left">{{ t('message.pages.opsScript.advancedEnvDividerPreview') }}</el-divider>
                  <pre class="params-preview">{{ form.envs_json }}</pre>
                </div>
                <div class="form-item ee-gate-card"
                     :class="{ 'is-ee-gate': !hasFeature('OPS_EXECUTION_APPROVAL') }"
                     :title="!hasFeature('OPS_EXECUTION_APPROVAL') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                     @click.capture="onAuditSwitchBlockClick">
                  <el-switch v-model="form.need_audit" :active-text="t('message.pages.opsScript.advancedAuditSwitchOn')" :disabled="!hasFeature('OPS_EXECUTION_APPROVAL')" />
                  <div class="sub-hint" v-if="form.need_audit && hasFeature('OPS_EXECUTION_APPROVAL')">
                    {{ t('message.pages.opsScript.advancedAuditHint') }}
                    <el-link
                      v-if="form.need_audit"
                      type="primary"
                      style="margin-left: 8px"
                      @click.stop="openApprovalConfig"
                    >{{ t('message.pages.opsScript.advancedAuditLink') }}</el-link>
                  </div>
                  <span v-if="!hasFeature('OPS_EXECUTION_APPROVAL')" class="ee-gate-badge-wrap" style="margin-left:12px;align-self:center;">
                    <el-tag size="small" type="warning" effect="plain">EE</el-tag>
                  </span>
                </div>
                <div class="form-item ee-gate-card"
                     :class="{ 'is-ee-gate': !hasFeature('OPS_EXECUTION_NOTIFICATION') }"
                     :title="!hasFeature('OPS_EXECUTION_NOTIFICATION') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                     @click.capture="onAutoNotifyBlockClick">
                  <el-switch v-model="form.auto_notify" :active-text="t('message.pages.opsScript.advancedAutoNotifySwitchOn')" :disabled="!hasFeature('OPS_EXECUTION_NOTIFICATION')" />
                  <span v-if="!hasFeature('OPS_EXECUTION_NOTIFICATION')" style="margin-left:12px;align-self:center;">
                    <el-tag size="small" type="warning" effect="plain">EE</el-tag>
                  </span>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>

          <!-- Log panel (aggregated by host, supports expand/collapse) -->
          <div class="log-box">
            <div class="log-toolbar">
              <span class="log-title">{{ t('message.pages.opsScript.logTitle') }}</span>
              <div class="log-btn-group">
                <el-switch v-model="autoScroll" :active-text="t('message.pages.opsScript.logAutoScrollOn')" size="small" />
                <el-button size="small" @click="clearLog">{{ t('message.pages.opsScript.logBtnClear') }}</el-button>
                <el-button size="small" @click="downloadLog">{{ t('message.pages.opsScript.logBtnDownload') }}</el-button>
                <el-button
                  size="small"
                  @click="toggleAllHostLogs(!logExpandedAll)"
                  :disabled="hostLogList.length === 0"
                  :loading="expandBatchLoading"
                >
                  {{ expandBatchLoading ? t('message.pages.opsScript.logBtnExpandLoading') : (logExpandedAll ? t('message.pages.opsScript.logBtnCollapseAll') : t('message.pages.opsScript.logBtnExpandAll')) }}
                </el-button>
                <el-button size="small" type="primary" @click="retryFailTask" v-if="hasFailTask">{{ t('message.pages.opsScript.logBtnRerunFail') }}</el-button>
              </div>
            </div>

            <!-- System-level logs -->
            <div v-if="systemLogs.length > 0" class="system-logs">
              <div
                v-for="(item, idx) in systemLogs"
                :key="'sys-' + idx"
                :class="logClass(item.level)"
                class="log-line"
              >{{ item.msg }}</div>
            </div>

            <!-- Aggregated host log list -->
            <div class="host-logs" ref="logContentRef">
              <!-- Empty state -->
              <div v-if="hostLogList.length === 0 && systemLogs.length === 0" class="log-empty">
                {{ t('message.pages.opsScript.logEmpty') }}
              </div>

              <!-- Host log item -->
              <div
                v-for="host in hostLogList"
                :key="host.hostKey"
                class="host-log-item"
              >
                <div class="host-log-header" @click="toggleHostLog(host.hostKey)">
                  <el-icon :size="14" class="expand-icon" :class="{ expanded: host.expanded }">
                    <component :is="ArrowRight" />
                  </el-icon>
                  <el-tag
                    size="small"
                    :type="hostStatusTagType(host.status)"
                    effect="dark"
                    class="host-status-tag"
                  >
                    {{ hostStatusText(host.status) }}
                  </el-tag>
                  <span class="host-name">{{ host.hostLabel }}</span>
                  <span class="host-entry-count">{{ host.entries.length }}{{ t('message.pages.opsScript.logEntriesUnit') }}</span>
                  <span v-if="host.exitCode != null" class="host-exit-code">exit: {{ host.exitCode }}</span>
                  <span class="host-time">{{ host.startedAt || '-' }}</span>
                </div>
                <div v-if="host.expanded" class="host-log-body">
                  <div
                    v-for="(entry, idx) in host.entries"
                    :key="host.hostKey + '-' + idx"
                    :class="logClass(entry.level)"
                    class="log-line"
                  >{{ entry.msg }}</div>
                  <div v-if="host.entries.length === 0" class="no-log-entries">{{ t('message.pages.opsScript.logNoEntries') }}</div>
                </div>
              </div>
            </div>

            <!-- Statistics -->
            <div class="log-stat">
              <span>{{ t('message.pages.opsScript.logStatTotal', { count: hostLogList.length }) }}</span>
              <span class="stat-success">{{ t('message.pages.opsScript.logStatSuccess', { count: stat.success }) }}</span>
              <span class="stat-fail">{{ t('message.pages.opsScript.logStatFail', { count: stat.fail }) }}</span>
              <span class="stat-pending">{{ t('message.pages.opsScript.logStatPending', { count: stat.pending }) }}</span>
            </div>
          </div>
        </div>

        <!-- Bottom action bar -->
        <div class="page-footer">
          <div class="footer-left">
            <el-button type="primary" size="large" @click="handleRun" :disabled="taskRunning" :loading="taskRunning">
              <template #icon v-if="!taskRunning"><fs-iconify icon="ion:play-circle-outline" /></template>
              {{ t('message.pages.opsScript.footerBtnRun') }}
            </el-button>
            <el-button type="danger" size="large" @click="handleStop" v-if="taskRunning">
              <template #icon><fs-iconify icon="ion:stop-circle-outline" /></template>
              {{ t('message.pages.opsScript.footerBtnStop') }}
            </el-button>
          </div>
          <div class="footer-right">
            <span class="status">{{ t('message.pages.opsScript.footerTaskStatus', { status: taskStatusText }) }}</span>
            <span class="time">{{ t('message.pages.opsScript.footerRunTime', { time: runTime }) }}</span>
            <span class="task-id">{{ t('message.pages.opsScript.footerTaskId', { id: taskId || '-' }) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Execution confirmation dialog (final user confirmation of execution config) -->
    <ExecutionConfirmDialog
      v-model="confirmRunVisible"
      :title="t('message.pages.opsScript.confirmDialogTitle')"
      :data="confirmRunDialogData"
      :confirm-text="confirmRunData?.need_audit ? t('message.pages.opsScript.confirmBtnApprove') : t('message.pages.opsScript.confirmBtnRun')"
      @confirm="confirmAndRun"
    />

    <!-- Approver configuration dialog -->
    <el-dialog
      v-model="approvalConfigDialogVisible"
      :title="t('message.pages.opsScript.approvalDialogTitle')"
      width="640px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="90px">
        <el-form-item :label="t('message.pages.opsScript.approvalModeLabel')">
          <el-radio-group v-model="tempApproval.approval_mode">
            <el-radio-button label="any">
              {{ t('message.pages.opsScript.approvalAnyLabel') }}
            </el-radio-button>
            <el-radio-button label="all">
              {{ t('message.pages.opsScript.approvalAllLabel') }}
            </el-radio-button>
          </el-radio-group>
          <div style="font-size: 12px; color: #909399; margin-top: 6px">
            {{ t('message.pages.opsScript.approvalModeHint') }}
          </div>
        </el-form-item>

        <el-form-item
          v-if="tempApproval.approval_mode === 'any' || (tempApproval.approver_ids || []).length > 0"
          :label="t('message.pages.opsScript.approvalApproverLabel')"
        >
          <UserSearch
            v-model="tempApproval.approver_ids"
            multiple
            :placeholder="t('message.pages.opsScript.approvalApproverPlaceholder')"
          />
        </el-form-item>

        <el-form-item
          v-if="tempApproval.approval_mode === 'all' || (tempApproval.countersign_ids || []).length > 0"
          :label="t('message.pages.opsScript.approvalCountersignLabel')"
        >
          <UserSearch
            v-model="tempApproval.countersign_ids"
            multiple
            :placeholder="t('message.pages.opsScript.approvalCountersignPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('message.pages.opsScript.approvalSubmitLabel')">
          <el-input
            v-model="tempApproval.submit_desc"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            :placeholder="t('message.pages.opsScript.approvalSubmitPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('message.pages.opsScript.approvalTipLabel')">
          <div style="font-size: 13px; color: #606266; line-height: 1.8">
            {{ t('message.pages.opsScript.approvalTipContent') }}
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="approvalConfigDialogVisible = false">{{ t('message.pages.opsScript.approvalCancel') }}</el-button>
        <el-button type="primary" @click="saveApprovalConfig">{{ t('message.pages.opsScript.approvalSave') }}</el-button>
      </template>
    </el-dialog>

    <!-- Execution history dialog -->
    <custom-dialog v-model="showHistory" :title="t('message.pages.opsScript.historyDialogTitle')" v-if="showHistory" :height="700">
      <template #content>
        <run-history />
      </template>
    </custom-dialog>

    <!-- Target host selection dialog -->
    <custom-dialog v-model="showTargetHosts" :title="t('message.pages.opsScript.targetHostDialogTitle')" v-if="showTargetHosts" :height="700">
      <template #content>
        <common-host-selector
          v-if="showTargetHosts"
          :height="620"
          :selected-host-ids="selectedHostIds"
          @select="onHostsSelected"
          @confirm="onHostsConfirmed"
        />
      </template>
    </custom-dialog>

    <!-- Save script dialog -->
    <el-dialog
      v-model="showSaveDialog"
      :title="saveForm.id ? t('message.pages.opsScript.saveDialogTitleUpdate') : t('message.pages.opsScript.saveDialogTitleSave')"
      width="640px"
      :close-on-click-modal="false"
      destroy-on-close
      top="8vh"
    >
      <el-form label-width="90px" :model="saveForm">
        <el-form-item :label="t('message.pages.opsScript.saveNameLabel')" required>
          <el-input v-model="saveForm.name" :placeholder="t('message.pages.opsScript.saveNamePlaceholder')" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item :label="t('message.pages.opsScript.saveCategoryLabel')">
          <el-select
            v-model="saveForm.category"
            :placeholder="t('message.pages.opsScript.saveCategoryPlaceholder')"
            style="width: 100%"
            clearable
            filterable
          >
            <el-option
              v-for="opt in categoryOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('message.pages.opsScript.saveAuthTypeLabel')">
          <el-radio-group v-model="saveForm.auth_type">
            <el-radio value="private">{{ t('message.pages.opsScript.savePrivateOption') }}</el-radio>
            <el-radio value="public">{{ t('message.pages.opsScript.savePublicOption') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('message.pages.opsScript.saveTagsLabel')">
          <el-input v-model="saveForm.tags" :placeholder="t('message.pages.opsScript.saveTagsPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('message.pages.opsScript.saveDescLabel')">
          <el-input
            v-model="saveForm.desc"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            :placeholder="t('message.pages.opsScript.saveDescPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('message.pages.opsScript.saveTypeLabel')">
          <el-tag :type="form.script_type === 'python' ? 'success' : 'primary'">
            {{ form.script_type === 'python' ? 'Python3' : 'Shell' }}
          </el-tag>
          <span class="form-meta">
            &nbsp;&nbsp;{{ t('message.pages.opsScript.saveStats', { lines: form.script_content ? form.script_content.split('\n').length : 0, chars: form.script_content?.length || 0 }) }}
          </span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showSaveDialog = false">{{ t('message.pages.opsScript.saveCancel') }}</el-button>
        <el-button type="primary" @click="handleSaveScript">
          {{ saveForm.id ? t('message.pages.opsScript.saveUpdate') : t('message.pages.opsScript.saveSave') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Create/Edit/View script large dialog (consistent with script library management) -->
    <el-dialog
      v-model="createDialogVisible"
      :title="createViewMode ? t('message.pages.opsScript.createDialogTitleView') : (createIsEditMode ? t('message.pages.opsScript.createDialogTitleEdit') : t('message.pages.opsScript.createDialogTitleNew'))"
      width="90%"
      top="4vh"
      destroy-on-close
    >
      <el-tabs v-model="createActiveTab" type="border-card">
        <el-tab-pane :label="t('message.pages.opsScript.createTabBasic')" name="base">
          <el-form :model="createScriptForm" label-width="120px" size="small">
            <el-form-item :label="t('message.pages.opsScript.createNameLabel')" required>
              <el-input v-model="createScriptForm.name" :placeholder="t('message.pages.opsScript.createNamePlaceholder')" :disabled="createViewMode" />
            </el-form-item>
            <el-form-item :label="t('message.pages.opsScript.createTypeLabel')" required>
              <el-select v-model="createScriptForm.type" :placeholder="t('message.pages.opsScript.createTypePlaceholder')" style="width: 100%" :disabled="createViewMode">
                <el-option label="Shell" value="Shell" />
                <el-option label="Python3" value="Python3" />
                <el-option label="PowerShell" value="PowerShell" />
                <el-option label="Bat" value="Bat" />
                <el-option label="SQL" value="SQL" />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('message.pages.opsScript.createCategoryLabel')" required>
              <el-tag v-if="createViewMode" effect="plain" type="warning">
                <el-icon style="margin-right: 4px"><Folder /></el-icon>
                {{ createFormCategoryLabel }}
              </el-tag>
              <el-tree-select
                v-else
                v-model="createScriptForm.category"
                :data="createCategoryTreeOptions"
                :props="{ label: 'label', value: 'value', children: 'children' }"
                clearable
                :placeholder="t('message.pages.opsScript.createCategoryPlaceholder')"
                style="width: 100%"
                check-strictly
                :render-after-expand="false"
              />
            </el-form-item>
            <el-form-item :label="t('message.pages.opsScript.createAuthLabel')">
              <el-radio-group v-model="createScriptForm.authType" :disabled="createViewMode">
                <el-radio value="private">{{ t('message.pages.opsScript.createAuthPrivate') }}</el-radio>
                <el-radio value="public">{{ t('message.pages.opsScript.createAuthPublic') }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item :label="t('message.pages.opsScript.createTagsLabel')">
              <el-input v-model="createScriptForm.tags" :placeholder="t('message.pages.opsScript.createTagsPlaceholder')" :disabled="createViewMode" />
            </el-form-item>
            <el-form-item :label="t('message.pages.opsScript.createDescLabel')">
              <el-input
                v-model="createScriptForm.desc"
                type="textarea"
                :rows="4"
                :placeholder="t('message.pages.opsScript.createDescPlaceholder')"
                :disabled="createViewMode"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane :label="t('message.pages.opsScript.createTabContent')" name="content">
          <div v-if="!createViewMode" class="editor-toolbar">
            <el-button size="small" @click="formatCodeCreate">{{ t('message.pages.opsScript.createBtnFormat') }}</el-button>
            <el-button size="small" :loading="createRiskChecking" @click="checkRiskCodeCreate">{{ t('message.pages.opsScript.createBtnRiskCheck') }}</el-button>
            <el-button size="small" @click="uploadScriptFileCreate">{{ t('message.pages.opsScript.createBtnImport') }}</el-button>
            <el-button size="small" @click="clearEditorCreate">{{ t('message.pages.opsScript.createBtnClear') }}</el-button>
          </div>
          <div ref="createScriptEditorRef" class="ace-editor-box create-monaco-editor"></div>
          <input
            ref="createFileInputRef"
            type="file"
            style="display: none"
            accept=".sh,.py,.ps1,.bat,.sql,.txt,.conf,.yaml,.yml,.json"
            @change="handleFileUploadCreate"
          />
        </el-tab-pane>

        <!-- Risk check result dialog (standalone within create dialog) -->
        <el-dialog v-model="createRiskCheckVisible" :title="t('message.pages.opsScript.riskDialogTitle')" width="620px" :close-on-click-modal="true">
          <div class="risk-check-result">
            <div :class="['risk-summary', createRiskCheckResult.risk_level]">
              <div class="risk-level">
                <el-icon v-if="createRiskCheckResult.risk_level === 'high'" size="32" color="#f56c6c"><WarningFilled /></el-icon>
                <el-icon v-else-if="createRiskCheckResult.risk_level === 'medium'" size="32" color="#e6a23c"><Warning /></el-icon>
                <el-icon v-else size="32" color="#67c23a"><CircleCheck /></el-icon>
                <span class="level-text">{{ createRiskCheckResult.risk_level_display }}</span>
              </div>
              <div class="risk-stats">
                <div class="stat-item">
                  <span class="num error">{{ createRiskCheckResult.error_count || 0 }}</span>
                  <span class="label">{{ t('message.pages.opsScript.riskLevelError') }}</span>
                </div>
                <div class="stat-item">
                  <span class="num warning">{{ createRiskCheckResult.warning_count || 0 }}</span>
                  <span class="label">{{ t('message.pages.opsScript.riskLevelWarning') }}</span>
                </div>
                <div class="stat-item">
                  <span class="num info">{{ createRiskCheckResult.info_count || 0 }}</span>
                  <span class="label">{{ t('message.pages.opsScript.riskLevelInfo') }}</span>
                </div>
              </div>
            </div>
            <div class="tools-info" v-if="createRiskCheckResult.tools_used && createRiskCheckResult.tools_used.length > 0">
              <span class="tools-label">{{ t('message.pages.opsScript.riskToolsLabel') }}</span>
              <el-tag v-for="tool in createRiskCheckResult.tools_used" :key="tool" size="small" type="info" effect="plain">
                {{ tool }}
              </el-tag>
            </div>
            <div v-if="createRiskCheckResult.issues && createRiskCheckResult.issues.length > 0" class="issues-list">
              <div class="list-title">{{ t('message.pages.opsScript.riskIssuesTitle', { count: createRiskCheckResult.issues.length }) }}</div>
              <div v-for="(issue, index) in createRiskCheckResult.issues" :key="index" :class="['issue-item', issue.severity]">
                <div class="issue-header">
                  <el-tag :type="issue.severity === 'error' ? 'danger' : issue.severity === 'warning' ? 'warning' : 'info'" size="small" effect="dark">
                    {{ issue.severity_display }}
                  </el-tag>
                  <span class="issue-rule" v-if="issue.rule_id">{{ issue.rule_id }}</span>
                  <span class="issue-line" v-if="issue.line">{{ t('message.pages.opsScript.riskLinePrefix', { line: issue.line }) }}</span>
                  <el-tag size="small" type="info" effect="plain" class="issue-tool">
                    {{ issue.tool }}
                  </el-tag>
                </div>
                <div class="issue-message">{{ issue.message }}</div>
                <div class="issue-fix" v-if="issue.fix_suggestion">
                  <el-icon><Tools /></el-icon>
                  <span>{{ issue.fix_suggestion }}</span>
                </div>
              </div>
            </div>
            <div v-else class="no-risk-tip">
              <el-icon color="#67c23a" size="24"><CircleCheck /></el-icon>
              <span>{{ t('message.pages.opsScript.riskNoRisk') }}</span>
            </div>
          </div>
          <template #footer>
            <el-button type="primary" @click="createRiskCheckVisible = false">{{ t('message.pages.opsScript.riskConfirm') }}</el-button>
          </template>
        </el-dialog>

        <el-tab-pane :label="t('message.pages.opsScript.createTabParams')" name="params">
          <el-table :data="createScriptParamList" border size="small">
            <el-table-column prop="key" :label="t('message.pages.opsScript.createParamKeyCol')" width="140">
              <template #default="{ row }">
                <el-input v-model="row.key" size="small" :placeholder="t('message.pages.opsScript.createParamKeyPlaceholder')" :disabled="createViewMode" />
              </template>
            </el-table-column>
            <el-table-column prop="value" :label="t('message.pages.opsScript.createParamValueCol')">
              <template #default="{ row }">
                <el-input v-model="row.value" size="small" :placeholder="t('message.pages.opsScript.createParamValuePlaceholder')" :disabled="createViewMode" />
              </template>
            </el-table-column>
            <el-table-column prop="desc" :label="t('message.pages.opsScript.createParamDescCol')">
              <template #default="{ row }">
                <el-input v-model="row.desc" size="small" :placeholder="t('message.pages.opsScript.createParamDescPlaceholder')" :disabled="createViewMode" />
              </template>
            </el-table-column>
            <el-table-column v-if="!createViewMode" :label="t('message.pages.opsScript.createParamActionCol')" width="70">
              <template #default="{ $index }">
                <el-button size="small" type="danger" link @click="createScriptParamList.splice($index, 1)">
                  {{ t('message.pages.opsScript.createParamDelete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button v-if="!createViewMode" size="small" style="margin-top: 10px" @click="createScriptParamList.push({ key: '', value: '', desc: '' })">
            {{ t('message.pages.opsScript.createParamAdd') }}
          </el-button>
        </el-tab-pane>
        <el-tab-pane :label="t('message.pages.opsScript.createTabEnvs')" name="envs">
          <el-table :data="createScriptEnvList" border size="small">
            <el-table-column prop="key" :label="t('message.pages.opsScript.createEnvKeyCol')" width="180">
              <template #default="{ row }">
                <el-input v-model="row.key" size="small" :placeholder="t('message.pages.opsScript.createEnvKeyPlaceholder')" :disabled="createViewMode" />
              </template>
            </el-table-column>
            <el-table-column prop="value" :label="t('message.pages.opsScript.createEnvValueCol')">
              <template #default="{ row }">
                <el-input v-model="row.value" size="small" :placeholder="t('message.pages.opsScript.createEnvValuePlaceholder')" :disabled="createViewMode" />
              </template>
            </el-table-column>
            <el-table-column prop="desc" :label="t('message.pages.opsScript.createEnvDescCol')">
              <template #default="{ row }">
                <el-input v-model="row.desc" size="small" :placeholder="t('message.pages.opsScript.createEnvDescPlaceholder')" :disabled="createViewMode" />
              </template>
            </el-table-column>
            <el-table-column v-if="!createViewMode" :label="t('message.pages.opsScript.createEnvActionCol')" width="70">
              <template #default="{ $index }">
                <el-button size="small" type="danger" link @click="createScriptEnvList.splice($index, 1)">
                  {{ t('message.pages.opsScript.createEnvDelete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button v-if="!createViewMode" size="small" style="margin-top: 10px" @click="createScriptEnvList.push({ key: '', value: '', desc: '' })">
            {{ t('message.pages.opsScript.createEnvAdd') }}
          </el-button>
        </el-tab-pane>
        <el-tab-pane :label="t('message.pages.opsScript.createTabAdvanced')" name="advance">
          <el-form :model="createScriptForm" label-width="140px" size="small">
            <el-form-item :label="t('message.pages.opsScript.createConcurrentLabel')">
              <el-input-number v-model="createScriptForm.concurrent" :min="1" :max="50" :disabled="createViewMode" />
            </el-form-item>
            <el-form-item :label="t('message.pages.opsScript.createTimeoutLabel')">
              <el-input-number v-model="createScriptForm.timeout" :min="10" :max="3600" :disabled="createViewMode" />
            </el-form-item>
            <el-form-item :label="t('message.pages.opsScript.createFailStrategyLabel')">
              <el-select v-model="createScriptForm.failStrategy" style="width: 100%" :disabled="createViewMode">
                <el-option :label="t('message.pages.opsScript.strategyFailStop')" value="stop" />
                <el-option :label="t('message.pages.opsScript.strategyFailContinue')" value="continue" />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('message.pages.opsScript.createLogRetentionLabel')">
              <el-input-number v-model="createScriptForm.logRetention" :min="7" :max="36500" :disabled="createViewMode" />
            </el-form-item>
            <el-form-item :label="t('message.pages.opsScript.createRiskCheckLabel')">
              <el-switch v-model="createScriptForm.openRiskCheck" :disabled="createViewMode" />
            </el-form-item>
            <el-form-item :label="t('message.pages.opsScript.createNeedAuditLabel')">
              <el-switch v-model="createScriptForm.needAudit" :disabled="createViewMode" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="createDialogVisible = false">{{ createViewMode ? t('message.pages.opsScript.createClose') : t('message.pages.opsScript.createCancel') }}</el-button>
        <el-button v-if="!createViewMode" type="primary" @click="saveScriptInDialog">{{ t('message.pages.opsScript.createSave') }}</el-button>
      </template>
    </el-dialog>

    <!-- Script preview / confirm load dialog -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="t('message.pages.opsScript.previewDialogTitle')"
      width="960px"
      class="script-preview-dialog"
      :close-on-click-modal="false"
      @closed="closePreviewDialog"
      top="6vh"
    >
      <div v-loading="previewLoading" style="min-height: 300px">
        <template v-if="previewingScript">
          <el-tabs v-model="previewTab" type="border-card">
            <!-- 1. Basic info -->
            <el-tab-pane :label="t('message.pages.opsScript.previewTabBasic')" name="basic">
              <el-form
                label-width="110px"
                label-position="right"
                style="padding: 4px 8px"
              >
                <el-form-item :label="t('message.pages.opsScript.createNameLabel')">
                  <el-input v-model="previewingScript.name" readonly disabled />
                </el-form-item>
                <el-form-item :label="t('message.pages.opsScript.createTypeLabel')">
                  <el-tag :type="previewScriptLang === 'python' ? 'success' : 'primary'">
                    {{ previewingScript.script_type || '-' }}
                  </el-tag>
                  <span class="form-meta" style="margin-left: 12px; color: #909399">
                    &nbsp;{{ t('message.pages.opsScript.previewStats', { lines: previewLineCount, chars: previewCharCount }) }}
                  </span>
                </el-form-item>
                <el-form-item :label="t('message.pages.opsScript.createCategoryLabel')">
                  <el-tag effect="plain" type="warning">
                    <fs-iconify icon="ion:folder-outline" style="margin-right: 4px" />
                    {{ previewCategoryLabel }}
                  </el-tag>
                </el-form-item>
                <el-form-item :label="t('message.pages.opsScript.createAuthLabel')">
                  <el-radio-group :model-value="previewingScript.auth_type" disabled>
                    <el-radio value="private">{{ t('message.pages.opsScript.createAuthPrivate') }}</el-radio>
                    <el-radio value="public">{{ t('message.pages.opsScript.createAuthPublic') }}</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item :label="t('message.pages.opsScript.createTagsLabel')">
                  <el-input
                    :model-value="previewingScript.tags"
                    readonly
                    disabled
                    :placeholder="t('message.pages.opsScript.previewNoTags')"
                  />
                </el-form-item>
                <el-form-item :label="t('message.pages.opsScript.createDescLabel')">
                  <el-input
                    :model-value="previewingScript.desc"
                    type="textarea"
                    :rows="4"
                    readonly
                    disabled
                    :placeholder="t('message.pages.opsScript.previewNoDesc')"
                    maxlength="500"
                    show-word-limit
                  />
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- 2. Script content -->
            <el-tab-pane :label="t('message.pages.opsScript.previewTabContent')" name="content">
              <div style="padding: 4px 2px">
                <v-ace-editor
                  :value="previewingScript.content || ''"
                  :lang="previewScriptLang"
                  :theme="form.editor_theme"
                  :options="{
                    ...editorOptions,
                    readOnly: true,
                    showPrintMargin: false,
                    highlightActiveLine: false,
                  }"
                  style="height: 340px; width: 100%; border: 1px solid #ebeef5; border-radius: 4px"
                />
                <div class="preview-content-footer">
                  <el-tag size="small" effect="plain" type="info">
                    {{ previewingScript.script_type }}
                  </el-tag>
                  <span style="margin-left: auto; color: #909399; font-size: 12px">
                    {{ t('message.pages.opsScript.previewStats', { lines: previewLineCount, chars: previewCharCount }) }}
                  </span>
                </div>
              </div>
            </el-tab-pane>

            <!-- 3. Custom parameters -->
            <el-tab-pane :label="t('message.pages.opsScript.previewTabParams')" name="params">
              <div style="padding: 4px 8px">
                <v-ace-editor
                  :value="
                    previewingScript.script_params
                      ? JSON.stringify(previewingScript.script_params, null, 2)
                      : '[]'
                  "
                  lang="json"
                  :theme="form.editor_theme"
                  :options="{
                    ...editorOptions,
                    readOnly: true,
                    showPrintMargin: false,
                    tabSize: 2,
                  }"
                  style="height: 300px; width: 100%; border: 1px solid #ebeef5; border-radius: 4px"
                />
              </div>
            </el-tab-pane>

            <!-- 4. Environment variables -->
            <el-tab-pane :label="t('message.pages.opsScript.previewTabEnvs')" name="envs">
              <div style="padding: 4px 8px">
                <v-ace-editor
                  :value="
                    previewingScript.script_envs
                      ? JSON.stringify(previewingScript.script_envs, null, 2)
                      : '[]'
                  "
                  lang="json"
                  :theme="form.editor_theme"
                  :options="{
                    ...editorOptions,
                    readOnly: true,
                    showPrintMargin: false,
                    tabSize: 2,
                  }"
                  style="height: 300px; width: 100%; border: 1px solid #ebeef5; border-radius: 4px"
                />
              </div>
            </el-tab-pane>

            <!-- 5. Advanced security config -->
            <el-tab-pane :label="t('message.pages.opsScript.previewTabAdvanced')" name="advanced">
              <el-form label-width="200px" label-position="right" style="padding: 4px 8px">
                <el-form-item :label="t('message.pages.opsScript.previewModeLabel')">
                  <el-tag :type="
                    previewingScript.exec_mode === 'serial' ? 'warning' :
                    previewingScript.exec_mode === 'pilot' ? 'danger' : 'success'
                  ">
                    {{ ({ serial: t('message.pages.opsScript.previewSerial'), parallel: t('message.pages.opsScript.previewParallel'), pilot: t('message.pages.opsScript.previewPilot') } as any)[
                      previewingScript.exec_mode || 'parallel'
                    ] || t('message.pages.opsScript.previewParallel') }}
                  </el-tag>
                  <span v-if="previewingScript.exec_mode === 'pilot'" style="margin-left: 12px; color: #909399">
                    {{ t('message.pages.opsScript.previewPilotInfo', { count: previewingScript.pilot_count ?? 2, successRate: previewingScript.pilot_success_rate ?? 100 }) }}
                  </span>
                </el-form-item>
                <el-form-item :label="t('message.pages.opsScript.previewConcurrencyLabel')">
                  {{ previewingScript.concurrent ?? '-' }} {{ t('message.pages.opsScript.previewHostUnit') }}
                </el-form-item>
                <el-form-item :label="t('message.pages.opsScript.previewFailLabel')">
                  <el-tag type="info" effect="plain">
                    {{ previewingScript.fail_strategy === 'stop' ? t('message.pages.opsScript.previewFailStop') : t('message.pages.opsScript.previewFailContinue') }}
                  </el-tag>
                </el-form-item>
                <el-form-item :label="t('message.pages.opsScript.previewTimeoutLabel')">
                  {{ previewingScript.timeout ?? '-' }}{{ t('message.pages.opsScript.previewSecUnit') }}
                  <span style="margin-left: 12px; color: #909399">
                    ≈ {{ Math.ceil((previewingScript.timeout ?? 0) / 60) }}{{ t('message.pages.opsScript.previewMinUnit') }}
                  </span>
                </el-form-item>
                <el-form-item :label="t('message.pages.opsScript.previewApprovalLabel')">
                  <el-tag :type="previewingScript.need_audit ? 'danger' : 'success'" effect="plain">
                    {{ previewingScript.need_audit ? t('message.pages.opsScript.previewNeedApproval') : t('message.pages.opsScript.previewNoApproval') }}
                  </el-tag>
                </el-form-item>
                <el-divider content-position="left" style="margin: 8px 0">{{ t('message.pages.opsScript.previewExecEnv') }}</el-divider>
                <el-form-item :label="t('message.pages.opsScript.execWorkdirLabel')">
                  <code style="color: #606266">
                    {{ (previewingScript.exec_options?.working_directory) || previewingScript.working_directory || t('message.pages.opsScript.previewDefaultDir') }}
                  </code>
                </el-form-item>
                <el-form-item :label="t('message.pages.opsScript.execLoadProfileLabel')">
                  {{
                    (previewingScript.exec_options?.load_profile ?? previewingScript.load_profile) === 'true' ||
                    (previewingScript.exec_options?.load_profile ?? previewingScript.load_profile) === true
                      ? t('message.pages.opsScript.previewLoadProfile')
                      : t('message.pages.opsScript.execLoadClean')
                  }}
                </el-form-item>
                <el-form-item :label="t('message.pages.opsScript.execMergeLabel')">
                  {{
                    !!(previewingScript.exec_options?.merge_streams ?? previewingScript.merge_streams)
                      ? t('message.pages.opsScript.previewMergeYes')
                      : t('message.pages.opsScript.previewMergeNo')
                  }}
                </el-form-item>
                <el-form-item :label="t('message.pages.opsScript.execPrivilegedLabel')">
                  <el-tag :type="
                    !!(previewingScript.exec_options?.privileged ?? previewingScript.privileged)
                      ? 'danger' : 'info'
                  " effect="plain">
                    {{
                      !!(previewingScript.exec_options?.privileged ?? previewingScript.privileged)
                        ? t('message.pages.opsScript.previewPrivilegedYes')
                        : t('message.pages.opsScript.previewPrivilegedNo')
                    }}
                  </el-tag>
                </el-form-item>
                <el-form-item :label="t('message.pages.opsScript.previewSwitchUser')">
                  <code style="color: #606266">
                    {{ (previewingScript.exec_options?.su_user) || previewingScript.su_user || t('message.pages.opsScript.previewNoSwitchUser') }}
                  </code>
                </el-form-item>
                <el-form-item :label="t('message.pages.opsScript.previewEncoding')">
                  {{ previewingScript.encoding || (previewingScript.exec_options?.encoding) || 'UTF-8' }}
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </template>
        <el-empty
          v-else-if="!previewLoading"
          :description="t('message.pages.opsScript.previewEmptyDesc')"
          :image-size="80"
        />
      </div>

      <template #footer>
        <el-button @click="closePreviewDialog">{{ t('message.pages.opsScript.createClose') }}</el-button>
        <el-button
          type="primary"
          :disabled="!previewingScript"
          :loading="previewLoading"
          @click="confirmLoadScript"
        >
          <fs-iconify icon="ion:copy-outline" style="margin-right: 4px" />
          {{ t('message.pages.opsScript.previewLoadToEditor') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Risk check result dialog -->
    <el-dialog v-model="riskCheckVisible" :title="t('message.pages.opsScript.riskDialogTitle')" width="620px" :close-on-click-modal="true">
      <div class="risk-check-result">
        <div :class="['risk-summary', riskCheckResult.risk_level]">
          <div class="risk-level">
            <el-icon v-if="riskCheckResult.risk_level === 'high'" size="32" color="#f56c6c"><WarningFilled /></el-icon>
            <el-icon v-else-if="riskCheckResult.risk_level === 'medium'" size="32" color="#e6a23c"><Warning /></el-icon>
            <el-icon v-else size="32" color="#67c23a"><CircleCheck /></el-icon>
            <span class="level-text">{{ riskCheckResult.risk_level_display }}</span>
          </div>
          <div class="risk-stats">
            <div class="stat-item">
              <span class="num error">{{ riskCheckResult.error_count || 0 }}</span>
              <span class="label">{{ t('message.pages.opsScript.riskLevelError') }}</span>
            </div>
            <div class="stat-item">
              <span class="num warning">{{ riskCheckResult.warning_count || 0 }}</span>
              <span class="label">{{ t('message.pages.opsScript.riskLevelWarning') }}</span>
            </div>
            <div class="stat-item">
              <span class="num info">{{ riskCheckResult.info_count || 0 }}</span>
              <span class="label">{{ t('message.pages.opsScript.riskLevelInfo') }}</span>
            </div>
          </div>
        </div>

        <div class="tools-info" v-if="riskCheckResult.tools_used && riskCheckResult.tools_used.length > 0">
          <span class="tools-label">{{ t('message.pages.opsScript.riskToolsLabel') }}</span>
          <el-tag v-for="tool in riskCheckResult.tools_used" :key="tool" size="small" type="info" effect="plain">
            {{ tool }}
          </el-tag>
        </div>

        <div v-if="riskCheckResult.issues && riskCheckResult.issues.length > 0" class="issues-list">
          <div class="list-title">{{ t('message.pages.opsScript.riskIssuesTitle', { count: riskCheckResult.issues.length }) }}</div>
          <div v-for="(issue, index) in riskCheckResult.issues" :key="index" :class="['issue-item', issue.severity]">
            <div class="issue-header">
              <el-tag :type="issue.severity === 'error' ? 'danger' : issue.severity === 'warning' ? 'warning' : 'info'" size="small" effect="dark">
                {{ issue.severity_display }}
              </el-tag>
              <span class="issue-rule" v-if="issue.rule_id">{{ issue.rule_id }}</span>
              <span class="issue-line" v-if="issue.line">{{ t('message.pages.opsScript.riskLinePrefix', { line: issue.line }) }}</span>
              <el-tag size="small" type="info" effect="plain" class="issue-tool">
                {{ issue.tool }}
              </el-tag>
            </div>
            <div class="issue-message">{{ issue.message }}</div>
            <div class="issue-fix" v-if="issue.fix_suggestion">
              <el-icon><Tools /></el-icon>
              <span>{{ issue.fix_suggestion }}</span>
            </div>
          </div>
        </div>

        <div v-else class="no-risk-tip">
          <el-icon color="#67c23a" size="24"><CircleCheck /></el-icon>
          <span>{{ t('message.pages.opsScript.riskNoRisk') }}</span>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="riskCheckVisible = false">{{ t('message.pages.opsScript.riskConfirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Share management dialog -->
    <ShareManageDialog
      v-model="shareManageVisible"
      resource-type="script"
      :resource-id="currentShareScript?.id"
      :resource-name="currentShareScript?.name"
    />
  </div>
</template>

<script setup lang="ts" name="TaskScript">
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useEditionStore } from '/@/editions';
const { t } = useI18n();
const editionStore = useEditionStore();
const hasFeature = (code: string) => editionStore.hasFeature(code);

// ---------- EE 升级拦截通用 helpers ----------
const eeT = (key: string, fallback: string) => {
	try {
		const v = t(`message.pages.edition.${key}`);
		if (typeof v === 'string' && v && v !== `message.pages.edition.${key}`) return v;
	} catch (_e) { /* noop */ }
	return fallback;
};
const triggerEeUpgrade = (code: string, customDesc?: string) => {
	ElMessageBox.confirm(
		customDesc || eeT('enterpriseOnlyDesc', '该功能仅在 Taurus Ops 企业版中提供。升级到企业版即可解锁灰度执行、审批流、通知等全部高级能力。'),
		eeT('enterpriseOnlyTitle', '企业版专属功能'),
		{ confirmButtonText: eeT('upgradeAction', '立即升级'), cancelButtonText: eeT('dismiss', '稍后再说'), type: 'info', showCancelButton: true, closeOnClickModal: true }
	).then(() => window.dispatchEvent(new CustomEvent('taurus:edition-upgrade', { detail: { code } }))).catch(() => {});
};
const onPilotRadioClick = (e?: MouseEvent) => {
	if (hasFeature('OPS_PILOT_CANARY')) return;
	if (e) e.stopPropagation();
	triggerEeUpgrade('OPS_PILOT_CANARY');
};

// ---------- 更多 EE gate 元素 handlers ----------
const onRiskCheckBtnClick = (e?: MouseEvent) => {
  if (hasFeature('SCRIPT_SECURITY_CHECK')) { checkRiskCode(); return; }
  if (e) e.stopPropagation();
  triggerEeUpgrade('SCRIPT_SECURITY_CHECK');
};
const onAdvancedApprovalBtnClick = (e?: MouseEvent) => {
  if (hasFeature('OPS_EXECUTION_APPROVAL')) { openApprovalConfig(); return; }
  if (e) e.stopPropagation();
  triggerEeUpgrade('OPS_EXECUTION_APPROVAL');
};
const onAuditSwitchBlockClick = (e?: MouseEvent) => {
  if (hasFeature('OPS_EXECUTION_APPROVAL')) return;
  if (e) e.stopPropagation();
  triggerEeUpgrade('OPS_EXECUTION_APPROVAL');
};
const onAutoNotifyBlockClick = (e?: MouseEvent) => {
  if (hasFeature('OPS_EXECUTION_NOTIFICATION')) return;
  if (e) e.stopPropagation();
  triggerEeUpgrade('OPS_EXECUTION_NOTIFICATION');
};
const onShareBlockClick = (e?: MouseEvent) => {
  if (hasFeature('SCRIPT_SHARING')) return;
  if (e) e.stopPropagation();
  triggerEeUpgrade('SCRIPT_SHARING');
};

import CustomDialog from '/@/components/customDialog/index.vue';
import UserSearch from '/@/components/UserSearch/index.vue';
import CommonHostSelector from '../components/CommonHostSelector.vue';
import RunHistory from './components/RunHistory/index.vue';
import ScriptArgument from './components/ScriptArgument/index.vue';
import Environment from './components/Environment/index.vue';
import TimoutConfig from './components/TimoutConfig/index.vue';
import ExecOptions from './components/ExecOptions/index.vue';
import ExecutionConfirmDialog from '../components/ExecutionConfirmDialog.vue';
import ShareManageDialog from '/@/views/taurus/components/ShareManageDialog.vue';
import { VAceEditor } from 'vue3-ace-editor';
import { Plus, CircleCheck, Delete, Warning, WarningFilled, Tools, Folder, ArrowRight, Share } from '@element-plus/icons-vue';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// @ts-ignore
self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') return new jsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    return new editorWorker();
  },
};
import * as hostApi from '/@/api/taurus/host/api';
import { request } from '/@/utils/service';
import { Session } from '/@/utils/storage';
import {
  executeScript,
  terminateCommand,
  getScriptList,
  getScriptDetail,
  createScript,
  updateScript,
  getScriptCategories,
  getOpsWebSocketUrl,
  type OpsWsMessage,
} from '/@/api/taurus/ops/index';
import { submitScriptApproval } from '/@/api/taurus/execution-approval/api';
import * as categoryApi from '/@/api/taurus/script-library/category';
import * as scriptLibraryApi from '/@/api/taurus/script-library/api';

import 'ace-builds/src-noconflict/theme-github_light_default';
import 'ace-builds/src-noconflict/theme-github_dark';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/snippets/python';
import 'ace-builds/src-noconflict/mode-sh';
import 'ace-builds/src-noconflict/snippets/sh';
import { getShareResourceDetail } from '/@/api/taurus/share-permission/index';

const route = useRoute();
const router = useRouter();

let timer: number | null = null;
let wsConnections: Record<string, WebSocket> = {};
let currentBatchId = '';
const executionHostMap: Record<string, string> = {};

const activeTab = ref('host');
const hostSelectType = ref('group');
const taskRunning = ref(false);
// Execution confirmation dialog
const confirmRunVisible = ref(false);
const confirmRunData = ref<any>(null);

const confirmRunDialogData = computed(() => {
  const d = confirmRunData.value;
  if (!d) return null;
  return {
    content: {
      label: t('message.pages.opsScript.confirmScriptName'),
      name: d.script_name || t('message.pages.opsScript.confirmUnsavedScript'),
      display: d.script_type_display,
      lines: d.content_lines,
      chars: d.content_chars,
    },
    hosts: d.hosts,
    strategy: {
      execMode: d.exec_mode,
      execModeDisplay: d.exec_mode_display,
      execModeTagType: d.exec_mode_tag_type,
      concurrent: d.concurrent,
      pilotCount: d.pilot_count,
      pilotSuccessRate: d.pilot_success_rate,
      timeoutSeconds: d.timeout_seconds,
      failStrategyDisplay: d.fail_strategy_display,
      needAudit: d.need_audit,
    },
    args: d.args,
    argsPreview: d.args_preview,
    envsCount: d.envs_count,
    envsPreview: d.envs_preview,
    approvalNotify: d.approval_notify_detailed,
    approvalDetailed: d.approval_detailed,
    execOptions: d.exec_options_detailed,
    isRisky: d.is_risky,
    tip: t('message.pages.opsScript.confirmTip'),
  };
});
// Temporary storage: keep original params (targetHosts/args/environment) unchanged between confirm dialog open and user confirmation
let _pendingRunContext: {
  hosts: any[];
  args: string[];
  environment: Record<string, string>;
} | null = null;
const autoScroll = ref(true);
const hasFailTask = ref(false);
const hostFileInputRef = ref<HTMLInputElement | null>(null);
const hostValidateLoading = ref(false);
const hostCleanInvalidLoading = ref(false);
const hostValidateResult = reactive<{
  valid: hostApi.ValidateHostsResult['valid'];
  not_found: string[];
  no_permission: hostApi.ValidateHostsResult['no_permission'];
}>({
  valid: [],
  not_found: [],
  no_permission: [],
});
let hostValidatedSnapshot = '';
const runTime = ref(0);
const taskId = ref('');
// Log data structure: aggregated by host
interface HostLogEntry {
  level: string;
  msg: string;
  time: string;
}
interface HostLog {
  hostKey: string;       // Host identifier
  hostLabel: string;     // Display name
  status: 'pending' | 'running' | 'success' | 'error' | 'terminated';
  entries: HostLogEntry[];
  expanded: boolean;
  startedAt?: string;
  finishedAt?: string;
  exitCode?: number;
}
interface SystemLog {
  level: string;
  msg: string;
  time: string;
}
const logList = ref<HostLogEntry[]>([]);        // Kept for export and backward compatibility
const hostLogs = ref<Map<string, HostLog>>(new Map());  // Aggregated by host
const systemLogs = ref<SystemLog[]>([]);         // System-level logs
const paramList = ref<Array<{ key: string; value: string; desc: string }>>([]);
const logContentRef = ref<HTMLElement | null>(null);
const logExpandedAll = ref(true);               // Host logs default expand/collapse
const expandBatchLoading = ref(false);          // Batch expand in progress
const showTargetHosts = ref(false);
const showHistory = ref(false);
const showSaveDialog = ref(false);
const loadingScript = ref(false);
const treeLoading = ref(false);

// Sorted host log list (descending by start time)
const hostLogList = computed(() => {
  return Array.from(hostLogs.value.values()).sort((a, b) => {
    const ta = a.startedAt ? new Date(a.startedAt).getTime() : 0;
    const tb = b.startedAt ? new Date(b.startedAt).getTime() : 0;
    return tb - ta;
  });
});

// ======================== Sidebar: collapse + drag-to-resize ========================
const sidebarCollapsed = ref(false);
const sidebarWidth = ref(240);
const lastSidebarWidth = ref(240);
const SIDEBAR_MIN = 220;
const SIDEBAR_MAX = 520;
const SIDEBAR_COLLAPSED = 44; // Keep a narrow edge with expand button when collapsed

function toggleSidebar() {
  if (sidebarCollapsed.value) {
    // Expand: restore previous width (fallback to minimum if below)
    sidebarCollapsed.value = false;
    sidebarWidth.value = lastSidebarWidth.value >= SIDEBAR_MIN ? lastSidebarWidth.value : 240;
  } else {
    // Collapse: remember current valid width, then shrink to narrow edge
    if (sidebarWidth.value >= SIDEBAR_MIN) lastSidebarWidth.value = sidebarWidth.value;
    sidebarCollapsed.value = true;
    sidebarWidth.value = SIDEBAR_COLLAPSED;
  }
}

// Sidebar drag-to-resize
let _resizeStartX = 0;
let _resizeStartWidth = 0;
let _resizeOnMove: ((ev: MouseEvent) => void) | null = null;
let _resizeOnUp: ((ev: MouseEvent) => void) | null = null;

function startSidebarResize(ev: MouseEvent) {
  if (sidebarCollapsed.value) return; // Dragging not allowed when collapsed
  ev.preventDefault();
  ev.stopPropagation();
  _resizeStartX = ev.clientX;
  _resizeStartWidth = sidebarWidth.value;
  _resizeOnMove = (e: MouseEvent) => {
    const delta = e.clientX - _resizeStartX;
    const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, _resizeStartWidth + delta));
    sidebarWidth.value = next;
    lastSidebarWidth.value = next;
  };
  _resizeOnUp = () => {
    if (_resizeOnMove) document.removeEventListener('mousemove', _resizeOnMove);
    if (_resizeOnUp) document.removeEventListener('mouseup', _resizeOnUp);
    _resizeOnMove = null;
    _resizeOnUp = null;
  };
  document.addEventListener('mousemove', _resizeOnMove);
  document.addEventListener('mouseup', _resizeOnUp);
}

// ======================== Script search ========================
const searchKeyword = ref('');
const treeRef = ref<any>(null);

watch(searchKeyword, (val) => {
  if (treeRef.value && typeof treeRef.value.filter === 'function') {
    treeRef.value.filter(val);
  } else {
    // Fallback: won't error even if el-tree doesn't expose filter
  }
});

function filterTreeNode(value: string, data: any) {
  if (!value) return true;
  const keyword = String(value).toLowerCase().trim();
  if (!keyword) return true;
  const label = String(data.label ?? '').toLowerCase();
  const typeTag = String(data.script_type ?? '').toLowerCase();
  return label.includes(keyword) || typeTag.includes(keyword);
}

const taskStatus = ref('wait');
const taskStatusText = ref(t('message.pages.opsScript.statusWait'));

const stat = reactive({
  success: 0,
  fail: 0,
  pending: 0,
});

const form = reactive({
  script_type: 'sh' as 'sh' | 'python',
  editor_theme: 'github_light_default',
  script_content: '',
  ip_list: '',
  exec_mode: 'parallel' as 'serial' | 'parallel' | 'pilot',
  concurrent: 10,
  timeout_seconds: 300,
  fail_strategy: 'continue' as 'stop' | 'continue',
  pilot_count: 2,
  pilot_success_rate: 100,
  need_audit: false,
  auto_notify: false,
  args_json: '[]' as string,
  envs_json: '[]' as string,
  timeout_minutes: 5,
  exec_options: {
    working_directory: '',
    load_profile: 'false',
    merge_streams: false,
    privileged: false,
    su_user: '',
    su_password: '',
  },
  approval: {
    approval_mode: 'any' as 'any' | 'all',
    approver_ids: [] as number[],
    countersign_ids: [] as number[],
    submit_desc: '',
  },
});

// ===================== Approver selection =====================
const userList = ref<any[]>([]);
const approvalConfigDialogVisible = ref(false);
const tempApproval = reactive({
  approval_mode: 'any' as 'any' | 'all',
  approver_ids: [] as number[],
  countersign_ids: [] as number[],
  submit_desc: '',
});

async function loadUsers(keyword = '') {
  try {
    const res: any = await request({
      url: '/api/system/user/',
      method: 'get',
      params: { limit: 300, search: keyword },
    });
    userList.value = res.data?.results || res.data || [];
  } catch (e) {
    // ignore
  }
}

function openApprovalConfig() {
  tempApproval.approval_mode = form.approval.approval_mode;
  tempApproval.approver_ids = [...(form.approval.approver_ids || [])];
  tempApproval.countersign_ids = [...(form.approval.countersign_ids || [])];
  tempApproval.submit_desc = form.approval.submit_desc || '';
  approvalConfigDialogVisible.value = true;
  if (userList.value.length === 0) loadUsers();
}

function saveApprovalConfig() {
  const anyUsers = tempApproval.approver_ids || [];
  const allUsers = tempApproval.countersign_ids || [];
  if (anyUsers.length === 0 && allUsers.length === 0) {
    ElMessage.warning(t('message.pages.opsScript.approvalConfigEmpty'));
  }
  // Auto-switch to 'all' mode when countersign_ids are selected but mode is still 'any'
  if (allUsers.length > 0 && tempApproval.approval_mode !== 'all') {
    tempApproval.approval_mode = 'all';
  }
  form.approval.approval_mode = tempApproval.approval_mode;
  form.approval.approver_ids = [...tempApproval.approver_ids];
  form.approval.countersign_ids = [...tempApproval.countersign_ids];
  form.approval.submit_desc = tempApproval.submit_desc;
  approvalConfigDialogVisible.value = false;
}

const approvalConfigSummary = computed(() => {
  const anyCount = (form.approval.approver_ids || []).length;
  const allCount = (form.approval.countersign_ids || []).length;
  if (!anyCount && !allCount) return '';
  const parts: string[] = [];
  if (anyCount) parts.push(t('message.pages.opsScript.approvalSummaryAny', { count: anyCount }));
  if (allCount) parts.push(t('message.pages.opsScript.approvalSummaryAll', { count: allCount }));
  return parts.join(' / ');
});

type QuickKvRow = { prefix: string; key: string; value: string };
const argsQuickMode = ref<'positional' | 'kv'>('positional');
const argsQuickPositional = ref('');
const argsQuickKv = ref<QuickKvRow[]>([{ prefix: '--', key: '', value: '' }]);
let argsSyncing = false;

const quickArgsCount = computed(() => {
  if (argsQuickMode.value === 'positional') {
    return argsQuickPositional.value.split(/\s+/).filter((s) => s.trim() !== '').length;
  }
  return argsQuickKv.value.filter((r) => r.key && r.key.trim() !== '').length;
});

function addKvRow() {
  argsQuickKv.value.push({ prefix: '--', key: '', value: '' });
}
function removeKvRow(idx: number) {
  if (argsQuickKv.value.length <= 1) return;
  argsQuickKv.value.splice(idx, 1);
}

function argsJsonToQuick(jsonStr: string) {
  try {
    const arr = JSON.parse(jsonStr || '[]');
    if (!Array.isArray(arr) || arr.length === 0) {
      argsQuickPositional.value = '';
      argsQuickKv.value = [{ prefix: '--', key: '', value: '' }];
      return;
    }
    const isPositional = arr.every((i: any) => !i || !i.key);
    if (isPositional) {
      argsQuickMode.value = 'positional';
      argsQuickPositional.value = arr.map((i: any) => (i && i.value != null ? String(i.value) : '')).join(' ');
      argsQuickKv.value = [{ prefix: '--', key: '', value: '' }];
    } else {
      argsQuickMode.value = 'kv';
      argsQuickPositional.value = '';
      argsQuickKv.value = arr
        .filter((i: any) => i && typeof i.key === 'string' && i.key.trim() !== '')
        .map((i: any) => ({
          prefix: i.prefix != null ? String(i.prefix) : (String(i.key).startsWith('-') ? '' : '--'),
          key: String(i.key).replace(/^(-{1,2}|\/)/, ''),
          value: i.value != null ? String(i.value) : '',
        }));
      if (argsQuickKv.value.length === 0) {
        argsQuickKv.value = [{ prefix: '--', key: '', value: '' }];
      }
    }
  } catch {
    argsQuickPositional.value = '';
    argsQuickKv.value = [{ prefix: '--', key: '', value: '' }];
  }
}

function quickToArgsJson(): string {
  if (argsQuickMode.value === 'positional') {
    const parts = argsQuickPositional.value
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((v) => ({ key: '', value: v }));
    return JSON.stringify(parts, null, 2);
  }
  const rows = argsQuickKv.value.filter(
    (r) => r.key && r.key.trim() !== ''
  );
  const list = rows.map((r) => ({
    key: (r.prefix || '') + r.key.trim(),
    value: r.value,
    desc: '',
    required: false,
    argType: 'value',
    prefix: r.prefix,
  }));
  return JSON.stringify(list, null, 2);
}

watch(
  () => form.args_json,
  (val) => {
    if (argsSyncing) return;
    argsSyncing = true;
    try {
      argsJsonToQuick(val || '[]');
    } finally {
      argsSyncing = false;
    }
  },
  { immediate: true }
);

watch(
  [argsQuickMode, argsQuickPositional, argsQuickKv],
  () => {
    if (argsSyncing) return;
    argsSyncing = true;
    try {
      form.args_json = quickToArgsJson();
    } finally {
      argsSyncing = false;
    }
  },
  { immediate: true, deep: true }
);

const saveForm = reactive({
  id: null as number | null,
  name: '',
  category: null as number | null,
  auth_type: 'private' as 'private' | 'public',
  tags: '',
  desc: '',
  creator_id: null as number | null,
});

const categoryOptions = ref<Array<{ label: string; value: number }>>([]);

// ======================== Share management ========================
import { useUserInfo } from '/@/stores/userInfo';
const shareUserStore = useUserInfo();
const shareManageVisible = ref(false);
const currentShareScript = ref<any>(null);
function canManageShareCurrent(): { ok: boolean; reason?: string } {
  if (!currentLoadedScriptId.value) return { ok: false, reason: t('message.pages.opsScript.shareNeedLoadScript') };
  return { ok: true };
}
function openShareManageCurrent() {
  const check = canManageShareCurrent();
  if (!check.ok) {
    ElMessage.warning(check.reason || t('message.pages.opsScript.shareCannotManage'));
    return;
  }
  currentShareScript.value = {
    id: currentLoadedScriptId.value,
    name: saveForm.name || t('message.pages.opsScript.scriptHashId', { id: currentLoadedScriptId.value }),
  };
  shareManageVisible.value = true;
}

// ======================== Create/Edit script large dialog (consistent with script library management) ========================
const createDialogVisible = ref(false);
const createActiveTab = ref<'base' | 'content' | 'params' | 'envs' | 'advance'>('base');
const createIsEditMode = ref(false);
const createViewMode = ref(false);
const createCurrentScriptRow = ref<any>(null);

let createScriptEditor: monaco.editor.IStandaloneCodeEditor | null = null;
const createScriptEditorRef = ref<HTMLDivElement | null>(null);
const createFileInputRef = ref<HTMLInputElement | null>(null);

// Create form (fields consistent with scriptForm in script-library/index.vue)
const createScriptForm = reactive({
  id: '' as string | number,
  name: '',
  type: 'Shell' as 'Shell' | 'Python3' | 'PowerShell' | 'Bat' | 'SQL',
  category: null as number | null,
  categoryName: '',
  authType: 'private' as 'private' | 'public',
  tags: '',
  desc: '',
  timeout: 300,
  concurrent: 10,
  failStrategy: 'continue' as 'stop' | 'continue',
  openRiskCheck: true,
  needAudit: false,
  logRetention: 3650,
});

const createScriptContent = ref('');
const createScriptParamList = ref<Array<{ key: string; value: string; desc: string }>>([]);
const createScriptEnvList = ref<Array<{ key: string; value: string; desc: string }>>([]);

const createRiskCheckVisible = ref(false);
const createRiskCheckResult = ref<any>({
  risk_level: 'low',
  risk_level_display: t('message.pages.opsScript.riskLevelLow'),
  total_count: 0,
  error_count: 0,
  warning_count: 0,
  info_count: 0,
  tools_used: [],
  issues: [],
});
const createRiskChecking = ref(false);

const createEditorOptions = ref<monaco.editor.IStandaloneEditorConstructionOptions>({
  automaticLayout: true,
  minimap: { enabled: false },
  fontSize: 14,
  tabSize: 4,
  insertSpaces: true,
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  lineNumbers: 'on',
  theme: 'vs',
  readOnly: false,
  renderLineHighlight: 'all',
  cursorBlinking: 'smooth',
  smoothScrolling: true,
  bracketPairColorization: { enabled: true },
  colorDecorators: true,
  folding: true,
  foldingHighlight: true,
  links: true,
  renderWhitespace: 'selection',
  mouseWheelZoom: false,
});

// Category tree data (lazy-loaded inside dialog)
const rawCategoryDataForCreate = ref<any[]>([]);
const mineCategoryIdForCreate = ref<number | null>(null);
const publicCategoryIdForCreate = ref<number | null>(null);

function getEditorLangCreate(type: string): string {
  const langMap: Record<string, string> = {
    Shell: 'shell',
    Python3: 'python',
    PowerShell: 'powershell',
    Bat: 'bat',
    SQL: 'sql',
  };
  return langMap[type] || 'shell';
}

function isCategoryUnderSystemCatCreate(categoryId: number | null, systemCatId: number | null, cats: any[]): boolean {
  if (!categoryId || !systemCatId) return false;
  const findUnder = (list: any[]): boolean => {
    for (const c of list) {
      if (Number(c.id) === categoryId) return true;
      if (c.children?.length && findUnder(c.children)) return true;
    }
    return false;
  };
  const findRoot = (list: any[]): any => {
    for (const c of list) {
      if (Number(c.id) === systemCatId) return c;
      if (c.children?.length) {
        const found = findRoot(c.children);
        if (found) return found;
      }
    }
    return null;
  };
  const root = findRoot(cats);
  if (!root) return false;
  return Number(root.id) === categoryId || (root.children?.length && findUnder(root.children));
}

function filterCategoryTreeByAuthTypeCreate(cats: any[], authType: string): any[] {
  if (!authType) return [];
  let targetCatId: number | null = null;
  if (authType === 'private') targetCatId = mineCategoryIdForCreate.value;
  else if (authType === 'public') targetCatId = publicCategoryIdForCreate.value;
  const buildTree = (list: any[]): any[] => {
    const result: any[] = [];
    list.forEach((c) => {
      const node = {
        label: c.name,
        value: Number(c.id),
        disabled: c.is_virtual === true,
        children: c.children?.length ? buildTree(c.children) : [],
      };
      if (targetCatId != null) {
        // Only keep the specified system category tree and its children; search within full cats
        if (Number(c.id) === targetCatId || isCategoryUnderSystemCatCreate(Number(c.id), targetCatId, cats)) {
          result.push(node);
        } else if (node.children.length) {
          // Parent is not target but children have matches — keep parent to preserve tree structure
          const hasMatchInChildren = (nodes: any[]): boolean =>
            nodes.some((n) => n.value === targetCatId || hasMatchInChildren(n.children || []));
          if (hasMatchInChildren(node.children)) result.push(node);
        }
      } else {
        // Default/unspecified: show all categories
        result.push(node);
      }
    });
    return result;
  };
  return buildTree(cats || []);
}

const createCategoryTreeOptions = computed(() => {
  const allCats = rawCategoryDataForCreate.value || [];
  const authType = createScriptForm.authType;
  return filterCategoryTreeByAuthTypeCreate(allCats, authType);
});

const createFormCategoryLabel = computed(() => {
  if (createScriptForm.categoryName) return createScriptForm.categoryName;
  if (createCurrentScriptRow.value?.categoryName) return createCurrentScriptRow.value.categoryName;
  const catId = createScriptForm.category;
  if (catId !== null && catId !== undefined) {
    const flatten = (list: any[]): any[] => {
      const r: any[] = [];
      list.forEach((c) => {
        r.push({ label: c.name, value: Number(c.id) });
        if (c.children?.length) r.push(...flatten(c.children));
      });
      return r;
    };
    const flat = flatten(rawCategoryDataForCreate.value || []);
    const opt = flat.find((o) => o.value === Number(catId));
    if (opt) return opt.label;
  }
  return catId !== null && catId !== undefined ? String(catId) : '-';
});

async function ensureCreateCategoryTreeLoaded() {
  if (rawCategoryDataForCreate.value && rawCategoryDataForCreate.value.length > 0) return;
  try {
    const res: any = await categoryApi.GetTree();
    const allCategories = (res?.data?.records || res?.data || []) as any[];
    rawCategoryDataForCreate.value = allCategories;
    // Find system category IDs for "my scripts" and "public scripts"
    const walk = (list: any[]) => {
      list.forEach((c) => {
        if (c.category_type === 'system' && /My scripts|mine/i.test(c.name)) {
          mineCategoryIdForCreate.value = Number(c.id);
        }
        if (c.category_type === 'system' && /Public scripts|public/i.test(c.name)) {
          publicCategoryIdForCreate.value = Number(c.id);
        }
        if (c.children?.length) walk(c.children);
      });
    };
    walk(allCategories);
  } catch {
    // ignore
  }
}

function initCreateScriptEditor() {
  if (!createScriptEditorRef.value || createScriptEditor) return;
  createScriptEditor = monaco.editor.create(createScriptEditorRef.value, {
    value: createScriptContent.value,
    language: getEditorLangCreate(createScriptForm.type),
    ...createEditorOptions.value,
  });
  createScriptEditor.onDidChangeModelContent(() => {
    createScriptContent.value = createScriptEditor?.getValue() || '';
  });
}

function destroyCreateScriptEditor() {
  if (createScriptEditor) {
    createScriptEditor.dispose();
    createScriptEditor = null;
  }
}

function setCreateScriptEditorValue(value: string) {
  nextTick(() => {
    if (createScriptEditor) {
      createScriptEditor.setValue(value || '');
    }
  });
}

function setCreateScriptEditorLanguage(type: string) {
  nextTick(() => {
    const m = createScriptEditor?.getModel();
    if (m) {
      monaco.editor.setModelLanguage(m, getEditorLangCreate(type));
    }
  });
}

watch(
  () => createDialogVisible.value,
  (visible) => {
    if (visible) {
      ensureCreateCategoryTreeLoaded();
      nextTick(() => {
        if (createActiveTab.value === 'content') {
          initCreateScriptEditor();
          requestAnimationFrame(() => createScriptEditor?.layout());
        }
      });
    } else {
      destroyCreateScriptEditor();
    }
  }
);

watch(createActiveTab, (tab) => {
  if (tab === 'content' && createDialogVisible.value) {
    nextTick(() => {
      if (!createScriptEditor) initCreateScriptEditor();
      requestAnimationFrame(() => createScriptEditor?.layout());
    });
  }
});

// Sync editor readOnly and type
watch(
  () => createScriptForm.type,
  (t) => setCreateScriptEditorLanguage(t)
);

watch(createViewMode, (v) => {
  nextTick(() => {
    if (createScriptEditor) createScriptEditor.updateOptions({ readOnly: v });
  });
});

// ============ Toolbar functions ============
function formatCodeCreate() {
  ElMessage.info(t('message.pages.opsScript.formatNotImplemented'));
}

async function checkRiskCodeCreate() {
  const code = createScriptContent.value;
  if (!code || !code.trim()) {
    ElMessage.warning(t('message.pages.opsScript.pleaseInputScriptContent'));
    return;
  }
  createRiskChecking.value = true;
  try {
    const res: any = await scriptLibraryApi.checkRisk(code, createScriptForm.type);
    if (res && res.data) {
      createRiskCheckResult.value = res.data;
    }
    createRiskCheckVisible.value = true;
  } catch (e: any) {
    ElMessage.error(e?.message || t('message.pages.opsScript.riskCheckFailed'));
  } finally {
    createRiskChecking.value = false;
  }
}

function clearEditorCreate() {
  createScriptContent.value = '';
  if (createScriptEditor) createScriptEditor.setValue('');
}

function uploadScriptFileCreate() {
  createFileInputRef.value?.click();
}

function handleFileUploadCreate(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;
  const file = files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = (e.target?.result as string) || '';
    createScriptContent.value = text;
    if (createScriptEditor) createScriptEditor.setValue(text);
    ElMessage.success(t('message.pages.opsScript.fileImported', { name: file.name }));
  };
  reader.readAsText(file);
  target.value = '';
}

// ============ Open dialog ============
function openCreateScriptDialog(preset?: {
  form?: Partial<typeof createScriptForm>;
  content?: string;
  params?: any[];
  envs?: any[];
}) {
  createIsEditMode.value = false;
  createViewMode.value = false;
  createCurrentScriptRow.value = null;
  createActiveTab.value = 'base';
  createScriptParamList.value = [];
  createScriptEnvList.value = [];
  createScriptContent.value = t('message.pages.opsScript.defaultScriptContent');
  Object.assign(createScriptForm, {
    id: '',
    name: '',
    type: 'Shell',
    category: null,
    categoryName: '',
    authType: 'private',
    tags: '',
    desc: '',
    timeout: 300,
    concurrent: 10,
    failStrategy: 'continue',
    openRiskCheck: true,
    needAudit: false,
    logRetention: 3650,
  });
  if (preset?.form) Object.assign(createScriptForm, preset.form);
  if (preset?.content) createScriptContent.value = preset.content;
  if (preset?.params) createScriptParamList.value = [...preset.params];
  if (preset?.envs) createScriptEnvList.value = [...preset.envs];
  nextTick(() => {
    setCreateScriptEditorValue(createScriptContent.value);
    if (createScriptEditor) createScriptEditor.updateOptions({ readOnly: false });
  });
  createDialogVisible.value = true;
}

async function _fillCreateFormFromDetail(row: any, detail: any | null) {
  createCurrentScriptRow.value = row;
  const src = detail || row;
  Object.assign(createScriptForm, {
    id: detail?.id ?? row?.id ?? '',
    name: src.name || '',
    type: detail?.script_type || row?.type || 'Shell',
    category:
      (detail?.category !== undefined && detail?.category !== null)
        ? Number(detail.category)
        : (row?.category !== undefined && row?.category !== null)
          ? Number(row.category)
          : null,
    categoryName: detail?.category_name || row?.categoryName || '',
    authType: detail?.auth_type || row?.authType || 'private',
    tags: src.tags || '',
    desc: src.desc || '',
    timeout: detail?.timeout !== undefined ? Number(detail.timeout) : (row?.timeout || 300),
    concurrent: detail?.concurrent !== undefined ? Number(detail.concurrent) : (row?.concurrent || 10),
    failStrategy: (detail?.fail_strategy || row?.failStrategy || 'continue') as any,
    openRiskCheck:
      detail?.open_risk_check !== undefined
        ? detail.open_risk_check
        : (row?.openRiskCheck !== undefined ? row.openRiskCheck : true),
    needAudit:
      detail?.need_audit !== undefined
        ? detail.need_audit
        : (row?.needAudit !== undefined ? row.needAudit : false),
    logRetention: detail?.log_retention !== undefined ? Number(detail.log_retention) : (row?.logRetention || 3650),
  });
  createScriptParamList.value = detail?.script_params || row?.script_params || [];
  createScriptEnvList.value = detail?.script_envs || row?.script_envs || [];
  createScriptContent.value = detail?.content || row?.content || '';
  nextTick(() => {
    setCreateScriptEditorValue(createScriptContent.value);
    if (createScriptEditor) {
      createScriptEditor.updateOptions({ readOnly: createViewMode.value });
    }
  });
}

async function openEditScriptInDialog(row: any) {
  createIsEditMode.value = true;
  createViewMode.value = false;
  createActiveTab.value = 'base';
  createDialogVisible.value = true;
  try {
    const detailRes: any = await scriptLibraryApi.GetObj(row.id);
    _fillCreateFormFromDetail(row, detailRes?.data || {});
  } catch {
    _fillCreateFormFromDetail(row, null);
  }
}

async function openViewScriptInDialog(row: any) {
  createIsEditMode.value = true;
  createViewMode.value = true;
  createActiveTab.value = 'base';
  createDialogVisible.value = true;
  try {
    const detailRes: any = await scriptLibraryApi.GetObj(row.id);
    _fillCreateFormFromDetail(row, detailRes?.data || {});
  } catch {
    _fillCreateFormFromDetail(row, null);
  }
}
void openViewScriptInDialog;

// ============ Save to script library and auto-load into main editor ============
async function _loadSavedScriptToMainEditor(scriptId: number | string) {
  try {
    const detailRes: any = await scriptLibraryApi.GetObj(scriptId);
    const d = detailRes?.data || {};
    const t = d.script_type || 'Shell';
    form.script_type = t === 'Shell' ? 'sh' : t === 'Python3' ? 'python' : t.toLowerCase();
    form.script_content = d.content || '';
    form.timeout_seconds = Number(d.timeout) || 300;
    form.timeout_minutes = Math.ceil(form.timeout_seconds / 60);
    form.concurrent = Number(d.concurrent) || 10;
    form.fail_strategy = d.fail_strategy || 'continue';
    form.need_audit = !!d.need_audit;
    // Params
    createScriptParamList.value = d.script_params || [];
    paramList.value = d.script_params || [];
    form.args_json = JSON.stringify(paramList.value);
    // Environment variables
    createScriptEnvList.value = d.script_envs || [];
    const envsList: any[] = d.script_envs || [];
    form.envs_json = JSON.stringify(envsList);
    // Save form metadata (for later "update to library" button echo)
    saveForm.id = Number(d.id) || null;
    saveForm.name = d.name || '';
    saveForm.category = d.category != null ? Number(d.category) : null;
    saveForm.auth_type = d.auth_type || 'private';
    saveForm.tags = d.tags || '';
    saveForm.desc = d.desc || '';
    currentLoadedScriptId.value = saveForm.id;
    ElMessage.success(t('message.pages.opsScript.scriptLoadedToEditor'));
  } catch {
    // Auto-load failure is silent; user can manually load from script tree
  }
}

async function saveScriptInDialog() {
  if (!createScriptForm.name.trim()) {
    return ElMessage.warning(t('message.pages.opsScript.pleaseInputScriptName'));
  }
  if (!createScriptForm.type) {
    return ElMessage.warning(t('message.pages.opsScript.pleaseSelectScriptType'));
  }
  if (
    createScriptForm.category === null ||
    createScriptForm.category === undefined
  ) {
    return ElMessage.warning(t('message.pages.opsScript.pleaseSelectCategory'));
  }
  const code = createScriptContent.value;
  let detectedRiskLevel: string = '';
  if (createScriptForm.openRiskCheck) {
    try {
      const riskRes: any = await scriptLibraryApi.checkRisk(code, createScriptForm.type);
      const risk = riskRes?.data;
      detectedRiskLevel = risk?.risk_level || '';
      if (risk && risk.risk_level === 'high') {
        await ElMessageBox.confirm(
          t('message.pages.opsScript.riskHighConfirm', { error: risk.error_count, warning: risk.warning_count }),
          t('message.pages.opsScript.confirmRiskTitle'),
          { type: 'error', confirmButtonText: t('message.pages.opsScript.confirmSaveBtn'), cancelButtonText: t('message.pages.opsScript.cancelBtn') }
        );
      } else if (risk && risk.risk_level === 'medium') {
        await ElMessageBox.confirm(
          t('message.pages.opsScript.riskMediumConfirm', { error: risk.error_count || 0, warning: risk.warning_count || 0 }),
          t('message.pages.opsScript.confirmRiskTitle'),
          { type: 'warning', confirmButtonText: t('message.pages.opsScript.confirmSaveBtn'), cancelButtonText: t('message.pages.opsScript.cancelBtn') }
        );
      }
    } catch (e) {
      return;
    }
  }
  const payload: any = {
    name: createScriptForm.name,
    script_type: createScriptForm.type,
    category: createScriptForm.category || null,
    auth_type: createScriptForm.authType,
    tags: createScriptForm.tags,
    desc: createScriptForm.desc,
    content: code,
    timeout: createScriptForm.timeout,
    concurrent: createScriptForm.concurrent,
    fail_strategy: createScriptForm.failStrategy,
    open_risk_check: createScriptForm.openRiskCheck,
    need_audit: createScriptForm.needAudit,
    log_retention: createScriptForm.logRetention,
    script_params: createScriptParamList.value.filter((p) => p.key.trim()),
    script_envs: createScriptEnvList.value.filter((p) => p.key.trim()),
  };
  if (detectedRiskLevel) payload.risk_level = detectedRiskLevel;
  try {
    let savedId: number | string = '';
    if (createIsEditMode.value && createScriptForm.id) {
      payload.id = createScriptForm.id;
      const res: any = await scriptLibraryApi.UpdateObj(payload);
      if (res.data?.status === 2) {
        ElMessage.success(t('message.pages.opsScript.scriptUpdatedPendingReview'));
      } else {
        ElMessage.success(t('message.pages.opsScript.scriptUpdatedNewVersion'));
      }
      savedId = payload.id;
    } else {
      const res: any = await scriptLibraryApi.AddObj(payload);
      if (res.data?.status === 2) {
        ElMessage.success(t('message.pages.opsScript.scriptSavedPendingReview'));
      } else {
        ElMessage.success(t('message.pages.opsScript.scriptSavedV1'));
      }
      savedId = res.data?.id || '';
    }
    createDialogVisible.value = false;
    // Auto-load into main editor after successful save
    if (savedId) {
      await _loadSavedScriptToMainEditor(savedId);
    }
  } catch (e: any) {
    ElMessage.error(e?.message || t('message.pages.opsScript.scriptSaveFailed'));
  }
}

// ======================== END Create dialog ========================

const selectedHosts = ref<any[]>([]);
const selectedHostIds = computed(() => selectedHosts.value.map((h) => h.id));
const currentLoadedScriptId = ref<number | null>(null);

const editorOptions = ref({
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: true,
  enableSnippets: true,
  showLineNumbers: true,
  tabSize: 4,
  fontSize: 14,
});

const treeData = ref<any[]>([]);

// Watch log changes, auto-scroll to latest
watch(hostLogList, () => {
  if (autoScroll.value && logContentRef.value) {
    const el = logContentRef.value;
    nextTick(() => {
      el.scrollTop = el.scrollHeight;
    });
  }
}, { deep: true });

watch(systemLogs, () => {
  if (autoScroll.value && logContentRef.value) {
    const el = logContentRef.value;
    nextTick(() => {
      el.scrollTop = el.scrollHeight;
    });
  }
}, { deep: true });

watch(
  () => form.timeout_minutes,
  (val) => {
    form.timeout_seconds = Math.max(1, (val || 0) * 60);
  }
);
watch(
  () => form.timeout_seconds,
  (val) => {
    if (!form.timeout_minutes || Math.abs(form.timeout_minutes * 60 - val) > 30) {
      form.timeout_minutes = Math.max(1, Math.ceil((val || 0) / 60));
    }
  }
);

watch(
  () => form.ip_list,
  (newVal, oldVal) => {
    if (newVal !== oldVal && hostValidatedSnapshot && newVal !== hostValidatedSnapshot) {
      clearHostValidateResult();
    }
  }
);

function clearHostValidateResult() {
  hostValidateResult.valid = [];
  hostValidateResult.not_found = [];
  hostValidateResult.no_permission = [];
  hostValidatedSnapshot = '';
}

function triggerHostFileImport() {
  if (hostFileInputRef.value) {
    hostFileInputRef.value.value = '';
    hostFileInputRef.value.click();
  }
}

function handleHostFileImport(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = (e.target?.result as string) || '';
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));

      if (lines.length === 0) {
        ElMessage.warning(t('message.pages.opsScript.hostFileNoValidIdentifier'));
        return;
      }

      const existing = form.ip_list
        ? form.ip_list.split('\n').map((l) => l.trim()).filter((l) => l)
        : [];
      const merged = Array.from(new Set([...existing, ...lines]));
      form.ip_list = merged.join('\n');
      clearHostValidateResult();
      ElMessage.success(t('message.pages.opsScript.hostFileImportSuccess', { count: lines.length, dedup: merged.length, hasDedup: existing.length > 0 }));
    } catch (err: any) {
      ElMessage.error(t('message.pages.opsScript.hostFileParseFailed') + (err.message || String(err)));
    }
  };
  reader.onerror = () => {
    ElMessage.error(t('message.pages.opsScript.hostFileReadFailed'));
  };
  reader.readAsText(file, 'UTF-8');
}

async function handleValidateHosts(): Promise<{ ok: boolean; invalidCount: number }> {
  const hostsArr = form.ip_list
    ? form.ip_list.split('\n').map((h) => h.trim()).filter((h) => h)
    : [];
  if (hostsArr.length === 0) {
    ElMessage.warning(t('message.pages.opsScript.hostPleaseInputFirst'));
    return { ok: false, invalidCount: -1 };
  }

  hostValidateLoading.value = true;
  clearHostValidateResult();
  try {
    const res = await hostApi.ValidateHosts(hostsArr);
    const data = res.data || {};
    hostValidateResult.valid = data.valid || [];
    hostValidateResult.not_found = data.not_found || [];
    hostValidateResult.no_permission = data.no_permission || [];
    hostValidatedSnapshot = form.ip_list;

    const invalidCount = hostValidateResult.not_found.length + hostValidateResult.no_permission.length;
    if (invalidCount === 0) {
      ElMessage.success(t('message.pages.opsScript.hostValidatePass', { valid: hostValidateResult.valid.length }));
    } else {
      ElMessage.warning(
        t('message.pages.opsScript.hostValidateSummary', {
          valid: hostValidateResult.valid.length,
          notFound: hostValidateResult.not_found.length,
          noPermission: hostValidateResult.no_permission.length,
        })
      );
    }
    return { ok: invalidCount === 0, invalidCount };
  } catch (e: any) {
    ElMessage.error(t('message.pages.opsScript.hostValidateFailed') + (e?.message || String(e)));
    return { ok: false, invalidCount: -1 };
  } finally {
    hostValidateLoading.value = false;
  }
}

async function handleCleanInvalidHosts() {
  const invalidCount = hostValidateResult.not_found.length + hostValidateResult.no_permission.length;
  if (invalidCount === 0) {
    ElMessage.info(t('message.pages.opsScript.hostNoInvalidToClean'));
    return;
  }

  const hostsArr = form.ip_list
    ? form.ip_list.split('\n').map((h) => h.trim()).filter((h) => h)
    : [];

  let validatedValidSet: Set<string> | null = null;
  let needValidate = hostValidatedSnapshot !== form.ip_list;

  if (!needValidate) {
    validatedValidSet = new Set(hostValidateResult.valid.map((h) => h.identifier));
    if (validatedValidSet.size === 0) {
      needValidate = true;
    }
  }

  hostCleanInvalidLoading.value = true;
  try {
    let keepSet: Set<string>;
    if (needValidate) {
      const res = await hostApi.ValidateHosts(hostsArr);
      const data = res.data || {};
      hostValidateResult.valid = data.valid || [];
      hostValidateResult.not_found = data.not_found || [];
      hostValidateResult.no_permission = data.no_permission || [];
      keepSet = new Set(hostValidateResult.valid.map((h) => h.identifier));
    } else {
      keepSet = validatedValidSet!;
    }

    const invalidIdentifierSet = new Set<string>([
      ...hostValidateResult.not_found,
      ...hostValidateResult.no_permission.map((h) => h.identifier),
    ]);

    let removed = 0;
    const originalLines = form.ip_list.split('\n');
    const newLines: string[] = [];
    const processed = new Set<string>();

    for (const line of originalLines) {
      const trimmed = line.trim();
      if (!trimmed) {
        newLines.push(line);
        continue;
      }
      const key = trimmed;
      if (processed.has(key)) {
        newLines.push(line);
        continue;
      }
      processed.add(key);
      if (invalidIdentifierSet.has(key) && !keepSet.has(key)) {
        removed++;
        continue;
      }
      newLines.push(line);
    }

    form.ip_list = newLines.join('\n');
    hostValidatedSnapshot = form.ip_list;
    hostValidateResult.valid = hostValidateResult.valid.filter((h) => keepSet.has(h.identifier));
    hostValidateResult.not_found = [];
    hostValidateResult.no_permission = [];
    ElMessage.success(t('message.pages.opsScript.hostCleaned', { count: removed }));
  } catch (e: any) {
    ElMessage.error(t('message.pages.opsScript.hostCleanFailed') + (e?.message || String(e)));
  } finally {
    hostCleanInvalidLoading.value = false;
  }
}

function logClass(level: string) {
  switch (level) {
    case 'ERROR':
      return 'log-error';
    case 'WARN':
      return 'log-warn';
    case 'SUCCESS':
      return 'log-success';
    default:
      return 'log-info';
  }
}

function hostStatusTagType(status: string): string {
  switch (status) {
    case 'success': return 'success';
    case 'error': return 'danger';
    case 'terminated': return 'warning';
    case 'running': return 'primary';
    default: return 'info';
  }
}

function hostStatusText(status: string): string {
  switch (status) {
    case 'success': return t('message.pages.opsScript.statusSuccess');
    case 'error': return t('message.pages.opsScript.statusFail');
    case 'terminated': return t('message.pages.opsScript.statusTerminated');
    case 'running': return t('message.pages.opsScript.statusRunning');
    default: return t('message.pages.opsScript.statusWait');
  }
}

// Merge two host objects by ID: prefer the one with richer fields, avoid {id} placeholders overwriting real details
function mergeHostObj(prev: any, next: any) {
  if (!prev) return next || {};
  if (!next) return prev || {};
  const prevScore = Object.keys(prev).filter((k) => prev[k] != null && prev[k] !== '').length;
  const nextScore = Object.keys(next).filter((k) => next[k] != null && next[k] !== '').length;
  const base = nextScore >= prevScore ? { ...next } : { ...prev };
  // Then fill in non-empty fields from both sides to avoid losing unique fields
  for (const [k, v] of Object.entries(prev || {})) {
    if (v != null && v !== '' && base[k] == null) base[k] = v;
  }
  for (const [k, v] of Object.entries(next || {})) {
    if (v != null && v !== '' && base[k] == null) base[k] = v;
  }
  return base;
}
function syncSelectedHostsById(items: any[]) {
  const incoming = Array.isArray(items) ? items : [];
  const prevMap = new Map(
    (selectedHosts.value || []).filter((h: any) => h && h.id != null).map((h: any) => [h.id, h])
  );
  const nextList: any[] = [];
  const seen = new Set();
  for (const host of incoming) {
    if (!host || host.id == null) continue;
    if (seen.has(host.id)) continue;
    seen.add(host.id);
    const merged = mergeHostObj(prevMap.get(host.id), host);
    nextList.push(merged);
    prevMap.delete(host.id);
  }
  return nextList;
}
function onHostsSelected(_ids: any[], items: any[]) {
  selectedHosts.value = syncSelectedHostsById(items);
}

// User clicks confirm (or Enter) on the "selected hosts summary bar" — close dialog and save selection, skip extra click
function onHostsConfirmed(_ids: any[], items: any[]) {
  selectedHosts.value = syncSelectedHostsById(items);
  showTargetHosts.value = false;
  ElMessage.success(t('message.pages.opsScript.hostSelectedCount', { count: selectedHosts.value.length }));
}

function removeHost(id: any) {
  selectedHosts.value = selectedHosts.value.filter((h) => h.id !== id);
}

function makeScriptNode(s: any) {
  return {
    id: 'script-' + s.id,
    rawId: s.id,
    label: s.name,
    type: 'script',
    isLeaf: true,
    script_type: s.script_type || s.scriptType || s.type,
    _raw: s,
  };
}

async function loadTreeData() {
  treeLoading.value = true;
  try {
    const [categoryRes, scriptRes] = await Promise.all([
      categoryApi.GetTree(),
      getScriptList(), // Get all-status scripts without status filter, for system category filtering
    ]);
    const categoryTree: any[] =
      (categoryRes as any)?.data?.records || (categoryRes as any)?.data || [];
    const scripts: any[] =
      (scriptRes as any)?.data?.records || (scriptRes as any)?.data || [];

    // Only keep "normal/enabled" scripts; disabled/pending approval/archived scripts never shown in sidebar
    const runnableScripts = scripts.filter((s) => isScriptRunnable(s.status).ok);

    const catById: Record<number, any> = {};

    // Recursively convert category nodes, also flatten into catById
    const convert = (cats: any[]): any[] => {
      return cats.map((c) => {
        const node: any = {
          id: 'cat-' + c.id,
          rawId: c.id,
          label: c.name,
          type: c.category_type === 'system' ? 'system' : 'category',
          categoryType: c.category_type,
          count: typeof c.script_count === 'number' ? c.script_count : 0,
          isLeaf: false,
          children: [],
        };
        catById[c.id] = node;
        if (c.children?.length) {
          node.children.push(...convert(c.children));
        }
        return node;
      });
    };

    const roots: any[] = convert(categoryTree);

    // 1) Attach scripts to their actual category nodes
    const noCatScripts: any[] = [];
    runnableScripts.forEach((s) => {
      const node = makeScriptNode(s);
      const catId = typeof s.category === 'object' ? s.category?.id : s.category;
      if (catId && catById[Number(catId)]) {
        catById[Number(catId)].children.push(node);
      } else {
        noCatScripts.push(node);
      }
    });

    // Uncategorized scripts → add to "Uncategorized" bucket
    if (noCatScripts.length) {
      let uncategorized = roots.find((r) => r.id === 'cat-uncategorized');
      if (!uncategorized) {
        uncategorized = {
          id: 'cat-uncategorized',
          label: t('opsUncategorized'),
          type: 'category',
          categoryType: 'custom',
          count: noCatScripts.length,
          isLeaf: false,
          children: [],
        };
        roots.push(uncategorized);
      } else {
        uncategorized.count = (uncategorized.count || 0) + noCatScripts.length;
      }
      uncategorized.children.push(...noCatScripts);
    }

    treeData.value = roots;
  } catch {
    ElMessage.warning(t('message.pages.opsScript.loadTreeFailed'));
    treeData.value = [];
  } finally {
    treeLoading.value = false;
  }
}

async function loadCategoriesForSave() {
  try {
    const res: any = await getScriptCategories();
    const list = (res?.data?.records || res?.data || []) as any[];
    categoryOptions.value = list.map((c) => ({ label: c.name, value: c.id }));
  } catch (e) {
    categoryOptions.value = [];
  }
}

// Only "enabled and normal" scripts are allowed to load into the execution area
function isScriptRunnable(statusRaw: any): { ok: boolean; label: string } {
  if (statusRaw === undefined || statusRaw === null) {
    return { ok: false, label: t('opsStatusUnknown') };
  }
  // Compatibility: English display values (backend SerializerMethodField returns label)
  if (typeof statusRaw === 'string') {
    const trimmed = statusRaw.trim();
    if (['Normal enabled', 'Enabled'].includes(trimmed)) {
      return { ok: true, label: trimmed };
    }
    if (['Disabled'].includes(trimmed)) return { ok: false, label: 'Disabled' };
    if (['Pending approval'].includes(trimmed)) return { ok: false, label: 'Pending approval' };
    if (['Archived'].includes(trimmed)) return { ok: false, label: 'Archived' };
    // Numeric string
    if (/^\d+$/.test(trimmed)) {
      return isScriptRunnable(Number(trimmed));
    }
    return { ok: false, label: trimmed };
  }
  if (typeof statusRaw === 'number') {
    const label = ({
      0: t('opsStatusNormal'),
      1: t('opsStatusDisabled'),
      2: t('opsStatusPending'),
      3: t('opsStatusArchived'),
    } as Record<number, string>)[statusRaw] ?? t('opsStatusCodeFmt', { code: statusRaw });
    return { ok: statusRaw === 0, label };
  }
  return { ok: false, label: String(statusRaw) };
}

// ======================== Script preview / confirm load dialog ========================
const showPreviewDialog = ref(false);
const previewLoading = ref(false);
const previewingScript = ref<any>(null);
const previewingRawNode = ref<any>(null);
const previewTab = ref<'basic' | 'content' | 'params' | 'envs' | 'advanced'>('basic');

// "Lines/Characters" info shown at bottom of preview dialog
const previewLineCount = computed(
  () => (previewingScript.value?.content || '').split('\n').length
);
const previewCharCount = computed(
  () => (previewingScript.value?.content || '').length
);
const previewScriptLang = computed((): string => {
  const t = previewingScript.value?.script_type || '';
  if (t === 'Python3') return 'python';
  if (t === 'Shell') return 'sh';
  return (t as string)?.toLowerCase() || 'sh';
});
const previewCategoryLabel = computed(() => {
  // 1. Prefer category_name field directly from backend
  const directName = previewingScript.value?.category_name;
  if (directName) return String(directName);
  // 2. category is an object → take name/label
  const c = previewingScript.value?.category;
  if (!c) return '-';
  if (typeof c === 'object') return c.name ?? c.label ?? c.id ?? '-';
  // 3. category is an ID → look up in category options
  const id = typeof c === 'string' ? (isNaN(Number(c)) ? c : Number(c)) : c;
  if (typeof id === 'number') {
    const opt = categoryOptions.value.find((o) => o.value === id);
    if (opt) return opt.label;
  }
  // 4. Fallback: compatibility with other possible name field names
  const fallback =
    previewingScript.value?.categoryName ??
    previewingScript.value?.category_label ??
    previewingScript.value?.category_label;
  if (fallback) return String(fallback);
  return String(c);
});

// Write loaded detail into editor + execution config
function applyScriptDetailToForm(detail: any) {
  if (!detail) return;
  form.script_type =
    detail.script_type === 'Python3'
      ? 'python'
      : detail.script_type === 'Shell'
        ? 'sh'
        : ((detail.script_type?.toLowerCase() as any) || 'sh');
  form.script_content = detail.content || '';
  form.timeout_seconds = detail.timeout ?? 300;
  form.timeout_minutes = Math.max(1, Math.ceil((detail.timeout ?? 300) / 60));
  form.concurrent = detail.concurrent ?? 10;
  form.fail_strategy = (detail.fail_strategy as any) ?? 'continue';
  form.need_audit = !!detail.need_audit;
  form.args_json = detail.script_params ? JSON.stringify(detail.script_params, null, 2) : '[]';
  form.envs_json = detail.script_envs ? JSON.stringify(detail.script_envs, null, 2) : '[]';

  // Advanced options sync
  const opts = detail.exec_options || detail;
  if (opts.working_directory !== undefined) form.exec_options.working_directory = opts.working_directory || '';
  if (opts.load_profile !== undefined) form.exec_options.load_profile = String(opts.load_profile || 'false');
  if (opts.merge_streams !== undefined) form.exec_options.merge_streams = !!opts.merge_streams;
  if (opts.privileged !== undefined) form.exec_options.privileged = !!opts.privileged;
  if (opts.su_user !== undefined) form.exec_options.su_user = opts.su_user || '';
  if (opts.su_password !== undefined) form.exec_options.su_password = opts.su_password || '';

  // Execution strategy sync
  if (detail.exec_mode) form.exec_mode = detail.exec_mode;
  if (detail.pilot_count) form.pilot_count = detail.pilot_count;
  if (detail.pilot_success_rate !== undefined) form.pilot_success_rate = detail.pilot_success_rate;

  // Explicitly sync args_json → quick input area (avoid occasional sync issues from watch's immediate/async dedup)
  try {
    argsSyncing = true;
    argsJsonToQuick(form.args_json || '[]');
  } finally {
    nextTick(() => {
      argsSyncing = false;
    });
  }

  currentLoadedScriptId.value = detail.id;
  saveForm.id = detail.id;
  saveForm.name = detail.name || '';
  saveForm.category =
    typeof detail.category === 'object' ? detail.category?.id ?? null : detail.category ?? null;
  saveForm.auth_type = detail.auth_type || 'private';
  saveForm.tags = detail.tags || '';
  saveForm.desc = detail.desc || '';
  saveForm.creator_id = detail.creator_id ?? detail.creator?.id ?? null;
}

function closePreviewDialog() {
  showPreviewDialog.value = false;
  previewingScript.value = null;
  previewingRawNode.value = null;
  previewLoading.value = false;
  previewTab.value = 'basic';
}

async function openScriptPreview(data: any) {
  if (data.type !== 'script' || !data.rawId) return;

  // Preload category list (for category ID → name mapping)
  if (categoryOptions.value.length === 0) {
    loadCategoriesForSave();
  }

  // Status pre-check
  const quickStatus = isScriptRunnable(data._raw?.status);
  if (!quickStatus.ok) {
    ElMessage.warning(
      t('message.pages.opsScript.scriptStatusCannotLoad', { name: data.label, status: quickStatus.label })
    );
    return;
  }

  previewingRawNode.value = data;
  previewingScript.value = null;
  previewLoading.value = true;
  previewTab.value = 'basic';
  showPreviewDialog.value = true;

  try {
    const res: any = await getScriptDetail(data.rawId);
    const detail = res?.data || res;
    if (!detail) {
      ElMessage.warning(t('message.pages.opsScript.scriptDetailEmpty'));
      closePreviewDialog();
      return;
    }

    // Secondary validation
    const detailStatus = isScriptRunnable(detail.status);
    if (!detailStatus.ok) {
      ElMessage.warning(
        t('message.pages.opsScript.scriptStatusCannotLoad', { name: detail.name || data.label, status: detailStatus.label })
      );
      closePreviewDialog();
      return;
    }
    previewingScript.value = detail;
  } catch (e: any) {
    ElMessage.error(t('message.pages.opsScript.loadScriptDetailFailed') + (e?.message || t('message.pages.opsScript.unknownError')));
    closePreviewDialog();
  } finally {
    previewLoading.value = false;
  }
}

function confirmLoadScript() {
  const detail = previewingScript.value;
  if (!detail) {
    return ElMessage.warning(t('message.pages.opsScript.scriptNotLoaded'));
  }
  applyScriptDetailToForm(detail);
  ElMessage.success(t('message.pages.opsScript.scriptLoaded', { name: detail.name }));
  closePreviewDialog();
}

async function handleTreeClick(data: any) {
  // Click script node → show preview confirm dialog first, load only after user confirms
  await openScriptPreview(data);
}

function openSaveDialog() {
  if (!form.script_content.trim()) {
    return ElMessage.warning(t('message.pages.opsScript.scriptContentEmpty'));
  }

  // Use main editor's script content, params, env, execution config as preset,
  // save using the same large dialog as script library management
  let parsedParams: any[] = [];
  let parsedEnvs: any[] = [];
  try {
    parsedParams = form.args_json ? JSON.parse(form.args_json) : [];
  } catch {
    parsedParams = [];
  }
  try {
    parsedEnvs = form.envs_json ? JSON.parse(form.envs_json) : [];
  } catch {
    parsedEnvs = [];
  }

  const scriptTypeForLib: string =
    form.script_type === 'python' ? 'Python3' :
    form.script_type === 'sh' ? 'Shell' :
    form.script_type;

  const authType = (saveForm.auth_type || 'private') as any;
  const presetName = saveForm.name?.trim()
    ? saveForm.name
    : t('message.pages.opsScript.untitledScript', { time: Date.now().toString().slice(-6) });

  const commonPresetForm = {
    name: presetName,
    type: scriptTypeForLib as any,
    category: saveForm.category != null ? Number(saveForm.category) : null,
    authType,
    tags: saveForm.tags || '',
    desc: saveForm.desc || '',
    timeout: form.timeout_seconds || 300,
    concurrent: form.concurrent || 10,
    failStrategy: (form.fail_strategy || 'continue') as any,
    needAudit: !!form.need_audit,
  };

  if (saveForm.id && currentLoadedScriptId.value === saveForm.id) {
    // ====== Already-loaded script from library: save rules differ by public/private ======
    const isPublicScript = authType === 'public' || saveForm.auth_type === 'public';
    if (isPublicScript) {
      // Public script: **original cannot be edited**, can only "Save as new private copy"
      ElMessage.info(t('message.pages.opsScript.publicScriptCopyOnly'));
      openCreateScriptDialog({
        form: {
          ...commonPresetForm,
          // Force private + append _copy to name + clear original category ID (public category can't select private)
          name: presetName.endsWith('_copy') ? presetName : `${presetName}_copy`,
          authType: 'private',
          category: null,
        },
        content: form.script_content,
        params: parsedParams,
        envs: parsedEnvs,
      });
      return;
    }
    // Private script: go directly to edit mode (consistent with script library management edit experience)
    const row: any = {
      id: saveForm.id,
      name: presetName,
      type: scriptTypeForLib,
      category: saveForm.category,
      categoryName: '',
      authType,
      tags: saveForm.tags,
      desc: saveForm.desc,
      timeout: form.timeout_seconds,
      concurrent: form.concurrent,
      failStrategy: form.fail_strategy,
      needAudit: form.need_audit,
      // Use current main editor values below (user may have modified but not yet saved to library)
      content: form.script_content,
      script_params: parsedParams,
      script_envs: parsedEnvs,
    };
    openEditScriptInDialog(row);
    return;
  }

  // ====== Brand new script / not loaded from library: create new ======
  openCreateScriptDialog({
    form: commonPresetForm,
    content: form.script_content,
    params: parsedParams,
    envs: parsedEnvs,
  });
}

async function handleSaveScript() {
  if (!saveForm.name.trim()) {
    return ElMessage.warning(t('message.pages.opsScript.pleaseInputScriptName'));
  }

  const script_type_upper = form.script_type === 'python' ? 'Python3' :
    form.script_type === 'sh' ? 'Shell' : form.script_type;

  let parsedParams: any[] = [];
  let parsedEnvs: any[] = [];
  try {
    parsedParams = form.args_json ? JSON.parse(form.args_json) : [];
  } catch {
    parsedParams = [];
  }
  try {
    parsedEnvs = form.envs_json ? JSON.parse(form.envs_json) : [];
  } catch {
    parsedEnvs = [];
  }

  const payload = {
    name: saveForm.name.trim(),
    script_type: script_type_upper,
    category: saveForm.category,
    auth_type: saveForm.auth_type,
    tags: saveForm.tags,
    desc: saveForm.desc,
    content: form.script_content,
    timeout: form.timeout_seconds > 0 ? form.timeout_seconds : 300,
    concurrent: form.concurrent,
    fail_strategy: form.fail_strategy,
    need_audit: form.need_audit,
    script_params: parsedParams,
    script_envs: parsedEnvs,
    status: 0,
  };

  try {
    let res: any;
    if (saveForm.id) {
      res = await updateScript(saveForm.id, payload);
      ElMessage.success(t('message.pages.opsScript.scriptUpdated'));
    } else {
      res = await createScript(payload);
      const created = res?.data || res;
      if (created?.id) {
        saveForm.id = created.id;
        currentLoadedScriptId.value = created.id;
      }
      ElMessage.success(t('message.pages.opsScript.scriptSaved'));
    }
    showSaveDialog.value = false;
    loadTreeData();
  } catch (e: any) {
    ElMessage.error(t('message.pages.opsScript.saveFailed') + (e?.message || t('message.pages.opsScript.unknownError')));
  }
}

function appendLog(level: string, msg: string) {
  const time = new Date().toLocaleString();
  const fullMsg = `[${time}] ${msg}`;

  // Compatibility with old logList (used for export etc.)
  logList.value.push({ level, msg: fullMsg, time });

  // Classify by host prefix or system prefix
  const hostMatch = msg.match(/^\[(.+?)\]/);
  if (hostMatch) {
    const prefix = hostMatch[1];
    if (
      prefix === 'System' || prefix === 'Pilot verification' ||
      prefix.startsWith('==========')
    ) {
      // System-level log
      systemLogs.value.push({ level, msg: fullMsg, time });
    } else {
      // Host-level log
      const hostLabel = prefix;
      // Use hostLabel as key (hostname/IP)
      let hostLog = hostLogs.value.get(hostLabel);
      if (!hostLog) {
        hostLog = {
          hostKey: hostLabel,
          hostLabel,
          status: 'pending',
          entries: [],
          expanded: !logExpandedAll.value, // Default collapsed for large batches
        };
        hostLogs.value.set(hostLabel, hostLog);
      }
      hostLog.entries.push({ level, msg: fullMsg, time });

      // Update host status based on log content
      const lowerMsg = msg.toLowerCase();
      if (msg.includes('Submitting') || msg.includes('Starting') || lowerMsg.includes('executing')) {
        hostLog.status = 'running';
        hostLog.startedAt = time;
      } else if (lowerMsg.includes('execution succeeded') || lowerMsg.includes('execution completed')) {
        hostLog.status = 'success';
        hostLog.finishedAt = time;
        const ecMatch = msg.match(/exit_code=(\d+)/);
        if (ecMatch) hostLog.exitCode = Number(ecMatch[1]);
      } else if (msg.includes('ERROR') || lowerMsg.includes('execution failed') || lowerMsg.includes('failed')) {
        hostLog.status = 'error';
        hostLog.finishedAt = time;
        const ecMatch = msg.match(/exit_code=(\d+)/);
        if (ecMatch) hostLog.exitCode = Number(ecMatch[1]);
      } else if (lowerMsg.includes('terminated') || lowerMsg.includes('cancelled')) {
        hostLog.status = 'terminated';
        hostLog.finishedAt = time;
      }
    }
  } else {
    // Logs without prefix go to system
    systemLogs.value.push({ level, msg: fullMsg, time });
  }
}

// Batch expand/collapse all hosts (prevent DOM render freeze on large batches)
let expandBatchToken = 0;  // Used to cancel ongoing batch operation

function toggleAllHostLogs(expanded: boolean) {
  const token = ++expandBatchToken;
  const hosts = hostLogList.value;
  if (hosts.length === 0) return;

  // Update flag immediately so button state responds right away
  logExpandedAll.value = expanded;

  // Collapse can be done at once (just hiding DOM)
  if (!expanded) {
    hosts.forEach((h) => { h.expanded = false; });
    return;
  }

  // Expand needs batch rendering
  expandBatchLoading.value = true;
  const BATCH_SIZE = 30;    // 30 hosts per batch
  const TOTAL = hosts.length;
  let done = 0;

  function processBatch() {
    // Stop if token expired (user clicked collapse or other action)
    if (token !== expandBatchToken) return;

    const end = Math.min(done + BATCH_SIZE, TOTAL);
    for (let i = done; i < end; i++) {
      hosts[i].expanded = true;
    }
    done = end;

    if (done < TOTAL) {
      // More to go, yield main thread then continue
      requestAnimationFrame(processBatch);
    } else {
      // All done
      expandBatchLoading.value = false;
    }
  }

  // Start first batch
  requestAnimationFrame(processBatch);
}

// Expand/collapse single host
function toggleHostLog(hostKey: string) {
  const h = hostLogs.value.get(hostKey);
  if (h) h.expanded = !h.expanded;
}

function closeAllWs() {
  Object.values(wsConnections).forEach((ws) => {
    try { ws.close(); } catch { /* ignore */ }
  });
  wsConnections = {};
}

async function terminateAll() {
  const calls = Object.entries(executionHostMap).map(([execId, hostId]) =>
    terminateCommand({ host_id: hostId, execution_id: execId }).catch(() => { /* ignore */ })
  );
  await Promise.all(calls);
  Object.keys(executionHostMap).forEach((k) => delete executionHostMap[k]);
}

function connectWsForExecution(hostLabel: string, _hostId: string, executionId: string) {
  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    try {
      const url = getOpsWebSocketUrl(executionId);
      const ws = new WebSocket(url);
      wsConnections[executionId] = ws;

      let done = false;
      const finish = (ok: boolean, err?: string) => {
        if (done) return;
        done = true;
        try { ws.close(); } catch { /* ignore */ }
        delete wsConnections[executionId];
        resolve({ success: ok, error: err });
      };

      ws.onopen = () => {
        appendLog('INFO', t('message.pages.opsScript.logWsConnected', { host: hostLabel }));
      };

      ws.onmessage = (ev) => {
        try {
          const raw: any = JSON.parse(ev.data);
          const msg: OpsWsMessage = { type: 'output' } as OpsWsMessage;
          let handled = true;
          if (typeof raw.stdout === 'string') {
            msg.type = 'output';
            msg.stream = 'stdout';
            msg.data = raw.stdout;
          } else if (typeof raw.stderr === 'string') {
            msg.type = 'output';
            msg.stream = 'stderr';
            msg.data = raw.stderr;
          } else if ('finished' in raw) {
            const exitCode = Number(raw.finished) || 0;
            msg.type = 'done';
            msg.status = exitCode === 0 ? 'success' : 'error';
            msg.exit_code = exitCode;
            const prefix = exitCode === 0 ? 'SUCCESS' : 'ERROR';
            appendLog(prefix, t('message.pages.opsScript.logHostDone', { host: hostLabel, exitCode }));
            finish(exitCode === 0);
            return;
          } else if (typeof raw.error === 'string' || typeof raw.message === 'string') {
            msg.type = 'error';
            msg.message = raw.error || raw.message;
          } else if (raw && typeof raw.type === 'string') {
            Object.assign(msg, raw);
          } else {
            handled = false;
          }
          if (!handled) {
            appendLog('INFO', `[${hostLabel}] ${ev.data}`);
            return;
          }
          if (msg.type === 'output') {
            const prefix = msg.stream === 'stderr' ? 'ERROR' : 'INFO';
            appendLog(prefix, `[${hostLabel}] ${msg.data || ''}`);
          } else if (msg.type === 'status') {
            if (msg.status === 'running') {
              appendLog('INFO', t('message.pages.opsScript.logHostStart', { host: hostLabel }));
            } else if (msg.status === 'success') {
              appendLog('SUCCESS', t('message.pages.opsScript.logHostSuccess', { host: hostLabel, exitCode: msg.exit_code ?? 0 }));
            } else if (msg.status === 'error' || msg.status === 'terminated') {
              appendLog('ERROR', t('message.pages.opsScript.logHostEnd', { host: hostLabel, result: msg.status === 'terminated' ? t('message.pages.opsScript.logTerminated') : t('message.pages.opsScript.logFailed'), msg: msg.message || '' }));
            }
          } else if (msg.type === 'done') {
            finish(msg.status === 'success', msg.message);
          } else if (msg.type === 'error') {
            appendLog('ERROR', t('message.pages.opsScript.logHostError', { host: hostLabel, msg: msg.message || t('message.pages.opsScript.logConnectError') }));
          }
        } catch {
          appendLog('INFO', `[${hostLabel}] ${ev.data}`);
        }
      };

      ws.onerror = () => {
        appendLog('WARN', t('message.pages.opsScript.logWsError', { host: hostLabel }));
      };

      ws.onclose = () => {
        if (!done) finish(true);
      };
    } catch (e: any) {
      resolve({ success: false, error: e?.message });
    }
  });
}

async function runOneHost(host: any, args: string[], environment: Record<string, string>) {
  const hostLabel = host.host_name || host.host_ip || host.id;
  const code = form.script_content;
  appendLog('INFO', t('message.pages.opsScript.logHostSubmit', { host: hostLabel }));

  let executionId = '';
  try {
    const res: any = await executeScript({
      host_id: String(host.id),
      script_type: form.script_type,
      script_content: code,
      args,
      environment,
      timeout_seconds: form.timeout_seconds > 0 ? form.timeout_seconds : undefined,
      working_directory: form.exec_options.working_directory || undefined,
      merge_streams: form.exec_options.merge_streams || undefined,
      load_profile: (form.exec_options.load_profile !== 'false'
        ? form.exec_options.load_profile
        : undefined) as 'true' | 'false' | 'login' | undefined,
      privileged: form.exec_options.privileged || undefined,
      su_user: form.exec_options.privileged ? (form.exec_options.su_user || undefined) : undefined,
      su_password: form.exec_options.privileged ? (form.exec_options.su_password || undefined) : undefined,
      exec_mode: form.exec_mode,
      concurrent: form.concurrent,
      fail_strategy: form.fail_strategy,
      pilot_count: form.pilot_count,
      pilot_success_rate: form.pilot_success_rate,
      need_audit: form.need_audit,
      auto_notify: form.auto_notify,
      batch_id: currentBatchId,
    });
    executionId = res?.data?.execution_id || res?.execution_id || '';
    if (executionId) {
      executionHostMap[executionId] = String(host.id);
      appendLog('INFO', t('message.pages.opsScript.logHostSubmitted', { host: hostLabel, executionId }));
    }
  } catch (e: any) {
    appendLog('ERROR', t('message.pages.opsScript.logHostSubmitFailed', { host: hostLabel, msg: e?.message || t('message.pages.opsScript.unknownError') }));
    stat.fail++;
    stat.pending--;
    return false;
  }

  let wsResult: { success: boolean; error?: string } | null = null;
  if (executionId) {
    wsResult = await connectWsForExecution(hostLabel, String(host.id), executionId);
  }

  const ok = wsResult ? wsResult.success : true;
  if (ok) {
    stat.success++;
  } else {
    stat.fail++;
    if (wsResult?.error) {
      appendLog('ERROR', `[${hostLabel}] ${wsResult.error}`);
    }
  }
  stat.pending--;
  return ok;
}

async function runSerial(targetHosts: any[], args: string[], environment: Record<string, string>) {
  for (const host of targetHosts) {
    if (!taskRunning.value) break;
    const ok = await runOneHost(host, args, environment);
    if (!ok && form.fail_strategy === 'stop') {
      appendLog('ERROR', t('message.pages.opsScript.logFailStop'));
      break;
    }
  }
}

async function runParallel(targetHosts: any[], args: string[], environment: Record<string, string>) {
  const concurrent = Math.max(1, form.concurrent || 1);
  const queue = [...targetHosts];
  let stop = false;

  const worker = async () => {
    while (queue.length > 0 && !stop) {
      if (!taskRunning.value) { stop = true; break; }
      const host = queue.shift()!;
      const ok = await runOneHost(host, args, environment);
      if (!ok && form.fail_strategy === 'stop') {
        appendLog('ERROR', t('message.pages.opsScript.logFailStop'));
        stop = true;
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrent, targetHosts.length) }, () => worker());
  await Promise.all(workers);
}

async function handleRun() {
  if (hostSelectType.value === 'input') {
    const hostsArr = form.ip_list
      ? form.ip_list.split('\n').map((h) => h.trim()).filter((h) => h)
      : [];
    if (hostsArr.length === 0) {
      return ElMessage.warning(t('message.pages.opsScript.hostPleaseInputIp'));
    }
    let validMap: Map<string, any> | null = null;
    if (hostValidatedSnapshot !== form.ip_list || hostValidateResult.valid.length !== hostsArr.length) {
      try {
        hostValidateLoading.value = true;
        clearHostValidateResult();
        const res = await hostApi.ValidateHosts(hostsArr);
        const data = res.data || {};
        hostValidateResult.valid = data.valid || [];
        hostValidateResult.not_found = data.not_found || [];
        hostValidateResult.no_permission = data.no_permission || [];
        hostValidatedSnapshot = form.ip_list;
      } catch (e: any) {
        hostValidateLoading.value = false;
        return ElMessage.error(t('message.pages.opsScript.hostValidateFailed') + (e?.message || String(e)));
      } finally {
        hostValidateLoading.value = false;
      }
    }
    const invalidCount = hostValidateResult.not_found.length + hostValidateResult.no_permission.length;
    if (invalidCount > 0) {
      const invalidList: string[] = [];
      hostValidateResult.not_found.forEach((h) => invalidList.push(`${h}${t('message.pages.opsScript.hostNotFoundTag')}`));
      hostValidateResult.no_permission.forEach((h: any) => invalidList.push(`${h.identifier}${t('message.pages.opsScript.hostNoPermissionTag')}`));
      return ElMessage.warning(
        t('message.pages.opsScript.hostBlockedExecute', {
          count: invalidCount,
          list: invalidList.slice(0, 5).join('\n'),
          more: invalidList.length > 5 ? invalidList.length - 5 : 0,
        })
      );
    }
    validMap = new Map(hostValidateResult.valid.map((h) => [h.identifier, h]));
    const targetHosts: any[] = [];
    const processed = new Set<string>();
    for (const line of hostsArr) {
      if (processed.has(line)) continue;
      processed.add(line);
      const hostInfo = validMap.get(line);
      if (hostInfo) {
        targetHosts.push({
          id: String(hostInfo.id),
          host_ip: hostInfo.host_ip || line,
          host_name: hostInfo.host_name || '',
          host_uuid: hostInfo.host_uuid || '',
        });
      }
    }
    if (targetHosts.length === 0) {
      return ElMessage.warning(t('message.pages.opsScript.hostNoValidAfterValidate'));
    }
    return handleRunWithHosts(targetHosts);
  }

  const targetHosts = selectedHosts.value;
  if (targetHosts.length === 0) {
    return ElMessage.warning(t('message.pages.opsScript.hostPleaseSelectIp'));
  }
  return handleRunWithHosts(targetHosts);
}

function parseExecParams(): { args: string[]; environment: Record<string, string> } {
  let args: string[] = [];
  let environment: Record<string, string> = {};
  try {
    const parsedArgs = form.args_json ? JSON.parse(form.args_json) : [];
    if (Array.isArray(parsedArgs)) {
      args = parsedArgs
        .filter((p: any) => {
          if (!p) return false;
          if (typeof p === 'string') return !!p;
          if (p.argType === 'flag') return !!(p.key || p.prefix);
          return !!p.value || !!p.key || !!p.prefix;
        })
        .flatMap((p: any): string | string[] => {
          if (typeof p === 'string') return p;
          const hasKey = typeof p.key === 'string' && p.key.trim() !== '';
          if (!hasKey) {
            return p.value != null ? String(p.value) : [];
          }
          if (p.argType === 'flag') {
            return [(p.prefix || '') + p.key];
          }
          const prefix = p.prefix != null ? p.prefix : (p.key.startsWith('-') ? '' : '--');
          const fullKey = prefix + p.key;
          return p.value != null && String(p.value) !== '' ? [fullKey, String(p.value)] : [fullKey];
        })
        .flat() as string[];
    }
  } catch { /* ignore */ }

  try {
    const parsedEnvs = form.envs_json ? JSON.parse(form.envs_json) : [];
    if (Array.isArray(parsedEnvs)) {
      parsedEnvs.forEach((e: any) => {
        if (e && e.key) environment[String(e.key)] = String(e.value ?? '');
      });
    } else if (parsedEnvs && typeof parsedEnvs === 'object') {
      Object.entries(parsedEnvs).forEach(([k, v]) => {
        if (k) environment[k] = String(v ?? '');
      });
    }
  } catch { /* ignore */ }

  return { args, environment };
}

async function handleSubmitApproval(targetHosts: any[], args: string[], environment: Record<string, string>) {
  const batchId = 'APPROVAL' + Date.now();
  let successCount = 0;
  let failCount = 0;
  const approver_ids = ((form.approval?.approver_ids || []) as number[]).filter(Boolean);
  const countersign_ids = ((form.approval?.countersign_ids || []) as number[]).filter(Boolean);
  const approval_mode_val =
    countersign_ids.length > 0 ? 'all' : (form.approval?.approval_mode || (approver_ids.length ? 'any' : undefined));
  const submit_desc_val = form.approval?.submit_desc || '';

  for (const host of targetHosts) {
    try {
      await submitScriptApproval({
        host_id: String(host.id),
        script_type: form.script_type,
        script_content: form.script_content,
        args,
        environment,
        timeout_seconds: form.timeout_seconds > 0 ? form.timeout_seconds : undefined,
        working_directory: form.exec_options.working_directory || undefined,
        merge_streams: form.exec_options.merge_streams || undefined,
        load_profile: (form.exec_options.load_profile !== 'false'
          ? form.exec_options.load_profile
          : undefined) as 'true' | 'false' | 'login' | undefined,
        privileged: form.exec_options.privileged || undefined,
        su_user: form.exec_options.privileged ? (form.exec_options.su_user || undefined) : undefined,
        exec_mode: (form as any).exec_mode || 'parallel',
        concurrency: (form as any).concurrent || 10,
        target_hosts_count: targetHosts.length,
        batch_id: batchId,
        approver_ids: approver_ids.length > 0 ? approver_ids : undefined,
        countersign_ids: countersign_ids.length > 0 ? countersign_ids : undefined,
        approval_mode: approval_mode_val as any,
        submit_desc: submit_desc_val || undefined,
      } as any);
      successCount++;
    } catch (e: any) {
      failCount++;
      ElMessage.error(t('message.pages.opsScript.approvalSubmitFailed', { host: host.host_name || host.host_ip }) + (e?.message || t('message.pages.opsScript.unknownError')));
    }
  }
  if (successCount > 0) {
    ElMessage.success(t('message.pages.opsScript.approvalSubmitted', { success: successCount, fail: failCount }));
  }
}

// ========== Execution confirmation (gatekeeper) ==========
function _buildConfirmRunData(
  targetHosts: any[],
  args: string[],
  environment: Record<string, string>,
  isRisky: boolean
) {
  const execMode: string = (form as any).exec_mode || 'parallel';
  const execModeDisplay =
    execMode === 'serial' ? t('message.pages.opsScript.execModeSerial') : execMode === 'pilot' ? t('message.pages.opsScript.execModePilot') : t('message.pages.opsScript.execModeParallel');
  const execModeTagType: any =
    execMode === 'serial' ? 'warning' : execMode === 'pilot' ? 'success' : 'primary';
  const failStrategyDisplay =
    (form as any).fail_strategy === 'abort' ? t('message.pages.opsScript.failStrategyAbort') : t('message.pages.opsScript.failStrategyContinue');
  const scriptTypeDisplay =
    form.script_type === 'sh'
      ? 'Shell'
      : form.script_type === 'python'
        ? 'Python3'
        : String(form.script_type || '').toUpperCase();
  const codeLines = form.script_content ? form.script_content.split(/\r?\n/).length : 0;
  const codeChars = form.script_content ? form.script_content.length : 0;

  const envsPreview = Object.entries(environment)
    .slice(0, 50)
    .map(([k, v]) => ({ key: k, value: v }));
  const execOptions = (form as any).exec_options || {};
  const hasAnyOption =
    !!execOptions.working_directory ||
    execOptions.load_profile !== 'false' ||
    !!execOptions.merge_streams ||
    !!execOptions.privileged;
  // Expand all option's real default values (including disabled/unset) into human-readable descriptions, avoid vague "default config"
  const execOptionsDetailed: { label: string; value: string; active: boolean }[] = [
    {
      label: t('message.pages.opsScript.optWorkdir'),
      value: execOptions.working_directory ? String(execOptions.working_directory) : t('message.pages.opsScript.optWorkdirDefault'),
      active: !!execOptions.working_directory,
    },
    {
      label: t('message.pages.opsScript.optLoadProfile'),
      value:
        execOptions.load_profile === 'true' ? t('message.pages.opsScript.optLoadProfileYes') :
        execOptions.load_profile === 'login' ? t('message.pages.opsScript.optLoadProfileLogin') : t('message.pages.opsScript.optNo'),
      active: execOptions.load_profile !== 'false',
    },
    {
      label: t('message.pages.opsScript.optMerge'),
      value: execOptions.merge_streams ? t('message.pages.opsScript.optMergeYes') : t('message.pages.opsScript.optMergeNo'),
      active: !!execOptions.merge_streams,
    },
    {
      label: t('message.pages.opsScript.optPrivileged'),
      value:
        execOptions.privileged
          ? t('message.pages.opsScript.optPrivilegedYes', { user: execOptions.su_user || t('message.pages.opsScript.optPrivilegedDefault') })
          : t('message.pages.opsScript.optPrivilegedNo'),
      active: !!execOptions.privileged,
    },
  ];

  // Approval switch & auto-notify (two switches from original "Advanced Settings" tab, must be visible to user on confirm page)
  const approvalNotifyDetailed: { label: string; value: string; active: boolean }[] = [
    {
      label: t('message.pages.opsScript.optNeedAudit'),
      value:
        (form as any).need_audit
          ? t('message.pages.opsScript.optNeedAuditOn')
          : t('message.pages.opsScript.optNeedAuditOff'),
      active: !!(form as any).need_audit,
    },
    {
      label: t('message.pages.opsScript.optAutoNotify'),
      value:
        (form as any).auto_notify
          ? t('message.pages.opsScript.optAutoNotifyOn')
          : t('message.pages.opsScript.optAutoNotifyOff'),
      active: !!(form as any).auto_notify,
    },
  ];

  // Approval config details: mode, OR approvers, AND approvers (map names from userList, show "User#ID" if not found)
  const approvalCfg = (form as any).approval || {};
  const idToUser = (id: number) => {
    const u = (userList.value || []).find((x: any) => x && x.id === id);
    if (u) return { id: u.id, username: u.username, name: u.name || u.username };
    return { id, username: `user${id}`, name: t('message.pages.opsScript.userHashId', { id }) };
  };
  const anyApproverIds = (approvalCfg.approver_ids || []) as number[];
  const allApproverIds = (approvalCfg.countersign_ids || []) as number[];
  const modeFromConfig: 'any' | 'all' | 'single' =
    allApproverIds.length > 0
      ? 'all'
      : anyApproverIds.length > 0
        ? (approvalCfg.approval_mode || 'any')
        : 'single';
  const approvalDetailed = {
    enabled: !!(form as any).need_audit,
    mode: modeFromConfig,
    modeText:
      modeFromConfig === 'all' ? t('message.pages.opsScript.approvalModeAll')
        : modeFromConfig === 'any' ? t('message.pages.opsScript.approvalModeAny')
        : t('message.pages.opsScript.approvalModeSingle'),
    any_approvers: anyApproverIds.map(idToUser),
    all_approvers: allApproverIds.map(idToUser),
    submit_desc: approvalCfg.submit_desc || '',
  };

  return {
    script_name: (saveForm && saveForm.name) || '',
    script_type_display: scriptTypeDisplay,
    content_lines: codeLines,
    content_chars: codeChars,
    hosts: targetHosts,
    exec_mode: execMode,
    exec_mode_display: execModeDisplay,
    exec_mode_tag_type: execModeTagType,
    concurrent: (form as any).concurrent || 10,
    pilot_count: (form as any).pilot_count || 1,
    pilot_success_rate: (form as any).pilot_success_rate ?? 100,
    timeout_seconds: (form as any).timeout_seconds || 300,
    fail_strategy_display: failStrategyDisplay,
    need_audit: !!(form as any).need_audit,
    args,
    args_preview: args.length > 0 ? args.join(' ') : '',
    envs_count: Object.keys(environment).length,
    envs_preview: envsPreview,
    exec_options: execOptions,
    exec_options_detailed: execOptionsDetailed,
    approval_notify_detailed: approvalNotifyDetailed,
    approval_detailed: approvalDetailed,
    has_any_option: hasAnyOption,
    is_risky: isRisky,
  };
}

async function confirmAndRun() {
  const ctx = _pendingRunContext;
  if (!ctx) {
    confirmRunVisible.value = false;
    ElMessage.warning(t('message.pages.opsScript.execContextExpired'));
    return;
  }
  confirmRunVisible.value = false;
  try {
    await _doRunWithHosts(ctx.hosts, ctx.args, ctx.environment);
  } finally {
    _pendingRunContext = null;
  }
}

/**
 * Actually execute (or submit for approval) — this function is only called after final user confirmation
 */
async function _doRunWithHosts(
  targetHosts: any[],
  args: string[],
  environment: Record<string, string>
) {
  if ((form as any).need_audit) {
    return handleSubmitApproval(targetHosts, args, environment);
  }

  taskRunning.value = true;
  taskStatus.value = 'running';
  taskStatusText.value = t('message.pages.opsScript.statusRunning');
  taskId.value = 'TASK' + Date.now();
  currentBatchId = taskId.value;
  Object.keys(executionHostMap).forEach((k) => delete executionHostMap[k]);
  logList.value = [];
  hostLogs.value.clear();
  systemLogs.value = [];
  stat.success = 0;
  stat.fail = 0;
  stat.pending = targetHosts.length;
  runTime.value = 0;
  hasFailTask.value = false;

  const execMode: string = (form as any).exec_mode || 'parallel';
  appendLog(
    'INFO',
    t('message.pages.opsScript.logBatchStart', {
      mode: execMode === 'serial' ? t('message.pages.opsScript.execModeSerial') :
            execMode === 'pilot' ? t('message.pages.opsScript.execModePilot') : t('message.pages.opsScript.execModeParallel'),
      concurrent: form.exec_mode !== 'serial' ? form.concurrent : null,
      hosts: targetHosts.length,
      pilotCount: form.exec_mode === 'pilot' && targetHosts.length > 1 ? form.pilot_count : null,
      threshold: form.exec_mode === 'pilot' && targetHosts.length > 1 ? form.pilot_success_rate : null,
    })
  );

  const startTime = Date.now();
  timer = window.setInterval(() => {
    runTime.value = Math.floor((Date.now() - startTime) / 1000);
  }, 1000);

  if (form.exec_mode === 'pilot' && targetHosts.length > 1) {
    const pilotCount = Math.min(Math.max(1, form.pilot_count || 1), targetHosts.length - 1);
    const pilotHosts = targetHosts.slice(0, pilotCount);
    const restHosts = targetHosts.slice(pilotCount);
    appendLog('INFO', t('message.pages.opsScript.logPilotActivated', { pilotCount, restCount: restHosts.length, concurrent: form.concurrent }));

    const pilotSuccessStart = stat.success;
    const pilotFailStart = stat.fail;

    appendLog('INFO', t('message.pages.opsScript.logPilotPhase1Start', { pilotCount }));
    await runSerial(pilotHosts, args, environment);

    const pilotSuccessDone = stat.success - pilotSuccessStart;
    const pilotFailDone = stat.fail - pilotFailStart;
    const pilotRate = pilotCount > 0 ? Math.round((pilotSuccessDone / pilotCount) * 100) : 0;
    const threshold = Math.max(1, Math.min(100, form.pilot_success_rate || 100));

    appendLog('INFO', t('message.pages.opsScript.logPilotResult', { success: pilotSuccessDone, fail: pilotFailDone, rate: pilotRate, threshold }));

    if (!taskRunning.value) {
      appendLog('WARN', t('message.pages.opsScript.logPilotAborted'));
    } else if (pilotRate < threshold) {
      appendLog('ERROR', t('message.pages.opsScript.logPilotFail', { rate: pilotRate, threshold, restCount: restHosts.length }));
      if (restHosts.length > 0) {
        stat.pending -= restHosts.length;
      }
    } else if (restHosts.length === 0) {
      appendLog('INFO', t('message.pages.opsScript.logPilotPassNoRest'));
    } else {
      appendLog('SUCCESS', t('message.pages.opsScript.logPilotPass', { rate: pilotRate, threshold, restCount: restHosts.length }));
      appendLog('INFO', t('message.pages.opsScript.logPilotPhase2Start', { concurrent: form.concurrent, restCount: restHosts.length }));
      await runParallel(restHosts, args, environment);
    }
  } else if (form.exec_mode === 'serial') {
    await runSerial(targetHosts, args, environment);
  } else {
    await runParallel(targetHosts, args, environment);
  }

  if (timer !== null) clearInterval(timer);
  timer = null;
  taskRunning.value = false;
  closeAllWs();

  taskStatus.value = 'finish';
  taskStatusText.value = stat.fail > 0
    ? (stat.success === 0 ? t('message.pages.opsScript.statusFinishAllFail') : t('message.pages.opsScript.statusFinishPartialFail'))
    : t('message.pages.opsScript.statusFinishAllSuccess');
  hasFailTask.value = stat.fail > 0;

  appendLog('SUCCESS', t('message.pages.opsScript.logBatchDone', { success: stat.success, fail: stat.fail, time: runTime.value }));

  window.dispatchEvent(new CustomEvent('refresh-run-history'));
}

async function handleRunWithHosts(targetHosts: any[]) {
  const code = form.script_content;
  if (!code.trim()) {
    return ElMessage.warning(t('message.pages.opsScript.pleaseInputScriptContent'));
  }

  // Step 1: Risk keyword detection (first-level warning)
  const riskKeys = ['rm -rf', 'mkfs', 'drop database', 'format'];
  const isRisk = riskKeys.some((key) => code.toLowerCase().includes(key));
  if (isRisk) {
    try {
      await ElMessageBox.confirm(
        t('message.pages.opsScript.riskyScriptConfirm'),
        t('message.pages.opsScript.confirmRiskTitle'),
        { type: 'error', confirmButtonText: t('message.pages.opsScript.confirmExecuteBtn'), cancelButtonText: t('message.pages.opsScript.cancelBtn') }
      );
    } catch {
      return;
    }
  }

  // Step 2: Assemble execution params (same params used for dialog preview + final submit, avoid double parse)
  const { args, environment } = parseExecParams();

  // Step 2.5: If approval enabled with dynamic approvers, ensure userList is loaded so confirm dialog shows correct names
  const needAuditNow = !!(form as any).need_audit;
  const approvalCfg = (form as any).approval || {};
  if (
    needAuditNow &&
    ((approvalCfg.approver_ids?.length || 0) > 0 || (approvalCfg.countersign_ids?.length || 0) > 0) &&
    userList.value.length === 0
  ) {
    try {
      await loadUsers();
    } catch {
      /* ignore */
    }
  }

  // Step 3: Show "execution config confirm" dialog (gatekeeper) — _doRunWithHosts only called after final user confirmation
  confirmRunData.value = _buildConfirmRunData(targetHosts, args, environment, isRisk);
  _pendingRunContext = { hosts: targetHosts, args, environment };
  confirmRunVisible.value = true;
}

function handleStop() {
  const ids = Object.keys(wsConnections);
  if (ids.length > 0) {
    appendLog('INFO', t('message.pages.opsScript.logStopping', { count: ids.length }));
  }
  terminateAll();
  closeAllWs();
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  taskRunning.value = false;
  taskStatus.value = 'stop';
  taskStatusText.value = t('message.pages.opsScript.statusTerminatedManually');
  appendLog('ERROR', t('message.pages.opsScript.logTaskTerminated'));
  ElMessage.info(t('message.pages.opsScript.taskStopSent'));
}

function handleNewScript() {
  // Consistent with script library management: open full new script large dialog (5 tabs + full editor + risk check + advanced config)
  openCreateScriptDialog();
}

function clearEditor() {
  form.script_content = '';
}

// High-risk code detection
const riskCheckVisible = ref(false);
const riskCheckResult = ref<any>({
  risk_level: 'low',
  risk_level_display: t('message.pages.opsScript.riskLevelLow'),
  total_count: 0,
  error_count: 0,
  warning_count: 0,
  info_count: 0,
  tools_used: [],
  issues: [],
});
const riskChecking = ref(false);

async function checkRiskCode() {
  const code = form.script_content;
  if (!code || !code.trim()) {
    ElMessage.warning(t('message.pages.opsScript.pleaseInputScriptContent'));
    return;
  }
  riskChecking.value = true;
  try {
    // Map editor's internal sh/python to Shell/Python3 required by API
    const scriptType =
      form.script_type === 'python' ? 'Python3' :
      form.script_type === 'sh' ? 'Shell' :
      form.script_type;
    const res: any = await scriptLibraryApi.checkRisk(code, scriptType);
    if (res && res.data) {
      riskCheckResult.value = res.data;
    }
    riskCheckVisible.value = true;
  } catch (e: any) {
    ElMessage.error(e?.message || t('message.pages.opsScript.riskCheckFailed'));
  } finally {
    riskChecking.value = false;
  }
}

function clearLog() {
  logList.value = [];
  hostLogs.value.clear();
  systemLogs.value = [];
}

function downloadLog() {
  const lines: string[] = [];

  // System logs
  if (systemLogs.value.length > 0) {
    lines.push(t('message.pages.opsScript.logSectionSystem'));
    systemLogs.value.forEach((l) => lines.push(l.msg));
    lines.push('');
  }

  // Per-host logs
  if (hostLogList.value.length > 0) {
    lines.push(t('message.pages.opsScript.logSectionHost'));
    hostLogList.value.forEach((h) => {
      lines.push(`--- [${h.hostLabel}] ${h.status}${h.exitCode != null ? ` (exit_code=${h.exitCode})` : ''} ---`);
      h.entries.forEach((e) => lines.push(e.msg));
      lines.push('');
    });
  }

  // Compatibility: if no host logs, use old logList
  if (lines.length === 0 && logList.value.length > 0) {
    lines.push(t('message.pages.opsScript.logSectionAll'));
    logList.value.forEach((l) => lines.push(l.msg));
  }

  const text = lines.join('\n');
  if (!text.trim()) {
    return ElMessage.warning(t('message.pages.opsScript.logNoExport'));
  }
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = t('message.pages.opsScript.logDownloadFilename', { id: taskId.value || 'export' }) + '.txt';
  a.click();
}

function retryFailTask() {
  const failHosts = hostLogList.value.filter((h) => h.status === 'error' || h.status === 'terminated');
  if (failHosts.length === 0) {
    return ElMessage.warning(t('message.pages.opsScript.logNoFailHost'));
  }
  ElMessage.success(t('message.pages.opsScript.logFailIdentified', { count: failHosts.length }));
}

onMounted(async () => {
  await loadTreeData();
  const scriptId = route.query.id || route.query.script_id;
  const scriptName = route.query.name;
  // Three-layer fallback to read share_token:
  //   1) route.query.share_token (from activation page redirect, most authoritative)
  //   2) Session cache: written when activation page succeeds, solves F5 refresh losing query
  //   3) LocalStorage: cross-tab recovery (last resort, expiry verified by backend)
  const SHARE_TOK_KEY = 'taurus_share_script_token';
  let shareToken = route.query.share_token as string | undefined;
  if (!shareToken) {
    try {
      shareToken = (Session.get(SHARE_TOK_KEY) as string) || (localStorage.getItem(SHARE_TOK_KEY) || undefined);
    } catch { /* ignore */ }
  } else {
    // Got fresh token, persist it so refresh still works
    try {
      Session.set(SHARE_TOK_KEY, shareToken);
      localStorage.setItem(SHARE_TOK_KEY, shareToken);
      // Sync URL to include token (avoid losing token when user copies URL to others)
      if (!(route.query.share_token)) {
        router.replace({
          path: route.path,
          query: { ...route.query, share_token: shareToken, script_id: scriptId as any },
        }).catch(() => {});
      }
    } catch { /* ignore */ }
  }

  const applyDetailWithCheck = (detail: any, fallbackName?: string) => {
    if (!detail) {
      ElMessage.warning(t('message.pages.opsScript.scriptNotFoundOrNoPermission'));
      return false;
    }
    const statusCheck = isScriptRunnable(detail.status);
    if (!statusCheck.ok) {
      ElMessage.warning(
        t('message.pages.opsScript.scriptStatusCannotLoad', { name: detail.name || fallbackName || t('message.pages.opsScript.targetScript'), status: statusCheck.label }),
      );
      return false;
    }
    applyScriptDetailToForm(detail);
    ElMessage.success(t('message.pages.opsScript.scriptLoaded', { name: detail.name || fallbackName || t('message.pages.opsScript.targetScript') }));
    return true;
  };

  // 1) Priority: share redirect with share_token → call share-exclusive public API
  //    (Scripts shared by user may not be in user's library/visible range. This API validates permissions based on token itself, bypassing normal login restrictions)
  if (shareToken) {
    try {
      const res: any = await getShareResourceDetail(shareToken);
      const data = res?.data || res;
      const detail = data?.detail;
      if (!applyDetailWithCheck(detail, scriptName as string | undefined)) {
        // Don't give user a "failed" feeling when resource status validation fails
        return;
      }
      // Load success: record current origin from share_token, subsequent operations (execute etc.) take effect through session permissions
      return;
    } catch (e: any) {
      const msg = e?.message || '';
      const body = e?.response?.data || {};
      const bodyMsg = body.msg || '';
      const combinedMsg = msg || bodyMsg;
      const httpCode = e?.response?.status;
      const bizCode = body.code;
      // Multiple "need login" feature matches: HTTP/business 401/4001/4000 + login keywords + auth keywords
      const needLogin =
        httpCode === 401 || bizCode === 401 || bizCode === 4001 ||
        /login|auth|unauthenticated|unauthorized|not provided|authentication/i.test(combinedMsg);
      if (needLogin) {
        try {
          await ElMessageBox.confirm(
            t('message.pages.opsScript.shareNeedLoginConfirm'),
            t('message.pages.opsScript.shareNeedLoginTitle'),
            { confirmButtonText: t('message.pages.opsScript.goLoginBtn'), cancelButtonText: t('message.pages.opsScript.cancelBtn'), type: 'warning' },
          );
          router.push({ path: '/login', query: { redirect: encodeURIComponent(route.fullPath) } });
        } catch {
          // User cancelled
        }
        return;
      }
      // If share load fails (expired/revoked/invalid) → clear locally cached token to avoid repeated failures next time
      try {
        Session.remove(SHARE_TOK_KEY);
        localStorage.removeItem(SHARE_TOK_KEY);
      } catch { /* ignore */ }
      ElMessage.error(t('message.pages.opsScript.shareLoadFailed') + (combinedMsg ? t('message.pages.opsScript.colonWithMsg', { msg: combinedMsg }) : t('message.pages.opsScript.shareLoadFailedTip')));
      return;
    }
  }

  // 2) Only script_id (no share_token) goes to normal API: for scripts in user's own library
  if (scriptId) {
    const numericId = Number(scriptId);
    if (!isNaN(numericId)) {
      try {
        const res: any = await getScriptDetail(numericId);
        const detail = res?.data || res;
        applyDetailWithCheck(detail, scriptName as string | undefined);
      } catch (e: any) {
        const httpCode = e?.response?.status;
        const bizCode = e?.response?.data?.code;
        const msg = e?.message || '';
        const bodyMsg = e?.response?.data?.msg || '';
        const combinedMsg = msg || bodyMsg;
        // Multiple "auth failed" features: HTTP layer / DRF global code 401 / NotAuthenticated returns code 4000
        const authKeywords = /login|auth|unauthenticated|unauthorized|not provided|authentication/i;
        const isAuthError =
          httpCode === 401 || httpCode === 403 ||
          bizCode === 401 || bizCode === 4000 ||
          authKeywords.test(combinedMsg);
        // Multiple "not found" features: HTTP 404 / business 404 / text contains "not exist|no permission|address incorrect"
        const isNotFound =
          httpCode === 404 || bizCode === 404 ||
          /not found|not exist|no permission|resource does not exist|address incorrect/i.test(combinedMsg);
        if (isAuthError) {
          ElMessage.warning(t('message.pages.opsScript.needLoginToViewScript'));
        } else if (isNotFound) {
          ElMessage.warning(t('message.pages.opsScript.scriptNotFoundOrDeleted'));
        } else {
          ElMessage.error(t('message.pages.opsScript.loadScriptDetailFailed') + (combinedMsg ? t('message.pages.opsScript.colonWithMsg', { msg: combinedMsg }) : ''));
        }
      }
    }
  }
});

onBeforeUnmount(() => {
  closeAllWs();
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  // Clean up sidebar drag-to-resize residual global event listeners
  if (_resizeOnMove) {
    document.removeEventListener('mousemove', _resizeOnMove);
    _resizeOnMove = null;
  }
  if (_resizeOnUp) {
    document.removeEventListener('mouseup', _resizeOnUp);
    _resizeOnUp = null;
  }
});
</script>

<style scoped lang="scss">
.script-exec-page {
  width: 100%;
  height: calc(100vh - 85px - 50px);
  padding: 16px;
  box-sizing: border-box;
  min-height: 0;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

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

  .title {
    h2 {
      margin: 0;
      font-size: 18px;
      color: #333;
    }

    .desc {
      font-size: 12px;
      color: #999;
      margin-left: 12px;
    }
  }

  .header-btn-group {
    display: flex;
    gap: 10px;
  }
}

.page-main {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow: hidden;
  min-height: 0;
}

.left-tree-box {
  width: 240px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  min-height: 0;

  .tree-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #333;
    flex-shrink: 0;
  }
  :deep(.el-tree) {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }
}

.right-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  min-height: 0;
}

.editor-card {
  flex: 0 0 45%;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;

  .editor-toolbar {
    margin-bottom: 12px;
    display: flex;
    gap: 10px;
    align-items: center;
    flex-shrink: 0;
  }

  .monaco-editor-box {
    flex: 1;
    min-height: 0;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    overflow: hidden;
  }
}

.config-log-box {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow: hidden;
  min-height: 0;
}

.config-box {
  width: 40%;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: auto;
  flex-shrink: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;

  :deep(.el-tabs) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  :deep(.el-tabs__content) {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }
  :deep(.el-tab-pane) {
    height: 100%;
    min-height: 0;
  }

  .form-item {
    margin-bottom: 16px;
    display: flex;
    align-items: flex-start;
    gap: 8px;

    .label {
      flex: 0 0 100px;
      color: #666;
      white-space: nowrap;
      text-align: right;
      padding-top: 4px;
    }

    > :deep(.el-select),
    > :deep(.el-input-number),
    > :deep(.el-input),
    > .form-meta,
    > .exec-mode-group,
    > .advanced-btns {
      flex: 1;
      min-width: 0;
    }
  }

  .form-item.host-select-type-row,
  .form-item.host-group-row,
  .form-item.host-input-item {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .form-item.host-group-row > .el-button,
  .form-item.host-input-item > :deep(.el-input) {
    width: 100%;
  }

  .host-input-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .host-input-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    align-items: center;
    padding-top: 4px;
  }

  .host-stat {
    font-size: 12px;
    line-height: 20px;
    white-space: nowrap;

    &.host-stat-valid { color: #67c23a; }
    &.host-stat-notfound { color: #f56c6c; }
    &.host-stat-noperm { color: #e6a23c; }
  }

  .selected-host-tags {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.log-box {
  flex: 1;
  background: #161B22;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.log-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;

  .log-title {
    color: #fff;
    font-weight: 600;
  }

  .log-btn-group {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

// System logs section
.system-logs {
  flex-shrink: 0;
  border-bottom: 1px solid #333;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

// Host logs aggregated list
.host-logs {
  flex: 1;
  overflow: auto;
  font-size: 13px;
  line-height: 1.8;
  padding-right: 8px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  min-height: 0;
}

.log-empty {
  text-align: center;
  color: #666;
  padding: 40px 0;
  font-size: 14px;
}

// Single host log card
.host-log-item {
  border: 1px solid #30363d;
  border-radius: 6px;
  margin-bottom: 8px;
  overflow: hidden;
  transition: border-color 0.2s;

  &:hover {
    border-color: #58a6ff;
  }
}

.host-log-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #1f2428;
  cursor: pointer;
  user-select: none;
  font-size: 13px;

  &:hover {
    background: #262b31;
  }

  .expand-icon {
    color: #8b949e;
    transition: transform 0.2s;
    flex-shrink: 0;

    &.expanded {
      transform: rotate(90deg);
    }
  }

  .host-status-tag {
    flex-shrink: 0;
  }

  .host-name {
    color: #e6edf3;
    font-weight: 500;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .host-entry-count {
    color: #8b949e;
    font-size: 12px;
    flex-shrink: 0;
  }

  .host-exit-code {
    color: #8b949e;
    font-size: 12px;
    flex-shrink: 0;
  }

  .host-time {
    color: #6e7681;
    font-size: 12px;
    flex-shrink: 0;
  }
}

.host-log-body {
  padding: 8px 12px;
  background: #0d1117;
  max-height: 400px;
  overflow: auto;

  .log-line {
    padding: 2px 0;
    word-break: break-all;
    white-space: pre-wrap;
  }

  .no-log-entries {
    color: #666;
    font-size: 12px;
    padding: 4px 0;
  }
}

// Standalone log line (system logs + logs after host expansion)
.log-line {
  padding: 2px 0;
  word-break: break-all;
  white-space: pre-wrap;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.log-stat {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #333;
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #ccc;
  flex-shrink: 0;

  .stat-success { color: #67c23a; }
  .stat-fail { color: #f56c6c; }
  .stat-pending { color: #8b949e; }
}

.log-info {
  color: #f0f0f0;
}

.log-warn {
  color: #e6a23c;
}

.log-error {
  color: #f56c6c;
}

.log-success {
  color: #67c23a;
}

.page-footer {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  min-height: 0;

  .footer-right {
    display: flex;
    gap: 24px;
    color: #666;
    font-size: 14px;
  }
}

.tree-title {
  display: flex;
  align-items: center;
  width: 100%;
}

.custom-tree-node {
  display: inline-flex;
  align-items: center;
  width: 100%;
  padding: 2px 0;

  .node-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }

  .node-count {
    color: #909399;
    font-size: 12px;
    margin-left: 4px;
    flex-shrink: 0;
  }
}

.toolbar-info {
  display: inline-flex;
  align-items: center;
  margin-left: 12px;
}

.params-entry {
  width: 100%;

  > .label {
    display: none;
  }
}

.params-panel {
  flex: 1;
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px;
  background: #fafbfc;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.params-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.params-title {
  display: inline-flex;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.kv-quick-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 2px;
}

.kv-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kv-eq {
  color: #909399;
  font-weight: 600;
}

.params-panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 2px;
  border-top: 1px dashed #e4e7ed;
  margin-top: 2px;
  padding-top: 10px;
}

.quick-count-tip {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
}

.advanced-btn-wrap {
  display: inline-flex;
}

.params-toolbar {
  width: 100%;
}

.params-preview {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  max-height: 220px;
  overflow: auto;
  margin: 0;
}

.advanced-btns {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
}

.sub-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  margin-left: 100px;
  line-height: 1.5;
}

/* ============ Execute confirm dialog styles migrated to ExecutionConfirmDialog shared component ============ */

.form-meta {
  color: #909399;
  font-size: 13px;
}

.exec-mode-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin: 0;
  padding: 0;
}

.exec-mode-group > :deep(.el-radio) {
  margin: 0 !important;
}

.exec-mode-radio {
  display: flex !important;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100% !important;
  padding: 10px 12px !important;
  margin: 0 !important;
  border: 1px solid #dcdfe6 !important;
  border-radius: 6px !important;
  transition: all 0.2s ease;
  background: #fff;
  box-sizing: border-box !important;
  min-height: 56px;
  cursor: pointer;
  position: relative;

  &:hover {
    border-color: #b3d8ff !important;
    background: #f5faff;
  }

  :deep(.el-radio__input) {
    flex: 0 0 16px !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 16px !important;
    height: 16px !important;
    line-height: 16px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    margin-top: 2px !important;
  }

  :deep(.el-radio__inner) {
    width: 14px !important;
    height: 14px !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  :deep(.el-radio__label) {
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
    flex: 1 1 auto !important;
    padding: 0 0 0 10px !important;
    margin: 0 !important;
    line-height: 1.4 !important;
    width: auto !important;
  }
}

.exec-mode-radio.is-active,
.exec-mode-radio:has(:deep(.is-checked)) {
  border-color: #409eff !important;
  background: #ecf5ff !important;
  box-shadow: 0 1px 4px rgba(64, 158, 255, 0.15);
}

.exec-mode-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  padding: 0;
  margin: 0;
}

.exec-mode-title.pilot-title {
  color: #67c23a;
}

.exec-mode-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  padding: 0;
  margin: 0;
}

/* ==================== Sidebar: collapse + resize + search ==================== */

/* Search box (below tree-title) */
.tree-search-box {
  margin-bottom: 12px;
  padding: 0 2px;
}

/* Left tree container: remove default CSS fixed 240px width conflict (controlled via inline style instead) */
.left-tree-box {
  width: auto;
  min-width: 0;
  transition: width 0.2s ease-in-out;
  position: relative;

  /* Collapsed state: hide inner scrollable content, keep only 44px narrow edge with expand button */
  &.is-collapsed {
    padding: 12px 0;
    overflow: hidden;

    .tree-title {
      margin-bottom: 0;
      padding: 0 10px;
      justify-content: center;
    }
  }
}

/* Sidebar drag-to-resize bar */
.sidebar-resizer {
  width: 5px;
  flex: 0 0 5px;
  position: relative;
  cursor: col-resize;
  background: transparent;
  border-radius: 3px;
  transition: background 0.15s;
  flex-shrink: 0;

  &:hover,
  &:active {
    background: var(--el-color-primary-light-7, #c6e2ff);
  }

  /* Disable dragging after collapse */
  &.disabled {
    cursor: default;
    background: transparent;
    pointer-events: none;
  }
}

/* Preview dialog: script content bottom info row */
.preview-content-footer {
  margin-top: 8px;
  display: flex;
  align-items: center;
  padding: 0 4px;
}

/* Risk check result dialog styles */
.risk-check-result {
  .risk-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-radius: 8px;
    margin-bottom: 16px;

    &.high {
      background: #fef0f0;
      border: 1px solid #fbc4c4;
    }
    &.medium {
      background: #fdf6ec;
      border: 1px solid #f5dab1;
    }
    &.low {
      background: #f0f9eb;
      border: 1px solid #c2e7b0;
    }

    .risk-level {
      display: flex;
      align-items: center;
      gap: 12px;

      .level-text {
        font-size: 22px;
        font-weight: 600;

        .high & { color: #f56c6c; }
        .medium & { color: #e6a23c; }
        .low & { color: #67c23a; }
      }
    }

    .risk-stats {
      display: flex;
      gap: 24px;

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 48px;

        .num {
          font-size: 24px;
          font-weight: 600;
          line-height: 1.2;

          &.error { color: #f56c6c; }
          &.warning { color: #e6a23c; }
          &.info { color: #909399; }
        }
        .label {
          font-size: 12px;
          color: #909399;
          margin-top: 2px;
        }
      }
    }
  }

  .tools-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    font-size: 13px;
    color: #606266;

    .tools-label {
      color: #909399;
    }
  }

  .issues-list {
    max-height: 420px;
    overflow-y: auto;

    .list-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 10px;
    }
  }

  .issue-item {
    padding: 12px 14px;
    border-radius: 6px;
    margin-bottom: 10px;
    border-left: 4px solid #dcdfe6;

    &:last-child {
      margin-bottom: 0;
    }

    &.error {
      background: #fef0f0;
      border-left-color: #f56c6c;
    }
    &.warning {
      background: #fdf6ec;
      border-left-color: #e6a23c;
    }
    &.info, &.style {
      background: #f4f4f5;
      border-left-color: #909399;
    }

    .issue-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .issue-rule {
        font-family: monospace;
        font-size: 12px;
        color: #606266;
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 6px;
        border-radius: 3px;
      }
      .issue-line {
        font-size: 12px;
        color: #909399;
      }
      .issue-tool {
        margin-left: auto;
      }
    }

    .issue-message {
      font-size: 13px;
      color: #303133;
      line-height: 1.6;
      margin-bottom: 6px;
    }

    .issue-fix {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 12px;
      color: #67c23a;
      line-height: 1.5;
      padding-top: 6px;
      border-top: 1px dashed rgba(103, 194, 58, 0.3);

      .el-icon {
        margin-top: 1px;
        flex-shrink: 0;
      }
    }
  }

  .no-risk-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 50px 20px;
    color: #67c23a;
    font-size: 15px;
    background: #f0f9eb;
    border-radius: 8px;
  }
}

// Monaco editor height in create/edit script large dialog
.create-monaco-editor {
  width: 100%;
  height: 420px;
  margin-top: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}
</style>