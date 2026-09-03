<template>
  <div>
    <el-dialog ref="modelRef" v-model="modelDialog" :title="t('message.pages.menu.dialog.selectModel')">
      <div v-show="props.model">
        <el-tag>{{ t('message.pages.menu.dialog.selected') }}{{ props.model }}</el-tag>
      </div>
     <!-- search input -->
    <el-input
    v-model="searchQuery"
    :placeholder="t('message.pages.menu.dialog.searchPlaceholder')"
    style="margin-bottom: 10px;"
  ></el-input>
      <div class="model-card">
        <!--// comment id:django-vue3-admin-index483211: computed from allModelData from API, return search matched content-->
        <div v-for="(item,index) in filteredModelData" :value="item.key" :key="index">
          <el-text :type="modelCheckIndex===index?'primary':''" @click="onModelChecked(item,index)">
            {{ item.app + '--' + item.title + '(' + item.key + ')' }}
          </el-text>
        </div>
      </div>
      <template #footer>
      <span class="dialog-footer">
        <el-button @click="modelDialog = false">{{ t('message.pages.menu.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="handleAutomatch">
          {{ t('message.pages.menu.buttons.confirm') }}
        </el-button>
      </span>
      </template>
    </el-dialog>
    <div style="height: 80vh">
      <fs-crud ref="crudRef" v-bind="crudBinding">
      </fs-crud>

    </div>
  </div>
</template>

<script lang="ts" setup>
import {ref, onMounted, reactive, computed } from 'vue';
import {useFs} from '@fast-crud/fast-crud';
import {createCrudOptions} from './crud';
import {getModelList} from './api'
import {MenuTreeItemType} from "/@/views/system/menu/types";
import {successMessage, successNotification, warningNotification} from '/@/utils/message';
import {automatchColumnsData} from '/@/views/system/columns/components/ColumnsTableCom/api';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
// currently selected menu info
let selectOptions: any = ref({name: null});

const props = reactive({
  model: '',
  app: '',
  menu: ''
})

// model dialog
const modelDialog = ref(false)
// get all models
const allModelData = ref<any[]>([]);
const modelCheckIndex = ref(null)
const onModelChecked = (row, index) => {
  modelCheckIndex.value = index
  props.model = row.key
  props.app = row.app
}


// // comment id:django-vue3-admin-index083311: code start
// func: paired search handler
const searchQuery = ref('');

const filteredModelData = computed(() => {
      if (!searchQuery.value) {
        return allModelData.value;
      }
      const query = searchQuery.value.toLowerCase();
      return allModelData.value.filter(item =>
        item.app.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.key.toLowerCase().includes(query)
      );
    });
// // comment id:django-vue3-admin-index083311: code end


/**
 * when menu selected, load table data
 * @param record
 */
const handleRefreshTable = (record: MenuTreeItemType) => {
  if (!record.is_catalog && record.id) {
    selectOptions.value = record;
    crudExpose.doRefresh();
  } else {
    // clear table data
    crudExpose.setTableData([]);
  }
};
/**
 * Auto match columns
 */
const handleAutomatch = async () => {
  props.menu = selectOptions.value.id
  modelDialog.value = false
  if (props.menu && props.model) {
    const res = await automatchColumnsData(props);
    if (res?.code === 2000) {
      successNotification(t('message.pages.menu.messages.automatchSuccess'));
    }
    crudExpose.doSearch({form: {menu: props.menu, model: props.model}});
  }else {
    warningNotification(t('message.pages.menu.dialog.selectRoleAndModel'));
  }

};


const {crudBinding, crudRef, crudExpose} = useFs({createCrudOptions, props, modelDialog, selectOptions,allModelData});
onMounted(async () => {
  const res = await getModelList();
  allModelData.value = res.data;
});

defineExpose({selectOptions, handleRefreshTable});
</script>

<style scoped lang="scss">
.model-card {
  margin-top: 10px;
  height: 30vh;
  overflow-y: scroll;

  div {
    margin: 15px 0;
    cursor: pointer;
  }
}
</style>
