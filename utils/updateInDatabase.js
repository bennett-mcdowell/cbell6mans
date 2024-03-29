const database = require('./database');
const { getLatestQueueIdFromDatabase, getTeamFromPlayerInlobby_players, getTeamInlobby_playersWithKnownQueueId,
	getEloFromPlayerInplayer_stats
} = require('./retrieveFromDatabase');

async function updateTeamInlobby_players(playerId, lobbyTeam) {
	const queueId = await getLatestQueueIdFromDatabase();

    const updateQuery = `UPDATE "6mans"."lobby_players" SET team = $1 WHERE queue_id = $2 AND player_id = $3;`;
	await database.query(updateQuery, [lobbyTeam, queueId, playerId]);
}

async function incrementWinsAndLossesAndUpdateElo(player, isWin) {
	try {
		const selectQuery = `SELECT wins, losses, elo FROM "6mans"."player_stats" WHERE player_id = $1;`;
		const result = await database.query(selectQuery, [player]);

		if (result.rows.length > 0) {
			const currentElo = result.rows[0].elo

			// Determine whether to increment wins or losses
			let newValue;
			let newElo;
			if (isWin) {
				// Increment wins by 1
				const currentWins = result.rows[0].wins || 0;
				newValue = currentWins + 1;

				// Calculate new elo
				newElo = currentElo + 10;
			} else {
				// Increment losses by 1
				const currentLosses = result.rows[0].losses || 0;
				newValue = currentLosses + 1;

				// Calculate new elo
				newElo = currentElo - 10;
			}

			// Update the database with the new value
			const updateQuery = `UPDATE "6mans"."player_stats" SET ${isWin ? 'wins' : 'losses'} = $1, elo = $2 WHERE player_id = $3;`;
			await database.query(updateQuery, [newValue, newElo, player]);
		} else {
			throw new Error(`Player ${player} not found in the database.`);
		}
	} catch (error) {
		console.error(`Error incrementing ${isWin ? 'wins' : 'losses'}:`, error);
		throw error;
	}
}

async function updateWinsLossesAndEloInplayer_stats(queueId, playerId) {
	const winningTeamNum = await getTeamFromPlayerInlobby_players(queueId, playerId);
	const team1 = await getTeamInlobby_playersWithKnownQueueId(queueId, 1);
	const team2 = await getTeamInlobby_playersWithKnownQueueId(queueId, 2);

	const winningTeam = winningTeamNum === 1 ? team1 : team2;
	const losingTeam = winningTeamNum === 2 ? team1 : team2;

	try {
		// Update wins for players on the winning team
		for (const player of winningTeam) {
			await incrementWinsAndLossesAndUpdateElo(player, true);
		}

		// Update losses for players on the losing team
		for (const player of losingTeam) {
			await incrementWinsAndLossesAndUpdateElo(player, false);
		}
	} catch (error) {
		console.error('Error updating wins and losses:', error);
		throw error;
	}
}

async function updatelobbyReport(queueId, playerId) {
	const reportTime = new Date();
	const winningTeam = await getTeamFromPlayerInlobby_players(queueId, playerId);

	const updateQuery = `UPDATE "6mans"."lobby" SET report_time = $1, score_reported = $2, winning_team = $3, reportee = $4, locked = $5 WHERE queue_id = $6;`;
	await database.query(updateQuery, [reportTime, true, winningTeam, playerId, true, queueId]);
}

async function updateRankHelper(rank, playerId) {
	try {
		const updateQuery = `UPDATE "6mans"."player_stats" SET elo_rank = $1 WHERE player_id = $2;`;
		await database.query(updateQuery, [rank, playerId]);
	} catch (error) {
		console.error('Error updating elo_rank in player_stats', error);
		throw error;
	}
}
async function updateRank(playerId) {
	try {
		const elo = await getEloFromPlayerInplayer_stats(playerId);

		let rank;
		if (elo >= 0 && elo < 1700) { 	// Rank C
			rank = 'C';
		} else if (elo >= 1700 && elo < 2000) { 	// Rank B
			rank = 'B';
		} else if (elo >= 2000 && elo < 2200) {		// Rank A
			rank = 'A';
		} else if (elo >= 2200 && elo <= 20000) {	// Rank X
			rank = 'X';
		} else {
			throw new Error(`Invalid Elo value for player ${playerId}`);
		}

		await updateRankHelper(rank, playerId);
	} catch (error) {
		console.error('Error updating rank in player_stats:', error);
		throw error;
	}
}

module.exports = {
	updateTeamInlobby_players,
	updateWinsLossesAndEloInplayer_stats,
	updatelobbyReport,
	updateRank,
};