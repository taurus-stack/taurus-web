import { registerNodeManifest } from '../manifest/registry.ts'

registerNodeManifest({
  nodeType: 'program',
  displayName: '程序管理',
  category: 'execution',
  color: '#E6A23C',
  icon: '📦',
  description: '对目标主机上的程序执行安装/升级/启停操作',
  requiresHost: true,
  isAsynchronousHuman: false,
  hiddenInPalette: true,
  inputs: ['in'],
  outputs: ['out', 'error'],
  params: [
    {
      key: 'action',
      label: '操作类型',
      type: 'select',
      required: true,
      group: '基本配置',
      options: [
        { label: '安装', value: 'install' },
        { label: '升级', value: 'upgrade' },
        { label: '启动', value: 'start' },
        { label: '停止', value: 'stop' },
        { label: '重启', value: 'restart' },
        { label: '卸载', value: 'remove' },
      ],
      defaultValue: 'start',
    },
    { key: 'program_name', label: '程序名称', type: 'text', required: true, group: '基本配置' },
    { key: 'target_version', label: '目标版本', type: 'text', group: '基本配置', visibleWhen: { action: ['upgrade', 'install'] } },
    { key: 'target_hosts', label: '目标主机', type: 'host-selector', required: true, group: '执行目标' },
    { key: 'timeout', label: '超时时间', type: 'time-duration', defaultValue: 600, min: 1, group: '高级配置' },
    { key: 'force', label: '强制执行', type: 'boolean', defaultValue: false, group: '高级配置' },
  ],
  outputSchema: [
    { key: 'result', label: '执行结果', type: 'json-editor' },
    { key: 'version', label: '当前版本', type: 'text' },
  ],
})