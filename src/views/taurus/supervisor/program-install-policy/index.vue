<template>
  <EditionLockedPage feature="PROGRAM_INSTALL_POLICY" :label="t('message.pages.edition.lockedPageLabels.programInstallPolicy')">
  <fs-page>
    <fs-crud ref="crudRef" v-bind="crudBinding">
    </fs-crud>
  </fs-page>
  </EditionLockedPage>
</template>

<script lang="ts" setup name="program-install-policy">
import { ref, onMounted } from 'vue';
import { useFs } from '@fast-crud/fast-crud';
import EditionLockedPage from '/@/components/EditionLockedPage.vue';
import { createCrudOptions } from './crud';
import { i18n } from '/@/i18n';
import { useEditionStore } from '/@/editions/index';

// @ts-ignore — vue-i18n type inference chain too deep, runtime is fine
const t = i18n.global.t;

const { crudBinding, crudRef, crudExpose } = useFs({ createCrudOptions });

onMounted(() => {
  if (!useEditionStore().hasFeature('PROGRAM_INSTALL_POLICY')) return;
  crudExpose.doRefresh();
});
</script>