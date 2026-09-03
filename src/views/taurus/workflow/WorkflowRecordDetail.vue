<template>
  <div class="record-detail-page">
    <div class="detail-header">
      <div class="header-left">
        <el-button text @click="goBack">← {{ t('message.pages.workflowRecordDetail.wrdBackToList') }}</el-button>
        <h2>{{ detail.flowName }}</h2>
        <el-tag :type="statusTypeMap[detail.status]" size="large">{{ localStatusTextMap[detail.status] }}</el-tag>
      </div>
      <div class="header-right">
        <el-button v-if="detail.status === 'running'" type="danger" @click="stopExec">{{ t('message.pages.workflowRecordDetail.wrdBtnStop') }}</el-button>
        <template v-if="['success', 'fail', 'stopped', 'cancelled', 'skipped'].includes(detail.status)">
          <el-tooltip
            v-if="detail.isLatestDagVersion === false"
            :content="detail.versionBlockedTip || t('message.pages.workflowRecordDetail.wrdVersionBlocked')"
            placement="top"
          >
            <el-button type="info" disabled>{{ t('message.pages.workflowRecordDetail.wrdBtnRerun') }}</el-button>
          </el-tooltip>
          <el-button v-else type="success" @click="rerun">{{ t('message.pages.workflowRecordDetail.wrdBtnRerun') }}</el-button>
        </template>
        <el-button @click="viewLog">{{ t('message.pages.workflowRecordDetail.wrdBtnFullLog') }}</el-button>
      </div>
    </div>

    <div class="detail-info">
      <div class="info-item">
        <span class="label">{{ t('message.pages.workflowRecordDetail.wrdInstance') }}</span>
        <span class="value">{{ detail.instanceId }}</span>
      </div>
      <div class="info-item">
        <span class="label">{{ t('message.pages.workflowRecordDetail.wrdExecutor') }}</span>
        <span class="value">{{ detail.executor }}</span>
      </div>
      <div class="info-item">
        <span class="label">{{ t('message.pages.workflowRecordDetail.wrdStartTime') }}</span>
        <span class="value">{{ detail.startTime }}</span>
      </div>
      <div class="info-item">
        <span class="label">{{ t('message.pages.workflowRecordDetail.wrdEndTime') }}</span>
        <span class="value">{{ detail.endTime }}</span>
      </div>
      <div class="info-item">
        <span class="label">{{ t('message.pages.workflowRecordDetail.wrdTotalDuration') }}</span>
        <span class="value">{{ detail.duration }}</span>
      </div>
      <div v-if="detail.dagVersionVersion != null" class="info-item">
        <span class="label">{{ t('message.pages.workflowRecordDetail.wrdDagVersion') }}</span>
        <span class="value">
          v{{ detail.dagVersionVersion }}
          <template v-if="detail.isLatestDagVersion === false && detail.latestDagVersionVersion != null">
            <span style="color:#f56c6c;margin-left:6px">{{ t('message.pages.workflowRecordDetail.wrdOldVersionHint', { v: detail.latestDagVersionVersion }) }}</span>
          </template>
          <template v-else-if="detail.isLatestDagVersion !== false">
            <el-tag type="success" size="small" style="margin-left:6px">{{ t('message.pages.workflowRecordDetail.wrdLatestVersion') }}</el-tag>
          </template>
        </span>
      </div>
      <div v-if="detail.errorMsg" class="info-item error-info">
        <span class="label">{{ t('message.pages.workflowRecordDetail.wrdErrorInfo') }}</span>
        <span class="value error-text">{{ detail.errorMsg }}</span>
      </div>
    </div>

    <div class="detail-main" ref="mainWrapRef">
      <div class="topology-panel">
        <div class="panel-title">{{ t('message.pages.workflowRecordDetail.wrdTopologyPanel') }}</div>
        <div class="topology-canvas">
          <ExecutionDagTopo
            :nodes="nodeList"
            :lines="lineList"
            :selected-node-id="selectedNodeId"
            :icon-map="nodeIconMap"
            @select="selectNode"
          />
        </div>
      </div>

      <div
        class="resizer"
        :class="{ dragging: isDragging }"
        @mousedown="onResizeStart"
        @dblclick="resetSidebarWidth"
        :title="t('message.pages.workflowRecordDetail.wrdResizeTip')"
      >
        <span class="resizer-dots">
          <i /><i /><i />
        </span>
      </div>

      <div class="node-panel" :style="{ width: sidebarWidth + 'px' }">
        <el-tabs v-model="activeTab">
          <el-tab-pane name="nodes">
            <template #label>
              <span class="tab-label">{{ t('message.pages.workflowRecordDetail.wrdTabNodes') }}</span>
            </template>

            <!-- ========== 1) Node selection list (sorted by start time) ========== -->
            <!-- Many nodes (>20): show search + status filter -->
            <div v-if="showNodeFilterBar" class="node-filter-bar">
              <el-input
                v-model="nodeKeyword"
                :placeholder="t('message.pages.workflowRecordDetail.wrdSearchNode')"
                size="small"
                clearable
                class="nf-search"
              >
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <div class="nf-chips">
                <el-tag
                  v-for="opt in NODE_STATUS_OPTIONS"
                  :key="opt.key"
                  size="small"
                  :effect="nodeStatusFilter === opt.key ? 'dark' : 'plain'"
                  :type="nodeStatusFilter === opt.key ? 'primary' : 'info'"
                  class="nf-chip"
                  @click="nodeStatusFilter = opt.key"
                >
                  {{ opt.label }}
                  <span class="chip-count">{{ nodeStatusCounts[opt.key] }}</span>
                </el-tag>
              </div>
            </div>

            <div class="node-list">
              <div
                v-for="node in filteredNodeList"
                :key="node.id"
                :class="['node-item', node.status, { active: selectedNodeId === node.id }]"
                @click="selectAndOpenNode(node)"
              >
                <div class="node-info">
                  <div class="node-name-row">
                    <span class="node-icon-sm">{{ nodeIconMap[node.type] || '⚙' }}</span>
                    <span class="node-name">{{ node.label }}</span>
                    <!-- Multi-host badge: ✔3 ✘1 mid1 -->
                    <span v-if="node.group?.status_counts" class="node-counts">
                      <span v-if="node.group.status_counts.success" class="mini-badge success">
                        ✔{{ node.group.status_counts.success }}
                      </span>
                      <span v-if="node.group.status_counts.failed" class="mini-badge failed">
                        ✘{{ node.group.status_counts.failed }}
                      </span>
                      <span v-if="node.group.status_counts.running" class="mini-badge running">
                        {{ t('message.pages.workflowRecordDetail.wrdBadgeRunning') }}{{ node.group.status_counts.running }}
                      </span>
                      <span v-if="node.group.status_counts.pending" class="mini-badge pending">
                        {{ t('message.pages.workflowRecordDetail.wrdBadgePending') }}{{ node.group.status_counts.pending }}
                      </span>
                      <span v-if="node.group.status_counts.skipped" class="mini-badge skipped">
                        {{ t('message.pages.workflowRecordDetail.wrdBadgeSkipped') }}{{ node.group.status_counts.skipped }}
                      </span>
                    </span>
                  </div>
                  <div class="node-meta">
                    <span>{{ t('message.pages.workflowRecordDetail.wrdTimeCost') }}{{ node.duration }}</span>
                    <span v-if="node.group?.total_hosts > 1">{{ node.group.completed_hosts }}/{{ node.group.total_hosts }}{{ t('wrdHostsUnit') }}</span>
                    <span v-else>{{ node.endTime || t('wrdExecing') }}</span>
                  </div>
                </div>
                <div class="node-right" @click.stop>
                  <el-tag size="small" :type="statusTypeMap[node.status]" effect="light" class="node-status-tag">
                    {{ localStatusTextMap[node.status] }}
                  </el-tag>
                  <el-button
                    size="small"
                    type="primary"
                    plain
                    class="node-detail-btn"
                    @click="openNodeDrawer(node)"
                  >
                    {{ t('detail') }}
                  </el-button>
                </div>
              </div>
              <div v-if="filteredNodeList.length === 0 && showNodeFilterBar" class="empty-filter-hint">
                {{ t('message.pages.workflowRecordDetail.wrdNoNodeMatch') }}
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane name="log">
            <template #label>
              <span class="tab-label">{{ t('message.pages.workflowRecordDetail.wrdTabLog') }}</span>
            </template>
            <div class="log-panel">
              <div class="log-header">
                <span>{{ logPanelTitle }}</span>
                <div class="log-header-actions">
                  <el-button
                    v-if="!isAllHostsMode && currentHostOutput && (logOutputTab === 'stdout' || logOutputTab === 'stderr')"
                    size="small"
                    text
                    @click="copyLog(logOutputTab === 'stdout' ? (parsedHostOutput.stdout ?? '') : (parsedHostOutput.stderr ?? ''))"
                  >{{ t('message.pages.workflowRecordDetail.wrdCopyOutput') }}</el-button>
                  <el-button size="small" text @click="copyLog(currentLogText)">{{ t('message.pages.workflowRecordDetail.wrdCopyLog') }}</el-button>
                </div>
              </div>

              <!-- ★ Multi-host selector: Tab-style ★ -->
              <div v-if="logHostList.length > 1" class="host-switcher">
                <div
                  class="hs-tab"
                  :class="{ active: logViewMode === 'all' }"
                  @click="logViewMode = 'all'"
                >
                  <span class="hs-label">{{ t('message.pages.workflowRecordDetail.wrdAllHosts') }}</span>
                  <el-tag size="small" effect="light" type="info">{{ logHostList.length }}{{ t('wrdHostsUnit') }}</el-tag>
                </div>
                <div
                  v-for="h in logHostList"
                  :key="h.host_id"
                  class="hs-tab"
                  :class="[hostStatusOf(h), { active: logViewMode === h.host_id }]"
                  :title="hostTooltipOf(h)"
                  @click="logViewMode = h.host_id"
                >
                  <span class="hs-dot" :class="hostStatusOf(h)" />
                  <span class="hs-name" :title="hostNameOf(h)">{{ hostNameOf(h) }}</span>
                </div>
              </div>

              <!-- ★ Summary mode: all-host error messages + summary table ★ -->
              <template v-if="isAllHostsMode">
                <!-- All-host error summary -->
                <div v-if="allHostsErrorList.length > 0" class="error-block multi-error">
                  <div class="error-title">{{ t('message.pages.workflowRecordDetail.wrdErrorMulti', { n: allHostsErrorList.length }) }}</div>
                  <div v-for="(e, i) in allHostsErrorList" :key="i" class="multi-error-item">
                    <div class="me-host">
                      <span class="me-dot fail" />
                      {{ e.hostName }}
                    </div>
                    <pre class="me-content">{{ e.message }}</pre>
                  </div>
                </div>
                <!-- Aggregate log -->
                <div class="log-content">
                  <pre>{{ currentLogText }}</pre>
                </div>
              </template>

              <!-- ★ Single-host mode: structured output + log ★ -->
              <template v-else>
                <div v-if="currentHostErrorMsg" class="error-block">
                  <div class="error-title">{{ t('message.pages.workflowRecordDetail.wrdErrorInfo') }}</div>
                  <pre class="error-content">{{ currentHostErrorMsg }}</pre>
                </div>

                <!-- ★ Structured output: chunked display (no longer a giant JSON blob) ★ -->
                <div v-if="currentHostOutput" class="output-block">
                  <!-- Top: meta info card (exit code / size / ID etc. visible at a glance)-->
                  <div class="output-meta">
                    <div class="om-card om-exit">
                      <div class="om-k">{{ t('message.pages.workflowRecordDetail.wrdExitCode') }}</div>
                      <div class="om-v" :class="parsedHostOutput.exit_code === 0 ? 'ok' : 'bad'">
                        {{ parsedHostOutput.exit_code }}
                      </div>
                    </div>
                    <div class="om-card">
                      <div class="om-k">stdout</div>
                      <div class="om-v">{{ sizeFormat(parsedHostOutput.stdout?.length ?? 0) }}</div>
                    </div>
                    <div class="om-card">
                      <div class="om-k">stderr</div>
                      <div class="om-v" :class="{ bad: parsedHostOutput.stderr && parsedHostOutput.stderr.length > 0 }">
                        {{ sizeFormat(parsedHostOutput.stderr?.length ?? 0) }}
                      </div>
                    </div>
                    <div class="om-card om-id-card" v-if="parsedHostOutput._wfxExecutionId">
                      <div class="om-k">{{ t('message.pages.workflowRecordDetail.wrdExecId') }}</div>
                      <div class="om-v om-id" :title="parsedHostOutput._wfxExecutionId">
                        <span class="om-id-text">{{ parsedHostOutput._wfxExecutionId }}</span>
                        <el-button
                          size="small"
                          link
                          type="primary"
                          class="om-id-copy"
                          @click.stop="copyText(parsedHostOutput._wfxExecutionId, t('message.pages.workflowRecordDetail.wrdExecIdLabel'))"
                        >{{ t('copy') }}</el-button>
                      </div>
                    </div>
                  </div>

                  <!-- Tabs: stdout / stderr / structured / raw JSON -->
                  <div class="output-tabs">
                    <div class="ot-head">
                      <div
                        v-for="tab in OUTPUT_TABS"
                        :key="tab.key"
                        :class="['ot-tab', { active: logOutputTab === tab.key }]"
                        @click="logOutputTab = tab.key"
                      >
                        {{ tab.label }}
                        <el-tag v-if="tab.count" size="small" :type="tab.tagType || 'info'" effect="light" class="ot-count">
                          {{ tab.count }}
                        </el-tag>
                      </div>
                    </div>
                    <div class="ot-body">
                      <!-- stdout -->
                      <pre v-if="logOutputTab === 'stdout'" class="ot-pre stdout">{{ parsedHostOutput.stdout || t('message.pages.workflowRecordDetail.wrdEmpty') }}</pre>
                      <!-- stderr -->
                      <pre v-else-if="logOutputTab === 'stderr'" class="ot-pre stderr">{{ parsedHostOutput.stderr || t('message.pages.workflowRecordDetail.wrdEmpty') }}</pre>
                      <!-- Structured: if it's a lines array, render line by line; otherwise show JSON -->
                      <template v-else-if="logOutputTab === 'structured'">
                        <div v-if="parsedHostOutput.structuredLines && parsedHostOutput.structuredLines.length" class="structured-lines">
                          <div v-for="(line, i) in parsedHostOutput.structuredLines" :key="i" class="sl-line">
                            <span class="sl-idx">{{ i + 1 }}</span>
                            <pre class="sl-pre">{{ formatStructuredLine(line) }}</pre>
                          </div>
                        </div>
                        <pre v-else-if="parsedHostOutput.structuredPretty" class="ot-pre json">{{ parsedHostOutput.structuredPretty }}</pre>
                        <div v-else class="empty-structured">{{ t('message.pages.workflowRecordDetail.wrdNoStructuredOutput') }}</div>
                      </template>
                      <!-- Raw JSON (fallback / for advanced users who want the full blob) -->
                      <pre v-else class="ot-pre json">{{ formatOutput(currentHostOutput) }}</pre>
                    </div>
                  </div>
                </div>

                <div class="log-content">
                  <pre>{{ currentLogText }}</pre>
                </div>
              </template>
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="node-actions" v-if="selectedNode && detail.status === 'running'">
          <el-button v-if="selectedNode.status === 'fail'" type="success" @click="retryNode(selectedNode.id)">
            <el-icon><RefreshRight /></el-icon> {{ t('message.pages.workflowRecordDetail.wrdBtnRetryNode') }}
          </el-button>
          <el-button v-if="selectedNode.status === 'pending'" type="primary" @click="skipNode(selectedNode.id)">
            <el-icon><Promotion /></el-icon> {{ t('message.pages.workflowRecordDetail.wrdBtnSkipNode') }}
          </el-button>
          <el-button v-if="selectedNode.type === 'approve' && selectedNode.status === 'pending'" type="warning" @click="approveNode(selectedNode.id)">
            <el-icon><Select /></el-icon> {{ t('message.pages.workflowRecordDetail.wrdBtnApproveNode') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- ★ Drawer: node execution details (host table + output) — open by clicking 'Details' on the card -->
    <!-- ============================================================ -->
    <el-drawer
      v-model="nodeDrawerVisible"
      :title="drawerNode ? drawerNode.label : t('message.pages.workflowRecordDetail.wrdDrawerNodeTitle')"
      direction="rtl"
      size="880px"
      :destroy-on-close="true"
      :close-on-click-modal="true"
      class="node-exec-drawer"
    >
      <template v-if="drawerNode">
        <div class="drawer-header">
          <div class="dr-title-row">
            <span class="dr-icon">{{ nodeIconMap[drawerNode?.type] || '⚙' }}</span>
            <span class="dr-name">{{ drawerNode.label }}</span>
            <el-tag
              size="small"
              :type="statusTypeMap[drawerNode.status]"
              effect="dark"
              class="dr-status"
            >
              {{ localStatusTextMap[drawerNode.status] }}
            </el-tag>
            <span
              v-if="drawerGroup?.attempts_max > 1"
              class="retry-tip"
              :title="t('message.pages.workflowRecordDetail.wrdMaxRetry', { n: drawerGroup.attempts_max })"
            >
              ⚠ {{ t('message.pages.workflowRecordDetail.wrdRetryCount', { n: drawerGroup.attempts_max }) }}
            </span>
          </div>
          <div class="dr-meta-row">
            <span class="dr-meta">{{ t('message.pages.workflowRecordDetail.wrdTimeCost') }}{{ drawerNode.duration }}</span>
            <span v-if="drawerGroup?.total_hosts > 1" class="dr-meta">
              {{ t('message.pages.workflowRecordDetail.wrdProgress', { done: drawerGroup.completed_hosts, total: drawerGroup.total_hosts }) }}
            </span>
            <span class="dr-meta">{{ t('message.pages.workflowRecordDetail.wrdStartTime') }}{{ formatRowStart(drawerNode as any) }}</span>
          </div>
        </div>

        <!-- ★ Multi-host node: stats card + filter + table + single output block ★ -->
        <template v-if="drawerGroup?.hosts?.length > 0 && hasRealHost(drawerGroup.hosts)">

          <!-- Top aggregate stats card -->
          <div class="host-stat-row">
            <div
              class="host-stat-card hsc-total"
              :class="{ active: drawerHostStatusFilter === 'all' && !drawerOnlyShowFailed }"
              @click="jumpStatus('all')"
            >
              <div class="hsc-num">{{ drawerStatusCounts.all }}</div>
              <div class="hsc-label">{{ t('message.pages.workflowRecordDetail.wrdHostTotal') }}</div>
            </div>
            <div
              v-if="drawerStatusCounts.running"
              class="host-stat-card hsc-running"
              :class="{ active: drawerHostStatusFilter === 'running' }"
              @click="jumpStatus('running')"
            >
              <div class="hsc-num">{{ drawerStatusCounts.running }}</div>
              <div class="hsc-label">{{ t('message.pages.workflowRecordDetail.wrdHostRunning') }}</div>
            </div>
            <div
              class="host-stat-card hsc-success"
              :class="{ active: drawerHostStatusFilter === 'success' }"
              @click="jumpStatus('success')"
            >
              <div class="hsc-num">{{ drawerStatusCounts.success }}</div>
              <div class="hsc-label">{{ t('message.pages.workflowRecordDetail.wrdHostSuccess') }}</div>
            </div>
            <div
              class="host-stat-card hsc-fail"
              :class="{ active: drawerHostStatusFilter === 'fail' || drawerOnlyShowFailed }"
              @click="jumpStatus('fail')"
            >
              <div class="hsc-num">{{ drawerStatusCounts.fail }}</div>
              <div class="hsc-label">{{ t('message.pages.workflowRecordDetail.wrdHostFail') }}</div>
            </div>
            <div
              v-if="drawerStatusCounts.pending"
              class="host-stat-card hsc-pending"
              :class="{ active: drawerHostStatusFilter === 'pending' }"
              @click="jumpStatus('pending')"
            >
              <div class="hsc-num">{{ drawerStatusCounts.pending }}</div>
              <div class="hsc-label">{{ t('message.pages.workflowRecordDetail.wrdHostPending') }}</div>
            </div>
            <div
              v-if="drawerStatusCounts.skipped"
              class="host-stat-card hsc-skipped"
              :class="{ active: drawerHostStatusFilter === 'skipped' }"
              @click="jumpStatus('skipped')"
            >
              <div class="hsc-num">{{ drawerStatusCounts.skipped }}</div>
              <div class="hsc-label">{{ t('message.pages.workflowRecordDetail.wrdHostSkipped') }}</div>
            </div>
          </div>

          <!-- Filter toolbar -->
          <div class="host-filter-bar">
            <el-input
              v-model="drawerHostKeyword"
              :placeholder="t('message.pages.workflowRecordDetail.wrdSearchHost')"
              size="small"
              clearable
              class="hfb-search"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <div class="hfb-chips">
              <el-tag
                size="small"
                :effect="drawerOnlyShowFailed ? 'dark' : 'plain'"
                :type="drawerOnlyShowFailed ? 'danger' : 'info'"
                class="hfb-chip fail-quick"
                @click="jumpStatus('fail-quick')"
              >
                {{ drawerOnlyShowFailed ? t('message.pages.workflowRecordDetail.wrdOnlyShowFailedChecked') : t('message.pages.workflowRecordDetail.wrdOnlyShowFailed') }}
              </el-tag>
              <el-tag
                v-for="opt in HOST_STATUS_OPTIONS"
                :key="opt.key"
                size="small"
                :effect="(!drawerOnlyShowFailed && drawerHostStatusFilter === opt.key) ? 'dark' : 'plain'"
                :type="
                  !drawerOnlyShowFailed && drawerHostStatusFilter === opt.key
                    ? (opt.key === 'fail' ? 'danger' : opt.key === 'success' ? 'success' : opt.key === 'running' ? 'primary' : opt.key === 'pending' ? 'info' : opt.key === 'skipped' ? 'warning' : 'primary')
                    : 'info'
                "
                class="hfb-chip"
                @click="jumpStatus(opt.key)"
              >
                <span class="hfb-dot" :style="{ background: opt.dot }" />
                {{ opt.label }}
                <span class="chip-count">{{ drawerStatusCounts[opt.key] }}</span>
              </el-tag>
            </div>
            <!-- ★ Failed-host navigation (out of N hosts only 3 failed → locate in 1 second) ★ -->
            <div v-if="failHostList.length > 0" class="hfb-nav">
              <span class="hfb-nav-label">
                <el-icon color="#f56c6c" size="12"><CircleClose /></el-icon>
                {{ currentFailCursor > 0 ? `${currentFailCursor}/${failHostList.length}` : t('message.pages.workflowRecordDetail.wrdTotalFailHosts', { n: failHostList.length }) }}
              </span>
              <el-button size="small" :disabled="failHostList.length < 2" @click="gotoFail(-1)">
                ‹ {{ t('message.pages.workflowRecordDetail.wrdPrevFail') }}
              </el-button>
              <el-button size="small" type="danger" plain @click="gotoFail(1)">
                {{ t('message.pages.workflowRecordDetail.wrdNextFail') }} ›
              </el-button>
            </div>
          </div>

          <!-- Host execution table (no inline expansion; click 'Details' to toggle output below)-->
          <div class="host-table-wrap">
            <el-table
              ref="drawerHostTableRef"
              :data="drawerPagedHosts"
              size="small"
              border
              row-key="host_id"
              highlight-current-row
              class="host-exec-table drawer-table"
              :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontSize: '12px' }"
              :cell-style="{ fontSize: '12px' }"
              @row-click="(r: any) => drawerRevealOutput(r.host_id)"
              @row-dblclick="(r: any) => drawerRevealOutput(r.host_id)"
            >
              <!-- Status dot -->
              <el-table-column :label="t('message.pages.workflowRecordDetail.wrdColStatus')" width="60" align="center">
                <template #default="{ row }">
                  <el-tooltip
                    :content="localStatusTextMap[STATUS_MAP[row.status] || row.status_display || 'pending']"
                    placement="top"
                  >
                    <span
                      class="he-status-dot"
                      :class="STATUS_MAP[row.status] || row.status_display || 'pending'"
                    />
                  </el-tooltip>
                </template>
              </el-table-column>

              <!-- Hostname -->
              <el-table-column :label="t('message.pages.workflowRecordDetail.wrdColHostName')" min-width="140" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="he-host-name">
                    {{ row.host_detail?.host_name || shortId(row.host_id) }}
                    <el-tooltip v-if="row.error_message" :content="row.error_message" placement="top">
                      <span class="he-warn">⚠</span>
                    </el-tooltip>
                  </span>
                </template>
              </el-table-column>

              <!-- IP -->
              <el-table-column :label="t('message.pages.workflowRecordDetail.wrdColIP')" min-width="115" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row.host_detail?.host_ip" class="he-ip mono-text">
                    {{ row.host_detail.host_ip }}
                  </span>
                  <span v-else class="he-id muted mono-text">{{ shortId(row.host_id) }}</span>
                </template>
              </el-table-column>

              <!-- Exit code -->
              <el-table-column :label="t('message.pages.workflowRecordDetail.wrdColExitCode')" width="78" align="center">
                <template #default="{ row }">
                  <span
                    class="he-exitcode"
                    :class="
                      (row.exit_code ?? row.output?.exit_code) == null
                        ? 'na'
                        : (row.exit_code ?? row.output?.exit_code) === 0 ? 'ok' : 'bad'
                    "
                  >
                    {{
                      (row.exit_code ?? row.output?.exit_code) == null
                        ? '—'
                        : (row.exit_code ?? row.output?.exit_code)
                    }}
                  </span>
                </template>
              </el-table-column>

              <!-- Duration -->
              <el-table-column :label="t('message.pages.workflowRecordDetail.wrdColDuration')" width="92" align="right">
                <template #default="{ row }">
                  <span class="mono-text he-duration">{{ formatRowDuration(row) }}</span>
                </template>
              </el-table-column>

              <!-- Start time -->
              <el-table-column :label="t('message.pages.workflowRecordDetail.wrdColStartTime')" min-width="130" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="he-start mono-text muted">
                    {{ formatRowStart(row) }}
                  </span>
                </template>
              </el-table-column>

              <!-- Action column: switch to view this host's output -->
              <el-table-column :label="t('message.pages.workflowRecordDetail.wrdColActions')" width="80" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button
                    size="small"
                    link
                    :type="drawerOutputVisible && drawerSelectedHostId === row.host_id ? 'primary' : 'info'"
                    @click.stop="drawerRevealOutput(row.host_id)"
                  >
                    {{ drawerOutputVisible && drawerSelectedHostId === row.host_id ? t('message.pages.workflowRecordDetail.wrdViewing') : t('detail') }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div v-if="drawerFilteredHosts.length === 0" class="empty-filter-hint" style="margin: 8px;">
              {{ t('message.pages.workflowRecordDetail.wrdNoHostMatch') }}
            </div>

            <!-- ★ Pagination bar (always shown: total N + page-size switch for easy debugging) ★ -->
            <div class="host-pagination-wrap">
              <el-pagination
                v-model:current-page="drawerPage"
                v-model:page-size="drawerPageSize"
                :page-sizes="[10, 15, 25, 50, 100]"
                :total="drawerFilteredHosts.length"
                layout="total, sizes, prev, pager, next, jumper"
                size="small"
                background
              />
            </div>
          </div>

          <!-- ★ Output area: only shown after 'Details' click or row double-click (hidden by default) ★ -->
          <div v-if="drawerOutputVisible" class="drawer-output-wrap">
            <!-- Error info top bar -->
            <div v-if="drawerSelectedHostRow?.error_message" class="he-error drawer-error">
              <span class="he-err-label">{{ t('message.pages.workflowRecordDetail.wrdErrorLabel') }}</span>
              <pre class="he-err-content">{{ drawerSelectedHostRow.error_message }}</pre>
            </div>
            <HostOutputBlock
              :key="'drw-' + (drawerSelectedHostId || '__node__')"
              :row="drawerSelectedHostRow || drawerNode"
              :host-detail="drawerCurrentHostDetail"
            />
          </div>
          <!-- Placeholder hint when no host is being viewed -->
          <div v-else class="drawer-output-placeholder" @click="drawerRevealOutput()">
            <el-icon :size="36" color="#C0C4CC"><DataAnalysis /></el-icon>
            <div class="dop-title">{{ t('message.pages.workflowRecordDetail.wrdOutputPlaceholder1') }}</div>
            <div class="dop-sub">{{ t('message.pages.workflowRecordDetail.wrdOutputPlaceholder2') }}</div>
          </div>
        </template>

        <!-- ★ Single-host / no-host node: show output directly ★ -->
        <template v-else>
          <div class="drawer-output-wrap">
            <HostOutputBlock
              :key="'drw-__single__'"
              :row="drawerNode"
              :host-detail="drawerCurrentHostDetail"
            />
          </div>
        </template>
      </template>
    </el-drawer>

    <el-dialog v-model="logDialogVisible" :title="t('message.pages.workflowRecordDetail.wrdDialogFullLogTitle')" width="700px" :close-on-click-modal="true">
      <div class="full-log-container">
        <pre>{{ fullLog }}</pre>
      </div>
      <template #footer>
        <el-button @click="copyLog(fullLog)">{{ t('message.pages.workflowRecordDetail.wrdCopyLog') }}</el-button>
        <el-button type="primary" @click="logDialogVisible = false">{{ t('close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
import { RefreshRight, Promotion, Select, Search, DataAnalysis, CircleClose } from '@element-plus/icons-vue'
import ExecutionDagTopo from '/@/components/workflow/ExecutionDagTopo.vue'
import HostOutputBlock from './components/HostOutputBlock.vue'
import { useExecutionDetail, statusTypeMap } from './composables/useExecutionDetail'
import { useNodeOperations } from './composables/useNodeOperations'

// Local i18n-aware status map (replaces composable's static statusTextMap)
const localStatusTextMap: Record<string, string> = {
  pending: t('message.pages.workflowRecordDetail.wrdBadgePending'),
  running: t('message.pages.workflowRecordDetail.wrdBadgeRunning'),
  success: t('message.pages.workflowRecordDetail.wrdBadgeSuccess'),
  fail: t('message.pages.workflowRecordDetail.wrdBadgeFail'),
  cancelled: t('message.pages.workflowRecordDetail.wrdBadgeCancelled'),
  skipped: t('message.pages.workflowRecordDetail.wrdBadgeSkipped'),
  stopped: t('message.pages.workflowRecordDetail.wrdBadgeStopped'),
}

const STATUS_MAP: Record<number, string> = {
  0: 'pending', 1: 'running', 2: 'success', 3: 'fail', 4: 'cancelled', 5: 'skipped',
}

/* ========== Performance thresholds ========== */
const NODE_FILTER_THRESHOLD = 20 // Show search/filter when node count exceeds this value

const router = useRouter()
const route = useRoute()
const activeTab = ref(
  route.query.tab === 'log' ? 'log' : 'nodes'
)

/* ========== Resizable right sidebar ========== */
const DEFAULT_WIDTH = 460
const MIN_WIDTH = 320
const MAX_WIDTH = 820
const LS_KEY = 'taurus:workflow:sidebar-width'
const mainWrapRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)

const safeWidth = (w: number) => {
  const mainW = mainWrapRef.value?.clientWidth || 1200
  const leftMin = 380
  const upper = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, mainW - leftMin - 16))
  return Math.min(Math.max(w, MIN_WIDTH), upper)
}
const initSidebarWidth = () => {
  try {
    const saved = localStorage.getItem(LS_KEY)
    if (saved) {
      const n = parseInt(saved, 10)
      if (!Number.isNaN(n)) return safeWidth(n)
    }
  } catch {
    // eslint-disable-next-line no-empty
  }
  return DEFAULT_WIDTH
}
const sidebarWidth = ref<number>(DEFAULT_WIDTH)
let _moveX0 = 0
let _moveW0 = 0
function onResizeStart(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = true
  _moveX0 = e.clientX
  _moveW0 = sidebarWidth.value
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onResizeMove, true)
  window.addEventListener('mouseup', onResizeEnd, true)
}
function onResizeMove(e: MouseEvent) {
  if (!isDragging.value) return
  // Resizer sits on left edge of right panel: drag left (delta < 0) → right panel widens; drag right → right panel narrows
  const delta = e.clientX - _moveX0
  sidebarWidth.value = safeWidth(_moveW0 - delta)
}
function onResizeEnd() {
  isDragging.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onResizeMove, true)
  window.removeEventListener('mouseup', onResizeEnd, true)
  try { localStorage.setItem(LS_KEY, String(sidebarWidth.value)) } catch {
    // eslint-disable-next-line no-empty
  }
}
function resetSidebarWidth() {
  sidebarWidth.value = safeWidth(DEFAULT_WIDTH)
  try { localStorage.removeItem(LS_KEY) } catch {
    // eslint-disable-next-line no-empty
  }
}
onMounted(() => { sidebarWidth.value = initSidebarWidth() })
onBeforeUnmount(() => onResizeEnd())
watch(
  () => mainWrapRef.value?.clientWidth,
  () => { sidebarWidth.value = safeWidth(sidebarWidth.value) }
)

