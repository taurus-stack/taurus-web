<template>
	<el-menu
		router
		:default-active="state.defaultActive"
		background-color="transparent"
		:collapse="state.isCollapse"
		:unique-opened="getThemeConfig.isUniqueOpened"
		:collapse-transition="false"
	>
		<template v-for="val in menuLists">
			<el-sub-menu
				:index="val.path"
				v-if="val.children && val.children.length > 0"
				:key="val.path"
				:disabled="!!val.meta?._eeGate"
				:class="{ 'ee-gate-card': !!val.meta?._eeGate, 'is-ee-gate': !!val.meta?._eeGate }"
				:title="val.meta?._eeGate ? eeTooltipTxt() : ''"
				@click.stop="onTopSubMenuClick(val, $event)"
			>
				<template #title>
					<SvgIcon :name="val.meta.icon" />
					<span class="nav-menu-title">
						{{ $t(val.meta.title) }}
						<el-tag v-if="val.meta?._eeGate" size="small" type="warning" effect="plain" class="ee-menu-badge">EE</el-tag>
					</span>
				</template>
				<SubItem :chil="val.children" />
			</el-sub-menu>
			<template v-else>
				<el-menu-item
					:index="val.path"
					:key="val.path"
					:disabled="!!val.meta?._eeGate"
					:class="{ 'ee-gate-card': !!val.meta?._eeGate, 'is-ee-gate': !!val.meta?._eeGate }"
					:title="val.meta?._eeGate ? eeTooltipTxt() : ''"
					@click.stop="onTopMenuClick(val, $event)"
				>
					<SvgIcon :name="val.meta.icon" />
					<template #title v-if="!val.meta.isLink || (val.meta.isLink && val.meta.isIframe)">
						<span class="nav-menu-title">
							{{ $t(val.meta.title) }}
							<el-tag v-if="val.meta?._eeGate" size="small" type="warning" effect="plain" class="ee-menu-badge">EE</el-tag>
						</span>
					</template>
					<template #title v-else>
						<a class="w100" @click.prevent.stop="onALinkClick(val, $event)">
							<span class="nav-menu-title">
								{{ $t(val.meta.title) }}
								<el-tag v-if="val.meta?._eeGate" size="small" type="warning" effect="plain" class="ee-menu-badge">EE</el-tag>
							</span>
						</a>
					</template>
				</el-menu-item>
			</template>
		</template>
	</el-menu>
</template>

<script setup lang="ts" name="navMenuVertical">
import { defineAsyncComponent, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, onBeforeRouteUpdate, RouteRecordRaw } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
import other from '/@/utils/other';
import { triggerEeUpgradeByMeta, eeTooltipTxt } from '/@/editions/index';

const SubItem = defineAsyncComponent(() => import('/@/layout/navMenu/subItem.vue'));

const props = defineProps({
	menuList: {
		type: Array<RouteRecordRaw>,
		default: () => [],
	},
});

const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);
const route = useRoute();
const state = reactive({
	defaultActive: route.meta.isDynamic ? route.meta.isDynamicPath : route.path,
	isCollapse: false,
});

const menuLists = computed(() => {
	return <RouteItems>props.menuList;
});
const getThemeConfig = computed(() => {
	return themeConfig.value;
});
const setParentHighlight = (currentRoute: RouteToFrom) => {
	const { path, meta } = currentRoute;
	const pathSplit = meta?.isDynamic ? meta.isDynamicPath!.split('/') : path!.split('/');
	if (pathSplit.length >= 4 && meta?.isHide) return pathSplit.splice(0, 3).join('/');
	else return path;
};

const onTopSubMenuClick = (val: any, e: MouseEvent) => {
	if (val.meta?._eeGate) {
		e.preventDefault();
		e.stopImmediatePropagation();
		triggerEeUpgradeByMeta(val.meta);
		return false;
	}
};
const onTopMenuClick = (val: any, e: MouseEvent) => {
	if (val.meta?._eeGate) {
		e.preventDefault();
		e.stopImmediatePropagation();
		triggerEeUpgradeByMeta(val.meta);
		return false;
	}
};
const onALinkClick = (val: any, e: MouseEvent) => {
	if (val.meta?._eeGate) {
		e.preventDefault();
		e.stopImmediatePropagation();
		triggerEeUpgradeByMeta(val.meta);
		return false;
	}
	other.handleOpenLink(val);
};

onMounted(() => {
	state.defaultActive = setParentHighlight(route);
});
onBeforeRouteUpdate((to) => {
	state.defaultActive = setParentHighlight(to);
	const clientWidth = document.body.clientWidth;
	if (clientWidth < 1000) themeConfig.value.isCollapse = false;
});
watch(
	themeConfig.value,
	() => {
		document.body.clientWidth <= 1000 ? (state.isCollapse = false) : (state.isCollapse = themeConfig.value.isCollapse);
	},
	{
		immediate: true,
	}
);
</script>

<style scoped lang="scss">
.nav-menu-title {
	display: inline-flex;
	align-items: center;
	gap: 6px;
}
.ee-menu-badge {
	margin-left: 2px;
	flex-shrink: 0;
}
</style>