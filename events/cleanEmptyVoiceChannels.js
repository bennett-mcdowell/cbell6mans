const client = require('../index');

// Constants
const PARENT_CATEGORY_ID = '925748371002654720'; // 6mans category
const EXCLUDED_CHANNEL_ID = '1223084653846724638'; // Hangout
const EMPTY_CHANNEL_TIMEOUT = 10 * 1000; // 10 seconds

// Listener for voice state updates
client.on('voiceStateUpdate', (oldState, newState) => {
	const oldChannel = oldState.channel;
	const newChannel = newState.channel;

	// Check if the user moved or left a voice channel
	if (oldChannel !== newChannel) {
		// If the old channel becomes empty and it's not the excluded channel
		if (oldChannel && oldChannel.members.size === 0 && oldChannel.parentId === PARENT_CATEGORY_ID && oldChannel.id !== EXCLUDED_CHANNEL_ID) {
			// Schedule deletion of the empty channel
			setTimeout(() => {
				// Check if the channel still exists before attempting to delete it
				const channelToDelete = oldState.guild.channels.cache.get(oldChannel.id);
				if (channelToDelete && channelToDelete.members.size === 0) {
					channelToDelete.delete()
						.then(() => console.log(`Deleted empty channel ${oldChannel.name}`))
						.catch(error => console.error(`Error deleting empty channel ${oldChannel.name}:`, error));
				}
			}, EMPTY_CHANNEL_TIMEOUT);
		}
	}
});
