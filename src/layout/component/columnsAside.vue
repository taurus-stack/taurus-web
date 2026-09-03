<template>
	<div class="layout-columns-aside">
		<el-scrollbar>
			<ul @mouseleave="onColumnsAsideMenuMouseleave()">
				<li
					v-for="(v, k) in state.columnsAsideList"
					:key="k"
					@click="onColumnsAsideMenuClick(v, k)"
					@mouseenter="onColumnsAsideMenuMouseenter(v, k)"
					:ref="
						(el) => {
							if (el) columnsAsideOffsetTopRefs[k] = el;
						}
					"
					:class="{ 'layout-columns-active': state.liIndex === k, 'layout-columns-hover': state.liHoverIndex === k }"
					:title="$t(v.meta.title)"
				>
					<div :class="themeConfig.columnsAsideLayout" v-if="!v.meta.isLink || (v.meta.isLink && v.meta.isIframe)">
						<SvgIcon :name="v.meta.icon" />
						<div class="columns-vertical-title font12">
							{{
								$t(v.meta.title) && $t(v.meta.title).length >= 4
									? $t(v.meta.title).substr(0, themeConfig.columnsAsideLayout === 'columns-vertical' ? 4 : 3)
									: $t(v.meta.title)
							}}
						</div>
					</div>
					<div :class="themeConfig.columnsAsideLayout" v-else>
						<a :href="v.meta.isLink" target="_blank">
							<SvgIcon :name="v.meta.icon" />
							<div class="columns-vertical-title font12">
								{{
									$t(v.meta.title) && $t(v.meta.title).length >= 4
										? $t(v.meta.title).substr(0, themeConfig.columnsAsideLayout === 'columns-vertical' ? 4 : 3)
										: $t(v.meta.title)
								}}
							</div>
						</a>
					</div>
				</li>
				<div ref="columnsAsideActiveRef" :class="themeConfig.columnsAsideStyle"></div>
			</ul>
		</el-scrollbar>
		<div class="columns-aside-footer">
			<div class="columns-version-badge" :class="'is-' + edition" :title="editionTitle">
				{{ editionShort }}
			</div>
			<div class="columns-version-text" :title="'v' + appVersion">
				v{{ appVersion }}
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="layoutColumnsAside">
import { reactive, ref, onMounted, nextTick, watch, onUnmounted, computed } from 'vue';
import { useRoute, useRouter, onBeforeRouteUpdate, RouteRecordRaw } from 'vue-router';
import { storeToRefs } from 'pinia';
import pinia from '/@/stores/index';
import { useRoutesList } from '/@/stores/routesList';
import { useThemeConfig } from '/@/stores/themeConfig';
import { useEditionStore } from '/@/editions';
import { useI18n } from 'vue-i18n';
import mittBus from '/@/utils/mitt';

const { t } = useI18n();

// define variables
const columnsAsideOffsetTopRefs = ref<RefType>([]);
const columnsAsideActiveRef = ref();
const stores = useRoutesList();
const storesThemeConfig = useThemeConfig();
const storesEdition = useEditionStore();
const { routesList, isColumnsMenuHover, isColumnsNavHover } = storeToRefs(stores);
const { themeConfig } = storeToRefs(storesThemeConfig);
const { edition } = storeToRefs(storesEdition);
// @ts-ignore __VERSION__ 由 vite define 在编译时注入
const appVersion = __VERSION__;
storesEdition.ensureLoaded();

const editionShort = computed(() => (edition.value === 'enterprise' ? 'E' : 'C'));
const editionTitle = computed(() =>
	edition.value === 'enterprise' ? t('editionEnterprise') : t('editionCommunity')
);

const route = useRoute();
const router = useRouter();
const state = reactive<ColumnsAsideState>({
	columnsAsideList: [],
	liIndex: 0,
	liOldIndex: null,
	liHoverIndex: null,
	liOldPath: null,
	difference: 0,
	routeSplit: [],
});

