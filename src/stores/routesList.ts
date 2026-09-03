import { defineStore } from 'pinia';

/**
 * Routes list
 * @methods setRoutesList Set route data
 * @methods setColumnsMenuHover Set column layout menu hover boolean
 * @methods setColumnsNavHover Set column layout leftmost nav hover boolean
 */
export const useRoutesList = defineStore('routesList', {
	state: (): RoutesListState => ({
		routesList: [],
		isColumnsMenuHover: false,
		isColumnsNavHover: false,
	}),
	actions: {
		async setRoutesList(data: Array<string>) {
			this.routesList = data;
		},
		async setColumnsMenuHover(bool: Boolean) {
			this.isColumnsMenuHover = bool;
		},
		async setColumnsNavHover(bool: Boolean) {
			this.isColumnsNavHover = bool;
		},
		async addRoutesList(data: Array<string>) {
			this.routesList.push(data);
		}
	},
});
