<template>
	<div class="icon-selector w100 h100">
		<el-input
			v-model="state.fontIconSearch"
			:placeholder="state.fontIconPlaceholder"
			:clearable="clearable"
			:disabled="disabled"
			:size="size"
			ref="inputWidthRef"
			@clear="onClearFontIcon"
			@focus="onIconFocus"
			@blur="onIconBlur"
		>
			<template #prepend>
				<SvgIcon
					:name="state.fontIconPrefix === '' ? prepend : state.fontIconPrefix"
					class="font14"
					v-if="state.fontIconPrefix === '' ? prepend?.indexOf('ele-') > -1 : state.fontIconPrefix?.indexOf('ele-') > -1"
				/>
				<i v-else :class="state.fontIconPrefix === '' ? prepend : state.fontIconPrefix" class="font14"></i>
			</template>
		</el-input>
		<el-popover
			placement="bottom"
			:width="state.fontIconWidth"
			transition="el-zoom-in-top"
			popper-class="icon-selector-popper"
			trigger="click"
			:virtual-ref="inputWidthRef"
			virtual-triggering
		>
			<template #default>
				<div class="icon-selector-warp">
					<el-tabs v-model="state.fontIconTabActive" @tab-click="onIconClick">
						<template #before>
							<div class="icon-selector-warp-title">{{ title || t('message.iconSelectTitle') }}</div>
						</template>
						<el-tab-pane lazy label="ali" name="ali">
							<IconList :list="fontIconSheetsFilterList" :empty="emptyDescription || t('message.iconEmptyList')" :prefix="state.fontIconPrefix" @get-icon="onColClick" />
						</el-tab-pane>
						<el-tab-pane lazy label="ele" name="ele">
							<IconList :list="fontIconSheetsFilterList" :empty="emptyDescription || t('message.iconEmptyList')" :prefix="state.fontIconPrefix" @get-icon="onColClick" />
						</el-tab-pane>
						<el-tab-pane lazy label="awe" name="awe">
							<IconList :list="fontIconSheetsFilterList" :empty="emptyDescription || t('message.iconEmptyList')" :prefix="state.fontIconPrefix" @get-icon="onColClick" />
						</el-tab-pane>
					</el-tabs>
				</div>
			</template>
		</el-popover>
	</div>
</template>

<script setup lang="ts" name="iconSelector">
import { defineAsyncComponent, ref, reactive, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TabsPaneContext } from 'element-plus';
import initIconfont from '/@/utils/getStyleSheets';
import '/@/theme/iconSelector.scss';

// define props passed from parent
const props = defineProps({
	// input prepend content
	prepend: {
		type: String,
		default: () => 'ele-Pointer',
	},
	// input placeholder（若留空则从 i18n 取 message.iconSearchPlaceholder，避免硬编码中文覆盖多语言）
	placeholder: {
		type: String,
		default: () => '',
	},
	// input size
	size: {
		type: String,
		default: () => 'default',
	},
	// dialog title - 留空走 i18n message.iconSelectTitle
	title: {
		type: String,
		default: () => '',
	},
	// disabled
	disabled: {
		type: Boolean,
		default: () => false,
	},
	// clearable
	clearable: {
		type: Boolean,
		default: () => true,
	},
	// custom empty description - 留空走 i18n message.iconEmptyList
	emptyDescription: {
		type: String,
		default: () => '',
	},
	// v-model value, default modelValue
	// ref: https://v3.cn.vuejs.org/guide/migration/v-model.html#%E8%BF%81%E7%A7%BB%E7%AD%96%E7%95%A5
	// ref: https://v3.cn.vuejs.org/guide/component-custom-events.html#%E5%A4%9A%E4%B8%AA-v-model-%E7%BB%91%E5%AE%9A
	modelValue: String,
});

// define emits
const emit = defineEmits(['update:modelValue', 'get', 'clear']);
const { t } = useI18n();

// import component
const IconList = defineAsyncComponent(() => import('/@/components/iconSelector/list.vue'));

// define variables
const inputWidthRef = ref();
const state = reactive({
	fontIconPrefix: '',
	fontIconWidth: 0,
	fontIconSearch: '',
	fontIconPlaceholder: '',
	fontIconTabActive: 'ali',
	fontIconList: {
		ali: [],
		ele: [],
		awe: [],
	},
});

