<template>
	<EditionLockedPage feature="OPS_EXECUTION_APPROVAL" :label="t('message.pages.edition.lockedPageLabels.executionApproval')">
	<fs-page>
		<div class="approval-container">
			<div class="page-header">
				<div class="header-left">
					<div class="title">
						<h2>{{ t('message.pages.executionApproval.pageTitle') }}</h2>
						<span class="desc">{{ t('message.pages.executionApproval.pageDesc') }}</span>
					</div>
					<div class="quick-stats">
						<div class="quick-stat-item">
							<el-icon :size="14" color="#e6a23c"><Clock /></el-icon>
							<span class="quick-stat-value">{{ statCounts.pending }}</span>
							<span class="quick-stat-label">{{ t('message.pages.executionApproval.statPending') }}</span>
						</div>
						<div class="quick-stat-item">
							<el-icon :size="14" color="#67c23a"><CircleCheckFilled /></el-icon>
							<span class="quick-stat-value">{{ statCounts.approved }}</span>
							<span class="quick-stat-label">{{ t('message.pages.executionApproval.statApproved') }}</span>
						</div>
						<div class="quick-stat-item">
							<el-icon :size="14" color="#f56c6c"><CircleCloseFilled /></el-icon>
							<span class="quick-stat-value">{{ statCounts.rejected }}</span>
							<span class="quick-stat-label">{{ t('message.pages.executionApproval.statRejected') }}</span>
						</div>
						<div class="quick-stat-item">
							<el-icon :size="14" color="#909399"><Document /></el-icon>
							<span class="quick-stat-value">{{ totalAll }}</span>
							<span class="quick-stat-label">{{ t('message.pages.executionApproval.statTotal') }}</span>
						</div>
					</div>
				</div>
				<div class="header-actions">
					<el-button @click="loadList" circle>
						<el-icon><Refresh /></el-icon>
					</el-button>
				</div>
			</div>

			<div class="stats-row">
				<div
					v-for="card in statCards"
					:key="card.key"
					class="stat-card"
					:class="{ 'is-active': filterStatus === card.key }"
					@click="onStatCardClick(card.key)"
				>
					<div class="stat-icon" :style="{ background: card.gradient }">
						<el-icon :size="22"><component :is="card.icon" /></el-icon>
					</div>
					<div class="stat-info">
						<div class="stat-value">{{ card.count }}</div>
						<div class="stat-label">{{ card.label }}</div>
					</div>
					<div v-if="filterStatus === card.key" class="stat-indicator"></div>
				</div>
			</div>

			<div class="approval-toolbar">
				<div class="toolbar-left">
					<el-input
						v-model="searchKey"
						:placeholder="t('message.pages.executionApproval.searchPlaceholder')"
						clearable
						class="search-input"
						@keyup.enter="handleSearch"
						@clear="handleSearch"
					>
						<template #prefix>
							<el-icon><Search /></el-icon>
						</template>
					</el-input>
					<el-select v-model="filterStatus" :placeholder="t('message.pages.executionApproval.filterStatus')" clearable class="status-filter" @change="handleSearch">
						<el-option :label="t('message.pages.executionApproval.optionAllStatus')" value="" />
						<el-option :label="t('message.pages.executionApproval.optionPending')" value="pending" />
						<el-option :label="t('message.pages.executionApproval.optionApproved')" value="approved" />
						<el-option :label="t('message.pages.executionApproval.optionRejected')" value="rejected" />
						<el-option :label="t('message.pages.executionApproval.optionCancelled')" value="cancelled" />
					</el-select>
					<el-select v-model="filterMode" :placeholder="t('message.pages.executionApproval.filterMode')" clearable class="status-filter" @change="handleSearch">
						<el-option :label="t('message.pages.executionApproval.optionOrAny')" value="any" />
						<el-option :label="t('message.pages.executionApproval.optionAllAll')" value="all" />
					</el-select>
					<el-radio-group v-model="viewType" @change="handleSearch" size="default">
						<el-radio-button value="all">{{ t('message.pages.executionApproval.radioAll') }}</el-radio-button>
						<el-radio-button value="pending">{{ t('message.pages.executionApproval.radioPendingMine') }}</el-radio-button>
						<el-radio-button value="mine">{{ t('message.pages.executionApproval.radioMine') }}</el-radio-button>
					</el-radio-group>
				</div>
				<div class="toolbar-right">
					<el-button size="small" :disabled="!canReset" @click="resetFilters">
						<el-icon><RefreshLeft /></el-icon>
						{{ t('message.pages.executionApproval.btnReset') }}
					</el-button>
				</div>
			</div>

			<div class="table-card">
				<el-table
					v-loading="loading"
					:data="tableData"
					stripe
					class="approval-table"
					style="width: 100%"
					:row-class-name="tableRowClassName"
					@row-click="handleRowClick"
				>
					<el-table-column :label="t('message.pages.executionApproval.colBatchHost')" min-width="260">
						<template #default="{ row }">
							<div class="batch-cell">
								<span class="batch-id">{{ row.batch_id }}</span>
								<div class="host-info">
									<span class="host-name">{{ row.host_name || '-' }}</span>
									<span class="host-ip">{{ row.host_ip }}</span>
								</div>
							</div>
						</template>
					</el-table-column>
					<el-table-column :label="t('message.pages.executionApproval.colApprovalMode')" width="100" align="center">
						<template #default="{ row }">
							<el-tag size="small" :type="row.approval_mode === 'all' ? 'warning' : 'primary'" effect="dark" round>
								{{ row.approval_mode === 'all' ? t('message.pages.executionApproval.modeAll') : (row.candidate_approvers?.length ? t('message.pages.executionApproval.modeOr') : t('message.pages.executionApproval.modeSingle')) }}
							</el-tag>
						</template>
					</el-table-column>
					<el-table-column :label="t('message.pages.executionApproval.colCandidates')" min-width="200">
						<template #default="{ row }">
							<div class="approvers-tags">
								<template v-for="a in (row.candidate_approvers || [])" :key="a.user_id">
									<el-tag
										:type="getCandidateTagType(row, a)"
										size="small"
										round
										effect="plain"
										style="margin-right: 4px; margin-bottom: 4px"
									>
										<el-icon v-if="isUserApproved(row, a)" style="margin-right:2px"><CircleCheckFilled /></el-icon>
										<el-icon v-else-if="isUserRejected(row, a)" style="margin-right:2px;color:#f56c6c"><CircleCloseFilled /></el-icon>
										{{ a.name || a.username }}
									</el-tag>
								</template>
								<span v-if="!row.candidate_approvers?.length" style="font-size: 12px; color: #909399">
									{{ row.approver_name || row.approver_username || t('message.pages.executionApproval.defaultApprover') }}
								</span>
							</div>
						</template>
					</el-table-column>
					<el-table-column :label="t('message.pages.executionApproval.colType')" width="80" align="center">
						<template #default="{ row }">
							<el-tag size="small" :type="scriptTypeTag(row.script_type)" effect="light" round>{{ scriptTypeText(row.script_type) }}</el-tag>
						</template>
					</el-table-column>
					<el-table-column :label="t('message.pages.executionApproval.colSource')" width="180" align="center">
						<template #default="{ row }">
							<div style="display:flex;flex-direction:column;align-items:center">
								<el-tag size="small" :type="sourceTypeTag(row)" effect="plain" round>
									<el-icon style="margin-right:2px"><component :is="sourceTypeIcon(row)" /></el-icon>
									{{ sourceTypeText(row) }}
								</el-tag>
								<span v-if="row.related_name" style="font-size:12px;color:#909399;margin-top:2px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" :title="row.related_name">{{ row.related_name }}</span>
							</div>
						</template>
					</el-table-column>
					<el-table-column :label="t('message.pages.executionApproval.colSubmitter')" width="110" align="center">
						<template #default="{ row }">
							<div class="user-cell">
								<el-avatar :size="24" :style="{ background: avatarColor(row.submitter_name || row.submitter_username) }" class="user-avatar">
									{{ (row.submitter_name || row.submitter_username || '?').charAt(0).toUpperCase() }}
								</el-avatar>
								<span>{{ row.submitter_name || row.submitter_username || '-' }}</span>
							</div>
						</template>
					</el-table-column>
					<el-table-column :label="t('message.pages.executionApproval.colStatus')" width="120" align="center">
						<template #default="{ row }">
							<div class="status-cell">
								<el-tag size="small" :type="statusTagType(row.status)" effect="dark" round>{{ statusLabel(row.status) }}</el-tag>
								<div v-if="row.status === 'pending' && (row.candidate_approvers || []).length" class="progress-sub">
									{{ approveProgressText(row) }}
								</div>
							</div>
						</template>
					</el-table-column>
					<el-table-column :label="t('message.pages.executionApproval.colTime')" width="170" align="center">
						<template #default="{ row }">
							<div class="time-cell">
								<div class="time-sub"><span class="time-label">{{ t('message.pages.executionApproval.timeSubmit') }}</span>{{ formatTime(row.create_datetime) }}</div>
								<div class="time-sub" v-if="row.approve_time"><span class="time-label">{{ t('message.pages.executionApproval.timeApprove') }}</span>{{ formatTime(row.approve_time) }}</div>
							</div>
						</template>
					</el-table-column>
					<el-table-column :label="t('message.pages.executionApproval.colAction')" width="340" align="center" fixed="right">
						<template #default="{ row }">
							<el-button size="small" type="primary" link @click.stop="openDetail(row)">
								{{ t('message.pages.executionApproval.btnDetail') }}
							</el-button>
							<el-button
								v-if="canApprove(row)"
								size="small"
								type="success"
								link
								@click.stop="openApproveDialog(row)"
							>{{ t('message.pages.executionApproval.btnApprove') }}</el-button>
							<el-button
								v-if="canApprove(row)"
								size="small"
								type="danger"
								link
								@click.stop="openRejectDialog(row)"
							>{{ t('message.pages.executionApproval.btnReject') }}</el-button>
							<el-button
								v-if="canApprove(row)"
								size="small"
								type="warning"
								link
								@click.stop="openDelegateDialog(row)"
							>{{ t('message.pages.executionApproval.btnDelegate') }}</el-button>
							<el-button
								v-if="canApprove(row)"
								size="small"
								type="info"
								link
								@click.stop="openAddSignDialog(row)"
							>{{ t('message.pages.executionApproval.btnAddSign') }}</el-button>
							<el-button
								v-if="row.status === 'pending' && canCancel(row)"
								size="small"
								type="warning"
								link
								@click.stop="handleCancel(row)"
							>{{ t('message.pages.executionApproval.btnCancel') }}</el-button>
							<el-button
								v-if="row.ops_execution"
								size="small"
								type="info"
								link
								@click.stop="goToExecution(row)"
							>{{ t('message.pages.executionApproval.btnExecResult') }}</el-button>
						</template>
					</el-table-column>

					<template #empty>
						<el-empty v-if="!loading" :image-size="160" :description="t('message.pages.executionApproval.emptyTitle')">
							<div class="empty-hint">
								<el-icon :size="32" color="#c0c4cc"><Document /></el-icon>
								<p>{{ t('message.pages.executionApproval.emptyHint') }}</p>
								<el-button type="primary" size="small" @click="resetFilters">{{ t('message.pages.executionApproval.btnResetFilter') }}</el-button>
							</div>
						</el-empty>
					</template>
				</el-table>
			</div>

			<div class="pagination-bar">
				<el-pagination
					v-model:current-page="page.current"
					v-model:page-size="page.size"
					:total="page.total"
					:page-sizes="[10, 20, 50, 100]"
					layout="total, sizes, prev, pager, next, jumper"
					background
					small
					@current-change="loadList"
					@size-change="loadList"
				/>
			</div>

			<!-- Details -->
			<el-dialog v-model="detailVisible" :title="t('message.pages.executionApproval.detailTitle')" width="900px" top="3vh" destroy-on-close class="detail-dialog">
				<div v-if="currentRow" class="detail-content">
					<div class="detail-header">
						<div class="detail-title-area">
							<el-tag size="small" :type="statusTagType(currentRow.status)" effect="dark" round>{{ statusLabel(currentRow.status) }}</el-tag>
							<el-tag
								size="small"
								:type="sourceTypeTag(currentRow)"
								effect="dark"
								round
							>
								<el-icon style="margin-right:2px"><component :is="sourceTypeIcon(currentRow)" /></el-icon>
								{{ sourceTypeText(currentRow) }}
							</el-tag>
							<el-tag
								v-if="(currentRow.candidate_approvers||[]).length"
								size="small"
								:type="currentRow.approval_mode === 'all' ? 'warning' : 'primary'"
								effect="plain"
								round
							>{{ currentRow.approval_mode === 'all' ? t('message.pages.executionApproval.modeAll') : t('message.pages.executionApproval.modeOr') }}</el-tag>
							<span class="detail-batch-id">{{ currentRow.batch_id }}</span>
						</div>
						<!-- Script/command execution: show host info -->
						<div class="detail-host-area" v-if="currentRow.source_type !== 'workflow'">
							<el-icon class="detail-host-icon"><Monitor /></el-icon>
							<template v-if="(currentRow.batch_hosts || []).length > 1">
								<el-popover placement="bottom-start" :width="280" trigger="hover">
									<template #reference>
										<span class="detail-host-multi">{{ currentRow.target_hosts_count }}{{ t('message.pages.executionApproval.hostCount') }}</span>
										<span class="detail-host-ip">{{ t('message.pages.executionApproval.clickToView') }}</span>
									</template>
									<div class="batch-host-list">
										<div v-for="(h, i) in currentRow.batch_hosts" :key="i" class="batch-host-item">
											<span class="batch-host-name">{{ h.host_name }}</span>
											<span class="batch-host-ip">{{ h.host_ip }}</span>
										</div>
									</div>
								</el-popover>
							</template>
							<template v-else>
								<span class="detail-host-name">{{ currentRow.host_name }}</span>
								<span class="detail-host-ip">{{ currentRow.host_ip }}</span>
							</template>
						</div>
						<!-- Workflow approval: show workflow node info -->
						<div class="detail-host-area detail-workflow-area" v-else>
							<el-icon class="detail-host-icon"><SetUp /></el-icon>
							<span class="detail-host-name">{{ currentRow.related_name || '-' }}</span>
							<span class="detail-host-ip">{{ t('message.pages.executionApproval.labelNode') }}: {{ extractNodeKey(currentRow.submit_desc) }}</span>
						</div>
					</div>

					<div class="detail-section">
						<div class="section-title"><el-icon><User /></el-icon>{{ t('message.pages.executionApproval.secApprovalInfo') }}</div>
						<el-descriptions :column="3" border size="small">
							<el-descriptions-item :label="t('message.pages.executionApproval.colSubmitter')">
								<div class="user-cell">
									<el-avatar :size="22" :style="{ background: avatarColor(currentRow.submitter_name || currentRow.submitter_username) }">
										{{ (currentRow.submitter_name || currentRow.submitter_username || '?').charAt(0).toUpperCase() }}
									</el-avatar>
									<span>{{ currentRow.submitter_name || currentRow.submitter_username || '-' }}</span>
								</div>
							</el-descriptions-item>
							<el-descriptions-item :label="t('message.pages.executionApproval.labelSubmitTime')">{{ formatTime(currentRow.create_datetime) }}</el-descriptions-item>
							<el-descriptions-item :label="t('message.pages.executionApproval.labelReviewSource')">
								<el-tag size="small" :type="sourceTypeTag(currentRow)" effect="plain" round>
									<el-icon style="margin-right:2px"><component :is="sourceTypeIcon(currentRow)" /></el-icon>
									{{ sourceTypeText(currentRow) }}
								</el-tag>
								<span v-if="currentRow.related_name" style="margin-left:8px;color:#303133;font-weight:600">{{ currentRow.related_name }}</span>
							</el-descriptions-item>
						</el-descriptions>
					</div>

					<div class="detail-section">
						<div class="section-title"><el-icon><Setting /></el-icon>{{ t('message.pages.executionApproval.secExecConfig') }}</div>
						<el-descriptions :column="3" border size="small">
							<el-descriptions-item v-if="currentRow.source_type === 'script'" :label="t('message.pages.executionApproval.labelScriptType')">{{ scriptTypeText(currentRow.script_type) }}</el-descriptions-item>
							<el-descriptions-item v-if="currentRow.source_type === 'command'" :label="t('message.pages.executionApproval.labelCommandType')">{{ currentRow.use_shell ? t('message.pages.executionApproval.shellCommand') : t('message.pages.executionApproval.directExec') }}</el-descriptions-item>
							<el-descriptions-item v-if="currentRow.source_type !== 'workflow'" :label="t('message.pages.executionApproval.labelExecMode')">{{ execModeText(currentRow.exec_mode) }}</el-descriptions-item>
							<el-descriptions-item v-if="currentRow.source_type !== 'workflow'" :label="t('message.pages.executionApproval.labelConcurrency')">{{ currentRow.concurrency || 10 }}</el-descriptions-item>
							<el-descriptions-item v-if="currentRow.source_type !== 'workflow'" :label="t('message.pages.executionApproval.labelTargetHosts')">
								<template v-if="(currentRow.batch_hosts || []).length > 1">
									<el-popover placement="top" :width="260" trigger="hover">
										<template #reference>
											<span style="color:#409eff;cursor:pointer">{{ currentRow.target_hosts_count }}{{ t('message.pages.executionApproval.hostUnit') }}</span>
										</template>
										<div class="batch-host-list">
											<div v-for="(h, i) in currentRow.batch_hosts.slice(0, 10)" :key="i" class="batch-host-item">
												<span class="batch-host-name">{{ h.host_name }}</span>
												<span class="batch-host-ip">{{ h.host_ip }}</span>
											</div>
											<div v-if="currentRow.batch_hosts.length > 10" style="text-align:center;color:#909399;font-size:12px;margin-top:4px">
												{{ t('message.pages.executionApproval.labelAndMore') }} {{ currentRow.batch_hosts.length - 10 }}{{ t('message.pages.executionApproval.hostUnit') }}
											</div>
										</div>
									</el-popover>
								</template>
								<template v-else>{{ currentRow.target_hosts_count || 1 }}{{ t('message.pages.executionApproval.hostUnit') }}</template>
							</el-descriptions-item>
							<el-descriptions-item :label="t('message.pages.executionApproval.labelTimeout')">{{ currentRow.timeout_seconds || 300 }}{{ t('message.pages.executionApproval.secUnit') }}</el-descriptions-item>
							<el-descriptions-item v-if="currentRow.source_type !== 'workflow'" :label="t('message.pages.executionApproval.labelWorkDir')">{{ currentRow.working_directory || t('message.pages.executionApproval.defaultDir') }}</el-descriptions-item>
							<el-descriptions-item v-if="currentRow.source_type !== 'workflow'" :label="t('message.pages.executionApproval.labelLoadProfile')">{{ loadProfileText(currentRow.load_profile) }}</el-descriptions-item>
							<el-descriptions-item v-if="currentRow.source_type !== 'workflow'" :label="t('message.pages.executionApproval.labelMergeStreams')">{{ currentRow.merge_streams ? t('message.pages.executionApproval.yes') : t('message.pages.executionApproval.no') }}</el-descriptions-item>
							<el-descriptions-item v-if="currentRow.source_type !== 'workflow'" :label="t('message.pages.executionApproval.labelPrivileged')">{{ currentRow.privileged ? t('message.pages.executionApproval.yes') : t('message.pages.executionApproval.no') }}</el-descriptions-item>
							<el-descriptions-item v-if="currentRow.source_type !== 'workflow' && currentRow.privileged" :label="t('message.pages.executionApproval.labelSuUser')">{{ currentRow.su_user || '-' }}</el-descriptions-item>
							<el-descriptions-item :label="t('message.pages.executionApproval.colApprovalMode')">{{ approvalModeDisplay(currentRow) }}</el-descriptions-item>
							<el-descriptions-item v-if="currentRow.source_type !== 'workflow' && currentRow.args && currentRow.args.length" :label="t('message.pages.executionApproval.labelCustomArgs')" :span="3">
								<el-tag v-for="(arg, i) in currentRow.args" :key="i" size="small" effect="plain" style="margin-right: 4px; margin-bottom: 4px">{{ arg }}</el-tag>
							</el-descriptions-item>
							<el-descriptions-item v-if="currentRow.source_type !== 'workflow' && currentRow.environment && Object.keys(currentRow.environment).length" :label="t('message.pages.executionApproval.labelEnvVars')" :span="3">
								<el-tag v-for="(val, key) in currentRow.environment" :key="key" size="small" type="info" effect="plain" style="margin-right: 4px; margin-bottom: 4px">{{ key }}={{ val }}</el-tag>
							</el-descriptions-item>
						</el-descriptions>
					</div>

					<div class="detail-section" v-if="currentRow.submit_desc || currentRow.approve_reason">
						<div class="section-title"><el-icon><ChatDotRound /></el-icon>{{ t('message.pages.executionApproval.secApprovalDesc') }}</div>
						<div v-if="currentRow.submit_desc" class="desc-item">
							<span class="desc-label">{{ t('message.pages.executionApproval.labelSubmitDesc') }}</span>
							<span class="desc-text">{{ currentRow.submit_desc }}</span>
						</div>
						<div v-if="currentRow.approve_reason" class="desc-item">
							<span class="desc-label">{{ t('message.pages.executionApproval.labelApprovalOpinion') }}</span>
							<span class="desc-text">{{ currentRow.approve_reason }}</span>
						</div>
					</div>

					<!-- Script execution: script content -->
					<div class="detail-section" v-if="currentRow.source_type === 'script'">
						<div class="section-title"><el-icon><Document /></el-icon>{{ t('message.pages.executionApproval.secScriptContent') }}
							<span class="section-action" @click="copyScript"><el-icon><component :is="CopyDocIcon" /></el-icon>{{ t('message.pages.executionApproval.copyBtn') }}</span>
						</div>
						<el-descriptions v-if="currentRow.related_name || currentRow.related_desc" :column="2" border size="small" style="margin-bottom:12px">
							<el-descriptions-item v-if="currentRow.related_name" :label="t('message.pages.executionApproval.labelScriptName')">{{ currentRow.related_name }}</el-descriptions-item>
							<el-descriptions-item v-if="currentRow.related_desc" :label="currentRow.related_name ? t('message.pages.executionApproval.labelScriptDesc') : t('message.pages.executionApproval.labelDesc')" :span="currentRow.related_name ? 1 : 2">{{ currentRow.related_desc }}</el-descriptions-item>
						</el-descriptions>
						<el-input
							:model-value="currentRow.script_content"
							type="textarea"
							:rows="10"
							readonly
							class="script-content-view"
						/>
					</div>

					<!-- Command execution: command content -->
					<div class="detail-section" v-if="currentRow.source_type === 'command'">
						<div class="section-title"><el-icon><Operation /></el-icon>{{ t('message.pages.executionApproval.secCommandContent') }}
							<span class="section-action" @click="copyScript"><el-icon><component :is="CopyDocIcon" /></el-icon>{{ t('message.pages.executionApproval.copyBtn') }}</span>
						</div>
						<el-descriptions v-if="currentRow.related_desc" :column="1" border size="small" style="margin-bottom:12px">
							<el-descriptions-item :label="t('message.pages.executionApproval.labelExecDesc')">{{ currentRow.related_desc }}</el-descriptions-item>
						</el-descriptions>
						<el-input
							:model-value="currentRow.command"
							type="textarea"
							:rows="5"
							readonly
							class="script-content-view"
						/>
					</div>

					<!-- Workflow approval: workflow info -->
					<div class="detail-section" v-if="currentRow.source_type === 'workflow'">
						<div class="section-title"><el-icon><SetUp /></el-icon>{{ t('message.pages.executionApproval.secWorkflowInfo') }}</div>
						<el-descriptions :column="2" border size="small">
							<el-descriptions-item :label="t('message.pages.executionApproval.labelWorkflowName')" :span="2">{{ currentRow.related_name || '-' }}</el-descriptions-item>
							<el-descriptions-item :label="t('message.pages.executionApproval.labelNodeKey')">{{ extractNodeKey(currentRow.submit_desc) }}</el-descriptions-item>
							<el-descriptions-item :label="t('message.pages.executionApproval.labelExecId')">{{ extractExecutionId(currentRow.submit_desc) }}</el-descriptions-item>
						</el-descriptions>
						<div v-if="currentRow.related_desc" style="margin-top:12px">
							<div class="section-title" style="font-size:13px;color:#606266;margin-bottom:8px">{{ t('message.pages.executionApproval.secWorkflowDesc') }}</div>
							<div style="padding:10px 12px;background:#f5f7fa;border-radius:4px;font-size:13px;color:#606266;white-space:pre-wrap">{{ currentRow.related_desc }}</div>
						</div>
						<div v-if="getWorkflowDescriptionFromSubmitDesc(currentRow)" style="margin-top:12px">
							<div class="section-title" style="font-size:13px;color:#606266;margin-bottom:8px">{{ t('message.pages.executionApproval.labelNodeDesc') }}</div>
							<div style="padding:10px 12px;background:#fdf6ec;border-radius:4px;font-size:13px;color:#606266;white-space:pre-wrap">{{ getWorkflowDescriptionFromSubmitDesc(currentRow) }}</div>
						</div>
					</div>

					<div class="detail-section">
						<div class="section-title"><el-icon><User /></el-icon>{{ t('message.pages.executionApproval.secCandidates') }}</div>
						<div v-if="(currentRow.candidate_approvers||[]).length" class="candidate-list">
							<div
								v-for="a in currentRow.candidate_approvers"
								:key="a.user_id"
								class="candidate-item"
								:class="candidateStatus(currentRow, a)"
							>
								<el-avatar :size="30" :style="{ background: avatarColor(a.name || a.username) }">
									{{ (a.name || a.username || '?').charAt(0).toUpperCase() }}
								</el-avatar>
								<div class="candidate-info">
									<div class="candidate-name">{{ a.name || a.username }}
										<span class="candidate-username" style="color:#909399;margin-left:4px;font-size:12px">@{{ a.username }}</span>
									</div>
									<div class="candidate-status-text">{{ candidateStatusText(currentRow, a) }}</div>
								</div>
							</div>
						</div>
						<el-descriptions v-else :column="2" border size="small">
							<el-descriptions-item :label="t('message.pages.executionApproval.colSubmitter')">
								<div class="user-cell">
									<el-avatar :size="22" :style="{ background: avatarColor(currentRow.submitter_name || currentRow.submitter_username) }">
										{{ (currentRow.submitter_name || currentRow.submitter_username || '?').charAt(0).toUpperCase() }}
									</el-avatar>
									<span>{{ currentRow.submitter_name || currentRow.submitter_username || '-' }}</span>
								</div>
							</el-descriptions-item>
							<el-descriptions-item :label="t('message.pages.executionApproval.labelSubmitTime')">{{ formatTime(currentRow.create_datetime) }}</el-descriptions-item>
							<el-descriptions-item :label="t('message.pages.executionApproval.labelApprover')">{{ currentRow.approver_name || currentRow.approver_username || '-' }}</el-descriptions-item>
							<el-descriptions-item :label="t('message.pages.executionApproval.labelApproveTime')">{{ formatTime(currentRow.approve_time) }}</el-descriptions-item>
						</el-descriptions>
					</div>

					<div v-if="(currentRow.approval_records||[]).length" class="detail-section">
						<div class="section-title"><el-icon><List /></el-icon>{{ t('message.pages.executionApproval.secTimeline') }}</div>
						<el-timeline>
							<el-timeline-item
								v-for="(r, idx) in displayTimeline(currentRow)"
								:key="idx"
								:timestamp="formatTime(r.operate_time) + '  · ' + (r.name || r.username || t('message.pages.executionApproval.system'))"
								:type="r.iconType"
								:icon="r.icon"
								:hollow="r.hollow"
							>
								<h4>{{ r.title }}</h4>
								<p v-if="r.subtitle">{{ r.subtitle }}</p>
								<p v-if="r.reason" style="color:#606266">{{ t('message.pages.executionApproval.labelOpinionColon') }}{{ r.reason }}</p>
							</el-timeline-item>
						</el-timeline>
					</div>
				</div>
				<template #footer>
					<el-button @click="detailVisible = false">{{ t('message.pages.executionApproval.btnClose') }}</el-button>
					<el-button
						v-if="currentRow && canApprove(currentRow)"
						type="info"
						@click="openAddSignDialog(currentRow)"
					>{{ t('message.pages.executionApproval.btnAddSign') }}</el-button>
					<el-button
						v-if="currentRow && canApprove(currentRow)"
						type="warning"
						@click="openDelegateDialog(currentRow)"
					>{{ t('message.pages.executionApproval.btnDelegate') }}</el-button>
					<el-button
						v-if="currentRow && canApprove(currentRow)"
						type="success"
						@click="openApproveDialog(currentRow)"
					>{{ t('message.pages.executionApproval.actionTitleApprove') }}</el-button>
					<el-button
						v-if="currentRow && canApprove(currentRow)"
						type="danger"
						@click="openRejectDialog(currentRow)"
					>{{ t('message.pages.executionApproval.btnReject') }}</el-button>
				</template>
			</el-dialog>

			<!-- Generic action dialog: approve / reject -->
			<el-dialog v-model="actionDialogVisible" :title="actionTitle" width="480px" destroy-on-close class="action-dialog">
				<div class="action-dialog-body">
					<div class="action-icon" :class="actionType">
						<el-icon :size="28">
							<component :is="actionType === 'approve' ? SuccessFilled : CircleCloseFilled" />
						</el-icon>
					</div>
					<div class="action-desc">
						{{ actionType === 'approve' ? t('message.pages.executionApproval.actionDescApprove') : t('message.pages.executionApproval.actionDescReject') }}
					</div>
					<el-form label-width="80px">
						<el-form-item :label="actionType === 'approve' ? t('message.pages.executionApproval.labelApprovalOpinion') : t('message.pages.executionApproval.labelRejectReason')">
							<el-input v-model="actionReason" type="textarea" :rows="4" :placeholder="actionType === 'approve' ? t('message.pages.executionApproval.placeholderApproveOpinion') : t('message.pages.executionApproval.placeholderRejectReason')" />
						</el-form-item>
					</el-form>
				</div>
				<template #footer>
					<el-button @click="actionDialogVisible = false">{{ t('message.pages.executionApproval.btnCancelAction') }}</el-button>
					<el-button :type="actionType === 'approve' ? 'success' : 'danger'" :loading="actionLoading" @click="confirmAction">
						{{ actionType === 'approve' ? t('message.pages.executionApproval.btnConfirmApprove') : t('message.pages.executionApproval.btnConfirmReject') }}
					</el-button>
				</template>
			</el-dialog>

			<!-- Delegate dialog -->
			<el-dialog v-model="delegateDialogVisible" :title="t('message.pages.executionApproval.dlgDelegateTitle')" width="520px" destroy-on-close>
				<el-form label-width="90px">
					<el-form-item :label="t('message.pages.executionApproval.labelDelegateTo')" required>
						<el-select
							v-model="delegateForm.to_user_id"
							filterable
							remote
							:placeholder="t('message.pages.executionApproval.placeholderDelegateUser')"
							style="width: 100%"
							:remote-method="searchUsers"
						>
							<el-option
								v-for="u in userList"
								:key="u.id"
								:label="u.username + (u.name ? ` (${u.name})` : '')"
								:value="u.id"
							/>
						</el-select>
					</el-form-item>
					<el-form-item :label="t('message.pages.executionApproval.labelDelegateReason')">
						<el-input v-model="delegateForm.reason" type="textarea" :rows="3" :placeholder="t('message.pages.executionApproval.placeholderDelegateReason')" />
					</el-form-item>
				</el-form>
				<template #footer>
					<el-button @click="delegateDialogVisible = false">{{ t('message.pages.executionApproval.btnCancelAction') }}</el-button>
					<el-button type="primary" :loading="delegateLoading" @click="confirmDelegate">{{ t('message.pages.executionApproval.btnConfirmDelegate') }}</el-button>
				</template>
			</el-dialog>

			<!-- Add-signer dialog -->
			<el-dialog v-model="addSignDialogVisible" :title="t('message.pages.executionApproval.dlgAddSignTitle')" width="520px" destroy-on-close>
				<el-form label-width="90px">
					<el-form-item :label="t('message.pages.executionApproval.labelAddSignUser')" required>
						<el-select
							v-model="addSignForm.user_ids"
							multiple
							filterable
							remote
							:placeholder="t('message.pages.executionApproval.placeholderAddSignUser')"
							style="width: 100%"
							:remote-method="searchUsers"
						>
							<el-option
								v-for="u in userList"
								:key="u.id"
								:label="u.username + (u.name ? ` (${u.name})` : '')"
								:value="u.id"
							/>
						</el-select>
					</el-form-item>
					<el-form-item :label="t('message.pages.executionApproval.labelAddSignReason')">
						<el-input v-model="addSignForm.reason" type="textarea" :rows="3" :placeholder="t('message.pages.executionApproval.placeholderAddSignReason')" />
					</el-form-item>
				</el-form>
				<template #footer>
					<el-button @click="addSignDialogVisible = false">{{ t('message.pages.executionApproval.btnCancelAction') }}</el-button>
					<el-button type="primary" :loading="addSignLoading" @click="confirmAddSign">{{ t('message.pages.executionApproval.btnConfirmAddSign') }}</el-button>
				</template>
			</el-dialog>
		</div>
	</fs-page>
	</EditionLockedPage>
