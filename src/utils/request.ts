import axios, { AxiosInstance } from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Session } from '/@/utils/storage';
import qs from 'qs';
import { i18n } from '/@/i18n';
const t = i18n.global.t;

// Create a new axios instance
const service: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	timeout: 50000,
	headers: { 'Content-Type': 'application/json' },
	paramsSerializer: {
		serialize(params) {
			return qs.stringify(params, { allowDots: true });
		},
	},
});

// Add request interceptor
service.interceptors.request.use(
	(config) => {
		// Do something before request is sent, e.g. attach token
		if (Session.get('token')) {
			const raw = Session.get('token') as string
			// 兼容：dvadmin 历史 token 可能已带 JWT/Bearer 前缀，避免写成 "JWT JWT xxx"
			if (/^(JWT|Bearer)\s+/i.test(raw)) {
				config.headers['Authorization'] = raw
			} else {
				config.headers['Authorization'] = 'JWT ' + raw
			}
		}
		return config;
	},
	(error) => {
		// Do something with request error
		return Promise.reject(error);
	}
);

// Add response interceptor
service.interceptors.response.use(
	(response) => {
		// Do something with response data
		const res = response.data;
		// Compatibility for multiple backend success codes (0 and project-defined 2000)
		if (res.code && res.code !== 0 && res.code !== 2000) {
			// `token` expired or account logged in elsewhere
			if (res.code === 401 || res.code === 4001) {
				Session.clear(); // Clear all browser temporary cache
				ElMessageBox.alert(t('message.loggedOutPleaseLoginAgain'), t('message.prompt'), {
					confirmButtonText: 'OK',
					callback: () => {
						// Redirect after dialog confirmation, to avoid page unload preventing dialog display
						window.location.href = '/'; // Go to login page
					},
				});
			}
			const bizError: any = new Error(res.msg || res.message || t('message.businessError', { code: res.code }));
			bizError.code = res.code;
			return Promise.reject(bizError);
		} else {
			return response.data;
		}
	},
	(error) => {
		// Do something with response error (network errors may not have response, check first)
		if (!error.response) {
			if (error.message && error.message.indexOf('timeout') != -1) {
				ElMessage.error(t('message.networkTimeout'));
			} else if (error.message == 'Network Error') {
				ElMessage.error(t('message.networkConnectionError'));
			} else {
				ElMessage.error(error.message || t('message.networkErrorRetry'));
			}
			return Promise.reject(error);
		}
		if (error.message.indexOf('timeout') != -1) {
			ElMessage.error(t('message.networkTimeout'));
		} else if (error.message == 'Network Error') {
			ElMessage.error(t('message.networkConnectionError'));
		} else {
			if (error.response.data) ElMessage.error(error.response.statusText);
			else ElMessage.error(t('message.apiPathNotFound'));
		}
		return Promise.reject(error);
	}
);

// Export axios instance
export default service;