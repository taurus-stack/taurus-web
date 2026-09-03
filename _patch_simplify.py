#!/usr/bin/env python3
"""Refactor 4th pie chart card: NO placeholder, always render original #wf-chart.

Plan:
  1. Template: always render <div id="wf-chart" class="chart-container"></div>
     Remove the v-else ee-chart-placeholder block entirely.
     Keep :class="{ 'chart-card--ee-gate': !hasFeature }" + @click="handleWfCardClick"
  2. Script: CE ALSO calls initWfChart() so echarts draws the greyed-out pie visually
     (no visible difference except the CSS filter) — keeps 4 cards visually identical.
  3. Style: simplify chart-card--ee-gate to only grayscale+opacity, no placeholder
     nested selectors.
"""

import pathlib

FILE = pathlib.Path("/media/jwj/TOSHIBA EXT/dev/taurus-stack-c/taurus-web/src/views/system/home/index.vue")
content = FILE.read_text(encoding="utf-8")

# ---------- Patch 1: Template — remove v-if/v-else placeholder, always render echarts div ----------
OLD_TPL = """            <div class="chart-card"
                 :class="{ 'chart-card--ee-gate': !hasFeature('WORKFLOW_DAG_ENGINE') }"
                 @click="handleWfCardClick">
                <!-- EE: echarts 正常渲染 -->
                <div v-if="hasFeature('WORKFLOW_DAG_ENGINE')" id="wf-chart" class="chart-container"></div>
                <!-- CE: 置灰占位 + 升级提示 -->
                <div v-else class="ee-chart-placeholder">
                    <el-icon class="ee-lock-icon"><Setting /></el-icon>
                    <div class="ee-ph-title">{{ T('charts.workflowStatus') }}</div>
                    <el-tag size="small" type="warning" effect="light" round>{{ t('message.pages.edition.enterpriseOnlyTag') }}</el-tag>
                    <div class="ee-ph-tip">{{ T('charts.workflowEETip') }}</div>
                </div>
            </div>"""

NEW_TPL = """            <div class="chart-card"
                 :class="{ 'chart-card--ee-gate': !hasFeature('WORKFLOW_DAG_ENGINE') }"
                 :title="!hasFeature('WORKFLOW_DAG_ENGINE') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                 @click="handleWfCardClick">
                <div id="wf-chart" class="chart-container"></div>
            </div>"""

assert OLD_TPL in content, "Old placeholder template NOT found. Already patched?"
content = content.replace(OLD_TPL, NEW_TPL)
print("✓ Patch 1: template simplified. Always render #wf-chart div (no placeholder)")

# ---------- Patch 2: Script — CE also calls initWfChart() so visuals match ----------
OLD_INIT = """        initHostsChart();
        initScriptsChart();
        initTasksChart();
        if (hasFeature('WORKFLOW_DAG_ENGINE')) {
            initWfChart();
            wfChartInstance.value?.on('click', handleWfChartClick);
        }"""

NEW_INIT = """        initHostsChart();
        initScriptsChart();
        initTasksChart();
        // 无论是 EE 还是 CE 都初始化第 4 张工作流饼图：
        //   · EE：真实数据 + 可点击跳转
        //   · CE：空数据但画面完整，配合 chart-card--ee-gate 滤镜置灰显示
        initWfChart();
        if (hasFeature('WORKFLOW_DAG_ENGINE')) {
            wfChartInstance.value?.on('click', handleWfChartClick);
        }"""

assert OLD_INIT in content, "old initWfChart guard NOT found"
content = content.replace(OLD_INIT, NEW_INIT)
print("✓ Patch 2: CE also calls initWfChart() so pie chart always renders")

# ---------- Patch 3: Style — remove placeholder styles, just grayscale+opacity ----------
OLD_STYLE = """    // CE 下的 EE 占位卡片：置灰样式
    &.chart-card--ee-gate {
      cursor: not-allowed;
      filter: grayscale(40%);
      background: repeating-linear-gradient(
          45deg,
          #fafafa,
          #fafafa 10px,
          #f4f4f5 10px,
          #f4f4f5 20px
      );

      &:hover {
        transform: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .ee-chart-placeholder {
        height: 220px;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        color: #909399;
        border: 2px dashed #dcdfe6;
        border-radius: 6px;
        text-align: center;
        padding: 8px;

        .ee-lock-icon {
          font-size: 40px;
          color: #e6a23c;
          opacity: 0.75;
        }
        .ee-ph-title {
          font-size: 15px;
          font-weight: 500;
          color: #606266;
        }
        .ee-ph-tip {
          font-size: 12px;
          color: #909399;
          line-height: 1.5;
          max-width: 88%;
        }
      }
    }"""

NEW_STYLE = """    // CE 下的 EE 卡片：整张置灰，不做占位符（保持 echarts 渲染结果原样）
    &.chart-card--ee-gate {
      cursor: not-allowed;
      filter: grayscale(90%) opacity(0.55);
      pointer-events: none;
      // 让 @click 事件仍能被父级捕获（点击拦截器）
      position: relative;

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        cursor: not-allowed;
        pointer-events: auto;
      }

      &:hover {
        transform: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }
    }"""

assert OLD_STYLE in content, "old ee-gate placeholder style NOT found"
content = content.replace(OLD_STYLE, NEW_STYLE)
print("✓ Patch 3: chart-card--ee-gate simplified to pure grayscale+opacity mask")

FILE.write_text(content, encoding="utf-8")
print(f"\n✓ File written: {FILE}  size={len(content)} bytes")