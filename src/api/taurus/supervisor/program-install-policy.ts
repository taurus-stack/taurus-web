import { request } from '/@/utils/service';
import { UserPageQuery, AddReq, DelReq, EditReq, InfoReq } from '@fast-crud/fast-crud';

export const apiPrefix = '/api/taurus/program-install-policy/';

export function GetList(query: UserPageQuery) {
    return request({
        url: apiPrefix,
        method: 'get',
        params: query,
    });
}

export function GetObj(id: InfoReq) {
    return request({
        url: apiPrefix + id,
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

export function ApplyPolicy(id: number) {
    return request({
        url: apiPrefix + id + '/apply/',
        method: 'post',
    });
}

export function PreviewHosts(id: number) {
    return request({
        url: apiPrefix + id + '/preview_hosts/',
        method: 'get',
    });
}

export function UpgradeVersion(id: number, data: any) {
    return request({
        url: apiPrefix + id + '/upgrade_version/',
        method: 'post',
        data,
    });
}