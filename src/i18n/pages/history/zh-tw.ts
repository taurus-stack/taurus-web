export default {
	message: {
		pages: {
			history: {
				table: {
					columns: {
						expand: '展開',
						id: 'ID',
						executionId: '執行ID',
						batchId: '批次',
						executionType: '執行類型',
						hostIp: '主機IP',
						hostName: '主機名',
						command: '命令/腳本',
						scriptType: '腳本類型',
						status: '狀態',
						exitCode: '退出碼',
						duration: '耗時',
						username: '執行用戶',
						startedAt: '開始時間',
						finishedAt: '結束時間',
						createDatetime: '創建時間',
					},
				},
				form: {
					executionIdPlaceholder: '搜索執行ID',
					batchIdPlaceholder: '按批次篩選',
					executionTypePlaceholder: '選擇類型',
					hostIpPlaceholder: '搜索主機IP',
					commandPlaceholder: '搜索命令',
					statusPlaceholder: '選擇狀態',
				},
				dict: {
					executionType: {
						command: '命令',
						script: '腳本',
					},
					status: {
						pending: '待執行',
						running: '執行中',
						completed: '已完成',
						failed: '失敗',
					},
				},
				tabs: {
					all: '全部',
				},
				messages: {
					noOutput: '無輸出',
					confirmDelete: '確定要刪除該執行記錄嗎？',
					deleteSuccess: '刪除成功',
				},
				buttons: {
					view: '查看',
					delete: '刪除',
				},
			},
		},
	},
};