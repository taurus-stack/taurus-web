import { registerNodeManifest } from '../manifest/registry.ts'

registerNodeManifest({
  nodeType: 'http_callback',
  displayName: 'HTTP 回调',
  category: 'integration',
  color: '#E6A23C',
  icon: '🔗',
  description: '向外部系统发送 HTTP 请求，等待回调后继续工作流',
  requiresHost: false,
  isAsynchronousHuman: true,
  inputs: ['trigger'],
  outputs: ['success', 'failed'],
  params: [
    {
      key: 'url',
      label: '回调 URL',
      type: 'text',
      required: true,
      placeholder: 'https://example.com/api/workflow/callback',
      help: '外部系统接收回调的 HTTP(S) 地址'
    },
    {
      key: 'method',
      label: '请求方法',
      type: 'select',
      options: [
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' }
      ],
      defaultValue: 'POST'
    },
    {
      key: 'headers',
      label: '请求头',
      type: 'key-value-table',
      placeholder: '添加自定义 HTTP 请求头',
      keyColumnLabel: 'Header 名称',
      valueColumnLabel: 'Header 值',
      keyColumnPlaceholder: '如 Content-Type',
      valueColumnPlaceholder: '如 application/json'
    },
    {
      key: 'payload_template',
      label: '请求体模板',
      type: 'code-editor',
      placeholder: '{"message": "处理 ${workflow.name}"}',
      help: '支持 Jinja2 模板，渲染后合并到默认 payload'
    },
    {
      key: 'timeout_seconds',
      label: '超时时间',
      type: 'time-duration',
      defaultValue: 3600,
      min: 1,
      help: '等待回调的最长时间'
    }
  ],
  outputSchema: [
    { key: 'callback_payload', label: '回调数据', type: 'json-editor' },
    { key: 'status', label: '回调状态', type: 'text' }
  ]
})