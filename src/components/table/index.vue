<template>
	<div class="table-container">
		<el-table
			:data="data"
			:border="setBorder"
			v-bind="$attrs"
			row-key="id"
			stripe
			style="width: 100%"
			v-loading="config.loading"
			@selection-change="onSelectionChange"
		>
			<el-table-column type="selection" :reserve-selection="true" width="30" v-if="config.isSelection" />
			<el-table-column type="index" :label="t('message.importExcel.sortNumber')" width="60" v-if="config.isSerialNo" />
			<el-table-column
				v-for="(item, index) in setHeader"
				:key="index"
				show-overflow-tooltip
				:prop="item.key"
				:width="item.colWidth"
				:label="item.title"
			>
				<template v-slot="scope">
					<template v-if="item.type === 'image'">
						<img :src="scope.row[item.key]" :width="item.width" :height="item.height" />
					</template>
					<template v-else>
						{{ scope.row[item.key] }}
					</template>
				</template>
			</el-table-column>
			<el-table-column :label="t('message.global.operation')" width="100" v-if="config.isOperate">
				<template v-slot="scope">
					<el-popconfirm :title="t('message.confirmDelete')" @confirm="onDelRow(scope.row)">
						<template #reference>
							<el-button text type="primary">{{ t('message.global.delete') }}</el-button>
						</template>
					</el-popconfirm>
				</template>
			</el-table-column>
			<template #empty>
				<el-empty :description="t('message.noData')" />
			</template>
		</el-table>
		<div class="table-footer mt15">
			<el-pagination
				v-model:current-page="state.page.pageNum"
				v-model:page-size="state.page.pageSize"
				:pager-count="5"
				:page-sizes="[10, 20, 30]"
				:total="config.total"
				layout="total, sizes, prev, pager, next, jumper"
				background
				@size-change="onHandleSizeChange"
				@current-change="onHandleCurrentChange"
			>
			</el-pagination>
			<div class="table-footer-tool">
				<SvgIcon name="iconfont icon-yunxiazai_o" :size="22" :title="t('message.global.export')" @click="onImportTable" />
				<SvgIcon name="iconfont icon-shuaxin" :size="22" :title="t('message.global.refresh')" @click="onRefreshTable" />
				<el-popover
					placement="top-end"
					trigger="click"
					transition="el-zoom-in-top"
					popper-class="table-tool-popper"
					:width="300"
					:persistent="false"
					@show="onSetTable"
				>
					<template #reference>
						<SvgIcon name="iconfont icon-quanjushezhi_o" :size="22" :title="t('message.settings')" />
					</template>
					<template #default>
						<div class="tool-box">
							<el-tooltip :content="t('message.dragToSort')" placement="top-start">
								<SvgIcon name="fa fa-question-circle-o" :size="17" class="ml11" color="#909399" />
							</el-tooltip>
							<el-checkbox
								v-model="state.checkListAll"
								:indeterminate="state.checkListIndeterminate"
								class="ml10 mr1"
								:label="t('message.columnDisplay')"
								@change="onCheckAllChange"
							/>
							<el-checkbox v-model="getConfig.isSerialNo" class="ml12 mr1" :label="t('message.serialNo')" />
							<el-checkbox v-model="getConfig.isSelection" class="ml12 mr1" :label="t('message.multiSelect')" />
						</div>
						<el-scrollbar>
							<div ref="toolSetRef" class="tool-sortable">
								<div class="tool-sortable-item" v-for="v in header" :key="v.key" :data-key="v.key">
									<i class="fa fa-arrows-alt handle cursor-pointer"></i>
									<el-checkbox v-model="v.isCheck" size="default" class="ml12 mr8" :label="v.title" @change="onCheckChange" />
								</div>
							</div>
						</el-scrollbar>
					</template>
				</el-popover>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="netxTable">
import { reactive, computed, nextTick, ref } from 'vue';
import { ElMessage } from 'element-plus';
import table2excel from 'js-table2excel';
import Sortable from 'sortablejs';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
import '/@/theme/tableTool.scss';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// define props passed from parent
const props = defineProps({
	// table data
	data: {
		type: Array<EmptyObjectType>,
		default: () => [],
	},
	// table columns
	header: {
		type: Array<EmptyObjectType>,
		default: () => [],
	},
	// config
	config: {
		type: Object,
		default: () => {},
	},
});

// define emits
const emit = defineEmits(['delRow', 'pageChange', 'sortHeader']);

// define variables
const toolSetRef = ref();
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);
const state = reactive({
	page: {
		pageNum: 1,
		pageSize: 10,
	},
	selectlist: [] as EmptyObjectType[],
	checkListAll: true,
	checkListIndeterminate: false,
});

// toggle border
const setBorder = computed(() => {
	return props.config.isBorder ? true : false;
});
// get parent config (required)
const getConfig = computed(() => {
	return props.config;
});
// set tool header data
const setHeader = computed(() => {
	return props.header.filter((v) => v.isCheck);
});
// tool column select-all changed
const onCheckAllChange = <T>(val: T) => {
	if (val) props.header.forEach((v) => (v.isCheck = true));
	else props.header.forEach((v) => (v.isCheck = false));
	state.checkListIndeterminate = false;
};
// tool column selection changed
const onCheckChange = () => {
	const headers = props.header.filter((v) => v.isCheck).length;
	state.checkListAll = headers === props.header.length;
	state.checkListIndeterminate = headers > 0 && headers < props.header.length;
};
// multi-select changed, used for export
const onSelectionChange = (val: EmptyObjectType[]) => {
	state.selectlist = val;
};
// delete current row
const onDelRow = (row: EmptyObjectType) => {
	emit('delRow', row);
};
// page change
const onHandleSizeChange = (val: number) => {
	state.page.pageSize = val;
	emit('pageChange', state.page);
};
// page change
const onHandleCurrentChange = (val: number) => {
	state.page.pageNum = val;
	emit('pageChange', state.page);
};
// reset pagination on search
const pageReset = () => {
	state.page.pageNum = 1;
	state.page.pageSize = 10;
	emit('pageChange', state.page);
};
// export
const onImportTable = () => {
	if (state.selectlist.length <= 0) return ElMessage.warning(t('message.importExcel.selectBeforeExport'));
	table2excel(props.header, state.selectlist, `${themeConfig.value.globalTitle} ${new Date().toLocaleString()}`);
};
// refresh
const onRefreshTable = () => {
	emit('pageChange', state.page);
};
// settings
const onSetTable = () => {
	nextTick(() => {
		const sortable = Sortable.create(toolSetRef.value, {
			handle: '.handle',
			dataIdAttr: 'data-key',
			animation: 150,
			onEnd: () => {
				const headerList: EmptyObjectType[] = [];
				sortable.toArray().forEach((val) => {
					props.header.forEach((v) => {
						if (v.key === val) headerList.push({ ...v });
					});
				});
				emit('sortHeader', headerList);
			},
		});
	});
};

// expose variables
defineExpose({
	pageReset,
});
</script>

<style scoped lang="scss">
.table-container {
	display: flex;
	flex-direction: column;
	.el-table {
		flex: 1;
	}
	.table-footer {
		display: flex;
		.table-footer-tool {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: flex-end;
			i {
				margin-right: 10px;
				cursor: pointer;
				color: var(--el-text-color-regular);
				&:last-of-type {
					margin-right: 0;
				}
			}
		}
	}
}
</style>
