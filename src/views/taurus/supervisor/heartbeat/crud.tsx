import * as api from '/@/api/taurus/supervisor/heartbeat';
import { UserPageQuery, AddReq, DelReq, EditReq, CreateCrudOptionsProps, CreateCrudOptionsRet } from '@fast-crud/fast-crud';
import { getHeartbeatConfig } from './table';
import { onMounted, onUnmounted, ref } from 'vue';
import { i18n } from '/@/i18n';

// @ts-ignore - vue-i18n type inference chain too deep, works fine at runtime
const t = i18n.global.t;

// Use ref to store loadMetrics callback
const loadMetricsCallbackRef = ref<((row: any) => void) | null>(null);

export function setLoadMetricsCallback(callback: (row: any) => void) {
	loadMetricsCallbackRef.value = callback;
}

export const createCrudOptions = function ({ crudExpose }: CreateCrudOptionsProps): CreateCrudOptionsRet {
	const tableConfig = getHeartbeatConfig();

	const pageRequest = async (query: UserPageQuery) => {
		return await api.GetList(query);
	};
	const editRequest = async ({ form, row }: EditReq) => {
		form.id = row.id;
		return await api.UpdateObj(form);
	};
	const delRequest = async ({ row }: DelReq) => {
		return await api.DelObj(row.id);
	};
	const addRequest = async ({ form }: AddReq) => {
		return await api.AddObj(form);
	};

	// Heartbeat list auto-refresh (every 30 seconds)
	let refreshTimer: ReturnType<typeof setInterval> | null = null;
	onMounted(() => {
		refreshTimer = setInterval(() => {
			crudExpose.doRefresh();
		}, 30000);
	});
	onUnmounted(() => {
		if (refreshTimer) {
			clearInterval(refreshTimer);
		}
	});

	// Build rowHandle, bind loadMetrics button click event and override i18n text
	const rowHandleConfig: any = {
		...tableConfig.rowHandle,
		buttons: {
			...(tableConfig.rowHandle as any).buttons,
			loadMetrics: {
				...(tableConfig.rowHandle as any).buttons?.loadMetrics,
				text: t('message.pages.heartbeat.buttons.loadMetrics'),
				click: ({ row }: any) => {
					const callback = loadMetricsCallbackRef.value;
					if (callback) {
						callback(row);
					}
				},
			},
		},
	};

	return {
		crudOptions: {
			request: {
				pageRequest,
				addRequest,
				editRequest,
				delRequest,
			},
			actionbar: tableConfig.actionbar,
			rowHandle: rowHandleConfig,
			columns: tableConfig.columns,
			table: {
				fit: true,
			},
			form: {
				labelWidth: '120px',
			},
		},
	};
};