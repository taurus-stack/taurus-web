import { registerNodeManifest } from '../manifest/registry.ts'

registerNodeManifest({
  nodeType: 'script',
  displayName: '脚本执行',
  category: 'execution',
  color: '#67C23A',
  icon: '📜',
  description: '在指定目标执行 Python/Bash 脚本',
  requiresHost: true,
  isAsynchronousHuman: false,
  inputs: ['in'],
  outputs: ['out', 'error'],
  params: [
    { key: 'script_id', label: '选择脚本', type: 'script-selector', required: true },
    { key: 'script_type', label: '脚本类型', type: 'select', group: '基础配置', defaultValue: 'sh', options: [
      { label: 'Shell / Bash', value: 'sh' },
      { label: 'Python', value: 'python' },
      { label: 'PowerShell', value: 'powershell' },
      { label: 'Batch (.bat)', value: 'bat' },
      { label: 'SQL', value: 'sql' },
    ], help: '脚本的执行类型，用于动态脚本或覆盖默认类型。选择已有脚本时以脚本库中的类型为准。' },
    { key: 'target_hosts', label: '目标主机', type: 'host-selector', required: true },
    { key: 'timeout', label: '超时时间', type: 'time-duration', defaultValue: 3600, min: 1 },
    { key: 'args', label: '脚本位置参数', type: 'array-list', defaultValue: [], placeholder: '按顺序作为 $1 $2 ... 传入', enableGlobalVarImport: true, help: '每行一个位置参数，按顺序作为脚本的执行参数传入。' },
    { key: 'environment', label: '环境变量', type: 'key-value-table', defaultValue: {}, enableGlobalVarImport: true, keyColumnLabel: '变量名', valueColumnLabel: '变量值', keyColumnPlaceholder: '如 PATH', valueColumnPlaceholder: '如 /usr/local/bin' },

    { key: 'working_directory', label: '工作目录', type: 'text', group: '执行选项', placeholder: '留空使用默认目录', help: '脚本执行时的工作目录，留空则使用默认目录。' },
    { key: 'load_profile', label: '环境加载', type: 'select', group: '执行选项', defaultValue: 'false', options: [
      { label: '干净环境', value: 'false' },
      { label: '加载 bashrc', value: 'true' },
      { label: 'Login Shell', value: 'login' },
    ], help: '选择脚本执行时的 Shell 环境加载模式。' },
    { key: 'merge_streams', label: '合并输出', type: 'boolean', group: '执行选项', defaultValue: false, help: '将 stderr 合并到 stdout，方便统一查看输出。' },
    { key: 'privileged', label: '特权执行', type: 'boolean', group: '执行选项', defaultValue: false, help: '以特权模式执行脚本，需配置 su 用户和密码。' },
    { key: 'su_user', label: 'su 用户', type: 'text', group: '执行选项', placeholder: 'root', visibleWhen: { privileged: true }, help: '特权执行时切换的目标用户。' },
    { key: 'su_password', label: 'su 密码', type: 'password', group: '执行选项', placeholder: '留空则使用 NOPASSWD', visibleWhen: { privileged: true }, help: '特权执行时 su 切换密码，如已在目标主机配置 NOPASSWD 可留空。' },

    { key: 'exec_mode', label: '执行模式', type: 'select', group: '执行策略', defaultValue: 'parallel', options: [
      { label: '串行执行', value: 'serial' },
      { label: '并行执行', value: 'parallel' },
      { label: '灰度放量执行', value: 'pilot' },
    ], help: '多主机场景下的执行调度模式。' },
    { key: 'concurrent', label: '并发数', type: 'number', group: '执行策略', defaultValue: 10, min: 1, max: 50, visibleWhen: { exec_mode: ['parallel', 'pilot'] }, help: '并行或放量阶段同时执行的最大主机数。' },
    { key: 'ops_fail_strategy', label: '失败策略', type: 'select', group: '执行策略', defaultValue: 'stop', options: [
      { label: '失败终止全部', value: 'stop' },
      { label: '跳过失败继续', value: 'continue' },
    ], help: '某台主机执行失败时的处理策略。' },
    { key: 'pilot_count', label: '验证主机数', type: 'number', group: '执行策略', defaultValue: 2, min: 1, max: 10, visibleWhen: { exec_mode: 'pilot' }, help: '灰度模式下先行串行验证的主机数量。' },
    { key: 'pilot_success_rate', label: '成功阈值(%)', type: 'number', group: '执行策略', defaultValue: 100, min: 1, max: 100, visibleWhen: { exec_mode: 'pilot' }, help: '灰度模式下放量所需的最低成功率。' },
  ],
  outputSchema: [
    { key: 'output_data', label: '输出数据', type: 'json-editor' },
    { key: 'logs', label: '执行日志', type: 'code-editor' }
  ]
})