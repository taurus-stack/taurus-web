/**
 * M1.7 — v-feature 指令（Edition Gate 功能级显示/隐藏）
 *
 * 用法：
 *   · <el-button v-feature="'SCRIPT_APPROVAL_FLOW'">提交审批</el-button>
 *      —— 只在具备该功能时显示；否则 **从 DOM 中移除**。
 *
 *   · <el-button v-feature.disable="'SCHEDULE_HA_CLUSTER'">启用 HA 调度</el-button>
 *      —— 不具备时：置灰 disabled + 国际化 tooltip + **点击拦截并弹升级引导**（企业版专属提示）
 *      —— 适合按钮/表单控件等可点击元素，给用户明确升级预期。
 *   · 支持自定义升级消息：
 *     <el-button v-feature.disable="{ code:'TICKET_CENTER', msg:'请升级以使用工单系统' }">打开工单</el-button>
 *
 *   · <el-card v-feature="['WORKFLOW_DAG_ENGINE','WORKFLOW_APPROVAL_FLOW']">任意一个有就显示</el-card>
 *   · <el-card v-feature.all="['FEATURE_A','FEATURE_B']">全部有才显示</el-card>
 *
 *   · 动态切换：提供 feature-update 参数（见下方 unmounted / updated 钩子），
 *      保证 Edition store 刷新后（登录 / 切换 License）重新判定。
 */

import type { App, Directive, DirectiveBinding } from 'vue';
import { getCurrentInstance } from 'vue';
import { ElMessageBox } from 'element-plus';
import { useEditionStore } from '/@/editions/index';

type BindingVal = string | string[];

interface ElState {
	removed: boolean;
	placeholder: Comment | null;
	originalDisabled?: string | null;
	clickHandler?: ((e: Event) => void) | null;
}

const STORAGE_KEY = '__taurus_feature_state__';
const CLICK_CAPTURE_OPTS: AddEventListenerOptions | boolean = { capture: true, passive: false };

function _getState(el: HTMLElement & any): ElState {
	if (!el[STORAGE_KEY]) {
		el[STORAGE_KEY] = { removed: false, placeholder: null } as ElState;
	}
	return el[STORAGE_KEY];
}

function _check(val: BindingVal, mode: 'any' | 'all'): boolean {
	const store = useEditionStore();
	if (!store.loaded) {
		// store 尚未加载：严格隐藏，防止 EE UI 闪现
		return false;
	}
	const codes: string[] = Array.isArray(val) ? val : [val];
	if (mode === 'all') return codes.every((c) => store.hasFeature(c));
	return codes.some((c) => store.hasFeature(c));
}

/**
 * 解析绑定值，返回 [codes, upgradeMsg]
 * 支持三种形式：
 *   1. v-feature.disable="'CODE'"                                              → codes=['CODE'], msg=undefined
 *   2. v-feature.disable="{ code: 'CODE', msg: '请升级' }"                     → codes=['CODE'], msg='请升级'
 *   3. v-feature.disable="{ codes: ['A','B'], msg: '请升级' }"                 → codes=['A','B'], msg='请升级'
 */
function _resolveBinding(
	binding: DirectiveBinding<any>
): { codes: string[]; upgradeMsg?: string } {
	const raw = binding.value;
	if (typeof raw === 'string') return { codes: [raw] };
	if (Array.isArray(raw)) return { codes: raw as string[] };
	if (raw && typeof raw === 'object') {
		let codes: string[] = [];
		if (typeof raw.code === 'string') codes = [raw.code];
		else if (Array.isArray(raw.codes)) codes = raw.codes;
		return {
			codes,
			upgradeMsg: typeof raw.msg === 'string' ? raw.msg : undefined,
		};
	}
	return { codes: [] };
}

/** 从当前 Vue 实例取 $t，兜底返回默认中文 */
function _t(key: string, fallback: string): string {
	try {
		const inst = getCurrentInstance();
		const $t = inst?.appContext?.app?.config?.globalProperties?.$t;
		if (typeof $t === 'function') {
			const v = $t(key);
			if (typeof v === 'string' && v && v !== key) return v;
		}
	} catch (_e) { /* noop */ }
	return fallback;
}

