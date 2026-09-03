#!/usr/bin/env python3
"""Feature-gate v-if → "greyed out + upgrade prompt" migration.

High-priority patches (grid/card rows that leave blank gaps):

  1. home/index.vue L572 wf-stats-section: v-if="hasFeature('WORKFLOW_DAG_ENGINE')"
     → always render; grey out with filter + ::after capture click → trigger upgrade dialog.

  2. WorkflowList.vue L47 stat-card row 3rd card (pending_approve): v-if WORKFLOW_APPROVAL_FLOW
     → always render (greyed-out 0 value + click interceptor to upgrade).

  3. WorkflowList.vue L23 top button "审批中心": v-if WORKFLOW_APPROVAL_FLOW
     → convert to v-feature.disable pattern (greyed button + upgrade prompt on click).

Pattern reuse: just like charts-row 4th card solution already present in home/index.vue.

Adds two helper composables per file so logic isn't duplicated:
  eeGateT(key, fallback)   — wraps i18n edition.* lookup with fallback
  triggerEeUpgrade(code)   — shows ElMessageBox.confirm + dispatches taurus:edition-upgrade
"""

import pathlib

def apply(p: pathlib.Path, patches: list[tuple[str, str, str]]):
    content = p.read_text(encoding='utf-8')
    for old, new, label in patches:
        assert old in content, f"[{p.name}] Pattern for '{label}' NOT FOUND:\n{old[:200]}\n"
        content = content.replace(old, new)
        print(f"  ✓ [{p.name}] {label}")
    p.write_text(content, encoding='utf-8')
    return content

HOME = pathlib.Path("/media/jwj/TOSHIBA EXT/dev/taurus-stack-c/taurus-web/src/views/system/home/index.vue")
WFL = pathlib.Path("/media/jwj/TOSHIBA EXT/dev/taurus-stack-c/taurus-web/src/views/taurus/workflow/WorkflowList.vue")

print("=== home/index.vue patches (wf-stats-section) ===")

# ---------------- Patch HOME-1: template — remove v-if on wf-stats-section, gate the row ----------------
HOME_P1_OLD = """        <div class="wf-stats-section" v-if="hasFeature('WORKFLOW_DAG_ENGINE')">
            <div class="section-title">{{ T('workflow.sectionTitle') }}</div>
            <div class="wf-stats-row">"""
HOME_P1_NEW = """        <div class="wf-stats-section"
             :class="{ 'ee-gate-section': !hasFeature('WORKFLOW_DAG_ENGINE') }"
             :title="!hasFeature('WORKFLOW_DAG_ENGINE') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
             @click="handleWfSectionClick">
            <div class="section-title">{{ T('workflow.sectionTitle') }}</div>
            <div class="wf-stats-row">"""

# ---------------- Patch HOME-2: script — add handleWfSectionClick + ee helpers near handleWfCardClick ----------------
HOME_P2_OLD = """// 第 4 张卡片：EE 跳转工作流列表 / CE 弹升级提醒
const handleWfCardClick = () => {
    if (hasFeature('WORKFLOW_DAG_ENGINE')) {
        goWfList();
        return;
    }
    // CE: 与 v-feature.disable 一致的 ElMessageBox 弹窗
    const tKey = (key: string, fallback: string) => {
        try {
            const v = t(`message.pages.edition.${key}`);
            if (typeof v === 'string' && v && v !== `message.pages.edition.${key}`) return v;
        } catch (_e) { /* noop */ }
        return fallback;
    };
    ElMessageBox.confirm(
        tKey('enterpriseOnlyDesc', '该功能仅在 Taurus Ops 企业版中提供。升级到企业版即可解锁工作流引擎、DAG 编排、审批流、工单系统等全部高级能力。'),
        tKey('enterpriseOnlyTitle', '企业版专属功能'),
        {
            confirmButtonText: tKey('upgradeAction', '立即升级'),
            cancelButtonText: tKey('dismiss', '稍后再说'),
            type: 'info',
            showCancelButton: true,
            closeOnClickModal: true,
        }
    ).then(() => {
        window.dispatchEvent(
            new CustomEvent('taurus:edition-upgrade', { detail: { code: 'WORKFLOW_DAG_ENGINE' } })
        );
    }).catch(() => { /* 用户取消 */ });
};"""
HOME_P2_NEW = """// ---------- EE 升级拦截通用 helpers ----------
const eeT = (key: string, fallback: string) => {
    try {
        const v = t(`message.pages.edition.${key}`);
        if (typeof v === 'string' && v && v !== `message.pages.edition.${key}`) return v;
    } catch (_e) { /* noop */ }
    return fallback;
};
const triggerEeUpgrade = (code: string, customDesc?: string) => {
    ElMessageBox.confirm(
        customDesc || eeT('enterpriseOnlyDesc', '该功能仅在 Taurus Ops 企业版中提供。升级到企业版即可解锁全部高级能力。'),
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

// 第 4 张卡片：EE 跳转工作流列表 / CE 弹升级提醒
const handleWfCardClick = () => {
    if (hasFeature('WORKFLOW_DAG_ENGINE')) {
        goWfList();
        return;
    }
    triggerEeUpgrade('WORKFLOW_DAG_ENGINE');
};

// 工作流统计 6 卡片区块：EE 跳转工作流列表 / CE 弹升级提醒
const handleWfSectionClick = (e: MouseEvent) => {
    if (hasFeature('WORKFLOW_DAG_ENGINE')) return;
    // 由 ee-gate-section::after 捕获点击，e.target 始终是父 div
    e.stopPropagation();
    triggerEeUpgrade('WORKFLOW_DAG_ENGINE');
};"""

