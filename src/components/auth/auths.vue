<template>
	<slot v-if="getUserAuthBtnList" />
</template>

<script setup lang="ts" name="auths">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserInfo } from '/@/stores/userInfo';

// define props passed from parent
const props = defineProps({
	value: {
		type: Array,
		default: () => [],
	},
});

// define variables
const stores = useUserInfo();
const { userInfos } = storeToRefs(stores);

// get user permissions from pinia
const getUserAuthBtnList = computed(() => {
	let flag = false;
	userInfos.value.authBtnList.map((val: string) => {
		props.value.map((v) => {
			if (val === v) flag = true;
		});
	});
	return flag;
});
</script>
