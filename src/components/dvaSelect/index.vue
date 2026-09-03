<template>
  <!-- Your custom controlled component -->
  <el-select-v2
      v-model="data"
      :options="options"
      style="width: 100%;"
      :clearable="true"
      :props="selectProps"
      @change="onDataChange"

  />
</template>
<script lang="ts" setup>
import {ref, defineComponent, watch, computed, toRefs, toRaw, onMounted} from 'vue'
import {useUi} from "@fast-crud/fast-crud";
import {request} from "/@/utils/service";

const props = defineProps({
  dict: { // Receive dict data from FastCrud configuration
    type: Array,
    required: true,
  },
  modelValue: {}
})
const emit = defineEmits(['update:modelValue'])
// Fetch data
const dataList = ref([])

function getData(params) {
  request({
    url: props.dict.url,
    params: params
  }).then(res => {
    dataList.value = res.data
  })

}

// data used in template
const data = ref()
// const data = computed({
//   get: () => {
//     console.log("Has default value", props.modelValue)
//     //getData({id:props.modelValue})
//
//     console.log(11, dataList)
//     // const {data} = res
//     // console.log("get",data[0][selectProps.value.label])
//     if (dataList && dataList.length === 1) {
//       return dataList[0][selectProps.value.value]
//     } else {
//       // console.log("aa",res.data)
//       return props.modelValue
//     }
//     // return props.modelValue
//   },
//   set: (val) => {
//     //data.value =  val
//     return val
//   }
// })
const options = ref([])
const selectProps = ref({
  label: 'label',
  value: 'value'
})
watch(
    () => {
      return props.modelValue
    }, // Watch for modelValue changes,
    (value) => {
      // data.value = value
      request({
        url: props.dict.url,
        params: {
          id: props.modelValue
        }
      }).then(res => {
        const dataList = res.data
        console.log(dataList)
        if (dataList && dataList.length === 1) {
          data.value = dataList[0][selectProps.value.label]
        }else{
          data.value = null
        }
      })
    }, // When modelValue triggers, sync and update data.value
    {immediate: true} // Trigger immediately once to assign initial value to data
)
// Get form validation context
const {ui} = useUi()
const formValidator = ui.formItem.injectFormItemContext();
// When data needs to change, report to parent component
// Parent component updates props.modelValue after listening to update:modelValue event
// Then watch is triggered and modifies data.value.
function onDataChange(value) {
  emit('update:modelValue', value)
  data.value = value
  // Trigger validation
  formValidator.onChange()
  formValidator.onBlur()
}


if (props.dict.url instanceof Function) {
  request(props.dict.url).then((res) => {
    options.value = res.data
  })
} else {
  selectProps.value.label = props.dict.label
  selectProps.value.value = props.dict.value
  request({
    url: props.dict.url
  }).then((res) => {
    options.value = res.data
  })
}


// onMounted(() => {
//   getData({id: props.modelValue})
// })

</script>
<style scoped lang="scss">
.el-select .el-input__wrapper .el-input__inner::placeholder {
  //color: #a8abb2;
  color: #0d84ff;
}

.el-select-v2 {
  .el-select-v2__wrapper {
    .el-select-v2__placeholder.is-transparent {
      //color: #a8abb2;
      color: #0d84ff;
    }
  }
}


</style>
