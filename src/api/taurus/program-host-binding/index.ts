import { request } from '/@/utils/service';
import { UserPageQuery, AddReq, DelReq, EditReq, InfoReq } from '@fast-crud/fast-crud';

// List query
export const GetList = (params: UserPageQuery) => {
    return request({ url: '/api/taurus/program-host-binding/', method: 'get', params });
};

// Detail query
export const GetObj = (id: InfoReq) => {
    return request({ url: `/api/taurus/program-host-binding/${id}/`, method: 'get' });
};

// Create
export const AddObj = (params: AddReq) => {
    return request({ url: '/api/taurus/program-host-binding/', method: 'post', data: params });
};

// Update
export const UpdateObj = (params: EditReq) => {
    return request({ url: `/api/taurus/program-host-binding/${params.id}/`, method: 'put', data: params });
};

// Delete
export const DelObj = (id: DelReq) => {
    return request({ url: `/api/taurus/program-host-binding/${id}/`, method: 'delete' });
};

// Batch delete
export const batchRemove = (ids: number[]) => {
    return request({ url: '/api/taurus/program-host-binding/multiple_delete/', method: 'delete', data: { ids } });
};

// Install
export const install = (id: number) => {
    return request({ url: `/api/taurus/program-host-binding/${id}/install/`, method: 'post' });
};

// Uninstall
export const uninstall = (id: number) => {
    return request({ url: `/api/taurus/program-host-binding/${id}/uninstall/`, method: 'post' });
};