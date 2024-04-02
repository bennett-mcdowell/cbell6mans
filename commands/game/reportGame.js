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