exports.useProtectPotion = (playersList, selectedPlayerId, witchId) => {
  playersList = playersList.map((player) => {
    if (player.id === witchId) {
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
    if (player.id === selectedPlayerId) {
      return {
        ...player,
        isProtected: true,
      };
    }
    return player;
  });

  return playersList;
};

exports.reinitializeProtection = (playersList, attackedPlayer) => {
  playersList = playersList.map((player) => {
    if (player.id === attackedPlayer.id) {
      return {
        ...player,
        isProtected: false,
      };
    }
    return player;
  });
  return playersList;
};


exports.usePoisonPotion = (playersList, selectedPlayerId, witchId) => {
  playersList = playersList.map((player) => {
    if (player.id === witchId) {
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
    if (player.id === selectedPlayerId) {
      return {
        ...player,
        isAlive: false,
      };
    }
    return player;
  });

  return playersList;
};

