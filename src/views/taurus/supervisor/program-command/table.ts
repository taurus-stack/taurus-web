import { dict } from '@fast-crud/fast-crud';
import { commonCrudConfig } from '/@/utils/commonCrud';
import { auth } from '/@/utils/authFunction';
import { actionbar, rowHandle } from '/@/views/taurus/config/utils/common';
import { i18n } from '/@/i18n';

// @ts-ignore — vue-i18n type inference chain too deep, runtime is fine
const t = i18n.global.t;

export const getProgramCommandConfig = function (): any {
	return {
		container: {
			is: 'fs-layout-card',
		},
		actionbar: actionbar(auth('ProgramCommand:Create'), false, false),
		rowHandle: rowHandle(true, false, auth('ProgramCommand:Edit'), auth('ProgramCommand:Delete'), 'right', 120),
		columns: {
			search: {
				title: t('message.pages.programCommand.table.columns.keyword'),
				column: {
					show: false,
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.programCommand.form.keywordPlaceholder'),
					},
				},
				form: {
					show: false,
				},
			},
			id: {
				title: t('message.pages.programCommand.table.columns.id'),
				type: 'input',
				column: {
					show: false,
				},
				form: {
					disabled: true,
					show: false,
				},
			},
			host: {
				title: t('message.pages.programCommand.table.columns.host'),
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
					show: true,
					rules: [{ required: true, message: t('message.pages.programCommand.form.hostRequired') }],
					component: {
						placeholder: t('message.pages.programCommand.form.hostPlaceholder'),
					},
				},
			},
			host_name: {
				title: t('message.pages.programCommand.table.columns.hostName'),
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
						placeholder: t('message.pages.programCommand.form.hostNamePlaceholder'),
					},
				},
			},
			host_ip: {
				title: t('message.pages.programCommand.table.columns.hostIp'),
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
						placeholder: t('message.pages.programCommand.form.hostIpPlaceholder'),
					},
				},
			},
			program_name: {
				title: t('message.pages.programCommand.table.columns.programName'),
				type: 'input',
				column: {
					show: true,
					minWidth: 150,
				},
				form: {
					show: true,
					rules: [{ required: true, message: t('message.pages.programCommand.form.programNameRequired') }],
					component: {
						placeholder: t('message.pages.programCommand.form.programNamePlaceholder'),
					},
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.programCommand.form.programNamePlaceholder'),
					},
				},
			},
			action: {
				title: t('message.pages.programCommand.table.columns.action'),
				type: 'dict-select',
				dict: dict({
					data: [
						{ label: t('message.pages.programCommand.action.install'), value: 'install', color: 'success' },
						{ label: t('message.pages.programCommand.action.upgrade'), value: 'upgrade', color: 'warning' },
						{ label: t('message.pages.programCommand.action.start'), value: 'start', color: 'success' },
						{ label: t('message.pages.programCommand.action.stop'), value: 'stop', color: 'danger' },
						{ label: t('message.pages.programCommand.action.restart'), value: 'restart', color: 'warning' },
						{ label: t('message.pages.programCommand.action.remove'), value: 'remove', color: 'danger' },
					],
				}),
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: true,
					rules: [{ required: true, message: t('message.pages.programCommand.form.actionRequired') }],
					component: {
						placeholder: t('message.pages.programCommand.form.actionPlaceholder'),
					},
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.programCommand.form.actionPlaceholder'),
					},
				},
			},
			target_version: {
				title: t('message.pages.programCommand.table.columns.targetVersion'),
				type: 'input',
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: true,
					component: {
						placeholder: t('message.pages.programCommand.form.targetVersionPlaceholder'),
					},
				},
			},
			status: {
				title: t('message.pages.programCommand.table.columns.status'),
				type: 'dict-select',
				dict: dict({
					data: [
						{ label: t('message.pages.programCommand.status.pending'), value: 0, color: 'info' },
						{ label: t('message.pages.programCommand.status.running'), value: 1, color: 'warning' },
						{ label: t('message.pages.programCommand.status.success'), value: 2, color: 'success' },
						{ label: t('message.pages.programCommand.status.failed'), value: 3, color: 'danger' },
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
						placeholder: t('message.pages.programCommand.form.statusPlaceholder'),
					},
				},
			},
			dispatched: {
				title: t('message.pages.programCommand.table.columns.dispatched'),
				type: 'dict-switch',
				dict: dict({
					data: [
						{ label: t('message.pages.programCommand.bool.yes'), value: true },
						{ label: t('message.pages.programCommand.bool.no'), value: false },
					],
				}),
				column: {
					show: true,
					minWidth: 80,
				},
				form: {
					show: false,
				},
			},
			dispatched_at: {
				title: t('message.pages.programCommand.table.columns.dispatchedAt'),
				type: 'datetime',
				column: {
					show: true,
					minWidth: 180,
				},
				form: {
					show: false,
				},
			},
			result_message: {
				title: t('message.pages.programCommand.table.columns.resultMessage'),
				type: 'textarea',
				column: {
					show: true,
					minWidth: 200,
				},
				form: {
					show: false,
				},
			},
			executed_at: {
				title: t('message.pages.programCommand.table.columns.executedAt'),
				type: 'datetime',
				column: {
					show: true,
					minWidth: 180,
				},
				form: {
					show: false,
				},
			},
			config: {
				title: t('message.pages.programCommand.table.columns.config'),
				type: 'textarea',
				column: {
					show: false,
				},
				form: {
					show: true,
					component: {
						type: 'textarea',
						rows: 4,
						placeholder: t('message.pages.programCommand.form.configPlaceholder'),
					},
					valueBuilder: ({ value }: any) => {
						if (typeof value === 'object' && value !== null) {
							return JSON.stringify(value, null, 2);
						}
						return value || '';
					},
					valueResolve: ({ value }: any) => {
						if (typeof value === 'string') {
							try {
								return JSON.parse(value);
							} catch {
								return {};
							}
						}
						return value;
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
