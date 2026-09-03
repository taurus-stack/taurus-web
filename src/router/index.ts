import {createRouter, createWebHashHistory} from 'vue-router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import pinia from '/@/stores/index';
import {storeToRefs} from 'pinia';
import {useKeepALiveNames} from '/@/stores/keepAliveNames';
import {useRoutesList} from '/@/stores/routesList';
import {useThemeConfig} from '/@/stores/themeConfig';
import {Session} from '/@/utils/storage';
import {dynamicRoutes, notFoundAndNoPower, staticRoutes} from '/@/router/route';
import {initFrontEndControlRoutes} from '/@/router/frontEnd';
import {initBackEndControlRoutes, setRouters} from '/@/router/backEnd';
import {useFrontendMenuStore} from "/@/stores/frontendMenu";
import {useTagsViewRoutes} from "/@/stores/tagsViewRoutes";
import {toRaw} from "vue";

/**
 * 1. Frontend controlled routes: isRequestRoutes is false, need to write roles, need to go through setFilterRoute method.
 * 2. Backend controlled routes: isRequestRoutes is true, no need to write roles, no need to go through setFilterRoute method.
 * Related methods are split into corresponding `backEnd.ts` and `frontEnd.ts` (they don't affect each other, no need to modify 2 files at the same time).
 * Special notes:
 * 1. Frontend controlled: route menus are written by frontend (no menu management UI, has role management UI), role management has roles property, needs to be returned in userInfo.
 * 2. Backend controlled: route menus are returned by backend (has menu management UI, has role management UI)
 */

// Read whether backend-controlled routing is enabled from `/src/stores/themeConfig.ts`
const storesThemeConfig = useThemeConfig(pinia);
const {themeConfig} = storeToRefs(storesThemeConfig);
const {isRequestRoutes} = themeConfig.value;

/**
 * Create a router instance that can be used by Vue applications
 * @method createRouter(options: RouterOptions): Router
 * @link Reference: https://next.router.vuejs.org/zh/api/#createrouter
 */
export const router = createRouter({
    history: createWebHashHistory(),
    /**
     * Notes:
     * 1. notFoundAndNoPower adds 404, 401 pages by default, to prevent constant "No match found for location with path 'xxx'" prompts
     * 2. backEnd.ts (backend controlled routes) and frontEnd.ts (frontend controlled routes) also need to add notFoundAndNoPower 404, 401 pages.
     *    Prevents 404, 401 from not being in layout. If not set, 404, 401 pages will display full-screen
     */
    routes: [...notFoundAndNoPower, ...staticRoutes]
});

/**
 * Process multi-level nested route array into one-dimensional array
 * @param arr Incoming route menu data array
 * @returns Returns processed one-dimensional route menu array
 */
export function formatFlatteningRoutes(arr: any) {
    if (arr.length <= 0) return false;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].children) {
            arr = arr.slice(0, i + 1).concat(arr[i].children, arr.slice(i + 1));
        }
    }
    return arr;
}

/**
 * Process one-dimensional array into multi-level nested array (only keep two levels: all above level 2 are processed to only two levels, keep-alive supports level-2 caching)
 * @description isKeepAlive processes `name` value for caching. Top level off means all not cached
 * @link Reference: https://v3.cn.vuejs.org/api/built-in-components.html#keep-alive
 * @param arr Processed one-dimensional route menu array
 * @returns Returns the one-dimensional array reprocessed into `dynamic dynamic routes (dynamicRoutes)` format
 */
export function formatTwoStageRoutes(arr: any) {
    if (arr.length <= 0) return false;
    const newArr: any = [];
    const cacheList: Array<string> = [];
    arr.forEach((v: any) => {
        if (v.path === '/') {
            newArr.push({component: v.component,name: v.name,path: v.path,redirect: v.redirect,meta: v.meta,children: []});
        } else {
            // Check if it's a dynamic route (xx/:id/:name), used in tagsView etc.
            // Fix: https://gitee.com/lyt-top/vue-next-admin/issues/I3YX6G
            if (v.path.indexOf('/:') > -1) {
                v.meta['isDynamic'] = true;
                v.meta['isDynamicPath'] = v.path;
            }
            newArr[0].children.push({...v});
            // Store name value, used by keep-alive include to enable route caching
            // Path: /@/layout/routerView/parent.vue
            if (newArr[0].meta.isKeepAlive && v.meta.isKeepAlive && v.component_name != "") {
                cacheList.push(v.name);
                const stores = useKeepALiveNames(pinia);
                stores.setCacheKeepAlive(cacheList);
            }
        }
    });
    return newArr;
}

// Before route loads
router.beforeEach(async (to, from, next) => {
    NProgress.configure({showSpinner: false});
    if (to.meta.title) NProgress.start();
    const token = Session.get('token');
    if (to.path === '/login' && !token) {
        next();
        NProgress.done();
    } else {
        if (!token) {
            next(`/login?redirect=${to.path}&params=${JSON.stringify(to.query ? to.query : to.params)}`);
            Session.clear();
            NProgress.done();
        } else if (token && to.path === '/login') {
            next('/home');
            NProgress.done();
        } else {

            const storesRoutesList = useRoutesList(pinia);
            const {routesList} = storeToRefs(storesRoutesList);
            if (routesList.value.length === 0) {
                if (isRequestRoutes) {
                    // Backend controlled routing: initialize route data to prevent loss on refresh
                    await initBackEndControlRoutes();
                    // Fix issue where refreshing always jumps to 404, related to "No match found for location with path 'xxx'"
                    // to.query prevents parameter loss on refresh for normal routes with params. Dynamic routes (xxx/:id/:name") isDynamic need no handling

                    next({ path: to.path, query: to.query });
                } else {
                    // https://gitee.com/lyt-top/vue-next-admin/issues/I5F1HP
                    await initFrontEndControlRoutes();
                    next({ path: to.path, query: to.query });
                }
            } else {
                next();
            }
        }
    }
});

// After route loads
router.afterEach(() => {
    NProgress.done();
});

// Export router
export default router;
