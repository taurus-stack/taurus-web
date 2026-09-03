<template>
  <div class="terminal-wrapper">
    <Terminal
      ref="terminalRef"
      :name="terminalName"
      :show-header="false"
      :enable-help-box="false"
      :enable-default-command="false"
      :enable-cursor-blink="false"
      :enable-fold="false"
      cursor-style="none"
      theme="green"
      :log-size-limit="10000"
      :line-space="1.5"
      scroll-mode="smooth"
      context=""
      context-suffix=""
      @init-complete="handleInitComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { Terminal, TerminalApi, createTerminal } from 'vue-web-terminal';

// Register green theme (using CSS variables)
const taurusTerminal = createTerminal();
taurusTerminal.configTheme('green', `
:root {
  --t-main-background-color: #1e1e1e;
  --t-main-font-color: #00ff00;
  --t-cursor-color: #00ff00;
  --t-cmd-line-color: #00ff00;
  --t-log-tag-bg: #333;
  --t-input-bg: #1e1e1e;
  --t-selection-bg: #00ff0040;
  --t-scrollbar-thumb: #424242;
  --t-btn-hover: #505050;
}
`);

const props = withDefaults(defineProps<{
  outputChunks: string[];
  autoScroll?: boolean;
}>(), {
  autoScroll: true,
});

const terminalRef = ref<InstanceType<typeof Terminal> | null>(null);
const terminalName = `output-${Math.random().toString(36).slice(2, 9)}`;
let lastChunkIndex = 0;
let isInitialized = false;

const handleInitComplete = () => {
  // Wait for next frame to ensure internal store is fully initialized
  nextTick(() => {
    isInitialized = true;
    writePendingChunks();
  });
};

onMounted(() => {
  writePendingChunks();
});

const writePendingChunks = () => {
  if (!isInitialized || lastChunkIndex >= props.outputChunks.length) return;

  while (lastChunkIndex < props.outputChunks.length) {
    const chunk = props.outputChunks[lastChunkIndex];
    if (chunk) {
      TerminalApi.pushMessage(terminalName, {
        type: 'ansi',
        content: chunk,
        class: 'info',
      });
    }
    lastChunkIndex++;
  }

  if (props.autoScroll) {
    TerminalApi.jumpToBottom(terminalName, true);
  }
};

watch(() => props.outputChunks.length, () => {
  writePendingChunks();
});

watch(() => props.autoScroll, (v) => {
  if (v && isInitialized) {
    TerminalApi.jumpToBottom(terminalName, true);
  }
});

watch(() => props.outputChunks, () => {
  lastChunkIndex = 0;
  if (isInitialized) {
    TerminalApi.clearLog(terminalName);
  }
}, { deep: false });

// Get plain text output (called by parent component)
// Construct directly from props.outputChunks to avoid newline loss from relying on terminal internal API
const getOutputText = (): string => {
  if (!props.outputChunks || props.outputChunks.length === 0) return '';

  // ANSI escape sequences (SGR colors, cursor control, etc.)
  const ansiRegex = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\[[0-9;]*m|\x1b\[[0-9;]*[JKHF]|\x9b[0-9;]*[a-zA-Z]/g;
  // HTML tags (possibly inserted by terminal component rendering)
  const htmlRegex = /<[^>]+>/g;

  const lines = props.outputChunks
    .filter((chunk) => typeof chunk === 'string' && chunk.length > 0)
    .map((chunk) => chunk.replace(ansiRegex, '').replace(htmlRegex, ''))
    .map((chunk) => chunk.replace(/\t/g, '    '))
    .map((chunk) => chunk.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));

  // Join with empty string (each chunk may already end with \n), then normalize trailing newlines
  let text = lines.join('');
  // Merge consecutive blank lines (keep at most one empty line), but preserve real newlines between content lines
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.replace(/[ \t]+$/gm, '').replace(/^\n+|\n+$/g, '');
};

defineExpose({
  getOutputText,
});
</script>

<style scoped lang="scss">
.terminal-wrapper {
  width: 100%;
  height: 100%;
  min-height: 80px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.t-terminal) {
  border: none !important;
  border-radius: 6px !important;
  height: 100% !important;
  width: 100% !important;
  display: flex !important;
  flex-direction: column !important;
}

:deep(.t-header) {
  display: none !important;
}

:deep(.t-body) {
  padding: 0 !important;
  height: 100% !important;
  flex: 1 !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  background: #1e1e1e !important;
  border-radius: 6px !important;
}

:deep(.t-log) {
  padding: 8px 12px !important;
  height: 100% !important;
  flex: 1 !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  font-size: 13px !important;
  line-height: 1.6 !important;
}

/* Hide command input line and cursor */
:deep(.t-input-line) {
  display: none !important;
}

:deep(.t-cursor) {
  display: none !important;
}
</style>