// handle input focus, set placeholder when modelValue present
const onIconFocus = () => {
	if (!props.modelValue) return false;
	state.fontIconSearch = '';
	state.fontIconPlaceholder = props.modelValue;
};
// handle input blur, clear if empty or restore previous value
const onIconBlur = () => {
	const list = fontIconTabNameList();
	setTimeout(() => {
		const icon = list.filter((icon: string) => icon === state.fontIconSearch);
		if (icon.length <= 0) state.fontIconSearch = '';
	}, 300);
};
// icon search and display
const fontIconSheetsFilterList = computed(() => {
	const list = fontIconTabNameList();
	if (!state.fontIconSearch) return list;
	let search = state.fontIconSearch.trim().toLowerCase();
	return list.filter((item: string) => {
		if (item.toLowerCase().indexOf(search) !== -1) return item;
	});
});
// get icon list by active tab
const fontIconTabNameList = () => {
	let iconList: any = [];
	if (state.fontIconTabActive === 'ali') iconList = state.fontIconList.ali;
	else if (state.fontIconTabActive === 'ele') iconList = state.fontIconList.ele;
	else if (state.fontIconTabActive === 'awe') iconList = state.fontIconList.awe;
	return iconList;
};
// init v-model echo
const initModeValueEcho = () => {
	if (props.modelValue === '') return ((<string | undefined>state.fontIconPlaceholder) = props.placeholder);
	(<string | undefined>state.fontIconPlaceholder) = props.modelValue;
	(<string | undefined>state.fontIconPrefix) = props.modelValue;
};
// detect icon type for tab highlight and init
const initFontIconName = () => {
	let name = 'ali';
	if (props.modelValue!.indexOf('iconfont') > -1) name = 'ali';
	else if (props.modelValue!.indexOf('ele-') > -1) name = 'ele';
	else if (props.modelValue!.indexOf('fa') > -1) name = 'awe';
	// init tab highlight
	state.fontIconTabActive = name;
	return name;
};
// init data
const initFontIconData = async (name: string) => {
	if (name === 'ali') {
		// Alibaba iconfont uses `iconfont xxx`
		if (state.fontIconList.ali.length > 0) return;
		await initIconfont.ali().then((res: any) => {
			state.fontIconList.ali = res.map((i: string) => `iconfont ${i}`);
		});
	} else if (name === 'ele') {
		// element plus icons
		if (state.fontIconList.ele.length > 0) return;
		await initIconfont.ele().then((res: any) => {
			state.fontIconList.ele = res;
		});
	} else if (name === 'awe') {
		// fontawesome icons use `fa xxx`
		if (state.fontIconList.awe.length > 0) return;
		await initIconfont.awe().then((res: any) => {
			state.fontIconList.awe = res.map((i: string) => `fa ${i}`);
		});
	}
	// init input placeholder
	// ref (one-way data flow): https://cn.vuejs.org/v2/guide/components-props.html
	state.fontIconPlaceholder = props.placeholder || t('message.iconSearchPlaceholder');
	// init v-model echo
	initModeValueEcho();
};
// icon tab switch
const onIconClick = (pane: TabsPaneContext) => {
	initFontIconData(pane.paneName as string);
	inputWidthRef.value.focus();
};
// get clicked icon
const onColClick = (v: string) => {
	state.fontIconPlaceholder = v;
	state.fontIconPrefix = v;
	emit('get', state.fontIconPrefix);
	emit('update:modelValue', state.fontIconPrefix);
	inputWidthRef.value.focus();
};
// clear selected icon
const onClearFontIcon = () => {
	state.fontIconPrefix = '';
	emit('clear', state.fontIconPrefix);
	emit('update:modelValue', state.fontIconPrefix);
};
// get input width
const getInputWidth = () => {
	nextTick(() => {
		state.fontIconWidth = inputWidthRef.value.$el.offsetWidth;
	});
};
// watch window resize
const handleWindowResize = () => {
	getInputWidth();
};
const initResize = () => {
	window.addEventListener('resize', handleWindowResize);
};
// remove listener on unmount
onBeforeUnmount(() => {
	window.removeEventListener('resize', handleWindowResize);
});
// on mount
onMounted(() => {
	initFontIconData(initFontIconName());
	initResize();
	getInputWidth();
});
// watch v-model changes
watch(
	() => props.modelValue,
	() => {
		initModeValueEcho();
		initFontIconName();
	}
);
</script>
