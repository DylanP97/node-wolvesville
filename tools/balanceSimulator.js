/**
 * Balance Simulator
 *
 * Runs simulated games with CPU-only players to analyze game balance.
 * No Socket.IO, no frontend, no delays - just pure game logic.
 *
 * Usage:
 *   node tools/balanceSimulator.js --games=100
 *   node tools/balanceSimulator.js --games=1000 --verbose
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { initializePlayersList, initializeGameObject } = require('../lib/gameSetup');
const { getRolesDataForQuickGame } = require('../controllers/roles');
const { checkForWinner } = require('../lib/gameActions');
const { recordGameStats, getAggregatedStats } = require('../lib/recordGameStats');
const GameStatsModel = require('../models/gameStats');

// Import game phase functions
const {
  toVoteTime,
  toNightTime,
  toVoteTimeAftermath,
  toNightTimeAftermath,
  toDayTime,
} = require('../lib/timeOfTheDay');

// CPU Logic
const { performNightAction } = require('../CPULogic/performNightAction');
const { performDayAction } = require('../CPULogic/performDayAction');
const { performVoteAction } = require('../CPULogic/performVoteAction');
const { performWolfVote } = require('../CPULogic/performWolfVote');

const MAX_CYCLES = 14;
const TOTAL_PLAYERS = 16;

// Parse command line arguments
const args = process.argv.slice(2);
let numGames = 100;
let verbose = false;

args.forEach(arg => {
  if (arg.startsWith('--games=')) {
    numGames = parseInt(arg.split('=')[1], 10);
  }
  if (arg === '--verbose' || arg === '-v') {
    verbose = true;
  }
});

// Simulated rooms array (needed by some functions)
let simulatedRooms = [];

// Mock IO object that does nothing
const mockIO = {
  to: () => ({ emit: () => {} }),
  emit: () => {}
};

/**
 * Process CPU actions for a given phase
 */
function processCPUActions(game, phase) {
  const aliveCPUs = game.playersList.filter(p => p.isAlive && p.isCPU);

  aliveCPUs.forEach(cpu => {
    switch (phase) {
      case 'nighttime':
        // Night actions (seer, doctor, wolves, etc.)
        performNightAction(game.playersList, cpu, game.id, game.dayCount, simulatedRooms, mockIO);
        // Wolf voting during night
        if (cpu.role.team === 'Werewolves') {
          performWolfVote(game.playersList, cpu, game.id, simulatedRooms, mockIO);
        }
        break;
      case 'daytime':
        performDayAction(game.playersList, cpu, game.id, simulatedRooms, mockIO);
        break;
      case 'votetime':
        performVoteAction(game.playersList, cpu, game.id, simulatedRooms, mockIO);
        break;
    }
  });
}

/**
 * Run a single simulated game
 */
async function runSimulatedGame(gameNumber) {
  // Get random roles
  const rolesData = await getRolesDataForQuickGame();

  // Create fake users (all CPUs)
  const fakeUsers = [];
  for (let i = 0; i < TOTAL_PLAYERS; i++) {
    fakeUsers.push({
      username: `CPU_${i + 1}`,
      socketId: `sim_${gameNumber}_${i}`,
      avatar: {},
      preferredRole: null
    });
  }

  // Create room object
  let room = {
    id: `sim_${Date.now()}_${gameNumber}`,
    name: `Simulation ${gameNumber}`,
    nbrOfPlayers: TOTAL_PLAYERS,
    nbrUserPlayers: 0,
    nbrCPUPlayers: TOTAL_PLAYERS,
    selectedRoles: rolesData,
    usersInTheRoom: fakeUsers,
    isQuickGame: true
  };

  // Initialize players
  const playersList = initializePlayersList(
    room.nbrOfPlayers,
    room.selectedRoles,
    room.usersInTheRoom,
    room.nbrCPUPlayers,
    room.isQuickGame,
    []
  );

  // Initialize game object
  room = initializeGameObject(room, playersList);
  room.startTime = Date.now();

  // Mark all players as CPUs
  room.playersList.forEach(p => { p.isCPU = true; });

  // Add to simulated rooms
  simulatedRooms = [room];

  if (verbose) {
    console.log(`\n--- Game ${gameNumber} ---`);
    console.log('Roles:', room.playersList.map(p => p.role.name).join(', '));
  }

  // Game loop
  let cycles = 0;
  while (room.winningTeam === null && cycles < MAX_CYCLES) {
    // Night phase
    room.timeOfTheDay = 'nighttime';
    processCPUActions(room, 'nighttime');
    toNightTimeAftermath(room);

    // Check for winner
    room.winningTeam = checkForWinner(room.aliveList, room.playersList);
    if (room.winningTeam) break;

    // Day phase
    toDayTime(room);
    room.timeOfTheDay = 'daytime';
    processCPUActions(room, 'daytime');

    // Vote phase
    toVoteTime(room);
    room.timeOfTheDay = 'votetime';
    processCPUActions(room, 'votetime');
    toVoteTimeAftermath(room);

    // Check for winner
    room.winningTeam = checkForWinner(room.aliveList, room.playersList);
    if (room.winningTeam) break;

    // Night transition
    toNightTime(room);
    cycles++;
  }

  // Handle stalemate
  if (room.winningTeam === null) {
    room.isStalemate = true;
    room.winningTeam = { name: 'Stalemate', winnerPlayers: [] };
  }

  if (verbose) {
    console.log(`Winner: ${room.winningTeam.name} (${cycles} cycles)`);
  }

  // Record stats
  await recordGameStats(room, true); // true = isSimulation

  return {
    winner: room.winningTeam.name,
    cycles: cycles,
    roles: room.playersList.map(p => ({ name: p.role.name, team: p.role.team }))
  };
}

