import { RouteRecordRaw } from 'vue-router';
import { i18n } from '/@/i18n';
const t = i18n.global.t;

/**
 * Route meta object parameter descriptions
 * meta: {
 *      title:          Sidebar menu, tagsView, and menu search name (i18n)
 *      isLink:         Whether this is an external link menu, enabled when `1. isLink: link address is not empty`
 *      isHide:         Whether to hide this route
 *      isKeepAlive:    Whether to cache component state
 *      isAffix:        Whether to pin on the tagsView bar
 *      isIframe:       Whether to embed an iframe window, enabled when `1. isIframe:true 2. isLink: link address is not empty`
 *      roles:          Current route permission identifier, from role management. Controls route display/hide. Super admin: admin, regular role: utils
 *      icon:           Menu and tagsView icon; Ali: add `iconfont xxx`, FontAwesome: add `fa xxx`
 * }
 */

/**
 * Define dynamic routes
 * To add frontend routes, add them to the top-level node's `children array`
 * @description Used when isRequestRoutes is not enabled (frontend-controlled routing). When enabled, the first top-level children routes will be replaced with data from the API
 * @description See `ruleForm` in /@/views/system/menu/component/addMenu.vue for each field
 * @returns Returns route menu data
 */
export const dynamicRoutes: Array<RouteRecordRaw> = [
	{
		path: '/',
		name: '/',
		component: () => import('/@/layout/index.vue'),
		redirect: '/home',
		meta: {
			isKeepAlive: true,
		},
		children: [],
	},
	{
		path: '/personal',
		name: 'personal',
		component: () => import('/@/views/system/personal/index.vue'),
		meta: {
			title: 'message.router.personal',
			isLink: '',
			isHide: false,
			isKeepAlive: true,
			isAffix: false,
			isIframe: false,
			icon: 'iconfont icon-gerenzhongxin',
		},
	}
];

/**
 * Define 404 and 401 pages
 * @link Reference: https://next.router.vuejs.org/zh/guide/essentials/history-mode.html#netlify
 */
export const notFoundAndNoPower = [
	{
		path: '/:path(.*)*',
		name: 'notFound',
		component: () => import('/@/views/system/error/404.vue'),
		meta: {
			title: 'message.staticRoutes.notFound',
			isHide: true,
		},
	},
	{
		path: '/401',
		name: 'noPower',
		component: () => import('/@/views/system/error/401.vue'),
		meta: {
			title: 'message.staticRoutes.noPower',
			isHide: true,
		},
	},
];

/**
 * Define static routes (default routes)
 * Do not modify these. To add frontend routes, add them to the `dynamicRoutes array`
 * @description For frontend-controlled routing, edit routes directly in dynamicRoutes. For backend-controlled routing, no changes needed; the first top-level children of dynamicRoutes will be overwritten when API route data is fetched (fullscreen, excluding layout route outlets)
 * @returns Returns route menu data
 */
export const staticRoutes: Array<RouteRecordRaw> = [
	{
		path: '/login',
		name: 'login',
		component: () => import('/@/views/system/login/index.vue'),
		meta: {
			title: 'message.siteTitle',
		},
	},
	{
		path: '/share/activate/:share_token?',
		name: 'shareActivate',
		component: () => import('/@/views/taurus/share/ShareActivatePage.vue'),
		meta: {
			title: t('message.shareLinkAccess'),
			isHide: true,
		},
	},
];