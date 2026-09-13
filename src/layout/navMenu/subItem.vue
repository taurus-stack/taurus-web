<template>
	<template v-for="val in chils">
		<el-sub-menu
			:index="val.path"
			:key="val.path"
			v-if="val.children && val.children.length > 0"
		>
			<template #title>
				<SvgIcon :name="val.meta.icon" />
				<span class="nav-menu-title">{{ $t(val.meta.title) }}</span>
			</template>
			<sub-item :chil="val.children" />
		</el-sub-menu>
		<template v-else>
			<el-menu-item :index="val.path" :key="val.path" @click="onMenuItemClick(val)">
				<template v-if="!val.meta.isLink || (val.meta.isLink && val.meta.isIframe)">
					<SvgIcon :name="val.meta.icon" />
					<span class="nav-menu-title">{{ $t(val.meta.title) }}</span>
				</template>
				<template v-else>
					<a class="w100" @click.prevent.stop="onALinkClick(val, $event)">
						<SvgIcon :name="val.meta.icon" />
						<span class="nav-menu-title">{{ $t(val.meta.title) }}</span>
					</a>
				</template>
			</el-menu-item>
		</template>
	</template>
</template>

<script setup lang="ts" name="navMenuSubItem">
import { computed } from 'vue';
import { RouteRecordRaw } from 'vue-router';
import other from '/@/utils/other';

// define props passed from parent
const props = defineProps({
	chil: {
		type: Array<RouteRecordRaw>,
		default: () => [],
	},
});

const chils = computed(() => {
	return <RouteItems>props.chil;
});

const onMenuItemClick = (val: any) => {
	if (!val.meta?.isLink || (val.meta?.isLink && val.meta?.isIframe)) return;
	other.handleOpenLink(val);
};

const onALinkClick = (val: any, _e?: MouseEvent) => {
	other.handleOpenLink(val);
};
</script>

<style scoped lang="scss">
.nav-menu-title {
	display: inline-flex;
	align-items: center;
	gap: 6px;
}
</style>
