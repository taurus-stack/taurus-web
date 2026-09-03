import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SvgIcon from '../../src/components/svgIcon/index.vue';

describe('SvgIcon', () => {
	it('renders_element_plus_icon_with_ele_prefix', () => {
		const wrapper = mount(SvgIcon, {
			props: { name: 'ele-Pointer' },
		});
		const i = wrapper.find('i');
		expect(i.exists()).toBe(true);
		expect(i.classes()).toContain('el-icon');
	});

	it('renders_icon_class_without_ele_prefix', () => {
		const wrapper = mount(SvgIcon, {
			props: { name: 'iconfont icon-home' },
		});
		const i = wrapper.find('i');
		expect(i.exists()).toBe(true);
		expect(i.classes()).toContain('iconfont');
		expect(i.classes()).toContain('icon-home');
	});

	it('renders_img_for_http_url', () => {
		const wrapper = mount(SvgIcon, {
			props: { name: 'https://example.com/icon.png' },
		});
		const img = wrapper.find('img');
		expect(img.exists()).toBe(true);
		expect(img.attributes('src')).toBe('https://example.com/icon.png');
	});

	it('renders_img_for_data_image', () => {
		const wrapper = mount(SvgIcon, {
			props: { name: 'data:image/svg+xml,<svg></svg>' },
		});
		const img = wrapper.find('img');
		expect(img.exists()).toBe(true);
	});

	it('applies_size_style', () => {
		const wrapper = mount(SvgIcon, {
			props: { name: 'ele-Pointer', size: 20 },
		});
		const i = wrapper.find('i');
		expect(i.attributes('style')).toContain('font-size: 20px');
	});

	it('applies_color_style', () => {
		const wrapper = mount(SvgIcon, {
			props: { name: 'ele-Pointer', color: 'red' },
		});
		const i = wrapper.find('i');
		expect(i.attributes('style')).toContain('color: red');
	});

	it('uses_default_size_14', () => {
		const wrapper = mount(SvgIcon, {
			props: { name: 'ele-Pointer' },
		});
		const i = wrapper.find('i');
		expect(i.attributes('style')).toContain('font-size: 14px');
	});
});