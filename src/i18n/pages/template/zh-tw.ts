export default {
	message: {
		pages: {
			template: {
				table: {
					columns: {
						keyword: '關鍵詞',
						id: 'ID',
						templateName: '模板名稱',
						share: '共享',
						scriptType: '腳本類型',
						editorTheme: '編輯器主題',
						scriptContent: '腳本內容',
						args: '腳本參數',
						envs: '環境變量',
						timeout: '超時（分鐘）',
						status: '狀態',
						creatorName: '創建人',
						createDatetime: '創建時間',
					},
				},
				form: {
					keywordPlaceholder: '請輸入關鍵詞',
					templateNamePlaceholder: '請輸入模板名稱',
					templateNameRequired: '請輸入模板名稱',
					timeoutPlaceholder: '0 表示超時',
					timeoutSuffix: '分鐘',
					timeoutRequired: '請輸入超時時間',
					scriptContentRequired: '請輸入腳本內容',
					scriptTypePlaceholder: '選擇腳本類型',
					editorThemePlaceholder: '選擇編輯器主題',
					statusPlaceholder: '選擇狀態',
					sharePlaceholder: '選擇是否共享',
				},
				dict: {
					share: {
						no: '否',
						yes: '是',
					},
					scriptType: {
						shell: 'Shell',
						python: 'Python',
					},
					editorTheme: {
						light: '亮色',
						dark: '暗色',
					},
					status: {
						enabled: '啟用',
						disabled: '禁用',
					},
				},
				tabs: {
					all: '全部',
				},
				messages: {
					deleteConfirm: '確定要刪除該模板嗎？',
					deleteSuccess: '刪除成功',
				},
				buttons: {
					add: '新增模板',
					edit: '編輯模板',
					delete: '刪除模板',
				},
			},
		},
	},
};