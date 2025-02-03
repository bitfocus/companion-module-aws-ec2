export function getFeedbackDefinitions(self) {
	function getInstanceChoices() {
		const choices = []
		for (const instanceID in self.instances) {
			const instance = self.instances[instanceID]
			choices.push({
				id: instanceID,
				label: `${instance.name} (${instanceID})`,
			})
		}
		return choices
	}
	return {
		instance_state: {
			type: 'boolean',
			name: 'EC2 Instance State',
			description: 'Check if an EC2 instance is in a specific state',
			options: [
				{
					type: 'dropdown',
					id: 'instanceId',
					label: 'Select EC2 Instance',
					choices: getInstanceChoices(), // Use the dynamic instance choices
				},
				{
					type: 'dropdown',
					id: 'state',
					label: 'Desired State',
					tooltip: 'Select the desired state of the instance',
					default: 'running',
					choices: [
						{ id: 'pending', label: 'Pending' },
						{ id: 'running', label: 'Running' },
						{ id: 'stopping', label: 'Stopping' },
						{ id: 'stopped', label: 'Stopped' },
						{ id: 'shutting-down', label: 'Shutting Down' },
						{ id: 'terminated', label: 'Terminated' },
					],
				},
			],
			callback: async (feedback) => {
				const instanceID = feedback.options.instanceId
				const desiredState = feedback.options.state

				if (!instanceID) {
					return false // No instance ID provided
				}

				// Fetch data for all instances (using the cache)
				const instance = self.instances[instanceID]

				if (!instance) {
					console.log(`Instance with ID ${instanceID} does not exist in cache.`)
					return false // Instance does not exist
				}

				return instance.state === desiredState
			},
		},
	}
}
