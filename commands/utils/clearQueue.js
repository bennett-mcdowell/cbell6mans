const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { queue } = require('../../utils/manageQueue');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Clears the existing queue.')
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
	async execute(interaction) {
		queue.length = 0;

		interaction.reply('Queue has been cleared.');
	},
};