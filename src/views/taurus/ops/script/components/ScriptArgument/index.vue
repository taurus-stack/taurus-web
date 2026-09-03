<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

type ArgMode = "kv" | "positional";

export type ScriptArgumentItem = {
  key: string;
  value: string;
  desc?: string;
  required?: boolean;
  argType?: "flag" | "value";
  prefix?: string;
};

const props = defineProps<{
  modelValue?: string;
  presetLabel?: string;
  presets?: Array<{ label: string; value: ScriptArgumentItem[] }>;
  mode?: ArgMode;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: string): void;
}>();

const RISK_VALUES = ["rm -rf", "/", "/*", "*", "../", "drop", "truncate"];

const showDialog = ref(false);
const inputMode = ref<ArgMode>(props.mode || "kv");
const tempData = ref<ScriptArgumentItem[]>([]);
const positionalText = ref("");

const dialogTitle = computed(() => props.presetLabel || t('message.pages.opsScript.scriptArgDialogTitle'));

const parseModelValue = (val: string): ScriptArgumentItem[] => {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fallthrough
  }
  return [];
};

watch(
  () => props.modelValue,
  (val) => {
    const parsed = parseModelValue(val || "");
    const isPositional = parsed.length > 0 && parsed.every((i) => !i.key);
    if (isPositional) {
      inputMode.value = "positional";
      positionalText.value = parsed.map((i) => i.value).join(" ");
      tempData.value = [];
    } else {
      inputMode.value = "kv";
      tempData.value = parsed;
      positionalText.value = "";
    }
  },
  { immediate: true }
);

function openDialog() {
  const parsed = parseModelValue(props.modelValue || "");
  const isPositional = parsed.length > 0 && parsed.every((i) => !i.key);
  if (isPositional) {
    inputMode.value = "positional";
    positionalText.value = parsed.map((i) => i.value).join(" ");
    tempData.value = [];
  } else {
    inputMode.value = "kv";
    tempData.value = parsed;
    positionalText.value = "";
  }
  showDialog.value = true;
}

function addItem() {
  tempData.value.push({
    key: `--arg${tempData.value.length + 1}`,
    value: "",
    desc: "",
    required: false,
    argType: "value",
    prefix: "--",
  });
}

function removeItem(index: number) {
  tempData.value.splice(index, 1);
}

function clearAll() {
  tempData.value.splice(0, tempData.value.length);
  positionalText.value = "";
}

function applyPreset(preset: { label: string; value: ScriptArgumentItem[] }) {
  ElMessageBox.confirm(
    t('message.pages.opsScript.scriptArgPresetConfirmMsg', { label: preset.label }),
    t('message.pages.opsScript.scriptArgPresetConfirmTitle'),
    {
      type: "warning",
      confirmButtonText: t('message.pages.opsScript.scriptArgPresetConfirmOk'),
      cancelButtonText: t('message.pages.opsScript.scriptArgBtnCancel'),
    }
  )
    .then(() => {
      tempData.value = preset.value.map((item) => ({
        key: item.key,
        value: item.value,
        desc: item.desc || "",
        required: item.required || false,
        argType: item.argType || "value",
        prefix: item.prefix || "--",
      }));
      ElMessage.success(t('message.pages.opsScript.scriptArgPresetLoaded', { label: preset.label }));
    })
    .catch(() => {});
}

const hasRisk = computed(() => {
  if (inputMode.value === "positional") {
    const text = positionalText.value.toLowerCase();
    return RISK_VALUES.some((key) => text.includes(key));
  }
  return tempData.value.some((item) => {
    const value = (item.value || "").toLowerCase();
    const key = (item.key || "").toLowerCase();
    return RISK_VALUES.some((r) => value.includes(r) || key.includes(r));
  });
});

function handleSave() {
  if (inputMode.value === "kv") {
    const invalid = tempData.value.find((i) => i.required && !i.value);
    if (invalid) {
      return ElMessage.warning(t('message.pages.opsScript.scriptArgRequiredWarn', { key: invalid.key }));
    }
    const valid = tempData.value.filter((i) => i.key && i.key.trim() !== "");
    emit("update:modelValue", JSON.stringify(valid, null, 2));
  } else {
    const parts = positionalText.value
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((v) => ({ key: "", value: v }));
    emit("update:modelValue", JSON.stringify(parts, null, 2));
  }

  if (hasRisk.value) {
    ElMessage.warning(t('message.pages.opsScript.scriptArgSaveRiskWarn'));
  } else {
    ElMessage.success(t('message.pages.opsScript.scriptArgSaveSuccess'));
  }
  showDialog.value = false;
}

const filledCount = computed(() => {
  if (inputMode.value === "positional") {
    return positionalText.value.split(/\s+/).filter(Boolean).length;
  }
  return (tempData.value || []).filter((i) => i.value && String(i.value).trim() !== "").length;
});
</script>

