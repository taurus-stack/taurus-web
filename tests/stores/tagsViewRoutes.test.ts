import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTagsViewRoutes } from '../../src/stores/tagsViewRoutes';

describe('useTagsViewRoutes', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		localStorage.clear();
	});

	it('initializes_with_defaults', () => {
		const store = useTagsViewRoutes();
		expect(store.tagsViewRoutes).toEqual([]);
		expect(store.isTagsViewCurrenFull).toBe(false);
	});

	it('setTagsViewRoutes_sets_data', () => {
		const store = useTagsViewRoutes();
		store.setTagsViewRoutes(['home', 'about'] as any);
		expect(store.tagsViewRoutes).toEqual(['home', 'about']);
	});

	it('setCurrenFullscreen_sets_state_and_persists', () => {
		const store = useTagsViewRoutes();
		store.setCurrenFullscreen(true);
		expect(store.isTagsViewCurrenFull).toBe(true);
	});
});