const {
  detail,
  nodeList,
  lineList,
  selectedNodeId,
  selectedNode,
  selectedGroup,
  selectedHostId,
  selectedHostRow,
  stepsByNodeHost,
  selectNode,
  selectHost,
  loadExecution,
} = useExecutionDetail()

const {
  logDialogVisible,
  fullLog,
  viewLog,
  copyLog,
  stopExec,
  rerun,
  retryNode,
  skipNode,
  approveNode,
} = useNodeOperations(detail, loadExecution)

const nodeIconMap: Record<string, string> = {
  start: '▶',
  end: '■',
  script: '📜',
  approve: '✅',
  delay: '⏱',
  http_callback: '🌐',
  condition: '🔀',
  transform: '🔄',
  loop: '🔁',
  webhook_notify: '📡',
  email_notify: '📧',
  program: '📦',
  virtual_start: '▶',
  virtual_end: '⏹',
  noop: '∅',
  command: '💻',
  file_op: '📁',
  http: '🌐',
  sub_workflow: '🔗',
  wait: '⏸',
  approval: '✅',
}

// --------- Node list sorted by start time (right panel 'node details' only) ---------
const sortedNodeList = computed(() =>
  [...nodeList.value].sort((a, b) => {
    const ta = a.startTime ? new Date(a.startTime).getTime() : Number.MAX_SAFE_INTEGER
    const tb = b.startTime ? new Date(b.startTime).getTime() : Number.MAX_SAFE_INTEGER
    if (ta !== tb) return ta - tb
    const ea = a.endTime ? new Date(a.endTime).getTime() : Number.MAX_SAFE_INTEGER
    const eb = b.endTime ? new Date(b.endTime).getTime() : Number.MAX_SAFE_INTEGER
    if (ea !== eb) return ea - eb
    return String(a.id || '').localeCompare(String(b.id || ''))
  })
)

