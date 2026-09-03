import * as api from '/@/api/taurus/host/api';
import { UserPageQuery, AddReq, DelReq, EditReq, CreateCrudOptionsProps, CreateCrudOptionsRet } from '@fast-crud/fast-crud';
import { getMyHostConfig } from '/@/views/taurus/config/host/table';
import { router } from '/@/router/index';
import { i18n } from '/@/i18n';

const t = i18n.global.t;

export const createCrudOptions = function ({ crudExpose }: CreateCrudOptionsProps): CreateCrudOptionsRet {
	const myHostConfig = getMyHostConfig();
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
			actionbar: myHostConfig.actionbar,
			rowHandle: {
				...(myHostConfig.rowHandle as any),
				buttons: {
					...(myHostConfig.rowHandle as any).buttons,
					program: {
						text: t('message.pages.host.buttons.program'),
						type: 'warning',
                        buttonProps: {
							text: true,
						},
						click: ({ row }: any) => {
							router.push({
								path: '/supervisor/program',
								query: { host_id: row.id, host_name: row.host_name },
							});
						},
					},
					log: {
						text: t('message.pages.host.buttons.log'),
						buttonProps: {
							text: true,
							type: 'success',
						},
						click: ({ row }: any) => {
							router.push({
								path: '/supervisor/log',
								query: { host_id: row.id, host_name: row.host_name },
							});
						},
					},
				},
			},
			columns: myHostConfig.columns,
		},
	};
};
