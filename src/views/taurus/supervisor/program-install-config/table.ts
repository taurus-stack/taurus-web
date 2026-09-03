import { dict } from '@fast-crud/fast-crud';
import { commonCrudConfig } from '/@/utils/commonCrud';
import { auth } from '/@/utils/authFunction';
import { actionbar, rowHandle } from '/@/views/taurus/config/utils/common';
import { i18n } from '/@/i18n';

// @ts-ignore — vue-i18n type inference chain too deep, runtime is fine
const t = i18n.global.t;

export const getProgramInstallConfig = function (): any {
	return {
		container: {
			is: 'fs-layout-card',
		},
		actionbar: actionbar(auth('ProgramInstallConfig:Create'), false, false),
		rowHandle: rowHandle(true, false, auth('ProgramInstallConfig:Edit'), auth('ProgramInstallConfig:Delete'), 'right', 120),
		columns: {
			search: {
				title: t('message.pages.programInstallConfig.table.columns.keyword'),
				column: {
					show: false,
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.programInstallConfig.form.keywordPlaceholder'),
					},
				},
				form: {
					show: false,
				},
			},
			id: {
				title: t('message.pages.programInstallConfig.table.columns.id'),
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
				title: t('message.pages.programInstallConfig.table.columns.host'),
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
					rules: [{ required: true, message: t('message.pages.programInstallConfig.form.hostRequired') }],
					component: {
						placeholder: t('message.pages.programInstallConfig.form.hostPlaceholder'),
					},
				},
			},
			host_name: {
				title: t('message.pages.programInstallConfig.table.columns.hostName'),
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
						placeholder: t('message.pages.programInstallConfig.form.hostNamePlaceholder'),
					},
				},
			},
			host_ip: {
				title: t('message.pages.programInstallConfig.table.columns.hostIp'),
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
						placeholder: t('message.pages.programInstallConfig.form.hostIpPlaceholder'),
					},
				},
			},
			program_name: {
				title: t('message.pages.programInstallConfig.table.columns.programName'),
				type: 'input',
				column: {
					show: true,
					minWidth: 150,
				},
				form: {
					show: true,
					rules: [{ required: true, message: t('message.pages.programInstallConfig.form.programNameRequired') }],
					component: {
						placeholder: t('message.pages.programInstallConfig.form.programNamePlaceholder'),
					},
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.programInstallConfig.form.programNamePlaceholder'),
					},
				},
			},
			version: {
				title: t('message.pages.programInstallConfig.table.columns.version'),
				type: 'input',
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: true,
					rules: [{ required: true, message: t('message.pages.programInstallConfig.form.versionRequired') }],
					component: {
						placeholder: t('message.pages.programInstallConfig.form.versionPlaceholder'),
					},
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.programInstallConfig.form.versionPlaceholder'),
					},
				},
			},
			auto_start: {
				title: t('message.pages.programInstallConfig.table.columns.autoStart'),
				type: 'dict-switch',
				dict: dict({
					data: [
						{ label: t('message.pages.programInstallConfig.bool.yes'), value: true },
						{ label: t('message.pages.programInstallConfig.bool.no'), value: false },
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
						placeholder: t('message.pages.programInstallConfig.form.autoStartPlaceholder'),
					},
				},
			},
			installed: {
				title: t('message.pages.programInstallConfig.table.columns.installed'),
				type: 'dict-switch',
				dict: dict({
					data: [
						{ label: t('message.pages.programInstallConfig.bool.yes'), value: true },
						{ label: t('message.pages.programInstallConfig.bool.no'), value: false },
					],
				}),
				column: {
					show: true,
					minWidth: 80,
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
						placeholder: t('message.pages.programInstallConfig.form.installedPlaceholder'),
					},
				},
			},
			installing: {
				title: t('message.pages.programInstallConfig.table.columns.installing'),
				type: 'dict-switch',
				dict: dict({
					data: [
						{ label: t('message.pages.programInstallConfig.bool.yes'), value: true },
						{ label: t('message.pages.programInstallConfig.bool.no'), value: false },
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
			enabled: {
				title: t('message.pages.programInstallConfig.table.columns.enabled'),
				type: 'dict-switch',
				dict: dict({
					data: [
						{ label: t('message.pages.programInstallConfig.bool.yes'), value: true },
						{ label: t('message.pages.programInstallConfig.bool.no'), value: false },
					],
				}),
				column: {
					show: true,
					minWidth: 80,
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
						placeholder: t('message.pages.programInstallConfig.form.enabledPlaceholder'),
					},
				},
			},
			user: {
				title: t('message.pages.programInstallConfig.table.columns.user'),
				type: 'input',
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: true,
					component: {
						placeholder: t('message.pages.programInstallConfig.form.userPlaceholder'),
					},
				},
			},
			group: {
				title: t('message.pages.programInstallConfig.table.columns.group'),
				type: 'input',
				column: {
					show: false,
				},
				form: {
					show: true,
					component: {
						placeholder: t('message.pages.programInstallConfig.form.groupPlaceholder'),
					},
				},
			},
			max_retries: {
				title: t('message.pages.programInstallConfig.table.columns.maxRetries'),
				type: 'number',
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: true,
					value: 3,
					component: {
						placeholder: t('message.pages.programInstallConfig.form.maxRetriesPlaceholder'),
					},
				},
			},
			config: {
				title: t('message.pages.programInstallConfig.table.columns.config'),
				type: 'textarea',
				column: {
					show: false,
				},
				form: {
					show: true,
					component: {
						type: 'textarea',
						rows: 4,
						placeholder: t('message.pages.programInstallConfig.form.configPlaceholder'),
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
			dispatched_at: {
				title: t('message.pages.programInstallConfig.table.columns.dispatchedAt'),
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
				title: t('message.pages.programInstallConfig.table.columns.resultMessage'),
				type: 'text',
				column: {
					show: true,
					minWidth: 200,
					showOverflowTooltip: true,
				},
				form: {
					show: true,
					disabled: true,
					component: {
						type: 'textarea',
						rows: 4,
						placeholder: t('message.pages.programInstallConfig.form.resultMessagePlaceholder'),
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
