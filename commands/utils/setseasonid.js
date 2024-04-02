const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const database = require('../../utils/database');
const { BOT_HANDLER_ROLE_ID } = require('../../utils/channelIds');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setseasonid')
		.setDescription('Sets the season ID.')
		.addIntegerOption(option =>
			option.setName('seasonid')
				.setDescription('The new season ID.')
				.setRequired(true))
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
	async execute(interaction) {


		const seasonId = interaction.options.getInteger('seasonid');
		const startDate = new Date(); // Current date
		const endDate = new Date();
		endDate.setMonth(endDate.getMonth() + 1); // Add 1 month to current date

		// Update the season ID, start_date, and end_date in the season table
		const updateQuery = 'UPDATE "6mans"."season" SET season_id = $1, date_start = $2, date_end = $3;';
		await database.query(updateQuery, [seasonId, startDate, endDate]);

		return interaction.reply(`Season ID set to ${seasonId}.`);
	},
};