<template>
	<div class="preference-settings">
		<el-card shadow="hover" class="mb15">
			<template #header>
				<div class="card-title">
					<el-icon><ele-Moon /></el-icon>
					<span>{{ t('message.pages.personal.preference.appearance') }}</span>
				</div>
			</template>
			<el-form :model="preference" label-width="120px" size="default" class="mt10">
				<el-form-item :label="t('message.pages.personal.preference.themeMode')">
					<el-radio-group v-model="preference.theme">
						<el-radio-button value="light">
							<el-icon><ele-Sunny /></el-icon>
							<span class="ml5">{{ t('message.pages.personal.preference.light') }}</span>
						</el-radio-button>
						<el-radio-button value="dark">
							<el-icon><ele-Moon /></el-icon>
							<span class="ml5">{{ t('message.pages.personal.preference.dark') }}</span>
						</el-radio-button>
						<el-radio-button value="auto">
							<el-icon><ele-Monitor /></el-icon>
							<span class="ml5">{{ t('message.pages.personal.preference.autoTheme') }}</span>
						</el-radio-button>
					</el-radio-group>
				</el-form-item>
				<el-form-item :label="t('message.pages.personal.preference.themeColor')">
					<el-color-picker v-model="preference.primaryColor" show-alpha />
					<span class="ml10 text-tip">{{ t('message.pages.personal.preference.themeColorTip') }}</span>
				</el-form-item>
				<el-form-item :label="t('message.pages.personal.preference.language')">
					<el-select v-model="preference.language" style="width: 200px">
						<el-option :label="t('message.pages.personal.preference.zhCN')" value="zh-CN" />
						<el-option :label="t('message.pages.personal.preference.enUS')" value="en-US" />
					</el-select>
				</el-form-item>
				<el-form-item :label="t('message.pages.personal.preference.compactMode')">
					<el-switch v-model="preference.compact" :active-text="t('message.pages.personal.preference.on')" :inactive-text="t('message.pages.personal.preference.off')" />
					<span class="ml10 text-tip">{{ t('message.pages.personal.preference.compactTip') }}</span>
				</el-form-item>
			</el-form>
		</el-card>

		<el-card shadow="hover" class="mb15">
			<template #header>
				<div class="card-title">
					<el-icon><ele-Clock /></el-icon>
					<span>{{ t('message.pages.personal.preference.timezone') }}</span>
				</div>
			</template>
			<el-form :model="preference" label-width="120px" size="default" class="mt10">
				<el-form-item :label="t('message.pages.personal.preference.timezoneLabel')">
					<el-select v-model="preference.timezone" style="width: 320px">
						<el-option label="(UTC+08:00) 北京 / 上海" value="Asia/Shanghai" />
						<el-option label="(UTC+00:00) 伦敦" value="Europe/London" />
						<el-option label="(UTC-05:00) 纽约" value="America/New_York" />
						<el-option label="(UTC+09:00) 东京" value="Asia/Tokyo" />
						<el-option label="(UTC+08:00) 新加坡" value="Asia/Singapore" />
						<el-option label="(UTC-08:00) 洛杉矶" value="America/Los_Angeles" />
					</el-select>
				</el-form-item>
				<el-form-item :label="t('message.pages.personal.preference.dateFormat')">
					<el-radio-group v-model="preference.dateFormat">
						<el-radio-button value="YYYY-MM-DD">2024-01-15</el-radio-button>
						<el-radio-button value="YYYY/MM/DD">2024/01/15</el-radio-button>
						<el-radio-button value="DD/MM/YYYY">15/01/2024</el-radio-button>
					</el-radio-group>
				</el-form-item>
				<el-form-item :label="t('message.pages.personal.preference.timeFormat')">
					<el-radio-group v-model="preference.timeFormat">
						<el-radio-button value="24h">{{ t('message.pages.personal.preference.tf24h') }}</el-radio-button>
						<el-radio-button value="12h">{{ t('message.pages.personal.preference.tf12h') }}</el-radio-button>
					</el-radio-group>
				</el-form-item>
			</el-form>
		</el-card>

		<el-card shadow="hover">
			<template #header>
				<div class="card-title">
					<el-icon><ele-Bell /></el-icon>
					<span>{{ t('message.pages.personal.preference.notifications') }}</span>
				</div>
			</template>
			<el-form :model="preference" label-width="160px" size="default" class="mt10">
				<el-form-item :label="t('message.pages.personal.preference.notifyMessage')">
					<el-switch v-model="preference.notifyMessage" :active-text="t('message.pages.personal.preference.on')" :inactive-text="t('message.pages.personal.preference.off')" />
				</el-form-item>
				<el-form-item :label="t('message.pages.personal.preference.notifyEmail')">
					<el-switch v-model="preference.notifyEmail" :active-text="t('message.pages.personal.preference.on')" :inactive-text="t('message.pages.personal.preference.off')" />
				</el-form-item>
				<el-form-item :label="t('message.pages.personal.preference.notifyDesktop')">
					<el-switch v-model="preference.notifyDesktop" :active-text="t('message.pages.personal.preference.on')" :inactive-text="t('message.pages.personal.preference.off')" />
				</el-form-item>
				<el-form-item :label="t('message.pages.personal.preference.soundEnabled')">
					<el-switch v-model="preference.soundEnabled" :active-text="t('message.pages.personal.preference.on')" :inactive-text="t('message.pages.personal.preference.off')" />
				</el-form-item>
				<el-form-item :label="t('message.pages.personal.preference.defaultPage')">
					<el-select v-model="preference.defaultPage" style="width: 240px" :placeholder="t('message.pages.personal.preference.defaultPagePlaceholder')">
						<el-option :label="t('message.pages.personal.preference.pgHome')" value="/home" />
						<el-option :label="t('message.pages.personal.preference.pgMessageCenter')" value="/messageCenter" />
						<el-option :label="t('message.pages.personal.preference.pgPersonal')" value="/personal" />
					</el-select>
				</el-form-item>
				<el-form-item :label="t('message.pages.personal.preference.pageSize')">
					<el-select v-model="preference.pageSize" style="width: 160px">
						<el-option :label="10" :value="10" />
						<el-option :label="20" :value="20" />
						<el-option :label="50" :value="50" />
						<el-option :label="100" :value="100" />
					</el-select>
				</el-form-item>
			</el-form>
			<el-divider />
			<div class="form-actions">
				<el-button type="primary" :loading="saving" @click="submitPreference">
					<el-icon><ele-Check /></el-icon>
					{{ t('message.pages.personal.preference.savePreference') }}
				</el-button>
				<el-button @click="resetPreference">
					<el-icon><ele-Refresh /></el-icon>
					{{ t('message.pages.personal.preference.resetPreference') }}
				</el-button>
			</div>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="PersonalPreferenceSettings">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import * as api from '../api';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const saving = ref(false);

