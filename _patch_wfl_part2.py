#!/usr/bin/env python3
"""Part 2 of WorkflowList.vue migration — finish 2 failed patches:
  - add ee helpers + handler functions
  - append .ee-gate-card CSS class before final `</style>`
"""

import pathlib

WFL = pathlib.Path("/media/jwj/TOSHIBA EXT/dev/taurus-stack-c/taurus-web/src/views/taurus/workflow/WorkflowList.vue")
content = WFL.read_text(encoding='utf-8')

# -------- Patch WFL-A: insert helpers + click handlers before `const goApproveCenter`... then --------
OLD_HELPERS_AT = "const viewRecord = (row: any) => router.push(`/workflow/record?flowId=${row.id}`);\nconst goApproveCenter = () => router.push('/workflow/approval');\n\n// Publish workflow"
NEW_HELPERS_AT = """const viewRecord = (row: any) => router.push(`/workflow/record?flowId=${row.id}`);

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

assert OLD_HELPERS_AT in content, "viewRecord + goApproveCenter anchor not found"
content = content.replace(OLD_HELPERS_AT, NEW_HELPERS_AT)
print("✓ [WorkflowList.vue] helpers + 2 EE gate handlers added")

# -------- Patch WFL-B: append .ee-gate-card CSS right before final `</style>` --------
OLD_CSS_END = """ }\n</style>"""
NEW_CSS_END = """ }

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
</style>"""

assert OLD_CSS_END in content, "style closing tag anchor not found"
content = content.replace(OLD_CSS_END, NEW_CSS_END)
print("✓ [WorkflowList.vue] ee-gate-card CSS appended")

WFL.write_text(content, encoding='utf-8')
print(f"\n✓ File written size={len(content)} bytes")