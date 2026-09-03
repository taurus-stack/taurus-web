import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useThemeConfig } from '../../src/stores/themeConfig';
import { SystemConfigStore } from '../../src/stores/systemConfig';
import { BtnPermissionStore } from '../../src/stores/btnPermission';
import { messageCenterStore } from '../../src/stores/messageCenter';
import { useColumnPermission } from '../../src/stores/columnPermission';
import { useDeptInfoStore } from '../../src/stores/modules/dept';

beforeEach(() => {
	setActivePinia(createPinia());
});

describe('useThemeConfig', () => {
	it('initializes_with_default_theme', () => {
		const store = useThemeConfig();
		expect(store.themeConfig.primary).toBe('#409eff');
		expect(store.themeConfig.isIsDark).toBe(false);
		expect(store.themeConfig.layout).toBe('defaults');
		expect(store.themeConfig.globalTitle).toBe('AOAdmin');
		expect(store.themeConfig.isDrawer).toBe(false);
		expect(store.themeConfig.isShowLogo).toBe(true);
		expect(store.themeConfig.isFooter).toBe(true);
	});

	it('updates_theme_config_via_setThemeConfig', () => {
		const store = useThemeConfig();
		const newTheme = {
			themeConfig: { ...store.themeConfig, primary: '#ff0000', isIsDark: true, layout: 'classic' },
		} as any;
		store.setThemeConfig(newTheme);
		expect(store.themeConfig.primary).toBe('#ff0000');
		expect(store.themeConfig.isIsDark).toBe(true);
		expect(store.themeConfig.layout).toBe('classic');
	});
});

describe('SystemConfigStore', () => {
	it('initializes_with_empty_config', () => {
		const store = SystemConfigStore();
		expect(store.systemConfig).toEqual({});
	});

	it('sets_system_config_from_bootstrap', () => {
		const store = SystemConfigStore();
		store.setFromBootstrap({ site_name: 'Taurus', version: '1.0' });
		expect(store.systemConfig.site_name).toBe('Taurus');
		expect(store.systemConfig.version).toBe('1.0');
	});
});

describe('BtnPermissionStore', () => {
	it('initializes_with_empty_data', () => {
		const store = BtnPermissionStore();
		expect(store.data).toEqual([]);
	});

	it('sets_permissions_from_bootstrap', () => {
		const store = BtnPermissionStore();
		const perms = [
			{ menu: 'user', permissions: ['create', 'edit'] },
		];
		store.setFromBootstrap(perms);
		expect(store.data).toEqual(perms);
	});
});

describe('messageCenterStore', () => {
	it('initializes_with_zero_unread', () => {
		const store = messageCenterStore();
		expect(store.unread).toBe(0);
	});

	it('sets_unread_count', async () => {
		const store = messageCenterStore();
		await store.setUnread(12);
		expect(store.unread).toBe(12);
	});
});

describe('useColumnPermission', () => {
	it('initializes_with_empty_permission', () => {
		const store = useColumnPermission();
		expect(store.permission).toEqual([]);
	});

	it('sets_permission_data', () => {
		const store = useColumnPermission();
		const data = [
			{ field_name: 'password', is_create: false, is_query: false, is_update: false },
			{ field_name: 'username', is_create: true, is_query: true, is_update: true },
		];
		store.setPermissionData(data);
		expect(store.permission.length).toBe(2);
		expect(store.permission[0].field_name).toBe('password');
		expect(store.permission[1].is_create).toBe(true);
	});
});

describe('useDeptInfoStore', () => {
	it('initializes_with_empty_arrays', () => {
		const store = useDeptInfoStore();
		expect(store.list).toEqual([]);
		expect(store.tree).toEqual([]);
	});

	it('processes_dept_data_to_list_and_tree', () => {
		const store = useDeptInfoStore();
		const data = [
			{ id: 1, name: '总部', parent: null },
			{ id: 2, name: '技术部', parent: 1 },
			{ id: 3, name: '产品部', parent: 1 },
			{ id: 4, name: '前端组', parent: 2 },
		];
		store._processDeptData(data);
		expect(store.list.length).toBe(4);
		expect(store.tree.length).toBeGreaterThanOrEqual(1);
		expect(store.tree[0].id).toBe(1);
	});

	it('sets_dept_data_from_bootstrap', () => {
		const store = useDeptInfoStore();
		const data = [
			{ id: 10, name: '公司', parent: null },
		];
		store.setFromBootstrap(data);
		expect(store.list.length).toBe(1);
		expect(store.list[0].name).toBe('公司');
	});
});