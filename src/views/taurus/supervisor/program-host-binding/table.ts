import { dict } from '@fast-crud/fast-crud';
import { commonCrudConfig } from '/@/utils/commonCrud';
import { auth } from '/@/utils/authFunction';
import { actionbar, rowHandle } from '/@/views/taurus/config/utils/common';
import { i18n } from '/@/i18n';
const t = i18n.global.t;

export const programHostBindingConfig = {
	container: {
		is: 'fs-layout-card',
	},
	actionbar: actionbar(auth('ProgramHostBinding:Create'), false, false),
	rowHandle: rowHandle(true, false, auth('ProgramHostBinding:Edit'), auth('ProgramHostBinding:Delete'), 'right', 160),
	columns: {
		search: {
			title: t('message.importExcel.keywordLabel'),
			column: {
				show: false,
			},
			search: {
				show: true,
				component: {
					props: {
						clearable: true,
					},
					placeholder: t('message.inputKeyword'),
				},
			},
			form: {
				show: false,
			},
		},
		id: {
			title: 'ID',
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
			title: t('message.importExcel.hostingHost'),
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
				rules: [{ required: true, message: t('message.pleaseSelectHostMark') }],
				component: {
					placeholder: t('message.importExcel.selectHost'),
				},
			},
		},
		host_name: {
			title: t('message.hostName'),
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
					placeholder: t('message.hostName'),
				},
			},
		},
		host_ip: {
			title: t('message.hostIp'),
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
					placeholder: t('message.hostIp'),
				},
			},
		},
		template: {
			title: t('message.importExcel.installTemplate'),
			type: 'dict-select',
			dict: dict({
				url: '/api/taurus/program-install-template/',
				value: 'id',
				label: 'name',
			}),
			column: {
				show: false,
			},
			form: {
				show: true,
				rules: [{ required: true, message: t('message.pleaseSelectInstallTemplateMark') }],
				component: {
					placeholder: t('message.importExcel.selectInstallTemplate'),
				},
			},
		},
		template_name: {
			title: t('message.templateName'),
			type: 'text',
			column: {
				show: true,
				minWidth: 200,
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
					placeholder: t('message.templateName'),
				},
			},
		},
		program_name: {
			title: t('message.importExcel.programName'),
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
					placeholder: t('message.importExcel.programName'),
				},
			},
		},
		template_version: {
			title: t('message.importExcel.templateVersion'),
			type: 'text',
			column: {
				show: true,
				minWidth: 100,
			},
			form: {
				show: false,
			},
		},
		installed_version: {
			title: t('message.importExcel.installedVersion'),
			type: 'text',
			column: {
				show: true,
				minWidth: 100,
			},
			form: {
				show: false,
			},
		},
		installed: {
			title: t('message.importExcel.hostBindingInstallStatus'),
			type: 'dict-switch',
			dict: dict({
				data: [
					{ label: t('message.installed'), value: true, color: 'success' },
					{ label: t('message.notInstalled'), value: false, color: 'info' },
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
					placeholder: t('message.importExcel.hostBindingInstallStatus'),
				},
			},
		},
		installing: {
			title: t('message.importExcel.installing'),
			type: 'dict-switch',
			dict: dict({
				data: [
					{ label: t('message.installing'), value: true, color: 'warning' },
					{ label: t('message.idle'), value: false, color: 'info' },
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
		dispatched_at: {
			title: t('message.importExcel.issuedTime'),
			type: 'datetime',
			column: {
				show: true,
				minWidth: 160,
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