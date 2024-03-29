const database = require('./database');
const { get6mansChannelId, get6mansSeasonId } = require('./retrieveFromDatabase');

// Inserts the user into the database
async function insertPlayerIntoDatabase(playerId) {
	// Retrieve season_id from the "season" table
	const seasonId = await get6mansSeasonId();

	// Retrieve channel_id from the "channels" table
	const channelId = await get6mansChannelId(6);

	// Insert player into the "player_stats" table with default values
	const insertQuery = `
    INSERT INTO "6mans"."player_stats" (player_id, season_id, channel_id, elo_rank, wins, losses, elo)
    VALUES ($1, $2, $3, 'C', 0, 0, 1600)
    ON CONFLICT (player_id, season_id, channel_id) DO NOTHING;`;

	await database.query(insertQuery, [playerId, seasonId, channelId]);
}

module.exports = {
	insertPlayerIntoDatabase,
};