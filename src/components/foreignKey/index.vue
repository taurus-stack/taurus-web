<template>
  <!-- Your custom controlled component -->
  <div>
    <el-tag :type="randomType">{{ data }}</el-tag>
  </div>
</template>
<script lang="ts" setup>
import {watch, ref} from "vue";

const props = defineProps({
  modelValue: String || Object,
  displayLabel: {
    type:String,
    default: ""
  }
})

// data used in template
const data = ref()
watch(() => {
      return props.modelValue
    }, // Watch for modelValue changes,
    (value) => {
      if (typeof value === "string") {
        data.value = value
      } else if (typeof value === "object") {
        const {displayLabel} = props
        data.value = value ? value[displayLabel] : null
      } else {
        data.value = null
      }

    }, // When modelValue triggers, sync and update data.value
    {immediate: true} // Trigger immediately once to assign initial value to data
)

const tagType = ['success', 'info', 'warning', 'danger']
const randomType = (): string => {
  return tagType[Math.floor(Math.random() * tagType.length)];
}
</script>
