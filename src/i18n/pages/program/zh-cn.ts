export default {
	message: {
		pages: {
			program: {
				table: {
					columns: {
						keyword: '关键词',
						id: 'ID',
						host: '所属主机',
						hostName: '主机名称',
						hostIp: '主机IP',
						name: '程序名称',
						version: '当前版本',
						status: '运行状态',
						pid: '进程PID',
						port: '服务端口',
						autoStart: '自动启动',
						restartOnCrash: '崩溃自动重启',
						config: '程序配置',
					},
				},
				form: {
					keywordPlaceholder: '请输入关键词',
					hostNamePlaceholder: '主机名称',
					hostIpPlaceholder: '主机IP',
					namePlaceholder: '程序名称',
					statusPlaceholder: '运行状态',
				},
				status: {
					stopped: '已停止',
					starting: '启动中',
					running: '运行中',
					stopping: '停止中',
					crashed: '已崩溃',
					upgrading: '升级中',
				},
				bool: {
					yes: '是',
					no: '否',
				},
				buttons: {
					start: '启动',
					stop: '停止',
					restart: '重启',
					remove: '移除',
				},
				messages: {
					startSent: '启动指令已下发',
					stopSent: '停止指令已下发',
					restartSent: '重启指令已下发',
					removeSent: '移除指令已下发',
					removeConfirmTitle: '警告',
					removeConfirm: '确认移除程序：{name}？移除后程序将被 Supervisor 卸载。',
				},
			},
		},
	},
};
