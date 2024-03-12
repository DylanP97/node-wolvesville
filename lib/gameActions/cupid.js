

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
  
//   exports.linkLovers = (action, setUpdatedPlayersList) => {
//     setUpdatedPlayersList((prevPlayersList) => {
//       return prevPlayersList.map((player) => {
//         if (player.id === action.selectedPlayer) {
//           return {
//             ...player,
//             isInLove: true,
//           };
//         }
//         if (player.id === action.player) {
//           return {
//             ...player,
//             role: {
//               ...player.role,
//               canPerform: {
//                 ...player.role.canPerform,
//                 nbrLeftToPerform: 0,
//               },
//             },
//           };
//         }
//         return player;
//       });
//     });
//   };