</template>

<script setup lang="ts" name="OpsExecutionApproval">
import { ref, reactive, computed, onMounted, h } from 'vue';
import { useI18n } from 'vue-i18n';
import EditionLockedPage from '/@/components/EditionLockedPage.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
	Search,
	Refresh,
	RefreshLeft,
	Monitor,
	SuccessFilled,
	CircleCloseFilled,
	Clock,
	CircleCheckFilled,
	Document,
	Setting,
	ChatDotRound,
	CopyDocument as CopyDocIcon,
	User,
	List,
	Plus,
	SwitchButton,
	SetUp,
	Operation,
} from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useUserInfo } from '/@/stores/userInfo';
import { request } from '/@/utils/service';
import * as approvalApi from '/@/api/taurus/execution-approval/api';
import { useEditionStore } from '/@/editions/index';

const router = useRouter();
const { t } = useI18n();

const loading = ref(false);
const tableData = ref<any[]>([]);
const page = reactive({ current: 1, size: 20, total: 0 });

const searchKey = ref('');
const filterStatus = ref('');
const filterMode = ref('');
const viewType = ref('all');

const canReset = computed(() => {
	return !!(searchKey.value || filterStatus.value || filterMode.value || viewType.value !== 'all');
});

const detailVisible = ref(false);
const currentRow = ref<any>(null);

