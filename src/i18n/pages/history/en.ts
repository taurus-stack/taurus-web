export default {
	message: {
		pages: {
			history: {
				table: {
					columns: {
						expand: 'Expand',
						id: 'ID',
						executionId: 'Execution ID',
						batchId: 'Batch',
						executionType: 'Execution Type',
						hostIp: 'Host IP',
						hostName: 'Host Name',
						command: 'Command/Script',
						scriptType: 'Script Type',
						status: 'Status',
						exitCode: 'Exit Code',
						duration: 'Duration',
						username: 'Executor',
						startedAt: 'Start Time',
						finishedAt: 'End Time',
						createDatetime: 'Create Time',
					},
				},
				form: {
					executionIdPlaceholder: 'Search execution ID',
					batchIdPlaceholder: 'Filter by batch',
					executionTypePlaceholder: 'Select type',
					hostIpPlaceholder: 'Search host IP',
					commandPlaceholder: 'Search command',
					statusPlaceholder: 'Select status',
				},
				dict: {
					executionType: {
						command: 'Command',
						script: 'Script',
					},
					status: {
						pending: 'Pending',
						running: 'Running',
						completed: 'Completed',
						failed: 'Failed',
					},
				},
				tabs: {
					all: 'All',
				},
				messages: {
					noOutput: 'No output',
					confirmDelete: 'Are you sure you want to delete this execution record?',
					deleteSuccess: 'Delete successful',
				},
				buttons: {
					view: 'View',
					delete: 'Delete',
				},
			},
		},
	},
};