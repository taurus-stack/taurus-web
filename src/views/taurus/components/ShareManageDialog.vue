<script setup lang="ts" name="share-manage-dialog">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Share,
  Link,
  User,
  UserFilled,
  OfficeBuilding,
  Plus,
  Edit,
  Delete,
  Refresh,
  CopyDocument,
  Clock,
  View,
  Download,
  Warning,
  CircleCheck,
  Close,
  Search,
} from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import UserSearch from '/@/components/UserSearch/index.vue';
import {
  type SharePermDef,
  type PermDefGroup,
  type SharePermissionItem,
  type ShareLinkItem,
  type ShareBatchCreateBody,
  type SubjectInput,
  getSharePermDefGrouped,
  listScriptShares,
  batchCreateScriptShares,
  updateScriptShare,
  deleteScriptShare,
  listWorkflowShares,
  batchCreateWorkflowShares,
  updateWorkflowShare,
  deleteWorkflowShare,
  listShareLink,
  createShareLink,
  revokeShareLink,
  getShareLinkAccessLogs,
  type ShareLinkAccessLogItem,
} from '/@/api/taurus/share-permission/index';
import { request } from '/@/utils/service';

const props = defineProps<{
  modelValue: boolean;
  resourceType: 'script' | 'workflow';
  resourceId: number | string | null;
  resourceName?: string;
}>();

const emit = defineEmits(['update:modelValue', 'change']);

// @ts-ignore
const { t } = useI18n();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const activeTab = ref<'direct' | 'link'>('direct');
const loading = ref(false);
const permLoading = ref(false);
const permGroups = ref<PermDefGroup[]>([]);
const allPerms = ref<SharePermDef[]>([]);

const shareList = ref<SharePermissionItem[]>([]);
const linkList = ref<ShareLinkItem[]>([]);

// ---------- Add/edit share form ----------
const shareFormVisible = ref(false);
const isEditingShare = ref(false);
const editingShareId = ref<number | string | null>(null);
const shareFormRef = ref<FormInstance>();
const shareForm = reactive({
  subject_type: 'user' as 'user' | 'role' | 'dept',
  subject_ids: [] as (number | string)[],
  subject_role_ids: [] as (number | string)[],
  subject_dept_ids: [] as (number | string)[],
  permissions: [] as string[],
  expire_time: '' as string,
  remark: '' as string,
});

const shareFormRules: FormRules = {
  subject_type: [{ required: true, message: t('message.pages.scriptLibrary.shareMsgSelectSubjectType'), trigger: 'change' }],
  permissions: [{ required: true, message: t('message.pages.scriptLibrary.shareMsgSelectOnePerm'), trigger: 'change', type: 'array' }],
};

// ---------- Role/department selection ----------
const roleList = ref<any[]>([]);
const deptTree = ref<any[]>([]);
const deptFlatList = ref<any[]>([]);
const roleLoading = ref(false);
const deptLoading = ref(false);

const deptTreeProps = {
  children: 'children',
  label: 'name',
  value: 'id',
  disabled: (data: any) => !!data.disabled,
};

const loadRoles = async (keyword = '') => {
  roleLoading.value = true;
  try {
    const res: any = await request({
      url: '/api/system/role/',
      method: 'get',
      params: { limit: 200, search: keyword },
    });
    roleList.value = res?.data?.results || res?.data || [];
  } catch (_) {
    roleList.value = [];
  } finally {
    roleLoading.value = false;
  }
};

const flattenDept = (nodes: any[]): any[] => {
  const out: any[] = [];
  nodes.forEach((n) => {
    out.push({ id: n.id, name: n.name, key: n.key });
    if (n.children?.length) out.push(...flattenDept(n.children));
  });
  return out;
};

const loadDepts = async () => {
  deptLoading.value = true;
  try {
    const res: any = await request({
      url: '/api/system/dept/tree/',
      method: 'get',
    });
    const data = res?.data || res || [];
    deptTree.value = data;
    deptFlatList.value = flattenDept(data);
  } catch (_) {
    deptTree.value = [];
    deptFlatList.value = [];
  } finally {
    deptLoading.value = false;
  }
};

// ---------- Add link form ----------
const linkFormVisible = ref(false);
const linkFormRef = ref<FormInstance>();
const linkForm = reactive({
  permissions: [] as string[],
  access_scope: 'authenticated' as 'authenticated' | 'anyone',
  expire_time: '' as string,
  max_access_count: undefined as number | undefined,
  bind_subject_type: undefined as 'user' | 'role' | 'dept' | undefined,
  bind_subject_id: '' as string,
  bind_subject_name: '' as string,
  remark: '' as string,
});

const linkFormRules: FormRules = {
  permissions: [{ required: true, message: t('message.pages.scriptLibrary.shareMsgSelectOnePerm'), trigger: 'change', type: 'array' }],
  access_scope: [{ required: true, message: t('message.pages.scriptLibrary.shareMsgSelectScope'), trigger: 'change' }],
};

// ---------- Access log ----------
const accessLogVisible = ref(false);
const currentLink = ref<ShareLinkItem | null>(null);
const accessLogList = ref<ShareLinkAccessLogItem[]>([]);
const accessLogLoading = ref(false);

