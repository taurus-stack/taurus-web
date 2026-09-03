<template>
	<el-drawer size="70%" v-model="drawer" direction="rtl" destroy-on-close :before-close="handleClose">
    <fs-crud ref="crudRef" v-bind="crudBinding"> </fs-crud>
	</el-drawer>
</template>

<script lang="ts" setup>
import { ref, onMounted, defineAsyncComponent } from 'vue';
import { useFs } from '@fast-crud/fast-crud';
import { createCrudOptions } from './crud';
import { useExpose, useCrud } from '@fast-crud/fast-crud';
import { ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

//drawer visible
const drawer = ref(false);

//drawer close confirm
const handleClose = (done: () => void) => {
	ElMessageBox.confirm(t('message.pages.dictionary.dialog.closeConfirm'), {
		confirmButtonText: t('message.pages.dictionary.buttons.confirm'),
		cancelButtonText: t('message.pages.dictionary.buttons.cancel'),
		type: 'warning',
	})
		.then(() => {
			done();
		})
		.catch(() => {
			// catch error
		});
};

const { crudBinding, crudRef, crudExpose } = useFs({ createCrudOptions, context: {} });
const { setSearchFormData, doRefresh } = crudExpose;

defineExpose({ drawer, setSearchFormData, doRefresh });
// fetch list on page open
onMounted(() => {
	crudExpose.doRefresh();
});
</script>
