#!/usr/bin/env python3
"""Home approval-section & right-col migration — last 2 grid gate items."""

import pathlib

HOME = pathlib.Path("/media/jwj/TOSHIBA EXT/dev/taurus-stack-c/taurus-web/src/views/system/home/index.vue")
content = HOME.read_text(encoding='utf-8')

# ============= PATCH 1: approval-section outer v-if → always render greyed wrapper =============
P1_OLD = """        <div class="approval-section" v-if="hasFeature('SCRIPT_APPROVAL_FLOW') || hasFeature('WORKFLOW_APPROVAL_FLOW') || hasFeature('OPS_EXECUTION_APPROVAL')">
            <div class="section-title">{{ T('approval.sectionTitle') }}</div>
            <div class="approval-row">"""
P1_NEW = """        <div class="approval-section ee-gate-section"
             :class="{ 'is-ee-gate': !(hasFeature('SCRIPT_APPROVAL_FLOW') || hasFeature('WORKFLOW_APPROVAL_FLOW') || hasFeature('OPS_EXECUTION_APPROVAL')) }"
             :title="!(hasFeature('SCRIPT_APPROVAL_FLOW') || hasFeature('WORKFLOW_APPROVAL_FLOW') || hasFeature('OPS_EXECUTION_APPROVAL')) ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
             @click="handleApprovalSectionClick">
            <div class="section-title">{{ T('approval.sectionTitle') }}</div>
            <div class="approval-row">"""
assert P1_OLD in content, "approval-section outer v-if not found"
content = content.replace(P1_OLD, P1_NEW)
print("✓ approval-section outer gate applied")

# ============= PATCH 2: 5 inner approval cards — v-if → always render greyed (click per-card code) =============
def replace_card(old_code: str, feature_code: str, click_fn: str, go_fn: str, num_var: str):
    global content
    # The exact template pattern to replace
    P_OLD = f"""<div class="approval-card" v-if="hasFeature('{feature_code}')" @click="{go_fn}">"""
    if P_OLD not in content:
        print(f"  · SKIPPED card {feature_code} — pattern not found (maybe already patched?)")
        return
    P_NEW = f"""<div class="approval-card ee-gate-card"
                     :class="{{ 'is-ee-gate': !hasFeature('{feature_code}') }}"
                     :title="!hasFeature('{feature_code}') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                     @click="{click_fn}">"""
    content = content.replace(P_OLD, P_NEW)
    # Update the number var inside the card — show 0 in CE
    content = content.replace(
        f"<div class=\"approval-num approval-\">{{ {num_var} }}</div>",
        f"<div class=\"approval-num approval-\">{{ hasFeature('{feature_code}') ? {num_var} : 0 }}</div>",
        1  # only the first match in the block just replaced — safe
    )
    print(f"  ✓ card '{feature_code}' gated")

# Cards defined in page order (file lines 544-572):
replace_card("SCRIPT_APPROVAL_FLOW", "SCRIPT_APPROVAL_FLOW", "onApprovalScriptCardClick", "goApprovalScript", "scriptApprovalPending")
replace_card("WORKFLOW_APPROVAL_FLOW", "WORKFLOW_APPROVAL_FLOW", "onApprovalWfCardClick",       "goApprovalWf",       "wfApprovalPending")
replace_card("OPS_EXECUTION_APPROVAL", "OPS_EXECUTION_APPROVAL", "onApprovalScriptExecCardClick", "goApprovalScriptExec", "scriptExecApprovalPending")
replace_card("OPS_EXECUTION_APPROVAL (2)", "OPS_EXECUTION_APPROVAL", "onApprovalCommandExecCardClick", "goApprovalCommandExec", "commandExecApprovalPending")
# Need exact click fn name match for 4th card (command exec):
P_CMD_OLD = """<div class="approval-card" v-if="hasFeature('OPS_EXECUTION_APPROVAL')" @click="goApprovalCommandExec">"""
if P_CMD_OLD in content:
    P_CMD_NEW = """<div class="approval-card ee-gate-card"
                     :class="{ 'is-ee-gate': !hasFeature('OPS_EXECUTION_APPROVAL') }"
                     :title="!hasFeature('OPS_EXECUTION_APPROVAL') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                     @click="onApprovalCommandExecCardClick">"""
    content = content.replace(P_CMD_OLD, P_CMD_NEW)
    # Replace the num var line for THIS card — commandExecApprovalPending
    content = content.replace(
        "<div class=\"approval-num approval-cyan\">{{ commandExecApprovalPending }}</div>",
        "<div class=\"approval-num approval-cyan\">{{ hasFeature('OPS_EXECUTION_APPROVAL') ? commandExecApprovalPending : 0 }}</div>",
    )
    print("  ✓ card 'OPS_EXECUTION_APPROVAL cmd' gated")

# 5th card (wf exec approval)
P_WFEXEC_OLD = """<div class="approval-card" v-if="hasFeature('OPS_EXECUTION_APPROVAL')" @click="goApprovalWfExec">"""
if P_WFEXEC_OLD in content:
    P_WFEXEC_NEW = """<div class="approval-card ee-gate-card"
                     :class="{ 'is-ee-gate': !hasFeature('OPS_EXECUTION_APPROVAL') }"
                     :title="!hasFeature('OPS_EXECUTION_APPROVAL') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                     @click="onApprovalWfExecCardClick">"""
    content = content.replace(P_WFEXEC_OLD, P_WFEXEC_NEW)
    content = content.replace(
        "<div class=\"approval-num approval-purple\">{{ wfExecApprovalPending }}</div>",
        "<div class=\"approval-num approval-purple\">{{ hasFeature('OPS_EXECUTION_APPROVAL') ? wfExecApprovalPending : 0 }}</div>",
    )
    print("  ✓ card 'OPS_EXECUTION_APPROVAL wf' gated")

