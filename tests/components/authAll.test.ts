import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import AuthAll from '../../src/components/auth/authAll.vue';
import { useUserInfo } from '../../src/stores/userInfo';

describe('AuthAll', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('renders_slot_when_user_has_all_permissions', () => {
		const store = useUserInfo();
		store.userInfos = {
			authBtnList: ['create', 'delete', 'edit'],
		};

		const wrapper = mount(AuthAll, {
			props: { value: ['create', 'edit'] },
			slots: {
				default: '<button class="target-btn">Action</button>',
			},
		});
		expect(wrapper.find('.target-btn').exists()).toBe(true);
	});

	it('hides_slot_when_user_missing_permissions', () => {
		const store = useUserInfo();
		store.userInfos = {
			authBtnList: ['create'],
		};

		const wrapper = mount(AuthAll, {
			props: { value: ['delete', 'edit'] },
			slots: {
				default: '<button class="target-btn">Action</button>',
			},
		});
		expect(wrapper.find('.target-btn').exists()).toBe(false);
	});

	it('hides_slot_when_user_has_partial_permissions', () => {
		const store = useUserInfo();
		store.userInfos = {
			authBtnList: ['create', 'edit'],
		};

		const wrapper = mount(AuthAll, {
			props: { value: ['create', 'edit', 'delete'] },
			slots: {
				default: '<button class="target-btn">Action</button>',
			},
		});
		expect(wrapper.find('.target-btn').exists()).toBe(false);
	});

	it('renders_slot_when_empty_permissions_required', () => {
		const store = useUserInfo();
		store.userInfos = {
			authBtnList: ['create'],
		};

		const wrapper = mount(AuthAll, {
			props: { value: [] },
			slots: {
				default: '<button class="target-btn">Action</button>',
			},
		});
		expect(wrapper.find('.target-btn').exists()).toBe(true);
	});
});