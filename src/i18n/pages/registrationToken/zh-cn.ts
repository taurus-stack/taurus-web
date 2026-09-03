export default {
	message: {
		pages: {
			registrationToken: {
				table: {
					columns: {
						keyword: '关键词',
						id: 'ID',
						name: '令牌名称',
						tokenPrefix: '令牌前缀',
						description: '描述',
						expiresAt: '过期时间',
						maxUses: '最大使用次数',
						usedCount: '已使用次数',
						allowedIps: 'IP白名单',
						autoApprove: '自动审批',
						isActive: '是否启用',
					},
				},
				form: {
					keywordPlaceholder: '请输入关键词',
					namePlaceholder: '请输入令牌名称',
					nameRequired: '请输入令牌名称',
					descriptionPlaceholder: '请输入描述',
					descriptionLabel: '描述',
					expiresAtPlaceholder: '请选择过期时间',
					expiresAtRequired: '请选择过期时间',
					maxUsesPlaceholder: '请输入最大使用次数',
					allowedIpsPlaceholder: '每行一个IP，空则不限制',
					autoApprovePlaceholder: '自动审批',
					isActivePlaceholder: '是否启用',
				},
				bool: {
					yes: '是',
					no: '否',
				},
				enabled: {
					enabled: '启用',
					disabled: '禁用',
				},
				messages: {
					// crud.tsx 中 ElMessageBox.alert 弹窗
					tokenWarning: '⚠️ 明文令牌仅显示一次，请妥善保存!',
					tokenLabel: '生成的注册令牌：',
					tokenDialogTitle: '注册令牌已生成',
					copyAndClose: '复制并关闭',
					copiedToClipboard: '令牌已复制到剪贴板',
					copyFailed: '复制失败，请手动复制',
				},
			},
		},
	},
};
