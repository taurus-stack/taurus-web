import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import useHostStore from '../../src/stores/taurus/host';
import useRecordStore from '../../src/stores/taurus/record';
import useTemplateStore from '../../src/stores/taurus/template';
import useWorkflowStore from '../../src/stores/taurus/workflow';

vi.mock('/@/api/taurus/host/api', () => ({
	GetList: vi.fn(),
	GetObj: vi.fn(),
	AddObj: vi.fn(),
	UpdateObj: vi.fn(),
	DelObj: vi.fn(),
}));

vi.mock('/@/api/taurus/record', () => ({
	getList: vi.fn(),
	getObj: vi.fn(),
	addObj: vi.fn(),
	updateObj: vi.fn(),
	delObj: vi.fn(),
}));

vi.mock('/@/api/taurus/template/api', () => ({
	GetList: vi.fn(),
	GetObj: vi.fn(),
	AddObj: vi.fn(),
	UpdateObj: vi.fn(),
	DelObj: vi.fn(),
}));

vi.mock('/@/api/taurus/workflow/api', () => ({
	GetList: vi.fn(),
	GetObj: vi.fn(),
	AddObj: vi.fn(),
	UpdateObj: vi.fn(),
	DelObj: vi.fn(),
	GetSteps: vi.fn(),
	AddStep: vi.fn(),
	UpdateStep: vi.fn(),
	DeleteStep: vi.fn(),
}));

import {
	GetList as HostGetList,
	GetObj as HostGetObj,
	AddObj as HostAddObj,
	UpdateObj as HostUpdateObj,
	DelObj as HostDelObj,
} from '/@/api/taurus/host/api';
import {
	getList as RecordGetList,
	getObj as RecordGetObj,
	addObj as RecordAddObj,
	updateObj as RecordUpdateObj,
	delObj as RecordDelObj,
} from '/@/api/taurus/record';
import {
	GetList as TemplateGetList,
	GetObj as TemplateGetObj,
	AddObj as TemplateAddObj,
	UpdateObj as TemplateUpdateObj,
	DelObj as TemplateDelObj,
} from '/@/api/taurus/template/api';
import {
	GetList as WfGetList,
	GetObj as WfGetObj,
	AddObj as WfAddObj,
	UpdateObj as WfUpdateObj,
	DelObj as WfDelObj,
	GetSteps,
	AddStep,
	UpdateStep,
	DeleteStep,
} from '/@/api/taurus/workflow/api';

beforeEach(() => {
	setActivePinia(createPinia());
	vi.clearAllMocks();
});

describe('taurus/host store', () => {
	it('initializes_default_state', () => {
		const store = useHostStore();
		expect(store.host_list).toEqual([]);
		expect(store.host_list_total).toBe(0);
		expect(store.host_list_loading).toBe(false);
		expect(store.host_list_query.page).toBe(1);
		expect(store.host_list_query.limit).toBe(20);
		expect(store.host_list_query.keyword).toBe('');
	});

	it('getList_updates_list_and_total_then_toggles_loading', async () => {
		const store = useHostStore();
		(HostGetList as any).mockResolvedValue({
			data: { results: [{ id: 1, host_name: 'node-1', host_ip: '10.0.0.1' }], count: 42 },
		});
		const loadingSeq: boolean[] = [];
		const unwatch = store.$subscribe((_m, state) => {
			loadingSeq.push(state.host_list_loading);
		});
		await store.getList({ page: 1 });
		unwatch();
		expect(HostGetList).toHaveBeenCalledWith({ page: 1 });
		expect(store.host_list.length).toBe(1);
		expect(store.host_list[0].host_name).toBe('node-1');
		expect(store.host_list_total).toBe(42);
		expect(store.host_list_loading).toBe(false);
		expect(loadingSeq[0]).toBe(true);
	});

	it('getObj_addObj_updateObj_delObj_proxy_through_api', async () => {
		const store = useHostStore();
		(HostGetObj as any).mockResolvedValue({ data: { id: 5 } });
		(HostAddObj as any).mockResolvedValue({ data: { id: 99 } });
		(HostUpdateObj as any).mockResolvedValue({ data: { id: 100, ok: true } });
		(HostDelObj as any).mockResolvedValue({ data: { ok: true } });

		const r1 = await store.getObj(5);
		expect(r1.data.id).toBe(5);
		const r2 = await store.addObj({ name: 'x' });
		expect((HostAddObj as any).mock.calls[0][0]).toEqual({ name: 'x' });
		expect(r2.data.id).toBe(99);
		const r3 = await store.updateObj({ id: 100 });
		expect(r3.data.ok).toBe(true);
		const r4 = await store.delObj(1);
		expect(r4.data.ok).toBe(true);
		expect(HostDelObj).toHaveBeenCalledWith(1);
	});
});

