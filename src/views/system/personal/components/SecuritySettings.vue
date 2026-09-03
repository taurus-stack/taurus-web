<template>
	<div class="security-settings">
		<el-card shadow="hover" class="mb15">
			<template #header>
				<div class="card-title">
					<el-icon><ele-Lock /></el-icon>
					<span>{{ t('message.pages.personal.security.loginPassword') }}</span>
				</div>
			</template>
			<div class="security-item">
				<div class="security-item-left">
					<div class="security-item-label">{{ t('message.pages.personal.security.passwordLabel') }}</div>
					<div class="security-item-value">{{ t('message.pages.personal.security.passwordHint') }}</div>
				</div>
				<el-button type="primary" @click="passwordFormShow = true">{{ t('message.pages.personal.security.changeNow') }}</el-button>
			</div>
		</el-card>

		<el-card shadow="hover" class="mb15">
			<template #header>
				<div class="card-title">
					<el-icon><ele-Phone /></el-icon>
					<span>{{ t('message.pages.personal.security.mobileCard') }}</span>
				</div>
			</template>
			<div class="security-item">
				<div class="security-item-left">
					<div class="security-item-label">{{ t('message.pages.personal.security.mobileBound') }}</div>
					<div class="security-item-value">{{ mobileMask }}</div>
				</div>
				<el-button type="primary" @click="mobileFormShow = true">{{ t('message.pages.personal.security.modify') }}</el-button>
			</div>
		</el-card>

		<el-card shadow="hover">
			<template #header>
				<div class="card-title">
					<el-icon><ele-Message /></el-icon>
					<span>{{ t('message.pages.personal.security.emailCard') }}</span>
				</div>
			</template>
			<div class="security-item">
				<div class="security-item-left">
					<div class="security-item-label">{{ t('message.pages.personal.security.emailBound') }}</div>
					<div class="security-item-value">{{ emailMask }}</div>
				</div>
				<el-button type="primary" @click="emailFormShow = true">{{ t('message.pages.personal.security.modify') }}</el-button>
			</div>
		</el-card>

		<!-- Password dialog -->
		<el-dialog v-model="passwordFormShow" :title="t('message.pages.personal.dialog.passwordChange')" width="480px">
			<el-form
				ref="userPasswordFormRef"
				:model="userPasswordInfo"
				required-asterisk
				label-width="100px"
				label-position="left"
				:rules="passwordRules"
				center
			>
				<el-form-item :label="t('message.pages.personal.dialog.oldPassword')" required prop="oldPassword">
					<el-input v-model="userPasswordInfo.oldPassword" :placeholder="t('message.pages.personal.dialog.oldPasswordPlaceholder')" clearable></el-input>
				</el-form-item>
				<el-form-item required prop="newPassword" :label="t('message.pages.personal.dialog.newPassword')">
					<el-input type="password" v-model="userPasswordInfo.newPassword" :placeholder="t('message.pages.personal.dialog.newPasswordPlaceholder')" show-password clearable></el-input>
				</el-form-item>
				<el-form-item required prop="newPassword2" :label="t('message.pages.personal.dialog.confirmPassword')">
					<el-input type="password" v-model="userPasswordInfo.newPassword2" :placeholder="t('message.pages.personal.dialog.confirmPasswordPlaceholder')" show-password clearable></el-input>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="passwordFormShow = false">{{ t('message.pages.personal.dialog.cancel') }}</el-button>
				<el-button type="primary" :loading="passwordSubmitting" @click="settingPassword">{{ t('message.pages.personal.dialog.submit') }}</el-button>
			</template>
		</el-dialog>

		<!-- Phone dialog -->
		<el-dialog v-model="mobileFormShow" :title="t('message.pages.personal.mobileDialog.title')" width="480px">
			<el-form
				ref="mobileFormRef"
				:model="mobileInfo"
				required-asterisk
				label-width="100px"
				:rules="mobileRules"
			>
				<el-form-item :label="t('message.pages.personal.mobileDialog.newMobileLabel')" required prop="mobile">
					<el-input v-model="mobileInfo.mobile" :placeholder="t('message.pages.personal.mobileDialog.newMobilePlaceholder')" clearable></el-input>
				</el-form-item>
				<el-form-item :label="t('message.pages.personal.mobileDialog.codeLabel')" required prop="code">
					<el-row :gutter="10">
						<el-col :span="14">
							<el-input v-model="mobileInfo.code" :placeholder="t('message.pages.personal.mobileDialog.codePlaceholder')" clearable></el-input>
						</el-col>
						<el-col :span="10">
							<el-button :disabled="smsCountdown > 0" @click="sendSmsCode" class="w100">
								{{ smsCountdown > 0 ? `${smsCountdown}${t('message.pages.personal.mobileDialog.retryAfter')}` : t('message.pages.personal.mobileDialog.sendCode') }}
							</el-button>
						</el-col>
					</el-row>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="mobileFormShow = false">{{ t('message.pages.personal.dialog.cancel') }}</el-button>
				<el-button type="primary" :loading="mobileSubmitting" @click="submitMobile">{{ t('message.pages.personal.dialog.submit') }}</el-button>
			</template>
		</el-dialog>

		<!-- Email dialog -->
		<el-dialog v-model="emailFormShow" :title="t('message.pages.personal.emailDialog.title')" width="480px">
			<el-form
				ref="emailFormRef"
				:model="emailInfo"
				required-asterisk
				label-width="100px"
				:rules="emailRules"
			>
				<el-form-item :label="t('message.pages.personal.emailDialog.newEmailLabel')" required prop="email">
					<el-input v-model="emailInfo.email" :placeholder="t('message.pages.personal.emailDialog.newEmailPlaceholder')" clearable></el-input>
				</el-form-item>
				<el-form-item :label="t('message.pages.personal.emailDialog.codeLabel')" required prop="code">
					<el-row :gutter="10">
						<el-col :span="14">
							<el-input v-model="emailInfo.code" :placeholder="t('message.pages.personal.emailDialog.codePlaceholder')" clearable></el-input>
						</el-col>
						<el-col :span="10">
							<el-button :disabled="emailCountdown > 0" @click="sendEmailCode" class="w100">
								{{ emailCountdown > 0 ? `${emailCountdown}${t('message.pages.personal.emailDialog.retryAfter')}` : t('message.pages.personal.emailDialog.sendCode') }}
							</el-button>
						</el-col>
					</el-row>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="emailFormShow = false">{{ t('message.pages.personal.dialog.cancel') }}</el-button>
				<el-button type="primary" :loading="emailSubmitting" @click="submitEmail">{{ t('message.pages.personal.dialog.submit') }}</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="PersonalSecuritySettings">
