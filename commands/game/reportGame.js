const { SlashCommandBuilder } = require('discord.js');
const { get6mansChannelId, checkIfQueueReportedInDatabase } = require('../../utils/retrieveFromDatabase');
const { updatelobbyReport, updateWinsLossesAndEloInplayer_stats, updateRank } = require('../../utils/updateInDatabase');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('report-game')
		.setDescription('Enter your queue Id to report your game as a win.')
		.addIntegerOption(option =>
			option.setName('queue-id')
				.setDescription('Enter your correct queue Id')
				.setRequired(true))
		.setDMPermission(false),

	async execute(interaction) {
		const userId = interaction.user.id;
		const queueId = interaction.options.getInteger('queue-id');
		const storedChannelId = await get6mansChannelId(1); // qsize value of 1 is the channel for report-game

		// Check if the command is being executed in the allowed channel
		const currentChannelId = interaction.channel.id;
		if (currentChannelId !== storedChannelId) {
			return interaction.reply({content: 'This command can only be executed in 6mans-report-game channel.', ephemeral: true});
		}

		// Check if the queue has been reported
		const isReported = await checkIfQueueReportedInDatabase(queueId);

		if (!isReported) {
			// If the queue has not been reported, update the database and reply
			await updatelobbyReport(queueId, userId);
			await updateWinsLossesAndEloInplayer_stats(queueId, userId);
			await updateRank(userId);

			return interaction.reply(`:white_check_mark: #${queueId} has been reported as a win.`);
		} else {
			// If the queue has already been reported, inform the user
			return interaction.reply(`:x: #${queueId} has already been reported.`);
		}
	},
};