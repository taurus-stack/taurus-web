import { describe, it, expect } from 'vitest';
import { deepClone, handleEmpty, isMobile } from '../../src/utils/other';

describe('deepClone', () => {
	it('clones_plain_object', () => {
		const obj = { a: 1, b: 'test' };
		const cloned = deepClone(obj);
		expect(cloned).toEqual(obj);
		expect(cloned).not.toBe(obj);
	});

	it('clones_nested_object', () => {
		const obj = { a: { b: { c: 1 } } };
		const cloned = deepClone(obj);
		expect(cloned).toEqual(obj);
		expect(cloned.a).not.toBe(obj.a);
		expect(cloned.a.b).not.toBe(obj.a.b);
	});

	it('clones_array', () => {
		const arr = [1, 2, 3];
		const cloned = deepClone(arr as any);
		expect(cloned).toEqual(arr);
		expect(cloned).not.toBe(arr);
	});

	it('modifying_clone_does_not_affect_original', () => {
		const obj = { a: { b: 1 } };
		const cloned = deepClone(obj);
		(cloned as any).a.b = 999;
		expect((obj as any).a.b).toBe(1);
	});
});

describe('handleEmpty', () => {
	it('removes_rows_with_all_empty_values', () => {
		const list = [
			{ name: 'a', value: '1' },
			{ name: '', value: '' },
			{ name: 'c', value: '3' },
		];
		const result = handleEmpty(list);
		expect(result).toHaveLength(2);
	});

	it('keeps_rows_with_at_least_one_value', () => {
		const list = [
			{ name: 'a', value: '' },
			{ name: '', value: '' },
		];
		const result = handleEmpty(list);
		expect(result).toHaveLength(1);
	});

	it('returns_empty_for_all_empty_rows', () => {
		const list = [
			{ name: '', value: '' },
			{ name: '', value: '' },
		];
		const result = handleEmpty(list);
		expect(result).toHaveLength(0);
	});
});

describe('isMobile', () => {
	it('detects_mobile_user_agent', () => {
		const originalUA = navigator.userAgent;
		Object.defineProperty(navigator, 'userAgent', {
			value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
			configurable: true,
		});
		expect(isMobile()).toBe(true);
		Object.defineProperty(navigator, 'userAgent', {
			value: originalUA,
			configurable: true,
		});
	});

	it('detects_desktop_user_agent', () => {
		const originalUA = navigator.userAgent;
		Object.defineProperty(navigator, 'userAgent', {
			value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
			configurable: true,
		});
		expect(isMobile()).toBe(false);
		Object.defineProperty(navigator, 'userAgent', {
			value: originalUA,
			configurable: true,
		});
	});
});