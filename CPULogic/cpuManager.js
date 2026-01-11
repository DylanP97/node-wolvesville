
const {performDayAction} = require('./performDayAction');
const {performVoteAction} = require('./performVoteAction');
const {performNightAction} = require('./performNightAction');

const processCPUMoves = (game, rooms, io) => {
  if (!game || game.isPaused || game.winningTeam || game.hasEnded) return;
  const currentSecond = game.timeCounter;

  game.playersList.forEach((player) => {
    if (player.isCPU && player.isAlive && !player.isUnderArrest) {
      if (currentSecond === player.randomSecond) {

        if (game.timeOfTheDay === "nighttime") {
          performNightAction(game.playersList, player, game.id, game.dayCount, rooms, io);
        } else if (game.timeOfTheDay === "daytime") {
          performDayAction(game.playersList, player, game.id, rooms, io);
        } else if (game.timeOfTheDay === "votetime") {
          performVoteAction(game.playersList, player, game.id, rooms, io);
        }
      }
    }
  });
};

module.exports = { processCPUMoves };