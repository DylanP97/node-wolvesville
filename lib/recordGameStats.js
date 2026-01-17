const GameStatsModel = require("../models/gameStats");

/**
 * Record game statistics to the database
 * @param {Object} game - The game object
 * @param {boolean} isSimulation - Whether this is a simulated game
 * @returns {Promise<Object>} - The saved game stats document
 */
async function recordGameStats(game, isSimulation = false) {
  try {
    // Determine winning team name
    let winningTeamName = "None";
    if (game.winningTeam) {
      winningTeamName = game.winningTeam.name || "None";
    } else if (game.isStalemate) {
      winningTeamName = "Stalemate";
    }

    // Get roles in the game
    const rolesInGame = game.playersList.map(player => ({
      name: player.role?.name || "Unknown",
      team: player.role?.team || "Unknown"
    }));

    // Count teams at start
    const initialVillageCount = game.playersList.filter(
      p => p.role?.team === "Village" || p.role?.team === "Villagers"
    ).length;

    const initialWerewolvesCount = game.playersList.filter(
      p => p.role?.team === "Werewolves"
    ).length;

    const initialSoloCount = game.playersList.filter(
      p => !["Village", "Villagers", "Werewolves"].includes(p.role?.team)
    ).length;

    // Calculate game duration if we have start time
    let gameDurationMs = null;
    if (game.startTime) {
      gameDurationMs = Date.now() - game.startTime;
    }

    // Create stats record
    const stats = new GameStatsModel({
      winningTeam: winningTeamName,
      totalPlayers: game.playersList.length,
      realPlayers: game.usersInTheRoom?.length || 0,
      cpuPlayers: game.playersList.filter(p => p.isCPU).length,
      rolesInGame,
      totalCycles: game.dayCount || 0,
      gameDurationMs,
      initialVillageCount,
      initialWerewolvesCount,
      initialSoloCount,
      isSimulation,
      roleActions: game.roleActions || {}
    });

    const savedStats = await stats.save();
    console.log(`📊 Game stats recorded: ${winningTeamName} wins after ${game.dayCount} cycles`);

    return savedStats;
  } catch (error) {
    console.error("Error recording game stats:", error);
    return null;
  }
}

/**
 * Get aggregated statistics from the database
 * @param {boolean} simulationOnly - Only get simulation stats
 * @returns {Promise<Object>} - Aggregated statistics
 */
async function getAggregatedStats(simulationOnly = false) {
  try {
    const matchQuery = simulationOnly ? { isSimulation: true } : {};

    const stats = await GameStatsModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$winningTeam",
          count: { $sum: 1 },
          avgCycles: { $avg: "$totalCycles" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Aggregate role action stats
    const roleActionStats = await GameStatsModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          totalDoctorSaves: { $sum: "$roleActions.doctorSaves" },
          totalWitchSaves: { $sum: "$roleActions.witchSaves" },
          totalWitchKills: { $sum: "$roleActions.witchKills" },
          totalSeerReveals: { $sum: "$roleActions.seerReveals" },
          totalGunnerKills: { $sum: "$roleActions.gunnerKills" },
          totalJailerExecutions: { $sum: "$roleActions.jailerExecutions" },
          totalWolfKills: { $sum: "$roleActions.wolfKills" },
          totalSKKills: { $sum: "$roleActions.skKills" },
          totalArsonistBurns: { $sum: "$roleActions.arsonistBurns" },
          totalMediumRevives: { $sum: "$roleActions.mediumRevives" }
        }
      }
    ]);

    const totalGames = stats.reduce((sum, s) => sum + s.count, 0);
    const roleStats = roleActionStats[0] || {};

    return {
      totalGames,
      byTeam: stats.map(s => ({
        team: s._id,
        wins: s.count,
        percentage: ((s.count / totalGames) * 100).toFixed(1),
        avgCycles: s.avgCycles.toFixed(1)
      })),
      roleActions: totalGames > 0 ? {
        doctorSaves: roleStats.totalDoctorSaves || 0,
        witchSaves: roleStats.totalWitchSaves || 0,
        witchKills: roleStats.totalWitchKills || 0,
        seerReveals: roleStats.totalSeerReveals || 0,
        gunnerKills: roleStats.totalGunnerKills || 0,
        jailerExecutions: roleStats.totalJailerExecutions || 0,
        wolfKills: roleStats.totalWolfKills || 0,
        skKills: roleStats.totalSKKills || 0,
        arsonistBurns: roleStats.totalArsonistBurns || 0,
        mediumRevives: roleStats.totalMediumRevives || 0,
        avgPerGame: {
          doctorSaves: (roleStats.totalDoctorSaves / totalGames).toFixed(2),
          witchSaves: (roleStats.totalWitchSaves / totalGames).toFixed(2),
          witchKills: (roleStats.totalWitchKills / totalGames).toFixed(2),
          seerReveals: (roleStats.totalSeerReveals / totalGames).toFixed(2),
          gunnerKills: (roleStats.totalGunnerKills / totalGames).toFixed(2),
          jailerExecutions: (roleStats.totalJailerExecutions / totalGames).toFixed(2),
          wolfKills: (roleStats.totalWolfKills / totalGames).toFixed(2),
          skKills: (roleStats.totalSKKills / totalGames).toFixed(2),
          arsonistBurns: (roleStats.totalArsonistBurns / totalGames).toFixed(2),
          mediumRevives: (roleStats.totalMediumRevives / totalGames).toFixed(2),
        }
      } : null
    };
  } catch (error) {
    console.error("Error getting aggregated stats:", error);
    return null;
  }
}

module.exports = { recordGameStats, getAggregatedStats };
