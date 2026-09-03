import * as api from '/@/api/taurus/program-install-template';
import { UserPageQuery, AddReq, DelReq, EditReq, CreateCrudOptionsProps, CreateCrudOptionsRet } from '@fast-crud/fast-crud';
import { getProgramInstallTemplateConfig } from './table';
import { auth } from '/@/utils/authFunction';
import { i18n } from '/@/i18n';

// @ts-ignore - vue-i18n type inference chain too deep, works fine at runtime
const t = i18n.global.t;

export const createCrudOptions = function ({ crudExpose }: CreateCrudOptionsProps): CreateCrudOptionsRet {
	const tableConfig = getProgramInstallTemplateConfig();

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

	// Build actionbar, add "Apply to Host" button
	const actionbarConfig: any = {
		...tableConfig.actionbar,
	};

	// Build rowHandle, add "Apply to Host" button
	const rowHandleConfig: any = {
		...tableConfig.rowHandle,
		buttons: {
			...(tableConfig.rowHandle as any).buttons,
			applyToHosts: {
				text: t('message.pages.programInstallTemplate.buttons.applyToHosts'),
				type: 'primary',
				show: auth('ProgramInstallTemplate:ApplyToHosts'),
				buttonProps: {
					text: true,
					type: 'primary',
				},
				click: async ({ row }: any) => {
				// Pass template data for current row
				const event = new CustomEvent('apply-to-hosts-open', { detail: { template: row } });
				window.dispatchEvent(event);
			}
			}
		}
	};
	return {
		crudOptions: {
			request: {
				pageRequest,
				addRequest,
				editRequest,
				delRequest,
			},
			actionbar: actionbarConfig,
			rowHandle: rowHandleConfig,
			columns: tableConfig.columns,
			form: {
				labelWidth: '140px',
			}
		},
	};
};