/**
 * Main simulation function
 */
async function runSimulation() {
  console.log('🎮 Wolvesville Balance Simulator');
  console.log('================================');
  console.log(`Running ${numGames} simulated games...\n`);

  // Connect to MongoDB
  const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/wolvesville';
  try {
    await mongoose.connect(mongoUrl);
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }

  const startTime = Date.now();
  const results = {
    total: 0,
    byTeam: {},
    stalemateCount: 0,
    totalCycles: 0
  };

  // Progress tracking
  const progressInterval = Math.max(1, Math.floor(numGames / 10));

  for (let i = 1; i <= numGames; i++) {
    try {
      const result = await runSimulatedGame(i);
      results.total++;
      results.totalCycles += result.cycles;

      // Track by team
      if (!results.byTeam[result.winner]) {
        results.byTeam[result.winner] = 0;
      }
      results.byTeam[result.winner]++;

      if (result.winner === 'Stalemate') {
        results.stalemateCount++;
      }

      // Show progress
      if (i % progressInterval === 0 && !verbose) {
        const percent = ((i / numGames) * 100).toFixed(0);
        process.stdout.write(`\rProgress: ${percent}% (${i}/${numGames})`);
      }
    } catch (error) {
      console.error(`\nError in game ${i}:`, error.message);
      if (verbose) console.error(error.stack);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print results
  console.log('\n\n=====================================');
  console.log('📊 SIMULATION RESULTS');
  console.log('=====================================');
  console.log(`Total games: ${results.total}`);
  console.log(`Duration: ${duration}s (${(results.total / duration).toFixed(1)} games/sec)`);
  console.log(`Average cycles per game: ${(results.totalCycles / results.total).toFixed(1)}`);
  console.log('-------------------------------------');

  // Sort by win count
  const sortedTeams = Object.entries(results.byTeam)
    .sort((a, b) => b[1] - a[1]);

  console.log('\nWins by Team:');
  sortedTeams.forEach(([team, wins]) => {
    const percentage = ((wins / results.total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(percentage / 2));
    console.log(`  ${team.padEnd(15)} ${wins.toString().padStart(5)} (${percentage.padStart(5)}%) ${bar}`);
  });

  if (results.stalemateCount > 0) {
    console.log(`\n⚠️  Stalemates: ${results.stalemateCount} (${((results.stalemateCount / results.total) * 100).toFixed(1)}%)`);
  }

  // Get aggregated stats from database
  console.log('\n-------------------------------------');
  console.log('📈 All-time Simulation Stats (from DB):');
  const dbStats = await getAggregatedStats(true);
  if (dbStats) {
    console.log(`Total simulated games in DB: ${dbStats.totalGames}`);
    dbStats.byTeam.forEach(stat => {
      console.log(`  ${stat.team.padEnd(15)} ${stat.wins.toString().padStart(5)} wins (${stat.percentage}%) - avg ${stat.avgCycles} cycles`);
    });

    // Display role action stats
    if (dbStats.roleActions) {
      console.log('\n-------------------------------------');
      console.log('🎭 Role Action Stats (All-time):');
      console.log(`  Wolf Kills:          ${dbStats.roleActions.wolfKills.toString().padStart(5)} total (${dbStats.roleActions.avgPerGame.wolfKills} per game)`);
      console.log(`  SK Kills:            ${dbStats.roleActions.skKills.toString().padStart(5)} total (${dbStats.roleActions.avgPerGame.skKills} per game)`);
      console.log(`  Doctor Saves:        ${dbStats.roleActions.doctorSaves.toString().padStart(5)} total (${dbStats.roleActions.avgPerGame.doctorSaves} per game)`);
      console.log(`  Witch Saves:         ${dbStats.roleActions.witchSaves.toString().padStart(5)} total`);
      console.log(`  Witch Kills:         ${dbStats.roleActions.witchKills.toString().padStart(5)} total`);
      console.log(`  Seer Reveals:        ${dbStats.roleActions.seerReveals.toString().padStart(5)} total`);
      console.log(`  Gunner Kills:        ${dbStats.roleActions.gunnerKills.toString().padStart(5)} total`);
      console.log(`  Jailer Executions:   ${dbStats.roleActions.jailerExecutions.toString().padStart(5)} total`);
      console.log(`  Arsonist Burns:      ${dbStats.roleActions.arsonistBurns.toString().padStart(5)} total`);
      console.log(`  Medium Revives:      ${dbStats.roleActions.mediumRevives.toString().padStart(5)} total`);
    }
  }

  console.log('\n=====================================');
  console.log('✅ Simulation complete!');

  // Disconnect from MongoDB
  await mongoose.disconnect();
  process.exit(0);
}

// Run the simulation
runSimulation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
