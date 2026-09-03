import { nextTick, defineAsyncComponent } from 'vue';
import type { App } from 'vue';
import * as svg from '@element-plus/icons-vue';
import router from '/@/router/index';
import pinia from '/@/stores/index';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
import { i18n } from '/@/i18n/index';
import { Local } from '/@/utils/storage';
import { verifyUrl } from '/@/utils/toolsValidate';

// Import component
const SvgIcon = defineAsyncComponent(() => import('/@/components/svgIcon/index.vue'));

/**
 * Export globally registered element plus svg icons
 * @param app vue instance
 * @description Usage: https://element-plus.gitee.io/zh-CN/component/icon.html
 */
export function elSvg(app: App) {
	const icons = svg as any;
	for (const i in icons) {
		app.component(`ele-${icons[i].name}`, icons[i]);
	}
	app.component('SvgIcon', SvgIcon);
}

/**
 * Set browser title i18n
 * @method const title = useTitle(); ==> title()
 */
export function useTitle() {
	const storesThemeConfig = useThemeConfig();
	const { themeConfig } = storeToRefs(storesThemeConfig);
	nextTick(() => {
		const { meta } = router.currentRoute.value;
		// 统一走 i18n 翻译：meta.title 存的是 key 字符串，不是翻译后的值
		const webTitle = meta.title ? i18n.global.t(<string>meta.title) : themeConfig.value.globalTitle;
		document.title = webTitle;
	});
}

/***
 * Set website favicon
 * 已不再从后端读取，index.html 中的 /favicon.ico 即为默认图标
 */
export function useFavicon() {
	// 保留空函数壳，避免 App.vue 调用处报错
}

/**
 * Set custom tagsView name and its i18n
 * @param params tagsViewName from route query/params
 * @returns current tagsViewName
 */
export function setTagsViewNameI18n(item: any) {
	let tagsViewName: string = '';
	const { query, params, meta } = item;
	if (query?.tagsViewName || params?.tagsViewName) {
		if (/\/zh-cn|en|zh-tw\//.test(query?.tagsViewName) || /\/zh-cn|en|zh-tw\//.test(params?.tagsViewName)) {
			// i18n
			const urlTagsParams = (query?.tagsViewName && JSON.parse(query?.tagsViewName)) || (params?.tagsViewName && JSON.parse(params?.tagsViewName));
			tagsViewName = urlTagsParams[i18n.global.locale.value];
		} else {
			// Not i18n
			tagsViewName = query?.tagsViewName || params?.tagsViewName;
		}
	} else {
		// Not a custom tagsView name
		tagsViewName = i18n.global.t(meta.title);
	}
	return tagsViewName;
}

/**
 * Image lazy loading
 * @param el DOM target element
 * @param arr List data
 * @description data-xxx attribute stores private custom data for page or application
 */
export const lazyImg = (el: string, arr: EmptyArrayType) => {
	const io = new IntersectionObserver((res) => {
		res.forEach((v: any) => {
			if (v.isIntersecting) {
				const { img, key } = v.target.dataset;
				v.target.src = img;
				v.target.onload = () => {
					io.unobserve(v.target);
					arr[key]['loading'] = false;
				};
			}
		});
	});
	nextTick(() => {
		document.querySelectorAll(el).forEach((img) => io.observe(img));
	});
};

/**
 * Global component size
 * @returns Cached value `globalComponentSize` read from `window.localStorage`
 */
export const globalComponentSize = (): string => {
	const stores = useThemeConfig(pinia);
	const { themeConfig } = storeToRefs(stores);
	return Local.get('themeConfig')?.globalComponentSize || themeConfig.value?.globalComponentSize;
};

/**
 * Deep clone object
 * @param obj Source object
 * @returns Cloned object
 */
export function deepClone(obj: EmptyObjectType) {
	let newObj: EmptyObjectType;
	try {
		newObj = obj.push ? [] : {};
	} catch (error) {
		newObj = {};
	}
	for (let attr in obj) {
		if (obj[attr] && typeof obj[attr] === 'object') {
			newObj[attr] = deepClone(obj[attr]);
		} else {
			newObj[attr] = obj[attr];
		}
	}
	return newObj;
}

/**
 * Check if mobile device
 */
export function isMobile() {
	if (
		navigator.userAgent.match(
			/('phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone')/i
		)
	) {
		return true;
	} else {
		return false;
	}
}

/**
 * Check if all properties in array objects are empty, delete current row object if so
 * @description Thanks Dahuang
 * @param list Array objects
 * @returns Array objects after removing empty values
 */
export function handleEmpty(list: EmptyArrayType) {
	const arr = [];
	for (const i in list) {
		const d = [];
		for (const j in list[i]) {
			d.push(list[i][j]);
		}
		const leng = d.filter((item) => item === '').length;
		if (leng !== d.length) {
			arr.push(list[i]);
		}
	}
	return arr;
}

/**
 * Open external link
 * @param val Current clicked menu item
 */
export function handleOpenLink(val: RouteItem) {
	const { origin, pathname } = window.location;
	router.push(val.path);
	if (verifyUrl(<string>val.meta?.isLink)) window.open(val.meta?.isLink);
	else window.open(`${origin}${pathname}#${val.meta?.isLink}`);
}

/**
 * Unified batch export
 * @method elSvg Export globally registered element plus svg icons
 * @method useTitle Set browser title i18n
 * @method setTagsViewNameI18n Set custom tagsView name and its i18n
 * @method lazyImg Image lazy loading
 * @method globalComponentSize() element plus global component size
 * @method deepClone Deep clone object
 * @method isMobile Check if mobile device
 * @method handleEmpty Check if all properties in array objects are empty
 * @method handleOpenLink Open external link
 */
const other = {
	elSvg: (app: App) => {
		elSvg(app);
	},
	useTitle: () => {
		useTitle();
	},
	useFavicon:()=>{
		useFavicon()
	},
	setTagsViewNameI18n(route: RouteToFrom) {
		return setTagsViewNameI18n(route);
	},
	lazyImg: (el: string, arr: EmptyArrayType) => {
		lazyImg(el, arr);
	},
	globalComponentSize: () => {
		return globalComponentSize();
	},
	deepClone: (obj: EmptyObjectType) => {
		return deepClone(obj);
	},
	isMobile: () => {
		return isMobile();
	},
	handleEmpty: (list: EmptyArrayType) => {
		return handleEmpty(list);
	},
	handleOpenLink: (val: RouteItem) => {
		handleOpenLink(val);
	},
};

// Unified batch export
export default other;
