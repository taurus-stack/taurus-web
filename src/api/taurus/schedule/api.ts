import {request} from '/@/utils/service';
import {UserPageQuery, AddReq, DelReq, EditReq, InfoReq} from '@fast-crud/fast-crud';

export const apiPrefix = '/api/taurus/schedule/';

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

export function EnableSchedule(id: number) {
    return request({
        url: apiPrefix + id + '/enable/',
        method: 'post',
    });
}

export function DisableSchedule(id: number) {
    return request({
        url: apiPrefix + id + '/disable/',
        method: 'post',
    });
}

export function RunNow(id: number) {
    return request({
        url: apiPrefix + id + '/run_now/',
        method: 'post',
    });
}

export function GetExecutions(id: number) {
    return request({
        url: apiPrefix + id + '/executions/',
        method: 'get',
    });
}