<template>
  <fs-page>
    <fs-crud ref="crudRef" v-bind="crudBinding">
    </fs-crud>

    <!-- Host load dialog -->
    <el-dialog
      v-model="showLoadDialog"
      :title="loadDialogTitle"
      width="80%"
    >
      <div v-loading="chartLoading" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div data-chart style="height: 280px;"></div>
        <div data-chart style="height: 280px;"></div>
        <div data-chart style="height: 280px;"></div>
        <div data-chart style="height: 280px;"></div>
        <div data-chart style="height: 280px;"></div>
        <div data-chart style="height: 280px;"></div>
      </div>
    </el-dialog>
  </fs-page>
</template>

<script lang="ts" setup name="heartbeat">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useFs } from '@fast-crud/fast-crud';
import { createCrudOptions, setLoadMetricsCallback } from './crud';
import { echarts } from '/@/utils/echarts';
import { i18n } from '/@/i18n';

// @ts-ignore — vue-i18n type inference chain too deep, runtime is fine
const t = i18n.global.t;

const showLoadDialog = ref(false);
const chartLoading = ref(false);
const currentHost = ref<any>(null);
const chartInstances = ref<echarts.ECharts[]>([]);

const loadDialogTitle = computed(() => {
  const title = t('message.pages.heartbeat.dialog.loadMetricsTitle');
  const hostName = currentHost.value?.host_name || '';
  return hostName ? `${title} - ${hostName}` : title;
});

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return val.toFixed(2) + ' ' + units[i];
}

function formatUptime(seconds: number): string {
  if (!seconds) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const dayLabel = t('message.pages.heartbeat.uptime.days');
  const hourLabel = t('message.pages.heartbeat.uptime.hours');
  const minuteLabel = t('message.pages.heartbeat.uptime.minutes');
  if (days > 0) return `${days}${dayLabel}${hours}${hourLabel}${minutes}${minuteLabel}`;
  if (hours > 0) return `${hours}${hourLabel}${minutes}${minuteLabel}`;
  return `${minutes}${minuteLabel}`;
}

// Data to be rendered is stored here
const pendingRowData = ref<any>(null);

function showLoadMetrics(row: any) {
  currentHost.value = row;
  pendingRowData.value = row;
  showLoadDialog.value = true;
}

