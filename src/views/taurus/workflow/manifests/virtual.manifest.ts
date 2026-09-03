import { registerNodeManifest } from '../manifest/registry.ts'

registerNodeManifest({
  nodeType: 'start',
  displayName: '开始节点',
  category: 'control',
  color: '#67C23A',
  icon: '▶',
  description: '工作流起点，不执行任何操作',
  requiresHost: false,
  isAsynchronousHuman: false,
  inputs: [],
  outputs: ['out'],
  params: [],
  outputSchema: [
    { key: 'started_at', label: '启动时间', type: 'text' },
  ],
})

registerNodeManifest({
  nodeType: 'end',
  displayName: '结束节点',
  category: 'control',
  color: '#F56C6C',
  icon: '⏹',
  description: '工作流终点，聚合多分支结果',
  requiresHost: false,
  isAsynchronousHuman: false,
  inputs: ['in'],
  outputs: [],
  params: [],
  outputSchema: [
    { key: 'finished_at', label: '完成时间', type: 'text' },
  ],
})

registerNodeManifest({
  nodeType: 'noop',
  displayName: '空操作',
  category: 'control',
  color: '#909399',
  icon: '∅',
  description: '空操作占位节点，用于调试或流程编排占位',
  requiresHost: false,
  isAsynchronousHuman: false,
  inputs: ['in'],
  outputs: ['out'],
  params: [
    { key: 'value', label: '回显值', type: 'text', defaultValue: 'noop' },
  ],
  outputSchema: [
    { key: 'echo', label: '回显内容', type: 'text' },
  ],
})