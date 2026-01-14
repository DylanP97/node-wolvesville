const { getCurrentTime } = require("../lib/utils");

/**
 * Ghost Lady visits a player at night.
 * If Ghost Lady is attacked during visit, the visited player dies instead.
 */
exports.visitPlayer = (playersList, ghostLadyId, selectedPlayerId) => {
  const ghostLady = playersList.find((p) => p.id === ghostLadyId);

  if (!ghostLady) {
    return playersList;
  }

  playersList = playersList.map((player) => {
    if (player.id === ghostLadyId) {
      return {
        ...player,
        visitingPlayerId: selectedPlayerId,
      };
    }
    return player;
  });

  return playersList;
};

/**
 * Handle attack on Ghost Lady while visiting.
 * The visited player dies instead with a paranormal accident message.
 */
exports.redirectAttackToVisited = (playersList, ghostLadyId, messagesHistory, startTime, animationQueue) => {
  const ghostLady = playersList.find((p) => p.id === ghostLadyId);
  if (!ghostLady || !ghostLady.visitingPlayerId) {
    return { playersList, messagesHistory, redirected: false };
  }

  const visitedPlayer = playersList.find((p) => p.id === ghostLady.visitingPlayerId);
  if (!visitedPlayer || !visitedPlayer.isAlive) {
    return { playersList, messagesHistory, redirected: false };
  }

  // Kill visited player instead
  playersList = playersList.map((player) => {
    if (player.id === visitedPlayer.id) {
      return {
        ...player,
        isAlive: false,
        killedBy: "Paranormal Accident",
      };
    }
    // Clear Ghost Lady's visit state
    if (player.id === ghostLadyId) {
      const { visitingPlayerId, ...rest } = player;
      return rest;
    }
    return player;
  });

  // New message: "A paranormal accident caused the death of (player.name)"
  const deathMessage = `👻 {serverContent.action.message.paranormalAccident} ${visitedPlayer.name}`;
  messagesHistory.unshift({
    time: getCurrentTime(startTime),
    author: "",
    msg: deathMessage,
  });

  if (animationQueue) {
    animationQueue.push({
      type: "paranormalAccident",
      duration: 4000,
      message: deathMessage,
    });
  }

  return { playersList, messagesHistory, redirected: true };
};

/**
 * Clear Ghost Lady visit state at end of night.
 */
exports.clearVisitState = (playersList) => {
  return playersList.map((player) => {
    if (player.visitingPlayerId !== undefined) {
      const { visitingPlayerId, ...rest } = player;
      return rest;
    }
    return player;
  });
};
