const { getCurrentTime } = require("../utils");
const { killSelectedPlayer } = require("./general");

exports.linkLovers = (playersList, action) => {
  return playersList.map((player) => {
    if (player.id === action.lover1Id) {
      return {
        ...player,
        isInLove: true,
        role: {
          ...player.role,
          team: player.role.team.unshift("lovers"),
        },
      };
    }
    if (player.id === action.lover2Id) {
      return {
        ...player,
        isInLove: true,
        role: {
          ...player.role,
          team: player.role.team.unshift("lovers"),
        },
      };
    }
    if (player.id === action.cupidId) {
      return {
        ...player,
        role: {
          ...player.role,
          canPerform1: {
            ...player.role.canPerform1,
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
      msg: `💀💔 ${partner.name} {serverContent.action.message.dieWithLover} ${deadPlayer.name}!`,
    });
  }

  const playersListE2 = playersList;
  const messagesHistoryE2 = messagesHistory;

  return { playersListE2, messagesHistoryE2 };
};

exports.findLovers = (playersList) => {
  const lovers = playersList.filter((player) => player.isInLove);
  return lovers;
};
