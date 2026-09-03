// Import fast-crud
import { FastCrud, useTypes } from '@fast-crud/fast-crud';
import { i18n } from '/@/i18n';
const t = i18n.global.t;

const { getType } = useTypes();
import '@fast-crud/fast-crud/dist/style.css';
import { setLogger } from '@fast-crud/fast-crud';
import { getBaseURL } from '/@/utils/baseUrl';
// element
import ui from '@fast-crud/ui-element';
import { request } from '/@/utils/service';
// Extension packages
import { FsExtendsEditor, FsExtendsUploader, FsExtendsJson } from '@fast-crud/fast-extends';
import '@fast-crud/fast-extends/dist/style.css';
import { successNotification } from '/@/utils/message';
import XEUtils from 'xe-utils';
export default {
	async install(app: any, options: any) {
		// Install ui first
		app.use(ui);
		// Then install FastCrud
		app.use(FastCrud, {
			i18n,
			// Configure public dictRequest here (dictionary request)
			async dictRequest({ dict, url }: any) {
				const { isTree } = dict;
				// Asynchronously return a dictionary array based on the dict URL
				return await request({ url: url, params: dict.params || {} }).then((res: any) => {
					if (isTree) {
						return XEUtils.toArrayTree(res.data, { parentKey: 'parent' });
					}
					return res.data;
				});
			},
			// Common CRUD config
			commonOptions() {
				return {
					container: {
						is: 'fs-layout-card',
					},
					request: {
						transformQuery: ({ page, form, sort }: any) => {
							if (sort.asc !== undefined) {
								form['ordering'] = `${sort.asc ? '' : '-'}${sort.prop}`;
							}
							return { page: page.currentPage, limit: page.pageSize, ...form };
						},
						transformRes: ({ res }: any) => {
							return { records: res.data, currentPage: res.page, pageSize: res.limit, total: res.total };
						},
					},
					form: {
						labelWidth: '200px',
						labelPosition: 'right',
						afterSubmit(ctx: any) {
							if (ctx.res.code == 2000) {
								successNotification(ctx.res.msg);
							}
						},
					},
					search: {
						buttons: {
							search: {
								text: t('message.search'),
							},
							reset: {
								text: t('message.reset'),
							},
						},
					},
					rowHandle: {
						title: t('message.operation'),
						align: 'center',
					},
				};
			},
			logger: { off: { tableColumns: false } },
		});
		// Rich text editor
		app.use(FsExtendsEditor, {
			wangEditor: {
				width: 300,
			},
		});
		// File upload
		app.use(FsExtendsUploader, {
			defaultType: 'form',
			form: {
				action: `/api/system/file/`,
				name: 'file',
				withCredentials: false,
				uploadRequest: async ({ action, file, onProgress }: { action: string; file: any; onProgress: Function }) => {
					// @ts-ignore
					const data = new FormData();
					data.append('file', file);
					return await request({
						url: action,
						method: 'post',
						timeout: 60000,
						headers: {
							'Content-Type': 'multipart/form-data',
						},
						data,
						onUploadProgress: (p: any) => {
							onProgress({ percent: Math.round((p.loaded / p.total) * 100) });
						},
					});
				},
				successHandle(ret: any) {
					// Result handling after upload completes, should return format {url:xxx,key:xxx}
					return {
						url: getBaseURL(ret.data.url),
						key: ret.data.id,
						...ret.data,
					};
				},
			},
			valueBuilder(context: any) {
				const { row, key } = context;
				return getBaseURL(row[key]);
			},
		});

		// JSON editor — 先 patch navigator.language 再注册 FsExtendsJson，
		// 否则它会固定使用浏览器原生语言，不跟随项目 i18n 切换
		// JSONEditor 期望 "zh-CN" / "en" 这种格式，项目 locale 是 "zh-cn" / "en"
		if (typeof navigator !== 'undefined') {
			const getPatched = () => {
				const l = i18n.global.locale?.value || i18n.global.locale || 'zh-cn';
				// 映射：zh-cn → zh-CN, zh-tw → zh-TW, en → en
				if (l === 'zh-cn') return 'zh-CN';
				if (l === 'zh-tw') return 'zh-TW';
				return 'en';
			};
			try {
				Object.defineProperty(Navigator.prototype, 'language', {
					get: getPatched,
					configurable: true,
				});
			} catch (e) {
				// 某些环境下 Navigator.prototype 不可写，fallback 直接 patch navigator
				Object.defineProperty(navigator, 'language', {
					get: getPatched,
					configurable: true,
				});
			}
		}
		app.use(FsExtendsJson);

		setLogger({ level: 'error' });
		// Set auto coloring
		const dictComponentList = ['dict-cascader', 'dict-checkbox', 'dict-radio', 'dict-select', 'dict-switch', 'dict-tree'];
		dictComponentList.forEach((val) => {
			getType(val).column.component.color = 'auto';
			getType(val).column.align = 'center';
		});
		// Set default placeholder values
		const placeholderComponentList = [
			{ key: 'text', placeholder: t('message.pleaseInput') },
			{ key: 'textarea', placeholder: t('message.pleaseInput') },
			{ key: 'input', placeholder: t('message.pleaseInput') },
			{ key: 'password', placeholder: t('message.pleaseInput') },
		];
		placeholderComponentList.forEach((val) => {
			if (getType(val.key)?.search?.component) {
				getType(val.key).search.component.placeholder = val.placeholder;
			} else if (getType(val.key)?.search) {
				getType(val.key).search.component = { placeholder: val.placeholder };
			}
			if (getType(val.key)?.form?.component) {
				getType(val.key).form.component.placeholder = val.placeholder;
			} else if (getType(val.key)?.form) {
				getType(val.key).form.component = { placeholder: val.placeholder };
			}
			if (getType(val.key)?.column?.align) {
				getType(val.key).column.align = 'center';
			} else if (getType(val.key)?.column) {
				getType(val.key).column = { align: 'center' };
			} else if (getType(val.key)) {
				getType(val.key).column = { align: 'center' };
			}
		});
	},
};