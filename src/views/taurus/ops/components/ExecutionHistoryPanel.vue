<template>
  <div :class="mode === 'page' ? 'history-page-wrapper' : 'history-panel-wrapper'">
    <fs-page v-if="mode === 'page'">
      <div class="history-container">
        <HistoryPanelBody
          ref="bodyRef"
          :fetch-list="fetchList"
          :fetch-detail="fetchDetail"
          :execute-command-fn="executeCommandFn"
          :execute-script-fn="executeScriptFn"
          :terminate-command-fn="terminateCommandFn"
          :get-web-socket-url="getWebSocketUrl"
          :show-export="showExport"
          :show-copy-command="showCopyCommand"
          :show-live-output="showLiveOutput"
          :load-children-mode="loadChildrenMode"
          :refresh-event-name="refreshEventName"
          @fill-from-history="$emit('fill-from-history', $event)"
        />
      </div>
    </fs-page>
    <HistoryPanelBody
      v-else
      ref="bodyRef"
      :fetch-list="fetchList"
      :fetch-detail="fetchDetail"
      :execute-command-fn="executeCommandFn"
      :execute-script-fn="executeScriptFn"
      :terminate-command-fn="terminateCommandFn"
      :get-web-socket-url="getWebSocketUrl"
      :show-export="showExport"
      :show-copy-command="showCopyCommand"
      :show-live-output="showLiveOutput"
      :load-children-mode="loadChildrenMode"
      :refresh-event-name="refreshEventName"
      @fill-from-history="$emit('fill-from-history', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import HistoryPanelBody from './HistoryPanelBody.vue';

const props = withDefaults(defineProps<{
  mode?: 'page' | 'panel';
  fetchList: (params: any) => Promise<any>;
  fetchDetail: (id: number | string) => Promise<any>;
  executeCommandFn: (params: any) => Promise<any>;
  executeScriptFn: (params: any) => Promise<any>;
  terminateCommandFn: (params: any) => Promise<any>;
  getWebSocketUrl: (executionId: string) => string;
  showExport?: boolean;
  showCopyCommand?: boolean;
  showLiveOutput?: boolean;
  loadChildrenMode?: 'memory' | 'server';
  refreshEventName?: string;
}>(), {
  mode: 'page',
  showExport: false,
  showCopyCommand: false,
  showLiveOutput: true,
  loadChildrenMode: 'memory',
  refreshEventName: '',
});

defineEmits<{
  (e: 'fill-from-history', row: any): void;
}>();

const bodyRef = ref<InstanceType<typeof HistoryPanelBody> | null>(null);

defineExpose({
  refresh: () => bodyRef.value?.refresh(),
});
</script>

<style scoped>
.history-page-wrapper {
  height: 100%;
}
.history-panel-wrapper {
  height: 100%;
}
</style>