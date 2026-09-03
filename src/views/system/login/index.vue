<template>
	<div class="login-wrapper">
		<div class="login-container">
			<div class="login-left">
				<div class="login-left-brand">
					<img :src="siteLogo" class="login-left-logo" />
					<div class="login-left-title">
						<h1>{{ t('message.siteTitle') }}</h1>
						<p>
							{{ t('message.siteName') }}
							<span v-if="editionLoaded" class="login-edition-badge" :class="'is-' + edition">
								{{ edition === 'enterprise' ? t('message.editionEnterprise') : t('message.editionCommunity') }}
							</span>
						</p>
					</div>
				</div>
				<div class="login-left-illustration">
					<img :src="loginMain" />
				</div>
				<div class="login-left-features">
					<div class="feature-item">
						<div class="feature-icon">⚡</div>
						<div class="feature-text">
							<strong>{{ t('message.efficientOps') }}</strong>
							<span>{{ t('message.oneClickBatchOps') }}</span>
						</div>
					</div>
					<div class="feature-item">
						<div class="feature-icon">🔒</div>
						<div class="feature-text">
							<strong>{{ t('message.secureControllable') }}</strong>
							<span>{{ t('message.approvalAndTrace') }}</span>
						</div>
					</div>
					<div class="feature-item">
						<div class="feature-icon">🔀</div>
						<div class="feature-text">
							<strong>{{ t('message.workflowOrchestration') }}</strong>
							<span>{{ t('message.visualAutomation') }}</span>
						</div>
					</div>
				</div>
			</div>
			<div class="login-right">
				<el-dropdown trigger="click" @command="onLanguageChange" class="login-lang-switch">
					<div class="login-lang-switch-btn">
						<el-icon><ele-Location /></el-icon>
						<span class="lang-current">{{ LANG_LABELS[locale] }}</span>
					</div>
					<template #dropdown>
						<el-dropdown-menu>
							<el-dropdown-item command="zh-cn" :disabled="locale === 'zh-cn'">简体中文</el-dropdown-item>
							<el-dropdown-item command="en" :disabled="locale === 'en'">English</el-dropdown-item>
							<el-dropdown-item command="zh-tw" :disabled="locale === 'zh-tw'">繁體中文</el-dropdown-item>
						</el-dropdown-menu>
					</template>
				</el-dropdown>
				<div class="login-card">
					<div class="login-card-header">
						<h2>{{ t('message.siteTitle') }}</h2>
						<p>{{ t('message.welcomeMessage') }}</p>
					</div>
					<div class="login-card-body">
						<el-tabs v-model="state.tabsActiveName" class="login-tabs">
							<el-tab-pane :label="$t('message.label.one1')" name="account">
								<Account />
							</el-tab-pane>
						</el-tabs>
					</div>
				</div>
				<div class="login-authorization">
					<p>Copyright © {{ t('message.copyright2021Taurus') }} </p>
					<p class="la-other">
						<a href="https://beian.miit.gov.cn" target="_blank">{{ t('message.icpFiling18005113') }}</a>
						<span class="divider">|</span>
						<a :href="SITE_LINKS.help" target="_blank">{{ t('message.help') }}</a>
						<span class="divider">|</span>
						<a :href="SITE_LINKS.privacy" target="_blank">{{ t('message.privacy') }}</a>
						<span class="divider">|</span>
						<a :href="SITE_LINKS.terms" target="_blank">{{ t('message.terms') }}</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="loginIndex">
import { defineAsyncComponent, onMounted, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
import { Local } from '/@/utils/storage';
import { NextLoading } from '/@/utils/loading';
import { useEditionStore } from '/@/editions';
import logoMini from '/src/assets/logo-mini.svg';
import loginMain from '/@/assets/login-main.svg';
// Import components
const Account = defineAsyncComponent(() => import('/@/views/system/login/component/account.vue'));

// 前端硬编码的站点链接，替代后端数据库配置
const SITE_LINKS = {
	help: 'https://github.com/your-org/taurus-web/wiki',
	privacy: '#',
	terms: '#',
};

// 语言代码 -> 显示标签
const LANG_LABELS: Record<string, string> = {
	'zh-cn': '简体中文',
	en: 'English',
	'zh-tw': '繁體中文',
};

// Define reactive state
const state = reactive({
	tabsActiveName: 'account',
});

// 使用前端静态资源，不再从后端获取
const siteLogo = logoMini;

// i18n + 主题配置（用于语言切换持久化）
import { useI18n } from 'vue-i18n';
const { t, locale } = useI18n();
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);

// Edition store — 登录页也要显示 CE/EE 标识
const editionStore = useEditionStore();
const { edition, loaded: editionLoaded } = storeToRefs(editionStore);

// 切换语言：更新 i18n + 持久化到 localStorage
const onLanguageChange = (lang: string) => {
	themeConfig.value.globalI18n = lang;
	Local.remove('themeConfig');
	Local.set('themeConfig', themeConfig.value);
	locale.value = lang;
};

// On page load
onMounted(() => {
	// 从 localStorage 恢复语言设置
	const saved = Local.get('themeConfig')?.globalI18n;
	if (saved) locale.value = saved;
	// 拉取 Edition 信息（登录前也能访问，失败回退 community）
	editionStore.ensureLoaded();
	NextLoading.done();
});
</script>

<style scoped lang="scss">
.login-wrapper {
	width: 100%;
	height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f0f4f8;
	position: relative;
	overflow: hidden;
}

.login-container {
	width: 100%;
	max-width: 1200px;
	height: 580px;
	display: flex;
	border-radius: 16px;
	overflow: hidden;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
	background: var(--el-color-white);
}