/* ========== When nodes are many (>20): search + status filter ========== */
const nodeKeyword = ref('')
const nodeStatusFilter = ref<string>('all')
const showNodeFilterBar = computed(() => sortedNodeList.value.length > NODE_FILTER_THRESHOLD)

const NODE_STATUS_OPTIONS = [
  { key: 'all',     label: t('message.pages.workflowRecordDetail.wrdOptAll') },
  { key: 'fail',    label: t('message.pages.workflowRecordDetail.wrdOptFail') },
  { key: 'running', label: t('message.pages.workflowRecordDetail.wrdOptRunning') },
  { key: 'success', label: t('message.pages.workflowRecordDetail.wrdOptSuccess') },
  { key: 'pending', label: t('message.pages.workflowRecordDetail.wrdOptPending') },
  { key: 'skipped', label: t('message.pages.workflowRecordDetail.wrdOptSkipped') },
] as const

const filteredNodeList = computed(() => {
  const kw = nodeKeyword.value.trim().toLowerCase()
  return sortedNodeList.value.filter(n => {
    if (nodeStatusFilter.value !== 'all' && n.status !== nodeStatusFilter.value) return false
    if (kw) {
      const label = String(n.label || '').toLowerCase()
      const idStr = String(n.id || '').toLowerCase()
      if (!label.includes(kw) && !idStr.includes(kw)) return false
    }
    return true
  })
})

