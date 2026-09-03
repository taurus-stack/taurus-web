import { request } from '/@/utils/service';
import type { UserPageQuery, AddReq, DelReq, EditReq } from '@fast-crud/fast-crud';

export const sharePermDefPrefix = '/api/taurus/share-perm-def/';
export const shareLinkPrefix = '/api/taurus/share-link/';
export const scriptPrefix = '/api/taurus/script/';
export const workflowPrefix = '/api/taurus/workflow/';

export interface SharePermDef {
	id: number;
	resource_type: 'script' | 'workflow';
	resource_type_display: string;
	perm_code: string;
	perm_name: string;
	category: string;
	category_display: string;
	description: string;
	sort: number;
	is_active: boolean;
	create_datetime: string;
	update_datetime: string;
}

export interface PermDefGroup {
	category: string;
	category_display: string;
	resource_type: string;
	sort: number;
	perms: SharePermDef[];
}

export interface SubjectInput {
	subject_type: 'user' | 'role' | 'dept';
	subject_id: string | number;
	subject_name?: string;
	name?: string;
}

export interface ShareBatchCreateBody {
	subjects: SubjectInput[];
	permissions: string[];
	expire_time?: string;
	remark?: string;
}

export interface SharePermissionItem {
	id: number;
	script?: number;
	workflow?: number;
	script_name?: string;
	workflow_name?: string;
	subject_type: 'user' | 'role' | 'dept';
	subject_type_display: string;
	subject_id: string;
	subject_name_cache: string;
	subject_info?: { id: number; name: string; username?: string; key?: string; dept_code?: string };
	permissions: string[];
	perm_details?: SharePermDef[];
	expire_time?: string;
	remark?: string;
	creator_name?: string;
	create_datetime: string;
	update_datetime: string;
}

export interface EffectivePerms {
	permissions: string[];
	details: SharePermDef[];
	is_owner: boolean;
	is_superuser?: boolean;
	from_public?: string[];
	from_direct?: string[];
	from_role?: string[];
	from_dept?: string[];
	from_link?: string[];
}

export interface ShareLinkItem {
	id: number;
	resource_type: 'script' | 'workflow';
	resource_type_display: string;
	resource_id: number;
	resource_name?: string;
	share_token: string;
	permissions: string[];
	perm_details?: SharePermDef[];
	access_scope: 'authenticated' | 'anyone';
	access_scope_display: string;
	expire_time?: string;
	max_access_count?: number;
	current_access_count: number;
	is_active: boolean;
	bind_subject_type?: 'user' | 'role' | 'dept';
	bind_subject_id?: string;
	bind_subject_name_cache?: string;
	remark?: string;
	create_user_name?: string;
	create_datetime: string;
	update_datetime: string;
}

export interface ShareLinkAccessLogItem {
	id: number;
	share_link_id: number;
	access_time: string;
	visitor_type: 'login' | 'anonymous';
	visitor_name: string;
	visitor_id?: number;
	client_ip: string;
	user_agent: string;
	access_success: boolean;
	fail_reason?: string;
}

// ---------- Permission definitions ----------
export function listSharePermDef(query?: UserPageQuery & { resource_type?: 'script' | 'workflow'; is_active?: boolean }) {
	return request({
		url: sharePermDefPrefix,
		method: 'get',
		params: query || {},
	});
}

export function getSharePermDefGrouped(params?: { resource_type?: 'script' | 'workflow' }) {
	return request({
		url: sharePermDefPrefix + 'perm_defs/',
		method: 'get',
		params: params || {},
	});
}

// ---------- Script direct shares ----------
export function listScriptShares(scriptId: number | string, query?: UserPageQuery) {
	return request({
		url: scriptPrefix + scriptId + '/shares/',
		method: 'get',
		params: query || {},
	});
}

export function batchCreateScriptShares(scriptId: number | string, body: ShareBatchCreateBody) {
	return request({
		url: scriptPrefix + scriptId + '/shares/',
		method: 'post',
		data: body,
	});
}

