export default {
	message: {
		pages: {
			host: {
				table: {
					columns: {
						keyword: '關鍵詞',
						id: 'ID',
						hostUuid: '主機UUID',
						hostName: '主機名稱',
						hostIp: '主機IP',
						hostUsername: '主機用戶名',
						hostType: '主機類型',
						status: '審批狀態',
						onlineStatus: '在線狀態',
						supervisorVersion: 'Supervisor版本',
						lastHeartbeatAt: '最後心跳時間',
						certificateStatus: '證書狀態',
						extraInfo: '額外信息',
						heartbeatServer: '心跳服務器',
					},
				},
				form: {
					keywordPlaceholder: '請輸入關鍵詞',
					hostNamePlaceholder: '請輸入主機名稱',
					hostNameRequired: '請輸入主機名稱',
					hostIpPlaceholder: '請輸入主機IP',
					hostUsernamePlaceholder: '請輸入主機用戶名',
					hostTypePlaceholder: '請選擇主機類型',
					statusPlaceholder: '請選擇審批狀態',
					heartbeatServerPlaceholder: '請選擇心跳服務器',
				},
				status: {
					pending: '待審批',
					approved: '已批准',
					rejected: '已拒絕',
					disabled: '已禁用',
				},
				online: {
					offline: '離線',
					online: '在線',
				},
				certificate: {
					valid: '有效',
					revoked: '已吊銷',
					expired: '已過期',
				},
				hostType: {
					linux: 'Linux',
					windows: 'Windows',
					unknown: '未知',
				},
				buttons: {
					program: '程序',
					log: '日誌',
				},
			},
		},
	},
};
