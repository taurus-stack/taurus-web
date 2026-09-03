import { dict } from '@fast-crud/fast-crud';
import { commonCrudConfig } from '/@/utils/commonCrud';
import { actionbar, rowHandle } from '/@/views/taurus/config/utils/common';
import { i18n } from '/@/i18n';

export function getProgramConfig(): any {
	// @ts-ignore — vue-i18n type inference chain too deep, runtime is fine
	const t = i18n.global.t;
	return {
		container: {
			is: 'fs-layout-card',
		},
		actionbar: actionbar(false, false, false),
		rowHandle: rowHandle(true, false, false, false, 'right', 80),
		columns: {
			search: {
				title: t('message.pages.program.table.columns.keyword'),
				column: {
					show: false,
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.program.form.keywordPlaceholder'),
					},
				},
				form: {
					show: false,
				},
			},
			id: {
				title: t('message.pages.program.table.columns.id'),
				type: 'input',
				column: {
					show: true,
				},
				form: {
					show: false,
				},
			},
			host: {
				title: t('message.pages.program.table.columns.host'),
				type: 'dict-select',
				dict: dict({
					url: '/api/taurus/host/',
					value: 'id',
					label: 'host_name',
				}),
				column: {
					show: false,
				},
				form: {
					show: false,
				},
			},
			host_name: {
				title: t('message.pages.program.table.columns.hostName'),
				type: 'text',
				column: {
					show: true,
					minWidth: 180,
				},
				form: {
					show: false,
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.program.form.hostNamePlaceholder'),
					},
				},
			},
			host_ip: {
				title: t('message.pages.program.table.columns.hostIp'),
				type: 'text',
				column: {
					show: true,
					minWidth: 130,
				},
				form: {
					show: false,
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.program.form.hostIpPlaceholder'),
					},
				},
			},
			name: {
				title: t('message.pages.program.table.columns.name'),
				type: 'text',
				column: {
					show: true,
					minWidth: 150,
				},
				form: {
					show: false,
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.program.form.namePlaceholder'),
					},
				},
			},
			version: {
				title: t('message.pages.program.table.columns.version'),
				type: 'text',
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: false,
				},
			},
			status: {
				title: t('message.pages.program.table.columns.status'),
				type: 'dict-select',
				dict: dict({
					data: [
						{ label: t('message.pages.program.status.stopped'), value: 'stopped', color: 'info' },
						{ label: t('message.pages.program.status.starting'), value: 'starting', color: 'warning' },
						{ label: t('message.pages.program.status.running'), value: 'running', color: 'success' },
						{ label: t('message.pages.program.status.stopping'), value: 'stopping', color: 'warning' },
						{ label: t('message.pages.program.status.crashed'), value: 'crashed', color: 'danger' },
						{ label: t('message.pages.program.status.upgrading'), value: 'upgrading', color: 'warning' },
					],
				}),
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: false,
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.program.form.statusPlaceholder'),
					},
				},
			},
			pid: {
				title: t('message.pages.program.table.columns.pid'),
				type: 'number',
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: false,
				},
			},
			port: {
				title: t('message.pages.program.table.columns.port'),
				type: 'number',
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: false,
				},
			},
			auto_start: {
				title: t('message.pages.program.table.columns.autoStart'),
				type: 'dict-switch',
				dict: dict({
					data: [
						{ label: t('message.pages.program.bool.yes'), value: true },
						{ label: t('message.pages.program.bool.no'), value: false },
					],
				}),
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: false,
				},
			},
			restart_on_crash: {
				title: t('message.pages.program.table.columns.restartOnCrash'),
				type: 'dict-switch',
				dict: dict({
					data: [
						{ label: t('message.pages.program.bool.yes'), value: true },
						{ label: t('message.pages.program.bool.no'), value: false },
					],
				}),
				column: {
					show: false,
				},
				form: {
					show: false,
				},
			},
			config: {
				title: t('message.pages.program.table.columns.config'),
				type: 'textarea',
				column: {
					show: false,
				},
				form: {
					show: false,
				},
			},
			...commonCrudConfig({
				create_datetime: {
					table: true,
					minWidth: 160,
				},
			}),
		},
	};
}
