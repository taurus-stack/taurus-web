<template>
    <div class="permission-code-container">
        <!-- search area -->
        <el-form :inline="true" :model="searchForm" class="search-form">
            <el-form-item :label="t('message.importExcel.permissionCode')">
                <el-input v-model="searchForm.code" :placeholder="t('message.importExcel.pleaseInputPermissionCode')" clearable />
            </el-form-item>
            <el-form-item :label="t('message.importExcel.module')">
                <el-select v-model="searchForm.module" :placeholder="t('message.importExcel.pleaseSelectModule')" clearable>
                    <el-option v-for="item in moduleList" :key="item" :label="item" :value="item" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('message.colStatus')">
                <el-select v-model="searchForm.status" :placeholder="t('message.importExcel.pleaseSelectStatus')" clearable>
                    <el-option :label="t('message.enabled')" :value="true" />
                    <el-option :label="t('message.disabled')" :value="false" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleSearch">
                    <el-icon><Search /></el-icon>{{ t('message.search') }}</el-button>
                <el-button @click="handleReset">
                    <el-icon><Refresh /></el-icon>{{ t('message.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <!-- action buttons -->
        <div class="toolbar">
            <el-button type="primary" @click="handleAdd">
                <el-icon><Plus /></el-icon>{{ t('message.addPermissionCode') }}</el-button>
        </div>

        <!-- data table -->
        <el-table :data="tableData" v-loading="loading" border stripe>
            <el-table-column prop="code" :label="t('message.importExcel.permissionCode')" min-width="200" />
            <el-table-column prop="name" :label="t('message.importExcel.permissionName')" min-width="150" />
            <el-table-column prop="module" :label="t('message.importExcel.module')" min-width="120" />
            <el-table-column prop="description" :label="t('message.global.description')" min-width="200" show-overflow-tooltip />
            <el-table-column prop="status" :label="t('message.colStatus')" width="100">
                <template #default="{ row }">
                    <el-tag :type="row.status ? 'success' : 'danger'">
                        {{ row.status ? t('message.enabled') : t('message.disabled') }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="t('message.global.operation')" width="200" fixed="right">
                <template #default="{ row }">
                    <el-button type="primary" link @click="handleEdit(row)">
                        <el-icon><Edit /></el-icon>
                        {{ t('message.global.edit') }}
                    </el-button>
                    <el-button type="danger" link @click="handleDelete(row)">
                        <el-icon><Delete /></el-icon>
                        {{ t('message.global.delete') }}
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- Pagination -->
        <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
            style="margin-top: 20px; justify-content: flex-end"
        />

        <!-- Add/Edit dialog -->
        <el-dialog
            v-model="dialogVisible"
            :title="dialogTitle"
            width="600px"
            :close-on-click-modal="false"
        >
            <el-form
                ref="formRef"
                :model="formData"
                :rules="formRules"
                label-width="100px"
            >
                <el-form-item :label="t('message.importExcel.permissionCode')" prop="code">
                    <el-input v-model="formData.code" :placeholder="t('message.exampleUserCreate')" />
                </el-form-item>
                <el-form-item :label="t('message.importExcel.permissionName')" prop="name">
                    <el-input v-model="formData.name" :placeholder="t('message.pleaseEnterPermissionName')" />
                </el-form-item>
                <el-form-item :label="t('message.importExcel.module')" prop="module">
                    <el-input v-model="formData.module" :placeholder="t('message.pleaseInputModuleName')" />
                </el-form-item>
                <el-form-item :label="t('message.global.description')" prop="description">
                    <el-input
                        v-model="formData.description"
                        type="textarea"
                        :rows="3"
                        :placeholder="t('message.pleaseInputDescription')"
                    />
                </el-form-item>
                <el-form-item :label="t('message.colStatus')" prop="status">
                    <el-switch v-model="formData.status" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">{{ t('message.global.cancel') }}</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
                    {{ t('message.confirm') }}
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import {
    getPermissionCodeList,
    createPermissionCode,
    updatePermissionCode,
    deletePermissionCode,
    getPermissionModules
} from '/@/api/permission';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// search form
const searchForm = reactive({
    code: '',
    module: '',
    status: undefined as boolean | undefined
});

// table data
const tableData = ref([]);
const loading = ref(false);
const moduleList = ref<string[]>([]);

// pagination
const pagination = reactive({
    page: 1,
    limit: 10,
    total: 0
});

// dialog
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref<FormInstance>();
const submitLoading = ref(false);
const formData = reactive({
    id: undefined as number | undefined,
    code: '',
    name: '',
    module: '',
    description: '',
    status: true
});

const formRules: FormRules = {
    code: [
        { required: true, message: t('message.pleaseEnterPermissionCode'), trigger: 'blur' },
        { pattern: /^[a-z0-9_]+:[a-z0-9_]+$/, message: t('message.formatShouldBeModuleAction'), trigger: 'blur' }
    ],
    name: [
        { required: true, message: t('message.pleaseEnterPermissionName'), trigger: 'blur' }
    ]
};

// load data
const loadData = async () => {
    loading.value = true;
    try {
        const params = {
            page: pagination.page,
            limit: pagination.limit,
            ...searchForm
        };
        const res = await getPermissionCodeList(params);
        tableData.value = res.data?.results || [];
        pagination.total = res.data?.count || 0;
    } catch (error) {
        console.error('加载数据失败:', error);
    } finally {
        loading.value = false;
    }
};

// load module list
const loadModules = async () => {
    try {
        const res = await getPermissionModules();
        moduleList.value = res.data || [];
    } catch (error) {
        console.error('加载模块列表失败:', error);
    }
};

// search
const handleSearch = () => {
    pagination.page = 1;
    loadData();
};

// reset
const handleReset = () => {
    searchForm.code = '';
    searchForm.module = '';
    searchForm.status = undefined;
    handleSearch();
};

// page size change
const handleSizeChange = (val: number) => {
    pagination.limit = val;
    loadData();
};

// page number change
const handlePageChange = (val: number) => {
    pagination.page = val;
    loadData();
};

// add
const handleAdd = () => {
    dialogTitle.value = t('message.addPermissionCode');
    formData.id = undefined;
    formData.code = '';
    formData.name = '';
    formData.module = '';
    formData.description = '';
    formData.status = true;
    dialogVisible.value = true;
    formRef.value?.resetFields();
};

// edit
const handleEdit = (row: any) => {
    dialogTitle.value = t('message.editPermissionCode');
    formData.id = row.id;
    formData.code = row.code;
    formData.name = row.name;
    formData.module = row.module;
    formData.description = row.description;
    formData.status = row.status;
    dialogVisible.value = true;
};

// submit
const handleSubmit = async () => {
    if (!formRef.value) return;
    
    await formRef.value.validate(async (valid) => {
        if (!valid) return;
        
        submitLoading.value = true;
        try {
            if (formData.id) {
                await updatePermissionCode(formData.id, formData);
                ElMessage.success(t('message.updateSuccess'));
            } else {
                await createPermissionCode(formData);
                ElMessage.success(t('message.createSuccess'));
            }
            dialogVisible.value = false;
            loadData();
            loadModules();
        } catch (error) {
            console.error('提交失败:', error);
        } finally {
            submitLoading.value = false;
        }
    });
};

// delete
const handleDelete = (row: any) => {
    ElMessageBox.confirm(
        t('message.confirmDeletePermissionCode', { code: row.code }),
        t('message.warning'),
        {
            confirmButtonText: t('message.user.logOutConfirm'),
            cancelButtonText: t('message.global.cancel'),
            type: 'warning'
        }
    ).then(async () => {
        try {
            await deletePermissionCode(row.id);
            ElMessage.success(t('message.deleteOk'));
            loadData();
        } catch (error) {
            console.error('删除失败:', error);
        }
    }).catch(() => {});
};

onMounted(() => {
    loadData();
    loadModules();
});
</script>

<style lang="scss" scoped>
.permission-code-container {
    padding: 20px;

    .search-form {
        margin-bottom: 20px;
    }

    .toolbar {
        margin-bottom: 20px;
    }
}
</style>