// ---------- Permission presets ----------
const presetTemplates = computed(() => {
  if (!allPerms.value.length) return [];
  const perms = allPerms.value;
  const viewCodes = perms.filter((p) => p.category === 'view').map((p) => p.perm_code);
  const editCodes = perms.filter((p) => p.category === 'view' || p.category === 'edit').map((p) => p.perm_code);
  const executeCodes = perms.filter((p) => p.category === 'view' || p.category === 'edit' || p.category === 'execute').map((p) => p.perm_code);
  const manageCodes = perms.map((p) => p.perm_code);
  return [
    { key: 'view_only', name: t('message.pages.scriptLibrary.presetViewName'), desc: t('message.pages.scriptLibrary.presetViewDesc'), codes: viewCodes },
    { key: 'editor', name: t('message.pages.scriptLibrary.presetEditorName'), desc: t('message.pages.scriptLibrary.presetEditorDesc'), codes: editCodes },
    { key: 'executor', name: t('message.pages.scriptLibrary.presetExecutorName'), desc: t('message.pages.scriptLibrary.presetExecutorDesc'), codes: executeCodes },
    { key: 'manager', name: t('message.pages.scriptLibrary.presetManagerName'), desc: t('message.pages.scriptLibrary.presetManagerDesc'), codes: manageCodes },
  ];
});

const applyPreset = (codes: string[]) => {
  shareForm.permissions = [...codes];
  linkForm.permissions = [...codes];
};

// ---------- Load permission dictionary ----------
const loadPermDefs = async () => {
  permLoading.value = true;
  try {
    const res: any = await getSharePermDefGrouped({ resource_type: props.resourceType });
    permGroups.value = res?.data || [];
    allPerms.value = permGroups.value.flatMap((g) => g.perms || []);
  } catch (_) {
    permGroups.value = [];
    allPerms.value = [];
  } finally {
    permLoading.value = false;
  }
};

// ---------- Load direct share list ----------
const loadShareList = async () => {
  if (!props.resourceId) return;
  loading.value = true;
  try {
    const fn = props.resourceType === 'script' ? listScriptShares : listWorkflowShares;
    const res: any = await fn(props.resourceId, { limit: 100 });
    shareList.value = res?.data?.results || res?.data || [];
  } catch (e: any) {
    shareList.value = [];
    ElMessage.error(t('message.pages.scriptLibrary.shareMsgLoadFailed', { msg: e?.message || e }));
  } finally {
    loading.value = false;
  }
};

// ---------- Load share link list ----------
const loadLinkList = async () => {
  if (!props.resourceId) return;
  try {
    const res: any = await listShareLink({
      limit: 100,
      resource_type: props.resourceType,
      resource_id: Number(props.resourceId),
    } as any);
    linkList.value = res?.data?.results || res?.data || [];
  } catch (_) {
    linkList.value = [];
  }
};

const openShareForm = (item?: SharePermissionItem) => {
  if (item) {
    isEditingShare.value = true;
    editingShareId.value = item.id;
    shareForm.subject_type = item.subject_type;
    shareForm.subject_ids = item.subject_type === 'user' ? [Number(item.subject_id)] : [];
    shareForm.subject_role_ids = item.subject_type === 'role' ? [Number(item.subject_id)] : [];
    shareForm.subject_dept_ids = item.subject_type === 'dept' ? [Number(item.subject_id)] : [];
    shareForm.permissions = [...item.permissions];
    shareForm.expire_time = item.expire_time ? item.expire_time.slice(0, 16) : '';
    shareForm.remark = item.remark || '';
  } else {
    isEditingShare.value = false;
    editingShareId.value = null;
    shareForm.subject_type = 'user';
    shareForm.subject_ids = [];
    shareForm.subject_role_ids = [];
    shareForm.subject_dept_ids = [];
    shareForm.permissions = [];
    shareForm.expire_time = '';
    shareForm.remark = '';
  }
  shareFormVisible.value = true;
  nextTick(() => shareFormRef.value?.clearValidate());
};

const validateShareForm = async (): Promise<boolean> => {
  if (!shareFormRef.value) return false;
  try {
    await shareFormRef.value.validate();
    const hasSubjects =
      (shareForm.subject_type === 'user' && shareForm.subject_ids.length > 0) ||
      (shareForm.subject_type === 'role' && shareForm.subject_role_ids.length > 0) ||
      (shareForm.subject_type === 'dept' && shareForm.subject_dept_ids.length > 0);
    if (!hasSubjects) {
      ElMessage.warning(t('message.pages.scriptLibrary.shareMsgSelectOneSubject'));
      return false;
    }
    if (shareForm.permissions.length === 0) {
      ElMessage.warning(t('message.pages.scriptLibrary.shareMsgSelectOnePerm'));
      return false;
    }
    return true;
  } catch (_) {
    return false;
  }
};

const submitShareForm = async () => {
  if (!(await validateShareForm()) || !props.resourceId) return;
  const subjects: SubjectInput[] = [];
  const collectSubjects = (type: 'user' | 'role' | 'dept', ids: (number | string)[], nameCache: Record<string, string>) => {
    ids.forEach((id) => {
      subjects.push({
        subject_type: type,
        subject_id: String(id),
        subject_name: nameCache[String(id)] || '',
      });
    });
  };
  if (shareForm.subject_type === 'user') {
    const nameCache: Record<string, string> = {};
    shareForm.subject_ids.forEach((id) => {
      const found = (window as any).__userSearchCache?.find((u: any) => u.id === id);
      nameCache[String(id)] = found ? found.username + (found.name ? `(${found.name})` : '') : '';
    });
    collectSubjects('user', shareForm.subject_ids, nameCache);
  } else if (shareForm.subject_type === 'role') {
    const nameCache: Record<string, string> = {};
    shareForm.subject_role_ids.forEach((id) => {
      const r = roleList.value.find((x) => x.id === id);
      nameCache[String(id)] = r?.name || '';
    });
    collectSubjects('role', shareForm.subject_role_ids, nameCache);
  } else {
    const nameCache: Record<string, string> = {};
    shareForm.subject_dept_ids.forEach((id) => {
      const d = deptFlatList.value.find((x) => x.id === id);
      nameCache[String(id)] = d?.name || '';
    });
    collectSubjects('dept', shareForm.subject_dept_ids, nameCache);
  }

  const body: ShareBatchCreateBody = {
    subjects,
    permissions: shareForm.permissions,
    expire_time: shareForm.expire_time || undefined,
    remark: shareForm.remark || undefined,
  };

  try {
    loading.value = true;
    if (isEditingShare.value && editingShareId.value) {
      const updateFn = props.resourceType === 'script' ? updateScriptShare : updateWorkflowShare;
      const updateData: Partial<SharePermissionItem> = {
        permissions: shareForm.permissions,
        expire_time: shareForm.expire_time || undefined,
        remark: shareForm.remark || undefined,
      };
      await updateFn(props.resourceId, editingShareId.value, updateData);
      ElMessage.success(t('message.pages.scriptLibrary.shareMsgUpdateSuccess'));
    } else {
      const createFn = props.resourceType === 'script' ? batchCreateScriptShares : batchCreateWorkflowShares;
      await createFn(props.resourceId, body);
      ElMessage.success(t('message.pages.scriptLibrary.shareMsgCreateSuccess'));
    }
    shareFormVisible.value = false;
    await loadShareList();
    emit('change');
  } catch (e: any) {
    ElMessage.error(t('message.pages.scriptLibrary.shareMsgOpFailed', { msg: e?.message || e }));
  } finally {
    loading.value = false;
  }
};

