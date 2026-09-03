/**
 * M1.6 — Edition Gate 前端 API 封装
 *
 * 对应后端：GET /api/taurus/edition/{info,features,describe}
 * 其中 edition/info 为 AllowAny（登录前 bootstrap 也能拿到），edition/describe 需要登录。
 */

import { request } from '/@/utils/service';

export const EDITION_API_PREFIX = '/api/taurus/edition/';

export interface EditionLicense {
	valid: boolean;
	tier: 'community' | 'starter' | 'professional' | 'enterprise' | 'ultimate';
	expires_at: string | null;
	customer: string | null;
	hosts_used?: number;
	users_used?: number;
	warnings: Array<{ code: string; message?: string; days_left?: number }>;
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
	edition: 'community' | 'enterprise';
	tier: EditionLicense['tier'];
	features: string[];
	feature_count: number;
	quota: Record<string, number | null>;
	license: EditionLicense;
	upgrade: EditionUpgrade;
	feature_groups?: FeatureGroup[];
}

export interface EditionFeatures {
	edition: 'community' | 'enterprise';
	tier: EditionLicense['tier'];
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
