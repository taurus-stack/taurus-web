import { defineAsyncComponent, AsyncComponentLoader } from 'vue';
export let pluginsAll: any = [];
// Scan plugin directory and register plugins
export const scanAndInstallPlugins = (app: any) => {
	const components = import.meta.glob('./**/*.vue');
	const pluginNames = new Set();
	// Traverse object and register async components
	for (const [key, value] of Object.entries(components)) {
		const name = key.slice(key.lastIndexOf('/') + 1, key.lastIndexOf('.'));
		app.component(name, defineAsyncComponent(value as AsyncComponentLoader));
		const pluginsName = key.match(/\/([^\/]*)\//)?.[1];
		pluginNames.add(pluginsName);
	}
	pluginsAll = Array.from(pluginNames);
	console.log('已发现插件：', pluginsAll);
};