const removeShare = async (item: SharePermissionItem) => {
  if (!props.resourceId) return;
  try {
    await ElMessageBox.confirm(t('message.pages.scriptLibrary.shareMsgConfirmRemoveMsg', { name: item.subject_name_cache }), t('message.pages.scriptLibrary.shareMsgConfirmRemoveTitle'), {
      type: 'warning',
    });
    const delFn = props.resourceType === 'script' ? deleteScriptShare : deleteWorkflowShare;
    await delFn(props.resourceId, item.id);
    ElMessage.success(t('message.pages.scriptLibrary.shareMsgRemoveSuccess'));
    await loadShareList();
    emit('change');
  } catch (_) {
    /* cancel */
  }
};

// ---------- Link management ----------
const linkSubjectUserIds = ref<(number | string)[]>([]);
const linkSubjectRoleId = ref<number | string | undefined>(undefined);
const linkSubjectDeptId = ref<number | string | undefined>(undefined);

const syncLinkSubjectFromType = () => {
  const t = linkForm.bind_subject_type;
  linkSubjectUserIds.value = t === 'user' && linkForm.bind_subject_id ? [linkForm.bind_subject_id] : [];
  linkSubjectRoleId.value = t === 'role' && linkForm.bind_subject_id ? linkForm.bind_subject_id : undefined;
  linkSubjectDeptId.value = t === 'dept' && linkForm.bind_subject_id ? linkForm.bind_subject_id : undefined;
};

const openLinkForm = () => {
  linkForm.permissions = [];
  linkForm.access_scope = 'authenticated';
  linkForm.expire_time = '';
  linkForm.max_access_count = undefined;
  linkForm.bind_subject_type = undefined;
  linkForm.bind_subject_id = '';
  linkForm.bind_subject_name = '';
  linkForm.remark = '';
  linkSubjectUserIds.value = [];
  linkSubjectRoleId.value = undefined;
  linkSubjectDeptId.value = undefined;
  linkFormVisible.value = true;
  nextTick(() => linkFormRef.value?.clearValidate());
};

watch(() => linkForm.bind_subject_type, syncLinkSubjectFromType);

watch(linkSubjectUserIds, (ids) => {
  if (linkForm.bind_subject_type === 'user') {
    const id = ids?.[0];
    linkForm.bind_subject_id = id ? String(id) : '';
    if (id) {
      const found = (window as any).__userSearchCache?.find((u: any) => u.id === id);
      linkForm.bind_subject_name = found ? found.username + (found.name ? `(${found.name})` : '') : '';
    } else {
      linkForm.bind_subject_name = '';
    }
  }
}, { deep: true });

watch(linkSubjectRoleId, (id) => {
  if (linkForm.bind_subject_type === 'role') {
    linkForm.bind_subject_id = id ? String(id) : '';
    if (id) {
      const r = roleList.value.find((x) => String(x.id) === String(id));
      linkForm.bind_subject_name = r?.name || '';
    } else {
      linkForm.bind_subject_name = '';
    }
  }
});

watch(linkSubjectDeptId, (id) => {
  if (linkForm.bind_subject_type === 'dept') {
    linkForm.bind_subject_id = id ? String(id) : '';
    if (id) {
      const d = deptFlatList.value.find((x) => String(x.id) === String(id));
      linkForm.bind_subject_name = d?.name || '';
    } else {
      linkForm.bind_subject_name = '';
    }
  }
});

const submitLinkForm = async () => {
  if (!linkFormRef.value || !props.resourceId) return;
  try {
    await linkFormRef.value.validate();
  } catch (_) {
    return;
  }
  if (linkForm.permissions.length === 0) {
    ElMessage.warning(t('message.pages.scriptLibrary.shareMsgSelectOnePerm'));
    return;
  }
  try {
    loading.value = true;
    const payload: Partial<ShareLinkItem> = {
      resource_type: props.resourceType,
      resource_id: Number(props.resourceId),
      permissions: linkForm.permissions,
      access_scope: linkForm.access_scope,
      expire_time: linkForm.expire_time || undefined,
      max_access_count: linkForm.max_access_count || undefined,
      remark: linkForm.remark || undefined,
    };
    if (linkForm.bind_subject_type && linkForm.bind_subject_id) {
      payload.bind_subject_type = linkForm.bind_subject_type;
      payload.bind_subject_id = linkForm.bind_subject_id;
      (payload as any).bind_subject_name_cache = linkForm.bind_subject_name;
    }
    await createShareLink(payload);
    ElMessage.success(t('message.pages.scriptLibrary.shareMsgLinkCreateSuccess'));
    linkFormVisible.value = false;
    await loadLinkList();
    emit('change');
  } catch (e: any) {
    ElMessage.error(t('message.pages.scriptLibrary.shareMsgCreateFailed', { msg: e?.message || e }));
  } finally {
    loading.value = false;
  }
};

