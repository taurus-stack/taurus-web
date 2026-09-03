export default {
	message: {
		pages: {
			heartbeatServer: {
				table: {
					columns: {
						keyword: 'Keyword',
						id: 'ID',
						name: 'Server Name',
						address: 'Server Address',
						subnet: 'Subnet',
						maxConnections: 'Max Connections',
						currentConnections: 'Current Connections',
						loadRatio: 'Load Ratio',
						weight: 'Weight',
						isActive: 'Active',
					},
					status: {
						enabled: 'Enabled',
						disabled: 'Disabled',
					},
				},
				form: {
					keywordPlaceholder: 'Enter keyword',
					namePlaceholder: 'Enter server name',
					nameRequired: 'Please enter server name',
					nameSearchPlaceholder: 'Server name',
					addressPlaceholder: 'e.g. http://hb-node1:8000',
					addressRequired: 'Please enter server address',
					addressSearchPlaceholder: 'Server address',
					subnetPlaceholder: 'CIDR format, e.g. 192.168.1.0/24, empty = fallback',
					subnetSearchPlaceholder: 'Subnet',
					maxConnectionsPlaceholder: 'Enter max connections',
					weightPlaceholder: 'Higher = higher priority',
					isActiveSearchPlaceholder: 'Active',
				},
			},
		},
	},
};