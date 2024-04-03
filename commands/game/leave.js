const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { queue, removeFromQueue } = require('../../utils/manageQueue');
const { get6mansChannelId } = require('../../utils/retrieveFromDatabase');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Removes you from the queue.')
		.setDMPermission(false),
	async execute(interaction) {
		const userId = interaction.user.id;
		const storedChannelId = await get6mansChannelId(6);

		// Check if the command is being executed in the allowed channel
		const currentChannelId = interaction.channel.id;
		if (currentChannelId !== storedChannelId) {
			return interaction.reply({content: 'This command can only be executed in the 6mans-lobby channel.', ephemeral: true});
		}


		// Checks if user is in queue
		const userIndex = queue.indexOf(userId);
		if (userIndex === -1) {
			return interaction.reply("You are not in the queue.");
		}

		// Retrieve the user from guild members cache
		const removedUser = interaction.guild.members.cache.get(userId);

		// Remove user from the queue
		await removeFromQueue(interaction.user.id);

		// Creates an embed of the updated queue
		const embed = new EmbedBuilder()
			.setTitle('Queue')
			.setTimestamp()
			.setColor(0xe92a16);

		// Outputs the users in queue
		const queueList = queue.map((userId, index) => {
			const user = interaction.guild.members.cache.get(userId);
			return user ? `${index + 1}. ${user.displayName}` : '';
		}).join('\n');

		if (queueList) {
			embed.addFields({ name: 'Players:', value: queueList });
		}

		// Sends a message indicating the user was removed from the queue
		await interaction.reply(`${removedUser.displayName} has been removed from the queue.`);

		// Sends the updated queue as an embed
		return interaction.followUp({ embeds: [embed.toJSON()] });
	},
};