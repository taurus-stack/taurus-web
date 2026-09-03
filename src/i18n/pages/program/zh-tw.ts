export default {
	message: {
		pages: {
			program: {
				table: {
					columns: {
						keyword: '關鍵詞',
						id: 'ID',
						host: '所屬主機',
						hostName: '主機名稱',
						hostIp: '主機IP',
						name: '程序名稱',
						version: '當前版本',
						status: '運行狀態',
						pid: '進程PID',
						port: '服務端口',
						autoStart: '自動啟動',
						restartOnCrash: '崩潰自動重啟',
						config: '程序配置',
					},
				},
				form: {
					keywordPlaceholder: '請輸入關鍵詞',
					hostNamePlaceholder: '主機名稱',
					hostIpPlaceholder: '主機IP',
					namePlaceholder: '程序名稱',
					statusPlaceholder: '運行狀態',
				},
				status: {
					stopped: '已停止',
					starting: '啟動中',
					running: '運行中',
					stopping: '停止中',
					crashed: '已崩潰',
					upgrading: '升級中',
				},
				bool: {
					yes: '是',
					no: '否',
				},
				buttons: {
					start: '啟動',
					stop: '停止',
					restart: '重啟',
					remove: '移除',
				},
				messages: {
					startSent: '啟動指令已下發',
					stopSent: '停止指令已下發',
					restartSent: '重啟指令已下發',
					removeSent: '移除指令已下發',
					removeConfirmTitle: '警告',
					removeConfirm: '確認移除程序：{name}？移除後程序將被 Supervisor 卸載。',
				},
			},
		},
	},
};
