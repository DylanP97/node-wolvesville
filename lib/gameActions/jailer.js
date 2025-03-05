/* action by the jailer role */

exports.arrestPlayer = (playersList, action) => {
  playersList = playersList.map((ply) => {
    if (ply.id === action.selectedPlayerId) {
      console.log("player ", ply.name, " has been arrested");
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
  return playersList;
};

exports.executePrisoner = (playersList) => {
  console.log("executePrisoner fn");

  playersList = playersList.map((ply) => {
    if (ply.isUnderArrest) {
      console.log("player ", ply.name, " has been executed by the jailer");
      return {
        ...ply,
        isUnderArrest: false,
        isAlive: false,
        isRevealed: ply.role.team === "Werewolves",
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
  });
  return playersList;
};

exports.releasePrisoners = (playersList) => {
  playersList = playersList.map((ply) => {
    if (ply.isUnderArrest) {
      console.log("player ", ply.name, " is no longer under arrest");
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
  return playersList;
};
