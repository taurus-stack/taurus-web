import { registerNodeManifest } from '../manifest/registry.ts'

registerNodeManifest({
  nodeType: 'condition',
  displayName: '条件判断',
  category: 'control',
  color: '#67C23A',
  icon: '◇',
  description: '根据条件表达式分流流程执行，输出 true/false 两个分支',
  requiresHost: false,
  isAsynchronousHuman: false,
  hiddenInPalette: true,
  inputs: ['in'],
  outputs: ['true', 'false'],
  params: [
    {
      key: 'expression_type',
      label: '表达式类型',
      type: 'select',
      group: '条件配置',
      options: [
        { label: '简单条件', value: 'simple' },
        { label: 'Python 表达式', value: 'python' }
      ],
      defaultValue: 'simple'
    },
    {
      key: 'expression',
      label: '条件表达式',
      type: 'condition-expr',
      required: true,
      group: '条件配置',
      placeholder: '使用 ${node_id.field} 引用上游节点输出，例如 ${node_1.exit_code} > 0'
    },
    {
      key: 'input_source',
      label: '输入变量源',
      type: 'select',
      group: '条件配置',
      options: [
        { label: '上一节点输出', value: 'previous' },
        { label: '全局变量', value: 'global' },
        { label: '自定义', value: 'custom' }
      ],
      defaultValue: 'previous'
    },
    {
      key: 'custom_input',
      label: '自定义输入变量',
      type: 'json-editor',
      group: '条件配置',
      placeholder: '{"key": "value"}',
      visibleWhen: { input_source: 'custom' },
      help: '自定义输入变量的 JSON 对象'
    }
  ],
  outputSchema: [
    { key: 'branch', label: '分支结果（true/false）', type: 'string' },
    { key: 'condition_result', label: '判断结果', type: 'boolean' }
  ]
})