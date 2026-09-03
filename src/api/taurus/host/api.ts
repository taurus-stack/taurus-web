import {request} from '/@/utils/service';
import {UserPageQuery, AddReq, DelReq, EditReq, InfoReq} from '@fast-crud/fast-crud';

export const apiPrefix = '/api/taurus/host/';

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
        data: {id},
    });
}

export function GetMyHostInfo(query: any) {
    return request({
        url: apiPrefix + 'my_host_info/',
        method: 'get',
        params: query,
    });
}

export function GetMyAlarmInfo(query: any) {
    return request({
        url: apiPrefix + 'my_alarm_info/',
        method: 'get',
        params: query,
    });
}

export interface ValidateHostsResult {
    valid: Array<{
        identifier: string;
        id: number;
        host_uuid: string;
        host_name: string;
        host_ip: string;
        status: number;
        online_status: number;
    }>;
    not_found: string[];
    no_permission: Array<{
        identifier: string;
        id: number;
        host_uuid: string;
        host_name: string;
        host_ip: string;
        status: number;
        online_status: number;
    }>;
}

export function ValidateHosts(hosts: string[]) {
    return request({
        url: apiPrefix + 'validate-hosts/',
        method: 'post',
        data: { hosts },
    });
}