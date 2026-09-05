<template>
	<EditionLockedPage feature="PROGRAM_INSTALL_TEMPLATE" label="企业程序安装模板">
	<fs-page>
		<fs-crud ref="crudRef" v-bind="crudBinding">
			<template #actionbar-right>
				<apply-to-hosts ref="applyToHostsRef" v-bind="applyToHostsProps"></apply-to-hosts>
			</template>
		</fs-crud>
	</fs-page>
	</EditionLockedPage>
</template>

<script lang="ts" setup name="programInstallTemplate">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useFs } from '@fast-crud/fast-crud';
import EditionLockedPage from '/@/components/EditionLockedPage.vue';
import { createCrudOptions } from './crud';
import ApplyToHosts from './components/ApplyToHosts.vue';
import { ElMessage } from 'element-plus';
import { i18n } from '/@/i18n';
import { useEditionStore } from '/@/editions/index';

// @ts-ignore — vue-i18n type inference chain too deep, runtime is fine
const t = i18n.global.t;

const { crudBinding, crudExpose, crudRef, resetCrudOptions } = useFs({ createCrudOptions });

const applyToHostsProps = computed(() => ({
	crudExpose,
}));

const applyToHostsRef = ref<InstanceType<typeof ApplyToHosts> | null>(null);

const handleApplyToHostsOpen = async (event: any) => {
	if (applyToHostsRef.value) {
		// Get template data passed via event
		const template = event.detail?.template;
		applyToHostsRef.value.open(template);
	} else {
		ElMessage.error(t('message.pages.programInstallTemplate.messages.componentNotLoaded'));
	}
};

onMounted(() => {
	const store = useEditionStore();
	if (store.hasFeature('PROGRAM_INSTALL_TEMPLATE')) {
		crudExpose.doRefresh();
	}
	window.addEventListener('apply-to-hosts-open', handleApplyToHostsOpen);
});

onBeforeUnmount(() => {
	window.removeEventListener('apply-to-hosts-open', handleApplyToHostsOpen);
});
</script>