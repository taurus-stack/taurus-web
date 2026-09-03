import { describe, it, expect } from 'vitest';
import {
	verifyNumberPercentage,
	verifyNumberPercentageFloat,
	verifyNumberIntegerAndFloat,
	verifiyNumberInteger,
	verifyCnAndSpace,
	verifyEnAndSpace,
	verifyAndSpace,
	verifyNumberComma,
	verifyTextColor,
	verifyNumberCnUppercase,
	verifyPhone,
	verifyTelPhone,
	verifyAccount,
	verifyPassword,
	verifyPasswordPowerful,
	verifyPasswordStrength,
	verifyIPAddress,
	verifyEmail,
	verifyIdCard,
	verifyFullName,
	verifyPostalCode,
	verifyUrl,
	verifyCarNum,
} from '../../src/utils/toolsValidate';

describe('verifyNumberPercentage', () => {
	it('strips_non_digits_and_caps_at_100_when_3digits', () => {
		expect(verifyNumberPercentage('abc123def')).toBe('100');
	});
	it('strips_non_digits_small_number', () => {
		expect(verifyNumberPercentage('abc42def')).toBe('42');
	});
	it('removes_single_leading_zero', () => {
		expect(verifyNumberPercentage('005')).toBe('05');
	});
	it('caps_at_100', () => {
		expect(verifyNumberPercentage('150')).toBe('100');
		expect(verifyNumberPercentage('1234')).toBe('100');
	});
	it('handles_spaces', () => {
		expect(verifyNumberPercentage('  42  ')).toBe('42');
	});
});

describe('verifyNumberPercentageFloat', () => {
	it('allows_single_decimal_point', () => {
		expect(verifyNumberPercentageFloat('12.34')).toBe('12.34');
	});
	it('replaces_100_dot_with_100', () => {
		expect(verifyNumberPercentageFloat('100.')).toBe('100');
	});
	it('does_not_cap_decimal_number_gt_100', () => {
		expect(verifyNumberPercentageFloat('150.50')).toBe('150.50');
	});
	it('caps_integer_over_100', () => {
		expect(verifyNumberPercentageFloat('150')).toBe('100');
	});
});

describe('verifyNumberIntegerAndFloat', () => {
	it('strips_non_numeric_except_dot', () => {
		expect(verifyNumberIntegerAndFloat('a1.b2!3')).toBe('1.23');
	});
	it('allows_only_one_decimal_point_and_truncates_to_2dp', () => {
		expect(verifyNumberIntegerAndFloat('1.2.3.4')).toBe('1.23');
	});
	it('removes_leading_dot', () => {
		expect(verifyNumberIntegerAndFloat('.123')).toBe('123');
	});
	it('keeps_two_decimal_places', () => {
		expect(verifyNumberIntegerAndFloat('12.3456')).toBe('12.34');
	});
});

describe('verifiyNumberInteger', () => {
	it('strips_decimal_points', () => {
		expect(verifiyNumberInteger('1.2.3')).toBe('123');
	});
	it('collapses_leading_zero_runs_to_zero', () => {
		expect(verifiyNumberInteger('00123')).toBe('0');
	});
});

describe('verifyCnAndSpace', () => {
	it('removes_chinese_and_whitespace', () => {
		expect(verifyCnAndSpace(' 你好 World 123 ')).toBe('World123');
	});
});

describe('verifyEnAndSpace', () => {
	it('removes_english_letters_trims_outer_preserves_inner_spaces', () => {
		expect(verifyEnAndSpace(' 你好 World 123 ')).toBe('你好  123');
	});
});

describe('verifyAndSpace', () => {
	it('trims_surrounding_whitespace', () => {
		expect(verifyAndSpace('   abc   ')).toBe('abc');
	});
});

describe('verifyNumberComma', () => {
	it('adds_thousand_separators', () => {
		expect(verifyNumberComma('1234567.89')).toBe('1,234,567.89');
	});
	it('handles_integer', () => {
		expect(verifyNumberComma('1000000')).toBe('1,000,000');
	});
});

describe('verifyTextColor', () => {
	it('wraps_matches_in_colored_span_case_insensitive', () => {
		const r = verifyTextColor('hello', 'Hello World hello', 'blue');
		expect(r).toContain("<span style='color: blue'>hello</span>");
		expect(r.split('hello</span>').length - 1).toBe(2);
	});
	it('defaults_color_to_red', () => {
		expect(verifyTextColor('x', 'X')).toContain("color: red");
	});
});