const actionDialogVisible = ref(false);
const actionTitle = ref('');
const actionReason = ref('');
const actionLoading = ref(false);
const actionType = ref<'approve' | 'reject'>('approve');
const actionTarget = ref<any>(null);

const delegateDialogVisible = ref(false);
const delegateLoading = ref(false);
const delegateForm = reactive<{ to_user_id: number | null; reason: string }>({ to_user_id: null, reason: '' });
const delegateTarget = ref<any>(null);

const addSignDialogVisible = ref(false);
const addSignLoading = ref(false);
const addSignForm = reactive<{ user_ids: number[]; reason: string }>({ user_ids: [], reason: '' });
const addSignTarget = ref<any>(null);

const userList = ref<any[]>([]);
async function searchUsers(keyword = '') {
	try {
		const res: any = await request({
			url: '/api/system/user/',
			method: 'get',
			params: { limit: 300, keyword },
		});
		userList.value = res.data?.results || res.data || [];
	} catch {}
}

const userInfo = ref<any>(null);

const totalAll = ref(0);

const statCounts = reactive({
	pending: 0,
	approved: 0,
	rejected: 0,
	cancelled: 0,
});

const statCards = computed(() => [
	{
		key: 'pending',
		label: t('message.pages.executionApproval.statPending'),
		count: statCounts.pending,
		icon: Clock,
		gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
	},
	{
		key: 'approved',
		label: t('message.pages.executionApproval.statApproved'),
		count: statCounts.approved,
		icon: CircleCheckFilled,
		gradient: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
	},
	{
		key: 'rejected',
		label: t('message.pages.executionApproval.statRejected'),
		count: statCounts.rejected,
		icon: CircleCloseFilled,
		gradient: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
	},
	{
		key: 'cancelled',
		label: t('message.pages.executionApproval.statCancelled'),
		count: statCounts.cancelled,
		icon: RefreshLeft,
		gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
	},
]);

