export default {
	message: {
		pages: {
			program: {
				table: {
					columns: {
						keyword: 'Keyword',
						id: 'ID',
						host: 'Host',
						hostName: 'Host Name',
						hostIp: 'Host IP',
						name: 'Program Name',
						version: 'Version',
						status: 'Status',
						pid: 'PID',
						port: 'Port',
						autoStart: 'Auto Start',
						restartOnCrash: 'Auto Restart on Crash',
						config: 'Config',
					},
				},
				form: {
					keywordPlaceholder: 'Enter keyword',
					hostNamePlaceholder: 'Host Name',
					hostIpPlaceholder: 'Host IP',
					namePlaceholder: 'Program Name',
					statusPlaceholder: 'Status',
				},
				status: {
					stopped: 'Stopped',
					starting: 'Starting',
					running: 'Running',
					stopping: 'Stopping',
					crashed: 'Crashed',
					upgrading: 'Upgrading',
				},
				bool: {
					yes: 'Yes',
					no: 'No',
				},
				buttons: {
					start: 'Start',
					stop: 'Stop',
					restart: 'Restart',
					remove: 'Remove',
				},
				messages: {
					startSent: 'Start command sent',
					stopSent: 'Stop command sent',
					restartSent: 'Restart command sent',
					removeSent: 'Remove command sent',
					removeConfirmTitle: 'Warning',
					removeConfirm: 'Are you sure to remove program: {name}? It will be uninstalled from Supervisor.',
				},
			},
		},
	},
};
