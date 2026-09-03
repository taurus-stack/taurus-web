<template>
  <div style="display: inline-block">
    <el-button size="default" type="success" @click="handleImport()">
      <slot>{{ t('importExcel.defaultSlot') }}</slot>
    </el-button>
    <el-dialog :title="props.upload.title" v-model="uploadShow" width="400px" append-to-body>
      <div v-loading="loading">
        <el-upload
            ref="uploadRef"
            :limit="1"
            accept=".xlsx, .xls"
            :headers="props.upload.headers"
            :action="props.upload.url"
            :disabled="isUploading"
            :on-progress="handleFileUploadProgress"
            :on-success="handleFileSuccess"
            :auto-upload="false"
            drag
        >
          <i class="el-icon-upload"/>
          <div class="el-upload__text">
            {{ t('importExcel.dragHint') }}
            <em>{{ t('importExcel.clickUpload') }}</em>
          </div>
          <template #tip>
          <div  class="el-upload__tip" style="color:red">{{ t('importExcel.fileTip') }}</div>
          </template>
        </el-upload>
        <div>
          <el-button type="warning" style="font-size:14px;margin-top: 20px" @click="importTemplate">{{ t('importExcel.downloadTemplate') }}</el-button>
          <el-button type="warning" style="font-size:14px;margin-top: 20px" @click="updateTemplate">{{ t('importExcel.updateTemplate') }}</el-button>
        </div>
      </div>
      <template #footer>
      <div  class="dialog-footer">
        <el-button type="primary" :disabled="loading" @click="submitFileForm">{{ t('importExcel.confirmBtn') }}</el-button>
        <el-button :disabled="loading" @click="uploadShow = false">{{ t('importExcel.cancelBtn') }}</el-button>
      </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup name="importExcel">
import { request, downloadFile } from '/@/utils/service';
import { inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getBaseURL } from '/@/utils/baseUrl';
import { Session } from '/@/utils/storage';
import { ElMessageBox } from 'element-plus';
import type { Action } from 'element-plus';

const { t } = useI18n();
const refreshView = inject('refreshView');

let props = defineProps({
  upload: {
    type: Object,
    default () {
      return {
        // show dialog
        open: true,
        // dialog title
        title: '',
        // disable upload
        isUploading: false,
        // update existing data
        updateSupport: 0,
        // set upload headers
        headers: { Authorization: 'JWT ' + Session.get('token') },
        // upload url
        url: getBaseURL() + 'api/system/file/'
      };
    }
  },
  api: { // import api url
    type: String,
    default () {
      return undefined;
    }
  }
});

let loading = ref(false);
const uploadRef = ref();
const uploadShow = ref(false);
const isUploading = ref(false);
/** Import button handler */
const handleImport = function () {
  uploadShow.value = true;
};

/** Download template */
const importTemplate = function () {
  downloadFile({
    url: props.api + 'import_data/',
    params: {},
    method: 'get'
  });
};
/***
 * batch update template
 */
const updateTemplate = function () {
  downloadFile({
    url: props.api + 'update_template/',
    params: {},
    method: 'get'
  });
};
// file uploading handler
const handleFileUploadProgress = function (event: any, file: any, fileList: any) {
  isUploading.value = true;
};
// file upload success handler
const handleFileSuccess = function (response: any, file: any, fileList: any) {
  isUploading.value = false;
  loading.value = true;
  uploadRef.value.clearFiles();
  // update existing data
  return request({
    url: props.api + 'import_data/',
    method: 'post',
    data: {
      url: response.data.url
    }
  }).then((response: any) => {
    loading.value = false;
    ElMessageBox.alert(t('importExcel.successMsg'), t('importExcel.successTitle'), {
      confirmButtonText: 'OK',
      callback: (action: Action) => {
        refreshView();
      },
    });
  }).catch(() => {
    loading.value = false;
  });

};
// submit uploaded file
const submitFileForm = function () {
  uploadRef.value.submit();
};

defineExpose({
  handleImport,
});
</script>

<style scoped>

</style>
