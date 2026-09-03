import { request } from '/@/utils/service';
import { UserPageQuery, AddReq, DelReq, EditReq } from '@fast-crud/fast-crud';

export const apiPrefix = '/api/taurus/workflow-approval-instance/';

export function GetList(query: UserPageQuery) {
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

export function AddObj(obj: AddReq) {
	return request({
		url: apiPrefix,
		method: 'post',
		data: obj,
	});
}

export function UpdateObj(obj: EditReq) {
	return request({
		url: apiPrefix + obj.id + '/',
		method: 'put',
		data: obj,
	});
}

export function DelObj(id: DelReq) {
	return request({
		url: apiPrefix + id + '/',
		method: 'delete',
		data: { id },
	});
}

export function getNodes(instanceId: any) {
	return request({
		url: apiPrefix + instanceId + '/nodes/',
		method: 'get',
	});
}

export function approve(id: any, reason: string) {
	return request({
		url: apiPrefix + id + '/approve/',
		method: 'post',
		data: { reason },
	});
}

export function reject(id: any, reason: string) {
	return request({
		url: apiPrefix + id + '/reject/',
		method: 'post',
		data: { reason },
	});
}

export function delegate(id: any, toUserId: number, reason: string) {
	return request({
		url: apiPrefix + id + '/delegate/',
		method: 'post',
		data: { to_user_id: toUserId, reason },
	});
}

export function addSign(id: any, userIds: number[], reason: string) {
	return request({
		url: apiPrefix + id + '/add-sign/',
		method: 'post',
		data: { user_ids: userIds, reason },
	});
}

export function cancel(id: any) {
	return request({
		url: apiPrefix + id + '/cancel/',
		method: 'post',
	});
}

export function getStatsCount() {
	return request({
		url: apiPrefix + 'stats/count/',
		method: 'get',
	});
}