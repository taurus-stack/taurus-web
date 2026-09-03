<template>
	<div class="message-center-page">
		<div class="message-container">
			<!-- category menu -->
			<div class="message-menu">
				<div class="menu-header">
					<span>{{ t('message.pages.messageCenter.page.title') }}</span>
					<el-badge :value="totalUnread" :hidden="!totalUnread" class="total-badge" />
				</div>
				<el-menu :default-active="activeCategory" @select="handleCategoryChange" class="category-menu">
					<el-menu-item index="receive">
						<span class="menu-icon receive">
							<el-icon><ele-BellFilled /></el-icon>
						</span>
						<span>{{ t('message.pages.messageCenter.tabs.myReceive') }}</span>
						<el-badge :value="unreadCount.receive" :hidden="!unreadCount.receive" class="menu-badge" />
					</el-menu-item>
					<el-menu-item index="send">
						<span class="menu-icon send">
							<el-icon><ele-Sell /></el-icon>
						</span>
						<span>{{ t('message.pages.messageCenter.tabs.myPublish') }}</span>
						<el-badge :value="unreadCount.send" :hidden="!unreadCount.send" class="menu-badge" />
					</el-menu-item>
					<el-menu-item index="unread">
						<span class="menu-icon unread">
							<el-icon><ele-AlarmClock /></el-icon>
						</span>
						<span>{{ t('message.pages.messageCenter.tabs.unreadMessages') }}</span>
						<el-badge :value="unreadCount.unread" :hidden="!unreadCount.unread" class="menu-badge" />
					</el-menu-item>
				</el-menu>

				<!-- stats cards -->
				<div class="menu-stats">
					<div class="stat-item">
						<div class="stat-num blue">{{ totalCount }}</div>
						<div class="stat-label">{{ t('message.pages.messageCenter.stats.total') }}</div>
					</div>
					<div class="stat-item">
						<div class="stat-num orange">{{ unreadCount.receive }}</div>
						<div class="stat-label">{{ t('message.pages.messageCenter.stats.unread') }}</div>
					</div>
					<div class="stat-item">
						<div class="stat-num green">{{ readCount }}</div>
						<div class="stat-label">{{ t('message.pages.messageCenter.stats.read') }}</div>
					</div>
					<div class="stat-item">
						<div class="stat-num purple">{{ publishCount }}</div>
						<div class="stat-label">{{ t('message.pages.messageCenter.stats.published') }}</div>
					</div>
				</div>

				<div class="menu-footer">
					<el-button text type="primary" size="small" @click="openNotifySetting">
						<el-icon><ele-Setting /></el-icon>
						<span>{{ t('message.pages.messageCenter.buttons.notifySettings') }}</span>
					</el-button>
				</div>
			</div>

			<!-- right message list -->
			<div class="message-content">
				<!-- top action bar -->
				<div class="content-header">
					<div class="header-left">
						<div class="header-title">
							<el-icon><component :is="currentCategoryIcon" /></el-icon>
							<span>{{ currentCategoryLabel }}</span>
							<el-tag v-if="totalCount > 0" size="small" type="info" class="ml5">{{ t('message.pages.messageCenter.countTag', { count: totalCount }) }}</el-tag>
						</div>
					</div>
					<div class="header-right">
						<el-select v-model="readFilter" size="small" style="width: 120px" @change="onFilterChange">
							<el-option :label="t('message.pages.messageCenter.tabs.all')" value="all" />
							<el-option :label="t('message.pages.messageCenter.tabs.unread')" value="unread" />
							<el-option :label="t('message.pages.messageCenter.tabs.read')" value="read" />
						</el-select>
						<el-input
							v-model="searchKeyword"
							:placeholder="t('message.pages.messageCenter.search.placeholder')"
							size="small"
							style="width: 200px"
							clearable
							@input="onKeywordChange"
						>
							<template #prefix>
								<el-icon><ele-Search /></el-icon>
							</template>
						</el-input>
						<el-button size="small" :type="isAllSelected ? 'primary' : 'default'" @click="handleSelectAll">
							{{ isAllSelected ? t('message.pages.messageCenter.buttons.deselectAll') : t('message.pages.messageCenter.buttons.selectAll') }}
						</el-button>
						<el-button
							v-if="activeCategory === 'receive' || activeCategory === 'unread'"
							size="small"
							text
							@click="markAllRead"
							:disabled="!hasUnread"
						>
							<el-icon><ele-Check /></el-icon>
							<span>{{ t('message.pages.messageCenter.buttons.markAllRead') }}</span>
						</el-button>
						<el-button size="small" text type="danger" @click="batchDelete" :disabled="!selectedIds.length">
							<el-icon><ele-Delete /></el-icon>
							<span>{{ t('message.pages.messageCenter.buttons.batchDelete', { count: selectedIds.length }) }}</span>
						</el-button>
						<el-button v-if="activeCategory === 'send'" size="small" type="primary" @click="handlePublish">
							<el-icon><ele-Plus /></el-icon>
							<span>{{ t('message.pages.messageCenter.buttons.publishNew') }}</span>
						</el-button>
					</div>
				</div>

				<!-- message list -->
				<div class="message-list">
					<div
						v-for="item in displayList"
						:key="item.id"
						:class="['message-item', { unread: !item.is_read, selected: selectedIds.includes(item.id) }]"
						@click="handleMessageClick(item)"
					>
						<div class="item-checkbox" @click.stop="toggleSelect(item.id)">
							<el-checkbox :model-value="selectedIds.includes(item.id)" />
						</div>
						<div class="item-icon" :class="getItemCategory(item)">
							<el-icon><component :is="getItemIcon(item)" /></el-icon>
						</div>
						<div class="item-content">
							<div class="item-title">
								<span>{{ item.title }}</span>
								<span class="item-meta">
									<el-tag v-if="!item.is_read && (activeCategory === 'receive' || activeCategory === 'unread')" size="small" type="danger" effect="light">{{ t('message.pages.messageCenter.status.no') }}</el-tag>
									<el-tag v-if="activeCategory === 'send'" size="small" type="info" effect="light">{{ getTargetTypeLabel(item.target_type) }}</el-tag>
								</span>
								<span class="item-time">{{ formatTime(item.create_datetime) }}</span>
							</div>
							<div class="item-desc">{{ truncate(item.content, 120) }}</div>
							<div class="item-footer">
								<el-tag v-if="activeCategory === 'send'" size="small" type="success" effect="plain">{{ t('message.pages.messageCenter.item.publisher', { name: item.creator_name || t('message.pages.messageCenter.item.me') }) }}</el-tag>
								<el-tag v-else size="small" type="primary" effect="plain">{{ t('message.pages.messageCenter.item.from', { name: item.creator_name || t('message.pages.messageCenter.item.system') }) }}</el-tag>
							</div>
						</div>
						<div class="item-actions" @click.stop>
							<el-button v-if="!item.is_read && (activeCategory === 'receive' || activeCategory === 'unread')" size="small" text @click="markSingleRead(item)">{{ t('message.pages.messageCenter.buttons.markRead') }}</el-button>
							<el-button size="small" text @click="viewDetail(item)">{{ t('message.pages.messageCenter.buttons.viewDetail') }}</el-button>
							<el-button size="small" text type="danger" @click="deleteSingle(item)">{{ t('message.pages.messageCenter.buttons.delete') }}</el-button>
						</div>
					</div>

					<el-empty v-if="!loading && !displayList.length" :description="t('message.pages.messageCenter.empty.noMessages')" style="margin-top: 60px" />

					<div v-if="loading" class="message-loading">
						<el-skeleton :rows="4" animated />
					</div>
				</div>

				<el-pagination
					v-model:current-page="page.current"
					v-model:page-size="page.size"
					:total="page.total"
					layout="total, prev, pager, next, jumper"
					@change="getMessageList"
					@size-change="getMessageList"
					style="margin-top: 16px; justify-content: center; display: flex"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="messageCenter">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import * as api from './api';

