import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import IconSelectorList from '../../src/components/iconSelector/list.vue';

const globalComponents = {
	'el-scrollbar': { template: '<div class="el-scrollbar"><slot /></div>' },
	'el-row': { template: '<div class="el-row"><slot /></div>' },
	'el-col': { template: '<div class="el-col"><slot /></div>' },
	'el-empty': { template: '<div class="el-empty" />' },
	'SvgIcon': { template: '<i class="svg-icon-mock" />' },
};

describe('IconSelectorList', () => {
	it('renders_list_of_icons', () => {
		const list = ['ele-Home', 'ele-User', 'ele-Setting'];
		const wrapper = mount(IconSelectorList, {
			props: { list },
			global: { components: globalComponents },
		});
		const cols = wrapper.findAll('.icon-selector-warp-item');
		expect(cols.length).toBe(3);
	});

	it('emits_get_icon_on_click', async () => {
		const list = ['ele-Home', 'ele-User'];
		const wrapper = mount(IconSelectorList, {
			props: { list },
			global: { components: globalComponents },
		});
		const firstItem = wrapper.findAll('.icon-selector-warp-item')[0];
		await firstItem.trigger('click');
		expect(wrapper.emitted('get-icon')).toBeTruthy();
		expect(wrapper.emitted('get-icon')[0]).toEqual(['ele-Home']);
	});

	it('highlights_active_prefix', () => {
		const list = ['ele-Home', 'ele-User'];
		const wrapper = mount(IconSelectorList, {
			props: { list, prefix: 'ele-Home' },
			global: { components: globalComponents },
		});
		const items = wrapper.findAll('.icon-selector-warp-item');
		expect(items[0].classes()).toContain('icon-selector-active');
		expect(items[1].classes()).not.toContain('icon-selector-active');
	});

	it('shows_empty_state_when_no_list', () => {
		const wrapper = mount(IconSelectorList, {
			props: { list: [], empty: '暂无图标' },
			global: { components: globalComponents },
		});
		expect(wrapper.find('.el-empty').exists()).toBe(true);
	});
});