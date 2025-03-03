

exports.useProtectPotion = (playersList, selectedPlayerId, witchId) => {
  return playersList.map((player) => {
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
};

exports.usePoisonPotion = (playersList, selectedPlayerId, witchId) => {
  return playersList.map((player) => {
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
};