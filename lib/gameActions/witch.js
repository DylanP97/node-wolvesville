exports.useProtectPotion = (playersList, selectedPlayerId, witchId) => {
  playersList = playersList.map((player) => {
    if (player.id === witchId) {
      console.log("witchId check object at beginning ");
      console.log(player.role);
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

  console.log("witchId check object at end ");
  console.log(playersList[witchId].role);

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
