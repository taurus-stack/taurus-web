import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { handleMenu } from '../../src/utils/menu';
import { auth, auths, authAll } from '../../src/utils/authFunction';
import { BtnPermissionStore } from '../../src/stores/btnPermission';
import { useUserInfo } from '../../src/stores/userInfo';

vi.mock('../../src/router/route', () => ({
	dynamicRoutes: [],
	staticRoutes: [],
}));

describe('handleMenu', () => {
	it('converts_flat_list_to_tree_with_home_prefix', () => {
		const flat = [
			{ id: 1, parent: null, title: '系统管理', component_name: 'system', web_path: '/system', visible: true, cache: true, is_affix: false, is_iframe: false, link_url: '', icon: 'icon-sys' },
			{ id: 2, parent: 1, title: '用户管理', component_name: 'system-user', web_path: '/system/user', visible: true, cache: false, is_affix: false, is_iframe: false, link_url: '', icon: 'icon-user' },
		];
		const { frameIn, frameOut } = handleMenu(flat);
		expect(Array.isArray(frameIn)).toBe(true);
		expect(frameIn.length).toBeGreaterThanOrEqual(2);
		expect(frameIn[0].name).toBe('home');
		expect(frameIn[0].path).toBe('/home');
		const system = frameIn[1];
		expect(system.name).toBe('system');
		expect(system.meta.title).toBe('系统管理');
		expect(system.meta.isHide).toBe(false);
		expect(system.meta.isKeepAlive).toBe(true);
		expect(system.meta.icon).toBe('icon-sys');
		expect(system.children.length).toBe(1);
		expect(system.children[0].name).toBe('system-user');
		expect(system.children[0].meta.title).toBe('用户管理');
		expect(frameOut).toEqual([]);
	});

	it('marks_hidden_menu_when_visible_false', () => {
		const flat = [
			{ id: 1, parent: null, title: 'A', component_name: 'A', web_path: '/a', visible: false, cache: false, is_affix: false, is_iframe: false, link_url: '', icon: '' },
		];
		const { frameIn } = handleMenu(flat);
		expect(frameIn[1].meta.isHide).toBe(true);
	});
});

function setupPermissionState(userIsSuper = false, perms: string[] = []) {
	setActivePinia(createPinia());
	const user = useUserInfo();
	user.userInfos.is_superuser = userIsSuper;
	const bp = BtnPermissionStore();
	bp.data = [...perms];
}

describe('auth (single permission utils)', () => {
	beforeEach(() => setupPermissionState(false, []));

	it('returns_true_for_superadmin_without_perm_list', () => {
		setupPermissionState(true, []);
		expect(auth('any.perm')).toBe(true);
	});

	it('returns_true_when_user_has_exact_perm', () => {
		setupPermissionState(false, ['create', 'edit']);
		expect(auth('create')).toBe(true);
	});

	it('returns_false_when_user_lacks_perm', () => {
		setupPermissionState(false, ['list']);
		expect(auth('delete')).toBe(false);
	});
});

describe('auths (any permission match utils)', () => {
	it('returns_true_for_superadmin', () => {
		setupPermissionState(true, []);
		expect(auths(['a', 'b'])).toBe(true);
	});

	it('returns_true_when_any_matches', () => {
		setupPermissionState(false, ['a', 'c']);
		expect(auths(['b', 'a'])).toBe(true);
	});

	it('returns_false_when_none_match', () => {
		setupPermissionState(false, ['x']);
		expect(auths(['a', 'b'])).toBe(false);
	});
});

describe('authAll (all permissions match utils)', () => {
	it('returns_true_for_superadmin', () => {
		setupPermissionState(true, []);
		expect(authAll(['a', 'b'])).toBe(true);
	});

	it('returns_true_when_all_required_are_granted', () => {
		setupPermissionState(false, ['a', 'b', 'c', 'd']);
		expect(authAll(['a', 'c'])).toBe(true);
	});

	it('returns_false_when_missing_some', () => {
		setupPermissionState(false, ['a']);
		expect(authAll(['a', 'b'])).toBe(false);
	});
});