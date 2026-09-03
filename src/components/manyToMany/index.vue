<template>
  <!-- Your custom controlled component -->
  <div>
    <el-tag class="many-to-many-tag" :type="randomType" v-for="(item,index) in data" :key="index">{{item}}</el-tag>
  </div>
</template>
<script lang="ts" setup>
import {watch, ref} from "vue";

const props = defineProps({
  modelValue: Array,
  bindValue: Array,
  displayLabel: {
    type:String,
    default: ""
  }
})

// data used in template
const data = ref()
watch(() => {
      return props.bindValue
    }, // Watch for modelValue changes,
    (value) => {
      const {displayLabel} = props
      const result = value ? value.map((item: any) => {
        return item[displayLabel]
      }) : null
      data.value = result
    }, // When modelValue triggers, sync and update data.value
    {immediate: true} // Trigger immediately once to assign initial value to data
)

const tagType = ['success', 'info', 'warning', 'danger']
const randomType = (): string => {
  return tagType[Math.floor(Math.random() * tagType.length)];
}
</script>
<style scoped>
.many-to-many-tag{
  margin-right: 5px;
}
.many-to-many-tag:last-child {
  margin-right: 0;
}
</style>
