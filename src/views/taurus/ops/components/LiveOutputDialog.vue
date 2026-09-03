<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="900px"
    class="live-output-dialog"
    :close-on-click-modal="false"
    append-to-body
    destroy-on-close
  >
    <div class="output-container">
      <pre class="output-pre" ref="preRef">{{ content }}</pre>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button size="small" type="primary" @click="copyToClipboard">
          <el-icon><CopyDocument /></el-icon>
          {{ t('copyAll') }}
        </el-button>
        <el-button size="small" type="info" @click="scrollToBottom" :disabled="!content">
          <el-icon><Bottom /></el-icon>
          {{ t('scrollToBottom') }}
        </el-button>
        <!-- <el-button size="small" @click="clearOutput">
          <el-icon><Delete /></el-icon>
          {{ t('clearOutput') }}
        </el-button> -->
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { computed, ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ElMessage, ElMessageBox } from 'element-plus';
import { CopyDocument, Bottom, Delete } from '@element-plus/icons-vue';

const props = defineProps<{
  modelValue: boolean;
  title: string;
  content: string;
  autoScroll?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'clear'): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const preRef = ref<HTMLPreElement>();
const autoScroll = computed(() => props.autoScroll ?? true);

// Auto-scroll to bottom
watch(() => props.content, () => {
  if (autoScroll.value) {
    nextTick(() => {
      scrollToBottom();
    });
  }
});

// Copy to clipboard
const copyToClipboard = async () => {
  if (!props.content) {
    ElMessage.warning(t('msgNoCopyContent'));
    return;
  }
  try {
    await navigator.clipboard.writeText(props.content);
    ElMessage.success(t('msgCopied'));
  } catch (e) {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = props.content;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    ElMessage.success(t('msgCopied'));
  }
};

// Scroll to bottom
const scrollToBottom = () => {
  if (preRef.value) {
    preRef.value.scrollTop = preRef.value.scrollHeight;
  }
};

// {{ t('clearOutput') }}
const clearOutput = () => {
  ElMessageBox.confirm(t('confirmClearMsg'), t('confirmClearTitle'), {
    type: 'warning',
  }).then(() => {
    emit('clear');
  }).catch(() => {});
};
</script>

<style scoped>
.live-output-dialog {
  .el-dialog__body {
    padding: 12px;
    max-height: calc(100vh - 180px);
    overflow: hidden;
  }
}

.output-container {
  height: 100%;
  overflow: hidden;
}

.output-pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: calc(100vh - 240px);
  overflow-y: auto;
  margin: 0;
  transition: background-color 0.3s;
}

.output-pre::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.output-pre::-webkit-scrollbar-track {
  background: #2d2d2d;
  border-radius: 4px;
}

.output-pre::-webkit-scrollbar-thumb {
  background: #4d4d4d;
  border-radius: 4px;
}

.output-pre::-webkit-scrollbar-thumb:hover {
  background: #6d6d6d;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>