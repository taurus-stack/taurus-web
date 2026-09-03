import { defineStore } from 'pinia';

/**
 * Route cache list
 * @methods setCacheKeepAlive Set route names to cache (Tagsview enabled)
 * @methods addCachedView Add route name to cache (Tagsview disabled)
 * @methods delCachedView Remove route name from cache (Tagsview disabled)
 * @methods delOthersCachedViews Right-click menu 'Close Others', remove cached route names (Tagsview disabled)
 * @methods delAllCachedViews Right-click menu 'Close All', remove cached route names (Tagsview disabled)
 */
export const useKeepALiveNames = defineStore('keepALiveNames', {
	state: (): KeepAliveNamesState => ({
		keepAliveNames: [],
		cachedViews: [],
	}),
	actions: {
		async setCacheKeepAlive(data: Array<string>) {
			this.keepAliveNames = data;
		},
		async addCachedView(view: any) {
			if (view.meta.isKeepAlive) this.cachedViews?.push(view.name);
		},
		async delCachedView(view: any) {
			const index = this.cachedViews.indexOf(view.name);
			index > -1 && this.cachedViews.splice(index, 1);
		},
		async delOthersCachedViews(view: any) {
			if (view.meta.isKeepAlive) this.cachedViews = [view.name];
			else this.cachedViews = [];
		},
		async delAllCachedViews() {
			this.cachedViews = [];
		},
	},
});
