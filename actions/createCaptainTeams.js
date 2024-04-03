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

	// Announce captains in the chat
	const captainAnnouncementEmbed = new EmbedBuilder()
		.setTitle('Captains Selected')
		.setDescription('The captains have been chosen:')
		.setColor(0x0099ff)
		.addFields(captains.map((captain, index) => {
			const captainUser = interaction.guild.members.cache.get(captain);
			return { name: `Captain ${index + 1}`, value: captainUser ? captainUser.toString() : 'Unknown User', inline: true };
		}));

	await interaction.channel.send({ embeds: [captainAnnouncementEmbed] });

	// Remove captains from available players
	let availablePlayers = players.filter(player => !captains.includes(player));

	async function handleCaptainSelection(captain) {
		// Fetching captain user information
		const captainUser = await client.users.fetch(captain);

		// Simplified embed just for testing
		const simpleEmbed = new EmbedBuilder()
			.setTitle('Test DM')
			.setDescription('This is a test DM with a button.')
			.setColor(0x0099FF); // Blue color

		// Simplified button
		const testButton = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('test_button')
				.setLabel('Test Button')
				.setStyle('PRIMARY'),
		);

		// Sending the simplified embed and button to the captain
		const message = await captainUser.send({ embeds: [simpleEmbed], components: [testButton] });

		// Listener for button interaction (this part remains for your reference, might not be needed for the test)
		const filter = (i) => i.user.id === captain && i.customId === 'test_button';
		const collector = message.createMessageComponentCollector({ filter, max: 1, time: 60000 });

		collector.on('collect', async (i) => {
			// Logic after button is pressed
			await i.update({ content: `Button clicked.`, embeds: [], components: [] });
		});

		collector.on('end', collected => {
			if (collected.size === 0) {
				captainUser.send('You took too long to respond.');
			}
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
