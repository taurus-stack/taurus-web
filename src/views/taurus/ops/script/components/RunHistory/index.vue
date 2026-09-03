<script setup lang="ts" name="run-history">
import ExecutionHistoryPanel from '/@/views/taurus/ops/components/ExecutionHistoryPanel.vue';
import * as executionApi from '/@/api/taurus/ops-execution/api';
import { executeCommand, executeScript, terminateCommand, getOpsWebSocketUrl } from '/@/api/taurus/ops/index';
</script>

<template>
  <div class="run-history-panel">
    <ExecutionHistoryPanel
      mode="panel"
      :fetch-list="executionApi.GetList"
      :fetch-detail="executionApi.GetObj"
      :execute-command-fn="executeCommand"
      :execute-script-fn="executeScript"
      :terminate-command-fn="terminateCommand"
      :get-web-socket-url="getOpsWebSocketUrl"
      :show-export="false"
      :show-copy-command="false"
      :show-live-output="false"
      :load-children-mode="'server'"
      refresh-event-name="refresh-run-history"
    />
  </div>
</template>

<style scoped>
.run-history-panel {
  height: 100%;
}
</style>
