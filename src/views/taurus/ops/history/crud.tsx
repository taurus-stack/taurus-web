import * as api from '/@/api/taurus/ops-execution/api';
import {
	UserPageQuery,
	DelReq,
	CreateCrudOptionsProps,
	CreateCrudOptionsRet,
	dict,
} from '@fast-crud/fast-crud';
import { actionbar, rowHandle } from '/@/views/taurus/config/utils/common';
import { auth } from '/@/utils/authFunction';
import { i18n } from '/@/i18n';

const t = i18n.global.t;

export const createCrudOptions = function ({
	crudExpose: _crudExpose,
	context: _context,
}: CreateCrudOptionsProps): CreateCrudOptionsRet {
	const pageRequest = async (query: UserPageQuery) => {
		return await api.GetList(query);
	};
	const delRequest = async ({ row }: DelReq) => {
		return await api.DelObj(row.id);
	};

	return {
		crudOptions: {
			request: {
				pageRequest,
				delRequest,
			},
			actionbar: actionbar(false, false, auth('history:Del')),
			rowHandle: {
				...rowHandle(true, false, false, true),
				buttons: {
					view: {
						show: true,
					},
					edit: {
						show: false,
					},
					remove: {
						show: true,
					},
				},
			},
			tabs: {
				show: true,
				name: 'status',
				type: 'card',
				defaultOption: {
					show: true,
					value: 'all',
					label: t('message.pages.history.tabs.all'),
				},
			},
			columns: {
				$expand: {
					title: t('message.pages.history.table.columns.expand'),
					form: { show: false },
					column: {
						type: 'expand',
						align: 'center',
						minWidth: '55px',
						columnSetDisabled: true,
					},
					order: -2,
				},
				id: {
					title: t('message.pages.history.table.columns.id'),
					type: 'input',
					column: { show: false },
					form: { show: false },
				},
				execution_id: {
					title: t('message.pages.history.table.columns.executionId'),
					type: 'input',
					search: {
						show: true,
						component: { props: { clearable: true, placeholder: t('message.pages.history.form.executionIdPlaceholder') } },
					},
					column: {
						minWidth: 120,
						showOverflowTooltip: true,
					},
					form: { show: false },
				},
				batch_id: {
					title: t('message.pages.history.table.columns.batchId'),
					type: 'input',
					search: {
						show: true,
						component: { props: { clearable: true, placeholder: t('message.pages.history.form.batchIdPlaceholder') } },
					},
					column: {
						minWidth: 110,
						showOverflowTooltip: true,
						formatter: ({ value, row }: any) => {
							if (!value) return '-';
							return value;
						},
					},
					form: { show: false },
				},
				execution_type: {
					title: t('message.pages.history.table.columns.executionType'),
					type: 'dict-select',
					search: {
						show: true,
						component: { props: { clearable: true, placeholder: t('message.pages.history.form.executionTypePlaceholder') } },
					},
					column: { minWidth: 90 },
					dict: dict({
						value: 'value',
						label: 'text',
						data: [
							{ value: 'command', text: t('message.pages.history.dict.executionType.command'), color: 'primary' },
							{ value: 'script', text: t('message.pages.history.dict.executionType.script'), color: 'success' },
						],
					}),
					form: { show: false },
				},
				host_ip: {
					title: t('message.pages.history.table.columns.hostIp'),
					type: 'input',
					search: {
						show: true,
						component: { props: { clearable: true, placeholder: t('message.pages.history.form.hostIpPlaceholder') } },
					},
					column: {
						minWidth: 130,
					},
					form: { show: false },
				},
				host_name: {
					title: t('message.pages.history.table.columns.hostName'),
					type: 'input',
					search: {
						show: false,
					},
					column: {
						minWidth: 120,
						showOverflowTooltip: true,
					},
					form: { show: false },
				},
				command: {
					title: t('message.pages.history.table.columns.command'),
					type: 'input',
					search: {
						show: true,
						component: { props: { clearable: true, placeholder: t('message.pages.history.form.commandPlaceholder') } },
					},
					column: {
						minWidth: 200,
						showOverflowTooltip: true,
						formatter: ({ value, row }: any) => {
							if (value) return value;
							if (row && row.script_content) {
								const lines = String(row.script_content).trim().split('\n');
								return lines[0] + (lines.length > 1 ? '...' : '');
							}
							return '-';
						},
					},
					form: { show: false },
				},
				script_type: {
					title: t('message.pages.history.table.columns.scriptType'),
					type: 'dict-select',
					column: {
						minWidth: 90,
						show: true,
						formatter: ({ value }: any) => {
							if (!value) return '-';
							const map: Record<string, string> = {
								sh: 'Shell',
								bash: 'Bash',
								python: 'Python',
								python3: 'Python3',
								powershell: 'PowerShell',
								cmd: 'CMD',
							};
							return map[value] || value;
						},
					},
					form: { show: false },
				},
				status: {
					title: t('message.pages.history.table.columns.status'),
					type: 'dict-select',
					search: {
						show: true,
						component: { props: { clearable: true, placeholder: t('message.pages.history.form.statusPlaceholder') } },
					},
					dict: dict({
						value: 'value',
						label: 'text',
						data: [
							{ value: 0, text: t('message.pages.history.dict.status.pending'), color: 'info' },
							{ value: 1, text: t('message.pages.history.dict.status.running'), color: 'primary' },
							{ value: 2, text: t('message.pages.history.dict.status.completed'), color: 'success' },
							{ value: 3, text: t('message.pages.history.dict.status.failed'), color: 'danger' },
						],
					}),
					column: { minWidth: 90 },
					form: { show: false },
				},
				exit_code: {
					title: t('message.pages.history.table.columns.exitCode'),
					type: 'input',
					column: {
						minWidth: 80,
						formatter: ({ value }: any) => {
							if (value === null || value === undefined || value === '') return '-';
							return String(value);
						},
					},
					form: { show: false },
				},
				duration: {
					title: t('message.pages.history.table.columns.duration'),
					type: 'input',
					column: {
						minWidth: 80,
						formatter: ({ value }: any) => {
							if (!value && value !== 0) return '-';
							return value;
						},
					},
					form: { show: false },
				},
				username: {
					title: t('message.pages.history.table.columns.username'),
					type: 'input',
					column: {
						minWidth: 90,
						formatter: ({ value }: any) => {
							return value || '-';
						},
					},
					form: { show: false },
				},
				started_at: {
					title: t('message.pages.history.table.columns.startedAt'),
					type: 'datetime',
					column: { minWidth: 160 },
					form: { show: false },
				},
				finished_at: {
					title: t('message.pages.history.table.columns.finishedAt'),
					type: 'datetime',
					column: { minWidth: 160 },
					form: { show: false },
				},
				create_datetime: {
					title: t('message.pages.history.table.columns.createDatetime'),
					type: 'datetime',
					column: { minWidth: 160, show: false },
					form: { show: false },
				},
			},
			table: {
				lazy: true,
				load: async (row: any, _treeNode: any, resolve: (dataArr: any[]) => void) => {
					const obj = await api.GetObj(row.id);
					const details: any[] = [];
					if (obj.data && obj.data.output_buffer) {
						for (const chunk of obj.data.output_buffer) {
							details.push(chunk);
						}
					}
					if (obj.data && obj.data.error_message) {
						details.push({ stream: 'stderr', text: obj.data.error_message });
					}
					if (details.length === 0) {
						details.push({ stream: 'stdout', text: t('message.pages.history.messages.noOutput') });
					}
					resolve(details);
				},
			},
		},
	};
};