function _apply(
	el: HTMLElement & any,
	binding: DirectiveBinding<any>,
	mode: 'any' | 'all'
) {
	const { codes, upgradeMsg } = _resolveBinding(binding);
	const valAsBindingVal: BindingVal = (Array.isArray(codes) && codes.length > 1)
		? codes
		: (codes[0] ?? '');
	const ok = codes.length ? _check(valAsBindingVal, mode) : true;
	const state = _getState(el);

	// ===== .disable 模式：置灰 + tooltip + 点击拦截弹升级 =====
	if (binding.modifiers.disable) {
		if (ok) {
			el.removeAttribute('disabled');
			el.classList.remove('is-disabled', 'taurus-feature-disabled');
			if (state.originalDisabled !== undefined) {
				if (state.originalDisabled) el.setAttribute('disabled', state.originalDisabled);
				state.originalDisabled = null;
			}
			// 移除自定义 tooltip
			if (el.dataset.taurusFeatureOriginalTitle !== undefined) {
				if (el.dataset.taurusFeatureOriginalTitle) {
					el.title = el.dataset.taurusFeatureOriginalTitle;
				} else {
					el.removeAttribute('title');
				}
				delete el.dataset.taurusFeatureOriginalTitle;
			}
			// 移除点击拦截 handler
			if (state.clickHandler) {
				el.removeEventListener('click', state.clickHandler, CLICK_CAPTURE_OPTS);
				state.clickHandler = null;
			}
		} else {
			// 保留原始 disabled 值
			if (state.originalDisabled === undefined) {
				state.originalDisabled = el.getAttribute('disabled');
			}
			el.setAttribute('disabled', 'disabled');
			el.classList.add('is-disabled', 'taurus-feature-disabled');

			// 设置国际化 tooltip（保留用户原始 title）
			if (el.dataset.taurusFeatureOriginalTitle === undefined) {
				el.dataset.taurusFeatureOriginalTitle = el.title || '';
			}
			const tip = _t(
				'message.pages.edition.enterpriseOnlyTooltip',
				'此功能为企业版专属，点击了解升级方案'
			);
			if (!el.title) {
				el.title = tip;
			}

			// 安装捕获阶段 click 拦截 → 阻止一切后续 click 处理并弹升级
			if (!state.clickHandler) {
				const codeStr = codes[0] ?? (Array.isArray(valAsBindingVal) ? (valAsBindingVal as any)[0] : String(valAsBindingVal));
				const handler = (e: Event) => {
					e.preventDefault();
					e.stopImmediatePropagation();
					e.stopPropagation();

					// 1) 兜底弹窗（用户立刻能看到）
					const title = _t('message.pages.edition.enterpriseOnlyTitle', '企业版专属功能');
					const desc = upgradeMsg || _t(
						'message.pages.edition.enterpriseOnlyDesc',
						'该功能仅在 Taurus Ops 企业版中提供。升级到企业版即可解锁全部高级功能，包括高可用调度、审批流、工作流引擎、知识工单等完整能力。'
					);
					const okBtn = _t('message.pages.edition.upgradeAction', '立即升级');
					const cancelBtn = _t('message.pages.edition.dismiss', '稍后再说');
					ElMessageBox.confirm(desc, title, {
						confirmButtonText: okBtn,
						cancelButtonText: cancelBtn,
						type: 'info',
						showCancelButton: true,
						closeOnClickModal: true,
						// 宽度、居中（Element Plus 默认样式可工作）
					}).then(() => {
						// 用户点"立即升级" → 触发顶部升级 Banner 组件
						const detail: any = { code: codeStr };
						if (upgradeMsg) detail.message = upgradeMsg;
						window.dispatchEvent(
							new CustomEvent('taurus:edition-upgrade', { detail })
						);
					}).catch(() => {
						// 用户取消：不做任何事
					});
				};
				el.addEventListener('click', handler, CLICK_CAPTURE_OPTS);
				state.clickHandler = handler;
			}
		}
		return;
	}

	// 默认模式：remove from DOM / re-insert via placeholder
	if (ok) {
		if (state.removed && state.placeholder && state.placeholder.parentNode) {
			state.placeholder.parentNode.insertBefore(el, state.placeholder);
			state.placeholder.parentNode.removeChild(state.placeholder);
			state.placeholder = null;
			state.removed = false;
		}
	} else {
		if (!state.removed) {
			const ph = document.createComment(
				`[taurus:feature-gated] ${JSON.stringify(binding.value)}（仅企业版）`
			);
			if (el.parentNode) {
				el.parentNode.insertBefore(ph, el);
				el.parentNode.removeChild(el);
			}
			state.placeholder = ph;
			state.removed = true;
		}
	}
}

const _mkDirective = (mode: 'any' | 'all'): Directive<HTMLElement, any> => ({
	mounted(el, binding) {
		_apply(el, binding, mode);
	},
	updated(el, binding) {
		if (binding.value !== binding.oldValue) _apply(el, binding, mode);
	},
	unmounted(el) {
		// 清掉自定义属性 / 监听器，避免内存泄漏
		try {
			const state = (el as any)[STORAGE_KEY] as ElState | undefined;
			if (state?.clickHandler) {
				el.removeEventListener('click', state.clickHandler, CLICK_CAPTURE_OPTS);
			}
			if (state?.placeholder?.parentNode) state.placeholder.parentNode.removeChild(state.placeholder);
			delete (el as any)[STORAGE_KEY];
		} catch (_e) { /* noop */ }
	},
});

export function featureDirective(app: App) {
	// v-feature = "'CODE'"  或 v-feature = "['A','B']"（任意一个有即显示）
	app.directive('feature', _mkDirective('any'));
	// v-feature.all = "['A','B']"（全部有才显示）
	app.directive('feature-all', _mkDirective('all'));
}