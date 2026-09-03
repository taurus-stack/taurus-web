import { RouteRecordRaw } from 'vue-router';
import { storeToRefs } from 'pinia';
import { formatTwoStageRoutes, formatFlatteningRoutes, router } from '/@/router/index';
import { dynamicRoutes, notFoundAndNoPower } from '/@/router/route';
import pinia from '/@/stores/index';
import { Session } from '/@/utils/storage';
import { useUserInfo } from '/@/stores/userInfo';
import { useTagsViewRoutes } from '/@/stores/tagsViewRoutes';
import { useRoutesList } from '/@/stores/routesList';
import { NextLoading } from '/@/utils/loading';

// Frontend controlled routes

/**
 * Frontend controlled routes: initialization method, prevents route loss on refresh
 * @method  NextLoading Start interface loading animation
 * @method useUserInfo(pinia).setUserInfos() Trigger init user info pinia
 * @method setAddRoute Add dynamic routes
 * @method setFilterMenuAndCacheTagsViewRoutes Set recursive filter of authorized routes into pinia routesList (processed into multi-level nested routes)
 *         and cache the flattened one-dimensional array processed from multi-level nesting
 */
export async function initFrontEndControlRoutes() {
	// Start interface loading animation
	if (window.nextLoading === undefined) NextLoading.start();
	// No token, stop further execution
	if (!Session.get('token')) return false;
	// Trigger init user info pinia
	// https://gitee.com/lyt-top/vue-next-admin/issues/I5F1HP
	await useUserInfo(pinia).setUserInfos();
	// No login role, add check
	// https://gitee.com/lyt-top/vue-next-admin/issues/I64HVO
	if (useUserInfo().userInfos.roles.length <= 0) return Promise.resolve(true);
	// Add dynamic routes
	await setAddRoute();
	// Set recursive filter of authorized routes into pinia routesList (processed into multi-level nested routes) and cache
	await setFilterMenuAndCacheTagsViewRoutes();
}

/**
 * Add dynamic routes
 * @method router.addRoute
 * @description This loop is for the one-dimensional route array of the first top-level children of dynamicRoutes (/@/router/route), not multi-level nesting
 * @link Reference: https://next.router.vuejs.org/zh/api/#addroute
 */
export async function setAddRoute() {
	await setFilterRouteEnd().forEach((route: RouteRecordRaw) => {
		router.addRoute(route);
	});
}

/**
 * Delete/reset routes
 * @method router.removeRoute
 * @description This loop is for the one-dimensional route array of the first top-level children of dynamicRoutes (/@/router/route), not multi-level nesting
 * @link Reference: https://next.router.vuejs.org/zh/api/#push
 */
export async function frontEndsResetRoute() {
	await setFilterRouteEnd().forEach((route: RouteRecordRaw) => {
		const routeName: any = route.name;
		router.hasRoute(routeName) && router.removeRoute(routeName);
	});
}

/**
 * Get route array with current user permission identifiers, replace original routes
 * @description Replace the first top-level children routes of dynamicRoutes (/@/router/route)
 * @returns Returns the replaced route array
 */
export function setFilterRouteEnd() {
	let filterRouteEnd: any = formatTwoStageRoutes(formatFlatteningRoutes(dynamicRoutes));
	// notFoundAndNoPower prevents 404, 401 from not being in the layout. If not set, 404 and 401 pages will display full-screen
	// Related issue No match found for location with path 'xxx'
	filterRouteEnd[0].children = [...setFilterRoute(filterRouteEnd[0].children), ...notFoundAndNoPower];
	return filterRouteEnd;
}

/**
 * Use current user permission identifiers to compare against route table (not yet processed into multi-level nested routes)
 * @description Mainly used for dynamic route addition here, router.addRoute
 * @link Reference: https://next.router.vuejs.org/zh/api/#addroute
 * @param chil The child route collection under the first top-level children of dynamicRoutes (/@/router/route)
 * @returns Returns route array with current user permission identifiers
 */
export function setFilterRoute(chil: any) {
	const stores = useUserInfo(pinia);
	const { userInfos } = storeToRefs(stores);
	let filterRoute: any = [];
	chil.forEach((route: any) => {
		if (route.meta.roles) {
			route.meta.roles.forEach((metaRoles: any) => {
				userInfos.value.roles.forEach((roles: any) => {
					if (metaRoles === roles) filterRoute.push({ ...route });
				});
			});
		}
	});
	return filterRoute;
}

/**
 * Cache the flattened one-dimensional array processed from multi-level nesting
 * @description Used in tagsView and menu search: isHide (hidden) items not filtered
 */
export function setCacheTagsViewRoutes() {
	// Get authorized routes, otherwise unauthorized routes will also show in tagsView and menu search
	const stores = useUserInfo(pinia);
	const storesTagsView = useTagsViewRoutes(pinia);
	const { userInfos } = storeToRefs(stores);
	let rolesRoutes = setFilterHasRolesMenu(dynamicRoutes, userInfos.value.roles);
	// Add to pinia setTagsViewRoutes
	storesTagsView.setTagsViewRoutes(formatTwoStageRoutes(formatFlatteningRoutes(rolesRoutes))[0].children);
}

/**
 * Set recursive filter of authorized routes into pinia routesList (processed into multi-level nested routes) and cache the flattened one-dimensional array
 * @description Used for left sidebar menu and horizontal menu display
 * @description Used in tagsView and menu search: isHide (hidden) items not filtered
 */
export function setFilterMenuAndCacheTagsViewRoutes() {
	const stores = useUserInfo(pinia);
	const storesRoutesList = useRoutesList(pinia);
	const { userInfos } = storeToRefs(stores);
	storesRoutesList.setRoutesList(setFilterHasRolesMenu(dynamicRoutes[0].children, userInfos.value.roles));
	setCacheTagsViewRoutes();
}

/**
 * Check if route `meta.roles` contains current login user permission field
 * @param roles User permission identifier, in userInfos (user info) roles array (cached to browser on login page login)
 * @param route The current loop route item
 * @returns Returns the route item that has permission after comparison
 */
export function hasRoles(roles: any, route: any) {
	if (route.meta && route.meta.roles) return roles.some((role: any) => route.meta.roles.includes(role));
	else return true;
}

/**
 * Use current user permission identifiers to compare against route table, set recursive filter of authorized routes
 * @param routes Current route children
 * @param roles User permission identifier, in userInfos (user info) roles array (cached to browser on login page login)
 * @returns Returns authorized route array, controlled by `meta.roles`
 */
export function setFilterHasRolesMenu(routes: any, roles: any) {
	const menu: any = [];
	routes.forEach((route: any) => {
		const item = { ...route };
		if (hasRoles(roles, item)) {
			if (item.children) item.children = setFilterHasRolesMenu(item.children, roles);
			menu.push(item);
		}
	});
	return menu;
}
