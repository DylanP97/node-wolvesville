
const { killSelectedPlayer } = require("./general");

exports.useProtectPotion = (playersList, selectedPlayerId, witchId) => {
  return playersList.map((player) => {
    if (player.id === selectedPlayerId) {
      return {
        ...player,
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
};


exports.usePoisonPotion = (playersList, selectedPlayerId, witchId) => {
  return playersList.map((player) => {
    if (player.id === selectedPlayerId) {
      return {
        ...player,
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
};