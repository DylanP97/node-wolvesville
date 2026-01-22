const { getCurrentTime } = require("../lib/utils");

/**
 * Baby Werewolf selects a target for revenge kill when they die.
 * The target will be killed when the Baby Werewolf dies.
 * The Baby Werewolf can change their target at any time.
 */
exports.chooseRevengeTarget = (playersList, babyWolfId, selectedPlayerId) => {
  const babyWolf = playersList.find((p) => p.id === babyWolfId);

  if (!babyWolf) {
    return { playersList, isNewTarget: false };
  }

  const hadPreviousTarget = babyWolf.revengeTargetId !== undefined;

  playersList = playersList.map((player) => {
    if (player.id === babyWolfId) {
      return {
        ...player,
        revengeTargetId: selectedPlayerId,
      };
    }
    return player;
  });

  return { playersList, isNewTarget: !hadPreviousTarget };
};

/**
 * Execute the revenge kill when Baby Werewolf dies.
 * Called from death processing logic.
 */
exports.executeRevengeKill = (playersList, babyWolfId, messagesHistory, startTime, animationQueue) => {
  const babyWolf = playersList.find((p) => p.id === babyWolfId);

  // Debug logging
  // console.log("executeRevengeKill called with babyWolfId:", babyWolfId);
  // console.log("Found babyWolf:", babyWolf ? `${babyWolf.name} (revengeTargetId: ${babyWolf.revengeTargetId})` : "NOT FOUND");

  if (!babyWolf || !babyWolf.revengeTargetId) {
    // console.log("ABORT: babyWolf not found or no revengeTargetId");
    return { playersList, messagesHistory };
  }

  const targetId = babyWolf.revengeTargetId;
  const target = playersList.find((p) => p.id === targetId);

  // console.log("Target found:", target ? `${target.name} (isAlive: ${target.isAlive})` : "NOT FOUND");

  if (!target || !target.isAlive) {
    // console.log("ABORT: target not found or not alive");
    return { playersList, messagesHistory };
  }

  // console.log("EXECUTING REVENGE KILL on", target.name);

  // Kill the target
  playersList = playersList.map((player) => {
    if (player.id === targetId) {
      return {
        ...player,
        isAlive: false,
        causeOfDeath: "baby_wolf_revenge",
      };
    }
    return player;
  });

  // Add message
  messagesHistory.unshift({
    time: getCurrentTime(startTime),
    author: "",
    msg: `👶🐺 ${target.name} {serverContent.action.message.babyWolfRevenge}`,
  });

  // Queue animation
  if (animationQueue) {
    animationQueue.push({
      type: "babyWolfRevenge",
      duration: 4000,
      message: `👶🐺 ${target.name} {serverContent.action.message.babyWolfRevenge}`,
    });
  }

  return { playersList, messagesHistory };
};
