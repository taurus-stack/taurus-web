import { request } from '/@/utils/service';
import { UserPageQuery, AddReq, DelReq, EditReq } from '@fast-crud/fast-crud';

export const apiPrefix = '/api/taurus/workflow-approval-rule/';

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

export function updateNodeOrder(ruleId: any, nodeOrders: any[]) {
	return request({
		url: apiPrefix + ruleId + '/nodes/order/',
		method: 'post',
		data: { node_orders: nodeOrders },
	});
}

export function testMatch(workflowId: any) {
	return request({
		url: apiPrefix + 'test-match/',
		method: 'post',
		data: { workflow_id: workflowId },
	});
}