const avatarColors = [
	'#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399',
	'#53a8b6', '#9b59b6', '#f39c12', '#1abc9c', '#e74c3c',
];

function avatarColor(name: string) {
	if (!name) return '#909399';
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	return avatarColors[Math.abs(hash) % avatarColors.length];
}

function tableRowClassName({ row }: { row: any }) {
	if (row.status === 'pending') return 'row-pending';
	if (row.status === 'rejected' || row.status === 'failed') return 'row-danger';
	return '';
}

function handleRowClick(row: any) {
	if (row && row.id) {
		openDetail(row);
	}
}

function onStatCardClick(key: string) {
	filterStatus.value = filterStatus.value === key ? '' : key;
	handleSearch();
}

function resetFilters() {
	searchKey.value = '';
	filterStatus.value = '';
	filterMode.value = '';
	viewType.value = 'all';
	handleSearch();
}

async function copyScript() {
	const text = currentRow.value?.source_type === 'command'
		? currentRow.value?.command
		: currentRow.value?.script_content;
	if (!text) {
		ElMessage.warning(t('message.pages.executionApproval.msgNoCopyContent'));
		return;
	}
	try {
		await navigator.clipboard.writeText(text);
		ElMessage.success(t('message.pages.executionApproval.msgCopied'));
	} catch {
		ElMessage.error(t('message.pages.executionApproval.msgCopyFail'));
	}
}

