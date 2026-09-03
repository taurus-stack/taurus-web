<script setup lang="ts">
import { echarts } from '/@/utils/echarts';
import { onMounted, onBeforeUnmount, ref, reactive, nextTick, computed } from 'vue';
import { useEditionStore } from '/@/editions';
import { Box, Select, Loading, Warning, Timer, Close, Remove, Document, Setting, Operation, Share, Connection, CircleCheck } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import { GetMyHostInfo } from '/@/api/taurus/host/api';
import { GetMyScriptInfo } from '/@/api/taurus/template/api';
import { GetMyTaskInfo } from '/@/api/taurus/record/api';
import { GetList as GetExecutionList } from '/@/api/taurus/ops-execution/api';
import { StatsCount as GetExecApprovalStats } from '/@/api/taurus/execution-approval/api';
import { getStatsCount as getWfApprovalStats } from '/@/api/taurus/workflow/approval-instance';
import { getStatsCount as getScriptApprovalStats } from '/@/api/taurus/script-library/approval-instance';
import * as taskCenterApi from '/@/api/taurus/task-center/api';
import { getStats as getWfStats } from '/@/api/taurus/workflow/api';
import { GetList as GetWfExecutionList } from '/@/api/taurus/workflow/execution';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const router = useRouter();
const T = (key: string) => t(`message.pages.home.${key}`);

const editionStore = useEditionStore();
const hasFeature = (code: string) => editionStore.hasFeature(code);

const currentDate = ref('');
const totalTasks = ref(0);
const scriptApprovalPending = ref(0);
const scriptExecApprovalPending = ref(0);
const commandExecApprovalPending = ref(0);
const wfApprovalPending = ref(0);
const wfExecApprovalPending = ref(0);
const successTasks = ref(0);
const failedTasks = ref(0);
const runningTasks = ref(0);
const interruptedTasks = ref(0);
const pendingTasks = ref(0);
const successRate = ref(0);

const hostsChartInstance = ref<any>();
const scriptsChartInstance = ref<any>();
const tasksChartInstance = ref<any>();
const wfChartInstance = ref<any>();

const wfTotal = ref(0);
const wfPublished = ref(0);
const wfDraft = ref(0);
const wfExecuting = ref(0);
const wfExecSuccess = ref(0);
const wfExecFailed = ref(0);
const recentWfExec = ref<any[]>([]);

const hostData = reactive({ normal: 0, exception: 0 });
const scriptData = reactive({ shell: 0, python: 0, powershell: 0, bat: 0, sql: 0 });

const buildDateString = (now: Date) => {
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const wd = (t(`message.pages.home.welcome.weekdays.${now.getDay()}`));
    const Y = T('welcome.year');
    const M = T('welcome.month');
    const D = T('welcome.day');
    // zh-cn: Friday Aug 28, 2026
    // en:    2026Y 8M 28D Sunday
    return `${y}${Y}${m}${M}${d}${D} ${wd}`;
};

