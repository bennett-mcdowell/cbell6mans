const database = require('./database')
























// Step 1: Calculate Expected Scores
function calculateExpectedScores(team1, team2) {
	const totalEloTeam1 = team1.reduce((acc, player) => acc + player.elo, 0);
	const totalEloTeam2 = team2.reduce((acc, player) => acc + player.elo, 0);
	const expectedScoreTeam1 = 1 / (1 + Math.pow(10, (totalEloTeam2 - totalEloTeam1) / 400));
	const expectedScoreTeam2 = 1 / (1 + Math.pow(10, (totalEloTeam1 - totalEloTeam2) / 400));
	return { team1: expectedScoreTeam1, team2: expectedScoreTeam2 };
}

// Step 2: Update Elo Ratings
function updateEloRatings(team1, team2, actualResult, kFactor) {
	const expectedScores = calculateExpectedScores(team1, team2);
	const actualScoreTeam1 = actualResult === 'team1' ? 1 : 0;
	const actualScoreTeam2 = actualResult === 'team2' ? 1 : 0;

	team1.forEach(player => {
		const eloChange = kFactor * (actualScoreTeam1 - expectedScores.team1);
		player.elo += eloChange;
	});

	team2.forEach(player => {
		const eloChange = kFactor * (actualScoreTeam2 - expectedScores.team2);
		player.elo += eloChange;
	});
}

// Step 3: Handle Team Elo Changes
function calculateEloChanges(team1, team2, actualResult, kFactor) {
	updateEloRatings(team1, team2, actualResult, kFactor);
	// Optionally, return or log the updated Elo ratings for each player
}

// Example usage:
const team1 = [{ name: 'Player1', elo: 1200 }, { name: 'Player2', elo: 1300 }];
const team2 = [{ name: 'Player3', elo: 1250 }, { name: 'Player4', elo: 1350 }];
const actualResult = 'team1'; // 'team1' or 'team2' indicating which team won
const kFactor = 32; // Adjust the K-factor based on your requirements

calculateEloChanges(team1, team2, actualResult, kFactor);
