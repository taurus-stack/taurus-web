<template>
	<fs-crud ref="crudRef"  v-bind="crudBinding"> </fs-crud>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useFs } from '@fast-crud/fast-crud';
import { createCrudOptions } from './crud';
import { MenuTreeItemType } from '../../types';

// currently selected menu info
let selectOptions: any = ref({ name: null });

const { crudRef, crudBinding, crudExpose, context } = useFs({ createCrudOptions, context: { selectOptions } });
const { doRefresh, setTableData } = crudExpose;

const handleRefreshTable = (record: MenuTreeItemType) => {
	if (!record.is_catalog && record.id) {
		selectOptions.value = record;
		doRefresh();
	} else {
		// clear table data
		setTableData([]);
	}
};

defineExpose({ selectOptions, handleRefreshTable });
</script>
