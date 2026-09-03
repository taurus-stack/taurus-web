#!/usr/bin/env python3
"""Fix OPS_PILOT_CANARY (灰度执行) gate — 3 files."""

import pathlib

ROOT = pathlib.Path("/media/jwj/TOSHIBA EXT/dev/taurus-stack-c/taurus-web/src/views/taurus/ops")

# ============ File 1: ops/script/index.vue — 用户截图的快速执行弹窗 ============
SCRIPT_INDEX = ROOT / "script" / "index.vue"
content = SCRIPT_INDEX.read_text(encoding='utf-8')

P1_OLD = """                    <el-radio v-if="hasFeature('OPS_PILOT_CANARY')" value="pilot" class="exec-mode-radio">
                      <div class="exec-mode-title pilot-title">{{ t('message.pages.opsScript.strategyPilotTitle') }}</div>
                      <div class="exec-mode-desc">{{ t('message.pages.opsScript.strategyPilotDesc') }}</div>
                    </el-radio>"""
assert P1_OLD in content
P1_NEW = """                    <div :class="{ 'ee-gate-card': !hasFeature('OPS_PILOT_CANARY'), 'is-ee-gate': !hasFeature('OPS_PILOT_CANARY') }"
                         :title="!hasFeature('OPS_PILOT_CANARY') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                         @click="onPilotRadioClick"
                         style="display: inline-block; vertical-align: top;">
                      <el-radio :disabled="!hasFeature('OPS_PILOT_CANARY')" value="pilot" class="exec-mode-radio">
                        <div class="exec-mode-title pilot-title">
                          {{ t('message.pages.opsScript.strategyPilotTitle') }}
                          <el-tag v-if="!hasFeature('OPS_PILOT_CANARY')" size="small" type="warning" effect="plain" style="margin-left:4px;">EE</el-tag>
                        </div>
                        <div class="exec-mode-desc">{{ t('message.pages.opsScript.strategyPilotDesc') }}</div>
                      </el-radio>
                    </div>"""
content = content.replace(P1_OLD, P1_NEW)
print("✓ script/index.vue: v-if pilot radio → ee-gate wrapper")

# Add helpers + handler after `const hasFeature = (code: string) => editionStore.hasFeature(code);`
P1b_OLD = "const hasFeature = (code: string) => editionStore.hasFeature(code);\nimport CustomDialog"
assert P1b_OLD in content
P1b_NEW = """const hasFeature = (code: string) => editionStore.hasFeature(code);

// ---------- EE 升级拦截通用 helpers ----------
const eeT = (key: string, fallback: string) => {
\ttry {
\t\tconst v = t(`message.pages.edition.${key}`);
\t\tif (typeof v === 'string' && v && v !== `message.pages.edition.${key}`) return v;
\t} catch (_e) { /* noop */ }
\treturn fallback;
};
const triggerEeUpgrade = (code: string, customDesc?: string) => {
\tElMessageBox.confirm(
\t\tcustomDesc || eeT('enterpriseOnlyDesc', '该功能仅在 Taurus Ops 企业版中提供。升级到企业版即可解锁灰度执行、审批流、通知等全部高级能力。'),
\t\teeT('enterpriseOnlyTitle', '企业版专属功能'),
\t\t{ confirmButtonText: eeT('upgradeAction', '立即升级'), cancelButtonText: eeT('dismiss', '稍后再说'), type: 'info', showCancelButton: true, closeOnClickModal: true }
\t).then(() => window.dispatchEvent(new CustomEvent('taurus:edition-upgrade', { detail: { code } }))).catch(() => {});
};
const onPilotRadioClick = (e?: MouseEvent) => {
\tif (hasFeature('OPS_PILOT_CANARY')) return;
\tif (e) e.stopPropagation();
\ttriggerEeUpgrade('OPS_PILOT_CANARY');
};

import CustomDialog"""
content = content.replace(P1b_OLD, P1b_NEW)
print("✓ script/index.vue: added eeT() + triggerEeUpgrade() + onPilotRadioClick handler")

