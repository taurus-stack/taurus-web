import { dict } from '@fast-crud/fast-crud';
import { commonCrudConfig } from '/@/utils/commonCrud';
import { auth } from '/@/utils/authFunction';
import { actionbar, rowHandle } from '/@/views/taurus/config/utils/common';
import { i18n } from '/@/i18n';

// @ts-ignore — vue-i18n type inference chain too deep, runtime is fine
const t = i18n.global.t;

export const getProgramInstallPolicyConfig = function (): any {
	return {
		container: {
			is: 'fs-layout-card',
		},
		actionbar: actionbar(auth('ProgramInstallPolicy:Create'), false, false),
		rowHandle: rowHandle(true, false, auth('ProgramInstallPolicy:Edit'), auth('ProgramInstallPolicy:Delete'), 'right', 160),
		columns: {
			search: {
				title: t('message.pages.programInstallPolicy.table.columns.keyword'),
				column: {
					show: false,
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.programInstallPolicy.form.keywordPlaceholder'),
					},
				},
				form: {
					show: false,
				},
			},
			id: {
				title: t('message.pages.programInstallPolicy.table.columns.id'),
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
				title: t('message.pages.programInstallPolicy.table.columns.name'),
				type: 'input',
				column: {
					show: true,
					minWidth: 180,
				},
				form: {
					show: true,
					rules: [{ required: true, message: t('message.pages.programInstallPolicy.form.nameRequired') }],
					component: {
						placeholder: t('message.pages.programInstallPolicy.form.namePlaceholder'),
					},
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.programInstallPolicy.form.nameSearchPlaceholder'),
					},
				},
			},
			program_name: {
				title: t('message.pages.programInstallPolicy.table.columns.programName'),
				type: 'input',
				column: {
					show: true,
					minWidth: 150,
				},
				form: {
					show: true,
					rules: [{ required: true, message: t('message.pages.programInstallPolicy.form.programNameRequired') }],
					component: {
						placeholder: t('message.pages.programInstallPolicy.form.programNamePlaceholder'),
					},
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.programInstallPolicy.form.programNameSearchPlaceholder'),
					},
				},
			},
			version: {
				title: t('message.pages.programInstallPolicy.table.columns.version'),
				type: 'input',
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: true,
					rules: [{ required: true, message: t('message.pages.programInstallPolicy.form.versionRequired') }],
					component: {
						placeholder: t('message.pages.programInstallPolicy.form.versionPlaceholder'),
					},
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.programInstallPolicy.form.versionSearchPlaceholder'),
					},
				},
			},
			status: {
				title: t('message.pages.programInstallPolicy.table.columns.status'),
				type: 'dict-select',
				dict: dict({
					data: [
						{ label: t('message.pages.programInstallPolicy.table.status.disabled'), value: 0, color: 'info' },
						{ label: t('message.pages.programInstallPolicy.table.status.enabled'), value: 1, color: 'success' },
						{ label: t('message.pages.programInstallPolicy.table.status.paused'), value: 2, color: 'warning' },
					],
				}),
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: true,
					value: 0,
					component: {
						placeholder: t('message.pages.programInstallPolicy.form.statusPlaceholder'),
					},
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.programInstallPolicy.form.statusSearchPlaceholder'),
					},
				},
			},
			auto_start: {
				title: t('message.pages.programInstallPolicy.table.columns.autoStart'),
				type: 'dict-switch',
				dict: dict({
					data: [
						{ label: t('message.pages.programInstallPolicy.bool.yes'), value: true },
						{ label: t('message.pages.programInstallPolicy.bool.no'), value: false },
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
			auto_apply: {
				title: t('message.pages.programInstallPolicy.table.columns.autoApply'),
				type: 'dict-switch',
				dict: dict({
					data: [
						{ label: t('message.pages.programInstallPolicy.bool.yes'), value: true },
						{ label: t('message.pages.programInstallPolicy.bool.no'), value: false },
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
			priority: {
				title: t('message.pages.programInstallPolicy.table.columns.priority'),
				type: 'number',
				column: {
					show: true,
					minWidth: 80,
				},
				form: {
					show: true,
					value: 100,
					component: {
						placeholder: t('message.pages.programInstallPolicy.form.priorityPlaceholder'),
					},
				},
			},
			matched_hosts_count: {
				title: t('message.pages.programInstallPolicy.table.columns.matchedHostsCount'),
				type: 'number',
				column: {
					show: true,
					minWidth: 100,
				},
				form: {
					show: false,
				},
			},
			applied_hosts_count: {
				title: t('message.pages.programInstallPolicy.table.columns.appliedHostsCount'),
				type: 'number',
				column: {
					show: true,
					minWidth: 120,
				},
				form: {
					show: false,
				},
			},
			user: {
				title: t('message.pages.programInstallPolicy.table.columns.user'),
				type: 'input',
				column: {
					show: false,
				},
				form: {
					show: true,
					component: {
						placeholder: t('message.pages.programInstallPolicy.form.userPlaceholder'),
					},
				},
			},
			group: {
				title: t('message.pages.programInstallPolicy.table.columns.group'),
				type: 'input',
				column: {
					show: false,
				},
				form: {
					show: true,
					component: {
						placeholder: t('message.pages.programInstallPolicy.form.groupPlaceholder'),
					},
				},
			},
			match_rules: {
				title: t('message.pages.programInstallPolicy.table.columns.matchRules'),
				type: 'textarea',
				column: {
					show: false,
				},
				form: {
					show: true,
					component: {
						type: 'textarea',
						rows: 4,
						placeholder: t('message.pages.programInstallPolicy.form.matchRulesPlaceholder'),
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
			config: {
				title: t('message.pages.programInstallPolicy.table.columns.config'),
				type: 'textarea',
				column: {
					show: false,
				},
				form: {
					show: true,
					component: {
						type: 'textarea',
						rows: 4,
						placeholder: t('message.pages.programInstallPolicy.form.configPlaceholder'),
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