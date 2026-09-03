import { defineStore } from 'pinia';
import { UserInfosStates } from './interface';
import { Session } from '/@/utils/storage';
import { request } from '../utils/service';
/**
 * User info
 * @methods setUserInfos Set user info
 */
export const useUserInfo = defineStore('userInfo', {
	state: (): UserInfosStates => ({
		userInfos: {
			id: null,
			avatar: '',
			username: '',
			name: '',
			email: '',
			mobile: '',
			gender: '',
			is_superuser: false,
			dept_info: {
				dept_id: 0,
				dept_name: '',
			},
			role_info: [
				{
					id: 0,
					name: '',
				},
			],
		},
		isSocketOpen: false
	}),
	actions: {
		async updateUserInfos() {
			let userInfos: any = await this.getApiUserInfo();
			this.userInfos.id = userInfos.data.id ?? null;
			this.userInfos.username = userInfos.data.name;
			this.userInfos.avatar = userInfos.data.avatar;
			this.userInfos.name = userInfos.data.name;
			this.userInfos.email = userInfos.data.email;
			this.userInfos.mobile = userInfos.data.mobile;
			this.userInfos.gender = userInfos.data.gender;
			this.userInfos.is_superuser = userInfos.data.is_superuser;
			this.userInfos.dept_info = userInfos.data.dept_info;
			this.userInfos.role_info = userInfos.data.role_info;
			Session.set('userInfo', this.userInfos);
		},
		async setUserInfos() {
			// Store user info to browser cache
			if (Session.get('userInfo')) {
				this.userInfos = Session.get('userInfo');
			} else {
				let userInfos: any = await this.getApiUserInfo();
				this.userInfos.id = userInfos.data.id ?? null;
				this.userInfos.username = userInfos.data.name;
				this.userInfos.avatar = userInfos.data.avatar;
				this.userInfos.name = userInfos.data.name;
				this.userInfos.email = userInfos.data.email;
				this.userInfos.mobile = userInfos.data.mobile;
				this.userInfos.gender = userInfos.data.gender;
				this.userInfos.is_superuser = userInfos.data.is_superuser;
				this.userInfos.dept_info = userInfos.data.dept_info;
				this.userInfos.role_info = userInfos.data.role_info;
				Session.set('userInfo', this.userInfos);
			}
		},
		setUserInfosFromData(data: any) {
			this.userInfos.id = data.id ?? null;
			this.userInfos.username = data.name;
			this.userInfos.avatar = data.avatar;
			this.userInfos.name = data.name;
			this.userInfos.email = data.email;
			this.userInfos.mobile = data.mobile;
			this.userInfos.gender = data.gender;
			this.userInfos.is_superuser = data.is_superuser;
			this.userInfos.dept_info = data.dept_info;
			this.userInfos.role_info = data.role_info;
			Session.set('userInfo', this.userInfos);
		},
		async setWebSocketState(socketState: boolean) {
			this.isSocketOpen = socketState;
		},
		async getApiUserInfo() {
			return request({
				url: '/api/system/user/user_info/',
				method: 'get',
			});
		},
	},
});