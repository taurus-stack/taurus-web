<template>
	<fs-page>
		<fs-crud ref="crudRef" v-bind="crudBinding">
			<template #cell_url="scope">
				<el-tag size="small">{{ scope.row.url }}</el-tag>
			</template>
		</fs-crud>

		<permission ref="rolePermission"></permission>

		<PermissionComNew v-model:drawerVisible="drawerVisible" :roleId="roleId" :roleName="roleName" @drawerClose="handleDrawerClose" />

		<!-- Permission code dialog -->
		<PermissionCodeDialog
			v-model="permCodeDialogVisible"
			:role-id="currentRoleId"
			:role-name="currentRoleName"
			@saved="handlePermCodeSaved"
		/>
	</fs-page>
</template>

<script lang="ts" setup name="role">
import {ref, onMounted, inject, onBeforeUpdate} from 'vue';

import { GetPermission } from './api';
import { useExpose, useCrud } from '@fast-crud/fast-crud';
import { createCrudOptions } from './crud';
import PermissionComNew from './components/PermissionComNew/index.vue';
import PermissionCodeDialog from './components/PermissionCodeDialog.vue';
import _ from "lodash-es";
import {handleColumnPermission} from "/@/utils/columnPermission";
let drawerVisible = ref(false);
let roleId = ref(null);
let roleName = ref(null);

// permission code dialog
const permCodeDialogVisible = ref(false);
const currentRoleId = ref<number | null>(null);
const currentRoleName = ref('');

const rolePermission = ref();
// crud component ref
const crudRef = ref();
// crud config ref
const crudBinding = ref();


const handleDrawerOpen = (row: any) => {
	roleId.value = row.id;
	roleName.value = row.name;
	drawerVisible.value = true;
};

const handleDrawerClose = () => {
	drawerVisible.value = false;
};

// open permission code dialog
const handlePermCodeOpen = (row: any) => {
	currentRoleId.value = row.id;
	currentRoleName.value = row.name;
	permCodeDialogVisible.value = true;
};

// permission code saved
const handlePermCodeSaved = () => {
	// can refresh list or show success toast here
};

const { crudExpose } = useExpose({ crudRef, crudBinding });

// your crud config
const { crudOptions } = createCrudOptions({ crudExpose, rolePermission, handleDrawerOpen, handlePermCodeOpen });

// init crud config
const { resetCrudOptions } = useCrud({
  crudExpose,
  crudOptions,
  context: {},
});

// fetch list on page open
onMounted( async () => {

  const newOptions = await handleColumnPermission(GetPermission,crudOptions)


  //reset crudBinding
  //resetCrudOptions(newOptions);
	crudExpose.doRefresh();
});

defineExpose(rolePermission);
</script>
