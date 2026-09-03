import { request } from '/@/utils/service';
import { UserPageQuery, AddReq, DelReq, EditReq, InfoReq } from '@fast-crud/fast-crud';

// List query
export const GetList = (params: UserPageQuery) => {
    return request({ url: '/api/taurus/program-install-template/', method: 'get', params });
};

// Detail query
export const GetObj = (id: InfoReq) => {
    return request({ url: `/api/taurus/program-install-template/${id}/`, method: 'get' });
};

// Create
export const AddObj = (params: AddReq) => {
    return request({ url: '/api/taurus/program-install-template/', method: 'post', data: params });
};

// Update
export const UpdateObj = (params: EditReq) => {
    return request({ url: `/api/taurus/program-install-template/${params.id}/`, method: 'put', data: params });
};

// Delete
export const DelObj = (id: DelReq) => {
    return request({ url: `/api/taurus/program-install-template/${id}/`, method: 'delete' });
};

// Batch delete
export const batchRemove = (ids: number[]) => {
    return request({ url: '/api/taurus/program-install-template/multiple_delete/', method: 'delete', data: { ids } });
};

// Apply to hosts
export const applyToHosts = (id: number, data: any) => {
    return request({ url: `/api/taurus/program-install-template/${id}/apply_to_hosts/`, method: 'post', data });
};