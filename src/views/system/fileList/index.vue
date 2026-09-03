<template>
  <fs-page>
    <fs-crud ref="crudRef" v-bind="crudBinding"> </fs-crud>
  </fs-page>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useExpose, useCrud } from '@fast-crud/fast-crud';
import { createCrudOptions } from './crud';
// crud component ref
const crudRef = ref();
// crud config ref
const crudBinding = ref();
// expose methods
const { crudExpose } = useExpose({ crudRef, crudBinding });
// your crud config
const { crudOptions } = createCrudOptions({ crudExpose });
// init crud config
const { resetCrudOptions } = useCrud({ crudExpose, crudOptions });

// fetch list on page open
onMounted(() => {
  crudExpose.doRefresh();
});
</script>
