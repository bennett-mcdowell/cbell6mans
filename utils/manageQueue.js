const database = require('./database');
const { get6mansChannelId, get6mansSeasonId , getLatestQueueIdFromDatabase }
	= require('./retrieveFromDatabase');

// Temporarily stores the player ids in an array to be added to the database
const queue = [];

const queueSize = 6;

async function removeFromQueue(userId) {
	const userIndex = queue.indexOf(userId);
	if (userIndex === -1) {
		return null;
	}
	return queue.splice(userIndex, 1)[0];
}

async function insertIntolobby_players(playerId) {
	// Retrieve season_id from the "season" table
	const seasonId = await get6mansSeasonId();

	// Retrieve queue_id from the "lobby" table
	const queueId = await getLatestQueueIdFromDatabase();

	const insertQuery =
		`INSERT INTO "6mans"."lobby_players" (queue_id, season_id, player_id, team)
         VALUES ($1, $2, $3, null);`

	await database.query(insertQuery, [queueId, seasonId, playerId]);
}

async function insertIntolobby() {
	// Retrieve season_id from the "season" table
	const seasonId = await get6mansSeasonId();

	// Retrieve channel_id from the "channels" table
	const channelId = await get6mansChannelId(6);

	// Fetch the latest queue_id from the database
	const latestQueueId = await getLatestQueueIdFromDatabase();

	// Determine the queue_id based on the latest value
	const queueId = latestQueueId !== null ? latestQueueId + 1 : 1;

	// Insert data into the "lobby" table
	const insertQuery = `
    INSERT INTO "6mans"."lobby" (queue_id, season_id, channel_id, report_time, score_reported, winning_team, reportee, locked)
    VALUES ($1, $2, $3, null, false, null, null, false);`;

	await database.query(insertQuery, [queueId, seasonId, channelId]);

	return queueId;
}

module.exports = {
	queue,
	queueSize,
	removeFromQueue,
	insertIntolobby_players,
	insertIntolobby,
};