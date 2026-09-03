<template>
  <SectionBlock :title="title || t('execContent')" :icon="icon || Document">
    <el-form-item :label="t('execType')">
      <template v-if="executionTypeMode === 'display'">
        <el-tag
          :type="effectiveExecutionType === 'script' ? 'primary' : 'success'"
          effect="light"
          size="small"
          round
        >
          {{ effectiveExecutionType === 'script' ? t('script') : t('command') }}
        </el-tag>
      </template>
      <template v-else>
        <el-radio-group v-model="localExecutionType" size="small">
          <el-radio-button
            v-for="opt in effectiveExecutionTypeOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </el-radio-button>
        </el-radio-group>
        <span v-if="emptyHint" class="field-hint" style="margin-left: 8px">{{ emptyHint }}</span>
      </template>
    </el-form-item>

    <el-form-item v-if="effectiveExecutionType === 'command'" :label="t('execContent')">
      <template v-if="executionTypeMode === 'display'">
        <div class="content-display command-display">{{ localForm.command || '-' }}</div>
      </template>
      <el-input
        v-else
        v-model="localForm.command"
        type="textarea"
        :rows="commandRows"
        :placeholder="commandPlaceholder || t('execContentPlaceholder')"
        resize="vertical"
      />
    </el-form-item>

    <template v-if="effectiveExecutionType === 'script'">
      <el-form-item :label="t('scriptType')">
        <template v-if="executionTypeMode === 'display'">
          <el-tag effect="light" size="small" round>
            {{ currentScriptTypeLabel }}
          </el-tag>
        </template>
        <el-select v-else v-model="localForm.script_type" size="small" style="width: 140px">
          <el-option
            v-for="opt in scriptTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('scriptContent')">
        <template v-if="executionTypeMode === 'display'">
          <div class="content-display script-display"><pre>{{ localForm.script_content || '-' }}</pre></div>
        </template>
        <el-input
          v-else
          v-model="localForm.script_content"
          type="textarea"
          :rows="scriptRows"
          :placeholder="scriptPlaceholder || t('scriptPlaceholder')"
          resize="vertical"
        />
      </el-form-item>
    </template>
  </SectionBlock>
</template>

<script setup lang="ts">
import { computed, watch, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { Document } from '@element-plus/icons-vue';
import type { RerunFormData } from './historyUtils';
import SectionBlock from './SectionBlock.vue';

interface ScriptTypeOption {
  label: string;
  value: string;
}

interface ExecutionTypeOption {
  label: string;
  value: string;
}

const props = withDefaults(defineProps<{
  form: RerunFormData;
  title?: string;
  icon?: any;
  executionTypeMode?: 'display' | 'toggle';
  executionTypeOptions?: ExecutionTypeOption[];
  emptyHint?: string;
  commandPlaceholder?: string;
  scriptPlaceholder?: string;
  commandRows?: number;
  scriptRows?: number;
  scriptTypeOptions?: ScriptTypeOption[];
}>(), {
  executionTypeMode: 'toggle',
  commandRows: 3,
  scriptRows: 6,
  scriptTypeOptions: () => [
    { label: 'Shell', value: 'sh' },
    { label: 'Python', value: 'python' },
  ],
});

const defaultExecutionTypeOptions: ExecutionTypeOption[] = [
  { label: t('command'), value: 'command' },
  { label: t('script'), value: 'script' },
];

const effectiveExecutionTypeOptions = computed(() => {
  if (props.executionTypeOptions?.length) return props.executionTypeOptions;
  return defaultExecutionTypeOptions;
});

const emit = defineEmits<{
  (e: 'update:form', value: RerunFormData): void;
}>();

const localForm = reactive({ ...props.form }) as any;

function ensureExecutionType(val: any) {
  if (!val.execution_type) {
    val.execution_type = val.script_content ? 'script' : 'command';
  }
}

ensureExecutionType(localForm);

watch(() => props.form, (val) => {
  Object.assign(localForm, val);
  ensureExecutionType(localForm);
}, { deep: true });

watch(localForm, (val) => {
  ensureExecutionType(val);
  emit('update:form', { ...val });
}, { deep: true });

const localExecutionType = computed({
  get: () => localForm.execution_type,
  set: (val: any) => {
    localForm.execution_type = val;
  },
});

const effectiveExecutionType = computed(() => {
  return localForm.execution_type || (localForm.script_content ? 'script' : 'command');
});

const currentScriptTypeLabel = computed(() => {
  const val = localForm.script_type || 'sh';
  const found = props.scriptTypeOptions.find((o: ScriptTypeOption) => o.value === val);
  return found ? found.label : val;
});
</script>

<style scoped lang="scss">
.field-hint {
  font-size: 12px;
  color: #909399;
}

.content-display {
  width: 100%;
  padding: 8px 12px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 13px;
  color: #303133;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;
  }
}

.script-display {
  background: #1e1e1e;
  border-color: #404040;
  color: #d4d4d4;

  pre {
    margin: 0;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>