# Also wrap pilot-params template block with the gate guard —
# only when the form actually has exec_mode === 'pilot' AND feature OK, show the params form.
# (No change to this — current v-if already OK as secondary conditional, because in CE
#  the pilot radio wrapper never sets the value, so pilot params template never activated.
#  Extra safety: keep as-is because ExecutorPanel.vue watch already resets pilot→parallel.)

SCRIPT_INDEX.write_text(content, encoding='utf-8')
print(f"  → script/index.vue size={SCRIPT_INDEX.stat().st_size}")

# ============ File 2: components/AdvancedOptionsPanel.vue ============
AOP = ROOT / "components" / "AdvancedOptionsPanel.vue"
content = AOP.read_text(encoding='utf-8')

P2a_OLD = """              <el-radio v-if="hasFeature('OPS_PILOT_CANARY')" value="pilot" border>{{ t('message.pages.opsExecution.advanced.pilot') }}</el-radio>"""
assert P2a_OLD in content
P2a_NEW = """              <span :class="{ 'ee-gate-card': !hasFeature('OPS_PILOT_CANARY'), 'is-ee-gate': !hasFeature('OPS_PILOT_CANARY') }"
                    :title="!hasFeature('OPS_PILOT_CANARY') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                    @click="onAdvancedPilotClick">
                <el-radio :disabled="!hasFeature('OPS_PILOT_CANARY')" value="pilot" border>
                  {{ t('message.pages.opsExecution.advanced.pilot') }}
                  <el-tag v-if="!hasFeature('OPS_PILOT_CANARY')" size="small" type="warning" effect="plain" style="margin-left:4px;">EE</el-tag>
                </el-radio>
              </span>"""
content = content.replace(P2a_OLD, P2a_NEW)
print("✓ AdvancedOptionsPanel.vue: pilot radio → ee-gate wrapper")

# pilot-params section — just keep it's already conditional on hasFeature. It won't ever show in CE since radio can't be selected. No change.

# Find the script setup block of AdvancedOptionsPanel
P2b_OLD = """<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEditionStore } from '/@/editions';"""
assert P2b_OLD in content, "cannot find AdvancedOptionsPanel setup anchor"
P2b_NEW = """<script setup lang="ts">
import { computed } from 'vue';
import { ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useEditionStore } from '/@/editions';"""
content = content.replace(P2b_OLD, P2b_NEW)

P2c_OLD = "const editionStore = useEditionStore();\nconst hasFeature = (code: string) => editionStore.hasFeature(code);"
assert P2c_OLD in content
P2c_NEW = """const editionStore = useEditionStore();
const hasFeature = (code: string) => editionStore.hasFeature(code);

// ---------- EE 升级拦截通用 helpers ----------
const { t: _t } = useI18n();
const eeT = (key: string, fallback: string) => {
  try {
    const v = _t(`message.pages.edition.${key}`);
    if (typeof v === 'string' && v && v !== `message.pages.edition.${key}`) return v;
  } catch (_e) { /* noop */ }
  return fallback;
};
const triggerEeUpgrade = (code: string, customDesc?: string) => {
  ElMessageBox.confirm(
    customDesc || eeT('enterpriseOnlyDesc', '该功能仅在 Taurus Ops 企业版中提供。升级到企业版即可解锁灰度执行、审批流、通知等全部高级能力。'),
    eeT('enterpriseOnlyTitle', '企业版专属功能'),
    { confirmButtonText: eeT('upgradeAction', '立即升级'), cancelButtonText: eeT('dismiss', '稍后再说'), type: 'info', showCancelButton: true, closeOnClickModal: true }
  ).then(() => window.dispatchEvent(new CustomEvent('taurus:edition-upgrade', { detail: { code } }))).catch(() => {});
};
const onAdvancedPilotClick = (e?: MouseEvent) => {
  if (hasFeature('OPS_PILOT_CANARY')) return;
  if (e) e.stopPropagation();
  triggerEeUpgrade('OPS_PILOT_CANARY');
};"""
content = content.replace(P2c_OLD, P2c_NEW)
print("✓ AdvancedOptionsPanel.vue: helpers + handler added")

AOP.write_text(content, encoding='utf-8')
print(f"  → AdvancedOptionsPanel.vue size={AOP.stat().st_size}")

