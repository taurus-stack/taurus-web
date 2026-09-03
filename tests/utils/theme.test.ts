import { describe, it, expect } from 'vitest';
import { useChangeColor } from '../../src/utils/theme';

describe('useChangeColor', () => {
	const { hexToRgb, rgbToHex, getDarkColor, getLightColor } = useChangeColor();

	describe('hexToRgb', () => {
		it('converts_hex_to_rgb_array', () => {
			const result = hexToRgb('#409eff');
			expect(result).toEqual([64, 158, 255]);
		});

		it('converts_hex_without_hash', () => {
			const result = hexToRgb('409eff');
			expect(result).toEqual([64, 158, 255]);
		});

		it('converts_black', () => {
			const result = hexToRgb('#000000');
			expect(result).toEqual([0, 0, 0]);
		});

		it('converts_white', () => {
			const result = hexToRgb('#ffffff');
			expect(result).toEqual([255, 255, 255]);
		});

		it('returns_empty_for_invalid_hex', () => {
			expect(hexToRgb('invalid')).toBe('');
		});

		it('returns_empty_for_short_hex', () => {
			expect(hexToRgb('#fff')).toBe('');
		});
	});

	describe('rgbToHex', () => {
		it('converts_rgb_to_hex', () => {
			expect(rgbToHex(64, 158, 255)).toBe('#409eff');
		});

		it('converts_zero_values', () => {
			expect(rgbToHex(0, 0, 0)).toBe('#000000');
		});

		it('converts_max_values', () => {
			expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
		});

		it('pads_single_digit_hex', () => {
			expect(rgbToHex(1, 2, 3)).toBe('#010203');
		});

		it('returns_hex_for_large_values', () => {
			const result = rgbToHex(999, 0, 0);
			expect(result).toMatch(/^#[0-9a-f]+$/);
		});
	});

	describe('getDarkColor', () => {
		it('darkens_color', () => {
			const result = getDarkColor('#ffffff', 0.5);
			expect(result).toMatch(/^#[0-9a-f]{6}$/);
			const rgb = hexToRgb(result);
			expect(rgb[0]).toBeLessThan(255);
			expect(rgb[1]).toBeLessThan(255);
			expect(rgb[2]).toBeLessThan(255);
		});

		it('darkens_by_zero_returns_same', () => {
			const result = getDarkColor('#409eff', 0);
			expect(result).toBe('#409eff');
		});

		it('darkens_by_one_returns_black', () => {
			const result = getDarkColor('#ffffff', 1);
			expect(result).toBe('#000000');
		});

		it('returns_empty_for_invalid_color', () => {
			expect(getDarkColor('invalid', 0.5)).toBe('');
		});
	});

	describe('getLightColor', () => {
		it('lightens_color', () => {
			const result = getLightColor('#000000', 0.5);
			expect(result).toMatch(/^#[0-9a-f]{6}$/);
			const rgb = hexToRgb(result);
			expect(rgb[0]).toBeGreaterThan(0);
			expect(rgb[1]).toBeGreaterThan(0);
			expect(rgb[2]).toBeGreaterThan(0);
		});

		it('lightens_by_zero_returns_same', () => {
			const result = getLightColor('#409eff', 0);
			expect(result).toBe('#409eff');
		});

		it('lightens_by_one_returns_white', () => {
			const result = getLightColor('#000000', 1);
			expect(result).toBe('#ffffff');
		});

		it('returns_empty_for_invalid_color', () => {
			expect(getLightColor('invalid', 0.5)).toBe('');
		});
	});
});