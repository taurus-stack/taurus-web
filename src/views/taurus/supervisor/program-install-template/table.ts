import { dict } from '@fast-crud/fast-crud';
import { commonCrudConfig } from '/@/utils/commonCrud';
import { auth } from '/@/utils/authFunction';
import { actionbar, rowHandle } from '/@/views/taurus/config/utils/common';
import { i18n } from '/@/i18n';

// @ts-ignore — vue-i18n type inference chain too deep, runtime is fine
const t = i18n.global.t;

export const getProgramInstallTemplateConfig = function (): any {
	return {
		container: {
			is: 'fs-layout-card',
		},
		actionbar: actionbar(auth('ProgramInstallTemplate:Create'), false, false),
		rowHandle: rowHandle(true, false, auth('ProgramInstallTemplate:Edit'), auth('ProgramInstallTemplate:Delete'), 'right', 120),
		columns: {
			search: {
				title: t('message.pages.programInstallTemplate.table.columns.keyword'),
				column: {
					show: false,
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.programInstallTemplate.form.keywordPlaceholder'),
					},
				},
				form: {
					show: false,
				},
			},
			id: {
				title: t('message.pages.programInstallTemplate.table.columns.id'),
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
				title: t('message.pages.programInstallTemplate.table.columns.name'),
				type: 'input',
				column: {
					show: true,
					minWidth: 200,
				},
				form: {
					show: true,
					rules: [{ required: true, message: t('message.pages.programInstallTemplate.form.nameRequired') }],
					component: {
						placeholder: t('message.pages.programInstallTemplate.form.namePlaceholder'),
					},
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.programInstallTemplate.form.nameSearchPlaceholder'),
					},
				},
			},
			program_name: {
				title: t('message.pages.programInstallTemplate.table.columns.programName'),
				type: 'input',
				column: {
					show: true,
					minWidth: 150,
				},
				form: {
					show: true,
					rules: [{ required: true, message: t('message.pages.programInstallTemplate.form.programNameRequired') }],
					component: {
						placeholder: t('message.pages.programInstallTemplate.form.programNamePlaceholder'),
					},
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.programInstallTemplate.form.programNameSearchPlaceholder'),
					},
				},
			},
			version: {
				title: t('message.pages.programInstallTemplate.table.columns.version'),
				type: 'input',
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: true,
					rules: [{ required: true, message: t('message.pages.programInstallTemplate.form.versionRequired') }],
					component: {
						placeholder: t('message.pages.programInstallTemplate.form.versionPlaceholder'),
					},
				},
			},
			auto_start: {
				title: t('message.pages.programInstallTemplate.table.columns.autoStart'),
				type: 'dict-switch',
				dict: dict({
					data: [
						{ label: t('message.pages.programInstallTemplate.bool.yes'), value: true },
						{ label: t('message.pages.programInstallTemplate.bool.no'), value: false },
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
			},
			user: {
				title: t('message.pages.programInstallTemplate.table.columns.user'),
				type: 'input',
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: true,
					component: {
						placeholder: t('message.pages.programInstallTemplate.form.userPlaceholder'),
					},
				},
			},
			group: {
				title: t('message.pages.programInstallTemplate.table.columns.group'),
				type: 'input',
				column: {
					show: false,
				},
				form: {
					show: true,
					component: {
						placeholder: t('message.pages.programInstallTemplate.form.groupPlaceholder'),
					},
				},
			},
			max_retries: {
				title: t('message.pages.programInstallTemplate.table.columns.maxRetries'),
				type: 'number',
				column: {
					show: true,
					minWidth: 120,
				},
				form: {
					show: true,
					value: 3,
					component: {
						placeholder: t('message.pages.programInstallTemplate.form.maxRetriesPlaceholder'),
					},
				},
			},
			bound_hosts_count: {
				title: t('message.pages.programInstallTemplate.table.columns.boundHostsCount'),
				type: 'number',
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: false,
				},
			},
			config: {
				title: t('message.pages.programInstallTemplate.table.columns.config'),
				column: {
					show: false,
				},
				form: {
					col: {
						span: 24,
					},
					show: true,
					component: {
						name: 'fs-json-editor',
						placeholder: t('message.pages.programInstallTemplate.form.configPlaceholder'),
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