exports.useProtectPotion = (playersList, selectedPlayerId, witchId) => {
  const witch = playersList.find((p) => p.id === witchId);
  // Check if witch has nightmares - they can't use their ability
  if (witch && witch.willHaveNightmares) {
    return playersList;
  }

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
        isProtected: true,
      };
    }
    return player;
  });

  return playersList;
};

exports.reinitializeProtection = (playersList) => {
  playersList = playersList.map((player) => {
    if (player.isProtected) {
      return {
        ...player,
        isProtected: false,
      };
    }
    return player;
  });
  return playersList;
};


const { checkIfIsInLove } = require("./cupid");

exports.usePoisonPotion = (playersList, selectedPlayerId, witchId, messagesHistory = [], gameStartTime) => {
  const witch = playersList.find((p) => p.id === witchId);
  // Check if witch has nightmares - they can't use their ability
  if (witch && witch.willHaveNightmares) {
    return { playersList, messagesHistory };
  }

  // Get the player before they're killed to check isInLove
  const poisonedPlayer = playersList.find((p) => p.id === selectedPlayerId);

  playersList = playersList.map((player) => {
    if (player.id === witchId) {
      return {
        ...player,
        role: {
          ...player.role,
          canPerform2: {
            ...player.role.canPerform2,
            nbrLeftToPerform: player.role.canPerform2.nbrLeftToPerform - 1,
          },
        },
      };
    }
    if (player.id === selectedPlayerId) {
      return {
        ...player,
        isAlive: false,
        isRevealed: player.isRevealed ? true : player.role.team === "Werewolves",
      };
    }
    return player;
  });

  // Check if the poisoned player was in love and kill their partner
  if (poisonedPlayer) {
    // Add poison message first
    const { getCurrentTime } = require("../lib/utils");
    messagesHistory.unshift({
      time: getCurrentTime(gameStartTime),
      author: "",
      msg: `{serverContent.action.message.poisonPotion}${poisonedPlayer.name}`,
    });
    // Reveal if the poisoned player was a werewolf (only if not already revealed)
    if (poisonedPlayer.role.team === "Werewolves" && !poisonedPlayer.isRevealed) {
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `{serverContent.action.message.werewolfReveal}${poisonedPlayer.name}{serverContent.action.message.wasWerewolf}`,
      });
    }
    const result = checkIfIsInLove(poisonedPlayer, playersList, messagesHistory, gameStartTime);
    playersList = result.playersList;
    messagesHistory = result.messagesHistory;
  }

  return { playersList, messagesHistory };
};

