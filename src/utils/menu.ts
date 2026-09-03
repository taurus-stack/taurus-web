import XEUtils from "xe-utils"
import {dynamicRoutes, staticRoutes} from "/@/router/route";

/**
 * Dynamic menu i18n mapping: translate backend menu fields to i18n keys.
 *
 * Mapping strategy (two levels, to avoid name collisions and broken keys when admin renames items):
 *   1. Catalog menus (is_catalog=True): use web_path as key (e.g. "/system", "/ops")
 *   2. Leaf menus (is_catalog=False): use component_name as key (e.g. "menu", "MyHost")
 *
 * Falls back to the original Menu.name (Chinese) when no mapping is found, does not affect existing functionality.
 * When adding new menus, please update the corresponding map below following the rules above.
 */

// Catalog menus: web_path → i18n key
const CATALOG_PATH_TO_I18N_KEY: Record<string, string> = {
    // dvadmin framework
    "/system": "message.router.system",
    "/generalConfig": "message.router.config",
    "/log": "message.router.log",
    // Taurus platform
    "/asset": "message.router.asset",
    "/ops": "message.router.opsCenter",
    "/job": "message.router.workflow",
    "/taurus/task-center": "message.router.schedule",
}

// Leaf menus: component_name → i18n key
const COMPONENT_NAME_TO_I18N_KEY: Record<string, string> = {
    // dvadmin framework
    "menu": "message.router.systemMenu",
    "dept": "message.router.systemDept",
    "role": "message.router.systemRole",
    "user": "message.router.systemUser",
    "messageCenter": "message.router.messageCenter",
    "whiteList": "message.router.systemApiWhiteList",
    "config": "message.router.configSystem",
    "dictionary": "message.router.configDict",
    "areas": "message.router.configArea",
    "file": "message.router.configFile",
    "loginLog": "message.router.loginLog",
    "operationLog": "message.router.operationLog",
    // Taurus platform - asset management
    "MyHost": "message.router.hostMy",
    "HostAll": "message.router.hostAll",
    "supervisor-log": "message.router.supervisorLog",
    "supervisor-program": "message.router.program",
    "registration-token": "message.router.registrationToken",
    "program-install-config": "message.router.programInstallConfig",
    "program-command": "message.router.programCommand",
    "program-install-policy": "message.router.programInstallPolicy",
    "heartbeat": "message.router.heartbeat",
    "heartbeat-server": "message.router.heartbeatServer",
    "program-install-template": "message.router.programInstallTemplate",
    // Taurus platform - ops center
    "command": "message.router.opsCommand",
    "Script": "message.router.opsScript",
    "History": "message.router.opsExecutionHistory",
    "script-library": "message.router.scriptLibrary",
    "execution-approval": "message.router.executionApproval",
    "script-approval": "message.router.scriptApproval",
    "script-check-rule": "message.router.scriptCheckRule",
    // Taurus platform - workflow orchestration
    "workflowList": "message.router.workflowList",
    "WorkflowApproveList": "message.router.workflowApproval",
    "workflowRecordList": "message.router.workflowExecutionHistory",
    // Taurus platform - scheduled tasks
    "task-center": "message.router.scheduleTask",
    // Taurus platform - detail routes (may be hidden in sidebar, but referenced by tagsView/breadcrumb)
    "WorkflowEditor": "message.router.workflowEditor",
    "WorkflowRecordDetail": "message.router.workflowRecordDetail",
}

/**
 * Resolve the i18n key for a menu item. Falls back to original Menu.name when no mapping found.
 */
const resolveMenuTitle = (item: any): string => {
    if (item.is_catalog) {
        return CATALOG_PATH_TO_I18N_KEY[item.web_path] ?? item.name
    }
    return COMPONENT_NAME_TO_I18N_KEY[item.component_name] ?? item.name
}

/**
 * @description: Process backend menu data format
 * @param {Array} menuData
 * @return {*}
 */
export const handleMenu = (menuData: Array<any>) => {
    // First handle menu meta data conversion
    const handleMeta = (item: any) => {
        const titleKey = resolveMenuTitle(item)
        item.meta = {
            title: titleKey,
            isLink: item.link_url,
            isHide: !item.visible,
            isKeepAlive: item.cache,
            isAffix: item.is_affix,
            isIframe: item.is_iframe,
            roles: ['admin'],
            icon: item.icon
        }
        item.name = item.component_name
        item.path = item.web_path
        return item
    }

    // Process routes outside the framework
    const handleFrame = (item: any) => {
        if (item.is_iframe) {
            const titleKey = resolveMenuTitle(item)
            item.meta = {
                title: titleKey,
                isLink: item.link_url,
                isHide: !item.visible,
                isKeepAlive: item.cache,
                isAffix: item.is_affix,
                isIframe: item.is_iframe,
                roles: ['admin'],
                icon: item.icon
            }
            item.name = item.component_name
            item.path = item.web_path
        }
        return item
    }

    // Framework internal routes
    const defaultRoutes:Array<any> = []
    // Framework external routes
    const iframeRoutes:Array<any> = []

    menuData.forEach((val) => {
        // if (val.is_iframe) {
        //     // iframeRoutes.push(handleFrame(val))
        // } else {
        //     defaultRoutes.push(handleMeta(val))
        // }
        defaultRoutes.push(handleMeta(val))
    })
    const data = XEUtils.toArrayTree(defaultRoutes, {
        parentKey: 'parent',
        strict: true,
    })
    const dynamicRoutes = [
        {
            path: '/home', name: 'home', component: '/system/home/index', meta: {
                title: 'message.router.home',
                isLink: '',
                isHide: false,
                isKeepAlive: true,
                isAffix: true,
                isIframe: false,
                roles: ['admin'],
                icon: 'iconfont icon-shouye'
            }
        },
        ...data
    ]
    return {frameIn:dynamicRoutes,frameOut:iframeRoutes}
}
