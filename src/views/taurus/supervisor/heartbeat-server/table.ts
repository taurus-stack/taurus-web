import { dict } from '@fast-crud/fast-crud';
import { commonCrudConfig } from '/@/utils/commonCrud';
import { auth } from '/@/utils/authFunction';
import { actionbar, rowHandle } from '/@/views/taurus/config/utils/common';
import { i18n } from '/@/i18n';

// @ts-ignore — vue-i18n type inference chain too deep, runtime is fine
const t = i18n.global.t;

export const getHeartbeatServerConfig = function (): any {
	return {
		container: {
			is: 'fs-layout-card',
		},
		actionbar: actionbar(auth('HeartbeatServer:Create'), false, false),
		rowHandle: rowHandle(true, false, auth('HeartbeatServer:Edit'), auth('HeartbeatServer:Delete'), 'right', 120),
		columns: {
			search: {
				title: t('message.pages.heartbeatServer.table.columns.keyword'),
				column: {
					show: false,
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.heartbeatServer.form.keywordPlaceholder'),
					},
				},
				form: {
					show: false,
				},
			},
			id: {
				title: t('message.pages.heartbeatServer.table.columns.id'),
				type: 'input',
				column: {
					show: false,
				},
				form: {
					disabled: true,
					show: false,
				},
			},
			name: {
				title: t('message.pages.heartbeatServer.table.columns.name'),
				type: 'input',
				column: {
					show: true,
					minWidth: 150,
				},
				form: {
					show: true,
					rules: [{ required: true, message: t('message.pages.heartbeatServer.form.nameRequired') }],
					component: {
						placeholder: t('message.pages.heartbeatServer.form.namePlaceholder'),
					},
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.heartbeatServer.form.nameSearchPlaceholder'),
					},
				},
			},
			address: {
				title: t('message.pages.heartbeatServer.table.columns.address'),
				type: 'input',
				column: {
					show: true,
					minWidth: 200,
				},
				form: {
					show: true,
					rules: [{ required: true, message: t('message.pages.heartbeatServer.form.addressRequired') }],
					component: {
						placeholder: t('message.pages.heartbeatServer.form.addressPlaceholder'),
					},
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.heartbeatServer.form.addressSearchPlaceholder'),
					},
				},
			},
			subnet: {
				title: t('message.pages.heartbeatServer.table.columns.subnet'),
				type: 'input',
				column: {
					show: true,
					minWidth: 150,
				},
				form: {
					show: true,
					component: {
						placeholder: t('message.pages.heartbeatServer.form.subnetPlaceholder'),
					},
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.heartbeatServer.form.subnetSearchPlaceholder'),
					},
				},
			},
			max_connections: {
				title: t('message.pages.heartbeatServer.table.columns.maxConnections'),
				type: 'number',
				column: {
					show: true,
					minWidth: 120,
				},
				form: {
					show: true,
					value: 10000,
					component: {
						placeholder: t('message.pages.heartbeatServer.form.maxConnectionsPlaceholder'),
					},
				},
			},
			current_connections: {
				title: t('message.pages.heartbeatServer.table.columns.currentConnections'),
				type: 'number',
				column: {
					show: true,
					minWidth: 120,
				},
				form: {
					show: false,
				},
			},
			load_ratio: {
				title: t('message.pages.heartbeatServer.table.columns.loadRatio'),
				type: 'text',
				column: {
					show: true,
					minWidth: 100,
					formatter: ({ value }: any) => {
						if (value === undefined || value === null) return '-';
						return (value * 100).toFixed(1) + '%';
					},
				},
				form: {
					show: false,
				},
			},
			weight: {
				title: t('message.pages.heartbeatServer.table.columns.weight'),
				type: 'number',
				column: {
					show: true,
					minWidth: 80,
				},
				form: {
					show: true,
					value: 100,
					component: {
						placeholder: t('message.pages.heartbeatServer.form.weightPlaceholder'),
					},
				},
			},
			is_active: {
				title: t('message.pages.heartbeatServer.table.columns.isActive'),
				type: 'dict-switch',
				dict: dict({
					data: [
						{ label: t('message.pages.heartbeatServer.table.status.enabled'), value: true },
						{ label: t('message.pages.heartbeatServer.table.status.disabled'), value: false },
					],
				}),
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: true,
					value: true,
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.heartbeatServer.form.isActiveSearchPlaceholder'),
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
};