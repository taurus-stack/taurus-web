export default {
	message: {
		pages: {
			host: {
				table: {
					columns: {
						keyword: '关键词',
						id: 'ID',
						hostUuid: '主机UUID',
						hostName: '主机名称',
						hostIp: '主机IP',
						hostUsername: '主机用户名',
						hostType: '主机类型',
						status: '审批状态',
						onlineStatus: '在线状态',
						supervisorVersion: 'Supervisor版本',
						lastHeartbeatAt: '最后心跳时间',
						certificateStatus: '证书状态',
						extraInfo: '额外信息',
						heartbeatServer: '心跳服务器',
					},
				},
				form: {
					keywordPlaceholder: '请输入关键词',
					hostNamePlaceholder: '请输入主机名称',
					hostNameRequired: '请输入主机名称',
					hostIpPlaceholder: '请输入主机IP',
					hostUsernamePlaceholder: '请输入主机用户名',
					hostTypePlaceholder: '请选择主机类型',
					statusPlaceholder: '请选择审批状态',
					heartbeatServerPlaceholder: '请选择心跳服务器',
				},
				status: {
					pending: '待审批',
					approved: '已批准',
					rejected: '已拒绝',
					disabled: '已禁用',
				},
				online: {
					offline: '离线',
					online: '在线',
				},
				certificate: {
					valid: '有效',
					revoked: '已吊销',
					expired: '已过期',
				},
				hostType: {
					linux: 'Linux',
					windows: 'Windows',
					unknown: '未知',
				},
				buttons: {
					program: '程序',
					log: '日志',
				},
			},
		},
	},
};
