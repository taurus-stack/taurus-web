<template>
	<div class="upgrade-dialog">
		<el-dialog
			v-model="state.isUpgrade"
			:width="dialogWidth"
			destroy-on-close
			:show-close="mode === 'edition'"
			:close-on-click-modal="mode === 'edition'"
			:close-on-press-escape="mode === 'edition'"
			@close="emit('close')"
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

			<!-- ======================= 服务等级 / 授权升级引导（mode=edition）==================== -->
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
					<!-- 当前授权状态 -->
					<div class="edition-status">
						<el-tag :type="stateTagType" effect="dark" size="default">{{ stateLabel }}</el-tag>
						<span class="edition-status-tier">{{ tierLabel }}</span>
						<span v-if="license.customer_name" class="edition-status-customer">{{ license.customer_name }}</span>
						<div class="edition-status-meta">
							<span>{{ t('message.pages.edition.fieldExpires') }}：{{ license.expires_at || t('message.pages.edition.expiresNone') }}</span>
							<span v-if="license.state === 'grace' && license.grace_days_left !== null">
								{{ t('message.pages.edition.graceLeft', { days: license.grace_days_left }) }}
							</span>
							<span v-if="license.fingerprint_ok === false" class="is-danger">
								{{ t('message.pages.edition.fingerprintBad') }}
							</span>
						</div>
					</div>

					<!-- 宽限 / 阻断 / 指纹等告警 -->
					<div v-if="license.warnings && license.warnings.length" class="edition-warn">
						<el-alert
							v-for="(w, i) in license.warnings"
							:key="i"
							:title="w.message || w.code"
							:type="license.state === 'blocked' ? 'error' : 'warning'"
							:closable="false"
							show-icon
						/>
					</div>

					<!-- 主机配额用量 -->
					<div class="edition-quota">
						<strong>{{ t('message.pages.edition.hostQuotaTitle') }}</strong>
						<div class="edition-quota-usage">
							<template v-if="quota.max_hosts === null">
								{{ t('message.pages.edition.hostUsageUnlimited', { used: license.hosts_used ?? 0 }) }}
							</template>
							<template v-else>
								<el-progress
									:percentage="hostUsagePct"
									:status="hostUsagePct >= 100 ? 'exception' : undefined"
									:stroke-width="10"
									class="edition-quota-bar"
								/>
								<span>
									{{ t('message.pages.edition.hostUsage', { used: license.hosts_used ?? 0, total: quota.max_hosts }) }}
								</span>
							</template>
						</div>
						<div class="edition-quota-note">{{ t('message.pages.edition.otherQuotaNote') }}</div>
					</div>

					<!-- 服务等级权益 -->
					<div class="edition-entitle">
						<div class="edition-entitle-row">
							<span class="k">{{ t('message.pages.edition.svcLevel') }}</span>
							<span class="v">{{ license.service_level?.level || '—' }}</span>
						</div>
						<div class="edition-entitle-row">
							<span class="k">{{ t('message.pages.edition.svcSla') }}</span>
							<span class="v">{{ license.service_level?.sla || '—' }}</span>
						</div>
						<div class="edition-entitle-row">
							<span class="k">{{ t('message.pages.edition.svcChannels') }}</span>
							<span class="v">{{ (license.service_level?.channels || []).join('、') || '—' }}</span>
						</div>
						<div class="edition-entitle-row">
							<span class="k">{{ t('message.pages.edition.branding') }}</span>
							<span class="v">
								<el-tag :type="license.branding_allowed ? 'success' : 'info'" size="small">
									{{ license.branding_allowed ? t('message.pages.edition.brandingAllowed') : t('message.pages.edition.brandingDenied') }}
								</el-tag>
							</span>
						</div>
						<div class="edition-entitle-row">
							<span class="k">{{ t('message.pages.edition.updateChannels') }}</span>
							<span class="v">{{ (license.update_channels || []).join('、') }}</span>
						</div>
					</div>

					<!-- 免费版 vs 商业授权 对比 -->
					<div class="edition-compare-title">{{ t('message.pages.edition.compareTitle') }}</div>
					<div class="edition-matrix">
						<div class="edition-matrix-row header">
							<div class="col-func">{{ t('message.pages.edition.matrixHeaderFunc') }}</div>
							<div class="col-ce">{{ t('message.pages.edition.matrixHeaderFree') }}</div>
							<div class="col-ee">{{ t('message.pages.edition.matrixHeaderPaid') }}</div>
						</div>
						<div v-for="row in compareRows" :key="row.name" class="edition-matrix-row">
							<div class="col-func">
								<strong>{{ row.name }}</strong>
								<div class="col-func-desc">{{ row.desc }}</div>
							</div>
							<div class="col-ce">{{ row.free }}</div>
							<div class="col-ee">{{ row.paid }}</div>
						</div>
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
import { useEdition } from '/@/editions/index';
import type { LicenseState, TierName } from '/@/api/taurus/edition/api';

type UpgradeMode = 'version' | 'edition';

