import { registerNodeManifest } from '../manifest/registry.ts'

registerNodeManifest({
  nodeType: 'email_notification',
  displayName: '邮件通知',
  category: 'notification',
  color: '#F56C6C',
  icon: '📧',
  description: '通过 SMTP 发送邮件通知',
  requiresHost: false,
  isAsynchronousHuman: false,
  inputs: ['in'],
  outputs: ['out'],
  params: [
    { key: 'recipients', label: '收件人', type: 'textarea', required: true, placeholder: '多个邮箱用逗号分隔，如 a@example.com, b@example.com' },
    { key: 'subject_template', label: '邮件主题', type: 'text', required: true },
    { key: 'body_template', label: '邮件正文', type: 'code-editor', required: true },
    { key: 'from_email', label: '发件人', type: 'text', placeholder: '留空使用系统默认配置' }
  ],
  outputSchema: [
    { key: 'sent_count', label: '发送数量', type: 'number' }
  ]
})