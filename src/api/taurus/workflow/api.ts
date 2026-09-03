import { request, downloadFile } from '/@/utils/service';
import { UserPageQuery, AddReq, DelReq, EditReq, InfoReq } from '@fast-crud/fast-crud';

export const apiPrefix = '/api/taurus/workflow/';

export function GetList(query: UserPageQuery) {
    return request({
        url: apiPrefix,
        method: 'get',
        params: query,
    });
}

export function GetObj(id: InfoReq) {
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

export function toggleScheduleEnabled(id: any) {
    return request({
        url: apiPrefix + id + '/toggle-schedule-enabled/',
        method: 'post',
    });
}

export function copyWorkflow(id: any) {
    return request({
        url: apiPrefix + id + '/copy/',
        method: 'post',
    });
}

export function submitApprove(id: any, data?: { submit_desc?: string }) {
    return request({
        url: apiPrefix + id + '/submit-approve/',
        method: 'post',
        data: data || {},
    });
}

export function getStats() {
    return request({
        url: apiPrefix + 'stats/',
        method: 'get',
    });
}

export function GetRiskAssessment(id: any, query?: any) {
    return request({
        url: apiPrefix + id + '/risk-assessment/',
        method: 'get',
        params: query || {},
    });
}

export function PostRiskAssessment(id: any, data?: any) {
    return request({
        url: apiPrefix + id + '/risk-assessment/',
        method: 'post',
        data: data || {},
    });
}

export function GetSteps(id: number) {
    return request({
        url: apiPrefix + id + '/steps/',
        method: 'get',
    });
}

export function AddStep(id: number, data: any) {
    return request({
        url: apiPrefix + id + '/add_step/',
        method: 'post',
        data,
    });
}

export function UpdateStep(id: number, data: any) {
    return request({
        url: apiPrefix + id + '/update_step/',
        method: 'put',
        data,
    });
}

export function DeleteStep(id: number, stepId: number) {
    return request({
        url: apiPrefix + id + '/delete_step/',
        method: 'delete',
        data: { step_id: stepId },
    });
}

export function ExecuteWorkflow(id: number, data: any) {
    return request({
        url: apiPrefix + id + '/execute/',
        method: 'post',
        data,
    });
}

export function PublishWorkflow(id: number, data: {
    definition: any;
    global_envs?: Record<string, string>;
    release_note?: string;
    approver_ids?: number[];
    countersign_ids?: number[];
    approval_mode?: 'any' | 'all';
    submit_desc?: string;
}) {
    return request({
        url: apiPrefix + id + '/publish/',
        method: 'post',
        data,
    });
}

export function TriggerWorkflow(id: number, data?: { trigger_params?: Record<string, any>; fail_strategy?: string; trigger_type?: string }) {
    return request({
        url: apiPrefix + id + '/trigger/',
        method: 'post',
        data: data || {},
    });
}

export function GetDAGVersions(id: number) {
    return request({
        url: apiPrefix + id + '/dag_versions/',
        method: 'get',
    });
}

export function RollbackDAG(id: number, versionId: number) {
    return request({
        url: apiPrefix + id + '/rollback-dag/' + versionId + '/',
        method: 'post',
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
        filename: filename || 'workflow-export',
    });
}