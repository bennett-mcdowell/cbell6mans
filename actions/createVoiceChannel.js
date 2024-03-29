const { ChannelType, PermissionsBitField } = require('discord.js');
const { getLatestQueueIdFromDatabase, getTeamInlobby_players } = require('../utils/retrieveFromDatabase');
const client = require('../index');
const { queueSize } = require('../utils/manageQueue');
const { PARENT_CHANNEL_ID } = require('../utils/channelIds');

module.exports = async (interaction) => {
	const guild = interaction.guild;
	const queueId = await getLatestQueueIdFromDatabase();

	const team1 = await getTeamInlobby_players(1); // Specify the team number
	const team2 = await getTeamInlobby_players(2); // Specify the team number

	// Create a voice channel for the queue
	const gameVoiceChannelName = `#${queueId}`;
	const gameVoiceChannel = await guild.channels.create({
		name: gameVoiceChannelName,
		type: ChannelType.GuildVoice,
		parent: PARENT_CHANNEL_ID,
		userLimit: queueSize,
		permissionOverwrites: [
			{
				id: guild.id,
				deny: [PermissionsBitField.Flags.Connect],
			},
			...team1.map(player => ({
				id: player,
				allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel],
			})),
			...team2.map(player => ({
				id: player,
				allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel],
			})),
		],
	});

	// Listener for gameVoiceChannel
	const voiceLobbies = {};

	client.on('voiceStateUpdate', (oldState, newState) => {
		const voiceChannelId = gameVoiceChannel.id;

		// Check if the user joined or left the game voice channel
		if (oldState.channelId !== voiceChannelId && newState.channelId === voiceChannelId) {
			// User joined the game voice channel
			const lobbyMembers = voiceLobbies[voiceChannelId];
			if (!lobbyMembers.includes(newState.member.id)) {
				lobbyMembers.push(newState.member.id);
			}
		} else if (oldState.channelId === voiceChannelId && newState.channelId !== voiceChannelId) {
			// User left the game voice channel
			const lobbyMembers = voiceLobbies[voiceChannelId];
			const index = lobbyMembers.indexOf(oldState.member.id);
			if (index !== -1) {
				lobbyMembers.splice(index, 1);
			}
		}
	});

	voiceLobbies[gameVoiceChannel.id] = [];

	for (let i = 0; i < 100; i++) {
		await new Promise((resolve) => setTimeout(resolve, 3000));
		const members = voiceLobbies[gameVoiceChannel.id];

		// If all players join the voice channel
		if (members.length === queueSize) {
			break;
		}
	}

	// Create team voice channels
	const createTeamVoiceChannel = async (name, userLimit, overwrites) => {
		return guild.channels.create({
			name: name,
			type: ChannelType.GuildVoice,
			userLimit: userLimit,
			permissionOverwrites: overwrites,
			parent: PARENT_CHANNEL_ID,
		});
	};

	const team1VoiceChannel = await createTeamVoiceChannel('Team 1', queueSize / 2, [
		{ id: guild.id, deny: [PermissionsBitField.Flags.Connect] },
		...team1.map(player => ({ id: player, allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel] })),
		...team2.map(player => ({ id: player, deny: [PermissionsBitField.Flags.Connect] })),
	]);

	const team2VoiceChannel = await createTeamVoiceChannel('Team 2', queueSize / 2, [
		{ id: guild.id, deny: [PermissionsBitField.Flags.Connect] },
		...team1.map(player => ({ id: player, deny: [PermissionsBitField.Flags.Connect] })),
		...team2.map(player => ({ id: player, allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel] })),
	]);

	// Move players to their respective team voice channels
	const movePlayerToTeamChannel = async (player, teamVoiceChannel) => {
		const member = await guild.members.fetch(player);
		if (member.voice.channel) {
			await member.voice.setChannel(teamVoiceChannel);
			console.log(`Moved player ${player} to ${teamVoiceChannel.name} voice channel`);
		}
	};

	team1.forEach(player => movePlayerToTeamChannel(player, team1VoiceChannel));
	team2.forEach(player => movePlayerToTeamChannel(player, team2VoiceChannel));

	// Delete the gameVoiceChannel
	setTimeout(() => {
		gameVoiceChannel.delete()
			.then(() => console.log(`Deleted game voice channel (${gameVoiceChannel.name})`))
			.catch(error => console.error(`Error deleting game voice channel:`, error));
	}, 2000);
};