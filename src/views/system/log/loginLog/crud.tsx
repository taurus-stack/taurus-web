import * as api from './api';
import { UserPageQuery, AddReq, DelReq, EditReq, CreateCrudOptionsProps, CreateCrudOptionsRet, dict } from '@fast-crud/fast-crud';
import { commonCrudConfig } from '/@/utils/commonCrud';
import {i18n} from '/@/i18n';

const t = i18n.global.t;

/**
 * Map of known Chinese IP-analysis placeholders (returned by the offline
 * geo-IP service for reserved/internal IPs) to stable i18n keys.
 *
 * Values that do not match any entry here are returned as-is, so real city /
 * province / country names keep rendering untouched.
 */
const GEO_PLACEHOLDER_MAP: { [key: string]: string } = {
	'保留': 'message.common.geo.placeholder.reserved',
	'局域网': 'message.common.geo.placeholder.lan',
	'内网IP': 'message.common.geo.placeholder.lan',
	'本地环回': 'message.common.geo.placeholder.loopback',
	'回环地址': 'message.common.geo.placeholder.loopback',
	'本机地址': 'message.common.geo.placeholder.loopback',
	'多播地址': 'message.common.geo.placeholder.multicast',
	'组播地址': 'message.common.geo.placeholder.multicast',
	'广播地址': 'message.common.geo.placeholder.broadcast',
	'链路本地地址': 'message.common.geo.placeholder.linkLocal',
	'IANA保留地址': 'message.common.geo.placeholder.ianaReserved',
	'IANA 保留地址': 'message.common.geo.placeholder.ianaReserved',
	'未分配': 'message.common.geo.placeholder.unspecified',
	'未指定': 'message.common.geo.placeholder.unspecified',
	'未知': 'message.common.geo.placeholder.unknown',
};

/**
 * Formatter used for any IP-analysis text column (continent / country /
 * province / city / district / isp / area_code / country_english /
 * country_code / longitude / latitude).
 *
 * - null / undefined / empty strings -> empty cell (consistent with original
 *   input-type rendering)
 * - known placeholder -> t(message.common.geo.placeholder.xxx)
 * - everything else -> rendered unchanged
 */
export function formatGeoValue(value: unknown): string {
	if (value === null || value === undefined || value === '') {
		return '';
	}
	const key = typeof value === 'string' ? value : String(value);
	const i18nKey = GEO_PLACEHOLDER_MAP[key];
	if (i18nKey) {
		const translated = t(i18nKey);
		return translated !== i18nKey ? translated : key;
	}
	return key;
}

/**
 * Column formatter for IP-analysis text columns. Fast-crud invokes this with
 * a `context` object containing {row, value, index, column}. Switching the
 * locale re-triggers the render and picks up the active translation via the
 * closure over `t()` / `i18n.global`.
 */
function geoFormatter(context: { value: unknown }): string {
	return formatGeoValue(context.value);
}

/**
 * Helper that appends the geo placeholder formatter to a column config.
 * Called on each of the IP-analysis columns below.
 *
 * NOTE: Explicit `any` return type is intentional here. Fast-crud column
 * objects have heavily-nested conditional typings; annotating the generic
 * return widens the type enough to prevent TS from running into its
 * instantiation-depth limit on the adjacent `i18n.global.t` binding.
 */
function withGeoColumn(column: Record<string, any>): any {
	return { ...column, column: { ...(column.column || {}), formatter: geoFormatter } };
}

