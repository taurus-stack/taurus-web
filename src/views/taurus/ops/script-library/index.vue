<template>
  <div class="script-library-page">
    <!-- Top filter bar -->
    <div class="page-header">
      <div class="title">
        <h2>{{ t('message.pages.scriptLibrary.pageTitle') }}</h2>
        <span class="desc">{{ t('message.pages.scriptLibrary.pageDesc') }}</span>
      </div>
      <div class="header-operate">
        <el-input
          v-model="searchKey"
          :placeholder="t('message.pages.scriptLibrary.searchPlaceholder')"
          style="width: 260px"
          clearable
          @keyup.enter="getScriptList"
        />
        <el-button @click="toggleStatBoard">
          {{ showStatBoard ? t('message.pages.scriptLibrary.btnCollapseStat') : t('message.pages.scriptLibrary.btnExpandStat') }}
        </el-button>
        <el-button type="warning"
                   :disabled="!hasFeature('SCRIPT_APPROVAL_FLOW')"
                   :title="!hasFeature('SCRIPT_APPROVAL_FLOW') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                   class="ee-gate-card"
                   :class="{ 'is-ee-gate': !hasFeature('SCRIPT_APPROVAL_FLOW') }"
                   @click.capture="onApproveCenterBtnClick">
          <template #icon><fs-iconify v-if="!hasFeature('SCRIPT_APPROVAL_FLOW')" icon="material-symbols:workspace-premium-outline" /></template>
          {{ t('message.pages.scriptLibrary.btnApproveCenter') }}
          <el-badge :value="hasFeature('SCRIPT_APPROVAL_FLOW') ? pendingApproveCount : 0" :hidden="!pendingApproveCount || !hasFeature('SCRIPT_APPROVAL_FLOW')" class="approve-badge" />
        </el-button>
        <el-button @click="getScriptList">{{ t('message.pages.scriptLibrary.btnRefresh') }}</el-button>
        <el-button type="primary" @click="openCreateDialog">{{ t('message.pages.scriptLibrary.createTitleNew') }}</el-button>
        <el-button type="success" @click="handleInitOfficial">
          <el-icon style="margin-right: 4px"><Refresh /></el-icon>
          {{ t('message.pages.scriptLibrary.btnSyncOfficial') }}
        </el-button>
        <el-button @click="batchImport">{{ t('message.pages.scriptLibrary.btnBatchImport') }}</el-button>
        <el-button :disabled="!hasSelection" @click="batchExport">{{ t('message.pages.scriptLibrary.btnBatchExport') }}</el-button>
        <el-button
          type="danger"
          :disabled="!hasSelection || hasUndeletableInSelection"
          @click="batchDelete"
        >
          <el-tooltip v-if="hasUndeletableInSelection" :content="undeletableSelectionTip" placement="bottom">
            <span>{{ t('message.pages.scriptLibrary.btnBatchDelete') }}</span>
          </el-tooltip>
          <template v-else>{{ t('message.pages.scriptLibrary.btnBatchDelete') }}</template>
        </el-button>
      </div>
    </div>

    <!-- Statistics dashboard -->
    <div class="stat-board" v-show="showStatBoard">
      <!-- Core metric cards -->
      <div class="stat-card-row">
        <div class="stat-card">
          <div class="stat-num">{{ statData.totalScript }}</div>
          <div class="stat-label">{{ t('message.pages.scriptLibrary.statTotalScript') }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-num stat-blue">{{ statData.publicScript }}</div>
          <div class="stat-label">{{ t('message.pages.scriptLibrary.scopePublic') }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-num stat-green">{{ statData.todayExec }}</div>
          <div class="stat-label">{{ t('message.pages.scriptLibrary.statTodayExec') }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-num stat-orange">{{ statData.successRate }}%</div>
          <div class="stat-label">{{ t('message.pages.scriptLibrary.statSuccessRate') }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-num stat-red">{{ statData.riskScript }}</div>
          <div class="stat-label">{{ t('message.pages.scriptLibrary.statRiskScript') }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-num stat-purple">{{ pendingApproveCount }}</div>
          <div class="stat-label">{{ t('message.pages.scriptLibrary.statPendingApprove') }}</div>
        </div>
      </div>

      <!-- Chart section -->
      <div class="chart-row">
        <div class="chart-card">
          <div class="chart-title">{{ t('message.pages.scriptLibrary.chartTrend7Days') }}</div>
          <div ref="trendChartRef" class="chart-box"></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">{{ t('message.pages.scriptLibrary.chartTypeDist') }}</div>
          <div ref="typeChartRef" class="chart-box"></div>
        </div>
        <div class="chart-card">
          <div class="chart-title">{{ t('message.pages.scriptLibrary.chartResultRatio') }}</div>
          <div ref="resultChartRef" class="chart-box"></div>
        </div>
      </div>

      <!-- Top ranking -->
      <div class="top-row">
        <div class="top-card">
          <div class="chart-title">{{ t('message.pages.scriptLibrary.chartTop5Exec') }}</div>
          <el-table :data="topExecList" size="small" border stripe>
            <el-table-column type="index" :label="t('message.pages.scriptLibrary.colRank')" width="60" align="center" />
            <el-table-column prop="name" :label="t('message.pages.scriptLibrary.approveColScriptName')" />
            <el-table-column prop="count" :label="t('message.pages.scriptLibrary.taskColExecCount')" width="100" align="center" />
            <el-table-column prop="successRate" :label="t('message.pages.scriptLibrary.colSuccessRate')" width="100" align="center" />
          </el-table>
        </div>
      </div>
    </div>

    <div class="page-main">
      <!-- Left category tree -->
      <div class="left-tree-box">
        <div class="tree-title">
          <span>{{ t('message.pages.scriptLibrary.treeCategoryDir') }}</span>
          <el-button size="small" text type="primary" @click="openCategoryDialog()">{{ t('message.pages.scriptLibrary.btnManage') }}</el-button>
        </div>
        <el-tree
          ref="treeRef"
          :data="treeData"
          node-key="id"
          default-expand-all
          highlight-current
          @node-click="handleTreeClick"
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <span class="node-label">{{ node.label }}</span>
              <span v-if="data.count !== undefined" class="node-count">({{ data.count }})</span>
            </span>
          </template>
        </el-tree>
      </div>

      <!-- Right main content -->
      <div class="right-main">
        <!-- View tab switcher -->
        <div class="share-view-tabs">
          <el-tabs v-model="shareViewTab" type="card" @tab-change="onShareViewTabChange">
            <el-tab-pane :label="t('message.pages.scriptLibrary.filterAll')" name="all" />
            <el-tab-pane :label="t('message.pages.scriptLibrary.tabMine')" name="mine" />
            <el-tab-pane :label="t('message.pages.scriptLibrary.tabPublic')" name="public" />
            <el-tab-pane v-if="hasFeature('SCRIPT_SHARING')" :label="t('message.pages.scriptLibrary.tabSharedToMe')" name="shared_to_me" />
            <el-tab-pane v-if="hasFeature('SCRIPT_SHARING')" :label="t('message.pages.scriptLibrary.tabSharedByMe')" name="shared_by_me" />
          </el-tabs>
        </div>

        <!-- Script list -->
        <div class="table-card">
          <el-table
            v-model:selection="multipleSelection"
            :data="filteredScriptList"
            :row-key="(row: any) => row.id"
            @selection-change="onSelectionChange"
            border
            stripe
            size="small"
            height="100%"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column :label="t('message.pages.scriptLibrary.approveColScriptName')" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="script-name-cell">
                  <span>{{ row.name }}</span>
                  <el-tag v-if="row.isOfficial" type="primary" size="small" effect="dark" class="official-tag">{{ t('message.pages.scriptLibrary.officialTag') }}</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="type" :label="t('message.pages.scriptLibrary.createTypeLabel')" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="typeTagType(row.type)">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('message.pages.scriptLibrary.createCategoryLabel')" width="120" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.categoryName || row.category || '-' }}
              </template>
            </el-table-column>
            <el-table-column :label="t('message.pages.scriptLibrary.approveColRisk')" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.riskLevel" size="small" :type="riskTagType(row.riskLevel)">
                  {{ row.riskLevelDisplay || row.riskLevel }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="authType" :label="t('message.pages.scriptLibrary.permColGrantType')" width="100">
              <template #default="{ row }">
                <el-tag :type="authTagType(row.authType)" size="small">{{ row.authType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" :label="t('message.pages.scriptLibrary.formStatusLabel')" width="100">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="version" :label="t('message.pages.scriptLibrary.versionColVersion')" width="80" />
            <el-table-column prop="creator" :label="t('message.pages.scriptLibrary.colCreator')" width="100" />
            <el-table-column v-if="hasFeature('SCRIPT_SHARING')" :label="t('message.pages.scriptLibrary.colShareTarget')" :width="shareViewTab === 'all' ? 90 : 120" align="center">
              <template #default="{ row }">
                <el-tooltip placement="top" :disabled="!row.share_summary || row.share_summary.total <= 0">
                  <template #content>
                    <div class="share-tip-box" v-if="row.share_summary && row.share_summary.total">
                      <div v-if="row.share_summary.direct_count" style="margin-bottom:6px">
                        <b>{{ t('message.pages.scriptLibrary.shareDirect') }}（{{ row.share_summary.direct_count }}）</b>
                        <div style="max-height:120px;overflow:auto;font-size:12px;margin-top:4px">
                          <div v-for="(s, i) in row.share_summary.subjects" :key="'sub-'+i" style="padding:2px 0">
                            <el-tag size="small" effect="plain" style="margin-right:4px">{{ s.subject_type_label }}</el-tag>
                            <span>{{ s.subject_name }}</span>
                            <span style="color:#909399;margin-left:4px" v-if="s.perm_count">{{ s.perm_count }}{{ t('message.pages.scriptLibrary.unitPermCount') }}</span>
                            <span style="color:#e6a23c" v-if="s.expire_time"> ⏳{{ formatExpire(s.expire_time) }}</span>
                          </div>
                        </div>
                      </div>
                      <div v-if="row.share_summary.link_count">
                        <b>{{ t('message.pages.scriptLibrary.shareLink') }}（{{ row.share_summary.link_count }}）</b>
                        <div style="max-height:100px;overflow:auto;font-size:12px;margin-top:4px">
                          <div v-for="(l, i) in row.share_summary.links" :key="'lk-'+i" style="padding:2px 0">
                            <el-tag size="small" type="warning" effect="plain" style="margin-right:4px">
                              {{ l.scope === 'anyone' ? t('message.pages.scriptLibrary.linkScopeAnyone') : t('message.pages.scriptLibrary.linkScopeLogin') }}
                            </el-tag>
                            <span>{{ l.name }}</span>
                            <span style="color:#909399;margin-left:4px">{{ l.access_count }}/{{ l.max_access || '∞' }}{{ t('message.pages.scriptLibrary.unitTimes') }}</span>
                            <span style="color:#e6a23c" v-if="l.expire_time"> ⏳{{ formatExpire(l.expire_time) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span v-else>{{ t('message.pages.scriptLibrary.shareNone') }}</span>
                  </template>
                  <div class="share-cell" v-if="row.share_summary && row.share_summary.total">
                    <!-- All tab: show only summary "Shared N" -->
                    <el-tag v-if="shareViewTab === 'all'" size="small" type="success" effect="plain">
                      {{ t('message.pages.scriptLibrary.shared') }} {{ row.share_summary.total }}
                    </el-tag>
                    <!-- Other tabs: show detailed breakdown (Direct / Link) -->
                    <template v-else>
                      <el-tag size="small" type="primary" effect="plain" v-if="row.share_summary.direct_count">
                        {{ t('message.pages.scriptLibrary.shareDirectShort') }} {{ row.share_summary.direct_count }}
                      </el-tag>
                      <el-tag size="small" type="warning" effect="plain" v-if="row.share_summary.link_count" style="margin-left:2px">
                        {{ t('message.pages.scriptLibrary.shareLinkShort') }} {{ row.share_summary.link_count }}
                      </el-tag>
                    </template>
                  </div>
                  <span style="color:#c0c4cc" v-else>-</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="updateTime" :label="t('message.pages.scriptLibrary.colUpdateTime')" min-width="180" show-overflow-tooltip />
            <el-table-column :label="t('message.pages.scriptLibrary.colAction')" :min-width="row => row.isOfficial ? 220 : 360" fixed="right">
              <template #default="{ row }">
                <template v-if="row.isOfficial">
                  <el-button size="small" text type="info" @click="openScriptView(row)">{{ t('message.pages.scriptLibrary.versionActionView') }}</el-button>
                  <el-tooltip v-if="!canExecScript(row).ok" :content="canExecScript(row).reason" placement="top">
                    <el-button size="small" text type="success" disabled>{{ t('message.pages.scriptLibrary.actionQuickExec') }}</el-button>
                  </el-tooltip>
                  <el-button v-else size="small" text type="success" @click="goExecPage(row)">{{ t('message.pages.scriptLibrary.actionQuickExec') }}</el-button>
                  <el-tooltip v-if="!hasSharePerm(row, 'script:copy')" :content="t('message.pages.scriptLibrary.reasonNoSharePermManage') + ': script:copy'" placement="top">
                    <el-button size="small" text disabled>{{ t('message.pages.scriptLibrary.actionSaveAs') }}</el-button>
                  </el-tooltip>
                  <el-button v-else size="small" text @click="saveAsScript(row)">{{ t('message.pages.scriptLibrary.actionSaveAs') }}</el-button>
                  <el-tooltip v-if="!hasSharePerm(row, 'script:view_version')" :content="t('message.pages.scriptLibrary.reasonNoSharePermManage') + ': script:view_version'" placement="top">
                    <el-button size="small" text disabled>{{ t('message.pages.scriptLibrary.officialSyncVersion') }}</el-button>
                  </el-tooltip>
                  <el-button v-else size="small" text @click="openVersionDialog(row)">{{ t('message.pages.scriptLibrary.officialSyncVersion') }}</el-button>
                  <el-tooltip v-if="!canAuditLog(row).ok" :content="canAuditLog(row).reason" placement="top">
                    <el-button size="small" text disabled>{{ t('message.pages.scriptLibrary.actionAudit') }}</el-button>
                  </el-tooltip>
                  <el-button v-else size="small" text @click="openAuditDialog(row)">{{ t('message.pages.scriptLibrary.actionAudit') }}</el-button>
                </template>
                <template v-else>
                  <el-button size="small" text type="info" @click="openScriptView(row)">{{ t('message.pages.scriptLibrary.versionActionView') }}</el-button>
                  <el-tooltip v-if="!canEditScript(row).ok" :content="canEditScript(row).reason" placement="top">
                    <el-button size="small" text type="primary" disabled>{{ t('message.pages.scriptLibrary.actionEdit') }}</el-button>
                  </el-tooltip>
                  <el-button v-else size="small" text type="primary" @click="openEditDialog(row)">{{ t('message.pages.scriptLibrary.actionEdit') }}</el-button>

                  <el-tooltip v-if="!canManageVersion(row).ok" :content="canManageVersion(row).reason" placement="top">
                    <el-button size="small" text disabled>{{ t('message.pages.scriptLibrary.actionVersionManage') }}</el-button>
                  </el-tooltip>
                  <el-button v-else size="small" text @click="openVersionDialog(row)">{{ t('message.pages.scriptLibrary.actionVersionManage') }}</el-button>

                  <template v-if="row.authType === 'public'">
                    <el-tooltip v-if="!canConfigPermission(row).ok" :content="canConfigPermission(row).reason" placement="top">
                      <el-button size="small" text disabled>{{ t('message.pages.scriptLibrary.actionPermConfig') }}</el-button>
                    </el-tooltip>
                    <el-button v-else size="small" text @click="openPermissionDialog(row)">{{ t('message.pages.scriptLibrary.actionPermConfig') }}</el-button>
                  </template>

                  <el-tooltip v-if="!canManageShare(row).ok" :content="canManageShare(row).reason" placement="top">
                    <el-button size="small" text disabled>{{ t('message.pages.scriptLibrary.actionShare') }}</el-button>
                  </el-tooltip>
                  <el-button v-else size="small" text type="warning" @click="openShareManage(row)">
                    <el-icon style="margin-right: 2px"><Share /></el-icon>{{ t('message.pages.scriptLibrary.actionShare') }}
                  </el-button>

                  <el-tooltip v-if="!canConfigTask(row).ok" :content="canConfigTask(row).reason" placement="top">
                    <el-button size="small" text disabled>{{ t('message.pages.scriptLibrary.actionScheduledTask') }}</el-button>
                  </el-tooltip>
                  <el-button v-else size="small" text @click="openTaskDialog(row)">{{ t('message.pages.scriptLibrary.actionScheduledTask') }}</el-button>

                  <el-tooltip v-if="!canAuditLog(row).ok" :content="canAuditLog(row).reason" placement="top">
                    <el-button size="small" text disabled>{{ t('message.pages.scriptLibrary.actionAuditLog') }}</el-button>
                  </el-tooltip>
                  <el-button v-else size="small" text @click="openAuditDialog(row)">{{ t('message.pages.scriptLibrary.actionAuditLog') }}</el-button>

                  <el-tooltip v-if="!canExecScript(row).ok" :content="canExecScript(row).reason" placement="top">
                    <el-button size="small" text type="success" disabled>{{ t('message.pages.scriptLibrary.actionQuickExec') }}</el-button>
                  </el-tooltip>
                  <el-button v-else size="small" text type="success" @click="goExecPage(row)">{{ t('message.pages.scriptLibrary.actionQuickExec') }}</el-button>

                  <el-button size="small" text @click="copyScript(row)">{{ t('message.pages.scriptLibrary.hostOutputCopy') }}</el-button>

                  <template v-if="!isArchivedStatus(row)">
                    <el-tooltip v-if="!canChangeScriptStatus(row).ok" :content="canChangeScriptStatus(row).reason" placement="top">
                      <el-button size="small" text disabled>
                        {{ getScriptStatusCode(row) === SCRIPT_STATUS_NORMAL ? t('message.pages.scriptLibrary.optOffline') : t('message.pages.scriptLibrary.formStatusEnabled') }}
                      </el-button>
                    </el-tooltip>
                    <el-button
                      v-else
                      size="small"
                      text
                      :type="getScriptStatusCode(row) === SCRIPT_STATUS_NORMAL ? 'warning' : 'success'"
                      @click="changeStatus(row)"
                    >
                      {{ getScriptStatusCode(row) === SCRIPT_STATUS_NORMAL ? t('message.pages.scriptLibrary.optOffline') : t('message.pages.scriptLibrary.formStatusEnabled') }}
                    </el-button>

                    <el-tooltip v-if="!canArchiveScript(row).ok" :content="canArchiveScript(row).reason" placement="top">
                      <el-button size="small" text type="info" disabled>{{ t('message.pages.scriptLibrary.actionArchive') }}</el-button>
                    </el-tooltip>
                    <el-button
                      v-else
                      size="small"
                      text
                      type="info"
                      @click="handleArchive(row)"
                    >
                      {{ t('message.pages.scriptLibrary.actionArchive') }}
                    </el-button>
                  </template>

                  <el-button
                    v-if="isArchivedStatus(row)"
                    size="small"
                    text
                    type="warning"
                    @click="handleUnarchive(row)"
                  >
                    {{ t('message.pages.scriptLibrary.actionUnarchive') }}
                  </el-button>

                  <el-tooltip v-if="!canDeleteScript(row).ok" :content="canDeleteScript(row).reason" placement="top">
                    <el-button size="small" text type="danger" disabled>{{ t('message.pages.scriptLibrary.actionDelete') }}</el-button>
                  </el-tooltip>
                  <el-button
                    v-else
                    size="small"
                    text
                    type="danger"
                    @click="deleteScript(row)"
                  >
                    {{ t('message.pages.scriptLibrary.actionDelete') }}
                  </el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <!-- Pagination moved out of .table-card to avoid clipping by height:100% + overflow:hidden -->
        <div class="pagination-bar">
          <el-pagination
            v-model:current-page="page.current"
            v-model:page-size="page.size"
            :total="page.total"
            layout="total, prev, pager, next, jumper"
            @change="getScriptList"
          />
        </div>
      </div>
    </div>

    <!-- Create/Edit/View script dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="viewScriptMode ? t('message.pages.scriptLibrary.createTitleView') : (isEditMode ? t('message.pages.scriptLibrary.auditEdit') : t('message.pages.scriptLibrary.createTitleNew'))"
      width="90%"
      top="4vh"
      destroy-on-close
    >
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane :label="t('message.pages.scriptLibrary.taskCardBaseInfo')" name="base">
          <el-form :model="scriptForm" label-width="120px" size="small">
            <el-form-item :label="t('message.pages.scriptLibrary.approveColScriptName')" required>
              <el-input v-model="scriptForm.name" :placeholder="t('message.pages.scriptLibrary.createNamePlaceholder')" :disabled="viewScriptMode || !detailHasPerm('script:edit')" />
            </el-form-item>
            <el-form-item :label="t('message.pages.scriptLibrary.createTypeLabel')" required>
              <el-select v-model="scriptForm.type" :placeholder="t('message.pages.scriptLibrary.createTypePlaceholder')" style="width: 100%" :disabled="viewScriptMode || !detailHasPerm('script:edit')">
                <el-option label="Shell" value="Shell" />
                <el-option label="Python3" value="Python3" />
                <el-option label="PowerShell" value="PowerShell" />
                <el-option label="Bat" value="Bat" />
                <el-option label="SQL" value="SQL" />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('message.pages.scriptLibrary.createCategoryLabel')" required>
              <el-tag v-if="viewScriptMode || !detailHasPerm('script:edit')" effect="plain" type="warning">
                <el-icon style="margin-right: 4px"><Folder /></el-icon>
                {{ formCategoryLabel }}
              </el-tag>
              <el-tree-select
                v-else
                v-model="scriptForm.category"
                :data="categoryTreeOptions"
                :props="{ label: 'label', value: 'value', children: 'children' }"
                clearable
                :placeholder="t('message.pages.scriptLibrary.createCategoryPlaceholder')"
                style="width: 100%"
                check-strictly
                :render-after-expand="false"
              />
            </el-form-item>
            <el-form-item :label="t('message.pages.scriptLibrary.createAuthLabel')">
              <el-radio-group v-model="scriptForm.authType" :disabled="viewScriptMode || !detailHasPerm('script:edit')">
                <el-radio value="private">{{ t('message.pages.scriptLibrary.scopePrivate') }}</el-radio>
                <el-radio value="public">{{ t('message.pages.scriptLibrary.scopePublic') }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item :label="t('message.pages.scriptLibrary.createTagsLabel')">
              <el-input v-model="scriptForm.tags" :placeholder="t('message.pages.scriptLibrary.createTagsPlaceholder')" :disabled="viewScriptMode || !detailHasPerm('script:edit')" />
            </el-form-item>
            <el-form-item :label="t('message.pages.scriptLibrary.createDescLabel')">
              <el-input
                v-model="scriptForm.desc"
                type="textarea"
                :rows="4"
                :placeholder="t('message.pages.scriptLibrary.createDescPlaceholder')"
                :disabled="viewScriptMode || !detailHasPerm('script:edit')"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane :label="t('message.pages.scriptLibrary.createTabContent')" name="content">
          <div v-if="!viewScriptMode && detailHasPerm('script:edit') && detailHasPerm('script:view_content')" class="editor-toolbar">
            <el-button size="small" @click="formatCode">{{ t('message.pages.scriptLibrary.createBtnFormat') }}</el-button>
            <el-button size="small" :loading="riskChecking" @click="checkRiskCode">{{ t('message.pages.scriptLibrary.createBtnRiskCheck') }}</el-button>
            <el-button size="small" @click="uploadScriptFile">{{ t('message.pages.scriptLibrary.createBtnImport') }}</el-button>
            <el-button size="small" @click="clearEditor">{{ t('message.pages.scriptLibrary.createBtnClear') }}</el-button>
          </div>
          <div ref="scriptEditorRef" class="ace-editor-box script-monaco-editor"></div>
        </el-tab-pane>

        <!-- Risk check result dialog -->
        <el-dialog v-model="riskCheckVisible" :title="t('message.pages.scriptLibrary.riskDialogTitle')" width="620px" :close-on-click-modal="true">
          <div class="risk-check-result">
            <!-- Top summary -->
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
                  <span class="label">{{ t('message.pages.scriptLibrary.severityError') }}</span>
                </div>
                <div class="stat-item">
                  <span class="num warning">{{ riskCheckResult.warning_count || 0 }}</span>
                  <span class="label">{{ t('message.pages.scriptLibrary.severityWarning') }}</span>
                </div>
                <div class="stat-item">
                  <span class="num info">{{ riskCheckResult.info_count || 0 }}</span>
                  <span class="label">{{ t('message.pages.scriptLibrary.severityInfo') }}</span>
                </div>
              </div>
            </div>

            <!-- Tools info -->
            <div class="tools-info" v-if="riskCheckResult.tools_used && riskCheckResult.tools_used.length > 0">
              <span class="tools-label">{{ t('message.pages.scriptLibrary.riskToolsLabel') }}</span>
              <el-tag v-for="tool in riskCheckResult.tools_used" :key="tool" size="small" type="info" effect="plain">
                {{ tool }}
              </el-tag>
            </div>

            <!-- Issues list -->
            <div v-if="riskCheckResult.issues && riskCheckResult.issues.length > 0" class="issues-list">
              <div class="list-title">{{ t('message.pages.scriptLibrary.riskIssuesTitlePrefix') }}{{ riskCheckResult.issues.length }}）</div>

              <div v-for="(issue, index) in riskCheckResult.issues" :key="index" :class="['issue-item', issue.severity]">
                <div class="issue-header">
                  <el-tag :type="issue.severity === 'error' ? 'danger' : issue.severity === 'warning' ? 'warning' : 'info'" size="small" effect="dark">
                    {{ issue.severity_display }}
                  </el-tag>
                  <span class="issue-rule" v-if="issue.rule_id">{{ issue.rule_id }}</span>
                  <span class="issue-line" v-if="issue.line">{{ t('message.pages.scriptLibrary.riskLinePrefix') }}{{ issue.line }}{{ t('message.pages.scriptLibrary.riskLineSuffix') }}</span>
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
              <span>{{ t('message.pages.scriptLibrary.riskSafeMsg') }}</span>
            </div>
          </div>
          <template #footer>
            <el-button type="primary" @click="riskCheckVisible = false">{{ t('message.pages.scriptLibrary.riskBtnOK') }}</el-button>
          </template>
        </el-dialog>
        <el-tab-pane :label="t('message.pages.scriptLibrary.createTabParams')" name="params">
          <el-table :data="scriptParamList" border size="small">
            <el-table-column prop="key" :label="t('message.pages.scriptLibrary.createParamKeyPlaceholder')" width="140">
              <template #default="{ row }">
                <el-input v-model="row.key" size="small" :placeholder="t('message.pages.scriptLibrary.createParamKeyPlaceholder')" :disabled="viewScriptMode || !detailHasPerm('script:edit') || !detailHasPerm('script:view_content')" />
              </template>
            </el-table-column>
            <el-table-column prop="value" :label="t('message.pages.scriptLibrary.createEnvValueCol')">
              <template #default="{ row }">
                <el-input v-model="row.value" size="small" :placeholder="t('message.pages.scriptLibrary.createEnvValueCol')" :disabled="viewScriptMode || !detailHasPerm('script:edit') || !detailHasPerm('script:view_content')" />
              </template>
            </el-table-column>
            <el-table-column prop="desc" :label="t('message.pages.scriptLibrary.createParamDescCol')">
              <template #default="{ row }">
                <el-input v-model="row.desc" size="small" :placeholder="t('message.pages.scriptLibrary.createEnvDescCol')" :disabled="viewScriptMode || !detailHasPerm('script:edit') || !detailHasPerm('script:view_content')" />
              </template>
            </el-table-column>
            <el-table-column v-if="!viewScriptMode && detailHasPerm('script:edit') && detailHasPerm('script:view_content')" :label="t('message.pages.scriptLibrary.colAction')" width="70">
              <template #default="{ $index }">
                <el-button size="small" type="danger" link @click="scriptParamList.splice($index, 1)">
                  {{ t('message.pages.scriptLibrary.actionDelete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button v-if="!viewScriptMode && detailHasPerm('script:edit') && detailHasPerm('script:view_content')" size="small" style="margin-top: 10px" @click="scriptParamList.push({ key: '', value: '', desc: '' })">
            {{ t('message.pages.scriptLibrary.createParamAdd') }}
          </el-button>
        </el-tab-pane>
        <el-tab-pane :label="t('message.pages.scriptLibrary.taskFormEnvs')" name="envs">
          <el-table :data="scriptEnvList" border size="small">
            <el-table-column prop="key" :label="t('message.pages.scriptLibrary.taskEnvKeyPlaceholder')" width="180">
              <template #default="{ row }">
                <el-input v-model="row.key" size="small" :placeholder="t('message.pages.scriptLibrary.createEnvKeyExample')" :disabled="viewScriptMode || !detailHasPerm('script:edit') || !detailHasPerm('script:view_content')" />
              </template>
            </el-table-column>
            <el-table-column prop="value" :label="t('message.pages.scriptLibrary.createEnvValueCol')">
              <template #default="{ row }">
                <el-input v-model="row.value" size="small" :placeholder="t('message.pages.scriptLibrary.createEnvValuePlaceholder')" :disabled="viewScriptMode || !detailHasPerm('script:edit') || !detailHasPerm('script:view_content')" />
              </template>
            </el-table-column>
            <el-table-column prop="desc" :label="t('message.pages.scriptLibrary.createEnvDescCol')">
              <template #default="{ row }">
                <el-input v-model="row.desc" size="small" :placeholder="t('message.pages.scriptLibrary.createEnvDescPlaceholder')" :disabled="viewScriptMode || !detailHasPerm('script:edit') || !detailHasPerm('script:view_content')" />
              </template>
            </el-table-column>
            <el-table-column v-if="!viewScriptMode && detailHasPerm('script:edit') && detailHasPerm('script:view_content')" :label="t('message.pages.scriptLibrary.colAction')" width="70">
              <template #default="{ $index }">
                <el-button size="small" type="danger" link @click="scriptEnvList.splice($index, 1)">
                  {{ t('message.pages.scriptLibrary.actionDelete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button v-if="!viewScriptMode && detailHasPerm('script:edit') && detailHasPerm('script:view_content')" size="small" style="margin-top: 10px" @click="scriptEnvList.push({ key: '', value: '', desc: '' })">
            {{ t('message.pages.scriptLibrary.createEnvAdd') }}
          </el-button>
        </el-tab-pane>
        <el-tab-pane :label="t('message.pages.scriptLibrary.createTabAdvanced')" name="advance">
          <el-form :model="scriptForm" label-width="140px" size="small">
            <el-form-item :label="t('message.pages.scriptLibrary.createConcurrentLabel')">
              <el-input-number v-model="scriptForm.concurrent" :min="1" :max="50" :disabled="viewScriptMode || !detailHasPerm('script:edit')" />
            </el-form-item>
            <el-form-item :label="t('message.pages.scriptLibrary.createTimeoutLabel')">
              <el-input-number v-model="scriptForm.timeout" :min="10" :max="3600" :disabled="viewScriptMode || !detailHasPerm('script:edit')" />
            </el-form-item>
            <el-form-item :label="t('message.pages.scriptLibrary.createFailStrategyLabel')">
              <el-select v-model="scriptForm.failStrategy" style="width: 100%" :disabled="viewScriptMode || !detailHasPerm('script:edit')">
                <el-option :label="t('message.pages.scriptLibrary.failStrategyStop')" value="stop" />
                <el-option :label="t('message.pages.scriptLibrary.failStrategyContinue')" value="continue" />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('message.pages.scriptLibrary.createLogRetentionLabel')">
              <el-input-number v-model="scriptForm.logRetention" :min="7" :max="36500" :disabled="viewScriptMode || !detailHasPerm('script:edit')" />
            </el-form-item>
            <el-form-item :label="t('message.pages.scriptLibrary.createRiskCheckLabel')">
              <el-switch v-model="scriptForm.openRiskCheck" :disabled="viewScriptMode || !detailHasPerm('script:edit')" />
            </el-form-item>
            <el-form-item :label="t('message.pages.scriptLibrary.createNeedAuditLabel')">
              <el-switch v-model="scriptForm.needAudit" :disabled="viewScriptMode || !detailHasPerm('script:edit')" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ viewScriptMode ? t('message.pages.scriptLibrary.optClose') : t('message.pages.scriptLibrary.formCancel') }}</el-button>
        <el-button v-if="!viewScriptMode && detailHasPerm('script:edit')" type="primary" @click="saveScript">{{ t('message.pages.scriptLibrary.formSave') }}</el-button>
      </template>
    </el-dialog>

    <!-- Version management dialog -->
    <el-dialog v-model="versionDialogVisible" :title="t('message.pages.scriptLibrary.versionDialogTitle')" width="85%" top="5vh" destroy-on-close @close="destroyVersionEditor">
      <div class="version-container">
        <!-- Left version list -->
        <div class="version-list">
          <div class="version-list-header">
            <span>{{ t('message.pages.scriptLibrary.versionHistory') }}</span>
            <span class="version-count">{{ t('message.pages.scriptLibrary.versionCountPrefix') }}{{ versionList.length }}{{ t('message.pages.scriptLibrary.versionCountSuffix') }}</span>
          </div>
          <div class="version-list-content">
            <div
              v-for="item in versionList"
              :key="item.version"
              :class="['version-item', {active: currentVersion === item.version}]"
              @click="viewVersion(item)"
            >
              <div class="version-top">
                <span class="version-tag">{{ item.version }}</span>
                <el-tag v-if="item.isCurrent" type="success" size="small">{{ t('message.pages.scriptLibrary.officialSyncCurrentVersion') }}</el-tag>
              </div>
              <div class="version-desc">{{ item.remark || t('message.pages.scriptLibrary.versionNoRemark') }}</div>
              <div class="version-meta">
                <span>{{ item.creator }}</span>
                <span>{{ item.updateTime }}</span>
              </div>
              <div class="version-actions">
                <el-button size="small" text @click.stop="toggleCompare(item)">
                  {{ compareMode && selectedOldVersion === item.version ? t('message.pages.scriptLibrary.versionCancelCompare') : t('message.pages.scriptLibrary.optCompare') }}
                </el-button>
                <template v-if="!item.isCurrent">
                  <el-tooltip v-if="!canManageVersion(currentScript).ok" :content="canManageVersion(currentScript).reason" placement="top">
                    <el-button size="small" text type="primary" disabled>{{ t('message.pages.scriptLibrary.versionActionRollback') }}</el-button>
                  </el-tooltip>
                  <el-button v-else size="small" text type="primary" @click.stop="rollbackVersion(item)">{{ t('message.pages.scriptLibrary.versionActionRollback') }}</el-button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Right code display/comparison area -->
        <div class="version-code">
          <div class="code-header">
            <span v-if="!compareMode">{{ t('message.pages.scriptLibrary.versionCodePreview') }} - {{ currentVersion }}</span>
            <span v-else>{{ t('message.pages.scriptLibrary.versionCompareTitle') }}：{{ selectedOldVersion }} → {{ currentVersion }}</span>
            <el-button v-if="compareMode" size="small" @click="exitCompare">{{ t('message.pages.scriptLibrary.versionExitCompare') }}</el-button>
          </div>
          <div id="version-monaco" class="version-monaco-box"></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="versionDialogVisible = false">{{ t('message.pages.scriptLibrary.createClose') }}</el-button>
      </template>
    </el-dialog>

    <!-- Permission config dialog -->
    <el-dialog v-model="permissionDialogVisible" :title="t('message.pages.scriptLibrary.permDialogTitle')" width="60%" top="8vh" destroy-on-close>
      <div class="auth-header">
        <span>{{ t('message.pages.scriptLibrary.auditCurrentScriptLabel') }}<b>{{ currentScript?.name }}</b></span>
        <el-button type="primary" size="small" @click="openAddAuth">{{ t('message.pages.scriptLibrary.permAddAuth') }}</el-button>
      </div>

      <el-table :data="authList" border stripe size="small">
        <el-table-column prop="subjectName" :label="t('message.pages.scriptLibrary.permColSubjectName')" min-width="140" />
        <el-table-column prop="subjectType" :label="t('message.pages.scriptLibrary.permSubjectTypeLabel')" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.subjectType === 'user' ? t('message.pages.scriptLibrary.permUser') : t('message.pages.scriptLibrary.permRole') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="authType" :label="t('message.pages.scriptLibrary.permColGrantType')" width="120">
          <template #default="{ row }">
            <el-tag :type="authTypeTag(row.authType)" size="small">{{ authTypeText(row.authType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="grantUser" :label="t('message.pages.scriptLibrary.permColGrantUser')" width="100" />
        <el-table-column prop="grantTime" :label="t('message.pages.scriptLibrary.permColGrantTime')" min-width="160" />
        <el-table-column :label="t('message.pages.scriptLibrary.colAction')" width="100" fixed="right">
          <template #default="{ row, $index }">
            <el-button size="small" text type="danger" @click="removeAuth($index)">{{ t('message.pages.scriptLibrary.permRemove') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Add authorization form -->
      <div class="add-auth-form" v-if="showAddAuth">
        <el-divider>{{ t('message.pages.scriptLibrary.permAddAuth') }}</el-divider>
        <el-form :model="authForm" inline size="small">
          <el-form-item :label="t('message.pages.scriptLibrary.permSubjectTypeLabel')">
            <el-select v-model="authForm.subjectType" style="width: 120px">
              <el-option :label="t('message.pages.scriptLibrary.permUser')" value="user" />
              <el-option :label="t('message.pages.scriptLibrary.permRole')" value="role" />
            </el-select>
          </el-form-item>
          <el-form-item :label="'选择' + t('message.pages.scriptLibrary.permUser') + '/' + t('message.pages.scriptLibrary.permRole')">
            <el-select v-model="authForm.subjectId" :placeholder="t('message.pages.scriptLibrary.permPlaceholderSelect')" style="width: 180px" filterable>
              <el-option-group :label="t('message.pages.scriptLibrary.permUser')">
                <el-option label="运维工程师A" value="user1" />
                <el-option label="运维工程师B" value="user2" />
                <el-option :label="'系统' + t('message.pages.scriptLibrary.btnManage') + '员'" value="user3" />
                <el-option label="测试工程师" value="user4" />
                <el-option label="开发工程师" value="user5" />
              </el-option-group>
              <el-option-group :label="t('message.pages.scriptLibrary.permRole')">
                <el-option label="研发组" value="role1" />
                <el-option :label="t('message.pages.scriptLibrary.btnManage') + '员组'" value="role2" />
                <el-option label="运维组" value="role3" />
                <el-option label="测试组" value="role4" />
                <el-option label="访客组" value="role5" />
              </el-option-group>
            </el-select>
          </el-form-item>
          <el-form-item :label="t('message.pages.scriptLibrary.permColGrantType')">
            <el-select v-model="authForm.authType" style="width: 140px">
              <el-option :label="t('message.pages.scriptLibrary.permTypeView')" value="view" />
              <el-option :label="t('message.pages.scriptLibrary.permTypeExec')" value="exec" />
              <el-option :label="t('message.pages.scriptLibrary.permTypeEdit')" value="edit" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="confirmAddAuth">{{ t('message.pages.scriptLibrary.permConfirmAdd') }}</el-button>
            <el-button size="small" @click="showAddAuth = false">{{ t('message.pages.scriptLibrary.formCancel') }}</el-button>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="permissionDialogVisible = false">{{ t('message.pages.scriptLibrary.formCancel') }}</el-button>
        <el-button type="primary" @click="savePermission">{{ t('message.pages.scriptLibrary.formSave') }}</el-button>
      </template>
    </el-dialog>

    <!-- Scheduled task management dialog -->
    <el-dialog v-model="taskDialogVisible" :title="t('message.pages.scriptLibrary.taskDialogTitle')" width="75%" top="6vh" destroy-on-close>
      <el-tabs v-model="taskActiveTab" class="task-tabs">
        <!-- Task list tab -->
        <el-tab-pane :label="t('message.pages.scriptLibrary.taskTabList')" name="list">
          <div class="task-list-header">
            <div class="task-script-info">
              <el-icon><Document /></el-icon>
              <span>{{ t('message.pages.scriptLibrary.taskRelatedScriptLabel') }}<b>{{ currentScript?.name }}</b>（{{ currentScript?.script_type || currentScript?.type }}）</span>
            </div>
            <el-button type="primary" size="small" @click="openTaskCreate">
              <el-icon><Plus /></el-icon>
              {{ t('message.pages.scriptLibrary.taskFormNewTitle') }}
            </el-button>
          </div>

          <el-empty v-if="taskList.length === 0" :description="t('message.pages.scriptLibrary.taskEmptyList')" />

          <el-table v-else :data="taskList" border stripe size="small" style="margin-top: 12px">
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column prop="name" :label="t('message.pages.scriptLibrary.taskFormNameLabel')" min-width="160">
              <template #default="{ row }">
                <div class="task-name-cell">
                  <b>{{ row.name }}</b>
                  <span v-if="row.description" class="task-desc">{{ row.description }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('message.pages.scriptLibrary.taskCardSchedule')" min-width="180">
              <template #default="{ row }">
                <div class="schedule-info">
                  <el-tag size="small" :type="row.schedule_type === 'cron' ? 'primary' : row.schedule_type === 'interval' ? 'warning' : 'info'">
                    {{ row.schedule_type_display || (row.schedule_type === 'cron' ? 'Cron' : row.schedule_type === 'interval' ? 'Fixed interval' : 'One-time') }}
                  </el-tag>
                  <span class="schedule-value">
                    {{ row.cron_expression || (row.interval_seconds ? row.interval_seconds + 's' : row.run_once_at || '-') }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('message.pages.scriptLibrary.taskColHostCount')" width="80" align="center">
              <template #default="{ row }">{{ row.host_count || row.hostCount || 0 }}</template>
            </el-table-column>
            <el-table-column :label="t('message.pages.scriptLibrary.formStatusLabel')" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? t('message.pages.scriptLibrary.statusRunning') : t('message.pages.scriptLibrary.tagDisabled') }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('message.pages.scriptLibrary.taskColExecCount')" width="90" align="center">
              <template #default="{ row }">{{ row.exec_count || 0 }}</template>
            </el-table-column>
            <el-table-column prop="next_exec_time" :label="t('message.pages.scriptLibrary.taskColNextExec')" min-width="160">
              <template #default="{ row }">
                <span>{{ row.next_exec_time || row.nextExecTime || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="t('message.pages.scriptLibrary.taskColLastResult')" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.last_exec_result === 'success' || row.execResult === 'success'" type="success" size="small">{{ t('message.pages.scriptLibrary.optSuccess') }}</el-tag>
                <el-tag v-else-if="row.last_exec_result === 'fail' || row.execResult === 'fail'" type="danger" size="small">{{ t('message.pages.scriptLibrary.optFail') }}</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column :label="t('message.pages.scriptLibrary.colAction')" :width="380" fixed="right">
              <template #default="{ row }">
                <el-button size="small" text type="info" @click="openTaskView(row)">{{ t('message.pages.scriptLibrary.versionActionView') }}</el-button>

                <el-tooltip
                  v-if="!canEditTask(row).ok"
                  :content="canEditTask(row).reason"
                  placement="top"
                >
                  <el-button size="small" text type="primary" disabled>{{ t('message.pages.scriptLibrary.actionEdit') }}</el-button>
                </el-tooltip>
                <el-button v-else size="small" text type="primary" @click="openTaskEdit(row)">{{ t('message.pages.scriptLibrary.actionEdit') }}</el-button>

                <el-tooltip
                  v-if="!canExecuteTask(row).ok"
                  :content="canExecuteTask(row).reason"
                  placement="top"
                >
                  <el-button size="small" text type="success" disabled>{{ t('message.pages.scriptLibrary.msgTaskConfirmExecTitle') }}</el-button>
                </el-tooltip>
                <el-button v-else size="small" text type="success" @click="execTaskOnce(row)">{{ t('message.pages.scriptLibrary.msgTaskConfirmExecTitle') }}</el-button>

                <el-button size="small" text @click="loadTaskExecutions(row, true, true)">{{ t('message.pages.scriptLibrary.taskActionHistory') }}</el-button>

                <el-tooltip
                  v-if="!canToggleTaskEnabled(row).ok"
                  :content="canToggleTaskEnabled(row).reason"
                  placement="top"
                >
                  <el-button
                    size="small"
                    text
                    :type="row.enabled ? 'warning' : 'primary'"
                    disabled
                  >
                    {{ row.enabled ? t('message.pages.scriptLibrary.formStatusDisabled') : t('message.pages.scriptLibrary.formStatusEnabled') }}
                  </el-button>
                </el-tooltip>
                <el-button
                  v-else
                  size="small"
                  text
                  :type="row.enabled ? 'warning' : 'primary'"
                  @click="toggleTaskStatus(row)"
                >
                  {{ row.enabled ? t('message.pages.scriptLibrary.formStatusDisabled') : t('message.pages.scriptLibrary.formStatusEnabled') }}
                </el-button>

                <el-tooltip
                  v-if="!canDeleteTask(row).ok"
                  :content="canDeleteTask(row).reason"
                  placement="top"
                >
                  <el-button size="small" text type="danger" disabled>{{ t('message.pages.scriptLibrary.actionDelete') }}</el-button>
                </el-tooltip>
                <el-button v-else size="small" text type="danger" @click="deleteTask(row)">{{ t('message.pages.scriptLibrary.actionDelete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Create/Edit/View task tab -->
        <el-tab-pane :label="viewTaskMode ? t('message.pages.scriptLibrary.taskViewTitle') : (editTaskId ? t('message.pages.scriptLibrary.taskEditTitle') : t('message.pages.scriptLibrary.taskFormNewTitle'))" name="form" :disabled="!showTaskForm && !editTaskId">
          <el-form :model="taskForm" label-width="110px" size="small" class="task-edit-form">
            <el-card class="task-form-card">
              <template #header>
                <div class="card-header"><b>{{ t('message.pages.scriptLibrary.taskCardBaseInfo') }}</b></div>
              </template>
              <el-form-item :label="t('message.pages.scriptLibrary.taskFormNameLabel')" required>
                <el-input v-model="taskForm.name" :placeholder="t('message.pages.scriptLibrary.taskFormNamePlaceholder')" maxlength="100" show-word-limit :disabled="viewTaskMode" />
              </el-form-item>
              <el-form-item :label="t('message.pages.scriptLibrary.taskFormDescLabel')">
                <el-input v-model="taskForm.description" type="textarea" :rows="2" :placeholder="t('message.pages.scriptLibrary.taskFormDescPlaceholder')" maxlength="200" show-word-limit :disabled="viewTaskMode" />
              </el-form-item>
            </el-card>

            <el-card class="task-form-card">
              <template #header>
                <div class="card-header"><b>{{ t('message.pages.scriptLibrary.taskCardSchedule') }}</b></div>
              </template>
              <el-form-item :label="t('message.pages.scriptLibrary.taskFormScheduleType')" required>
                <el-radio-group v-model="taskForm.schedule_type" :disabled="viewTaskMode">
                  <el-radio value="cron">{{ t('message.pages.scriptLibrary.taskScheduleCron') }}</el-radio>
                  <el-radio value="interval">{{ t('message.pages.scriptLibrary.taskScheduleInterval') }}</el-radio>
                  <el-radio value="once">{{ t('message.pages.scriptLibrary.taskScheduleOnce') }}</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item v-if="taskForm.schedule_type === 'cron'" :label="t('message.pages.scriptLibrary.taskScheduleCron')" required>
                <div style="width: 100%">
                  <el-select v-model="taskForm.cron_expression" :placeholder="t('message.pages.scriptLibrary.taskCronPlaceholder')" filterable allow-create style="width: 100%; margin-bottom: 8px" :disabled="viewTaskMode">
                    <el-option-group :label="t('message.pages.scriptLibrary.taskCronGroupCommon')">
                      <el-option :label="t('message.pages.scriptLibrary.taskCronEveryMin')" value="0 * * * * ?" />
                      <el-option :label="t('message.pages.scriptLibrary.taskCronEveryHour')" value="0 0 * * * ?" />
                      <el-option :label="t('message.pages.scriptLibrary.taskCronDaily2am')" value="0 0 2 * * ?" />
                      <el-option :label="t('message.pages.scriptLibrary.taskCronDaily3am')" value="0 0 3 * * ?" />
                      <el-option :label="t('message.pages.scriptLibrary.taskCronMon3am')" value="0 0 3 ? * MON" />
                      <el-option :label="t('message.pages.scriptLibrary.taskCronMonth1')" value="0 0 1 1 * ?" />
                    </el-option-group>
                  </el-select>
                  <div class="cron-hint">
                    <el-icon><InfoFilled /></el-icon>
                    <span>{{ t('message.pages.scriptLibrary.taskCronFormat') }}</span>
                  </div>
                </div>
              </el-form-item>

              <el-form-item v-if="taskForm.schedule_type === 'interval'" :label="t('message.pages.scriptLibrary.taskFormIntervalSec')" required>
                <el-input-number v-model="taskForm.interval_seconds" :min="60" :max="86400" :disabled="viewTaskMode" />
                <span style="margin-left: 8px; color: #909399; font-size: 12px">
                  （{{ taskForm.interval_seconds ? Math.floor(taskForm.interval_seconds / 60) : 0 }} {{ t('message.pages.scriptLibrary.unitMin') }}）
                </span>
              </el-form-item>

              <el-form-item v-if="taskForm.schedule_type === 'once'" :label="t('message.pages.scriptLibrary.taskFormExecTime')" required>
                <el-date-picker
                  v-model="taskForm.run_once_at"
                  type="datetime"
                  :placeholder="t('message.pages.scriptLibrary.taskExecTimePlaceholder')"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                  :disabled="viewTaskMode"
                />
              </el-form-item>

              <el-form-item :label="t('message.pages.scriptLibrary.taskFormEnabled')">
                <el-switch v-model="taskForm.enabled" :active-text="t('message.pages.scriptLibrary.formStatusEnabled')" :inactive-text="t('message.pages.scriptLibrary.formStatusDisabled')" :disabled="viewTaskMode" />
              </el-form-item>
            </el-card>

            <el-card class="task-form-card">
              <template #header>
                <div class="card-header"><b>{{ t('message.pages.scriptLibrary.taskCardExec') }}</b></div>
              </template>
              <el-form-item :label="t('message.pages.scriptLibrary.taskHostTarget')">
                <div style="width: 100%">
                  <el-input
                    v-model="taskForm.hostsText"
                    type="textarea"
                    :rows="3"
                    :placeholder="t('message.pages.scriptLibrary.taskHostPlaceholder') + t('message.pages.scriptLibrary.templateCommaForExample') + '\nhost-001\n192.168.1.100'"
                    :disabled="viewTaskMode"
                  />
                  <div v-if="!viewTaskMode" style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap">
                    <el-button size="small" @click="triggerHostFileImport">
                      <el-icon><Plus /></el-icon>
                      {{ t('message.pages.scriptLibrary.taskHostBtnImport') }}
                    </el-button>
                    <el-button
                      size="small"
                      type="primary"
                      :loading="hostValidateLoading"
                      @click="handleValidateHosts"
                    >
                      <el-icon><CircleCheck /></el-icon>
                      {{ t('message.pages.scriptLibrary.taskHostBtnValidate') }}
                    </el-button>
                    <el-button
                      size="small"
                      type="danger"
                      plain
                      :disabled="hostValidateResult.not_found.length === 0 && hostValidateResult.no_permission.length === 0"
                      :loading="hostCleanInvalidLoading"
                      @click="handleCleanInvalidHosts"
                    >
                      <el-icon><Delete /></el-icon>
                      {{ t('message.pages.scriptLibrary.taskHostBtnClean') }}
                    </el-button>
                    <span
                      v-if="hostValidateResult.valid.length > 0"
                      style="color: #67c23a; font-size: 12px; line-height: 28px"
                    >
                      {{ t('message.pages.scriptLibrary.taskHostValid') }} {{ hostValidateResult.valid.length }}
                    </span>
                    <span
                      v-if="hostValidateResult.not_found.length > 0"
                      style="color: #f56c6c; font-size: 12px; line-height: 28px"
                    >
                      {{ t('message.pages.scriptLibrary.hostNotFoundTitle') }} {{ hostValidateResult.not_found.length }}
                    </span>
                    <span
                      v-if="hostValidateResult.no_permission.length > 0"
                      style="color: #e6a23c; font-size: 12px; line-height: 28px"
                    >
                      {{ t('message.pages.scriptLibrary.hostNoPermTitle') }} {{ hostValidateResult.no_permission.length }}
                    </span>
                  </div>
                  <input
                    ref="hostFileInputRef"
                    type="file"
                    accept=".txt,.csv"
                    style="display: none"
                    @change="handleHostFileImport"
                  />
                  <div
                    v-if="
                      hostValidateResult.valid.length > 0 ||
                      hostValidateResult.not_found.length > 0 ||
                      hostValidateResult.no_permission.length > 0
                    "
                    class="host-validate-result"
                  >
                    <el-alert
                      v-if="hostValidateResult.valid.length > 0"
                      :title="`${t('message.pages.scriptLibrary.taskHostValid')}${t('message.pages.scriptLibrary.taskColHost')} (${hostValidateResult.valid.length})`"
                      type="success"
                      :closable="false"
                      show-icon
                      style="margin-bottom: 6px"
                    >
                      <template #default>
                        <div class="result-tag-list">
                          <el-tag
                            v-for="h in hostValidateResult.valid"
                            :key="'v-' + h.identifier"
                            size="small"
                            type="success"
                            effect="light"
                            style="margin: 2px 4px 2px 0"
                          >
                            {{ h.identifier }}
                            <span style="opacity: 0.7; margin-left: 2px">
                              ({{ h.host_ip || h.host_name }})
                            </span>
                          </el-tag>
                        </div>
                      </template>
                    </el-alert>
                    <el-alert
                      v-if="hostValidateResult.not_found.length > 0"
                      :title="`${t('message.pages.scriptLibrary.hostNotFoundTitle')}${t('message.pages.scriptLibrary.templateDeOf')}${t('message.pages.scriptLibrary.taskColHost')} (${hostValidateResult.not_found.length})`"
                      type="error"
                      :closable="false"
                      show-icon
                      style="margin-bottom: 6px"
                    >
                      <template #default>
                        <div class="result-tag-list">
                          <el-tag
                            v-for="h in hostValidateResult.not_found"
                            :key="'nf-' + h"
                            size="small"
                            type="danger"
                            effect="light"
                            style="margin: 2px 4px 2px 0"
                          >
                            {{ h }}
                          </el-tag>
                        </div>
                      </template>
                    </el-alert>
                    <el-alert
                      v-if="hostValidateResult.no_permission.length > 0"
                      :title="`${t('message.pages.scriptLibrary.hostNoPermTitle')}${t('message.pages.scriptLibrary.templateDeOf')}${t('message.pages.scriptLibrary.taskColHost')} (${hostValidateResult.no_permission.length})`"
                      type="warning"
                      :closable="false"
                      show-icon
                    >
                      <template #default>
                        <div class="result-tag-list">
                          <el-tag
                            v-for="h in hostValidateResult.no_permission"
                            :key="'np-' + h.identifier"
                            size="small"
                            type="warning"
                            effect="light"
                            style="margin: 2px 4px 2px 0"
                          >
                            {{ h.identifier }}
                            <span style="opacity: 0.7; margin-left: 2px">
                              ({{ h.host_ip || h.host_name }})
                            </span>
                          </el-tag>
                        </div>
                      </template>
                    </el-alert>
                  </div>
                </div>
              </el-form-item>
              <el-form-item :label="t('message.pages.scriptLibrary.taskFormTimeout')">
                <el-input-number v-model="taskForm.timeout" :min="10" :max="7200" :disabled="viewTaskMode" />
                <span style="margin-left: 8px; color: #909399; font-size: 12px">{{ t('message.pages.scriptLibrary.unitSec') }}</span>
              </el-form-item>
              <el-form-item :label="t('message.pages.scriptLibrary.taskFormFailNotify')">
                <el-switch v-model="taskForm.fail_notify" :disabled="viewTaskMode" />
              </el-form-item>
            </el-card>

            <el-card class="task-form-card">
              <template #header>
                <div class="card-header"><b>{{ t('message.pages.scriptLibrary.taskCardRunParams') }}</b></div>
              </template>
              <el-form-item :label="t('message.pages.scriptLibrary.taskFormArgs')">
                <div style="width: 100%">
                  <div class="args-list">
                    <div v-for="(arg, idx) in taskForm.args" :key="idx" class="arg-item">
                      <el-input v-model="taskForm.args[idx]" :placeholder="t('message.pages.scriptLibrary.taskArgPlaceholder')" size="small" style="width: 260px" :disabled="viewTaskMode" />
                      <el-button v-if="!viewTaskMode" size="small" text type="danger" @click="taskForm.args.splice(idx, 1)">{{ t('message.pages.scriptLibrary.actionDelete') }}</el-button>
                    </div>
                  </div>
                  <el-button v-if="!viewTaskMode" size="small" @click="taskForm.args.push('')">{{ t('message.pages.scriptLibrary.taskBtnAddArg') }}</el-button>
                </div>
              </el-form-item>
              <el-form-item :label="t('message.pages.scriptLibrary.taskFormEnvs')">
                <div style="width: 100%">
                  <div class="envs-list">
                    <div v-for="(val, key) in taskForm.envs" :key="key" class="env-item">
                      <el-input v-model="envKeyMap[key]" :placeholder="t('message.pages.scriptLibrary.taskEnvKeyPlaceholder')" size="small" style="width: 140px; margin-right: 8px" @input="onEnvKeyChange(key)" :disabled="viewTaskMode" />
                      <el-input v-model="taskForm.envs[key]" :placeholder="t('message.pages.scriptLibrary.taskEnvValuePlaceholder')" size="small" style="width: 200px; margin-right: 8px" :disabled="viewTaskMode" />
                      <el-button v-if="!viewTaskMode" size="small" text type="danger" @click="deleteEnv(key)">{{ t('message.pages.scriptLibrary.actionDelete') }}</el-button>
                    </div>
                  </div>
                  <el-button v-if="!viewTaskMode" size="small" @click="addEnv">{{ t('message.pages.scriptLibrary.taskBtnAddEnv') }}</el-button>
                </div>
              </el-form-item>
            </el-card>

            <div class="task-form-footer">
              <el-button @click="cancelTaskForm">{{ viewTaskMode ? t('message.pages.scriptLibrary.optClose') : t('message.pages.scriptLibrary.formCancel') }}</el-button>
              <el-button v-if="!viewTaskMode" type="primary" @click="saveTask">{{ t('message.pages.scriptLibrary.taskBtnSave') }}</el-button>
            </div>
          </el-form>
        </el-tab-pane>

        <!-- Execution history tab -->
        <el-tab-pane :label="t('message.pages.scriptLibrary.taskActionHistory') + (selectedTaskForHistory ? ' - ' + selectedTaskForHistory.name : '')" name="history">
          <el-empty v-if="!selectedTaskForHistory" :description="t('message.pages.scriptLibrary.templateSelectFirst') + t('message.pages.scriptLibrary.taskTabList') + t('message.pages.scriptLibrary.templateInMiddle') + t('message.pages.scriptLibrary.templateSelectOne') + t('message.pages.scriptLibrary.scopeUnit') + t('message.pages.scriptLibrary.taskUnitLabel') + t('message.pages.scriptLibrary.versionActionView') + t('message.pages.scriptLibrary.taskActionHistory')" />
          <div v-else>
            <el-alert :title="t('message.pages.scriptLibrary.taskColon') + selectedTaskForHistory.name" type="info" :closable="false" style="margin-bottom: 12px" />
            <div style="margin-bottom:10px">
              <el-form :inline="true" size="small" style="margin:0">
                <el-form-item :label="t('message.pages.scriptLibrary.formStatusLabel')" style="margin-right:12px">
                  <el-select v-model="taskExecutionsFilter.exec_status" :placeholder="t('message.pages.scriptLibrary.filterAll')" clearable style="width:130px" @change="loadTaskExecutions(selectedTaskForHistory, true, false)">
                    <el-option :label="t('message.pages.scriptLibrary.optPendingExec')" :value="0" />
                    <el-option :label="t('message.pages.scriptLibrary.optExecuting')" :value="1" />
                    <el-option :label="t('message.pages.scriptLibrary.optSuccess')" :value="2" />
                    <el-option :label="t('message.pages.scriptLibrary.optFail')" :value="3" />
                    <el-option :label="t('message.pages.scriptLibrary.optTimeoutAbort')" :value="4" />
                  </el-select>
                </el-form-item>
                <el-form-item :label="t('message.pages.scriptLibrary.taskColTrigger')" style="margin-right:12px">
                  <el-select v-model="taskExecutionsFilter.exec_trigger_type" :placeholder="t('message.pages.scriptLibrary.filterAll')" clearable style="width:130px" @change="loadTaskExecutions(selectedTaskForHistory, true, false)">
                    <el-option :label="t('message.pages.scriptLibrary.taskTriggerSchedule')" value="schedule" />
                    <el-option :label="t('message.pages.scriptLibrary.taskTriggerManual')" value="manual" />
                    <el-option :label="t('message.pages.scriptLibrary.taskTriggerApi')" value="api" />
                    <el-option :label="t('message.pages.scriptLibrary.taskTriggerDebug')" value="manual_debug" />
                    <el-option :label="t('message.pages.scriptLibrary.taskTriggerCompensate')" value="compensate" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="loadTaskExecutions(selectedTaskForHistory, true, false)">{{ t('message.pages.scriptLibrary.btnQuery') }}</el-button>
                  <el-button @click="() => { taskExecutionsFilter.exec_status = ''; taskExecutionsFilter.exec_trigger_type = ''; loadTaskExecutions(selectedTaskForHistory, true, false) }">{{ t('message.pages.scriptLibrary.btnReset') }}</el-button>
                </el-form-item>
              </el-form>
            </div>
            <el-table :data="taskExecutions" border stripe size="small" v-loading="taskExecutionsLoading">
              <el-table-column type="index" label="#" width="56" align="center">
                <template #default="{ $index }">{{ (taskExecutionsPage.current - 1) * taskExecutionsPage.size + $index + 1 }}</template>
              </el-table-column>
              <el-table-column prop="trigger_type_display" :label="t('message.pages.scriptLibrary.taskColTrigger')" width="100" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="triggerTypeTagType(row.trigger_type)">
                    {{ row.trigger_type_display || triggerTypeText(row.trigger_type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="t('message.pages.scriptLibrary.formStatusLabel')" width="90" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.status === 2" type="success" size="small">{{ t('message.pages.scriptLibrary.optSuccess') }}</el-tag>
                  <el-tag v-else-if="row.status === 3" type="danger" size="small">{{ t('message.pages.scriptLibrary.optFail') }}</el-tag>
                  <el-tag v-else-if="row.status === 1" type="warning" size="small">{{ t('message.pages.scriptLibrary.optExecuting') }}</el-tag>
                  <el-tag v-else type="info" size="small">{{ t('message.pages.scriptLibrary.optPendingExec') }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="start_time" :label="t('message.pages.scriptLibrary.taskColStartTime')" min-width="170" />
              <el-table-column :label="t('message.pages.scriptLibrary.taskColDuration')" width="90" align="center">
                <template #default="{ row }">
                  <span>{{ row.duration !== undefined && row.duration !== null ? row.duration + 's' : '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="executed_hosts" :label="t('message.pages.scriptLibrary.taskColHost')" min-width="100">
                <template #default="{ row }">
                  <span v-if="row.executed_hosts && row.executed_hosts.length">
                    {{ row.executed_hosts.length }} {{ t('message.pages.scriptLibrary.taskHostCount') }}
                  </span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="error_message" :label="t('message.pages.scriptLibrary.taskColError')" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row.error_message" style="color: #f56c6c">{{ row.error_message }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column :label="t('message.pages.scriptLibrary.taskColHostSummary')" width="140" align="center">
                <template #default="{ row }">
                  <span v-if="getHostSummary(row).total === 0">-</span>
                  <span v-else style="display:inline-flex;gap:6px;flex-wrap:wrap;justify-content:center">
                    <el-tag v-if="getHostSummary(row).success > 0" size="small" type="success">{{ t('message.pages.scriptLibrary.optSuccess') }} {{ getHostSummary(row).success }}</el-tag>
                    <el-tag v-if="getHostSummary(row).failed > 0" size="small" type="danger">{{ t('message.pages.scriptLibrary.optFail') }} {{ getHostSummary(row).failed }}</el-tag>
                    <el-tag v-if="getHostSummary(row).running > 0" size="small" type="warning">{{ t('message.pages.scriptLibrary.optExecuting') }} {{ getHostSummary(row).running }}</el-tag>
                    <el-tag v-if="getHostSummary(row).pending > 0" size="small" type="info">{{ t('message.pages.scriptLibrary.optPendingExec') }} {{ getHostSummary(row).pending }}</el-tag>
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="t('message.pages.scriptLibrary.colAction')" width="100" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button
                    size="small"
                    type="primary"
                    link
                    @click="openHostOutput(row)"
                    :loading="row._outputLoading"
                    :disabled="!row.result && !row.error_message && row.status === 0"
                  >{{ t('message.pages.scriptLibrary.taskActionViewOutput') }}</el-button>
                </template>
              </el-table-column>
              <el-table-column prop="creator_name" :label="t('message.pages.scriptLibrary.colCreator')" width="100" align="center" />
            </el-table>
            <div style="margin-top:12px;display:flex;justify-content:flex-end">
              <el-pagination
                v-model:current-page="taskExecutionsPage.current"
                v-model:page-size="taskExecutionsPage.size"
                :page-sizes="[20, 50, 100, 200]"
                :total="taskExecutionsPage.total"
                layout="total, sizes, prev, pager, next, jumper"
                background
                small
                @size-change="loadTaskExecutions(selectedTaskForHistory, true, false)"
                @current-change="loadTaskExecutions(selectedTaskForHistory, false, false)"
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- Scheduled task execution output details -->
    <el-dialog
      v-model="hostOutputDialogVisible"
      :title="t('message.pages.scriptLibrary.msgHostOutputDialogTitle')"
      width="96%"
      top="3vh"
      destroy-on-close
      append-to-body
    >
      <div v-if="hostOutputSummary" class="output-summary" style="margin-bottom:12px">
        <el-alert
          :title="`${t('message.pages.scriptLibrary.hostOutputBelongTask')}${hostOutputSummary.taskName || '-'} | ${t('message.pages.scriptLibrary.hostOutputExecId')}${currentOutputExecutionId || '-'} | ${t('message.pages.scriptLibrary.hostOutputTotalHosts')}${hostOutputSummary.total} | ${t('message.pages.scriptLibrary.hostOutputSuccess')}${hostOutputSummary.success} | ${t('message.pages.scriptLibrary.hostOutputFail')}${hostOutputSummary.failed} | ${t('message.pages.scriptLibrary.hostOutputRunning')}${hostOutputSummary.running} | ${t('message.pages.scriptLibrary.hostOutputPending')}${hostOutputSummary.pending ?? 0}`"
          :type="hostOutputSummary.failed > 0 ? 'error' : hostOutputSummary.running > 0 ? 'warning' : 'success'"
          :closable="false"
          show-icon
        />
        <el-alert
          v-if="currentHostOutputError"
          style="margin-top:8px"
          :title="t('message.pages.scriptLibrary.hostOutputScheduleError') + currentHostOutputError"
          type="error"
          :closable="false"
          show-icon
        />
      </div>
      <div style="display:flex;gap:14px;align-items:stretch">
        <!-- Left: paginated host list -->
        <div style="width:420px;min-width:420px;max-width:420px;border:1px solid #ebeef5;border-radius:6px;display:flex;flex-direction:column">
          <div style="padding:10px 12px;border-bottom:1px solid #ebeef5;background:#fafbfc;border-top-left-radius:6px;border-top-right-radius:6px">
            <el-form :inline="true" size="small" style="margin:0">
              <el-form-item style="margin:0 0 8px 0;width:100%">
                <el-input
                  v-model="hostOutputFilter.keyword"
                  :placeholder="t('message.pages.scriptLibrary.hostOutputSearchPlaceholder')"
                  clearable
                  style="width:100%"
                  @keyup.enter="fetchHostOutputPage(true)"
                  @clear="fetchHostOutputPage(true)"
                />
              </el-form-item>
              <el-form-item style="margin:0">
                <el-select v-model="hostOutputFilter.status" :placeholder="t('message.pages.scriptLibrary.hostOutputAllStatus')" clearable style="width:148px" @change="fetchHostOutputPage(true)">
                  <el-option :label="t('message.pages.scriptLibrary.optSuccess')" value="success" />
                  <el-option :label="t('message.pages.scriptLibrary.optFail')" value="failed" />
                  <el-option :label="t('message.pages.scriptLibrary.optExecuting')" value="running" />
                  <el-option :label="t('message.pages.scriptLibrary.optPendingExec')" value="pending" />
                </el-select>
                <el-button type="primary" style="margin-left:8px" @click="fetchHostOutputPage(true)">{{ t('message.pages.scriptLibrary.hostOutputBtnSearch') }}</el-button>
                <el-button style="margin-left:4px" @click="resetHostOutputFilter">{{ t('message.pages.scriptLibrary.btnReset') }}</el-button>
              </el-form-item>
            </el-form>
          </div>
          <el-table
            v-loading="hostOutputLoading"
            :data="currentHostOutputs"
            size="small"
            highlight-current-row
            height="560"
            stripe
            @current-change="(row:any)=>row && selectHostRow(row)"
            style="flex:1;border:none"
          >
            <el-table-column label="#" width="48" align="center">
              <template #default="{ $index }">{{ (hostOutputPage.current - 1) * hostOutputPage.size + $index + 1 }}</template>
            </el-table-column>
            <el-table-column :label="t('message.pages.scriptLibrary.taskColHost')" min-width="180">
              <template #default="{ row }">
                <div>
                  <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px">
                    <el-tag size="small" :type="hostStatusTagType(row)">{{ row.status_display || '-' }}</el-tag>
                  </div>
                  <div style="font-weight:600;color:#303133">{{ row.host_name || row.host_ip || t('message.pages.scriptLibrary.hostOutputUnknownHost') }}</div>
                  <div v-if="row.host_ip && row.host_ip !== row.host_name" style="color:#909399;font-size:12px;margin-top:2px">
                    {{ row.host_ip }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('message.pages.scriptLibrary.exitCodeLabel')" width="64" align="center">
              <template #default="{ row }">
                <b v-if="row.exit_code !== undefined && row.exit_code !== null && row.exit_code !== 0" style="color:#f56c6c">{{ row.exit_code }}</b>
                <span v-else-if="row.exit_code === 0" style="color:#67c23a">0</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
          <div style="padding:8px 12px;border-top:1px solid #ebeef5;background:#fafbfc;border-bottom-left-radius:6px;border-bottom-right-radius:6px;display:flex;align-items:center;justify-content:flex-end">
            <el-pagination
              v-model:current-page="hostOutputPage.current"
              v-model:page-size="hostOutputPage.size"
              :page-sizes="[20, 50, 100, 200]"
              :total="hostOutputPage.total"
              layout="total, sizes, prev, pager, next, jumper"
              background
              small
              @size-change="fetchHostOutputPage(true)"
              @current-change="fetchHostOutputPage(false)"
            />
          </div>
        </div>

        <!-- Right: output details -->
        <div style="flex:1;border:1px solid #ebeef5;border-radius:6px;min-height:650px;display:flex;flex-direction:column">
          <div v-loading="hostDetailLoading" style="flex:1;display:flex;flex-direction:column;min-height:0">
            <el-empty v-if="!selectedHostRow" :description="t('message.pages.scriptLibrary.templateLeftSide') + t('message.pages.scriptLibrary.templateSelectOne') + t('message.pages.scriptLibrary.taskHostCount') + t('message.pages.scriptLibrary.taskColHost') + t('message.pages.scriptLibrary.taskActionViewOutput')" :image-size="100" style="margin:auto" />
            <template v-else>
              <div style="padding:10px 14px;border-bottom:1px solid #ebeef5;background:#fafbfc;border-top-right-radius:6px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
                  <el-tag size="default" :type="hostStatusTagType(selectedHostRow)" effect="dark">{{ selectedHostRow.status_display || '-' }}</el-tag>
                  <span style="font-size:15px;font-weight:600">{{ selectedHostRow.host_name || selectedHostRow.host_ip || t('message.pages.scriptLibrary.hostOutputUnknownHost') }}</span>
                  <span v-if="selectedHostRow.host_ip && selectedHostRow.host_ip !== selectedHostRow.host_name" style="color:#909399">
                    ({{ selectedHostRow.host_ip }})
                  </span>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:12px 18px;color:#606266;font-size:13px">
                  <div><span style="color:#909399">{{ t('message.pages.scriptLibrary.exitCodeLabelWithColon') }}</span><b>{{ getSelectedHostDetail()?.exit_code !== undefined && getSelectedHostDetail()?.exit_code !== null ? getSelectedHostDetail()?.exit_code : '-' }}</b></div>
                  <div><span style="color:#909399">{{ t('message.pages.scriptLibrary.startTimeLabelWithColon') }}</span>{{ getSelectedHostDetail()?.started_at || '-' }}</div>
                  <div><span style="color:#909399">{{ t('message.pages.scriptLibrary.endTimeLabelWithColon') }}</span>{{ getSelectedHostDetail()?.finished_at || '-' }}</div>
                  <div v-if="getSelectedHostDetail()?.error_message" style="flex:1 1 100%"><span style="color:#909399">{{ t('message.pages.scriptLibrary.errorLabelWithColon') }}</span><span style="color:#f56c6c">{{ getSelectedHostDetail()?.error_message }}</span></div>
                </div>
              </div>
              <div style="flex:1;overflow:auto;padding:12px 14px">
                <div class="output-block">
                  <div class="output-block-title">
                    <span>{{ t('message.pages.scriptLibrary.stdoutLabel') }}</span>
                    <el-button v-if="getSelectedHostDetail()?.stdout" size="small" link @click="copyText(getSelectedHostDetail()?.stdout)">{{ t('message.pages.scriptLibrary.hostOutputCopy') }}</el-button>
                  </div>
                  <pre class="output-pre" v-if="getSelectedHostDetail()?.stdout">{{ getSelectedHostDetail()?.stdout }}</pre>
                  <el-empty v-else :description="t('message.pages.scriptLibrary.hostNoStdout')" :image-size="60" />
                </div>
                <div class="output-block" style="margin-top:14px">
                  <div class="output-block-title">
                    <span style="color:#f56c6c">{{ t('message.pages.scriptLibrary.stderrLabel') }}</span>
                    <el-button v-if="getSelectedHostDetail()?.stderr" size="small" link @click="copyText(getSelectedHostDetail()?.stderr)">{{ t('message.pages.scriptLibrary.hostOutputCopy') }}</el-button>
                  </div>
                  <pre class="output-pre stderr" v-if="getSelectedHostDetail()?.stderr">{{ getSelectedHostDetail()?.stderr }}</pre>
                  <el-empty v-else :description="t('message.pages.scriptLibrary.hostNoStderr')" :image-size="60" />
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- Audit log dialog -->
    <el-dialog v-model="auditDialogVisible" :title="t('message.pages.scriptLibrary.auditDialogTitle')" width="85%" top="5vh" destroy-on-close>
      <div class="audit-header">
        <span>{{ t('message.pages.scriptLibrary.auditCurrentScriptLabel') }}<b>{{ currentScript?.name }}</b></span>
      </div>

      <!-- Filter bar -->
      <div class="audit-filter" style="margin: 16px 0">
        <el-form inline size="small">
          <el-form-item :label="t('message.pages.scriptLibrary.auditColOperType')">
            <el-select v-model="auditFilter.operType" :placeholder="t('message.pages.scriptLibrary.filterAll')" clearable style="width: 140px">
              <el-option :label="t('message.pages.scriptLibrary.auditCreate')" value="create" />
              <el-option :label="t('message.pages.scriptLibrary.auditEdit')" value="edit" />
              <el-option :label="t('message.pages.scriptLibrary.auditDelete')" value="delete" />
              <el-option :label="t('message.pages.scriptLibrary.auditRollback')" value="rollback" />
              <el-option :label="t('message.pages.scriptLibrary.auditAuth')" value="auth" />
              <el-option :label="t('message.pages.scriptLibrary.auditExec')" value="exec" />
              <el-option :label="t('message.pages.scriptLibrary.auditStatusChange')" value="status" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('message.pages.scriptLibrary.auditColOperator')">
            <el-input v-model="auditFilter.operator" :placeholder="t('message.pages.scriptLibrary.auditOperatorPlaceholder')" style="width: 140px" clearable />
          </el-form-item>
          <el-form-item :label="t('message.pages.scriptLibrary.auditColOperTime')">
            <el-date-picker
              v-model="auditFilter.timeRange"
              type="daterange"
              :range-separator="t('message.pages.scriptLibrary.auditRangeTo')"
              :start-placeholder="t('message.pages.scriptLibrary.auditRangeStart')"
              :end-placeholder="t('message.pages.scriptLibrary.auditRangeEnd')"
              style="width: 240px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="getAuditList">{{ t('message.pages.scriptLibrary.btnQuery') }}</el-button>
            <el-button size="small" @click="resetAuditFilter">{{ t('message.pages.scriptLibrary.btnReset') }}</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- Audit log list -->
      <el-table :data="auditList" border stripe size="small">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="audit-detail">
              <div class="detail-item">
                <span class="detail-label">{{ t('message.pages.scriptLibrary.auditDetailOperType') }}</span>
                <span class="detail-value">{{ row.operTypeDisplay || operTypeText(row.operType) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('message.pages.scriptLibrary.auditDetailVersion') }}</span>
                <span class="detail-value">{{ row.scriptVersion || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('message.pages.scriptLibrary.auditDetailDesc') }}</span>
                <span class="detail-value">{{ row.detail || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('message.pages.scriptLibrary.auditDetailOperator') }}</span>
                <span class="detail-value">{{ row.operator || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('message.pages.scriptLibrary.auditDetailIP') }}</span>
                <span class="detail-value">{{ row.clientIp || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ t('message.pages.scriptLibrary.auditDetailTime') }}</span>
                <span class="detail-value">{{ row.operTime || '-' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="operTime" :label="t('message.pages.scriptLibrary.auditColOperTime')" min-width="180" />
        <el-table-column prop="operator" :label="t('message.pages.scriptLibrary.auditColOperator')" width="120" />
        <el-table-column prop="scriptVersion" :label="t('message.pages.scriptLibrary.auditColScriptVersion')" width="100" />
        <el-table-column prop="operType" :label="t('message.pages.scriptLibrary.auditColOperType')" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="operTypeTag(row.operType)">{{ row.operTypeDisplay || operTypeText(row.operType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operDesc" :label="t('message.pages.scriptLibrary.auditColOperDesc')" min-width="300" />
        <el-table-column prop="clientIp" :label="t('message.pages.scriptLibrary.auditColIP')" width="140" />
        <el-table-column :label="t('message.pages.scriptLibrary.approveActionDetail')" width="80">
          <template #default="{ row }">
            <span class="expand-tip">{{ t('message.pages.scriptLibrary.auditExpandTip') }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="auditPage.current"
        v-model:page-size="auditPage.size"
        :total="auditPage.total"
        layout="total, prev, pager, next, jumper"
        style="margin-top: 16px; text-align: right"
      />
    </el-dialog>

    <!-- Local file upload -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".sh,.py,.bat,.ps1,.sql"
      multiple
      style="display: none"
      @change="handleFileUpload"
    />

    <!-- Approval center dialog -->
    <el-dialog
      v-if="hasFeature('SCRIPT_APPROVAL_FLOW')"
      v-model="approveDialogVisible"
      :title="t('message.pages.scriptLibrary.approveCenterTitle')"
      width="1200px"
      top="8vh"
      destroy-on-close
    >
      <el-tabs v-model="approveActiveTab" class="approve-tabs" @tab-change="handleApproveTabChange">
        <el-tab-pane :label="t('message.pages.scriptLibrary.approveTabPending')" name="pending_me">
          <el-table :data="pendingMeList" border stripe>
            <el-table-column type="index" :label="t('message.pages.scriptLibrary.colIndex')" width="60" align="center" />
            <el-table-column prop="script_name" :label="t('message.pages.scriptLibrary.approveColScriptName')" min-width="180" show-overflow-tooltip />
            <el-table-column prop="script_type" :label="t('message.pages.scriptLibrary.categoryColType')" width="100" align="center" />
            <el-table-column :label="t('message.pages.scriptLibrary.approveColRisk')" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="row.risk_level === 'high' ? 'danger' : row.risk_level === 'medium' ? 'warning' : 'info'"
                  effect="dark"
                  size="small"
                >{{ row.risk_level_display || row.risk_level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="current_node" :label="t('message.pages.scriptLibrary.approveColNode')" width="120" align="center" />
            <el-table-column prop="submitter_name_display" :label="t('message.pages.scriptLibrary.approveColSubmitter')" width="100" align="center" />
            <el-table-column prop="create_datetime" :label="t('message.pages.scriptLibrary.approveColSubmitTime')" width="170" align="center" />
            <el-table-column :label="t('message.pages.scriptLibrary.colAction')" width="200" align="center" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="viewApprovalDetail(row)">
                  {{ t('message.pages.scriptLibrary.approveActionDetailAudit') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="pendingMeList.length === 0" :description="t('message.pages.scriptLibrary.approveEmptyPending')" />
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="approvalPage.pending_me.current"
              v-model:page-size="approvalPage.pending_me.size"
              :total="approvalPage.pending_me.total"
              layout="prev, pager, next, total"
              background
              @current-change="loadPendingMeList"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane :label="t('message.pages.scriptLibrary.approveTabSubmitted')" name="my_submitted">
          <el-table :data="mySubmittedList" border stripe>
            <el-table-column type="index" :label="t('message.pages.scriptLibrary.colIndex')" width="60" align="center" />
            <el-table-column prop="script_name" :label="t('message.pages.scriptLibrary.approveColScriptName')" min-width="180" show-overflow-tooltip />
            <el-table-column prop="script_type" :label="t('message.pages.scriptLibrary.categoryColType')" width="100" align="center" />
            <el-table-column :label="t('message.pages.scriptLibrary.formStatusLabel')" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="{ pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'info' }[row.status as string] || 'info'"
                  effect="dark"
                  size="small"
                >{{ row.status_display }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="current_node" :label="t('message.pages.scriptLibrary.approveColNode')" width="120" align="center" />
            <el-table-column prop="total_nodes" :label="t('message.pages.scriptLibrary.approveColNodeCount')" width="80" align="center" />
            <el-table-column prop="create_datetime" :label="t('message.pages.scriptLibrary.approveColSubmitTime')" width="170" align="center" />
            <el-table-column :label="t('message.pages.scriptLibrary.colAction')" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="viewApprovalDetail(row)">
                  {{ t('message.pages.scriptLibrary.approveActionDetail') }}
                </el-button>
                <el-button
                  v-if="row.status === 'pending'"
                  size="small"
                  type="danger"
                  @click="cancelApproval(row)"
                >
                  {{ t('message.pages.scriptLibrary.approveActionWithdraw') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="mySubmittedList.length === 0" :description="t('message.pages.scriptLibrary.approveEmptySubmitted')" />
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="approvalPage.my_submitted.current"
              v-model:page-size="approvalPage.my_submitted.size"
              :total="approvalPage.my_submitted.total"
              layout="prev, pager, next, total"
              background
              @current-change="loadMySubmittedList"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane :label="t('message.pages.scriptLibrary.approveTabDone')" name="done">
          <el-table :data="doneApproveList" border stripe>
            <el-table-column type="index" :label="t('message.pages.scriptLibrary.colIndex')" width="60" align="center" />
            <el-table-column prop="script_name" :label="t('message.pages.scriptLibrary.approveColScriptName')" min-width="180" show-overflow-tooltip />
            <el-table-column :label="t('message.pages.scriptLibrary.approveColResult')" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="{ approved: 'success', rejected: 'danger', cancelled: 'info' }[row.status as string] || 'info'"
                  effect="dark"
                  size="small"
                >{{ row.status_display }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="submitter_name_display" :label="t('message.pages.scriptLibrary.approveColSubmitter')" width="100" align="center" />
            <el-table-column prop="finish_time" :label="t('message.pages.scriptLibrary.approveColFinishTime')" width="170" align="center" />
            <el-table-column :label="t('message.pages.scriptLibrary.colAction')" width="120" align="center" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="viewApprovalDetail(row)">
                  {{ t('message.pages.scriptLibrary.approveActionDetail') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="doneApproveList.length === 0" :description="t('message.pages.scriptLibrary.approveEmptyDone')" />
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="approvalPage.done.current"
              v-model:page-size="approvalPage.done.size"
              :total="approvalPage.done.total"
              layout="prev, pager, next, total"
              background
              @current-change="loadDoneList"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- Approval detail drawer -->
    <el-drawer
      v-model="approveDetailVisible"
      :title="`${t('message.pages.scriptLibrary.approveDetailTitle')} - ${currentApprove.script_name || currentApprove.scriptName}`"
      direction="rtl"
      size="60%"
      destroy-on-close
      @close="destroyApproveEditor"
    >
      <div class="approve-detail">
        <div class="info-row">
          <div>
            <b>{{ t('message.pages.scriptLibrary.approveDetailScriptName') }}</b>{{ currentApprove.script_name || currentApprove.scriptName }}
          </div>
          <div>
            <b>{{ t('message.pages.scriptLibrary.approveDetailScriptType') }}</b>{{ currentApprove.script_type || currentApprove.scriptType }}
          </div>
          <div>
            <b>{{ t('message.pages.scriptLibrary.approveDetailRiskLevel') }}</b>
            <el-tag
              :type="currentApprove.risk_level === 'high' ? 'danger' : currentApprove.risk_level === 'medium' ? 'warning' : 'info'"
              effect="dark"
              size="small"
            >{{ currentApprove.risk_level_display || currentApprove.riskLevel || '' }}</el-tag>
          </div>
        </div>
        <div class="info-row">
          <div>
            <b>{{ t('message.pages.scriptLibrary.approveDetailSubmitter') }}</b>{{ currentApprove.submitter_name_display || currentApprove.submitter_name || currentApprove.submitUser }}
          </div>
          <div>
            <b>{{ t('message.pages.scriptLibrary.approveDetailSubmitTime') }}</b>{{ currentApprove.create_datetime || currentApprove.submitTime }}
          </div>
          <div>
            <b>{{ t('message.pages.scriptLibrary.approveDetailStatus') }}</b>
            <el-tag
              :type="{ pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'info' }[currentApprove.status as string] || 'info'"
              effect="dark"
              size="small"
            >{{ currentApprove.status_display }}</el-tag>
          </div>
        </div>
        <div class="info-row desc">
          <b>{{ t('message.pages.scriptLibrary.approveDetailSubmitDesc') }}</b>{{ currentApprove.submit_desc || currentApprove.submitDesc || '' }}
        </div>

        <div class="section-title">
          <el-icon><Connection /></el-icon> {{ t('message.pages.scriptLibrary.approveDetailFlow') }}
        </div>
        <div class="flow-steps">
          <el-steps :active="currentApprove.current_node_index !== undefined ? currentApprove.current_node_index + (currentApprove.status === 'approved' || currentApprove.status === 'rejected' || currentApprove.status === 'cancelled' ? nodeExecList.length : 0) : 0" finish-status="success" :status="currentApprove.status === 'rejected' ? 'error' : currentApprove.status === 'cancelled' ? 'info' : ''">
            <el-step
              v-for="(node, index) in nodeExecList"
              :key="node.id || index"
              :title="node.node_name"
              :description="getNodeStatusText(node)"
              :status="getNodeStepStatus(node, index)"
            />
          </el-steps>
        </div>

        <div class="section-title">
          <el-icon><Warning /></el-icon> {{ t('message.pages.scriptLibrary.approveDetailRiskPoints') }}
        </div>
        <div :class="['risk-box', { 'no-risk': riskPoints.length === 0 }]">
          <el-empty v-if="riskPoints.length === 0" :description="t('message.pages.scriptLibrary.approveDetailNoRisk')" :image-size="50">
            <template #image>
              <el-icon style="font-size: 48px; color: #67c23a"><CircleCheck /></el-icon>
            </template>
          </el-empty>
          <div v-for="(point, index) in riskPoints" :key="index" class="risk-item">
            <el-icon style="color: #f56c6c"><WarningFilled /></el-icon>
            <span>{{ point }}</span>
          </div>
        </div>

        <div class="section-title">
          <el-icon><Document /></el-icon> {{ t('message.pages.scriptLibrary.approveDetailContentPreview') }}
        </div>
        <div id="approve-monaco" class="approve-monaco"></div>

        <div class="section-title">
          <el-icon><List /></el-icon> {{ t('message.pages.scriptLibrary.approveDetailNodeDetail') }}
        </div>
        <div class="node-detail-list">
          <div v-for="(node, index) in nodeExecList" :key="node.id || index" class="node-detail-item">
            <div class="node-header">
              <span class="node-name">{{ node.node_name }}</span>
              <el-tag
                :type="{ pending: 'warning', approved: 'success', rejected: 'danger', skipped: 'info' }[node.status as string] || 'info'"
                effect="dark"
                size="small"
              >{{ node.status_display }}</el-tag>
              <span class="node-mode">{{ node.approval_mode_display }} / {{ node.approver_type_display }}</span>
            </div>
            <div class="node-approvers">
              <span class="label">{{ t('message.pages.scriptLibrary.approveDetailCandidates') }}</span>
              <el-tag
                v-for="approver in node.candidate_approvers"
                :key="approver.user_id"
                size="small"
                style="margin-right: 6px"
              >{{ approver.username }}</el-tag>
            </div>
            <div v-if="node.approval_records && node.approval_records.length > 0" class="node-records">
              <div class="label">{{ t('message.pages.scriptLibrary.approveDetailRecords') }}</div>
              <div v-for="(record, rIdx) in node.approval_records" :key="rIdx" class="record-item">
                <span class="record-user">{{ record.username }}</span>
                <el-tag :type="record.action === 'approve' ? 'success' : record.action === 'reject' ? 'danger' : 'warning'" size="small">
                  {{ getRecordActionText(record.action) }}
                </el-tag>
                <span v-if="record.reason" class="record-reason">{{ record.reason }}</span>
                <span class="record-time">{{ record.operate_time }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isCurrentUserApprover && currentApprove.status === 'pending'" class="section-title">
          <el-icon><EditPen /></el-icon> {{ t('message.pages.scriptLibrary.approveDetailAction') }}
        </div>
        <div v-if="isCurrentUserApprover && currentApprove.status === 'pending'" class="approve-action">
          <el-input
            v-model="approveRemark"
            type="textarea"
            :rows="3"
            :placeholder="t('message.pages.scriptLibrary.approveRemarkPlaceholder')"
            maxlength="200"
            show-word-limit
          />
          <div class="action-btns">
            <el-button type="success" @click="confirmApprove">{{ t('message.pages.scriptLibrary.approveActionApprove') }}</el-button>
            <el-button type="danger" @click="confirmReject">{{ t('message.pages.scriptLibrary.approveActionReject') }}</el-button>
            <el-button @click="openDelegateDialog">{{ t('message.pages.scriptLibrary.approveActionDelegate') }}</el-button>
            <el-button @click="openAddSignDialog">{{ t('message.pages.scriptLibrary.approveActionAddSign') }}</el-button>
          </div>
        </div>

        <div v-if="currentApprove.status === 'pending' && isMySubmitted" class="section-title">
          <el-icon><Warning /></el-icon> {{ t('message.pages.scriptLibrary.approveDetailMyAction') }}
        </div>
        <div v-if="currentApprove.status === 'pending' && isMySubmitted" class="approve-action">
          <el-button type="danger" @click="cancelApproval(currentApprove)">{{ t('message.pages.scriptLibrary.approveBtnCancelReview') }}</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- Delegate dialog -->
    <el-dialog v-model="delegateDialogVisible" :title="t('message.pages.scriptLibrary.approveActionDelegate')" width="480px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item :label="t('message.pages.scriptLibrary.delegateFormTo')">
          <el-select v-model="delegateForm.to_user_id" :placeholder="t('message.pages.scriptLibrary.delegateSelectPlaceholder')" filterable style="width: 100%">
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.username + (user.name ? ` (${user.name})` : '')"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('message.pages.scriptLibrary.delegateFormReason')">
          <el-input v-model="delegateForm.reason" type="textarea" :rows="3" :placeholder="t('message.pages.scriptLibrary.delegateReasonPlaceholder')" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="delegateDialogVisible = false">{{ t('message.pages.scriptLibrary.formCancel') }}</el-button>
        <el-button type="primary" @click="confirmDelegate" :loading="delegateLoading">{{ t('message.pages.scriptLibrary.delegateBtnConfirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Add-signer dialog -->
    <el-dialog v-model="addSignDialogVisible" :title="t('message.pages.scriptLibrary.approveActionAddSign')" width="480px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item :label="t('message.pages.scriptLibrary.addSignFormUsers')">
          <el-select v-model="addSignForm.user_ids" multiple filterable :placeholder="t('message.pages.scriptLibrary.msgAddSignUserRequired')" style="width: 100%">
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.username + (user.name ? ` (${user.name})` : '')"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('message.pages.scriptLibrary.delegateFormReason')">
          <el-input v-model="addSignForm.reason" type="textarea" :rows="3" :placeholder="t('message.pages.scriptLibrary.addSignReasonPlaceholder')" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addSignDialogVisible = false">{{ t('message.pages.scriptLibrary.formCancel') }}</el-button>
        <el-button type="primary" @click="confirmAddSign" :loading="addSignLoading">{{ t('message.pages.scriptLibrary.addSignBtnConfirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Category management dialog -->
    <el-dialog v-model="categoryDialogVisible" :title="t('message.pages.scriptLibrary.categoryDialogTitle')" width="800px" destroy-on-close>
      <div class="category-manage">
        <div class="category-header">
          <el-button type="primary" size="small" @click="openCategoryForm(null)">
            <el-icon><Plus /></el-icon>
            {{ t('message.pages.scriptLibrary.categoryFormTitleNew') }}
          </el-button>
          <el-button size="small" @click="loadCategoryList">
            <el-icon><Refresh /></el-icon>
            {{ t('message.pages.scriptLibrary.btnRefresh') }}
          </el-button>
        </div>
        <el-table
          v-if="categoryList.length > 0"
          :key="categoryTableKey"
          :data="categoryList"
          row-key="id"
          default-expand-all
          size="small"
          border
          :tree-props="{ children: 'children' }"
          style="margin-top: 12px"
        >
          <el-table-column prop="name" :label="t('message.pages.scriptLibrary.categoryFormNameLabel')" min-width="180" />
          <el-table-column prop="category_type_display" :label="t('message.pages.scriptLibrary.categoryColType')" width="140" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.is_system" type="info" size="small">{{ t('message.pages.scriptLibrary.tagBuiltin') }}</el-tag>
              <el-tag v-else type="success" size="small">{{ t('message.pages.scriptLibrary.categoryTypeCustom') }}</el-tag>
              <el-tag v-if="row.is_virtual" type="warning" size="small" style="margin-left: 4px">{{ t('message.pages.scriptLibrary.categoryTypeVirtual') }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sort" :label="t('message.pages.scriptLibrary.formSortLabel')" width="80" align="center" />
          <el-table-column prop="remark" :label="t('message.pages.scriptLibrary.formRemarkLabel')" min-width="150" show-overflow-tooltip />
          <el-table-column :label="t('message.pages.scriptLibrary.colAction')" width="220" align="center" fixed="right">
            <template #default="{ row }">
              <el-button v-if="!row.is_system" size="small" text type="primary" @click="openCategoryForm(row)">{{ t('message.pages.scriptLibrary.actionEdit') }}</el-button>
              <el-button v-if="!row.is_system" size="small" text type="primary" @click="openCategoryForm(row, true)">{{ t('message.pages.scriptLibrary.categoryFormTitleChild') }}</el-button>
              <el-button v-if="!row.is_system" size="small" text type="danger" @click="deleteCategory(row)">{{ t('message.pages.scriptLibrary.actionDelete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- Category form dialog -->
    <el-dialog v-model="categoryFormVisible" :title="categoryFormTitle" width="520px" destroy-on-close>
      <el-form :model="categoryForm" :rules="categoryFormRules" ref="categoryFormRef" label-width="80px" size="small">
        <el-form-item :label="t('message.pages.scriptLibrary.categoryFormNameLabel')" prop="name">
          <el-input v-model="categoryForm.name" :placeholder="t('message.pages.scriptLibrary.categoryFormNamePlaceholder')" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item :label="t('message.pages.scriptLibrary.categoryFormParent')" prop="parent">
          <el-tree-select
            v-model="categoryForm.parent"
            :data="categoryParentTreeOptions"
            :props="{ label: 'label', value: 'value', children: 'children' }"
            clearable
            :placeholder="t('message.pages.scriptLibrary.categoryParentTop')"
            style="width: 100%"
            check-strictly
            :render-after-expand="false"
          />
          <div style="font-size: 12px; color: #909399; margin-top: 4px">
            {{ categoryForm.isChild ? `${t('message.pages.scriptLibrary.categoryHintCreateChild')}` : t('message.pages.scriptLibrary.categoryHintTopLevel') }}
          </div>
        </el-form-item>
        <el-form-item :label="t('message.pages.scriptLibrary.formSortLabel')">
          <el-input-number v-model="categoryForm.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item :label="t('message.pages.scriptLibrary.categoryFormVirtual')">
          <el-switch v-model="categoryForm.is_virtual" />
          <span style="font-size: 12px; color: #909399; margin-left: 8px">{{ t('message.pages.scriptLibrary.categoryVirtualHint') }}</span>
        </el-form-item>
        <el-form-item :label="t('message.pages.scriptLibrary.formRemarkLabel')">
          <el-input v-model="categoryForm.remark" type="textarea" :rows="3" :placeholder="t('message.pages.scriptLibrary.categoryRemarkPlaceholder')" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item :label="t('message.pages.scriptLibrary.formApproversLabel')">
          <el-select
            v-model="categoryForm.reviewer_ids"
            multiple
            filterable
            :placeholder="t('message.pages.scriptLibrary.categoryReviewerPlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.username + (user.name ? ` (${user.name})` : '')"
              :value="user.id"
            />
          </el-select>
          <div style="font-size: 12px; color: #909399; margin-top: 4px">
            {{ t('message.pages.scriptLibrary.categoryReviewerHint') }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryFormVisible = false">{{ t('message.pages.scriptLibrary.formCancel') }}</el-button>
        <el-button type="primary" @click="saveCategory" :loading="categorySaving">{{ t('message.pages.scriptLibrary.riskBtnOK') }}</el-button>
      </template>
    </el-dialog>

    <!-- Official script sync diff confirmation dialog -->
    <el-dialog
      v-model="officialSyncDialogVisible"
      :title="t('message.pages.scriptLibrary.officialSyncTitle')"
      width="880px"
      top="6vh"
      destroy-on-close
    >
      <div v-loading="officialSyncChecking" class="official-sync-content">
        <el-alert v-if="officialSyncReport" :title="summaryAlertText" type="info" show-icon :closable="false" class="mb-3">
          <template #default>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="label">{{ t('message.pages.scriptLibrary.officialSyncCodebaseTotal') }}</span><b>{{ officialSyncReport.summary.total_codebase }}</b>
              </div>
              <div class="summary-item">
                <span class="label">{{ t('message.pages.scriptLibrary.officialSyncDBTotal') }}</span><b>{{ officialSyncReport.summary.total_db_official }}</b>
              </div>
              <div class="summary-item to-create">
                <span class="label">{{ t('message.pages.scriptLibrary.officialSyncToCreate') }}</span><b>{{ officialSyncReport.summary.to_create }}</b>
              </div>
              <div class="summary-item to-upgrade">
                <span class="label">{{ t('message.pages.scriptLibrary.officialSyncToUpgrade') }}</span><b>{{ officialSyncReport.summary.to_upgrade }}</b>
              </div>
              <div class="summary-item to-discontinue">
                <span class="label">{{ t('message.pages.scriptLibrary.officialSyncDiscontinued') }}</span><b>{{ officialSyncReport.summary.to_discontinue }}</b>
              </div>
              <div class="summary-item up-to-date">
                <span class="label">{{ t('message.pages.scriptLibrary.officialSyncUpToDate') }}</span><b>{{ officialSyncReport.summary.up_to_date }}</b>
              </div>
            </div>
          </template>
        </el-alert>

        <el-tabs v-if="officialSyncReport" v-model="officialSyncActiveTab" type="border-card" class="mt-3">
          <el-tab-pane :label="t('message.pages.scriptLibrary.tabPendingAdd')" :name="'to_create'">
            <el-empty v-if="officialSyncReport.to_create.length === 0" :description="t('message.pages.scriptLibrary.officialSyncNoAdd')" />
            <el-table v-else :data="officialSyncReport.to_create" size="small" stripe border>
              <el-table-column prop="name" :label="t('message.pages.scriptLibrary.approveColScriptName')" min-width="160" show-overflow-tooltip />
              <el-table-column prop="script_type" :label="t('message.pages.scriptLibrary.categoryColType')" width="90" align="center" />
              <el-table-column prop="category_name" :label="t('message.pages.scriptLibrary.tabCategory')" width="120" align="center" />
              <el-table-column prop="official_version" :label="t('message.pages.scriptLibrary.officialSyncVersion')" width="100" align="center" />
              <el-table-column :label="t('message.pages.scriptLibrary.approveColRisk')" width="90" align="center">
                <template #default="{ row }">
                  <el-tag
                    size="small"
                    :type="row.risk_level === 'high' ? 'danger' : row.risk_level === 'medium' ? 'warning' : 'success'"
                  >
                    {{ row.risk_level === 'high' ? t('message.pages.scriptLibrary.riskLevelHighDisplay') : row.risk_level === 'medium' ? t('message.pages.scriptLibrary.riskLevelMediumDisplay') : t('message.pages.scriptLibrary.riskLevelLowDisplay') }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="desc" :label="t('message.pages.scriptLibrary.createEnvDescCol')" min-width="200" show-overflow-tooltip />
            </el-table>
          </el-tab-pane>

          <el-tab-pane :label="t('message.pages.scriptLibrary.tabPendingUpgrade')" :name="'to_upgrade'">
            <el-empty v-if="officialSyncReport.to_upgrade.length === 0" :description="t('message.pages.scriptLibrary.officialSyncNoUpgrade')" />
            <el-table v-else :data="officialSyncReport.to_upgrade" size="small" stripe border>
              <el-table-column prop="name" :label="t('message.pages.scriptLibrary.approveColScriptName')" min-width="150" show-overflow-tooltip />
              <el-table-column :label="t('message.pages.scriptLibrary.officialSyncVersionChange')" width="220" align="center">
                <template #default="{ row }">
                  <el-tag type="info" size="small" effect="plain">{{ row.db_version || t('msgNotRecorded') }}</el-tag>
                  <el-icon class="mx-1 text-xs"><ArrowRight /></el-icon>
                  <el-tag type="success" size="small">{{ row.new_version }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="t('message.pages.scriptLibrary.approveColRisk')" width="90" align="center">
                <template #default="{ row }">
                  <el-tag
                    size="small"
                    :type="row.risk_level === 'high' ? 'danger' : row.risk_level === 'medium' ? 'warning' : 'success'"
                  >
                    {{ row.risk_level === 'high' ? t('message.pages.scriptLibrary.riskLevelHighDisplay') : row.risk_level === 'medium' ? t('message.pages.scriptLibrary.riskLevelMediumDisplay') : t('message.pages.scriptLibrary.riskLevelLowDisplay') }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="changelog" :label="t('message.pages.scriptLibrary.officialSyncChangelog')" min-width="300" show-overflow-tooltip />
            </el-table>
          </el-tab-pane>

          <el-tab-pane :label="t('message.pages.scriptLibrary.tabDiscontinue')" :name="'to_discontinue'">
            <el-empty v-if="officialSyncReport.to_discontinue.length === 0" :description="t('message.pages.scriptLibrary.officialSyncNoDiscontinued')" />
            <el-alert
              v-else
              type="warning"
              show-icon
              :closable="false"
              class="mb-2"
              :title="t('message.pages.scriptLibrary.officialSyncDiscontinueTip')"
            />
            <el-table v-if="officialSyncReport.to_discontinue.length > 0" :data="officialSyncReport.to_discontinue" size="small" stripe border>
              <el-table-column prop="id" label="ID" width="70" align="center" />
              <el-table-column prop="name" :label="t('message.pages.scriptLibrary.approveColScriptName')" min-width="180" show-overflow-tooltip />
              <el-table-column prop="db_version" :label="t('message.pages.scriptLibrary.officialSyncCurrentVersion')" width="120" align="center" />
              <el-table-column prop="status" :label="t('message.pages.scriptLibrary.formStatusLabel')" width="120" align="center" />
            </el-table>
          </el-tab-pane>

          <el-tab-pane :label="t('message.pages.scriptLibrary.officialSyncUpToDateTab')" :name="'up_to_date'">
            <el-empty v-if="officialSyncReport.up_to_date.length === 0" :description="t('message.pages.scriptLibrary.msgEmpty')" />
            <el-table v-else :data="officialSyncReport.up_to_date" size="small" stripe border>
              <el-table-column prop="name" :label="t('message.pages.scriptLibrary.approveColScriptName')" min-width="200" show-overflow-tooltip />
              <el-table-column prop="official_version" :label="t('message.pages.scriptLibrary.officialSyncVersion')" width="150" align="center" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="officialSyncDialogVisible = false">{{ t('message.pages.scriptLibrary.formCancel') }}</el-button>
        <el-button
          type="primary"
          :loading="officialSyncRunning"
          :disabled="!canExecuteSync"
          @click="executeOfficialSync"
        >
          {{ syncButtonText }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Batch import component -->
    <importExcel
      ref="importExcelRef"
      :api="importExcelApi"
      :upload="{ title: t('message.pages.scriptLibrary.importExcelTitle'), open: true, updateSupport: 0 }"
      style="display:none"
    />

    <!-- Share management dialog -->
    <ShareManageDialog
      v-model="shareManageVisible"
      resource-type="script"
      :resource-id="currentShareScript?.id"
      :resource-name="currentShareScript?.name"
      @change="getScriptList"
    />
  </div>
</template>

<script setup lang="ts" name="ScriptLibrary">
import { ref, reactive, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Warning, WarningFilled, Document, EditPen, Plus, Refresh, InfoFilled, Connection, List, CircleCheck, Tools, Delete, ArrowRight, Folder, Share } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useEditionStore } from '/@/editions';
import { useUserInfo } from '/@/stores/userInfo';
import { request } from '/@/utils/service';
import * as scriptApi from '/@/api/taurus/script-library/api';
import { apiPrefix } from '/@/api/taurus/script-library/api';
import * as sharePermissionApi from '/@/api/taurus/share-permission/index';
import * as categoryApi from '/@/api/taurus/script-library/category';
import * as versionApi from '/@/api/taurus/script-library/version';
import * as taskApi from '/@/api/taurus/script-library/task';
import * as auditApi from '/@/api/taurus/script-library/audit';
import * as approveApi from '/@/api/taurus/script-library/approve';
import * as approvalInstanceApi from '/@/api/taurus/script-library/approval-instance';
import * as hostApi from '/@/api/taurus/host/api';
import importExcel from '/@/components/importExcel/index.vue';
import ShareManageDialog from '/@/views/taurus/components/ShareManageDialog.vue';
import * as echarts from 'echarts';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// @ts-ignore
const { t } = useI18n();
self.MonacoEnvironment = {
  getWorker(_: string, label: string) {
    if (label === 'json') return new jsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    return new editorWorker();
  },
};

let scriptEditor: monaco.editor.IStandaloneCodeEditor | null = null;


const router = useRouter();
const hasFeature = (code: string) => useEditionStore().hasFeature(code);

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
    customDesc || eeT('enterpriseOnlyDesc', '该功能仅在 Taurus Ops 企业版中提供。升级到企业版即可解锁审批流、工单、通知等全部高级能力。'),
    eeT('enterpriseOnlyTitle', '企业版专属功能'),
    { confirmButtonText: eeT('upgradeAction', '立即升级'), cancelButtonText: eeT('dismiss', '稍后再说'), type: 'info', showCancelButton: true, closeOnClickModal: true }
  ).then(() => window.dispatchEvent(new CustomEvent('taurus:edition-upgrade', { detail: { code } }))).catch(() => {});
};
const onApproveCenterBtnClick = (e?: MouseEvent) => {
  if (hasFeature('SCRIPT_APPROVAL_FLOW')) {
    openApproveDialog();
    return;
  }
  if (e) e.stopPropagation();
  triggerEeUpgrade('SCRIPT_APPROVAL_FLOW');
};

// ========== Base state ==========
const activeTab = ref('base');
const dialogVisible = ref(false);
const viewScriptMode = ref(false);
const versionDialogVisible = ref(false);
const permissionDialogVisible = ref(false);
const taskDialogVisible = ref(false);
const auditDialogVisible = ref(false);
const categoryDialogVisible = ref(false);
const categoryFormVisible = ref(false);
const shareManageVisible = ref(false);
const currentShareScript = ref<any>(null);
const shareDetailEffectivePerms = ref<string[]>([]);
const shareDetailIsOwner = ref(false);
const searchKey = ref('');
const selectedType = ref('');
const selectedAuth = ref('');
const shareViewTab = ref<'all' | 'mine' | 'public' | 'shared_to_me' | 'shared_by_me'>('all');
const page = reactive({
  current: 1,
  size: 10,
  total: 0,
});
const multipleSelection = ref<any[]>([]);
const importExcelRef = ref<any>(null);
const importExcelApi = apiPrefix;
const fileInputRef = ref<HTMLInputElement | null>(null);
const currentScript = ref<any>(null);
const isEditMode = ref(false);
const scriptEditorRef = ref<HTMLDivElement | null>(null);

// ========== Category management state ==========
const categoryList = ref<any[]>([]);
const categoryTableKey = ref(0);
const categoryFormRef = ref<any>(null);
const categorySaving = ref(false);

const officialSyncDialogVisible = ref(false);
const officialSyncChecking = ref(false);
const officialSyncRunning = ref(false);
const officialSyncReport = ref<any>(null);
const officialSyncActiveTab = ref<'to_create' | 'to_upgrade' | 'to_discontinue' | 'up_to_date'>('to_create');

const canExecuteSync = computed(() => {
  if (!officialSyncReport.value) return false;
  const s = officialSyncReport.value.summary || {};
  return (s.to_create > 0) || (s.to_upgrade > 0);
});

const syncButtonText = computed(() => {
  if (!officialSyncReport.value) return t('message.pages.scriptLibrary.officialSyncBtn');
  const s = officialSyncReport.value.summary || {};
  const parts: string[] = [];
  if (s.to_create > 0) parts.push(t('message.pages.scriptLibrary.syncAddSimple', { count: s.to_create }));
  if (s.to_upgrade > 0) parts.push(t('message.pages.scriptLibrary.syncUpgradeSimple', { count: s.to_upgrade }));
  return parts.length ? `${t('message.pages.scriptLibrary.officialSyncBtn')}（${parts.join('、')}）` : t('message.pages.scriptLibrary.msgAlreadyUpToDate');
});

const summaryAlertText = computed(() => {
  if (!officialSyncReport.value) return '';
  const s = officialSyncReport.value.summary || {};
  const tips: string[] = [];
  if (s.to_create === 0 && s.to_upgrade === 0) {
    tips.push(t('message.pages.scriptLibrary.msgCheckCompleteUpToDate'));
  } else {
    if (s.to_create > 0) tips.push(t('message.pages.scriptLibrary.syncWillAddSimple', { count: s.to_create }));
    if (s.to_upgrade > 0) tips.push(t('message.pages.scriptLibrary.syncWillUpgradeLong', { count: s.to_upgrade }));
  }
  if (s.to_discontinue > 0) tips.push(t('message.pages.scriptLibrary.syncDiscontinueLong', { count: s.to_discontinue }));
  return tips.join('；');
});

const categoryForm = reactive({
  id: null as number | null,
  name: '',
  parent: null as number | null,
  sort: 0,
  is_virtual: false,
  remark: '',
  isChild: false,
  reviewer_ids: [] as number[],
});

const categoryFormTitle = computed(() => {
  if (categoryForm.id) return t('message.pages.scriptLibrary.categoryFormTitleEdit');
  if (categoryForm.isChild) return t('message.pages.scriptLibrary.categoryFormTitleChild');
  return t('message.pages.scriptLibrary.categoryFormTitleNew');
});

const categoryFormRules = {
  name: [
    { required: true, message: t('message.pages.scriptLibrary.categoryFormNamePlaceholder'), trigger: 'blur' },
    { min: 1, max: 100, message: t('message.pages.scriptLibrary.msgFormRuleLength100'), trigger: 'blur' },
  ],
};

// DB IDs of system categories
const mineCategoryId = ref<number | null>(null);
const publicCategoryId = ref<number | null>(null);

// ========== Dashboard state ==========
const showStatBoard = ref(false);
const trendChartRef = ref<HTMLDivElement | null>(null);
const typeChartRef = ref<HTMLDivElement | null>(null);
const resultChartRef = ref<HTMLDivElement | null>(null);
let trendChart: any = null;
let typeChart: any = null;
let resultChart: any = null;

const statData = reactive({
  totalScript: 0,
  publicScript: 0,
  todayExec: 0,
  successRate: 0,
  riskScript: 0,
  pendingApprove: 0,
});

const topExecList = ref<any[]>([]);

// ========== Approval flow state ==========
const approveDialogVisible = ref(false);
const approveActiveTab = ref<'pending_me' | 'my_submitted' | 'done'>('pending_me');
const pendingApproveCount = ref(0);
const pendingMeList = ref<any[]>([]);
const mySubmittedList = ref<any[]>([]);
const doneApproveList = ref<any[]>([]);
const approveDetailVisible = ref(false);
const currentApprove = ref<any>({});
const approveRemark = ref('');
const riskPoints = ref<string[]>([]);
const nodeExecList = ref<any[]>([]);
const delegateDialogVisible = ref(false);
const addSignDialogVisible = ref(false);
const delegateForm = reactive({ to_user_id: null as number | null, reason: '' });
const addSignForm = reactive({ user_ids: [] as number[], reason: '' });
let approveEditor: any = null;

function isPendingStatus(row: any) {
  return row.status === 'Pending approval' || row.status === 2;
}

const SCRIPT_STATUS_NORMAL = 0;
const SCRIPT_STATUS_DISABLED = 1;
const SCRIPT_STATUS_PENDING = 2;
const SCRIPT_STATUS_ARCHIVED = 3;

function getScriptStatusCode(row: any): number {
  const s = row?.status;
  if (s === undefined || s === null) return SCRIPT_STATUS_NORMAL;
  if (typeof s === 'number') return s;
  if (s === 'Normal enabled' || s === 'Enabled') return SCRIPT_STATUS_NORMAL;
  if (s === 'Disabled' || s === 'Offline') return SCRIPT_STATUS_DISABLED;
  if (s === 'Pending approval') return SCRIPT_STATUS_PENDING;
  if (s === 'Archived') return SCRIPT_STATUS_ARCHIVED;
  return Number(s) || SCRIPT_STATUS_NORMAL;
}

function isArchivedStatus(row: any): boolean {
  return getScriptStatusCode(row) === SCRIPT_STATUS_ARCHIVED;
}

function canEditScript(row: any): { ok: boolean; reason?: string } {
  const s = getScriptStatusCode(row);
  if (s === SCRIPT_STATUS_PENDING) return { ok: false, reason: t('message.pages.scriptLibrary.reasonPendingApproval') };
  if (s === SCRIPT_STATUS_ARCHIVED) return { ok: false, reason: t('message.pages.scriptLibrary.reasonArchived') };
  if (!hasSharePerm(row, 'script:edit')) return { ok: false, reason: t('message.pages.scriptLibrary.reasonNoSharePermEdit') };
  return { ok: true };
}

function canManageVersion(row: any): { ok: boolean; reason?: string } {
  const s = getScriptStatusCode(row);
  if (s === SCRIPT_STATUS_PENDING) return { ok: false, reason: t('message.pages.scriptLibrary.reasonPendingVersionChange') };
  if (s === SCRIPT_STATUS_ARCHIVED) return { ok: false, reason: t('message.pages.scriptLibrary.reasonArchivedVersionChange') };
  if (!hasSharePerm(row, 'script:manage_version')) return { ok: false, reason: t('message.pages.scriptLibrary.reasonNoSharePermVersion') };
  return { ok: true };
}

function canConfigPermission(row: any): { ok: boolean; reason?: string } {
  const s = getScriptStatusCode(row);
  if (s === SCRIPT_STATUS_PENDING) return { ok: false, reason: t('message.pages.scriptLibrary.reasonPendingPermConfig') };
  if (s === SCRIPT_STATUS_ARCHIVED) return { ok: false, reason: t('message.pages.scriptLibrary.reasonArchivedPermConfig') };
  if (!hasSharePerm(row, 'script:manage_share')) return { ok: false, reason: t('message.pages.scriptLibrary.reasonNoSharePermShare') };
  return { ok: true };
}

function canManageShare(row: any): { ok: boolean; reason?: string } {
  const s = getScriptStatusCode(row);
  if (s === SCRIPT_STATUS_ARCHIVED) return { ok: false, reason: t('message.pages.scriptLibrary.reasonArchivedShare') };
  if (!hasSharePerm(row, 'script:manage_share')) return { ok: false, reason: t('message.pages.scriptLibrary.reasonNoSharePermShare') };
  return { ok: true };
}

function openShareManage(row: any) {
  if (!canManageShare(row).ok) {
    ElMessage.warning(canManageShare(row).reason || t('message.pages.scriptLibrary.reasonCannotManageShare'));
    return;
  }
  currentShareScript.value = row;
  shareManageVisible.value = true;
}

function canConfigTask(row: any): { ok: boolean; reason?: string } {
  const s = getScriptStatusCode(row);
  if (s === SCRIPT_STATUS_PENDING) return { ok: false, reason: t('message.pages.scriptLibrary.reasonPendingTask') };
  if (s === SCRIPT_STATUS_DISABLED) return { ok: false, reason: t('message.pages.scriptLibrary.reasonDisabledTask') };
  if (s === SCRIPT_STATUS_ARCHIVED) return { ok: false, reason: t('message.pages.scriptLibrary.reasonArchivedTask') };
  if (!hasSharePerm(row, 'script:create_task')) return { ok: false, reason: t('message.pages.scriptLibrary.reasonNoSharePermTask') };
  return { ok: true };
}

function canExecScript(row: any): { ok: boolean; reason?: string } {
  const s = getScriptStatusCode(row);
  if (s === SCRIPT_STATUS_PENDING) return { ok: false, reason: t('message.pages.scriptLibrary.reasonPendingExec') };
  if (s === SCRIPT_STATUS_DISABLED) return { ok: false, reason: t('message.pages.scriptLibrary.reasonDisabledExec') };
  if (s === SCRIPT_STATUS_ARCHIVED) return { ok: false, reason: t('message.pages.scriptLibrary.reasonArchivedExec') };
  if (!hasSharePerm(row, 'script:execute')) return { ok: false, reason: t('message.pages.scriptLibrary.reasonNoSharePermExec') };
  return { ok: true };
}

function canChangeScriptStatus(row: any): { ok: boolean; reason?: string } {
  const s = getScriptStatusCode(row);
  if (s === SCRIPT_STATUS_PENDING) return { ok: false, reason: t('message.pages.scriptLibrary.reasonPendingToggle') };
  if (s === SCRIPT_STATUS_ARCHIVED) return { ok: false, reason: t('message.pages.scriptLibrary.reasonArchivedToggle') };
  if (!hasSharePerm(row, 'script:toggle_status')) {
    const action = s === SCRIPT_STATUS_NORMAL ? t('message.pages.scriptLibrary.optOffline') : t('message.pages.scriptLibrary.formStatusEnabled');
    return { ok: false, reason: `${t('message.pages.scriptLibrary.reasonNoSharePermManage')}: ${t('message.pages.scriptLibrary.reasonNoSharePermActionDetail', { action, perm: 'script:toggle_status' })}` };
  }
  return { ok: true };
}

function canArchiveScript(row: any): { ok: boolean; reason?: string } {
  const s = getScriptStatusCode(row);
  if (s === SCRIPT_STATUS_PENDING) return { ok: false, reason: t('message.pages.scriptLibrary.reasonPendingArchive') };
  if (s === SCRIPT_STATUS_ARCHIVED) return { ok: false, reason: t('message.pages.scriptLibrary.reasonArchivedAlready') };
  if (!hasSharePerm(row, 'script:edit')) return { ok: false, reason: t('message.pages.scriptLibrary.reasonNoSharePermEdit') };
  return { ok: true };
}

function canAuditLog(row: any): { ok: boolean; reason?: string } {
  if (!hasSharePerm(row, 'script:view_audit')) return { ok: false, reason: t('message.pages.scriptLibrary.msgMissingSharePermViewAudit') };
  return { ok: true };
}

function canDeleteScript(row: any): { ok: boolean; reason?: string } {
  const s = getScriptStatusCode(row);
  if (s === SCRIPT_STATUS_NORMAL) return { ok: false, reason: t('message.pages.scriptLibrary.reasonDeleteNormalStatus') };
  if (s === SCRIPT_STATUS_PENDING) return { ok: false, reason: t('message.pages.scriptLibrary.reasonDeletePending') };
  if (!hasSharePerm(row, 'script:delete')) return { ok: false, reason: t('message.pages.scriptLibrary.reasonNoSharePermDelete') };
  return { ok: true };
}

function taskScriptStatus(row: any): number {
  const s = row?.script_status;
  if (s === undefined || s === null) {
    return currentScript.value?.status ?? SCRIPT_STATUS_NORMAL;
  }
  if (typeof s === 'number') return s;
  if (s === 'Normal enabled' || s === 'Enabled') return SCRIPT_STATUS_NORMAL;
  if (s === 'Disabled') return SCRIPT_STATUS_DISABLED;
  if (s === 'Pending approval') return SCRIPT_STATUS_PENDING;
  if (s === 'Archived') return SCRIPT_STATUS_ARCHIVED;
  return Number(s) || SCRIPT_STATUS_NORMAL;
}

function taskScriptBad(row: any): boolean {
  const s = taskScriptStatus(row);
  return s !== SCRIPT_STATUS_NORMAL;
}

function taskHasRunning(row: any): boolean {
  return Number(row?.running_executions_count || 0) > 0;
}

function canEditTask(row: any): { ok: boolean; reason?: string } {
  if (taskScriptStatus(row) === SCRIPT_STATUS_PENDING) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonScriptPendingNoAction') };
  }
  if (taskScriptStatus(row) === SCRIPT_STATUS_DISABLED) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonScriptDisabled') };
  }
  if (taskScriptStatus(row) === SCRIPT_STATUS_ARCHIVED) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonArchivedAlready') };
  }
  return { ok: true };
}

function canExecuteTask(row: any): { ok: boolean; reason?: string } {
  if (!row.enabled) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonTaskDisabled') };
  }
  const s = taskScriptStatus(row);
  if (s === SCRIPT_STATUS_PENDING) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonScriptPendingNoAction') };
  }
  if (s === SCRIPT_STATUS_DISABLED) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonScriptDisabled') };
  }
  if (s === SCRIPT_STATUS_ARCHIVED) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonArchivedAlready') };
  }
  if (row.schedule_type === 'once' && row.is_once_executed) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonOnceTaskExecuted') };
  }
  if (taskHasRunning(row)) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonHasRunningInstance') };
  }
  if (!row.host_count || (Array.isArray(row.hosts) && row.hosts.length === 0)) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonNoHostConfigured') };
  }
  return { ok: true };
}

function canToggleTaskEnabled(row: any): { ok: boolean; reason?: string } {
  const s = taskScriptStatus(row);
  if (s === SCRIPT_STATUS_PENDING) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonScriptPendingNoAction') };
  }
  if (row.enabled) {
    return { ok: true };
  }
  if (s === SCRIPT_STATUS_DISABLED) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonScriptDisabledNotEnable') };
  }
  if (s === SCRIPT_STATUS_ARCHIVED) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonScriptArchivedNotEnable') };
  }
  if (taskHasRunning(row)) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonHasRunningInstance') };
  }
  return { ok: true };
}

function canDeleteTask(row: any): { ok: boolean; reason?: string } {
  if (taskScriptStatus(row) === SCRIPT_STATUS_PENDING) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonScriptPendingNoAction') };
  }
  if (taskHasRunning(row)) {
    return { ok: false, reason: t('message.pages.scriptLibrary.reasonHasRunningInstance') };
  }
  return { ok: true };
}

// Pagination params
const approvalPage = reactive({
  pending_me: { current: 1, size: 10, total: 0 },
  my_submitted: { current: 1, size: 10, total: 0 },
  done: { current: 1, size: 10, total: 0 },
});

// ========== Script form ==========
const scriptForm = reactive({
  id: '',
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

// Script content
const scriptContent = ref('');

// Script parameter list
const scriptParamList = ref<Array<{ key: string; value: string; desc: string }>>([]);

// Script environment variable list
const scriptEnvList = ref<Array<{ key: string; value: string; desc: string }>>([]);

// Category options (flat list, used in category management dialog)
const categoryOptions = ref<Array<{ label: string; value: number; disabled?: boolean; isSystem?: boolean }>>([]);

// Raw category data (used to build tree selector)
const rawCategoryData = ref<any[]>([]);

// Check if a category ID is under a specified system category tree
function isCategoryUnderSystemCat(categoryId: number | null, systemCatId: number | null, cats: any[]): boolean {
  if (!categoryId || !systemCatId) return false;
  const findUnder = (catList: any[]): boolean => {
    for (const c of catList) {
      if (Number(c.id) === categoryId) return true;
      if (c.children?.length && findUnder(c.children)) return true;
    }
    return false;
  };
  const findRoot = (catList: any[]): any => {
    for (const c of catList) {
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

// Filter specified system category and its children from full category tree
function filterCategoryTreeByAuthType(cats: any[], authType: string): any[] {
  if (!authType) return [];
  let targetCatId: number | null = null;
  if (authType === 'private') targetCatId = mineCategoryId.value;
  else if (authType === 'public') targetCatId = publicCategoryId.value;
  if (!targetCatId) return [];
  const buildNode = (c: any): any => ({
    label: c.name,
    value: Number(c.id),
    disabled: c.is_virtual === true,
    children: c.children?.length ? c.children.map(buildNode) : [],
  });
  const findAndExtract = (cats: any[]): any[] => {
    for (const c of cats) {
      if (Number(c.id) === targetCatId) {
        return [buildNode(c)];
      }
      if (c.children?.length) {
        const result = findAndExtract(c.children);
        if (result.length) return result;
      }
    }
    return [];
  };
  return findAndExtract(cats);
}

// Category tree options (for form tree selector) — dynamically filtered by permission
const categoryTreeOptions = computed(() => {
  const allCats = rawCategoryData.value || [];
  const authType = scriptForm.authType;
  return filterCategoryTreeByAuthType(allCats, authType);
});

// View script dialog: display category name (avoid relying on el-tree-select disabled value matching)
const formCategoryLabel = computed(() => {
  // 1. Prefer API-returned category_name
  if (scriptForm.categoryName) return scriptForm.categoryName;
  // 2. CategoryName from current row (assigned during list conversion)
  if (currentScript.value?.categoryName) return currentScript.value.categoryName;
  // 3. Find label by category ID in flat category options
  const catId = scriptForm.category;
  if (catId !== null && catId !== undefined) {
    const opt = categoryOptions.value.find((o) => o.value === Number(catId));
    if (opt) return opt.label;
  }
  return catId !== null && catId !== undefined ? String(catId) : '-';
});

// Category parent tree options (for parent category selection in management dialog)
const categoryParentTreeOptions = computed(() => {
  const buildTree = (cats: any[]): any[] => {
    return cats.map((c) => ({
      label: c.name,
      value: Number(c.id),
      disabled: c.is_virtual === true,
      children: c.children?.length ? buildTree(c.children) : [],
    }));
  };
  return buildTree(rawCategoryData.value || []);
});

async function loadCategoryOptions() {
  try {
    const res = await categoryApi.GetTree();
    const allCategories = res.data || [];

    rawCategoryData.value = allCategories;

    const flattenCategories = (cats: any[]): any[] => {
      const result: any[] = [];
      cats.forEach((c) => {
        result.push({ label: c.name, value: Number(c.id), disabled: c.is_virtual === true });
        if (c.children?.length) {
          result.push(...flattenCategories(c.children));
        }
      });
      return result;
    };
    categoryOptions.value = flattenCategories(allCategories);
  } catch {
    // ignore
  }
}

// Open category management dialog
async function openCategoryDialog() {
  categoryDialogVisible.value = true;
  await loadCategoryList();
}

// Load category list
async function loadCategoryList() {
  try {
    const res = await categoryApi.GetTree();
    const data = res.data || [];
    categoryList.value = data;
    rawCategoryData.value = data;
    categoryTableKey.value++;
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgLoadCategoryFailed'));
  }
}

// Open category form
function openCategoryForm(row: any, isChild = false) {
  if (categoryFormRef.value) {
    categoryFormRef.value.clearValidate();
  }
  categoryForm.isChild = isChild;

  if (userList.value.length === 0) {
    loadUserList();
  }

  if (row && row.id && !isChild) {
    categoryForm.id = row.id;
    categoryForm.name = row.name;
    categoryForm.parent = row.parent || null;
    categoryForm.sort = row.sort ?? 0;
    categoryForm.is_virtual = row.is_virtual === true;
    categoryForm.remark = row.remark || '';
    categoryForm.reviewer_ids = (row.reviewers || []).map((r: any) => r.id);
  } else {
    categoryForm.id = null;
    categoryForm.name = '';
    categoryForm.sort = 0;
    categoryForm.is_virtual = false;
    categoryForm.remark = '';
    categoryForm.reviewer_ids = [];
    if (isChild && row) {
      categoryForm.parent = row.id;
    } else {
      categoryForm.parent = mineCategoryId.value;
    }
  }
  categoryFormVisible.value = true;
}

// Save category
async function saveCategory() {
  if (!categoryFormRef.value) return;
  try {
    await categoryFormRef.value.validate();
  } catch {
    return;
  }

  categorySaving.value = true;
  try {
    if (categoryForm.id) {
      await categoryApi.UpdateObj({
        id: categoryForm.id,
        name: categoryForm.name,
        parent: categoryForm.parent,
        sort: categoryForm.sort,
        is_virtual: categoryForm.is_virtual,
        remark: categoryForm.remark,
        reviewer_ids: categoryForm.reviewer_ids,
      });
      ElMessage.success(t('message.pages.scriptLibrary.msgUpdateSuccess'));
    } else {
      await categoryApi.AddObj({
        name: categoryForm.name,
        parent: categoryForm.parent,
        sort: categoryForm.sort,
        is_virtual: categoryForm.is_virtual,
        remark: categoryForm.remark,
        reviewer_ids: categoryForm.reviewer_ids,
      });
      ElMessage.success(t('message.pages.scriptLibrary.msgCreateSuccess'));
    }
    categoryFormVisible.value = false;
    await Promise.all([
      loadCategoryList(),
      loadCategoryOptions(),
      loadTreeData(),
    ]);
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgTaskSaveFailed'));
  } finally {
    categorySaving.value = false;
  }
}

// Delete category
async function deleteCategory(row: any) {
  if (row.is_system) {
    ElMessage.warning(t('message.pages.scriptLibrary.msgBuiltinCategoryCannotDelete'));
    return;
  }
  try {
    await ElMessageBox.confirm(
      t('message.pages.scriptLibrary.confirmDeleteCategoryLong', { name: row.name }),
      t('message.pages.scriptLibrary.msgConfirmDeleteCategoryTitle'),
      { type: 'warning', confirmButtonText: t('message.pages.scriptLibrary.msgConfirmDeleteTitle'), cancelButtonText: t('message.pages.scriptLibrary.formCancel') }
    );
    await categoryApi.DelObj(row.id);
    ElMessage.success(t('message.pages.scriptLibrary.msgDeleteSuccess'));
    await Promise.all([
      loadCategoryList(),
      loadCategoryOptions(),
      loadTreeData(),
    ]);
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || t('message.pages.scriptLibrary.msgDeleteFailed'));
    }
  }
}

// Permission config form
const permissionForm = reactive({
  viewUsers: [] as string[],
  execUsers: [] as string[],
  editUsers: [] as string[],
});

// ========== Scheduled task variables ==========
const taskActiveTab = ref<'list' | 'form' | 'history'>('list');
const showTaskForm = ref(false);
const editTaskId = ref<string | number | null>(null);
const viewTaskMode = ref(false);
const taskForm = reactive({
  name: '',
  description: '',
  schedule_type: 'cron' as 'cron' | 'interval' | 'once',
  cron_expression: '',
  interval_seconds: 3600,
  run_once_at: '',
  hostsText: '',
  timeout: 300,
  fail_notify: true,
  args: [] as string[],
  envs: {} as Record<string, string>,
  enabled: true,
});
const envKeyMap = reactive<Record<string, string>>({});
const taskList = ref<any[]>([]);
const taskExecutions = ref<any[]>([]);
const taskExecutionsLoading = ref(false);
const selectedTaskForHistory = ref<any>(null);
const taskExecutionsPage = reactive({ current: 1, size: 20, total: 0, totalPages: 1 });
const taskExecutionsFilter = reactive({ exec_status: '' as any, exec_trigger_type: '' as any });
const hostFileInputRef = ref<HTMLInputElement | null>(null);
const hostValidateLoading = ref(false);
const hostCleanInvalidLoading = ref(false);
const hostOutputDialogVisible = ref(false);
const hostOutputLoading = ref(false);
const currentHostOutputs = ref<any[]>([]);
const hostOutputSummary = ref<any>(null);
const activeHostOutputTab = ref<string>('');
const currentOutputExecutionId = ref<any>(null);
const currentHostOutputError = ref<string>('');
const hostOutputPage = reactive({ current: 1, size: 20, total: 0, totalPages: 1 });
const hostOutputFilter = reactive({ keyword: '', status: '' });
const selectedHostRow = ref<any>(null);
const hostDetailLoading = ref(false);
const hostOutputCache = new Map<string, any>();
const hostValidateResult = reactive({
  valid: [] as hostApi.ValidateHostsResult['valid'],
  not_found: [] as string[],
  no_permission: [] as hostApi.ValidateHostsResult['no_permission'],
});
let hostValidatedSnapshot = '';

// ========== Audit log variables ==========
const auditList = ref<any[]>([
  { id: '1', operTime: '2026-07-15 14:30:20', operator: 'admin', operType: 'edit', scriptName: '服务器磁盘巡检脚本', scriptVersion: 'V2.0', detail: '修改脚本内容，优化磁盘阈值判断逻辑', ip: '192.168.1.100' },
  { id: '2', operTime: '2026-07-14 10:15:00', operator: 'admin', operType: 'exec', scriptName: '服务器磁盘巡检脚本', scriptVersion: 'V1.0', detail: '执行脚本，目标主机：192.168.1.10,192.168.1.11', ip: '192.168.1.100' },
  { id: '3', operTime: '2026-07-13 16:45:30', operator: 'ops', operType: 'create', scriptName: 'Windows进程清理脚本', scriptVersion: 'V1.0', detail: '新建PowerShell脚本，用于清理Windows临时进程', ip: '192.168.1.101' },
  { id: '4', operTime: '2026-07-12 09:20:00', operator: 'admin', operType: 'status', scriptName: 'MySQL慢查询统计脚本', scriptVersion: 'V1.0', detail: '将脚本状态从[正常启用]变更为[已下线]', ip: '192.168.1.100' },
  { id: '5', operTime: '2026-07-10 11:30:00', operator: 'admin', operType: 'rollback', scriptName: 'Python自动化备份脚本', scriptVersion: 'V1.0', detail: '回滚至V1.0版本，回滚原因：V2.0存在BUG', ip: '192.168.1.100' },
]);
const auditFilter = reactive({
  operType: '',
  operator: '',
  timeRange: [] as string[],
});
const auditPage = reactive({
  current: 1,
  size: 10,
  total: 5,
});

// Version list (mock data)
const versionList = ref<any[]>([]);
const currentVersion = ref('');
const compareMode = ref(false);
const selectedOldVersion = ref('');
const versionCodeMap = ref<Record<string, string>>({});

// ========== Permission config variables ==========
const authList = ref<any[]>([
  { id: '1', subjectName: '运维工程师A', subjectType: 'user', authType: 'exec', grantUser: 'admin', grantTime: '2026-07-10 10:00:00' },
  { id: '2', subjectName: '研发组', subjectType: 'role', authType: 'view', grantUser: 'admin', grantTime: '2026-07-08 14:30:00' },
  { id: '3', subjectName: '管理员组', subjectType: 'role', authType: 'edit', grantUser: 'admin', grantTime: '2026-07-05 09:00:00' },
]);
const showAddAuth = ref(false);
const authForm = reactive({
  subjectType: 'user',
  subjectId: '',
  authType: 'view',
});

// ========== Editor config ==========
const editorOptions = ref<monaco.editor.IStandaloneEditorConstructionOptions>({
  automaticLayout: true,
  minimap: { enabled: false },
  fontSize: 14,
  tabSize: 4,
  insertSpaces: true,
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  lineNumbers: 'on',
  theme: 'vs-dark',
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
  // @ts-ignore Monaco supports this at runtime but TS types do not include it
  semanticHighlighting: true,
});

// ========== Data list ==========
const scriptList = ref<any[]>([]);

// Action column width: system scripts have fewer action buttons (220), regular scripts have more (360)
const opColumnMinWidth = computed(() => (scriptList.value.some((s: any) => s.isOfficial) ? 220 : 360));

// Left tree data - initialized empty, loaded from API via loadTreeData
const treeData = ref<any[]>([]);

// Load category tree data - fetch real category data from backend API
async function loadTreeData() {
  try {
    const res = await categoryApi.GetTree();
    const allCategories = res.data || [];

    // System categories use fixed string IDs for easy frontend filter logic identification
    const systemIdMap: Record<string, string> = {
      [t('message.pages.scriptLibrary.scopeAll')]: 'all',
      [t('message.pages.scriptLibrary.dictMineScript')]: 'mine',
      [t('message.pages.scriptLibrary.scopePublic')]: 'public',
      [t('message.pages.scriptLibrary.dictPendingScript')]: 'pending',
      [t('message.pages.scriptLibrary.dictArchiveScript')]: 'archive',
    };

    // Convert category data to tree node format
    const convertCategoryNode = (cats: any[]): any[] => {
      return cats.map((c: any) => ({
        id: String(c.id),
        label: c.name,
        count: c.script_count || 0,
        categoryType: c.category_type,
        isSystem: c.is_system,
        children: c.children?.length ? convertCategoryNode(c.children) : [],
      }));
    };

    // Separate system categories from user categories
    const systemCategories = allCategories.filter((c: any) => c.category_type === 'system');

    // Record system category DB IDs
    systemCategories.forEach((c: any) => {
      if (c.name === 'My scripts') mineCategoryId.value = c.id;
      if (c.name === 'Public scripts') publicCategoryId.value = c.id;
    });

    // Build system category nodes, directly use backend-returned children
    const systemNodes = systemCategories.map((c: any) => ({
      id: systemIdMap[c.name] || String(c.id),
      label: c.name,
      count: c.script_count || 0,
      categoryType: c.category_type,
      isSystem: c.is_system,
      children: c.children?.length ? convertCategoryNode(c.children) : [],
    }));

    // Build complete tree structure
    treeData.value = systemNodes;
  } catch {
    treeData.value = [];
  }
}

// Currently selected category
const currentCategory = ref<string>('all');

// Filtered script list - use ref not computed, avoid losing el-table selection state from new arrays each time
const filteredScriptList = ref<any[]>([]);

// Recursively get IDs of category node and all its children
function getCategoryDescendantIds(targetId: string, nodes: any[] = treeData.value): string[] {
  const result: string[] = [];
  const findAndCollect = (nodeList: any[]): boolean => {
    for (const node of nodeList) {
      if (node.id === targetId) {
        // Find target node, collect itself and all descendants
        const collectAll = (n: any) => {
          result.push(n.id);
          if (n.children && n.children.length > 0) {
            n.children.forEach(collectAll);
          }
        };
        collectAll(node);
        return true;
      }
      if (node.children && node.children.length > 0) {
        if (findAndCollect(node.children)) {
          return true;
        }
      }
    }
    return false;
  };
  findAndCollect(nodes);
  return result;
}

function applyFilter() {
  let list = scriptList.value;

  if (searchKey.value) {
    const key = searchKey.value.toLowerCase();
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(key) ||
        (item.tags && item.tags.toLowerCase().includes(key)) ||
        (item.creator && item.creator.toLowerCase().includes(key))
    );
  }

  filteredScriptList.value = list;
}

// High-risk command list
const riskKeys = ['rm -rf', 'mkfs', 'format', 'killall', 'drop database', 'truncate', 'del /s', 'shutdown'];

// ========== Init ==========
onMounted(() => {
  loadCategoryOptions();
  loadTreeData();
  getScriptList();
  getStatData();
  window.addEventListener('resize', resizeCharts);
});

onBeforeUnmount(() => {
  destroyCharts();
  destroyScriptEditor();
  window.removeEventListener('resize', resizeCharts);
});

// ========== Script editor (Monaco) ==========
function initScriptEditor() {
  if (!scriptEditorRef.value || scriptEditor) return;
  scriptEditor = monaco.editor.create(scriptEditorRef.value, {
    value: scriptContent.value,
    language: getEditorLang(scriptForm.type),
    ...editorOptions.value,
  });
  scriptEditor.onDidChangeModelContent(() => {
    scriptContent.value = scriptEditor?.getValue() || '';
  });
}

function destroyScriptEditor() {
  if (scriptEditor) {
    scriptEditor.dispose();
    scriptEditor = null;
  }
}

function setScriptEditorValue(value: string) {
  nextTick(() => {
    if (scriptEditor) {
      scriptEditor.setValue(value);
    }
  });
}

function setScriptEditorLanguage(type: string) {
  nextTick(() => {
    const model = scriptEditor?.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, getEditorLang(type));
    }
  });
}

watch(
  () => dialogVisible.value,
  (visible) => {
    if (visible) {
      // Initialize immediately if already on "Script content" tab when dialog opens; otherwise init when user switches to that tab
      nextTick(() => {
        if (activeTab.value === 'content') {
          initScriptEditor();
          // Container size may be abnormal from hidden tab; delay one frame then force relayout
          requestAnimationFrame(() => {
            scriptEditor?.layout();
          });
        }
      });
    } else {
      destroyScriptEditor();
    }
  },
);

// Initialize Monaco editor when switching to "Script content" tab (ensure container has correct size)
watch(
  () => activeTab.value,
  (tabName) => {
    if (dialogVisible.value && tabName === 'content') {
      nextTick(() => {
        initScriptEditor();
        // Force relayout after tab switch restores container size
        requestAnimationFrame(() => {
          scriptEditor?.layout();
        });
      });
    }
  },
);

watch(
  () => scriptForm.type,
  (type) => {
    if (scriptEditor) setScriptEditorLanguage(type);
  },
);

// Watch category changes, reload list data
watch(
  () => currentCategory.value,
  () => {
    page.current = 1;
    getScriptList();
    multipleSelection.value = [];
  },
);

// Watch search keyword changes, reload list
watch(
  () => searchKey.value,
  () => {
    page.current = 1;
    getScriptList();
    multipleSelection.value = [];
  },
);

watch(
  () => taskForm.hostsText,
  (newVal, oldVal) => {
    if (newVal !== oldVal && hostValidatedSnapshot && newVal !== hostValidatedSnapshot) {
      clearHostValidateResult();
    }
  },
);

// ========== Utility functions ==========

// Get editor language (monaco language ID mapping)
function getEditorLang(type: string): string {
  const langMap: Record<string, string> = {
    Shell: 'shell',
    Python3: 'python',
    PowerShell: 'powershell',
    Bat: 'bat',
    SQL: 'sql',
  };
  return langMap[type] || 'shell';
}

// Script type tag color
function typeTagType(type: string): string {
  const typeMap: Record<string, string> = {
    Shell: 'info',
    Python3: 'success',
    PowerShell: 'warning',
    Bat: '',
    SQL: 'danger',
  };
  return typeMap[type] || 'info';
}

// Permission tag type
function authTagType(type: string | null | undefined): string {
  if (!type) return 'info';
  if (type === 'private') return 'info';
  if (type === 'public') return 'success';
  return 'info';
}

// Status tag type
function statusTagType(status: number | string): string {
  // Backend returns integer: 0-Normal enabled, 1-Disabled, 2-Pending approval, 3-Archived
  if (status === 0 || status === 'Normal enabled') return 'success';
  if (status === 1 || status === 'Disabled') return 'info';
  if (status === 2 || status === 'Pending approval') return 'warning';
  if (status === 3 || status === 'Archived') return 'danger';
  return 'info'; // Default value, avoid empty string
}

// Risk level tag type
function riskTagType(level: string): string {
  if (level === 'high') return 'danger';
  if (level === 'medium') return 'warning';
  if (level === 'low') return 'success';
  return 'info';
}

// Trigger method display text
function triggerTypeText(type: string | null | undefined): string {
  const map: Record<string, string> = {
    schedule: t('message.pages.scriptLibrary.taskTriggerSchedule'),
    manual: t('message.pages.scriptLibrary.taskTriggerManual'),
    api: t('message.pages.scriptLibrary.taskTriggerApi'),
    manual_debug: t('message.pages.scriptLibrary.taskTriggerDebug'),
    compensate: t('message.pages.scriptLibrary.taskTriggerCompensate'),
    cron: t('message.pages.scriptLibrary.taskTriggerSchedule'),
  };
  return map[type || ''] || type || '-';
}

// Trigger method tag type
function triggerTypeTagType(type: string | null | undefined): string {
  const map: Record<string, string> = {
    schedule: 'primary',
    manual: 'warning',
    api: 'success',
    manual_debug: 'danger',
    compensate: 'info',
  };
  return map[type || ''] || 'info';
}

// ========== Data fetching ==========

// Get script list
async function getScriptList() {
  try {
    const params: any = {
      page: page.current,
      limit: page.size,
    };
    if (searchKey.value) params.search = searchKey.value;
    // View tab: prefer shareViewTab, then overlay left tree category
    if (shareViewTab.value === 'mine') {
      params.mine = 'true';
    } else if (shareViewTab.value === 'public') {
      params.auth_type = 'public';
    } else if (shareViewTab.value === 'shared_to_me') {
      params.view = 'shared_to_me';
    } else if (shareViewTab.value === 'shared_by_me') {
      params.view = 'shared_by_me';
    } else {
      // Left category filter (only applies to "All" tab, avoid conflicts)
      if (currentCategory.value === 'mine') {
        params.mine = 'true';
      } else if (currentCategory.value === 'public') {
        params.auth_type = 'public';
      } else if (currentCategory.value === 'pending') {
        params.status = 2;
      } else if (currentCategory.value === 'archive') {
        params.status = 3;
      } else if (currentCategory.value && currentCategory.value !== 'all') {
        params.category = currentCategory.value;
      }
    }
    if (selectedType.value) params.script_type = selectedType.value;
    if (selectedAuth.value && !params.auth_type) params.auth_type = selectedAuth.value;

    const res = await scriptApi.GetList(params);
    const data = res.results || res.data || [];
    const total = res.count ?? res.total ?? data.length;

    // Backend field -> frontend field conversion
    scriptList.value = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      type: item.script_type,
      category: String(item.category || ''),
      categoryName: item.category_name || '',
      authType: item.auth_type,
      status: item.status === 0 ? t('message.pages.scriptLibrary.statusNormal') : item.status === 1 ? t('message.pages.scriptLibrary.statusOffline') : item.status === 2 ? t('message.pages.scriptLibrary.statusPending') : t('message.pages.scriptLibrary.statusArchived'),
      version: item.current_version,
      creator: item.creator_name || item.creator,
      updateTime: item.update_datetime || item.create_datetime,
      tags: item.tags,
      desc: item.desc,
      content: item.content,
      timeout: item.timeout,
      concurrent: item.concurrent,
      failStrategy: item.fail_strategy,
      openRiskCheck: item.open_risk_check,
      needAudit: item.need_audit,
      logRetention: item.log_retention,
      script_params: item.script_params,
      script_envs: item.script_envs,
      isOfficial: item.is_official,
      riskLevel: item.risk_level,
      riskLevelDisplay: item.risk_level_display,
      supportedSystems: item.supported_systems,
      officialVersion: item.official_version,
      source: item.source,
      licenseType: item.license_type,
      changelog: item.changelog,
      share_summary: item.share_summary || { total: 0, direct_count: 0, link_count: 0, subjects: [], links: [] },
      current_perms: item.current_perms || [],
    }));

    applyFilter();
    page.total = total;
    loadTreeData();
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgGetScriptListFailed'));
    scriptList.value = [];
    filteredScriptList.value = [];
    page.total = 0;
  }
}

// Tree node clicked
function handleTreeClick(data: any) {
  currentCategory.value = data.id;
  if (shareViewTab.value !== 'all') {
    shareViewTab.value = 'all';
    ElMessage.info(t('message.pages.scriptLibrary.switchToAllView', { label: data.label }));
  } else {
    ElMessage.info(t('message.pages.scriptLibrary.filterByCat', { label: data.label }));
  }
  getScriptList();
}

function onShareViewTabChange(name: string) {
  currentCategory.value = 'all';
  page.current = 1;
  getScriptList();
}

// Tooltip: expiry time MM-DD hh:mm
function formatExpire(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return t('message.pages.scriptLibrary.expireAt', { mm, dd, hh, mi });
  } catch (e) {
    return '';
  }
}

// Helper: check if a row has a share permission
// Permission aliases: execute implies trial_run (trial run is a subset of execute);
//          edit implies edit_content / edit_config / manage_version (edit sub-items)
// Enable strict matching only when current_perms.length > 0 (backend explicitly injected non-empty permission list);
// Otherwise fallback: public scripts default to all public permissions, private scripts only have full permissions for creator/admin (backend serializer already injects all current_perms, fallback here is only for compat)
const _scriptAliasMap: Record<string, string[]> = {
  'script:trial_run': ['script:execute'],
  'script:edit_content': ['script:edit'],
  'script:edit_config': ['script:edit'],
  'script:manage_version': ['script:edit'],
};
function hasSharePerm(row: any, permCode: string): boolean {
  if (!row) return false;
  const isPublic = row.authType === 'public';
  // 1) Has explicit non-empty current_perms → strict match (trust backend-injected complete permissions)
  if (row.current_perms && Array.isArray(row.current_perms) && row.current_perms.length > 0) {
    if (row.current_perms.includes(permCode)) return true;
    const aliases = _scriptAliasMap[permCode];
    if (aliases && aliases.some((a) => row.current_perms.includes(a))) return true;
    return false;
  }
  // 2) Has current_perms but it is empty []: backend explicitly injected "no permissions" set
  //    But public scripts should at least have public default permissions (list API may miss them if no prefetch), so add another public check here
  if (row.current_perms && Array.isArray(row.current_perms)) {
    // length === 0, backend did not inject or explicitly no permissions; only public script default permissions as fallback
    const publicDefault: Set<string> = new Set([
      'script:view', 'script:view_version', 'script:view_audit', 'script:view_exec_history',
      'script:trial_run', 'script:execute', 'script:copy',
    ]);
    if (isPublic && publicDefault.has(permCode)) return true;
    const aliases = _scriptAliasMap[permCode];
    if (isPublic && aliases && aliases.some((a) => publicDefault.has(a))) return true;
    return false;
  }
  // 3) No current_perms field at all (old API / cache not refreshed etc.): use permissive fallback, actual permissions enforced by backend API
  // 3.1 Public scripts: default open to all public permissions
  if (isPublic) {
    const publicDefault: Set<string> = new Set([
      'script:view', 'script:view_version', 'script:view_audit', 'script:view_exec_history',
      'script:trial_run', 'script:execute', 'script:copy',
    ]);
    if (publicDefault.has(permCode)) return true;
    const aliases = _scriptAliasMap[permCode];
    if (aliases && aliases.some((a) => publicDefault.has(a))) return true;
  }
  // 3.2 View always as fallback (old data compat)
  if (permCode === 'script:view') return true;
  return false;
}

// ========== Script operations ==========

// Fill script form (shared by view/edit modes)
function _fillScriptFormFromDetail(row: any, detail: any | null) {
  currentScript.value = row;
  if (detail) {
    Object.assign(scriptForm, {
      id: detail.id || row.id,
      name: detail.name || row.name,
      type: detail.script_type || row.type,
      category: detail.category !== undefined ? Number(detail.category) : (row.category !== undefined ? Number(row.category) : null),
      categoryName: detail.category_name || row.categoryName || '',
      authType: detail.auth_type || row.authType,
      tags: detail.tags || row.tags || '',
      desc: detail.desc || row.desc || '',
      timeout: detail.timeout !== undefined ? detail.timeout : (row.timeout || 300),
      concurrent: detail.concurrent !== undefined ? detail.concurrent : (row.concurrent || 10),
      failStrategy: detail.fail_strategy || row.failStrategy || 'continue',
      openRiskCheck: detail.open_risk_check !== undefined ? detail.open_risk_check : (row.openRiskCheck !== undefined ? row.openRiskCheck : true),
      needAudit: detail.need_audit !== undefined ? detail.need_audit : (row.needAudit !== undefined ? row.needAudit : false),
      logRetention: detail.log_retention !== undefined ? detail.log_retention : (row.logRetention || 3650),
    });
    scriptParamList.value = detail.script_params || [];
    scriptEnvList.value = detail.script_envs || [];
    scriptContent.value = detail.content || '';
  } else {
    Object.assign(scriptForm, {
      id: row.id,
      name: row.name,
      type: row.type,
      category: row.category,
      categoryName: row.categoryName || '',
      authType: row.authType,
      tags: row.tags || '',
      desc: row.desc || '',
      timeout: row.timeout || 300,
      concurrent: row.concurrent || 10,
      failStrategy: row.failStrategy || 'continue',
      openRiskCheck: row.openRiskCheck !== undefined ? row.openRiskCheck : true,
      needAudit: row.needAudit !== undefined ? row.needAudit : false,
      logRetention: row.logRetention || 3650,
    });
    scriptParamList.value = [];
    scriptEnvList.value = [];
    scriptContent.value = row.content || '';
  }
  nextTick(() => {
    setScriptEditorValue(scriptContent.value);
    // Editor readonly conditions: view mode / no script:view_content permission / has view_content but no script:edit
    const canViewContent = detailHasPerm('script:view_content');
    const canEditContent = detailHasPerm('script:edit');
    if (scriptEditor) {
      if (!canViewContent) {
        // No content view permission at all → clear + completely readonly
        scriptEditor.setValue(t('message.pages.scriptLibrary.msgScriptHidden'));
      }
      scriptEditor.updateOptions({ readOnly: viewScriptMode.value || !canEditContent || !canViewContent });
    }
    if (!canViewContent) {
      // Also hide params/env vars when no content permission, avoid leakage
      scriptParamList.value = [];
      scriptEnvList.value = [];
    }
  });
}

async function _loadDetailAndFill(row: any) {
  try {
    const detailRes = await scriptApi.GetObj(row.id);
    _fillScriptFormFromDetail(row, detailRes.data || {});
  } catch {
    // ignore
    _fillScriptFormFromDetail(row, null);
  }
}

// Open create dialog
function openCreateDialog() {
  isEditMode.value = false;
  viewScriptMode.value = false;
  dialogVisible.value = true;
  activeTab.value = 'base';
  scriptParamList.value = [];
  scriptEnvList.value = [];
  scriptContent.value = '# ' + t('message.pages.scriptLibrary.slDefaultScriptContent') + '\n';
  Object.assign(scriptForm, {
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
  nextTick(() => {
    setScriptEditorValue(scriptContent.value);
    if (scriptEditor) {
      const canEdit = detailHasPerm('script:edit');
      const canView = detailHasPerm('script:view_content');
      scriptEditor.updateOptions({ readOnly: !canEdit || !canView });
    }
  });
}

// Open view dialog
async function openScriptView(row: any) {
  isEditMode.value = true;
  viewScriptMode.value = true;
  shareDetailEffectivePerms.value = [];
  shareDetailIsOwner.value = false;
  dialogVisible.value = true;
  activeTab.value = 'base';
  try {
    const permResp = await sharePermissionApi.getScriptEffectivePerms(row.id);
    const d = permResp.data || {};
    shareDetailEffectivePerms.value = d.permissions || d.data?.permissions || [];
    shareDetailIsOwner.value = !!d.is_owner || !!d.data?.is_owner;
  } catch (e: any) { /* ignore: default view-only fallback */ }
  // If no script:view_content, force degrade to no-content view (only script:view_metadata permission)
  if (shareDetailEffectivePerms.value.length > 0 && !shareDetailEffectivePerms.value.includes('script:view_content')) {
    ElMessage.warning(t('message.pages.scriptLibrary.msgMetaOnlyVisible'));
  }
  await _loadDetailAndFill(row);
}

// Open edit dialog
async function openEditDialog(row: any) {
  isEditMode.value = true;
  viewScriptMode.value = false;
  shareDetailEffectivePerms.value = [];
  shareDetailIsOwner.value = false;
  currentScript.value = row;
  dialogVisible.value = true;
  activeTab.value = 'base';
  try {
    const permResp = await sharePermissionApi.getScriptEffectivePerms(row.id);
    const d = permResp.data || {};
    shareDetailEffectivePerms.value = d.permissions || d.data?.permissions || [];
    shareDetailIsOwner.value = !!d.is_owner || !!d.data?.is_owner;
  } catch (e: any) { /* ignore */ }
  await _loadDetailAndFill(row);
}

function detailHasPerm(code: string): boolean {
  if (shareDetailIsOwner.value) return true;
  if (shareDetailEffectivePerms.value.length === 0) {
    // Backward-compat old data: viewScriptMode treated as fully visible; edit mode treated as editable by default (backend enforces)
    return viewScriptMode.value ? code.startsWith('script:view') : true;
  }
  return shareDetailEffectivePerms.value.includes(code);
}

// Format code
function formatCode() {
  ElMessage.info(t('message.pages.scriptLibrary.msgFormatCodeNotImpl'));
}

// High-risk code detection
const riskCheckVisible = ref(false);
const riskCheckResult = ref<any>({
  risk_level: 'low',
  risk_level_display: t('message.pages.scriptLibrary.riskLevelLowDisplay'),
  total_count: 0,
  error_count: 0,
  warning_count: 0,
  info_count: 0,
  tools_used: [],
  issues: [],
});
const riskChecking = ref(false);

async function checkRiskCode() {
  const code = scriptContent.value;
  if (!code || !code.trim()) {
    ElMessage.warning(t('message.pages.scriptLibrary.msgPleaseInputContent'));
    return;
  }
  riskChecking.value = true;
  try {
    const res: any = await scriptApi.checkRisk(code, scriptForm.type);
    if (res && res.data) {
      riskCheckResult.value = res.data;
    }
    riskCheckVisible.value = true;
  } catch (e: any) {
    ElMessage.error(e?.message || t('message.pages.scriptLibrary.msgDetectFailedShort'));
  } finally {
    riskChecking.value = false;
  }
}

// Clear code
function clearEditor() {
  scriptContent.value = '';
  if (scriptEditor) scriptEditor.setValue('');
}

// Import local file
function uploadScriptFile() {
  fileInputRef.value?.click();
}

// Handle file upload
function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = (e.target?.result as string) || '';
    scriptContent.value = text;
    if (scriptEditor) scriptEditor.setValue(text);
    ElMessage.success(`${t('message.pages.scriptLibrary.msgFileImported')}${file.name}`);
  };
  reader.readAsText(file);

  // Reset input, ensure same file can be uploaded repeatedly
  target.value = '';
}

// Save script
async function saveScript() {
  if (!scriptForm.name.trim()) {
    return ElMessage.warning(t('message.pages.scriptLibrary.createNamePlaceholder'));
  }
  if (!scriptForm.type) {
    return ElMessage.warning(t('message.pages.scriptLibrary.createTypePlaceholder'));
  }
  if (scriptForm.category === null || scriptForm.category === undefined) {
    return ElMessage.warning(t('message.pages.scriptLibrary.msgPleaseSelectCategory'));
  }

  // High-risk detection
  const code = scriptContent.value;
  let detectedRiskLevel: string = '';
  if (scriptForm.openRiskCheck) {
    try {
      const riskRes: any = await scriptApi.checkRisk(code, scriptForm.type);
      const risk = riskRes?.data;
      detectedRiskLevel = risk?.risk_level || '';
      if (risk && risk.risk_level === 'high') {
        await ElMessageBox.confirm(
          t('message.pages.scriptLibrary.detectHighSaveConfirm', { error: risk.error_count, warn: risk.warning_count }),
          t('message.pages.scriptLibrary.riskConfirmTitle'),
          { type: 'error', confirmButtonText: t('message.pages.scriptLibrary.confirmSaveBtn'), cancelButtonText: t('message.pages.scriptLibrary.formCancel') }
        );
      } else if (risk && risk.risk_level === 'medium') {
        await ElMessageBox.confirm(
          t('message.pages.scriptLibrary.detectMediumSaveConfirm', { error: risk.error_count || 0, warn: risk.warning_count || 0 }),
          t('message.pages.scriptLibrary.riskConfirmTitle'),
          { type: 'warning', confirmButtonText: t('message.pages.scriptLibrary.confirmSaveBtn'), cancelButtonText: t('message.pages.scriptLibrary.formCancel') }
        );
      }
    } catch {
      return;
    }
  }

  const payload: any = {
    name: scriptForm.name,
    script_type: scriptForm.type,
    category: scriptForm.category || null,
    auth_type: scriptForm.authType,
    tags: scriptForm.tags,
    desc: scriptForm.desc,
    content: code,
    timeout: scriptForm.timeout,
    concurrent: scriptForm.concurrent,
    fail_strategy: scriptForm.failStrategy,
    open_risk_check: scriptForm.openRiskCheck,
    need_audit: scriptForm.needAudit,
    log_retention: scriptForm.logRetention,
    script_params: scriptParamList.value.filter((p) => p.key.trim()),
    script_envs: scriptEnvList.value.filter((p) => p.key.trim()),
  };
  if (detectedRiskLevel) {
    payload.risk_level = detectedRiskLevel;
  }

  try {
    if (isEditMode.value) {
      payload.id = scriptForm.id;
      const res = await scriptApi.UpdateObj(payload);
      if (res.data?.status === 2) {
        ElMessage.success(t('message.pages.scriptLibrary.msgScriptUpdateSubmitted'));
      } else {
        ElMessage.success(t('message.pages.scriptLibrary.msgScriptUpdateNewVersion'));
      }
    } else {
      const res = await scriptApi.AddObj(payload);
      if (res.data?.status === 2) {
        ElMessage.success(t('message.pages.scriptLibrary.msgScriptSaveSubmitted'));
      } else {
        ElMessage.success(t('message.pages.scriptLibrary.msgScriptSaveV1'));
      }
    }

    dialogVisible.value = false;
    getScriptList();
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgScriptSaveFailed'));
  }
}

// Copy script
function copyScript(row: any) {
  openCreateDialog();
  scriptForm.name = row.name + t('message.pages.scriptLibrary.scriptNameCopySuffix');
  scriptForm.type = row.type;
  scriptForm.category = Number(row.category);
  scriptForm.desc = row.desc;
  scriptContent.value = `# ${t('message.pages.scriptLibrary.msgCopyFrom')}：${row.name}\n${row.content || ''}`;
}

// Save as (official script)
async function saveAsScript(row: any) {
  try {
    const { value: newName } = await ElMessageBox.prompt(
      t('message.pages.scriptLibrary.msgInputScriptName'),
      t('message.pages.scriptLibrary.msgSaveAsPrivate'),
      {
        confirmButtonText: t('message.pages.scriptLibrary.msgConfirm'),
        cancelButtonText: t('message.pages.scriptLibrary.formCancel'),
        inputValue: row.name + t('message.pages.scriptLibrary.scriptNameCopySuffix'),
        inputValidator: (val: string) => {
          if (!val || !val.trim()) return t('message.pages.scriptLibrary.msgFormRuleLength50');
          return true;
        },
      }
    );
    const res: any = await scriptApi.saveAsScript(row.id, { name: newName });
    ElMessage.success(res.msg || t('message.pages.scriptLibrary.msgSaveAsScriptSuccess'));
    getScriptList();
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || t('message.pages.scriptLibrary.msgCopyScriptFailed'));
    }
  }
}

// Check official script updates and show diff confirmation
async function handleInitOfficial() {
  officialSyncDialogVisible.value = true;
  officialSyncReport.value = null;
  officialSyncChecking.value = true;
  officialSyncActiveTab.value = 'to_create';
  try {
    const res: any = await scriptApi.checkOfficialUpdates();
    officialSyncReport.value = res.data || res || {};
    const s = (officialSyncReport.value.summary || {}) as any;
    if (s.to_upgrade > 0) {
      officialSyncActiveTab.value = 'to_upgrade';
    } else if (s.to_create > 0) {
      officialSyncActiveTab.value = 'to_create';
    } else if (s.to_discontinue > 0) {
      officialSyncActiveTab.value = 'to_discontinue';
    } else {
      officialSyncActiveTab.value = 'up_to_date';
    }
  } catch (e: any) {
    officialSyncDialogVisible.value = false;
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgCheckOfficialFailed'));
  } finally {
    officialSyncChecking.value = false;
  }
}

// Execute official script sync
async function executeOfficialSync() {
  if (!canExecuteSync.value) return;
  try {
    const s = (officialSyncReport.value.summary || {}) as any;
    const parts: string[] = [];
    if (s.to_create > 0) parts.push(t('message.pages.scriptLibrary.syncAddAuditCreate', { count: s.to_create }));
    if (s.to_upgrade > 0) parts.push(t('message.pages.scriptLibrary.syncUpgradeScript', { count: s.to_upgrade }));
    await ElMessageBox.confirm(
      t('message.pages.scriptLibrary.confirmSyncMsg', { parts: parts.join('，') }),
      t('message.pages.scriptLibrary.confirmSyncTitle'),
      { type: 'warning', confirmButtonText: t('message.pages.scriptLibrary.officialSyncBtn'), cancelButtonText: t('message.pages.scriptLibrary.formCancel') }
    );
  } catch (e) {
    if (e === 'cancel') return;
  }

  officialSyncRunning.value = true;
  try {
    const res: any = await scriptApi.syncOfficialScripts('upgrade');
    const data = res.data || {};
    const tip = t('message.pages.scriptLibrary.syncCompleteTip', { created: data.created || 0, upgraded: data.upgraded || 0, skipped: data.skipped || 0 }) +
      (data.discontinued ? t('message.pages.scriptLibrary.syncDiscontinueSuffix', { discontinued: data.discontinued }) : '') +
      ((data.errors || []).length ? t('message.pages.scriptLibrary.syncFailedSuffix', { count: (data.errors || []).length }) : '');
    if ((data.errors || []).length > 0) {
      ElMessage.error(tip + '：' + data.errors.join('；'));
    } else {
      ElMessage.success(tip);
    }
    officialSyncDialogVisible.value = false;
    getScriptList();
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgSyncOfficialFailed'));
  } finally {
    officialSyncRunning.value = false;
  }
}

// Toggle online/offline status
async function changeStatus(row: any) {
  try {
    const res: any = await scriptApi.toggleStatus(row.id);
    ElMessage.success(res.msg || t('message.pages.scriptLibrary.msgStatusModified'));
    getScriptList();
  } catch {
    // ignore
  }
}

// Archive script
async function handleArchive(row: any) {
  try {
    await ElMessageBox.confirm(
      t('message.pages.scriptLibrary.confirmArchiveLong', { name: row.name }),
      t('message.pages.scriptLibrary.confirmArchiveTitle'),
      { type: 'warning', confirmButtonText: t('message.pages.scriptLibrary.confirmArchiveBtn'), cancelButtonText: t('message.pages.scriptLibrary.formCancel') }
    );
    const res: any = await scriptApi.archiveScript(row.id);
    ElMessage.success(res.msg || t('message.pages.scriptLibrary.msgArchiveSuccess'));
    getScriptList();
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) {
      ElMessage.error(e.message);
    }
  }
}

// Unarchive
async function handleUnarchive(row: any) {
  try {
    await ElMessageBox.confirm(
      t('message.pages.scriptLibrary.confirmUnarchiveLong', { name: row.name }),
      t('message.pages.scriptLibrary.confirmUnarchiveTitle'),
      { type: 'warning', confirmButtonText: t('message.pages.scriptLibrary.confirmUnarchiveBtn'), cancelButtonText: t('message.pages.scriptLibrary.formCancel') }
    );
    const res: any = await scriptApi.unarchiveScript(row.id);
    ElMessage.success(res.msg || t('message.pages.scriptLibrary.msgUnarchiveSuccess'));
    getScriptList();
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) {
      ElMessage.error(e.message);
    }
  }
}

// Delete script
async function deleteScript(row: any) {
  try {
    await ElMessageBox.confirm(
      t('message.pages.scriptLibrary.confirmDeleteLong', { name: row.name }),
      t('message.pages.scriptLibrary.confirmDeleteTitle'),
      { type: 'warning', confirmButtonText: t('message.pages.scriptLibrary.msgConfirmDeleteTitle'), cancelButtonText: t('message.pages.scriptLibrary.formCancel') }
    );
    await scriptApi.DelObj(row.id);
    ElMessage.success(t('message.pages.scriptLibrary.msgDeleteSuccess'));
    getScriptList();
  } catch {
    // User cancelled
  }
}

function onSelectionChange(selection: any[]) {
  multipleSelection.value = selection;
}

// Whether any item selected (controls batch action button state)
const hasSelection = computed(() => {
  return multipleSelection.value && multipleSelection.value.length > 0;
});

const hasUndeletableInSelection = computed(() => {
  return multipleSelection.value.some((row: any) => !canDeleteScript(row).ok);
});

const undeletableSelectionTip = computed(() => {
  const groups: Record<string, string[]> = {};
  multipleSelection.value.forEach((row: any) => {
    const r = canDeleteScript(row);
    if (!r.ok && r.reason) {
      if (!groups[r.reason]) groups[r.reason] = [];
      groups[r.reason].push(row.name || row.scriptName);
    }
  });
  return Object.entries(groups)
    .map(([reason, names]) => `${reason}：${names.join('、')}`)
    .join('；');
});

function batchImport() {
  // Manually open import dialog using importExcel component (directly trigger handleImport inside component)
  if (importExcelRef.value && importExcelRef.value.handleImport) {
    importExcelRef.value.handleImport();
  } else {
    ElMessage.info(t('message.pages.scriptLibrary.msgImportNotReady'));
  }
}

function batchExport() {
  try {
    // Support checked export; if nothing checked, default export all under current filter
    const params: any = {};
    if (multipleSelection.value.length > 0) {
      params.keys = multipleSelection.value.map((item) => item.id).join(',');
    }
    scriptApi.exportData(params);
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgExportBatchFailed'));
  }
}

async function batchDelete() {
  if (multipleSelection.value.length === 0) {
    return ElMessage.warning(t('message.pages.scriptLibrary.msgSelectFirstToDelete'));
  }
  const undeletable = multipleSelection.value.filter((row: any) => !canDeleteScript(row).ok);
  if (undeletable.length > 0) {
    const groups: Record<string, string[]> = {};
    undeletable.forEach((row: any) => {
      const r = canDeleteScript(row);
      const reason = r.reason || t('message.pages.scriptLibrary.msgNotMeetDeleteCondition');
      if (!groups[reason]) groups[reason] = [];
      groups[reason].push(row.name);
    });
    const tip = Object.entries(groups)
      .map(([reason, names]) => `${reason}：${names.join('、')}`)
      .join('；');
    return ElMessage.warning(t('message.pages.scriptLibrary.batchDeleteForbidden', { tip }));
  }
  try {
    await ElMessageBox.confirm(
      t('message.pages.scriptLibrary.confirmBatchDelete', { count: multipleSelection.value.length }),
      t('message.pages.scriptLibrary.btnBatchOperate'),
      { type: 'warning', confirmButtonText: t('message.pages.scriptLibrary.msgConfirmDeleteTitle'), cancelButtonText: t('message.pages.scriptLibrary.formCancel') }
    );
    const ids = multipleSelection.value.map((item) => item.id);
    await scriptApi.multipleDelete(ids);
    ElMessage.success(t('message.pages.scriptLibrary.msgBatchDeleteSuccess'));
    getScriptList();
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.message || t('message.pages.scriptLibrary.batchDeleteFailed'));
    }
  }
}

// ========== Version management ==========

async function openVersionDialog(row: any) {
  currentScript.value = row;
  try {
    const res = await versionApi.GetList({ script: row.id });
    const list = res.data?.data || res.data?.results || res.data || [];

    versionList.value = list.map((item: any, index: number) => ({
      id: item.id,
      version: item.version,
      creator: item.creator_name || item.creator,
      updateTime: item.create_datetime,
      remark: item.change_log || '',
      isCurrent: index === 0,
      content: item.content,
    }));

    // Build version code mapping
    versionCodeMap.value = {};
    versionList.value.forEach((v) => {
      versionCodeMap.value[v.version] = v.content;
    });

    currentVersion.value = versionList.value[0]?.version || '';

    // Reset comparison mode
    compareMode.value = false;
    selectedOldVersion.value = '';

    versionDialogVisible.value = true;

    // Initialize editor
    nextTick(() => {
      initVersionEditor();
    });
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgGetVersionFailed'));
  }
}

let versionEditor: monaco.editor.IStandaloneCodeEditor | null = null;

function destroyVersionEditor() {
  if (versionEditor) {
    versionEditor.dispose();
    versionEditor = null;
  }
}

function initVersionEditor() {
  const dom = document.getElementById('version-monaco');
  if (!dom) return;
  
  destroyVersionEditor();
  
  dom.innerHTML = '';
  
  versionEditor = monaco.editor.create(dom, {
    value: versionCodeMap.value[currentVersion.value] || '',
    language: 'shell',
    theme: 'vs-dark',
    readOnly: true,
    fontSize: 13,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: false,
  });
  
  setTimeout(() => {
    if (versionEditor) {
      versionEditor.layout();
    }
  }, 100);
}

function viewVersion(row: any) {
  if (compareMode.value) return;
  currentVersion.value = row.version;
  if (versionEditor) {
    versionEditor.setValue(versionCodeMap.value[row.version] || '');
  }
}

function toggleCompare(row: any) {
  if (compareMode.value && selectedOldVersion.value === row.version) {
    exitCompare();
    return;
  }
  compareMode.value = true;
  selectedOldVersion.value = row.version;

  nextTick(() => {
    destroyVersionEditor();
    
    const dom = document.getElementById('version-monaco');
    if (!dom) return;
    
    dom.innerHTML = '';
    
    const oldContent = versionCodeMap.value[selectedOldVersion.value] || '';
    const newContent = versionCodeMap.value[currentVersion.value] || '';
    
    const diff = generateDiff(oldContent, newContent);
    
    versionEditor = monaco.editor.create(dom, {
      value: diff,
      language: 'plaintext',
      theme: 'vs-dark',
      readOnly: true,
      fontSize: 13,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: false,
    });
    
    setTimeout(() => {
      if (versionEditor) {
        versionEditor.layout();
      }
    }, 100);
  });
}

function generateDiff(oldContent: string, newContent: string): string {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const result: string[] = [];

  result.push('========== Version Comparison ==========');
  result.push(`Old version: ${selectedOldVersion.value}`);
  result.push(`New version: ${currentVersion.value}`);
  result.push('');
  result.push(t('message.pages.scriptLibrary.diffOldSection'));
  result.push('');
  
  if (oldContent) {
    oldLines.forEach((line, index) => {
      result.push(`${index + 1}: ${line}`);
    });
  } else {
    result.push(t('message.pages.scriptLibrary.diffEmpty'));
  }
  
  result.push('');
  result.push(t('message.pages.scriptLibrary.diffNewSection'));
  result.push('');
  
  if (newContent) {
    newLines.forEach((line, index) => {
      result.push(`${index + 1}: ${line}`);
    });
  } else {
    result.push(t('message.pages.scriptLibrary.diffEmpty'));
  }
  
  result.push('');
  result.push('=== Diff Analysis ===');
  result.push('');
  
  if (!oldContent && !newContent) {
    result.push(t('message.pages.scriptLibrary.diffBothEmpty'));
  } else if (oldContent === newContent) {
    result.push(t('message.pages.scriptLibrary.diffSameContent'));
  } else {
    const diff = calculateDiff(oldLines, newLines);
    
    diff.forEach((change, index) => {
      const { type, oldLine, newLine, oldIndex, newIndex } = change;
      
      switch (type) {
        case 'delete':
          result.push(`- [${oldIndex + 1}] ${oldLine}`);
          break;
        case 'insert':
          result.push(`+ [${newIndex + 1}] ${newLine}`);
          break;
        case 'replace':
          result.push(`- [${oldIndex + 1}] ${oldLine}`);
          result.push(`+ [${newIndex + 1}] ${newLine}`);
          break;
        case 'equal':
          if (index > 0 && diff[index - 1].type !== 'equal' || 
              index < diff.length - 1 && diff[index + 1].type !== 'equal') {
            result.push(`  [${oldIndex + 1}] ${oldLine}`);
          }
          break;
      }
    });

    const stats = diff.reduce((acc, change) => {
      acc[change.type] = (acc[change.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    result.push('');
    result.push(t('message.pages.scriptLibrary.diffStats'));
    result.push(`${t('message.pages.scriptLibrary.diffDeleted')}: ${stats.delete || 0}`);
    result.push(`${t('message.pages.scriptLibrary.diffAdded')}: ${stats.insert || 0}`);
    result.push(`${t('message.pages.scriptLibrary.diffModified')}: ${stats.replace || 0}`);
    result.push(`${t('message.pages.scriptLibrary.diffTotalLines')}: ${oldLines.length} → ${newLines.length}`);
  }

  return result.join('\n');
}

function calculateDiff(oldLines: string[], newLines: string[]) {
  // Simplified diff algorithm (can use more professional diff library in production)
  const result: any[] = [];
  const oldLen = oldLines.length;
  const newLen = newLines.length;
  
  let i = 0, j = 0;
  
  while (i < oldLen && j < newLen) {
    if (oldLines[i] === newLines[j]) {
      result.push({ type: 'equal', oldLine: oldLines[i], newLine: newLines[j], oldIndex: i, newIndex: j });
      i++;
      j++;
    } else {
      // Try to find consecutive matches
      const nextMatch = findNextMatch(oldLines, newLines, i, j);
      if (nextMatch) {
        // Handle differences in the middle
        for (let k = i; k < nextMatch.oldIndex; k++) {
          result.push({ type: 'delete', oldLine: oldLines[k], newLine: '', oldIndex: k, newIndex: -1 });
        }
        for (let k = j; k < nextMatch.newIndex; k++) {
          result.push({ type: 'insert', oldLine: '', newLine: newLines[k], oldIndex: -1, newIndex: k });
        }
        i = nextMatch.oldIndex;
        j = nextMatch.newIndex;
      } else {
        // Remaining parts are all different
        while (i < oldLen) {
          result.push({ type: 'delete', oldLine: oldLines[i], newLine: '', oldIndex: i, newIndex: -1 });
          i++;
        }
        while (j < newLen) {
          result.push({ type: 'insert', oldLine: '', newLine: newLines[j], oldIndex: -1, newIndex: j });
          j++;
        }
      }
    }
  }
  
  // Handle remaining lines
  while (i < oldLen) {
    result.push({ type: 'delete', oldLine: oldLines[i], newLine: '', oldIndex: i, newIndex: -1 });
    i++;
  }
  while (j < newLen) {
    result.push({ type: 'insert', oldLine: '', newLine: newLines[j], oldIndex: -1, newIndex: j });
    j++;
  }
  
  return result;
}

function findNextMatch(oldLines: string[], newLines: string[], oldStart: number, newStart: number) {
  for (let i = oldStart; i < oldLines.length; i++) {
    for (let j = newStart; j < newLines.length; j++) {
      if (oldLines[i] === newLines[j]) {
        // Check if there are consecutive matches later
        let matchLength = 0;
        while (i + matchLength < oldLines.length && 
               j + matchLength < newLines.length && 
               oldLines[i + matchLength] === newLines[j + matchLength]) {
          matchLength++;
        }
        if (matchLength >= 3) { // At least 3 consecutive lines match
          return { oldIndex: i, newIndex: j, length: matchLength };
        }
      }
    }
  }
  return null;
}

function exitCompare() {
  compareMode.value = false;
  selectedOldVersion.value = '';
  
  nextTick(() => {
    destroyVersionEditor();
    
    const dom = document.getElementById('version-monaco');
    if (!dom) return;
    
    dom.innerHTML = '';
    
    versionEditor = monaco.editor.create(dom, {
      value: versionCodeMap.value[currentVersion.value] || '',
      language: 'shell',
      theme: 'vs-dark',
      readOnly: true,
      fontSize: 13,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: false,
    });
    
    setTimeout(() => {
      if (versionEditor) {
        versionEditor.layout();
      }
    }, 100);
  });
}

async function rollbackVersion(row: any) {
  if (isPendingStatus(currentScript.value)) {
    return ElMessage.warning(t('message.pages.scriptLibrary.rollbackBlockedPending'));
  }
  try {
    await ElMessageBox.confirm(
      t('message.pages.scriptLibrary.confirmRollbackVersion', { version: row.version }),
      t('message.pages.scriptLibrary.auditRollback'),
      { type: 'warning', confirmButtonText: t('message.pages.scriptLibrary.btnConfirmRollback'), cancelButtonText: t('message.pages.scriptLibrary.formCancel') }
    );
    const res = await scriptApi.rollbackVersion(currentScript.value.id, row.id);
    ElMessage.success(res?.msg || t('message.pages.scriptLibrary.msgRollbackSuccess', { version: row.version }));
    versionDialogVisible.value = false;
    getScriptList();
  } catch (e: any) {
    if (e !== 'cancel' && e?.message) {
      ElMessage.error(e.message);
    }
  }
}

// ========== Permission config ==========

async function openPermissionDialog(row: any) {
  currentScript.value = row;
  showAddAuth.value = false;
  try {
    const res = await scriptApi.GetPermissions(row.id);
    const list = res.data?.results || res.data || [];
    authList.value = list.map((item: any) => ({
      id: item.id,
      subjectName: item.subject_name,
      subjectType: item.subject_type,
      authType: item.permission,
      grantUser: item.granter_name || item.granter,
      grantTime: item.grant_time || item.create_datetime,
    }));
  } catch {
    authList.value = [];
  }
  permissionDialogVisible.value = true;
}

function openAddAuth() {
  showAddAuth.value = true;
  Object.assign(authForm, {
    subjectType: 'user',
    subjectId: '',
    authType: 'view',
  });
}

function confirmAddAuth() {
  if (!authForm.subjectId) {
    return ElMessage.warning(t('message.pages.scriptLibrary.msgPleaseSelectUserOrRole'));
  }

  const subjectNameMap: Record<string, string> = {
    user1: '运维工程师A',
    user2: '运维工程师B',
    user3: '系统管理员',
    user4: '测试工程师',
    user5: '开发工程师',
    role1: '研发组',
    role2: '管理员组',
    role3: '运维组',
    role4: '测试组',
    role5: '访客组',
  };

  authList.value.push({
    id: `auth_${Date.now()}`,
    subjectName: subjectNameMap[authForm.subjectId] || authForm.subjectId,
    subjectType: authForm.subjectType,
    authType: authForm.authType,
    grantUser: 'admin',
    grantTime: new Date().toLocaleString(),
  });

  showAddAuth.value = false;
  ElMessage.success(t('message.pages.scriptLibrary.msgAuthGrantSuccess'));
}

function removeAuth(index: number) {
  authList.value.splice(index, 1);
  ElMessage.success(t('message.pages.scriptLibrary.msgAuthRemoved'));
}

function authTypeText(type: string): string {
  const map: Record<string, string> = {
    view: t('message.pages.scriptLibrary.permTypeView'),
    exec: t('message.pages.scriptLibrary.permTypeExec'),
    edit: t('message.pages.scriptLibrary.permTypeEdit'),
  };
  return map[type] || type;
}

function authTypeTag(type: string): string {
  const map: Record<string, string> = {
    view: 'info',
    exec: 'success',
    edit: 'primary',
  };
  return map[type] || 'info';
}

async function savePermission() {
  try {
    const permissions = authList.value.map((item: any) => ({
      id: item.id,
      subject_type: item.subjectType,
      subject_id: item.subjectId || item.subject_name,
      permission: item.authType,
    }));
    await scriptApi.UpdatePermissions(currentScript.value.id, { permissions });
    ElMessage.success(t('message.pages.scriptLibrary.msgPermConfigSaved'));
    permissionDialogVisible.value = false;
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgPermSaveFailed'));
  }
}

// ========== Scheduled task methods ==========

async function openTaskDialog(row: any) {
  currentScript.value = row;
  taskDialogVisible.value = true;
  taskActiveTab.value = 'list';
  showTaskForm.value = false;
  editTaskId.value = null;
  selectedTaskForHistory.value = null;
  try {
    const res = await taskApi.GetList({ script: row.id });
    const list = res.data?.results || res.data || [];
    taskList.value = list.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      schedule_type: item.schedule_type,
      schedule_type_display: item.schedule_type_display,
      cron_expression: item.cron_expression,
      interval_seconds: item.interval_seconds,
      run_once_at: item.run_once_at,
      hosts: item.hosts || [],
      host_count: item.host_count || (item.hosts ? item.hosts.length : 0),
      timeout: item.timeout || 300,
      fail_notify: item.fail_notify !== false,
      enabled: item.enabled !== false,
      args: item.args || [],
      envs: item.envs || {},
      exec_count: item.exec_count || 0,
      last_exec_time: item.last_exec_time || '-',
      last_exec_result: item.last_exec_result,
      next_exec_time: item.next_exec_time || '-',
      creator_name: item.creator_name,
      create_datetime: item.create_datetime,
      script_status: item.script_status ?? row?.status ?? 0,
      running_executions_count: item.running_executions_count ?? 0,
      is_once_executed: item.is_once_executed === true,
    }));
  } catch {
    taskList.value = [];
  }
  resetTaskForm();
}

function resetTaskForm() {
  taskForm.name = '';
  taskForm.description = '';
  taskForm.schedule_type = 'cron';
  taskForm.cron_expression = '';
  taskForm.interval_seconds = 3600;
  taskForm.run_once_at = '';
  taskForm.hostsText = '';
  taskForm.timeout = 300;
  taskForm.fail_notify = true;
  taskForm.args = [];
  taskForm.envs = {};
  taskForm.enabled = true;
  Object.keys(envKeyMap).forEach((k) => delete envKeyMap[k]);
  clearHostValidateResult();
}

function openTaskCreate() {
  editTaskId.value = null;
  viewTaskMode.value = false;
  showTaskForm.value = true;
  resetTaskForm();
  taskActiveTab.value = 'form';
}

function _fillTaskForm(row: any) {
  editTaskId.value = row.id;
  showTaskForm.value = true;
  taskForm.name = row.name;
  taskForm.description = row.description || '';
  taskForm.schedule_type = row.schedule_type || 'cron';
  taskForm.cron_expression = row.cron_expression || '';
  taskForm.interval_seconds = row.interval_seconds || 3600;
  taskForm.run_once_at = row.run_once_at || '';
  taskForm.hostsText = (row.hosts || []).join('\n');
  taskForm.timeout = row.timeout || 300;
  taskForm.fail_notify = row.fail_notify !== false;
  taskForm.enabled = row.enabled !== false;
  taskForm.args = (row.args || []).slice();
  taskForm.envs = { ...(row.envs || {}) };
  Object.keys(envKeyMap).forEach((k) => delete envKeyMap[k]);
  Object.keys(taskForm.envs).forEach((k) => {
    envKeyMap[k] = k;
  });
  taskActiveTab.value = 'form';
}

function openTaskView(row: any) {
  viewTaskMode.value = true;
  _fillTaskForm(row);
}

function openTaskEdit(row: any) {
  const check = canEditTask(row);
  if (!check.ok) {
    return ElMessage.warning(t('message.pages.scriptLibrary.msgTaskNotEditable', { reason: check.reason }));
  }
  viewTaskMode.value = false;
  _fillTaskForm(row);
}

function cancelTaskForm() {
  showTaskForm.value = false;
  editTaskId.value = null;
  viewTaskMode.value = false;
  taskActiveTab.value = 'list';
  resetTaskForm();
  clearHostValidateResult();
}

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
        ElMessage.warning(t('message.pages.scriptLibrary.msgHostNoIdentifiers'));
        return;
      }

      const existing = taskForm.hostsText
        ? taskForm.hostsText.split('\n').map((l) => l.trim()).filter((l) => l)
        : [];
      const merged = Array.from(new Set([...existing, ...lines]));
      taskForm.hostsText = merged.join('\n');
      clearHostValidateResult();
      ElMessage.success(t('message.pages.scriptLibrary.msgHostImportSuccess', { count: lines.length }) + (existing.length > 0 ? '，' + t('message.pages.scriptLibrary.msgHostImportDedup', { count: merged.length }) : ''));
    } catch (err: any) {
      ElMessage.error(t('message.pages.scriptLibrary.msgFileParseFailed', { err: err.message || String(err) }));
    }
  };
  reader.onerror = () => {
    ElMessage.error(t('message.pages.scriptLibrary.msgFileReadFailed'));
  };
  reader.readAsText(file, 'UTF-8');
}

async function handleValidateHosts() {
  const hostsArr = taskForm.hostsText
    ? taskForm.hostsText.split('\n').map((h) => h.trim()).filter((h) => h)
    : [];
  if (hostsArr.length === 0) {
    ElMessage.warning(t('message.pages.scriptLibrary.msgHostPleaseInputOrImport'));
    return { ok: false };
  }

  hostValidateLoading.value = true;
  clearHostValidateResult();
  try {
    const res = await hostApi.ValidateHosts(hostsArr);
    const data = res.data || {};
    hostValidateResult.valid = data.valid || [];
    hostValidateResult.not_found = data.not_found || [];
    hostValidateResult.no_permission = data.no_permission || [];
    hostValidatedSnapshot = taskForm.hostsText;

    const total =
      hostValidateResult.valid.length +
      hostValidateResult.not_found.length +
      hostValidateResult.no_permission.length;
    const ok = hostValidateResult.not_found.length === 0 && hostValidateResult.no_permission.length === 0;
    if (ok) {
      ElMessage.success(t('message.pages.scriptLibrary.slValidatePass', { n: total }));
    } else {
      ElMessage.warning(
        t('msgValidateResultFmt', {
          valid: hostValidateResult.valid.length,
          notFound: t('message.pages.scriptLibrary.hostNotFoundTitle'),
          n1: hostValidateResult.not_found.length,
          noPerm: t('message.pages.scriptLibrary.hostNoPermTitle'),
          n2: hostValidateResult.no_permission.length,
        })
      );
    }
    return { ok };
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgCheckFailed'));
    return { ok: false };
  } finally {
    hostValidateLoading.value = false;
  }
}

async function handleCleanInvalidHosts() {
  const invalidCount = hostValidateResult.not_found.length + hostValidateResult.no_permission.length;
  if (invalidCount === 0) {
    ElMessage.info(t('message.pages.scriptLibrary.msgNoInvalidHosts'));
    return;
  }

  const hostsArr = taskForm.hostsText
    ? taskForm.hostsText.split('\n').map((h) => h.trim()).filter((h) => h)
    : [];

  let validatedValidSet: Set<string> | null = null;
  let needValidate = hostValidatedSnapshot !== taskForm.hostsText;

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

    const invalidIdentifierSet = new Set([
      ...hostValidateResult.not_found,
      ...hostValidateResult.no_permission.map((h) => h.identifier),
    ]);

    let removed = 0;
    const originalLines = taskForm.hostsText.split('\n');
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
      if (invalidIdentifierSet.has(key)) {
        removed++;
        continue;
      }
      if (keepSet.has(key)) {
        newLines.push(line);
      } else if (hostValidateResult.valid.some(
        (v) => v.host_name === key || v.host_ip === key
      )) {
        newLines.push(line);
      } else {
        removed++;
      }
    }

    const nonEmptyNew = newLines.filter((l) => l.trim());
    taskForm.hostsText = nonEmptyNew.length === 0 ? '' : newLines.join('\n');

    hostValidateResult.not_found = [];
    hostValidateResult.no_permission = [];
    hostValidatedSnapshot = taskForm.hostsText;

    if (removed > 0) {
      ElMessage.success(t('message.pages.scriptLibrary.slClearedHosts', { removed, kept: hostValidateResult.valid.length }));
    } else {
      ElMessage.info(t('message.pages.scriptLibrary.msgNoHostsToClear'));
    }
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgClearFailed'));
  } finally {
    hostCleanInvalidLoading.value = false;
  }
}

function addEnv() {
  const newKey = 'ENV_' + (Object.keys(taskForm.envs).length + 1);
  taskForm.envs[newKey] = '';
  envKeyMap[newKey] = newKey;
}

function deleteEnv(key: string) {
  delete taskForm.envs[key];
  delete envKeyMap[key];
}

function onEnvKeyChange(oldKey: string) {
  const newKey = envKeyMap[oldKey];
  if (newKey && newKey !== oldKey && !taskForm.envs[newKey]) {
    taskForm.envs[newKey] = taskForm.envs[oldKey];
    delete taskForm.envs[oldKey];
    delete envKeyMap[oldKey];
    envKeyMap[newKey] = newKey;
  }
}

async function saveTask() {
  if (isPendingStatus(currentScript.value)) {
    return ElMessage.warning(t('message.pages.scriptLibrary.msgTaskPendingCannotEdit'));
  }
  if (!taskForm.name.trim()) {
    return ElMessage.warning(t('message.pages.scriptLibrary.msgTaskNameRequired'));
  }
  if (taskForm.schedule_type === 'cron' && !taskForm.cron_expression) {
    return ElMessage.warning(t('message.pages.scriptLibrary.msgTaskCronRequired'));
  }
  if (taskForm.schedule_type === 'interval' && !taskForm.interval_seconds) {
    return ElMessage.warning(t('message.pages.scriptLibrary.msgTaskIntervalRequired'));
  }
  if (taskForm.schedule_type === 'once' && !taskForm.run_once_at) {
    return ElMessage.warning(t('message.pages.scriptLibrary.msgTaskExecTimeRequired'));
  }

  const hostsArr = taskForm.hostsText
    ? taskForm.hostsText.split('\n').filter((h: string) => h.trim())
    : [];
  if (hostsArr.length === 0) {
    return ElMessage.warning(t('message.pages.scriptLibrary.msgTaskHostsRequired'));
  }

  const needValidate = hostValidatedSnapshot !== taskForm.hostsText;
  if (needValidate) {
    const ret = await handleValidateHosts();
    if (!ret.ok) {
      return ElMessage.error(t('message.pages.scriptLibrary.msgTaskHostsInvalid'));
    }
  }
  if (hostValidateResult.not_found.length > 0 || hostValidateResult.no_permission.length > 0) {
    return ElMessage.error(
      t('msgHostValidateFailedFmt', {
        notFound: t('message.pages.scriptLibrary.hostNotFoundTitle'),
        n1: hostValidateResult.not_found.length,
        noPerm: t('message.pages.scriptLibrary.hostNoPermTitle'),
        n2: hostValidateResult.no_permission.length,
      })
    );
  }

  // Process environment variables (ensure key sync)
  const envsFinal: Record<string, string> = {};
  Object.keys(taskForm.envs).forEach((key) => {
    const realKey = envKeyMap[key] || key;
    envsFinal[realKey] = taskForm.envs[key];
  });

  const payload: any = {
    script: currentScript.value.id,
    name: taskForm.name,
    description: taskForm.description,
    schedule_type: taskForm.schedule_type,
    cron_expression: taskForm.schedule_type === 'cron' ? taskForm.cron_expression : undefined,
    interval_seconds: taskForm.schedule_type === 'interval' ? taskForm.interval_seconds : undefined,
    run_once_at: taskForm.schedule_type === 'once' ? taskForm.run_once_at : undefined,
    hosts: hostsArr,
    timeout: taskForm.timeout,
    fail_notify: taskForm.fail_notify,
    args: taskForm.args.filter((a) => a && a.trim()),
    envs: envsFinal,
    enabled: taskForm.enabled,
  };

  try {
    if (editTaskId.value) {
      payload.id = editTaskId.value;
      await taskApi.UpdateObj(payload);
      ElMessage.success(t('message.pages.scriptLibrary.msgTaskUpdateSuccess'));
    } else {
      await taskApi.AddObj(payload);
      ElMessage.success(t('message.pages.scriptLibrary.msgTaskCreateSuccess'));
    }
    showTaskForm.value = false;
    editTaskId.value = null;
    taskActiveTab.value = 'list';
    // Reload list
    openTaskDialog(currentScript.value);
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgTaskSaveFailed'));
  }
}

async function execTaskOnce(row: any) {
  try {
    await ElMessageBox.confirm(t('message.pages.scriptLibrary.msgTaskConfirmExec', { name: row.name }), t('message.pages.scriptLibrary.msgTaskConfirmExecTitle'), { type: 'info' });
    await taskApi.executeNow(row.id);
    ElMessage.success(t('message.pages.scriptLibrary.msgTaskExecSubmitted'));
  } catch (e: any) {
    if (e !== 'cancel' && e !== undefined && e.message) {
      ElMessage.error(e.message || t('message.pages.scriptLibrary.msgTaskExecFailed'));
    }
  }
}

async function toggleTaskStatus(row: any) {
  try {
    await taskApi.toggleEnabled(row.id);
    row.enabled = !row.enabled;
    ElMessage.success(t('message.pages.scriptLibrary.msgTaskStatusChanged', { status: row.enabled ? t('message.pages.scriptLibrary.formStatusEnabled') : t('message.pages.scriptLibrary.formStatusDisabled') }));
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgTaskOperFailed'));
  }
}

async function deleteTask(row: any) {
  try {
    await ElMessageBox.confirm(t('msgDeleteTaskConfirmFmt', { name: row.name }), t('message.pages.scriptLibrary.msgConfirmDeleteCategoryTitle'), { type: 'warning' });
    await taskApi.DelObj(row.id);
    ElMessage.success(t('message.pages.scriptLibrary.msgDeleteTaskSuccess'));
    openTaskDialog(currentScript.value);
  } catch {
    // User cancelled
  }
}

async function loadTaskExecutions(row: any, resetPage = true, resetFilter = false) {
  selectedTaskForHistory.value = row;
  if (resetPage) {
    taskExecutionsPage.current = 1;
    taskExecutionsPage.total = 0;
  }
  if (resetFilter) {
    taskExecutionsFilter.exec_status = '';
    taskExecutionsFilter.exec_trigger_type = '';
    taskExecutionsPage.current = 1;
    taskExecutionsPage.total = 0;
  }
  taskExecutions.value = [];
  taskExecutionsLoading.value = true;
  taskActiveTab.value = 'history';
  try {
    const params: any = {
      page: taskExecutionsPage.current,
      page_size: taskExecutionsPage.size,
    };
    if (taskExecutionsFilter.exec_status !== '' && taskExecutionsFilter.exec_status !== null && taskExecutionsFilter.exec_status !== undefined) {
      params.exec_status = taskExecutionsFilter.exec_status;
    }
    if (taskExecutionsFilter.exec_trigger_type) params.exec_trigger_type = taskExecutionsFilter.exec_trigger_type;
    const res = await taskApi.listExecutionsPaged(row.id, params);
    const d = res.data || {};
    taskExecutions.value = d.results || d.data?.results || d || [];
    if (d.page && typeof d.page === 'object') {
      taskExecutionsPage.current = d.page.current || 1;
      taskExecutionsPage.size = d.page.size || taskExecutionsPage.size;
      taskExecutionsPage.total = d.page.total ?? (d.total != null ? d.total : taskExecutions.value.length);
      taskExecutionsPage.totalPages = d.page.total_pages || 1;
    } else if (d.total != null) {
      taskExecutionsPage.total = Number(d.total);
      taskExecutionsPage.totalPages = Math.max(1, Math.ceil(taskExecutionsPage.total / taskExecutionsPage.size));
    } else {
      taskExecutionsPage.total = taskExecutions.value.length;
      taskExecutionsPage.totalPages = 1;
    }
  } catch (e: any) {
    taskExecutions.value = [];
    ElMessage.warning(e.message || t('message.pages.scriptLibrary.msgTaskNoExecRecord'));
  } finally {
    taskExecutionsLoading.value = false;
  }
}

function getHostSummary(row: any) {
  const base = { total: 0, success: 0, failed: 0, running: 0, pending: 0 };
  if (!row) return base;
  if (row.host_summary && typeof row.host_summary === 'object') {
    return {
      total: Number(row.host_summary.total ?? 0),
      success: Number(row.host_summary.success ?? 0),
      failed: Number(row.host_summary.failed ?? 0),
      running: Number(row.host_summary.running ?? 0),
      pending: Number(row.host_summary.pending ?? 0),
    };
  }
  if (row.result && typeof row.result === 'object') {
    const r = row.result;
    if (r.hosts_detail && Array.isArray(r.hosts_detail)) {
      for (const h of r.hosts_detail) {
        base.total += 1;
        const s = h.status;
        if (s === 'success') base.success += 1;
        else if (s === 'fail') base.failed += 1;
        else if (s === 'submitted') base.pending += 1;
        else base.running += 1;
      }
      return base;
    }
  }
  const hosts = row.executed_hosts;
  if (hosts && Array.isArray(hosts)) base.total = hosts.length;
  if (row.status === 2) base.success = base.total;
  else if (row.status === 3) base.failed = base.total;
  else if (row.status === 1) base.running = base.total;
  else if (row.status === 0) base.pending = base.total;
  return base;
}

function hostStatusTagType(item: any): 'success' | 'danger' | 'warning' | 'info' | '' {
  if (!item) return '';
  const s = item.status;
  if (s === 2) return 'success';
  if (s === 3 || s === 4) return 'danger';
  if (s === 1) return 'warning';
  if (s === 0) return 'info';
  return '';
}

function copyText(text: string) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text || '';
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    ElMessage.success(t('message.pages.scriptLibrary.msgCopySuccess'));
  } catch {
    ElMessage.warning(t('message.pages.scriptLibrary.msgCopyFailed'));
  }
}

async function fetchHostOutputPage(resetPage = false) {
  if (!currentOutputExecutionId.value) return;
  if (resetPage) hostOutputPage.current = 1;
  hostOutputLoading.value = true;
  try {
    const params: any = {
      lazy: 1,
      page: hostOutputPage.current,
      page_size: hostOutputPage.size,
    };
    if (hostOutputFilter.keyword) params.keyword = hostOutputFilter.keyword;
    if (hostOutputFilter.status) params.host_status = hostOutputFilter.status;
    const res = await taskApi.getExecutionHostOutputsRaw(
      currentOutputExecutionId.value,
      params
    );
    const d = res.data || {};
    currentHostOutputs.value = d.host_outputs || [];
    const s = d.summary || {};
    hostOutputSummary.value = {
      taskName: d.task?.name || '',
      total: s.total ?? 0,
      success: s.success ?? 0,
      failed: s.failed ?? 0,
      running: s.running ?? 0,
      pending: s.pending ?? 0,
    };
    if (d.page) {
      hostOutputPage.current = d.page.current || 1;
      hostOutputPage.size = d.page.size || hostOutputPage.size;
      hostOutputPage.total = d.page.total || 0;
      hostOutputPage.totalPages = d.page.total_pages || 1;
    } else {
      const total = currentHostOutputs.value.length;
      hostOutputPage.total = total;
      hostOutputPage.totalPages = 1;
    }
    currentHostOutputError.value = d.error_message || '';
    if (!selectedHostRow.value && currentHostOutputs.value.length) {
      selectHostRow(currentHostOutputs.value[0]);
    }
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgGetOutputFailed'));
  } finally {
    hostOutputLoading.value = false;
  }
}

function _hostCacheKey(row: any) {
  return row?.ops_execution_id || row?.host_uuid || row?.host_ip || String(Math.random());
}

async function selectHostRow(row: any) {
  selectedHostRow.value = row;
  if (!row) return;
  const key = _hostCacheKey(row);
  if (hostOutputCache.has(key)) {
    return;
  }
  hostDetailLoading.value = true;
  try {
    const res = await taskApi.getHostOutputDetail(
      currentOutputExecutionId.value,
      row.ops_execution_id || row.host_uuid || row.host_ip
    );
    if (res.data) {
      hostOutputCache.set(key, res.data);
    }
  } catch (e: any) {
    ElMessage.warning(e.message || t('message.pages.scriptLibrary.msgGetHostOutputFailed'));
  } finally {
    hostDetailLoading.value = false;
  }
}

function getSelectedHostDetail() {
  const row = selectedHostRow.value;
  if (!row) return null;
  const key = _hostCacheKey(row);
  const cached = hostOutputCache.get(key);
  if (cached) return cached;
  return row;
}

async function openHostOutput(row: any) {
  if (!row || !row.id) {
    ElMessage.warning(t('message.pages.scriptLibrary.msgExecRecordInvalid'));
    return;
  }
  currentOutputExecutionId.value = row.id;
  hostOutputDialogVisible.value = true;
  hostOutputCache.clear();
  selectedHostRow.value = null;
  hostOutputFilter.keyword = '';
  hostOutputFilter.status = '';
  hostOutputPage.current = 1;
  hostOutputPage.total = 0;
  currentHostOutputs.value = [];
  hostOutputSummary.value = null;
  activeHostOutputTab.value = '';
  currentHostOutputError.value = '';
  row._outputLoading = true;
  await fetchHostOutputPage(true);
  row._outputLoading = false;
}

function resetHostOutputFilter() {
  hostOutputFilter.keyword = '';
  hostOutputFilter.status = '';
  fetchHostOutputPage(true);
}

// ========== Audit log methods ==========

function openAuditDialog(row: any) {
  currentScript.value = row;
  auditDialogVisible.value = true;
  getAuditList();
}

async function getAuditList() {
  try {
    const params: any = { page: auditPage.current, limit: auditPage.size };
    if (auditFilter.operType) params.oper_type = auditFilter.operType;
    if (auditFilter.operator) params.operator = auditFilter.operator;
    if (auditFilter.timeRange && auditFilter.timeRange.length === 2) {
      params.start_time = auditFilter.timeRange[0];
      params.end_time = auditFilter.timeRange[1];
    }
    if (currentScript.value) params.script_id = currentScript.value.id;

    const res = await auditApi.GetList(params);
    const list = res.data?.results || res.data || [];
    const total = res.data?.count || res.data?.total || list.length;

    auditList.value = list.map((item: any) => ({
      id: item.id,
      operTime: item.create_datetime,
      operator: item.operator_name || item.username || '',
      operType: item.oper_type,
      operTypeDisplay: item.oper_type_display || '',
      scriptVersion: item.script_version || '',
      operDesc: item.detail || '',
      clientIp: item.client_ip || '',
      detail: item.detail || '',
    }));

    auditPage.total = total;
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgGetAuditFailed'));
    auditList.value = [];
  }
}

function resetAuditFilter() {
  auditFilter.operType = '';
  auditFilter.operator = '';
  auditFilter.timeRange = [];
  getAuditList();
}

function operTypeText(type: string): string {
  const map: Record<string, string> = {
    create: t('message.pages.scriptLibrary.auditCreate'),
    edit: t('message.pages.scriptLibrary.auditEdit'),
    delete: t('message.pages.scriptLibrary.auditDelete'),
    rollback: t('message.pages.scriptLibrary.auditRollback'),
    auth: t('message.pages.scriptLibrary.auditAuth'),
    exec: t('message.pages.scriptLibrary.auditExec'),
    status: t('message.pages.scriptLibrary.auditStatusChange'),
  };
  return map[type] || type;
}

function operTypeTag(type: string): string {
  const map: Record<string, string> = {
    create: 'success',
    edit: 'primary',
    delete: 'danger',
    rollback: 'warning',
    auth: 'info',
    exec: '',
    status: 'warning',
  };
  return map[type] || '';
}

// ========== Dashboard methods ==========

function toggleStatBoard() {
  showStatBoard.value = !showStatBoard.value;
  if (showStatBoard.value) {
    nextTick(async () => {
      initCharts();
      await getStatData();
    });
  }
}

async function getStatData() {
  try {
    const res: any = await scriptApi.getStats();
    const data = res.data || {};
    statData.totalScript = data.totalScript ?? 0;
    statData.publicScript = data.publicScript ?? 0;
    statData.todayExec = data.todayExec ?? 0;
    statData.successRate = data.successRate ?? 0;
    statData.riskScript = data.riskScript ?? 0;
    statData.pendingApprove = data.pendingApproveCount ?? 0;
    pendingApproveCount.value = data.pendingApproveCount ?? 0;

    if (data.topScripts && data.topScripts.length > 0) {
      topExecList.value = data.topScripts.map((item: any) => ({
        name: item.name,
        count: item.exec_count ?? item.count ?? 0,
        successRate: '—',
      }));
    } else {
      topExecList.value = [];
    }

    if (showStatBoard.value) {
      nextTick(() => {
        if (trendChart) {
          trendChart.setOption({
            xAxis: { type: 'category', data: data.trendDates || [] },
            series: [{ data: data.trendValues || [] }],
          });
        }
        if (typeChart) {
          const palette = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#606266'];
          const typeData = (data.typeDistribution || []).map((item: any, idx: number) => ({
            value: item.count || 0,
            name: item.script_type || item.type || t('message.pages.scriptLibrary.slUnknown'),
            itemStyle: { color: palette[idx % palette.length] },
          }));
          typeChart.setOption({ series: [{ data: typeData }] });
        }
        if (resultChart) {
          const resultPalette: Record<string, string> = {
            [t('message.pages.scriptLibrary.optSuccess')]: '#67C23A', [t('message.pages.scriptLibrary.optFail')]: '#F56C6C', [t('message.pages.scriptLibrary.optExecuting')]: '#E6A23C',
          };
          const resultData = (data.resultDistribution || []).map((item: any) => ({
            value: item.value || 0,
            name: item.name,
            itemStyle: { color: resultPalette[item.name] || '#909399' },
          }));
          resultChart.setOption({ series: [{ data: resultData }] });
        }
      });
    }
  } catch {
    // ignore
  }
}

function initCharts() {
  if (!trendChartRef.value) return;

  // Execution trend chart
  trendChart = echarts.init(trendChartRef.value);
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['07-10', '07-11', '07-12', '07-13', '07-14', '07-15', '07-16'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: t('message.pages.scriptLibrary.taskColExecCount'),
        type: 'line',
        smooth: true,
        data: [120, 132, 101, 134, 90, 230, 156],
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' },
          ]),
        },
      },
    ],
  });

  // Script type distribution chart
  typeChart = echarts.init(typeChartRef.value);
  typeChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '0', left: 'center' },
    series: [
      {
        name: t('message.pages.scriptLibrary.createTypeLabel'),
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: [
          { value: 35, name: 'Shell', itemStyle: { color: '#409EFF' } },
          { value: 18, name: 'Python', itemStyle: { color: '#67C23A' } },
          { value: 8, name: 'PowerShell', itemStyle: { color: '#E6A23C' } },
          { value: 7, name: 'SQL', itemStyle: { color: '#F56C6C' } },
        ],
      },
    ],
  });

  // Execution result ratio
  resultChart = echarts.init(resultChartRef.value);
  resultChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '0', left: 'center' },
    series: [
      {
        name: t('message.pages.scriptLibrary.slExecResult'),
        type: 'pie',
        radius: ['40%', '70%'],
        label: { show: false },
        data: [
          { value: 147, name: t('message.pages.scriptLibrary.optSuccess'), itemStyle: { color: '#67C23A' } },
          { value: 9, name: t('message.pages.scriptLibrary.optFail'), itemStyle: { color: '#F56C6C' } },
        ],
      },
    ],
  });
}

function resizeCharts() {
  trendChart && trendChart.resize();
  typeChart && typeChart.resize();
  resultChart && resultChart.resize();
}

function destroyCharts() {
  trendChart && trendChart.dispose();
  typeChart && typeChart.dispose();
  resultChart && resultChart.dispose();
}

// ========== Approval center methods ==========

const delegateLoading = ref(false);
const addSignLoading = ref(false);
const userList = ref<any[]>([]);
const userStore = useUserInfo();
const currentUserId = computed(() => {
  const ui: any = userStore.userInfos;
  if (!ui) return null;
  if (typeof ui.id === 'number') return ui.id;
  if (typeof ui.user_id === 'number') return ui.user_id;
  if (typeof ui.userId === 'number') return ui.userId;
  if (typeof ui.pk === 'number') return ui.pk;
  return null;
});

const isCurrentUserApprover = computed(() => {
  if (!nodeExecList.value.length || !currentUserId.value) return false;
  let nodeIdx = currentApprove.value.current_node_index;
  if (nodeIdx === undefined || nodeIdx === null || Number.isNaN(Number(nodeIdx))) {
    nodeIdx = nodeExecList.value.findIndex((n: any) => n.status === 'pending');
  }
  const idx = Number(nodeIdx);
  const currentNode = idx >= 0 && idx < nodeExecList.value.length ? nodeExecList.value[idx] : null;
  if (!currentNode || currentNode.status !== 'pending') return false;
  const candidates = currentNode.candidate_approvers || [];
  const candidateIds = candidates.map((a: any) => a.user_id ?? a.id ?? a.userId);
  return candidateIds.includes(currentUserId.value);
});

const isMySubmitted = computed(() => {
  if (!currentUserId.value) return false;
  const submitterId = currentApprove.value.submitter_id ?? currentApprove.value.submitter ?? currentApprove.value.creator;
  return Number(submitterId) === Number(currentUserId.value);
});

async function loadUserList() {
  try {
    const res: any = await request({
      url: '/api/system/user/',
      method: 'get',
      params: { limit: 200 },
    });
    userList.value = res.data?.results || res.data || [];
  } catch {
    userList.value = [];
  }
}

function handleApproveTabChange(tab: string) {
  if (tab === 'pending_me') {
    loadPendingMeList();
  } else if (tab === 'my_submitted') {
    loadMySubmittedList();
  } else if (tab === 'done') {
    loadDoneList();
  }
}

async function openApproveDialog() {
  approveDialogVisible.value = true;
  if (userList.value.length === 0) {
    loadUserList();
  }
  if (approveActiveTab.value === 'pending_me') {
    loadPendingMeList();
  } else if (approveActiveTab.value === 'my_submitted') {
    loadMySubmittedList();
  } else {
    loadDoneList();
  }
}

async function loadPendingMeList() {
  try {
    const res = await approvalInstanceApi.GetList({
      view_type: 'pending_me',
      page: approvalPage.pending_me.current,
      limit: approvalPage.pending_me.size,
    });
    const data = res.data?.results || res.data || [];
    pendingMeList.value = data;
    approvalPage.pending_me.total = res.data?.total || data.length;
  } catch {
    pendingMeList.value = [];
  }
}

async function loadMySubmittedList() {
  try {
    const res = await approvalInstanceApi.GetList({
      view_type: 'mine',
      page: approvalPage.my_submitted.current,
      limit: approvalPage.my_submitted.size,
    });
    const data = res.data?.results || res.data || [];
    mySubmittedList.value = data;
    approvalPage.my_submitted.total = res.data?.total || data.length;
  } catch {
    mySubmittedList.value = [];
  }
}

async function loadDoneList() {
  try {
    const res = await approvalInstanceApi.GetList({
      status__in: 'approved,rejected,cancelled',
      page: approvalPage.done.current,
      limit: approvalPage.done.size,
    });
    const data = res.data?.results || res.data || [];
    doneApproveList.value = data;
    approvalPage.done.total = res.data?.total || data.length;
  } catch {
    doneApproveList.value = [];
  }
}

async function viewApprovalDetail(row: any) {
  currentApprove.value = row;
  approveDetailVisible.value = true;
  approveRemark.value = '';
  riskPoints.value = row.risk_points || [];

  try {
    const [detailRes, nodesRes] = await Promise.all([
      approvalInstanceApi.GetObj(row.id).catch(() => null),
      approvalInstanceApi.getNodes(row.id).catch(() => null),
    ]);
    if (detailRes && detailRes.data) {
      currentApprove.value = detailRes.data;
      riskPoints.value = detailRes.data.risk_points || row.risk_points || [];
    }
    nodeExecList.value = nodesRes?.data || [];
  } catch {
    nodeExecList.value = [];
  }

  nextTick(() => {
    const dom = document.getElementById('approve-monaco');
    if (!dom) return;
    if (approveEditor) approveEditor.dispose();
    const aceEditor = (window as any).ace;
    const detail = currentApprove.value;
    const scriptContent = detail.script_content || detail.content || detail.script?.content || row.script_content || row.content || row.script?.content || ('# ' + t('message.pages.scriptLibrary.slNoScriptContent'));
    if (aceEditor) {
      approveEditor = aceEditor.edit('approve-monaco');
      approveEditor.setTheme('ace/theme/github_dark');
      const mode = getAceMode(detail.script_type || detail.scriptType || row.script_type || row.scriptType || 'Shell');
      approveEditor.getSession().setMode(mode);
      approveEditor.setValue(scriptContent, -1);
      approveEditor.setReadOnly(true);
      approveEditor.setOptions({
        fontSize: 13,
        showLineNumbers: true,
        minimap: { enabled: false },
      });
    } else {
      dom.innerHTML = `<pre style="padding:16px;background:#161b22;color:#e6edf3;border-radius:4px;font-family:Menlo,monospace;font-size:13px;white-space:pre-wrap;">${escapeHtml(scriptContent)}</pre>`;
    }
  });
}

function getAceMode(scriptType: string) {
  const modeMap: Record<string, string> = {
    Shell: 'ace/mode/sh',
    Python3: 'ace/mode/python',
    PowerShell: 'ace/mode/powershell',
    Bat: 'ace/mode/batchfile',
    SQL: 'ace/mode/sql',
  };
  return modeMap[scriptType] || 'ace/mode/sh';
}

function escapeHtml(text: string) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getNodeStatusText(node: any) {
  const statusMap: Record<string, string> = {
    pending: t('message.pages.scriptLibrary.slStatusPending'),
    approved: t('message.pages.scriptLibrary.approveStatusApproved'),
    rejected: t('message.pages.scriptLibrary.msgApproveRejected'),
    skipped: t('message.pages.scriptLibrary.approveStatusSkipped'),
  };
  return statusMap[node.status] || node.status;
}

function getNodeStepStatus(node: any, index: number) {
  if (node.status === 'approved') return 'success';
  if (node.status === 'rejected') return 'error';
  if (node.status === 'skipped') return 'info';
  if (index === currentApprove.value.current_node_index && currentApprove.value.status === 'pending') return 'process';
  if (index < currentApprove.value.current_node_index) return 'success';
  return '';
}

function getRecordActionText(action: string) {
  const map: Record<string, string> = {
    approve: t('message.pages.scriptLibrary.approveActionApprove'),
    reject: t('message.pages.scriptLibrary.approveActionReject'),
    delegate: t('message.pages.scriptLibrary.approveActionDelegate'),
    add_sign: t('message.pages.scriptLibrary.approveActionAddSign'),
  };
  return map[action] || action;
}

async function confirmApprove() {
  try {
    await approvalInstanceApi.approve(currentApprove.value.id, approveRemark.value || '');
    ElMessage.success(t('message.pages.scriptLibrary.msgApproveSuccess'));
    approveDetailVisible.value = false;
    handleApproveTabChange(approveActiveTab.value);
    getScriptList();
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgApproveFailed'));
  }
}

async function confirmReject() {
  if (!approveRemark.value.trim()) return ElMessage.warning(t('message.pages.scriptLibrary.msgApproveReasonRequired'));
  try {
    await approvalInstanceApi.reject(currentApprove.value.id, approveRemark.value);
    ElMessage.success(t('message.pages.scriptLibrary.msgApproveRejected'));
    approveDetailVisible.value = false;
    handleApproveTabChange(approveActiveTab.value);
    getScriptList();
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgApproveRejectFailed'));
  }
}

function openDelegateDialog() {
  delegateForm.to_user_id = null;
  delegateForm.reason = '';
  delegateDialogVisible.value = true;
}

async function confirmDelegate() {
  if (!delegateForm.to_user_id) return ElMessage.warning(t('message.pages.scriptLibrary.msgDelegateTargetRequired'));
  delegateLoading.value = true;
  try {
    await approvalInstanceApi.delegate(currentApprove.value.id, delegateForm.to_user_id, delegateForm.reason);
    ElMessage.success(t('message.pages.scriptLibrary.msgDelegateSuccess'));
    delegateDialogVisible.value = false;
    viewApprovalDetail(currentApprove.value);
    handleApproveTabChange(approveActiveTab.value);
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgDelegateFailed'));
  } finally {
    delegateLoading.value = false;
  }
}

function openAddSignDialog() {
  addSignForm.user_ids = [];
  addSignForm.reason = '';
  addSignDialogVisible.value = true;
}

async function confirmAddSign() {
  if (addSignForm.user_ids.length === 0) return ElMessage.warning(t('message.pages.scriptLibrary.msgAddSignUserRequired'));
  addSignLoading.value = true;
  try {
    await approvalInstanceApi.addSign(currentApprove.value.id, addSignForm.user_ids, addSignForm.reason);
    ElMessage.success(t('message.pages.scriptLibrary.msgAddSignSuccess'));
    addSignDialogVisible.value = false;
    viewApprovalDetail(currentApprove.value);
  } catch (e: any) {
    ElMessage.error(e.message || t('message.pages.scriptLibrary.msgAddSignFailed'));
  } finally {
    addSignLoading.value = false;
  }
}

async function cancelApproval(row: any) {
  try {
    await ElMessageBox.confirm(t('message.pages.scriptLibrary.msgWithdrawApprovalConfirm', { name: row.script_name || row.scriptName }), t('withdrawConfirmTitle'), { type: 'warning' });
    await approvalInstanceApi.cancel(row.id);
    ElMessage.success(t('message.pages.scriptLibrary.msgWithdrawSuccess'));
    approveDetailVisible.value = false;
    handleApproveTabChange(approveActiveTab.value);
    getScriptList();
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || t('message.pages.scriptLibrary.msgWithdrawFailed'));
    }
  }
}

function destroyApproveEditor() {
  if (approveEditor) {
    approveEditor.dispose();
    approveEditor = null;
  }
}

// Backward-compat old method name
const viewApproveDetail = viewApprovalDetail;
const approvePass = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定通过${t('message.pages.scriptLibrary.msgScriptPrefix')}${row.script_name || row.scriptName}】的审核吗？`, t('message.pages.scriptLibrary.msgApproveConfirmTitle'), { type: 'success' });
    await approvalInstanceApi.approve(row.id, '');
    ElMessage.success(t('message.pages.scriptLibrary.msgApproveSuccess'));
    handleApproveTabChange(approveActiveTab.value);
    getScriptList();
  } catch {
    // User cancelled
  }
};

// ========== Navigate to execution page ==========

function goExecPage(row: any) {
  if (row.status === 'Pending approval' || row.status === 2) {
    return ElMessage.warning(t('message.pages.scriptLibrary.msgScriptPrefix') + row.name + t('message.pages.scriptLibrary.msgScriptPendingCannotExecFull'));
  }
  if (row.status === 'Offline') {
    return ElMessage.warning(t('message.pages.scriptLibrary.msgScriptPrefix') + row.name + t('message.pages.scriptLibrary.msgScriptOfflineCannotExecFull'));
  }
  if (row.status === 'Archived' || row.status === 3) {
    return ElMessage.warning(t('message.pages.scriptLibrary.msgScriptPrefix') + row.name + t('message.pages.scriptLibrary.msgScriptArchivedCannotExecFull'));
  }
  ElMessage.success(t('msgLoadedJumpFmt', { name: row.name }));
  router.push({
    path: '/ops/script',
    query: { id: row.id, name: row.name },
  });
}
</script>

<style scoped lang="scss">
.output-block {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  .output-block-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #fafafa;
    border-bottom: 1px solid #ebeef5;
    font-size: 13px;
    font-weight: 600;
    color: #303133;
  }
  .output-pre {
    margin: 0;
    padding: 12px 14px;
    max-height: 360px;
    overflow: auto;
    background: #1e1e1e;
    color: #d4d4d4;
    font-family: 'Fira Code', Consolas, Menlo, 'Courier New', monospace;
    font-size: 12.5px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-all;
    &.stderr {
      background: #2e1a1a;
      color: #ffb3b3;
    }
  }
}
.script-library-page {
  width: 100%;
  // Outer deduction: header+tagsView takes 85px (setMainHeight in main.vue when themeConfig.isTagsview)
  // Then deduct footer: .layout-footer .pb5.pt2 height ~40-50px
  // Don't write 100%: because middle <component class="w100"> only sets width not height, 100% won't inherit
  // Don't write 100vh: will overflow outer el-scrollbar causing extra scroll + pagination invisible
  height: calc(100vh - 85px - 50px);
  min-height: 0;
  padding: 16px;
  box-sizing: border-box;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.script-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .official-tag {
    flex-shrink: 0;
    font-weight: 500;
  }
}

.host-validate-result {
  margin-top: 8px;
}

.result-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 2px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

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

  .header-operate {
    display: flex;
    gap: 10px;
    align-items: center;
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
  overflow: hidden;

  .tree-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #333;
  }

  .custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    padding-right: 8px;

    .node-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .node-count {
      color: #909399;
      font-size: 12px;
    }
  }
}

.right-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 12px;
  min-height: 0;
}

.table-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;

  .el-table {
    flex: 1;
    overflow: auto;
  }
}

// Independent pagination bar, fixed below table, not blown up by table height:100%
.pagination-bar {
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  padding: 10px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.editor-toolbar {
  margin-bottom: 12px;
  display: flex;
  gap: 10px;
}

.ace-editor-box {
  width: 100%;
  height: 400px;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
}

.script-monaco-editor {
  width: 100%;
  height: 500px;
  min-height: 400px;
  background: #1e1e1e;
  border: 1px solid #2d2d2d;
  border-radius: 4px;
  overflow: hidden;
}

.version-header {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}

.task-header {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
  display: flex;
  justify-content: space-between;
  align-items: center;

  b {
    color: #303133;
    margin-left: 4px;
  }
}

.task-tabs {
  :deep(.el-tabs__item) {
    font-size: 14px;
  }
}

.task-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 12px;

  b {
    color: #303133;
    margin: 0 4px;
  }
}

.task-name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;

  b {
    color: #303133;
  }
}

.task-desc {
  color: #909399;
  font-size: 12px;
  margin-top: 2px;
}

.schedule-info {
  display: flex;
  align-items: center;
  gap: 8px;

  .schedule-value {
    font-family: monospace;
    font-size: 12px;
    color: #606266;
  }
}

.task-edit-form {
  :deep(.el-form-item) {
    margin-bottom: 14px;
  }
}

.task-form-card {
  margin-bottom: 16px;

  .card-header {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
  }
}

.cron-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}

.args-list,
.envs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.arg-item,
.env-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-form-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.audit-header {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;

  b {
    color: #303133;
    margin-left: 4px;
  }
}

.version-container {
  display: flex;
  gap: 16px;
  height: 500px;
}

.version-list {
  width: 300px;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.version-list-header {
  padding: 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e5e6eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.version-count {
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}

.version-list-content {
  overflow-y: auto;
  flex: 1;
}

.version-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f7fa;
    transform: translateX(4px);
  }

  &.active {
    background-color: #e8f4fd;
    border-left: 4px solid #1989fa;
  }
}

.version-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.version-tag {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  padding: 2px 6px;
  background: #f0f2f5;
  border-radius: 4px;
}

.version-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.4;
  max-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.version-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.version-actions {
  display: flex;
  gap: 6px;
}

.version-code {
  flex: 1;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.code-header {
  padding: 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e5e6eb;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-monaco-box {
  flex: 1;
  width: 100%;
}

/* Permission config styles */
.auth-header {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
  display: flex;
  justify-content: space-between;
  align-items: center;

  b {
    color: #303133;
    margin-left: 4px;
  }
}

.add-auth-form {
  padding-top: 12px;
}

.audit-detail {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.detail-item {
  display: flex;
  padding: 6px 0;
  border-bottom: 1px solid #ebeef5;

  &:last-child {
    border-bottom: none;
  }
}

.detail-label {
  width: 140px;
  color: #909399;
  font-size: 13px;
}

.detail-value {
  flex: 1;
  color: #303133;
  font-size: 13px;
}

.expand-tip {
  color: #909399;
  font-size: 12px;
}

/* ========== Dashboard styles ========== */
.approve-badge {
  margin-left: 8px;
}

.stat-board {
  margin-bottom: 16px;
  background: #fff;
  border-radius: 6px;
  padding: 20px;
}

.stat-card-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  background: #f5f7fa;
  padding: 16px;
  border-radius: 6px;
  margin: 0 6px;
  text-align: center;
  transition: all 0.3s;

  &:first-child {
    margin-left: 0;
  }

  &:last-child {
    margin-right: 0;
  }

  &:hover {
    background: #ecf5ff;
    transform: translateY(-2px);
  }
}

.stat-num {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-blue {
  color: #409eff;
}
.stat-green {
  color: #67c23a;
}
.stat-orange {
  color: #e6a23c;
}
.stat-red {
  color: #f56c6c;
}
.stat-purple {
  color: #909399;
}

.stat-label {
  font-size: 13px;
  color: #606266;
}

.chart-row {
  display: flex;
  margin-bottom: 20px;
}

.chart-card {
  flex: 1;
  background: #fff;
  border: 1px solid #ebeef5;
  margin: 0 6px;
  padding: 16px;
  border-radius: 6px;

  &:first-child {
    margin-left: 0;
  }
  &:last-child {
    margin-right: 0;
  }
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.chart-box {
  width: 100%;
  height: 240px;
}

.top-row {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 16px;
}

/* ========== Approval center styles ========== */
.approve-tabs {
  :deep(.el-tabs__item) {
    font-size: 15px;
  }
}

.approve-detail {
  padding: 20px 28px 32px;

  .info-row {
    display: flex;
    flex-wrap: wrap;
    gap: 28px 32px;
    padding: 18px 22px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 16px;
    line-height: 1.8;
    font-size: 14px;

    b {
      color: #606266;
      font-weight: 500;
      margin-right: 4px;
    }
  }

  .desc {
    display: block;
    margin-top: 6px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 28px 0 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #ebeef5;

    .el-icon {
      color: #409eff;
      font-size: 18px;
    }
  }

  .flow-steps {
    padding: 22px 26px 28px;
    background: #fafafa;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .risk-box {
    background: #fef0f0;
    border: 1px solid #fbc4c4;
    padding: 20px 22px;
    border-radius: 8px;

    &.no-risk {
      background: #f0f9eb;
      border-color: #c2e7b0;

      .el-empty {
        padding: 16px 0;
        --el-empty-description-color: #67c23a;
      }
    }
  }

  .risk-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: #606266;
    padding: 8px 0;
    font-size: 13px;
    line-height: 1.7;

    .el-icon {
      margin-top: 3px;
      flex-shrink: 0;
    }
  }

  .approve-monaco {
    width: 100%;
    height: 340px;
    background: #161b22;
    border-radius: 8px;
    margin-bottom: 8px;
    overflow: hidden;
  }

  .node-detail-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .node-detail-item {
    border: 1px solid #ebeef5;
    border-radius: 10px;
    padding: 18px 22px;
    background: #fff;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
    }

    .node-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px dashed #ebeef5;

      .node-name {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }

      .node-mode {
        margin-left: auto;
        font-size: 12px;
        color: #909399;
        background: #f5f7fa;
        padding: 3px 10px;
        border-radius: 4px;
      }
    }

    .node-approvers {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
      font-size: 13px;
      color: #606266;

      .label {
        color: #909399;
        flex-shrink: 0;
      }
    }

    .node-records {
      margin-top: 6px;

      .label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 10px;
      }
    }

    .record-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: #f9fafc;
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 13px;

      &:last-child {
        margin-bottom: 0;
      }

      .record-user {
        font-weight: 500;
        color: #303133;
      }

      .record-reason {
        color: #606266;
        flex: 1;
      }

      .record-time {
        color: #c0c4cc;
        font-size: 12px;
        flex-shrink: 0;
      }
    }
  }

  .approve-action {
    padding: 4px 2px 0;

    .action-btns {
      margin-top: 20px;
      text-align: right;
      display: flex;
      justify-content: flex-end;
      gap: 14px;
    }
  }
}

.category-manage {
  .category-header {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }
}

// Risk check result dialog
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

.official-sync-content {
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px 20px;
    margin-top: 4px;
  }
  .summary-item {
    font-size: 13px;
    line-height: 22px;
    .label {
      color: #909399;
    }
    b {
      font-size: 14px;
      color: #303133;
      margin-left: 4px;
    }
    &.to-create b { color: #67c23a; }
    &.to-upgrade b { color: #409eff; }
    &.to-discontinue b { color: #e6a23c; }
    &.up-to-date b { color: #909399; }
  }
  .mt-3 { margin-top: 12px; }
  .mb-2 { margin-bottom: 8px; }
  .mb-3 { margin-bottom: 12px; }
  .mx-1 { margin-left: 4px; margin-right: 4px; }
  .text-xs { font-size: 12px; }
}
</style>