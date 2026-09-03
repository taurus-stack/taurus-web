import * as api from '/@/api/taurus/supervisor/program';
import { UserPageQuery, AddReq, DelReq, EditReq, CreateCrudOptionsProps, CreateCrudOptionsRet, compute } from '@fast-crud/fast-crud';
import { getProgramConfig } from './table';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { i18n } from '/@/i18n';

// @ts-ignore - vue-i18n type inference chain too deep, works fine at runtime
const t = i18n.global.t;

export const createCrudOptions = function ({ crudExpose }: CreateCrudOptionsProps): CreateCrudOptionsRet {
	const route = useRoute();
	const hostId = route.query.host_id as string;
	const hostName = route.query.host_name as string;
	const programConfig = getProgramConfig();

	const pageRequest = async (query: UserPageQuery) => {
		if (hostId) {
			query.host = hostId;
		}
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
			actionbar: programConfig.actionbar,
			rowHandle: {
				...(programConfig.rowHandle as any),
				buttons: {
					...(programConfig.rowHandle as any).buttons,
					start: {
						text: t('message.pages.program.buttons.start'),
						type: 'success',
						show: compute(({ row }: any) => row.status !== 'running' && row.status !== 'starting'),
						buttonProps: {
							text: true,
						},
						click: async ({ row }: any) => {
							await api.StartProgram(row.id);
							ElMessage.success(t('message.pages.program.messages.startSent'));
							crudExpose.doRefresh();
						},
					},
					stop: {
						text: t('message.pages.program.buttons.stop'),
						type: 'warning',
						buttonProps: {
							text: true,
						},
						show: compute(({ row }: any) => row.status === 'running'),
						click: async ({ row }: any) => {
							await api.StopProgram(row.id);
							ElMessage.success(t('message.pages.program.messages.stopSent'));
							crudExpose.doRefresh();
						},
					},
					restart: {
						text: t('message.pages.program.buttons.restart'),
						type: 'primary',
						buttonProps: {
							text: true,
						},
						show: compute(({ row }: any) => row.status === 'running'),
						click: async ({ row }: any) => {
							await api.RestartProgram(row.id);
							ElMessage.success(t('message.pages.program.messages.restartSent'));
							crudExpose.doRefresh();
						},
					},
					remove: {
						text: t('message.pages.program.buttons.remove'),
						type: 'danger',
						show: true,
						buttonProps: {
							text: true,
						},
						click: async ({ row }: any) => {
							await ElMessageBox.confirm(
								t('message.pages.program.messages.removeConfirm', { name: row.name }),
								t('message.pages.program.messages.removeConfirmTitle'),
								{ type: 'warning' }
							);
							await api.RemoveProgram(row.id);
							ElMessage.success(t('message.pages.program.messages.removeSent'));
							crudExpose.doRefresh();
						},
					},
				},
			},
			columns: programConfig.columns,
		},
	};
};
