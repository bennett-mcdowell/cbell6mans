const { SlashCommandBuilder } = require('discord.js');
const { queue } = require('../../utils/manageQueue');
const { STAFF_ROLE_ID, BOT_HANDLER_ROLE_ID } = require('../../utils/channelIds');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Clears the existing queue.')
		.setDMPermission(false),
	async execute(interaction) {
		// IDs of the roles allowed to use this command
		const allowedRoleIds = [ STAFF_ROLE_ID, BOT_HANDLER_ROLE_ID ];

		// Check if the member has any of the allowed roles
		const hasPermission = allowedRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));

		if (!hasPermission) {
			await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
			return;
		}
		queue.length = 0;

		interaction.reply('Queue has been cleared.');
	},
};