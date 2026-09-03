<template>
	<div class="upgrade-dialog">
		<el-dialog
			v-model="state.isUpgrade"
			:width="dialogWidth"
			destroy-on-close
			:show-close="mode === 'edition'"
			:close-on-click-modal="mode === 'edition'"
			:close-on-press-escape="mode === 'edition'"
		>
			<!-- ======================= 版本更新弹（原 mode=version）==================== -->
			<template v-if="mode === 'version'">
				<div class="upgrade-title">
					<div class="upgrade-title-warp">
						<span class="upgrade-title-warp-txt">{{ $t('message.upgrade.title') }}</span>
						<span class="upgrade-title-warp-version">v{{ state.version }}</span>
					</div>
				</div>
				<div class="upgrade-content">
					{{ getThemeConfig.globalTitle }} {{ $t('message.upgrade.msg') }}
					<div class="mt5">
						<el-link type="primary" class="font12" href="#" target="_black"> CHANGELOG.md </el-link>
					</div>
					<div class="upgrade-content-desc mt5">{{ $t('message.upgrade.desc') }}</div>
				</div>
				<div class="upgrade-btn">
					<el-button round size="default" type="info" text @click="onCancel">{{ $t('message.upgrade.btnOne') }}</el-button>
					<el-button type="primary" round size="default" @click="onVersionUpgrade" :loading="state.isLoading">{{ state.btnTxt }}</el-button>
				</div>
			</template>

			<!-- ======================= M1.8 Edition 升级引导弹（mode=edition）==================== -->
			<template v-else>
				<div class="edition-title">
					<div class="edition-title-wrap">
						<span class="edition-title-logo">🚀</span>
						<span class="edition-title-main">{{ t('message.pages.edition.dialogTitle') }}</span>
						<span class="edition-badge">{{ t('message.pages.edition.dialogBadge') }}</span>
					</div>
					<div class="edition-title-sub">{{ t('message.pages.edition.dialogSubtitle') }}</div>
				</div>

				<div class="edition-content">
					<!-- 功能对比矩阵（3 大核心卖点 + 具体条目） -->
					<div class="edition-matrix">
						<div class="edition-matrix-row header">
							<div class="col-func">{{ t('message.pages.edition.matrixHeaderFunc') }}</div>
							<div class="col-ce">{{ t('message.pages.edition.matrixHeaderCe') }}</div>
							<div class="col-ee">{{ t('message.pages.edition.matrixHeaderEe') }}</div>
						</div>
						<div v-for="row in editionMatrix" :key="row.name" class="edition-matrix-row">
							<div class="col-func">
								<strong>{{ row.name }}</strong>
								<div class="col-func-desc">{{ row.desc }}</div>
							</div>
							<div class="col-ce">
								<el-tag v-if="row.ce" type="success" effect="plain" size="small">✓</el-tag>
								<span v-else class="muted">{{ row.ceText }}</span>
							</div>
							<div class="col-ee">
								<el-tag type="warning" effect="dark" size="small">{{ row.ee }}</el-tag>
							</div>
						</div>
					</div>

					<!-- 当前 CE 配额信息 -->
					<div class="edition-quota">
						<strong>{{ t('message.pages.edition.quotaTitle') }}</strong>
						<ul>
							<li>{{ t('message.pages.edition.quotaMaxHosts') }}：<b>{{ quota.max_hosts ?? '∞' }}</b> 台</li>
							<li>{{ t('message.pages.edition.quotaMaxUsers') }}：<b>{{ quota.max_users ?? '∞' }}</b> 人</li>
							<li>{{ t('message.pages.edition.quotaMaxScheduledTasks') }}：<b>{{ quota.max_scheduled_tasks ?? '∞' }}</b> 条</li>
							<li>{{ t('message.pages.edition.quotaMaxConcurrentExecutions') }}：<b>{{ quota.max_concurrent_executions ?? '∞' }}</b> 个</li>
						</ul>
					</div>

					<!-- License 告警（仅 EE 才会出现） -->
					<div v-if="license && license.warnings && license.warnings.length" class="edition-warn">
						<el-alert
							v-for="(w, i) in license.warnings"
							:key="i"
							:title="w.message || w.code"
							type="warning"
							:closable="false"
							show-icon
						/>
					</div>
				</div>

				<div class="upgrade-btn edition-btn">
					<el-button round size="default" @click="onCancel">{{ t('message.pages.edition.btnDismiss') }}</el-button>
					<el-button round size="default" type="info" plain @click="onContactSales">{{ t('message.pages.edition.btnContactSales') }}</el-button>
					<el-button round size="default" type="primary" @click="onEditionUpgrade" :loading="state.isLoading">
						{{ t('message.pages.edition.btnRequestTrial') }}
					</el-button>
				</div>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="layoutUpgrade">
import { reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
import { Local, Session } from '/@/utils/storage';
// M1.8 Edition
import { useEdition } from '/@/editions/index';

type UpgradeMode = 'version' | 'edition';

const props = defineProps<{
	/** version = 版本更新；edition = CE→EE 商业版引导 */
	mode?: UpgradeMode;
}>();

// define variables
const { t } = useI18n();
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);

const { quota, license, upgrade, ensureLoaded: _ensureEdition } = useEdition();

const state = reactive({
	isUpgrade: false,
	// @ts-ignore
	version: __VERSION__,
	isLoading: false,
	btnTxt: '',
});

const dialogWidth = computed(() => (props.mode === 'edition' ? '720px' : '300px'));

// Edition 功能对比矩阵（精选 7 条最有价值的差异项，不必枚举所有）
const MAT_KEYS = ['Dag', 'Approval', 'Ha', 'Scan', 'Program', 'Ext', 'Support'] as const;
const editionMatrix = computed(() =>
	MAT_KEYS.map((k) => {
		const name = t(`message.pages.edition.mat${k}Name`);
		const desc = t(`message.pages.edition.mat${k}Desc`);
		const ceText = t(`message.pages.edition.mat${k}Ce`);
		const ee = t(`message.pages.edition.mat${k}Ee`);
		const ce = ceText === '—' || ceText === '–' ? false : ceText;
		return { name, desc, ce, ceText: ce ? ceText : ceText, ee };
	})
);

// get layout config info
const getThemeConfig = computed(() => {
	return themeConfig.value;
});

// 记录 CE banner 展示时间（每 7 天弹一次）
const CE_BANNER_LAST_TS = 'taurus.ce_banner_last_shown_at';
function _touchCeBannerShown() {
	try {
		Local.set(CE_BANNER_LAST_TS, Date.now());
	} catch (_e) { /* noop */ }
}

// silently refuse
const onCancel = () => {
	state.isUpgrade = false;
	Session.set('isUpgrade', false);
	// 版本升级弹窗：必须持久化 version，否则每次刷新都会重弹
	// edition 弹窗走下面的 _touchCeBannerShown（7 天节流）
	if (props.mode === 'version') {
		// @ts-ignore __VERSION__ 由 vite define 在编译时注入
		Local.set('version', state.version || __VERSION__);
	} else {
		_touchCeBannerShown();
	}
};

// ==================================== 原版本升级按钮 ====================================
const onVersionUpgrade = () => {
	state.isLoading = true;
	state.btnTxt = t('message.upgrade.btnTwoLoading');
	setTimeout(() => {
		// 先持久化 version（必须在 reload 之前，否则 reload 后 JS 上下文重置就写不上了）
		// @ts-ignore __VERSION__ 由 vite define 在编译时注入
		Local.set('version', state.version || __VERSION__);
		Session.set('isUpgrade', false);
		window.location.reload();
	}, 2000);
};