const initHostsChart = () => {
    hostsChartInstance.value = echarts.init(document.getElementById('hosts-chart'), null);
    hostsChartInstance.value.setOption({
        title: {
            text: T('charts.myHosts'),
            left: 'center',
            textStyle: { fontSize: 14, fontWeight: 500 },
        },
        tooltip: { trigger: 'item' },
        legend: { top: '8%', left: 'center' },
        series: [
            {
                name: T('charts.hostEntity'),
                type: 'pie',
                radius: ['40%', '65%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 6 },
                label: { show: false, position: 'center' },
                emphasis: { label: { show: true, fontSize: 24, fontWeight: 'bold' } },
                labelLine: { show: false },
                data: [
                    { value: hostData.normal, name: T('charts.hostNormal'), itemStyle: { color: '#67C23A' } },
                    { value: hostData.exception, name: T('charts.hostException'), itemStyle: { color: '#F56C6C' } },
                ],
            },
        ],
    });
};

const initScriptsChart = () => {
    scriptsChartInstance.value = echarts.init(document.getElementById('scripts-chart'), null);
    scriptsChartInstance.value.setOption({
        title: {
            text: T('charts.myScripts'),
            left: 'center',
            textStyle: { fontSize: 14, fontWeight: 500 },
        },
        tooltip: { trigger: 'item' },
        legend: { top: '8%', left: 'center' },
        series: [
            {
                name: T('charts.scriptEntity'),
                type: 'pie',
                radius: ['40%', '65%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 6 },
                label: { show: false, position: 'center' },
                emphasis: { label: { show: true, fontSize: 24, fontWeight: 'bold' } },
                labelLine: { show: false },
                data: [
                    { value: scriptData.shell, name: 'Shell', itemStyle: { color: '#409EFF' } },
                    { value: scriptData.python, name: 'Python', itemStyle: { color: '#E6A23C' } },
                    { value: scriptData.powershell, name: 'PowerShell', itemStyle: { color: '#67C23A' } },
                    { value: scriptData.bat, name: 'Bat', itemStyle: { color: '#909399' } },
                    { value: scriptData.sql, name: 'SQL', itemStyle: { color: '#F56C6C' } },
                ],
            },
        ],
    });
};

const initTasksChart = () => {
    tasksChartInstance.value = echarts.init(document.getElementById('tasks-chart'), null);
    tasksChartInstance.value.setOption({
        title: {
            text: T('charts.taskStatus'),
            left: 'center',
            textStyle: { fontSize: 14, fontWeight: 500 },
        },
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', right: '5%', top: 'center', itemWidth: 12, itemHeight: 12 },
        series: [
            {
                name: T('charts.taskStatusEntity'),
                type: 'pie',
                radius: ['35%', '65%'],
                center: ['35%', '55%'],
                avoidLabelOverlap: true,
                itemStyle: { borderRadius: 4 },
                label: { show: false },
                emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
                data: [
                    { value: successTasks.value, name: T('charts.taskSuccess'), itemStyle: { color: '#67C23A' } },
                    { value: failedTasks.value, name: T('charts.taskFailed'), itemStyle: { color: '#F56C6C' } },
                    { value: runningTasks.value, name: T('charts.taskRunning'), itemStyle: { color: '#409EFF' } },
                    { value: interruptedTasks.value, name: T('charts.taskInterrupted'), itemStyle: { color: '#E6A23C' } },
                    { value: pendingTasks.value, name: T('charts.taskPending'), itemStyle: { color: '#909399' } },
                ],
            },
        ],
    });
};

const initWfChart = () => {
    wfChartInstance.value = echarts.init(document.getElementById('wf-chart'), null);
    wfChartInstance.value.setOption({
        title: {
            text: T('charts.workflowStatus'),
            left: 'center',
            textStyle: { fontSize: 14, fontWeight: 500 },
        },
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', right: '5%', top: 'center', itemWidth: 12, itemHeight: 12 },
        series: [
            {
                name: T('charts.workflowStatusEntity'),
                type: 'pie',
                radius: ['35%', '65%'],
                center: ['35%', '55%'],
                avoidLabelOverlap: true,
                itemStyle: { borderRadius: 4 },
                label: { show: false },
                emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
                data: [
                    { value: wfPublished.value, name: T('charts.wfPublished'), itemStyle: { color: '#67C23A' } },
                    { value: wfDraft.value, name: T('charts.wfDraft'), itemStyle: { color: '#E6A23C' } },
                    { value: wfExecuting.value, name: T('charts.wfExecuting'), itemStyle: { color: '#409EFF' } },
                    { value: wfExecSuccess.value, name: T('charts.wfExecSuccess'), itemStyle: { color: '#13C2C2' } },
                    { value: wfExecFailed.value, name: T('charts.wfExecFailed'), itemStyle: { color: '#F56C6C' } },
                ],
            },
        ],
    });
};

const recentExec = ref<any[]>([]);
const mySchedules = ref<any[]>([]);

const extractList = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.data?.results)) return res.data.results;
    if (Array.isArray(res.data)) return res.data;
    return [];
};

const formatExecTime = (row: any): string => {
    const val = row.create_datetime || row.started_at;
    if (!val) return '-';
    return val.replace('T', ' ').substring(0, 19);
};

const formatExecLabel = (row: any): string => {
    if (row.execution_type === 'script') return `Script (${row.script_type || 'shell'})`;
    if (row.execution_type === 'command') return row.command || T('labels.command');
    if (row.execution_type === 'upload') return T('labels.fileUpload');
    if (row.execution_type === 'download') return T('labels.fileDownload');
    return row.execution_type_display || row.execution_type || '-';
};

const formatScheduleCron = (row: any): string => {
    if (row.schedule_type === 'cron') return row.cron_expression || '-';
    if (row.schedule_type === 'interval')
        return `${T('panels.cycleIntervalPrefix')}${row.interval_seconds || 0}${T('panels.cycleIntervalSuffix')}`;
    if (row.schedule_type === 'once') return row.run_once_at ? row.run_once_at.replace('T', ' ').substring(0, 19) : '-';
    return row.schedule_type_display || '-';
};

const formatWfExecStatus = (status: number): string => {
    const key: Record<number, string> = {
        1: 'panels.wfStatusRunning',
        2: 'panels.wfStatusSuccess',
        3: 'panels.wfStatusFailed',
        4: 'panels.wfStatusInterrupted',
        5: 'panels.wfStatusSkipped',
    };
    return key[status] ? T(key[status]) : T('panels.wfStatusUnknown');
};

const wfExecStatusTag = (status: number): string => {
    const map: Record<number, string> = { 1: 'primary', 2: 'success', 3: 'danger', 4: 'warning', 5: 'info' };
    return map[status] || 'info';
};

const formatRecentExecStatus = (status: number): string => {
    const key: Record<number, string> = {
        2: 'panels.resultSuccess',
        3: 'panels.resultFailed',
        1: 'panels.resultRunning',
        4: 'panels.resultInterrupted',
        0: 'panels.resultPending',
    };
    return key[status] ? T(key[status]) : T('panels.resultPending');
};