describe('verifyNumberCnUppercase', () => {
	it('converts_integer_amount', () => {
		expect(verifyNumberCnUppercase('1234')).toContain('壹仟');
		expect(verifyNumberCnUppercase('1234')).toContain('佰');
		expect(verifyNumberCnUppercase('1234')).toContain('整');
	});
	it('handles_zero', () => {
		expect(verifyNumberCnUppercase('0')).toBe('零元整');
	});
	it('handles_decimal', () => {
		const r = verifyNumberCnUppercase('12.5');
		expect(r).toContain('元伍角');
	});
});

describe('verifyPhone', () => {
	it('accepts_valid_cn_mobiles', () => {
		expect(verifyPhone('13800138000')).toBe(true);
		expect(verifyPhone('19912345678')).toBe(true);
		expect(verifyPhone('+8613800138000')).toBe(true);
	});
	it('rejects_invalid', () => {
		expect(verifyPhone('123456')).toBe(false);
		expect(verifyPhone('23800138000')).toBe(false);
	});
});

describe('verifyTelPhone', () => {
	it('accepts_valid_landlines', () => {
		expect(verifyTelPhone('010-12345678')).toBe(true);
		expect(verifyTelPhone('0755-1234567')).toBe(true);
		expect(verifyTelPhone('0888-1234567')).toBe(true);
	});
	it('regex_is_unanchored_so_prefix_matches_even_with_long_suffix', () => {
		expect(verifyTelPhone('021-1234567890')).toBe(true);
	});
	it('rejects_missing_dash', () => {
		expect(verifyTelPhone('01012345678')).toBe(false);
	});
});

describe('verifyAccount', () => {
	it('accepts_valid_accounts', () => {
		expect(verifyAccount('abc123')).toBe(true);
		expect(verifyAccount('a_12345')).toBe(true);
	});
	it('rejects_invalid', () => {
		expect(verifyAccount('1abc')).toBe(false);
		expect(verifyAccount('ab')).toBe(false);
	});
});

describe('verifyPassword', () => {
	it('letter_start_6_16_chars', () => {
		expect(verifyPassword('abc123')).toBe(true);
		expect(verifyPassword('123abc')).toBe(false);
	});
});

describe('verifyPasswordPowerful', () => {
	it('requires_letter_number_special', () => {
		expect(verifyPasswordPowerful('Abc123!')).toBe(true);
		expect(verifyPasswordPowerful('abc123')).toBe(false);
		expect(verifyPasswordPowerful('abcdef')).toBe(false);
	});
});

describe('verifyPasswordStrength', () => {
	it('classifies_weak_medium_strong', () => {
		expect(verifyPasswordStrength('abcdef')).toBe('弱');
		expect(verifyPasswordStrength('abc12345')).toBe('中');
		expect(verifyPasswordStrength('Abc123!')).toBe('强');
	});
});

describe('verifyIPAddress', () => {
	it('validates_ipv4', () => {
		expect(verifyIPAddress('192.168.1.1')).toBe(true);
		expect(verifyIPAddress('255.255.255.0')).toBe(true);
		expect(verifyIPAddress('256.1.1.1')).toBe(false);
		expect(verifyIPAddress('a.b.c.d')).toBe(false);
	});
});

describe('verifyEmail', () => {
	it('validates_emails', () => {
		expect(verifyEmail('a@b.com')).toBe(true);
		expect(verifyEmail('user.name+tag@domain.co.uk')).toBe(true);
		expect(verifyEmail('not-an-email')).toBe(false);
	});
});

describe('verifyIdCard', () => {
	it('validates_18digit_id', () => {
		expect(verifyIdCard('110101199003074532')).toBe(true);
		expect(verifyIdCard('11010119900307453X')).toBe(true);
		expect(verifyIdCard('12345')).toBe(false);
	});
});

describe('verifyFullName', () => {
	it('accepts_chinese_name', () => {
		expect(verifyFullName('张三')).toBe(true);
		expect(verifyFullName('欧阳·克克')).toBe(true);
	});
});

describe('verifyPostalCode', () => {
	it('validates_postal_code', () => {
		expect(verifyPostalCode('100000')).toBe(true);
		expect(verifyPostalCode('010000')).toBe(false);
	});
});

describe('verifyUrl', () => {
	it('validates_urls', () => {
		expect(verifyUrl('https://example.com')).toBe(true);
		expect(verifyUrl('http://a.com/path?q=1')).toBe(true);
		expect(verifyUrl('not-a-url')).toBe(false);
	});
});

describe('verifyCarNum', () => {
	it('validates_new_energy_plate', () => {
		expect(verifyCarNum('京AD12345')).toBe(true);
		expect(verifyCarNum('粤B12345')).toBe(true);
	});
});