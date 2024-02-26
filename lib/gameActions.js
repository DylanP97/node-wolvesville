const { shortName } = require("./randomUsername");
const { teams } = require("./teams");
// const roles = require("./roles");
// const initialPlayersList = require("./playerListTemplate");

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

exports.assignRolesToPlayersRandomly = (excludedRoles = []) => {
  const assignedRoles = new Set();

  const randomRoles = initialPlayersList.map((player, index) => {
    let randomCharacter;
    do {
      randomCharacter = roles[Math.floor(Math.random() * roles.length)];
    } while (assignedRoles.has(randomCharacter.name) || excludedRoles.includes(randomCharacter.name));
    assignedRoles.add(randomCharacter.name);
    let randomName;
    randomName = shortName();
    return {
      ...player,
      name: randomName,
      role: randomCharacter,
    };
  });

  return randomRoles;
};

exports.getPlayerById = (playerId, updatedPlayersList) => {
  return updatedPlayersList.find((player) => player.id === playerId);
};

exports.killSelectedPlayer = (playerIdToKill, updatedPlayersList) => {
  return updatedPlayersList.map((player) => {
    if (player.id === playerIdToKill) {
      return {
        ...player,
        isAlive: false,
      };
    }
    return player;
  });
};

exports.killRandomPlayer = (setUpdatedPlayersList, displayAction, isTerrorist) => {
  const randomKilledIndex = Math.floor(Math.random() * 12);
  setUpdatedPlayersList((prevPlayersList) => {
    return prevPlayersList.map((player) => {
      if (player.id === randomKilledIndex) {
        if (player.isAlive) {
          isTerrorist && displayAction(`A sudden terrorist explosion killed ${player.name}!`);
          return {
            ...player,
            isAlive: false,
          };
        } else {
          // The player is already dead, do nothing
          return player;
        }
      }
      return player;
    });
  });
};

exports.voteAgainst = (playerId, playersList, nbr) => {
  return playersList.map((player) => {
    if (player.id === playerId) {
      return {
        ...player,
        voteAgainst: player.voteAgainst + nbr,
      };
    }
    return player;
  });
};

exports.wolfVoteAgainst = (playerId, playersList, nbr) => {
  return playersList.map((player) => {
    if (player.id === playerId) {
      return {
        ...player,
        wolfVoteAgainst: player.voteAgainst + nbr,
      };
    }
    return player;
  });
};

exports.initializeWolvesVotes = (newPlayersList) => {
  return newPlayersList.map((ply) => {
    return {
      ...ply,
      wolfVoteAgainst: 0
    };
  });
}

exports.findPlayerWithMostVotes = (playersList) => {
  let playerWithMostVotes = null;
  let maxVotes = 0;
  let countMaxVotes = 0;

  for (const player of playersList) {
    if (player.voteAgainst > maxVotes) {
      maxVotes = player.voteAgainst;
      playerWithMostVotes = player;
      countMaxVotes = 1;
    } else if (player.voteAgainst === maxVotes) {
      countMaxVotes++;
    }
  }

  return countMaxVotes === 1 ? playerWithMostVotes : null;
};

exports.findPlayerWithMostWolvesVotes = (playersList) => {
  let playerWithMostVotes = null;
  let maxVotes = 0;
  let countMaxVotes = 0;

  for (const player of playersList) {
    if (player.wolfVoteAgainst > maxVotes) {
      maxVotes = player.wolfVoteAgainst;
      playerWithMostVotes = player;
      countMaxVotes = 1;
    } else if (player.wolfVoteAgainst === maxVotes) {
      countMaxVotes++;
    }
  }

  return countMaxVotes === 1 ? playerWithMostVotes : null;
};

exports.cleanUpRegisteredActionsConcerningDeadPlayers = (updatedPlayersList, setRegisteredActions) => {
  // if player is dead clean all his registered actions
  updatedPlayersList.forEach((player) => {
    if (!player.isAlive) {
      setRegisteredActions((registeredActionsList) => {
        return registeredActionsList.filter((action) => {
          action.playerId !== player.id && action.selectedPlayer.id !== player.id;
        });
      });
    }
  });
};