onMounted(async () => {
    const now = new Date();
    const today = T('welcome.today');
    const wish = T('welcome.wish');
    currentDate.value = `${today}${buildDateString(now)}${wish}`;

    try {
        const [hostRes, scriptRes, taskRes] = await Promise.all([
            GetMyHostInfo({}),
            GetMyScriptInfo({}),
            GetMyTaskInfo({}),
        ]);

        if (hostRes && hostRes.code === 2000) {
            hostData.normal = hostRes.data.normal || 0;
            hostData.exception = hostRes.data.exception || 0;
        }

        if (scriptRes && scriptRes.code === 2000) {
            scriptData.shell = scriptRes.data.shell || 0;
            scriptData.python = scriptRes.data.python || 0;
            scriptData.powershell = scriptRes.data.powershell || 0;
            scriptData.bat = scriptRes.data.bat || 0;
            scriptData.sql = scriptRes.data.sql || 0;
        }

        if (taskRes && taskRes.code === 2000) {
            totalTasks.value = taskRes.data.total || 0;
            pendingTasks.value = taskRes.data.pending || 0;
            runningTasks.value = taskRes.data.running || 0;
            successTasks.value = taskRes.data.success || 0;
            failedTasks.value = taskRes.data.failed || 0;
            interruptedTasks.value = taskRes.data.interrupted || 0;
            const finished = successTasks.value + failedTasks.value + interruptedTasks.value;
            if (finished > 0) {
                successRate.value = Math.round((successTasks.value / finished) * 1000) / 10;
            }
        }
    } catch (e) {
        // stats load failed
    }

    try {
        const execRes = await GetExecutionList({ page: 1, limit: 5 });
        recentExec.value = extractList(execRes);
    } catch (e) { /* ignore */ }

    try {
        if (hasFeature('SCRIPT_TASK_UNIFIED')) {
            const schedRes = await taskCenterApi.GetList({ page: 1, limit: 5 });
            const data = schedRes?.data || schedRes || {};
            mySchedules.value = data.results || data || [];
        }
    } catch (e) { /* ignore */ }

    try {
        // Edition gate: only request EE-only stats when features are available
        const [execStats, wfStats, scriptStats] = await Promise.all([
            hasFeature('OPS_EXECUTION_APPROVAL') ? GetExecApprovalStats() : Promise.resolve(null),
            hasFeature('WORKFLOW_APPROVAL_FLOW') ? getWfApprovalStats() : Promise.resolve(null),
            hasFeature('SCRIPT_APPROVAL_FLOW') ? getScriptApprovalStats() : Promise.resolve(null),
        ]);
        const bySource = execStats?.data?.pending_by_source || {};
        scriptExecApprovalPending.value = bySource.script || 0;
        commandExecApprovalPending.value = bySource.command || 0;
        wfExecApprovalPending.value = bySource.workflow || 0;
        wfApprovalPending.value = wfStats?.data?.pending_me || 0;
        scriptApprovalPending.value = scriptStats?.data?.pending_me || 0;
    } catch (e) { /* ignore */ }

    // workflow stats 是 WORKFLOW_DAG_ENGINE (EE) 专属，CE 不请求
    if (hasFeature('WORKFLOW_DAG_ENGINE')) {
        try {
            const wfStatsRes = await getWfStats();
            if (wfStatsRes && wfStatsRes.code === 2000) {
                wfTotal.value = wfStatsRes.data.total || 0;
                wfPublished.value = wfStatsRes.data.published || 0;
                wfDraft.value = wfStatsRes.data.archived_count || 0;
                wfExecuting.value = wfStatsRes.data.executing || 0;
                wfExecSuccess.value = wfStatsRes.data.exec_success || 0;
                wfExecFailed.value = wfStatsRes.data.exec_failed || 0;
            }
        } catch (e) { /* ignore */ }
    }

    try {
        const wfExecRes = await GetWfExecutionList({ page: 1, limit: 5 });
        recentWfExec.value = extractList(wfExecRes);
    } catch (e) { /* ignore */ }

    nextTick(() => {
        initHostsChart();
        initScriptsChart();
        initTasksChart();
        // 无论是 EE 还是 CE 都初始化第 4 张工作流饼图：
        //   · EE：真实数据 + 可点击跳转
        //   · CE：空数据但画面完整，配合 chart-card--ee-gate 滤镜置灰显示
        initWfChart();
        if (hasFeature('WORKFLOW_DAG_ENGINE')) {
            wfChartInstance.value?.on('click', handleWfChartClick);
        }
    });

    window.addEventListener('resize', handleWindowResize);
});

const handleWindowResize = () => {
    hostsChartInstance.value && hostsChartInstance.value.resize();
    scriptsChartInstance.value && scriptsChartInstance.value.resize();
    tasksChartInstance.value && tasksChartInstance.value.resize();
    wfChartInstance.value && wfChartInstance.value.resize();
};

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleWindowResize);
    wfChartInstance.value && wfChartInstance.value.off('click', handleWfChartClick);
    hostsChartInstance.value && hostsChartInstance.value.dispose();
    scriptsChartInstance.value && scriptsChartInstance.value.dispose();
    tasksChartInstance.value && tasksChartInstance.value.dispose();
    wfChartInstance.value && wfChartInstance.value.dispose();
    hostsChartInstance.value = undefined;
    scriptsChartInstance.value = undefined;
    tasksChartInstance.value = undefined;
    wfChartInstance.value = undefined;
});

