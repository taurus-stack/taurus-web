<template>
	<el-dialog v-model="visible" :title="t('message.pages.programInstallTemplate.dialog.title')" width="1000px" top="3vh">
		<el-form :model="form" label-width="120px">
			<!-- Host selection area -->
			<el-form-item :label="t('message.pages.programInstallTemplate.dialog.selectHostsLabel')">
				<div style="display: flex; flex-direction: column; gap: 12px;">
					<!-- Quick-select buttons -->
					<div style="display: flex; gap: 8px; flex-wrap: wrap;">
						<el-button size="small" type="primary" plain @click="selectAllHosts">
							{{ t('message.pages.programInstallTemplate.dialog.selectAllButton') }} ({{ filteredHosts.length }})
						</el-button>
						<el-button size="small" type="success" plain @click="selectOnlineHosts">
							{{ t('message.pages.programInstallTemplate.dialog.selectOnlineButton') }} ({{ onlineHostsCount }})
						</el-button>
						<el-button size="small" type="warning" plain @click="selectOfflineHosts">
							{{ t('message.pages.programInstallTemplate.dialog.selectOfflineButton') }} ({{ offlineHostsCount }})
						</el-button>
						<el-button size="small" type="info" plain @click="clearSelection">
							{{ t('message.pages.programInstallTemplate.dialog.clearSelectionButton') }}
						</el-button>
					</div>
					
					<!-- Search and filter area -->
					<div style="display: flex; gap: 8px; flex-wrap: wrap;">
						<el-input 
							v-model="searchKeyword" 
							:placeholder="t('message.pages.programInstallTemplate.dialog.searchPlaceholder')" 
							clearable
							size="small"
							style="flex: 1; min-width: 200px;"
							:prefix-icon="Search"
						/>
						<el-select 
							v-model="form.onlineStatusFilter" 
							:placeholder="t('message.pages.programInstallTemplate.dialog.onlineStatusPlaceholder')" 
							clearable
							size="small"
							style="width: 120px;"
						>
							<el-option :label="t('message.pages.programInstallTemplate.dialog.status.all')" value="all" />
							<el-option :label="t('message.pages.programInstallTemplate.dialog.status.online')" value="online" />
							<el-option :label="t('message.pages.programInstallTemplate.dialog.status.offline')" value="offline" />
						</el-select>
						<el-select 
							v-model="form.hostStatusFilter" 
							:placeholder="t('message.pages.programInstallTemplate.dialog.approvalStatusPlaceholder')" 
							clearable
							size="small"
							style="width: 120px;"
						>
							<el-option :label="t('message.pages.programInstallTemplate.dialog.status.all')" value="all" />
							<el-option :label="t('message.pages.programInstallTemplate.dialog.status.pending')" :value="0" />
							<el-option :label="t('message.pages.programInstallTemplate.dialog.status.approved')" :value="1" />
							<el-option :label="t('message.pages.programInstallTemplate.dialog.status.rejected')" :value="2" />
							<el-option :label="t('message.pages.programInstallTemplate.dialog.status.disabled')" :value="3" />
						</el-select>
						<el-select 
							v-model="form.hostTypeFilter" 
							:placeholder="t('message.pages.programInstallTemplate.dialog.hostTypePlaceholder')" 
							clearable
							size="small"
							style="width: 140px;"
							multiple
							collapse-tags
							collapse-tags-tooltip
						>
							<el-option 
								v-for="type in availableHostTypes" 
								:key="type" 
								:label="type" 
								:value="type" 
							/>
						</el-select>
						<el-select 
							v-model="form.supervisorVersionFilter" 
							:placeholder="t('message.pages.programInstallTemplate.dialog.supervisorVersionPlaceholder')" 
							clearable
							size="small"
							style="width: 150px;"
							multiple
							collapse-tags
							collapse-tags-tooltip
						>
							<el-option 
								v-for="version in availableSupervisorVersions" 
								:key="version" 
								:label="version" 
								:value="version" 
							/>
						</el-select>
					</div>
					
					<!-- Host list -->
					<el-scrollbar style="max-height: 400px; border: 1px solid #e4e7ed; border-radius: 4px;">
						<el-checkbox-group v-model="form.host_ids" style="padding: 8px;">
							<el-checkbox 
								v-for="host in filteredHosts" 
								:key="host.id" 
								:label="host.id"
								style="display: block; padding: 6px 8px; border-radius: 4px; margin: 2px 0;"
								:class="{ 'el-checkbox--checked': form.host_ids.includes(host.id) }"
							>
								<div style="display: flex; align-items: center; gap: 8px; width: 100%;">
									<span style="font-weight: 500; min-width: 150px;">{{ host.host_name }}</span>
									<span style="color: #909399; min-width: 120px;">{{ host.host_ip }}</span>
									<el-tag 
										v-if="host.online_status === 1" 
										size="small" 
										type="success"
									>
										{{ t('message.pages.programInstallTemplate.dialog.status.online') }}
									</el-tag>
									<el-tag 
										v-else 
										size="small" 
										type="danger"
									>
										{{ t('message.pages.programInstallTemplate.dialog.status.offline') }}
									</el-tag>
									<el-tag 
										v-if="host.status === 0" 
										size="small" 
										type="warning"
									>
										{{ t('message.pages.programInstallTemplate.dialog.status.pending') }}
									</el-tag>
									<el-tag 
										v-else-if="host.status === 1" 
										size="small" 
										type="success"
									>
										{{ t('message.pages.programInstallTemplate.dialog.status.approved') }}
									</el-tag>
									<el-tag 
										v-else-if="host.status === 2" 
										size="small" 
										type="danger"
									>
										{{ t('message.pages.programInstallTemplate.dialog.status.rejected') }}
									</el-tag>
									<el-tag 
										v-else-if="host.status === 3" 
										size="small" 
										type="info"
									>
										{{ t('message.pages.programInstallTemplate.dialog.status.disabled') }}
									</el-tag>
									<el-tag 
										v-if="host.host_type && host.host_type !== 'unknown'" 
										size="small" 
										type="info"
									>
										{{ host.host_type }}
									</el-tag>
									<el-tag 
										v-if="host.supervisor_version" 
										size="small" 
										type="info"
									>
										Supervisor {{ host.supervisor_version }}
									</el-tag>
								</div>
							</el-checkbox>
						</el-checkbox-group>
					</el-scrollbar>
					
					<!-- Selection stats -->
					<div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #606266;">
						<span>{{ t('message.pages.programInstallTemplate.dialog.selectedStats') }} <strong style="color: #409eff;">{{ form.host_ids.length }}</strong> / {{ filteredHosts.length }}</span>
						<span style="color: #909399;">{{ t('message.pages.programInstallTemplate.dialog.totalHosts') }}: {{ hostList.length }} | {{ t('message.pages.programInstallTemplate.dialog.onlineHosts') }}: {{ onlineHostsCount }} | {{ t('message.pages.programInstallTemplate.dialog.offlineHosts') }}: {{ offlineHostsCount }}</span>
					</div>
				</div>
			</el-form-item>
			
			<!-- Installation method -->
			<el-form-item :label="t('message.pages.programInstallTemplate.dialog.installMethodLabel')">
				<el-radio-group v-model="form.auto_install" style="width: 100%">
					<el-radio :value="true">
						<span style="font-weight: 500">{{ t('message.pages.programInstallTemplate.dialog.autoInstall') }}</span>
						<span style="color: #909399; font-size: 12px; margin-left: 8px;">{{ t('message.pages.programInstallTemplate.dialog.autoInstallDesc') }}</span>
					</el-radio>
					<el-radio :value="false" style="margin-left: 20px;">
						<span style="font-weight: 500">{{ t('message.pages.programInstallTemplate.dialog.manualInstall') }}</span>
						<span style="color: #909399; font-size: 12px; margin-left: 8px;">{{ t('message.pages.programInstallTemplate.dialog.manualInstallDesc') }}</span>
					</el-radio>
				</el-radio-group>
			</el-form-item>
			
			<!-- Advanced options -->
			<el-form-item :label="t('message.pages.programInstallTemplate.dialog.advancedOptionsLabel')">
				<el-switch v-model="form.skip_existing" /> 
				<span style="margin-left: 8px; color: #606266;">{{ t('message.pages.programInstallTemplate.dialog.skipExisting') }}</span>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible = false">{{ t('message.pages.programInstallTemplate.dialog.cancelButton') }}</el-button>
			<el-button type="primary" @click="handleApply" :disabled="form.host_ids.length === 0">
				{{ confirmButtonText }}
			</el-button>
		</template>
	</el-dialog>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import * as api from '/@/api/taurus/program-install-template';
