<template>
	<div class="notice-bar" :style="{ background, height: `${height}px` }" v-show="!state.isMode">
		<div class="notice-bar-warp" :style="{ color, fontSize: `${size}px` }">
			<i v-if="leftIcon" class="notice-bar-warp-left-icon" :class="leftIcon"></i>
			<div class="notice-bar-warp-text-box" ref="noticeBarWarpRef">
				<div class="notice-bar-warp-text" ref="noticeBarTextRef" v-if="!scrollable">{{ text }}</div>
				<div class="notice-bar-warp-slot" v-else><slot /></div>
			</div>
			<SvgIcon :name="rightIcon" v-if="rightIcon" class="notice-bar-warp-right-icon" @click="onRightIconClick" />
		</div>
	</div>
</template>

<script setup lang="ts" name="noticeBar">
import { reactive, ref, onMounted, nextTick } from 'vue';

// define props passed from parent
const props = defineProps({
	// notice bar mode: closeable or link
	mode: {
		type: String,
		default: () => '',
	},
	// notice text content
	text: {
		type: String,
		default: () => '',
	},
	// notice text color
	color: {
		type: String,
		default: () => 'var(--el-color-warning)',
	},
	// notice background color
	background: {
		type: String,
		default: () => 'var(--el-color-warning-light-9)',
	},
	// font size in px
	size: {
		type: [Number, String],
		default: () => 14,
	},
	// notice bar height in px
	height: {
		type: Number,
		default: () => 40,
	},
	// animation delay (s)
	delay: {
		type: Number,
		default: () => 1,
	},
	// scroll speed (px/s)
	speed: {
		type: Number,
		default: () => 100,
	},
	// enable vertical scroll
	scrollable: {
		type: Boolean,
		default: () => false,
	},
	// custom left icon
	leftIcon: {
		type: String,
		default: () => '',
	},
	// custom right icon
	rightIcon: {
		type: String,
		default: () => '',
	},
});

// define emits
const emit = defineEmits(['close', 'link']);

// define variables
const noticeBarWarpRef = ref();
const noticeBarTextRef = ref();
const state = reactive({
	order: 1,
	oneTime: 0,
	twoTime: 0,
	warpOWidth: 0,
	textOWidth: 0,
	isMode: false,
});

// init animation params
const initAnimation = () => {
	nextTick(() => {
		state.warpOWidth = noticeBarWarpRef.value.offsetWidth;
		state.textOWidth = noticeBarTextRef.value.offsetWidth;
		document.styleSheets[0].insertRule(`@keyframes oneAnimation {0% {left: 0px;} 100% {left: -${state.textOWidth}px;}}`);
		document.styleSheets[0].insertRule(`@keyframes twoAnimation {0% {left: ${state.warpOWidth}px;} 100% {left: -${state.textOWidth}px;}}`);
		computeAnimationTime();
		setTimeout(() => {
			changeAnimation();
		}, props.delay * 1000);
	});
};
// calc animation scroll duration
const computeAnimationTime = () => {
	state.oneTime = state.textOWidth / props.speed;
	state.twoTime = (state.textOWidth + state.warpOWidth) / props.speed;
};
// trigger animation
const changeAnimation = () => {
	if (state.order === 1) {
		noticeBarTextRef.value.style.cssText = `animation: oneAnimation ${state.oneTime}s linear; opactity: 1;}`;
		state.order = 2;
	} else {
		noticeBarTextRef.value.style.cssText = `animation: twoAnimation ${state.twoTime}s linear infinite; opacity: 1;`;
	}
};
// watch animation end
const listenerAnimationend = () => {
	noticeBarTextRef.value.addEventListener(
		'animationend',
		() => {
			changeAnimation();
		},
		false
	);
};
// right icon clicked
const onRightIconClick = () => {
	if (!props.mode) return false;
	if (props.mode === 'closeable') {
		state.isMode = true;
		emit('close');
	} else if (props.mode === 'link') {
		emit('link');
	}
};
// on mount
onMounted(() => {
	if (props.scrollable) return false;
	initAnimation();
	listenerAnimationend();
});
</script>

<style scoped lang="scss">
.notice-bar {
	padding: 0 15px;
	width: 100%;
	border-radius: 4px;
	.notice-bar-warp {
		display: flex;
		align-items: center;
		width: 100%;
		height: inherit;
		.notice-bar-warp-text-box {
			flex: 1;
			height: inherit;
			display: flex;
			align-items: center;
			overflow: hidden;
			position: relative;
			.notice-bar-warp-text {
				white-space: nowrap;
				position: absolute;
				left: 0;
			}
			.notice-bar-warp-slot {
				width: 100%;
				white-space: nowrap;
				:deep(.el-carousel__item) {
					display: flex;
					align-items: center;
				}
			}
		}
		.notice-bar-warp-left-icon {
			width: 24px;
			font-size: inherit !important;
		}
		.notice-bar-warp-right-icon {
			width: 24px;
			text-align: right;
			font-size: inherit !important;
			&:hover {
				cursor: pointer;
			}
		}
	}
}
</style>
