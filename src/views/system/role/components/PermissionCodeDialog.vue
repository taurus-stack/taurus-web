<template>
    <el-dialog
        v-model="dialogVisible"
        :title="t('message.pages.role.dialog.assignPermissionCodes')"
        width="800px"
        :close-on-click-modal="false"
        @close="handleClose"
    >
        <div class="permission-code-dialog">
            <el-alert
                :title="t('message.pages.role.dialog.permissionCodeDescription')"
                :description="t('message.pages.role.dialog.assignPermissionCodesTip')"
                type="info"
                :closable="false"
                style="margin-bottom: 20px"
            />

            <div v-loading="loading" class="permission-content">
                <div v-if="permissionData.length === 0" class="empty-data">
                    <el-empty :description="t('message.pages.role.dialog.noPermissionCodeData')" />
                </div>

                <div v-else class="module-list">
                    <div v-for="moduleItem in permissionData" :key="moduleItem.module" class="module-item">
                        <div class="module-header">
                            <el-checkbox
                                :model-value="isModuleAllChecked(moduleItem)"
                                :indeterminate="isModuleIndeterminate(moduleItem)"
                                @change="handleModuleCheck($event, moduleItem)"
                            >
                                <span class="module-name">{{ moduleItem.module }}</span>
                                <el-tag size="small" type="info">
                                    {{ moduleItem.permissions.filter(p => p.isCheck).length }}/{{ moduleItem.permissions.length }}
                                </el-tag>
                            </el-checkbox>
                        </div>

                        <div class="permission-list">
                            <el-checkbox
                                v-for="perm in moduleItem.permissions"
                                :key="perm.code"
                                v-model="perm.isCheck"
                                class="permission-item"
                            >
                                <div class="permission-info">
                                    <span class="permission-code">{{ perm.code }}</span>
                                    <span class="permission-name">{{ perm.name }}</span>
                                    <span v-if="perm.description" class="permission-desc">{{ perm.description }}</span>
                                </div>
                            </el-checkbox>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <el-button @click="dialogVisible = false">{{ t('message.pages.role.buttons.cancel') }}</el-button>
            <el-button type="primary" @click="handleSave" :loading="saveLoading">
                {{ t('message.pages.role.buttons.save') }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getRolePermissionCodes, setRolePermissionCodes } from '/@/api/permission';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

interface Permission {
    id: number;
    code: string;
    name: string;
    module: string;
    description: string;
    isCheck: boolean;
}

interface ModulePermissions {
    module: string;
    permissions: Permission[];
}

const props = defineProps<{
    modelValue: boolean;
    roleId: number | null;
    roleName: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    'saved': [];
}>();

const dialogVisible = ref(false);
const loading = ref(false);
const saveLoading = ref(false);
const permissionData = ref<ModulePermissions[]>([]);

// watch dialog visibility state
watch(() => props.modelValue, (val) => {
    dialogVisible.value = val;
    if (val && props.roleId) {
        loadPermissions();
    }
});

watch(dialogVisible, (val) => {
    emit('update:modelValue', val);
});

// load permission code data
const loadPermissions = async () => {
    if (!props.roleId) return;

    loading.value = true;
    try {
        const res = await getRolePermissionCodes(props.roleId);
        permissionData.value = res.data || [];
    } catch (error) {
        console.error(t('message.pages.role.messages.loadPermissionCodesFailed'), error);
        ElMessage.error(t('message.pages.role.messages.loadPermissionCodesFailed'));
    } finally {
        loading.value = false;
    }
};

// check module fully selected
const isModuleAllChecked = (moduleItem: ModulePermissions) => {
    return moduleItem.permissions.length > 0 && moduleItem.permissions.every(p => p.isCheck);
};

// check module partially selected
const isModuleIndeterminate = (moduleItem: ModulePermissions) => {
    const checkedCount = moduleItem.permissions.filter(p => p.isCheck).length;
    return checkedCount > 0 && checkedCount < moduleItem.permissions.length;
};

// module select/deselect all
const handleModuleCheck = (checked: boolean | string | number, moduleItem: ModulePermissions) => {
    moduleItem.permissions.forEach(p => {
        p.isCheck = !!checked;
    });
};

// save permissions
const handleSave = async () => {
    if (!props.roleId) return;

    const selectedCodes: string[] = [];
    permissionData.value.forEach(moduleItem => {
        moduleItem.permissions.forEach(perm => {
            if (perm.isCheck) {
                selectedCodes.push(perm.code);
            }
        });
    });

    saveLoading.value = true;
    try {
        await setRolePermissionCodes(props.roleId, selectedCodes);
        ElMessage.success(t('message.pages.role.messages.assignPermissionSuccess'));
        dialogVisible.value = false;
        emit('saved');
    } catch (error) {
        console.error(t('message.pages.role.messages.savePermissionFailed'), error);
        ElMessage.error(t('message.pages.role.messages.savePermissionFailed'));
    } finally {
        saveLoading.value = false;
    }
};

// close dialog
const handleClose = () => {
    dialogVisible.value = false;
    permissionData.value = [];
};
</script>

<style lang="scss" scoped>
.permission-code-dialog {
    .permission-content {
        max-height: 500px;
        overflow-y: auto;
    }

    .empty-data {
        padding: 40px 0;
    }

    .module-list {
        .module-item {
            margin-bottom: 20px;
            border: 1px solid var(--el-border-color-light);
            border-radius: 4px;
            overflow: hidden;

            .module-header {
                padding: 12px 16px;
                background-color: var(--el-fill-color-light);
                border-bottom: 1px solid var(--el-border-color-light);

                .module-name {
                    font-weight: 600;
                    margin-right: 8px;
                }
            }

            .permission-list {
                padding: 12px 16px;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;

                .permission-item {
                    width: calc(50% - 4px);
                    margin-right: 0;

                    .permission-info {
                        display: flex;
                        flex-direction: column;
                        gap: 2px;

                        .permission-code {
                            font-family: monospace;
                            font-size: 12px;
                            color: var(--el-color-primary);
                        }

                        .permission-name {
                            font-size: 14px;
                        }

                        .permission-desc {
                            font-size: 12px;
                            color: var(--el-text-color-secondary);
                        }
                    }
                }
            }
        }
    }
}
</style>
