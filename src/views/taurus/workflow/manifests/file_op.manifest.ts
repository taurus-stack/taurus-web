import { registerNodeManifest } from '../manifest/registry.ts'

registerNodeManifest({
  nodeType: 'file_op',
  displayName: '文件分发',
  category: 'execution',
  color: '#67C23A',
  icon: '📁',
  description: '向目标主机分发文件',
  requiresHost: true,
  isAsynchronousHuman: false,
  inputs: ['in'],
  outputs: ['out', 'error'],
  params: [
    {
      key: 'source_type',
      label: '源文件来源',
      type: 'select',
      required: true,
      options: [
        { label: '本地文件', value: 'local_path' },
        { label: '远程文件链接', value: 'http_url' }
      ],
      defaultValue: 'local_path',
      help: '从后端本地选取文件，或从远程服务器下载后再分发到目标主机。S3/OSS/COS 对象存储请使用预签名 URL（选择 HTTPS 协议）。'
    },
    {
      key: 'remote_sources',
      label: '远程链接配置',
      type: 'remote-source-list',
      required: true,
      visibleWhen: { source_type: 'http_url' },
      help: '点击「配置远程链接」添加多个远程文件地址，每个地址可独立设置传输协议和认证信息。'
    },
    {
      key: 'file_paths',
      label: '文件上传',
      type: 'key-value-table',
      required: true,
      keyColumnLabel: '源文件路径',
      valueColumnLabel: '目标主机路径',
      keyColumnPlaceholder: '本地文件（如 /tmp/app.tar.gz）',
      valueColumnPlaceholder: '目标主机保存路径（如 /opt/app/app.tar.gz）',
      help: '本地文件模式：点击「上传本地文件」选择文件上传；远程链接模式：在上方配置远程链接后填写目标路径。'
    },
    { key: 'target_hosts', label: '目标主机', type: 'host-selector', required: true },
    { key: 'timeout', label: '超时时间', type: 'time-duration', defaultValue: 3600, min: 1 },
    { key: 'retry_count', label: '重试次数', type: 'number', defaultValue: 2 }
  ],
  outputSchema: [
    { key: 'transfer_result', label: '传输结果', type: 'json-editor' }
  ]
})
