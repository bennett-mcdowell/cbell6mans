const { SlashCommandBuilder } = require('discord.js');
const { queue } = require('../../utils/manageQueue');
const { STAFF_ROLE_ID, BOT_HANDLER_ROLE_ID } = require('../../utils/channelIds');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Clears the existing queue.')
		.setDMPermission(false),
	async execute(interaction) {

		queue.length = 0;

		interaction.reply('Queue has been cleared.');
	},
};