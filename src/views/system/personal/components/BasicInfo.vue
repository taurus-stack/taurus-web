<template>
	<div class="basic-info">
		<el-card shadow="hover" class="mb15">
			<template #header>
				<div class="card-title">
					<el-icon><ele-User /></el-icon>
					<span>{{ t('message.pages.personal.card.myInfo') }}</span>
				</div>
			</template>
			<div class="basic-info-header">
				<div class="basic-info-avatar">
					<avatarSelector v-model="selectImgVisible" @uploadImg="uploadImg" ref="avatarSelectorRef"></avatarSelector>
				</div>
				<div class="basic-info-intro">
					<div class="basic-info-greeting">{{ t('message.pages.personal.card.greetingPrefix', { time: currentTime }) }}{{ state.personalForm.name || state.personalForm.username }}</div>
					<div class="basic-info-sub">{{ t('message.pages.personal.card.motto') }}</div>
					<div class="basic-info-tags">
						<el-tag v-if="state.personalForm.dept_info?.dept_name" type="info" effect="light">
							<el-icon class="mr4"><ele-OfficeBuilding /></el-icon>
							{{ t('message.pages.personal.stat.deptTag') }}{{ state.personalForm.dept_info.dept_name }}
						</el-tag>
						<el-tag v-for="(item, index) in state.personalForm.role_info" :key="index" type="success" effect="light" class="ml5">
							<el-icon class="mr4"><ele-Avatar /></el-icon>
							{{ item.name }}
						</el-tag>
					</div>
				</div>
				<div class="basic-info-stats">
					<div class="stat-item">
						<div class="stat-value">{{ loginDays }}</div>
						<div class="stat-label">{{ t('message.pages.personal.stat.loginDays') }}</div>
					</div>
					<div class="stat-item">
						<div class="stat-value">{{ taskCount }}</div>
						<div class="stat-label">{{ t('message.pages.personal.stat.taskCount') }}</div>
					</div>
				</div>
			</div>
		</el-card>

		<el-card shadow="hover">
			<template #header>
				<div class="card-title">
					<el-icon><ele-EditPen /></el-icon>
					<span>{{ t('message.pages.personal.card.editProfile') }}</span>
				</div>
			</template>
			<el-form
				:model="state.personalForm"
				ref="userInfoFormRef"
				:rules="rules"
				size="default"
				label-width="80px"
				class="mt20"
			>
				<el-row :gutter="30">
					<el-col :xs="24" :sm="12" :md="8" class="mb20">
						<el-form-item :label="t('message.pages.personal.form.account')" prop="username">
							<el-input v-model="state.personalForm.username" disabled>
								<template #prepend>
									<el-icon><ele-User /></el-icon>
								</template>
							</el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="8" class="mb20">
						<el-form-item :label="t('message.pages.personal.form.nickname')" prop="name">
							<el-input v-model="state.personalForm.name" :placeholder="t('message.pages.personal.form.nicknamePlaceholder')" clearable>
								<template #prepend>
									<el-icon><ele-Customer /></el-icon>
								</template>
							</el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="8" class="mb20">
						<el-form-item :label="t('message.pages.personal.form.email')" prop="email">
							<el-input v-model="state.personalForm.email" :placeholder="t('message.pages.personal.form.emailPlaceholder')" clearable>
								<template #prepend>
									<el-icon><ele-Message /></el-icon>
								</template>
							</el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="8" class="mb20">
						<el-form-item :label="t('message.pages.personal.form.mobile')" prop="mobile">
							<el-input v-model="state.personalForm.mobile" :placeholder="t('message.pages.personal.form.mobilePlaceholder')" clearable>
								<template #prepend>
									<el-icon><ele-Phone /></el-icon>
								</template>
							</el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="8" class="mb20">
						<el-form-item :label="t('message.pages.personal.form.gender')" prop="gender">
							<el-select v-model="state.personalForm.gender" :placeholder="t('message.pages.personal.form.genderPlaceholder')" clearable class="w100">
								<el-option v-for="(item, index) in genderList" :key="index" :label="item.label" :value="item.value"></el-option>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="8" class="mb20">
						<el-form-item :label="t('message.pages.personal.form.dept')" prop="dept_info">
							<el-input :model-value="state.personalForm.dept_info?.dept_name || t('message.pages.personal.stat.unassigned')" disabled>
								<template #prepend>
									<el-icon><ele-OfficeBuilding /></el-icon>
								</template>
							</el-input>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item>
							<el-button type="primary" :loading="submitting" @click="submitForm">
								<el-icon><ele-Check /></el-icon>
								{{ t('message.pages.personal.form.save') }}
							</el-button>
							<el-button @click="getUserInfo">
								<el-icon><ele-Refresh /></el-icon>
								{{ t('message.pages.personal.form.reset') }}
							</el-button>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="PersonalBasicInfo">
