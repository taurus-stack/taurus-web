import { request } from '/@/utils/service';

export function useBootstrapApi() {
	return {
		getBootstrap: () => {
			return request({
				url: '/api/init/bootstrap/',
				method: 'get',
			});
		},
	};
}
