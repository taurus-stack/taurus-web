import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRoutesList } from '../../src/stores/routesList';

describe('useRoutesList', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('initializes_with_defaults', () => {
		const store = useRoutesList();
		expect(store.routesList).toEqual([]);
		expect(store.isColumnsMenuHover).toBe(false);
		expect(store.isColumnsNavHover).toBe(false);
	});

	it('setRoutesList_sets_data', () => {
		const store = useRoutesList();
		store.setRoutesList(['home', 'about'] as any);
		expect(store.routesList).toEqual(['home', 'about']);
	});

	it('setColumnsMenuHover_toggles', () => {
		const store = useRoutesList();
		store.setColumnsMenuHover(true);
		expect(store.isColumnsMenuHover).toBe(true);
		store.setColumnsMenuHover(false);
		expect(store.isColumnsMenuHover).toBe(false);
	});

	it('setColumnsNavHover_toggles', () => {
		const store = useRoutesList();
		store.setColumnsNavHover(true);
		expect(store.isColumnsNavHover).toBe(true);
	});

	it('addRoutesList_appends_data', () => {
		const store = useRoutesList();
		store.setRoutesList(['home'] as any);
		store.addRoutesList('about' as any);
		expect(store.routesList).toContain('about');
	});
});