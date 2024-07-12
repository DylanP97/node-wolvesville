const { assertDuty } = require("./mayor");

exports.revealPlayer = (selectedPlayerId, seerId, playersList) => {
  return playersList.map((player) => {
    if (player.id === selectedPlayerId) {
      if (player.role.name === "Mayor") {
        return assertDuty(playersList);
      }
      return {
        ...player,
        isRevealed: true,
      };
    }
    if (player.id === seerId) {
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