const copyShareLink = async (link: ShareLinkItem) => {
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/#/share/activate/${link.share_token}`;
  try {
    await navigator.clipboard.writeText(shareUrl);
    ElMessage.success(t('message.pages.scriptLibrary.shareMsgCopyClipboard'));
  } catch (_) {
    const ta = document.createElement('textarea');
    ta.value = shareUrl;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    ElMessage.success(t('message.pages.scriptLibrary.shareMsgCopied'));
  }
};

const doRevokeLink = async (link: ShareLinkItem) => {
  try {
    await ElMessageBox.confirm(t('message.pages.scriptLibrary.shareMsgConfirmRevokeMsg'), t('message.pages.scriptLibrary.shareMsgConfirmRevokeTitle'), { type: 'warning' });
    await revokeShareLink(link.id);
    ElMessage.success(t('message.pages.scriptLibrary.shareMsgRevokeSuccess'));
    await loadLinkList();
    emit('change');
  } catch (_) {
    /* cancel */
  }
};

const openAccessLogs = async (link: ShareLinkItem) => {
  currentLink.value = link;
  accessLogVisible.value = true;
  accessLogLoading.value = true;
  try {
    const res: any = await getShareLinkAccessLogs(link.id, { limit: 200 });
    accessLogList.value = res?.data?.results || res?.data || [];
  } catch (_) {
    accessLogList.value = [];
  } finally {
    accessLogLoading.value = false;
  }
};

const formatSubjectName = (item: SharePermissionItem) => {
  if (item.subject_info?.name) return item.subject_info.name;
  return item.subject_name_cache || '-';
};

const formatPermTags = (permCodes: string[], maxShow = 3) => {
  const detailMap: Record<string, SharePermDef> = {};
  allPerms.value.forEach((p) => (detailMap[p.perm_code] = p));
  const shown: string[] = [];
  permCodes.slice(0, maxShow).forEach((c) => {
    const d = detailMap[c];
    shown.push(d ? d.perm_name : c);
  });
  const extra = permCodes.length > maxShow ? permCodes.length - maxShow : 0;
  return { shown, extra };
};

const statusTagType = (item: ShareLinkItem) => {
  if (!item.is_active) return 'info';
  if (item.expire_time && new Date(item.expire_time).getTime() < Date.now()) return 'warning';
  if (item.max_access_count && item.current_access_count >= item.max_access_count) return 'warning';
  return 'success';
};

const statusText = (item: ShareLinkItem) => {
  if (!item.is_active) return t('message.pages.scriptLibrary.shareStatusDisabled');
  if (item.expire_time && new Date(item.expire_time).getTime() < Date.now()) return t('message.pages.scriptLibrary.shareStatusExpired');
  if (item.max_access_count && item.current_access_count >= item.max_access_count) return t('message.pages.scriptLibrary.shareStatusUsedUp');
  return t('message.pages.scriptLibrary.shareStatusActive');
};

const refreshAll = () => {
  loadShareList();
  loadLinkList();
};

watch(visible, async (v) => {
  if (v && props.resourceId) {
    if (permGroups.value.length === 0) await loadPermDefs();
    if (roleList.value.length === 0) loadRoles();
    if (deptFlatList.value.length === 0) loadDepts();
    refreshAll();
  }
});

