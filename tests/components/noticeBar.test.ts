import { describe, it, expect, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import NoticeBar from '../../src/components/noticeBar/index.vue';

describe('NoticeBar', () => {
	const mockStyleSheets = {
		insertRule: vi.fn(),
	};

	beforeEach(() => {
		vi.spyOn(document, 'styleSheets', 'get').mockReturnValue([mockStyleSheets] as unknown as StyleSheetList);
		mockStyleSheets.insertRule.mockReset();
	});

	it('renders_text_content', () => {
		const wrapper = mount(NoticeBar, {
			props: {
				text: 'Hello Notice',
				scrollable: false,
			},
		});
		expect(wrapper.find('.notice-bar-warp-text').text()).toContain('Hello Notice');
	});

	it('hides_when_mode_closeable_and_closed', async () => {
		const wrapper = mount(NoticeBar, {
			props: {
				mode: 'closeable',
				rightIcon: 'ele-Close',
				text: 'test',
				scrollable: true,
			},
		});
		expect(wrapper.find('.notice-bar').exists()).toBe(true);

		await wrapper.find('.notice-bar-warp-right-icon').trigger('click');
		await nextTick();

		expect(wrapper.emitted('close')).toBeTruthy();
		expect((wrapper.vm as any).state.isMode).toBe(true);
	});

	it('emits_link_event_when_mode_link', async () => {
		const wrapper = mount(NoticeBar, {
			props: {
				mode: 'link',
				rightIcon: 'ele-Right',
				text: 'test',
				scrollable: true,
			},
		});

		await wrapper.find('.notice-bar-warp-right-icon').trigger('click');
		expect(wrapper.emitted('link')).toBeTruthy();
	});

	it('does_nothing_on_right_click_without_mode', async () => {
		const wrapper = mount(NoticeBar, {
			props: {
				rightIcon: 'ele-Right',
				text: 'test',
				scrollable: true,
			},
		});

		await wrapper.find('.notice-bar-warp-right-icon').trigger('click');
		expect(wrapper.emitted('close')).toBeFalsy();
		expect(wrapper.emitted('link')).toBeFalsy();
	});

	it('applies_custom_colors_and_sizes', () => {
		const wrapper = mount(NoticeBar, {
			props: {
				text: 'test',
				color: '#ff0000',
				background: '#00ff00',
				size: 18,
				height: 50,
				scrollable: true,
			},
		});
		const bar = wrapper.find('.notice-bar');
		const warp = wrapper.find('.notice-bar-warp');
		const barStyle = bar.attributes('style');
		const warpStyle = warp.attributes('style');
		expect(barStyle).toContain('background: rgb(0, 255, 0)');
		expect(barStyle).toContain('height: 50px');
		expect(warpStyle).toContain('color: rgb(255, 0, 0)');
		expect(warpStyle).toContain('font-size: 18px');
	});

	it('renders_left_icon_when_provided', () => {
		const wrapper = mount(NoticeBar, {
			props: {
				text: 'test',
				leftIcon: 'fa fa-bell',
				scrollable: true,
			},
		});
		const leftIcon = wrapper.find('.notice-bar-warp-left-icon');
		expect(leftIcon.exists()).toBe(true);
		expect(leftIcon.classes()).toContain('fa');
		expect(leftIcon.classes()).toContain('fa-bell');
	});

	it('renders_slot_content_when_scrollable', () => {
		const wrapper = mount(NoticeBar, {
			props: { scrollable: true },
			slots: {
				default: '<span class="custom-slot">Slot Content</span>',
			},
		});
		expect(wrapper.find('.custom-slot').exists()).toBe(true);
		expect(wrapper.text()).toContain('Slot Content');
	});
});