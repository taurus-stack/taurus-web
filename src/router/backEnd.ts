import { RouteRecordRaw } from 'vue-router';
import pinia from '/@/stores/index';
import { useUserInfo } from '/@/stores/userInfo';
import { Session } from '/@/utils/storage';
import { NextLoading } from '/@/utils/loading';
import { dynamicRoutes, notFoundAndNoPower } from '/@/router/route';
import { formatTwoStageRoutes, formatFlatteningRoutes, router } from '/@/router/index';
import { useRoutesList } from '/@/stores/routesList';
import { useTagsViewRoutes } from '/@/stores/tagsViewRoutes';
import { handleMenu } from '../utils/menu';
import { BtnPermissionStore } from '/@/plugin/permission/store.permission';
import {SystemConfigStore} from "/@/stores/systemConfig";
import {useDeptInfoStore} from "/@/stores/modules/dept";
import {DictionaryStore} from "/@/stores/dictionary";
import {useFrontendMenuStore} from "/@/stores/frontendMenu";
import {toRaw} from "vue";
import { dynamicImport } from '/@/router/dynamicViews';
import { useBootstrapApi } from '/@/api/init/index';
// M1.7 — Edition Gate：菜单加载前先拉 edition，保证 feature 过滤时 store 已就绪
import { useEditionStore } from '/@/editions/index';

/**
 * Backend-controlled routing: initialization, prevents route loss on refresh
 * @method NextLoading Start the loading animation
 * @method useUserInfo().setUserInfos() Trigger user info pinia initialization
 * @method useRequestOldRoutes().setRequestOldRoutes() Store raw routes from API (component not processed)
 * @method setAddRoute Add dynamic routes
 * @method setFilterMenuAndCacheTagsViewRoutes Set routes to routesList (multi-level nested) and cache flattened one-dimensional array
 */
export async function initBackEndControlRoutes() {
	if (window.nextLoading === undefined) NextLoading.start();
	if (!Session.get('token')) return false;
	// M1.7 — Edition Gate: 预先拉取 edition/info（登录前 bootstrap 不依赖 token，先加载避免菜单判断时 features 为空）
	try {
		await useEditionStore().ensureLoaded(false);
	} catch (e) { /* 兜底内部已处理 */ }
	const bootstrapApi = useBootstrapApi();
	const ret: any = await bootstrapApi.getBootstrap();
	const { user_info, menu, btn_permission, system_config, dept, dictionary } = ret.data;
	useUserInfo().setUserInfosFromData(user_info);
	BtnPermissionStore().setFromBootstrap(btn_permission);
	SystemConfigStore().setFromBootstrap(system_config);
	useDeptInfoStore().setFromBootstrap(dept);
	DictionaryStore().setFromBootstrap(dictionary);
	const {frameIn,frameOut} = handleMenu(menu)
	// M1.7 — Edition Gate: 根据 menu.requiresFeature / feature_code 过滤
	const {frameIn: frameInFiltered, frameOut: frameOutFiltered} = filterMenuByEdition({frameIn, frameOut});
	dynamicRoutes[0].children = await backEndComponent(frameInFiltered);
	await setAddRoute(frameOutFiltered);
	await setFilterMenuAndCacheTagsViewRoutes();
}

export async function setRouters(){
	const {frameInRoutes,frameOutRoutes} = await useFrontendMenuStore().getRouter()
	const frameInRouter = toRaw(frameInRoutes)
	const frameOutRouter = toRaw(frameOutRoutes)
	dynamicRoutes[0].children = frameInRouter
	dynamicRoutes.forEach((item:any)=>{
		router.addRoute(item)
	})
	frameOutRouter.forEach((item:any)=>{
		router.addRoute(item)
	})
	const storesRoutesList = useRoutesList(pinia);
	storesRoutesList.setRoutesList([...dynamicRoutes[0].children,...frameOutRouter]);
	const storesTagsView = useTagsViewRoutes(pinia);
	storesTagsView.setTagsViewRoutes([...dynamicRoutes[0].children,...frameOutRouter])

}

/**
 * Set routes to routesList (processed into multi-level nested routes) and cache the flattened one-dimensional array
 * @description Used for left-side menu and horizontal menu display
 * @description Used in tagsView, menu search: unfiltered hidden routes (isHide)
 */
export function setFilterMenuAndCacheTagsViewRoutes() {
	const storesRoutesList = useRoutesList(pinia);
	storesRoutesList.setRoutesList(dynamicRoutes[0].children as any);
	setCacheTagsViewRoutes();
}

/**
 * Cache the flattened one-dimensional array of a multi-level nested array
 * @description Used in tagsView, menu search: unfiltered hidden routes (isHide)
 */
export function setCacheTagsViewRoutes() {
	const storesTagsView = useTagsViewRoutes(pinia);
	storesTagsView.setTagsViewRoutes(formatTwoStageRoutes(formatFlatteningRoutes(dynamicRoutes))[0].children);
}

/**
 * Process route format and add catch-all or 404 Not found route
 * @description Replace the first top-level children route of dynamicRoutes (/@/router/route)
 * @returns Returns the replaced route array
 */
export function setFilterRouteEnd() {
	let filterRouteEnd: any = formatTwoStageRoutes(formatFlatteningRoutes(dynamicRoutes));
	// notFoundAndNoPower prevents 404 and 401 from being placed inside a layout; without it, the 404/401 pages would display fullscreen
	// Related issue: No match found for location with path 'xxx'
	filterRouteEnd[0].children = [...filterRouteEnd[0].children, ...notFoundAndNoPower];
	return filterRouteEnd;
}