import { request } from '/@/utils/service';
import { i18n } from '/@/i18n';

// @ts-ignore — vue-i18n type inference chain too deep, runtime is fine
const t = i18n.global.t;

const props = defineProps({
	crudExpose: {
		type: Object,
		required: true,
	},
});

const visible = ref(false);
const form = ref({
	host_ids: [] as number[],
	auto_install: true,
	skip_existing: true,
	onlineStatusFilter: 'all' as string,
	hostStatusFilter: 'all' as string | number,
	hostTypeFilter: [] as string[],
	supervisorVersionFilter: [] as string[],
});

const hostList = ref<any[]>([]);
const searchKeyword = ref('');

// Online / offline host counts
const onlineHostsCount = computed(() => hostList.value.filter(h => h.online_status === 1).length);
const offlineHostsCount = computed(() => hostList.value.filter(h => h.online_status !== 1).length);

// Confirm button text (includes host count)
const confirmButtonText = computed(() => {
	if (form.value.host_ids.length === 0) {
		return t('message.pages.programInstallTemplate.dialog.confirmButton');
	}
	return t('message.pages.programInstallTemplate.dialog.confirmButtonWithCount', { count: form.value.host_ids.length });
});

// Available host type list
const availableHostTypes = computed(() => {
	const typeSet = new Set<string>();
	hostList.value.forEach(host => {
		if (host.host_type && host.host_type !== 'unknown') {
			typeSet.add(host.host_type);
		}
	});
	return Array.from(typeSet).sort();
});