export function updateScriptShare(scriptId: number | string, shareId: number | string, data: Partial<SharePermissionItem>) {
	return request({
		url: scriptPrefix + scriptId + '/shares/' + shareId + '/',
		method: 'put',
		data,
	});
}

export function deleteScriptShare(scriptId: number | string, shareId: number | string) {
	return request({
		url: scriptPrefix + scriptId + '/shares/' + shareId + '/',
		method: 'delete',
	});
}

export function getScriptEffectivePerms(scriptId: number | string) {
	return request({
		url: scriptPrefix + scriptId + '/effective-perms/',
		method: 'get',
	});
}

// ---------- Workflow direct shares ----------
export function listWorkflowShares(workflowId: number | string, query?: UserPageQuery) {
	return request({
		url: workflowPrefix + workflowId + '/shares/',
		method: 'get',
		params: query || {},
	});
}

export function batchCreateWorkflowShares(workflowId: number | string, body: ShareBatchCreateBody) {
	return request({
		url: workflowPrefix + workflowId + '/shares/',
		method: 'post',
		data: body,
	});
}

export function updateWorkflowShare(workflowId: number | string, shareId: number | string, data: Partial<SharePermissionItem>) {
	return request({
		url: workflowPrefix + workflowId + '/shares/' + shareId + '/',
		method: 'put',
		data,
	});
}

export function deleteWorkflowShare(workflowId: number | string, shareId: number | string) {
	return request({
		url: workflowPrefix + workflowId + '/shares/' + shareId + '/',
		method: 'delete',
	});
}

export function getWorkflowEffectivePerms(workflowId: number | string) {
	return request({
		url: workflowPrefix + workflowId + '/effective-perms/',
		method: 'get',
	});
}

// ---------- Share links ----------
export function listShareLink(query?: UserPageQuery & Partial<ShareLinkItem>) {
	return request({
		url: shareLinkPrefix,
		method: 'get',
		params: query || {},
	});
}

export function getShareLink(id: number | string) {
	return request({
		url: shareLinkPrefix + id + '/',
		method: 'get',
	});
}

export function createShareLink(data: Partial<ShareLinkItem>) {
	return request({
		url: shareLinkPrefix,
		method: 'post',
		data,
	});
}

export function updateShareLink(data: EditReq & Partial<ShareLinkItem>) {
	return request({
		url: shareLinkPrefix + data.id + '/',
		method: 'put',
		data,
	});
}

export function deleteShareLink(id: DelReq) {
	return request({
		url: shareLinkPrefix + id + '/',
		method: 'delete',
		data: { id },
	});
}

export function activateShareLink(shareToken: string, password?: string) {
	return request({
		url: shareLinkPrefix + 'activate/',
		method: 'post',
		data: { share_token: shareToken, password },
	});
}

export function revokeShareLink(id: number | string) {
	return request({
		url: shareLinkPrefix + id + '/revoke/',
		method: 'post',
	});
}

export function toggleShareLinkStatus(id: number | string, status: 'active' | 'revoked') {
	return request({
		url: shareLinkPrefix + id + '/toggle-status/',
		method: 'post',
		data: { status },
	});
}

export function getShareLinkAccessLogs(linkId: number | string, query?: UserPageQuery) {
	return request({
		url: shareLinkPrefix + linkId + '/access-logs/',
		method: 'get',
		params: query || {},
	});
}

export function getMyActiveLinks() {
	return request({
		url: shareLinkPrefix + 'my-active-links/',
		method: 'get',
	});
}

export interface ShareResourceDetailResp {
	resource_type: 'script' | 'workflow';
	resource_id: number;
	permissions: string[];
	detail: any;
}

export function getShareResourceDetail(shareToken: string) {
	return request({
		url: shareLinkPrefix + 'resource-detail/',
		method: 'get',
		params: { share_token: shareToken },
		_noGlobalError: true,
	});
}