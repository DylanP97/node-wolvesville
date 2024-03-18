
  exports.linkLovers = (playersList, action) => {
      return playersList.map((player) => {
        if (player.id === (action.lover1Id || action.lover2Id)) {
          return {
            ...player,
            isInLove: true,
          };
        }
        if (player.id === action.cupidId) {
          return {
            ...player,
            role: {
              ...player.role,
              canPerform: {
                ...player.role.canPerform,
                nbrLeftToPerform: 0,
              },
            },
          };
        }
        return player;
      });
  };


// exports.checkIfIsInLove = (player, updatedPlayersList, setUpdatedPlayersList, displayAction) => {
//     if (player.isInLove) {
//       const lovers = findLovers(updatedPlayersList);
//       const partner = lovers.find((partner) => partner.id !== player.id);
//       killSelectedPlayer(partner.id, setUpdatedPlayersList);
//       displayAction(`${partner.name} is dead because of its loving relation with ${player.name}! 💀💔`);
//     } else {
//       return;
//     }
//   };
  
//   exports.findLovers = (updatedPlayersList) => {
//     const lovers = updatedPlayersList.filter((player) => player.isInLove);
//     return lovers;
//   };