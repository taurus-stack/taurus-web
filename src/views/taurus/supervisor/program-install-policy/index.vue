<template>
  <EditionLockedPage feature="PROGRAM_INSTALL_POLICY" label="企业程序安装策略">
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
import { useEditionStore } from '/@/editions/index';

const { crudBinding, crudRef, crudExpose } = useFs({ createCrudOptions });

onMounted(() => {
  if (!useEditionStore().hasFeature('PROGRAM_INSTALL_POLICY')) return;
  crudExpose.doRefresh();
});
</script>