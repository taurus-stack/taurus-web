<template>
  <div class="share-activate-page">
    <div class="activate-card">
      <div class="logo-area">
        <el-icon :size="56" color="#409eff"><Link /></el-icon>
        <h2>{{ t('shareLinkAccess') }}</h2>
        <p v-if="resourceInfo">{{ resourceInfo.resource_type === 'script' ? t('shareResourceScript') : t('shareResourceWorkflow') }}：{{ resourceInfo.resource_name }}</p>
      </div>

      <el-result
        v-if="activateResult.status === 'success'"
        icon="success"
        :title="t('shareActivateSuccessTitle')"
        :sub-title="activateResult.message || t('shareJumpHint')"
      >
        <template #extra>
          <el-button type="primary" @click="goToResource">{{ t('shareGoNow') }}</el-button>
          <el-button @click="goHome">{{ t('shareGoHome') }}</el-button>
        </template>
      </el-result>

      <el-result
        v-else-if="activateResult.status === 'error'"
        icon="error"
        :title="t('shareUnavailableTitle')"
        :sub-title="activateResult.message"
      >
        <template #extra>
          <el-button type="primary" @click="goHome">{{ t('shareGoHome') }}</el-button>
        </template>
      </el-result>

      <el-result
        v-else-if="activateResult.status === 'need_password'"
        icon="warning"
        :title="t('shareNeedPasswordTitle')"
        :sub-title="t('shareNeedPasswordDesc')"
      >
        <template #extra>
          <div class="password-form">
            <el-input
              v-model="passwordInput"
              type="password"
              :placeholder="t('sharePasswordPlaceholder')"
              show-password
              style="width: 280px"
              @keyup.enter="submitPassword"
            />
            <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: center">
              <el-button type="primary" :loading="submitting" @click="submitPassword">{{ t('shareActivateLink') }}</el-button>
              <el-button @click="goHome">{{ t('cancel') }}</el-button>
            </div>
          </div>
        </template>
      </el-result>

      <el-result
        v-else-if="activateResult.status === 'need_login'"
        icon="warning"
        :title="t('shareNeedLoginTitle')"
        :sub-title="t('shareNeedLoginDesc')"
      >
        <template #extra>
          <el-button type="primary" @click="goLogin">{{ t('shareGoLogin') }}</el-button>
        </template>
      </el-result>

      <div v-else class="loading-area">
        <el-icon :size="36" class="is-loading" color="#409eff"><Loading /></el-icon>
        <p>{{ t('shareActivating') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Link, Loading } from '@element-plus/icons-vue';
import { activateShareLink } from '/@/api/taurus/share-permission/index';
import { Session } from '/@/utils/storage';

const route = useRoute();
const router = useRouter();

const passwordInput = ref('');
const submitting = ref(false);
const shareToken = ref('');
const resourceInfo = ref<{ resource_type: 'script' | 'workflow'; resource_id: number | string; resource_name?: string } | null>(null);

const activateResult = ref<{ status: 'idle' | 'success' | 'error' | 'need_password' | 'need_login'; message: string }>({
  status: 'idle',
  message: '',
});

const saveResourceInfoFromResp = (data: any) => {
  if (!data) return;
  if (data.resource_type && data.resource_id) {
    resourceInfo.value = {
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      resource_name: data.resource_name,
    };
  }
};

const doActivate = async (password?: string) => {
  try {
    const resp: any = await activateShareLink(shareToken.value, password);
    const data = resp?.data || resp;
    saveResourceInfoFromResp(data);
    if (data?.success) {
      activateResult.value = {
        status: 'success',
        message: data.message || t('shareJumpHint'),
      };
      setTimeout(() => {
        goToResource();
      }, 1800);
    } else {
      activateResult.value = {
        status: 'error',
        message: data?.message || data?.msg || t('shareInvalidOrExpired'),
      };
    }
  } catch (e: any) {
    const msg = e?.response?.data?.msg || e?.message || t('shareActivateFail');
    // Handle specific error codes
    const code = e?.response?.data?.code;
    const body = e?.response?.data || {};
    if (body.need_password || (body.msg && /password/i.test(body.msg))) {
      activateResult.value = { status: 'need_password', message: body.msg || t('sharePasswordPlaceholder') };
      return;
    }
    if (code === 401 || /login|auth|unauthenticated|unauthorized/i.test(msg) || (body.code && body.code === 401)) {
      activateResult.value = { status: 'need_login', message: msg };
      return;
    }
    activateResult.value = { status: 'error', message: msg };
  }
};

const submitPassword = async () => {
  if (!passwordInput.value.trim()) {
    ElMessage.warning(t('sharePasswordPlaceholder'));
    return;
  }
  submitting.value = true;
  try {
    await doActivate(passwordInput.value.trim());
  } finally {
    submitting.value = false;
  }
};

const goToResource = () => {
  if (!resourceInfo.value) {
    goHome();
    return;
  }
  const { resource_type, resource_id, resource_name } = resourceInfo.value;
  const SHARE_TOK_KEY = 'taurus_share_script_token';
  try {
    if (shareToken.value) {
      Session.set(SHARE_TOK_KEY, shareToken.value);
      localStorage.setItem(SHARE_TOK_KEY, shareToken.value);
    }
  } catch { /* ignore */ }
  if (resource_type === 'script') {
    router.push({
      path: '/ops/script',
      query: {
        id: resource_id,
        name: resource_name || undefined,
        script_id: resource_id as any,
        share_token: shareToken.value || undefined,
      },
    });
  } else if (resource_type === 'workflow') {
    router.push({
      path: `/workflow/editor/${resource_id}`,
      query: { share_token: shareToken.value || undefined },
    });
  } else {
    goHome();
  }
};

const goLogin = () => {
  router.push({ path: '/login', query: { redirect: encodeURIComponent(route.fullPath) } });
};

const goHome = () => {
  router.push({ path: '/home' });
};

onMounted(() => {
  const token =
    (route.params.share_token as string) ||
    (route.query.share_token as string) ||
    (route.query.token as string);
  if (!token) {
    activateResult.value = { status: 'error', message: t('shareMissingToken') };
    return;
  }
  shareToken.value = token;

  // When access_scope = authenticated, user must log in first
  // Backend returns 401 on activate; frontend guides login based on that. Try activation first here.
  doActivate();
});
</script>

<style scoped>
.share-activate-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.activate-card {
  width: 100%;
  max-width: 560px;
  background: #fff;
  border-radius: 12px;
  padding: 40px 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
}
.logo-area {
  text-align: center;
  margin-bottom: 20px;
}
.logo-area h2 {
  margin: 16px 0 8px;
  font-size: 22px;
  color: #303133;
  font-weight: 600;
}
.logo-area p {
  color: #606266;
  font-size: 13px;
  margin: 0;
}
.loading-area {
  text-align: center;
  padding: 28px 0;
  color: #606266;
}
.loading-area p {
  margin-top: 12px;
}
.password-form {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.is-loading {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>