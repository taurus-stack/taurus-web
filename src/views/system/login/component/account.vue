<template>
	<el-form ref="formRef" size="large" class="login-content-form" :model="state.ruleForm" :rules="rules" @keyup.enter="loginClick">
		<el-form-item class="login-animation1 login-form-item" prop="username">
			<el-input type="text" :placeholder="$t('message.account.accountPlaceholder1')" v-model="ruleForm.username" clearable autocomplete="off">
				<template #prefix>
					<el-icon class="el-input__icon"><ele-User /></el-icon>
				</template>
			</el-input>
		</el-form-item>
		<el-form-item class="login-animation2 login-form-item" prop="password">
			<el-input :type="isShowPassword ? 'text' : 'password'" :placeholder="$t('message.account.accountPlaceholder2')" v-model="ruleForm.password">
				<template #prefix>
					<el-icon class="el-input__icon"><ele-Unlock /></el-icon>
				</template>
				<template #suffix>
					<i
						class="iconfont el-input__icon login-content-password"
						:class="isShowPassword ? 'icon-yincangmima' : 'icon-xianshimima'"
						@click="isShowPassword = !isShowPassword"
					>
					</i>
				</template>
			</el-input>
		</el-form-item>
		<el-form-item class="login-animation3 login-form-item" v-if="isShowCaptcha" prop="captcha">
			<el-col :span="15">
				<el-input
					type="text"
					maxlength="4"
					:placeholder="$t('message.account.accountPlaceholder3')"
					v-model="ruleForm.captcha"
					clearable
					autocomplete="off"
				>
					<template #prefix>
						<el-icon class="el-input__icon"><ele-Position /></el-icon>
					</template>
				</el-input>
			</el-col>
			<el-col :span="1"></el-col>
			<el-col :span="8">
				<el-button class="login-content-captcha">
					<el-image :src="ruleForm.captchaImgBase" @click="refreshCaptcha" />
				</el-button>
			</el-col>
		</el-form-item>
		<el-form-item class="login-animation4 login-form-item">
			<el-button type="primary" class="login-content-submit" @click="loginClick" :loading="loading.signIn">
				<span>{{ $t('message.account.accountBtnText') }}</span>
			</el-button>
		</el-form-item>
	</el-form>
</template>

<script lang="ts">
import { toRefs, reactive, defineComponent, computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, FormInstance, FormRules } from 'element-plus';
import { useI18n } from 'vue-i18n';
import Cookies from 'js-cookie';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
import { initFrontEndControlRoutes } from '/@/router/frontEnd';
import { initBackEndControlRoutes } from '/@/router/backEnd';
import { Session } from '/@/utils/storage';
import { formatAxis } from '/@/utils/formatTime';
import { NextLoading } from '/@/utils/loading';
import * as loginApi from '/@/views/system/login/api';
import { useUserInfo } from '/@/stores/userInfo';
import { DictionaryStore } from '/@/stores/dictionary';
import { SystemConfigStore } from '/@/stores/systemConfig';
import { BtnPermissionStore } from '/@/plugin/permission/store.permission';
import { Md5 } from '/@/utils/md5';
import { errorMessage } from '/@/utils/message';

