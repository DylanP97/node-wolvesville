

exports.arrestPlayer = (playersList, action) => {
    return playersList.map((ply) => {
      if (ply.id === action.selectedPlayerId) {
        return {
          ...ply,
          isUnderArrest: true,
        }
      } else if (ply.role.name === "Jailer") {
        return {
          ...ply,
          hasHandcuffed: true,
        }
      } else {
        return ply;
      }
    })
  };
  
  exports.killPrisoner = (playersList) => {
    return playersList = playersList.map((ply) => {
      if (ply.isUnderArrest) {
        return {
          ...ply,
          isUnderArrest: false,
          isAlive: false
        };
      } else if (ply.role.name === "Jailer") {
        return {
          ...ply,
          hasHandcuffed: false,
          role: {
            ...ply.role,
            canPerform2: {
              ...ply.role.canPerform2,
              nbrLeftToPerform: ply.role.canPerform2 - 1
            }
          }
        }
      } else {
        return ply
      }
    })
  }
  
  exports.releasePrisoners = (playersList) => {
    return playersList.map((ply) => {
      if (ply.isUnderArrest) {
        return {
          ...ply,
          isUnderArrest: false,
        };
      } else if (ply.role.name === "Jailer") {
        return {
          ...ply,
          hasHandcuffed: false,
        }
      } else {
        return ply;
      }
    });
  };
  