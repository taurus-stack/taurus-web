import { describe, it, expect } from 'vitest';
import { md5, Md5 } from '../../src/utils/md5';

describe('md5', () => {
	it('hashes_empty_string', () => {
		expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
	});

	it('hashes_known_string', () => {
		expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
		expect(md5('Hello World')).toBe('b10a8db164e0754105b7a99be72e3fe5');
		expect(md5('the quick brown fox')).toBe('30f3c93e46436deb58ba70816a8ec124');
	});

	it('hashes_numbers_and_special_chars', () => {
		expect(md5('123456')).toBe('e10adc3949ba59abbe56e057f20f883e');
		expect(md5('!@#$%^&*()')).toBe('05b28d17a7b6e7024b6e5d8cc43a8bf7');
	});

	it('hashes_chinese_utf8', () => {
		expect(md5('你好')).toBe('7eca689f0d3389d9dea66ae112e5cfd7');
	});

	it('Md5_hashStr_equals_md5', () => {
		const s = 'Taurus Stack test';
		expect(Md5.hashStr(s)).toBe(md5(s));
	});
});