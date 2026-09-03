import { registerNodeManifest } from '../manifest/registry.ts'

registerNodeManifest({
  nodeType: 'loop',
  displayName: '循环节点',
  category: 'control',
  color: '#E6A23C',
  icon: '↻',
  description: '对一组节点进行循环迭代，支持固定次数、遍历列表和条件循环三种模式',
  requiresHost: false,
  isAsynchronousHuman: false,
  hiddenInPalette: true,
  inputs: ['in'],
  outputs: ['out', 'error'],
  params: [
    {
      key: 'loop_type',
      label: '循环类型',
      type: 'select',
      required: true,
      group: '基本配置',
      options: [
        { label: '固定次数', value: 'count' },
        { label: '遍历列表', value: 'for_each' },
        { label: '条件循环', value: 'while' }
      ],
      defaultValue: 'count'
    },
    {
      key: 'count',
      label: '循环次数',
      type: 'number',
      group: '基本配置',
      defaultValue: 10,
      visibleWhen: { loop_type: 'count' },
      help: '固定次数模式下循环执行的次数'
    },
    {
      key: 'items',
      label: '遍历列表',
      type: 'json-editor',
      group: '基本配置',
      placeholder: '["item1", "item2", "item3"]',
      visibleWhen: { loop_type: 'for_each' },
      help: 'for_each 模式下要遍历的列表，支持 JSON 数组或 ${nodeId.field} 引用'
    },
    {
      key: 'items_source',
      label: '列表来源',
      type: 'select',
      group: '基本配置',
      options: [
        { label: '手动输入', value: 'manual' },
        { label: '引用上游输出', value: 'upstream' }
      ],
      defaultValue: 'manual',
      visibleWhen: { loop_type: 'for_each' }
    },
    {
      key: 'items_ref',
      label: '引用变量',
      type: 'condition-expr',
      group: '基本配置',
      placeholder: '${upstream_node.output_key}',
      visibleWhen: { loop_type: 'for_each', items_source: 'upstream' },
      help: '引用上游节点的输出作为遍历列表'
    },
    {
      key: 'condition_expression',
      label: '循环条件表达式',
      type: 'condition-expr',
      group: '基本配置',
      placeholder: '${loop.index} < 10',
      visibleWhen: { loop_type: 'while' },
      help: 'while 模式下的条件表达式，支持 ${loop.index}、${loop.iteration} 等内置变量'
    },
    {
      key: 'max_iterations',
      label: '最大迭代次数',
      type: 'number',
      group: '安全配置',
      defaultValue: 100,
      help: '防止无限循环的安全上限'
    },
    {
      key: 'body_node_type',
      label: '循环体节点类型',
      type: 'node-type-select',
      required: true,
      group: '循环体',
      help: '循环体内每个迭代执行的节点类型'
    },
    {
      key: 'body_params',
      label: '循环体参数',
      type: 'loop-body-form',
      group: '循环体',
      help: '根据循环体节点类型配置具体参数，支持 ${loop.index}、${loop.item} 等内置变量'
    },
    {
      key: 'max_concurrency',
      label: '最大并发数',
      type: 'number',
      group: '执行配置',
      defaultValue: 1,
      help: '并行执行的迭代数量，1 表示串行执行'
    },
    {
      key: 'break_on_error',
      label: '出错时终止循环',
      type: 'boolean',
      group: '执行配置',
      defaultValue: true
    },
    {
      key: 'aggregation',
      label: '结果聚合方式',
      type: 'select',
      group: '执行配置',
      options: [
        { label: '收集所有结果', value: 'collect_all' },
        { label: '仅收集成功结果', value: 'collect_success' },
        { label: '仅保留最终结果', value: 'last_only' }
      ],
      defaultValue: 'collect_all'
    },
    {
      key: 'fail_strategy',
      label: '失败策略',
      type: 'select',
      group: '执行配置',
      options: [
        { label: '立即终止', value: 'fail_fast' },
        { label: '继续执行', value: 'continue' },
        { label: '跳过当前迭代', value: 'skip' }
      ],
      defaultValue: 'fail_fast'
    }
  ],
  outputSchema: [
    { key: 'loop_results', label: '循环结果列表', type: 'json-editor' },
    { key: 'loop_count', label: '实际循环次数', type: 'number' },
    { key: 'success_count', label: '成功次数', type: 'number' },
    { key: 'fail_count', label: '失败次数', type: 'number' }
  ]
})