<template>
	<ExecutionHistoryPanel
		mode="page"
		:fetch-list="executionApi.GetList"
		:fetch-detail="executionApi.GetObj"
		:execute-command-fn="opsApi.executeCommand"
		:execute-script-fn="opsApi.executeScript"
		:terminate-command-fn="opsApi.terminateCommand"
		:get-web-socket-url="getOpsWebSocketUrl"
		:show-export="true"
		:show-copy-command="false"
		:show-live-output="true"
		:load-children-mode="'memory'"
	/>
</template>

<script lang="ts" setup name="history">
import ExecutionHistoryPanel from '/@/views/taurus/ops/components/ExecutionHistoryPanel.vue';
import * as executionApi from '/@/api/taurus/ops-execution/api';
import * as opsApi from '/@/api/taurus/ops/index';
import { getOpsWebSocketUrl } from '/@/api/taurus/ops/index';
</script>
