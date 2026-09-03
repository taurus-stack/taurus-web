import { request, downloadFile } from '/@/utils/service';
import { UserPageQuery, AddReq, DelReq, EditReq } from '@fast-crud/fast-crud';

export const apiPrefix = '/api/taurus/script/';

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

export function toggleStatus(id: any) {
	return request({
		url: apiPrefix + id + '/toggle-status/',
		method: 'post',
	});
}

export function archiveScript(id: any) {
	return request({
		url: apiPrefix + id + '/archive/',
		method: 'post',
	});
}

export function unarchiveScript(id: any) {
	return request({
		url: apiPrefix + id + '/unarchive/',
		method: 'post',
	});
}

export function GetPermissions(scriptId: any) {
	return request({
		url: apiPrefix + scriptId + '/permissions/',
		method: 'get',
	});
}

export function UpdatePermissions(scriptId: any, data: any) {
	return request({
		url: apiPrefix + scriptId + '/permissions/',
		method: 'put',
		data,
	});
}

export function copyScript(id: any) {
	return request({
		url: apiPrefix + id + '/copy/',
		method: 'post',
	});
}

export function getStats() {
	return request({
		url: apiPrefix + 'stats/',
		method: 'get',
	});
}

export function checkRisk(content: string, script_type?: string) {
	return request({
		url: apiPrefix + 'check-risk/',
		method: 'post',
		data: { content, script_type },
	});
}

export function getCategories() {
	return request({
		url: apiPrefix + 'categories/',
		method: 'get',
	});
}

export function rollbackVersion(id: any, versionId: any) {
	return request({
		url: apiPrefix + id + '/rollback/',
		method: 'post',
		data: { version_id: versionId },
	});
}

export function multipleDelete(ids: (string | number)[]) {
	return request({
		url: apiPrefix + 'multiple_delete/',
		method: 'delete',
		data: { keys: ids },
	});
}

export function exportData(params?: any, filename?: string) {
	return downloadFile({
		url: apiPrefix + 'export_data/',
		method: 'get',
		params: params || {},
		filename: filename || 'script-export',
	});
}

export function importData(fileUrl: string) {
	return request({
		url: apiPrefix + 'import_data/',
		method: 'post',
		data: { url: fileUrl },
	});
}

export function saveAsScript(id: any, data?: any) {
	return request({
		url: apiPrefix + id + '/save-as/',
		method: 'post',
		data: data || {},
	});
}

export function checkOfficialUpdates() {
	return request({
		url: apiPrefix + 'check-official-updates/',
		method: 'get',
	});
}

export function syncOfficialScripts(mode: 'only_add' | 'upgrade' = 'upgrade') {
	return request({
		url: apiPrefix + 'init-official/',
		method: 'post',
		data: { mode },
	});
}

export function initOfficialScripts() {
	return syncOfficialScripts('only_add');
}