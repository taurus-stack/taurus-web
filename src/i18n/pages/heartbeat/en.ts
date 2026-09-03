export default {
	message: {
		pages: {
			heartbeat: {
				table: {
					columns: {
						keyword: 'Keyword',
						id: 'ID',
						host: 'Host',
						hostName: 'Host Name',
						hostIp: 'Host IP',
						timestamp: 'Heartbeat Time',
						supervisorStatus: 'Supervisor Status',
						supervisorVersion: 'Supervisor Version',
						heartbeatServer: 'Heartbeat Server',
					},
				},
				form: {
					keywordPlaceholder: 'Enter keyword',
					hostNamePlaceholder: 'Host Name',
					hostIpPlaceholder: 'Host IP',
					supervisorStatusPlaceholder: 'Supervisor Status',
				},
				buttons: {
					loadMetrics: 'Host Load',
				},
				dialog: {
					loadMetricsTitle: 'Host Load',
				},
				charts: {
					cpuUsage: 'CPU Usage',
					memoryUsage: 'Memory Usage',
					diskUsage: 'Disk Usage',
					systemLoad: 'System Load',
					loadAverage: 'Load Average',
					networkTraffic: 'Network Traffic',
					rx: 'RX',
					tx: 'TX',
					procAndUptime: 'Processes & Uptime',
					processCount: 'Processes',
					uptimeHours: 'Uptime (h)',
				},
				uptime: {
					days: 'd',
					hours: 'h',
					minutes: 'm',
				},
			},
		},
	},
};
