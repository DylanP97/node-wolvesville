/* action by the jailer role */

exports.arrestPlayer = (playersList, action) => {
  return playersList.map((ply) => {
    if (ply.id === action.selectedPlayerId) {
      return {
        ...ply,
        isUnderArrest: true,
      };
    } else if (ply.role.name === "Jailer") {
      return {
        ...ply,
        hasHandcuffed: action.selectedPlayerId,
      };
    } else {
      return ply;
    }
  });
};

exports.executePrisoner = (playersList) => {
  return (playersList = playersList.map((ply) => {
    if (ply.isUnderArrest) {
      return {
        ...ply,
        isUnderArrest: false,
        isAlive: false,
        isRevealed: ply.role.team.join() === "werewolves" && true,
      };
    } else if (ply.role.name === "Jailer") {
      return {
        ...ply,
        hasHandcuffed: null,
        role: {
          ...ply.role,
          canPerform2: {
            ...ply.role.canPerform2,
            nbrLeftToPerform: 0,
          },
        },
      };
    } else {
      return ply;
    }
  }));
};

exports.releasePrisoners = (playersList) => {
  console.log("hello release prisonner fn");

  return playersList.map((ply) => {
    if (ply.isUnderArrest) {
      return {
        ...ply,
        isUnderArrest: false,
      };
    } else if (ply.role.name === "Jailer") {
      return {
        ...ply,
        hasHandcuffed: null,
      };
    } else {
      return ply;
    }
  });
};
