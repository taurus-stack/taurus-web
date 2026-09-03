export default {
	message: {
		pages: {
			heartbeat: {
				table: {
					columns: {
						keyword: '关键词',
						id: 'ID',
						host: '所属主机',
						hostName: '主机名称',
						hostIp: '主机IP',
						timestamp: '心跳时间',
						supervisorStatus: 'Supervisor状态',
						supervisorVersion: 'Supervisor版本',
						heartbeatServer: '心跳服务器',
					},
				},
				form: {
					keywordPlaceholder: '请输入关键词',
					hostNamePlaceholder: '主机名称',
					hostIpPlaceholder: '主机IP',
					supervisorStatusPlaceholder: 'Supervisor状态',
				},
				buttons: {
					loadMetrics: '主机负载',
				},
				dialog: {
					loadMetricsTitle: '主机负载',
				},
				charts: {
					cpuUsage: 'CPU 使用率',
					memoryUsage: '内存使用率',
					diskUsage: '磁盘使用率',
					systemLoad: '系统负载',
					loadAverage: 'Load Average',
					networkTraffic: '网络流量',
					rx: '接收 (RX)',
					tx: '发送 (TX)',
					procAndUptime: '进程数 & 运行时间',
					processCount: '进程数',
					uptimeHours: '运行时间(小时)',
				},
				uptime: {
					days: '天',
					hours: '时',
					minutes: '分',
				},
			},
		},
	},
};
