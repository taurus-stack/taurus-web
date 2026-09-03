import { describe, it, expect } from 'vitest';
import { parse, response, responseSuccess, responseError, base64ToFile } from '../../src/utils/tools';

describe('parse', () => {
	it('parses_valid_json', () => {
		expect(parse('{"a":1}')).toEqual({ a: 1 });
	});

	it('returns_default_for_invalid_json', () => {
		expect(parse('not json')).toEqual({});
	});

	it('returns_custom_default_for_invalid_json', () => {
		expect(parse('bad', [])).toEqual([]);
	});

	it('parses_empty_object_string', () => {
		expect(parse('{}')).toEqual({});
	});

	it('parses_array', () => {
		expect(parse('[1,2,3]')).toEqual([1, 2, 3]);
	});
});

describe('response', () => {
	it('returns_success_format', () => {
		const result = response({ id: 1 }, 'ok', 0);
		expect(result).toEqual([200, { code: 0, msg: 'ok', data: { id: 1 } }]);
	});

	it('uses_default_values', () => {
		const result = response();
		expect(result).toEqual([200, { code: 0, msg: '', data: {} }]);
	});
});

describe('responseSuccess', () => {
	it('returns_success_with_default_msg', () => {
		const result = responseSuccess({ id: 1 });
		expect(result).toEqual([200, { code: 0, msg: '成功', data: { id: 1 } }]);
	});

	it('accepts_custom_msg', () => {
		const result = responseSuccess({}, 'done');
		expect(result[1].msg).toBe('done');
	});
});

describe('responseError', () => {
	it('returns_error_format', () => {
		const result = responseError({}, 'fail', 500);
		expect(result).toEqual([200, { code: 500, msg: 'fail', data: {} }]);
	});

	it('uses_default_error_values', () => {
		const result = responseError();
		expect(result[1].code).toBe(500);
		expect(result[1].msg).toBe('请求失败');
	});
});

describe('base64ToFile', () => {
	it('converts_base64_to_file', () => {
		const base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
		const file = base64ToFile(base64, 'test');
		expect(file).toBeInstanceOf(File);
		expect(file.name).toBe('test.png');
		expect(file.type).toBe('image/png');
	});

	it('converts_jpeg_base64', () => {
		const base64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==';
		const file = base64ToFile(base64, 'photo');
		expect(file.name).toBe('photo.jpeg');
		expect(file.type).toBe('image/jpeg');
	});
});