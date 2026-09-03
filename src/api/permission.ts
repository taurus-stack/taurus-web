import { request } from '/@/utils/service';

/**
 * Permission code management API
 */

// Get permission code list
export function getPermissionCodeList(params?: any) {
    return request({
        url: '/api/system/permission_code/',
        method: 'get',
        params
    });
}

// Create permission code
export function createPermissionCode(data: any) {
    return request({
        url: '/api/system/permission_code/',
        method: 'post',
        data
    });
}

// Update permission code
export function updatePermissionCode(id: number, data: any) {
    return request({
        url: `/api/system/permission_code/${id}/`,
        method: 'put',
        data
    });
}

// Delete permission code
export function deletePermissionCode(id: number) {
    return request({
        url: `/api/system/permission_code/${id}/`,
        method: 'delete'
    });
}

// Get all modules
export function getPermissionModules() {
    return request({
        url: '/api/system/permission_code/get_modules/',
        method: 'get'
    });
}

// Get role permission code list
export function getRolePermissionCodes(roleId: number) {
    return request({
        url: '/api/system/permission_code/get_role_permissions/',
        method: 'get',
        params: { role_id: roleId }
    });
}

// Set role permission codes
export function setRolePermissionCodes(roleId: number, permissionCodes: string[]) {
    return request({
        url: '/api/system/permission_code/set_role_permissions/',
        method: 'put',
        data: {
            role_id: roleId,
            permission_codes: permissionCodes
        }
    });
}

/**
 * Role permission association API
 */

// Get role permission association list
export function getRolePermissionList(params?: any) {
    return request({
        url: '/api/system/role_permission/',
        method: 'get',
        params
    });
}
