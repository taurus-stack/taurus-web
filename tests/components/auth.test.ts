import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import Auth from '../../src/components/auth/auth.vue';
import Auths from '../../src/components/auth/auths.vue';
import { useUserInfo } from '../../src/stores/userInfo';

function setupStore(perms: string[]) {
	const store = useUserInfo();
	store.userInfos = { authBtnList: perms } as any;
	return store;
}

const slotHtml = '<button class="act-btn">Action</button>';

describe('Auth (single permission)', () => {
	beforeEach(() => setActivePinia(createPinia()));

	it('renders_slot_when_has_permission', () => {
		setupStore(['create', 'edit']);
		const wrapper = mount(Auth, {
			props: { value: 'create' },
			slots: { default: slotHtml },
		});
		expect(wrapper.find('.act-btn').exists()).toBe(true);
	});

	it('hides_slot_when_no_permission', () => {
		setupStore(['delete']);
		const wrapper = mount(Auth, {
			props: { value: 'create' },
			slots: { default: slotHtml },
		});
		expect(wrapper.find('.act-btn').exists()).toBe(false);
	});

	it('hides_slot_when_empty_perm_list', () => {
		setupStore([]);
		const wrapper = mount(Auth, {
			props: { value: 'create' },
			slots: { default: slotHtml },
		});
		expect(wrapper.find('.act-btn').exists()).toBe(false);
	});

	it('hides_slot_when_empty_value', () => {
		setupStore(['create']);
		const wrapper = mount(Auth, {
			props: { value: '' },
			slots: { default: slotHtml },
		});
		expect(wrapper.find('.act-btn').exists()).toBe(false);
	});
});

describe('Auths (any permission match)', () => {
	beforeEach(() => setActivePinia(createPinia()));

	it('renders_slot_when_any_permission_matches', () => {
		setupStore(['create', 'edit']);
		const wrapper = mount(Auths, {
			props: { value: ['create', 'delete'] },
			slots: { default: slotHtml },
		});
		expect(wrapper.find('.act-btn').exists()).toBe(true);
	});

	it('hides_slot_when_no_permission_matches', () => {
		setupStore(['view']);
		const wrapper = mount(Auths, {
			props: { value: ['create', 'delete'] },
			slots: { default: slotHtml },
		});
		expect(wrapper.find('.act-btn').exists()).toBe(false);
	});

	it('hides_slot_when_empty_required', () => {
		setupStore(['create', 'edit']);
		const wrapper = mount(Auths, {
			props: { value: [] },
			slots: { default: slotHtml },
		});
		expect(wrapper.find('.act-btn').exists()).toBe(false);
	});

	it('renders_slot_when_multiple_perms_match', () => {
		setupStore(['create', 'edit', 'delete']);
		const wrapper = mount(Auths, {
			props: { value: ['delete', 'export'] },
			slots: { default: slotHtml },
		});
		expect(wrapper.find('.act-btn').exists()).toBe(true);
	});
});