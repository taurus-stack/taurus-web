import { registerNodeManifest } from '../manifest/registry.ts'

registerNodeManifest({
  nodeType: 'webhook_notification',
  displayName: 'Webhook 通知',
  category: 'notification',
  color: '#F56C6C',
  icon: '🔔',
  description: '向指定 URL 发送 Webhook 请求',
  requiresHost: false,
  isAsynchronousHuman: false,
  inputs: ['in'],
  outputs: ['out'],
  params: [
    { key: 'url', label: 'Webhook URL', type: 'text', required: true, placeholder: 'https://hooks.example.com/...', drawerGroup: 'Webhook 配置' },
    {
      key: 'method',
      label: '请求方法',
      type: 'select',
      options: [
        { label: 'POST', value: 'POST' },
        { label: 'GET', value: 'GET' },
        { label: 'PUT', value: 'PUT' }
      ],
      defaultValue: 'POST',
      drawerGroup: 'Webhook 配置'
    },
    {
      key: 'body_format',
      label: '请求体格式',
      type: 'select',
      options: [
        { label: 'JSON (application/json)', value: 'json' },
        { label: '表单 (x-www-form-urlencoded)', value: 'form' },
        { label: '纯文本 (text/plain)', value: 'raw' }
      ],
      defaultValue: 'json',
      drawerGroup: 'Webhook 配置'
    },
    { key: 'payload_template', label: '请求体模板', type: 'textarea', dynamicEditor: 'body-format', defaultValue: '', drawerGroup: 'Webhook 配置' },
    { key: 'headers', label: '请求头', type: 'key-value-table', defaultValue: {}, keyColumnLabel: 'Header 名称', valueColumnLabel: 'Header 值', keyColumnPlaceholder: '如 Content-Type', valueColumnPlaceholder: '如 application/json', drawerGroup: 'Webhook 配置' },
    { key: 'timeout', label: '超时时间', type: 'time-duration', defaultValue: 30, min: 1 },
    { key: 'retry_count', label: '重试次数', type: 'number', defaultValue: 2 }
  ],
  outputSchema: [
    { key: 'response_status', label: '响应状态', type: 'number' },
    { key: 'response_body', label: '响应体', type: 'json-editor' }
  ]
})