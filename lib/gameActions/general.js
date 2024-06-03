// exports.getPlayerById = (playerId, updatedPlayersList) => {
//     return updatedPlayersList.find((player) => player.id === playerId);
//   };

exports.killSelectedPlayer = (playerIdToKill, playersList) => {
  return playersList.map((player) => {
    if (player.id === playerIdToKill) {
      return {
        ...player,
        isAlive: false,
        isRevealed: player.role.team.join() === "werewolves" && true,
      };
    }
    return player;
  });
};

//   exports.cleanUpRegisteredActionsConcerningDeadPlayers = (updatedPlayersList, setRegisteredActions) => {
//     // if player is dead clean all his registered actions
//     updatedPlayersList.forEach((player) => {
//       if (!player.isAlive) {
//         setRegisteredActions((registeredActionsList) => {
//           return registeredActionsList.filter((action) => {
//             action.playerId !== player.id && action.selectedPlayer.id !== player.id;
//           });
//         });
//       }
//     });
//   };

// exports.killRandomPlayer = (setUpdatedPlayersList, displayAction, isTerrorist) => {
//   const randomKilledIndex = Math.floor(Math.random() * 12);
//   setUpdatedPlayersList((prevPlayersList) => {
//     return prevPlayersList.map((player) => {
//       if (player.id === randomKilledIndex) {
//         if (player.isAlive) {
//           isTerrorist && displayAction(`A sudden terrorist explosion killed ${player.name}!`);
//           return {
//             ...player,
//             isAlive: false,
//           };
//         } else {
//           // The player is already dead, do nothing
//           return player;
//         }
//       }
//       return player;
//     });
//   });
// };
