const { getCurrentTime } = require("../utils");

exports.checkIfWasHealed = (attackedPlayer, playersList, messagesHistory) => {
  if (attackedPlayer.isHealed) {
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `{serverContent.action.message.wasHealed}`,
    });
    playersList = this.reinitializeHeal(playersList, attackedPlayer);
  }

  return { playersList, messagesHistory };
};

exports.heal = (selectedPlayerId, playersList) => {
  playersList = playersList.map((player) => {
    if (player.id === selectedPlayerId) {
      return {
        ...player,
        isHealed: true,
      };
    }
    return player;
  });
  return playersList;
};

exports.reinitializeHeal = (playersList, attackedPlayer) => {
  playersList = playersList.map((player) => {
    if (player.id === attackedPlayer.id) {
      return {
        ...player,
        isHealed: false,
      };
    }
    return player;
  });
  return playersList;
};
