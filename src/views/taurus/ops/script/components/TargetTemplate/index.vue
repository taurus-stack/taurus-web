<script setup lang="ts" name="target-template">

import {FsCrud, FsPage} from "@fast-crud/fast-crud";

import {onMounted, watch} from "vue";
import {useFs} from "@fast-crud/fast-crud";

import {createCrudOptions} from "./crud"

const {crudBinding, crudExpose, crudRef, selectedRowKeys} = useFs({
      createCrudOptions
    }
)


onMounted(() => {
  crudExpose.doRefresh();
})

const props = defineProps({
  height: Number,
})

const emits = defineEmits(['select'])
watch(selectedRowKeys, (newValue) => {
  console.debug("🚀 ~ file:index.vue method: line:27 -----", selectedRowKeys)
  if (newValue?.length !== 1) return
  const val = crudBinding.value.data.find(item => {
    return item.id === newValue[0]
  })
  // console.log(val)
  emits('select', val)
}, {immediate: true})

</script>

<template>
  <fs-page :style="{height: (height-40).toString() + 'px', position: 'unset'}">
    <fs-crud ref="crudRef" v-bind="crudBinding"></fs-crud>
  </fs-page>
</template>

<style scoped lang="scss">

</style>