onMounted(() => {
	const editionStore = useEditionStore();
	if (!editionStore.hasFeature('OPS_EXECUTION_APPROVAL')) return;
	try {
		const userStore = useUserInfo();
		userInfo.value = userStore.userInfos || {};
	} catch {
		userInfo.value = {};
	}
	searchUsers();
	loadList();
	loadStatCounts();
});

async function loadStatCounts() {
	try {
		const uid = userInfo.value?.id;
		const baseParams: any = viewType.value === 'mine' && uid ? { submitter: uid } : {};

		const allStatuses = ['pending', 'approved', 'executing', 'done', 'failed', 'rejected', 'cancelled'];
		const results = await Promise.all(
			allStatuses.map(async (s) => {
				try {
					const params: any = { ...baseParams, status: s, page: 1, limit: 1 };
					const res: any = await approvalApi.GetList(params);
					const total = res?.total || 0;
					return { status: s, total };
				} catch {
					return { status: s, total: 0 };
				}
			})
		);

		const counts: Record<string, number> = {};
		results.forEach(({ status, total }) => {
			counts[status] = total;
		});

		statCounts.pending = counts['pending'] || 0;
		statCounts.approved = (counts['approved'] || 0) + (counts['executing'] || 0) + (counts['done'] || 0) + (counts['failed'] || 0);
		statCounts.rejected = counts['rejected'] || 0;
		statCounts.cancelled = counts['cancelled'] || 0;

		totalAll.value = allStatuses.reduce((sum, s) => sum + (counts[s] || 0), 0);
	} catch {
		// ignore
	}
}

const STATUS_COMBINED_FILTERS: Record<string, string> = {
	approved: 'approved,executing,done,failed',
};

async function loadList() {
	loading.value = true;
	try {
		const params: any = {
			page: page.current,
			limit: page.size,
		};
		if (searchKey.value) params.search = searchKey.value;
		if (filterStatus.value) {
			if (STATUS_COMBINED_FILTERS[filterStatus.value]) {
				params.status__in = STATUS_COMBINED_FILTERS[filterStatus.value];
			} else {
				params.status = filterStatus.value;
			}
		}
		if (filterMode.value) params.approval_mode = filterMode.value;
		if (viewType.value === 'mine' && userInfo.value?.id) params.submitter = userInfo.value.id;
		else if (viewType.value === 'pending' && !filterStatus.value) params.status = 'pending';
		params.view_type = viewType.value;

		const res: any = await approvalApi.GetList(params);
		tableData.value = res.data || [];
		page.total = res.total || tableData.value.length;
		loadStatCounts();
	} catch (e: any) {
		ElMessage.error(e.message || t('message.pages.executionApproval.msgLoadListFail'));
	} finally {
		loading.value = false;
	}
}

function handleSearch() {
	page.current = 1;
	loadList();
	loadStatCounts();
}

async function openDetail(row: any) {
	loading.value = true;
	try {
		const res: any = await approvalApi.GetObj(row.id);
		currentRow.value = res.data || res;
		detailVisible.value = true;
	} catch (e: any) {
		ElMessage.error(e.message || t('message.pages.executionApproval.msgLoadDetailFail'));
	} finally {
		loading.value = false;
	}
}

