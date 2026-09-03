import { createI18n } from 'vue-i18n';
import pinia from '/@/stores/index';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';

// 定义语言国际化内容

/**
 * 说明：
 * 须在 pages 下新建文件夹（建议 `要国际化界面目录` 与 `i18n 目录` 相同，方便查找），
 * 注意国际化定义的字段，不要与原有的定义字段相同。
 * 1、/src/i18n/lang 下的 ts 为框架的国际化内容
 * 2、/src/i18n/pages 下的 ts 为各界面的国际化内容
 */

// element plus 自带国际化
import enLocale from 'element-plus/es/locale/lang/en';
import zhcnLocale from 'element-plus/es/locale/lang/zh-cn';
import zhtwLocale from 'element-plus/es/locale/lang/zh-tw';

// 定义变量内容
const messages: Record<string, any> = {};
const element = { en: enLocale, 'zh-cn': zhcnLocale, 'zh-tw': zhtwLocale };
const itemize: Record<string, any[]> = { en: [], 'zh-cn': [], 'zh-tw': [] };
const modules: Record<string, any> = import.meta.glob('./**/*.ts', { eager: true });

// 对自动引入的 modules 进行分类 en、zh-cn、zh-tw
// https://vitejs.cn/vite3-cn/guide/features.html#glob-import
for (const path in modules) {
	if (path.includes('/index.ts')) continue;
	const key = path.match(/(\S+)\/(\S+)\.ts/);
	if (!key || !key[2]) continue;
	const lang = key[2];
	if (!element[lang as keyof typeof element]) continue;
	const mod = modules[path].default;
	// 页面翻译文件导出 { message: {...} }，而下方 messages[lang].message 会再包一层，
	// 需解包以避免双重 message 导致 t('message.pages.xxx') 路径无法匹配
	const unwrapped = mod && typeof mod === 'object' && 'message' in mod ? mod.message : mod;
	if (itemize[lang]) itemize[lang].push(unwrapped);
	else itemize[lang] = unwrapped;
}

// 深度合并对象（页面翻译文件均为 { message: { pages: { xxx } } } 结构，浅合并会导致顶层 message 键互相覆盖）
function deepMerge(target: any, source: any): any {
	for (const key in source) {
		if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
			deepMerge(target[key], source[key]);
		} else {
			target[key] = source[key];
		}
	}
	return target;
}

// 合并数组对象（非标准数组对象，数组中对象的每项 key、value 都不同）
function mergeArrObj(list: any, key: string) {
	let obj = {};
	if (Array.isArray(list[key])) {
		list[key].forEach((i: EmptyObjectType) => {
			obj = deepMerge(obj, i);
		});
	}
	return obj;
}

// 处理最终格式
for (const key in itemize) {
	if (!element[key as keyof typeof element]) continue;
	const merged = mergeArrObj(itemize, key);
	messages[key] = {
		name: key,
		el: element[key as keyof typeof element].el,
		message: merged, // 保留原有 message 路径，兼容 t('message.pages.xxx') 调用
		...merged,       // 展开到根层，兼容 t('xxx') 调用
	};
}

// 读取 pinia 默认语言
const stores = useThemeConfig(pinia);
const { themeConfig } = storeToRefs(stores);

// 导出语言国际化
// https://vue-i18n.intlify.dev/guide/essentials/fallback.html#explicit-fallback-with-one-locale
export const i18n = createI18n({
	legacy: false,
	silentTranslationWarn: true,
	missingWarn: false,
	silentFallbackWarn: true,
	fallbackWarn: false,
	locale: themeConfig.value.globalI18n,
	fallbackLocale: zhcnLocale.name,
	messages,
});