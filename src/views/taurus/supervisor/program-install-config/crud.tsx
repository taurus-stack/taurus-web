import * as api from '/@/api/taurus/supervisor/program-install-config';
import { UserPageQuery, AddReq, DelReq, EditReq, CreateCrudOptionsProps, CreateCrudOptionsRet, compute } from '@fast-crud/fast-crud';
import { getProgramInstallConfig } from './table';
import { ElMessage, ElMessageBox } from 'element-plus';
import { i18n } from '/@/i18n';

// @ts-ignore - vue-i18n type inference chain too deep, works fine at runtime
const t = i18n.global.t;

export const createCrudOptions = function ({ crudExpose }: CreateCrudOptionsProps): CreateCrudOptionsRet {
	const tableConfig = getProgramInstallConfig();

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
			request: {
				pageRequest,
				addRequest,
				editRequest,
				delRequest,
			},
			actionbar: tableConfig.actionbar,
			rowHandle: {
				...tableConfig.rowHandle,
				buttons: {
					...(tableConfig.rowHandle as any).buttons,
					redispatch: {
						text: t('message.pages.programInstallConfig.buttons.redispatch'),
						type: 'warning',
						buttonProps: {
							text: true,
							type: 'warning',
						},
						show: compute(({ row }: any) => !row.installed && !row.installing),
						click: async ({ row }: any) => {
							await ElMessageBox.confirm(
								t('message.pages.programInstallConfig.messages.redispatchConfirm', {
									programName: row.program_name,
									version: row.version,
								}),
								t('message.pages.programInstallConfig.messages.redispatchConfirmTitle'),
								{ type: 'warning' }
							);
							await api.Redispatch(row.id);
							ElMessage.success(t('message.pages.programInstallConfig.messages.redispatchSuccess'));
							crudExpose.doRefresh();
						},
					},
				},
			},
			columns: tableConfig.columns,
		},
	};
};
