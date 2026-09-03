import * as api from './api';
import { dict, useCompute, PageQuery, AddReq, DelReq, EditReq, CrudExpose, CreateCrudOptionsProps, CreateCrudOptionsRet } from '@fast-crud/fast-crud';
import tableSelector from '/@/components/tableSelector/index.vue';
import { shallowRef, computed, ref } from 'vue';
import manyToMany from '/@/components/manyToMany/index.vue';
import { auth } from '/@/utils/authFunction';
import { i18n } from '/@/i18n';

const t = i18n.global.t;
const { compute } = useCompute();

export const tabActivted = ref<'send' | 'receive'>('send');

export const createCrudOptions = function ({
	crudExpose,
	context,
}: CreateCrudOptionsProps): CreateCrudOptionsRet {
	const pageRequest = async (query: PageQuery) => {
		if (tabActivted.value === 'receive') {
			return await api.GetSelfReceive(query);
		}
		return await api.GetList(query);
	};

	const viewRequest = async ({ row }: { row: any }) => {
		return await api.GetObj(row.id);
	};

	const isReceive = computed(() => tabActivted.value === 'receive');

	const onSelectionChange = (rows: any[]) => {
		if (context && context.selectedIds) {
			context.selectedIds.value = rows.map((item: any) => item.id);
		}
	};

	return {
		crudOptions: {
			request: {
				pageRequest,
			},
			table: {
				rowKey: 'id',
				onSelectionChange,
			},
			actionbar: {
				buttons: {
					add: {
						show: computed(() => {
							return tabActivted.value !== 'receive' && auth('messageCenter:Create');
						}),
						text: t('message.pages.messageCenter.buttons.publishNew'),
						icon: 'Plus',
					},
				},
			},
			rowHandle: {
				fixed: 'right',
				width: 180,
				buttons: {
					edit: { show: false },
					view: {
						text: t('message.pages.messageCenter.buttons.view'),
						type: 'text',
						iconRight: 'View',
						show: auth('messageCenter:Search'),
						click({ index, row }) {
							crudExpose.openView({ index, row });
							if (tabActivted.value === 'receive') {
								viewRequest({ row });
								crudExpose.doRefresh();
							}
						},
					},
					remove: {
						iconRight: 'Delete',
						type: 'text',
						show: auth('messageCenter:Delete'),
					},
				},
			},
			columns: {
				$checked: {
					title: t('message.pages.messageCenter.table.columns.select'),
					form: { show: false },
					column: {
						show: isReceive,
						type: 'selection',
						align: 'center',
						width: '55px',
						columnSetDisabled: true,
						selectable(_row: any, _index: any) {
							return tabActivted.value === 'receive';
						},
						multiple: true,
					},
				},
				id: {
					title: 'ID',
					type: 'text',
					width: 80,
					column: { align: 'center' },
					form: { show: false },
				},
				title: {
					title: t('message.pages.messageCenter.table.columns.title'),
					search: { show: true },
					type: ['text', 'colspan'],
					column: { minWidth: 220 },
					form: {
						rules: [{ required: true, message: t('message.pages.messageCenter.validation.required') }],
						component: { span: 24, placeholder: t('message.pages.messageCenter.form.messageTitlePlaceholder') },
					},
				},
				is_read: {
					title: t('message.pages.messageCenter.table.columns.readStatus'),
					type: 'dict-select',
					search: { show: isReceive },
					column: {
						show: isReceive,
						width: 120,
						component: { name: 'el-tag' },
					},
					dict: dict({
						data: [
							{ label: t('message.pages.messageCenter.status.yes'), value: true, color: 'success' },
							{ label: t('message.pages.messageCenter.status.no'), value: false, color: 'danger' },
						],
					}),
					form: { show: false },
				},
				target_type: {
					title: t('message.pages.messageCenter.table.columns.targetType'),
					type: ['dict-radio', 'colspan'],
					column: { minWidth: 120, show: computed(() => !isReceive.value) },
					dict: dict({
						data: [
							{ value: 0, label: t('message.pages.messageCenter.targetType.byUser') },
							{ value: 1, label: t('message.pages.messageCenter.targetType.byRole') },
							{ value: 2, label: t('message.pages.messageCenter.targetType.byDept') },
							{ value: 3, label: t('message.pages.messageCenter.targetType.notice') },
						],
					}),
					form: {
						component: { optionName: 'el-radio-button' },
						rules: [{ required: true, message: t('message.pages.messageCenter.validation.requiredSelection'), trigger: ['blur', 'change'] }],
					},
				},
				target_user: {
					title: t('message.pages.messageCenter.table.columns.targetUser'),
					search: { disabled: true },
					form: {
						component: {
							name: shallowRef(tableSelector),
							vModel: 'modelValue',
							displayLabel: compute(({ row }) => row?.user_info),
							tableConfig: {
								url: '/api/system/user/',
								label: 'name',
								value: 'id',
								isMultiple: true,
								columns: [
									{ prop: 'name', label: t('message.pages.messageCenter.form.userName'), width: 120 },
									{ prop: 'phone', label: t('message.pages.messageCenter.form.phone'), width: 120 },
								],
							},
						},
						show: compute(({ form }) => form.target_type === 0),
						rules: [{ required: true, message: t('message.pages.messageCenter.validation.required') }],
					},
					column: {
						show: false,
						component: {
							name: shallowRef(manyToMany),
							vModel: 'modelValue',
							bindValue: compute(({ row }) => row?.user_info),
							displayLabel: 'name',
						},
					},
				},
				target_role: {
					title: t('message.pages.messageCenter.table.columns.targetRole'),
					search: { disabled: true },
					width: 130,
					form: {
						component: {
							name: shallowRef(tableSelector),
							vModel: 'modelValue',
							displayLabel: compute(({ row }) => row?.role_info),
							tableConfig: {
								url: '/api/system/role/',
								label: 'name',
								value: 'id',
								isMultiple: true,
								columns: [
									{ prop: 'name', label: t('message.pages.messageCenter.form.roleName') },
									{ prop: 'key', label: t('message.pages.messageCenter.form.roleKey') },
								],
							},
						},
						show: compute(({ form }) => form.target_type === 1),
						rules: [{ required: true, message: t('message.pages.messageCenter.validation.required') }],
					},
					column: {
						show: false,
						component: {
							name: shallowRef(manyToMany),
							vModel: 'modelValue',
							bindValue: compute(({ row }) => row?.role_info),
							displayLabel: 'name',
						},
					},
				},
				target_dept: {
					title: t('message.pages.messageCenter.table.columns.targetDept'),
					search: { disabled: true },
					width: 130,
					type: 'table-selector',
					form: {
						component: {
							name: shallowRef(tableSelector),
							vModel: 'modelValue',
							displayLabel: compute(({ form }) => form.target_dept_name),
							tableConfig: {
								url: '/api/system/dept/all_dept/',
								label: 'name',
								value: 'id',
								isTree: true,
								isMultiple: true,
								columns: [
									{ prop: 'name', label: t('message.pages.messageCenter.form.deptName'), width: 150 },
									{ prop: 'status_label', label: t('message.pages.messageCenter.form.status') },
									{ prop: 'parent_name', label: t('message.pages.messageCenter.form.parentDept') },
								],
							},
						},
						show: compute(({ form }) => form.target_type === 2),
						rules: [{ required: true, message: t('message.pages.messageCenter.validation.required') }],
					},
					column: {
						show: false,
						component: {
							name: shallowRef(manyToMany),
							vModel: 'modelValue',
							bindValue: compute(({ row }) => row?.dept_info),
							displayLabel: 'name',
						},
					},
				},
				content: {
					title: t('message.pages.messageCenter.table.columns.content'),
					column: { width: 300, show: false },
					type: ['editor-wang5', 'colspan'],
					form: {
						rules: [{ required: true, message: t('message.pages.messageCenter.validation.required') }],
						component: {
							disabled: true,
							id: '1',
							editorConfig: {
								readOnly: compute((ctx: any) => {
									const { mode } = ctx;
									return mode !== 'add';
								}),
							},
							uploader: {
								type: 'form',
								buildUrl(res: any) {
									return res.url;
								},
							},
						},
					},
				},
				creator_name: {
					title: t('message.pages.messageCenter.table.columns.publisher'),
					column: {
						minWidth: 100,
						show: isReceive,
					},
					form: { show: false },
				},
				create_datetime: {
					title: t('message.pages.messageCenter.table.columns.publishTime'),
					type: 'datetime',
					column: { width: 170, show: true },
					form: { show: false },
				},
			},
		},
	};
};