// Available Supervisor version list
const availableSupervisorVersions = computed(() => {
	const versionSet = new Set<string>();
	hostList.value.forEach(host => {
		if (host.supervisor_version) {
			versionSet.add(host.supervisor_version);
		}
	});
	return Array.from(versionSet).sort();
});

// Filtered host list
const filteredHosts = computed(() => {
	let result = hostList.value;
	
	// Keyword search
	if (searchKeyword.value) {
		const keyword = searchKeyword.value.toLowerCase();
		result = result.filter(host => {
			return (
				host.host_name?.toLowerCase().includes(keyword) ||
				host.host_ip?.toLowerCase().includes(keyword)
			);
		});
	}
	
	// Online status filter
	if (form.value.onlineStatusFilter === 'online') {
		result = result.filter(host => host.online_status === 1);
	} else if (form.value.onlineStatusFilter === 'offline') {
		result = result.filter(host => host.online_status !== 1);
	}
	
	// Approval status filter
	if (form.value.hostStatusFilter !== 'all') {
		result = result.filter(host => host.status === form.value.hostStatusFilter);
	}
	
	// Host type filter
	if (form.value.hostTypeFilter.length > 0) {
		result = result.filter(host => 
			host.host_type && form.value.hostTypeFilter.includes(host.host_type)
		);
	}
	
	// Supervisor version filter
	if (form.value.supervisorVersionFilter.length > 0) {
		result = result.filter(host => 
			host.supervisor_version && form.value.supervisorVersionFilter.includes(host.supervisor_version)
		);
	}
	
	return result;
});

const fetchHostList = async () => {
	try {
		// Fetch all hosts (supports paginated fetch for large datasets)
		let allHosts: any[] = [];
		let page = 1;
		const pageSize = 1000;
		
		while (true) {
			const res = await request({ 
				url: '/api/taurus/host/', 
				method: 'get', 
				params: { page, page_size: pageSize } 
			});
			const pageData = res.data || [];
			allHosts = allHosts.concat(pageData);
			
			if (pageData.length < pageSize) {
				break;
			}
			page++;
		}
		
		hostList.value = allHosts;
	} catch (error) {
		ElMessage.error(t('message.pages.programInstallTemplate.messages.hostsLoadFailed'));
		hostList.value = [];
	}
};

// Currently selected template (passed in when row button clicked)
const selectedTemplate = ref<any>(null);

const open = (template?: any) => {
	visible.value = true;
	form.value.host_ids = [];
	form.value.auto_install = true;
	searchKeyword.value = '';
	selectedTemplate.value = template || null;
	fetchHostList();
};

// Select all hosts
const selectAllHosts = () => {
	if (filteredHosts.value.length > 100) {
		ElMessageBox.confirm(
			t('message.pages.programInstallTemplate.messages.selectAllConfirm', { count: filteredHosts.value.length }),
			t('message.pages.programInstallTemplate.messages.selectAllConfirmTitle'),
			{
				confirmButtonText: t('message.pages.programInstallTemplate.messages.selectAllConfirmOk'),
				cancelButtonText: t('message.pages.programInstallTemplate.messages.selectAllConfirmCancel'),
				type: 'warning'
			}
		).then(() => {
			form.value.host_ids = filteredHosts.value.map(host => host.id);
			ElMessage.success(t('message.pages.programInstallTemplate.messages.selectedCount', { count: filteredHosts.value.length }));
		}).catch(() => {
			// User cancelled selection
		});
	} else {
		form.value.host_ids = filteredHosts.value.map(host => host.id);
		ElMessage.success(t('message.pages.programInstallTemplate.messages.selectedCount', { count: filteredHosts.value.length }));
	}
};