function openApproveDialog(row: any) {
	actionType.value = 'approve';
	actionTarget.value = row;
	actionTitle.value = t('message.pages.executionApproval.actionTitleApprove');
	actionReason.value = '';
	actionDialogVisible.value = true;
}

function openRejectDialog(row: any) {
	actionType.value = 'reject';
	actionTarget.value = row;
	actionTitle.value = t('message.pages.executionApproval.actionTitleReject');
	actionReason.value = '';
	actionDialogVisible.value = true;
}

async function confirmAction() {
	if (!actionTarget.value) return;
	if (actionType.value === 'reject' && !actionReason.value.trim()) {
		ElMessage.warning(t('message.pages.executionApproval.msgRejectReasonRequired'));
		return;
	}
	actionLoading.value = true;
	try {
		const id = actionTarget.value.id;
		const data = { reason: actionReason.value };
		if (actionType.value === 'approve') {
			await approvalApi.Approve(id, data);
			ElMessage.success(t('message.pages.executionApproval.msgOpSuccess'));
		} else {
			await approvalApi.Reject(id, data);
			ElMessage.success(t('message.pages.executionApproval.statRejected'));
		}
		actionDialogVisible.value = false;
		loadList();
		loadStatCounts();
		if (currentRow.value && currentRow.value.id === id) openDetail(actionTarget.value);
	} catch (e: any) {
		ElMessage.error(e.message || t('message.pages.executionApproval.msgOpFail'));
	} finally {
		actionLoading.value = false;
	}
}

function openDelegateDialog(row: any) {
	delegateTarget.value = row;
	delegateForm.to_user_id = null;
	delegateForm.reason = '';
	delegateDialogVisible.value = true;
	if (userList.value.length === 0) searchUsers();
}
async function confirmDelegate() {
	if (!delegateTarget.value || !delegateForm.to_user_id) {
		ElMessage.warning(t('message.pages.executionApproval.msgSelectDelegateUser'));
		return;
	}
	delegateLoading.value = true;
	try {
		await approvalApi.Delegate(delegateTarget.value.id, {
			to_user_id: delegateForm.to_user_id as number,
			reason: delegateForm.reason,
		});
		ElMessage.success(t('message.pages.executionApproval.msgDelegateSuccess'));
		delegateDialogVisible.value = false;
		loadList();
		if (currentRow.value && currentRow.value.id === delegateTarget.value.id) openDetail(delegateTarget.value);
	} catch (e: any) {
		ElMessage.error(e.message || t('message.pages.executionApproval.msgDelegateFail'));
	} finally {
		delegateLoading.value = false;
	}
}

function openAddSignDialog(row: any) {
	addSignTarget.value = row;
	addSignForm.user_ids = [];
	addSignForm.reason = '';
	addSignDialogVisible.value = true;
	if (userList.value.length === 0) searchUsers();
}
async function confirmAddSign() {
	if (!addSignTarget.value || !addSignForm.user_ids.length) {
		ElMessage.warning(t('message.pages.executionApproval.msgSelectAddSignUser'));
		return;
	}
	addSignLoading.value = true;
	try {
		await approvalApi.AddSign(addSignTarget.value.id, {
			user_ids: addSignForm.user_ids,
			reason: addSignForm.reason,
		});
		ElMessage.success(t('message.pages.executionApproval.msgAddSignSuccess'));
		addSignDialogVisible.value = false;
		loadList();
		if (currentRow.value && currentRow.value.id === addSignTarget.value.id) openDetail(addSignTarget.value);
	} catch (e: any) {
		ElMessage.error(e.message || t('message.pages.executionApproval.msgAddSignFail'));
	} finally {
		addSignLoading.value = false;
	}
}

async function handleCancel(row: any) {
	try {
		await ElMessageBox.confirm(t('message.pages.executionApproval.confirmWithdrawMsg'), t('message.pages.executionApproval.confirmWithdrawTitle'), { type: 'warning' });
		await approvalApi.Cancel(row.id);
		ElMessage.success(t('message.pages.executionApproval.statCancelled'));
		loadList();
		loadStatCounts();
	} catch (e: any) {
		if (e !== 'cancel' && e?.message) {
			ElMessage.error(e.message);
		}
	}
}

function canCancel(row: any) {
	const uid = userInfo.value?.id;
	return uid && row.submitter === uid;
}

function _candidateUserIds(row: any) {
	const candidates = row.candidate_approvers || [];
	const ids: number[] = [];
	candidates.forEach((c: any) => {
		if (c && c.user_id) ids.push(c.user_id);
	});
	return ids;
}

function canApprove(row: any) {
	if (row.status !== 'pending') return false;
	const uid = userInfo.value?.id;
	if (!uid) return false;
	const cids = _candidateUserIds(row);
	if (cids.length === 0) {
		// No dynamic candidate specified: use original approver field
		return row.approver_id && row.approver_id === uid;
	}
	return cids.includes(uid);
}

function goToExecution(row: any) {
	if (row.ops_execution) {
		router.push({ path: '/ops/history', query: { execution_id: row.ops_execution } });
	}
}

function statusTagType(status: string) {
	const map: Record<string, string> = {
		pending: 'warning',
		approved: 'success',
		rejected: 'danger',
		cancelled: 'info',
		executing: 'primary',
		done: 'success',
		failed: 'danger',
	};
	return map[status] || 'info';
}

function statusLabel(status: string) {
	const map: Record<string, string> = {
		pending: t('message.pages.executionApproval.statPending'),
		approved: t('message.pages.executionApproval.statApproved'),
		rejected: t('message.pages.executionApproval.statRejected'),
		cancelled: t('message.pages.executionApproval.statCancelled'),
		executing: t('message.pages.executionApproval.statusExecuting'),
		done: t('message.pages.executionApproval.statusDone'),
		failed: t('message.pages.executionApproval.statusFailed'),
	};
	return map[status] || status;
}

function scriptTypeText(t: string) {
	const map: Record<string, string> = { sh: 'Shell', python: 'Python' };
	return map[t] || t || '-';
}

function scriptTypeTag(t: string) {
	return t === 'python' ? 'success' : 'primary';
}

function loadProfileText(v: string) {
	const map: Record<string, string> = {
		false: t('message.pages.executionApproval.cleanEnv'),
		true: t('message.pages.executionApproval.loadBashrc'),
		login: 'Login Shell',
	};
	return map[v] || v || t('message.pages.executionApproval.cleanEnv');
}

function approvalModeDisplay(row: any) {
	if ((row.candidate_approvers || []).length === 0) return t('message.pages.executionApproval.modeSingleFull');
	return row.approval_mode === 'all' ? t('message.pages.executionApproval.modeAllFull') : t('message.pages.executionApproval.modeOrFull');
}

function execModeText(m: string) {
	const map: Record<string, string> = {
		serial: t('message.pages.executionApproval.execSerial'),
		parallel: t('message.pages.executionApproval.execParallel'),
		gray_release: t('message.pages.executionApproval.execGray'),
	};
	return map[m] || m || t('message.pages.executionApproval.execParallel');
}

function sourceTypeText(row: any) {
	if (row.source_type_display) return row.source_type_display;
	const t = row.source_type;
	const map: Record<string, string> = {
		workflow: t('message.pages.executionApproval.sourceWorkflow'),
		script: t('message.pages.executionApproval.sourceScript'),
		command: t('message.pages.executionApproval.sourceCommand'),
	};
	return map[t] || t('message.pages.executionApproval.sourceScript');
}

function sourceTypeTag(row: any) {
	const t = row.source_type;
	if (t === 'workflow') return 'warning';
	if (t === 'command') return 'success';
	return 'primary';
}

function sourceTypeIcon(row: any) {
	const t = row.source_type;
	if (t === 'workflow') return 'SetUp';
	if (t === 'command') return 'Operation';
	return 'Document';
}

function extractNodeKey(desc: string) {
	if (!desc) return '-';
	const m = desc.match(/key=([^，\s)]+)/);
	if (!m) return '-';
	return m[1].replace(/[)）\s]+$/g, '');
}

function extractExecutionId(desc: string) {
	if (!desc) return '-';
	const m = desc.match(/execution_id=([^，\s)]+)/);
	if (!m) return '-';
	return m[1].replace(/[)）\s]+$/g, '');
}

