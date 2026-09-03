<template>
	<fs-page>
		<el-row class="menu-el-row">
			<el-col :span="6">
				<div class="menu-box menu-left-box">
					<MenuTreeCom
					ref="menuTreeRef"
					:treeData="menuTreeData"
					@treeClick="handleTreeClick"
					@updateDept="handleUpdateMenu"
					@deleteDept="handleDeleteMenu"
					@sortDone="handleSortDone"
				/>
				</div>
			</el-col>

			<el-col :span="18">
        <el-tabs type="border-card">
          <el-tab-pane :label="t('message.pages.menu.dialog.buttonPermission')" >
            <div style="height: 80vh">
              <MenuButtonCom ref="menuButtonRef" />
            </div>
          </el-tab-pane>
          <el-tab-pane :label="t('message.pages.menu.dialog.columnPermissionTab')">
            <div style="height: 80vh">
              <MenuFieldCom ref="menuFieldRef"></MenuFieldCom>
            </div>
          </el-tab-pane>
        </el-tabs>

			</el-col>
		</el-row>

		<el-drawer v-model="drawerVisible" :title="t('message.pages.menu.dialog.menuConfig')" direction="rtl" size="500px" :close-on-click-modal="false" :before-close="handleDrawerClose">
			<MenuFormCom
				v-if="drawerVisible"
				:initFormData="drawerFormData"
				:cacheData="menuTreeCacheData"
				:treeData="menuTreeData"
				@drawerClose="handleDrawerClose"
			/>
		</el-drawer>
	</fs-page>
</template>

<script lang="ts" setup name="menuPages">
import { ref, onMounted, nextTick } from 'vue';
import XEUtils from 'xe-utils';
import { ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import MenuTreeCom from './components/MenuTreeCom/index.vue';
import MenuButtonCom from './components/MenuButtonCom/index.vue';
import MenuFormCom from './components/MenuFormCom/index.vue';
import MenuFieldCom from './components/MenuFieldCom/index.vue';
import { GetList, DelObj } from './api';
import { successNotification } from '/@/utils/message';
import { APIResponseData, MenuTreeItemType } from './types';

const { t } = useI18n();

let menuTreeData = ref([]);
let menuTreeCacheData = ref<MenuTreeItemType[]>([]);
let drawerVisible = ref(false);
let drawerFormData = ref<Partial<MenuTreeItemType>>({});
let menuTreeRef = ref<InstanceType<typeof MenuTreeCom> | null>(null);
let menuButtonRef = ref<InstanceType<typeof MenuButtonCom> | null>(null);
let menuFieldRef = ref<InstanceType<typeof MenuFieldCom> | null>(null);
const treeSelectMenu = ref<Partial<MenuTreeItemType>>({});
const getData = () => {
	GetList({}).then((ret: APIResponseData) => {
		const responseData = ret.data;
		const validIds = new Set(responseData.map((i: any) => i.id));
		const validData = responseData.filter((i: any) => !i.parent || validIds.has(i.parent));
		const result = XEUtils.toArrayTree(validData, {
			parentKey: 'parent',
			children: 'children',
			strict: true,
		});
		menuTreeData.value = result;
	});
};

/**
 * Menu click
 */
const handleTreeClick = (record: MenuTreeItemType) => {
	treeSelectMenu.value = record;
	menuButtonRef.value?.handleRefreshTable(record);
  menuFieldRef.value?.handleRefreshTable(record)
};

/**
 * Dept add/edit
 */
const handleUpdateMenu = (type: string, record?: MenuTreeItemType) => {
	if (type === 'update' && record) {
		const parentData = menuTreeRef.value?.treeRef?.currentNode.parent.data || {};
		menuTreeCacheData.value = [parentData];
		drawerFormData.value = record;
	}
	drawerVisible.value = true;
};
const handleDrawerClose = (type?: string) => {
	if (type === 'submit') {
		getData();
	}
	drawerVisible.value = false;
	drawerFormData.value = {};
};

/**
 * Sort complete event, refresh menu tree
 *  Approach: getData() fully refetches sorted root-level list from backend, ensuring display order strictly matches DB.
 *  Since el-tree uses lazy + handleTreeLoad, children are lazy-loaded by handleTreeLoad (backend already sorted),
 *  so refreshing root + restoring expand state keeps correct visual order overall.
 */
const handleSortDone = async ({ parentNode, isRoot }: any) => {
	const childSelectMenu = menuTreeRef.value?.treeSelectMenu;
	const selectedId = (childSelectMenu?.value?.id) ?? (treeSelectMenu.value?.id);
	const expandedIds: Array<any> = [];
	const store = menuTreeRef.value?.treeRef?.store;
	if (store) {
		const walkMap = (nodesMap: Record<string, any>) => {
			Object.values(nodesMap).forEach((n: any) => {
				if (n.expanded && n.data?.id != null) expandedIds.push(n.data.id);
				if (n.childNodes?.length) walkNodes(n.childNodes);
			});
		};
		const walkNodes = (nodes: Array<any>) => {
			nodes.forEach((n: any) => {
				if (n.expanded && n.data?.id != null) expandedIds.push(n.data.id);
				if (n.childNodes?.length) walkNodes(n.childNodes);
			});
		};
		walkMap(store.nodesMap || {});
	}

	await getData();
	await nextTick();

	const tree = menuTreeRef.value?.treeRef;
	if (tree) {
		expandedIds.forEach((id) => {
			try {
				const node = (tree as any).getNode?.(id);
				if (node) {
					node.loaded = true;
					node.expanded = true;
				}
			} catch {}
		});
		if (selectedId != null) {
			try { tree.setCurrentKey(selectedId); } catch {}
			const cur = (tree as any).getCurrentNode?.();
			if (cur) treeSelectMenu.value = cur;
		}
	}
};

/**
 * dept delete
 */
const handleDeleteMenu = (id: string, callback: Function) => {
	ElMessageBox.confirm(t('message.pages.menu.dialog.deleteMenuConfirm'), t('message.pages.menu.messages.tipsTitle'), {
		confirmButtonText: t('message.pages.menu.buttons.confirm'),
		cancelButtonText: t('message.pages.menu.buttons.cancel'),
		type: 'warning',
	}).then(async () => {
		const res: APIResponseData = await DelObj(id);
		callback();
		if (res?.code === 2000) {
			successNotification(res.msg as string);
			getData();
		}
	});
};

onMounted(() => {
	getData();
});
</script>

<style lang="scss" scoped>
.menu-el-row {
	height: 100%;
	overflow: hidden;

	.el-col {
		height: 100%;
		padding: 10px 0;
		box-sizing: border-box;
	}
}

.menu-box {
	height: 100%;
	padding: 10px;
	background-color: #fff;
	box-sizing: border-box;
}

.menu-left-box {
	position: relative;
	border-radius: 0 8px 8px 0;
	margin-right: 10px;
}

.menu-right-box {
	border-radius: 8px 0 0 8px;
}
</style>