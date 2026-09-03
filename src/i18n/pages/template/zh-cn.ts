export default {
	message: {
		pages: {
			template: {
				table: {
					columns: {
						keyword: '关键词',
						id: 'ID',
						templateName: '模板名称',
						share: '共享',
						scriptType: '脚本类型',
						editorTheme: '编辑器主题',
						scriptContent: '脚本内容',
						args: '脚本参数',
						envs: '环境变量',
						timeout: '超时（分钟）',
						status: '状态',
						creatorName: '创建人',
						createDatetime: '创建时间',
					},
				},
				form: {
					keywordPlaceholder: '请输入关键词',
					templateNamePlaceholder: '请输入模板名称',
					templateNameRequired: '请输入模板名称',
					timeoutPlaceholder: '0 表示不超时',
					timeoutSuffix: '分钟',
					timeoutRequired: '请输入超时时间',
					scriptContentRequired: '请输入脚本内容',
					scriptTypePlaceholder: '选择脚本类型',
					editorThemePlaceholder: '选择编辑器主题',
					statusPlaceholder: '选择状态',
					sharePlaceholder: '选择是否共享',
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
						enabled: '启用',
						disabled: '禁用',
					},
				},
				tabs: {
					all: '全部',
				},
				messages: {
					deleteConfirm: '确定要删除该模板吗？',
					deleteSuccess: '删除成功',
				},
				buttons: {
					add: '新增模板',
					edit: '编辑模板',
					delete: '删除模板',
				},
			},
		},
	},
};