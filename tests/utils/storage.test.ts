import { describe, it, expect, beforeEach } from 'vitest';
import { Local, Session } from '../../src/utils/storage';

describe('Local storage', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('set_and_get_stores_value', () => {
		Local.set('key1', 'value1');
		expect(Local.get('key1')).toBe('value1');
	});

	it('set_and_get_stores_object', () => {
		Local.set('obj', { a: 1, b: 'test' });
		expect(Local.get('obj')).toEqual({ a: 1, b: 'test' });
	});

	it('set_and_get_stores_number', () => {
		Local.set('num', 42);
		expect(Local.get('num')).toBe(42);
	});

	it('set_and_get_stores_boolean', () => {
		Local.set('flag', true);
		expect(Local.get('flag')).toBe(true);
	});

	it('get_returns_null_for_missing_key', () => {
		expect(Local.get('nonexistent')).toBeNull();
	});

	it('remove_deletes_specific_key', () => {
		Local.set('keep', 'yes');
		Local.set('remove', 'no');
		Local.remove('remove');
		expect(Local.get('keep')).toBe('yes');
		expect(Local.get('remove')).toBeNull();
	});

	it('clear_removes_all_keys', () => {
		Local.set('a', 1);
		Local.set('b', 2);
		Local.clear();
		expect(Local.get('a')).toBeNull();
		expect(Local.get('b')).toBeNull();
	});

	it('set_overwrites_existing_value', () => {
		Local.set('key', 'old');
		Local.set('key', 'new');
		expect(Local.get('key')).toBe('new');
	});
});

describe('Session storage', () => {
	beforeEach(() => {
		sessionStorage.clear();
		document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
	});

	it('set_and_get_stores_value', () => {
		Session.set('key1', 'value1');
		expect(Session.get('key1')).toBe('value1');
	});

	it('set_and_get_stores_object', () => {
		Session.set('obj', { x: 10 });
		expect(Session.get('obj')).toEqual({ x: 10 });
	});

	it('token_uses_cookie', () => {
		Session.set('token', 'my-jwt-token');
		expect(Session.get('token')).toBe('my-jwt-token');
	});

	it('remove_deletes_specific_key', () => {
		Session.set('keep', 'yes');
		Session.set('remove', 'no');
		Session.remove('remove');
		expect(Session.get('keep')).toBe('yes');
		expect(Session.get('remove')).toBeNull();
	});

	it('remove_token_deletes_cookie', () => {
		Session.set('token', 'my-jwt');
		Session.remove('token');
		expect(Session.get('token')).toBeUndefined();
	});

	it('clear_removes_all_keys_and_token', () => {
		Session.set('a', 1);
		Session.set('token', 'jwt');
		Session.clear();
		expect(Session.get('a')).toBeNull();
		expect(Session.get('token')).toBeUndefined();
	});
});