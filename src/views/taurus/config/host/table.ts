import { dict } from '@fast-crud/fast-crud';
import { commonCrudConfig } from '/@/utils/commonCrud';
import { auth } from '/@/utils/authFunction';
import { actionbar, rowHandle } from '/@/views/taurus/config/utils/common';
import { i18n } from '/@/i18n';
import { editionColumnShow } from '/@/editions/useEditionColumn';

export function getAllHostConfig(): any {
	// @ts-ignore — vue-i18n type inference chain too deep, runtime is fine
	const t = i18n.global.t;
	return {
	actionbar: actionbar(auth('HostAll:Create'), false, false),
	columns: {
		search: {
			title: t('message.pages.host.table.columns.keyword'),
			column: {
				show: false,
			},
			search: {
				show: true,
				component: {
					props: {
						clearable: true,
					},
					placeholder: t('message.pages.host.form.keywordPlaceholder'),
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
		id: {
			title: t('message.pages.host.table.columns.id'),
			type: 'input',
			column: {
				show: true,
			},
			form: {
				disabled: true,
				show: false,
			},
		},
		host_uuid: {
			title: t('message.pages.host.table.columns.hostUuid'),
			type: 'input',
			column: {
				show: false,
			},
			form: {
				disabled: true,
				show: false,
			},
		},
		host_name: {
			title: t('message.pages.host.table.columns.hostName'),
			search: {
				show: true,
				component: {
					clearable: true,
				},
			},
			type: 'input',
			column: {
				minWidth: 120,
			},
			form: {
				rules: [{ required: true, message: t('message.pages.host.form.hostNameRequired'), trigger: 'blur' }],
				component: {
					placeholder: t('message.pages.host.form.hostNamePlaceholder'),
					clearable: true,
				},
			},
		},
		host_ip: {
			title: t('message.pages.host.table.columns.hostIp'),
			search: {
				show: true,
				component: {
					clearable: true,
				},
			},
			type: 'input',
			column: {
				minWidth: 120,
			},
			form: {
				component: {
					placeholder: t('message.pages.host.form.hostIpPlaceholder'),
					clearable: true,
				},
			},
		},
		host_username: {
			title: t('message.pages.host.table.columns.hostUsername'),
			search: {
				show: true,
				component: {
					clearable: true,
				},
			},
			type: 'input',
			column: {
				minWidth: 100,
			},
			form: {
				component: {
					placeholder: t('message.pages.host.form.hostUsernamePlaceholder'),
					clearable: true,
				},
			},
		},
		host_type: {
			title: t('message.pages.host.table.columns.hostType'),
			type: 'dict-select',
			dict: dict({
				url: '/api/system/dict/host_type/',
				label: 'label',
				value: 'value',
			}),
			column: {
				minWidth: 90,
			},
			search: {
				show: true,
				component: {
					clearable: true,
				},
			},
			form: {
				component: {
					placeholder: t('message.pages.host.form.hostTypePlaceholder'),
					clearable: true,
				},
			},
		},
		status: {
			title: t('message.pages.host.table.columns.status'),
			dict: dict({
				value: 'id',
				label: 'text',
				data: [
					{
						id: 0,
						text: t('message.pages.host.status.pending'),
						color: 'warning',
					},
					{
						id: 1,
						text: t('message.pages.host.status.approved'),
						color: 'success',
					},
					{
						id: 2,
						text: t('message.pages.host.status.rejected'),
						color: 'danger',
					},
					{
						id: 3,
						text: t('message.pages.host.status.disabled'),
						color: 'info',
					},
				],
			}),
			type: 'dict-select',
			column: {
				minWidth: 90,
			},
			search: {
				show: true,
				component: {
					clearable: true,
				},
			},
			form: {
				component: {
					placeholder: t('message.pages.host.form.statusPlaceholder'),
					filterable: true,
				},
			},
		},
		online_status: {
			title: t('message.pages.host.table.columns.onlineStatus'),
			dict: dict({
				value: 'id',
				label: 'text',
				data: [
					{
						id: 0,
						text: t('message.pages.host.online.offline'),
						color: 'info',
					},
					{
						id: 1,
						text: t('message.pages.host.online.online'),
						color: 'success',
					},
				],
			}),
			type: 'dict-select',
			column: {
				minWidth: 90,
			},
			search: {
				show: true,
				component: {
					clearable: true,
				},
			},
			form: {
				show: false,
			},
		},
		supervisor_version: {
			title: t('message.pages.host.table.columns.supervisorVersion'),
			type: 'input',
			column: {
				minWidth: 100,
			},
			form: {
				show: false,
			},
		},
		last_heartbeat_at: {
			title: t('message.pages.host.table.columns.lastHeartbeatAt'),
			type: 'datetime',
			column: {
				minWidth: 150,
			},
			form: {
				show: false,
			},
		},
		certificate_status: {
			title: t('message.pages.host.table.columns.certificateStatus'),
			dict: dict({
				value: 'value',
				label: 'label',
				data: [
					{
						value: 'valid',
						label: t('message.pages.host.certificate.valid'),
						color: 'success',
					},
					{
						value: 'revoked',
						label: t('message.pages.host.certificate.revoked'),
						color: 'danger',
					},
					{
						value: 'expired',
						label: t('message.pages.host.certificate.expired'),
						color: 'warning',
					},
				],
			}),
			type: 'dict-select',
			column: {
				show: editionColumnShow('CA_CRL_MANAGEMENT'),
				minWidth: 90,
			},
			form: {
				show: false,
			},
		},
		extra_info: {
			title: t('message.pages.host.table.columns.extraInfo'),
			type: 'textarea',
			column: {
				show: true,
				minWidth: 200,
				formatter: ({ value }: any) => {
					if (!value || Object.keys(value).length === 0) return '-';
					return JSON.stringify(value, null, 2);
				},
			},
			form: {
				show: true,
				disabled: true,
				valueBuilder: ({ form }: any) => {
					if (form.extra_info && typeof form.extra_info === 'object') {
						form.extra_info = JSON.stringify(form.extra_info, null, 2);
					}
				},
			},
		},
		heartbeat_server: {
			title: t('message.pages.host.table.columns.heartbeatServer'),
			type: 'dict-select',
			dict: dict({
				url: '/api/taurus/heartbeat-server/',
				value: 'id',
				label: 'name',
			}),
			column: {
				show: editionColumnShow('HEARTBEAT_SERVER_CLUSTER'),
			},
			form: {
				show: editionColumnShow('HEARTBEAT_SERVER_CLUSTER'),
				component: {
					placeholder: t('message.pages.host.form.heartbeatServerPlaceholder'),
					clearable: true,
				},
			},
		},
		heartbeat_server_name: {
			title: t('message.pages.host.table.columns.heartbeatServer'),
			type: 'text',
			column: {
				show: editionColumnShow('HEARTBEAT_SERVER_CLUSTER'),
				minWidth: 120,
			},
			form: {
				show: false,
			},
		},
		...commonCrudConfig({
			create_datetime: {
				table: true,
			},
		}),
	},
};
}

export function getMyHostConfig(): any {
	// @ts-ignore — vue-i18n type inference chain too deep, runtime is fine
	const t = i18n.global.t;
	return {
	actionbar: actionbar(false, false, false),
	rowHandle: rowHandle(true,false, auth('MyHost:Edit'),  false),
	columns: {
		search: {
			title: t('message.pages.host.table.columns.keyword'),
			column: {
				show: false,
			},
			search: {
				show: true,
				component: {
					props: {
						clearable: true,
					},
					placeholder: t('message.pages.host.form.keywordPlaceholder'),
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
		id: {
			title: t('message.pages.host.table.columns.id'),
			type: 'input',
			column: {
				show: false,
			},
			form: {
				disabled: true,
				show: false,
			},
		},
		host_uuid: {
			title: t('message.pages.host.table.columns.hostUuid'),
			type: 'input',
			column: {
				show: false,
			},
			form: {
				disabled: true,
				show: false,
			},
		},
		host_name: {
			title: t('message.pages.host.table.columns.hostName'),
			search: {
				show: true,
				component: {
					clearable: true,
				},
			},
			type: 'input',
			column: {
				minWidth: 120,
			},
			form: {
				rules: [{ required: true, message: t('message.pages.host.form.hostNameRequired'), trigger: 'blur' }],
				component: {
					placeholder: t('message.pages.host.form.hostNamePlaceholder'),
					clearable: true,
				},
			},
		},
		host_ip: {
			title: t('message.pages.host.table.columns.hostIp'),
			search: {
				show: true,
				component: {
					clearable: true,
				},
			},
			type: 'input',
			column: {
				minWidth: 120,
			},
			form: {
				component: {
					placeholder: t('message.pages.host.form.hostIpPlaceholder'),
					clearable: true,
				},
			},
		},
		host_username: {
			title: t('message.pages.host.table.columns.hostUsername'),
			search: {
				show: true,
				component: {
					clearable: true,
				},
			},
			type: 'input',
			column: {
				minWidth: 100,
			},
			form: {
				component: {
					placeholder: t('message.pages.host.form.hostUsernamePlaceholder'),
					clearable: true,
				},
			},
		},
		host_type: {
			title: t('message.pages.host.table.columns.hostType'),
			type: 'dict-select',
			dict: dict({
				value: 'id',
				label: 'text',
				data: [
					{
						id: 1,
						text: t('message.pages.host.hostType.linux'),
					},
					{
						id: 2,
						text: t('message.pages.host.hostType.windows'),
					},
					{
						id: 3,
						text: t('message.pages.host.hostType.unknown'),
					},
				],
			}),
			column: {},
			search: {
				show: true,
				component: {
					clearable: true,
				},
			},
			form: {
				component: {
					placeholder: t('message.pages.host.form.hostTypePlaceholder'),
					clearable: true,
				},
			},
		},
		status: {
			title: t('message.pages.host.table.columns.status'),
			dict: dict({
				value: 'id',
				label: 'text',
				data: [
					{
						id: 0,
						text: t('message.pages.host.status.pending'),
						color: 'warning',
					},
					{
						id: 1,
						text: t('message.pages.host.status.approved'),
						color: 'success',
					},
					{
						id: 2,
						text: t('message.pages.host.status.rejected'),
						color: 'danger',
					},
					{
						id: 3,
						text: t('message.pages.host.status.disabled'),
						color: 'info',
					},
				],
			}),
			type: 'dict-select',
			column: {
				minWidth: 90,
			},
			search: {
				show: true,
				component: {
					clearable: true,
				},
			},
			form: {
				show: false,
			},
		},
		online_status: {
			title: t('message.pages.host.table.columns.onlineStatus'),
			dict: dict({
				value: 'id',
				label: 'text',
				data: [
					{
						id: 0,
						text: t('message.pages.host.online.offline'),
						color: 'info',
					},
					{
						id: 1,
						text: t('message.pages.host.online.online'),
						color: 'success',
					},
				],
			}),
			type: 'dict-select',
			column: {
				minWidth: 90,
			},
			form: {
				show: false,
			},
		},
		supervisor_version: {
			title: t('message.pages.host.table.columns.supervisorVersion'),
			type: 'input',
			column: {
				minWidth: 100,
			},
			form: {
				show: false,
			},
		},
		last_heartbeat_at: {
			title: t('message.pages.host.table.columns.lastHeartbeatAt'),
			type: 'datetime',
			column: {
				minWidth: 150,
			},
			form: {
				show: false,
			},
		},
		certificate_status: {
			title: t('message.pages.host.table.columns.certificateStatus'),
			dict: dict({
				value: 'value',
				label: 'label',
				data: [
					{
						value: 'valid',
						label: t('message.pages.host.certificate.valid'),
						color: 'success',
					},
					{
						value: 'revoked',
						label: t('message.pages.host.certificate.revoked'),
						color: 'danger',
					},
					{
						value: 'expired',
						label: t('message.pages.host.certificate.expired'),
						color: 'warning',
					},
				],
			}),
			type: 'dict-select',
			column: {
				show: editionColumnShow('CA_CRL_MANAGEMENT'),
				minWidth: 90,
			},
			form: {
				show: false,
			},
		},
		extra_info: {
			title: t('message.pages.host.table.columns.extraInfo'),
			type: 'textarea',
			column: {
				show: true,
				minWidth: 200,
				formatter: ({ value }: any) => {
					if (!value || Object.keys(value).length === 0) return '-';
					return JSON.stringify(value, null, 2);
				},
			},
			form: {
				show: true,
				disabled: true,
				valueBuilder: ({ form }: any) => {
					if (form.extra_info && typeof form.extra_info === 'object') {
						form.extra_info = JSON.stringify(form.extra_info, null, 2);
					}
				},
			},
		},
		heartbeat_server: {
			title: t('message.pages.host.table.columns.heartbeatServer'),
			type: 'dict-select',
			dict: dict({
				url: '/api/taurus/heartbeat-server/',
				value: 'id',
				label: 'name',
			}),
			column: {
				show: editionColumnShow('HEARTBEAT_SERVER_CLUSTER'),
			},
			form: {
				show: editionColumnShow('HEARTBEAT_SERVER_CLUSTER'),
				component: {
					placeholder: t('message.pages.host.form.heartbeatServerPlaceholder'),
					clearable: true,
					disabled: true,
				},
			},
		},
		...commonCrudConfig({
			create_datetime: {
				table: true,
			},
		}),
	},
};
}
