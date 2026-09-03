export default {
	message: {
		pages: {
			programCommand: {
				table: {
					columns: {
						keyword: '关键词',
						id: 'ID',
						host: '所属主机',
						hostName: '主机名称',
						hostIp: '主机IP',
						programName: '程序名称',
						action: '操作类型',
						targetVersion: '目标版本',
						status: '执行状态',
						dispatched: '已下发',
						dispatchedAt: '下发时间',
						resultMessage: '执行结果',
						executedAt: '执行时间',
						config: '程序配置',
					},
				},
				form: {
					keywordPlaceholder: '请输入关键词',
					hostNamePlaceholder: '主机名称',
					hostIpPlaceholder: '主机IP',
					hostPlaceholder: '请选择主机',
					hostRequired: '请选择主机',
					programNamePlaceholder: '如 taurus-executor',
					programNameRequired: '请输入程序名称',
					actionPlaceholder: '请选择操作类型',
					actionRequired: '请选择操作类型',
					targetVersionPlaceholder: '升级时填写',
					statusPlaceholder: '执行状态',
					configPlaceholder: 'JSON格式配置',
				},
				action: {
					install: '安装',
					upgrade: '升级',
					start: '启动',
					stop: '停止',
					restart: '重启',
					remove: '移除',
				},
				status: {
					pending: '待执行',
					running: '执行中',
					success: '执行成功',
					failed: '执行失败',
				},
				bool: {
					yes: '是',
					no: '否',
				},
			},
		},
	},
};