const { t } = useI18n();

const activeCategory = ref<'receive' | 'send' | 'unread'>('receive');
const readFilter = ref('all');
const searchKeyword = ref('');
const messageList = ref<any[]>([]);
const selectedIds = ref<number[]>([]);
const isAllSelected = ref(false);
const loading = ref(false);

const page = reactive({ current: 1, size: 10, total: 0 });

const unreadCount = reactive({
	receive: 0,
	send: 0,
	unread: 0,
});

const publishCount = ref(0);
const readCount = ref(0);

const totalUnread = computed(() => unreadCount.receive);
const totalCount = computed(() => messageList.value.length + (page.total - messageList.value.length) || 0);

const hasUnread = computed(() => messageList.value.some((item: any) => !item.is_read));

const categoryLabelMap: Record<string, string> = {
	receive: t('message.pages.messageCenter.tabs.myReceive'),
	send: t('message.pages.messageCenter.tabs.myPublish'),
	unread: t('message.pages.messageCenter.tabs.unreadMessages'),
};

const categoryIconMap: Record<string, string> = {
	receive: 'BellFilled',
	send: 'Sell',
	unread: 'AlarmClock',
};

const targetTypeLabelMap: Record<number, string> = {
	0: t('message.pages.messageCenter.targetType.byUser'),
	1: t('message.pages.messageCenter.targetType.byRole'),
	2: t('message.pages.messageCenter.targetType.byDept'),
	3: t('message.pages.messageCenter.targetType.notice'),
};