import { reactive, ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { Session } from '/@/utils/storage';
import * as api from '../api';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const router = useRouter();

const userInfo = reactive({
	mobile: '',
	email: '',
});

const mobileMask = computed(() => {
	if (!userInfo.mobile) return t('message.pages.personal.security.unbound');
	const m = userInfo.mobile;
	return m.length >= 11 ? `${m.slice(0, 3)}****${m.slice(-4)}` : m;
});

const emailMask = computed(() => {
	if (!userInfo.email) return t('message.pages.personal.security.unbound');
	const [name, domain] = userInfo.email.split('@');
	if (!name || !domain) return userInfo.email;
	if (name.length <= 2) return `${name[0]}***@${domain}`;
	return `${name.slice(0, 2)}***@${domain}`;
});

const fetchUserInfo = () => {
	api.getUserInfo({}).then((res: any) => {
		const { data } = res;
		userInfo.mobile = data.mobile || '';
		userInfo.email = data.email || '';
	});
};

onMounted(() => {
	fetchUserInfo();
});

// ------ Password Change ------
const passwordFormShow = ref(false);
const userPasswordFormRef = ref();
const passwordSubmitting = ref(false);
const userPasswordInfo = reactive({
	oldPassword: '',
	newPassword: '',
	newPassword2: '',
});

const validatePass = (rule: any, value: string, callback: any) => {
	const pwdRegex = new RegExp('(?=.*[0-9])(?=.*[a-zA-Z]).{8,30}');
	if (value === '') {
		callback(new Error(t('message.pages.personal.securityValidation.passwordEmpty')));
	} else if (value === userPasswordInfo.oldPassword) {
		callback(new Error(t('message.pages.personal.securityValidation.sameAsOldPassword')));
	} else if (!pwdRegex.test(value)) {
		callback(new Error(t('message.pages.personal.securityValidation.passwordComplexity')));
	} else {
		if (userPasswordInfo.newPassword2 !== '') {
			userPasswordFormRef.value?.validateField('newPassword2');
		}
		callback();
	}
};
const validatePass2 = (rule: any, value: string, callback: any) => {
	if (value === '') {
		callback(new Error(t('message.pages.personal.securityValidation.confirmEmpty')));
	} else if (value !== userPasswordInfo.newPassword) {
		callback(new Error(t('message.pages.personal.securityValidation.passwordMismatch')));
	} else {
		callback();
	}
};

const passwordRules = reactive({
	oldPassword: [{ required: true, message: t('message.pages.personal.securityValidation.oldPasswordRequired'), trigger: 'blur' }],
	newPassword: [{ validator: validatePass, trigger: 'blur' }],
	newPassword2: [{ validator: validatePass2, trigger: 'blur' }],
});

let logoutTimer: number | undefined;

const settingPassword = () => {
	userPasswordFormRef.value?.validate((valid: boolean) => {
		if (valid) {
			passwordSubmitting.value = true;
			api.updatePassword(userPasswordInfo).then(() => {
				ElMessage.success(t('message.pages.personal.messages.passwordChangeSuccess'));
				passwordFormShow.value = false;
				if (logoutTimer) window.clearTimeout(logoutTimer);
				logoutTimer = window.setTimeout(() => {
					Session.remove('token');
					router.push('/login');
				}, 1200);
			}).catch(() => {
				ElMessage.error(t('message.pages.personal.messages.passwordChangeFailed'));
			}).finally(() => {
				passwordSubmitting.value = false;
			});
		} else {
			ElMessage.error(t('message.pages.personal.securityValidation.formFailed'));
		}
	});
};

// ------ Secure Phone ------
const mobileFormShow = ref(false);
const mobileFormRef = ref();
const mobileSubmitting = ref(false);
const smsCountdown = ref(0);
const mobileInfo = reactive({ mobile: '', code: '' });

const mobileRules = reactive({
	mobile: [
		{ required: true, message: t('message.pages.personal.securityValidation.mobileRequired'), trigger: 'blur' },
		{ pattern: /^1[3-9]\d{9}$/, message: t('message.pages.personal.securityValidation.mobileInvalid') },
	],
	code: [{ required: true, message: t('message.pages.personal.securityValidation.codeRequired'), trigger: 'blur' }],
});

const sendSmsCode = () => {
	if (mobileInfo.mobile && /^1[3-9]\d{9}$/.test(mobileInfo.mobile)) {
		ElMessage.info(t('message.pages.personal.messages.mobileCodeSent'));
		smsCountdown.value = 60;
		const timer = window.setInterval(() => {
			smsCountdown.value -= 1;
			if (smsCountdown.value <= 0) window.clearInterval(timer);
		}, 1000);
	} else {
		ElMessage.warning(t('message.pages.personal.messages.invalidMobile'));
	}
};

const submitMobile = () => {
	mobileFormRef.value?.validate((valid: boolean) => {
		if (valid) {
			mobileSubmitting.value = true;
			api.updateUserInfo({ mobile: mobileInfo.mobile }).then(() => {
				ElMessage.success(t('message.pages.personal.messages.mobileUpdateSuccess'));
				mobileFormShow.value = false;
				userInfo.mobile = mobileInfo.mobile;
			}).catch(() => {
				ElMessage.error(t('message.pages.personal.messages.mobileUpdateFailed'));
			}).finally(() => {
				mobileSubmitting.value = false;
			});
		}
	});
};

// ------ Bound Email ------
const emailFormShow = ref(false);
const emailFormRef = ref();
const emailSubmitting = ref(false);
const emailCountdown = ref(0);
const emailInfo = reactive({ email: '', code: '' });

const emailRules = reactive({
	email: [
		{ required: true, message: t('message.pages.personal.securityValidation.emailRequired'), trigger: 'blur' },
		{ type: 'email', message: t('message.pages.personal.securityValidation.emailInvalid') },
	],
	code: [{ required: true, message: t('message.pages.personal.securityValidation.codeRequired'), trigger: 'blur' }],
});

const sendEmailCode = () => {
	if (emailInfo.email) {
		ElMessage.info(t('message.pages.personal.messages.emailCodeSent'));
		emailCountdown.value = 60;
		const timer = window.setInterval(() => {
			emailCountdown.value -= 1;
			if (emailCountdown.value <= 0) window.clearInterval(timer);
		}, 1000);
	} else {
		ElMessage.warning(t('message.pages.personal.messages.invalidEmail'));
	}
};

const submitEmail = () => {
	emailFormRef.value?.validate((valid: boolean) => {
		if (valid) {
			emailSubmitting.value = true;
			api.updateUserInfo({ email: emailInfo.email }).then(() => {
				ElMessage.success(t('message.pages.personal.messages.emailUpdateSuccess'));
				emailFormShow.value = false;
				userInfo.email = emailInfo.email;
			}).catch(() => {
				ElMessage.error(t('message.pages.personal.messages.emailUpdateFailed'));
			}).finally(() => {
				emailSubmitting.value = false;
			});
		}
	});
};
</script>

<style scoped lang="scss">
.security-settings {
	.card-title {
		display: flex;
		align-items: center;
		gap: 6px;
		font-weight: 500;
	}
	.security-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 0;
		.security-item-left {
			.security-item-label {
				font-size: 14px;
				color: var(--el-text-color-regular);
				margin-bottom: 4px;
			}
			.security-item-value {
				font-size: 13px;
				color: var(--el-text-color-secondary);
			}
		}
	}
}
.w100 {
	width: 100%;
}
</style>
