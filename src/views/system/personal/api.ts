import { request } from '/@/utils/service';
import { PageQuery, AddReq, DelReq, EditReq, InfoReq } from '@fast-crud/fast-crud';

export function getUserInfo(query: PageQuery) {
	return request({
		url: '/api/system/user/user_info/',
		method: 'get',
		params: query,
	});
}

export function updateUserInfo(data: AddReq) {
	return request({
		url: '/api/system/user/update_user_info/',
		method: 'put',
		data: data,
	});
}

export function getSelfReceive(query: PageQuery) {
	return request({
		url: '/api/system/message_center/get_self_receive/',
		method: 'get',
		params: query,
	});
}

export function updatePassword(data: EditReq) {
	return request({
		url: '/api/system/user/change_password/',
		method: 'put',
		data: data,
	});
}

export function uploadAvatar(data: AddReq) {
	return request({
		url: '/api/system/file/',
		method: 'post',
		data: data,
		headers: {
			'Content-Type': 'multipart/form-data',
		},
	});
}

export function getPreferenceSettings(query?: PageQuery) {
	return request({
		url: '/api/system/user/preference/',
		method: 'get',
		params: query || {},
	});
}

export function updatePreferenceSettings(data: AddReq) {
	return request({
		url: '/api/system/user/preference/',
		method: 'put',
		data: data,
	});
}

export function getOperationLogs(query: PageQuery) {
	return request({
		url: '/api/system/operation_log/',
		method: 'get',
		params: query,
	});
}

export function getFavorites(query?: PageQuery) {
	return request({
		url: '/api/system/user/favorites/',
		method: 'get',
		params: query || {},
	});
}

export function addFavorite(data: AddReq) {
	return request({
		url: '/api/system/user/favorites/',
		method: 'post',
		data: data,
	});
}

export function removeFavorite(data: DelReq) {
	return request({
		url: '/api/system/user/favorites/',
		method: 'delete',
		data: data,
	});
}