import * as api from './api';
import { UserPageQuery, AddReq, DelReq, EditReq, CrudExpose, CrudOptions, CreateCrudOptionsProps, CreateCrudOptionsRet } from '@fast-crud/fast-crud';
import {i18n} from '/@/i18n';

const t = i18n.global.t;

export const createCrudOptions = function ({ crudExpose }: CreateCrudOptionsProps): CreateCrudOptionsRet {
	const pageRequest = async (query: UserPageQuery) => {
		return await api.GetList(query);
	};
	const editRequest = async ({ form, row }: EditReq) => {
		form.id = row.id;
		return await api.UpdateObj(form);
	};
	const delRequest = async ({ row }: DelReq) => {
		return await api.DelObj(row.id);
	};
	const addRequest = async ({ form }: AddReq) => {
		return await api.AddObj(form);
	};
	return {
		crudOptions: {
			actionbar: {
				buttons: {
					add: {
						show: false,
					},
				},
			},
			request: {
				pageRequest,
				addRequest,
				editRequest,
				delRequest,
			},
			rowHandle: {
				// Fixed right side
				fixed: 'right',
				width: 200,
				show:false,
				buttons: {
					view: {
						show: false,
					},
					edit: {
						iconRight: 'Edit',
						type: 'text',
					},
					remove: {
						iconRight: 'Delete',
						type: 'text',
					},
				},
			},
			columns: {
				_index: {
					title: t('message.pages.fileList.table.columns.index'),
					form: { show: false },
					column: {
						//type: 'index',
						align: 'center',
						width: '70px',
						columnSetDisabled: true, // Disabled in column settings
						formatter: (context) => {
							// Calculate sequence number, customizable rule, accumulates across pages
							let index = context.index ?? 1;
							let pagination = crudExpose!.crudBinding.value.pagination;
							return ((pagination!.currentPage ?? 1) - 1) * pagination!.pageSize + index + 1;
						},
					},
				},
				search: {
					title: t('message.pages.fileList.table.columns.keyword'),
					column: {
						show: false,
					},
					search: {
						show: true,
						component: {
							props: {
								clearable: true,
							},
							placeholder: t('message.pages.fileList.form.keywordPlaceholder'),
						},
					},
					form: {
						show: false,
						component: {
							props: {
								clearable: true,
							},
						},
					},
				},
				name: {
					title: t('message.pages.fileList.table.columns.name'),
					search: {
						show: true,
					},
					type: 'input',
					column:{
						minWidth: 120,
					},
					form: {
						component: {
							placeholder: t('message.pages.fileList.form.namePlaceholder'),
						},
					},
				},
				url: {
					title: t('message.pages.fileList.table.columns.url'),
					type: 'file-uploader',
					search: {
						disabled: true,
					},
					column:{
						minWidth: 200,
					},
				},
				md5sum: {
					title: t('message.pages.fileList.table.columns.md5sum'),
					search: {
						disabled: true,
					},
					column:{
						minWidth: 120,
					},
					form: {
						disabled: false,
					},
				},
			},
		},
	};
};
