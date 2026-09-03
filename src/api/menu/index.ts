import { request } from "/@/utils/service";

/**
 * Backend-controlled routing; when isRequestRoutes is true, enables backend-controlled routes
 */
export function useMenuApi() {
	return {
		getSystemMenu: (params?: object) => {
			return request({
				url: '/api/system/menu/web_router/',
				method: 'get',
				params,
			});
		},
	};
}
