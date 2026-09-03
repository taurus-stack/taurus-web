<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="4">{{ t('message.pages.config.formContent.variableTitle') }}</el-col>
      <el-col :span="4">{{ t('message.pages.config.formContent.variableName') }}</el-col>
      <el-col :span="10">{{ t('message.pages.config.formContent.variableValue') }}</el-col>
      <el-col :span="2" :offset="1">{{ t('message.pages.config.formContent.isFrontendConfig') }}</el-col>
      <el-col :span="3" >{{ t('message.pages.config.formContent.actions') }}</el-col>
    </el-row>
    <el-form ref="formRef" :model="formData" label-width="0px" label-position="left" style="margin-top: 20px">
      <el-form-item
          :prop="['array'].indexOf(item.form_item_type_label) > -1 ? '' : item.key"
          :key="index"
          :rules="item.rule || []"
          v-for="(item, index) in formList"
      >
        <el-col :span="4">
          <el-input v-if="item.edit" v-model="item.title" style="display: inline-block; width: 200px" :placeholder="t('message.pages.config.formContent.titlePlaceholder')"></el-input>
          <span v-else>{{ item.title }}</span>
        </el-col>
        <el-col :span="4" >
          <el-input v-if="item.edit" v-model="item.new_key" style="width: 200px" :placeholder="t('message.pages.config.formContent.keyPrefix')">
            <template slot="prepend">
              <span style="padding: 0px 5px">{{ editableTabsItem.key }}</span>
            </template>
          </el-input>
          <span v-else>{{ editableTabsItem.key }}.{{ item.key }}</span>
        </el-col>
        <el-col :span="10">
          <!-- text -->
          <el-input
              :key="index"
              v-if="['text', 'textarea'].indexOf(item.form_item_type_label) > -1"
              :type="item.form_item_type_label"
              v-model="formData[item.key]"
              :placeholder="item.placeholder"
              clearable
          ></el-input>

          <el-input-number :key="index + 1" v-else-if="item.form_item_type_label === 'number'" v-model="formData[item.key]" :min="0"></el-input-number>
          <!-- datetime, date, time -->
          <el-date-picker
              v-else-if="['datetime', 'date', 'time'].indexOf(item.form_item_type_label) > -1"
              v-model="formData[item.key]"
              :key="index + 2"
              :type="item.form_item_type_label"
              :placeholder="item.placeholder"
          >
          </el-date-picker>
          <!-- select -->
          <el-select
              :key="index + 3"
              v-else-if="item.form_item_type_label === 'select'"
              v-model="formData[item.key]"
              :placeholder="item.placeholder"
              clearable
          >
            <el-option v-for="item in dictionary(item.setting) || []" :key="item.value" :label="item.label" :value="item.value"> </el-option>
          </el-select>
          <!-- checkbox -->
          <el-checkbox-group
              :key="index + 4"
              v-else-if="item.form_item_type_label === 'checkbox'"
              v-model="formData[item.key]"
              :placeholder="item.placeholder"
          >
            <el-checkbox v-for="item in dictionary(item.setting) || []" :key="item.value" :label="item.value" :value="item.value">
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
          <!-- radio -->
          <el-radio-group
              :key="index + 5"
              v-else-if="item.form_item_type_label === 'radio'"
              v-model="formData[item.key]"
              :placeholder="item.placeholder"
              clearable
          >
            <el-radio v-for="item in dictionary(item.setting) || []" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio>
          </el-radio-group>
          <!-- switch -->
          <el-switch
              :key="index + 6"
              v-else-if="item.form_item_type_label === 'switch'"
              v-model="formData[item.key]"
              :inactive-value="false"
              active-color="#13ce66"
              inactive-color="#ff4949"
          >
          </el-switch>
          <!-- image -->
          <div v-else-if="['img', 'imgs'].indexOf(item.form_item_type_label) > -1" :key="index + 7">
            <el-upload
                :action="uploadUrl"
                :headers="uploadHeaders"
                name="file"
                :accept="'image/*'"
                :on-preview="handlePictureCardPreview"
                :on-success="
								(response:any, file:any, fileList:any) => {
									handleUploadSuccess(response, file, fileList, item.key);
								}
							"
                :on-error="handleError"
                :on-exceed="handleExceed"
                :before-remove="
								(file:any, fileList:any) => {
									beforeRemove(file, fileList, item.key);
								}
							"
                :multiple="item.form_item_type_label !== 'img'"
                :limit="item.form_item_type_label === 'img' ? 1 : 5"
                :ref="'imgUpload_' + item.key"
                :data-keyname="item.key"
                :file-list="item.value ? item.value : []"
                list-type="picture-card"
            >
              <i class="el-icon-plus"></i>
              <div slot="tip" class="el-upload__tip">{{ t('message.pages.config.formContent.selectImageTip') }}</div>
            </el-upload>
            <el-dialog :visible.sync="dialogImgVisible">
              <img width="100%" :src="dialogImageUrl" alt="" />
            </el-dialog>
          </div>
          <!-- file -->
          <div v-else-if="['file'].indexOf(item.form_item_type_label) > -1" :key="index + 8">
            <el-upload
                :action="uploadUrl"
                :headers="uploadHeaders"
                name="file"
                :on-preview="handlePictureCardPreview"
                :on-success="
								(response:any, file:any, fileList:any) => {
									handleUploadSuccess(response, file, fileList, item.key);
								}
							"
                :on-error="handleError"
                :on-exceed="handleExceed"
                :before-remove="
								(file:any, fileList:any) => {
									beforeRemove(file, fileList, item.key);
								}
							"
                :limit="5"
                :ref="'fileUpload_' + item.key"
                :data-keyname="item.key"
                :file-list="item.value"
                list-type="picture-card"
            >
              <i class="el-icon-plus"></i>
              <div slot="tip" class="el-upload__tip">{{ t('message.pages.config.formContent.selectImageTip') }}</div>
            </el-upload>
            <el-dialog :visible.sync="dialogImgVisible">
              <img width="100%" :src="dialogImageUrl" alt="" />
            </el-dialog>
          </div>
          <!-- related table -->
          <div v-else-if="['foreignkey', 'manytomany'].indexOf(item.form_item_type_label) > -1" :key="index + 9">
            <table-selector
                v-model="formData[item.key]"
                :el-props="{
								pagination: true,
								columns: item.setting.searchField,
							}"
                :dict="{
								url: '/api/system/system_config/get_table_data/' + item.id + '/',
								value: item.setting.primarykey,
								label: item.setting.field,
							}"
                :pagination="true"
                :multiple="item.form_item_type_label === 'manytomany'"
            ></table-selector>
          </div>
          <!-- array -->
          <div v-else-if="item.form_item_type_label === 'array'" :key="index + 10">
            <vxe-table
                border
                resizable
                auto-resize
                show-overflow
                keep-source
                :ref="'xTable_' + item.key"
                height="200"
                :edit-rules="validRules"
                :edit-config="{ trigger: 'click', mode: 'row', showStatus: true }"
            >
              <vxe-column field="title" :title="t('message.pages.config.form.title')" :edit-render="{ autofocus: '.vxe-input--inner' }">
                <template #edit="{ row }">
                  <vxe-input v-model="row.title" type="text"></vxe-input>
                </template>
              </vxe-column>
              <vxe-column field="key" :title="t('message.pages.config.formContent.keyName')" :edit-render="{ autofocus: '.vxe-input--inner' }">
                <template #edit="{ row }">
                  <vxe-input v-model="row.key" type="text"></vxe-input>
                </template>
              </vxe-column>
              <vxe-column field="value" :title="t('message.pages.config.formContent.keyValue')" :edit-render="{}">
                <template #edit="{ row }">
                  <vxe-input v-model="row.value" type="text"></vxe-input>
                </template>
              </vxe-column>
              <vxe-column :title="t('message.pages.config.formContent.actions')" width="100" show-overflow>
                <template #default="{ row, index }">
                  <el-popover placement="top" width="160" v-model="childRemoveVisible">
                    <p>{{ t('message.pages.config.messages.deleteChildConfirm') }}</p>
                    <div style="text-align: right; margin: 0">
                      <el-button size="mini" type="text" @click="childRemoveVisible = false">{{ t('message.pages.config.buttons.cancel') }}</el-button>
                      <el-button type="primary" size="mini" @click="onRemoveChild(row, index, item.key)">{{ t('message.pages.config.buttons.confirm') }}</el-button>
                    </div>
                    <el-button type="text" slot="reference">{{ t('message.pages.config.buttons.delete') }}</el-button>
                  </el-popover>
                </template>
              </vxe-column>
            </vxe-table>
            <div>
              <el-button size="mini" @click="onAppend('xTable_' + item.key)">{{ t('message.pages.config.formContent.append') }}</el-button>
            </div>
          </div>
        </el-col>
        <el-col :span="2" :offset="1">
          <el-switch v-model="item.status" active-color="#13ce66" inactive-color="#ff4949"> </el-switch>
        </el-col>
        <el-col :span="3">
          <el-button v-if="item.edit" size="mini" type="primary" :icon="Finished" @click="onEditSave(item)">{{ t('message.pages.config.formContent.save') }}</el-button>
          <el-button v-else size="mini" type="primary" :icon="Edit" @click="onEdit(index)"></el-button>
          <el-popconfirm :title="t('message.pages.config.formContent.deleteConfirm')" @confirm="onDelRow(item)">
            <template #reference>
              <el-button size="mini" type="danger" :icon="Delete" ></el-button>
            </template>
          </el-popconfirm>
        </el-col>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit(formRef)">{{ t('message.pages.config.buttons.confirm') }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import * as api from '../api';