// Watch for dialog open, then render charts
watch(showLoadDialog, async (val) => {
  if (val && pendingRowData.value) {
    // Wait for dialog animation to finish
    await new Promise(resolve => setTimeout(resolve, 300));

    // Get container via DOM query (el-dialog uses teleport)
    const dialogEl = document.querySelector('.el-dialog__body');
    if (!dialogEl) return;

    const containers = dialogEl.querySelectorAll('[data-chart]');
    if (containers.length === 0) return;

    const chartData = pendingRowData.value;
    chartInstances.value.forEach(c => c.dispose());
    chartInstances.value = [];

    const { cpu_usage, memory_usage, disk_usage, load_average, network_rx_bytes, network_tx_bytes, process_count, uptime_seconds } = chartData;

    // CPU gauge
    const cpuContainer = containers[0] as HTMLElement;
    if (cpuContainer) {
      const chart = echarts.init(cpuContainer);
      chart.setOption({
        title: { text: t('message.pages.heartbeat.charts.cpuUsage'), left: 'center', top: 10 },
        series: [{
          type: 'gauge',
          progress: { show: true, width: 18 },
          axisLine: { lineStyle: { width: 18 } },
          axisTick: { show: false },
          splitLine: { length: 15, lineStyle: { width: 2, color: '#999' } },
          axisLabel: { distance: 25, color: '#999', fontSize: 12 },
          anchor: { show: true, showAbove: true, size: 25, itemStyle: { borderWidth: 10 } },
          pointer: { length: '60%', width: 5 },
          detail: { valueAnimation: true, fontSize: 24, offsetCenter: [0, '70%'], formatter: '{value}%' },
          data: [{ value: cpu_usage?.toFixed(1) || 0 }],
        }],
      });
      chartInstances.value.push(chart);
    }

    // Memory gauge
    const memContainer = containers[1] as HTMLElement;
    if (memContainer) {
      const chart = echarts.init(memContainer);
      chart.setOption({
        title: { text: t('message.pages.heartbeat.charts.memoryUsage'), left: 'center', top: 10 },
        series: [{
          type: 'gauge',
          progress: { show: true, width: 18 },
          axisLine: { lineStyle: { width: 18 } },
          axisTick: { show: false },
          splitLine: { length: 15, lineStyle: { width: 2, color: '#999' } },
          axisLabel: { distance: 25, color: '#999', fontSize: 12 },
          anchor: { show: true, showAbove: true, size: 25, itemStyle: { borderWidth: 10 } },
          pointer: { length: '60%', width: 5 },
          detail: { valueAnimation: true, fontSize: 24, offsetCenter: [0, '70%'], formatter: '{value}%' },
          data: [{ value: memory_usage?.toFixed(1) || 0 }],
        }],
      });
      chartInstances.value.push(chart);
    }

    // Disk gauge
    const diskContainer = containers[2] as HTMLElement;
    if (diskContainer) {
      const chart = echarts.init(diskContainer);
      chart.setOption({
        title: { text: t('message.pages.heartbeat.charts.diskUsage'), left: 'center', top: 10 },
        series: [{
          type: 'gauge',
          progress: { show: true, width: 18 },
          axisLine: { lineStyle: { width: 18 } },
          axisTick: { show: false },
          splitLine: { length: 15, lineStyle: { width: 2, color: '#999' } },
          axisLabel: { distance: 25, color: '#999', fontSize: 12 },
          anchor: { show: true, showAbove: true, size: 25, itemStyle: { borderWidth: 10 } },
          pointer: { length: '60%', width: 5 },
          detail: { valueAnimation: true, fontSize: 24, offsetCenter: [0, '70%'], formatter: '{value}%' },
          data: [{ value: disk_usage?.toFixed(1) || 0 }],
        }],
      });
      chartInstances.value.push(chart);
    }

    // System load
    const loadContainer = containers[3] as HTMLElement;
    if (loadContainer) {
      const chart = echarts.init(loadContainer);
      chart.setOption({
        title: { text: t('message.pages.heartbeat.charts.systemLoad'), left: 'center', top: 10 },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: [t('message.pages.heartbeat.charts.loadAverage')] },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: [parseFloat(load_average) || 0],
          itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] },
          barWidth: '40%',
          label: { show: true, position: 'top', fontSize: 14 },
        }],
        grid: { left: 60, right: 30, top: 50, bottom: 30 },
      });
      chartInstances.value.push(chart);
    }

    // Network traffic
    const netContainer = containers[4] as HTMLElement;
    if (netContainer) {
      const chart = echarts.init(netContainer);
      chart.setOption({
        title: { text: t('message.pages.heartbeat.charts.networkTraffic'), left: 'center', top: 10 },
        tooltip: { trigger: 'axis', formatter: '{b}: {c}' },
        xAxis: { type: 'category', data: [t('message.pages.heartbeat.charts.rx'), t('message.pages.heartbeat.charts.tx')] },
        yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatBytes(v) } },
        series: [{
          type: 'bar',
          data: [network_rx_bytes || 0, network_tx_bytes || 0],
          itemStyle: {
            color: (params: any) => params.dataIndex === 0 ? '#67c23a' : '#e6a23c',
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: '40%',
          label: { show: true, position: 'top', formatter: (p: any) => formatBytes(p.value), fontSize: 12 },
        }],
        grid: { left: 70, right: 30, top: 50, bottom: 30 },
      });
      chartInstances.value.push(chart);
    }

    // Process count & uptime
    const procContainer = containers[5] as HTMLElement;
    if (procContainer) {
      const chart = echarts.init(procContainer);
      chart.setOption({
        title: { text: t('message.pages.heartbeat.charts.procAndUptime'), left: 'center', top: 10 },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: [t('message.pages.heartbeat.charts.processCount'), t('message.pages.heartbeat.charts.uptimeHours')] },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: [process_count || 0, uptime_seconds ? (uptime_seconds / 3600).toFixed(1) : 0],
          itemStyle: {
            color: (params: any) => params.dataIndex === 0 ? '#909399' : '#409eff',
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: '40%',
          label: {
            show: true,
            position: 'top',
            formatter: (p: any) => p.dataIndex === 1 ? formatUptime(uptime_seconds) : p.value,
            fontSize: 12,
          },
        }],
        grid: { left: 60, right: 30, top: 50, bottom: 30 },
      });
      chartInstances.value.push(chart);
    }

    pendingRowData.value = null;
  }
});

// Register callbacks into the crud module
setLoadMetricsCallback(showLoadMetrics);

function handleResize() {
  chartInstances.value.forEach(c => c.resize());
}

const { crudBinding, crudRef, crudExpose } = useFs({ createCrudOptions });

onMounted(() => {
  crudExpose.doRefresh();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartInstances.value.forEach(c => c.dispose());
});
</script>