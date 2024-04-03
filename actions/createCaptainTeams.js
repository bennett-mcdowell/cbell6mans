const { ActionRowBuilder, EmbedBuilder, ButtonBuilder} = require('discord.js');
const { getQueueList, getPlayerStats } = require('../utils/retrieveFromDatabase');
const { updateTeamInlobby_players } = require('../utils/updateInDatabase');
const client = require('../index');

const createVoiceChannel = require('./createVoiceChannel');

module.exports = async (interaction) => {
	// Fetch players in the queue
	let players = await getQueueList();

	// Select two random captains
	const captains = players.sort(() => 0.5 - Math.random()).slice(0, 2);

	// Remove captains from available players
	let availablePlayers = players.filter(player => !captains.includes(player));

	async function handleCaptainSelection(captain) {
		const captainName = await client.users.fetch(captain);
		const embed = new EmbedBuilder()
			.setTitle('Choose your team')
			.setDescription('Click on the buttons to choose players for your team.');

		// Add players to the embed
		await Promise.all(availablePlayers.map(async player => {
			console.log(player.id);
			const stats = await getPlayerStats(player.id);
			if (stats) {
				const winRatio = stats.wins + stats.losses !== 0 ?
					((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(2) : '0';

				const statsString = `Elo Rank: ${stats.eloRank} / Elo: ${stats.elo} / Wins: ${stats.wins} / Losses: ${stats.losses} / Win %: ${winRatio}`;
				embed.addFields({ name: player.name, value: statsString, inline: true });
			} else {
				embed.addFields({ name: player.name, value: 'No stats available', inline: true });
			}
		}));



		const row = new ActionRowBuilder()
			.addComponents(availablePlayers.map(player =>
				new ButtonBuilder()
					.setCustomId(player.id.toString())
					.setLabel(player.name)
					.setStyle('PRIMARY')
			));

		const message = await captainName.send({ embeds: [embed], components: [row] });
		const filter = (i) => i.user.id === captain.id && availablePlayers.some(player => player.id.toString() === i.customId);

		const collector = message.createMessageComponentCollector({ filter, max: 1, time: 60000 });
		return new Promise((resolve, reject) => {
			collector.on('collect', async (i) => {
				const selectedPlayerId = i.customId;
				const selectedPlayer = availablePlayers.find(player => player.id.toString() === selectedPlayerId);
				availablePlayers = availablePlayers.filter(player => player.id.toString() !== selectedPlayerId);
				await i.update({ content: `You have selected ${selectedPlayer.name}.`, embeds: [], components: [] });
				resolve(selectedPlayer);
			});

			collector.on('end', collected => {
				if (collected.size === 0) {
					captainName.send('You took too long to select a player.');
					reject(new Error('Selection timeout'));
				}
			});
		});
	}

	// Initialize teams
	const team1 = [];
	const team2 = [];

	// First pick
	const firstPick = captains[0];
	const firstPickedPlayer = await handleCaptainSelection(firstPick);
	team1.push(firstPickedPlayer); // Add picked player to team1
	await updateTeamInlobby_players(firstPickedPlayer.id, 1);

	// Second pick
	const secondPick = captains[1];
	const secondPickedPlayers = [];
	for (let i = 0; i < 2; i++) {
		const pickedPlayer = await handleCaptainSelection(secondPick);
		secondPickedPlayers.push(pickedPlayer);
		team2.push(pickedPlayer); // Add picked player to team2
		await updateTeamInlobby_players(pickedPlayer[i].id, 2);
	}

	// Add remaining player to first pick's team
	const remainingPlayer = availablePlayers[0];
	if (remainingPlayer) {
		team1.push(remainingPlayer);
		await updateTeamInlobby_players(remainingPlayer.id, 1);
	}


	// Display teams
	const embed = new EmbedBuilder()
		.setTitle('Teams')
		.setTimestamp()
		.setColor(0x0099ff);

	// Create a mention string for each user in team1
	const mentionListTeam1 = team1.map((userId) => {
		const user = interaction.guild.members.cache.get(userId);
		return user ? user.toString() : '';
	});

	// Create a mention string for each user in team2
	const mentionListTeam2 = team2.map((userId) => {
		const user = interaction.guild.members.cache.get(userId);
		return user ? user.toString() : '';
	});

	// Join the mention list with commas to display in the embed
	const mentionStringTeam1 = mentionListTeam1.join(', ');
	const mentionStringTeam2 = mentionListTeam2.join(', ');

	if (mentionListTeam1) {
		embed.addFields({ name: 'Team 1: ', value: mentionStringTeam1 });
	}
	if (mentionListTeam2) {
		embed.addFields({ name: 'Team 2: ', value: mentionStringTeam2 });
	}

	// Get the channel to send the message
	const channel = interaction.channel;

	// Send the message
	await channel.send({ embeds: [embed.toJSON()] });

	createVoiceChannel(interaction);
};
