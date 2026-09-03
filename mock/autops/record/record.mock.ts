import {defineMock} from 'vite-plugin-mock-dev-server';
import {GetList, GetObj, GetMyTaskInfo} from './data/data';

const url_prefix = '/api/taurus/record/';

export default defineMock([
    {
        url: url_prefix,
        method: 'GET',
        body: ({query, params, body, headers}) => {
            const res = GetList();
            return res;
        }
    },
    {
        url: url_prefix + ':id(\\d+)/',
        method: 'GET',
        body: ({query, params, body, headers}) => {
            const res = GetObj(params.id)
            return {data: res, code: 2000, msg: 'success'}
        }
    },
    {
        url: url_prefix,
        method: 'POST',
        body: ({query, params, body, headers}) => {
            console.debug("🚀 ~ file:host.mock.ts method:body line:18 -----", query, params, body, headers);
            return {data: body, code: 2000, msg: 'success'}
        }
    },
    {
        url: url_prefix + ':id/',
        method: 'PUT',
        body: ({query, params, body, headers}) => {
            console.debug("🚀 ~ file:host.mock.ts method:body line:26 -----", params, body, headers);
            return {data: body, code: 2000, msg: 'success'}
        }
    },
    {
        url: url_prefix + ':id/',
        method: 'DELETE',
        body: ({query, params, body, headers}) => {
            console.debug("🚀 ~ file:host.mock.ts method:body line:34 -----", params, body, headers);
            return {data: body, code: 2000, msg: 'success'}
        }
    },
    {
        url: url_prefix + '/:id/',
        method: 'PATCH',
        body: ({query, params, body, headers}) => {
            console.debug("🚀 ~ file:host.mock.ts method:body line:42 -----", params, body, headers);
            return {data: body, code: 2000, msg: 'success'}
        }
    },
    {
        url: url_prefix + 'my_task_info/',
        method: 'GET',
        body: ({query, params, body, headers}) => {
            return GetMyTaskInfo(query)
        }
    },
]);