export const createCrudOptions = function ({ crudExpose }: CreateCrudOptionsProps): CreateCrudOptionsRet {
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
	return {
		crudOptions: {
			request: {
				pageRequest,
				addRequest,
				editRequest,
				delRequest,
			},
			actionbar: {
				buttons: {
					add: {
						show: false,
					},
				},
			},
			rowHandle: {
				fixed: 'right',
				width: 100,
				buttons: {
					view: {
						type: 'text',
					},
					edit: {
						show: false,
					},
					remove: {
						show: false,
					},
				},
			},
			columns: {
				_index: {
					title: t('message.pages.loginLog.table.columns.index'),
					form: { show: false },
					column: {
						//type: 'index',
						align: 'center',
						width: '70px',
						columnSetDisabled: true, // Disabled in column settings
						formatter: (context) => {
							// Calculate sequence number, customizable rule, accumulates across pages
							let index = context.index ?? 1;
							let pagination = crudExpose!.crudBinding.value.pagination;
							return ((pagination!.currentPage ?? 1) - 1) * pagination!.pageSize + index + 1;
						},
					},
				},
				search: {
					title: t('message.pages.loginLog.table.columns.keyword'),
					column: {
						show: false,
					},
					search: {
						show: true,
						component: {
							props: {
								clearable: true,
							},
							placeholder: t('message.pages.loginLog.form.keywordPlaceholder'),
						},
					},
					form: {
						show: false,
						component: {
							props: {
								clearable: true,
							},
						},
					},
				},
				username: {
					title: t('message.pages.loginLog.table.columns.username'),
					search: {
						disabled: false,
					},
					type: 'input',
					column: {
						minWidth: 120,
					},
					form: {
						disabled: true,
						component: {
							placeholder: t('message.pages.loginLog.form.usernamePlaceholder'),
						},
					},
				},
				ip: {
					title: t('message.pages.loginLog.table.columns.ip'),
					search: {
						disabled: false,
					},
					type: 'input',
					column: {
						minWidth: 120,
					},
					form: {
						disabled: true,
						component: {
							placeholder: t('message.pages.loginLog.form.ipPlaceholder'),
						},
					},
				},
				isp: {
					title: t('message.pages.loginLog.table.columns.isp'),
					search: {
						disabled: true,
					},
					disabled: true,
					type: 'input',
					column: {
						minWidth: 120,
					},
					form: {
						component: {
							placeholder: t('message.pages.loginLog.form.ispPlaceholder'),
						},
					},
				},
				continent: withGeoColumn({
					title: t('message.pages.loginLog.table.columns.continent'),
					type: 'input',
					column: {
						minWidth: 90,
					},
					form: {
						disabled: true,
						component: {
							placeholder: t('message.pages.loginLog.form.continentPlaceholder'),
						},
					},
					component: { props: { color: 'auto' } }, // Auto-coloring
				}),
				country: withGeoColumn({
					title: t('message.pages.loginLog.table.columns.country'),
					type: 'input',
					column: {
						minWidth: 90,
					},
					form: {
						component: {
							placeholder: t('message.pages.loginLog.form.countryPlaceholder'),
						},
					},
					component: { props: { color: 'auto' } }, // Auto-coloring
				}),
				province: withGeoColumn({
					title: t('message.pages.loginLog.table.columns.province'),
					type: 'input',
					column: {
						minWidth: 80,
					},
					form: {
						component: {
							placeholder: t('message.pages.loginLog.form.provincePlaceholder'),
						},
					},
					component: { props: { color: 'auto' } }, // Auto-coloring
				}),
				city: withGeoColumn({
					title: t('message.pages.loginLog.table.columns.city'),
					type: 'input',
					column: {
						minWidth: 80,
					},
					form: {
						component: {
							placeholder: t('message.pages.loginLog.form.cityPlaceholder'),
						},
					},
					component: { props: { color: 'auto' } }, // Auto-coloring
				}),
				district: withGeoColumn({
					title: t('message.pages.loginLog.table.columns.district'),
					key: '',
					type: 'input',
					column: {
						minWidth: 80,
					},
					form: {
						component: {
							placeholder: t('message.pages.loginLog.form.districtPlaceholder'),
						},
					},
					component: { props: { color: 'auto' } }, // Auto-coloring
				}),
				area_code: withGeoColumn({
					title: t('message.pages.loginLog.table.columns.areaCode'),
					type: 'input',
					column: {
						minWidth: 90,
					},
					form: {
						component: {
							placeholder: t('message.pages.loginLog.form.areaCodePlaceholder'),
						},
					},
					component: { props: { color: 'auto' } }, // Auto-coloring
				}),
				country_english: withGeoColumn({
					title: t('message.pages.loginLog.table.columns.countryEnglish'),
					type: 'input',
					column: {
						minWidth: 120,
					},
					form: {
						component: {
							placeholder: t('message.pages.loginLog.form.countryEnglishPlaceholder'),
						},
					},
					component: { props: { color: 'auto' } }, // Auto-coloring
				}),
				country_code: withGeoColumn({
					title: t('message.pages.loginLog.table.columns.countryCode'),
					type: 'input',
					column: {
						minWidth: 100,
					},
					form: {
						component: {
							placeholder: t('message.pages.loginLog.form.countryCodePlaceholder'),
						},
					},
					component: { props: { color: 'auto' } }, // Auto-coloring
				}),
				longitude: withGeoColumn({
					title: t('message.pages.loginLog.table.columns.longitude'),
					type: 'input',
					disabled: true,
					column: {
						minWidth: 100,
					},
					form: {
						component: {
							placeholder: t('message.pages.loginLog.form.longitudePlaceholder'),
						},
					},
					component: { props: { color: 'auto' } }, // Auto-coloring
				}),
				latitude: withGeoColumn({
					title: t('message.pages.loginLog.table.columns.latitude'),
					type: 'input',
					disabled: true,
					column: {
						minWidth: 100,
					},
					form: {
						component: {
							placeholder: t('message.pages.loginLog.form.latitudePlaceholder'),
						},
					},
					component: { props: { color: 'auto' } }, // Auto-coloring
				}),
				login_type: {
					title: t('message.pages.loginLog.table.columns.loginType'),
					type: 'dict-select',
					search: {
						disabled: false,
					},
					dict: dict({
						data: [
							{ label: t('message.pages.loginLog.loginType.normal'), value: 1 },
							{ label: t('message.pages.loginLog.loginType.wechat'), value: 2 },
						],
					}),
					column: {
						minWidth: 120,
					},
					form: {
						component: {
							placeholder: t('message.pages.loginLog.form.loginTypePlaceholder'),
						},
					},
				},
				os: {
					title: t('message.pages.loginLog.table.columns.os'),
					type: 'input',
					column: {
						minWidth: 120,
					},
					form: {
						component: {
							placeholder: t('message.pages.loginLog.form.osPlaceholder'),
						},
					},
				},
				browser: {
					title: t('message.pages.loginLog.table.columns.browser'),
					type: 'input',
					column: {
						minWidth: 120,
					},
					form: {
						component: {
							placeholder: t('message.pages.loginLog.form.browserPlaceholder'),
						},
					},
				},
				agent: {
					title: t('message.pages.loginLog.table.columns.agent'),
					disabled: true,
					type: 'input',
					column: {
						minWidth: 120,
					},
					form: {
						component: {
							placeholder: t('message.pages.loginLog.form.agentPlaceholder'),
						},
					},
				},
				...commonCrudConfig({
					create_datetime: {
						search: true,
					},
				}),
			},
		},
	};
};
