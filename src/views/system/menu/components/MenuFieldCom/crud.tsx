import * as api from './api';
import { dict, UserPageQuery, AddReq, DelReq, EditReq, compute, CreateCrudOptionsProps, CreateCrudOptionsRet } from '@fast-crud/fast-crud';
import { request } from '/@/utils/service';
import { dictionary } from '/@/utils/dictionary';
import { inject } from 'vue';
import {auth} from "/@/utils/authFunction";
import {i18n} from '/@/i18n';

const t = i18n.global.t;



export const createCrudOptions = function ({ crudExpose, props,modelDialog,selectOptions,allModelData }: CreateCrudOptionsProps): CreateCrudOptionsRet {
	const pageRequest = async (query: UserPageQuery) => {
		// return await api.GetList(query);
		if (selectOptions.value.id) {
			return await api.GetList({ menu: selectOptions.value.id } as any);
		} else {
			return undefined;
		}
	};
	const editRequest = async ({ form, row }: EditReq) => {
		form.id = row.id;
		return await api.UpdateObj(form);
	};
	const delRequest = async ({ row }: DelReq) => {
		return await api.DelObj(row.id);
	};
	const addRequest = async ({ form }: AddReq) => {
		form.menu = selectOptions.value.id;
		return await api.AddObj(form);
	};

	return {
		crudOptions: {
			request: {
				pageRequest,
				addRequest,
				editRequest,
				delRequest,
			},
			pagination: {
				show: false,
			},
			actionbar: {
				buttons: {
					add:{
						show:auth('column:Create')
					},
					auto: {
						text: t('message.pages.menu.buttons.automatch'),
						type: 'success',
						show:auth('column:Match'),
						click: () => {
							return modelDialog.value=true;
						},
					},
				},
			},
			rowHandle: {
				// Fixed right side
				fixed: 'right',
				buttons: {
					view: {
						show: false,
					},
					edit: {
						show: auth('column:Update')
					},
					remove: {
						show: auth('column:Delete')
					},
				},
			},
			form: {
				col: { span: 24 },
				labelWidth: '110px',
				wrapper: {
					is: 'el-dialog',
					width: '600px',
				},
			},
			columns: {
				_index: {
					title: t('message.pages.menu.buttons.index'),
					form: { show: false },
					column: {
						//type: 'index',
						align: 'center',
						width: '70px',
						columnSetDisabled: true, // Disabled in column settings
						//@ts-ignore
						formatter: (context) => {
							// Calculate sequence number, customizable rule, accumulates across pages
							let index = context.index ?? 1;
							let pagination: any = crudExpose!.crudBinding.value.pagination;
							return ((pagination.currentPage ?? 1) - 1) * pagination.pageSize + index + 1;
						},
					},
				},
				model: {
					title: t('message.pages.menu.buttons.model'),
					type: 'dict-select',
					dict:dict({
						url:'/api/system/column/get_models/',
						label:'title',
						value:'key'
					}),
					column:{
						sortable: true,
					},
					form: {
						rules: [
							// Form validation rules
							{
								required: true,
								message: t('message.pages.menu.validation.required'),
							},
						],
						component: {
							span: 12,
							showSearch: true,
							filterable: true,
							// Default filterOption only filters by value, label is not included in the query
							// So we need a custom filterOption
							filterOption(inputValue, option) {
								return option.label.indexOf(inputValue) >= 0 || option.value.indexOf(inputValue) >= 0;
							}
						},
					},
				},
				title: {
					title: t('message.pages.menu.buttons.chineseName'),
					sortable: 'custom',
					search: {
						show: true,
					},
					type: 'text',
					form: {
						rules: [
							// Form validation rules
							{
								required: true,
								message: t('message.pages.menu.validation.required'),
							},
						],
						component: {
							span: 12,
							placeholder: t('message.pages.menu.buttons.chineseNamePlaceholder'),
						},
					},
				},
				field_name: {
					title: t('message.pages.menu.buttons.fieldName'),
					type: 'text',
					search: {
						show: true,
					},
					column:{
						sortable: true,
					},
					form: {
						rules: [
							// Form validation rules
							{
								required: true,
								message: t('message.pages.menu.validation.required'),
							},
						],
						component: {
							span: 12,
							placeholder: t('message.pages.menu.buttons.fieldNamePlaceholder'),
						},
					},
				},
			},
		},
	};
};
