<script setup lang="ts" name="user-search">

import { ref, watch, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { request } from '/@/utils/service';

interface UserItem {
  id: number;
  username: string;
  name?: string;
}

const props = defineProps({
  modelValue: {
    type: [Array, Number, String],
    default: () => [],
  },
  multiple: {
    type: Boolean,
    default: true,
  },
  placeholder: {
    type: String,
    default: '请选择用户',
  },
  size: {
    type: Number,
    default: 300,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue', 'change']);
const { t } = useI18n();

const userList = ref<UserItem[]>([]);
const userLoading = ref(false);
const selectedIds = ref<any>(props.multiple ? [] : null);
const cacheLoaded = ref(false);
const filledMissingIds = ref<Set<number | string>>(new Set());

function getSelectedIdList(): (number | string)[] {
  if (props.multiple) {
    return Array.isArray(selectedIds.value) ? selectedIds.value.filter((x: any) => x !== null && x !== undefined && x !== '') : [];
  }
  return (selectedIds.value !== null && selectedIds.value !== undefined && selectedIds.value !== '') ? [selectedIds.value] : [];
}

function mergeUsers(newUsers: UserItem[]) {
  const existing = new Map(userList.value.map((u) => [u.id, u]));
  for (const u of newUsers) {
    if (u && u.id !== undefined && u.id !== null) {
      existing.set(u.id, u);
    }
  }
  userList.value = Array.from(existing.values());
}

async function fillMissingSelectedUsers() {
  const ids = getSelectedIdList();
  if (ids.length === 0) return;
  const missing = ids.filter((id) => {
    if (filledMissingIds.value.has(id)) return false;
    const nid = Number(id);
    return !userList.value.some((u) => u.id === id || u.id === nid);
  });
  if (missing.length === 0) return;
  missing.forEach((id) => filledMissingIds.value.add(id));
  const idListStr = missing.map((x) => String(x)).join(',');
  let fetched: UserItem[] = [];
  try {
    const res: any = await request({
      url: '/api/system/user/user_basic_info/',
      method: 'get',
      params: { ids: idListStr },
    }).catch(() => null);
    const arr: any[] = Array.isArray(res?.data)
      ? res.data
      : (res?.data?.results || res?.data?.data || []);
    fetched = arr
      .filter((x) => x && (x.id !== undefined || x.username))
      .map((x: any) => ({
        id: x.id ?? Number(x.id),
        username: x.username || `ID:${x.id ?? ''}`,
        name: x.name || '',
      }));
  } catch (_e) {
    fetched = [];
  }
  const fetchedIds = new Set(fetched.map((u) => String(u.id)));
  const placeholders: UserItem[] = missing
    .filter((id) => !fetchedIds.has(String(id)))
    .map((id) => ({
      id: Number(id) || (id as any),
      username: `ID:${id}`,
      name: '',
    }));
  mergeUsers([...fetched, ...placeholders]);
}

watch(
  () => props.modelValue,
  (val) => {
    if (props.multiple) {
      selectedIds.value = Array.isArray(val) ? [...val] : [];
    } else {
      selectedIds.value = val ?? null;
    }
    nextTick(() => fillMissingSelectedUsers());
  },
  { immediate: true, deep: true }
);

function formatUserLabel(u: UserItem) {
  return u.username + (u.name ? ` (${u.name})` : '');
}

async function loadUsers(keyword = '') {
  userLoading.value = true;
  try {
    const res: any = await request({
      url: '/api/system/user/',
      method: 'get',
      params: { size: props.size, search: keyword },
    });
    const fetched: UserItem[] = res.data?.results || res.data || [];
    if (keyword) {
      userList.value = fetched;
    } else {
      mergeUsers(fetched);
    }
    if (!keyword) cacheLoaded.value = true;
    await nextTick();
    await fillMissingSelectedUsers();
  } catch (e) {
    userList.value = [];
  } finally {
    userLoading.value = false;
  }
}

function handleRemoteSearch(keyword: string) {
  loadUsers(keyword || '');
}

function handleChange(val: any) {
  emit('update:modelValue', val);
  emit('change', val);
}

onMounted(() => {
  loadUsers();
});

defineExpose({
  loadUsers,
});
</script>

<template>
  <el-select
    :model-value="selectedIds"
    :multiple="multiple"
    filterable
    remote
    :clearable="clearable"
    :placeholder="placeholder || t('message.userSearchPlaceholder')"
    remote-show-suffix
    style="width: 100%"
    :remote-method="handleRemoteSearch"
    :loading="userLoading"
    :disabled="disabled"
    @update:model-value="handleChange"
  >
    <el-option
      v-for="u in userList"
      :key="u.id"
      :label="formatUserLabel(u)"
      :value="u.id"
    />
  </el-select>
</template>