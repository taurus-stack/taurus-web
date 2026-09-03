/**
 * Edition Gate — fast-crud 表格/表单/查询框 列级门控 helper。
 *
 * 用 Vue 的 computed() 包装 Edition Store 的 hasFeature()，
 * 使 column.show / form.show / search.show 等属性在 Edition 变化时自动更新。
 *
 * fast-crud 官方文档："ref/computed — 整个 crudBinding 都支持"，
 * 所以 Vue computed 可以直接赋值给 crudOptions 里的任何配置属性。
 *
 * 用法示例：
 *   import { editionColumnShow } from '/@/editions/useEditionColumn';
 *
 *   columns: {
 *     dag_version: {
 *       title: 'DAG Version',
 *       column: {
 *         show: editionColumnShow('WORKFLOW_DAG_VERSIONING'),
 *       },
 *     },
 *   }
 *
 * 注意：helper 需在组件 setup 链路内调用（或其下的 createCrudOptions），
 * 此时 Pinia 已 install、Vue computed 有 active effect scope。
 * —— 这是 fast-crud createCrudOptions 的自然调用位置，无需额外注意。
 */

import { computed } from 'vue';
import { useEditionStore } from './index';

export type FeatureCode = string;

/**
 * 返回一个 Vue computed<boolean>，值为当前 Edition 是否拥有指定 Feature。
 * CE 模式 = false → 列隐藏；EE 模式 = true → 列显示。
 */
export function editionColumnShow(featureCode: FeatureCode) {
	const store = useEditionStore();
	return computed(() => store.hasFeature(featureCode));
}
