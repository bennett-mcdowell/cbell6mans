const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { queue } = require('../../utils/manageQueue');
const { get6mansChannelId } = require('../../utils/retrieveFromDatabase');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('status')
		.setDescription('Shows the queue status')
		.setDMPermission(false),
	async execute(interaction) {


		// Displays queue as embed
		const embed = new EmbedBuilder()
			.setTitle('Queue')
			.setTimestamp()
			.setColor(0x09cc00);

		// Outputs the users in queue
		const queueList = queue.map((userId, index) => {
			const user = interaction.guild.members.cache.get(userId);
			return user ? `${index + 1}. ${user.displayName}` : '';
		}).join('\n');

		if (queueList) {
			embed.addFields({ name: 'Players:', value: queueList });
		}

		return interaction.reply({ embeds: [embed.toJSON()] });
	},
};