exports.aftermathOfNightWolvesAttack = (displayAction, updatedPlayersList, setUpdatedPlayersList) => {
  const mostVotedAgainstPlayer = findPlayerWithMostWolvesVotes(updatedPlayersList);

  // reset every player nbrOfWolvesVotes to 0
  updatedPlayersList.forEach((player) => {
    player.voteAgainst = 0;
  });

  if (!mostVotedAgainstPlayer) {
    displayAction(`The wolves killed nobody last night!`);
  } else {
    killSelectedPlayer(mostVotedAgainstPlayer.id, setUpdatedPlayersList);
    displayAction(`The wolves killed ${updatedPlayersList[mostVotedAgainstPlayer.id].name} last night!`);
    checkIfIsInLove(mostVotedAgainstPlayer, updatedPlayersList, setUpdatedPlayersList, displayAction);
  }
};

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

exports.shootBullet = (action, updatedPlayersList, setUpdatedPlayersList, displayAction) => {
  killSelectedPlayer(action.selectedPlayer.id, setUpdatedPlayersList);
  setUpdatedPlayersList((prevPlayersList) => {
    return prevPlayersList.map((player) => {
      if (player.id === action.player) {
        return {
          ...player,
          role: {
            ...player.role,
            canPerform: {
              ...player.role.canPerform,
              nbrLeftToPerform: player.role.canPerform.nbrLeftToPerform - 1,
            },
          },
        };
      }
      return player;
    });
  });
  displayAction(`The shooter has shot ${updatedPlayersList[action.selectedPlayer.id].name}!`);
  checkIfIsInLove(action.selectedPlayer, updatedPlayersList, setUpdatedPlayersList, displayAction);
};

exports.arrestPlayer = (action, updatedPlayersList, setUpdatedPlayersList, displayAction) => {
  setUpdatedPlayersList((prevPlayersList) => {
    return prevPlayersList.map((player) => {
      if (player.id === action.selectedPlayer.id) {
        return {
          ...player,
          isUnderArrest: true,
        };
      }
      return player;
    });
  });
  displayAction(`The sheriff has handcuffed ${updatedPlayersList[action.selectedPlayer.id].name}!`);
};

exports.releasePrisoners = (setUpdatedPlayersList) => {
  setUpdatedPlayersList((prevPlayersList) => {
    return prevPlayersList.map((player) => {
      if (player.isUnderArrest) {
        return {
          ...player,
          isUnderArrest: false,
        };
      } else {
        return player;
      }
    });
  });
};

exports.revealPlayer = (action, playersList) => {
  return playersList.map((player) => {
    if (player.id === action.selectedPlayerId) {
      return {
        ...player,
        isRevealed: true,
      };
    }
    if (player.id === action.seerId) {
      return {
        ...player,
        role: {
          ...player.role,
          canPerform: {
            ...player.role.canPerform,
            nbrLeftToPerform: player.role.canPerform.nbrLeftToPerform - 1,
          },
        },
      };
    }
    return player;
  });
};

exports.checkIfIsInLove = (player, updatedPlayersList, setUpdatedPlayersList, displayAction) => {
  if (player.isInLove) {
    const lovers = findLovers(updatedPlayersList);
    const partner = lovers.find((partner) => partner.id !== player.id);
    killSelectedPlayer(partner.id, setUpdatedPlayersList);
    displayAction(`${partner.name} is dead because of its loving relation with ${player.name}!`);
  } else {
    return;
  }
};

exports.findLovers = (updatedPlayersList) => {
  const lovers = updatedPlayersList.filter((player) => player.isInLove);
  return lovers;
};

