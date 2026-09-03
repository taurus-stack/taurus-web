export default {
	message: {
		pages: {
			heartbeatServer: {
				table: {
					columns: {
						keyword: '关键词',
						id: 'ID',
						name: '服务器名称',
						address: '服务器地址',
						subnet: '负责网段',
						maxConnections: '最大连接数',
						currentConnections: '当前连接数',
						loadRatio: '负载比率',
						weight: '权重',
						isActive: '是否启用',
					},
					status: {
						enabled: '启用',
						disabled: '禁用',
					},
				},
				form: {
					keywordPlaceholder: '请输入关键词',
					namePlaceholder: '请输入服务器名称',
					nameRequired: '请输入服务器名称',
					nameSearchPlaceholder: '服务器名称',
					addressPlaceholder: '如 http://hb-node1:8000',
					addressRequired: '请输入服务器地址',
					addressSearchPlaceholder: '服务器地址',
					subnetPlaceholder: 'CIDR格式，如 192.168.1.0/24，空表示兜底节点',
					subnetSearchPlaceholder: '负责网段',
					maxConnectionsPlaceholder: '请输入最大连接数',
					weightPlaceholder: '权重越高越优先分配',
					isActiveSearchPlaceholder: '是否启用',
				},
			},
		},
	},
};