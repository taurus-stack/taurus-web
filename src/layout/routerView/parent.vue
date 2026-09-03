<template>
	<div class="layout-parent">
		<template v-if="showView">
			<router-view v-slot="{ Component }">
				<transition :name="setTransitionName" mode="out-in">
					<keep-alive :include="getKeepAliveNames">
						<component :is="Component" :key="state.refreshRouterViewKey" class="w100" v-show="!isIframePage" />
					</keep-alive>
				</transition>
			</router-view>
		</template>
		<transition :name="setTransitionName" mode="out-in">
			<Iframes class="w100" v-show="isIframePage" :refreshKey="state.iframeRefreshKey" :name="setTransitionName"
				:list="state.iframeList" />
		</transition>
	</div>
</template>

<script setup lang="ts" name="layoutParentView">
import { defineAsyncComponent, computed, reactive, onBeforeMount, onUnmounted, nextTick, watch, onMounted, ref, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useKeepALiveNames } from '/@/stores/keepAliveNames';
import { useThemeConfig } from '/@/stores/themeConfig';
import { Session } from '/@/utils/storage';
import mittBus from '/@/utils/mitt';

// Import component
const Iframes = defineAsyncComponent(() => import('/@/layout/routerView/iframes.vue'));

// Define reactive state
const route = useRoute();
const router = useRouter();
const storesKeepAliveNames = useKeepALiveNames();
const storesThemeConfig = useThemeConfig();
const { keepAliveNames, cachedViews } = storeToRefs(storesKeepAliveNames);
const { themeConfig } = storeToRefs(storesThemeConfig);
const state = reactive<ParentViewState>({
	refreshRouterViewKey: '', // on non-iframe tagsview right-click refresh
	iframeRefreshKey: '', // on iframe tagsview right-click refresh
	keepAliveNameList: [],
	iframeList: [],
});

// Global reactive page refresh
const showView = ref(true)
/**
 * Refresh page
 */
const refreshView = function () {
	showView.value = false // Remove router-view node via v-if
	nextTick(() => {
		showView.value = true // Re-add router-view node via v-if after DOM update
	})
}
provide('refreshView', refreshView)

// Set main view transition animation
const setTransitionName = computed(() => {
	return themeConfig.value.animation;
});
// Get component cache list (name values)
const getKeepAliveNames = computed(() => {
	return themeConfig.value.isTagsview ? cachedViews.value : state.keepAliveNameList;
});
// Set iframe show/hide
const isIframePage = computed(() => {
	return route.meta.isIframe;
});
// Get iframe component list (not yet rendered)
const getIframeListRoutes = async () => {
	router.getRoutes().forEach((v) => {
		if (v.meta.isIframe) {
			v.meta.isIframeOpen = false;
			v.meta.loading = true;
			state.iframeList.push({ ...v });
		}
	});
};
// Before page load, handle cache; handle route cache on page refresh
const onTagsViewRefreshRouterViewHandler = (payload: any) => {
	const fullPath = typeof payload === 'string' ? payload : payload?.fullPath || route.fullPath;
	const needKeepAlive = typeof payload === 'string' ? false : (payload?.needKeepAlive ?? false);
	const item = typeof payload === 'string' ? null : (payload?.item || null);
	state.refreshRouterViewKey = fullPath;
	state.iframeRefreshKey = fullPath;
	showView.value = false;
	nextTick(() => {
		nextTick(() => {
			if (needKeepAlive && item) storesKeepAliveNames.addCachedView(item);
			showView.value = true;
		});
	});
};
onBeforeMount(() => {
	state.keepAliveNameList = keepAliveNames.value;
	mittBus.on('onTagsViewRefreshRouterView', onTagsViewRefreshRouterViewHandler);
});
// On page load
onMounted(() => {
	getIframeListRoutes();
	// https://gitee.com/lyt-top/vue-next-admin/issues/I58U75
	// https://gitee.com/lyt-top/vue-next-admin/issues/I59RXK
	// https://gitee.com/lyt-top/vue-next-admin/pulls/40
	nextTick(() => {
		setTimeout(() => {
			if (themeConfig.value.isCacheTagsView) {
				let tagsViewArr: RouteItem[] = Session.get('tagsViewList') || [];
				cachedViews.value = tagsViewArr.filter((item) => item.meta?.isKeepAlive).map((item) => item.name as string);
			}
		}, 0);
	});
});
// On page unmount
onUnmounted(() => {
	mittBus.off('onTagsViewRefreshRouterView', onTagsViewRefreshRouterViewHandler);
});
// Watch route changes to prevent transition animation disappearing when tagsView has multiple tabs
// https://toscode.gitee.com/lyt-top/vue-next-admin/pulls/38/files
watch(
	() => route.fullPath,
	(newVal, oldVal) => {
		// Only update key when switching between different route pages (judge by route.name)
		// Do not use fullPath because query changes within the same page should not trigger component rebuild
		if (newVal !== oldVal) {
			const newPath = newVal.split('?')[0];
			const oldPath = oldVal ? oldVal.split('?')[0] : '';
			if (newPath !== oldPath) {
				state.refreshRouterViewKey = decodeURI(newPath);
			}
		}
	},
	{
		immediate: false,
	}
);

// Initialize refreshRouterViewKey: use only the path part, no query/hash, to avoid false component rebuilds from param changes
state.refreshRouterViewKey = decodeURI(route.fullPath.split('?')[0]);
</script>
