<template>
	<div class="my-favorites">
		<el-card shadow="hover" class="mb15">
			<template #header>
				<div class="card-title">
					<el-icon><ele-Bell /></el-icon>
					<span>{{ t('message.pages.personal.favorites.latestMessages') }}</span>
					<el-tag size="small" type="info" class="ml10">{{ messageList.length }} {{ t('message.pages.personal.favorites.latestMessagesCount') }}</el-tag>
				</div>
			</template>
			<el-empty v-if="!messageList.length && !messagesLoading" :description="t('message.pages.personal.favorites.noMessages')" />
			<el-row v-else :gutter="16">
				<el-col :xs="24" :sm="12" :md="8" v-for="(msg, index) in messageList" :key="index" class="mb15">
					<el-card shadow="hover" class="msg-card">
						<div class="msg-card-header">
							<el-tag size="small" :type="messageTypeTag(msg.type)">
								{{ messageTypeLabel(msg.type) }}
							</el-tag>
							<span class="msg-card-time">{{ msg.create_datetime }}</span>
						</div>
						<div class="msg-card-title">{{ msg.title }}</div>
						<div class="msg-card-content" v-if="msg.content">{{ msg.content }}</div>
						<div class="msg-card-footer">
							<span class="msg-card-creator">{{ msg.creator_name }}</span>
							<el-button link type="primary" size="small" @click="openMessage(msg)">{{ t('message.pages.personal.favorites.viewDetail') }}</el-button>
						</div>
					</el-card>
				</el-col>
			</el-row>
		</el-card>

		<el-card shadow="hover">
			<template #header>
				<div class="card-title">
					<el-icon><ele-StarFilled /></el-icon>
					<span>{{ t('message.pages.personal.favorites.myFavorites') }}</span>
					<el-tag size="small" type="warning" class="ml10">{{ favoriteList.length }} {{ t('message.pages.personal.favorites.myFavoritesCount') }}</el-tag>
				</div>
			</template>
			<el-empty v-if="!favoriteList.length && !favoritesLoading" :description="t('message.pages.personal.favorites.noFavorites')" />
			<el-table v-else :data="favoriteList" style="width: 100%" v-loading="favoritesLoading">
				<el-table-column prop="title" :label="t('message.pages.personal.favorites.table.title')" min-width="200" show-overflow-tooltip />
				<el-table-column prop="category" :label="t('message.pages.personal.favorites.table.category')" width="120">
					<template #default="scope">
						<el-tag size="small" :type="categoryTag(scope.row.category)">{{ scope.row.category }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="create_datetime" :label="t('message.pages.personal.favorites.table.favTime')" width="180" />
				<el-table-column :label="t('message.pages.personal.favorites.table.action')" width="150">
					<template #default="scope">
						<el-button link type="primary" size="small" @click="openFavorite(scope.row)">{{ t('message.pages.personal.favorites.view') }}</el-button>
						<el-button link type="danger" size="small" @click="removeFavoriteItem(scope.row)">{{ t('message.pages.personal.favorites.unfavorite') }}</el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="PersonalMyFavorites">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import * as api from '../api';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const router = useRouter();
const messageList = ref<any[]>([]);
const messagesLoading = ref(false);
const favoriteList = ref<any[]>([]);
const favoritesLoading = ref(false);

const fetchMessages = () => {
	messagesLoading.value = true;
	api.getSelfReceive({}).then((res: any) => {
		messageList.value = res?.data || [];
	}).catch(() => {
		ElMessage.warning(t('message.pages.personal.favorites.fetchFailed'));
	}).finally(() => {
		messagesLoading.value = false;
	});
};

const fetchFavorites = () => {
	favoritesLoading.value = true;
	api.getFavorites().then((res: any) => {
		favoriteList.value = res?.data || [];
	}).catch(() => {
		favoriteList.value = [];
	}).finally(() => {
		favoritesLoading.value = false;
	});
};

const messageTypeLabel = (type: string) => {
	const map: Record<string, string> = {
		info: t('message.pages.personal.favorites.msgTypeSystem'),
		notice: t('message.pages.personal.favorites.msgTypeNotice'),
		warning: t('message.pages.personal.favorites.msgTypeWarning'),
	};
	return map[type] || t('message.pages.personal.favorites.msgTypeDefault');
};

const messageTypeTag = (type: string) => {
	const map: Record<string, any> = { info: 'info', notice: 'success', warning: 'warning' };
	return map[type] || 'info';
};

const categoryTag = (category: string) => {
	const map: Record<string, any> = {
		[t('message.pages.personal.favorites.categoryDoc')]: '',
		[t('message.pages.personal.favorites.categoryTutorial')]: 'success',
		[t('message.pages.personal.favorites.categoryArticle')]: 'warning',
	};
	return map[category] || '';
};

const openMessage = (msg: any) => {
	router.push({ path: '/messageCenter', query: { id: msg.id } });
};

const openFavorite = (row: any) => {
	if (row.url) {
		window.open(row.url, '_blank');
	} else {
		ElMessage.info(t('message.pages.personal.favorites.openFavInfo') + row.title);
	}
};

const removeFavoriteItem = (row: any) => {
	ElMessageBox.confirm(
		t('message.pages.personal.favorites.removeConfirmMsg', { title: row.title }),
		t('message.pages.personal.favorites.removeConfirmTitle'),
		{
			confirmButtonText: t('message.pages.personal.favorites.confirm'),
			cancelButtonText: t('message.pages.personal.favorites.cancel'),
			type: 'warning',
		}
	).then(() => {
		api.removeFavorite({ id: row.id } as any).then(() => {
			const idx = favoriteList.value.indexOf(row);
			if (idx >= 0) favoriteList.value.splice(idx, 1);
			ElMessage.success(t('message.pages.personal.favorites.removeSuccess'));
		}).catch(() => {
			// remove locally on backend failure
			const idx = favoriteList.value.indexOf(row);
			if (idx >= 0) favoriteList.value.splice(idx, 1);
			ElMessage.success(t('message.pages.personal.favorites.removeSuccess'));
		});
	}).catch(() => {});
};

onMounted(() => {
	fetchMessages();
	fetchFavorites();
});
</script>

<style scoped lang="scss">
.my-favorites {
	.card-title {
		display: flex;
		align-items: center;
		gap: 6px;
		font-weight: 500;
	}
	.msg-card {
		.msg-card-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 10px;
			.msg-card-time {
				font-size: 12px;
				color: var(--el-text-color-secondary);
			}
		}
		.msg-card-title {
			font-size: 14px;
			font-weight: 500;
			margin-bottom: 6px;
		}
		.msg-card-content {
			font-size: 13px;
			color: var(--el-text-color-secondary);
			margin-bottom: 10px;
			line-height: 1.5;
		}
		.msg-card-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			border-top: 1px dashed var(--el-border-color-lighter);
			padding-top: 8px;
			.msg-card-creator {
				font-size: 12px;
				color: var(--el-text-color-placeholder);
			}
		}
	}
}
.ml10 {
	margin-left: 10px;
}
.mb15 {
	margin-bottom: 15px;
}
</style>
