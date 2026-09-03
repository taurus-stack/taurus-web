import * as api from '/@/api/taurus/supervisor/registration-token';
import { UserPageQuery, AddReq, DelReq, EditReq, CreateCrudOptionsProps, CreateCrudOptionsRet } from '@fast-crud/fast-crud';
import { getRegistrationTokenConfig } from './table';
import { ElMessage, ElMessageBox, ElInput } from 'element-plus';
import { h } from 'vue';
import { i18n } from '/@/i18n';

// @ts-ignore - vue-i18n type inference chain too deep, works fine at runtime
const t = i18n.global.t;

let lastCreatedToken: string | null = null;

export const createCrudOptions = function ({ crudExpose: _crudExpose }: CreateCrudOptionsProps): CreateCrudOptionsRet {
	const tableConfig = getRegistrationTokenConfig();

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
		const res = await api.AddObj(form);
		lastCreatedToken = res.data?.plain_token || res.plain_token || null;
		return res;
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
			rowHandle: tableConfig.rowHandle,
			columns: tableConfig.columns,
			form: {
				onSuccess: async () => {
					if (lastCreatedToken) {
						const tokenToCopy = lastCreatedToken;
						lastCreatedToken = null;
						ElMessageBox.alert(
							h('div', { style: 'width: 100%' }, [
								h('div', { style: 'margin-bottom: 12px; color: #E6A23C; font-weight: bold;' }, t('message.pages.registrationToken.messages.tokenWarning')),
								h('div', { style: 'margin-bottom: 8px; color: #606266;' }, t('message.pages.registrationToken.messages.tokenLabel')),
								h(ElInput, {
									modelValue: tokenToCopy,
									readonly: true,
									style: 'margin-bottom: 8px;',
								}),
							]),
							t('message.pages.registrationToken.messages.tokenDialogTitle'),
							{
								confirmButtonText: t('message.pages.registrationToken.messages.copyAndClose'),
								customClass: 'token-dialog',
								beforeClose: async (action, _instance, done) => {
									if (action === 'confirm') {
										try {
											await navigator.clipboard.writeText(tokenToCopy);
											ElMessage.success(t('message.pages.registrationToken.messages.copiedToClipboard'));
										} catch {
											ElMessage.warning(t('message.pages.registrationToken.messages.copyFailed'));
										}
									}
									done();
								},
							}
						);
					}
				},
			},
		},
	};
};