import { dictionary } from '/@/utils/dictionary';
import { getBaseURL } from '/@/utils/baseUrl';
import { ref, reactive, watch, nextTick,inject  } from 'vue';
import type { FormInstance, FormRules, TableInstance } from 'element-plus';
import { successMessage, errorMessage } from '/@/utils/message';
import { Session } from '/@/utils/storage';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import {Edit,Finished,Delete} from "@element-plus/icons-vue";
const props = defineProps(['options', 'editableTabsItem']);

let formData: any = reactive({});
let formList: any = ref([]);
let childTableData = ref([]);
let childRemoveVisible = ref(false);
const validRules = reactive<FormRules>({
  title: [
    {
      required: true,
      message: t('message.pages.config.formContent.arrayRequired'),
    },
  ],
  key: [
    {
      required: true,
      message: t('message.pages.config.formContent.arrayRequired'),
    },
  ],
  value: [
    {
      required: true,
      message: t('message.pages.config.formContent.arrayRequired'),
    },
  ],
});
const formRef =  ref<FormInstance>()
let uploadUrl = ref(getBaseURL() + 'api/system/file/');
let uploadHeaders = ref({
  Authorization: 'JWT ' + Session.get('token'),
});
let dialogImageUrl = ref('');
let dialogImgVisible = ref(false);
let uploadImgKey = ref(null);

