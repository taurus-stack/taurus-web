export default {
	message: {
		pages: {
			registrationToken: {
				table: {
					columns: {
						keyword: '關鍵詞',
						id: 'ID',
						name: '令牌名稱',
						tokenPrefix: '令牌前綴',
						description: '描述',
						expiresAt: '過期時間',
						maxUses: '最大使用次數',
						usedCount: '已使用次數',
						allowedIps: 'IP白名單',
						autoApprove: '自動審批',
						isActive: '是否啟用',
					},
				},
				form: {
					keywordPlaceholder: '請輸入關鍵詞',
					namePlaceholder: '請輸入令牌名稱',
					nameRequired: '請輸入令牌名稱',
					descriptionPlaceholder: '請輸入描述',
					descriptionLabel: '描述',
					expiresAtPlaceholder: '請選擇過期時間',
					expiresAtRequired: '請選擇過期時間',
					maxUsesPlaceholder: '請輸入最大使用次數',
					allowedIpsPlaceholder: '每行一個IP，空則不限制',
					autoApprovePlaceholder: '自動審批',
					isActivePlaceholder: '是否啟用',
				},
				bool: {
					yes: '是',
					no: '否',
				},
				enabled: {
					enabled: '啟用',
					disabled: '禁用',
				},
				messages: {
					tokenWarning: '⚠️ 明文令牌僅顯示一次，請妥善保存!',
					tokenLabel: '生成的註冊令牌：',
					tokenDialogTitle: '註冊令牌已生成',
					copyAndClose: '複製並關閉',
					copiedToClipboard: '令牌已複製到剪貼板',
					copyFailed: '複製失敗，請手動複製',
				},
			},
		},
	},
};