# ---------------- Patch HOME-3: style — add ee-gate-section grey mask ----------------
HOME_P3_OLD = """.chart-container {
      height: 220px;
      width: 100%;
    }
  }
}"""
HOME_P3_NEW = """.chart-container {
      height: 220px;
      width: 100%;
    }
  }
}

// ======== 统一 EE 功能区块置灰样式（原元素保留，::before 灰化 + ::after 捕获点击）========
.ee-gate-section {
  cursor: not-allowed;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 8px;
    backdrop-filter: grayscale(90%);
    background: rgba(255, 255, 255, 0.4);
    pointer-events: none;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    cursor: not-allowed;
    z-index: 2;
  }

  &:hover {
    // 阻止内部 card :hover transform 闪烁
    > * .wf-stat-card, > * .stat-card, > * .chart-card {
      transform: none !important;
    }
  }
}"""

apply(HOME, [
    (HOME_P1_OLD, HOME_P1_NEW, "wf-stats-section gate: always render"),
    (HOME_P2_OLD, HOME_P2_NEW, "add eeT()/triggerEeUpgrade() helpers + handleWfSectionClick"),
    (HOME_P3_OLD, HOME_P3_NEW, "add .ee-gate-section unified grey-mask CSS"),
])

print("\n=== WorkflowList.vue patches (stat card + top button) ===")

# ---------------- Patch WFL-1: top 审批中心按钮 v-if → v-feature.disable ----------------
WFL_P1_OLD = """<el-button v-if="hasFeature('WORKFLOW_APPROVAL_FLOW')" native-type="button" type="warning" @click="goApproveCenter">
					{{ t('message.pages.workflowList.wlApprovalCenter') }}
					<el-badge :value="stats.pending_approve" :hidden="!stats.pending_approve" class="approve-badge" />
				</el-button>"""
WFL_P1_NEW = """<el-button native-type="button" type="warning"
					:disabled="!hasFeature('WORKFLOW_APPROVAL_FLOW')"
					:title="!hasFeature('WORKFLOW_APPROVAL_FLOW') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
					@click="onApprovalCenterBtnClick">
					{{ t('message.pages.workflowList.wlApprovalCenter') }}
					<el-badge :value="stats.pending_approve" :hidden="!stats.pending_approve || !hasFeature('WORKFLOW_APPROVAL_FLOW')" class="approve-badge" />
				</el-button>"""

# ---------------- Patch WFL-2: stat card row 3rd (pending approval) v-if → always render, greyed ----------------
WFL_P2_OLD = """<div v-if="hasFeature('WORKFLOW_APPROVAL_FLOW')" class="stat-card">
					<div class="stat-num stat-orange">{{ stats.pending_approve }}</div>
					<div class="stat-label">{{ t('message.pages.workflowList.wlStatPendingApprove') }}</div>
				</div>"""
WFL_P2_NEW = """<div class="stat-card ee-gate-card"
					 :class="{ 'is-ee-gate': !hasFeature('WORKFLOW_APPROVAL_FLOW') }"
					 :title="!hasFeature('WORKFLOW_APPROVAL_FLOW') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
					 @click="onApprovalStatCardClick">
					<div class="stat-num stat-orange">{{ hasFeature('WORKFLOW_APPROVAL_FLOW') ? stats.pending_approve : 0 }}</div>
					<div class="stat-label">
						{{ t('message.pages.workflowList.wlStatPendingApprove') }}
						<el-tag v-if="!hasFeature('WORKFLOW_APPROVAL_FLOW')" size="small" type="warning" effect="plain" style="margin-left:4px;">EE</el-tag>
					</div>
				</div>"""

# ---------------- Patch WFL-3: add import ElMessageBox if needed (should already exist per grep) ----------------
# Per grep, already have: import { ElMessage, ElMessageBox, ElNotification, ElButton } from 'element-plus';
# ---------------- Patch WFL-4: add onApprovalCenterBtnClick + onApprovalStatCardClick + ee helpers ----------------
# Find end of imports (setup script region) — insert handlers near existing goApproveCenter
WFL_P4_OLD = """const goApproveCenter = () => router.push({ path: '/workflow/approve' });"""
WFL_P4_NEW = """// ---------- EE 升级拦截通用 helpers ----------
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

const goApproveCenter = () => router.push({ path: '/workflow/approve' });
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
};"""

# ---------------- Patch WFL-5: add .ee-gate-card CSS (at bottom of <style scoped>) ----------------
# find the style block end — append before final </style>
WFL_P5_OLD = """/* ====== Scrollbar polish for category tree ====== */"""   # common pattern
WFL_P5_NEW = """.ee-gate-card.is-ee-gate {
  cursor: not-allowed;
  position: relative;
  filter: grayscale(90%) opacity(0.65);
  background: repeating-linear-gradient(45deg, #fafafa, #fafafa 8px, #f4f4f5 8px, #f4f4f5 16px) !important;
  box-shadow: none !important;

  &:hover { transform: none !important; }
  .stat-num { user-select: none; }
}

/* ====== Scrollbar polish for category tree ====== */"""

apply(WFL, [
    (WFL_P1_OLD, WFL_P1_NEW, "top 审批中心 button: v-if → disabled + click gate"),
    (WFL_P2_OLD, WFL_P2_NEW, "stat card 待审批 card: v-if → always render greyed + EE tag"),
    (WFL_P4_OLD, WFL_P4_NEW, "add ee helpers + onApprovalCenterBtnClick + onApprovalStatCardClick"),
    (WFL_P5_OLD, WFL_P5_NEW, "append .ee-gate-card.is-ee-gate greyscale stripe style"),
])

print("\n✓ All high-priority grid/card-row gate migrations applied.")