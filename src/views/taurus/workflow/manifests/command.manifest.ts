import { registerNodeManifest } from '../manifest/registry.ts'

registerNodeManifest({
  nodeType: 'command',
  displayName: '命令执行',
  category: 'execution',
  color: '#409EFF',
  icon: '⌨',
  description: '在目标主机上执行 Shell 命令',
  requiresHost: true,
  isAsynchronousHuman: false,
  inputs: ['in'],
  outputs: ['out', 'error'],
  params: [
    { key: 'command', label: '命令内容', type: 'code-editor', required: true, placeholder: '输入要执行的命令', group: '基础配置' },
    { key: 'target_hosts', label: '目标主机', type: 'host-selector', required: true },
    { key: 'timeout', label: '超时时间', type: 'time-duration', defaultValue: 300, min: 1 },
    { key: 'args', label: '命令参数（按位置）', type: 'array-list', defaultValue: [], placeholder: '如 prod、/data/app', enableGlobalVarImport: true, help: '每行一个位置参数，按顺序作为命令的 $1 $2 ... 传入；如果命令本身已拼接了参数，此项可留空。' },
    { key: 'environment', label: '环境变量', type: 'key-value-table', defaultValue: {}, enableGlobalVarImport: true, keyColumnLabel: '变量名', valueColumnLabel: '变量值', keyColumnPlaceholder: '如 PATH', valueColumnPlaceholder: '如 /usr/local/bin' },

    { key: 'working_directory', label: '工作目录', type: 'text', group: '执行选项', placeholder: '留空使用默认目录', help: '命令执行时的工作目录，留空则使用默认目录。' },
    { key: 'load_profile', label: '环境加载', type: 'select', group: '执行选项', defaultValue: 'false', options: [
      { label: '干净环境', value: 'false' },
      { label: '加载 bashrc', value: 'true' },
      { label: 'Login Shell', value: 'login' },
    ], help: '选择命令执行时的 Shell 环境加载模式。' },
    { key: 'merge_streams', label: '合并输出', type: 'boolean', group: '执行选项', defaultValue: false, help: '将 stderr 合并到 stdout，方便统一查看输出。' },
    { key: 'privileged', label: '特权执行', type: 'boolean', group: '执行选项', defaultValue: false, help: '以特权模式执行命令，需配置 su 用户。' },
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

    { key: 'pre_check_script', label: '前置检查脚本', type: 'code-editor', group: '前置检查' },
    { key: 'post_check_script', label: '后置检查脚本', type: 'code-editor', group: '后置检查' }
  ],
  outputSchema: [
    { key: 'stdout', label: '标准输出', type: 'code-editor' },
    { key: 'stderr', label: '错误输出', type: 'code-editor' },
    { key: 'exit_code', label: '退出码', type: 'number' }
  ]
})