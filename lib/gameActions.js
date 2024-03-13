const { shortName } = require("./randomUsername");
const { teams } = require("./teams");

exports.checkForWinner = (aliveList) => {
  const firstPlayerTeam = aliveList[0].role.team.join();
  let opponentFound = false;

  for (let i = 1; i < aliveList.length; i++) {
    const currentPlayerTeam = aliveList[i].role.team.join();
    if (currentPlayerTeam !== firstPlayerTeam) {
      opponentFound = true;
      break;
    }
  }

  if (!opponentFound) {
    let wArr = teams.filter((t) => t.name === firstPlayerTeam);

    return wArr[0];
  } else {
    return null;
  }
};

exports.giveRandomName = () => {
  let randomName;
  randomName = shortName();
  return randomName;
};

// exports.registerSimpleAction = () => {
//   setRegisteredActions([
//     ...registeredActions,
//     {
//       type: playerToPlay.role.canPerform.type,
//       player: playerToPlay.id,
//     },
//   ]);
//   toNext();
// };



// exports.aftermathOfVote = (displayAction, playersList, setUpdatedPlayersList, setWinner) => {
//   const mostVotedAgainstPlayer = findPlayerWithMostVotes(playersList);

//   playersList.forEach((player) => {
//     player.voteAgainst = 0;
//   });

//   if (!mostVotedAgainstPlayer) {
//     displayAction(`The town couldn't decide who to kill!`);
//   } else {
//     killSelectedPlayer(mostVotedAgainstPlayer.id, setUpdatedPlayersList);
//     if (mostVotedAgainstPlayer.role.name === "Fool") {
//       displayAction(`The fool won 🤡!`);
//       setWinner(mostVotedAgainstPlayer);
//     } else {
//       displayAction(
//         `The town decided to kill ${updatedPlayersList[mostVotedAgainstPlayer.id].name} has a result of the vote!`
//       );
//       checkIfIsInLove(mostVotedAgainstPlayer, updatedPlayersList, setUpdatedPlayersList, displayAction);
//     }
//   }
// };

// exports.shootBullet = (action, updatedPlayersList, setUpdatedPlayersList, displayAction) => {
//   killSelectedPlayer(action.selectedPlayer.id, setUpdatedPlayersList);
//   setUpdatedPlayersList((prevPlayersList) => {
//     return prevPlayersList.map((player) => {
//       if (player.id === action.player) {
//         return {
//           ...player,
//           role: {
//             ...player.role,
//             canPerform: {
//               ...player.role.canPerform,
//               nbrLeftToPerform: player.role.canPerform.nbrLeftToPerform - 1,
//             },
//           },
//         };
//       }
//       return player;
//     });
//   });
//   displayAction(`The shooter has shot ${updatedPlayersList[action.selectedPlayer.id].name}! 💀`);
//   checkIfIsInLove(action.selectedPlayer, updatedPlayersList, setUpdatedPlayersList, displayAction);
// };

// exports.investigatePlayers = (action, displayAction, updatedPlayersList) => {
//   const investigatedPlayer1 = getPlayerById(action.selectedPlayer, updatedPlayersList);
//   const investigatedPlayer2 = getPlayerById(action.selectedPlayer2, updatedPlayersList);
//   console.log(investigatedPlayer1);
//   console.log(investigatedPlayer2);
//   const isDifferentTeam = investigatedPlayer1.role.team !== investigatedPlayer2.role.team;
//   displayAction(
//     `${investigatedPlayer1.name} and ${investigatedPlayer2.name} are ${isDifferentTeam ? "from different teams" : "from the same team"
//     }!`
//   );
// };

// exports.pourGasoline = (action, setUpdatedPlayersList) => {
//   setUpdatedPlayersList((prevPlayersList) => {
//     return prevPlayersList.map((player) => {
//       if (player.id === action.player) {
//         return {
//           ...player,
//           role: {
//             ...player.role,
//             playersToSetOnFire: [...player.role.playersToSetOnFire, action.selectedPlayer],
//           },
//         };
//       }
//       return player;
//     });
//   });
// };

// exports.burnPlayers = (playersToSetOnFire, setUpdatedPlayersList, displayAction, toNext) => {
//   playersToSetOnFire.map((player) => {
//     killSelectedPlayer(player.id, setUpdatedPlayersList);
//     displayAction(`A malicious fire burned ${player.name}!`);
//   });
//   toNext();
// };

// exports.muteVoter = (action, setUpdatedPlayersList) => {
//   setUpdatedPlayersList((prevPlayersList) => {
//     return prevPlayersList.map((player) => {
//       if (player.id === action.selectedPlayer.id) {
//         return {
//           ...player,
//           role: {
//             ...player.role,
//             canVote: false,
//           },
//         };
//       }
//       return player;
//     });
//   });
// };

