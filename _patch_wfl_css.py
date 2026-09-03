#!/usr/bin/env python3
"""Append .ee-gate-card CSS at end of style block via rfind('</style>')."""

import pathlib

WFL = pathlib.Path("/media/jwj/TOSHIBA EXT/dev/taurus-stack-c/taurus-web/src/views/taurus/workflow/WorkflowList.vue")
content = WFL.read_text(encoding='utf-8')

END_TAG = "</style>"
idx = content.rfind(END_TAG)
assert idx != -1, "</style> not found at all"

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
# Prepend new CSS block BEFORE the </style> closing tag
content_new = content[:idx] + NEW_CSS + content[idx:]
WFL.write_text(content_new, encoding='utf-8')
print(f"✓ CSS appended. Total size changed {len(content)} → {len(content_new)} bytes (+{len(content_new)-len(content)})")