const nodeStatusCounts = computed(() => {
  const counts: Record<string, number> = { all: 0, fail: 0, running: 0, success: 0, pending: 0, skipped: 0 }
  for (const n of sortedNodeList.value) {
    counts.all++
    if (counts[n.status] != null) counts[n.status]++
  }
  return counts
})

/* ========== Host detail state (all moved into Drawer) ========== */
const HOST_STATUS_OPTIONS = [
  { key: 'all',     label: t('message.pages.workflowRecordDetail.wrdOptAll'),   dot: '#C0C4CC' },
  { key: 'fail',    label: t('message.pages.workflowRecordDetail.wrdOptFail'),   dot: '#F56C6C' },
  { key: 'running', label: t('message.pages.workflowRecordDetail.wrdOptRunning'), dot: '#409EFF' },
  { key: 'success', label: t('message.pages.workflowRecordDetail.wrdOptSuccess'),   dot: '#67C23A' },
  { key: 'pending', label: t('message.pages.workflowRecordDetail.wrdOptPending'), dot: '#C0C4CC' },
  { key: 'skipped', label: t('message.pages.workflowRecordDetail.wrdOptSkipped'), dot: '#E6A23C' },
] as const

/* ========== Drawer: node details dialog ========== */
const nodeDrawerVisible = ref(false)
const drawerNodeId = ref<string | number | null>(null)
const drawerHostKeyword = ref('')
const drawerHostStatusFilter = ref<string>('all')
const drawerOnlyShowFailed = ref(false)
const drawerSelectedHostId = ref<string | null>(null)
const drawerOutputVisible = ref(false) // Whether output area is visible (only expanded after user clicks)
const drawerPage = ref(1)
const drawerPageSize = ref(15)
const drawerHostTableRef = ref<any>(null)

const drawerNode = computed(() =>
  drawerNodeId.value == null
    ? null
    : (sortedNodeList.value.find(n => n.id === drawerNodeId.value) ||
       nodeList.value.find(n => n.id === drawerNodeId.value) || null)
)

const drawerGroup = computed(() => (drawerNode.value as any)?.group || null)

// Select node + auto-open Drawer (triggered directly by clicking card)
function selectAndOpenNode(node: any) {
  selectNode(node)
  openNodeDrawer(node)
}

// Open Drawer: locate node (default first failed host, but **do NOT show output** yet)
function openNodeDrawer(node: any) {
  drawerNodeId.value = node.id ?? null
  drawerHostKeyword.value = ''
  drawerHostStatusFilter.value = 'all'
  drawerOnlyShowFailed.value = false
  drawerSelectedHostId.value = null
  drawerOutputVisible.value = false // ← CRITICAL: output hidden initially
  drawerPage.value = 1
  nextTick(() => {
    const hosts = (drawerGroup.value?.hosts || []) as any[]
    const firstFail = hosts.find(h => (STATUS_MAP[h.status] || h.status_display) === 'fail')
    const firstRun = hosts.find(h => (STATUS_MAP[h.status] || h.status_display) === 'running')
    const pick = firstFail || firstRun || hosts[0]
    drawerSelectedHostId.value = pick?.host_id || null
  })
  nodeDrawerVisible.value = true
}

// Click table / view: show current host output
function drawerRevealOutput(hid?: string) {
  if (hid != null) drawerSelectedHostId.value = hid
  drawerOutputVisible.value = true
}

// Drawer internal host filter
const drawerStatusCounts = computed(() => {
  const counts: Record<string, number> = { all: 0, fail: 0, running: 0, success: 0, pending: 0, skipped: 0 }
  const all = drawerGroup.value?.hosts || []
  for (const h of all) {
    const s = STATUS_MAP[h.status] || h.status_display || 'pending'
    counts.all++
    if (counts[s] != null) counts[s]++
  }
  return counts
})

const drawerFilteredHosts = computed(() => {
  const all = drawerGroup.value?.hosts || []
  const kw = drawerHostKeyword.value.trim().toLowerCase()
  const effStatus = drawerOnlyShowFailed.value ? 'fail' : drawerHostStatusFilter.value
  return (all as any[]).filter(h => {
    const statusKey = STATUS_MAP[h.status] || h.status_display || 'pending'
    if (effStatus !== 'all' && statusKey !== effStatus) return false
    if (kw) {
      const hn = String(h.host_detail?.host_name || '').toLowerCase()
      const ip = String(h.host_detail?.host_ip || '').toLowerCase()
      const hid = String(h.host_id || '').toLowerCase()
      if (!hn.includes(kw) && !ip.includes(kw) && !hid.includes(kw)) return false
    }
    return true
  }).sort((a, b) => {
    const statusOrder: Record<string, number> = { fail: 0, running: 1, pending: 2, cancelled: 3, skipped: 4, success: 5 }
    const sa = statusOrder[STATUS_MAP[a.status] || a.status_display || 'pending'] ?? 99
    const sb = statusOrder[STATUS_MAP[b.status] || b.status_display || 'pending'] ?? 99
    if (sa !== sb) return sa - sb
    const ta = (a.started_at || a.startTime) ? new Date(a.started_at || a.startTime).getTime() : Number.MAX_SAFE_INTEGER
    const tb = (b.started_at || b.startTime) ? new Date(b.started_at || b.startTime).getTime() : Number.MAX_SAFE_INTEGER
    return ta - tb
  })
})

