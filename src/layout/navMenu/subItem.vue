<template>
	<template v-for="val in chils">
		<el-sub-menu
			:index="val.path"
			:key="val.path"
			v-if="val.children && val.children.length > 0"
			:disabled="!!val.meta?._eeGate"
			:class="{ 'ee-gate-card': !!val.meta?._eeGate, 'is-ee-gate': !!val.meta?._eeGate }"
			:title="val.meta?._eeGate ? eeTooltipTxt() : ''"
			@click.stop="onSubMenuClick(val, $event)"
		>
			<template #title>
				<SvgIcon :name="val.meta.icon" />
				<span class="nav-menu-title">
					{{ $t(val.meta.title) }}
					<el-tag v-if="val.meta?._eeGate" size="small" type="warning" effect="plain" class="ee-menu-badge">EE</el-tag>
				</span>
			</template>
			<sub-item :chil="val.children" />
		</el-sub-menu>
		<template v-else>
			<el-menu-item
				:index="val.path"
				:key="val.path"
				:disabled="!!val.meta?._eeGate"
				:class="{ 'ee-gate-card': !!val.meta?._eeGate, 'is-ee-gate': !!val.meta?._eeGate }"
				:title="val.meta?._eeGate ? eeTooltipTxt() : ''"
				@click.stop="onMenuItemClick(val, $event)"
			>
				<template v-if="!val.meta.isLink || (val.meta.isLink && val.meta.isIframe)">
					<SvgIcon :name="val.meta.icon" />
					<span class="nav-menu-title">
						{{ $t(val.meta.title) }}
						<el-tag v-if="val.meta?._eeGate" size="small" type="warning" effect="plain" class="ee-menu-badge">EE</el-tag>
					</span>
				</template>
				<template v-else>
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
</template>

<script setup lang="ts" name="navMenuSubItem">
import { computed } from 'vue';
import { RouteRecordRaw } from 'vue-router';
import other from '/@/utils/other';
import { triggerEeUpgradeByMeta, eeTooltipTxt } from '/@/editions/index';

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

const onSubMenuClick = (val: any, e: MouseEvent) => {
	if (val.meta?._eeGate) {
		e.preventDefault();
		e.stopImmediatePropagation();
		triggerEeUpgradeByMeta(val.meta);
		return false;
	}
};

const onMenuItemClick = (val: any, e: MouseEvent) => {
	if (val.meta?._eeGate) {
		e.preventDefault();
		e.stopImmediatePropagation();
		triggerEeUpgradeByMeta(val.meta);
		return false;
	}
	if (!val.meta?.isLink || (val.meta?.isLink && val.meta?.isIframe)) return;
	other.handleOpenLink(val);
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