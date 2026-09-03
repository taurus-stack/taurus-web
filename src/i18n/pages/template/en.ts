export default {
	message: {
		pages: {
			template: {
				table: {
					columns: {
						keyword: 'Keyword',
						id: 'ID',
						templateName: 'Template Name',
						share: 'Shared',
						scriptType: 'Script Type',
						editorTheme: 'Editor Theme',
						scriptContent: 'Script Content',
						args: 'Script Arguments',
						envs: 'Environment Variables',
						timeout: 'Timeout (min)',
						status: 'Status',
						creatorName: 'Creator',
						createDatetime: 'Create Time',
					},
				},
				form: {
					keywordPlaceholder: 'Enter keyword',
					templateNamePlaceholder: 'Enter template name',
					templateNameRequired: 'Please enter template name',
					timeoutPlaceholder: '0 means no timeout',
					timeoutSuffix: 'min',
					timeoutRequired: 'Please enter timeout',
					scriptContentRequired: 'Please enter script content',
					scriptTypePlaceholder: 'Select script type',
					editorThemePlaceholder: 'Select editor theme',
					statusPlaceholder: 'Select status',
					sharePlaceholder: 'Select shared status',
				},
				dict: {
					share: {
						no: 'No',
						yes: 'Yes',
					},
					scriptType: {
						shell: 'Shell',
						python: 'Python',
					},
					editorTheme: {
						light: 'Light',
						dark: 'Dark',
					},
					status: {
						enabled: 'Enabled',
						disabled: 'Disabled',
					},
				},
				tabs: {
					all: 'All',
				},
				messages: {
					deleteConfirm: 'Are you sure you want to delete this template?',
					deleteSuccess: 'Delete successful',
				},
				buttons: {
					add: 'Add Template',
					edit: 'Edit Template',
					delete: 'Delete Template',
				},
			},
		},
	},
};