/**
 * Add dynamic routes
 * @method router.addRoute
 * @description This loop operates on the flattened one-dimensional children of the first top-level dynamicRoutes entry (not multi-level nested)
 * @link Reference: https://next.router.vuejs.org/zh/api/#addroute
 */
// M1.7 — Edition Gate 允许传入 frameOut（调用方已预过滤），不传则走原逻辑
export async function setAddRoute(frameOutOverride?: any[]) {
	const routes = setFilterRouteEnd();
	await routes.forEach((route: RouteRecordRaw) => {
		router.addRoute(route);
	});
	// frameOut 路由（外链、iframe 等）单独处理
	let frameOut = frameOutOverride;
	if (!frameOut) {
		frameOut = (dynamicRoutes[0].children as any[]).filter((c) => c.meta?.isLink || c.meta?.isFrame);
	}
	frameOut.forEach((item: any) => {
		router.addRoute(item);
	});
}

// ================================================================
// M1.7 — Edition Gate: 后端菜单树 **不再剔除** EE 菜单，改为标记保留
//   · 菜单对象上若有 meta.requiresFeature / requiresFeature 等任一属性
//     且 Edition 不具备 → 打 meta._eeGate=true、meta._eeCodes=[...] 标记
//   · 子节点递归处理（无论父节点是否 gate），保证侧边栏/顶栏统一渲染
//     由渲染层（vertical.vue / horizontal.vue / subItem.vue）根据标记：
//       置灰 + EE 标签 + 点击拦截升级弹窗
//   · 仍保留：meta.isHide 的隐藏逻辑（非 Edition Gate）与此模块无关
// ================================================================
function _extractFeatureCode(item: any): string | string[] | undefined {
	const v =
		item?.meta?.requiresFeature ??
		item?.meta?.requires_feature ??
		item?.meta?.feature_code ??
		item?.requiresFeature ??
		item?.requires_feature ??
		item?.feature_code ??
		item?.featureCode;
	if (!v) return undefined;
	if (Array.isArray(v)) return v.filter(Boolean);
	if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
	return undefined;
}

function _hasRequiredFeature(code: string | string[] | undefined, editionStore: ReturnType<typeof useEditionStore>): boolean {
	if (!code) return true;
	const codes = Array.isArray(code) ? code : [code];
	if (!codes.length) return true;
	return codes.some((c) => editionStore.hasFeature(c));
}

function _markTree(nodes: any[], editionStore: ReturnType<typeof useEditionStore>): any[] {
	if (!nodes) return [];
	const result: any[] = [];
	for (const raw of nodes) {
		const node = { ...raw };
		// 确保 meta 是独立对象，避免 mutation 影响其他引用
		const baseMeta = node.meta || {};
		node.meta = { ...baseMeta };
		const code = _extractFeatureCode(node);
		const hasFeat = _hasRequiredFeature(code, editionStore);
		if (!hasFeat && code) {
			const codes = Array.isArray(code) ? code : [code];
			node.meta._eeGate = true;
			node.meta._eeCodes = codes.filter(Boolean);
			// 强制禁用菜单项（路由级仍可通过 url 访问的场景，会被页面级 v-if 再次 gate）
			node.meta.disabled = true;
		}
		// 子树递归标记（不影响父节点是否保留——所有节点都保留，只标记）
		if (node.children && node.children.length) {
			node.children = _markTree(node.children, editionStore);
		}
		result.push(node);
	}
	return result;
}

export function filterMenuByEdition(params: { frameIn: any[]; frameOut: any[] }): { frameIn: any[]; frameOut: any[] } {
	const store = useEditionStore();
	return {
		frameIn: _markTree(params.frameIn || [], store),
		frameOut: _markTree(params.frameOut || [], store),
	};
}

/**
 * Request the backend route menu API (via bootstrap combined endpoint)
 * @description When isRequestRoutes is true, backend-controlled routing is enabled
 * @returns Returns backend route menu data
 */
export async function getBackEndControlRoutes() {
	const bootstrapApi = useBootstrapApi();
	const ret: any = await bootstrapApi.getBootstrap();
	const { menu, btn_permission, system_config, dept, dictionary } = ret.data;
	BtnPermissionStore().setFromBootstrap(btn_permission);
	SystemConfigStore().setFromBootstrap(system_config);
	useDeptInfoStore().setFromBootstrap(dept);
	DictionaryStore().setFromBootstrap(dictionary);
	return { data: menu };
}

/**
 * Re-request the backend route menu API
 * @description Used to refresh menu in menu management page (not tested)
 * @description Path: /src/views/system/menu/component/addMenu.vue
 */
export function setBackEndControlRefreshRoutes() {
	getBackEndControlRoutes();
}

/**
 * Backend route component conversion
 * @param routes Route table array returned by backend
 * @returns Returns component converted to a function
 */
export function backEndComponent(routes: any) {
	if (!routes) return;
	return routes.map((item: any) => {
		if (item.component) item.component = dynamicImport(item.component as string);
		if(item.is_catalog){
			item.component = dynamicImport('layout/routerView/parent')
		}
		if(item.is_link){
			if(item.is_iframe){
				item.component = dynamicImport('layout/routerView/iframes')
			}else {
				item.component = dynamicImport('layout/routerView/link')
			}
		}else{
			if(item.is_iframe){
				item.meta.isLink = item.link_url
				item.component = dynamicImport('layout/routerView/link.vue')
			}
		}
		item.children && backEndComponent(item.children);
		return item;
	});
}