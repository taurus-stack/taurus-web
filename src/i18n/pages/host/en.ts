export default {
	message: {
		pages: {
			host: {
				table: {
					columns: {
						keyword: 'Keyword',
						id: 'ID',
						hostUuid: 'Host UUID',
						hostName: 'Host Name',
						hostIp: 'Host IP',
						hostUsername: 'Host Username',
						hostType: 'Host Type',
						status: 'Approval Status',
						onlineStatus: 'Online Status',
						supervisorVersion: 'Supervisor Version',
						lastHeartbeatAt: 'Last Heartbeat',
						certificateStatus: 'Certificate Status',
						extraInfo: 'Extra Info',
						heartbeatServer: 'Heartbeat Server',
					},
				},
				form: {
					keywordPlaceholder: 'Enter keyword',
					hostNamePlaceholder: 'Enter host name',
					hostNameRequired: 'Please enter host name',
					hostIpPlaceholder: 'Enter host IP',
					hostUsernamePlaceholder: 'Enter host username',
					hostTypePlaceholder: 'Select host type',
					statusPlaceholder: 'Select approval status',
					heartbeatServerPlaceholder: 'Select heartbeat server',
				},
				status: {
					pending: 'Pending',
					approved: 'Approved',
					rejected: 'Rejected',
					disabled: 'Disabled',
				},
				online: {
					offline: 'Offline',
					online: 'Online',
				},
				certificate: {
					valid: 'Valid',
					revoked: 'Revoked',
					expired: 'Expired',
				},
				hostType: {
					linux: 'Linux',
					windows: 'Windows',
					unknown: 'Unknown',
				},
				buttons: {
					program: 'Programs',
					log: 'Logs',
				},
			},
		},
	},
};
