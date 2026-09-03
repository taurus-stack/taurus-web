/**
 * Mitt event type definitions
 *
 * @method openSetingsDrawer Open layout settings drawer
 * @method restoreDefault Column layout, mouse enter/leave data display
 * @method setSendColumnsChildren Column layout, mouse enter/leave passes menu data to navMenu children
 * @method setSendClassicChildren Classic layout, when menu splitting enabled, pass menu data to navMenu children
 * @method getBreadcrumbIndexSetFilterRoutes Layout settings drawer, when menu splitting enabled, pass menu data to navMenu children
 * @method layoutMobileResize Browser window resize, for mobile UI adaptation
 * @method openOrCloseSortable Layout settings drawer, enable TagsView drag
 * @method openShareTagsView Layout settings drawer, enable TagsView sharing
 * @method onTagsViewRefreshRouterView tagsview refresh
 * @method onCurrentContextmenuClick tagsview right-click menu item click
 */
declare type MittType<T = any> = {
	openSetingsDrawer?: string;
	restoreDefault?: string;
	setSendColumnsChildren: T;
	setSendClassicChildren: T;
	getBreadcrumbIndexSetFilterRoutes?: string;
	layoutMobileResize: T;
	openOrCloseSortable?: string;
	openShareTagsView?: string;
	onTagsViewRefreshRouterView?: T;
	onCurrentContextmenuClick?: T;
};

// Mitt parameter type definitions
declare type LayoutMobileResize = {
	layout: string;
	clientWidth: number;
};

// Mitt menu parameter type
declare type MittMenu = {
	children: RouteRecordRaw[];
	item?: RouteItem;
};
