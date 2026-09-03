<template>
	<div class="operation-logs">
		<el-card shadow="hover">
			<template #header>
				<div class="card-title">
					<el-icon><ele-DataAnalysis /></el-icon>
					<span>{{ t('message.pages.personal.logs.title') }}</span>
				</div>
			</template>
			<el-form :inline="true" :model="queryForm" class="mb15">
				<el-form-item :label="t('message.pages.personal.logs.keyword')">
					<el-input v-model="queryForm.keyword" :placeholder="t('message.pages.personal.logs.keywordPlaceholder')" clearable style="width: 220px" />
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="refreshLogs">
						<el-icon><ele-Search /></el-icon>
						{{ t('message.pages.personal.logs.search') }}
					</el-button>
					<el-button @click="resetQuery">{{ t('message.pages.personal.logs.reset') }}</el-button>
				</el-form-item>
			</el-form>
			<el-table :data="logList" style="width: 100%" v-loading="loading" stripe>
				<el-table-column prop="create_datetime" :label="t('message.pages.personal.logs.table.time')" width="180" />
				<el-table-column prop="request_modular" :label="t('message.pages.personal.logs.table.module')" width="160">
					<template #default="scope">
						<el-tag size="small" type="info">{{ scope.row.request_modular || '-' }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="request_method" :label="t('message.pages.personal.logs.table.method')" width="80">
					<template #default="scope">
						<el-tag size="small" :type="methodTag(scope.row.request_method)">{{ scope.row.request_method || '-' }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="request_msg" :label="t('message.pages.personal.logs.table.action')" min-width="260" show-overflow-tooltip>
					<template #default="scope">
						{{ scope.row.request_msg || scope.row.request_path || '-' }}
					</template>
				</el-table-column>
				<el-table-column prop="request_ip" :label="t('message.pages.personal.logs.table.ip')" width="140" />
				<el-table-column prop="status" :label="t('message.pages.personal.logs.table.result')" width="80">
					<template #default="scope">
						<el-tag size="small" :type="scope.row.status ? 'success' : 'danger'">
							{{ scope.row.status ? t('message.pages.personal.logs.success') : t('message.pages.personal.logs.failed') }}
						</el-tag>
					</template>
				</el-table-column>
			</el-table>
			<el-pagination
				class="mt15"
				background
				layout="total, prev, pager, next"
				:total="total"
				:page-size="pageSize"
				v-model:current-page="currentPage"
				@current-change="fetchLogs"
			/>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="PersonalOperationLogs">
import { reactive, ref, onMounted } from 'vue';
import * as api from '../api';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const loading = ref(false);
const total = ref(0);
const pageSize = ref(20);
const currentPage = ref(1);
const logList = ref<any[]>([]);
const queryForm = reactive({
	keyword: '',
});

const methodTag = (method: string) => {
	const map: Record<string, string> = {
		GET: '',
		POST: 'success',
		PUT: 'warning',
		DELETE: 'danger',
		PATCH: 'warning',
	};
	return map[method] || 'info';
};

const fetchLogs = () => {
	loading.value = true;
	const params: any = {
		page: currentPage.value,
		limit: pageSize.value,
		ordering: '-create_datetime',
	};
	if (queryForm.keyword) {
		params.search = queryForm.keyword;
	}
	api.getOperationLogs(params).then((res: any) => {
		if (res?.data) {
			logList.value = res.data.results || res.data || [];
			total.value = res.data.count || res.data.length || 0;
		} else {
			logList.value = [];
			total.value = 0;
		}
	}).catch(() => {
		logList.value = [];
		total.value = 0;
	}).finally(() => {
		loading.value = false;
	});
};

const refreshLogs = () => {
	currentPage.value = 1;
	fetchLogs();
};

const resetQuery = () => {
	queryForm.keyword = '';
	currentPage.value = 1;
	fetchLogs();
};

onMounted(() => {
	fetchLogs();
});
</script>

<style scoped lang="scss">
.operation-logs {
	.card-title {
		display: flex;
		align-items: center;
		gap: 6px;
		font-weight: 500;
	}
}
.mb15 {
	margin-bottom: 15px;
}
.mt15 {
	margin-top: 15px;
	display: flex;
	justify-content: flex-end;
}
</style>
