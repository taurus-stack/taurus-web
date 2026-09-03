export default {
	message: {
		pages: {
			programCommand: {
				table: {
					columns: {
						keyword: '關鍵詞',
						id: 'ID',
						host: '所屬主機',
						hostName: '主機名稱',
						hostIp: '主機IP',
						programName: '程序名稱',
						action: '操作類型',
						targetVersion: '目標版本',
						status: '執行狀態',
						dispatched: '已下發',
						dispatchedAt: '下發時間',
						resultMessage: '執行結果',
						executedAt: '執行時間',
						config: '程序配置',
					},
				},
				form: {
					keywordPlaceholder: '請輸入關鍵詞',
					hostNamePlaceholder: '主機名稱',
					hostIpPlaceholder: '主機IP',
					hostPlaceholder: '請選擇主機',
					hostRequired: '請選擇主機',
					programNamePlaceholder: '如 taurus-executor',
					programNameRequired: '請輸入程序名稱',
					actionPlaceholder: '請選擇操作類型',
					actionRequired: '請選擇操作類型',
					targetVersionPlaceholder: '升級時填寫',
					statusPlaceholder: '執行狀態',
					configPlaceholder: 'JSON格式配置',
				},
				action: {
					install: '安裝',
					upgrade: '升級',
					start: '啟動',
					stop: '停止',
					restart: '重啟',
					remove: '移除',
				},
				status: {
					pending: '待執行',
					running: '執行中',
					success: '執行成功',
					failed: '執行失敗',
				},
				bool: {
					yes: '是',
					no: '否',
				},
			},
		},
	},
};