const props = defineProps<{
	/** version = 版本更新；edition = 服务等级/授权升级引导 */
	mode?: UpgradeMode;
}>();
const emit = defineEmits<{
	(e: 'close'): void;
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

// ---------------- License 四态展示 ----------------
const stateTagType = computed<'info' | 'success' | 'warning' | 'error'>(() => {
	const s: LicenseState = license.value.state;
	if (s === 'licensed') return 'success';
	if (s === 'grace') return 'warning';
	if (s === 'blocked') return 'error';
	return 'info';
});
const stateLabel = computed(() => {
	const map: Record<LicenseState, string> = {
		free: t('message.pages.edition.stateFree'),
		licensed: t('message.pages.edition.stateLicensed'),
		grace: t('message.pages.edition.stateGrace'),
		blocked: t('message.pages.edition.stateBlocked'),
	};
	return map[license.value.state] || map.free;
});
const tierLabel = computed(() => {
	const tier: TierName = license.value.tier || 'community';
	return t(`message.pages.edition.tier${tier.charAt(0).toUpperCase()}${tier.slice(1)}`);
});
const hostUsagePct = computed(() => {
	const max = quota.value.max_hosts;
	if (!max || max <= 0) return 0;
	const used = license.value.hosts_used ?? 0;
	return Math.min(100, Math.round((used / max) * 100));
});

// ---------------- 免费版 vs 商业授权 对比 ----------------
const COMPARE_KEYS = ['Features', 'Hosts', 'Branding', 'Grace', 'Channels', 'Support'] as const;
const compareRows = computed(() =>
	COMPARE_KEYS.map((k) => ({
		name: t(`message.pages.edition.cmp${k}Name`),
		desc: t(`message.pages.edition.cmp${k}Desc`),
		free: t(`message.pages.edition.cmp${k}Free`),
		paid: t(`message.pages.edition.cmp${k}Paid`),
	}))
);

// get layout config info
const getThemeConfig = computed(() => {
	return themeConfig.value;
});

// silently refuse
const onCancel = () => {
	state.isUpgrade = false;
	Session.set('isUpgrade', false);
	// 版本升级弹窗：必须持久化 version，否则每次刷新都会重弹
	if (props.mode === 'version') {
		// @ts-ignore __VERSION__ 由 vite define 在编译时注入
		Local.set('version', state.version || __VERSION__);
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

// ==================================== 服务等级升级按钮 ====================================
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
		state.isUpgrade = false;
	}, 800);
};

const onContactSales = () => {
	// 直接落到联系销售表单页
	window.location.hash = '/taurus/contact-lead';
	state.isUpgrade = false;
};

// ==================================== 自动弹出 ====================================
const delayShow = async () => {
	if (props.mode === 'edition') {
		await _ensureEdition(false);
	}
	const isUpgrade = Session.get('isUpgrade') === false ? Session.get('isUpgrade') : true;
	// mode=edition：由 App.vue showEditionBanner 控制是否 render；这里仅延迟展示避免首屏闪烁
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
			max-height: 460px;
			overflow-y: auto;
			.edition-status {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 10px;
				font-size: 13px;
				.edition-status-tier {
					font-weight: 600;
					color: var(--el-text-color-primary, #303133);
				}
				.edition-status-customer {
					color: var(--el-text-color-secondary, #909399);
				}
				.edition-status-meta {
					flex-basis: 100%;
					display: flex;
					flex-wrap: wrap;
					gap: 14px;
					color: var(--el-text-color-secondary, #909399);
					font-size: 12px;
					.is-danger {
						color: var(--el-color-danger);
					}
				}
			}
			.edition-warn {
				margin-top: 12px;
			}
			.edition-quota {
				margin-top: 14px;
				padding: 12px 14px;
				border-radius: 6px;
				background: var(--el-fill-color-light, #f5f7fa);
				font-size: 13px;
				.edition-quota-usage {
					display: flex;
					align-items: center;
					gap: 12px;
					margin-top: 8px;
					.edition-quota-bar {
						flex: 1;
						max-width: 320px;
					}
				}
				.edition-quota-note {
					margin-top: 6px;
					font-size: 12px;
					color: var(--el-text-color-secondary, #909399);
				}
			}
			.edition-entitle {
				margin-top: 14px;
				font-size: 13px;
				.edition-entitle-row {
					display: flex;
					padding: 6px 0;
					border-bottom: 1px dashed var(--el-border-color-lighter, #ebeef5);
					.k {
						width: 96px;
						flex-shrink: 0;
						color: var(--el-text-color-secondary, #909399);
					}
					.v {
						flex: 1;
						color: var(--el-text-color-regular, #606266);
					}
				}
			}
			.edition-compare-title {
				margin: 16px 0 8px;
				font-size: 13px;
				font-weight: 600;
				color: var(--el-text-color-primary, #303133);
			}
			.edition-matrix {
				border: 1px solid var(--el-border-color-lighter, #ebeef5);
				border-radius: 6px;
				overflow: hidden;
				font-size: 13px;
				.edition-matrix-row {
					display: grid;
					grid-template-columns: 1.8fr 0.9fr 0.9fr;
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
						color: var(--el-text-color-regular, #606266);
					}
				}
			}
		}
	}
}
</style>