exports.linkLovers = (action, setUpdatedPlayersList) => {
  setUpdatedPlayersList((prevPlayersList) => {
    return prevPlayersList.map((player) => {
      if (player.id === action.selectedPlayer) {
        return {
          ...player,
          isInLove: true,
        };
      }
      if (player.id === action.player) {
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
  });
};

exports.murder = (action, updatedPlayersList, setUpdatedPlayersList, displayAction) => {
  const selectedPlayer = getPlayerById(action.selectedPlayer.id, updatedPlayersList);
  const wasHealed = checkIfWasHealed(selectedPlayer, setUpdatedPlayersList);
  if (!wasHealed) {
    killSelectedPlayer(selectedPlayer.id, setUpdatedPlayersList);
    displayAction(`A serial killer killed ${updatedPlayersList[selectedPlayer.id].name} last night...`);
    checkIfIsInLove(selectedPlayer, updatedPlayersList, setUpdatedPlayersList, displayAction);
  } else {
    displayAction("Someone wounds were healed by the doctor tonight!");
  }
};

exports.checkIfWasHealed = (attackedPlayer, setUpdatedPlayersList) => {
  const wasHealed = attackedPlayer.isHealed;
  if (wasHealed) {
    setUpdatedPlayersList((prevPlayersList) => {
      return prevPlayersList.map((player) => {
        if (player.id === attackedPlayer.id) {
          return {
            ...player,
            isHealed: false,
          };
        }
        return player;
      });
    });
    return true;
  } else {
    return;
  }
};

exports.heal = (action, setUpdatedPlayersList) => {
  setUpdatedPlayersList((prevPlayersList) => {
    return prevPlayersList.map((player) => {
      if (player.id === action.selectedPlayer.id) {
        return {
          ...player,
          isHealed: true,
        };
      }
      return player;
    });
  });
};

exports.investigatePlayers = (action, displayAction, updatedPlayersList) => {
  const investigatedPlayer1 = getPlayerById(action.selectedPlayer, updatedPlayersList);
  const investigatedPlayer2 = getPlayerById(action.selectedPlayer2, updatedPlayersList);
  console.log(investigatedPlayer1);
  console.log(investigatedPlayer2);
  const isDifferentTeam = investigatedPlayer1.role.team !== investigatedPlayer2.role.team;
  displayAction(
    `${investigatedPlayer1.name} and ${investigatedPlayer2.name} are ${isDifferentTeam ? "from different teams" : "from the same team"
    }!`
  );
};

exports.pourGasoline = (action, setUpdatedPlayersList) => {
  setUpdatedPlayersList((prevPlayersList) => {
    return prevPlayersList.map((player) => {
      if (player.id === action.player) {
        return {
          ...player,
          role: {
            ...player.role,
            playersToSetOnFire: [...player.role.playersToSetOnFire, action.selectedPlayer],
          },
        };
      }
      return player;
    });
  });
};

exports.burnPlayers = (playersToSetOnFire, setUpdatedPlayersList, displayAction, toNext) => {
  playersToSetOnFire.map((player) => {
    killSelectedPlayer(player.id, setUpdatedPlayersList);
    displayAction(`A malicious fire burned ${player.name}!`);
  });
  toNext();
};

exports.muteVoter = (action, setUpdatedPlayersList) => {
  setUpdatedPlayersList((prevPlayersList) => {
    return prevPlayersList.map((player) => {
      if (player.id === action.selectedPlayer.id) {
        return {
          ...player,
          role: {
            ...player.role,
            canVote: false,
          },
        };
      }
      return player;
    });
  });
};

exports.unmuteVoter = (action, setUpdatedPlayersList) => {
  setUpdatedPlayersList((prevPlayersList) => {
    return prevPlayersList.map((player) => {
      if (player.id === action.selectedPlayer.id) {
        return {
          ...player,
          role: {
            ...player.role,
            canVote: true,
          },
        };
      }
      return player;
    });
  });
};

exports.craftTheBomb = (action, setUpdatedPlayersList) => {
  setUpdatedPlayersList((prevPlayersList) => {
    return prevPlayersList.map((player) => {
      if (player.id === action.player) {
        return {
          ...player,
          role: {
            ...player.role,
            canPerform: {
              ...player.role.canPerform,
              nbrLeftToPerform: player.role.canPerform.nbrLeftToPerform - 1,
            },
            bombPower: player.role.bombPower + 1,
          },
        };
      }
      return player;
    });
  });
};

exports.explodeBomb = (bombPower, setUpdatedPlayersList, displayAction, toNext) => {
  const isTerrorist = true;
  for (let e = 0; e < bombPower; e++) {
    killRandomPlayer(setUpdatedPlayersList, displayAction, isTerrorist);
  }
  toNext();
};

exports.robTheRole = (action, setUpdatedPlayersList, displayAction) => {
  setUpdatedPlayersList((prevPlayersList) => {
    return prevPlayersList.map((player) => {
      if (player.id === action.player) {
        return {
          ...player,
          role: action.selectedPlayer.role,
        };
      }
      return player;
    });
  });
  displayAction("A grave was looted last night...");
};

exports.becomeAccomplice = (playerToPlay, selectedAccomplice, setUpdatedPlayersList, toNext) => {
  const accompliceObject = roles.find((c) => c.name === "Accomplice");
  setUpdatedPlayersList((prevPlayersList) => {
    return prevPlayersList.map((player) => {
      if (player.id === selectedAccomplice.id) {
        return {
          ...player,
          role: accompliceObject,
        };
      } else if (player.id === playerToPlay.id) {
        return {
          ...player,
          role: {
            ...player.role,
            partner: true,
          },
        };
      }
      return player;
    });
  });
  toNext();
};

exports.eliminate = (action, updatedPlayersList, setUpdatedPlayersList, displayAction) => {
  const selectedPlayer = getPlayerById(action.selectedPlayer.id, updatedPlayersList);
  const wasHealed = checkIfWasHealed(selectedPlayer, setUpdatedPlayersList);
  if (!wasHealed) {
    killSelectedPlayer(selectedPlayer.id, setUpdatedPlayersList);
    displayAction(`A bandit killed ${updatedPlayersList[selectedPlayer.id].name} last night...`);
    checkIfIsInLove(selectedPlayer, updatedPlayersList, setUpdatedPlayersList, displayAction);
  } else {
    displayAction("Someone wounds were healed by the doctor tonight!");
  }
};

exports.throwHolyWater = (action, updatedPlayersList, setUpdatedPlayersList, displayAction) => {
  const isVillain = checkIfVillain(action.selectedPlayer);
  if (!isVillain) {
    killSelectedPlayer(action.player, setUpdatedPlayersList);
    displayAction(`The priest threw its holy water on a good villager and die because of it!`);
    checkIfIsInLove(action.selectedPlayer, updatedPlayersList, setUpdatedPlayersList, displayAction);
  } else {
    killSelectedPlayer(action.selectedPlayer.id, setUpdatedPlayersList);
    setUpdatedPlayersList((prevPlayersList) => {
      return prevPlayersList.map((player) => {
        if (player.id === action.player) {
          return {
            ...player,
            role: {
              ...player.role,
              canPerform: {
                ...player.role.canPerform,
                nbrLeftToPerform: player.role.canPerform.nbrLeftToPerform - 1,
              },
            },
          };
        }
        return player;
      });
    });
    displayAction(
      `The priest threw its holy water on ${updatedPlayersList[action.selectedPlayer.id].name
      }... and the evil player is dead`
    );
    checkIfIsInLove(action.selectedPlayer, updatedPlayersList, setUpdatedPlayersList, displayAction);
  }
};

exports.checkIfVillain = (selectedPlayer) => {
  if (selectedPlayer.role.team !== "village") return true;
  else return false;
};

exports.registerSimpleAction = () => {
  setRegisteredActions([
    ...registeredActions,
    {
      type: playerToPlay.role.canPerform.type,
      player: playerToPlay.id,
    },
  ]);
  toNext();
};
