import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

const globalComponents = {
	'el-dialog': {
		template: `<div class="el-dialog" :fullscreen="fullscreen" :data-fullscreen="fullscreen">
			<slot name="header" />
			<slot />
			<slot name="footer" />
		</div>`,
		props: ['fullscreen'],
	},
	'el-tooltip': {
		template: '<div class="el-tooltip"><slot /></div>',
		props: ['content'],
	},
	'FsIcon': {
		template: "<i class=\"fs-icon\" :data-icon=\"icon\" @click=\"$emit('click')\" />",
		props: ['icon'],
		emits: ['click'],
	},
};

describe('CustomDialog', () => {
	beforeEach(() => {
		vi.doMock('@fast-crud/fast-crud', () => ({
			FsIcon: globalComponents.FsIcon,
		}));
	});

	async function mountDialog(props: any = {}, slots: any = {}) {
		const { default: CustomDialog } = await import('../../src/components/customDialog/index.vue');
		return mount(CustomDialog, {
			props,
			slots,
			global: { components: globalComponents },
		});
	}

	it('renders_title', async () => {
		const wrapper = await mountDialog({ title: 'My Dialog', height: 400 });
		expect(wrapper.find('h1').text()).toBe('My Dialog');
	});

	it('toggles_fullscreen_on_fs_icon_click', async () => {
		const wrapper = await mountDialog({ title: 'Test' });
		const dialog = wrapper.findComponent({ name: 'el-dialog' });
		expect(dialog.props('fullscreen')).toBe(false);

		await wrapper.find('.fs-icon').trigger('click');
		await nextTick();

		const dialog2 = wrapper.findComponent({ name: 'el-dialog' });
		expect(dialog2.props('fullscreen')).toBe(true);

		await wrapper.find('.fs-icon').trigger('click');
		await nextTick();

		const dialog3 = wrapper.findComponent({ name: 'el-dialog' });
		expect(dialog3.props('fullscreen')).toBe(false);
	});

	it('renders_header_slot', async () => {
		const wrapper = await mountDialog(
			{ title: 'Test' },
			{ header: '<div class="my-header">Custom Header</div>' },
		);
		expect(wrapper.find('.my-header').text()).toContain('Custom Header');
	});

	it('renders_content_slot', async () => {
		const wrapper = await mountDialog(
			{ title: 'Test', height: 500 },
			{ content: '<div class="my-content">Body Content</div>' },
		);
		expect(wrapper.find('.my-content').text()).toBe('Body Content');
	});

	it('renders_footer_slot', async () => {
		const wrapper = await mountDialog(
			{ title: 'Test' },
			{ footer: '<button class="my-footer-btn">OK</button>' },
		);
		expect(wrapper.find('.my-footer-btn').text()).toBe('OK');
	});
});