const defaultPref = {
	theme: 'light',
	primaryColor: '#409EFF',
	language: 'zh-CN',
	compact: false,
	timezone: 'Asia/Shanghai',
	dateFormat: 'YYYY-MM-DD',
	timeFormat: '24h',
	notifyMessage: true,
	notifyEmail: true,
	notifyDesktop: false,
	soundEnabled: true,
	defaultPage: '/home',
	pageSize: 20,
};

const preference = reactive({ ...defaultPref });

const fetchPreference = () => {
	api.getPreferenceSettings().then((res: any) => {
		const data = res?.data || {};
		Object.assign(preference, defaultPref, data);
	}).catch(() => {
		Object.assign(preference, defaultPref);
	});
};

const submitPreference = () => {
	saving.value = true;
	api.updatePreferenceSettings({ ...preference }).then(() => {
		ElMessage.success(t('message.pages.personal.preference.saveSuccess'));
	}).catch(() => {
		ElMessage.warning(t('message.pages.personal.preference.saveFailed'));
	}).finally(() => {
		saving.value = false;
	});
};

const resetPreference = () => {
	Object.assign(preference, defaultPref);
	ElMessage.info(t('message.pages.personal.preference.resetInfo'));
};

onMounted(() => {
	fetchPreference();
});
</script>

<style scoped lang="scss">
.preference-settings {
	.card-title {
		display: flex;
		align-items: center;
		gap: 6px;
		font-weight: 500;
	}
	.form-actions {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
	}
}
.ml5 {
	margin-left: 5px;
}
.ml10 {
	margin-left: 10px;
}
.text-tip {
	font-size: 12px;
	color: var(--el-text-color-placeholder);
}
</style>
