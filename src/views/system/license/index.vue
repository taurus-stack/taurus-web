<template>
	<div class="license-page">
		<!-- 宽限 / 阻断告警 -->
		<el-alert
			v-if="isBlocked"
			:title="t('message.pages.edition.blockedHint')"
			type="error"
			show-icon
			:closable="false"
			class="license-alert"
		/>
		<template v-else-if="isGrace">
			<el-alert
				v-for="(w, i) in warnings"
				:key="i"
				:title="w.message || w.code"
				type="warning"
				show-icon
				:closable="false"
				class="license-alert"
			/>
		</template>

		<el-card shadow="never" class="license-card">
			<template #header>
				<div class="license-card-header">
					<span>{{ t('message.pages.edition.pageTitle') }}</span>
					<el-button size="small" :loading="refreshing" @click="onRefresh">
						{{ t('message.pages.edition.pageRefresh') }}
					</el-button>
				</div>
			</template>

			<div class="license-page-sub">{{ t('message.pages.edition.pageSubtitle') }}</div>

			<el-descriptions :column="2" border class="license-desc">
				<el-descriptions-item :label="t('message.pages.edition.fieldState')">
					<el-tag :type="stateTagType" effect="dark">{{ stateLabel }}</el-tag>
				</el-descriptions-item>
				<el-descriptions-item :label="t('message.pages.edition.fieldTier')">
					{{ tierLabel }}
				</el-descriptions-item>
				<el-descriptions-item :label="t('message.pages.edition.fieldCustomer')">
					{{ license.customer_name || '—' }}
				</el-descriptions-item>
				<el-descriptions-item :label="t('message.pages.edition.fieldCustomerId')">
					{{ license.customer_id || '—' }}
				</el-descriptions-item>
				<el-descriptions-item :label="t('message.pages.edition.fieldExpires')">
					{{ license.expires_at || t('message.pages.edition.expiresNone') }}
				</el-descriptions-item>
				<el-descriptions-item :label="t('message.pages.edition.fieldFingerprint')">
					<el-tag :type="license.fingerprint_ok === false ? 'danger' : 'success'" size="small">
						{{ license.fingerprint_ok === false
							? t('message.pages.edition.fingerprintFail')
							: t('message.pages.edition.fingerprintOk') }}
					</el-tag>
				</el-descriptions-item>
			</el-descriptions>

			<!-- 主机配额用量 -->
			<div class="license-hosts">
				<div class="license-hosts-head">
					<strong>{{ t('message.pages.edition.hostQuotaTitle') }}</strong>
					<span v-if="maxHosts !== null">
						{{ t('message.pages.edition.hostUsage', { used: hostsUsed, total: maxHosts }) }}
					</span>
					<span v-else>{{ t('message.pages.edition.hostUsageUnlimited', { used: hostsUsed }) }}</span>
				</div>
				<el-progress
					v-if="maxHosts !== null"
					:percentage="hostUsagePct"
					:status="hostUsagePct >= 100 ? 'exception' : undefined"
					:stroke-width="14"
				/>
			</div>
		</el-card>

		<!-- 配额明细 -->
		<el-card shadow="never" class="license-card">
			<template #header>{{ t('message.pages.edition.quotaDetailTitle') }}</template>
			<el-table :data="quotaRows" border size="default">
				<el-table-column prop="label" :label="t('message.pages.edition.matrixHeaderFunc')" />
				<el-table-column :label="t('message.pages.edition.matrixHeaderPaid')" width="220">
					<template #default="{ row }">
						<span v-if="row.value === null">{{ t('message.pages.edition.quotaUnlimited') }}</span>
						<span v-else>{{ row.value }}<span v-if="row.unit" class="license-quota-unit">（{{ row.unit }}）</span></span>
					</template>
				</el-table-column>
			</el-table>
			<div class="license-quota-note">{{ t('message.pages.edition.otherQuotaNote') }}</div>
		</el-card>

		<!-- 服务等级权益 -->
		<el-card shadow="never" class="license-card">
			<template #header>{{ tierLabel }}</template>
			<el-descriptions :column="1" border>
				<el-descriptions-item :label="t('message.pages.edition.svcLevel')">
					{{ license.service_level?.level || '—' }}
				</el-descriptions-item>
				<el-descriptions-item :label="t('message.pages.edition.svcSla')">
					{{ license.service_level?.sla || '—' }}
				</el-descriptions-item>
				<el-descriptions-item :label="t('message.pages.edition.svcChannels')">
					<el-tag
						v-for="(c, i) in license.service_level?.channels || []"
						:key="i"
						size="small"
						class="license-channel-tag"
					>
						{{ c }}
					</el-tag>
					<span v-if="!(license.service_level?.channels || []).length">—</span>
				</el-descriptions-item>
				<el-descriptions-item :label="t('message.pages.edition.branding')">
					<el-tag :type="license.branding_allowed ? 'success' : 'info'" size="small">
						{{ license.branding_allowed
							? t('message.pages.edition.brandingAllowed')
							: t('message.pages.edition.brandingDenied') }}
					</el-tag>
				</el-descriptions-item>
				<el-descriptions-item :label="t('message.pages.edition.updateChannels')">
					<el-tag
						v-for="(c, i) in license.update_channels || []"
						:key="i"
						size="small"
						type="info"
						class="license-channel-tag"
					>
						{{ c }}
					</el-tag>
				</el-descriptions-item>
			</el-descriptions>
		</el-card>

		<!-- 功能模块（全部开放） -->
		<el-card shadow="never" class="license-card">
			<template #header>
				<div class="license-card-header">
					<span>{{ t('message.pages.edition.featuresTitle') }}</span>
					<span class="license-feature-count">
						{{ t('message.pages.edition.featuresCount', { count: featureCount }) }}
					</span>
				</div>
			</template>
			<el-collapse v-if="featureGroups.length">
				<el-collapse-item v-for="g in featureGroups" :key="g.group" :title="g.group" :name="g.group">
					<el-tag
						v-for="item in g.items"
						:key="item.code"
						size="small"
						type="success"
						effect="plain"
						class="license-feature-tag"
					>
						{{ item.name || item.code }}
					</el-tag>
				</el-collapse-item>
			</el-collapse>
		</el-card>

		<el-alert type="info" :closable="false" show-icon class="license-alert">
			<div class="license-footer">
				<span>{{ t('message.pages.edition.importHint') }}</span>
				<el-button size="small" type="primary" @click="onContact">
					{{ t('message.pages.edition.contactCta') }}
				</el-button>
			</div>
		</el-alert>
	</div>
