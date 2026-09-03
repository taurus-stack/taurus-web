import { defineStore } from 'pinia';
import { ConfigStates } from './interface';
import { request } from '../utils/service';
export const urlPrefix = '/api/init/settings/';

/**
 * System config data
 * @methods getSystemConfig Get system config data
 */
export const SystemConfigStore = defineStore('SystemConfig', {
	state: (): ConfigStates => ({
		systemConfig: {},
	}),
	actions: {
		async getSystemConfigs() {
			const ret: any = await request({
				url: urlPrefix,
				method: 'get',
			});
			this.systemConfig = JSON.parse(JSON.stringify(ret.data));
		},
		setFromBootstrap(data: any) {
			this.systemConfig = JSON.parse(JSON.stringify(data));
		},
	},
	persist: {
		enabled: true,
	},
});