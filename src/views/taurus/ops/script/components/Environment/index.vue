<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { VAceEditor } from "vue3-ace-editor";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/snippets/json";
import "ace-builds/src-noconflict/theme-github_light_default";
import "ace-builds/src-noconflict/theme-github_dark";
import { ElMessage } from "element-plus";

const { t } = useI18n();

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void;
}>();

type EnvType = { key: string; value: string };
const showDialog = ref(false);
const lang = ref<'keyValue' | 'json'>('keyValue');
const tempData = ref<EnvType[]>([]);
const code = ref("");
const aceTheme = ref('github_light_default');
const aceOptions = ref({
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: true,
  enableSnippets: true,
  showLineNumbers: true,
  tabSize: 2,
  fontSize: '14px',
  highlightActiveLine: true,
  showPrintMargin: false,
  readOnly: false,
});

watch(
  () => props.modelValue, (val: any) => {
    try {
      tempData.value = val ? JSON.parse(val) : [];
    } catch {
      tempData.value = [];
    }
    code.value = JSON.stringify(tempData.value, null, 2);
  }, { immediate: true }
);

function openDialog() {
  try {
    tempData.value = props.modelValue ? JSON.parse(props.modelValue) : [];
  } catch {
    tempData.value = [];
  }
  code.value = JSON.stringify(tempData.value, null, 2);
  lang.value = 'keyValue';
  showDialog.value = true;
}

function addItem() {
  tempData.value.push({ key: '', value: '' });
}

function removeItem(index: number) {
  tempData.value.splice(index, 1);
}

function clearAll() {
  tempData.value.splice(0, tempData.value.length);
  code.value = "[]";
}

function handleSave() {
  try {
    if (lang.value === 'json') {
      const parsed = JSON.parse(code.value);
      emit('update:modelValue', JSON.stringify(parsed, null, 2));
    } else {
      emit('update:modelValue', JSON.stringify(tempData.value, null, 2));
    }
    showDialog.value = false;
    ElMessage.success(t('message.pages.opsScript.envSaveSuccess'));
  } catch (e) {
    ElMessage.error(t('message.pages.opsScript.envJsonError'));
  }
}

function onCodeChange(val: string) {
  code.value = val;
}

const filledCount = () => {
  if (lang.value === 'json') {
    try {
      const parsed = JSON.parse(code.value);
      if (Array.isArray(parsed)) {
        return parsed.filter((i) => i && i.key && String(i.key).trim() !== '').length;
      } else if (typeof parsed === 'object' && parsed !== null) {
        return Object.keys(parsed).filter((k) => k.trim() !== '').length;
      }
    } catch {
      return 0;
    }
  }
  return (tempData.value || []).filter((i) => i.key && String(i.key).trim() !== '').length;
};
</script>

<template>
  <div>
    <el-button size="large" @click="openDialog">
      <template #icon>
        <fs-iconify icon="ion:options-outline" />
      </template>
      {{ t('message.pages.opsScript.envBtn') }}
      <el-tag v-if="filledCount() > 0" size="small" type="warning" effect="dark" round style="margin-left: 6px">
        {{ filledCount() }}
      </el-tag>
    </el-button>

    <el-dialog v-model="showDialog" :title="t('message.pages.opsScript.envDialogTitle')" width="700px" :close-on-click-modal="false">
      <el-radio-group v-model="lang" style="margin-bottom: 12px">
        <el-radio value="keyValue">{{ t('message.pages.opsScript.envModeKeyValue') }}</el-radio>
        <el-radio value="json">{{ t('message.pages.opsScript.envModeJson') }}</el-radio>
      </el-radio-group>

      <el-form v-if="lang === 'keyValue'">
        <el-form-item v-for="(env, index) in tempData" :key="index" :label="t('message.pages.opsScript.envLabelItem', { index: index + 1 })">
          <el-row :gutter="10">
            <el-col :span="11">
              <el-input v-model="env.key" placeholder="KEY" />
            </el-col>
            <el-col :span="11">
              <el-input v-model="env.value" placeholder="VALUE" />
            </el-col>
            <el-col :span="2">
              <el-button link type="danger" @click="removeItem(index)">
                <fs-iconify icon="ion:close-outline" />
              </el-button>
            </el-col>
          </el-row>
        </el-form-item>
        <el-empty v-if="tempData.length === 0" :description="t('message.pages.opsScript.envEmpty')" />
      </el-form>

      <div v-if="lang === 'json'">
        <v-ace-editor
          v-model:value="code"
          :options="aceOptions"
          lang="json"
          :theme="aceTheme"
          style="width: 100%; height: 380px"
          @change="onCodeChange"
        />
      </div>

      <template #footer>
        <el-button @click="clearAll">{{ t('message.pages.opsScript.envClear') }}</el-button>
        <el-button type="success" @click="addItem" v-if="lang === 'keyValue'">{{ t('message.pages.opsScript.envAdd') }}</el-button>
        <el-button @click="showDialog = false">{{ t('message.pages.opsScript.envCancel') }}</el-button>
        <el-button type="primary" @click="handleSave">{{ t('message.pages.opsScript.envSave') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
</style>
