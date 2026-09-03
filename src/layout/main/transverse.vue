<template>
	<el-container class="layout-container flex-center layout-backtop">
		<LayoutHeader />
		<LayoutMain ref="layoutMainRef" />
	</el-container>
</template>

<script setup lang="ts" name="layoutTransverse">
import { defineAsyncComponent, ref, watch, nextTick, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';

// import component
const LayoutHeader = defineAsyncComponent(() => import('/@/layout/component/header.vue'));
const LayoutMain = defineAsyncComponent(() => import('/@/layout/component/main.vue'));

// define variables
const layoutMainRef = ref<InstanceType<typeof LayoutMain>>();
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);
const route = useRoute();

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