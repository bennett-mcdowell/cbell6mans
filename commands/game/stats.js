const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { get6mansChannelId, getPlayerStats } = require('../../utils/retrieveFromDatabase');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Shows your stats or the stats of the mentioned player')
		.addStringOption(option =>
			option.setName('player')
				.setDescription('Mention the player or leave blank to see your stats')),
	async execute(interaction) {
		const storedChannelId = await get6mansChannelId(6);

		// Check if the command is being executed in the allowed channel
		const currentChannelId = interaction.channel.id;
		if (currentChannelId !== storedChannelId) {
			return interaction.reply({content: 'This command can only be executed in 6mans-lobby channel.', ephemeral: true});
		}

		let userId = interaction.user.id; // Default to the user's ID
		let userName = interaction.user.username; // Default to the user's name
		let userAvatar = interaction.user.displayAvatarURL(); // Default to the user's avatar
		const mentionedUser = interaction.options.getString('player');

		if (mentionedUser) {
			// Extract the mentioned user's ID from the string input
			const match = mentionedUser.match(/^<@!?(\d+)>$/);
			if (match) {
				userId = match[1]; // Extract the user ID from the mention
				// Fetch the mentioned user's name and avatar
				const user = await interaction.client.users.fetch(userId);
				if (user) {
					userName = user.username;
					userAvatar = user.displayAvatarURL();
				}
			}
		}

		const stats = await getPlayerStats(userId);

		if (!stats) {
			return interaction.reply('No stats found.');
		} else {
			const winRatio = stats.wins + stats.losses !== 0 ?
				((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(2) : '0';

			const embed = new EmbedBuilder()
				.setTitle(`Stats for ${userName}`)
				.addFields({ name: 'Player', value: `<@${userId}>`, inline: true })
				.addFields({ name: 'Rank', value: String(stats.eloRank), inline: true })
				.addFields({ name: 'MMR', value: String(stats.elo), inline: true })
				.addFields({ name: 'Wins', value: String(stats.wins), inline: true })
				.addFields({ name: 'Losses', value: String(stats.losses), inline: true })
				.addFields({ name: 'Win Ratio', value: `${winRatio}%`, inline: true })
				.setThumbnail(userAvatar) // Use the mentioned user's avatar
				.setTimestamp()
				.setColor(0xE74C3C);

			await interaction.reply({ embeds: [embed] });
		}
	},
};