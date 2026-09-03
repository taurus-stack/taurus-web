import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useKeepALiveNames } from '../../src/stores/keepAliveNames';

describe('useKeepALiveNames', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('initializes_with_empty_arrays', () => {
		const store = useKeepALiveNames();
		expect(store.keepAliveNames).toEqual([]);
		expect(store.cachedViews).toEqual([]);
	});

	it('setCacheKeepAlive_sets_names', () => {
		const store = useKeepALiveNames();
		store.setCacheKeepAlive(['Home', 'About']);
		expect(store.keepAliveNames).toEqual(['Home', 'About']);
	});

	it('addCachedView_adds_keep_alive_view', () => {
		const store = useKeepALiveNames();
		store.addCachedView({ name: 'Home', meta: { isKeepAlive: true } });
		expect(store.cachedViews).toContain('Home');
	});

	it('addCachedView_ignores_non_keep_alive_view', () => {
		const store = useKeepALiveNames();
		store.addCachedView({ name: 'Login', meta: { isKeepAlive: false } });
		expect(store.cachedViews).not.toContain('Login');
	});

	it('delCachedView_removes_view', () => {
		const store = useKeepALiveNames();
		store.addCachedView({ name: 'Home', meta: { isKeepAlive: true } });
		store.delCachedView({ name: 'Home' });
		expect(store.cachedViews).not.toContain('Home');
	});

	it('delOthersCachedViews_keeps_only_specified', () => {
		const store = useKeepALiveNames();
		store.addCachedView({ name: 'Home', meta: { isKeepAlive: true } });
		store.addCachedView({ name: 'About', meta: { isKeepAlive: true } });
		store.delOthersCachedViews({ name: 'Home', meta: { isKeepAlive: true } });
		expect(store.cachedViews).toEqual(['Home']);
	});

	it('delOthersCachedViews_clears_if_not_keep_alive', () => {
		const store = useKeepALiveNames();
		store.addCachedView({ name: 'Home', meta: { isKeepAlive: true } });
		store.delOthersCachedViews({ name: 'Login', meta: { isKeepAlive: false } });
		expect(store.cachedViews).toEqual([]);
	});

	it('delAllCachedViews_clears_all', () => {
		const store = useKeepALiveNames();
		store.addCachedView({ name: 'Home', meta: { isKeepAlive: true } });
		store.addCachedView({ name: 'About', meta: { isKeepAlive: true } });
		store.delAllCachedViews();
		expect(store.cachedViews).toEqual([]);
	});
});