// Rows actually rendered after pagination (DOM count constant, smooth even with many hosts)
const drawerPagedHosts = computed(() => {
  const list = drawerFilteredHosts.value
  const start = (drawerPage.value - 1) * drawerPageSize.value
  return list.slice(start, start + drawerPageSize.value)
})

// Clamp current page when filter results or page size change to stay in range
watch(
  [() => drawerFilteredHosts.value.length, drawerPageSize],
  ([total, size]) => {
    const maxPage = Math.max(1, Math.ceil(total / size))
    if (drawerPage.value > maxPage) drawerPage.value = maxPage
  },
)

/* ========== Multi-host scenario: debugging shortcuts ========== */
// All failed hosts (unpaginated / unaffected by filter → cross-page navigation is reliable)
const failHostList = computed(() => {
  const all = (drawerGroup.value?.hosts || []) as any[]
  return all.filter(h => (STATUS_MAP[h.status] || h.status_display) === 'fail')
})
// Current failure index being viewed (1-based, 0 = never located)
const currentFailCursor = ref(0)

// Click status card / Tag → toggle filter; if it's failed, auto-reveal the 1st one
function jumpStatus(key: 'all' | 'running' | 'success' | 'fail' | 'pending' | 'skipped' | 'fail-quick') {
  if (key === 'fail-quick') {
    drawerOnlyShowFailed.value = !drawerOnlyShowFailed.value
    drawerHostStatusFilter.value = 'all'
  } else {
    drawerOnlyShowFailed.value = false
    drawerHostStatusFilter.value = key
  }
  drawerPage.value = 1
  // When switching to failure-related filter: directly locate first failure + expand output(no extra click needed)
  nextTick(() => {
    const list = drawerFilteredHosts.value
    if (list.length === 0) { drawerSelectedHostId.value = null; drawerOutputVisible.value = false; return }
    const pick = list[0]
    drawerSelectedHostId.value = pick.host_id
    // If 'view failed only' → auto-expand output
    if (drawerOnlyShowFailed.value || drawerHostStatusFilter.value === 'fail') {
      drawerOutputVisible.value = true
      currentFailCursor.value = failHostList.value.findIndex(h => h.host_id === pick.host_id) + 1
    } else {
      drawerOutputVisible.value = false
      currentFailCursor.value = 0
    }
    // Jump to the page containing the host
    _scrollHostIntoView(pick.host_id, list)
  })
}

// Previous / Next failure (direction ±1) → cross-filter, cross-page navigation
function gotoFail(dir: -1 | 1) {
  const fails = failHostList.value
  if (fails.length === 0) return
  // If current host is failed, step from it; otherwise start from 0 / last
  let idx = currentFailCursor.value > 0 ? currentFailCursor.value - 1 : -1
  if (idx === -1) {
    const cur = drawerSelectedHostId.value
    const existed = cur ? fails.findIndex(h => h.host_id === cur) : -1
    idx = existed >= 0 ? existed : (dir === 1 ? -1 : fails.length)
  }
  idx = (idx + dir + fails.length) % fails.length
  const target = fails[idx]
  currentFailCursor.value = idx + 1

  // Switch to 'All' view to ensure target is in list; navigate to that page + select + reveal
  drawerOnlyShowFailed.value = false
  drawerHostStatusFilter.value = 'all'
  drawerHostKeyword.value = ''
  const all = drawerFilteredHosts.value
  const pos = all.findIndex(h => h.host_id === target.host_id)
  drawerPage.value = Math.max(1, Math.floor(pos / drawerPageSize.value) + 1)
  drawerSelectedHostId.value = target.host_id
  drawerOutputVisible.value = true
  _scrollHostIntoView(target.host_id, all)
}

