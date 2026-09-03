import { dict } from '@fast-crud/fast-crud';
import { commonCrudConfig } from '/@/utils/commonCrud';
import { actionbar, rowHandle } from '/@/views/taurus/config/utils/common';
import { i18n } from '/@/i18n';
const t = i18n.global.t;

export const logConfig = {
	container: {
		is: 'fs-layout-card',
	},
	actionbar: actionbar(false, false, false),
	rowHandle: rowHandle(true, false, false, false, 'right', 80),
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
				show: false,
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
		log_level: {
			title: t('message.importExcel.logLevel'),
			type: 'dict-select',
			dict: dict({
				data: [
					{ label: 'DEBUG', value: 'DEBUG', color: 'info' },
					{ label: 'INFO', value: 'INFO', color: 'success' },
					{ label: 'WARNING', value: 'WARNING', color: 'warning' },
					{ label: 'ERROR', value: 'ERROR', color: 'danger' },
					{ label: 'CRITICAL', value: 'CRITICAL', color: 'danger' },
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
					placeholder: t('message.importExcel.logLevel'),
				},
			},
		},
		log_time: {
			title: t('message.importExcel.logTime'),
			type: 'datetime',
			column: {
				show: true,
				minWidth: 180,
			},
			form: {
				show: false,
			},
		},
		message: {
			title: t('message.importExcel.logContent'),
			type: 'textarea',
			column: {
				show: true,
				minWidth: 300,
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
					placeholder: t('message.importExcel.logContent'),
				},
			},
		},
		source_file: {
			title: t('message.importExcel.srcFile'),
			type: 'text',
			column: {
				show: false,
			},
			form: {
				show: false,
			},
		},
		source_line: {
			title: t('message.importExcel.srcLineNo'),
			type: 'number',
			column: {
				show: false,
			},
			form: {
				show: false,
			},
		},
		process_id: {
			title: t('message.processId'),
			type: 'number',
			column: {
				show: false,
			},
			form: {
				show: false,
			},
		},
		thread_id: {
			title: t('message.threadId'),
			type: 'number',
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
			},
		}),
	},
};
