import { defineStore } from 'pinia';

/**
 * Layout configuration
 * Fix: https://gitee.com/lyt-top/vue-next-admin/issues/I567R1, thanks @lanbao123
 * 2020.05.28 by lyt optimized. Config not taking effect during development
 * When modifying config:
 * 1. Need to clear `window.localStorage` browser persistent cache each time
 * 2. Or click the `Restore Default` button at the bottom of layout config to see effect
 */
export const useThemeConfig = defineStore('themeConfig', {
	state: (): ThemeConfigState => ({
		themeConfig: {
			// Whether to open layout config drawer
			isDrawer: false,

			/**
			 * Global theme
			 */
			// Default primary theme color
			primary: '#409eff',
			// Whether to enable dark mode
			isIsDark: false,

			/**
			 * Top bar settings
			 */
			// Default top bar navigation background color
			topBar: '#ffffff',
			// Default top bar navigation font color
			topBarColor: '#606266',
			// Whether to enable top bar background color gradient
			isTopBarColorGradual: false,

			/**
			 * Menu settings
			 */
			// Default menu navigation background color
			menuBar: '#334054',
			// Default menu navigation font color
			menuBarColor: '#eaeaea',
			// Default menu highlight background color
			menuBarActiveColor: 'rgba(0, 0, 0, 0.2)',
			// Whether to enable menu background color gradient
			isMenuBarColorGradual: false,

			/**
			 * Column menu settings
			 */
			// Default column menu background color
			columnsMenuBar: '#334054',
			// Default column menu font color
			columnsMenuBarColor: '#e6e6e6',
			// Whether to enable column menu background color gradient
			isColumnsMenuBarColorGradual: false,
			// Whether to enable column menu hover preload (preview menu)
			isColumnsMenuHoverPreload: false,

			/**
			 * Interface settings
			 */
			// Whether to enable menu horizontal collapse effect
			isCollapse: false,
			// Whether to enable menu accordion effect
			isUniqueOpened: true,
			// Whether to enable fixed Header
			isFixedHeader: false,
			// Init variable, used for updating menu el-scrollbar height, do not delete
			isFixedHeaderChange: false,
			// Whether to enable classic layout split menu (only effective in classic layout)
			isClassicSplitMenu: false,
			// Whether to enable auto lock screen
			isLockScreen: false,
			// Auto lock screen countdown (seconds)
			lockScreenTime: 30,

			/**
			 * Interface display
			 */
			// Whether to enable sidebar Logo
			isShowLogo: true,
			// Init variable, used for el-scrollbar height update, do not delete
			isShowLogoChange: false,
			// Whether to enable Breadcrumb, forces classic and horizontal layouts to hide
			isBreadcrumb: true,
			// Whether to enable Tagsview
			isTagsview: true,
			// Whether to enable Breadcrumb icon
			isBreadcrumbIcon: true,
			// Whether to enable Tagsview icon
			isTagsviewIcon: true,
			// Whether to enable TagsView cache
			isCacheTagsView: true,
			// Whether to enable TagsView drag
			isSortableTagsView: true,
			// Whether to enable TagsView sharing
			isShareTagsView: false,
			// Whether to enable Footer copyright info at bottom
			isFooter: true,
			// Whether to enable grayscale mode
			isGrayscale: false,
			// Whether to enable color-weak mode
			isInvert: false,
			// Whether to enable watermark
			isWartermark: false,
			// Watermark text
			wartermarkText: '',

			/**
			 * Other settings
			 */
			// Tagsview style: options "<tags-style-one|tags-style-four|tags-style-five>", default tags-style-five
			// The defined value matches a class in `/src/layout/navBars/tagsView/tagsView.vue`
			tagsStyle: 'tags-style-five',
			// Main page transition animation: options "<slide-right|slide-left|opacitys>", default slide-right
			animation: 'slide-right',
			// Column highlight style: options "<columns-round|columns-card>", default columns-round
			columnsAsideStyle: 'columns-round',
			// Column layout style: options "<columns-horizontal|columns-vertical>", default columns-horizontal
			columnsAsideLayout: 'columns-vertical',

			/**
			 * Layout switch
			 * Note: for demonstration, when switching layout, colors will be reset to default. Code location: /@/layout/navBars/breadcrumb/setings.vue
			 * method `initSetLayoutChange(Set layout switch, reset theme styles)`
			 */
			// Layout switch: options "<defaults|classic|transverse|columns>", default defaults
			layout: 'defaults',

			/**
			 * Backend-controlled routing
			 */
			// Whether to enable backend-controlled routing
			isRequestRoutes: true,

			/**
			 * Global website title / subtitle
			 */
			// Main website title (menu navigation, browser current page title)
			globalTitle: 'Taurus',
			// Website subtitle (login page top text)
			globalViceTitle: 'Taurus',
			// Website subtitle message (login page tagline)
			globalViceTitleMsg: '一体化运维基座',
			// Default initial language, options "<zh-cn|en|zh-tw>", default zh-cn
			globalI18n: 'zh-cn',
			// Default global component size, options "<large|'default'|small>", default 'large'
			globalComponentSize: 'default',
		},
	}),
	actions: {
		setThemeConfig(data: ThemeConfigState) {
			this.themeConfig = data.themeConfig;
		},
	},
});