// Helper: scroll table to target row after page switch (run next tick, wait for el-table render)
function _scrollHostIntoView(hostId: string, _list: any[]) {
  nextTick(() => {
    const wrap = document.querySelector('.node-exec-drawer .drawer-table .el-table__body-wrapper') as HTMLElement | null
    if (!wrap) return
    const row = wrap.querySelector<HTMLElement>(`[data-row-host-id="${hostId}"]`)
      || wrap.querySelector('.el-table__row') as HTMLElement | null
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

// Drawer currently selected host row + details
const drawerSelectedHostRow = computed(() => {
  const hosts = (drawerGroup.value?.hosts || []) as any[]
  if (!drawerSelectedHostId.value) return hosts[0] || null
  return hosts.find(h => h.host_id === drawerSelectedHostId.value) || hosts[0] || null
})

const drawerCurrentHostDetail = computed(() => {
  const r = drawerSelectedHostRow.value
  if (r?.host_detail) return r.host_detail
  return (drawerNode.value as any)?.host_detail || null
})

// On filter change: go to page 1 + hide output (wait for re-click); if selection not in list, jump to first item
watch(
  () => [drawerHostKeyword.value, drawerHostStatusFilter.value, drawerOnlyShowFailed.value, drawerGroup.value?.id],
  () => {
    drawerPage.value = 1
    drawerOutputVisible.value = false
    const list = drawerFilteredHosts.value
    if (list.length === 0) { drawerSelectedHostId.value = null; return }
    if (!list.some(h => h.host_id === drawerSelectedHostId.value)) {
      drawerSelectedHostId.value = list[0].host_id
    }
  },
)

// --------- Helper functions ---------
const shortId = (s: any) => String(s || '').slice(0, 8)
const hasRealHost = (hosts: any[]) => hosts.some(
  (h: any) => h.host_id && h.host_id !== '__NO_HOST__'
)
const formatHostStart = (s: any) => {
  if (!s) return ''
  const str = String(s)
  return str.includes('T') ? str.split('T')[1].slice(0, 8) : str.slice(11, 19)
}
function _formatMsSimple(ms: number): string {
  if (ms < 0) return '—'
  if (ms >= 60_000) {
    const m = Math.floor(ms / 60_000)
    const s = ((ms % 60_000) / 1000).toFixed(1)
    return t('wrdDurationFmt', { m, s })
  }
  return (ms / 1000).toFixed(ms < 1_000 ? 3 : 2) + 's'
}
function formatRowDuration(row: any): string {
  if (row?.duration_ms != null) {
    const n = Number(row.duration_ms)
    return Number.isFinite(n) ? _formatMsSimple(n) : '—'
  }
  const st = row?.started_at || row?.startTime
  const fi = row?.finished_at || row?.endTime
  if (st && fi) {
    const diff = new Date(fi).getTime() - new Date(st).getTime()
    if (!Number.isNaN(diff) && diff >= 0) return _formatMsSimple(diff)
  }
  if (st && !fi) {
    const diff = Date.now() - new Date(st).getTime()
    if (!Number.isNaN(diff) && diff >= 0) return _formatMsSimple(diff) + '…'
  }
  return '—'
}
function formatRowStart(row: any): string {
  const s = row?.started_at || row?.startTime
  if (!s) return '—'
  const str = String(s).replace('T', ' ')
  return str.length >= 19 ? str.slice(0, 19) : str
}

// --------- Log panel: multi-host switching mode ---------
const logViewMode = ref<'all' | string>('all') // 'all' or a specific host_id
// Reset log view mode when switching nodes
watch([selectedNodeId, selectedGroup], () => {
  const hosts = selectedGroup.value?.hosts
  if (Array.isArray(hosts) && hosts.length > 1) {
    logViewMode.value = 'all'
  } else {
    logViewMode.value = hosts?.[0]?.host_id || 'all'
  }
}, { immediate: true })
// When a host is selected via selectHost, switch log view mode accordingly
watch(selectedHostId, (hid) => {
  if (hid && logViewMode.value !== hid) logViewMode.value = hid
})

const logHostList = computed(() => {
  const hosts = selectedGroup.value?.hosts
  if (!Array.isArray(hosts)) return []
  return hosts.filter((h: any) => h.host_id && h.host_id !== '__NO_HOST__')
})
const isAllHostsMode = computed(() => logViewMode.value === 'all' || logHostList.value.length <= 1)

// Single-host mode: find the corresponding host row based on logViewMode
const logHostRow = computed(() => {
  if (isAllHostsMode.value) return selectedHostRow.value
  const hid = logViewMode.value
  const hosts = logHostList.value
  // Prefer composing a complete row from group.hosts + stepExecutions (reuse selectedHostRow logic)
  if (!selectedNodeId.value) return undefined
  let row = stepsByNodeHost.value.get(`${selectedNodeId.value}@@${hid}`)
  if (row) return row
  const slim = hosts.find((h: any) => String(h.host_id) === String(hid))
  if (slim) {
    return {
      id: slim.id || slim.workflow_node_execution_id,
      host_id: slim.host_id,
      host_detail: slim.host_detail,
      status: slim.status,
      status_display: slim.status_display,
      attempt_no: slim.attempt_no,
      started_at: slim.started_at,
      finished_at: slim.finished_at,
      duration_ms: slim.duration_ms,
      exit_code: slim.exit_code,
      error_message: slim.error_message,
      output: slim.output,
    }
  }
  return selectedHostRow.value
})

// host_detail used for logs (switches based on logViewMode)
const currentHostDetail = computed(() => {
  if (isAllHostsMode.value) {
    // In 'all' mode, first host is title fallback only — a single host is not displayed
    const first = logHostList.value[0]
    if (first?.host_detail) return first.host_detail
    return selectedHostRow.value?.host_detail || null
  }
  const r = logHostRow.value
  if (r?.host_detail) return r.host_detail
  // Fallback: find by host_id in group
  const h = logHostList.value.find((x: any) => String(x.host_id) === String(logViewMode.value))
  return h?.host_detail || selectedHostRow.value?.host_detail || null
})

// --------- Output panel + log panel unified on current host ---------
const displayRow = computed(() => {
  if (isAllHostsMode.value) return selectedHostRow.value || selectedNode.value
  return logHostRow.value || selectedHostRow.value || selectedNode.value
})
const currentHostErrorMsg = computed(() => {
  const r = displayRow.value
  if (!r) return ''
  return r.error_message || r.errorMsg || ''
})
const currentHostOutput = computed(() => displayRow.value?.output || null)

// Error list in all-hosts mode
const allHostsErrorList = computed(() => {
  const result: { hostName: string; message: string }[] = []
  for (const h of logHostList.value) {
    const msg = h.error_message
    if (msg) {
      const hn = h.host_detail?.host_name || shortId(h.host_id)
      result.push({ hostName: hn, message: msg })
    }
  }
  return result
})

// Helper: host display name / status / tooltip
function hostNameOf(h: any): string {
  return h.host_detail?.host_name || h.host_detail?.host_ip || shortId(h.host_id)
}
function hostStatusOf(h: any): string {
  return STATUS_MAP[h.status] || h.status_display || 'pending'
}
function hostTooltipOf(h: any): string {
  const hn = hostNameOf(h)
  const ip = h.host_detail?.host_ip || ''
  const stat = localStatusTextMap[hostStatusOf(h)] || hostStatusOf(h)
  const parts: string[] = [`${hn}`, ip, `${t('message.pages.workflowRecordDetail.wrdTooltipStatus')}${stat}`]
  if (h.exit_code != null) parts.push(`${t('message.pages.workflowRecordDetail.wrdTooltipExit')}${h.exit_code}`)
  if (h.duration_ms != null) parts.push(`${t('message.pages.workflowRecordDetail.wrdTooltipDuration')}${_formatMsSimple(h.duration_ms)}`)
  return parts.join(' | ')
}

const logPanelTitle = computed(() => {
  const parts: string[] = []
  if (selectedNode.value?.label) parts.push(selectedNode.value.label)
  if (isAllHostsMode.value) {
    if (logHostList.value.length > 0) parts.push(`${t('message.pages.workflowRecordDetail.wrdTooltipAll', { n: logHostList.value.length })}`)
  } else {
    if (currentHostDetail.value?.host_name) parts.push(currentHostDetail.value.host_name)
    else if (currentHostDetail.value?.resolved === false) parts.push(t('message.pages.workflowRecordDetail.wrdTooltipUnknownHost'))
  }
  if (!parts.length) return t('message.pages.workflowRecordDetail.wrdLogGlobal')
  return parts.join(' · ') + t('message.pages.workflowRecordDetail.wrdLogSuffix')
})

const currentLogText = computed(() => {
  // All-hosts mode: iterate over all hosts and concatenate logs
  if (isAllHostsMode.value && logHostList.value.length > 1) {
    const allLines: string[] = []
    const nodeLabel = selectedNode.value?.label || '—'
    const firstStart = selectedNode.value?.startTime || '--'
    allLines.push(t('message.pages.workflowRecordDetail.wrdLogNodeHeader', { node: nodeLabel, n: logHostList.value.length }))
    allLines.push('')
    for (const h of logHostList.value) {
      const hn = h.host_detail?.host_name || shortId(h.host_id)
      const ip = h.host_detail?.host_ip || ''
      const stat = hostStatusOf(h)
      const st = h.started_at || h.start_time || '--'
      const fi = h.finished_at || h.end_time || '--'
      allLines.push(`------ [${hn}]${ip ? ' (' + ip + ')' : ''} ${t('message.pages.workflowRecordDetail.wrdLogColStatus')}${localStatusTextMap[stat] || stat} ------`)
      allLines.push(`[${st}] ${t('message.pages.workflowRecordDetail.wrdLogStartExec')}`)
      allLines.push(`[${fi}] ${t('message.pages.workflowRecordDetail.wrdLogExecDone')}`)
      if (h.exit_code != null) allLines.push(`${t('message.pages.workflowRecordDetail.wrdLogExit')}${h.exit_code}`)
      if (h.error_message) allLines.push(`${t('message.pages.workflowRecordDetail.wrdLogError')}${h.error_message}`)
      // First few lines of stdout as summary
      let stdoutText = ''
      if (h.output) {
        try {
          const obj = typeof h.output === 'string' ? JSON.parse(h.output) : h.output
          if (typeof obj?.stdout === 'string') stdoutText = obj.stdout
        } catch {
          if (typeof h.output === 'string') stdoutText = h.output
        }
      }
      if (stdoutText) {
        const lines = stdoutText.split('\n').filter(Boolean).slice(0, 3)
        if (lines.length > 0) {
          allLines.push(t('message.pages.workflowRecordDetail.wrdLogStdoutSummary'))
          for (const l of lines) allLines.push(`  ${l}`)
          if (stdoutText.split('\n').filter(Boolean).length > 3) {
            allLines.push(`  ...${t('wrdStdoutMoreHint', { n: stdoutText.split('\n').filter(Boolean).length })}`)
          }
        }
      }
      allLines.push('')
    }
    return allLines.join('\n') || t('message.pages.workflowRecordDetail.wrdNoLog')
  }

  // Single-host / no-node-selected mode: original logic
  const r = displayRow.value
  if (!r) {
    return sortedNodeList.value.map(n =>
      `[${n.startTime || '--'}] ${t('message.pages.workflowRecordDetail.wrdLogNodeHeader2')}${n.label}${localStatusTextMap[n.status] || n.status}`
    ).join('\n') || t('message.pages.workflowRecordDetail.wrdNoLog')
  }
  const lines: string[] = []
  const nodeLabel = selectedNode.value?.label || '—'
  const st = r.started_at || r.startTime || '--'
  const fi = r.finished_at || r.endTime || '--'
  const stat = STATUS_MAP[r.status] || r.status || 'pending'
  lines.push(`[${st}] ${t('message.pages.workflowRecordDetail.wrdLogNodeStart')}${nodeLabel}${t('message.pages.workflowRecordDetail.wrdLogStartExec')}`)
  if (currentHostDetail.value) {
    const hn = currentHostDetail.value.host_name || shortId(r.host_id)
    const ip = currentHostDetail.value.host_ip
    lines.push(`[${st}] ${t('message.pages.workflowRecordDetail.wrdLogExecHost')}${hn}${ip ? ' (' + ip + ')' : ''}`)
  }
  lines.push(`[${fi}] ${t('message.pages.workflowRecordDetail.wrdLogExecDone')}，${t('message.pages.workflowRecordDetail.wrdLogColStatus')}${localStatusTextMap[stat] || stat}`)
  if (r.exit_code != null && r.exit_code !== 0) {
    lines.push(`${t('message.pages.workflowRecordDetail.wrdLogExit')}${r.exit_code}`)
  }
  if (currentHostErrorMsg.value) {
    lines.push(`${t('message.pages.workflowRecordDetail.wrdLogError')}${currentHostErrorMsg.value}`)
  }
  return lines.join('\n')
})

const formatOutput = (output: any): string => {
  if (!output) return ''
  if (typeof output === 'string') return output
  try { return JSON.stringify(output, null, 2) } catch { return String(output) }
}

/* ========== Execution log Tab: structured parsing & formatting of output data ========== */
const logOutputTab = ref<'stdout' | 'stderr' | 'structured' | 'raw'>('stdout')

// Byte count → human-readable
const sizeFormat = (n: number): string => {
  if (n == null || n <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0, v = n
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return v < 10 ? `${v.toFixed(1)} ${units[i]}` : `${Math.round(v)} ${units[i]}`
}

// Parse currentHostOutput into structured fields
const parsedHostOutput = computed(() => {
  const raw = currentHostOutput.value
  let obj: any = null
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw) } catch { obj = { stdout: raw } }
  } else if (raw && typeof raw === 'object') {
    obj = raw
  } else {
    obj = {}
  }
  const stdout = (typeof obj.stdout === 'string' ? obj.stdout : (obj.stdout != null ? String(obj.stdout) : ''))
  const stderr = (typeof obj.stderr === 'string' ? obj.stderr : (obj.stderr != null ? String(obj.stderr) : ''))
  const exitCode = obj.exit_code ?? obj.exitCode ?? obj.status ?? 0
  const structured = obj.structured ?? obj.result ?? null
  const wfxId = obj._wfx_execution_id || obj._ops_execution_id || obj.wfx_execution_id || obj.ops_execution_id || ''

  // If structured has a lines array, extract and render line by line
  let structuredLines: any[] = []
  let structuredPretty = ''
  if (structured && typeof structured === 'object') {
    if (Array.isArray(structured.lines)) {
      structuredLines = structured.lines
    } else if (Array.isArray(structured)) {
      structuredLines = structured
    }
    try { structuredPretty = JSON.stringify(structured, null, 2) } catch { /* ignore */ }
  } else if (structured != null && structured !== '') {
    structuredPretty = String(structured)
  }

  return {
    stdout, stderr,
    exit_code: typeof exitCode === 'number' ? exitCode : (exitCode ? Number(exitCode) || 0 : 0),
    structured, structuredLines, structuredPretty,
    _wfxExecutionId: wfxId,
  }
})

// Tabs list (with count badge)
const OUTPUT_TABS = computed(() => {
  const p = parsedHostOutput.value
  return [
    { key: 'stdout',     label: 'stdout',     count: p.stdout ? sizeFormat(p.stdout.length) : t('wrdEmptyShort'), tagType: p.stdout ? '' : 'info' },
    { key: 'stderr',     label: 'stderr',     count: p.stderr ? sizeFormat(p.stderr.length) : t('wrdEmptyShort'), tagType: p.stderr ? 'danger' : 'info' },
    { key: 'structured', label: t('message.pages.workflowRecordDetail.wrdTabStructured'),     count: (p.structuredLines?.length || (p.structuredPretty ? 1 : 0)) || t('message.none'), tagType: p.structuredLines?.length ? 'success' : 'info' },
    { key: 'raw',        label: t('message.pages.workflowRecordDetail.wrdTabRawJson'),  count: '', tagType: 'info' },
  ] as { key: 'stdout'|'stderr'|'structured'|'raw'; label: string; count: any; tagType?: string }[]
})

// Single-line structured line formatting
const formatStructuredLine = (line: any): string => {
  if (line == null) return ''
  if (typeof line === 'string') return line
  if (typeof line === 'object') {
    if (typeof line.stdout === 'string') return line.stdout
    if (typeof line.stderr === 'string') return line.stderr
    if (typeof line.content === 'string') return line.content
    if (typeof line.text === 'string') return line.text
    try { return JSON.stringify(line, null, 2) } catch { return String(line) }
  }
  return String(line)
}

const goBack = () => router.back()

const copyText = (text: string, label: string = t('wrdDefaultCopyLabel')) => {
  if (!text) { ElMessage.info(t('message.pages.workflowRecordDetail.wrdNoContentToCopy')); return }
  navigator.clipboard.writeText(String(text))
    .then(() => ElMessage.success(`${label}${t('message.pages.workflowRecordDetail.wrdCopied')}`))
    .catch(() => ElMessage.error(t('message.pages.workflowRecordDetail.wrdCopyFail')))
}
</script>

<style scoped lang="scss">
.record-detail-page {
  width: 100%;
  height: calc(100vh - 85px - 50px);
  padding: 16px;
  box-sizing: border-box;
  min-height: 0;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.detail-header {
  background: #fff;
  border-radius: 8px;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  flex-shrink: 0;
  min-height: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    h2 { margin: 0; font-size: 18px; color: #333; }
  }
  .header-right {
    display: flex;
    gap: 10px;
  }
}

.detail-info {
  background: #fff;
  border-radius: 8px;
  padding: 14px 24px;
  display: flex;
  gap: 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  flex-shrink: 0;
  min-height: 0;

  .info-item {
    font-size: 13px;
    .label { color: #999; }
    .value { color: #333; font-weight: 500; }
    &.error-info {
      .error-text { color: #f56c6c; word-break: break-all; }
    }
  }
}

.detail-main {
  flex: 1;
  display: flex;
  gap: 0;          // Use resizer's own margin for clearance so drag target is easier to hit
  overflow: hidden;
  min-height: 0;
  padding: 0;
}

.topology-panel {
  flex: 1 1 auto;
  min-width: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  margin: 0 8px 0 0;

  .panel-title {
    padding: 14px 20px;
    font-weight: 600;
    font-size: 15px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
  }

  .topology-canvas {
    flex: 1;
    overflow: auto;
    min-height: 0;
    background:
      linear-gradient(180deg, #fafbfc 0%, #f5f7fa 100%);
    background-image:
      linear-gradient(to right, #eef1f5 1px, transparent 1px),
      linear-gradient(to bottom, #eef1f5 1px, transparent 1px);
    background-size: 20px 20px;
  }
}

/* ========= Manual resizable splitter ========= */
.resizer {
  flex: 0 0 10px;
  position: relative;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, flex-basis 0.15s;
  z-index: 50;
  margin: 2px -2px;
  border-radius: 4px;

  &:hover,
  &.dragging {
    background: rgba(64, 158, 255, 0.12);
    flex-basis: 12px;
  }
  &:hover::before,
  &.dragging::before {
    background: #409EFF;
  }

  &::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 10%;
    bottom: 10%;
    width: 2px;
    transform: translateX(-50%);
    background: #e4e7ed;
    border-radius: 1px;
  }

  .resizer-dots {
    position: relative;
    z-index: 2;
    display: inline-flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px 3px;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 3px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);

    i {
      width: 3px;
      height: 3px;
      background: #909399;
      border-radius: 50%;
      display: block;
    }
  }

  &.dragging .resizer-dots {
    border-color: #409EFF;
    i { background: #409EFF; }
  }
}

.node-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  min-height: 0;
  margin: 0 0 0 8px;

  :deep(.el-tabs) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 16px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
  }
  :deep(.el-tabs__nav-wrap)::after {
    display: none;
  }
  :deep(.el-tabs__content) {
    flex: 1;
    overflow: hidden;
    min-height: 0;
  }
  :deep(.el-tab-pane) {
    height: 100%;
    min-height: 0;
    overflow-y: auto;
  }
  :deep(.el-tabs__item) {
    height: 44px;
    line-height: 44px;
    font-size: 14px;
    font-weight: 500;
  }
  :deep(.el-tabs__item.is-active) {
    color: #409EFF;
  }

  .tab-label {
    font-size: 14px;
  }
}

/* ========== Node search/filter toolbar ========== */
.node-filter-bar {
  padding: 10px 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  .nf-search { width: 100%; }
  .nf-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .nf-chip {
    cursor: pointer;
    user-select: none;
    .chip-count {
      margin-left: 3px;
      font-size: 10px;
      opacity: 0.85;
      font-family: Consolas, Monaco, monospace;
    }
  }
}
.empty-filter-hint {
  padding: 18px;
  text-align: center;
  color: #909399;
  font-size: 12px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px dashed #e4e7ed;
}

.node-list {
  padding: 10px 12px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  border: 1px solid #ebeef5;
  border-left: 3px solid #dcdfe6;
  transition: all 0.2s;
  background: #fafbfc;

  &:hover {
    background: #f5f7fa;
    border-color: #c0c4cc;
  }

  &.active {
    background: #ecf5ff;
    border-color: #409EFF;
    border-left-color: #409EFF;
    box-shadow: 0 2px 8px rgba(64,158,255,0.12);
  }

  &.success {
    border-left-color: #67C23A;
    &:not(.active) .node-status-tag :deep(.el-tag) { border-color: #67C23A; }
  }
  &.fail {
    border-left-color: #F56C6C;
  }
  &.running {
    border-left-color: #409EFF;
  }
  &.pending {
    border-left-color: #C0C4CC;
  }
  &.skipped {
    border-left-color: #E6A23C;
  }

  .node-info {
    flex: 1;
    min-width: 0;
    .node-name-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      .node-icon-sm {
        flex-shrink: 0;
        font-size: 14px;
        width: 20px;
        height: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        background: #f0f2f5;
        color: #606266;
      }
      .node-name {
        flex: 1;
        font-size: 13px;
        font-weight: 600;
        color: #303133;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .node-counts {
        display: flex;
        gap: 3px;
        flex-shrink: 0;
        .mini-badge {
          font-size: 10px;
          padding: 0 4px;
          line-height: 15px;
          border-radius: 3px;
          font-weight: 600;
          font-family: Consolas, Monaco, monospace;
          &.success { background: #f0f9eb; color: #67C23A; }
          &.failed  { background: #fef0f0; color: #f56c6c; }
          &.running { background: #ecf5ff; color: #409EFF; }
          &.pending { background: #f5f7fa; color: #909399; }
          &.skipped { background: #f4f4f5; color: #606266; }
        }
      }
    }
    .node-meta {
      font-size: 12px;
      color: #909399;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-left: 26px;
    }
  }

  .node-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    .node-status-tag { flex-shrink: 0; }
    .node-detail-btn {
      height: 24px;
      padding: 0 8px;
      font-size: 12px;
    }
  }
}

/* ========== Host details: aggregate stats card ========== */
.host-stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(78px, 1fr));
  gap: 6px;
  padding: 10px 12px 6px;
  background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
  border-bottom: 1px solid #f0f0f0;
}
.host-stat-card {
  padding: 6px 8px 5px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #ebeef5;
  background: #fff;
  .hsc-num {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.1;
    font-family: Consolas, Monaco, monospace;
  }
  .hsc-label {
    font-size: 11px;
    color: #909399;
    margin-top: 2px;
  }
  &.hsc-total   { .hsc-num { color: #606266; } }
  &.hsc-success { border-color: #e1f3d8; background: #f0f9eb; .hsc-num { color: #67C23A; } }
  &.hsc-fail    { border-color: #fde2e2; background: #fef0f0; .hsc-num { color: #F56C6C; } }
  &.hsc-running { border-color: #d9ecff; background: #ecf5ff;
    .hsc-num { color: #409EFF; animation: num-pulse 1s ease-in-out infinite; }
  }
  &.hsc-pending { border-color: #ebeef5; background: #f5f7fa; .hsc-num { color: #909399; } }
  &.hsc-skipped { border-color: #faecd8; background: #fdf6ec; .hsc-num { color: #E6A23C; } }
}
@keyframes num-pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.08); }
}

/* Stats cards: clickable + selected state */
.host-stat-card {
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, outline-color 0.18s ease;
  user-select: none;
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(64, 158, 255, 0.12);
  }
  &.active {
    outline: 2px solid #409EFF;
    outline-offset: -2px;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  }
}

/* ========== Host details: filter toolbar ========== */
.host-filter-bar {
  padding: 6px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  .hfb-search { width: 100%; }
  .hfb-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .hfb-chip {
    cursor: pointer;
    user-select: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    .hfb-dot {
      width: 6px; height: 6px; border-radius: 50%;
      display: inline-block;
    }
    .chip-count {
      margin-left: 2px;
      font-size: 10px;
      opacity: 0.85;
      font-family: Consolas, Monaco, monospace;
    }
    &.fail-quick { font-weight: 600; }
  }

  /* Filter bar right side: failed-host jump (3 failed out of N → one-click locate)*/
  .hfb-nav {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    padding: 4px 8px;
    background: linear-gradient(180deg, #fff5f5 0%, #fff 100%);
    border: 1px dashed #fbc4c4;
    border-radius: 6px;
    .hfb-nav-label {
      font-size: 12px;
      color: #c0392b;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-right: 2px;
    }
    .el-button {
      padding: 2px 8px;
      font-weight: 500;
    }
  }
}

/* ========== Host details: execution table (inside Drawer) ========== */
.host-table-wrap {
  padding: 8px 12px 0;
  background: #fff;
}
.host-exec-table {
  border-radius: 6px;
  overflow: hidden;

  :deep(.el-table__body tr.current-row > td) {
    background-color: #ecf5ff !important;
  }
  &.drawer-table :deep(.el-table__row) { cursor: pointer; }
}
.he-error {
  padding: 8px 12px;
  background: #fef0f0;
  border-bottom: 1px solid #fde2e2;
  display: flex;
  gap: 8px;
  .he-err-label {
    font-size: 12px; font-weight: 600; color: #f56c6c; flex-shrink: 0;
  }
  .he-err-content {
    margin: 0;
    font-size: 12px;
    color: #f56c6c;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: Consolas, Monaco, monospace;
    max-height: 120px;
    overflow: auto;
  }
}

/* In-table element styles */
.he-status-dot {
  width: 10px; height: 10px; border-radius: 50%;
  display: inline-block;
  &.success   { background: #67C23A; box-shadow: 0 0 0 2px rgba(103,194,58,.15); }
  &.fail      { background: #F56C6C; box-shadow: 0 0 0 2px rgba(245,108,108,.15); }
  &.running   { background: #409EFF; animation: host-dot-blink 1s infinite; box-shadow: 0 0 0 2px rgba(64,158,255,.15); }
  &.pending   { background: #C0C4CC; }
  &.skipped   { background: #909399; }
  &.cancelled { background: #E6A23C; }
}
.he-host-name {
  font-size: 12px;
  font-weight: 500;
  color: #303133;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  .he-warn { color: #f56c6c; flex-shrink: 0; }
}
.he-ip { color: #606266; }
.he-id { color: #a8abb2; font-size: 11px; }
.he-start { color: #909399; font-size: 11px; }
.he-duration { color: #303133; }
.mono-text { font-family: Consolas, Monaco, monospace; }
.muted { color: #909399; }
.he-exitcode {
  font-family: Consolas, Monaco, monospace;
  font-weight: 600;
  font-size: 12px;
  &.ok  { color: #67C23A; }
  &.bad { color: #F56C6C; background: #fef0f0; padding: 1px 6px; border-radius: 3px; }
  &.na  { color: #c0c4cc; }
}

@keyframes host-dot-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.3; }
}

/* ========== Drawer: node execution details ========== */
:deep(.node-exec-drawer) {
  .el-drawer__body {
    padding: 0;
    display: flex;
    flex-direction: column;
    background: #f7f8fa;
  }
}
.drawer-header {
  padding: 14px 20px 12px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  box-shadow: 0 1px 4px rgba(0,0,0,0.02);
  flex-shrink: 0;

  .dr-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    flex-wrap: wrap;
    .dr-icon {
      font-size: 18px;
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      background: #ecf5ff;
      color: #409EFF;
    }
    .dr-name {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
    .dr-status {
      margin-left: 4px;
    }
    .retry-tip {
      font-size: 11px;
      padding: 1px 8px;
      background: #fef0f0;
      color: #f56c6c;
      border-radius: 3px;
      font-weight: 500;
    }
  }
  .dr-meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding-left: 42px;
    .dr-meta {
      font-size: 12px;
      color: #909399;
      font-family: Consolas, Monaco, monospace;
    }
  }
}
.drawer-output-wrap {
  margin: 10px 12px 12px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;

  .drawer-error {
    border-bottom: 1px solid #fde2e2;
    border-radius: 8px 8px 0 0;
    flex-shrink: 0;
  }

  /* Output block fills available space */
  :deep(.host-output-block) {
    flex: 1;
    min-height: 0;
  }
}

/* Placeholder when output area not expanded */
.drawer-output-placeholder {
  margin: 10px 12px 12px;
  min-height: 220px;
  background: #fff;
  border: 2px dashed #dcdfe6;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: #909399;
  user-select: none;
  &:hover {
    border-color: #409EFF;
    background: #f8fbff;
    color: #409EFF;
    transform: translateY(-1px);
  }
  .dop-title {
    font-size: 14px;
    font-weight: 500;
    color: inherit;
  }
  .dop-sub {
    font-size: 12px;
    opacity: 0.8;
  }
}

/* Drawer stat/filter/table have no vertical margin (drawer itself has borders) */
.node-exec-drawer :deep(.host-stat-row)   { padding-top: 14px; }
.node-exec-drawer :deep(.host-table-wrap)  { padding-bottom: 6px; }

/* Table pagination bar */
.host-pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 10px 2px 8px;
  background: #fff;
  :deep(.el-pagination) {
    --el-pagination-bg-color: transparent;
    font-weight: 500;
  }
  :deep(.el-pagination__total) {
    color: #909399;
    font-size: 12px;
  }
}

.log-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  .log-header {
    padding: 10px 12px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 500;
    flex-shrink: 0;
    .log-header-actions { display: flex; gap: 10px; align-items: center; }
  }

  /* ===== Multi-host switcher ===== */
  .host-switcher {
    display: flex;
    gap: 4px;
    padding: 8px 10px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafbfc;
    flex-wrap: wrap;
    flex-shrink: 0;
    overflow-x: auto;
    max-height: 120px;
  }
  .hs-tab {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 14px;
    font-size: 12px;
    cursor: pointer;
    user-select: none;
    border: 1px solid #e4e7ed;
    background: #fff;
    color: #606266;
    transition: all 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
    &:hover { border-color: #c0c4cc; color: #303133; }
    &.active {
      border-color: #409EFF;
      background: #ecf5ff;
      color: #409EFF;
      font-weight: 500;
    }
    &.success.active { border-color: #67C23A; background: #f0f9eb; color: #67C23A; }
    &.fail.active    { border-color: #F56C6C; background: #fef0f0; color: #F56C6C; }
    &.running.active { border-color: #409EFF; background: #ecf5ff; color: #409EFF; }
    &.pending.active { border-color: #909399; background: #f4f4f5; color: #606266; }
    &.skipped.active { border-color: #E6A23C; background: #fdf6ec; color: #E6A23C; }
  }
  .hs-label { font-weight: 500; }
  .hs-dot {
    width: 8px; height: 8px; border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
    background: #C0C4CC;
    &.success   { background: #67C23A; }
    &.fail      { background: #F56C6C; }
    &.running   { background: #409EFF; animation: host-dot-blink 1s infinite; }
    &.pending   { background: #C0C4CC; }
    &.skipped   { background: #909399; }
    &.cancelled { background: #E6A23C; }
  }
  .hs-name { max-width: 90px; overflow: hidden; text-overflow: ellipsis; }

  /* Summary errors: multi-error list */
  .multi-error {
    .multi-error-item {
      padding: 6px 0;
      border-bottom: 1px dashed #fbc4c4;
      &:last-child { border-bottom: none; }
    }
    .me-host {
      font-size: 12px;
      font-weight: 600;
      color: #c0392b;
      margin-bottom: 2px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .me-dot {
      width: 8px; height: 8px; border-radius: 50%;
      display: inline-block;
      &.fail { background: #F56C6C; }
    }
    .me-content {
      margin: 0;
      padding: 4px 8px;
      background: rgba(255, 235, 235, 0.6);
      border-radius: 4px;
      font-size: 12px;
      color: #c0392b;
      white-space: pre-wrap;
      word-break: break-all;
      font-family: Consolas, Monaco, monospace;
      max-height: 100px;
      overflow-y: auto;
    }
  }

  .error-block {
    margin: 0 10px 8px;
    .error-title { font-size: 12px; font-weight: 600; color: #f56c6c; margin-bottom: 4px; }
    .error-content {
      background: #fef0f0; border: 1px solid #fde2e2; border-radius: 4px;
      padding: 8px; font-size: 12px; color: #f56c6c; margin: 0;
      white-space: pre-wrap; word-break: break-all; font-family: Consolas, Monaco, monospace;
      max-height: 160px; overflow-y: auto;
    }
  }

  /* === Output data: meta info card + Tabs (replaces old giant green <pre>) === */
  .output-block {
    margin: 0 10px 10px;
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;

    /* Top meta info card: exit code / stdout size / stderr size / execution ID */
    .output-meta {
      display: flex;
      gap: 8px;
      padding: 10px 12px;
      background: #fafbfc;
      border-bottom: 1px solid #ebeef5;
      flex-wrap: wrap;
      .om-card {
        flex: 1;
        min-width: 92px;
        background: #fff;
        border: 1px solid #ebeef5;
        border-radius: 6px;
        padding: 6px 10px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        .om-k { font-size: 11px; color: #909399; line-height: 1.2; }
        .om-v {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          font-family: Consolas, Monaco, monospace;
          line-height: 1.4;
          word-break: break-all;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          &.ok   { color: #67c23a; }
          &.bad  { color: #f56c6c; }
          &.om-id {
            font-size: 12px;
            color: #606266;
            font-weight: 500;
            .om-id-text {
              flex: 1;
              min-width: 0;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .om-id-copy {
              flex-shrink: 0;
              font-size: 11px;
              padding: 0;
            }
          }
        }
        &.om-exit {
          min-width: 74px; max-width: 110px;
          .om-v { font-size: 20px; line-height: 1.1; justify-content: flex-start; }
        }
        &.om-id-card {
          flex: 2;
          min-width: 180px;
        }
      }
    }

    /* Tabs header */
    .output-tabs {
      .ot-head {
        display: flex;
        gap: 0;
        padding: 0 10px;
        background: #fff;
        border-bottom: 1px solid #ebeef5;
        .ot-tab {
          position: relative;
          padding: 8px 12px;
          font-size: 12px;
          color: #606266;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          transition: all 0.15s;
          &:hover { color: #409EFF; }
          &.active {
            color: #409EFF;
            font-weight: 600;
            &::after {
              content: '';
              position: absolute;
              left: 12px; right: 12px; bottom: -1px;
              height: 2px;
              background: #409EFF;
              border-radius: 2px;
            }
          }
          .ot-count { font-weight: 500; transform: scale(0.92); }
        }
      }
      /* Tabs content */
      .ot-body {
        padding: 0;
        .ot-pre {
          margin: 0;
          padding: 12px;
          font-size: 12px;
          line-height: 1.55;
          font-family: Consolas, Monaco, 'SF Mono', Menlo, monospace;
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 300px;
          overflow-x: hidden;
          overflow-y: auto;
          &.stdout { background: #ffffff; color: #2c3e50; border-bottom: 1px dashed #ebeef5; }
          &.stderr { background: #fef0f0; color: #c0392b; }
          &.json   { background: #f4f4f5; color: #303133; }
        }
        /* Structured lines shown per-row (with line numbers)*/
        .structured-lines {
          max-height: 300px;
          overflow-y: auto;
          background: #1e1e1e;
          font-size: 12px;
          .sl-line {
            display: flex;
            align-items: stretch;
            padding: 0;
            &:hover { background: #2a2d2e; }
            .sl-idx {
              flex-shrink: 0;
              width: 38px;
              text-align: right;
              padding: 2px 8px;
              color: #858585;
              font-family: Consolas, Monaco, monospace;
              background: #252526;
              user-select: none;
              border-right: 1px solid #333;
            }
            .sl-pre {
              flex: 1;
              margin: 0;
              padding: 2px 10px;
              color: #d4d4d4;
              white-space: pre-wrap;
              word-break: break-all;
              font-family: Consolas, Monaco, monospace;
              line-height: 1.55;
            }
          }
        }
        .empty-structured {
          padding: 22px 12px;
          text-align: center;
          color: #909399;
          font-size: 12px;
          background: #fafafa;
        }
      }
    }
  }

  .log-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    background: #1e1e1e;
    color: #d4d4d4;
    font-size: 12px;
    line-height: 1.6;
    min-height: 0;
    margin: 0 10px 10px;
    border-radius: 8px 8px 0 0;

    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;
      font-family: Consolas, Monaco, monospace;
    }
  }
}

.node-actions {
  padding: 12px 16px;
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  border-top: 1px solid #f0f0f0;
  background: #fafbfc;

  .el-button {
    flex: 1;
  }
}

.full-log-container {
  max-height: 500px;
  overflow-y: auto;
  background: #1e1e1e;
  border-radius: 6px;
  padding: 16px;
  pre {
    margin: 0;
    color: #d4d4d4;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: Consolas, Monaco, monospace;
  }
}
</style>