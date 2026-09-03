import { request } from "/@/utils/service";

/**
 * get role permission list
 * @param roleId
 * @param query
 */
export function getRolePremission(query:object) {
  return request({
    url: '/api/system/role_menu_button_permission/get_role_premission/',
    method: 'get',
    params:query
  })
}

/***
 * Set role permissions
 * @param roleId
 * @param data
 */
export function setRolePremission(roleId:any,data:object) {
  return request({
    url: `/api/system/role_menu_button_permission/${roleId}/set_role_premission/`,
    method: 'put',
    data
  })
}

export function getDataPermissionRange() {
  return request({
    url: '/api/system/role_menu_button_permission/data_scope/',
    method: 'get',
  })
}
export function getDataPermissionDept() {
  return request({
    url: '/api/system/role_menu_button_permission/role_to_dept_all/',
    method: 'get'
  })
}

export function getDataPermissionMenu() {
  return request({
    url: '/api/system/role_menu_button_permission/get_role_permissions/',
    method: 'get'
  })
}

/**
 * set button data scope
 */
export function setBtnDatarange(roleId:number,data:object) {
  return request({
    url: `/api/system/role_menu_button_permission/${roleId}/set_btn_datarange/`,
    method: 'put',
    data
  })
}

