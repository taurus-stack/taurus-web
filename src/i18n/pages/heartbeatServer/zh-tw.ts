export default {
	message: {
		pages: {
			heartbeatServer: {
				table: {
					columns: {
						keyword: '關鍵詞',
						id: 'ID',
						name: '服務器名稱',
						address: '服務器地址',
						subnet: '負責網段',
						maxConnections: '最大連接數',
						currentConnections: '當前連接數',
						loadRatio: '負載比率',
						weight: '權重',
						isActive: '是否啟用',
					},
					status: {
						enabled: '啟用',
						disabled: '禁用',
					},
				},
				form: {
					keywordPlaceholder: '請輸入關鍵詞',
					namePlaceholder: '請輸入服務器名稱',
					nameRequired: '請輸入服務器名稱',
					nameSearchPlaceholder: '服務器名稱',
					addressPlaceholder: '如 http://hb-node1:8000',
					addressRequired: '請輸入服務器地址',
					addressSearchPlaceholder: '服務器地址',
					subnetPlaceholder: 'CIDR格式，如 192.168.1.0/24，空表示兜底節點',
					subnetSearchPlaceholder: '負責網段',
					maxConnectionsPlaceholder: '請輸入最大連接數',
					weightPlaceholder: '權重越高越優先分配',
					isActiveSearchPlaceholder: '是否啟用',
				},
			},
		},
	},
};