defineExpose({
  refresh: refreshAll,
});
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('message.pages.scriptLibrary.shareManageTitle', { name: resourceName || '' })"
    width="960px"
    top="6vh"
    destroy-on-close
    class="share-manage-dialog"
  >
    <el-tabs v-model="activeTab" class="share-tabs">
      <!-- ========== Direct Share Tab ========== -->
      <el-tab-pane :label="t('message.pages.scriptLibrary.shareTabDirect')" name="direct">
        <template #label>
          <span><el-icon style="margin-right: 4px"><Share /></el-icon>{{ t('message.pages.scriptLibrary.shareTabDirect') }}</span>
        </template>
        <div class="tab-header">
          <div class="tab-desc">
            <el-icon><InfoFilled /></el-icon>
            {{ t('message.pages.scriptLibrary.shareTabDirectDesc') }}
          </div>
          <div class="tab-actions">
            <el-button :icon="Refresh" size="small" @click="loadShareList" :loading="loading">{{ t('message.pages.scriptLibrary.shareBtnRefresh') }}</el-button>
            <el-button type="primary" :icon="Plus" size="small" @click="openShareForm()">{{ t('message.pages.scriptLibrary.shareBtnNew') }}</el-button>
          </div>
        </div>

        <el-table :data="shareList" border stripe size="small" style="margin-top: 12px" v-loading="loading">
          <el-table-column :label="t('message.pages.scriptLibrary.shareColSubject')" min-width="160">
            <template #default="{ row }">
              <div class="subject-cell">
                <el-icon :size="16" class="subject-icon" :class="'icon-' + row.subject_type">
                  <User v-if="row.subject_type === 'user'" />
                  <UserFilled v-else-if="row.subject_type === 'role'" />
                  <OfficeBuilding v-else />
                </el-icon>
                <span class="subject-name" :title="formatSubjectName(row)">{{ formatSubjectName(row) }}</span>
                <el-tag size="small" style="margin-left: 6px">
                  {{ row.subject_type === 'user' ? t('message.pages.scriptLibrary.shareSubjectUser') : row.subject_type === 'role' ? t('message.pages.scriptLibrary.shareSubjectRole') : t('message.pages.scriptLibrary.shareSubjectDept') }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('message.pages.scriptLibrary.shareColPerm')" min-width="260">
            <template #default="{ row }">
              <div class="perm-tags">
                <el-tag
                  v-for="(t, i) in formatPermTags(row.permissions).shown"
                  :key="i"
                  size="small"
                  type="info"
                  effect="plain"
                  style="margin-right: 4px; margin-bottom: 2px"
                >
                  {{ t }}
                </el-tag>
                <el-tag v-if="formatPermTags(row.permissions).extra" size="small" type="warning">
                  +{{ formatPermTags(row.permissions).extra }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('message.pages.scriptLibrary.shareColExpire')" width="160">
            <template #default="{ row }">
              <span v-if="row.expire_time">
                <el-icon :size="14" style="vertical-align: -2px"><Clock /></el-icon>
                {{ row.expire_time.slice(0, 16) }}
              </span>
              <span v-else style="color: #909399">{{ t('message.pages.scriptLibrary.shareNeverExpire') }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('message.pages.scriptLibrary.shareColGrantor')" width="100">
            <template #default="{ row }">{{ row.creator_name || '-' }}</template>
          </el-table-column>
          <el-table-column :label="t('message.pages.scriptLibrary.shareColGrantTime')" width="150">
            <template #default="{ row }">{{ row.create_datetime?.slice(0, 16) || '-' }}</template>
          </el-table-column>
          <el-table-column :label="t('message.pages.scriptLibrary.shareColAction')" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="small" text type="primary" :icon="Edit" @click="openShareForm(row)">{{ t('message.pages.scriptLibrary.shareActionEdit') }}</el-button>
              <el-button size="small" text type="danger" :icon="Delete" @click="removeShare(row)">{{ t('message.pages.scriptLibrary.shareActionRemove') }}</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty :description="t('message.pages.scriptLibrary.shareEmptyDirect')" :image-size="80" />
          </template>
        </el-table>
      </el-tab-pane>

      <!-- ========== Share Links Tab ========== -->
      <el-tab-pane :label="t('message.pages.scriptLibrary.shareTabLink')" name="link">
        <template #label>
          <span><el-icon style="margin-right: 4px"><Link /></el-icon>{{ t('message.pages.scriptLibrary.shareTabLink') }}</span>
        </template>
        <div class="tab-header">
          <div class="tab-desc">
            <el-icon><InfoFilled /></el-icon>
            {{ t('message.pages.scriptLibrary.shareTabLinkDesc') }}
          </div>
          <div class="tab-actions">
            <el-button :icon="Refresh" size="small" @click="loadLinkList">{{ t('message.pages.scriptLibrary.shareBtnRefresh') }}</el-button>
            <el-button type="primary" :icon="Plus" size="small" @click="openLinkForm()">{{ t('message.pages.scriptLibrary.shareBtnGenLink') }}</el-button>
          </div>
        </div>

        <el-table :data="linkList" border stripe size="small" style="margin-top: 12px">
          <el-table-column label="Token" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span style="font-family: monospace; color: #409eff">{{ row.share_token }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('message.pages.scriptLibrary.shareColPerm')" min-width="200">
            <template #default="{ row }">
              <div class="perm-tags">
                <el-tag
                  v-for="(t, i) in formatPermTags(row.permissions || [], 2).shown"
                  :key="i"
                  size="small"
                  type="info"
                  effect="plain"
                  style="margin-right: 4px; margin-bottom: 2px"
                >
                  {{ t }}
                </el-tag>
                <el-tag v-if="formatPermTags(row.permissions || [], 2).extra" size="small" type="warning">
                  +{{ formatPermTags(row.permissions || [], 2).extra }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('message.pages.scriptLibrary.shareColScope')" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="row.access_scope === 'anyone' ? 'warning' : 'info'">
                {{ row.access_scope_display || (row.access_scope === 'anyone' ? t('message.pages.scriptLibrary.shareScopeAnyone') : t('message.pages.scriptLibrary.shareScopeLoginOnly')) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('message.pages.scriptLibrary.shareColAccessCount')" width="100" align="center">
            <template #default="{ row }">
              <span>
                <b>{{ row.current_access_count }}</b>
                <span v-if="row.max_access_count"> / {{ row.max_access_count }}</span>
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="t('message.pages.scriptLibrary.shareColExpire')" width="150">
            <template #default="{ row }">
              <span v-if="row.expire_time">{{ row.expire_time.slice(0, 16) }}</span>
              <span v-else style="color: #909399">{{ t('message.pages.scriptLibrary.shareNeverExpireShort') }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('message.pages.scriptLibrary.shareColStatus')" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="statusTagType(row)">{{ statusText(row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('message.pages.scriptLibrary.shareColAction')" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" text type="success" :icon="CopyDocument" @click="copyShareLink(row)">{{ t('message.pages.scriptLibrary.shareActionCopy') }}</el-button>
              <el-button size="small" text type="info" :icon="View" @click="openAccessLogs(row)">{{ t('message.pages.scriptLibrary.shareActionLogs') }}</el-button>
              <el-button v-if="row.is_active" size="small" text type="danger" :icon="Close" @click="doRevokeLink(row)">{{ t('message.pages.scriptLibrary.shareActionRevoke') }}</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty :description="t('message.pages.scriptLibrary.shareEmptyLink')" :image-size="80" />
          </template>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- ========== Add/Edit Share Dialog ========== -->
    <el-dialog
      v-model="shareFormVisible"
      :title="isEditingShare ? t('message.pages.scriptLibrary.shareFormTitleEdit') : t('message.pages.scriptLibrary.shareFormTitleNew')"
      width="680px"
      top="8vh"
      destroy-on-close
      append-to-body
    >
      <el-form
        ref="shareFormRef"
        :model="shareForm"
        :rules="shareFormRules"
        label-width="90px"
        size="small"
      >
        <el-form-item :label="t('message.pages.scriptLibrary.shareFormSubjectType')" prop="subject_type">
          <el-radio-group v-model="shareForm.subject_type" :disabled="isEditingShare">
            <el-radio value="user">
              <el-icon style="margin-right: 2px"><User /></el-icon>{{ t('message.pages.scriptLibrary.shareSubjectUser') }}
            </el-radio>
            <el-radio value="role">
              <el-icon style="margin-right: 2px"><UserFilled /></el-icon>{{ t('message.pages.scriptLibrary.shareSubjectRole') }}
            </el-radio>
            <el-radio value="dept">
              <el-icon style="margin-right: 2px"><OfficeBuilding /></el-icon>{{ t('message.pages.scriptLibrary.shareSubjectDept') }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          :label="shareForm.subject_type === 'user' ? t('message.pages.scriptLibrary.shareFormSelectUser') : shareForm.subject_type === 'role' ? t('message.pages.scriptLibrary.shareFormSelectRole') : t('message.pages.scriptLibrary.shareFormSelectDept')"
          required
        >
          <UserSearch
            v-if="shareForm.subject_type === 'user'"
            v-model="shareForm.subject_ids"
            :multiple="!isEditingShare"
            :placeholder="t('message.pages.scriptLibrary.shareFormUserPlaceholder')"
            :disabled="isEditingShare"
          />
          <el-select
            v-else-if="shareForm.subject_type === 'role'"
            v-model="shareForm.subject_role_ids"
            :multiple="!isEditingShare"
            filterable
            clearable
            :placeholder="t('message.pages.scriptLibrary.shareFormRolePlaceholder')"
            :loading="roleLoading"
            style="width: 100%"
            :disabled="isEditingShare"
          >
            <el-option v-for="r in roleList" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
          <el-tree-select
            v-else
            v-model="shareForm.subject_dept_ids"
            :data="deptTree"
            :props="deptTreeProps"
            :multiple="!isEditingShare"
            filterable
            clearable
            check-strictly
            :render-after-expand="false"
            show-checkbox
            :node-key="'id'"
            :placeholder="t('message.pages.scriptLibrary.shareFormDeptPlaceholder')"
            :loading="deptLoading"
            style="width: 100%"
            :disabled="isEditingShare"
          />
        </el-form-item>

        <el-form-item :label="t('message.pages.scriptLibrary.shareFormPreset')">
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <el-button
              v-for="tp in presetTemplates"
              :key="tp.key"
              size="small"
              :type="shareForm.permissions.length === tp.codes.length && tp.codes.every((c) => shareForm.permissions.includes(c)) ? 'primary' : 'default'"
              @click="applyPreset(tp.codes)"
            >
              <b>{{ tp.name }}</b>
              <el-tooltip v-if="tp.desc" :content="tp.desc" placement="top">
                <el-icon style="margin-left: 2px; opacity: 0.6"><InfoFilled /></el-icon>
              </el-tooltip>
            </el-button>
          </div>
        </el-form-item>

        <el-form-item :label="t('message.pages.scriptLibrary.shareFormPerms')" prop="permissions" required>
          <div class="perm-checkbox-groups" v-loading="permLoading">
            <el-collapse v-model="activePermGroups">
              <el-collapse-item
                v-for="(g, idx) in permGroups"
                :key="g.category"
                :name="g.category"
              >
                <template #title>
                  <div class="group-title">
                    <b>{{ g.category_display }}</b>
                    <el-tag size="small" type="info" effect="plain" style="margin-left: 8px">{{ t('message.pages.scriptLibrary.sharePermCount', { n: g.perms?.length || 0 }) }}</el-tag>
                    <el-checkbox
                      style="margin-left: 12px"
                      :model-value="g.perms?.every((p) => shareForm.permissions.includes(p.perm_code))"
                      :indeterminate="
                        g.perms?.some((p) => shareForm.permissions.includes(p.perm_code)) &&
                        !g.perms?.every((p) => shareForm.permissions.includes(p.perm_code))
                      "
                      @change="(v: boolean) => {
                        g.perms?.forEach((p) => {
                          const idx = shareForm.permissions.indexOf(p.perm_code);
                          if (v && idx < 0) shareForm.permissions.push(p.perm_code);
                          else if (!v && idx >= 0) shareForm.permissions.splice(idx, 1);
                        });
                      }"
                    >{{ t('message.pages.scriptLibrary.shareFormPermSelectAll') }}</el-checkbox>
                  </div>
                </template>
                <div class="perm-checkboxes">
                  <el-checkbox
                    v-for="p in g.perms"
                    :key="p.perm_code"
                    v-model="shareForm.permissions"
                    :value="p.perm_code"
                    style="margin-right: 16px; margin-bottom: 6px"
                  >
                    <span :title="p.description">
                      {{ p.perm_name }}
                      <el-tooltip v-if="p.description" :content="p.description">
                        <el-icon style="opacity: 0.5; margin-left: 2px"><InfoFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </el-checkbox>
                </div>
              </el-collapse-item>
            </el-collapse>
            <div v-if="!permGroups.length && !permLoading" style="padding: 16px; color: #909399; text-align: center">
              {{ t('message.pages.scriptLibrary.shareFormNoPermDef') }}
            </div>
          </div>
        </el-form-item>

        <el-form-item :label="t('message.pages.scriptLibrary.shareFormExpire')">
          <el-date-picker
            v-model="shareForm.expire_time"
            type="datetime"
            :placeholder="t('message.pages.scriptLibrary.shareFormExpirePlaceholder')"
            clearable
            style="width: 100%"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>

        <el-form-item :label="t('message.pages.scriptLibrary.shareFormRemark')">
          <el-input v-model="shareForm.remark" type="textarea" :rows="2" maxlength="200" show-word-limit :placeholder="t('message.pages.scriptLibrary.shareFormRemarkPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shareFormVisible = false">{{ t('message.pages.scriptLibrary.shareFormCancel') }}</el-button>
        <el-button type="primary" @click="submitShareForm" :loading="loading">
          {{ isEditingShare ? t('message.pages.scriptLibrary.shareFormSaveEdit') : t('message.pages.scriptLibrary.shareFormSaveCreate') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ========== Generate Share Link Dialog ========== -->
    <el-dialog
      v-model="linkFormVisible"
      :title="t('message.pages.scriptLibrary.shareLinkFormTitle')"
      width="640px"
      top="8vh"
      destroy-on-close
      append-to-body
    >
      <el-form ref="linkFormRef" :model="linkForm" :rules="linkFormRules" label-width="110px" size="small">
        <el-form-item :label="t('message.pages.scriptLibrary.shareFormPreset')">
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <el-button
              v-for="tp in presetTemplates"
              :key="tp.key"
              size="small"
              :type="linkForm.permissions.length === tp.codes.length && tp.codes.every((c) => linkForm.permissions.includes(c)) ? 'primary' : 'default'"
              @click="applyPreset(tp.codes)"
            >
              <b>{{ tp.name }}</b>
              <el-tooltip v-if="tp.desc" :content="tp.desc" placement="top">
                <el-icon style="margin-left: 2px; opacity: 0.6"><InfoFilled /></el-icon>
              </el-tooltip>
            </el-button>
          </div>
        </el-form-item>

        <el-form-item :label="t('message.pages.scriptLibrary.shareFormPermLink')" prop="permissions" required>
          <div class="perm-checkbox-groups" v-loading="permLoading">
            <el-collapse v-model="activeLinkPermGroups">
              <el-collapse-item
                v-for="g in permGroups"
                :key="'l-' + g.category"
                :name="g.category"
              >
                <template #title>
                  <div class="group-title">
                    <b>{{ g.category_display }}</b>
                    <el-tag size="small" type="info" effect="plain" style="margin-left: 8px">{{ t('message.pages.scriptLibrary.sharePermCount', { n: g.perms?.length || 0 }) }}</el-tag>
                    <el-checkbox
                      style="margin-left: 12px"
                      :model-value="g.perms?.every((p) => linkForm.permissions.includes(p.perm_code))"
                      :indeterminate="
                        g.perms?.some((p) => linkForm.permissions.includes(p.perm_code)) &&
                        !g.perms?.every((p) => linkForm.permissions.includes(p.perm_code))
                      "
                      @change="(v: boolean) => {
                        g.perms?.forEach((p) => {
                          const idx = linkForm.permissions.indexOf(p.perm_code);
                          if (v && idx < 0) linkForm.permissions.push(p.perm_code);
                          else if (!v && idx >= 0) linkForm.permissions.splice(idx, 1);
                        });
                      }"
                    >{{ t('message.pages.scriptLibrary.shareFormPermSelectAll') }}</el-checkbox>
                  </div>
                </template>
                <div class="perm-checkboxes">
                  <el-checkbox
                    v-for="p in g.perms"
                    :key="'l-' + p.perm_code"
                    v-model="linkForm.permissions"
                    :value="p.perm_code"
                    style="margin-right: 16px; margin-bottom: 6px"
                  >
                    {{ p.perm_name }}
                  </el-checkbox>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-form-item>

        <el-form-item :label="t('message.pages.scriptLibrary.shareLinkFormScope')" prop="access_scope">
          <el-radio-group v-model="linkForm.access_scope">
            <el-radio value="authenticated">
              <el-icon><User /></el-icon> {{ t('message.pages.scriptLibrary.shareLinkFormScopeOnlyLogin') }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="t('message.pages.scriptLibrary.shareFormExpire')">
          <el-date-picker
            v-model="linkForm.expire_time"
            type="datetime"
            :placeholder="t('message.pages.scriptLibrary.shareFormExpirePlaceholder')"
            clearable
            style="width: 100%"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>

        <el-form-item :label="t('message.pages.scriptLibrary.shareLinkFormAccessLimit')">
          <el-input-number
            v-model="linkForm.max_access_count"
            :min="1"
            :max="99999"
            controls-position="right"
            :placeholder="t('message.pages.scriptLibrary.shareLinkFormAccessLimitPlaceholder')"
            clearable
            style="width: 240px"
          />
        </el-form-item>

        <el-form-item :label="t('message.pages.scriptLibrary.shareLinkFormBind')">
          <el-select
            v-model="linkForm.bind_subject_type"
            :placeholder="t('message.pages.scriptLibrary.shareLinkFormBindPlaceholder')"
            clearable
            style="width: 140px; margin-right: 8px"
          >
            <el-option :label="t('message.pages.scriptLibrary.shareSubjectUser')" value="user" />
            <el-option :label="t('message.pages.scriptLibrary.shareSubjectRole')" value="role" />
            <el-option :label="t('message.pages.scriptLibrary.shareSubjectDept')" value="dept" />
          </el-select>
          <UserSearch
            v-if="linkForm.bind_subject_type === 'user'"
            v-model="linkSubjectUserIds"
            :multiple="false"
            :placeholder="t('message.pages.scriptLibrary.shareLinkFormBindUserPlaceholder')"
            style="flex: 1"
          />
          <el-select
            v-else-if="linkForm.bind_subject_type === 'role'"
            v-model="linkSubjectRoleId"
            filterable
            clearable
            :placeholder="t('message.pages.scriptLibrary.shareLinkFormBindRolePlaceholder')"
            :loading="roleLoading"
            style="flex: 1"
          >
            <el-option v-for="r in roleList" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
          <el-tree-select
            v-else-if="linkForm.bind_subject_type === 'dept'"
            v-model="linkSubjectDeptId"
            :data="deptTree"
            :props="deptTreeProps"
            filterable
            clearable
            check-strictly
            :render-after-expand="false"
            :placeholder="t('message.pages.scriptLibrary.shareLinkFormBindDeptPlaceholder')"
            :loading="deptLoading"
            style="flex: 1"
          />
        </el-form-item>

        <el-form-item :label="t('message.pages.scriptLibrary.shareFormRemark')">
          <el-input v-model="linkForm.remark" type="textarea" :rows="2" maxlength="200" show-word-limit :placeholder="t('message.pages.scriptLibrary.shareLinkFormRemarkPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="linkFormVisible = false">{{ t('message.pages.scriptLibrary.shareFormCancel') }}</el-button>
        <el-button type="primary" @click="submitLinkForm" :loading="loading">{{ t('message.pages.scriptLibrary.shareLinkFormSubmit') }}</el-button>
      </template>
    </el-dialog>

    <!-- ========== Access Log Dialog ========== -->
    <el-dialog
      v-model="accessLogVisible"
      :title="t('message.pages.scriptLibrary.shareLogTitle', { token: currentLink?.share_token || '' })"
      width="860px"
      top="8vh"
      destroy-on-close
      append-to-body
    >
      <div class="log-meta" v-if="currentLink">
        <el-descriptions :column="3" size="small" border>
          <el-descriptions-item :label="t('message.pages.scriptLibrary.shareLogResource')">{{ currentLink.resource_name || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('message.pages.scriptLibrary.shareColAccessCount')">
            {{ currentLink.current_access_count }}
            <span v-if="currentLink.max_access_count"> / {{ currentLink.max_access_count }}</span>
          </el-descriptions-item>
          <el-descriptions-item :label="t('message.pages.scriptLibrary.shareColStatus')">
            <el-tag size="small" :type="statusTagType(currentLink)">{{ statusText(currentLink) }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-table :data="accessLogList" border stripe size="small" style="margin-top: 12px" v-loading="accessLogLoading" max-height="420">
        <el-table-column type="index" label="#" width="50" align="center" />
        <el-table-column :label="t('message.pages.scriptLibrary.shareLogColVisitTime')" width="160">
          <template #default="{ row }">{{ (row.access_time || row.create_datetime || '').slice(0, 19) }}</template>
        </el-table-column>
        <el-table-column :label="t('message.pages.scriptLibrary.shareLogColVisitor')" width="120">
          <template #default="{ row }">
            <template v-if="row.visitor_type === 'login'">
              <el-icon><User /></el-icon> {{ row.visitor_name }}
            </template>
            <template v-else>
              <el-tag size="small" type="info">{{ t('message.pages.scriptLibrary.shareLogAnonymous') }}</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.scriptLibrary.shareLogColResult')" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.access_success" size="small" type="success" effect="dark">{{ t('message.pages.scriptLibrary.shareLogSuccess') }}</el-tag>
            <el-tag v-else size="small" type="danger">{{ t('message.pages.scriptLibrary.shareLogFail') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('message.pages.scriptLibrary.shareLogColFailReason')" min-width="140" v-if="accessLogList.some((l) => !l.access_success)">
          <template #default="{ row }">
            <span v-if="!row.access_success" style="color: #f56c6c">{{ row.fail_reason || '-' }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="IP" width="140">
          <template #default="{ row }">{{ row.client_ip }}</template>
        </el-table-column>
        <el-table-column label="User-Agent" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.user_agent || '-' }}</template>
        </el-table-column>
        <template #empty>
          <el-empty :description="t('message.pages.scriptLibrary.shareLogEmpty')" :image-size="70" />
        </template>
      </el-table>
      <template #footer>
        <el-button type="primary" @click="accessLogVisible = false">{{ t('message.pages.scriptLibrary.shareLogClose') }}</el-button>
      </template>
    </el-dialog>

    <template #footer>
      <el-button @click="visible = false">{{ t('message.pages.scriptLibrary.shareDialogClose') }}</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { InfoFilled } from '@element-plus/icons-vue';
import { ref } from 'vue';
const activePermGroups = ref<string[]>(['view', 'execute', 'edit', 'manage']);
const activeLinkPermGroups = ref<string[]>(['view', 'execute', 'edit', 'manage']);
export default {
  data() {
    return { activePermGroups, activeLinkPermGroups };
  },
};
</script>

<style scoped lang="scss">
.share-manage-dialog {
  :deep(.el-tabs__item) {
    height: 44px;
    line-height: 44px;
    font-size: 14px;
  }
  :deep(.el-dialog__body) {
    padding-top: 8px;
  }
}
.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
  .tab-desc {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #606266;
    font-size: 13px;
    :deep(.el-icon) {
      color: #409eff;
    }
  }
  .tab-actions {
    display: flex;
    gap: 8px;
  }
}
.subject-cell {
  display: flex;
  align-items: center;
  .subject-icon {
    margin-right: 6px;
    &.icon-user { color: #409eff; }
    &.icon-role { color: #67c23a; }
    &.icon-dept { color: #e6a23c; }
  }
  .subject-name {
    font-weight: 500;
  }
}
.perm-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.perm-checkbox-groups {
  width: 100%;
  :deep(.el-collapse-item__header) {
    height: 40px;
    line-height: 40px;
    border-bottom: 1px solid #ebeef5;
  }
  .group-title {
    display: flex;
    align-items: center;
    font-size: 13px;
  }
  .perm-checkboxes {
    padding: 8px 4px;
    display: flex;
    flex-wrap: wrap;
  }
}
.log-meta {
  margin-bottom: 8px;
}
</style>