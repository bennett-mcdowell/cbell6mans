const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { get6mansChannelId, getPlayerStats } = require('../../utils/retrieveFromDatabase');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Shows your stats')
		.setDMPermission(false),
	async execute(interaction) {
		const userId = interaction.user.id;
		const storedChannelId = await get6mansChannelId(6);

		// Check if the command is being executed in the allowed channel
		const currentChannelId = interaction.channel.id;
		if (currentChannelId !== storedChannelId) {
			return interaction.reply({content: 'This command can only be executed in 6mans-report-game channel.', ephemeral: true});
		}

		const stats = await getPlayerStats(userId);

		if (!stats) {
			return interaction.reply('No stats found.');
		} else {
			const winRatio = stats.wins + stats.losses !== 0 ?
				((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(2) : '0';

			const embed = new EmbedBuilder()
				.setTitle(`Stats for ${interaction.user.username}`)
				.addFields({ name: 'Player', value: `<@${userId}>`, inline: true })
				.addFields({ name: 'Rank', value: String(stats.eloRank), inline: true })
				.addFields({ name: 'MMR', value: String(stats.elo), inline: true })
				.addFields({ name: 'Wins', value: String(stats.wins), inline: true })
				.addFields({ name: 'Losses', value: String(stats.losses), inline: true })
				.addFields({ name: 'Win Ratio', value: `${winRatio}%`, inline: true })
				.setThumbnail(interaction.user.displayAvatarURL())
				.setTimestamp()
				.setColor(0xE74C3C);

			await interaction.reply({ embeds: [embed] });
		}
	},
};