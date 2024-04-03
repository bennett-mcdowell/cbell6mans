const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { get6mansChannelId , checkPlayerIdDatabase } = require('../../utils/retrieveFromDatabase');
const { insertPlayerIntoDatabase } = require('../../utils/insertplayer_stats');
const { queue, insertIntolobby, insertIntolobby_players, queueSize } = require('../../utils/manageQueue');

const startVote = require('../../actions/startVote');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Adds you to the queue.')
		.setDMPermission(false),
	async execute(interaction) {
		const userId = interaction.user.id;
		const storedChannelId = await get6mansChannelId(6);

		// Check if the command is being executed in the allowed channel
		const currentChannelId = interaction.channel.id;
		if (currentChannelId !== storedChannelId) {
			return interaction.reply({content: 'This command can only be executed in the 6mans-lobby channel.', ephemeral: true});
		}

		// Adds player to database if is not already in
		const isPlayerInDatabase = await checkPlayerIdDatabase(userId);
		if (!isPlayerInDatabase) {
			await insertPlayerIntoDatabase(userId);
		}

		// Checks if user is in queue
		if (queue.includes(userId)) {
			return interaction.reply("You are already in the queue.");
		}

		// Adds user to queue
		queue.push(interaction.user.id);

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

		// If queue is full
		if (queue.length === queueSize) {
			const fullEmbed = new EmbedBuilder()
				.setTitle('Queue')
				.setTimestamp()
				.setColor(0x0099ff);

			const mentionList = queue.map((userId) => {
				const user = interaction.guild.members.cache.get(userId);
				return user ? user.toString() : '';
			});

			const mentionString = mentionList.join(', ');
			if (mentionString) {
				fullEmbed.addFields({ name: 'Players:', value: mentionString });
			}

			const channel = interaction.channel;
			await channel.send({ embeds: [fullEmbed.toJSON()] });


			await insertIntolobby();

			// Loop through each player in the queue and add them to lobby_players
			for (const player of queue) {
				await insertIntolobby_players(player);
			}
			// Clear the queue after processing
			queue.length = 0;

			startVote(interaction);
		}

		return interaction.reply({ embeds: [embed.toJSON()] });
	},
};