/**
 * 前端 Edition / License 状态 composable。
 *
 * 单一全功能版本下：
 *   · features 恒为全集（hasFeature 恒真），功能不做门禁
 *   · 版本差异仅体现在主机配额（quota.max_hosts）与服务等级（tier / License 四态）
 *   · 后端不可达时按"免费全功能"兜底（max_hosts=50，其余不限），功能全开
 *
 * 对外暴露：
 *   · tier / quota / license / upgrade / featureGroups 状态
 *   · hasFeature(code)          ：全集恒真（加载完成前严格判否，防止菜单闪现）
 *   · requireFeature(code, msg) ：断言并可触发升级引导
 *   · ensureLoaded()            ：保证 /api/taurus/edition/info 已拉取一次（幂等）
 */

import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useEditionApi, type EditionInfo, type EditionLicense } from '/@/api/taurus/edition/api';
import type { EditionName, TierName, FeatureCode } from './types';

const STORE_ID = 'taurus-edition';

/** 免费版兜底配额：仅限制主机 50 台，其余全部不限（null） */
const FREE_FALLBACK_QUOTA = {
	max_hosts: 50,
	max_users: null,
	max_scheduled_tasks: null,
	max_script_versions_per_script: null,
	max_concurrent_executions: null,
	max_workflows: null,
};

/** 后端不可达时的免费版 License 兜底（与后端 _FREE_LICENSE_FALLBACK 对齐） */
const FREE_FALLBACK_LICENSE: EditionLicense = {
	valid: true,
	state: 'free',
	tier: 'community',
	customer_id: null,
	customer_name: '社区版（免费）',
	expires_at: null,
	fingerprint_ok: true,
	quota: { ...FREE_FALLBACK_QUOTA },
	features: [],
	warnings: [],
	grace_days_left: null,
	branding_allowed: false,
	update_channels: ['stable'],
	service_level: {
		level: '社区支持',
		sla: '社区互助，无商业 SLA',
		channels: ['官方文档', 'GitHub 社区'],
	},
	hosts_used: null,
};

/** Pinia Store（核心）：缓存 License / Edition 信息，全 App 共享 */
export const useEditionStore = defineStore({
	id: STORE_ID,
	state: () => ({
		_loaded: false as boolean,
		_loading: null as null | Promise<any>,
		/** 后端不可达时 features 置 null，表示"功能全开"兜底态 */
		features: new Set<FeatureCode>() as Set<FeatureCode> | null,
		edition: 'community' as EditionName,
		tier: 'community' as TierName,
		feature_count: 0,
		quota: { ...FREE_FALLBACK_QUOTA } as EditionInfo['quota'],
		license: { ...FREE_FALLBACK_LICENSE } as EditionLicense,
		upgrade: { show_banner: true, contact_url: '/#/taurus/contact-lead' } as EditionInfo['upgrade'],
		feature_groups: [] as EditionInfo['feature_groups'],
	}),
	getters: {
		/** 兼容保留：单一版本恒为 true */
		isCommunity: () => true,
		/** 兼容保留：恒为 false，不再有企业版区分 */
		isEnterprise: () => false,
		loaded: (s) => s._loaded,
		licenseState: (s): EditionLicense['state'] => s.license.state,
		brandingAllowed: (s): boolean => !!s.license.branding_allowed,
	},
	actions: {
		/**
		 * hasFeature：单一全功能版本下恒为 true。
		 * 仅在首次信息加载完成前严格判否（防止页面加载瞬间闪现未授权 UI 的既有行为）；
		 * 后端不可达兜底态（features === null）直接全开。
		 */
		hasFeature(code: FeatureCode): boolean {
			if (this.features === null) return true;
			if (!this._loaded) return false;
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
		getQuota(field: keyof EditionInfo['quota']): number | null {
			return this.quota[field] ?? null;
		},
		/**
		 * 保证 License 信息已拉取（幂等）。
		 * API 失败（后端未部署 / 网络错误等）不抛出：回退免费全功能版
		 *  —— 主机 50 台配额，功能全开，不影响正常使用，可重新登录/刷新重试。
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
					// 后端不可用：免费全功能兜底
					// eslint-disable-next-line no-console
					console.warn('[edition] fetch edition info failed, fallback to free full-featured default.', err);
					this.edition = 'community';
					this.tier = 'community';
					this.features = null;
					this.feature_count = 0;
					this.quota = { ...FREE_FALLBACK_QUOTA };
					this.license = { ...FREE_FALLBACK_LICENSE, quota: { ...FREE_FALLBACK_QUOTA } };
				} finally {
					this._loaded = true;
					this._loading = null;
				}
			})();
			await this._loading;
		},
		applyInfo(info: EditionInfo) {
			if (!info) return;
			this.edition = (info.edition || 'community') as EditionName;
			this.tier = info.tier || 'community';
			this.features = new Set(Array.isArray(info.features) ? info.features : []);
			this.feature_count = info.feature_count ?? this.features.size;
			this.quota = info.quota ?? { ...FREE_FALLBACK_QUOTA };
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
		licenseState: computed(() => store.licenseState),
		brandingAllowed: computed(() => store.brandingAllowed),
		hasFeature: (code: FeatureCode) => store.hasFeature(code),
		hasAllFeatures: (codes: FeatureCode[]) => store.hasAllFeatures(codes),
		hasAnyFeature: (codes: FeatureCode[]) => store.hasAnyFeature(codes),
		getQuota: (field: keyof EditionInfo['quota']) => store.getQuota(field),
		ensureLoaded: (force = false) => store.ensureLoaded(force),
		/**
		 * 断言某功能存在；单一全功能版本下恒为 true。
		 * 保留接缝：若后端返回未知 code（未注册），可通过 upgradeMsg 触发服务等级升级引导。
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

// ---------- 服务等级升级引导助手（菜单门禁已移除，仅个别兜底弹窗可能调用） ----------
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
		_safeT('message.pages.edition.enterpriseOnlyDesc', '当前免费版主机配额为 50 台，如需更多主机配额与商业支持服务，请升级服务等级。');
	const title = _safeT('message.pages.edition.enterpriseOnlyTitle', '升级服务等级');
	const okBtn = _safeT('message.pages.edition.upgradeAction', '了解升级方案');
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

export function eeTooltipTxt(): string {
	return _safeT('message.pages.edition.enterpriseOnlyTooltip', '升级服务等级以获取更多主机配额与商业支持');
}

export function triggerUpgradeBanner(code?: FeatureCode | FeatureCode[]) {
	const codes: FeatureCode[] = !code ? [] : Array.isArray(code) ? code.filter(Boolean) : [code];
	window.dispatchEvent(new CustomEvent('taurus:edition-upgrade', { detail: { code: codes[0], codes } }));
}
