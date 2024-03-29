const { EmbedBuilder } = require('discord.js');
const { updateTeamInlobby_players } = require('../utils/updateInDatabase');
const { getTeamInlobby_players, getQueueList } = require('../utils/retrieveFromDatabase');

const createVoiceChannel = require('./createVoiceChannel');


module.exports = async (interaction) => {
	const players = await getQueueList();

	const shuffledPlayers = shuffleArray(players);

	for (let i = 0; i < shuffledPlayers.length; i++) {
		await updateTeamInlobby_players(shuffledPlayers[i], i % 2 + 1); // Assign players to teams 1 and 2 alternatively
	}

	const team1 = await getTeamInlobby_players(1);
	const team2 = await getTeamInlobby_players(2);


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


function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}