</template>

<script setup lang="ts" name="systemLicense">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEdition } from '/@/editions/index';
import type { LicenseState, TierName, EditionQuota } from '/@/api/taurus/edition/api';

const { t } = useI18n();
const { license, quota, tier, featureGroups, ensureLoaded } = useEdition();

const refreshing = ref(false);

const isBlocked = computed(() => license.value.state === 'blocked');
const isGrace = computed(() => license.value.state === 'grace');
const warnings = computed(() => license.value.warnings || []);
const maxHosts = computed(() => quota.value.max_hosts ?? null);
const hostsUsed = computed(() => license.value.hosts_used ?? 0);
const featureCount = computed(() => featureGroups.value.reduce((n, g) => n + (g.items?.length || 0), 0));

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
	const name: TierName = license.value.tier || tier.value || 'community';
	return t(`message.pages.edition.tier${name.charAt(0).toUpperCase()}${name.slice(1)}`);
});
const hostUsagePct = computed(() => {
	const max = maxHosts.value;
	if (!max || max <= 0) return 0;
	return Math.min(100, Math.round((hostsUsed.value / max) * 100));
});

const QUOTA_FIELDS: Array<{ key: keyof EditionQuota; labelKey: string; unit?: string }> = [
	{ key: 'max_hosts', labelKey: 'quotaMaxHosts' },
	{ key: 'max_users', labelKey: 'quotaMaxUsers' },
	{ key: 'max_scheduled_tasks', labelKey: 'quotaMaxScheduledTasks' },
	{ key: 'max_workflows', labelKey: 'quotaMaxWorkflows' },
	{ key: 'max_script_versions_per_script', labelKey: 'quotaMaxScriptVersions' },
	{ key: 'max_concurrent_executions', labelKey: 'quotaMaxConcurrentExecutions' },
];
const quotaRows = computed(() =>
	QUOTA_FIELDS.map((f) => ({
		label: t(`message.pages.edition.${f.labelKey}`),
		value: quota.value[f.key] ?? null,
		unit: f.unit,
	}))
);

const onRefresh = async () => {
	refreshing.value = true;
	try {
		await ensureLoaded(true);
	} finally {
		refreshing.value = false;
	}
};

const onContact = () => {
	window.dispatchEvent(new CustomEvent('taurus:edition-upgrade'));
};

onMounted(() => {
	ensureLoaded(false);
});
</script>

<style scoped lang="scss">
.license-page {
	padding: 12px;
}
.license-alert {
	margin-bottom: 12px;
}
.license-card {
	margin-bottom: 12px;
}
.license-card-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.license-page-sub {
	margin-bottom: 14px;
	font-size: 13px;
	color: var(--el-text-color-secondary, #909399);
}
.license-hosts {
	margin-top: 18px;
	.license-hosts-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
		font-size: 13px;
	}
}
.license-quota-note {
	margin-top: 8px;
	font-size: 12px;
	color: var(--el-text-color-secondary, #909399);
}
.license-quota-unit {
	color: var(--el-text-color-secondary, #909399);
	font-size: 12px;
}
.license-channel-tag,
.license-feature-tag {
	margin: 2px 6px 2px 0;
}
.license-feature-count {
	font-size: 12px;
	font-weight: normal;
	color: var(--el-text-color-secondary, #909399);
}
.license-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}
</style>