const currentCategoryLabel = computed(() => categoryLabelMap[activeCategory.value] || t('message.pages.messageCenter.page.title'));
const currentCategoryIcon = computed(() => categoryIconMap[activeCategory.value] || 'BellFilled');

const displayList = computed(() => {
	let list = messageList.value;
	if (readFilter.value === 'unread') {
		list = list.filter((item: any) => !item.is_read);
	} else if (readFilter.value === 'read') {
		list = list.filter((item: any) => item.is_read);
	}
	if (searchKeyword.value.trim()) {
		const kw = searchKeyword.value.trim().toLowerCase();
		list = list.filter((item: any) => item.title?.toLowerCase().includes(kw));
	}
	return list;
});

const getItemCategory = (item: any): string => {
	if (item.target_type === 0) return 'user';
	if (item.target_type === 1) return 'role';
	if (item.target_type === 2) return 'dept';
	if (item.target_type === 3) return 'system';
	return 'system';
};

const getItemIcon = (item: any): string => {
	if (item.target_type === 0) return 'User';
	if (item.target_type === 1) return 'UserFilled';
	if (item.target_type === 2) return 'OfficeBuilding';
	if (item.target_type === 3) return 'Bell';
	return 'ChatDotRound';
};

const getTargetTypeLabel = (type: number): string => targetTypeLabelMap[type] || t('message.pages.messageCenter.targetType.other');

const truncate = (text: string, len: number): string => {
	if (!text) return '';
	const plain = text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
	return plain.length > len ? plain.slice(0, len) + '...' : plain;
};

const formatTime = (time: string): string => {
	if (!time) return '-';
	return time.replace('T', ' ').slice(0, 16);
};

const updateStatsFromList = () => {
	if (activeCategory.value === 'receive' || activeCategory.value === 'unread') {
		unreadCount.receive = messageList.value.filter((i: any) => !i.is_read).length;
		readCount.value = messageList.value.filter((i: any) => i.is_read).length;
	}
	unreadCount.unread = unreadCount.receive;
};

const fetchStats = async () => {
	try {
		const [receiveRes, sendRes] = await Promise.all([
			api.GetSelfReceive({ page: 1, limit: 999 }),
			api.GetList({ page: 1, limit: 999 }),
		]);
		const receiveList = receiveRes?.data?.items || receiveRes?.data || [];
		const sendList = sendRes?.data?.items || sendRes?.data || [];
		unreadCount.receive = receiveList.filter((i: any) => !i.is_read).length;
		unreadCount.unread = unreadCount.receive;
		readCount.value = receiveList.filter((i: any) => i.is_read).length;
		publishCount.value = sendList.length;
	} catch {
		// ignore
	}
};

onMounted(() => {
	getMessageList();
	fetchStats();
});

const getMessageList = async () => {
	loading.value = true;
	try {
		let res: any;
		const params = { page: page.current, limit: page.size };

		if (activeCategory.value === 'send') {
			res = await api.GetList(params);
		} else {
			res = await api.GetSelfReceive(params);
		}

		const list = res?.data?.items || res?.data || [];
		page.total = res?.data?.total || list.length;
		messageList.value = list;

		if (activeCategory.value === 'send') {
			publishCount.value = list.length;
		} else {
			unreadCount.receive = list.filter((i: any) => !i.is_read).length;
			readCount.value = list.filter((i: any) => i.is_read).length;
		}
		unreadCount.unread = unreadCount.receive;
	} catch {
		messageList.value = [];
	} finally {
		loading.value = false;
	}
};

const handleCategoryChange = (key: string) => {
	activeCategory.value = key as any;
	page.current = 1;
	selectedIds.value = [];
	isAllSelected.value = false;
	readFilter.value = 'all';
	searchKeyword.value = '';
	getMessageList();
};

const onFilterChange = () => {
	selectedIds.value = [];
	isAllSelected.value = false;
};

