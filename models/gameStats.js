const mongoose = require("mongoose");

const gameStatsSchema = new mongoose.Schema({
  // Winning team info
  winningTeam: {
    type: String,
    required: true,
    enum: ["Village", "Werewolves", "Serial Killer", "Fool", "Arsonist", "Ghost Lady", "Lovers", "Stalemate", "None"]
  },

  // Game details
  totalPlayers: {
    type: Number,
    required: true
  },
  realPlayers: {
    type: Number,
    default: 0
  },
  cpuPlayers: {
    type: Number,
    default: 0
  },

  // Roles in the game
  rolesInGame: [{
    name: String,
    team: String
  }],

  // Game duration
  totalCycles: {
    type: Number, // Number of day/night cycles
    required: true
  },
  gameDurationMs: {
    type: Number // Duration in milliseconds (for real games)
  },

  // Team counts at start
  initialVillageCount: {
    type: Number,
    default: 0
  },
  initialWerewolvesCount: {
    type: Number,
    default: 0
  },
  initialSoloCount: {
    type: Number,
    default: 0
  },

  // Was this a simulation?
  isSimulation: {
    type: Boolean,
    default: false
  },

  // Role-specific action stats
  roleActions: {
    doctorSaves: { type: Number, default: 0 },
    witchSaves: { type: Number, default: 0 },
    witchKills: { type: Number, default: 0 },
    seerReveals: { type: Number, default: 0 },
    gunnerKills: { type: Number, default: 0 },
    jailerExecutions: { type: Number, default: 0 },
    wolfKills: { type: Number, default: 0 },
    skKills: { type: Number, default: 0 },
    arsonistBurns: { type: Number, default: 0 },
    mediumRevives: { type: Number, default: 0 }
  },

  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
gameStatsSchema.index({ winningTeam: 1 });
gameStatsSchema.index({ isSimulation: 1 });
gameStatsSchema.index({ createdAt: -1 });

const GameStatsModel = mongoose.model("GameStats", gameStatsSchema);

module.exports = GameStatsModel;