describe('taurus/record store', () => {
	it('initializes_default_state', () => {
		const store = useRecordStore();
		expect(store.record_list).toEqual([]);
		expect(store.record_list_total).toBe(0);
		expect(store.record_list_loading).toBe(false);
		expect(store.record_list_page).toBe(1);
		expect(store.record_list_page_size).toBe(10);
		expect(store.record_list_sort_by).toBe('id');
		expect(store.record_list_sort_order).toBe('descending');
	});

	it('getList_updates_state_and_returns_response', async () => {
		const store = useRecordStore();
		const fakeResp = { data: { results: [{ id: 1, name: 'r1' }], count: 5 } };
		(RecordGetList as any).mockResolvedValue(fakeResp);
		const resp = await store.getList({ page: 2 });
		expect(RecordGetList).toHaveBeenCalledWith({ page: 2 });
		expect(store.record_list[0].id).toBe(1);
		expect(store.record_list_total).toBe(5);
		expect(store.record_list_loading).toBe(false);
		expect(resp).toBe(fakeResp);
	});

	it('crud_proxy_methods', async () => {
		const store = useRecordStore();
		(RecordGetObj as any).mockResolvedValue({ id: 1 });
		(RecordAddObj as any).mockResolvedValue({ id: 2 });
		(RecordUpdateObj as any).mockResolvedValue({ id: 3 });
		(RecordDelObj as any).mockResolvedValue({ ok: true });
		expect(await store.getObj(1)).toEqual({ id: 1 });
		expect(await store.addObj({ x: 1 })).toEqual({ id: 2 });
		expect(await store.updateObj({ x: 2 })).toEqual({ id: 3 });
		expect(await store.delObj(9)).toEqual({ ok: true });
	});
});

describe('taurus/template store', () => {
	it('initializes_default_state', () => {
		const store = useTemplateStore();
		expect(store.template_id).toBe(0);
		expect(store.template_name).toBe('');
		expect(store.script_content).toBe('');
		expect(store.script_type).toBe('');
		expect(store.timeout).toBe(0);
		expect(store.share).toBe(false);
		expect(store.template_list).toEqual([]);
		expect(store.template_list_loading).toBe(false);
	});

	it('getList_updates_template_list', async () => {
		const store = useTemplateStore();
		(TemplateGetList as any).mockResolvedValue({
			data: { results: [{ id: 1, name: 'tpl-1' }], count: 3 },
		});
		await store.getList({ page: 1 });
		expect(store.template_list.length).toBe(1);
		expect(store.template_list_total).toBe(3);
		expect(store.template_list_loading).toBe(false);
	});

	it('crud_proxy_methods', async () => {
		const store = useTemplateStore();
		(TemplateGetObj as any).mockResolvedValue({ id: 10 });
		(TemplateAddObj as any).mockResolvedValue({ id: 11 });
		(TemplateUpdateObj as any).mockResolvedValue({ ok: true });
		(TemplateDelObj as any).mockResolvedValue({ deleted: true });
		expect((await store.getObj(10)).id).toBe(10);
		expect((await store.addObj({})).id).toBe(11);
		expect((await store.updateObj({ id: 1 })).ok).toBe(true);
		expect((await store.delObj(1)).deleted).toBe(true);
	});
});

describe('taurus/workflow store', () => {
	it('initializes_default_state', () => {
		const store = useWorkflowStore();
		expect(store.workflow_list).toEqual([]);
		expect(store.workflow_list_total).toBe(0);
		expect(store.current_workflow).toBeNull();
		expect(store.current_steps).toEqual([]);
	});

	it('getList_updates_state_and_returns', async () => {
		const store = useWorkflowStore();
		const fake = { data: { results: [{ id: 1, name: 'wf1' }], count: 12 } };
		(WfGetList as any).mockResolvedValue(fake);
		const res = await store.getList({ page: 1 });
		expect(store.workflow_list[0].name).toBe('wf1');
		expect(store.workflow_list_total).toBe(12);
		expect(store.workflow_list_loading).toBe(false);
		expect(res).toBe(fake);
	});

	it('getSteps_updates_current_steps', async () => {
		const store = useWorkflowStore();
		const steps = [{ id: 1, name: 'S1' }, { id: 2, name: 'S2' }];
		(GetSteps as any).mockResolvedValue({ data: steps });
		const r = await store.getSteps(5);
		expect(GetSteps).toHaveBeenCalledWith(5);
		expect(store.current_steps).toEqual(steps);
		expect(r.data).toEqual(steps);
	});

	it('crud_and_step_proxy_methods', async () => {
		const store = useWorkflowStore();
		(WfGetObj as any).mockResolvedValue({ id: 1 });
		(WfAddObj as any).mockResolvedValue({ id: 2 });
		(WfUpdateObj as any).mockResolvedValue({ ok: true });
		(WfDelObj as any).mockResolvedValue({ removed: true });
		(AddStep as any).mockResolvedValue({ stepId: 3 });
		(UpdateStep as any).mockResolvedValue({ updated: true });
		(DeleteStep as any).mockResolvedValue({ deleted: true });

		expect((await store.getObj(1)).id).toBe(1);
		expect((await store.addObj({})).id).toBe(2);
		expect((await store.updateObj({ id: 1 })).ok).toBe(true);
		expect((await store.delObj(1)).removed).toBe(true);
		expect((await store.addStep(5, { x: 1 })).stepId).toBe(3);
		expect((await store.updateStep(5, { x: 2 })).updated).toBe(true);
		expect((await store.deleteStep(5, 7)).deleted).toBe(true);
	});
});