# ============= PATCH 3: right-col (定时任务) v-if → gate =============
P3_OLD = """            <div class="right-col" v-if="hasFeature('SCRIPT_TASK_UNIFIED')">"""
P3_NEW = """            <div class="right-col ee-gate-section"
                 :class="{ 'is-ee-gate': !hasFeature('SCRIPT_TASK_UNIFIED') }"
                 :title="!hasFeature('SCRIPT_TASK_UNIFIED') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                 @click="handleScheduleColClick">"""
assert P3_OLD in content, "right-col v-if not found"
content = content.replace(P3_OLD, P3_NEW)
print("✓ right-col (schedule) gate applied")

# ============= PATCH 4: Add per-card click handlers + 2 section click handlers after triggerEeUpgrade =============
P4_OLD = """// 工作流统计 6 卡片区块：EE 跳转工作流列表 / CE 弹升级提醒
const handleWfSectionClick = (e: MouseEvent) => {
    if (hasFeature('WORKFLOW_DAG_ENGINE')) return;
    // 由 ee-gate-section::after 捕获点击，e.target 始终是父 div
    e.stopPropagation();
    triggerEeUpgrade('WORKFLOW_DAG_ENGINE');
};"""
P4_NEW = P4_OLD + """

// ---------- Home Approval Section 5 cards - individual gates ----------
function _guardFeature(code: string, goFn: () => void, evt?: MouseEvent): void {
    if (hasFeature(code)) {
        goFn();
        return;
    }
    if (evt) evt.stopPropagation();
    triggerEeUpgrade(code);
}
const onApprovalScriptCardClick = (e?: MouseEvent) => _guardFeature('SCRIPT_APPROVAL_FLOW',       goApprovalScript,       e);
const onApprovalWfCardClick     = (e?: MouseEvent) => _guardFeature('WORKFLOW_APPROVAL_FLOW',     goApprovalWf,           e);
const onApprovalScriptExecCardClick  = (e?: MouseEvent) => _guardFeature('OPS_EXECUTION_APPROVAL', goApprovalScriptExec,   e);
const onApprovalCommandExecCardClick = (e?: MouseEvent) => _guardFeature('OPS_EXECUTION_APPROVAL', goApprovalCommandExec,  e);
const onApprovalWfExecCardClick      = (e?: MouseEvent) => _guardFeature('OPS_EXECUTION_APPROVAL', goApprovalWfExec,       e);
// Outer approval section background click — only triggers if user clicks the gap
const handleApprovalSectionClick = (e: MouseEvent) => {
    if (hasFeature('SCRIPT_APPROVAL_FLOW') || hasFeature('WORKFLOW_APPROVAL_FLOW') || hasFeature('OPS_EXECUTION_APPROVAL')) return;
    // CE: 所有审批都没有 → 弹工作流审批 code 做兜底升级提示
    e.stopPropagation();
    triggerEeUpgrade('WORKFLOW_APPROVAL_FLOW');
};

// ---------- Home 我的定时任务 right-col gate ----------
const goSchedule = () => router.push('/ops/schedule');
const handleScheduleColClick = (e: MouseEvent) => {
    if (hasFeature('SCRIPT_TASK_UNIFIED')) return;
    e.stopPropagation();
    triggerEeUpgrade('SCRIPT_TASK_UNIFIED');
};"""

assert P4_OLD in content, "handleWfSectionClick anchor for new handlers not found"
content = content.replace(P4_OLD, P4_NEW)
print("✓ added 5 per-card approval handlers + schedule col handler")

# ============= PATCH 5: CSS — extend existing .ee-gate-section rule to cover .approval-card inside =============
# Already have `.ee-gate-section` in file; also make per-card .ee-gate-card.is-ee-gate for
# standalone cards (single approval card inside a section with mixed CE/EE).
# Append just BEFORE the closing tag of style block (find last .chart-container line as anchor)
P5_OLD = """}
}

// ======== 统一 EE 功能区块置灰样式"""
P5_NEW = """}
}

// ======== EE Gate 单个卡片置灰（用于 grid-row 内部的独立卡片被 v-if 移除场景，不依赖父 section）========
.ee-gate-card.is-ee-gate {
  cursor: not-allowed;
  position: relative;
  filter: grayscale(90%) opacity(0.65);
  background: repeating-linear-gradient(45deg, #fafafa, #fafafa 8px, #f4f4f5 8px, #f4f4f5 16px) !important;
  box-shadow: none !important;

  &:hover { transform: none !important; box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important; }
  * { user-select: none; }
}

// ======== 统一 EE 功能区块置灰"""
assert P5_OLD in content, "CSS anchor for ee-gate-card rule insertion not found"
content = content.replace(P5_OLD, P5_NEW)
print("✓ appended .ee-gate-card.is-ee-gate CSS rule")

HOME.write_text(content, encoding='utf-8')
print(f"\n✓ Home file written, size={len(content)} bytes")