exports.chooseJuniorWolfDeathRevenge = (
  playersList,
  juniorWolfId,
  selectedPlayerId
) => {
  return playersList.map((ply) => {
    if (ply.id === selectedPlayerId) {
      return {
        ...ply,
        wasChooseByJuniorWolf: true,
      };
    }
    if (ply.id === juniorWolfId) {
      return {
        ...ply,
        role: {
          ...ply.role,
          canPerform1: {
            ...ply.role.canPerform1,
            nbrLeftToPerform: null,
          },
        },
      };
    }
    return ply;
  });
};

exports.revengeJuniorWolf = (playersList) => {
  return playersList.map((ply) => {
    if (ply.wasChooseByJuniorWolf) {
      return {
        ...ply,
        wasChooseByJuniorWolf: true,
      };
    }
  });
};
