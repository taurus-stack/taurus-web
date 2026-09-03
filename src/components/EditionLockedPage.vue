<template>
	<div class="edition-locked-page">
		<!-- 正常页面内容（EE 可见 / CE 被遮罩挡住） -->
		<div v-if="showContent" class="elp-content">
			<slot />
		</div>

		<!-- 整页遮罩 + 升级引导（CE 下显示） -->
		<div v-else class="elp-mask">
			<div class="elp-card">
				<div class="elp-icon">🔒</div>
				<div class="elp-title">
					{{ featureLabel }}
					<span class="elp-badge">ENTERPRISE</span>
				</div>
				<div class="elp-subtitle">此功能仅 Taurus Stack 企业版（Enterprise Edition）提供</div>

				<div class="elp-features">
					<div v-for="(f, i) in highlights" :key="i" class="elp-feature">
						<el-icon color="#409EFF"><Check /></el-icon>
						<span>{{ f }}</span>
					</div>
				</div>

				<div class="elp-actions">
					<el-button round size="default" @click="goBack">返回上一页</el-button>
					<el-button round size="default" type="primary" @click="goUpgrade">
						🚀 升级到企业版
					</el-button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
/**
 * EditionLockedPage — EE 专属独立页面的整页锁组件
 *
 * 用法：
 *   <EditionLockedPage feature="WORKFLOW_APPROVAL_FLOW" label="多级审批中心">
 *     <WorkflowApprovalCenter />
 *   </EditionLockedPage>
 *
 *   <!-- 多个 feature 任意一个即可解锁 -->
 *   <EditionLockedPage :feature="['WORKFLOW_DAG_ENGINE', 'WORKFLOW_APPROVAL_FLOW']" ...>
 */
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Check } from '@element-plus/icons-vue';
import { useEditionStore } from '/@/editions/index';
import { ElMessage } from 'element-plus';

const props = defineProps<{
	/** 解锁页面所需的 feature code（或数组，数组内任意一个满足即可） */
	feature: string | string[];
	/** 功能中文名（显示在遮罩标题上） */
	label?: string;
	/** 亮点列表（CE 下显示"这个功能能做什么"） */
	highlights?: string[];
}>();

const router = useRouter();
const editionStore = useEditionStore();

const featureCodes = computed(() =>
	Array.isArray(props.feature) ? props.feature : [props.feature]
);

const showContent = computed(() =>
	editionStore.loaded && featureCodes.value.some((c) => editionStore.hasFeature(c))
);

const featureLabel = computed(() => props.label || '该页面');

const highlights = computed(() =>
	props.highlights && props.highlights.length > 0
		? props.highlights
		: ['解锁企业级核心能力', '享受专业技术支持', '保障大规模运维合规']
);

const goBack = () => {
	if (window.history.length > 1) {
		router.back();
	} else {
		router.push('/');
	}
};

const goUpgrade = () => {
	// 优先打开 Upgrade 弹窗（通过全局事件），fallback 到联系销售页
	window.dispatchEvent(new CustomEvent('taurus:edition-upgrade'));
	ElMessage.info('升级引导弹窗即将显示…');
};
</script>

<style scoped lang="scss">
.edition-locked-page {
	position: relative;
	min-height: 100%;
}

.elp-mask {
	position: fixed;
	inset: 0;
	z-index: 9999;
	background: rgba(245, 247, 250, 0.95);
	display: flex;
	align-items: center;
	justify-content: center;
	backdrop-filter: blur(4px);
}

.elp-card {
	width: 520px;
	max-width: 90vw;
	background: #fff;
	border-radius: 12px;
	padding: 32px 36px;
	box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
	text-align: center;
	border: 1px solid #ebeef5;
}

.elp-icon {
	font-size: 48px;
	margin-bottom: 8px;
}

.elp-title {
	font-size: 20px;
	font-weight: 600;
	color: #303133;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;

	.elp-badge {
		background: linear-gradient(135deg, #409eff, #66b1ff);
		color: #fff;
		font-size: 11px;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 3px;
		letter-spacing: 1px;
	}
}

.elp-subtitle {
	margin-top: 10px;
	font-size: 14px;
	color: #909399;
}

.elp-features {
	margin-top: 20px;
	padding: 14px 18px;
	background: #f5f7fa;
	border-radius: 8px;
	text-align: left;

	.elp-feature {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: #606266;
		line-height: 28px;
	}
}

.elp-actions {
	margin-top: 24px;
	display: flex;
	justify-content: center;
	gap: 12px;
}
</style>
