#!/usr/bin/env python3
"""Reapply WFL 4 patches with correct anchors, in a single atomic pass."""

import pathlib

WFL = pathlib.Path("/media/jwj/TOSHIBA EXT/dev/taurus-stack-c/taurus-web/src/views/taurus/workflow/WorkflowList.vue")
content = WFL.read_text(encoding='utf-8')

# Show debug info about whitespace surrounding target anchors
def context_find(src: str, needle: str, label: str):
    idx = src.find(needle)
    assert idx != -1, f"Cannot find: {label}"
    start = max(0, idx - 5)
    end = min(len(src), idx + len(needle) + 5)
    snippet = repr(src[start:end])
    print(f"  · anchor '{label}' found @{idx}: {snippet[:120]}")
    return idx

# 1) Top approval center button — capture its exact indentation (mix of tabs/spaces).
P1_OLD = """				<el-button v-if="hasFeature('WORKFLOW_APPROVAL_FLOW')" native-type="button" type="warning" @click="goApproveCenter">
					{{ t('message.pages.workflowList.wlApprovalCenter') }}
					<el-badge :value="stats.pending_approve" :hidden="!stats.pending_approve" class="approve-badge" />
				</el-button>"""
context_find(content, P1_OLD, "top approval btn")
P1_NEW = """				<el-button native-type="button" type="warning"
					:disabled="!hasFeature('WORKFLOW_APPROVAL_FLOW')"
					:title="!hasFeature('WORKFLOW_APPROVAL_FLOW') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
					@click="onApprovalCenterBtnClick">
					{{ t('message.pages.workflowList.wlApprovalCenter') }}
					<el-badge :value="stats.pending_approve" :hidden="!stats.pending_approve || !hasFeature('WORKFLOW_APPROVAL_FLOW')" class="approve-badge" />
				</el-button>"""
content = content.replace(P1_OLD, P1_NEW)
print("  ✓ Patch 1 done — top approval center button: v-if → disabled gate")

# 2) Approval stat card
P2_OLD = """				<div v-if="hasFeature('WORKFLOW_APPROVAL_FLOW')" class="stat-card">
					<div class="stat-num stat-orange">{{ stats.pending_approve }}</div>
					<div class="stat-label">{{ t('message.pages.workflowList.wlStatPendingApprove') }}</div>
				</div>"""
context_find(content, P2_OLD, "approval stat card")
P2_NEW = """				<div class="stat-card ee-gate-card"
					 :class="{ 'is-ee-gate': !hasFeature('WORKFLOW_APPROVAL_FLOW') }"
					 :title="!hasFeature('WORKFLOW_APPROVAL_FLOW') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
					 @click="onApprovalStatCardClick">
					<div class="stat-num stat-orange">{{ hasFeature('WORKFLOW_APPROVAL_FLOW') ? stats.pending_approve : 0 }}</div>
					<div class="stat-label">
						{{ t('message.pages.workflowList.wlStatPendingApprove') }}
						<el-tag v-if="!hasFeature('WORKFLOW_APPROVAL_FLOW')" size="small" type="warning" effect="plain" style="margin-left:4px;">EE</el-tag>
					</div>
				</div>"""
content = content.replace(P2_OLD, P2_NEW)
print("  ✓ Patch 2 done — pending-approval stat card: v-if → always-render greyed")

# 3) Helpers + handlers
P3_OLD = "const viewRecord = (row: any) => router.push(`/workflow/record?flowId=${row.id}`);\nconst goApproveCenter = () => router.push('/workflow/approval');\n\n// Publish workflow"
context_find(content, P3_OLD, "viewRecord + goApproveCenter combo")
P3_NEW = """const viewRecord = (row: any) => router.push(`/workflow/record?flowId=${row.id}`);

// ---------- EE 升级拦截通用 helpers ----------
const eeT = (key: string, fallback: string) => {
	const { t: tl } = useI18n();
	try {
		const v = tl(`message.pages.edition.${key}`);
		if (typeof v === 'string' && v && v !== `message.pages.edition.${key}`) return v;
	} catch (_e) { /* noop */ }
	return fallback;
};
const triggerEeUpgrade = (code: string, customDesc?: string) => {
	ElMessageBox.confirm(
		customDesc || eeT('enterpriseOnlyDesc', '该功能仅在 Taurus Ops 企业版中提供。升级到企业版即可解锁审批流、工作流、知识工单等全部高级能力。'),
		eeT('enterpriseOnlyTitle', '企业版专属功能'),
		{
			confirmButtonText: eeT('upgradeAction', '立即升级'),
			cancelButtonText: eeT('dismiss', '稍后再说'),
			type: 'info',
			showCancelButton: true,
			closeOnClickModal: true,
		}
	).then(() => {
		window.dispatchEvent(new CustomEvent('taurus:edition-upgrade', { detail: { code } }));
	}).catch(() => { /* 用户取消 */ });
};

const goApproveCenter = () => router.push('/workflow/approval');
// 顶部「审批中心」按钮：EE 正常跳转 / CE 弹升级提醒
const onApprovalCenterBtnClick = () => {
	if (hasFeature('WORKFLOW_APPROVAL_FLOW')) {
		goApproveCenter();
		return;
	}
	triggerEeUpgrade('WORKFLOW_APPROVAL_FLOW');
};
// 统计卡「待审批」：EE 正常跳转审批中心 / CE 弹升级提醒
const onApprovalStatCardClick = () => {
	if (hasFeature('WORKFLOW_APPROVAL_FLOW')) {
		goApproveCenter();
		return;
	}
	triggerEeUpgrade('WORKFLOW_APPROVAL_FLOW');
};

// Publish workflow"""
content = content.replace(P3_OLD, P3_NEW)
print("  ✓ Patch 3 done — helpers + 2 handlers")

# 4) CSS — insert ONLY if not already present (guard double-inclusion because
#    _patch_wfl_css.py may have already run)
EE_GATE_MARKER = "/* ======== EE Gate 卡片置灰样式 ======== */"
if EE_GATE_MARKER not in content:
    idx = content.rfind("</style>")
    assert idx != -1, "no </style> tag"
    NEW_CSS = """
/* ======== EE Gate 卡片置灰样式 ======== */
.ee-gate-card.is-ee-gate {
  cursor: not-allowed;
  position: relative;
  filter: grayscale(90%) opacity(0.65);
  background: repeating-linear-gradient(45deg, #fafafa, #fafafa 8px, #f4f4f5 8px, #f4f4f5 16px) !important;
  box-shadow: none !important;

  &:hover { transform: none !important; }
  .stat-num { user-select: none; }
}
"""
    content = content[:idx] + NEW_CSS + content[idx:]
    print("  ✓ Patch 4 done — ee-gate-card CSS appended")
else:
    print("  · Patch 4 skipped — CSS already present")

WFL.write_text(content, encoding='utf-8')
print(f"\n✓ All WFL patches done, file size={len(content)} bytes")