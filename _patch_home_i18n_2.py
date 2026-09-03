#!/usr/bin/env python3
"""Verify i18n paths for the new workflow EE placeholder card.

The home/index.vue uses T = t('message.pages.home.' + key).
But:
  - charts.workflowStatus / charts.workflowEETip are under
    { message: { pages: { home: { charts: {...} } } } } →  ✓ works with T()
  - edition.enterpriseOnlyTag is under { message: { pages: { edition: {...} } } }
    → using T('edition.enterpriseOnlyTag') resolves to
      t('message.pages.home.edition.enterpriseOnlyTag') which does NOT exist.

Fix in template: replace T('edition.enterpriseOnlyTag') with the direct
t('message.pages.edition.enterpriseOnlyTag') call.

Also fix handleWfCardClick: uses require('element-plus') which breaks in Vite ESM.
Replace with direct import usage.
"""

import pathlib

FILE = pathlib.Path("/media/jwj/TOSHIBA EXT/dev/taurus-stack-c/taurus-web/src/views/system/home/index.vue")
content = FILE.read_text(encoding="utf-8")

# Patch 1: template - T('edition.enterpriseOnlyTag') → t('message.pages.edition.enterpriseOnlyTag')
OLD_TAG = """{{ T('edition.enterpriseOnlyTag') }}"""
NEW_TAG = """{{ t('message.pages.edition.enterpriseOnlyTag') }}"""
assert OLD_TAG in content, "edition tag in template not found"
content = content.replace(OLD_TAG, NEW_TAG)
print("✓ Patch 1: template tag uses correct t() path")

# Patch 2: handleWfCardClick - remove require('element-plus') — it was already imported implicitly via
# the installed app; but safer to import at top. Actually ElMessageBox IS globally available in Element Plus
# apps, so use (window as any).ElMessageBox fallback, OR reference via direct symbol.
# Simpler: because the template already uses ElMessageBox elsewhere, let's just reference a
# getGlobalProperties-style call. But the most robust ESM-compatible way in a setup script
# is to import at top. Let's verify it's not already imported, and inline the dialog using
# the same pattern as featureDirective.ts (direct `from 'element-plus'` at top of file).
#
# First check if ElMessageBox is already imported in the file top.
if "import { ElMessageBox } from 'element-plus'" not in content:
    # add import near top
    content = content.replace(
        "import { Box, Select, Loading, Warning, Timer, Close, Remove, Document, Setting, Operation, Share, Connection, CircleCheck } from '@element-plus/icons-vue';",
        "import { Box, Select, Loading, Warning, Timer, Close, Remove, Document, Setting, Operation, Share, Connection, CircleCheck } from '@element-plus/icons-vue';\nimport { ElMessageBox } from 'element-plus';"
    )
    print("✓ Patch 2a: added ElMessageBox top-level import")

OLD_BLOCK = """    const tKey = (key: string, fallback: string) => {
        try {
            const v = t(`message.pages.edition.${key}`);
            if (typeof v === 'string' && v && v !== `message.pages.edition.${key}`) return v;
        } catch (_e) { /* noop */ }
        return fallback;
    };
    const { ElMessageBox } = require('element-plus');
    ElMessageBox.confirm("""
NEW_BLOCK = """    const tKey = (key: string, fallback: string) => {
        try {
            const v = t(`message.pages.edition.${key}`);
            if (typeof v === 'string' && v && v !== `message.pages.edition.${key}`) return v;
        } catch (_e) { /* noop */ }
        return fallback;
    };
    ElMessageBox.confirm("""
assert OLD_BLOCK in content, "handleWfCardClick ElMessageBox require block not found"
content = content.replace(OLD_BLOCK, NEW_BLOCK)
print("✓ Patch 2b: removed require('element-plus') in favor of top-level import")

FILE.write_text(content, encoding="utf-8")
print(f"\n✓ File written: {FILE}  size={len(content)} bytes")