# ============ File 3: components/ExecModeSelectorInner.vue — workflow editor mode-card (3 cards) ============
EMSI = ROOT / "components" / "ExecModeSelectorInner.vue"
content = EMSI.read_text(encoding='utf-8')

# This component is missing edition gate entirely — pilot radio always rendered.
# Add disabled + ee-gate wrapper + import dependencies
P3a_OLD = """        <el-radio value="pilot" class="mode-card">
          <div class="mode-radio-dot" />
          <div class="mode-content">
            <span class="mode-name">{{ t('grayRelease') }}</span>
            <span class="mode-desc">{{ t('grayReleaseDesc') }}</span>
          </div>
        </el-radio>"""
assert P3a_OLD in content
P3a_NEW = """        <div :class="{ 'ee-gate-card': !hasFeature('OPS_PILOT_CANARY'), 'is-ee-gate': !hasFeature('OPS_PILOT_CANARY') }"
             :title="!hasFeature('OPS_PILOT_CANARY') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
             @click="onPilotCardClick"
             style="display: inline-block; vertical-align: top;">
          <el-radio :disabled="!hasFeature('OPS_PILOT_CANARY')" value="pilot" class="mode-card">
            <div class="mode-radio-dot" />
            <div class="mode-content">
              <span class="mode-name">
                {{ t('grayRelease') }}
                <el-tag v-if="!hasFeature('OPS_PILOT_CANARY')" size="small" type="warning" effect="plain" style="margin-left:4px;">EE</el-tag>
              </span>
              <span class="mode-desc">{{ t('grayReleaseDesc') }}</span>
            </div>
          </el-radio>
        </div>"""
content = content.replace(P3a_OLD, P3a_NEW)
print("✓ ExecModeSelectorInner.vue: pilot mode-card → ee-gate wrapper")

# Now script setup of ExecModeSelectorInner
P3b_OLD = """<script setup lang="ts">
import type { RerunFormData } from './historyUtils';
import { useI18n } from 'vue-i18n';"""
assert P3b_OLD in content
P3b_NEW = """<script setup lang="ts">
import type { RerunFormData } from './historyUtils';
import { ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useEditionStore } from '/@/editions';"""
content = content.replace(P3b_OLD, P3b_NEW)

# After existing t, add edition + helpers
P3c_OLD = """const { t } = useI18n();

const props = defineProps<"""
assert P3c_OLD in content
P3c_NEW = """const { t } = useI18n();
const editionStore = useEditionStore();
const hasFeature = (code: string) => editionStore.hasFeature(code);

// ---------- EE 升级拦截通用 helpers ----------
const eeT = (key: string, fallback: string) => {
  try {
    const v = t(`message.pages.edition.${key}`);
    if (typeof v === 'string' && v && v !== `message.pages.edition.${key}`) return v;
  } catch (_e) { /* noop */ }
  return fallback;
};
const triggerEeUpgrade = (code: string, customDesc?: string) => {
  ElMessageBox.confirm(
    customDesc || eeT('enterpriseOnlyDesc', '该功能仅在 Taurus Ops 企业版中提供。升级到企业版即可解锁灰度执行、审批流、通知等全部高级能力。'),
    eeT('enterpriseOnlyTitle', '企业版专属功能'),
    { confirmButtonText: eeT('upgradeAction', '立即升级'), cancelButtonText: eeT('dismiss', '稍后再说'), type: 'info', showCancelButton: true, closeOnClickModal: true }
  ).then(() => window.dispatchEvent(new CustomEvent('taurus:edition-upgrade', { detail: { code } }))).catch(() => {});
};
const onPilotCardClick = (e?: MouseEvent) => {
  if (hasFeature('OPS_PILOT_CANARY')) return;
  if (e) e.stopPropagation();
  triggerEeUpgrade('OPS_PILOT_CANARY');
};

const props = defineProps<"""
content = content.replace(P3c_OLD, P3c_NEW)
print("✓ ExecModeSelectorInner.vue: helpers + handler added")

EMSI.write_text(content, encoding='utf-8')
print(f"  → ExecModeSelectorInner.vue size={EMSI.stat().st_size}")

print("\n✅ All 3 files patched — OPS_PILOT_CANARY now rendered greyed with EE tag in CE, not hidden from DOM")