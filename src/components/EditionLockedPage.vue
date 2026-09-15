<script lang="ts">
import { defineComponent, type PropType } from 'vue';

/**
 * EditionLockedPage — 历史 EE 页面锁组件。
 *
 * 单一全功能版本后功能不做门禁，始终渲染页面内容；
 * 组件与 props 保留仅为兼容既有调用（feature/label/highlights 不再生效）。
 *
 * 注意：必须用渲染函数直接返回默认插槽的唯一节点，不能使用模板 <slot/>。
 * 模板 <slot/> 经 renderSlot 编译会产生一层 Fragment，嵌套在布局的
 * <transition mode="out-in"> + <keep-alive> 路由切换链中时，Fragment 离场
 * 不会触发 transition.afterLeave，out-in 的 isLeaving 无法复位，
 * 内容区会永久空白（只能 F5 恢复）。调用方须保证仅传入单个根节点。
 */
export default defineComponent({
	name: 'EditionLockedPage',
	props: {
		feature: { type: [String, Array] as PropType<string | string[]>, default: undefined },
		label: { type: String, default: undefined },
		highlights: { type: Array as PropType<string[]>, default: undefined },
	},
	setup(_props, { slots }) {
		return () => {
			const nodes = slots.default?.() ?? [];
			return nodes.length === 1 ? nodes[0] : nodes;
		};
	},
});
</script>
