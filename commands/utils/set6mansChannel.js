const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const database = require('../../utils/database');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set6manschannel')
		.setDescription('Sets the channel for 6mans.')
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
	async execute(interaction) {
		const channelId = interaction.channel.id;
		const qsize = 6;

		const updateChannel = 'UPDATE "6mans"."channels" SET channel_id = $1, qsize = $2;';
		await database.query(updateChannel, [channelId, qsize]);

		await interaction.reply(`The 6mans channel has been set to ${channelId}.`);
	},
};