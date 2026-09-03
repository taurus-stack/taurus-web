export default {
	message: {
		pages: {
			programCommand: {
				table: {
					columns: {
						keyword: 'Keyword',
						id: 'ID',
						host: 'Host',
						hostName: 'Host Name',
						hostIp: 'Host IP',
						programName: 'Program Name',
						action: 'Action',
						targetVersion: 'Target Version',
						status: 'Status',
						dispatched: 'Dispatched',
						dispatchedAt: 'Dispatched At',
						resultMessage: 'Result',
						executedAt: 'Executed At',
						config: 'Config',
					},
				},
				form: {
					keywordPlaceholder: 'Enter keyword',
					hostNamePlaceholder: 'Host Name',
					hostIpPlaceholder: 'Host IP',
					hostPlaceholder: 'Select host',
					hostRequired: 'Please select a host',
					programNamePlaceholder: 'e.g. taurus-executor',
					programNameRequired: 'Please enter program name',
					actionPlaceholder: 'Select action',
					actionRequired: 'Please select an action',
					targetVersionPlaceholder: 'Fill in for upgrade',
					statusPlaceholder: 'Status',
					configPlaceholder: 'JSON format config',
				},
				action: {
					install: 'Install',
					upgrade: 'Upgrade',
					start: 'Start',
					stop: 'Stop',
					restart: 'Restart',
					remove: 'Remove',
				},
				status: {
					pending: 'Pending',
					running: 'Running',
					success: 'Success',
					failed: 'Failed',
				},
				bool: {
					yes: 'Yes',
					no: 'No',
				},
			},
		},
	},
};
