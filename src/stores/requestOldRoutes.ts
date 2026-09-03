import { defineStore } from 'pinia';

/**
 * Raw routes returned by backend (before processing)
 * @methods setCacheKeepAlive Set raw route data from API
 */
export const useRequestOldRoutes = defineStore('requestOldRoutes', {
	state: (): RequestOldRoutesState => ({
		requestOldRoutes: [],
	}),
	actions: {
		async setRequestOldRoutes(routes: Array<string>) {
			this.requestOldRoutes = routes;
		},
	},
});