import { reactive, computed, ref, defineAsyncComponent, onMounted } from 'vue';
import { formatAxis } from '/@/utils/formatTime';
import { ElMessage } from 'element-plus';
import { getBaseURL } from '/@/utils/baseUrl';
import { useUserInfo } from '/@/stores/userInfo';
import { successMessage } from '/@/utils/message';
import { dictionary } from '/@/utils/dictionary';
import * as api from '../api';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const emit = defineEmits(['user-updated']);

const avatarSelector = defineAsyncComponent(() => import('/@/components/avatarSelector/index.vue'));
const avatarSelectorRef = ref(null);

const currentTime = computed(() => formatAxis(new Date()));
const userInfoFormRef = ref();
const submitting = ref(false);

const loginDays = ref(0);
const taskCount = ref(0);

const rules = reactive({
	name: [{ required: true, message: t('message.pages.personal.validation.nicknameRequired'), trigger: 'blur' }],
	mobile: [{ pattern: /^1[3-9]\d{9}$/, message: t('message.pages.personal.validation.mobileInvalid') }],
	email: [{ type: 'email', message: t('message.pages.personal.validation.emailInvalid'), trigger: ['blur', 'change'] }],
});

const selectImgVisible = ref(false);
const genderList = ref();

const state = reactive<PersonalState>({
	newsInfoList: [],
	personalForm: {
		avatar: '',
		username: '',
		name: '',
		email: '',
		mobile: '',
		gender: '',
		dept_info: {
			dept_id: 0,
			dept_name: '',
		},
		role_info: [
			{
				id: 0,
				name: '',
			},
		],
	},
});

const getUserInfo = function () {
	api.getUserInfo({}).then((res: any) => {
		const { data } = res;
		// dictionary('gender') may return Chinese, keep as-is
		genderList.value = dictionary('gender');
		state.personalForm.avatar = data.avatar || '';
		state.personalForm.username = data.username || '';
		state.personalForm.name = data.name || '';
		state.personalForm.email = data.email || '';
		state.personalForm.mobile = data.mobile || '';
		state.personalForm.gender = data.gender;
		state.personalForm.dept_info.dept_name = data.dept_info?.dept_name || '';
		state.personalForm.role_info = data.role_info || [];
	});
};

const submitForm = async () => {
	if (!userInfoFormRef.value) return;
	await userInfoFormRef.value.validate((valid: boolean) => {
		if (valid) {
			submitting.value = true;
			api.updateUserInfo(state.personalForm).then(() => {
				ElMessage.success(t('message.pages.personal.messages.updateSuccess'));
				getUserInfo();
				emit('user-updated');
			}).finally(() => {
				submitting.value = false;
			});
		} else {
			ElMessage.error(t('message.pages.personal.validation.formValidationFailed'));
		}
	});
};

const uploadImg = (data: any) => {
	const formdata = new FormData();
	formdata.append('file', data);
	api.uploadAvatar(formdata).then((res: any) => {
		if (res.code === 2000) {
			selectImgVisible.value = false;
			state.personalForm.avatar = getBaseURL() + res.data.url;
			api.updateUserInfo(state.personalForm).then(() => {
				successMessage(t('message.pages.personal.messages.updateSuccess'));
				getUserInfo();
				useUserInfo().updateUserInfos();
				// @ts-ignore
				avatarSelectorRef.value.updateAvatar(state.personalForm.avatar);
				emit('user-updated');
			});
		}
	});
};

onMounted(() => {
	getUserInfo();
});
</script>

<style scoped lang="scss">
.basic-info {
	.card-title {
		display: flex;
		align-items: center;
		gap: 6px;
		font-weight: 500;
	}
	.basic-info-header {
		display: flex;
		align-items: center;
		gap: 24px;
		padding: 10px 5px;
		.basic-info-avatar {
			width: 100px;
			height: 130px;
			flex-shrink: 0;
			:deep(.el-upload) {
				height: 100%;
			}
		}
		.basic-info-intro {
			flex: 1;
			.basic-info-greeting {
				font-size: 18px;
				font-weight: 500;
				margin-bottom: 8px;
			}
			.basic-info-sub {
				font-size: 13px;
				color: var(--el-text-color-secondary);
				margin-bottom: 12px;
			}
			.basic-info-tags {
				display: flex;
				flex-wrap: wrap;
				gap: 6px;
				.el-tag {
					display: flex;
					align-items: center;
				}
				.mr4 {
					margin-right: 4px;
				}
			}
		}
		.basic-info-stats {
			display: flex;
			gap: 24px;
			.stat-item {
				text-align: center;
				.stat-value {
					font-size: 24px;
					font-weight: 600;
					color: var(--el-color-primary);
				}
				.stat-label {
					font-size: 12px;
					color: var(--el-text-color-secondary);
					margin-top: 4px;
				}
			}
		}
	}
}
.ml5 {
	margin-left: 5px;
}
.w100 {
	width: 100%;
}
</style>
