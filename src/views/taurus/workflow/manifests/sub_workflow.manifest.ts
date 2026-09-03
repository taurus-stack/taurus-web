import { registerNodeManifest } from '../manifest/registry.ts'

registerNodeManifest({
  nodeType: 'sub_workflow',
  displayName: '子流程调用',
  category: 'control',
  color: '#909399',
  icon: '📦',
  description: '调用已注册的子流程',
  requiresHost: false,
  isAsynchronousHuman: false,
  hiddenInPalette: true,
  inputs: ['in'],
  outputs: ['out', 'error'],
  params: [
    { key: 'sub_workflow_id', label: '选择子流程', type: 'select', required: true },
    { key: 'inputs', label: '子流程输入参数', type: 'json-editor', defaultValue: {} },
    {
      key: 'merge_strategy',
      label: '变量合并策略',
      type: 'select',
      options: [
        { label: '覆盖', value: 'overwrite' },
        { label: '合并', value: 'merge' },
        { label: '前缀', value: 'prefix' }
      ],
      defaultValue: 'merge'
    },
    { key: 'timeout', label: '超时时间', type: 'time-duration', defaultValue: 86400, min: 1 }
  ],
  outputSchema: [
    { key: 'sub_workflow_result', label: '子流程结果', type: 'json-editor' }
  ]
})