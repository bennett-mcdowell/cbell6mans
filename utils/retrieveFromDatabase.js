const database = require('./database');

async function getQueueList() {
	const queueId = await getLatestQueueIdFromDatabase();

	try {
		const query = 'SELECT player_id FROM "6mans"."lobby_players" WHERE queue_id = $1;';
		const result = await database.query(query, [queueId]);

		return result.rows.map(row => row.player_id);
	} catch (error) {
		console.error('Error querying database:', error);
		throw error;
	}
}

async function get6mansChannelId(qsize) {
	const channelQuery = `SELECT channel_id FROM "6mans"."channels" WHERE qsize = ${qsize};`;

	try {
		const result = await database.query(channelQuery);

		if (result.rows.length > 0) {
			return result.rows[0].channel_id;
		} else {
			return null; // Return an appropriate default value or handle the case where no channel is stored.
		}
	} catch (error) {
		console.error('Error querying database:', error);
		throw error;
	}
}

async function get6mansSeasonId() {
	//const seasonQuery = `SELECT season_id FROM "6mans"."season";`;
	//const seasonRows = await database.query(seasonQuery);

	// I cant get this to work right now so hard coding it because im lazy.
	return 1;

}

// Checks if a user is in the database
async function checkPlayerIdDatabase(playerId) {
	const player_statsQuery = 'SELECT player_id FROM "6mans"."player_stats" WHERE player_id = $1;';
	const result = await database.query(player_statsQuery, [playerId]);

	return result.rows.length > 0;
}

// Checks if the queue has been reported
async function checkIfQueueReportedInDatabase(queueId) {
	try {
		const reportedQuery = `SELECT score_reported FROM "6mans"."lobby" WHERE queue_id = $1;`;
		const result = await database.query(reportedQuery, [queueId]);

		// Check if any rows were returned
		if (result.rows.length > 0) {
			// Extract the value of score_reported
			return result.rows[0].score_reported;
		} else {
			// If no rows were returned, the queue has not been reported
			return false;
		}
	} catch (error) {
		console.error('Error checking if queue reported:', error);
		return false; // Returning false assumes the queue has not been reported due to the error
	}
}

async function getLatestQueueIdFromDatabase() {
	const result = await database.query('SELECT MAX(queue_id) FROM "6mans"."lobby";');
	return result.rows[0].max;
}

async function getTeamInlobby_players(lobbyTeam) {
	const queueId = await getLatestQueueIdFromDatabase();

	const teamQuery = `SELECT player_id FROM "6mans"."lobby_players" WHERE queue_id = $1 AND team = $2;`;
	const result = await database.query(teamQuery, [queueId, lobbyTeam]);

	// Ensure that the result.rows is an array before using map
	if (Array.isArray(result.rows)) {
		return result.rows.map(row => row.player_id);
	} else {
		// Handle the case where result.rows is not an array
		console.error('Unexpected result format:', result);
		return [];
	}
}

async function getTeamInlobby_playersWithKnownQueueId(queueId, lobbyTeam) {
	const teamQuery = `SELECT player_id FROM "6mans"."lobby_players" WHERE queue_id = $1 AND team = $2;`;
	const result = await database.query(teamQuery, [queueId, lobbyTeam]);

	// Ensure that the result.rows is an array before using map
	if (Array.isArray(result.rows)) {
		return result.rows.map(row => row.player_id);
	} else {
		// Handle the case where result.rows is not an array
		console.error('Unexpected result format:', result);
		return [];
	}
}

async function getTeamFromPlayerInlobby_players(queueId, playerId) {
	const teamQuery = `SELECT team FROM "6mans"."lobby_players" WHERE queue_id = $1 AND player_id = $2;`;
	const result = await database.query(teamQuery, [queueId, playerId]);

	// Extract the team number from the query result
	if (result.rows.length > 0) {
		return result.rows[0].team;
	} else {
		// Handle the case where no team information is found for the player
		throw new Error(`No team information found for player ${playerId} in queue ${queueId}`);
	}
}

async function getEloFromPlayerInplayer_stats(playerId) {
	const eloQuery = `SELECT elo FROM "6mans"."player_stats" WHERE player_id = $1;`;
	const result = await database.query(eloQuery, [playerId]);

	// Extract the elo from the query result
	if (result.rows.length > 0) {
		return result.rows[0].elo;
	} else {
		// Handle the case where no elo is found for the player
		throw new Error(`No elo information found for player ${playerId}`);
	}
}

async function getPlayerStats(userId) {
	const statsQuery = `SELECT elo_rank, wins, losses, elo FROM "6mans"."player_stats" WHERE player_id = $1;`;
	const result = await database.query(statsQuery, [userId]);

	// Extract the elo from the query result
	if (result.rows.length > 0) {
		const { elo_rank, wins, losses, elo } = result.rows[0];
		return { eloRank: elo_rank, wins, losses, elo };
	} else {
		// Handle the case where no stats are found for the player
		return null;
	}
}

async function getPlayerStatsPage(rank, page = 0, itemsPerPage = 10) {
	const offset = page * itemsPerPage;
	let query, values;

	if (rank !== 'all') {
		// Query when a specific rank is specified
		query = `
            SELECT player_id, elo_rank, wins, losses, elo
            FROM "6mans"."player_stats"
            WHERE elo_rank = $1
            ORDER BY elo DESC
            LIMIT $2 OFFSET $3;
        `;
		values = [rank, itemsPerPage, offset];
	} else {
		// Query when 'all' ranks are requested
		query = `
            SELECT player_id, elo_rank, wins, losses, elo
            FROM "6mans"."player_stats"
            ORDER BY elo DESC
            LIMIT $1 OFFSET $2;
        `;
		// Note that we only have two placeholders in this query, thus two parameters
		values = [itemsPerPage, offset];
	}

	const result = await database.query(query, values);
	return result.rows;
}

module.exports = {
	getQueueList,
	get6mansChannelId,
	get6mansSeasonId,
	checkPlayerIdDatabase,
	checkIfQueueReportedInDatabase,
	getLatestQueueIdFromDatabase,
	getTeamInlobby_players,
	getTeamInlobby_playersWithKnownQueueId,
	getTeamFromPlayerInlobby_players,
	getEloFromPlayerInplayer_stats,
	getPlayerStats,
	getPlayerStatsPage,
};