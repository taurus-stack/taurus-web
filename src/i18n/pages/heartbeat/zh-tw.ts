export default {
	message: {
		pages: {
			heartbeat: {
				table: {
					columns: {
						keyword: '關鍵詞',
						id: 'ID',
						host: '所屬主機',
						hostName: '主機名稱',
						hostIp: '主機IP',
						timestamp: '心跳時間',
						supervisorStatus: 'Supervisor狀態',
						supervisorVersion: 'Supervisor版本',
						heartbeatServer: '心跳服務器',
					},
				},
				form: {
					keywordPlaceholder: '請輸入關鍵詞',
					hostNamePlaceholder: '主機名稱',
					hostIpPlaceholder: '主機IP',
					supervisorStatusPlaceholder: 'Supervisor狀態',
				},
				buttons: {
					loadMetrics: '主機負載',
				},
				dialog: {
					loadMetricsTitle: '主機負載',
				},
				charts: {
					cpuUsage: 'CPU 使用率',
					memoryUsage: '內存使用率',
					diskUsage: '磁盤使用率',
					systemLoad: '系統負載',
					loadAverage: 'Load Average',
					networkTraffic: '網絡流量',
					rx: '接收 (RX)',
					tx: '發送 (TX)',
					procAndUptime: '進程數 & 運行時間',
					processCount: '進程數',
					uptimeHours: '運行時間(小時)',
				},
				uptime: {
					days: '天',
					hours: '時',
					minutes: '分',
				},
			},
		},
	},
};