// ==================================== Edition 升级按钮 ====================================
const onEditionUpgrade = () => {
	state.isLoading = true;
	setTimeout(() => {
		// 优先跳后端设置的 upgrade.contact_url；否则 fallback 到站内 ContactLead 表单
		const url = (upgrade && upgrade.value && upgrade.value.contact_url) || '/#/taurus/contact-lead';
		if (url && /^https?:\/\//.test(url)) {
			window.open(url, '_blank');
		} else {
			window.location.hash = (url || '/').replace(/^#/, '');
		}
		state.isLoading = false;
		_touchCeBannerShown();
		state.isUpgrade = false;
	}, 800);
};

const onContactSales = () => {
	// 直接落到联系销售表单页
	window.location.hash = '/taurus/contact-lead';
	state.isUpgrade = false;
	_touchCeBannerShown();
};

// ==================================== 自动弹出 ====================================
const delayShow = async () => {
	if (props.mode === 'edition') {
		await _ensureEdition(false);
	}
	const isUpgrade = Session.get('isUpgrade') === false ? Session.get('isUpgrade') : true;
	// mode=edition：不管 Session.isUpgrade，按 App.vue showEditionBanner 控制是否 render；
	//            这里只是延迟展示，避免进入首屏时闪
	const shownFlag = props.mode === 'edition' ? true : isUpgrade;
	if (shownFlag) {
		setTimeout(() => {
			state.isUpgrade = true;
		}, 1200);
	}
};

// on mount
onMounted(() => {
	delayShow();
	setTimeout(() => {
		state.btnTxt = t('message.upgrade.btnTwo');
	}, 200);
});
</script>

<style scoped lang="scss">
.upgrade-dialog {
	:deep(.el-dialog) {
		.el-dialog__body {
			padding: 0 !important;
		}
		.el-dialog__header {
			display: none !important;
		}
		.upgrade-title {
			text-align: center;
			height: 130px;
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;
			&::after {
				content: '';
				position: absolute;
				background-color: var(--el-color-primary-light-1);
				width: 130%;
				height: 130px;
				border-bottom-left-radius: 100%;
				border-bottom-right-radius: 100%;
			}
			.upgrade-title-warp {
				z-index: 1;
				position: relative;
				.upgrade-title-warp-txt {
					color: var(--next-color-white);
					font-size: 22px;
					letter-spacing: 3px;
				}
				.upgrade-title-warp-version {
					color: var(--next-color-white);
					background-color: var(--el-color-primary-light-4);
					font-size: 12px;
					position: absolute;
					display: flex;
					top: -2px;
					right: -50px;
					padding: 2px 4px;
					border-radius: 2px;
				}
			}
		}
		.upgrade-content {
			padding: 20px;
			line-height: 22px;
			.upgrade-content-desc {
				color: var(--el-color-info-light-5);
				font-size: 12px;
			}
		}
		.upgrade-btn {
			border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
			display: flex;
			justify-content: space-around;
			padding: 15px 20px;
			.el-button {
				width: 100%;
				& + .el-button {
					margin-left: 12px;
				}
			}
		}

		/* ================= Edition 模式样式 ================= */
		.edition-title {
			padding: 28px 24px 22px;
			text-align: center;
			background: linear-gradient(135deg, var(--el-color-primary-light-2), var(--el-color-primary));
			color: #fff;
			.edition-title-wrap {
				display: inline-flex;
				align-items: center;
				gap: 10px;
				.edition-title-logo {
					font-size: 28px;
				}
				.edition-title-main {
					font-size: 22px;
					font-weight: 600;
				}
				.edition-badge {
					background: rgba(255, 255, 255, 0.9);
					color: var(--el-color-primary);
					font-size: 12px;
					font-weight: 700;
					padding: 2px 8px;
					border-radius: 3px;
					letter-spacing: 1px;
				}
			}
			.edition-title-sub {
				margin-top: 10px;
				font-size: 13px;
				opacity: 0.92;
			}
		}
		.edition-content {
			padding: 18px 24px 6px;
			max-height: 440px;
			overflow-y: auto;
			.edition-matrix {
				border: 1px solid var(--el-border-color-lighter, #ebeef5);
				border-radius: 6px;
				overflow: hidden;
				font-size: 13px;
				.edition-matrix-row {
					display: grid;
					grid-template-columns: 1.8fr 0.7fr 0.9fr;
					align-items: center;
					padding: 10px 12px;
					border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
					&.header {
						border-top: none;
						background: var(--el-fill-color-light, #f5f7fa);
						font-weight: 600;
						text-align: center;
					}
					.col-func {
						text-align: left;
						.col-func-desc {
							color: var(--el-text-color-secondary, #909399);
							font-size: 12px;
							font-weight: normal;
							margin-top: 2px;
							line-height: 16px;
						}
					}
					.col-ce,
					.col-ee {
						text-align: center;
						.muted {
							color: var(--el-text-color-placeholder, #c0c4cc);
						}
					}
				}
			}
			.edition-quota {
				margin-top: 16px;
				padding: 10px 14px;
				border-radius: 6px;
				background: var(--el-fill-color-light, #f5f7fa);
				font-size: 12px;
				ul {
					margin: 6px 0 0 18px;
					padding: 0;
					li {
						line-height: 22px;
						color: var(--el-text-color-regular, #606266);
						b {
							color: var(--el-color-primary);
						}
					}
				}
			}
			.edition-warn {
				margin-top: 12px;
			}
		}
	}
}
</style>