import { registerNodeManifest } from '../manifest/registry.ts'

registerNodeManifest({
  nodeType: 'approval',
  displayName: '人工审批',
  category: 'approval',
  color: '#E6A23C',
  icon: '✅',
  description: '暂停流程等待人工审批确认',
  requiresHost: false,
  isAsynchronousHuman: true,
  inputs: ['in'],
  outputs: ['out', 'rejected'],
  params: [
    { key: 'title', label: '审批标题', type: 'text', required: true, group: '基础配置' },
    { key: 'approver_user_id', label: '审批人', type: 'user-select', required: true, multiple: false, group: '基础配置' },
    {
      key: 'mode',
      label: '审批模式',
      type: 'select',
      options: [
        { label: '单人审批（任一人通过）', value: 'or' },
        { label: '多人审批（全部通过）', value: 'and' }
      ],
      defaultValue: 'or',
      group: '基础配置'
    },
    { key: 'timeout_seconds', label: '超时时间', type: 'time-duration', defaultValue: 86400, min: 1, group: '高级' },
    {
      key: 'timeout_action',
      label: '超时处理',
      type: 'select',
      options: [
        { label: '自动通过', value: 'auto_pass' },
        { label: '自动驳回', value: 'auto_reject' }
      ],
      defaultValue: 'auto_reject',
      group: '高级'
    }
  ],
  outputSchema: [
    { key: 'status', label: '审批状态', type: 'text' },
    { key: 'approver', label: '审批人', type: 'text' },
    { key: 'comment', label: '审批意见', type: 'textarea' }
  ]
})