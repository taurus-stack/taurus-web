<template>
  <SectionBlock v-if="wrapSection" :title="sectionTitle || t('customParamsLabel')" :icon="sectionIcon || Setting">
    <CustomParamsEditorInner
      ref="innerRef"
      :args-json="argsJson"
      :positional-label="positionalLabel"
      :kv-label="kvLabel"
      :positional-placeholder="positionalPlaceholder"
      :empty-text="emptyText"
      :preview-empty-text="previewEmptyText"
    />
  </SectionBlock>
  <CustomParamsEditorInner
    v-else
    ref="innerRef"
    :args-json="argsJson"
    :positional-label="positionalLabel"
    :kv-label="kvLabel"
    :positional-placeholder="positionalPlaceholder"
    :empty-text="emptyText"
    :preview-empty-text="previewEmptyText"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Setting } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import type { Ref } from 'vue';
import SectionBlock from './SectionBlock.vue';
import CustomParamsEditorInner from './CustomParamsEditorInner.vue';

const props = withDefaults(defineProps<{
  argsJson: Ref<string>;
  wrapSection?: boolean;
  sectionTitle?: string;
  sectionIcon?: any;
  positionalLabel?: string;
  kvLabel?: string;
  positionalPlaceholder?: string;
  emptyText?: string;
  previewEmptyText?: string;
}>(), {
  wrapSection: true,
});

const innerRef = ref<InstanceType<typeof CustomParamsEditorInner> | null>(null);

const syncArgsToForm = () => {
  if (innerRef.value?.syncArgsToForm) {
    innerRef.value.syncArgsToForm();
  }
};

defineExpose({ syncArgsToForm });
</script>