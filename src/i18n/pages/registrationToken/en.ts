export default {
	message: {
		pages: {
			registrationToken: {
				table: {
					columns: {
						keyword: 'Keyword',
						id: 'ID',
						name: 'Token Name',
						tokenPrefix: 'Token Prefix',
						description: 'Description',
						expiresAt: 'Expires At',
						maxUses: 'Max Uses',
						usedCount: 'Used Count',
						allowedIps: 'Allowed IPs',
						autoApprove: 'Auto Approve',
						isActive: 'Active',
					},
				},
				form: {
					keywordPlaceholder: 'Enter keyword',
					namePlaceholder: 'Enter token name',
					nameRequired: 'Please enter token name',
					descriptionPlaceholder: 'Enter description',
					descriptionLabel: 'Description',
					expiresAtPlaceholder: 'Select expiration time',
					expiresAtRequired: 'Please select expiration time',
					maxUsesPlaceholder: 'Enter max uses',
					allowedIpsPlaceholder: 'One IP per line, empty for no limit',
					autoApprovePlaceholder: 'Auto Approve',
					isActivePlaceholder: 'Active',
				},
				bool: {
					yes: 'Yes',
					no: 'No',
				},
				enabled: {
					enabled: 'Enabled',
					disabled: 'Disabled',
				},
				messages: {
					tokenWarning: '⚠️ The plain token is shown only once. Save it securely!',
					tokenLabel: 'Generated registration token:',
					tokenDialogTitle: 'Registration Token Generated',
					copyAndClose: 'Copy & Close',
					copiedToClipboard: 'Token copied to clipboard',
					copyFailed: 'Copy failed, please copy manually',
				},
			},
		},
	},
};
