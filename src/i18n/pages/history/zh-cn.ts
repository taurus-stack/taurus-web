export default {
	message: {
		pages: {
			history: {
				table: {
					columns: {
						expand: '展开',
						id: 'ID',
						executionId: '执行ID',
						batchId: '批次',
						executionType: '执行类型',
						hostIp: '主机IP',
						hostName: '主机名',
						command: '命令/脚本',
						scriptType: '脚本类型',
						status: '状态',
						exitCode: '退出码',
						duration: '耗时',
						username: '执行用户',
						startedAt: '开始时间',
						finishedAt: '结束时间',
						createDatetime: '创建时间',
					},
				},
				form: {
					executionIdPlaceholder: '搜索执行ID',
					batchIdPlaceholder: '按批次筛选',
					executionTypePlaceholder: '选择类型',
					hostIpPlaceholder: '搜索主机IP',
					commandPlaceholder: '搜索命令',
					statusPlaceholder: '选择状态',
				},
				dict: {
					executionType: {
						command: '命令',
						script: '脚本',
					},
					status: {
						pending: '待执行',
						running: '执行中',
						completed: '已完成',
						failed: '失败',
					},
				},
				tabs: {
					all: '全部',
				},
				messages: {
					noOutput: '无输出',
					confirmDelete: '确定要删除该执行记录吗？',
					deleteSuccess: '删除成功',
				},
				buttons: {
					view: '查看',
					delete: '删除',
				},
			},
		},
	},
};