// exports.unmuteVoter = (action, setUpdatedPlayersList) => {
//   setUpdatedPlayersList((prevPlayersList) => {
//     return prevPlayersList.map((player) => {
//       if (player.id === action.selectedPlayer.id) {
//         return {
//           ...player,
//           role: {
//             ...player.role,
//             canVote: true,
//           },
//         };
//       }
//       return player;
//     });
//   });
// };

// exports.craftTheBomb = (action, setUpdatedPlayersList) => {
//   setUpdatedPlayersList((prevPlayersList) => {
//     return prevPlayersList.map((player) => {
//       if (player.id === action.player) {
//         return {
//           ...player,
//           role: {
//             ...player.role,
//             canPerform: {
//               ...player.role.canPerform,
//               nbrLeftToPerform: player.role.canPerform.nbrLeftToPerform - 1,
//             },
//             bombPower: player.role.bombPower + 1,
//           },
//         };
//       }
//       return player;
//     });
//   });
// };

// exports.explodeBomb = (bombPower, setUpdatedPlayersList, displayAction, toNext) => {
//   const isTerrorist = true;
//   for (let e = 0; e < bombPower; e++) {
//     killRandomPlayer(setUpdatedPlayersList, displayAction, isTerrorist);
//   }
//   toNext();
// };

// exports.robTheRole = (action, setUpdatedPlayersList, displayAction) => {
//   setUpdatedPlayersList((prevPlayersList) => {
//     return prevPlayersList.map((player) => {
//       if (player.id === action.player) {
//         return {
//           ...player,
//           role: action.selectedPlayer.role,
//         };
//       }
//       return player;
//     });
//   });
//   displayAction("A grave was looted last night...");
// };

// exports.becomeAccomplice = (playerToPlay, selectedAccomplice, setUpdatedPlayersList, toNext) => {
//   const accompliceObject = roles.find((c) => c.name === "Accomplice");
//   setUpdatedPlayersList((prevPlayersList) => {
//     return prevPlayersList.map((player) => {
//       if (player.id === selectedAccomplice.id) {
//         return {
//           ...player,
//           role: accompliceObject,
//         };
//       } else if (player.id === playerToPlay.id) {
//         return {
//           ...player,
//           role: {
//             ...player.role,
//             partner: true,
//           },
//         };
//       }
//       return player;
//     });
//   });
//   toNext();
// };

// exports.eliminate = (action, updatedPlayersList, setUpdatedPlayersList, displayAction) => {
//   const selectedPlayer = getPlayerById(action.selectedPlayer.id, updatedPlayersList);
//   const wasHealed = checkIfWasHealed(selectedPlayer, setUpdatedPlayersList);
//   if (!wasHealed) {
//     killSelectedPlayer(selectedPlayer.id, setUpdatedPlayersList);
//     displayAction(`A bandit killed ${updatedPlayersList[selectedPlayer.id].name} last night...`);
//     checkIfIsInLove(selectedPlayer, updatedPlayersList, setUpdatedPlayersList, displayAction);
//   } else {
//     displayAction("Someone wounds were healed by the doctor tonight!");
//   }
// };

// exports.throwHolyWater = (action, updatedPlayersList, setUpdatedPlayersList, displayAction) => {
//   const isVillain = checkIfVillain(action.selectedPlayer);
//   if (!isVillain) {
//     killSelectedPlayer(action.player, setUpdatedPlayersList);
//     displayAction(`The priest threw its holy water on a good villager and die because of it!`);
//     checkIfIsInLove(action.selectedPlayer, updatedPlayersList, setUpdatedPlayersList, displayAction);
//   } else {
//     killSelectedPlayer(action.selectedPlayer.id, setUpdatedPlayersList);
//     setUpdatedPlayersList((prevPlayersList) => {
//       return prevPlayersList.map((player) => {
//         if (player.id === action.player) {
//           return {
//             ...player,
//             role: {
//               ...player.role,
//               canPerform: {
//                 ...player.role.canPerform,
//                 nbrLeftToPerform: player.role.canPerform.nbrLeftToPerform - 1,
//               },
//             },
//           };
//         }
//         return player;
//       });
//     });
//     displayAction(
//       `The priest threw its holy water on ${updatedPlayersList[action.selectedPlayer.id].name
//       }... and the evil player is dead`
//     );
//     checkIfIsInLove(action.selectedPlayer, updatedPlayersList, setUpdatedPlayersList, displayAction);
//   }
// };

// exports.checkIfVillain = (selectedPlayer) => {
//   if (selectedPlayer.role.team !== "village") return true;
//   else return false;
// };
