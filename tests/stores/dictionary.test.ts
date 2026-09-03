import { describe, it, expect } from 'vitest';
import { getButtonSettings, BUTTON_VALUE_TO_COLOR_MAPPING } from '../../src/stores/dictionary';

describe('getButtonSettings', () => {
	it('maps_items_with_colors', () => {
		const settings = [
			{ label: '新增', value: 'Create' },
			{ label: '删除', value: 'Delete' },
		];
		const result = getButtonSettings(settings);
		expect(result).toEqual([
			{ label: '新增', value: 'Create', color: 'success' },
			{ label: '删除', value: 'Delete', color: 'danger' },
		]);
	});

	it('preserves_custom_color', () => {
		const settings = [
			{ label: '自定义', value: 'Create', color: 'custom-color' },
		];
		const result = getButtonSettings(settings);
		expect(result[0].color).toBe('custom-color');
	});

	it('uses_default_color_mapping_when_no_custom_color', () => {
		const settings = [
			{ label: '编辑', value: 'Update' },
		];
		const result = getButtonSettings(settings);
		expect(result[0].color).toBe('primary');
	});

	it('handles_empty_array', () => {
		expect(getButtonSettings([])).toEqual([]);
	});
});

describe('BUTTON_VALUE_TO_COLOR_MAPPING', () => {
	it('maps_boolean_values', () => {
		expect(BUTTON_VALUE_TO_COLOR_MAPPING[1]).toBe('success');
		expect(BUTTON_VALUE_TO_COLOR_MAPPING[0]).toBe('danger');
		expect(BUTTON_VALUE_TO_COLOR_MAPPING[true]).toBe('success');
		expect(BUTTON_VALUE_TO_COLOR_MAPPING[false]).toBe('danger');
	});

	it('maps_crud_operations', () => {
		expect(BUTTON_VALUE_TO_COLOR_MAPPING.Create).toBe('success');
		expect(BUTTON_VALUE_TO_COLOR_MAPPING.Delete).toBe('danger');
		expect(BUTTON_VALUE_TO_COLOR_MAPPING.Update).toBe('primary');
		expect(BUTTON_VALUE_TO_COLOR_MAPPING.Search).toBe('warning');
		expect(BUTTON_VALUE_TO_COLOR_MAPPING.Retrieve).toBe('info');
	});
});