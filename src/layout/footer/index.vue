<template>
	<div class="layout-footer pb5 pt2">
		<div class="layout-footer-warp">
			<div>❤️ Powered by Taurus Copyright © 2026 ❤️</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="layoutFooter">
// needs content for keep-alive to work
</script>

<style scoped lang="scss">
.layout-footer {
	width: 100%;
	display: flex;
	&-warp {
		margin: auto;
		color: var(--el-text-color-secondary);
		text-align: center;
		animation: error-num 0.3s ease;
	}
}
</style>
