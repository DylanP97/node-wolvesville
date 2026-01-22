const { killSelectedPlayer } = require("./general");
const { checkIfIsInLove } = require("./cupid");
const { getCurrentTime } = require("../lib/utils");

exports.shootBullet = (playersList, selectedPlayerId, gunnerId, messagesHistory = [], gameStartTime, animationQueue = null) => {
  // Get the player before they're killed to check isInLove
  const shotPlayer = playersList.find((p) => p.id === selectedPlayerId);

  playersList = killSelectedPlayer(selectedPlayerId, playersList, "gunshot");

  playersList = playersList.map((player) => {
    if (player.id === gunnerId) {
      return {
        ...player,
        isRevealed: true,
        role: {
          ...player.role,
          canPerform1: {
            ...player.role.canPerform1,
            nbrLeftToPerform: player.role.canPerform1.nbrLeftToPerform - 1,
          },
        },
      };
    }
    return player;
  });
  
  // Add shoot message first
  let shootMessage = null;
  if (shotPlayer) {
    shootMessage = `{serverContent.action.message.shootBullet} ${shotPlayer.name}.`;
    messagesHistory.unshift({
      time: getCurrentTime(gameStartTime),
      author: "",
      msg: shootMessage,
    });
    // Reveal if the dead player was a werewolf (only if not already revealed)
    if (shotPlayer.role.team === "Werewolves" && !shotPlayer.isRevealed) {
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `{serverContent.action.message.werewolfReveal}${shotPlayer.name}{serverContent.action.message.wasWerewolf}`,
      });
    }
    // Check if the dead player was in love and kill their partner
    const result = checkIfIsInLove(shotPlayer, playersList, messagesHistory, gameStartTime, animationQueue);
    playersList = result.playersList;
    messagesHistory = result.messagesHistory;
  }
  
  return { playersList, messagesHistory, shootMessage };
};