// move menu highlight
const setColumnsAsideMove = (k: number) => {
	state.liIndex = k;
	columnsAsideActiveRef.value.style.top = `${columnsAsideOffsetTopRefs.value[k].offsetTop + state.difference}px`;
};
// menu highlight click
const onColumnsAsideMenuClick = (v: RouteItem, k: number) => {
	setColumnsAsideMove(k);
	let { path, redirect } = v;
	if (redirect) router.push(redirect);
	else router.push(path);
};
// show child menu on mouse enter
const onColumnsAsideMenuMouseenter = (v: RouteRecordRaw, k: number) => {
	if (!themeConfig.value.isColumnsMenuHoverPreload) return false;
	let { path } = v;
	state.liOldPath = path;
	state.liOldIndex = k;
	state.liHoverIndex = k;
	mittBus.emit('setSendColumnsChildren', setSendChildren(path));
	stores.setColumnsMenuHover(false);
	stores.setColumnsNavHover(true);
};
// restore menu on mouse leave
const onColumnsAsideMenuMouseleave = async () => {
	await stores.setColumnsNavHover(false);
	// delay to get latest routesList
	setTimeout(() => {
		if (!isColumnsMenuHover && !isColumnsNavHover) mittBus.emit('restoreDefault');
	}, 100);
};
// settings highlight dynamic position
const onColumnsAsideDown = (k: number) => {
	nextTick(() => {
		setColumnsAsideMove(k);
	});
};
// filter routes (dynamic/in-menu)
const setFilterRoutes = () => {
	state.columnsAsideList = filterRoutesFun(routesList.value);
	const resData: MittMenu = setSendChildren(route.path);
	if (Object.keys(resData).length <= 0) return false;
	onColumnsAsideDown(resData.item?.k);
	mittBus.emit('setSendColumnsChildren', resData);
};
// pass child data to menu
const setSendChildren = (path: string) => {
	const currentPathSplit = path.split('/');
	let currentData: MittMenu = { children: [] };
	state.columnsAsideList.map((v: RouteItem, k: number) => {
		if (v.path === `/${currentPathSplit[1]}`) {
			v['k'] = k;
			currentData['item'] = { ...v };
			currentData['children'] = [{ ...v }];
			if (v.children) currentData['children'] = v.children;
		}
	});
	return currentData;
};
// recursive route filter
const filterRoutesFun = <T extends RouteItem>(arr: T[]): T[] => {
	return arr
		.filter((item: T) => !item.meta?.isHide)
		.map((item: T) => {
			item = Object.assign({}, item);
			if (item.children) item.children = filterRoutesFun(item.children);
			return item;
		});
};
// on tagsView click: highlight sidebar menu
const setColumnsMenuHighlight = (path: string) => {
	state.routeSplit = path.split('/');
	state.routeSplit.shift();
	const routeFirst = `/${state.routeSplit[0]}`;
	const currentSplitRoute = state.columnsAsideList.find((v: RouteItem) => v.path === routeFirst);
	if (!currentSplitRoute) return false;
	// delay to avoid undefined
	setTimeout(() => {
		onColumnsAsideDown(currentSplitRoute.k);
	}, 0);
};
// on mount
onMounted(() => {
	setFilterRoutes();
	// destroy variable, avoid keeping last record when mouse re-enters
	mittBus.on('restoreDefault', () => {
		state.liOldIndex = null;
		state.liOldPath = null;
	});
});
// on unmount
onUnmounted(() => {
	mittBus.off('restoreDefault', () => {});
});
// on route update
onBeforeRouteUpdate((to) => {
	setColumnsMenuHighlight(to.path);
	mittBus.emit('setSendColumnsChildren', setSendChildren(to.path));
});
// watch layout config changes, dynamically adjust menu highlight position offset in pixels
watch(
	pinia.state,
	(val) => {
		val.themeConfig.themeConfig.columnsAsideStyle === 'columnsRound' ? (state.difference = 3) : (state.difference = 0);
		if (!val.routesList.isColumnsMenuHover && !val.routesList.isColumnsNavHover) {
			state.liHoverIndex = null;
			mittBus.emit('setSendColumnsChildren', setSendChildren(route.path));
		} else {
			state.liHoverIndex = state.liOldIndex;
			if (!state.liOldPath) return false;
			mittBus.emit('setSendColumnsChildren', setSendChildren(state.liOldPath));
		}
	},
	{
		deep: true,
	}
);
</script>

<style scoped lang="scss">
.layout-columns-aside {
	width: 70px;
	height: 100%;
	background: var(--next-bg-columnsMenuBar);
	display: flex;
	flex-direction: column;
	.el-scrollbar {
		flex: 1;
		min-height: 0;
	}
	ul {
		position: relative;
		.layout-columns-active {
			color: var(--next-bg-columnsMenuBarColor) !important;
			transition: 0.3s ease-in-out;
		}
		.layout-columns-hover {
			color: var(--el-color-primary);
			a {
				color: var(--el-color-primary);
			}
		}
		li {
			color: var(--next-bg-columnsMenuBarColor);
			width: 100%;
			height: 50px;
			text-align: center;
			display: flex;
			cursor: pointer;
			position: relative;
			z-index: 1;
			&:hover {
				@extend .layout-columns-hover;
			}
			.columns-vertical {
				margin: auto;
				.columns-vertical-title {
					padding-top: 1px;
				}
			}
			.columns-horizontal {
				display: flex;
				height: 50px;
				width: 100%;
				align-items: center;
				padding: 0 5px;
				i {
					margin-right: 3px;
				}
				a {
					display: flex;
					.columns-horizontal-title {
						padding-top: 1px;
					}
				}
			}
			a {
				text-decoration: none;
				color: var(--next-bg-columnsMenuBarColor);
			}
		}
		.columns-round {
			background: var(--el-color-primary);
			color: var(--el-color-white);
			position: absolute;
			left: 50%;
			top: 2px;
			height: 44px;
			width: 65px;
			transform: translateX(-50%);
			z-index: 0;
			transition: 0.3s ease-in-out;
			border-radius: 5px;
		}
		.columns-card {
			@extend .columns-round;
			top: 0;
			height: 50px;
			width: 100%;
			border-radius: 0;
		}
	}
}

.columns-aside-footer {
	padding: 10px 6px 12px;
	border-top: 1px solid rgba(255, 255, 255, 0.08);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;

	.columns-version-badge {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		font-weight: 700;
		line-height: 1;
		cursor: default;

		&.is-community {
			background: rgba(144, 147, 153, 0.2);
			color: var(--next-bg-columnsMenuBarColor);
			border: 1px solid rgba(255, 255, 255, 0.1);
		}

		&.is-enterprise {
			background: linear-gradient(135deg, #f39c12, #e67e22);
			color: #fff;
			box-shadow: 0 2px 6px rgba(243, 156, 18, 0.35);
		}
	}

	.columns-version-text {
		font-size: 10px;
		color: rgba(255, 255, 255, 0.5);
		font-weight: 500;
		white-space: nowrap;
		letter-spacing: 0.3px;
	}
}
</style>