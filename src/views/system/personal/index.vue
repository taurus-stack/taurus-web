<template>
	<div class="personal layout-pd">
		<el-row :gutter="16">
			<!-- sidebar menu -->
			<el-col :xs="24" :sm="24" :md="6" :lg="5">
				<el-card shadow="hover" class="personal-menu-card">
					<div class="personal-user-summary">
						<el-avatar :size="64" :src="userAvatar">
							<el-icon><ele-UserFilled /></el-icon>
						</el-avatar>
						<div class="personal-user-name">{{ userName }}</div>
						<div class="personal-user-sub">{{ currentTime }}</div>
					</div>
					<el-divider />
					<el-menu
						:default-active="activeMenu"
						@select="handleMenuSelect"
						class="personal-menu"
					>
						<el-menu-item v-for="(item, index) in menuList" :key="index" :index="item.key">
							<el-icon><component :is="item.icon" /></el-icon>
							<span>{{ item.label }}</span>
						</el-menu-item>
					</el-menu>
				</el-card>
			</el-col>

			<!-- right section config -->
			<el-col :xs="24" :sm="24" :md="18" :lg="19">
				<el-card shadow="hover" class="personal-content-card" body-style="padding: 0">
					<div class="personal-content-header">
						<div class="personal-content-title">
							<el-icon><component :is="currentMenuIcon" /></el-icon>
							<span>{{ currentMenuLabel }}</span>
						</div>
						<div class="personal-content-subtitle">{{ currentMenuDesc }}</div>
					</div>
					<div class="personal-content-body">
						<basic-info v-if="activeMenu === 'basic'" @user-updated="onUserUpdated" />
						<security-settings v-else-if="activeMenu === 'security'" />
						<preference-settings v-else-if="activeMenu === 'preference'" />
						<my-favorites v-else-if="activeMenu === 'favorites'" />
						<operation-logs v-else-if="activeMenu === 'logs'" />
					</div>
				</el-card>
			</el-col>
		</el-row>
	</div>
</template>

<script setup lang="ts" name="personal">
import { ref, computed, reactive, onMounted } from 'vue';
import { formatAxis } from '/@/utils/formatTime';
import * as api from './api';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import BasicInfo from './components/BasicInfo.vue';
import SecuritySettings from './components/SecuritySettings.vue';
import PreferenceSettings from './components/PreferenceSettings.vue';
import MyFavorites from './components/MyFavorites.vue';
import OperationLogs from './components/OperationLogs.vue';

const menuList = computed(() => [
	{ key: 'basic', label: t('message.pages.personal.menu.basic'), icon: 'UserFilled', desc: t('message.pages.personal.menu.basicDesc') },
	{ key: 'security', label: t('message.pages.personal.menu.security'), icon: 'Lock', desc: t('message.pages.personal.menu.securityDesc') },
	{ key: 'preference', label: t('message.pages.personal.menu.preference'), icon: 'Setting', desc: t('message.pages.personal.menu.preferenceDesc') },
	{ key: 'favorites', label: t('message.pages.personal.menu.favorites'), icon: 'StarFilled', desc: t('message.pages.personal.menu.favoritesDesc') },
	{ key: 'logs', label: t('message.pages.personal.menu.logs'), icon: 'DataAnalysis', desc: t('message.pages.personal.menu.logsDesc') },
]);

const activeMenu = ref('basic');

const currentMenu = computed(() => menuList.value.find((m) => m.key === activeMenu.value) || menuList.value[0]);
const currentMenuLabel = computed(() => currentMenu.value.label);
const currentMenuIcon = computed(() => currentMenu.value.icon);
const currentMenuDesc = computed(() => currentMenu.value.desc);

const handleMenuSelect = (index: string) => {
	activeMenu.value = index;
};

const userSummary = reactive({
	avatar: '',
	username: '',
	name: '',
});

const userAvatar = computed(() => userSummary.avatar || '');
const userName = computed(() => userSummary.name || userSummary.username || t('message.pages.personal.defaultUserName'));
const currentTime = computed(() => formatAxis(new Date()));

const fetchUserSummary = () => {
	api.getUserInfo({}).then((res: any) => {
		const { data } = res;
		userSummary.avatar = data.avatar || '';
		userSummary.username = data.username || '';
		userSummary.name = data.name || '';
	});
};

const onUserUpdated = () => {
	fetchUserSummary();
};

onMounted(() => {
	fetchUserSummary();
});
</script>

<style scoped lang="scss">
.personal {
	.personal-menu-card {
		.personal-user-summary {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 8px;
			padding: 15px 5px 5px;
			.personal-user-name {
				font-size: 16px;
				font-weight: 500;
				color: var(--el-text-color-primary);
			}
			.personal-user-sub {
				font-size: 12px;
				color: var(--el-text-color-secondary);
			}
		}
		.personal-menu {
			border-right: none;
			:deep(.el-menu-item) {
				border-radius: 4px;
				margin: 4px 0;
			}
		}
	}

	.personal-content-card {
		.personal-content-header {
			padding: 18px 22px;
			border-bottom: 1px solid var(--el-border-color-lighter);
			.personal-content-title {
				display: flex;
				align-items: center;
				gap: 8px;
				font-size: 16px;
				font-weight: 500;
				margin-bottom: 4px;
			}
			.personal-content-subtitle {
				font-size: 12px;
				color: var(--el-text-color-secondary);
				padding-left: 24px;
			}
		}
		.personal-content-body {
			padding: 18px 22px;
			background: var(--el-bg-color-page, #f5f7fa);
		}
	}
}
</style>