export default defineComponent({
	name: 'loginAccount',
	setup() {
		const { t } = useI18n();
		const storesThemeConfig = useThemeConfig();
		const { themeConfig } = storeToRefs(storesThemeConfig);
		const { userInfos } = storeToRefs(useUserInfo());
		const route = useRoute();
		const router = useRouter();
		const state = reactive({
			isShowPassword: false,
			ruleForm: {
				username: 'superadmin',
				password: 'admin123456',
				captcha: '',
				captchaKey: '',
				captchaImgBase: '',
			},
			loading: {
				signIn: false,
			},
		});
		const rules = reactive<FormRules>({
			username: [{ required: true, message: t('message.pleaseEnterAccount'), trigger: 'blur' }],
			password: [
				{
					required: true,
					message: t('message.pleaseEnterPassword'),
					trigger: 'blur',
				},
			],
			captcha: [
				{
					required: true,
					message: t('message.pleaseEnterCaptcha'),
					trigger: 'blur',
				},
			],
		});
		const formRef = ref();
		// fetch time
		const currentTime = computed(() => {
			return formatAxis(new Date());
		});
		// captcha enabled
		const isShowCaptcha = computed(() => {
			return SystemConfigStore().systemConfig['base.captcha_state'];
		});

		const getCaptcha = async () => {
			loginApi.getCaptcha().then((ret: any) => {
				state.ruleForm.captchaImgBase = ret.data.image_base;
				state.ruleForm.captchaKey = ret.data.key;
			});
		};
		const refreshCaptcha = async () => {
			state.ruleForm.captcha = '';
			loginApi.getCaptcha().then((ret: any) => {
				state.ruleForm.captchaImgBase = ret.data.image_base;
				state.ruleForm.captchaKey = ret.data.key;
			});
		};
		const loginClick = async () => {
			if (!formRef.value) return;
			await formRef.value.validate((valid: any) => {
				if (valid) {
					loginApi
						.login({ ...state.ruleForm, password: Md5.hashStr(state.ruleForm.password) })
						.then((res: any) => {
							if (res.code === 2000) {
								Session.set('token', res.data.access);
								Cookies.set('username', res.data.name);
								if (!themeConfig.value.isRequestRoutes) {
									// frontend controls routing, 2. pay attention to execution order
									initFrontEndControlRoutes();
									loginSuccess();
								} else {
									// simulate backend routes
									// add dynamic routes first, then do router navigation, otherwise may error: No match found for location with path "/"
									initBackEndControlRoutes();
									// run initBackEndControlRoutes first, then run signInSuccess
									loginSuccess();
								}
							}
						})
						.catch((err: any) => {
							// refresh captcha on error
							refreshCaptcha();
						});
				} else {
					errorMessage(t('login.emptyCredentials'));
				}
			});
		};
		const getUserInfo = () => {
			useUserInfo().setUserInfos();
		};

		// post-login redirect
		const loginSuccess = () => {
			getUserInfo();

			// init greeting message
			let currentTimeInfo = currentTime.value;
			// login success, go to home
			// if pasted path, redirect there after login
			if (route.query?.redirect) {
				router.push({
					path: <string>route.query?.redirect,
					query: Object.keys(<string>route.query?.params).length > 0 ? JSON.parse(<string>route.query?.params) : '',
				});
			} else {
				router.push('/');
			}
			// login success toast
			// close loading
			state.loading.signIn = true;
			const signInText = t('message.signInText');
			ElMessage.success(`${currentTimeInfo}，${signInText}`);
			// add loading to prevent blank flash
			NextLoading.start();
		};
		onMounted(() => {
			getCaptcha();
			// get system config
			SystemConfigStore().getSystemConfigs();
		});

		return {
			refreshCaptcha,
			loginClick,
			loginSuccess,
			isShowCaptcha,
			state,
			formRef,
			rules,
			...toRefs(state),
		};
	},
});
</script>

<style scoped lang="scss">
.login-content-form {
	margin-top: 16px;

	@for $i from 1 through 4 {
		.login-animation#{$i} {
			opacity: 0;
			animation-name: error-num;
			animation-duration: 0.5s;
			animation-fill-mode: forwards;
			animation-delay: calc($i/10) + s;
		}
	}

	.login-form-item {
		margin-bottom: 20px;

		:deep(.el-input__wrapper) {
			border-radius: 8px;
			padding: 4px 12px;
			box-shadow: 0 0 0 1px var(--el-border-color) inset;
			transition: box-shadow 0.2s;

			&:hover {
				box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
			}

			&.is-focus {
				box-shadow: 0 0 0 2px var(--el-color-primary) inset;
			}
		}

		:deep(.el-input__inner) {
			height: 44px;
			font-size: 14px;
		}

		:deep(.el-input__icon) {
			font-size: 16px;
			color: var(--el-text-color-placeholder);
		}
	}

	.login-content-password {
		display: inline-block;
		width: 20px;
		cursor: pointer;

		&:hover {
			color: var(--el-color-primary);
		}
	}

	.login-content-captcha {
		width: 100%;
		padding: 4px;
		height: 44px;
		border-radius: 8px;
		overflow: hidden;

		:deep(.el-image) {
			width: 100%;
			height: 100%;
			border-radius: 6px;
		}
	}

	.login-content-submit {
		width: 100%;
		height: 46px;
		letter-spacing: 2px;
		font-weight: 500;
		font-size: 15px;
		margin-top: 8px;
		border-radius: 8px;
		background: var(--el-color-primary);
		transition: all 0.3s;

		&:hover {
			background: var(--el-color-primary-light-3);
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
		}

		&:active {
			transform: translateY(0);
		}
	}
}
</style>