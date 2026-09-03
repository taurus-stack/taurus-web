<template>
	<el-container class="layout-container flex-center">
		<LayoutHeader />
		<el-container class="layout-mian-height-50">
			<LayoutAside />
			<div class="flex-center layout-backtop">
				<LayoutTagsView v-if="isTagsview" />
				<LayoutMain ref="layoutMainRef" />
			</div>
		</el-container>
	</el-container>
</template>

<script setup lang="ts" name="layoutClassic">
import { defineAsyncComponent, computed, ref, watch, nextTick, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';

// import component
const LayoutAside = defineAsyncComponent(() => import('/@/layout/component/aside.vue'));
const LayoutHeader = defineAsyncComponent(() => import('/@/layout/component/header.vue'));
const LayoutMain = defineAsyncComponent(() => import('/@/layout/component/main.vue'));
const LayoutTagsView = defineAsyncComponent(() => import('/@/layout/navBars/tagsView/tagsView.vue'));

// define variables
const layoutMainRef = ref<InstanceType<typeof LayoutMain>>();
const route = useRoute();
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);

// check if show tagsview
const isTagsview = computed(() => {
	return themeConfig.value.isTagsview;
});
// reset scrollbar height, update children
const updateScrollbar = () => {
	layoutMainRef.value?.layoutMainScrollbarRef?.update();
};
// reset scrollbar height (async components)
const initScrollBarHeight = () => {
	nextTick(() => {
		setTimeout(() => {
			updateScrollbar();
			layoutMainRef.value?.layoutMainScrollbarRef?.wrapRef && (layoutMainRef.value.layoutMainScrollbarRef.wrapRef.scrollTop = 0);
		}, 500);
	});
};
// on mount
onMounted(() => {
	initScrollBarHeight();
});
// watch route, scroll to top
watch(
	() => route.path,
	() => {
		initScrollBarHeight();
	}
);
// watch themeConfig, update scrollbar
watch(
	themeConfig,
	() => {
		updateScrollbar();
	},
	{
		deep: true,
	}
);
</script>