// fetch data
const getInit = () => {
  api.GetList({ parent: props.options.id, limit: 999 }).then((res: any) => {
    let data = res.data;
    formList.value = data;
    const _formData: any = {};
    for (const item of data) {
      const key = item.key;
      if (item.value) {
        _formData[key] = item.value;
      } else {
        if ([5, 12, 14].indexOf(item.form_item_type) !== -1) {
          _formData[key] = [];
        } else {
          _formData[key] = item.value;
        }
      }
      if (item.form_item_type_label === 'array') {
        console.log('test');
        nextTick(() => {
          const tableName = 'xTable_' + key;
          const tabelRef = ref<TableInstance>();
          console.log(tabelRef);
          // const $table = this.$refs[tableName][0];
          // $table.loadData(item.chinldern);
        });
      }
    }
    formData = Object.assign(formData, _formData)
  });
};

// submit data
const onSubmit = (formEl: FormInstance | undefined) => {
  // const form = JSON.parse(JSON.stringify(form));
  const keys = Object.keys(formData);
  const values = Object.values(formData);
  for (const index in formList.value) {
    const item = formList.value[index];
    // eslint-disable-next-line camelcase
    const form_item_type_label = item.form_item_type_label;

    // eslint-disable-next-line camelcase
    if (form_item_type_label === 'array') {
      const parentId = item.id;
      const tableName = 'xTable_' + item.key;
      // const $table = this.$refs[tableName][0];
      // const { tableData } = $table.getTableData();
      // for (const child of tableData) {
      // 	if (!child.id && child.key && child.value) {
      // 		child.parent = parentId;
      // 		child.id = null;
      // 		formList.push(child);
      // 	}
      // }
      // // required field check
      // for (const arr of item.rule) {
      // 	if (arr.required && tableData.length === 0) {
      // 		errorMessage(item.title + ' cannot be empty');
      // 		return;
      // 	}
      // }
      // item.value = tableData;
    }
    // assignment
    keys.map((mapKey, mapIndex) => {
      if (mapKey === item.key) {
        if (item.form_item_type_label !== 'array') {
          item.value = values[mapIndex];
        }
        // required field validation
        if (['img', 'imgs'].indexOf(item.form_item_type_label) > -1) {
          for (const arr of item.rule) {
            if (arr.required && item.value === null) {
              errorMessage(item.title + t('message.pages.config.validation.cannotBeEmpty'));
              return;
            }
          }
        }
      }
    });
  }
  // formRef.value.clearValidate();
  if (!formEl) return
  formEl.validate((valid:any) => {
    if (valid) {
      api.saveContent(formList.value).then((res:any) => {
        successMessage(t('message.pages.config.messages.saveSuccess'));
        refreshView&&refreshView();
      });
    } else {
      console.log('error submit!!');
      return false;
    }
  });
};

