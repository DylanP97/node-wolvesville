const { getCurrentTime } = require("../utils");
const { killSelectedPlayer } = require("./general");

exports.linkLovers = (playersList, action) => {
  return playersList.map((ply) => {
    if (ply.id === action.lover1Id) {
      return {
        ...ply,
        isInLove: true,
        role: {
          ...ply.role,
          team: "Lovers",
        },
      };
    }
    if (ply.id === action.lover2Id) {
      return {
        ...ply,
        isInLove: true,
        role: {
          ...ply.role,
          team: "Lovers",
        },
      };
    }
    if (ply.id === action.cupidId) {
      return {
        ...ply,
        role: {
          ...ply.role,
          canPerform1: {
            ...ply.role.canPerform1,
            nbrLeftToPerform: 0,
          },
        },
      };
    }
    return ply;
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
  const lovers = playersList.filter((ply) => ply.isInLove);
  return lovers;
};
