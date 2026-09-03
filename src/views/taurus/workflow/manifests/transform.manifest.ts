import { registerNodeManifest } from '../manifest/registry.ts'

registerNodeManifest({
  nodeType: 'transform',
  displayName: '数据转换',
  category: 'transform',
  color: '#909399',
  icon: '🔄',
  description: '对输入数据进行格式转换和处理',
  requiresHost: false,
  isAsynchronousHuman: false,
  inputs: ['in'],
  outputs: ['out', 'error'],
  params: [
    {
      key: 'transform_type',
      label: '转换类型',
      type: 'select',
      required: true,
      options: [
        { label: 'JSON Path', value: 'jsonpath' },
        { label: 'Python 表达式', value: 'python' },
        { label: '正则替换', value: 'regex' },
        { label: '脚本转换', value: 'script' }
      ],
      defaultValue: 'jsonpath'
    },
    { key: 'expression', label: '转换表达式', type: 'code-editor', required: true, placeholder: '$.data.items' },
    {
      key: 'output_type',
      label: '输出类型',
      type: 'select',
      options: [
        { label: '字符串', value: 'string' },
        { label: '数字', value: 'number' },
        { label: '布尔值', value: 'boolean' },
        { label: '对象/数组', value: 'object' }
      ],
      defaultValue: 'object'
    },
    { key: 'fallback_value', label: '默认值（转换失败时）', type: 'text', defaultValue: '' }
  ],
  outputSchema: [
    { key: 'transformed_data', label: '转换后数据', type: 'json-editor' }
  ]
})