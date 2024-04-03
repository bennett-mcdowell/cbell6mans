const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const database = require('../../utils/database');
const { getPlayerStatsPage } = require('../../utils/retrieveFromDatabase');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Shows the leaderboard for any rank')
		.addStringOption(option =>
			option.setName('rank')
				.setDescription('Enter the rank you want to see, leave blank to see all ranks')),
	async execute(interaction) {
		await interaction.deferReply();
		const rank = interaction.options.getString('rank') || 'all';
		const page = 0; // Start from the first page

		await sendLeaderboardPage(interaction, rank, page);
	},
};

async function getTotalPlayerCount(rank) {
	// Adjust query to match schema
	const query = rank !== 'all' ? `SELECT COUNT(*) FROM "6mans"."player_stats" WHERE elo_rank = $1;` : `SELECT COUNT(*) FROM "6mans"."player_stats";`;
	const values = rank !== 'all' ? [rank] : [];
	const result = await database.query(query, values);
	return parseInt(result.rows[0].count, 10);
}

async function sendLeaderboardPage(interaction, rank, page) {
	// Check if the interaction is valid
	if (!interaction.deferred && !interaction.replied) {
		console.error('Interaction is invalid or already replied.');
		return;
	}

	const itemsPerPage = 1;
	const playerStatsPage = await getPlayerStatsPage(rank, page, itemsPerPage);
	const totalPlayers = await getTotalPlayerCount(rank);
	const totalPages = Math.ceil(totalPlayers / itemsPerPage);

	// Fetch each player's Discord display name
	const playerInfoPromises = playerStatsPage.map(async (player) => {
		try {
			const user = await interaction.client.users.fetch(player.player_id);
			// If no user display is found
			const displayName = user ? user.username : 'Unknown User';
			return { ...player, displayName };
		} catch (error) {
			console.error(`Could not fetch user for ID ${player.player_id}: ${error}`);
			return { ...player, displayName: 'Unknown User' };
		}
	});

	// Wait for all the user objects to be fetched
	const playerInfo = await Promise.all(playerInfoPromises);

	const embed = new EmbedBuilder()
		.setTitle(`Leaderboard: ${rank.toUpperCase()}`)
		.setDescription(playerInfo.map((player, index) => `${index + 1 + page * itemsPerPage}. ${player.displayName} - ${player.elo}`).join('\n') || 'No players found.')
		.setFooter({ text: `Page ${page + 1} of ${totalPages}` });

	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('previous_page')
				.setLabel('Previous')
				.setStyle(ButtonStyle.Primary)
				.setDisabled(page <= 0),
			new ButtonBuilder()
				.setCustomId('next_page')
				.setLabel('Next')
				.setStyle(ButtonStyle.Primary)
				.setDisabled(page >= totalPages - 1),
		);

	try {
		// Attempt to edit the reply
		await interaction.editReply({ embeds: [embed], components: [row] });

		const filter = i => ['previous_page', 'next_page'].includes(i.customId) && i.user.id === interaction.user.id;
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

		collector.on('collect', async i => {
			let newPage = page;
			if (i.customId === 'previous_page' && page > 0) {
				newPage--;
			} else if (i.customId === 'next_page' && page < totalPages - 1) {
				newPage++;
			}

			await sendLeaderboardPage(interaction, rank, newPage);
		});

		collector.on('end', () => interaction.editReply({ components: [] }));
	} catch (error) {
		// Handle InteractionFailedError
		if (error.code === 10008 || error.code === 10015) {
			console.error('Interaction failed: The message was deleted or the interaction no longer exists.');
		} else {
			console.error('Interaction failed:', error);
		}
	}
}
