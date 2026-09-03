import { registerNodeManifest } from '../manifest/registry.ts'

registerNodeManifest({
  nodeType: 'http',
  displayName: 'HTTP 请求',
  category: 'integration',
  color: '#8E44AD',
  icon: '🌐',
  description: '发送 HTTP 请求与外部系统交互',
  requiresHost: false,
  isAsynchronousHuman: false,
  inputs: ['in'],
  outputs: ['out', 'error'],
  params: [
    { key: 'url', label: '请求 URL', type: 'text', required: true, placeholder: 'https://api.example.com/...' },
    {
      key: 'method',
      label: '请求方法',
      type: 'select',
      required: true,
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
        { label: 'PATCH', value: 'PATCH' }
      ],
      defaultValue: 'GET'
    },
    { key: 'headers', label: '请求头', type: 'key-value-table', defaultValue: {}, keyColumnLabel: 'Header 名称', valueColumnLabel: 'Header 值', keyColumnPlaceholder: '如 Content-Type', valueColumnPlaceholder: '如 application/json' },
    { key: 'body', label: '请求体', type: 'json-editor', defaultValue: {} },
    { key: 'timeout', label: '超时时间', type: 'time-duration', defaultValue: 30, min: 1 },
    { key: 'auth_type', label: '认证方式', type: 'select', options: [
      { label: '无', value: 'none' },
      { label: 'Bearer Token', value: 'bearer' },
      { label: 'API Key', value: 'api_key' },
      { label: 'Basic Auth', value: 'basic' }
    ], defaultValue: 'none' },
    { key: 'auth_config', label: '认证配置', type: 'json-editor', defaultValue: {} }
  ],
  outputSchema: [
    { key: 'status_code', label: '状态码', type: 'number' },
    { key: 'response_body', label: '响应体', type: 'json-editor' },
    { key: 'response_headers', label: '响应头', type: 'json-editor' }
  ]
})