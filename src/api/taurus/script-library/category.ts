import { request } from '/@/utils/service';
import { UserPageQuery, AddReq, DelReq, EditReq } from '@fast-crud/fast-crud';

export const apiPrefix = '/api/taurus/script-category/';

export function GetList(query: UserPageQuery) {
	return request({
		url: apiPrefix,
		method: 'get',
		params: query,
	});
}

export function GetTree() {
	return request({
		url: apiPrefix + 'tree/',
		method: 'get',
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