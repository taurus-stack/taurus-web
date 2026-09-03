import { dict } from '@fast-crud/fast-crud';
import { commonCrudConfig } from '/@/utils/commonCrud';
import { actionbar, rowHandle } from '/@/views/taurus/config/utils/common';
import { h } from 'vue';
import { i18n } from '/@/i18n';
import { editionColumnShow } from '/@/editions/useEditionColumn';

// @ts-ignore — vue-i18n type inference chain too deep, runtime is fine
const t = i18n.global.t;

export const getHeartbeatConfig = function (): any {
	return {
		container: {
			is: 'fs-layout-card',
		},
		table: {
			height: '100%',
		},
		actionbar: actionbar(false, false, false),
		rowHandle: rowHandle(true, false, false, false, 'right', 160, 'default', true),
		columns: {
			search: {
				title: t('message.pages.heartbeat.table.columns.keyword'),
				column: {
					show: false,
				},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.heartbeat.form.keywordPlaceholder'),
					},
				},
				form: {
					show: false,
				},
			},
			id: {
				title: t('message.pages.heartbeat.table.columns.id'),
				type: 'input',
				column: {
					show: false,
				},
				form: {
					show: false,
				},
			},
			host: {
				title: t('message.pages.heartbeat.table.columns.host'),
				type: 'dict-select',
				dict: dict({
					url: '/api/taurus/host/',
					value: 'id',
					label: 'host_name',
				}),
				column: {
					show: false,
				},
				form: {},
			},
			host_name: {
				title: t('message.pages.heartbeat.table.columns.hostName'),
				type: 'text',
				column: {
					show: true,
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
						placeholder: t('message.pages.heartbeat.form.hostNamePlaceholder'),
					},
				},
			},
			host_ip: {
				title: t('message.pages.heartbeat.table.columns.hostIp'),
				type: 'text',
				column: {
					show: true,
				},
				form: {},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.heartbeat.form.hostIpPlaceholder'),
					},
				},
			},
			timestamp: {
				title: t('message.pages.heartbeat.table.columns.timestamp'),
				type: 'datetime',
				column: {
					show: true,
				},
				form: {},
			},
			supervisor_status: {
				title: t('message.pages.heartbeat.table.columns.supervisorStatus'),
				type: 'text',
				column: {
					show: true,
					cellRender: ({ value }: any) => {
						const isRunning = value === 'running';
						const color = isRunning ? '#67c23a' : '#f56c6c';
						const dotStyle: Record<string, string> = {
							display: 'inline-block',
							width: '12px',
							height: '12px',
							borderRadius: '50%',
							backgroundColor: color,
						};
						if (isRunning) {
							dotStyle.animation = 'statusPulse 1.5s ease-in-out infinite';
						}
						return h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } }, [
							h('span', { style: dotStyle }),
							h('span', null, value || '-'),
						]);
					},
				},
				form: {},
				search: {
					show: true,
					component: {
						props: {
							clearable: true,
						},
						placeholder: t('message.pages.heartbeat.form.supervisorStatusPlaceholder'),
					},
				},
			},
			supervisor_version: {
				title: t('message.pages.heartbeat.table.columns.supervisorVersion'),
				type: 'text',
				column: {
					show: true,
				},
				form: {},
			},
			heartbeat_server: {
			title: t('message.pages.heartbeat.table.columns.heartbeatServer'),
			type: 'text',
			column: {
				show: editionColumnShow('HEARTBEAT_SERVER_CLUSTER'),
			},
			form: {},
		},
			...commonCrudConfig({
				create_datetime: {
					table: true,
				},
			}),
		},
	};
};
