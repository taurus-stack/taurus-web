<template>
	<el-config-provider :size="getGlobalComponentSize" :locale="getGlobalI18n">
		<!-- v-show="themeConfig.lockScreenTime > 1" -->
		<router-view v-show="themeConfig.lockScreenTime > 1" />
		<LockScreen v-if="themeConfig.isLockScreen" />
		<Setings ref="setingsRef" v-show="themeConfig.lockScreenTime > 1" />
		<CloseFull v-if="!themeConfig.isLockScreen" />
		<!-- 版本更新弹窗（已启用） + M1.8 Edition CE→EE 升级引导弹窗（合并进 Upgrade 组件） -->
		<Upgrade v-if="getVersion || showEditionBanner" :mode="getVersion ? 'version' : 'edition'" />
	</el-config-provider>
</template>

<script setup lang="ts" name="app">
import { defineAsyncComponent, computed, ref, onBeforeMount, onMounted, onUnmounted, nextTick, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useTagsViewRoutes } from '/@/stores/tagsViewRoutes';
import { useThemeConfig } from '/@/stores/themeConfig';
import other from '/@/utils/other';
import { Local, Session } from '/@/utils/storage';
import mittBus from '/@/utils/mitt';
import setIntroduction from '/@/utils/setIconfont';
// M1.8 Edition Gate
import { useEdition } from '/@/editions/index';

// Import components
const LockScreen = defineAsyncComponent(() => import('/@/layout/lockScreen/index.vue'));
const Setings = defineAsyncComponent(() => import('/@/layout/navBars/breadcrumb/setings.vue'));
const CloseFull = defineAsyncComponent(() => import('/@/layout/navBars/breadcrumb/closeFull.vue'));
const Upgrade = defineAsyncComponent(() => import('/@/layout/upgrade/index.vue'));

// Define variables
const { t, messages, locale } = useI18n();
const setingsRef = ref();
const route = useRoute();
const stores = useTagsViewRoutes();
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);
import websocket from '/@/utils/websocket';
import { ElNotification } from 'element-plus';

// M1.8 Edition Gate: CE 版是否需要显示升级引导（每 7 天弹一次；事件可强制触发）
const { isCommunity, ensureLoaded: editionEnsureLoaded } = useEdition();
const _showEditionBannerRef = ref(false);
const CE_BANNER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天
const CE_BANNER_LAST_TS = 'taurus.ce_banner_last_shown_at';
async function _recomputeEditionBanner() {
	try {
		await editionEnsureLoaded(false);
	} catch (_e) { /* noop */ }
	if (!isCommunity.value) {
		_showEditionBannerRef.value = false;
		return;
	}
	// 登录页不显示
	if (route.path === '/login') {
		_showEditionBannerRef.value = false;
		return;
	}
	_showEditionBannerRef.value = false;
}
const showEditionBanner = computed(() => _showEditionBannerRef.value);

// 监听 taurus:edition-upgrade 事件：v-feature.requireFeature 触发时可强开弹窗
function _onForceEditionUpgrade(_evt: Event) {
	_showEditionBannerRef.value = true;
}

// Get version number
const getVersion = computed(() => {
	return false;
});
// Get global component size
const getGlobalComponentSize = computed(() => {
	return other.globalComponentSize();
});
// Get global i18n
const getGlobalI18n = computed(() => {
	return messages.value[locale.value];
});
// Initialize settings to prevent reset on refresh
onBeforeMount(() => {
	// Set batch third-party icon icons
	setIntroduction.cssCdn();
	// Set batch third-party js
	setIntroduction.jsCdn();
});
// On page load
onMounted(() => {
	// M1.8 Edition Banner
	_recomputeEditionBanner();
	window.addEventListener('taurus:edition-upgrade', _onForceEditionUpgrade);
	nextTick(() => {
		// Listen for layout config drawer open click
		mittBus.on('openSetingsDrawer', () => {
			setingsRef.value.openDrawer();
		});
		// Get cached layout config
		if (Local.get('themeConfig')) {
			storesThemeConfig.setThemeConfig({ themeConfig: Local.get('themeConfig') });
			document.documentElement.style.cssText = Local.get('themeConfigStyle');
		}
		// Get cached fullscreen config
		if (Session.get('isTagsViewCurrenFull')) {
			stores.setCurrenFullscreen(Session.get('isTagsViewCurrenFull'));
		}
	});
});
// On page destroy, close layout config/i18n listeners
onUnmounted(() => {
	mittBus.off('openSetingsDrawer', () => {});
	window.removeEventListener('taurus:edition-upgrade', _onForceEditionUpgrade);
});
// Listen for route changes, set website title
watch(
	() => route.path,
	async () => {
		other.useTitle();
		other.useFavicon();
		// M1.8: 路由切换时重新评估 Banner 是否显示
		await _recomputeEditionBanner();
		if (!websocket.websocket) {
			// websocket module
			try {
				websocket.init(wsReceive);
			} catch (_e) {
				// eslint-disable-next-line no-console
				console.debug('websocket 初始化跳过');
			}
		}
	},
	{
		deep: true,
	}
);

// websocket related code
import { messageCenterStore } from '/@/stores/messageCenter';
const wsReceive = (message: any) => {
	const data = JSON.parse(message.data);
	const { unread } = data;
	const messageCenter = messageCenterStore();
	messageCenter.setUnread(unread);
	if (data.contentType === 'SYSTEM') {
		let translatedMessage = data.content;
		switch (data.content) {
			case 'You are online':
				translatedMessage = t('message.wsOnline');
				break;
			case 'You have unread messages':
				translatedMessage = t('message.wsUnreadMessages', { count: unread });
				break;
			case 'You have unread messages, please check':
				translatedMessage = t('message.wsUnreadMessagesCheck');
				break;
			default:
				if (data.content_code) {
					translatedMessage = t('message.' + data.content_code, { count: unread });
				}
		}
		ElNotification({
			title: t('message.systemMessage'),
			message: translatedMessage,
			type: 'success',
			position: 'bottom-right',
			duration: 5000,
		});
	}
};
onBeforeUnmount(() => {
	// Close connection
	websocket.close();
});
</script>