function getWorkflowDescriptionFromSubmitDesc(row: any) {
	if (!row.submit_desc) return '';
	const lines = row.submit_desc.split('\n');
	if (lines.length > 0) {
		const first = lines[0].trim();
		if (first && !first.startsWith('Workflow node')) {
			return first;
		}
	}
	return '';
}

function formatTime(t: string) {
	if (!t) return '-';
	return t.replace('T', ' ').split('.')[0];
}

function _userRecord(row: any, candidate: any) {
	const records = row.approval_records || [];
	return records.find((r: any) => r.user_id === candidate.user_id && (r.action === 'approve' || r.action === 'reject')) || null;
}

function isUserApproved(row: any, candidate: any) {
	const r = _userRecord(row, candidate);
	return !!r && r.action === 'approve';
}
function isUserRejected(row: any, candidate: any) {
	const r = _userRecord(row, candidate);
	return !!r && r.action === 'reject';
}

function getCandidateTagType(row: any, candidate: any) {
	if (row.status === 'rejected' && row.approver_name && (candidate.username === row.approver_name || candidate.user_id === (row.approver || candidate.user_id))) {
		// Keep default
	}
	const r = _userRecord(row, candidate);
	if (!r) return 'info';
	if (r.action === 'approve') return 'success';
	if (r.action === 'reject') return 'danger';
	return 'info';
}

function approveProgressText(row: any) {
	const candidates = row.candidate_approvers || [];
	if (!candidates.length) return '';
	const approved = candidates.filter((c: any) => isUserApproved(row, c)).length;
	return `${approved}/${candidates.length} ${t('message.pages.executionApproval.progressApproved')}`;
}

function candidateStatus(row: any, candidate: any) {
	const r = _userRecord(row, candidate);
	if (!r) return 'status-pending';
	if (r.action === 'approve') return 'status-approved';
	if (r.action === 'reject') return 'status-rejected';
	return 'status-pending';
}

function candidateStatusText(row: any, candidate: any) {
	const r = _userRecord(row, candidate);
	if (!r) return t('message.pages.executionApproval.pendingWait');
	if (r.action === 'approve') {
		return t('message.pages.executionApproval.statApproved') + (r.operate_time ? ` · ${formatTime(r.operate_time)}` : '') + (r.reason ? ` · ${t('message.pages.executionApproval.labelOpinionColon')}${r.reason}` : '');
	}
	if (r.action === 'reject') {
		return t('message.pages.executionApproval.statRejected') + (r.operate_time ? ` · ${formatTime(r.operate_time)}` : '') + (r.reason ? ` · ${t('message.pages.executionApproval.labelReasonColon')}${r.reason}` : '');
	}
	return (r.action || '') + (r.reason ? `：${r.reason}` : '');
}

function displayTimeline(row: any) {
	const list: any[] = [];
	const candidates = row.candidate_approvers || [];
	const records = row.approval_records || [];

	list.push({
		operate_time: row.create_datetime,
		iconType: 'primary',
		icon: h(Plus),
		title: t('message.pages.executionApproval.tlSubmitted'),
		subtitle: `${t('message.pages.executionApproval.labelSubmitterWithColon')}${row.submitter_name || row.submitter_username} · ${t('message.pages.executionApproval.labelCountApprovers')} ${candidates.length}${t('message.pages.executionApproval.labelApproversUnit')}` +
			(row.approval_mode === 'all' ? ` · ${t('message.pages.executionApproval.modeAll')}` : (candidates.length ? ` · ${t('message.pages.executionApproval.modeOr')}` : ` · ${t('message.pages.executionApproval.modeSingle')}`)),
		reason: row.submit_desc || '',
		hollow: false,
		name: row.submitter_name || row.submitter_username,
	});

	records.forEach((r: any) => {
		let iconType: any = 'primary';
		let icon = h(User);
		let title = t('message.pages.executionApproval.tlReviewAction');
		let subtitle = '';
		switch (r.action) {
			case 'approve':
				iconType = 'success';
				icon = h(CircleCheckFilled);
				title = t('message.pages.executionApproval.tlReviewApproved');
				subtitle = (r.name || r.username || '') + t('message.pages.executionApproval.subtlAgree');
				break;
			case 'reject':
				iconType = 'danger';
				icon = h(CircleCloseFilled);
				title = t('message.pages.executionApproval.tlReviewRejected');
				subtitle = (r.name || r.username || '') + t('message.pages.executionApproval.subtlReject');
				break;
			case 'delegate':
				iconType = 'warning';
				icon = h(SwitchButton);
				title = t('message.pages.executionApproval.tlDelegate');
				subtitle = (r.name || r.username || '') + ' → ' + (r.to_username || (t('message.pages.executionApproval.subtlUserHash') + r.to_user_id));
				break;
			case 'add_sign':
				iconType = 'warning';
				icon = h(Plus);
				title = t('message.pages.executionApproval.tlAddSign');
				subtitle = (r.name || r.username || '') + t('message.pages.executionApproval.labelAddSignAppend') + (r.user_ids?.length || 0) + t('message.pages.executionApproval.labelReviewersUnit');
				break;
		}
		list.push({
			operate_time: r.operate_time,
			iconType,
			icon,
			title,
			subtitle,
			reason: r.reason,
			hollow: false,
			name: r.name || r.username,
		});
	});

	if (row.status === 'cancelled') {
		list.push({
			operate_time: row.finish_time,
			iconType: 'info',
			icon: h(RefreshLeft),
			title: t('message.pages.executionApproval.tlCancelled'),
			subtitle: `${t('message.pages.executionApproval.labelSubmitterWithColon')}${row.submitter_name || row.submitter_username}`,
			reason: '',
			hollow: false,
			name: row.submitter_name || row.submitter_username,
		});
	}
	if (row.status === 'approved' || row.status === 'executing' || row.status === 'done' || row.status === 'failed') {
		list.push({
			operate_time: row.approve_time || row.finish_time,
			iconType: 'success',
			icon: h(SuccessFilled),
			title: row.status === 'done' ? t('message.pages.executionApproval.statusApprovedDone') :
				row.status === 'failed' ? t('message.pages.executionApproval.statusApprovedFailed') :
				row.status === 'executing' ? t('message.pages.executionApproval.statusApprovedExecuting') : t('message.pages.executionApproval.statusApprovedTriggered'),
			subtitle: `${t('message.pages.executionApproval.labelFinalApprover')}${row.approver_name || row.approver_username || '-'}`,
			reason: row.approval_mode === 'all' ? t('message.pages.executionApproval.reasonAllApproved') : (candidates.length ? t('message.pages.executionApproval.reasonOrSign') : t('message.pages.executionApproval.reasonSingle')),
			hollow: false,
			name: row.approver_name || row.approver_username || '',
		});
	}
	if (row.status === 'rejected') {
		list.push({
			operate_time: row.finish_time || row.approve_time,
			iconType: 'danger',
			icon: h(CircleCloseFilled),
			title: t('message.pages.executionApproval.tlRejectedFinal'),
			subtitle: `${t('message.pages.executionApproval.labelOperator')}${row.approver_name || row.approver_username || '-'}`,
			reason: row.approve_reason || '',
			hollow: false,
			name: row.approver_name || row.approver_username || '',
		});
	}

	list.sort((a, b) => (a.operate_time || '').localeCompare(b.operate_time || ''));
	return list;
}
</script>

<style scoped lang="scss">
.approval-container {
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 16px;
	box-sizing: border-box;
	gap: 16px;
	background: #f4f6fa;
}

.page-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px 24px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 14px;
	color: #fff;
	box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);

	.header-left {
		display: flex;
		align-items: center;
		gap: 32px;
		flex-wrap: wrap;
	}

	.title {
		h2 {
			margin: 0;
			font-size: 22px;
			font-weight: 600;
			letter-spacing: 0.5px;
		}

		.desc {
			font-size: 13px;
			opacity: 0.88;
			margin-top: 4px;
			display: block;
		}
	}

	.quick-stats {
		display: flex;
		gap: 20px;

		.quick-stat-item {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 6px 14px;
			background: rgba(255, 255, 255, 0.15);
			border-radius: 8px;
			backdrop-filter: blur(4px);

			.quick-stat-value {
				font-size: 18px;
				font-weight: 700;
				color: #fff;
				font-family: 'DIN Alternate', -apple-system, sans-serif;
			}

			.quick-stat-label {
				font-size: 12px;
				color: rgba(255, 255, 255, 0.85);
			}
		}
	}

	.header-actions {
		display: flex;
		gap: 10px;

		:deep(.el-button) {
			background: rgba(255, 255, 255, 0.2);
			color: #fff;
			border: none;
			backdrop-filter: blur(4px);

			&:hover {
				background: rgba(255, 255, 255, 0.35);
			}
		}
	}
}