const onKeywordChange = () => {
	selectedIds.value = [];
	isAllSelected.value = false;
};

const handleMessageClick = async (item: any) => {
	if (!item.is_read && (activeCategory.value === 'receive' || activeCategory.value === 'unread')) {
		try {
			await api.GetObj(item.id);
			item.is_read = true;
			if (unreadCount.receive > 0) unreadCount.receive--;
			unreadCount.unread = unreadCount.receive;
			fetchStats();
		} catch {
			// ignore
		}
	}
};

const toggleSelect = (id: number) => {
	const index = selectedIds.value.indexOf(id);
	if (index > -1) {
		selectedIds.value.splice(index, 1);
	} else {
		selectedIds.value.push(id);
	}
	isAllSelected.value = selectedIds.value.length === displayList.value.length && displayList.value.length > 0;
};

const handleSelectAll = () => {
	if (isAllSelected.value) {
		selectedIds.value = [];
	} else {
		selectedIds.value = displayList.value.map((item: any) => item.id);
	}
	isAllSelected.value = !isAllSelected.value;
};

const markAllRead = () => {
	ElMessageBox.confirm(t('message.pages.messageCenter.messages.markAllReadConfirm'), t('message.pages.messageCenter.messages.tip'), {
		type: 'info',
		confirmButtonText: t('message.pages.messageCenter.messages.confirm'),
		cancelButtonText: t('message.pages.messageCenter.messages.cancel'),
	})
		.then(async () => {
			try {
				const tasks = messageList.value
					.filter((i: any) => !i.is_read)
					.map((i: any) => api.GetObj(i.id));
				await Promise.all(tasks);
				messageList.value.forEach((i: any) => {
					i.is_read = true;
				});
				unreadCount.receive = 0;
				unreadCount.unread = 0;
				ElMessage.success(t('message.pages.messageCenter.messages.allMarkedRead'));
				fetchStats();
			} catch {
				ElMessage.error(t('message.pages.messageCenter.messages.operationFailed'));
			}
		})
		.catch(() => {});
};

const markSingleRead = async (item: any) => {
	try {
		await api.GetObj(item.id);
		item.is_read = true;
		if (unreadCount.receive > 0) unreadCount.receive--;
		unreadCount.unread = unreadCount.receive;
		ElMessage.success(t('message.pages.messageCenter.messages.markedRead'));
		fetchStats();
	} catch {
		ElMessage.error(t('message.pages.messageCenter.messages.operationFailed'));
	}
};

const batchDelete = () => {
	if (!selectedIds.value.length) {
		ElMessage.warning(t('message.pages.messageCenter.messages.selectDeleteRequired'));
		return;
	}
	ElMessageBox.confirm(t('message.pages.messageCenter.messages.batchDeleteConfirm', { count: selectedIds.value.length }), t('message.pages.messageCenter.messages.deleteConfirm'), { type: 'warning' })
		.then(async () => {
			try {
				const tasks = selectedIds.value.map((id) => api.DelObj(id));
				await Promise.all(tasks);
				messageList.value = messageList.value.filter((i: any) => !selectedIds.value.includes(i.id));
				const deletedUnread = messageList.value.filter((i: any) => !i.is_read).length;
				selectedIds.value = [];
				isAllSelected.value = false;
				ElMessage.success(t('message.pages.messageCenter.messages.deleteSuccess'));
				fetchStats();
			} catch {
				ElMessage.error(t('message.pages.messageCenter.messages.deleteFailed'));
			}
		})
		.catch(() => {});
};

const deleteSingle = async (item: any) => {
	ElMessageBox.confirm(t('message.pages.messageCenter.messages.singleDeleteConfirm'), t('message.pages.messageCenter.messages.deleteConfirm'), { type: 'warning' })
		.then(async () => {
			try {
				await api.DelObj(item.id);
				const index = messageList.value.findIndex((i: any) => i.id === item.id);
				if (index > -1) messageList.value.splice(index, 1);
				if (!item.is_read && unreadCount.receive > 0) {
					unreadCount.receive--;
					unreadCount.unread = unreadCount.receive;
				}
				ElMessage.success(t('message.pages.messageCenter.messages.deleteSuccess'));
				fetchStats();
			} catch {
				ElMessage.error(t('message.pages.messageCenter.messages.deleteFailed'));
			}
		})
		.catch(() => {});
};

const viewDetail = (item: any) => {
	handleMessageClick(item);
	ElMessage.success(t('message.pages.messageCenter.messages.viewed', { title: item.title }));
};

