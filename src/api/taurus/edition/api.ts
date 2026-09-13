/**
 * M1.6 — Edition Gate 前端 API 封装
 *
 * 对应后端：GET /api/taurus/edition/{info,features,describe}
 * 其中 edition/info 为 AllowAny（登录前 bootstrap 也能拿到），edition/describe 需要登录。
 */

import { request } from '/@/utils/service';

export const EDITION_API_PREFIX = '/api/taurus/edition/';

export type LicenseState = 'free' | 'licensed' | 'grace' | 'blocked';
export type TierName = 'community' | 'starter' | 'professional' | 'enterprise' | 'ultimate';

export interface EditionQuota {
	max_hosts: number | null;
	max_users: number | null;
	max_scheduled_tasks: number | null;
	max_script_versions_per_script: number | null;
	max_concurrent_executions: number | null;
	max_workflows: number | null;
}

export interface ServiceLevel {
	level: string;
	sla: string;
	channels: string[];
}

export interface EditionLicense {
	valid: boolean;
	/** License 状态机：free/licensed/grace/blocked */
	state: LicenseState;
	tier: TierName;
	customer_id: string | null;
	customer_name: string | null;
	expires_at: string | null;
	fingerprint_ok: boolean;
	quota: EditionQuota;
	features: string[];
	warnings: Array<{ code: string; message?: string; days_left?: number }>;
	grace_days_left: number | null;
	branding_allowed: boolean;
	update_channels: string[];
	service_level: ServiceLevel;
	hosts_used: number | null;
}

export interface EditionUpgrade {
	show_banner: boolean;
	contact_url: string;
}

export interface FeatureGroupItem {
	code: string;
	name: string;
	in_edition?: boolean;
}

export interface FeatureGroup {
	group: string;
	items: FeatureGroupItem[];
}

export interface EditionInfo {
	edition: 'community';
	tier: TierName;
	features: string[];
	feature_count: number;
	quota: EditionQuota;
	license: EditionLicense;
	branding_allowed: boolean;
	update_channels: string[];
	service_level: ServiceLevel;
	hosts_used: number | null;
	upgrade: EditionUpgrade;
	feature_groups?: FeatureGroup[];
}

export interface EditionFeatures {
	edition: 'community';
	tier: TierName;
	features: string[];
}

export interface EditionDescribe {
	total: number;
	items: FeatureGroupItem[];
	groups: FeatureGroup[];
}

export function useEditionApi() {
	return {
		getInfo: (): Promise<{ data: EditionInfo }> =>
			request({
				url: EDITION_API_PREFIX + 'info/',
				method: 'get',
				// 登录前可访问；让 axios 不要因 401 抛错中断 bootstrap
				skipAuthError: true,
			} as any),
		getFeatures: (): Promise<{ data: EditionFeatures }> =>
			request({
				url: EDITION_API_PREFIX + 'features/',
				method: 'get',
				skipAuthError: true,
			} as any),
		getDescribe: (): Promise<{ data: EditionDescribe }> =>
			request({
				url: EDITION_API_PREFIX + 'describe/',
				method: 'get',
			}),
	};
}
