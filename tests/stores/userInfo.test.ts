import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { Session } from '../../src/utils/storage';
import { useUserInfo } from '../../src/stores/userInfo';

describe('useUserInfo store', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		Session.clear();
	});

	it('initializes_with_default_values', () => {
		const store = useUserInfo();
		expect(store.userInfos.id).toBeNull();
		expect(store.userInfos.username).toBe('');
		expect(store.userInfos.is_superuser).toBe(false);
		expect(store.userInfos.dept_info.dept_id).toBe(0);
		expect(store.isSocketOpen).toBe(false);
	});

	it('sets_userinfo_from_data_object', () => {
		const store = useUserInfo();
		store.setUserInfosFromData({
			id: 123,
			name: 'admin_user',
			avatar: '/img/a.png',
			email: 'a@b.com',
			mobile: '13800138000',
			gender: 'male',
			is_superuser: true,
			dept_info: { dept_id: 5, dept_name: '运维部' },
			role_info: [{ id: 1, name: 'superadmin' }],
		});

		expect(store.userInfos.id).toBe(123);
		expect(store.userInfos.username).toBe('admin_user');
		expect(store.userInfos.name).toBe('admin_user');
		expect(store.userInfos.avatar).toBe('/img/a.png');
		expect(store.userInfos.email).toBe('a@b.com');
		expect(store.userInfos.mobile).toBe('13800138000');
		expect(store.userInfos.gender).toBe('male');
		expect(store.userInfos.is_superuser).toBe(true);
		expect(store.userInfos.dept_info.dept_name).toBe('运维部');
		expect(store.userInfos.role_info[0].name).toBe('superadmin');
	});

	it('persists_userinfo_to_session_after_set_from_data', () => {
		const store = useUserInfo();
		const data = {
			id: 9,
			name: 'alice',
			avatar: '',
			email: '',
			mobile: '',
			gender: '',
			is_superuser: false,
			dept_info: { dept_id: 0, dept_name: '' },
			role_info: [],
		};
		store.setUserInfosFromData(data);

		const cached = Session.get('userInfo');
		expect(cached).toBeDefined();
		expect(cached.id).toBe(9);
		expect(cached.username).toBe('alice');
	});

	it('updates_web_socket_state', async () => {
		const store = useUserInfo();
		await store.setWebSocketState(true);
		expect(store.isSocketOpen).toBe(true);
		await store.setWebSocketState(false);
		expect(store.isSocketOpen).toBe(false);
	});

	it('defaults_id_to_null_when_missing_in_data', () => {
		const store = useUserInfo();
		store.setUserInfosFromData({
			name: 'bob',
			avatar: '',
			email: '',
			mobile: '',
			gender: '',
			is_superuser: false,
			dept_info: { dept_id: 0, dept_name: '' },
			role_info: [],
		});
		expect(store.userInfos.id).toBeNull();
	});
});