const handlePublish = () => {
	ElMessage.success(t('message.pages.messageCenter.messages.publishRedirect'));
};

const openNotifySetting = () => {
	ElMessage.info(t('message.pages.messageCenter.messages.notifySettingsRedirect'));
};
</script>

<style scoped lang="scss">
.message-center-page {
	width: 100%;
	height: calc(100vh - 32px);
	padding: 16px;
	box-sizing: border-box;
	background: #f5f7fa;
}

.message-container {
	display: flex;
	gap: 16px;
	height: 100%;
}

// sidebar menu
.message-menu {
	width: 240px;
	background: #fff;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	display: flex;
	flex-direction: column;
	flex-shrink: 0;
	overflow: hidden;

	.menu-header {
		padding: 16px 20px;
		border-bottom: 1px solid #f0f0f0;
		font-size: 16px;
		font-weight: 600;
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: #303133;
	}

	.category-menu {
		border-right: none;
		flex: 0 0 auto;

		.el-menu-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0 20px;
			height: 48px;
		}
	}

	.menu-icon {
		margin-right: 8px;
		font-size: 14px;
		display: inline-flex;
		align-items: center;

		&.receive { color: #409eff; }
		&.send { color: #67c23a; }
		&.unread { color: #f56c6c; }
	}

	.menu-stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
		padding: 12px 16px;
		border-top: 1px solid #f0f0f0;
		background: #fafafa;
	}

	.stat-item {
		background: #fff;
		border-radius: 6px;
		padding: 8px;
		text-align: center;
		border: 1px solid #f0f0f0;
	}

	.stat-num {
		font-size: 18px;
		font-weight: 600;
		line-height: 1.2;

		&.blue { color: #409eff; }
		&.orange { color: #e6a23c; }
		&.green { color: #67c23a; }
		&.purple { color: #9254de; }
	}

	.stat-label {
		font-size: 11px;
		color: #909399;
		margin-top: 4px;
	}

	.menu-footer {
		padding: 12px 20px;
		border-top: 1px solid #f0f0f0;
		text-align: center;
	}
}

// right content
.message-content {
	flex: 1;
	background: #fff;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.content-header {
	padding: 12px 20px;
	border-bottom: 1px solid #f0f0f0;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;

	.header-left {
		display: flex;
		gap: 16px;
		align-items: center;
	}

	.header-right {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 15px;
		font-weight: 500;
		color: #303133;
	}
}

.message-list {
	flex: 1;
	overflow-y: auto;
	padding: 8px 0;
}

.message-loading {
	padding: 16px 20px;
}

.message-item {
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 14px 20px;
	cursor: pointer;
	border-bottom: 1px solid #f5f5f5;
	transition: background 0.2s;

	&:hover {
		background: #f9fafc;
	}

	&.unread {
		background: #f0f7ff;

		&:hover {
			background: #e6f2ff;
		}
	}

	&.selected {
		background: #ecf5ff;
	}

	.item-checkbox {
		padding-top: 2px;
		flex-shrink: 0;
	}

	.item-icon {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
		flex-shrink: 0;

		&.user { background: #ecf5ff; color: #409eff; }
		&.role { background: #fdf6ec; color: #e6a23c; }
		&.dept { background: #f0f9eb; color: #67c23a; }
		&.system { background: #fef0f0; color: #f56c6c; }
	}

	.item-content {
		flex: 1;
		min-width: 0;

		.item-title {
			display: flex;
			align-items: center;
			margin-bottom: 8px;
			gap: 8px;

			span:first-child {
				font-size: 14px;
				font-weight: 500;
				color: #303133;
				flex: 1;
				min-width: 0;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
			}

			.item-meta {
				display: flex;
				gap: 4px;
				flex-shrink: 0;
			}

			.item-time {
				font-size: 12px;
				color: #909399;
				flex-shrink: 0;
				margin-left: 8px;
			}
		}

		.item-desc {
			font-size: 13px;
			color: #606266;
			line-height: 1.6;
			overflow: hidden;
			text-overflow: ellipsis;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
			white-space: normal;
		}

		.item-footer {
			display: flex;
			gap: 6px;
			margin-top: 8px;
		}
	}

	.item-actions {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		align-items: flex-end;
		opacity: 0;
		transition: opacity 0.2s;
	}

	&:hover .item-actions {
		opacity: 1;
	}
}

.ml5 {
	margin-left: 6px;
}
</style>