.login-left {
	flex: 1;
	position: relative;
	background: linear-gradient(135deg, #409eff 0%, #2b7fd3 50%, #1e6bb8 100%);
	padding: 36px 40px;
	display: flex;
	flex-direction: column;
	color: #fff;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -30%;
		width: 600px;
		height: 600px;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
		border-radius: 50%;
		pointer-events: none;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: -20%;
		right: -10%;
		width: 400px;
		height: 400px;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
		border-radius: 50%;
		pointer-events: none;
	}

	.login-left-brand {
		display: flex;
		align-items: center;
		gap: 14px;
		position: relative;
		z-index: 2;

		.login-left-logo {
			width: 44px;
			height: 44px;
			background: rgba(255, 255, 255, 0.2);
			border-radius: 10px;
			padding: 4px;
		}

		.login-left-title {
			h1 {
				margin: 0;
				font-size: 22px;
				font-weight: 600;
				color: #fff;
				line-height: 1.3;
			}

			p {
				margin: 2px 0 0;
				font-size: 13px;
				color: rgba(255, 255, 255, 0.8);
				display: flex;
				align-items: center;
				gap: 8px;
			}
		}
	}

	.login-edition-badge {
		display: inline-block;
		font-size: 11px;
		font-weight: 600;
		line-height: 1;
		padding: 3px 8px;
		border-radius: 10px;
		letter-spacing: 0.5px;
		backdrop-filter: blur(4px);
		white-space: nowrap;

		&.is-community {
			background: rgba(255, 255, 255, 0.2);
			color: rgba(255, 255, 255, 0.9);
			border: 1px solid rgba(255, 255, 255, 0.3);
		}

		&.is-enterprise {
			background: linear-gradient(135deg, #f39c12, #e67e22);
			color: #fff;
			border: none;
			box-shadow: 0 2px 6px rgba(243, 156, 18, 0.4);
		}
	}

	.login-left-illustration {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		z-index: 1;
		padding: 12px 0;

		img {
			max-width: 100%;
			max-height: 220px;
			filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15));
		}
	}

	.login-left-features {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		gap: 10px;

		.feature-item {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 8px 12px;
			background: rgba(255, 255, 255, 0.12);
			border-radius: 10px;
			backdrop-filter: blur(10px);
			transition: all 0.3s;

			&:hover {
				background: rgba(255, 255, 255, 0.2);
				transform: translateX(4px);
			}

			.feature-icon {
				font-size: 18px;
				flex-shrink: 0;
			}

			.feature-text {
				strong {
					display: block;
					font-size: 13px;
					font-weight: 500;
					color: #fff;
				}

				span {
					font-size: 11px;
					color: rgba(255, 255, 255, 0.75);
				}
			}
		}
	}
}

.login-lang-switch {
	position: absolute;
	top: 24px;
	right: 24px;
	z-index: 10;
}

.login-lang-switch-btn {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 6px 12px;
	border-radius: 20px;
	font-size: 13px;
	color: var(--el-text-color-secondary);
	cursor: pointer;
	background: transparent;
	transition: all 0.2s;

	&:hover {
		color: var(--el-color-primary);
		background: var(--el-color-primary-light-9);
	}
}

.login-right {
	width: 480px;
	flex-shrink: 0;
	background: var(--el-color-white);
	display: flex;
	flex-direction: column;
	padding: 48px 40px 32px;
	position: relative;
}

.login-card {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.login-card-header {
	text-align: center;
	margin-bottom: 24px;

	h2 {
		margin: 0 0 6px;
		font-size: 24px;
		font-weight: 600;
		color: var(--el-text-color-primary);
	}

	p {
		margin: 0;
		font-size: 13px;
		color: var(--el-text-color-secondary);
	}
}

.login-card-body {
	flex: 1;

	.login-tabs {
		:deep(.el-tabs__nav-wrap::after) {
			display: none;
		}

		:deep(.el-tabs__item) {
			font-size: 14px;
			font-weight: 500;
		}

		:deep(.el-tabs__active-bar) {
			background-color: var(--el-color-primary);
			height: 2px;
		}
	}
}

.login-authorization {
	margin-top: 20px;
	text-align: center;

	p {
		margin: 0;
		font-size: 12px;
		color: var(--el-text-color-placeholder);
		line-height: 1.8;
	}

	a {
		color: var(--el-text-color-secondary);
		text-decoration: none;
		transition: color 0.2s;

		&:hover {
			color: var(--el-color-primary);
		}
	}

	.divider {
		margin: 0 6px;
		color: var(--el-border-color);
	}
}

@media screen and (max-width: 1024px) {
	.login-container {
		flex-direction: column;
		height: auto;
		max-width: 480px;
	}

	.login-left {
		padding: 32px 28px;
	}

	.login-left-illustration {
		padding: 12px 0;

		img {
			max-height: 180px;
		}
	}

	.login-left-features {
		display: none;
	}

	.login-right {
		width: 100%;
		padding: 32px 28px 24px;
	}
}

@media screen and (max-width: 600px) {
	.login-wrapper {
		padding: 16px;
	}

	.login-container {
		border-radius: 12px;
	}

	.login-left {
		padding: 24px 20px;
	}

	.login-left-brand {
		.login-left-logo {
			width: 36px;
			height: 36px;
		}

		.login-left-title {
			h1 {
				font-size: 18px;
			}

			p {
				font-size: 12px;
			}
		}
	}

	.login-right {
		padding: 24px 20px 16px;
	}

	.login-card-header {
		h2 {
			font-size: 20px;
		}
	}
}
</style>