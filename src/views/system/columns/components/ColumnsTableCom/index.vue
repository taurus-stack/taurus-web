<template>
	<div class="columns-table-com">
		<p class="ctc-title">{{ t('message.fieldPermission') }}</p>

		<div class="ctc-head">
			<el-button type="primary" @click="handleUpdateColumn('create')">{{ t('message.segNewHost') }}</el-button>
			<el-button type="primary" @click="handleAutomatch">{{ t('message.autoMatch') }}</el-button>
		</div>

		<el-table :data="state.data" border v-loading="state.loading" class="ctc-table">
			<el-table-column prop="field_name" :label="t('message.importExcel.fieldName')" />
			<el-table-column prop="title" :label="t('message.importExcel.colName')" />
			<el-table-column :label="t('message.importExcel.operation')" width="180" align="center">
				<template #default="scope">
					<el-button type="primary" @click="handleUpdateColumn('update', scope.row)">{{ t('message.edit') }}</el-button>
					<el-button type="danger" @click="handleDelete(scope.row)">{{ t('message.delete') }}</el-button>
				</template>
			</el-table-column>
		</el-table>

		<div class="ctc-pagination">
			<el-pagination
				v-model:current-page="searchParams.page"
				v-model:page-size="searchParams.limit"
				:page-sizes="[5, 10, 20, 50]"
				:total="state.total"
				background
				layout="total, sizes, prev, pager, next, jumper"
				@size-change="handleSizeChange"
				@current-change="handleCurrentChange"
			/>
		</div>

		<el-drawer v-model="drawerVisible" :title="t('message.fieldPermission')" direction="rtl" size="500px" :close-on-click-modal="false" :before-close="handleDrawerClose">
			<ColumnsFormCom v-if="drawerVisible" :currentInfo="props.currentInfo" :initFormData="drawerFormData" @drawerClose="handleDrawerClose" />
		</el-drawer>
	</div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { ElMessageBox } from 'element-plus';
import ColumnsFormCom from '../ColumnsFormCom/index.vue';
import { getColumnsData, automatchColumnsData, deleteColumnsData, updateColumnsData } from './api';
import { successNotification, warningNotification } from '/@/utils/message';
import { APIResponseData, CurrentInfoType, ColumnsFormDataType, AddColumnsDataType } from '../../types';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
	currentInfo: {
		type: Object as () => CurrentInfoType,
		required: true,
		default: () => {},
	},
});

let searchParams = reactive({
	page: 1,
	limit: 20,
});
let state = reactive({
	loading: false,
	data: [],
	total: 0,
});
let drawerVisible = ref(false);
let drawerFormData = ref<Partial<ColumnsFormDataType>>({});

const fetchData = async (query: CurrentInfoType = props.currentInfo) => {
	try {
		state.loading = true;
		const res = await getColumnsData({ ...searchParams, ...query });
		if (res?.code === 2000) {
			state.data = res.data;
			state.total = res.total;
		}
	} finally {
		state.loading = false;
	}
};

/**
 * Auto match columns
 */
const handleAutomatch = async () => {
	if (props.currentInfo?.role && props.currentInfo?.model && props.currentInfo?.app) {
		const res = await automatchColumnsData(props.currentInfo);
		if (res?.code === 2000) {
			successNotification(t('message.matchSuccess'));
			fetchData();
		}
		return;
	}
	warningNotification(t('message.pleaseSelectRoleAndModelTable'));
};

/**
 * add or edit
 */
const handleUpdateColumn = (type: string, record?: ColumnsFormDataType) => {
	if (props.currentInfo?.role && props.currentInfo?.model && props.currentInfo?.app) {
		if (type === 'update' && record) {
			drawerFormData.value = record;
		}
		drawerVisible.value = true;
		return;
	}
	warningNotification(t('message.pleaseSelectRoleAndModelTable'));
};
const handleDrawerClose = (type?: string) => {
	if (type === 'submit') {
		fetchData();
	}
	drawerVisible.value = false;
	drawerFormData.value = {};
};

/**
 * delete deleteColumnsData
 */
const handleDelete = ({ id }: { id: number }) => {
	ElMessageBox.confirm(t('message.importExcel.confirmDeleteField'), t('message.prompt'), {
		type: 'error',
		confirmButtonText: t('message.user.logOutConfirm'),
		cancelButtonText: t('message.cancel'),
	})
		.then(async () => {
			const res = await deleteColumnsData(id);
			if (res?.code === 2000) {
				successNotification(t('message.deleteSuccess'));
				fetchData();
			}
		})
		.catch(() => {});
};

const handleChange = (record: AddColumnsDataType) => {
	updateColumnsData(record).then((res: APIResponseData) => {
		successNotification(res.msg || t('message.updateSuccess'));
	});
};

/**
 * pagination
 */
const handleSizeChange = (limit: number) => {
	searchParams.limit = limit;
	fetchData();
};
const handleCurrentChange = (page: number) => {
	searchParams.page = page;
	fetchData();
};

defineExpose({ fetchData });
</script>

<style lang="scss" scoped>
.columns-table-com {
	height: 100%;
	.ctc-title {
		font-size: 16px;
		font-weight: 900;
		padding-bottom: 10px;
		border-bottom: 1px solid #dcdfe6;
	}
	.ctc-head {
		height: 35px;
		margin-top: 10px;
	}
	.ctc-table {
		width: 100%;
		height: calc(100% - 135px);
		margin: 10px 0;
	}
	.ctc-pagination {
		height: 35px;
	}
}
</style>