const goHistory = (status: number | string) => {
    router.push({
        path: '/ops/history',
        query: status === 'all' ? {} : { status: String(status) },
    });
};

const goHostList = () => router.push('/ops/host/my');
const goScriptLibrary = () => router.push('/ops/script-library');
const goSchedule = () => router.push('/taurus/task-center/my');
const goCommandExec = () => router.push('/ops/command');
const goApprovalScript = () => router.push({ path: '/ops/script-library', query: { tab: 'approval' } });
const goApprovalScriptExec = () => router.push({ path: '/ops/execution-approval', query: { source_type: 'script' } });
const goApprovalCommandExec = () => router.push({ path: '/ops/execution-approval', query: { source_type: 'command' } });
const goApprovalWf = () => router.push('/workflow/approval');
const goApprovalWfExec = () => router.push({ path: '/ops/execution-approval', query: { source_type: 'workflow' } });
const goWfList = () => router.push('/workflow/list');
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
};

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
const goLegacySchedule = () => router.push('/ops/schedule');
const handleScheduleColClick = (e: MouseEvent) => {
    if (hasFeature('SCRIPT_TASK_UNIFIED')) return;
    e.stopPropagation();
    triggerEeUpgrade('SCRIPT_TASK_UNIFIED');
};
const goWfExecHistory = () => router.push('/workflow/record');

const handleWfChartClick = (params: any) => {
    const name = params.name;
    const execNames = [T('charts.wfExecuting'), T('charts.wfExecSuccess'), T('charts.wfExecFailed')];
    if (execNames.includes(name)) {
        router.push('/workflow/record');
    } else {
        router.push('/workflow/list');
    }
};

// labels for template (avoid long i18n paths)
const scheduleItemTypeLabel = (row: any) =>
    row.item_type === 'script_task' ? T('panels.tagScript') : T('panels.tagWorkflow');

const scheduleStatusLabel = computed(() => (row: any) =>
    row.status_display || (row.status === 1 ? T('panels.statusRunning') : T('panels.statusPaused'))
);
</script>