// append
const onAppend = (tableName: any) => {
  // const $table = this.$refs[tableName][0];
  // const { tableData } = $table.getTableData();
  // const tableLength = tableData.length;
  // if (tableLength === 0) {
  // 	const { row: newRow } = $table.insert();
  // 	console.log(newRow);
  // } else {
  // 	const errMap = $table.validate().catch((errMap: any) => errMap);
  // 	if (errMap) {
  // 		errorMessage('validation failed!');
  // 	} else {
  // 		const { row: newRow } = $table.insert();
  // 		console.log(newRow);
  // 	}
  // }
};

// subtable delete
const onRemoveChild = (row: any, index: any, refName: any) => {
  console.log(row, index);
  if (row.id) {
    api.DelObj(row.id).then((res: any) => {
      // this.refreshView();
    });
  } else {
    // this.childTableData.splice(index, 1);
    // const tableName = 'xTable_' + refName;
    // const tableData = this.$refs[tableName][0].remove(row);
    // console.log(tableData);
  }
};

// image preview
const handlePictureCardPreview = (file: any) => {
  dialogImageUrl = file.url;
  dialogImgVisible.value = true;
};

// check if image
// helper: check image extension
const isImage = (fileName: any) => {
  if (typeof fileName !== 'string') return;
  const name = fileName.toLowerCase();
  return name.endsWith('.png') || name.endsWith('.jpeg') || name.endsWith('.jpg') || name.endsWith('.png') || name.endsWith('.bmp');
};

// upload success
const handleUploadSuccess = (response: any, file: any, fileList: any, imgKey: any) => {
  const that = this;
  const { code, msg } = response;
  if (code === 2000) {
    const { url } = response.data;
    const { name } = file;
    const type = isImage(name);
    if (!type) {
      errorMessage(t('message.pages.config.messages.invalidImage'));
    } else {
      const uploadImgKey = formData[imgKey];
      if (!uploadImgKey || uploadImgKey === '') {
        formData[imgKey] = [];
      }
      // console.log(len)
      const dict = {
        name: name,
        url: getBaseURL() + url,
      };
      formData[imgKey].push(dict);
    }
  } else {
    errorMessage(t('message.pages.config.messages.uploadFailedDetail', { msg: JSON.stringify(msg) }));
  }
};

// upload failed
const handleError = () => {
  errorMessage(t('message.pages.config.messages.uploadFailed'));
};

// upload exceeded limit
const handleExceed = () => {
  errorMessage(t('message.pages.config.messages.exceedFileLimit'));
};

// hook on delete
const beforeRemove = (file: any, fileList: any, key: any) => {
  var index = 0;
  formData[key].map((value: any, inx: any) => {
    if (value.uid === file.uid) index = inx;
  });
  formData[key].splice(index, 1);
};

// config row delete
const onDelRow = (obj: any) => {
  api.DelObj(obj.id).then((res: any) => {
    // this.refreshView();
  });
};

// row edit
const onEdit = (index: any) => {
  formList.value[index].edit =true
  formList.value[index].new_key =formList.value[index].key
};
// row edit save
const refreshView = inject<Function>('refreshView')
const onEditSave = (obj: any) => {
  obj.key = JSON.parse(JSON.stringify(obj.new_key));
  api.UpdateObj(obj).then((res: any) => {
    refreshView && refreshView()
  });
};

watch(
    props.options,
    (nv) => {
      if (nv && nv.id) {
        getInit();
      }
    },
    { immediate: true }
);
</script>

<style scoped>
:deep(.el-upload-list--picture-card){
  text-align: center;
}
</style>