<template>
  <div>
    <el-button size="large" @click="openDialog">
      <template #icon>
        <fs-iconify icon="ion:list-outline" />
      </template>
      <span>{{ presetLabel || t('message.pages.opsScript.scriptArgDialogTitle') }}</span>
      <el-tag
        v-if="filledCount > 0"
        size="small"
        :type="hasRisk ? 'danger' : 'primary'"
        effect="dark"
        round
        style="margin-left: 6px"
      >
        {{ filledCount }}
      </el-tag>
    </el-button>

    <el-dialog
      v-model="showDialog"
      :title="dialogTitle"
      width="760px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="dialog-toolbar">
        <el-radio-group v-model="inputMode" size="small">
          <el-radio-button value="kv">{{ t('message.pages.opsScript.scriptArgModeKv') }}</el-radio-button>
          <el-radio-button value="positional">{{ t('message.pages.opsScript.scriptArgModePositional') }}</el-radio-button>
        </el-radio-group>

        <div class="toolbar-right">
          <el-dropdown
            v-if="presets && presets.length > 0"
            @command="applyPreset"
            trigger="click"
          >
            <el-button size="small">
              <template #icon>
                <fs-iconify icon="ion:albums-outline" />
              </template>
              {{ t('message.pages.opsScript.scriptArgPresetBtn') }}
              <fs-iconify icon="ion:chevron-down-outline" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="(p, idx) in presets"
                  :key="idx"
                  :command="p"
                >
                  {{ p.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <el-alert
        v-if="hasRisk"
        :title="t('message.pages.opsScript.scriptArgRiskAlert')"
        type="error"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
      />

      <div v-if="inputMode === 'kv'" class="kv-panel">
        <el-table :data="tempData" border size="small" :empty-text="t('message.pages.opsScript.scriptArgEmpty')">
          <el-table-column type="index" label="#" width="48" align="center" />
          <el-table-column :label="t('message.pages.opsScript.scriptArgColPrefix')" width="82">
            <template #default="{ row }">
              <el-select v-model="row.prefix" size="small">
                <el-option label="--" value="--" />
                <el-option label="-" value="-" />
                <el-option label="/" value="/" />
                <el-option :label="t('message.pages.opsScript.scriptArgPrefixNone')" value="" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column :label="t('message.pages.opsScript.scriptArgColKey')" min-width="160">
            <template #default="{ row }">
              <el-input v-model="row.key" size="small" :placeholder="t('message.pages.opsScript.scriptArgKeyPlaceholder')" />
            </template>
          </el-table-column>
          <el-table-column :label="t('message.pages.opsScript.scriptArgColType')" width="90">
            <template #default="{ row }">
              <el-select v-model="row.argType" size="small">
                <el-option :label="t('message.pages.opsScript.scriptArgTypeValue')" value="value" />
                <el-option :label="t('message.pages.opsScript.scriptArgTypeFlag')" value="flag" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column v-if="tempData.some((i) => i.argType !== 'flag')" :label="t('message.pages.opsScript.scriptArgColValue')" min-width="160">
            <template #default="{ row }">
              <el-input
                v-if="row.argType !== 'flag'"
                v-model="row.value"
                size="small"
                :placeholder="t('message.pages.opsScript.scriptArgValuePlaceholder')"
              />
              <el-tag v-else size="small" type="info">{{ t('message.pages.opsScript.scriptArgFlagTag') }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('message.pages.opsScript.scriptArgColDesc')" min-width="160">
            <template #default="{ row }">
              <el-input v-model="row.desc" size="small" :placeholder="t('message.pages.opsScript.scriptArgDescPlaceholder')" />
            </template>
          </el-table-column>
          <el-table-column :label="t('message.pages.opsScript.scriptArgColRequired')" width="60" align="center">
            <template #default="{ row }">
              <el-checkbox v-model="row.required" />
            </template>
          </el-table-column>
          <el-table-column :label="t('message.pages.opsScript.scriptArgColAction')" width="56" align="center" fixed="right">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="removeItem($index)">
                <fs-iconify icon="ion:close-outline" />
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else class="positional-panel">
        <el-input
          v-model="positionalText"
          type="textarea"
          :rows="6"
          :placeholder="t('message.pages.opsScript.scriptArgPositionalPlaceholder')"
        />
        <div class="positional-hint">
          {{ t('message.pages.opsScript.scriptArgPositionalHint', { count: filledCount }) }}
        </div>
      </div>

      <template #footer>
        <el-button @click="clearAll">{{ t('message.pages.opsScript.scriptArgBtnClear') }}</el-button>
        <el-button v-if="inputMode === 'kv'" type="success" @click="addItem">
          <template #icon>
            <fs-iconify icon="ion:add-outline" />
          </template>
          {{ t('message.pages.opsScript.scriptArgBtnAdd') }}
        </el-button>
        <el-button @click="showDialog = false">{{ t('message.pages.opsScript.scriptArgBtnCancel') }}</el-button>
        <el-button type="primary" @click="handleSave">{{ t('message.pages.opsScript.scriptArgBtnSave') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.dialog-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .toolbar-right {
    display: flex;
    gap: 8px;
  }
}

.kv-panel {
  .el-table {
    margin-bottom: 8px;
  }
}

.positional-panel {
  .positional-hint {
    margin-top: 10px;
    font-size: 12px;
    color: #909399;
    line-height: 1.6;

    b {
      color: #409eff;
      font-size: 13px;
    }
  }
}
</style>
