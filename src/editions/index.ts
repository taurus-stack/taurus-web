/**
 * M1.6 — 前端 Edition Gate useEdition composable。
 *
 * 对外暴露：
 *   · edition.value     ：'community' | 'enterprise'
 *   · tier.value        ：阶梯名（community/starter/professional/enterprise/ultimate）
 *   · features.value    ：当前 edition 可用 code 集合（Set<string>）
 *   · quota.value       ：阶梯配额 Dict
 *   · license.value     ：License 状态
 *   · hasFeature(code)  ：是否具备某功能
 *   · requireFeature(code, fallback?) ：在 setup 里便捷断言，缺功能弹 upgrade banner 或抛错
 *   · ensureLoaded()    ：保证 /api/taurus/edition/info 已拉取一次（幂等）
 */

import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useEditionApi, type EditionInfo } from '/@/api/taurus/edition/api';
import type { EditionName, TierName, FeatureCode } from './types';

const STORE_ID = 'taurus-edition';

/** Pinia Store（核心）：缓存 Edition 信息，全 App 共享 */
export const useEditionStore = defineStore({
	id: STORE_ID,
	state: () => ({
		_loaded: false as boolean,
		_loading: null as null | Promise<any>,
		edition: 'community' as EditionName,
		tier: 'community' as TierName,
		features: new Set<FeatureCode>(),
		feature_count: 0,
		quota: {} as Record<string, number | null>,
		license: {
			valid: true,
			tier: 'community' as TierName,
			expires_at: null,
			customer: 'Community Edition',
			warnings: [],
		} as EditionInfo['license'],
		upgrade: { show_banner: true, contact_url: '/#/taurus/contact-lead' } as EditionInfo['upgrade'],
		feature_groups: [] as EditionInfo['feature_groups'],
	}),
	getters: {
		isCommunity: (s) => s.edition === 'community',
		isEnterprise: (s) => s.edition === 'enterprise',
		loaded: (s) => s._loaded,
	},
	actions: {
		/** hasFeature：检查单个 FeatureCode 是否可用 */
		hasFeature(code: FeatureCode): boolean {
			if (!this._loaded) {
				// 防御：加载期默认严格判断，防止闪现 EE 菜单
				return false;
			}
			// 空/undefined code 默认放行（避免老代码漏传造成误判）
			if (!code) return true;
			return this.features.has(code);
		},
		hasAllFeatures(codes: FeatureCode[]): boolean {
			return codes.every((c) => this.hasFeature(c));
		},
		hasAnyFeature(codes: FeatureCode[]): boolean {
			return codes.some((c) => this.hasFeature(c));
		},
		/** 取当前配额字段（null 代表不限） */
		getQuota(field: string): number | null {
			return this.quota[field] ?? null;
		},
		/**
		 * 保证 Edition 信息已拉取（幂等）。
		 * 若 API 失败（后端未部署 / 网络错误等），不抛出，回退 community + 空 feature 集合
		 *  —— 对 CE 来说等价于严格态，不会漏权限；对 EE 来说降级后用户体验等同 CE，可重新登录重试。
		 */
		async ensureLoaded(force = false): Promise<void> {
			if (this._loaded && !force) return;
			if (this._loading && !force) {
				await this._loading;
				return;
			}
			this._loading = (async () => {
				try {
					const api = useEditionApi();
					const resp = await api.getInfo();
					const info: EditionInfo = resp && resp.data ? (resp.data as EditionInfo) : (resp as unknown as EditionInfo);
					this.applyInfo(info);
				} catch (err) {
					// 后端不可用：使用 community 兜底默认值
					// eslint-disable-next-line no-console
					console.warn('[edition] fetch edition info failed, fallback to community default.', err);
					this.edition = 'community';
					this.tier = 'community';
					this.features = new Set();
					this.feature_count = 0;
					this.quota = {
						max_hosts: 50,
						max_users: 10,
						max_scheduled_tasks: 20,
						max_script_versions_per_script: 3,
						max_concurrent_executions: 10,
					};
				} finally {
					this._loaded = true;
					this._loading = null;
				}
			})();
			await this._loading;
		},
		applyInfo(info: EditionInfo) {
			if (!info) return;
			this.edition = info.edition || 'community';
			this.tier = info.tier || 'community';
			this.features = new Set(Array.isArray(info.features) ? info.features : []);
			this.feature_count = info.feature_count ?? this.features.size;
			this.quota = info.quota ?? {};
			this.license = info.license ?? this.license;
			this.upgrade = info.upgrade ?? this.upgrade;
			this.feature_groups = info.feature_groups ?? [];
			this._loaded = true;
		},
		reset() {
			this._loaded = false;
			this._loading = null;
		},
	},
});

