<template>
	<slot />
</template>

<script setup lang="ts">
/**
 * EditionLockedPage — 历史 EE 页面锁组件。
 *
 * 单一全功能版本后功能不做门禁，始终渲染页面内容；
 * 组件与 props 保留仅为兼容既有调用（feature/label/highlights 不再生效）。
 */
defineProps<{
	feature?: string | string[];
	label?: string;
	highlights?: string[];
}>();
</script>
