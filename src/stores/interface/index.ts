/**
 * Define interfaces to define object types
 * All `stores` type definitions are here
 */

// User info
export interface UserInfosState {
	id: number | null;
	avatar: string;
	username: string;
	name: string;
	email: string;
	mobile: string;
	gender: string;
	is_superuser: boolean;
	dept_info: {
		dept_id: number;
		dept_name: string;
	};
	role_info: any[];
}
export interface UserInfosStates {
	userInfos: UserInfosState;
	isSocketOpen: boolean
}

// Route cache list
export interface KeepAliveNamesState {
	keepAliveNames: string[];
	cachedViews: string[];
}

// Raw routes returned from backend (unprocessed)
export interface RequestOldRoutesState {
	requestOldRoutes: string[];
}

// TagsView route list
export interface TagsViewRoutesState {
	tagsViewRoutes: string[];
	isTagsViewCurrenFull: Boolean;
}

// Route list
export interface RoutesListState {
	routesList: string[];
	isColumnsMenuHover: Boolean;
	isColumnsNavHover: Boolean;
}

// Layout configuration
export interface ThemeConfigState {
	isDrawer: boolean;
	primary: string;
	topBar: string;
	topBarColor: string;
	isTopBarColorGradual: boolean;
	menuBar: string;
	menuBarColor: string;
	isMenuBarColorGradual: boolean;
	columnsMenuBar: string;
	columnsMenuBarColor: string;
	isColumnsMenuBarColorGradual: boolean;
	isCollapse: boolean;
	isUniqueOpened: boolean;
	isFixedHeader: boolean;
	isFixedHeaderChange: boolean;
	isClassicSplitMenu: boolean;
	isLockScreen: boolean;
	lockScreenTime: number;
	isShowLogo: boolean;
	isShowLogoChange: boolean;
	isBreadcrumb: boolean;
	isTagsview: boolean;
	isBreadcrumbIcon: boolean;
	isTagsviewIcon: boolean;
	isCacheTagsView: boolean;
	isSortableTagsView: boolean;
	isShareTagsView: boolean;
	isFooter: boolean;
	isGrayscale: boolean;
	isInvert: boolean;
	isIsDark: boolean;
	isWartermark: boolean;
	wartermarkText: string;
	tagsStyle: string;
	animation: string;
	columnsAsideStyle: string;
	columnsAsideLayout: string;
	layout: string;
	isRequestRoutes: boolean;
	globalTitle: string;
	globalViceTitle: string;
	globalI18n: string;
	globalComponentSize: string;
}
export interface ThemeConfigStates {
	themeConfig: ThemeConfigState;
}

export interface DictionaryStates {
	data: any;
}
export interface ConfigStates {
	systemConfig: any;
}

export interface FrontendMenu {
	arrayRouter: Array<any>;
	treeRouter:Array<any>;

	frameOutRoutes:Array<any>;

	frameInRoutes:Array<any>;
}
