<template>
	<div class="el-menu-horizontal-warp">
		<el-scrollbar @wheel.native.prevent="onElMenuHorizontalScroll" ref="elMenuHorizontalScrollRef">
			<el-menu router :default-active="state.defaultActive" :ellipsis="false" background-color="transparent" mode="horizontal">
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
							<template #title v-if="!val.meta.isLink || (val.meta.isLink && val.meta.isIframe)">
								<SvgIcon :name="val.meta.icon" />
								<span class="nav-menu-title">
									{{ $t(val.meta.title) }}
									<el-tag v-if="val.meta?._eeGate" size="small" type="warning" effect="plain" class="ee-menu-badge">EE</el-tag>
								</span>
							</template>
							<template #title v-else>
								<a class="w100" @click.prevent.stop="onALinkClick(val, $event)">
									<SvgIcon :name="val.meta.icon" />
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
		</el-scrollbar>
	</div>
</template>

<script setup lang="ts" name="navMenuHorizontal">
import { defineAsyncComponent, reactive, computed, onMounted, nextTick, onBeforeMount, ref } from 'vue';
import { useRoute, onBeforeRouteUpdate, RouteRecordRaw } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useRoutesList } from '/@/stores/routesList';
import { useThemeConfig } from '/@/stores/themeConfig';
import other from '/@/utils/other';
import mittBus from '/@/utils/mitt';
import { triggerEeUpgradeByMeta, eeTooltipTxt } from '/@/editions/index';

const SubItem = defineAsyncComponent(() => import('/@/layout/navMenu/subItem.vue'));

const props = defineProps({
	menuList: {
		type: Array<RouteRecordRaw>,
		default: () => [],
	},
});

const elMenuHorizontalScrollRef = ref();
const stores = useRoutesList();
const storesThemeConfig = useThemeConfig();
const { routesList } = storeToRefs(stores);
const { themeConfig } = storeToRefs(storesThemeConfig);
const route = useRoute();
const state = reactive({
	defaultActive: '' as string | undefined,
});

const menuLists = computed(() => {
	return <RouteItems>props.menuList;
});

const onElMenuHorizontalScroll = (e: WheelEventType) => {
	const eventDelta = e.wheelDelta || -e.deltaY * 40;
	elMenuHorizontalScrollRef.value.$refs.wrapRef.scrollLeft = elMenuHorizontalScrollRef.value.$refs.wrapRef.scrollLeft + eventDelta / 4;
};
const initElMenuOffsetLeft = () => {
	nextTick(() => {
		let els = <HTMLElement>document.querySelector('.el-menu.el-menu--horizontal li.is-active');
		if (!els) return false;
		elMenuHorizontalScrollRef.value.$refs.wrapRef.scrollLeft = els.offsetLeft;
	});
};
const filterRoutesFun = <T extends RouteItem>(arr: T[]): T[] => {
	return arr
		.filter((item: T) => !item.meta?.isHide)
		.map((item: T) => {
			item = Object.assign({}, item);
			if (item.children) item.children = filterRoutesFun(item.children);
			return item;
		});
};
const setSendClassicChildren = (path: string) => {
	const currentPathSplit = path.split('/');
	let currentData: MittMenu = { children: [] };
	filterRoutesFun(routesList.value).map((v, k) => {
		if (v.path === `/${currentPathSplit[1]}`) {
			v['k'] = k;
			currentData['item'] = { ...v };
			currentData['children'] = [{ ...v }];
			if (v.children) currentData['children'] = v.children;
		}
	});
	return currentData;
};
const setCurrentRouterHighlight = (currentRoute: RouteToFrom) => {
	const { path, meta } = currentRoute;
	if (themeConfig.value.layout === 'classic') {
		state.defaultActive = `/${path?.split('/')[1]}`;
	} else {
		const pathSplit = meta?.isDynamic ? meta.isDynamicPath!.split('/') : path!.split('/');
		if (pathSplit.length >= 4 && meta?.isHide) state.defaultActive = pathSplit.splice(0, 3).join('/');
		else state.defaultActive = path;
	}
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

onBeforeMount(() => {
	setCurrentRouterHighlight(route);
});
onMounted(() => {
	initElMenuOffsetLeft();
});
onBeforeRouteUpdate((to) => {
	setCurrentRouterHighlight(to);
	let { layout, isClassicSplitMenu } = themeConfig.value;
	if (layout === 'classic' && isClassicSplitMenu) {
		mittBus.emit('setSendClassicChildren', setSendClassicChildren(to.path));
	}
});
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
.el-menu-horizontal-warp {
	flex: 1;
	overflow: hidden;
	margin-right: 30px;
	:deep(.el-scrollbar__bar.is-vertical) {
		display: none;
	}
	:deep(a) {
		width: 100%;
	}
	.el-menu.el-menu--horizontal {
		display: flex;
		height: 100%;
		width: 100%;
		box-sizing: border-box;
	}
}
</style>