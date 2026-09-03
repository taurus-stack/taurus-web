<template>
	<div class="workflow-list-page">
		<div class="page-header">
			<div class="title">
				<h2>{{ t('message.pages.workflowList.wlPageTitle') }}</h2>
				<span class="desc">{{ t('message.pages.workflowList.wlPageDesc') }}</span>
			</div>
			<div class="header-operate">
				<el-input
					v-model="searchKey"
					:placeholder="t('message.pages.workflowList.wlSearchPlaceholder')"
					style="width: 280px"
					clearable
					@keyup.enter="handleSearch"
					@clear="handleSearch"
				>
					<template #append>
						<el-button native-type="button" @click="handleSearch"
							><el-icon><Search /></el-icon
						></el-button>
					</template>
				</el-input>
				<el-button native-type="button" type="warning"
					:disabled="!hasFeature('WORKFLOW_APPROVAL_FLOW')"
					:title="!hasFeature('WORKFLOW_APPROVAL_FLOW') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
					@click="onApprovalCenterBtnClick">
					{{ t('message.pages.workflowList.wlApprovalCenter') }}
					<el-badge :value="stats.pending_approve" :hidden="!stats.pending_approve || !hasFeature('WORKFLOW_APPROVAL_FLOW')" class="approve-badge" />
				</el-button>
				<el-button native-type="button" @click="handleRefresh">{{ t('message.global.refresh') }}</el-button>
				<el-radio-group v-model="viewMode" size="small">
					<el-radio-button value="table">{{ t('message.pages.workflowList.wlListView') }}</el-radio-button>
					<el-radio-button value="card">{{ t('message.pages.workflowList.wlCardView') }}</el-radio-button>
				</el-radio-group>
				<el-button native-type="button" type="primary" @click="createWorkflow">{{ t('message.pages.workflowList.wlNewWorkflow') }}</el-button>
			</div>
		</div>

		<!-- Stats card -->
		<div class="stat-board">
			<div class="stat-card-row">
				<div class="stat-card">
					<div class="stat-num">{{ stats.total }}</div>
					<div class="stat-label">{{ t('message.pages.workflowList.wlStatTotal') }}</div>
				</div>
				<div class="stat-card">
					<div class="stat-num stat-blue">{{ stats.public_count }}</div>
					<div class="stat-label">{{ t('message.pages.workflowList.wlStatPublic') }}</div>
				</div>
				<div class="stat-card ee-gate-card"
					 :class="{ 'is-ee-gate': !hasFeature('WORKFLOW_APPROVAL_FLOW') }"
					 :title="!hasFeature('WORKFLOW_APPROVAL_FLOW') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
					 @click="onApprovalStatCardClick">
					<div class="stat-num stat-orange">{{ hasFeature('WORKFLOW_APPROVAL_FLOW') ? stats.pending_approve : 0 }}</div>
					<div class="stat-label">
						{{ t('message.pages.workflowList.wlStatPendingApprove') }}
						<el-tag v-if="!hasFeature('WORKFLOW_APPROVAL_FLOW')" size="small" type="warning" effect="plain" style="margin-left:4px;">EE</el-tag>
					</div>
				</div>
				<div class="stat-card">
					<div class="stat-num stat-green">{{ stats.normal_count }}</div>
					<div class="stat-label">{{ t('message.pages.workflowList.wlStatNormal') }}</div>
				</div>
				<div class="stat-card">
					<div class="stat-num stat-purple">{{ stats.today_exec }}</div>
					<div class="stat-label">{{ t('message.pages.workflowList.wlStatTodayExec') }}</div>
				</div>
				<div class="stat-card">
					<div class="stat-num stat-red">{{ stats.total_exec }}</div>
					<div class="stat-label">{{ t('message.pages.workflowList.wlStatTotalExec') }}</div>
				</div>
			</div>
		</div>

		<div class="page-main">
			<!-- Left category tree -->
			<div class="left-tree">
				<div class="tree-title">
					<span>{{ t('message.pages.workflowList.wlFlowCategory') }}</span>
					<el-button size="small" text type="primary" @click="categoryManageVisible = true">{{ t('message.pages.workflowList.wlManage') }}</el-button>
				</div>
				<el-tree
					ref="categoryTreeRef"
					:data="categoryTree"
					node-key="id"
					default-expand-all
					:highlight-current="true"
					@node-click="handleCategoryClick"
				>
					<template #default="{ node, data }">
						<span class="custom-tree-node">
							<span class="node-label">{{ data.name || node.label }}</span>
							<span v-if="data.workflow_count !== undefined" class="node-count">({{ data.workflow_count }})</span>
						</span>
					</template>
				</el-tree>
			</div>

			<!-- Right list area -->
			<div class="right-content">
				<!-- View tab switcher -->
				<div class="share-view-tabs">
					<el-tabs v-model="shareViewTab" type="card" @tab-change="onShareViewTabChange">
						<el-tab-pane :label="t('message.global.all')" name="all" />
						<el-tab-pane :label="t('message.pages.workflowList.wlTabMine')" name="mine" />
						<el-tab-pane :label="t('message.pages.workflowList.wlTabPublic')" name="public" />
						<el-tab-pane v-if="hasFeature('WORKFLOW_SHARING')" :label="t('message.pages.workflowList.wlTabSharedToMe')" name="shared_to_me" />
						<el-tab-pane v-if="hasFeature('WORKFLOW_SHARING')" :label="t('message.pages.workflowList.wlTabSharedByMe')" name="shared_by_me" />
					</el-tabs>
				</div>

				<div class="list-wrap">
					<!-- Table view -->
					<div class="table-card" v-show="viewMode === 'table'">
						<el-table :data="workflowList" border stripe size="small" height="100%">
							<el-table-column prop="name" :label="t('message.pages.workflowList.wlColFlowName')" min-width="180">
								<template #default="{ row }">
									<span class="flow-name" @click="goEditor(row)">{{ row.name }}</span>
								</template>
							</el-table-column>
							<el-table-column prop="categoryName" :label="t('message.pages.workflowList.wlColCategory')" width="110" show-overflow-tooltip />
							<el-table-column :label="t('message.pages.workflowList.wlColVisibility')" width="90" align="center">
								<template #default="{ row }">
									<el-tag :type="row.auth_type === 'public' ? 'warning' : 'info'" size="small">{{
										row.auth_type === 'public' ? t('message.global.public') : t('message.global.private')
									}}</el-tag>
								</template>
							</el-table-column>
							<el-table-column :label="t('message.pages.workflowList.wlColNeedAudit')" width="70" align="center">
								<template #default="{ row }">
									<el-tag v-if="row.need_audit" size="small" type="warning" effect="dark">{{ t('message.global.yes') }}</el-tag>
									<span v-else style="color: #909399">-</span>
								</template>
							</el-table-column>
							<el-table-column :label="t('message.pages.workflowList.wlColStatus')" width="100" align="center">
								<template #default="{ row }">
									<el-tag :type="statusTagType(row.status_code)" size="small">{{ statusLabel(row.status_code) }}</el-tag>
								</template>
							</el-table-column>
							<el-table-column :label="t('message.pages.workflowList.wlColPublishStatus')" width="90" align="center">
								<template #default="{ row }">
									<template v-if="row.workflowMode === 'dag'">
										<el-tag v-if="row.dagPublished" type="success" size="small">{{ t('message.pages.workflowList.wlPublished') }}</el-tag>
										<el-tag v-else type="info" size="small" effect="plain">{{ t('message.pages.workflowList.wlNotPublished') }}</el-tag>
									</template>
									<span v-else style="color: #c0c4cc">-</span>
								</template>
							</el-table-column>
							<el-table-column :label="t('message.pages.workflowList.wlColSchedule')" width="120" align="center">
								<template #default="{ row }">
									<template v-if="row.hasSchedule">
										<el-switch v-model="row.scheduleEnabled" size="small" @change="() => handleToggleSchedule(row)" />
										<el-tooltip
											:content="
												t('message.pages.workflowList.wlScheduleType') +
												': ' +
												(row.scheduleType === 'cron'
													? t('message.pages.workflowList.wlScheduleCronShort')
													: row.scheduleType === 'interval'
													? t('message.pages.workflowList.wlScheduleInterval')
													: row.scheduleType === 'once'
													? t('message.pages.workflowList.wlScheduleOnce')
													: '-')
											"
											placement="top"
										>
											<el-icon :size="14" style="margin-left: 4px; vertical-align: middle; color: #909399; cursor: help"><QuestionFilled /></el-icon>
										</el-tooltip>
									</template>
									<span v-else style="color: #c0c4cc">{{ t('message.pages.workflowList.wlNotConfigured') }}</span>
								</template>
							</el-table-column>
							<el-table-column v-if="hasFeature('WORKFLOW_APPROVAL_FLOW')" :label="t('message.pages.workflowList.wlColPendingApprove')" width="80" align="center">
								<template #default="{ row }">
									<el-badge
										v-if="row.pending_approve_count && row.pending_approve_count > 0"
										:value="row.pending_approve_count"
										class="pending-badge"
										:title="
											t('message.pages.workflowList.wlPendingApproveTooltip') +
											row.pending_approve_count +
											t('message.pages.workflowList.wlItemsSuffix')
										"
									/>
									<span v-else style="color: #c0c4cc" :title="t('message.pages.workflowList.wlNoPendingApprove')">-</span>
								</template>
							</el-table-column>
							<el-table-column prop="nodeCount" :label="t('message.pages.workflowList.wlColNodeCount')" width="70" align="center" />
							<el-table-column prop="creator" :label="t('message.pages.workflowList.wlColOwner')" width="90" show-overflow-tooltip />
							<el-table-column v-if="hasFeature('WORKFLOW_SHARING')" :label="t('message.pages.workflowList.wlColShareTarget')" :width="shareViewTab === 'all' ? 90 : 120" align="center">
								<template #default="{ row }">
									<el-tooltip placement="top" :disabled="!row.share_summary || row.share_summary.total <= 0">
										<template #content>
											<div class="share-tip-box" v-if="row.share_summary && row.share_summary.total">
												<div v-if="row.share_summary.direct_count" style="margin-bottom: 6px">
													<b>{{ t('message.pages.workflowList.wlDirectShare') }}（{{ row.share_summary.direct_count }}）</b>
													<div style="max-height: 120px; overflow: auto; font-size: 12px; margin-top: 4px">
														<div v-for="(s, i) in row.share_summary.subjects" :key="'sub-' + i" style="padding: 2px 0">
															<el-tag size="small" effect="plain" style="margin-right: 4px">{{ s.subject_type_label }}</el-tag>
															<span>{{ s.subject_name }}</span>
															<span style="color: #909399; margin-left: 4px" v-if="s.perm_count"
																>{{ s.perm_count }}{{ t('message.pages.workflowList.wlPermCountSuffix') }}</span
															>
															<span style="color: #e6a23c" v-if="s.expire_time"> ⏳{{ formatExpire(s.expire_time) }}</span>
														</div>
													</div>
												</div>
												<div v-if="row.share_summary.link_count">
													<b>{{ t('message.pages.workflowList.wlShareLinks') }}（{{ row.share_summary.link_count }}）</b>
													<div style="max-height: 100px; overflow: auto; font-size: 12px; margin-top: 4px">
														<div v-for="(l, i) in row.share_summary.links" :key="'lk-' + i" style="padding: 2px 0">
															<el-tag size="small" type="warning" effect="plain" style="margin-right: 4px">
																{{
																	l.scope === 'anyone'
																		? t('message.pages.workflowList.wlScopeAnyone')
																		: t('message.pages.workflowList.wlScopeLoggedIn')
																}}
															</el-tag>
															<span>{{ l.name }}</span>
															<span style="color: #909399; margin-left: 4px">{{ l.access_count }}/{{ l.max_access || t('wlInfinitySymbol') }}{{ t('wlTimesSuffix') }}</span>
															<span style="color: #e6a23c" v-if="l.expire_time"> ⏳{{ formatExpire(l.expire_time) }}</span>
														</div>
													</div>
												</div>
											</div>
											<span v-else>{{ t('message.pages.workflowList.wlNoShare') }}</span>
										</template>
										<div class="share-cell" v-if="row.share_summary && row.share_summary.total">
											<el-tag v-if="shareViewTab === 'all'" size="small" type="success" effect="plain">
												{{ t('wlSharedCount', { n: row.share_summary.total }) }}
											</el-tag>
											<template v-else>
												<el-tag size="small" type="primary" effect="plain" v-if="row.share_summary.direct_count">
													{{ t('wlDirectCount', { n: row.share_summary.direct_count }) }}
												</el-tag>
												<el-tag size="small" type="warning" effect="plain" v-if="row.share_summary.link_count" style="margin-left: 2px">
													{{ t('wlLinkCount', { n: row.share_summary.link_count }) }}
												</el-tag>
											</template>
										</div>
										<span style="color: #c0c4cc" v-else>-</span>
									</el-tooltip>
								</template>
							</el-table-column>
							<el-table-column prop="exec_count" :label="t('message.pages.workflowList.wlColExecCount')" width="80" align="center" />
							<el-table-column :label="t('message.pages.workflowList.wlColLastExec')" min-width="150" show-overflow-tooltip>
								<template #default="{ row }">{{ row.lastExecTime }}</template>
							</el-table-column>
							<el-table-column prop="workflowMode" :label="t('message.pages.workflowList.wlColMode')" width="70" align="center">
								<template #default="{ row }">
									<el-tag v-if="row.workflowMode === 'dag'" type="warning" size="small">DAG</el-tag>
									<el-tag v-else size="small">{{ t('message.pages.workflowList.wlLinearMode') }}</el-tag>
								</template>
							</el-table-column>
							<el-table-column :label="t('message.global.actions')" width="320" fixed="right">
								<template #default="{ row }">
									<div class="row-ops">
										<el-button size="small" text @click="viewFlowDetail(row)" :disabled="opDisabled('detail', row)">
											<el-icon style="margin-right: 2px"><View /></el-icon>{{ t('message.global.detail') }}
										</el-button>
										<el-button size="small" text type="primary" @click="goEditor(row)" :disabled="opDisabled('edit', row)">
											<el-icon style="margin-right: 2px"><Edit /></el-icon>{{ t('message.global.edit') }}
										</el-button>
										<el-button
											v-if="hasFeature('WORKFLOW_DAG_ENGINE')"
											size="small"
											text
											type="primary"
											@click="publishFlow(row)"
											:loading="publishing"
											:disabled="opDisabled('publish', row)"
										>
											<el-icon style="margin-right: 2px"><Promotion /></el-icon>{{ t('message.pages.workflowList.wlBtnPublish') }}
										</el-button>
										<el-button size="small" text type="success" @click="execOnce(row)" :disabled="opDisabled('exec', row)">
											<el-icon style="margin-right: 2px"><VideoPlay /></el-icon>{{ t('message.pages.workflowList.wlBtnExecNow') }}
										</el-button>
										<el-dropdown trigger="click" @command="(cmd: string) => handleCardAction(cmd, row)">
											<el-button size="small" text type="info">
												{{ t('message.pages.workflowList.wlMore') }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
											</el-button>
											<template #dropdown>
												<el-dropdown-menu>
													<el-dropdown-item command="dryrun" :icon="Cpu" :disabled="opDisabled('dryrun', row)">{{
														t('message.pages.workflowList.wlMenuDryrun')
													}}</el-dropdown-item>
													<el-dropdown-item v-if="hasFeature('WORKFLOW_RISK_ASSESSMENT')" command="risk" :icon="WarningFilled" :disabled="opDisabled('risk', row)">{{
														t('message.pages.workflowList.wlMenuRiskAssess')
													}}</el-dropdown-item>
													<el-dropdown-item command="record" :icon="List" :disabled="opDisabled('record', row)">{{
														t('message.pages.workflowList.wlMenuExecRecord')
													}}</el-dropdown-item>
													<el-dropdown-item v-if="hasFeature('WORKFLOW_DAG_VERSIONING')" command="version" :icon="Clock" :disabled="opDisabled('version', row)">{{
														t('message.pages.workflowList.wlMenuVersionHistory')
													}}</el-dropdown-item>
													<el-dropdown-item command="copy" :icon="CopyDocument" :disabled="opDisabled('copy', row)">{{
														t('message.global.copy')
													}}</el-dropdown-item>
													<el-dropdown-item command="export" :icon="Download" :disabled="opDisabled('export', row)">{{
														t('message.global.export')
													}}</el-dropdown-item>
													<el-dropdown-item v-if="hasFeature('WORKFLOW_APPROVAL_FLOW')" command="approve" :icon="CircleCheckFilled" :disabled="opDisabled('approve', row)">{{
														t('message.pages.workflowList.wlMenuSubmitApprove')
													}}</el-dropdown-item>
													<el-dropdown-item
														command="toggle"
														:icon="row.status_code === 0 ? VideoPause : VideoPlay"
														:disabled="opDisabled('toggle', row)"
														>{{
															row.status_code === 0 ? t('message.pages.workflowList.wlDisable') : t('message.pages.workflowList.wlEnable')
														}}</el-dropdown-item
													>
													<el-dropdown-item v-if="hasFeature('WORKFLOW_SHARING')" command="share" :icon="Share" :disabled="opDisabled('share', row)">{{
														t('message.pages.workflowList.wlMenuShareManage')
													}}</el-dropdown-item>
													<el-dropdown-item command="delete" :icon="Delete" divided :disabled="opDisabled('delete', row)">{{
														t('message.global.delete')
													}}</el-dropdown-item>
												</el-dropdown-menu>
											</template>
										</el-dropdown>
									</div>
								</template>
							</el-table-column>
						</el-table>
					</div>

					<!-- Card view -->
					<div class="card-scroll" v-show="viewMode === 'card'">
						<div class="card-grid">
							<div class="flow-card" v-for="item in workflowList" :key="item.id">
								<div class="card-header">
									<span class="card-title" @click="goEditor(item)" :title="item.name">{{ item.name }}</span>
									<el-tag size="small" :type="statusTagType(item.status_code)" style="flex-shrink: 0">{{ statusLabel(item.status_code) }}</el-tag>
								</div>
								<div class="card-info">
									<span :title="t('message.pages.workflowList.wlNodeCount') + ': ' + item.nodeCount"
										>{{ t('message.pages.workflowList.wlNodeCount') }}:{{ item.nodeCount }}</span
									>
									<span :title="t('message.pages.workflowList.wlExecCount') + ': ' + (item.exec_count ?? 0)"
										>{{ t('message.pages.workflowList.wlExecCount') }}:{{ item.exec_count ?? 0 }}</span
									>
									<span class="card-owner" :title="t('message.pages.workflowList.wlOwner') + '：' + item.creator">{{ item.creator }}</span>
								</div>
								<div class="card-tags">
									<el-tag size="small" :type="item.auth_type === 'public' ? 'warning' : 'info'">{{
										item.auth_type === 'public' ? t('message.global.public') : t('message.global.private')
									}}</el-tag>
									<el-tag v-if="item.need_audit" size="small" type="warning" effect="dark">{{
										t('message.pages.workflowList.wlNeedAuditBadge')
									}}</el-tag>
									<template v-if="item.workflowMode === 'dag'">
										<el-tag v-if="item.dagPublished" size="small" type="success">{{ t('message.pages.workflowList.wlPublished') }}</el-tag>
										<el-tag v-else size="small" type="info" effect="plain">{{ t('message.pages.workflowList.wlNotPublished') }}</el-tag>
									</template>
									<el-tag v-if="item.hasSchedule" size="small" :type="item.scheduleEnabled ? 'success' : 'info'">{{
										item.scheduleEnabled ? t('message.pages.workflowList.wlScheduleEnabled') : t('message.pages.workflowList.wlScheduleDisabled')
									}}</el-tag>
									<el-tag
										v-if="item.pending_approve_count && item.pending_approve_count > 0"
										size="small"
										type="danger"
										:title="
											t('message.pages.workflowList.wlPendingApproveTooltip') +
											item.pending_approve_count +
											t('message.pages.workflowList.wlItemsSuffix')
										"
										>{{ t('message.pages.workflowList.wlPendingBadge') }}{{ item.pending_approve_count }}</el-tag
									>
								</div>
								<div class="card-footer">
									<span class="update-time" :title="t('message.pages.workflowList.wlUpdateTime') + '：' + item.updateTime">{{
										item.updateTime
									}}</span>
									<div class="card-actions">
										<el-button size="small" plain @click="viewFlowDetail(item)" :disabled="opDisabled('detail', item)"
											><el-icon><View /></el-icon
										></el-button>
										<el-button size="small" type="primary" plain @click="goEditor(item)" :disabled="opDisabled('edit', item)">{{
											t('message.global.edit')
										}}</el-button>
										<el-dropdown trigger="click" @command="(cmd: string) => handleCardAction(cmd, item)">
											<el-button size="small" plain>
												{{ t('message.pages.workflowList.wlMore') }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
											</el-button>
											<template #dropdown>
												<el-dropdown-menu>
													<el-dropdown-item command="detail" :icon="Files" :disabled="opDisabled('detail', item)">{{
														t('message.pages.workflowList.wlMenuViewDetail')
													}}</el-dropdown-item>
													<el-dropdown-item v-if="hasFeature('WORKFLOW_DAG_ENGINE')" command="publish" :icon="Promotion" :disabled="opDisabled('publish', item)">{{
														t('message.pages.workflowList.wlActionPublish')
													}}</el-dropdown-item>
													<el-dropdown-item command="dryrun" :icon="Cpu" :disabled="opDisabled('dryrun', item)">{{
														t('message.pages.workflowList.wlActionDryrun')
													}}</el-dropdown-item>
													<el-dropdown-item v-if="hasFeature('WORKFLOW_RISK_ASSESSMENT')" command="risk" :icon="WarningFilled" :disabled="opDisabled('risk', item)">{{
														t('message.pages.workflowList.wlActionRisk')
													}}</el-dropdown-item>
													<el-dropdown-item command="record" :icon="List" :disabled="opDisabled('record', item)">{{
														t('message.pages.workflowList.wlActionRecords')
													}}</el-dropdown-item>
													<el-dropdown-item v-if="hasFeature('WORKFLOW_DAG_VERSIONING')" command="version" :icon="Clock" :disabled="opDisabled('version', item)">{{
														t('message.pages.workflowList.wlActionVersions')
													}}</el-dropdown-item>
													<el-dropdown-item command="copy" :icon="CopyDocument" :disabled="opDisabled('copy', item)">{{
														t('message.global.copy')
													}}</el-dropdown-item>
													<el-dropdown-item command="export" :icon="Download" :disabled="opDisabled('export', item)">{{
														t('message.pages.workflowList.wlActionExport')
													}}</el-dropdown-item>
													<el-dropdown-item v-if="hasFeature('WORKFLOW_APPROVAL_FLOW')" command="approve" :icon="CircleCheckFilled" :disabled="opDisabled('approve', item)">{{
														t('message.pages.workflowList.wlMenuSubmitApprove')
													}}</el-dropdown-item>
													<el-dropdown-item
														command="toggle"
														:icon="item.status_code === 0 ? VideoPause : VideoPlay"
														:disabled="opDisabled('toggle', item)"
														>{{
															item.status_code === 0
																? t('message.pages.workflowList.wlActionDisable')
																: t('message.pages.workflowList.wlActionEnable')
														}}</el-dropdown-item
													>
													<el-dropdown-item v-if="hasFeature('WORKFLOW_SHARING')" command="share" :icon="Share" :disabled="opDisabled('share', item)">{{
														t('message.pages.workflowList.wlMenuShareManage')
													}}</el-dropdown-item>
													<el-dropdown-item command="delete" :icon="Delete" divided :disabled="opDisabled('delete', item)">{{
														t('message.global.delete')
													}}</el-dropdown-item>
												</el-dropdown-menu>
											</template>
										</el-dropdown>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="pagination-bar">
					<el-pagination
						v-model:current-page="page.current"
						v-model:page-size="page.size"
						:total="page.total"
						layout="total, prev, pager, next, jumper"
						@change="getFlowList"
					/>
				</div>
			</div>
		</div>

		<el-dialog
			v-model="versionDialogVisible"
			:title="t('message.pages.workflowList.wlVersionHistory') + ' - ' + (currentVersionFlow?.name || '')"
			width="600px"
		>
			<div v-loading="versionLoading">
				<el-table :data="versionList" border size="small" v-if="versionList.length > 0">
					<el-table-column prop="version" :label="t('message.pages.workflowList.wlColVersion')" width="80">
						<template #default="{ row }">
							<span style="font-weight: 600; color: #409eff">v{{ row.version }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="release_note" :label="t('message.pages.workflowList.wlColReleaseNote')" min-width="200">
						<template #default="{ row }">
							{{ row.release_note || '-' }}
						</template>
					</el-table-column>
					<el-table-column prop="create_datetime" :label="t('message.pages.workflowList.wlColReleaseTime')" width="160">
						<template #default="{ row }">
							{{ row.create_datetime?.slice(0, 16) || '-' }}
						</template>
					</el-table-column>
					<el-table-column :label="t('message.global.actions')" width="100">
						<template #default="{ row }">
							<el-button size="small" text type="warning" @click="rollbackVersion(row)">{{
								t('message.pages.workflowList.wlActionRollback')
							}}</el-button>
						</template>
					</el-table-column>
				</el-table>
				<el-empty v-else :description="t('message.pages.workflowList.wlNoPublishedVersions')" />
			</div>
			<template #footer>
				<el-button @click="versionDialogVisible = false">{{ t('message.global.close') }}</el-button>
			</template>
		</el-dialog>

		<!-- Category management dialog -->
		<el-dialog v-model="categoryManageVisible" :title="t('message.pages.workflowList.wlCategoryManage')" width="880px" top="6vh" destroy-on-close>
			<WorkflowCategoryManage @refresh="refreshCategoryTree" />
		</el-dialog>

		<!-- Risk assessment -->
		<RiskAssessmentDialog
			v-model="riskDialogVisible"
			:workflow-id="currentRiskWorkflow?.id || null"
			:workflow-name="currentRiskWorkflow?.name || ''"
			:with-sync-pending="!!(currentRiskWorkflow && currentRiskWorkflow.pending_approve_count > 0)"
			@refreshed="getFlowList"
		/>

		<!-- Submit for approval -->
		<el-dialog v-model="submitApproveVisible" :title="t('message.pages.workflowList.wlSubmitApproval')" width="520px" destroy-on-close>
			<el-form :model="submitForm" label-width="80px">
				<el-form-item :label="t('message.pages.workflowList.wlColFlowName')">
					<el-input :model-value="currentSubmitWorkflow?.name || ''" disabled />
				</el-form-item>
				<el-form-item :label="t('message.pages.workflowList.wlColSubmitDesc')">
					<el-input
						v-model="submitForm.submit_desc"
						type="textarea"
						:rows="4"
						:placeholder="t('message.pages.workflowList.wlPhSubmitDesc')"
						maxlength="300"
						show-word-limit
					/>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="submitApproveVisible = false">{{ t('message.global.cancel') }}</el-button>
				<el-button type="warning" :loading="submitting" @click="doSubmitApprove">{{ t('message.pages.workflowList.wlBtnConfirmSubmit') }}</el-button>
			</template>
		</el-dialog>

		<!-- Workflow details -->
		<el-dialog
			v-model="detailDialogVisible"
			:title="
				detailLoading
					? t('message.pages.workflowList.wlLoading')
					: t('message.pages.workflowList.wlFlowDetailTitle', { name: currentDetail?.name || '' })
			"
			width="680px"
			top="6vh"
			destroy-on-close
		>
			<div v-loading="detailLoading" class="detail-wrap">
				<div class="detail-header">
					<div class="detail-title">
						<h3>{{ currentDetail?.name || '-' }}</h3>
						<div class="detail-badges" style="margin-top: 4px; display: flex; gap: 6px; flex-wrap: wrap">
							<el-tag size="small" :type="statusTagType(currentDetail?.status_code)">{{ statusLabel(currentDetail?.status_code) }}</el-tag>
							<el-tag size="small" :type="currentDetail?.auth_type === 'public' ? 'warning' : 'info'">{{
								currentDetail?.auth_type === 'public' ? t('message.global.public') : t('message.global.private')
							}}</el-tag>
							<el-tag v-if="currentDetail?.need_audit" size="small" type="warning" effect="dark">{{
								t('message.pages.workflowList.wlNeedApproval')
							}}</el-tag>
							<el-tag v-if="currentDetail?.dagPublished" size="small" type="success">{{ t('message.pages.workflowList.wlPublished') }}</el-tag>
							<el-tag v-else-if="currentDetail?.workflowMode === 'dag'" size="small">{{ t('message.pages.workflowList.wlNotPublished') }}</el-tag>
							<el-tag v-if="currentDetail?.workflowMode === 'dag'" type="warning" size="small">DAG</el-tag>
							<el-tag v-else size="small">{{ t('message.pages.workflowList.wlLinearMode') }}</el-tag>
							<el-tag
								v-if="currentDetail?.pending_approve_count && currentDetail.pending_approve_count > 0"
								size="small"
								type="danger"
								:title="t('message.pages.workflowList.wlPendingApproveCount', { n: currentDetail.pending_approve_count })"
								>{{ t('message.pages.workflowList.wlPending') }} {{ currentDetail.pending_approve_count }}</el-tag
							>
						</div>
					</div>
				</div>

				<el-descriptions :column="2" border size="small" style="margin-top: 12px">
					<el-descriptions-item :label="t('message.pages.workflowList.wlColFlowId')">
						<el-icon><Coin /></el-icon> {{ currentDetail?.id || '-' }}
					</el-descriptions-item>
					<el-descriptions-item :label="t('message.pages.workflowList.wlColCategory')">
						<el-icon><Files /></el-icon> {{ currentDetail?.categoryName || currentDetail?.category?.name || '-' }}
					</el-descriptions-item>
					<el-descriptions-item :label="t('message.pages.workflowList.wlColCreatorOwner')">
						<el-icon><User /></el-icon> {{ currentDetail?.creator || '-' }}
					</el-descriptions-item>
					<el-descriptions-item :label="t('message.pages.workflowList.wlColNodeCount')">
						<el-icon><List /></el-icon>
						{{
							currentDetail?.nodeCount ??
							(currentDetail?.graph_definition?.nodes?.length ||
								currentDetail?.definition?.nodes?.length ||
								(Array.isArray(currentDetail?.steps) ? currentDetail.steps.length : 0) ||
								0)
						}}
					</el-descriptions-item>
					<el-descriptions-item :label="t('message.pages.workflowList.wlColExecCount')">
						<el-icon><Cpu /></el-icon> {{ currentDetail?.exec_count ?? 0 }}
					</el-descriptions-item>
					<el-descriptions-item :label="t('message.pages.workflowList.wlColCreatedAt')">
						<el-icon><Calendar /></el-icon> {{ currentDetail?.create_datetime || currentDetail?.createTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item :label="t('message.pages.workflowList.wlColUpdatedAt')">
						<el-icon><Calendar /></el-icon> {{ currentDetail?.update_datetime || currentDetail?.updateTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item :label="t('message.pages.workflowList.wlColLastExec')">
						<el-icon><Stamp /></el-icon> {{ currentDetail?.lastExecTime || '-' }}
					</el-descriptions-item>
					<el-descriptions-item
						:label="t('message.pages.workflowList.wlColLatestVer')"
						v-if="currentDetail?.dag_published_version_id || currentDetail?.dagLatestVersion"
					>
						<el-tag size="small" type="success"
							>v{{ currentDetail?.dagLatestVersion?.version || currentDetail?.dag_published_version_id || '-' }}</el-tag
						>
						<span v-if="currentDetail?.dagLatestVersion?.release_note" style="margin-left: 8px; color: #909399; font-size: 12px">
							{{ currentDetail.dagLatestVersion.release_note }}
						</span>
					</el-descriptions-item>
					<el-descriptions-item :label="t('message.pages.workflowList.wlColApprovalStatus')" v-if="currentDetail?.current_approve_status">
						{{ currentDetail?.current_approve_status }}
					</el-descriptions-item>
				</el-descriptions>

				<div class="detail-section" v-if="currentDetail?.description || currentDetail?.desc">
					<div class="detail-section-title">
						<el-icon><Files /></el-icon> {{ t('message.pages.workflowList.wlSectionFlowDesc') }}
					</div>
					<div class="detail-section-content">{{ currentDetail?.description || currentDetail?.desc }}</div>
				</div>

				<div class="detail-section" v-if="currentDetail?.release_note">
					<div class="detail-section-title">
						<el-icon><Promotion /></el-icon> {{ t('message.pages.workflowList.wlSectionReleaseNote') }}
					</div>
					<div class="detail-section-content">{{ currentDetail.release_note }}</div>
				</div>

				<div class="detail-section" v-if="currentDetail?.global_envs && Object.keys(currentDetail.global_envs).length > 0">
					<div class="detail-section-title">
						<el-icon><Coin /></el-icon> {{ t('message.pages.workflowList.wlSectionGlobalEnv', { n: Object.keys(currentDetail.global_envs).length }) }}
					</div>
					<div class="detail-section-content">
						<el-table :data="Object.entries(currentDetail.global_envs).map(([k,v]) => ({ key: k, value: v as any }))" size="small" border>
							<el-table-column prop="key" :label="t('message.pages.workflowList.wlColEnvName')" width="200" />
							<el-table-column prop="value" :label="t('message.pages.workflowList.wlColEnvValue')" show-overflow-tooltip />
						</el-table>
					</div>
				</div>
			</div>
			<template #footer>
				<el-button @click="detailDialogVisible = false">{{ t('message.global.close') }}</el-button>
				<el-button
					type="primary"
					@click="
						currentDetail && goEditor(currentDetail);
						detailDialogVisible = false;
					"
					>{{ t('message.pages.workflowList.wlEnterEditor') }}</el-button
				>
			</template>
		</el-dialog>

		<!-- New orchestration workflow -->
		<el-dialog
			v-model="createDialogVisible"
			:title="t('message.pages.workflowList.wlCreateDialogTitle')"
			width="560px"
			destroy-on-close
			:close-on-click-modal="false"
		>
			<el-form :model="createForm" label-width="100px" ref="createFormRef" :rules="createRules">
				<el-form-item :label="t('message.pages.workflowList.wlColFlowName')" prop="name">
					<el-input v-model="createForm.name" :placeholder="t('message.pages.workflowList.wlPhFlowName')" maxlength="80" show-word-limit />
				</el-form-item>
				<el-form-item :label="t('message.pages.workflowList.wlColCategory')" prop="category">
					<el-tree-select
						v-model="createForm.category"
						:data="categoryFlatOptions"
						:props="{ label: 'label', value: 'value', children: 'children' }"
						:placeholder="t('message.pages.workflowList.wlPhSelectCategory')"
						clearable
						check-strictly
						style="width: 100%"
					/>
				</el-form-item>
				<el-form-item :label="t('message.pages.workflowList.wlColVisibility')" prop="auth_type">
					<el-radio-group v-model="createForm.auth_type">
						<el-radio value="private">
							<span
								><b>{{ t('message.pages.workflowList.wlPrivate') }}</b>{{ t('wlPrivateDescSuffix') }}</span
							>
						</el-radio>
						<el-radio value="public">
							<span
								><b>{{ t('message.global.public') }}</b> - {{ t('message.pages.workflowList.wlPublicDesc') }}</span
							>
						</el-radio>
					</el-radio-group>
				</el-form-item>
				<el-form-item :label="t('message.pages.workflowList.wlNeedApproval')">
					<div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap">
						<el-switch v-model="createForm.need_audit" />
						<span class="el-form-item__label" style="font-size: 13px; color: #909399; font-weight: normal">
							{{ createForm.need_audit ? t('message.pages.workflowList.wlAuditOn') : t('message.pages.workflowList.wlAuditOff') }}
						</span>
					</div>
				</el-form-item>
				<el-form-item :label="t('message.pages.workflowList.wlColFlowDesc')">
					<el-input
						v-model="createForm.description"
						type="textarea"
						:rows="3"
						:placeholder="t('message.pages.workflowList.wlPhFlowDesc')"
						maxlength="300"
						show-word-limit
					/>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="createDialogVisible = false">{{ t('message.global.cancel') }}</el-button>
				<el-button type="primary" :loading="createSubmitting" @click="doCreateWorkflow">{{
					t('message.pages.workflowList.wlBtnConfirmAndEnter')
				}}</el-button>
			</template>
		</el-dialog>

		<!-- Share management dialog -->
		<ShareManageDialog
			v-model="shareManageVisible"
			resource-type="workflow"
			:resource-id="currentShareWorkflow?.id ?? null"
			:resource-name="currentShareWorkflow?.name"
			@change="getFlowList"
		/>

		<!-- Publish + approver selection dialog -->
		<el-dialog
			v-model="publishApprovalDialogVisible"
			:title="t('message.pages.workflowList.wlPublishApprovalTitle', { name: publishApprovalRow?.name || '' })"
			width="640px"
			:close-on-click-modal="false"
			destroy-on-close
		>
			<el-form label-width="90px">
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
						{{ t('message.pages.workflowList.wlModeDesc') }}
					</div>
				</el-form-item>

				<el-form-item
					v-if="publishApprovalTemp.approval_mode === 'any' || (publishApprovalTemp.approver_ids || []).length > 0"
					:label="t('message.pages.workflowList.wlColOrSigner')"
				>
					<UserSearch v-model="publishApprovalTemp.approver_ids" multiple :placeholder="t('message.pages.workflowList.wlPhSelectOrSigner')" />
				</el-form-item>

				<el-form-item
					v-if="publishApprovalTemp.approval_mode === 'all' || (publishApprovalTemp.countersign_ids || []).length > 0"
					:label="t('message.pages.workflowList.wlColAndSigner')"
				>
					<UserSearch v-model="publishApprovalTemp.countersign_ids" multiple :placeholder="t('message.pages.workflowList.wlPhSelectAndSigner')" />
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
				<el-button type="primary" :loading="publishApprovalSubmitting" @click="confirmPublishWithApproval">
					{{ t('message.pages.workflowList.wlBtnSubmitAndPublish') }}
				</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, h } from 'vue';
import { ElMessage, ElMessageBox, ElNotification, ElButton } from 'element-plus';
import {
	Search,
	ArrowDown,
	WarningFilled,
	List,
	Clock,
	CopyDocument,
	CircleCheckFilled,
	VideoPlay,
	VideoPause,
	Delete,
	Promotion,
	Cpu,
	Download,
	View,
	Files,
	User,
	Calendar,
	Coin,
	Stamp,
	Edit,
	Share,
	QuestionFilled,
} from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useEditionStore } from '/@/editions';
import type { FormInstance, FormRules } from 'element-plus';
import {
	GetList,
	DelObj,
	TriggerWorkflow,
	GetDAGVersions,
	RollbackDAG,
	AddObj,
	toggleStatus as apiToggleStatus,
	toggleScheduleEnabled,
	copyWorkflow,
	submitApprove,
	getStats,
	PublishWorkflow,
	GetObj,
} from '/@/api/taurus/workflow/api';
import { GetTree as GetCategoryTree } from '/@/api/taurus/workflow/category';
import WorkflowCategoryManage from './components/WorkflowCategoryManage.vue';
import RiskAssessmentDialog from './components/RiskAssessmentDialog.vue';
import ShareManageDialog from '/@/views/taurus/components/ShareManageDialog.vue';
import UserSearch from '/@/components/UserSearch/index.vue';
import { request } from '/@/utils/service';
const { t } = useI18n();

const router = useRouter();
const editionStore = useEditionStore();
const hasFeature = (code: string) => editionStore.hasFeature(code);
const searchKey = ref('');
const viewMode = ref('table');
const shareViewTab = ref<'all' | 'mine' | 'public' | 'shared_to_me' | 'shared_by_me'>('all');
const currentCategoryId = ref<any>('all');
const workflowList = ref<any[]>([]);
const page = reactive({ current: 1, size: 15, total: 0 });
const categoryTree = ref<any[]>([]);
const categoryTreeRef = ref();
const categoryManageVisible = ref(false);
const shareManageVisible = ref(false);
const currentShareWorkflow = ref<any>(null);
const stats = reactive<Record<string, number>>({
	total: 0,
	public_count: 0,
	private_count: 0,
	normal_count: 0,
	disabled_count: 0,
	pending_approve: 0,
	archived_count: 0,
	today_exec: 0,
	total_exec: 0,
	dag_count: 0,
	linear_count: 0,
});

const createDialogVisible = ref(false);
const createSubmitting = ref(false);
const createFormRef = ref<FormInstance>();
const createForm = reactive({
	name: '',
	description: '',
	auth_type: 'private' as 'private' | 'public',
	need_audit: false,
	category: null as number | null,
});
const createRules: FormRules = {
	name: [
		{ required: true, message: t('message.pages.workflowList.wlFormNameRequired'), trigger: 'blur' },
		{ min: 2, max: 80, message: t('message.pages.workflowList.wlFormNameLength'), trigger: 'blur' },
	],
};
const categoryFlatOptions = ref<any[]>([]);

const statusTagType = (code: number) => {
	if (code === 0) return 'success';
	if (code === 1) return 'info';
	if (code === 2) return 'warning';
	if (code === 3) return 'danger';
	return 'info';
};
const statusLabel = (code: number | string) => {
	const n = Number(code);
	if (n === 0) return t('message.pages.workflowList.wlStatusNormal');
	if (n === 1) return t('message.pages.workflowList.wlStatusDisabled');
	if (n === 2) return t('message.pages.workflowList.wlStatusPending');
	if (n === 3) return t('message.pages.workflowList.wlStatusArchived');
	return '-';
};
const canSubmitApprove = (row: any) => {
	if (!row || !row.id) return false;
	// When status is 'pending approval', disallow re-submission (resubmitting is meaningless)
	const status = Number(row.status_code ?? 0);
	if (status === 2) return false;
	if (row.auth_type === 'public' || row.need_audit) return true;
	return false;
};

const CMD_TO_PERM: Record<string, string> = {
	detail: 'workflow:view',
	edit: 'workflow:edit',
	publish: 'workflow:publish',
	exec: 'workflow:execute',
	dryrun: 'workflow:trial_run',
	risk: 'workflow:view_risk',
	record: 'workflow:view_exec_history',
	version: 'workflow:view_version',
	copy: 'workflow:copy',
	export: 'workflow:export',
	approve: 'workflow:submit_approve',
	toggle: 'workflow:toggle_status',
	share: 'workflow:manage_share',
	delete: 'workflow:delete',
};

function hasSharePerm(row: any, permCode: string): boolean {
	if (!row) return false;
	// Permission aliases: execute implies trial_run (subset of execute)
	// Having edit (edit basic info / save) implies edit_graph / edit_steps / edit_hosts
	// But publish / rollback are independent — not implied by edit
	const aliasMap: Record<string, string[]> = {
		'workflow:trial_run': ['workflow:execute'],
		'workflow:edit_graph': ['workflow:edit'],
		'workflow:edit_steps': ['workflow:edit'],
		'workflow:edit_hosts': ['workflow:edit'],
	};
	const isPublic = row.auth_type === 'public';
	const aliases = aliasMap[permCode] || [];
	const needPerms = [permCode, ...aliases];
	// 1) Backend explicitly returns non-empty current_perms array → enable strict matching
	if (row.current_perms && Array.isArray(row.current_perms) && row.current_perms.length > 0) {
		return needPerms.some((p) => row.current_perms.includes(p));
	}
	// Default public workflow permissions (kept in sync with backend DEFAULT_PUBLIC_WORKFLOW_PERMS, as fallback)
	const publicDefault: Set<string> = new Set([
		'workflow:view',
		'workflow:view_version',
		'workflow:view_exec_history',
		'workflow:view_risk',
		'workflow:view_approval',
		'workflow:trial_run',
		'workflow:copy',
	]);
	// 2) current_perms empty []: backend explicitly injected but empty → only public workflows fall back to default perms
	if (row.current_perms && Array.isArray(row.current_perms)) {
		if (!isPublic) return false;
		if (needPerms.some((p) => publicDefault.has(p))) return true;
		return false;
	}
	// 3) No current_perms field at all (legacy / stale cache etc.): conservative fallback; API gates it
	// 3.1 Public workflows fall back to default permissions
	if (isPublic && needPerms.some((p) => publicDefault.has(p))) return true;
	// 3.2 View permission as ultimate fallback (for legacy data)
	if (permCode === 'workflow:view') return true;
	return false;
}

/**
 * Status + share permissions combined control button disabled state (both list and card views).
 *
 * Priority: share permissions > status rules
 *  - If user is not authorized for an action (only 'view' was shared, not 'execute/edit/...'), disable button immediately
 *  - Status rules follow original logic (see switch branches below)
 *
 * Actual status_code rules used:
 *   0 = enabled / 1 = disabled / 2 = pending approval
 *
 * Actions fall into three categories：
 *  ① View actions (detail / record / version / export): always allowed (for audit and review).
 *  ② Edit actions (edit / copy / publish / approve / risk):
 *     - Pending approval: publish / submit-for-approval disabled — prevent inconsistent edits during approval.
 *     - Edit/copy/risk assessment always allowed (even 'disabled' workflows can draft or be copied).
 *  ③ Execute actions (exec / dryrun): only allowed when status=0 'enabled'; disabled for disabled/pending approval
 *     (prevents 'accidental execution of disabled workflow' and 'running during inconsistent approval state').
 */
const opDisabled = (cmd: string, row: any): boolean => {
	if (!row || !cmd) return true;
	// ===== Share permissions take priority =====
	const needPerm = CMD_TO_PERM[cmd];
	if (needPerm && !hasSharePerm(row, needPerm)) {
		return true;
	}
	const status = Number(row.status_code ?? 0);

	switch (cmd) {
		// === 1. View actions: allowed in any status ===
		case 'detail':
		case 'record':
		case 'version':
		case 'export':
		case 'share':
			return false;

		// === 2. Edit actions ===
		case 'edit':
		case 'copy':
		case 'risk':
			return false; // Edit/copy/risk all allowed — disabled workflows can still draft or copy

		case 'publish':
			// No repeated publish during pending approval — let the pending version stay
			return status === 2;

		case 'approve':
			return !canSubmitApprove(row);

		// === 3. Execute actions ===
		case 'exec':
		case 'dryrun':
			// Only when 'enabled' (status=0) AND (non-DAG OR DAG published) can execute/dryrun
			if (status !== 0) return true;
			if (row.workflowMode === 'dag' && !row.dagPublished) return true;
			return false;

		// === toggle (disable / enable) ===
		case 'toggle':
			// Toggle disallowed during pending approval — in-progress workflows shouldn't be flippable
			return status === 2;

		// === Delete actions ===
		case 'delete':
			// Cannot delete during pending approval (cancel first or wait); allowed in other states
			return status === 2;

		default:
			return false;
	}
};

const execOnce = (row: any) => {
	const status = Number(row.status_code ?? 0);
	if (status !== 0) {
		ElMessage.warning(t('message.pages.workflowList.wlExecNotReady'));
		return;
	}
	if (row.workflowMode === 'dag' && !row.dagPublished) {
		ElMessage.warning(t('message.pages.workflowList.wlExecNeedPublish'));
		return;
	}
	handleCardAction('exec', row);
};

onMounted(() => {
	initCategoryTree();
	getFlowList();
	loadStats();
});

const loadStats = async () => {
	// CE 下 WORKFLOW_DAG_ENGINE 不存在，getStats 是 EE 专属（会 403）
	if (!hasFeature('WORKFLOW_DAG_ENGINE')) return;
	try {
		const res = await getStats();
		const d = res?.data || res || {};
		Object.assign(stats, d || {});
	} catch (_) {
		/* ignore */
	}
};

const flattenCategories = (nodes: any[]): any[] => {
	const walk = (list: any[]): any[] => {
		const out: any[] = [];
		list.forEach((n) => {
			if (n?.id !== 'all' && n?.virtual_root !== true && typeof n?.id === 'number') {
				const children = n.children?.length ? walk(n.children) : undefined;
				out.push({
					value: Number(n.id),
					label: `${n.name}${n.category_code ? ' [' + n.category_code + ']' : ''}`,
					children: children && children.length > 0 ? children : undefined,
				});
			} else if (n.children?.length) {
				out.push(...walk(n.children));
			}
		});
		return out;
	};
	return walk(nodes);
};

const initCategoryTree = async () => {
	try {
		const res = await GetCategoryTree();
		const data = res?.data || res || [];
		categoryTree.value =
			Array.isArray(data) && data.length > 0
				? data
				: [
						{
							id: 'all',
							name: t('wlAllFlowsDefault'),
							category_code: 'all',
							workflow_count: 0,
							children: [],
							virtual_root: true,
						},
				  ];
		categoryFlatOptions.value = flattenCategories(categoryTree.value);
		await nextTick();
		if (categoryTreeRef.value) {
			const root = categoryTree.value?.[0];
			if (root?.id !== undefined) {
				try {
					categoryTreeRef.value.setCurrentKey(root.id);
				} catch (_) {
					/* ignore: tree not ready */
				}
			}
		}
	} catch (e: any) {
		categoryTree.value = [
			{
				id: 'all',
				name: t('wlAllFlowsDefault'),
				category_code: 'all',
				workflow_count: 0,
				children: [],
				virtual_root: true,
			},
		];
		categoryFlatOptions.value = [];
	}
};

const refreshCategoryTree = async () => {
	await initCategoryTree();
	loadStats();
};

const getFlowList = async () => {
	try {
		const params: any = { page: page.current, limit: page.size };
		if (searchKey.value && searchKey.value.trim()) {
			params.search = searchKey.value.trim();
		}
		if (shareViewTab.value === 'mine') {
			params.mine = 'true';
		} else if (shareViewTab.value === 'public') {
			params.auth_type = 'public';
		} else if (shareViewTab.value === 'shared_to_me') {
			params.view = 'shared_to_me';
		} else if (shareViewTab.value === 'shared_by_me') {
			params.view = 'shared_by_me';
		} else {
			if (
				currentCategoryId.value !== 'all' &&
				currentCategoryId.value !== null &&
				currentCategoryId.value !== undefined &&
				typeof currentCategoryId.value === 'number'
			) {
				params.category = currentCategoryId.value;
			}
		}
		const res = await GetList(params);
		// dvadmin paginated structure: { code,msg,page,limit,total,is_next,is_previous, data: [records] }
		// dvadmin non-paginated: { code,msg,data: [records] }
		const pageArr = Array.isArray(res?.data) ? res.data : res?.data?.results || res?.data || [];
		const results = pageArr;
		page.total = (res as any)?.total ?? (res as any)?.count ?? results.length;
		workflowList.value = results.map((item: any) => ({
			id: item.id,
			name: item.name,
			categoryName: item.category_name || item.category?.name || item.category || '-',
			category: item.category,
			nodeCount: item.steps_count || item.graph_definition?.nodes?.length || 0,
			creator: item.creator_name || item.creator?.name || item.creator || '-',
			auth_type: item.auth_type_display || item.auth_type || (item.share ? 'public' : 'private'),
			need_audit: !!item.need_audit,
			status_code: typeof item.status === 'number' ? item.status : 0,
			pending_approve_count: Number(item.pending_approve_count || 0),
			exec_count: Number(item.exec_count || 0),
			desc: item.description || '',
			lastExecTime: item.last_exec_time ? String(item.last_exec_time).replace('T', ' ').slice(0, 16) : '-',
			updateTime: item.update_datetime?.slice(0, 16) || '-',
			workflowMode: item.workflow_mode || 'linear',
			dagPublished: !!item.dag_published_version_id,
			current_perms: item.current_perms || [],
			share_summary: item.share_summary || { total: 0, direct_count: 0, link_count: 0, subjects: [], links: [] },
			hasSchedule: !!item.has_schedule,
			scheduleEnabled: item.schedule_enabled !== false,
			scheduleType: item.schedule_type || '',
		}));
	} catch (e: any) {
		ElMessage.error(t('message.pages.workflowList.wlLoadListFail') + ': ' + (e?.message || e));
		workflowList.value = [];
		page.total = 0;
	}
};

const handleSearch = () => {
	page.current = 1;
	getFlowList();
};

const handleRefresh = () => {
	getFlowList();
	loadStats();
};

const handleCategoryClick = (node: any) => {
	currentCategoryId.value = node.id;
	if (shareViewTab.value !== 'all') {
		shareViewTab.value = 'all';
		ElMessage.info(t('message.pages.workflowList.wlSwitchedAllView', { name: node.name || node.label }));
	} else {
		ElMessage.info(t('message.pages.workflowList.wlFilterCategory', { name: node.name || node.label }));
	}
	page.current = 1;
	getFlowList();
};

const onShareViewTabChange = () => {
	currentCategoryId.value = 'all';
	page.current = 1;
	getFlowList();
	if (categoryTreeRef.value) {
		const root = categoryTree.value?.[0];
		if (root?.id !== undefined) {
			try {
				categoryTreeRef.value.setCurrentKey(root.id);
			} catch (_) {
				/* ignore */
			}
		}
	}
};

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
		return `${mm}-${dd} ${hh}:${mi} ${t('message.pages.workflowList.wlExpire')}`;
	} catch (e) {
		return '';
	}
}

const resetCreateForm = () => {
	createForm.name = '';
	createForm.description = '';
	createForm.auth_type = 'private';
	createForm.need_audit = false;
	createForm.category = currentCategoryId.value !== 'all' && typeof currentCategoryId.value === 'number' ? currentCategoryId.value : null;
	createFormRef.value?.resetFields();
};
const createWorkflow = () => {
	resetCreateForm();
	createDialogVisible.value = true;
};
const doCreateWorkflow = async () => {
	if (!createFormRef.value) return;
	try {
		await createFormRef.value.validate();
	} catch (_) {
		return;
	}
	createSubmitting.value = true;
	try {
		const limit = editionStore.getQuota('max_workflows');
		if (limit != null && stats.total >= limit) {
			const desc = eeT('workflowQuotaExceededDesc', '')
				|| t('message.pages.edition.workflowQuotaExceededDesc', {
					current: String(stats.total),
					limit: String(limit),
					fallback: `社区版工作流配额已用满（上限 ${limit} 条），升级企业版可解锁更多配额。`,
				} as any);
			triggerEeUpgrade('WORKFLOW_DAG_ENGINE', typeof desc === 'string' ? desc : String(desc));
			return;
		}
		const payload: Record<string, any> = {
			name: createForm.name.trim(),
			description: createForm.description || '',
			workflow_mode: 'dag',
			status: 0,
			auth_type: createForm.auth_type,
			need_audit: !!createForm.need_audit,
			hosts: [],
			global_envs: {},
			graph_definition: { nodes: [], edges: [], vars: [] },
		};
		if (createForm.category) {
			payload.category = Number(createForm.category);
		}
		const res = await AddObj(payload);
		const id = res?.data?.id || res?.id;
		if (!id) {
			ElMessage.error(t('message.pages.workflowList.wlCreateNoId'));
			return;
		}
		ElMessage.success(t('message.pages.workflowList.wlCreateSuccessEntering'));
		createDialogVisible.value = false;
		router.push(`/workflow/editor/${id}`);
	} catch (e: any) {
		const msg = (e?.message || '') as string;
		const isQuotaErr = typeof msg === 'string' && (/工作流.*配额|max_workflows|quota.*workflow/i).test(msg);
		if (isQuotaErr) {
			triggerEeUpgrade('WORKFLOW_DAG_ENGINE', msg);
			return;
		}
		ElMessage.error(t('message.pages.workflowList.wlCreateFail') + ': ' + (e?.message || e));
	} finally {
		createSubmitting.value = false;
	}
};
const goEditor = (row: any) => {
	// Only view permission: use detail dialog, don't open editor — avoids confusing users
	const hasAnyWritePerm =
		hasSharePerm(row, 'workflow:edit') ||
		hasSharePerm(row, 'workflow:edit_graph') ||
		hasSharePerm(row, 'workflow:edit_steps') ||
		hasSharePerm(row, 'workflow:edit_hosts') ||
		hasSharePerm(row, 'workflow:publish') ||
		hasSharePerm(row, 'workflow:rollback');
	if (!hasAnyWritePerm && hasSharePerm(row, 'workflow:view')) {
		viewFlowDetail(row);
		return;
	}
	router.push(`/workflow/editor/${row.id}`);
};
const viewRecord = (row: any) => router.push(`/workflow/record?flowId=${row.id}`);

// ---------- EE 升级拦截通用 helpers ----------
const eeT = (key: string, fallback: string) => {
	const { t: tl } = useI18n();
	try {
		const v = tl(`message.pages.edition.${key}`);
		if (typeof v === 'string' && v && v !== `message.pages.edition.${key}`) return v;
	} catch (_e) { /* noop */ }
	return fallback;
};
const triggerEeUpgrade = (code: string, customDesc?: string) => {
	ElMessageBox.confirm(
		customDesc || eeT('enterpriseOnlyDesc', '该功能仅在 Taurus Ops 企业版中提供。升级到企业版即可解锁审批流、工作流、知识工单等全部高级能力。'),
		eeT('enterpriseOnlyTitle', '企业版专属功能'),
		{
			confirmButtonText: eeT('upgradeAction', '立即升级'),
			cancelButtonText: eeT('dismiss', '稍后再说'),
			type: 'info',
			showCancelButton: true,
			closeOnClickModal: true,
		}
	).then(() => {
		window.dispatchEvent(new CustomEvent('taurus:edition-upgrade', { detail: { code } }));
	}).catch(() => { /* 用户取消 */ });
};

const goApproveCenter = () => router.push('/workflow/approval');
// 顶部「审批中心」按钮：EE 正常跳转 / CE 弹升级提醒
const onApprovalCenterBtnClick = () => {
	if (hasFeature('WORKFLOW_APPROVAL_FLOW')) {
		goApproveCenter();
		return;
	}
	triggerEeUpgrade('WORKFLOW_APPROVAL_FLOW');
};
// 统计卡「待审批」：EE 正常跳转审批中心 / CE 弹升级提醒
const onApprovalStatCardClick = () => {
	if (hasFeature('WORKFLOW_APPROVAL_FLOW')) {
		goApproveCenter();
		return;
	}
	triggerEeUpgrade('WORKFLOW_APPROVAL_FLOW');
};

// Publish workflow
const publishing = ref(false);
const publishApprovalDialogVisible = ref(false);
const publishApprovalSubmitting = ref(false);
const publishApprovalRow = ref<any>(null);
const publishApprovalWf = ref<any>(null);
const publishApprovalTemp = reactive({
	release_note: '',
	approval_mode: 'any' as 'any' | 'all',
	approver_ids: [] as number[],
	countersign_ids: [] as number[],
	submit_desc: '',
});
const publishApprovalUserList = ref<any[]>([]);
async function loadPublishApprovalUsers(keyword = '') {
	try {
		const res: any = await request({
			url: '/api/taurus/user-options/',
			method: 'get',
			params: { limit: 300, search: keyword },
		});
		publishApprovalUserList.value = res.data?.results || res.data || [];
	} catch (_e) {
		// ignore
	}
}
function listDetectNeedApproval(row: any, wf: any): boolean {
	return !!(row?.need_audit || wf?.need_audit || row?.auth_type === 'public' || wf?.auth_type === 'public');
}
async function confirmPublishWithApproval() {
	const anyCount = (publishApprovalTemp.approver_ids || []).length;
	const allCount = (publishApprovalTemp.countersign_ids || []).length;
	publishApprovalSubmitting.value = true;
	try {
		const wf = publishApprovalWf.value || {};
		const row = publishApprovalRow.value || {};
		const resp: any = await PublishWorkflow(row.id, {
			definition: wf.definition,
			global_envs: wf.global_envs || {},
			release_note: publishApprovalTemp.release_note,
			approver_ids: anyCount > 0 ? publishApprovalTemp.approver_ids : undefined,
			countersign_ids: allCount > 0 ? publishApprovalTemp.countersign_ids : undefined,
			approval_mode: allCount > 0 ? 'all' : publishApprovalTemp.approval_mode || 'any',
			submit_desc: publishApprovalTemp.submit_desc,
		});
		publishApprovalDialogVisible.value = false;
		const needApproval = resp?.data?.need_approval === true;
		ElMessage.success(needApproval ? t('message.pages.workflowList.wlPublishSubmitted') : t('message.pages.workflowList.wlPublishSuccess'));
		getFlowList();
	} catch (e: any) {
		ElMessage.error(e?.message || t('message.pages.workflowList.wlPublishFail'));
	} finally {
		publishApprovalSubmitting.value = false;
	}
}
const publishFlow = async (row: any) => {
	try {
		const wfRes: any = await GetObj(row.id);
		const wf = wfRes?.data || wfRes || {};
		let definition: any = wf.graph_definition ?? wf.definition ?? null;
		if (!definition && Array.isArray(wf.steps) && wf.steps.length > 0) {
			definition = { workflow_mode: wf.workflow_mode || 'linear', steps: wf.steps };
		}
		if (!definition || !definition.nodes || definition.nodes.length === 0) {
			if (definition && Array.isArray(definition.steps) && definition.steps.length > 0) {
				// Linear mode has steps and can also be published
			} else {
				ElMessage.warning(t('message.pages.workflowList.wlNoNodes'));
				return;
			}
		}
		publishing.value = true;
		// Check whether approval is required
		if (listDetectNeedApproval(row, wf)) {
			// Open approver selection dialog
			publishApprovalRow.value = row;
			publishApprovalWf.value = { ...wf, definition };
			publishApprovalTemp.release_note = '';
			publishApprovalTemp.approval_mode = 'any';
			publishApprovalTemp.approver_ids = Array.isArray(wf.custom_approver_ids)
				? [...wf.custom_approver_ids]
				: Array.isArray(row.custom_approver_ids)
				? [...row.custom_approver_ids]
				: [];
			publishApprovalTemp.countersign_ids = [];
			publishApprovalTemp.submit_desc = '';
			publishApprovalDialogVisible.value = true;
			if (publishApprovalUserList.value.length === 0) loadPublishApprovalUsers();
			return;
		}
		// No approval needed: reuse the original prompt for release notes
		const { value: releaseNote }: any = await ElMessageBox.prompt(
			t('message.pages.workflowList.wlPromptReleaseNote'),
			t('message.pages.workflowList.wlPromptPublishTitle', { name: row.name }),
			{
				confirmButtonText: t('message.pages.workflowList.wlConfirmPublish'),
				cancelButtonText: t('message.global.cancel'),
				type: 'info',
				inputPlaceholder: t('message.pages.workflowList.wlReleaseNotePlaceholder'),
				inputPattern: /.{0,200}/,
				inputErrorMessage: t('message.pages.workflowList.wlReleaseNoteMaxLen'),
			}
		).catch(() => null);
		if (releaseNote === undefined) return;
		const resp: any = await PublishWorkflow(row.id, {
			definition,
			global_envs: wf.global_envs || {},
			release_note: releaseNote || '',
		});
		const needApproval = resp?.data?.need_approval === true;
		ElMessage.success(needApproval ? t('message.pages.workflowList.wlPublishSubmitted') : t('message.pages.workflowList.wlPublishSuccess'));
		getFlowList();
	} catch (e: any) {
		ElMessage.error(e?.message || t('message.pages.workflowList.wlPublishFail'));
	} finally {
		publishing.value = false;
	}
};

// Trial run (same as immediate execute, but only triggers on published workflows)
const dryRunFlow = async (row: any) => {
	const status = Number(row.status_code ?? 0);
	if (status !== 0) {
		ElMessage.warning(t('message.pages.workflowList.wlTrialRunNotReady'));
		return;
	}
	if (row.workflowMode === 'dag' && !row.dagPublished) {
		ElMessage.warning(t('message.pages.workflowList.wlTrialRunNeedPublish'));
		return;
	}
	try {
		const res: any = await TriggerWorkflow(row.id, {
			trigger_params: {},
			trigger_type: 'dryrun',
		});
		const execId = res?.data?.execution_id || res?.execution_id;
		ElNotification({
			title: t('message.pages.workflowList.wlTrialRunStartedTitle'),
			message: h('div', { style: 'line-height: 1.6;' }, [
				h('p', { style: 'margin: 4px 0;' }, t('message.pages.workflowList.wlTrialRunStartedBody', { name: row.name })),
				h('div', { style: 'margin-top: 8px; display: flex; gap: 8px;' }, [
					h(
						ElButton,
						{
							size: 'small',
							type: 'primary',
							onClick: () => {
								if (execId) router.push(`/workflow/record/${execId}`);
								else router.push(`/workflow/record?flowId=${row.id}&triggerType=dryrun`);
							},
						},
						() => t('message.pages.workflowList.wlViewThisTrialDetail')
					),
					h(
						ElButton,
						{
							size: 'small',
							onClick: () => router.push(`/workflow/record?flowId=${row.id}&triggerType=dryrun`),
						},
						() => t('message.pages.workflowList.wlViewAllTrialRuns')
					),
				]),
			]),
			type: 'warning',
			duration: 10000,
			showClose: true,
		});
	} catch (e: any) {
		ElMessage.error(e?.message || t('message.pages.workflowList.wlTrialRunFail'));
	}
};

// Export workflow (strictly reuse WorkflowEditor's useDagOperations.exportFlow output contract — no extra fields,
// guarantees editor import button can directly round-trip the result)
const exporting = ref(false);
const exportFlow = async (row: any) => {
	const baseName: string = String(row?.name || `workflow-${row?.id || 'export'}`);
	const safeName = baseName.replace(/[\\/:*?"<>|\r\n\t]+/g, '_').trim() || `workflow-${row?.id || 'export'}`;
	const dateStr = new Date().toISOString().slice(0, 10);
	const fileName = `${safeName}_${dateStr}.json`;

	try {
		exporting.value = true;

		// 1) Fetch detail: dvadmin SuccessResponse is {code, data: actual object, msg}, unwrap one level first;
		//    In some environments request directly returns response.data, so we do double compatibility.
		const resp = await GetObj(row.id);
		const detail: any =
			(resp && typeof resp === 'object' && (resp as any).data && typeof (resp as any).data === 'object' ? (resp as any).data : resp) || {};

		// 2) Compose definition: priority strictly follows "backend serializer real field" order, avoid exporting null again
		//    graph_definition stored by backend WorkflowSerializer is the real DAG definition,
		//    Linear mode steps can also be obtained from detail.steps, but the editor contract only needs one definition field,
		//    So if steps exist but graph_definition is empty, generate a compatible definition using the steps array
		let definition: any = detail?.graph_definition ?? detail?.definition ?? row?.graph_definition ?? row?.definition ?? null;
		if (definition == null && Array.isArray(detail?.steps)) {
			definition = { workflow_mode: detail?.workflow_mode || row?.workflow_mode || 'linear', steps: detail.steps };
		}
		if (definition == null) {
			definition = { nodes: [], edges: [] };
		}

		const globalEnvs: Record<string, any> = detail?.global_envs ?? row?.global_envs ?? detail?.variables ?? {};

		const description: string = String(detail?.description ?? row?.description ?? detail?.desc ?? row?.desc ?? '');

		// 3) 5 fields strictly align with useDagOperations.exportFlow's output structure:
		//    { name, description, global_envs, definition, exported_at }
		const exportData = {
			name: baseName,
			description,
			global_envs: globalEnvs && typeof globalEnvs === 'object' ? globalEnvs : {},
			definition,
			exported_at: new Date().toISOString(),
		};

		// 4) Pure frontend Blob download (same approach as editor exportFlow)
		const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		ElMessage.success(t('message.pages.workflowList.wlExportSuccess', { name: fileName }));
	} catch (e: any) {
		ElMessage.error(e?.message || t('message.pages.workflowList.wlExportFail'));
	} finally {
		exporting.value = false;
	}
};

// Card/list more actions dispatch
const handleCardAction = (cmd: string, row: any) => {
	// Entry fallback: even if button disabled is bypassed (e.g., direct programmatic call), intercept by status
	if (opDisabled(cmd, row)) {
		const s = statusLabel(row?.status_code);
		let reason = '';
		const status = Number(row?.status_code ?? 0);
		if ((cmd === 'exec' || cmd === 'dryrun') && status !== 0) {
			reason = t('message.pages.workflowList.wlOpDisabledReason');
		} else if (status === 2 && ['publish', 'approve', 'toggle', 'delete'].includes(cmd)) {
			reason = t('message.pages.workflowList.wlOpDisabledReasonPending');
		}
		ElMessage.warning(t('message.pages.workflowList.wlOpNotAllowed', { status: s, reason }));
		return;
	}
	switch (cmd) {
		case 'detail':
			viewFlowDetail(row);
			break;
		case 'publish':
			publishFlow(row);
			break;
		case 'dryrun':
			dryRunFlow(row);
			break;
		case 'export':
			exportFlow(row);
			break;
		case 'risk':
			openRiskDialog(row);
			break;
		case 'record':
			viewRecord(row);
			break;
		case 'version':
			viewVersions(row);
			break;
		case 'copy':
			copyFlow(row);
			break;
		case 'approve':
			openSubmitApprove(row);
			break;
		case 'toggle':
			handleToggleStatus(row);
			break;
		case 'delete':
			deleteFlow(row);
			break;
		case 'exec':
			doExecOnce(row);
			break;
		case 'share':
			openShareManage(row);
			break;
	}
};

function openShareManage(row: any) {
	if (opDisabled('share', row)) {
		ElMessage.warning(t('message.pages.workflowList.wlCannotManageShare'));
		return;
	}
	currentShareWorkflow.value = row;
	shareManageVisible.value = true;
}

const doExecOnce = async (row: any) => {
	const status = Number(row.status_code ?? 0);
	if (status !== 0) {
		ElMessage.warning(t('message.pages.workflowList.wlExecNotReady'));
		return;
	}
	if (row.workflowMode === 'dag' && !row.dagPublished) {
		ElMessage.warning(t('message.pages.workflowList.wlExecNeedPublish'));
		return;
	}
	if ((row.auth_type === 'public' || row.need_audit) && (row.pending_approve_count || 0) > 0) {
		try {
			await ElMessageBox.confirm(t('message.pages.workflowList.wlExecHasPendingApprove'), t('message.pages.workflowList.wlRiskTip'), {
				type: 'warning',
			});
		} catch {
			return;
		}
	}
	try {
		await TriggerWorkflow(row.id, {
			trigger_params: {},
			trigger_type: 'manual',
		});
		ElMessage.success(t('message.pages.workflowList.wlTriggered', { name: row.name }));
	} catch (e: any) {
		ElMessage.error(t('message.pages.workflowList.wlExecFail') + ': ' + (e?.message || ''));
	}
};

const copyFlow = async (row: any) => {
	try {
		const res = await copyWorkflow(row.id);
		const data = res?.data || res || {};
		const newName = data?.name || `${row.name} ${t('message.pages.workflowList.wlCopySuffix')}`;
		ElMessage.success(t('message.pages.workflowList.wlCopiedFlow', { name: newName }));
		getFlowList();
		loadStats();
	} catch (e: any) {
		ElMessage.error(t('message.global.copyFail') + ': ' + (e?.message || ''));
	}
};

const handleToggleStatus = async (row: any) => {
	try {
		const res = await apiToggleStatus(row.id);
		const d = res?.data || res || {};
		row.status_code = typeof d?.status === 'number' ? d.status : row.status_code === 0 ? 1 : 0;
		ElMessage.success(t('message.pages.workflowList.wlToggledTo', { status: statusLabel(row.status_code) }));
		getFlowList();
		loadStats();
	} catch (e: any) {
		ElMessage.error(t('message.pages.workflowList.wlToggleFail') + ': ' + (e?.message || ''));
	}
};

const handleToggleSchedule = async (row: any) => {
	try {
		const res = await toggleScheduleEnabled(row.id);
		const d = res?.data || res || {};
		row.scheduleEnabled = d?.schedule_enabled !== false;
		ElMessage.success(
			t('message.pages.workflowList.wlScheduleToggled', {
				state: row.scheduleEnabled ? t('message.pages.workflowList.wlEnable') : t('message.pages.workflowList.wlDisable'),
			})
		);
	} catch (e: any) {
		row.scheduleEnabled = !row.scheduleEnabled;
		ElMessage.error(t('message.pages.workflowList.wlOpFail') + ': ' + (e?.message || ''));
	}
};

const deleteFlow = async (row: any) => {
	await ElMessageBox.confirm(t('message.pages.workflowList.wlDeleteConfirmMsg', { name: row.name }), t('message.global.deleteConfirmTitle'), {
		type: 'warning',
	});
	try {
		await DelObj(row.id);
		ElMessage.success(t('message.global.deleteOk'));
		getFlowList();
		loadStats();
	} catch (e: any) {
		ElMessage.error(t('message.pages.workflowList.wlDeleteFail') + ': ' + (e?.message || ''));
	}
};

const versionDialogVisible = ref(false);
const versionList = ref<any[]>([]);
const versionLoading = ref(false);
const currentVersionFlow = ref<any>(null);

const viewVersions = async (row: any) => {
	currentVersionFlow.value = row;
	versionDialogVisible.value = true;
	versionLoading.value = true;
	try {
		const res = await GetDAGVersions(row.id);
		versionList.value = res?.data || res || [];
	} catch {
		versionList.value = [];
	} finally {
		versionLoading.value = false;
	}
};

const rollbackVersion = async (ver: any) => {
	if (!currentVersionFlow.value) return;
	await ElMessageBox.confirm(
		t('message.pages.workflowList.wlRollbackConfirmMsg', { v: ver.version }),
		t('message.pages.workflowList.wlRollbackConfirm'),
		{ type: 'warning' }
	);
	try {
		await RollbackDAG(currentVersionFlow.value.id, ver.id);
		ElMessage.success(t('message.pages.workflowList.wlRollbackSuccess', { v: ver.version }));
		viewVersions(currentVersionFlow.value);
		getFlowList();
	} catch (e: any) {
		ElMessage.error(t('message.pages.workflowList.wlRollbackFail') + ': ' + (e?.message || ''));
	}
};

// Risk assessment
const riskDialogVisible = ref(false);
const currentRiskWorkflow = ref<any>(null);
const openRiskDialog = (row: any) => {
	currentRiskWorkflow.value = row;
	riskDialogVisible.value = true;
};

// Workflow detail
const detailDialogVisible = ref(false);
const detailLoading = ref(false);
const currentDetail = ref<any>(null);
const viewFlowDetail = async (row: any) => {
	detailDialogVisible.value = true;
	detailLoading.value = true;
	currentDetail.value = { ...row };
	try {
		const res: any = await GetObj(row.id);
		const data = res?.data || res || {};
		currentDetail.value = { ...currentDetail.value, ...data };
		// creator may be overwritten by numeric ID from detail API, fallback to creator_name
		if (data.creator_name) {
			currentDetail.value.creator = data.creator_name;
		} else if (data.creator && typeof data.creator !== 'string') {
			currentDetail.value.creator = '-';
		}
		// Load latest published version
		try {
			const vRes: any = await GetDAGVersions(row.id);
			const vList: any[] = vRes?.data?.results || vRes?.data || vRes || [];
			if (vList && vList.length > 0) {
				currentDetail.value.dagLatestVersion = vList[0];
			}
		} catch {
			/* ignore: dag versions optional */
		}
	} catch (e: any) {
		ElMessage.error(e?.message || t('message.pages.workflowList.wlLoadDetailFail'));
	} finally {
		detailLoading.value = false;
	}
};

// Submit for approval
const submitApproveVisible = ref(false);
const currentSubmitWorkflow = ref<any>(null);
const submitForm = reactive({ submit_desc: '' });
const submitting = ref(false);
const openSubmitApprove = (row: any) => {
	currentSubmitWorkflow.value = row;
	submitForm.submit_desc = '';
	submitApproveVisible.value = true;
};
const doSubmitApprove = async () => {
	if (!currentSubmitWorkflow.value) return;
	submitting.value = true;
	try {
		await submitApprove(currentSubmitWorkflow.value.id, { submit_desc: submitForm.submit_desc });
		ElMessage.success(t('message.pages.workflowList.wlApprovalSubmitted'));
		submitApproveVisible.value = false;
		getFlowList();
		loadStats();
	} catch (e: any) {
		ElMessage.error(t('message.pages.workflowList.wlSubmitFail') + ': ' + (e?.message || ''));
	} finally {
		submitting.value = false;
	}
};
</script>

<style scoped lang="scss">
.workflow-list-page {
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
.approve-badge {
	margin-left: 6px;
}
.pending-badge :deep(.el-badge__content) {
	box-shadow: none;
}

.row-ops {
	display: inline-flex;
	align-items: center;
	gap: 2px;
	.el-dropdown {
		display: inline-flex;
		align-items: center;
	}
}

.page-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-shrink: 0;
	.title h2 {
		margin: 0 0 4px 0;
		font-size: 18px;
		color: #333;
	}
	.desc {
		font-size: 12px;
		color: #999;
	}
	.header-operate {
		display: flex;
		gap: 12px;
		align-items: center;
	}
}

.stat-board {
	flex-shrink: 0;
}
.stat-card-row {
	display: grid;
	grid-template-columns: repeat(6, 1fr);
	gap: 12px;
}
.stat-card {
	background: #fff;
	border-radius: 10px;
	padding: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	display: flex;
	flex-direction: column;
	gap: 6px;
	.stat-num {
		font-size: 26px;
		font-weight: 700;
		color: #303133;
	}
	.stat-label {
		font-size: 13px;
		color: #909399;
	}
	.stat-blue {
		color: #409eff;
	}
	.stat-orange {
		color: #e6a23c;
	}
	.stat-green {
		color: #67c23a;
	}
	.stat-purple {
		color: #a855f7;
	}
	.stat-red {
		color: #f56c6c;
	}
}

.page-main {
	flex: 1;
	display: flex;
	gap: 16px;
	overflow: hidden;
	min-height: 0;
}

.left-tree {
	width: 240px;
	background: #fff;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	padding: 12px 0;
	flex-shrink: 0;
	overflow: hidden;
	min-height: 0;
	display: flex;
	flex-direction: column;
	.tree-title {
		padding: 0 16px 12px;
		font-weight: 600;
		font-size: 15px;
		border-bottom: 1px solid #f0f0f0;
		margin-bottom: 8px;
		flex-shrink: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	:deep(.el-tree) {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}
	.custom-tree-node {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding-right: 8px;
		font-size: 13px;
		.node-label {
			flex: 1;
		}
		.node-count {
			color: #909399;
			font-size: 12px;
			margin-left: 4px;
		}
	}
}

.right-content {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 12px;
	overflow: hidden;
	min-height: 0;
}

.share-view-tabs {
	:deep(.el-tabs--card > .el-tabs__header .el-tabs__item) {
		border: none;
		border-right: 1px solid #e4e7ed;
		padding: 0 20px;
		height: 36px;
		line-height: 36px;
	}
	:deep(.el-tabs--card > .el-tabs__header) {
		border: 1px solid #e4e7ed;
		border-radius: 4px;
		background: #fff;
	}
	:deep(.el-tabs--card > .el-tabs__header .el-tabs__item.is-active) {
		background: #409eff;
		color: #fff;
		border-right-color: #409eff;
	}
	:deep(.el-tabs__nav-wrap::after) {
		display: none;
	}
}

.list-wrap {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	min-height: 0;
}

.table-card {
	flex: 1;
	background: #fff;
	border-radius: 8px;
	padding: 16px 20px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	min-height: 0;
}

.flow-name {
	color: #409eff;
	cursor: pointer;
	&:hover {
		text-decoration: underline;
	}
}

/* Card view - extremely compact */
.card-scroll {
	flex: 1 1 auto;
	overflow-y: auto;
	min-height: 0;
	display: block;
}
.card-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	grid-auto-rows: min-content;
	gap: 8px;
	align-items: start;
	align-content: start;
	width: 100%;
}
.flow-card {
	background: #fff;
	border-radius: 4px;
	padding: 6px 8px;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	display: flex;
	flex-direction: column;
	gap: 4px;
	transition: all 0.15s;
	border: 1px solid #ebeef5;
	box-sizing: border-box;
	&:hover {
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
		border-color: #dcdfe6;
	}
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 4px;
		line-height: 1.1;
	}
	.card-title {
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		color: #303133;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		&:hover {
			color: #409eff;
		}
	}
	.card-info {
		font-size: 11px;
		color: #909399;
		display: flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
		line-height: 1.2;
		.card-owner {
			max-width: 120px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
	.card-tags {
		display: flex;
		gap: 4px;
		align-items: center;
		flex-wrap: wrap;
		line-height: 1;
		:deep(.el-tag) {
			--el-tag-height: 18px;
			--el-tag-padding-horizontal: 5px;
			--el-tag-font-size: 11px;
		}
	}
	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 4px;
		line-height: 1;
		padding-top: 4px;
		border-top: 1px dashed #f0f0f0;
		.update-time {
			font-size: 10px;
			color: #c0c4cc;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			max-width: 85px;
		}
		.card-actions {
			display: flex;
			gap: 3px;
			flex-shrink: 0;
			align-items: center;
			.el-dropdown,
			.el-dropdown-link,
			:deep(.el-button) {
				--el-button-padding-sm: 2px 6px;
				--el-button-font-size-small: 11px;
				min-height: 22px;
				height: 22px;
			}
			:deep(.el-dropdown-menu__item) {
				--el-dropdown-menu-item-font-size: 12px;
				--el-dropdown-menu-item-height: 30px;
			}
		}
	}
}

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

/* Share object column */
.share-cell {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	:deep(.el-tag) {
		max-width: 100%;
	}
}
:deep(.share-tip-box) {
	font-size: 12px;
	line-height: 1.5;
	min-width: 200px;
	b {
		font-size: 12px;
		color: #606266;
	}
}

/* Workflow detail dialog */
.detail-wrap {
	.detail-header {
		padding: 6px 4px 10px;
		border-bottom: 1px dashed #ebeef5;
		h3 {
			margin: 0;
			font-size: 16px;
			color: #303133;
			font-weight: 600;
		}
	}
	.detail-section {
		margin-top: 16px;
		.detail-section-title {
			font-size: 13px;
			color: #606266;
			font-weight: 600;
			margin-bottom: 6px;
			display: flex;
			align-items: center;
			gap: 4px;
			&::before {
				content: '';
				display: inline-block;
				width: 3px;
				height: 13px;
				background: #409eff;
				border-radius: 2px;
				margin-right: 2px;
			}
		}
		.detail-section-content {
			padding: 8px 12px;
			background: #f7f9fc;
			border-radius: 4px;
			font-size: 13px;
			color: #606266;
			line-height: 1.6;
			white-space: pre-wrap;
			word-break: break-all;
		}
	}
}

/* ======== EE Gate 卡片置灰样式 ======== */
.ee-gate-card.is-ee-gate {
  cursor: not-allowed;
  position: relative;
  filter: grayscale(90%) opacity(0.65);
  background: repeating-linear-gradient(45deg, #fafafa, #fafafa 8px, #f4f4f5 8px, #f4f4f5 16px) !important;
  box-shadow: none !important;

  &:hover { transform: none !important; }
  .stat-num { user-select: none; }
}
</style>