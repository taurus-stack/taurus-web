import { describe, it, expect } from 'vitest';
import { judementSameArr, isObjectValueEqual, removeDuplicate } from '../../src/utils/arrayOperation';

describe('removeDuplicate', () => {
	it('dedupes_simple_primitives', () => {
		expect(removeDuplicate([1, 2, 2, 3, 1, 4])).toEqual([1, 2, 3, 4]);
		expect(removeDuplicate(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
	});

	it('returns_empty_array_when_input_empty', () => {
		expect(removeDuplicate([])).toEqual([]);
	});

	it('dedupes_objects_by_attr_key', () => {
		const arr = [
			{ id: 1, name: 'a' },
			{ id: 2, name: 'b' },
			{ id: 1, name: 'dup' },
			{ id: 3, name: 'c' },
		];
		const result = removeDuplicate(arr, 'id');
		expect(result.length).toBe(3);
		expect(result.map((r: any) => r.id)).toEqual([1, 2, 3]);
		expect(result[0].name).toBe('a');
	});

	it('skips_object_with_falsy_attr_value', () => {
		const arr = [
			{ id: 1, name: 'a' },
			{ id: 0, name: 'zero' },
			{ id: null as any, name: 'null' },
			{ id: undefined as any, name: 'undef' },
			{ id: '', name: 'empty' } as any,
		];
		const result = removeDuplicate(arr, 'id');
		expect(result.map((r: any) => r.id)).toEqual([1]);
	});
});

describe('judementSameArr', () => {
	it('returns_true_when_same_elements', () => {
		expect(judementSameArr(['a', 'b', 'c'], ['b', 'c', 'a'])).toBe(true);
	});

	it('returns_true_with_duplicates_removed', () => {
		expect(judementSameArr(['a', 'a', 'b'], ['a', 'b', 'b'])).toBe(true);
	});

	it('returns_false_when_new_has_more_elements', () => {
		expect(judementSameArr(['a', 'b', 'c'], ['a', 'b'])).toBe(false);
	});

	it('returns_false_when_old_has_more_elements', () => {
		expect(judementSameArr(['a', 'b'], ['a', 'b', 'c'])).toBe(true);
	});

	it('returns_false_when_mismatched', () => {
		expect(judementSameArr(['a', 'b'], ['c', 'd'])).toBe(false);
	});
});

describe('isObjectValueEqual', () => {
	it('returns_true_for_equal_flat_objects', () => {
		expect(isObjectValueEqual({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true);
	});

	it('returns_false_for_different_value', () => {
		expect(isObjectValueEqual({ a: 1 }, { a: 2 })).toBe(false);
	});

	it('returns_false_for_different_key_count', () => {
		expect(isObjectValueEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
	});

	it('returns_false_if_either_null_or_undefined', () => {
		expect(isObjectValueEqual(null as any, { a: 1 })).toBe(false);
		expect(isObjectValueEqual({ a: 1 }, undefined as any)).toBe(false);
	});

	it('returns_true_for_nested_equal_objects', () => {
		const a = { x: { y: 1, z: [1, 2] }, b: 's' };
		const b = { x: { y: 1, z: [1, 2] }, b: 's' };
		expect(isObjectValueEqual(a, b)).toBe(true);
	});

	it('returns_false_for_nested_different_objects', () => {
		const a = { x: { y: 1 } };
		const b = { x: { y: 2 } };
		expect(isObjectValueEqual(a, b)).toBe(false);
	});
});