/** ---------- composable 便捷封装 ---------- */

export function useEdition() {
	const store = useEditionStore();

	const edition = computed<EditionName>(() => store.edition);
	const tier = computed<TierName>(() => store.tier);
	const features = computed(() => store.features);
	const quota = computed(() => store.quota);
	const license = computed(() => store.license);
	const upgrade = computed(() => store.upgrade);
	const featureGroups = computed(() => store.feature_groups ?? []);
	const loaded = ref(store._loaded);

	return {
		edition,
		tier,
		features,
		quota,
		license,
		upgrade,
		featureGroups,
		loaded,
		isCommunity: computed(() => store.isCommunity),
		isEnterprise: computed(() => store.isEnterprise),
		hasFeature: (code: FeatureCode) => store.hasFeature(code),
		hasAllFeatures: (codes: FeatureCode[]) => store.hasAllFeatures(codes),
		hasAnyFeature: (codes: FeatureCode[]) => store.hasAnyFeature(codes),
		getQuota: (field: string) => store.getQuota(field),
		ensureLoaded: (force = false) => store.ensureLoaded(force),
		/**
		 * 断言某功能存在；若不存在：
		 *  · upgradeMsg 非空 → 通过 window 事件抛给 upgrade banner 组件弹升级引导
		 *  · 否则直接返回 false，调用方自行处理
		 */
		requireFeature: (code: FeatureCode, upgradeMsg?: string): boolean => {
			if (store.hasFeature(code)) return true;
			if (upgradeMsg) {
				window.dispatchEvent(
					new CustomEvent('taurus:edition-upgrade', {
						detail: { code, message: upgradeMsg },
					})
				);
			}
			return false;
		},
	};
}

// ---------- 菜单级 EE Gate 统一助手：给 vertical/horizontal/subItem 复用 ----------
const _eeI18nCache: { t?: ReturnType<typeof useI18n>['t'] } = {};
function _safeT(fullKey: string, fallback: string): string {
	try {
		if (!_eeI18nCache.t) {
			const { t } = useI18n();
			_eeI18nCache.t = t;
		}
		const v = _eeI18nCache.t!(fullKey);
		if (typeof v === 'string' && v && v !== fullKey) return v;
	} catch (_e) { /* useI18n 未初始化时兜底 */ }
	return fallback;
}

export function triggerEeUpgrade(code: FeatureCode | FeatureCode[] | undefined, customDesc?: string) {
	const codes: FeatureCode[] = !code ? [] : Array.isArray(code) ? code.filter(Boolean) : [code];
	const singleCode = codes[0];
	const desc =
		customDesc ||
		_safeT('message.pages.edition.enterpriseOnlyDesc', '该功能仅在 Taurus Ops 企业版中提供。升级到企业版即可解锁全部高级能力。');
	const title = _safeT('message.pages.edition.enterpriseOnlyTitle', '企业版专属功能');
	const okBtn = _safeT('message.pages.edition.upgradeAction', '立即升级');
	const cancelBtn = _safeT('message.pages.edition.dismiss', '稍后再说');
	ElMessageBox.confirm(desc, title, {
		confirmButtonText: okBtn,
		cancelButtonText: cancelBtn,
		type: 'info',
		showCancelButton: true,
		closeOnClickModal: true,
	})
		.then(() => window.dispatchEvent(new CustomEvent('taurus:edition-upgrade', { detail: { code: singleCode, codes } })))
		.catch(() => {});
}

export function triggerEeUpgradeByMeta(meta: any, customDesc?: string) {
	const codes = (meta?._eeCodes as FeatureCode[]) || [];
	triggerEeUpgrade(codes.length ? codes : undefined, customDesc);
}

export function eeTooltipTxt(): string {
	return _safeT('message.pages.edition.enterpriseOnlyTooltip', '此功能为企业版专属，点击了解升级方案');
}