// Select only online hosts
const selectOnlineHosts = () => {
	const onlineHosts = filteredHosts.value.filter(host => host.online_status === 1);
	form.value.host_ids = onlineHosts.map(host => host.id);
	ElMessage.success(t('message.pages.programInstallTemplate.messages.selectedOnlineCount', { count: onlineHosts.length }));
};

// Select only offline hosts
const selectOfflineHosts = () => {
	const offlineHosts = filteredHosts.value.filter(host => host.online_status !== 1);
	form.value.host_ids = offlineHosts.map(host => host.id);
	ElMessage.success(t('message.pages.programInstallTemplate.messages.selectedOfflineCount', { count: offlineHosts.length }));
};

// Clear selection
const clearSelection = () => {
	form.value.host_ids = [];
	ElMessage.success(t('message.pages.programInstallTemplate.messages.selectionCleared'));
};

const handleApply = async () => {
	if (form.value.host_ids.length === 0) {
		ElMessage.warning(t('message.pages.programInstallTemplate.messages.selectAtLeastOneHost'));
		return;
	}

	// Prefer template passed via row button; if none, get selected row from table
	let selectedRows: any[] = [];
	if (selectedTemplate.value) {
		selectedRows = [selectedTemplate.value];
	} else {
		const tableRef = props.crudExpose.getTableRef();
		selectedRows = tableRef?.getSelectionRows?.() || [];
	}
	
	if (selectedRows.length === 0) {
		ElMessage.warning(t('message.pages.programInstallTemplate.messages.selectTemplateFirst'));
		return;
	}

	// Large-scale deployment confirmation
	const totalOperations = form.value.host_ids.length * selectedRows.length;
	if (totalOperations > 100) {
		try {
			await ElMessageBox.confirm(
				t('message.pages.programInstallTemplate.messages.largeScaleConfirm', {
					totalOperations,
					templates: selectedRows.length,
					hosts: form.value.host_ids.length,
				}),
				t('message.pages.programInstallTemplate.messages.largeScaleConfirmTitle'),
				{
					confirmButtonText: t('message.pages.programInstallTemplate.messages.largeScaleConfirmOk'),
					cancelButtonText: t('message.pages.programInstallTemplate.messages.largeScaleConfirmCancel'),
					type: 'warning'
				}
			);
		} catch {
			ElMessage.info(t('message.pages.programInstallTemplate.messages.operationCancelled'));
			return;
		}
	}

	// Support batch-applying multiple templates (split into batches to avoid too many requests)
	const results: any[] = [];
	const batchSize = 50; // Process 50 hosts per batch
	const hostIds = form.value.host_ids;
	
	for (let i = 0; i < hostIds.length; i += batchSize) {
		const batchHostIds = hostIds.slice(i, i + batchSize);
		
		const batchPromises = selectedRows.map(async (template: any) => {
			try {
				await api.applyToHosts(template.id, {
					host_ids: batchHostIds,
					auto_install: form.value.auto_install,
					skip_existing: form.value.skip_existing,
				});
				return { success: true, template: template.name, hosts: batchHostIds.length };
			} catch (e: any) {
				return { success: false, template: template.name, error: e.message, hosts: batchHostIds.length };
			}
		});
		
		const batchResults = await Promise.all(batchPromises);
		results.push(...batchResults);
		
		// Add delay after batch processing to avoid excessive server load
		if (i + batchSize < hostIds.length) {
			await new Promise(resolve => setTimeout(resolve, 1000));
		}
	}

	// Stats results
	const totalSuccessHosts = results.filter(r => r.success).reduce((sum, r) => sum + r.hosts, 0);
	const totalFailHosts = results.filter(r => !r.success).reduce((sum, r) => sum + r.hosts, 0);

	let message = t('message.pages.programInstallTemplate.messages.applySuccess', { success: totalSuccessHosts });
	if (totalFailHosts > 0) {
		message = t('message.pages.programInstallTemplate.messages.applySuccessWithFail', { success: totalSuccessHosts, fail: totalFailHosts });
	}
	ElMessage.success(message);

	// Show failure details
	const failedResults = results.filter((r) => !r.success);
	if (failedResults.length > 0) {
		const errorDetails = failedResults.map((r) => t('message.pages.programInstallTemplate.messages.applyFailedDetailRow', { template: r.template, count: r.hosts, error: r.error })).join('\n');
		ElMessageBox.alert(errorDetails, t('message.pages.programInstallTemplate.messages.applyFailedDetailTitle'), {
			type: 'warning',
			confirmButtonText: t('message.pages.programInstallTemplate.messages.applyFailedDetailOk'),
			dangerouslyUseHTMLString: false
		});
	}

	visible.value = false;
	props.crudExpose.doRefresh();
};

defineExpose({ open });
</script>