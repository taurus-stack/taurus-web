import { request } from '/@/utils/service';

export const apiPrefix = '/api/taurus/ops-execution-approval/';

export function GetList(query: any) {
	return request({
		url: apiPrefix,
		method: 'get',
		params: query,
	});
}

export function GetObj(id: any) {
	return request({
		url: apiPrefix + id + '/',
		method: 'get',
	});
}

export function Approve(id: any, data: { reason?: string }) {
	return request({
		url: apiPrefix + id + '/approve/',
		method: 'post',
		data,
	});
}

export function Reject(id: any, data: { reason?: string }) {
	return request({
		url: apiPrefix + id + '/reject/',
		method: 'post',
		data,
	});
}

export function Cancel(id: any) {
	return request({
		url: apiPrefix + id + '/cancel/',
		method: 'post',
	});
}

export function Delegate(id: any, data: { to_user_id: number; reason?: string }) {
	return request({
		url: apiPrefix + id + '/delegate/',
		method: 'post',
		data,
	});
}

export function AddSign(id: any, data: { user_ids: number[]; reason?: string }) {
	return request({
		url: apiPrefix + id + '/add-sign/',
		method: 'post',
		data,
	});
}

export function StatsCount(query?: any) {
	return request({
		url: apiPrefix + 'stats/count/',
		method: 'get',
		params: query || {},
	});
}

export function submitScriptApproval(data: {
	host_id: string;
	script_type: 'sh' | 'python';
	script_content: string;
	args?: string[];
	working_directory?: string;
	environment?: Record<string, string>;
	timeout_seconds?: number;
	merge_streams?: boolean;
	load_profile?: 'false' | 'true' | 'login';
	privileged?: boolean;
	su_user?: string;
	su_password?: string;
	batch_id?: string;
	submit_desc?: string;
	approver_ids?: number[];
	countersign_ids?: number[];
	approval_mode?: 'any' | 'all';
	exec_mode?: string;
	concurrency?: number;
	target_hosts_count?: number;
}) {
	return request({
		url: '/api/taurus/ops/submit_script_approval/',
		method: 'post',
		data,
	});
}