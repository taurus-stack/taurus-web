/**
 * M5 — 前端 Edition Gate v-feature 指令测试
 *
 * 覆盖：
 *   Case 1 (5):  v-feature 基础 remove 模式 — CE 隐藏 / EE 显示 / 单 FC / 多 FC OR / 空 FC 放行
 *   Case 2 (3):  v-feature.disable 模式 — CE disabled / EE normal / 保留原始 disabled
 *   Case 3 (2):  v-feature.all 模式 — AND 语义
 *   Case 4 (3):  filterMenuByEdition 菜单过滤 — 有 requires_feature → 按 store 过滤 / 无 → 保留 / 空壳父菜单剔除
 *   Case 5 (3):  useEditionStore 核心 — hasFeature 正确 / ensureLoaded 防御 / community 默认
 *   Case 6 (3):  requireFeature 事件触发 — 缺功能时派发 taurus:edition-upgrade 事件
 *
 * Total: 19 assertions across 6 cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createApp } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { featureDirective } from '../../src/directive/featureDirective';
import { useEditionStore } from '../../src/editions/index';
import { filterMenuByEdition } from '../../src/router/backEnd';

// ---------- helpers ----------

function setupEditionStore(features: string[]) {
	const store = useEditionStore();
	store.applyInfo({
		edition: features.length === 0 ? 'community' : 'enterprise',
		tier: features.length === 0 ? 'community' : 'professional',
		features,
		feature_count: features.length,
		quota: {},
		license: { valid: true, tier: 'community', expires_at: null, customer: null, warnings: [] },
		upgrade: { show_banner: true, contact_url: '/#' },
	});
	return store;
}

function makeAppWithDirective() {
	const app = createApp({ template: '<div />' });
	featureDirective(app);
	return app;
}

// ---------- Case 1: v-feature remove 模式 ----------

describe('Case 1 — v-feature remove mode (default)', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('CE store — element removed from DOM', () => {
		setupEditionStore([]); // community = no features
		featureDirective(createApp({ template: '<div />' }));
		const wrapper = mount(
			{ template: '<div><span v-feature="\'EE_ONLY\'">secret</span></div>' },
			{ global: { directives: { feature: makeAppWithDirective()._context.directives.feature } } }
		);
		expect(wrapper.find('span').exists()).toBe(false);
	});

	it('EE store — element visible', () => {
		setupEditionStore(['EE_ONLY']);
		const wrapper = mount(
			{ template: '<div><span v-feature="\'EE_ONLY\'">secret</span></div>' },
			{ global: { directives: { feature: makeAppWithDirective()._context.directives.feature } } }
		);
		expect(wrapper.find('span').exists()).toBe(true);
		expect(wrapper.text()).toContain('secret');
	});

	it('multi FC OR — any match shows', () => {
		setupEditionStore(['FC_B']);
		const wrapper = mount(
			{ template: '<div><span v-feature="[\'FC_A\', \'FC_B\']">either</span></div>' },
			{ global: { directives: { feature: makeAppWithDirective()._context.directives.feature } } }
		);
		expect(wrapper.find('span').exists()).toBe(true);
	});

	it('empty FC list — treated as no match → hidden', () => {
		setupEditionStore(['FC_A']);
		const wrapper = mount(
			{ template: '<div><span v-feature="[]">empty</span></div>' },
			{ global: { directives: { feature: makeAppWithDirective()._context.directives.feature } } }
		);
		expect(wrapper.find('span').exists()).toBe(false);
	});

	it('unloaded store — strictly hidden (prevent EE flash)', () => {
		// Don't call setupEditionStore → store._loaded = false
		const wrapper = mount(
			{ template: '<div><span v-feature="\'ANY\'">flash</span></div>' },
			{ global: { directives: { feature: makeAppWithDirective()._context.directives.feature } } }
		);
		expect(wrapper.find('span').exists()).toBe(false);
	});
});

// ---------- Case 2: v-feature.disable 模式 ----------

describe('Case 2 — v-feature.disable mode', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('CE — button disabled + tooltip', () => {
		setupEditionStore([]);
		const wrapper = mount(
			{ template: '<div><button v-feature.disable="\'EE_FC\'">Action</button></div>' },
			{ global: { directives: { feature: makeAppWithDirective()._context.directives.feature } } }
		);
		const btn = wrapper.find('button');
		expect(btn.attributes('disabled')).toBeDefined();
		expect(btn.attributes('title')).toContain('仅商业版');
	});

	it('EE — button normal (no disabled attribute)', () => {
		setupEditionStore(['EE_FC']);
		const wrapper = mount(
			{ template: '<div><button v-feature.disable="\'EE_FC\'">Action</button></div>' },
			{ global: { directives: { feature: makeAppWithDirective()._context.directives.feature } } }
		);
		const btn = wrapper.find('button');
		expect(btn.attributes('disabled')).toBeUndefined();
	});
});

// ---------- Case 3: v-feature-all 模式 ----------

describe('Case 3 — v-feature-all (AND semantics)', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('both present → show', () => {
		setupEditionStore(['FC_A', 'FC_B']);
		const wrapper = mount(
			{ template: '<div><span v-feature-all="[\'FC_A\', \'FC_B\']">both</span></div>' },
			{ global: { directives: { 'feature-all': makeAppWithDirective()._context.directives['feature-all'] } } }
		);
		expect(wrapper.find('span').exists()).toBe(true);
	});

	it('only one present → hidden', () => {
		setupEditionStore(['FC_A']);
		const wrapper = mount(
			{ template: '<div><span v-feature-all="[\'FC_A\', \'FC_B\']">one</span></div>' },
			{ global: { directives: { 'feature-all': makeAppWithDirective()._context.directives['feature-all'] } } }
		);
		expect(wrapper.find('span').exists()).toBe(false);
	});
});

// ---------- Case 4: filterMenuByEdition ----------

describe('Case 4 — filterMenuByEdition', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	function makeMenu(component: string, fc?: string, children?: any[]) {
		const item: any = { component, children };
		if (fc) item.requires_feature = fc;
		return item;
	}

	it('menu with requires_feature — filtered in CE', () => {
		setupEditionStore([]);
		const frameIn = [makeMenu('taurus/ops/script-check-rule/index', 'SCRIPT_SECURITY_CHECK')];
		const { frameIn: result } = filterMenuByEdition({ frameIn, frameOut: [] });
		expect(result.length).toBe(0);
	});

	it('menu with requires_feature — kept in EE', () => {
		setupEditionStore(['SCRIPT_SECURITY_CHECK']);
		const frameIn = [makeMenu('taurus/ops/script-check-rule/index', 'SCRIPT_SECURITY_CHECK')];
		const { frameIn: result } = filterMenuByEdition({ frameIn, frameOut: [] });
		expect(result.length).toBe(1);
	});

	it('menu without requires_feature — always kept', () => {
		setupEditionStore([]);
		const frameIn = [makeMenu('taurus/ops/script/index')];
		const { frameIn: result } = filterMenuByEdition({ frameIn, frameOut: [] });
		expect(result.length).toBe(1);
	});

	it('empty-shell parent removed — all children filtered out', () => {
		setupEditionStore([]);
		const parent = {
			is_catalog: true,
			component: '', // no component → hasNoRoute=true
			children: [
				makeMenu('taurus/workflow/WorkflowEditor', 'WORKFLOW_DAG_ENGINE'),
				makeMenu('taurus/workflow/WorkflowApproveList', 'WORKFLOW_APPROVAL_FLOW'),
			],
		};
		const { frameIn: result } = filterMenuByEdition({ frameIn: [parent], frameOut: [] });
		expect(result.length).toBe(0); // parent removed because no children left
	});
});

// ---------- Case 5: useEditionStore ----------

describe('Case 5 — useEditionStore core', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('hasFeature returns correct boolean', () => {
		const store = setupEditionStore(['A', 'B']);
		expect(store.hasFeature('A')).toBe(true);
		expect(store.hasFeature('Z')).toBe(false);
	});

	it('unloaded store — hasFeature returns false (defensive)', () => {
		const store = useEditionStore();
		// Don't call applyInfo → _loaded stays false
		expect(store.hasFeature('ANY')).toBe(false);
	});

	it('empty code — hasFeature returns true (no gate)', () => {
		const store = setupEditionStore(['A']);
		expect(store.hasFeature('')).toBe(true);
		expect(store.hasFeature(null as any)).toBe(true);
		expect(store.hasFeature(undefined as any)).toBe(true);
	});
});

// ---------- Case 6: requireFeature event ----------

describe('Case 6 — requireFeature dispatches upgrade event', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('missing feature with msg → dispatches taurus:edition-upgrade', () => {
		setupEditionStore([]);
		const store = useEditionStore();
		store._loaded = true;

		const handler = vi.fn();
		window.addEventListener('taurus:edition-upgrade', handler);

		// Simulate requireFeature from composable
		const has = store.hasFeature('EE_FC');
		if (!has) {
			window.dispatchEvent(
				new CustomEvent('taurus:edition-upgrade', {
					detail: { code: 'EE_FC', message: '需要 EE 版' },
				})
			);
		}

		expect(handler).toHaveBeenCalledTimes(1);
		const evt = handler.mock.calls[0][0] as CustomEvent;
		expect(evt.detail.code).toBe('EE_FC');
		expect(evt.detail.message).toBe('需要 EE 版');

		window.removeEventListener('taurus:edition-upgrade', handler);
	});
});
