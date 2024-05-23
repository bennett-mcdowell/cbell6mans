const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getQueueList } = require('../utils/retrieveFromDatabase');

const createCaptainTeams = require('./createCaptainTeams');
const createRandomTeams = require('./createRandomTeams');
const { queueSize } = require('../utils/manageQueue');

module.exports = async (interaction) => {
	const embed = new EmbedBuilder()
		.setTitle('Queue is full')
		.setDescription('Please vote for one of the following options:')
		.setColor(0x0099ff);

	const eligiblePlayerIds = await getQueueList();

	const captainsButton = new ButtonBuilder()
		.setCustomId('captains')
		.setLabel('Captains')
		.setStyle(ButtonStyle.Success)

	const randomButton = new ButtonBuilder()
		.setCustomId('random')
		.setLabel('Random')
		.setStyle(ButtonStyle.Danger)

	const row = new ActionRowBuilder()
		.addComponents(captainsButton, randomButton);

	const channel = interaction.channel;
	await channel.send({ embeds: [embed.toJSON()], components: [row.toJSON()] });

	// Listen for button interactions
	const collector = channel.createMessageComponentCollector({
		filter: (btnInteraction) => btnInteraction.isButton(),
		time: 60000,
	});

// Track votes for each option
	const votes = {
		captains: 0,
		random: 0,
	};

	// Set to track users who have already voted
	const votedUsers = new Set();

	collector.on('collect', async (btnInteraction) => {
		const userId = btnInteraction.user.id;

		// Check if user has already voted
		if (votedUsers.has(userId)) {
			await btnInteraction.reply({
				content: "You have already voted.",
				ephemeral: true,
			});
			return;
		}

		if (!eligiblePlayerIds.includes(userId)) {
			// User is not eligible to vote
			await btnInteraction.reply({
				content: "You are not eligible to vote.",
				ephemeral: true,
			});
			return;
		}

		const customId = btnInteraction.customId;

		if (customId === 'captains') {
			votes.captains++;
		} else if (customId === 'random') {
			votes.random++;
		}

		// Add user to voted users set
		votedUsers.add(userId);

		// Check if all 6 players have voted
		if (votes.captains + votes.random === queueSize) {
			collector.stop(); // Stop the collector

			// Determine the result based on votes
			let result;
			if (votes.captains > votes.random) {
				result = 'Captains';
			} else if (votes.random > votes.captains) {
				result = 'Random';
			} else {
				result = 'Random'; // Default to random teams in case of a tie
			}

			// Handle the result accordingly (send a message or perform an action)
			await handleVoteResult(result);

			// Reset votes for the next vote
			votes.captains = 0;
			votes.random = 0;
		}

		// Handle the button press as before
		const reply = await btnInteraction.reply({
			content: `Your vote for ${customId} has been received.`,
			ephemeral: true,
		});

		// Delete the content message after a few seconds
		setTimeout(() => {
			reply.delete().catch(console.error);
		}, 2500); // Change the duration (in milliseconds)
	});

	collector.on('end', () => {
		captainsButton.setDisabled(true);
		randomButton.setDisabled(true);
	})

	async function handleVoteResult(result) {
		const channel = interaction.channel;
		await channel.send(`The vote result is: ${result}`);

		if (result === 'Captains') {
			createCaptainTeams(interaction);
		} else if (result === 'Random') {
			createRandomTeams(interaction);
		}
	}

};