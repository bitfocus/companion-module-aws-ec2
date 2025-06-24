import { RebootInstancesCommand, StartInstancesCommand, StopInstancesCommand } from '@aws-sdk/client-ec2'

export function getActionDefinitions(self) {
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
		start_stop_instance: {
			name: 'Start/Stop/Reboot EC2 Instance',
			description: 'Start, stop or reboot an existing EC2 Instance',
			options: [
				{
					type: 'dropdown',
					id: 'instanceId',
					label: 'Select EC2 Instance',
					choices: getInstanceChoices(),
				},
				{
					type: 'dropdown',
					id: 'operation',
					label: 'Operation',
					default: 'start',
					choices: [
						{ id: 'start', label: 'Start Instance' },
						{ id: 'stop', label: 'Stop Instance' },
						{ id: 'reboot', label: 'Reboot Instance' },
						{ id: 'forcestop', label: 'Force Stop Instance' },
					],
				},
			],
			callback: async (action) => {
				const operation = action.options.operation

				// Parse the instance IDs into an array
				const instanceID = action.options.instanceId

				if (operation === 'start') {
					await self.ec2Client.send(new StartInstancesCommand({ InstanceIds: [instanceID] }))
				} else if (operation === 'stop') {
					await self.ec2Client.send(new StopInstancesCommand({ InstanceIds: [instanceID] }))
				} else if (operation === 'reboot') {
					await self.ec2Client.send(new RebootInstancesCommand({ InstanceIds: [instanceID] }))
				} else if (operation === 'forcestop') {
					await self.ec2Client.send(new StopInstancesCommand({ InstanceIds: [instanceID] }, { Force: true }))
				}
			},
		},
	}
}
