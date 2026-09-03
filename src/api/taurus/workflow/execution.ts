import {request} from '/@/utils/service';
import {UserPageQuery} from '@fast-crud/fast-crud';

export const apiPrefix = '/api/taurus/workflow-execution/';

export function GetList(query: UserPageQuery) {
    return request({
        url: apiPrefix,
        method: 'get',
        params: query,
    });
}

export function GetObj(id: number) {
    return request({
        url: apiPrefix + id + '/',
        method: 'get',
    });
}

export function CancelExecution(id: number) {
    return request({
        url: apiPrefix + id + '/cancel/',
        method: 'post',
    });
}

export function GetExecutionDetail(id: number) {
    return request({
        url: apiPrefix + id + '/detail_info/',
        method: 'get',
    });
}

export function AdvanceExecution(id: number) {
    return request({
        url: apiPrefix + id + '/advance/',
        method: 'post',
    });
}

export function RerunExecution(id: number, mode: 'full' | 'failed_only' = 'full') {
    return request({
        url: apiPrefix + id + '/rerun/',
        method: 'post',
        data: { mode },
    });
}

export function GetNodeExecutions(id: number) {
    return request({
        url: apiPrefix + id + '/node_executions/',
        method: 'get',
    });
}

export function RetryNode(execId: number, nodeKey: string) {
    return request({
        url: apiPrefix + execId + '/retry-node/' + encodeURIComponent(nodeKey) + '/',
        method: 'post',
    });
}

export function SkipNode(execId: number, nodeKey: string) {
    return request({
        url: apiPrefix + execId + '/skip-node/' + encodeURIComponent(nodeKey) + '/',
        method: 'post',
    });
}

export function ApproveNode(execId: number, nodeKey: string, comment?: string) {
    return request({
        url: apiPrefix + execId + '/approve-node/' + encodeURIComponent(nodeKey) + '/',
        method: 'post',
        data: { comment: comment || '' },
    });
}