.stats-row {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: 12px;
}

.stat-card {
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 16px 20px;
	background: #fff;
	border-radius: 12px;
	border: 1px solid #e8ecf4;
	cursor: pointer;
	transition: all 0.25s ease;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: transparent;
		transition: background 0.25s ease;
	}

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
		border-color: #b3d4ff;
	}

	&.is-active {
		border-color: #409eff;
		background: linear-gradient(135deg, #f0f7ff 0%, #fff 60%);
		box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);

		&::before {
			background: linear-gradient(90deg, #409eff, #66b1ff);
		}
	}

	.stat-indicator {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 2px;
		background: linear-gradient(90deg, #409eff, #66b1ff);
	}

	.stat-icon {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		flex-shrink: 0;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.stat-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.stat-value {
		font-size: 26px;
		font-weight: 700;
		color: #1f2d3d;
		line-height: 1.2;
		font-family: 'DIN Alternate', -apple-system, sans-serif;
	}

	.stat-label {
		font-size: 13px;
		color: #606266;
		font-weight: 500;
	}
}

.approval-toolbar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
	padding: 14px 16px;
	background: #fff;
	border-radius: 10px;
	border: 1px solid #e8ecf4;

	.toolbar-left {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.search-input {
		width: 300px;
	}

	.status-filter {
		width: 130px;
	}

	.toolbar-right {
		display: flex;
		gap: 8px;
	}
}

.table-card {
	flex: 1;
	background: #fff;
	border-radius: 10px;
	border: 1px solid #e8ecf4;
	overflow: hidden;
	display: flex;
	flex-direction: column;

	:deep(.approval-table) {
		flex: 1;
	}
}

.approval-table {
	width: 100%;

	:deep(.el-table__header th) {
		background: #f7f9fc;
		color: #606266;
		font-weight: 600;
		font-size: 13px;
	}

	:deep(.el-table__body td) {
		font-size: 13px;
		cursor: pointer;
	}

	:deep(.el-table__body tr) {
		transition: background-color 0.2s ease;

		&:hover > td {
			background-color: #ecf5ff !important;
		}
	}

	:deep(.el-table__body tr.row-pending) {
		--el-table-tr-bg-color: #fefaf0;
	}

	:deep(.el-table__body tr.row-danger) {
		--el-table-tr-bg-color: #fef0f0;
	}
}

.batch-cell {
	display: flex;
	flex-direction: column;
	gap: 6px;

	.batch-id {
		font-family: 'SF Mono', 'Menlo', monospace;
		font-size: 12px;
		color: #909399;
		background: #f4f4f5;
		padding: 2px 8px;
		border-radius: 4px;
		display: inline-block;
		width: fit-content;
	}

	.host-info {
		display: flex;
		flex-direction: column;
		gap: 2px;

		.host-name {
			font-weight: 600;
			color: #1f2d3d;
		}

		.host-ip {
			font-size: 12px;
			color: #909399;
			font-family: 'SF Mono', 'Menlo', monospace;
		}
	}
}

.status-cell {
	display: flex;
	flex-direction: column;
	gap: 4px;
	align-items: center;
	.progress-sub {
		font-size: 11px;
		color: #909399;
	}
}

.approvers-tags {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
}

.strategy-cell {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;

	.strategy-mode {
		font-weight: 600;
		font-size: 13px;
		color: #303133;
	}

	.strategy-sub {
		font-size: 12px;
		color: #909399;
	}
}

.user-cell {
	display: flex;
	align-items: center;
	gap: 6px;
	justify-content: center;

	.user-avatar {
		color: #fff;
		font-size: 12px;
		font-weight: 600;
		flex-shrink: 0;
	}
}

.time-cell {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;

	.time-sub {
		font-size: 12px;
		color: #606266;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.time-label {
		font-size: 11px;
		color: #a8abb2;
	}
}

.pagination-bar {
	display: flex;
	justify-content: flex-end;
	padding: 4px 4px 0;
}

.empty-hint {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;

	p {
		margin: 4px 0;
		font-size: 13px;
		color: #909399;
	}
}

.script-content-view :deep(.el-textarea__inner) {
	font-family: 'SF Mono', 'Menlo', 'Courier New', monospace;
	font-size: 13px;
	line-height: 1.7;
}

.detail-content {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.detail-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: 16px;
	background: linear-gradient(135deg, #f5f9ff 0%, #ffffff 100%);
	border-radius: 10px;
	border: 1px solid #e4ebf5;
	gap: 16px;
}

.detail-title-area {
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;

	.detail-batch-id {
		font-family: 'SF Mono', 'Menlo', monospace;
		font-size: 12px;
		color: #606266;
		background: #f4f4f5;
		padding: 3px 10px;
		border-radius: 12px;
	}
}

.detail-host-area {
	display: flex;
	align-items: center;
	gap: 8px;

	.detail-host-icon {
		color: #409eff;
		font-size: 18px;
	}

	.detail-host-name {
		font-weight: 600;
		color: #1f2d3d;
		font-size: 15px;
	}

	.detail-host-ip {
		font-family: 'SF Mono', 'Menlo', monospace;
		font-size: 13px;
		color: #909399;
	}

	.detail-host-multi {
		font-weight: 600;
		color: #409eff;
		font-size: 15px;
		cursor: pointer;
	}

	.batch-host-list {
		max-height: 260px;
		overflow-y: auto;
	}

	.batch-host-item {
		display: flex;
		justify-content: space-between;
		padding: 6px 0;
		border-bottom: 1px solid #f0f2f5;
		font-size: 13px;
	}

	.batch-host-item:last-child {
		border-bottom: none;
	}

	.batch-host-name {
		color: #303133;
		font-weight: 500;
	}

	.batch-host-ip {
		color: #909399;
		font-family: 'SF Mono', 'Menlo', monospace;
	}
}

.detail-section {
	.section-title {
		font-size: 13px;
		font-weight: 600;
		color: #303133;
		margin-bottom: 10px;
		display: flex;
		align-items: center;
		gap: 6px;

		.el-icon {
			color: #409eff;
		}

		.section-action {
			margin-left: auto;
			font-size: 12px;
			font-weight: 400;
			color: #409eff;
			cursor: pointer;
			display: flex;
			align-items: center;
			gap: 3px;

			&:hover {
				color: #66b1ff;
			}
		}
	}
}

.candidate-list {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 12px;

	.candidate-item {
		display: flex;
		gap: 10px;
		align-items: center;
		padding: 12px;
		border-radius: 10px;
		border: 1px solid #ebeef5;
		background: #fafbfc;

		&.status-pending {
			border-color: #fdf6ec;
			background: #fef9f0;
		}
		&.status-approved {
			border-color: #e1f3d8;
			background: #f0f9eb;
		}
		&.status-rejected {
			border-color: #fde2e2;
			background: #fef0f0;
		}

		.candidate-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
		.candidate-name {
			font-weight: 600;
			color: #303133;
		}
		.candidate-status-text {
			font-size: 12px;
			color: #606266;
			line-height: 1.5;
			word-break: break-all;
		}
	}
}

.desc-item {
	display: flex;
	gap: 10px;
	margin-bottom: 10px;

	&:last-child {
		margin-bottom: 0;
	}

	.desc-label {
		flex-shrink: 0;
		width: 80px;
		color: #909399;
		font-size: 13px;
	}

	.desc-text {
		flex: 1;
		color: #303133;
		font-size: 13px;
		line-height: 1.7;
		word-break: break-all;
	}
}

.action-dialog-body {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14px;
	padding: 12px 0 4px;

	.action-icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;

		&.approve {
			background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
		}

		&.reject {
			background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
		}
	}

	.action-desc {
		font-size: 13px;
		color: #606266;
		text-align: center;
	}
}
</style>

<style lang="scss">
.detail-dialog,
.action-dialog {
	.el-dialog__body {
		padding: 20px 24px;
	}

	.el-dialog__footer {
		padding: 12px 24px 20px;
	}
}
</style>