const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const database = require('../../utils/database');
const { BOT_HANDLER_ROLE_ID } = require('../../utils/channelIds');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set6manschannel')
		.setDescription('Sets the channel for 6mans.')
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
	async execute(interaction) {
		// IDs of the roles allowed to use this command
		const allowedRoleIds = [ BOT_HANDLER_ROLE_ID ];

		// Check if the member has any of the allowed roles
		const hasPermission = allowedRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));

		if (!hasPermission) {
			await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
			return;
		}
		const channelId = interaction.channel.id;
		const qsize = 6;

		const updateChannel = 'UPDATE "6mans"."channels" SET channel_id = $1, qsize = $2;';
		await database.query(updateChannel, [channelId, qsize]);

		await interaction.reply(`The 6mans channel has been set to ${channelId}.`);
	},
};