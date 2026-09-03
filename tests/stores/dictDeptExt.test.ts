import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { DictionaryStore, BUTTON_VALUE_TO_COLOR_MAPPING, getButtonSettings } from '../../src/stores/dictionary';
import { useDeptInfoStore } from '../../src/stores/modules/dept';

beforeEach(() => {
	setActivePinia(createPinia());
});

describe('DictionaryStore', () => {
	it('initializes_with_empty_data_object', () => {
		const store = DictionaryStore();
		expect(store.data).toEqual({});
	});

	it('converts_type_1_value_to_number', () => {
		const store = DictionaryStore();
		const data = [
			{
				value: 'gender',
				children: [
					{ label: '男', value: '1', type: 1 },
					{ label: '女', value: '2', type: 1 },
				],
			},
		];
		store.setFromBootstrap(data);
		expect(store.data.gender[0].value).toBe(1);
		expect(typeof store.data.gender[0].value).toBe('number');
		expect(store.data.gender[1].value).toBe(2);
	});

	it('converts_type_6_value_to_boolean_true', () => {
		const store = DictionaryStore();
		const data = [
			{
				value: 'status',
				children: [
					{ label: '启用', value: 'true', type: 6 },
					{ label: '禁用', value: 'false', type: 6 },
				],
			},
		];
		store.setFromBootstrap(data);
		expect(store.data.status[0].value).toBe(true);
		expect(typeof store.data.status[0].value).toBe('boolean');
		expect(store.data.status[1].value).toBe(false);
	});

	it('leaves_non_matching_types_as_string', () => {
		const store = DictionaryStore();
		const data = [
			{
				value: 'colors',
				children: [
					{ label: 'Red', value: 'red', type: 2 },
					{ label: 'Green', value: 'green', type: 99 },
				],
			},
		];
		store.setFromBootstrap(data);
		expect(store.data.colors[0].value).toBe('red');
		expect(store.data.colors[1].value).toBe('green');
	});

	it('sets_multiple_dictionary_keys', () => {
		const store = DictionaryStore();
		const data = [
			{ value: 'dict_a', children: [{ label: 'A1', value: 'a1', type: 0 }] },
			{ value: 'dict_b', children: [{ label: 'B1', value: '1', type: 1 }] },
		];
		store.setFromBootstrap(data);
		expect(Object.keys(store.data)).toEqual(['dict_a', 'dict_b']);
		expect(store.data.dict_a[0].value).toBe('a1');
		expect(store.data.dict_b[0].value).toBe(1);
	});
});

describe('BUTTON_VALUE_TO_COLOR_MAPPING', () => {
	it('maps_numeric_and_boolean_status', () => {
		expect(BUTTON_VALUE_TO_COLOR_MAPPING[1]).toBe('success');
		expect(BUTTON_VALUE_TO_COLOR_MAPPING[true]).toBe('success');
		expect(BUTTON_VALUE_TO_COLOR_MAPPING[0]).toBe('danger');
		expect(BUTTON_VALUE_TO_COLOR_MAPPING[false]).toBe('danger');
	});

	it('maps_action_strings', () => {
		expect(BUTTON_VALUE_TO_COLOR_MAPPING.Search).toBe('warning');
		expect(BUTTON_VALUE_TO_COLOR_MAPPING.Update).toBe('primary');
		expect(BUTTON_VALUE_TO_COLOR_MAPPING.Create).toBe('success');
		expect(BUTTON_VALUE_TO_COLOR_MAPPING.Retrieve).toBe('info');
		expect(BUTTON_VALUE_TO_COLOR_MAPPING.Delete).toBe('danger');
	});
});

describe('getButtonSettings', () => {
	it('uses_mapped_color_when_not_provided', () => {
		const result = getButtonSettings([
			{ label: '新增', value: 'Create' },
			{ label: '删除', value: 'Delete' },
		]);
		expect(result[0].color).toBe('success');
		expect(result[1].color).toBe('danger');
	});

	it('uses_explicit_color_when_provided', () => {
		const result = getButtonSettings([
			{ label: '自定义', value: 'Custom', color: 'purple' },
		]);
		expect(result[0].color).toBe('purple');
	});

	it('preserves_label_and_value', () => {
		const result = getButtonSettings([
			{ label: '查询', value: 'Search' },
		]);
		expect(result[0].label).toBe('查询');
		expect(result[0].value).toBe('Search');
		expect(result[0].color).toBe('warning');
	});
});

describe('useDeptInfoStore.getParentDeptById', () => {
	beforeEach(() => setActivePinia(createPinia()));

	it('returns_undefined_for_unknown_id', async () => {
		const store = useDeptInfoStore();
		store._processDeptData([
			{ id: 1, name: '公司', parent: null },
		]);
		const result = await store.getParentDeptById(999);
		expect(result).toBeUndefined();
	});

	it('finds_immediate_parent_for_child_node', async () => {
		const store = useDeptInfoStore();
		const data = [
			{ id: 1, name: '总部', parent: null },
			{ id: 2, name: '技术部', parent: 1 },
			{ id: 3, name: '产品部', parent: 1 },
			{ id: 4, name: '前端组', parent: 2 },
		];
		store._processDeptData(data);
		const result = await store.getParentDeptById(4);
		expect(result.parent.id).toBe(2);
		expect(result.parent.name).toBe('技术部');
		expect(result.item.id).toBe(4);
		expect(result.item.name).toBe('前端组');
	});

	it('finds_root_level_dept_has_null_parent', async () => {
		const store = useDeptInfoStore();
		const data = [
			{ id: 1, name: '总部', parent: null },
			{ id: 2, name: '技术部', parent: 1 },
		];
		store._processDeptData(data);
		const result = await store.getParentDeptById(1);
		expect(result).toBeDefined();
		expect(result.parent).toBeNull();
		expect(result.item.id).toBe(1);
	});

	it('finds_grandparent_is_not_returned_for_grandchild', async () => {
		const store = useDeptInfoStore();
		const data = [
			{ id: 1, name: '公司', parent: null },
			{ id: 2, name: '技术中心', parent: 1 },
			{ id: 3, name: '前端组', parent: 2 },
		];
		store._processDeptData(data);
		const result = await store.getParentDeptById(3);
		expect(result.parent.id).toBe(2);
		expect(result.parent.name).toBe('技术中心');
		expect(result.item.id).toBe(3);
	});

	it('exposes_full_path_nodes', async () => {
		const store = useDeptInfoStore();
		const data = [
			{ id: 1, name: '公司', parent: null },
			{ id: 2, name: '技术中心', parent: 1 },
			{ id: 3, name: '前端组', parent: 2 },
		];
		store._processDeptData(data);
		const result = await store.getParentDeptById(3);
		expect(result.nodes).toBeDefined();
		expect(result.nodes.length).toBe(3);
		expect(result.nodes[0].id).toBe(1);
		expect(result.nodes[1].id).toBe(2);
		expect(result.nodes[2].id).toBe(3);
	});
});