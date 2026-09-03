import { describe, it, expect } from 'vitest';
import { handleMenu } from '../../src/utils/menu';

describe('handleMenu', () => {
	it('returns_frameIn_and_frameOut', () => {
		const result = handleMenu([]);
		expect(result).toHaveProperty('frameIn');
		expect(result).toHaveProperty('frameOut');
		expect(result.frameOut).toEqual([]);
	});

	it('includes_home_route_at_first_position', () => {
		const result = handleMenu([]);
		expect(result.frameIn[0].path).toBe('/home');
		expect(result.frameIn[0].name).toBe('home');
		expect(result.frameIn[0].meta.title).toBe('message.router.home');
	});

	it('transforms_menu_item_meta', () => {
		const menuData = [
			{
				id: 100,
				title: '系统管理',
				link_url: '',
				visible: true,
				cache: true,
				is_affix: false,
				is_iframe: false,
				icon: 'setting',
				component_name: 'System',
				web_path: '/system',
			},
		];
		const result = handleMenu(menuData);
		expect(result.frameIn.length).toBeGreaterThanOrEqual(2);
		const systemRoute = result.frameIn.find((r: any) => r.name === 'System');
		expect(systemRoute).toBeDefined();
		expect(systemRoute.meta.title).toBe('系统管理');
		expect(systemRoute.meta.isHide).toBe(false);
		expect(systemRoute.meta.isKeepAlive).toBe(true);
		expect(systemRoute.meta.icon).toBe('setting');
		expect(systemRoute.path).toBe('/system');
	});

	it('sets_isHide_true_when_visible_false', () => {
		const menuData = [
			{
				id: 200,
				title: '隐藏页',
				link_url: '',
				visible: false,
				cache: false,
				is_affix: false,
				is_iframe: false,
				icon: '',
				component_name: 'Hidden',
				web_path: '/hidden',
			},
		];
		const result = handleMenu(menuData);
		const hiddenRoute = result.frameIn.find((r: any) => r.name === 'Hidden');
		expect(hiddenRoute).toBeDefined();
		expect(hiddenRoute.meta.isHide).toBe(true);
	});

	it('sets_isLink_from_link_url', () => {
		const menuData = [
			{
				id: 300,
				title: '外链',
				link_url: 'https://example.com',
				visible: true,
				cache: false,
				is_affix: false,
				is_iframe: false,
				icon: 'link',
				component_name: 'External',
				web_path: '/external',
			},
		];
		const result = handleMenu(menuData);
		const extRoute = result.frameIn.find((r: any) => r.name === 'External');
		expect(extRoute).toBeDefined();
		expect(extRoute.meta.isLink).toBe('https://example.com');
	});

	it('builds_tree_from_parent_field', () => {
		const menuData = [
			{
				id: 10,
				title: '父菜单',
				link_url: '',
				visible: true,
				cache: false,
				is_affix: false,
				is_iframe: false,
				icon: 'folder',
				component_name: 'Parent',
				web_path: '/parent',
			},
			{
				id: 11,
				title: '子菜单',
				link_url: '',
				visible: true,
				cache: false,
				is_affix: false,
				is_iframe: false,
				icon: 'file',
				component_name: 'Child',
				web_path: '/parent/child',
				parent: 10,
			},
		];
		const result = handleMenu(menuData);
		const parentRoute = result.frameIn.find((r: any) => r.name === 'Parent');
		expect(parentRoute).toBeDefined();
		expect(parentRoute.children).toBeDefined();
		expect(parentRoute.children.length).toBe(1);
		expect(parentRoute.children[0].name).toBe('Child');
	});
});