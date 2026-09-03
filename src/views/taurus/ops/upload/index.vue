<template>
  <fs-page>
    <div class="upload-page">
      <!-- Host selection -->
      <el-card class="host-card">
        <template #header>
          <span>{{ t('uploadTargetHost') }}</span>
        </template>
        <div class="host-selector">
          <el-button type="primary" @click="showHostDialog = true">
            <el-icon><Plus /></el-icon>
            {{ t('uploadSelectHost') }}
          </el-button>
          <div v-if="selectedHost" class="selected-host">
            <el-tag closable @close="selectedHost = null">
              {{ selectedHost.host_name }} ({{ selectedHost.host_ip }})
            </el-tag>
          </div>
        </div>
      </el-card>

      <!-- File upload -->
      <el-card class="upload-card">
        <template #header>
          <span>{{ t('uploadFileTitle') }}</span>
        </template>
        <el-form :model="uploadForm" label-width="120px">
          <el-form-item :label="t('uploadTargetPath')" required>
            <el-input
              v-model="uploadForm.targetPath"
              :placeholder="t('uploadPathPlaceholder')"
              clearable
            />
          </el-form-item>
          <el-form-item :label="t('uploadSelectFile')" required>
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :limit="1"
              :on-change="handleFileChange"
              :on-exceed="handleExceed"
              :on-remove="handleRemove"
              drag
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                {{ t('uploadDragHint') }} <em>{{ t('uploadClickUpload') }}</em>
              </div>
            </el-upload>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :loading="uploading"
              :disabled="!canUpload"
              @click="handleUpload"
            >
              {{ uploading ? t('uploading') : t('uploadStart') }}
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- Upload result -->
      <el-card v-if="uploadResult" class="result-card">
        <template #header>
          <span>{{ t('uploadResult') }}</span>
        </template>
        <el-result
          :icon="uploadResult.success ? 'success' : 'error'"
          :title="uploadResult.success ? t('uploadSuccess') : t('uploadFail')"
          :sub-title="uploadResult.message"
        />
      </el-card>

      <!-- Host selection dialog -->
      <el-dialog
        v-model="showHostDialog"
        :title="t('uploadSelectHostDialogTitle')"
        width="900px"
        :close-on-click-modal="false"
        destroy-on-close
        top="5vh"
      >
        <CommonHostSelector
          :height="620"
          :selected-host-ids="selectedHost ? [selectedHost.id] : []"
          @select="handleTempHostSelect"
          @confirm="handleHostConfirm"
        />
        <template #footer>
          <el-button @click="showHostDialog = false">{{ t('cancel') }}</el-button>
          <el-button type="primary" @click="handleHostDialogConfirm">{{ t('ok') }}</el-button>
        </template>
      </el-dialog>
    </div>
  </fs-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ElMessage, genFileId } from 'element-plus';
import { Plus, UploadFilled } from '@element-plus/icons-vue';
import type { UploadProps, UploadInstance, UploadUserFile, UploadRawFile } from 'element-plus';
import { uploadFile } from '/@/api/taurus/ops';
import CommonHostSelector from '../components/CommonHostSelector.vue';

interface Host {
  id: string;
  host_name: string;
  host_ip: string;
}

const selectedHost = ref<Host | null>(null);
const showHostDialog = ref(false);
const uploading = ref(false);
const uploadRef = ref<UploadInstance>();
const tempHosts = ref<any[]>([]);

const uploadForm = ref({
  targetPath: '',
});

const selectedFile = ref<File | null>(null);

const uploadResult = ref<{
  success: boolean;
  message: string;
} | null>(null);

const canUpload = computed(() => {
  return selectedHost.value && uploadForm.value.targetPath && selectedFile.value;
});

const handleTempHostSelect = (_ids: any[], hosts: any[]) => {
  tempHosts.value = hosts;
};

const pickOneHost = (hosts: any[]): Host | null => {
  if (!hosts || hosts.length === 0) return null;
  const first = hosts[0];
  return {
    id: first.id,
    host_name: first.host_name || first.host_ip || String(first.id),
    host_ip: first.host_ip || '',
  };
};

const handleHostConfirm = (_ids: any[], hosts: any[]) => {
  const host = pickOneHost(hosts);
  if (!host) {
    ElMessage.warning(t('msgSelectAtLeastOne'));
    return;
  }
  selectedHost.value = host;
  showHostDialog.value = false;
  ElMessage.success(t('msgSelected') + ': ' + host.host_name);
};

const handleHostDialogConfirm = () => {
  const host = pickOneHost(tempHosts.value);
  if (!host) {
    ElMessage.warning(t('msgSelectHostFirst'));
    return;
  }
  selectedHost.value = host;
  showHostDialog.value = false;
  ElMessage.success(t('msgSelected') + ': ' + host.host_name);
};

const handleFileChange: UploadProps['onChange'] = (uploadFile) => {
  selectedFile.value = uploadFile.raw || null;
};

const handleExceed: UploadProps['onExceed'] = (files) => {
  uploadRef.value?.clearFiles();
  const file = files[0] as UploadRawFile;
  file.uid = genFileId();
  uploadRef.value?.handleStart(file);
  selectedFile.value = file;
};

const handleRemove: UploadProps['onRemove'] = () => {
  selectedFile.value = null;
};

const handleUpload = async () => {
  if (!selectedHost.value) {
    ElMessage.warning(t('msgSelectTargetHost'));
    return;
  }

  if (!uploadForm.value.targetPath) {
    ElMessage.warning(t('msgEnterTargetPath'));
    return;
  }

  if (!selectedFile.value) {
    ElMessage.warning(t('msgSelectFile'));
    return;
  }

  uploading.value = true;
  uploadResult.value = null;

  try {
    const formData = new FormData();
    formData.append('host_id', selectedHost.value.id);
    formData.append('file_path', uploadForm.value.targetPath);
    formData.append('file', selectedFile.value);

    const res = await uploadFile(formData);

    uploadResult.value = {
      success: true,
      message: t('upload.uploadSuccess', { path: uploadForm.value.targetPath }),
    };

    ElMessage.success(t('uploadSuccess'));
  } catch (error: any) {
    uploadResult.value = {
      success: false,
      message: error.message || t('uploadFail'),
    };
    ElMessage.error(t('uploadFail'));
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped lang="scss">
.upload-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.host-card,
.upload-card,
.result-card {
  :deep(.el-card__header) {
    font-weight: 600;
    font-size: 16px;
  }
}

.host-selector {
  display: flex;
  align-items: center;
  gap: 16px;
}

.selected-host {
  display: flex;
  align-items: center;
}
</style>