<template>
    <div class="dashboard-page">
        <div class="welcome-bar">
            <div class="welcome-text">
                <h2>{{ T('welcome.greeting') }}</h2>
                <p>{{ currentDate }}</p>
            </div>
            <div class="welcome-actions">
                <el-button type="primary" @click="goCommandExec"><el-icon style="margin-right:4px"><Operation /></el-icon>{{ T('actions.quickExec') }}</el-button>
                <el-button type="success" @click="goScriptLibrary"><el-icon style="margin-right:4px"><Document /></el-icon>{{ T('actions.scriptLibrary') }}</el-button>
                <el-button type="warning" @click="goWfList"><el-icon style="margin-right:4px"><Share /></el-icon>{{ T('actions.workflow') }}</el-button>
                <el-button type="info" @click="goSchedule"><el-icon style="margin-right:4px"><Timer /></el-icon>{{ T('actions.schedule') }}</el-button>
                <el-button type="danger" @click="goHostList"><el-icon style="margin-right:4px"><Box /></el-icon>{{ T('actions.hostMgmt') }}</el-button>
            </div>
        </div>

        <div class="stat-row">
            <div class="stat-card" @click="goHistory('all')">
                <div class="stat-icon-wrap">
                    <el-icon class="stat-icon stat-icon-blue"><Box /></el-icon>
                </div>
                <div class="stat-content">
                    <div class="stat-num">{{ totalTasks }}</div>
                    <div class="stat-label">{{ T('stats.totalTasks') }}</div>
                </div>
            </div>
            <div class="stat-card" @click="goHistory(2)">
                <div class="stat-icon-wrap">
                    <el-icon class="stat-icon stat-icon-green"><Select /></el-icon>
                </div>
                <div class="stat-content">
                    <div class="stat-num stat-green">{{ successTasks }}</div>
                    <div class="stat-label">{{ T('stats.successTasks') }}</div>
                </div>
            </div>
            <div class="stat-card" @click="goHistory(1)">
                <div class="stat-icon-wrap">
                    <el-icon class="stat-icon stat-icon-cyan"><Loading /></el-icon>
                </div>
                <div class="stat-content">
                    <div class="stat-num stat-cyan">{{ runningTasks }}</div>
                    <div class="stat-label">{{ T('stats.runningTasks') }}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon-wrap">
                    <el-icon class="stat-icon stat-icon-orange"><Warning /></el-icon>
                </div>
                <div class="stat-content">
                    <div class="stat-num stat-orange">{{ successRate }}%</div>
                    <div class="stat-label">{{ T('stats.successRate') }}</div>
                </div>
            </div>
            <div class="stat-card" @click="goHistory(3)">
                <div class="stat-icon-wrap">
                    <el-icon class="stat-icon stat-icon-red"><Close /></el-icon>
                </div>
                <div class="stat-content">
                    <div class="stat-num stat-red">{{ failedTasks }}</div>
                    <div class="stat-label">{{ T('stats.failedTasks') }}</div>
                </div>
            </div>
            <div class="stat-card" @click="goHistory(4)">
                <div class="stat-icon-wrap">
                    <el-icon class="stat-icon stat-icon-yellow"><Timer /></el-icon>
                </div>
                <div class="stat-content">
                    <div class="stat-num stat-yellow">{{ interruptedTasks }}</div>
                    <div class="stat-label">{{ T('stats.interruptedTasks') }}</div>
                </div>
            </div>
            <div class="stat-card" @click="goHistory(0)">
                <div class="stat-icon-wrap">
                    <el-icon class="stat-icon stat-icon-gray"><Remove /></el-icon>
                </div>
                <div class="stat-content">
                    <div class="stat-num stat-gray">{{ pendingTasks }}</div>
                    <div class="stat-label">{{ T('stats.pendingTasks') }}</div>
                </div>
            </div>
        </div>

        <div class="approval-section ee-gate-section"
             :class="{ 'is-ee-gate': !(hasFeature('SCRIPT_APPROVAL_FLOW') || hasFeature('WORKFLOW_APPROVAL_FLOW') || hasFeature('OPS_EXECUTION_APPROVAL')) }"
             :title="!(hasFeature('SCRIPT_APPROVAL_FLOW') || hasFeature('WORKFLOW_APPROVAL_FLOW') || hasFeature('OPS_EXECUTION_APPROVAL')) ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
             @click="handleApprovalSectionClick">
            <div class="section-title">{{ T('approval.sectionTitle') }}</div>
            <div class="approval-row">
                <div class="approval-card ee-gate-card"
                     :class="{ 'is-ee-gate': !hasFeature('SCRIPT_APPROVAL_FLOW') }"
                     :title="!hasFeature('SCRIPT_APPROVAL_FLOW') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                     @click="onApprovalScriptCardClick">
                    <div class="approval-icon approval-icon-blue"><el-icon><Document /></el-icon></div>
                    <div class="approval-content">
                        <div class="approval-num approval-blue">{{ scriptApprovalPending }}</div>
                        <div class="approval-label">{{ T('approval.scriptApproval') }}</div>
                    </div>
                </div>
                <div class="approval-card ee-gate-card"
                     :class="{ 'is-ee-gate': !hasFeature('WORKFLOW_APPROVAL_FLOW') }"
                     :title="!hasFeature('WORKFLOW_APPROVAL_FLOW') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                     @click="onApprovalWfCardClick">
                    <div class="approval-icon approval-icon-orange"><el-icon><Share /></el-icon></div>
                    <div class="approval-content">
                        <div class="approval-num approval-orange">{{ wfApprovalPending }}</div>
                        <div class="approval-label">{{ T('approval.workflowApproval') }}</div>
                    </div>
                </div>
                <div class="approval-card ee-gate-card"
                     :class="{ 'is-ee-gate': !hasFeature('OPS_EXECUTION_APPROVAL') }"
                     :title="!hasFeature('OPS_EXECUTION_APPROVAL') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                     @click="onApprovalScriptExecCardClick">
                    <div class="approval-icon approval-icon-green"><el-icon><Setting /></el-icon></div>
                    <div class="approval-content">
                        <div class="approval-num approval-green">{{ scriptExecApprovalPending }}</div>
                        <div class="approval-label">{{ T('approval.scriptExecApproval') }}</div>
                    </div>
                </div>
                <div class="approval-card ee-gate-card"
                     :class="{ 'is-ee-gate': !hasFeature('OPS_EXECUTION_APPROVAL') }"
                     :title="!hasFeature('OPS_EXECUTION_APPROVAL') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                     @click="onApprovalCommandExecCardClick">
                    <div class="approval-icon approval-icon-cyan"><el-icon><Operation /></el-icon></div>
                    <div class="approval-content">
                        <div class="approval-num approval-cyan">{{ commandExecApprovalPending }}</div>
                        <div class="approval-label">{{ T('approval.commandExecApproval') }}</div>
                    </div>
                </div>
                <div class="approval-card ee-gate-card"
                     :class="{ 'is-ee-gate': !hasFeature('OPS_EXECUTION_APPROVAL') }"
                     :title="!hasFeature('OPS_EXECUTION_APPROVAL') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                     @click="onApprovalWfExecCardClick">
                    <div class="approval-icon approval-icon-purple"><el-icon><Connection /></el-icon></div>
                    <div class="approval-content">
                        <div class="approval-num approval-purple">{{ hasFeature('OPS_EXECUTION_APPROVAL') ? wfExecApprovalPending : 0 }}</div>
                        <div class="approval-label">{{ T('approval.workflowExecApproval') }}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="wf-stats-section"
             :class="{ 'ee-gate-section': !hasFeature('WORKFLOW_DAG_ENGINE') }"
             :title="!hasFeature('WORKFLOW_DAG_ENGINE') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
             @click="handleWfSectionClick">
            <div class="section-title">{{ T('workflow.sectionTitle') }}</div>
            <div class="wf-stats-row">
                <div class="wf-stat-card" @click="goWfList">
                    <el-icon class="wf-stat-icon stat-icon-blue"><Share /></el-icon>
                    <div class="wf-stat-content">
                        <div class="wf-stat-num">{{ wfTotal }}</div>
                        <div class="wf-stat-label">{{ T('workflow.total') }}</div>
                    </div>
                </div>
                <div class="wf-stat-card" @click="goWfList">
                    <el-icon class="wf-stat-icon stat-icon-green"><Select /></el-icon>
                    <div class="wf-stat-content">
                        <div class="wf-stat-num stat-green">{{ wfPublished }}</div>
                        <div class="wf-stat-label">{{ T('workflow.published') }}</div>
                    </div>
                </div>
                <div class="wf-stat-card" @click="goWfExecHistory">
                    <el-icon class="wf-stat-icon stat-icon-cyan"><Loading /></el-icon>
                    <div class="wf-stat-content">
                        <div class="wf-stat-num stat-cyan">{{ wfExecuting }}</div>
                        <div class="wf-stat-label">{{ T('workflow.executing') }}</div>
                    </div>
                </div>
                <div class="wf-stat-card" @click="goWfExecHistory">
                    <el-icon class="wf-stat-icon stat-icon-green"><CircleCheck /></el-icon>
                    <div class="wf-stat-content">
                        <div class="wf-stat-num stat-green">{{ wfExecSuccess }}</div>
                        <div class="wf-stat-label">{{ T('workflow.execSuccess') }}</div>
                    </div>
                </div>
                <div class="wf-stat-card" @click="goWfExecHistory">
                    <el-icon class="wf-stat-icon stat-icon-red"><Close /></el-icon>
                    <div class="wf-stat-content">
                        <div class="wf-stat-num stat-red">{{ wfExecFailed }}</div>
                        <div class="wf-stat-label">{{ T('workflow.execFailed') }}</div>
                    </div>
                </div>
                <div class="wf-stat-card" @click="goWfList">
                    <el-icon class="wf-stat-icon stat-icon-orange"><Warning /></el-icon>
                    <div class="wf-stat-content">
                        <div class="wf-stat-num stat-orange">{{ wfDraft }}</div>
                        <div class="wf-stat-label">{{ T('workflow.archived') }}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="charts-row">
            <div class="chart-card" @click="goHistory('all')">
                <div id="tasks-chart" class="chart-container"></div>
            </div>
            <div class="chart-card" @click="goHostList">
                <div id="hosts-chart" class="chart-container"></div>
            </div>
            <div class="chart-card" @click="goScriptLibrary">
                <div id="scripts-chart" class="chart-container"></div>
            </div>
            <div class="chart-card"
                 :class="{ 'chart-card--ee-gate': !hasFeature('WORKFLOW_DAG_ENGINE') }"
                 :title="!hasFeature('WORKFLOW_DAG_ENGINE') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                 @click="handleWfCardClick">
                <div id="wf-chart" class="chart-container"></div>
            </div>
        </div>

        <div class="main-content">
            <div class="left-col">
                <div class="panel-card">
                    <div class="panel-header">
                        <span class="panel-title">{{ T('panels.recentExecTitle') }}</span>
                        <el-button text type="primary" size="small" @click="goHistory('all')">{{ T('panels.recentExecAll') }}</el-button>
                    </div>
                    <el-table :data="recentExec" size="small" border stripe>
                        <el-table-column :label="T('panels.colExecContent')" show-overflow-tooltip>
                            <template #default="{ row }">{{ formatExecLabel(row) }}</template>
                        </el-table-column>
                        <el-table-column prop="host_ip" :label="T('panels.colHostIp')" width="130" show-overflow-tooltip />
                        <el-table-column :label="T('panels.colExecTime')" width="160">
                            <template #default="{ row }">{{ formatExecTime(row) }}</template>
                        </el-table-column>
                        <el-table-column prop="status" :label="T('panels.colResult')" width="80" align="center">
                            <template #default="{ row }">
                                <el-tag
                                    :type="row.status === 2 ? 'success' : row.status === 3 ? 'danger' : row.status === 1 ? 'primary' : row.status === 4 ? 'warning' : 'info'"
                                    size="small"
                                >
                                    {{ formatRecentExecStatus(row.status) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>

                <div class="panel-card">
                    <div class="panel-header">
                        <span class="panel-title">{{ T('panels.recentWfExecTitle') }}</span>
                        <el-button text type="primary" size="small" @click="goWfExecHistory">{{ T('panels.recentExecAll') }}</el-button>
                    </div>
                    <el-table :data="recentWfExec" size="small" border stripe>
                        <el-table-column :label="T('panels.colWfName')" show-overflow-tooltip>
                            <template #default="{ row }">{{ row.workflow_name || row.name || '-' }}</template>
                        </el-table-column>
                        <el-table-column :label="T('panels.colTriggerType')" width="100">
                            <template #default="{ row }">{{ row.trigger_type_display || row.trigger_type || '-' }}</template>
                        </el-table-column>
                        <el-table-column :label="T('panels.colExecTime')" width="150">
                            <template #default="{ row }">{{ formatExecTime(row) }}</template>
                        </el-table-column>
                        <el-table-column :label="T('panels.colResult')" width="80" align="center">
                            <template #default="{ row }">
                                <el-tag :type="wfExecStatusTag(row.status)" size="small">
                                    {{ formatWfExecStatus(row.status) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>

            <div class="right-col ee-gate-section"
                 :class="{ 'is-ee-gate': !hasFeature('SCRIPT_TASK_UNIFIED') }"
                 :title="!hasFeature('SCRIPT_TASK_UNIFIED') ? t('message.pages.edition.enterpriseOnlyTooltip') : ''"
                 @click="handleScheduleColClick">
                <div class="panel-card">
                    <div class="panel-header">
                        <span class="panel-title">{{ T('panels.myScheduleTitle') }}</span>
                        <el-button text type="primary" size="small" @click="goLegacySchedule">{{ T('panels.scheduleCenter') }}</el-button>
                    </div>
                    <el-table :data="mySchedules" size="small" border stripe>
                        <el-table-column :label="T('panels.colScheduleName')" show-overflow-tooltip>
                            <template #default="{ row }">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <el-tag
                                        :type="row.item_type === 'script_task' ? '' : 'success'"
                                        size="small"
                                        effect="dark"
                                        style="flex-shrink: 0;"
                                    >
                                        {{ scheduleItemTypeLabel(row) }}
                                    </el-tag>
                                    <span>{{ row.name }}</span>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column :label="T('panels.colScheduleCycle')" width="160">
                            <template #default="{ row }">{{ formatScheduleCron(row) }}</template>
                        </el-table-column>
                        <el-table-column prop="status" :label="T('panels.colScheduleStatus')" width="80" align="center">
                            <template #default="{ row }">
                                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                                    {{ scheduleStatusLabel(row) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
        </div>

        <div class="quick-sidebar">
            <div class="quick-item quick-item--exec" @click="goCommandExec" :title="T('sidebar.quickExec')">
                <div class="quick-icon">▶</div>
                <span>{{ T('sidebar.quickExec') }}</span>
            </div>
            <div class="quick-item quick-item--script" @click="goScriptLibrary" :title="T('sidebar.scriptLibrary')">
                <div class="quick-icon">+</div>
                <span>{{ T('sidebar.scriptLibrary') }}</span>
            </div>
            <div class="quick-item quick-item--wf" @click="goWfList" :title="T('sidebar.workflow')">
                <div class="quick-icon">⇆</div>
                <span>{{ T('sidebar.workflow') }}</span>
            </div>
            <div class="quick-item quick-item--schedule" @click="goSchedule" :title="T('sidebar.schedule')">
                <div class="quick-icon">⏰</div>
                <span>{{ T('sidebar.schedule') }}</span>
            </div>
            <div class="quick-item quick-item--host" @click="goHostList" :title="T('sidebar.hostMgmt')">
                <div class="quick-icon">🖥</div>
                <span>{{ T('sidebar.hostMgmt') }}</span>
            </div>
        </div>

    </div>
</template>

<style scoped lang="scss">
.dashboard-page {
  width: 100%;
  min-height: 100vh;
  padding: 12px;
  box-sizing: border-box;
  background: #f5f7fa;
}

.welcome-bar {
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .welcome-text {
    h2 {
      margin: 0 0 4px 0;
      font-size: 18px;
      color: #333;
      font-weight: 600;
    }
    p {
      margin: 0;
      font-size: 12px;
      color: #999;
    }
  }

  .welcome-actions {
    display: flex;
    gap: 8px;
  }
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.stat-card {
  background: #fff;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .stat-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-icon {
    font-size: 20px;
  }

  .stat-icon-blue { color: #409eff; background: #ecf5ff; }
  .stat-icon-green { color: #67c23a; background: #f0f9eb; }
  .stat-icon-cyan { color: #13c2c2; background: #e6fffb; }
  .stat-icon-orange { color: #e6a23c; background: #fdf6ec; }
  .stat-icon-red { color: #f56c6c; background: #fef0f0; }
  .stat-icon-yellow { color: #faad14; background: #fffbe6; }
  .stat-icon-gray { color: #909399; background: #f4f4f5; }
  .stat-icon-purple { color: #722ed1; background: #f9f0ff; }

  .stat-content { flex: 1; }

  .stat-num {
    font-size: 22px;
    font-weight: 600;
    color: #333;
    margin-bottom: 2px;

    &.stat-green { color: #67c23a; }
    &.stat-cyan { color: #13c2c2; }
    &.stat-orange { color: #e6a23c; }
    &.stat-red { color: #f56c6c; }
    &.stat-yellow { color: #faad14; }
    &.stat-gray { color: #909399; }
    &.stat-purple { color: #722ed1; }
  }

  .stat-label {
    font-size: 12px;
    color: #666;
  }
}

.approval-section {
  margin-bottom: 12px;

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }
}

.approval-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.approval-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  &:hover {
    background: #fff;
    border-color: #409eff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  }

  .approval-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 18px;
  }

  .approval-icon-blue { color: #409eff; background: #ecf5ff; }
  .approval-icon-green { color: #67c23a; background: #f0f9eb; }
  .approval-icon-cyan { color: #13c2c2; background: #e6fffb; }
  .approval-icon-orange { color: #e6a23c; background: #fdf6ec; }
  .approval-icon-purple { color: #722ed1; background: #f9f0ff; }

  .approval-content {
    flex: 1;
    min-width: 0;
  }

  .approval-num {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 1px;

    &.approval-blue { color: #409eff; }
    &.approval-green { color: #67c23a; }
    &.approval-cyan { color: #13c2c2; }
    &.approval-orange { color: #e6a23c; }
    &.approval-purple { color: #722ed1; }
  }

  .approval-label {
    font-size: 11px;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.wf-stats-section {
  margin-bottom: 12px;

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }
}

.wf-stats-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.wf-stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  &:hover {
    background: #fff;
    border-color: #409eff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  }

  .wf-stat-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 18px;
  }

  .wf-stat-content {
    flex: 1;
    min-width: 0;
  }

  .wf-stat-num {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 1px;
  }

  .wf-stat-label {
    font-size: 11px;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;

  .chart-card {
    background: #fff;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    // CE 下的 EE 卡片：整张置灰，不做占位符（保持 echarts 渲染结果原样）
    &.chart-card--ee-gate {
      cursor: not-allowed;
      position: relative;
      // 用 ::after 覆盖层整体应用滤镜（避免直接在父元素上使用 filter 影响 position/z-index）
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
      // 再叠一层可点击捕获的遮罩，触发父级 @click → handleWfCardClick 弹升级
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        cursor: not-allowed;
        z-index: 2;
      }
      // 阻止 echarts canvas 内部的 click 事件（用户点击的是 ::after）

      &:hover {
        transform: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }
    }

    .chart-container {
      height: 220px;
      width: 100%;
    }
  }
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

// ======== 统一 EE 功能区块置灰（原元素保留，::before 灰化 + ::after 捕获点击）========
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
}

.main-content {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.left-col,
.right-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-shrink: 0;

  .panel-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
}

.panel-card :deep(.el-table) {
  flex: 1;
  height: auto !important;
}

@media screen and (max-width: 1366px) {
  .stat-row { grid-template-columns: repeat(4, 1fr); }
  .approval-row { grid-template-columns: repeat(5, 1fr); }
  .wf-stats-row { grid-template-columns: repeat(3, 1fr); }
}

@media screen and (max-width: 1200px) {
  .approval-row { grid-template-columns: repeat(3, 1fr); }
}

@media screen and (max-width: 1024px) {
  .main-content { flex-direction: column; }
  .stat-row { grid-template-columns: repeat(3, 1fr); }
  .charts-row { grid-template-columns: repeat(2, 1fr); }
}

@media screen and (max-width: 768px) {
  .welcome-bar {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
    .welcome-actions { flex-wrap: wrap; }
  }
  .stat-row { grid-template-columns: repeat(2, 1fr); }
  .approval-row { grid-template-columns: repeat(2, 1fr); }
  .wf-stats-row { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
  .quick-sidebar { display: none; }
}

.quick-sidebar {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 8px 0;
  z-index: 100;

  .quick-item {
    width: 92px;
    padding: 10px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.2s;
    border-left: 3px solid transparent;

    .quick-icon {
      font-size: 18px;
      color: #909399;
      transition: color 0.2s;
    }

    span {
      font-size: 11px;
      color: #606266;
      transition: color 0.2s;
      white-space: nowrap;
      text-align: center;
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      box-sizing: border-box;
      padding: 0 2px;
      line-height: 1.3;
    }
  }

  .quick-item--exec {
    border-left-color: #409eff;
    &:hover {
      background: #ecf5ff;
      .quick-icon, span { color: #409eff; }
    }
  }

  .quick-item--script {
    border-left-color: #67c23a;
    &:hover {
      background: #f0f9eb;
      .quick-icon, span { color: #67c23a; }
    }
  }

  .quick-item--wf {
    border-left-color: #e6a23c;
    &:hover {
      background: #fdf6ec;
      .quick-icon, span { color: #e6a23c; }
    }
  }

  .quick-item--schedule {
    border-left-color: #909399;
    &:hover {
      background: #f4f4f5;
      .quick-icon, span { color: #606266; }
    }
  }

  .quick-item--host {
    border-left-color: #f56c6c;
    &:hover {
      background: #fef0f0;
      .quick-icon, span { color: #f56c6c; }
    }
  }
}
</style>