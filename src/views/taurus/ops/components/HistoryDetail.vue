<template>
  <div class="expand-output">
    <div class="expand-info">
      <div v-if="row.execution_id" class="info-item">
        <span class="info-label">{{ t('execId') }}</span>
        <span class="info-value">{{ row.execution_id }}</span>
      </div>
      <div v-if="row.host_name || row.host_ip" class="info-item">
        <span class="info-label">{{ t('targetHosts') }}</span>
        <span class="info-value">{{ row.host_name || '' }} {{ row.host_ip ? '(' + row.host_ip + ')' : '' }}</span>
      </div>
      <div v-if="row.started_at" class="info-item">
        <span class="info-label">{{ t('startTimeLabel') }}</span>
        <span class="info-value">{{ formatTimestamp(row.started_at) }}</span>
      </div>
      <div v-if="row.finished_at" class="info-item">
        <span class="info-label">{{ t('endTimeLabel') }}</span>
        <span class="info-value">{{ formatTimestamp(row.finished_at) }}</span>
      </div>
      <div v-if="row.exit_code !== null && row.exit_code !== undefined" class="info-item">
        <span class="info-label">{{ t('exitCodeLabel') }}</span>
        <span class="info-value" :class="row.exit_code === 0 ? 'text-success' : 'text-danger'">{{ row.exit_code }}</span>
      </div>
      <div v-if="row.timeout_seconds" class="info-item">
        <span class="info-label">{{ t('timeoutSetting') }}</span>
        <span class="info-value">{{ row.timeout_seconds }}s</span>
      </div>
      <div v-if="row.working_directory" class="info-item">
        <span class="info-label">{{ t('workingDir') }}</span>
        <span class="info-value">{{ row.working_directory }}</span>
      </div>
      <div v-if="row.use_shell !== null && row.use_shell !== undefined" class="info-item">
        <span class="info-label">{{ t('shellMode') }}</span>
        <span class="info-value">{{ row.use_shell ? t('enabled') : t('disabled') }}</span>
      </div>
      <div v-if="row.merge_streams !== null && row.merge_streams !== undefined" class="info-item">
        <span class="info-label">{{ t('mergeOutput') }}</span>
        <span class="info-value">{{ row.merge_streams ? t('yes') : t('no') }}</span>
      </div>
      <div v-if="row.privileged !== null && row.privileged !== undefined" class="info-item">
        <span class="info-label">{{ t('privilegedExec') }}</span>
        <span class="info-value">{{ row.privileged ? t('yes') : t('no') }}</span>
      </div>
      <div v-if="row.su_user" class="info-item">
        <span class="info-label">{{ t('switchUser') }}</span>
        <span class="info-value">{{ row.su_user }}</span>
      </div>
    </div>
    <div v-if="row.command" class="output-section">
      <div class="section-title">{{ t('execCommand') }}</div>
      <pre class="output-pre output-command">{{ row.command }}</pre>
    </div>
    <div v-if="row.file_path" class="output-section">
      <div class="section-title">{{ row.execution_type === 'upload' ? t('uploadFile') : t('downloadFile') }}</div>
      <pre class="output-pre">{{ row.file_path }}<span v-if="row.file_size"> ({{ row.file_size }}{{ t('bytes') }})</span></pre>
    </div>
    <div v-if="row.script_content" class="output-section">
      <div class="section-title">{{ t('scriptContent') }} <span v-if="row.script_type" class="text-muted">({{ row.script_type }})</span></div>
      <pre class="output-pre">{{ row.script_content }}</pre>
    </div>
    <div v-if="row.output && row.output.length > 0" class="output-section">
      <div class="section-title">{{ t('execOutput') }}</div>
      <pre class="output-pre output-stdout">{{ row.output }}</pre>
    </div>
    <div v-if="row.environment && Object.keys(row.environment).length > 0" class="output-section">
      <div class="section-title">{{ t('envVars') }}</div>
      <pre class="output-pre output-env">{{ JSON.stringify(row.environment, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatTimestamp } from './historyUtils';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  row: any;
}>();
</script>

<style>
.expand-output {
  width: 100%;
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.6;
  background: #fafafa;
  box-sizing: border-box;
}

.expand-info {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 12px;
  box-sizing: border-box;
}

.info-item {
  display: flex;
  align-items: center;
  flex: 1 0 200px;
  min-width: 0;
}

.info-label {
  color: #606266;
  margin-right: 6px;
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
}

.info-value {
  color: #303133;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  word-break: break-all;
}

.output-section {
  width: 100%;
  margin-bottom: 12px;
  box-sizing: border-box;
}

.section-title {
  font-weight: 600;
  color: #606266;
  margin-bottom: 6px;
  font-size: 13px;
}

.output-pre {
  width: 100%;
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 400px;
  overflow: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  box-sizing: border-box;
}

.output-command {
  background: #2d2d2d;
  color: #ce9178;
}

.output-stdout {
  color: #d4d4d4;
}

.output-stderr {
  background: #3d2828;
  color: #f48771;
}

.output-args {
  background: #2d3a2d;
  color: #b5cea8;
}

.output-env {
  background: #2d2d3a;
  color: #9cdcfe;
}

.output-error {
  color: #f56c6c;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

.text-muted {
  color: #909399;
}
</style>