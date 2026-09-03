import { request } from '/@/utils/service';

export const apiPrefix = '/api/taurus/script-check-rule/';

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

export function AddObj(obj: any) {
	return request({
		url: apiPrefix,
		method: 'post',
		data: obj,
	});
}

export function UpdateObj(obj: any) {
	return request({
		url: apiPrefix + obj.id + '/',
		method: 'put',
		data: obj,
	});
}

export function DelObj(id: any) {
	return request({
		url: apiPrefix + id + '/',
		method: 'delete',
	});
}

export function toggleRule(id: any) {
	return request({
		url: apiPrefix + id + '/toggle/',
		method: 'post',
	});
}

export function initDefaultRules() {
	return request({
		url: apiPrefix + 'init-default/',
		method: 'post',
	});
}

export function batchEnable(ids: number[]) {
	return request({
		url: apiPrefix + 'batch/enable/',
		method: 'post',
		data: { ids },
	});
}

export function batchDisable(ids: number[]) {
	return request({
		url: apiPrefix + 'batch/disable/',
		method: 'post',
		data: { ids },
	});
}
