const { getCurrentTime } = require("../utils");
const { killSelectedPlayer } = require("./general");

exports.linkLovers = (playersList, action) => {

  return playersList.map((player) => {
    if (player.id === action.lover1Id) {
      return {
        ...player,
        isInLove: true,
      };
    }
    if (player.id === action.lover2Id) {
      return {
        ...player,
        isInLove: true,
      };
    }
    if (player.id === action.cupidId) {
      return {
        ...player,
        role: {
          ...player.role,
          canPerform: {
            ...player.role.canPerform,
            nbrLeftToPerform: 0,
          },
        },
      };
    }
    return player;
  });
};

exports.checkIfIsInLove = (deadPlayer, playersList, messagesHistory) => {
  if (deadPlayer.isInLove) {
    const lovers = this.findLovers(playersList);
    const partner = lovers.find((partner) => partner.id !== deadPlayer.id);
    playersList = killSelectedPlayer(partner.id, playersList);
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `${partner.name} is dead because of its loving relation with ${deadPlayer.name}! 💀💔`,
    });
  }

  const playersListEdit = playersList;
  const messagesHistoryEdit = messagesHistory;

  return { playersListEdit, messagesHistoryEdit };
};

  exports.findLovers = (playersList) => {
    const lovers = playersList.filter((player) => player.isInLove);
    return lovers;
  };
