

const { editGame, pauseForAnimation, setRooms } = require("./gameSetup");
const { getCurrentTime } = require("./utils");
const { teams } = require("./teams");

exports.handleAssertDuty = (captainName, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    const message = `
          {serverContent.action.message.captainReveal}   
          ${captainName}
          {serverContent.action.message.captainTripleVote}
          `;
    editGame(game, "assertDuty", null, message);
    setRooms(rooms, game, io, roomId);
    io.to(roomId).emit("triggerAnimationForAll", { name: "theCaptain", text: message.trim() });
    pauseForAnimation(game, io, roomId, 6000, rooms);
  }
}

exports.handleRegisterAction = (actionObject, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (!game) return;
  game.registeredActions.push(actionObject);
  setRooms(rooms, game, io, roomId);
}

exports.handleRevealPlayer = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    const message = `
          {serverContent.action.message.seer}
          ${action.selectedPlayerName} - ${action.selectedPlayerRole}!
          `;
    editGame(
      game,
      "reveal",
      action,
      message
    );
    setRooms(rooms, game, io, roomId);
    // Use the message we passed to editGame (trimmed)
    const animationMessage = message.trim() || null;
    io.to(roomId).emit("triggerAnimationForAll", {
      name: "seerForesee",
      text: animationMessage
    });
    pauseForAnimation(game, io, roomId, 3000, rooms);
  }
}

exports.handlePutNightmare = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    editGame(
      game,
      "putNightmare",
      action,
      `DEV -- {serverContent.action.message.putNightmare} ${action.selectedPlayerName}! --`
    );
    setRooms(rooms, game, io, roomId);
  }
}

exports.handleShootBullet = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    editGame(
      game,
      "shoot",
      action,
      null
    );
    setRooms(rooms, game, io, roomId);
    io.to(roomId).emit("triggerSoundForAll", "gunshot");
    // Get the message stored in game object (before werewolf reveal message)
    // Fallback to first message if not stored
    const animationMessage = game.lastActionMessage || game.messagesHistory.find(m => m.msg?.includes("shootBullet"))?.msg || game.messagesHistory[0]?.msg || null;
    // Clear the stored message after use
    if (game.lastActionMessage) {
      delete game.lastActionMessage;
    }
    io.to(roomId).emit("triggerAnimationForAll", {
      name: "angryShooter",
      text: animationMessage
    });
    pauseForAnimation(game, io, roomId, 6000, rooms);
  }
}


exports.handlePourGasoline = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    editGame(
      game,
      "pour",
      action,
      ` DEV -- {serverContent.action.message.pourGasoline} ${action.selectedPlayerName} --`
    );
    setRooms(rooms, game, io, roomId);
  }
};

exports.handleBurnThemDown = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    editGame(
      game,
      "burn",
      action,
      null
    );
    setRooms(rooms, game, io, roomId);
    // Find the burnThemDown message (not the individual burn messages)
    const animationMessage = game.messagesHistory.find(m => m.msg?.includes("burnThemDown"))?.msg || game.messagesHistory[0]?.msg || null;
    io.to(roomId).emit("triggerAnimationForAll", {
      name: "arsonistPlay",
      text: animationMessage
    });
    pauseForAnimation(game, io, roomId, 6000, rooms);
  }
};

exports.handleRevive = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    editGame(
      game,
      "revive",
      action,
      null
    );
    setRooms(rooms, game, io, roomId);
    // Use the message for medium revive animation (message doesn't exist yet at this point)
    const animationMessage = "{serverContent.action.message.mediumAboutToRevive}";
    io.to(roomId).emit("triggerAnimationForAll", {
      name: "mediumRevive",
      text: animationMessage
    });
    pauseForAnimation(game, io, roomId, 6000, rooms);
  }
};

exports.handleLootGrave = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    const message = `{serverContent.action.message.graveRobber}!`;
    editGame(
      game,
      "loot",
      action,
      message
    );
    setRooms(rooms, game, io, roomId);
    // Use the message we passed to editGame
    const animationMessage = message || null;
    io.to(roomId).emit("triggerAnimationForAll", {
      name: "graveRobber",
      text: animationMessage
    });
    pauseForAnimation(game, io, roomId, 6000, rooms);
  }
};

exports.handleExecutePrisoner = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    editGame(
      game,
      "execute",
      action,
      null
    );
    setRooms(rooms, game, io, roomId);
  }
};

exports.handleHeal = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    editGame(game, "heal", action, `DEV -- {serverContent.action.message.heal} ${action.selectedPlayerName}! --`);
    setRooms(rooms, game, io, roomId);
  }
};

exports.handlePoisonPotion = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    editGame(
      game,
      "poisonPotion",
      action,
      null
    );
    setRooms(rooms, game, io, roomId);
    // Get the message stored in game object (before werewolf reveal message)
    const animationMessage = game.lastActionMessage || game.messagesHistory.find(m => m.msg?.includes("poisonPotion"))?.msg || game.messagesHistory[0]?.msg || null;
    // Clear the stored message after use
    if (game.lastActionMessage) {
      delete game.lastActionMessage;
    }
    io.to(roomId).emit("triggerAnimationForAll", {
      name: "witchPoison",
      text: animationMessage
    });
    pauseForAnimation(game, io, roomId, 6000, rooms);
  }
};

exports.handleProtectPotion = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    editGame(
      game,
      "protectPotion",
      action,
      `DEV --
          ${action.selectedPlayerName}
          {serverContent.action.message.protectPotion} --
          `
    );
    setRooms(rooms, game, io, roomId);
  }
};

exports.handleUncoverRole = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    editGame(
      game,
      "uncoverRole",
      action,
      null // Don't add message to general chat
    );
    // Add message to wolves chat instead
    game.wolvesMessagesHistory.unshift({
      time: getCurrentTime(game.startTime),
      author: "",
      msg: `{serverContent.action.message.wolfSeer} ${action.selectedPlayerName}!`,
    });
    setRooms(rooms, game, io, roomId);
  }
};

exports.handleChooseJuniorWolfDeathRevenge = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    const targetPlayer = game.playersList.find(p => p.id === action.selectedPlayerId);
    const targetName = targetPlayer ? targetPlayer.name : action.selectedPlayerName || "unknown";

    // Store previous target to determine if this is new or changed
    const babyWolf = game.playersList.find(p => p.id === action.babyWolfId);
    const hadPreviousTarget = babyWolf && babyWolf.revengeTargetId !== undefined;

    editGame(game, "chooseJuniorWolfDeathRevenge", action, null);

    // Check if this is a new target or a change
    const messageKey = !hadPreviousTarget
      ? "{serverContent.action.message.babyWolfTargetChosen}"
      : "{serverContent.action.message.babyWolfTargetChanged}";

    // Add message to wolves chat with target name
    game.wolvesMessagesHistory.unshift({
      time: getCurrentTime(game.startTime),
      author: "",
      msg: `👶🐺 ${messageKey} ${targetName}`,
    });

    // Add DEV message
    game.messagesHistory.unshift({
      time: getCurrentTime(game.startTime),
      author: "",
      msg: `DEV -- Baby Werewolf chose revenge target: ${targetName}`,
    });

    setRooms(rooms, game, io, roomId);
  }
};

exports.handleGhostVisit = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    const ghostLady = game.playersList.find(p => p.id === action.ghostLadyId);
    const targetPlayer = game.playersList.find(p => p.id === action.selectedPlayerId);
    const targetName = targetPlayer ? targetPlayer.name : "unknown";

    editGame(game, "ghostVisit", action, null);

    // Add DEV message
    game.messagesHistory.unshift({
      time: getCurrentTime(game.startTime),
      author: "",
      msg: `DEV -- Ghost Lady is visiting: ${targetName}`,
    });

    setRooms(rooms, game, io, roomId);
  }
};

exports.handleAddWolfVote = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    editGame(
      game,
      "addWolfVote",
      action,
      `DEV -- ${action.playerName}
          {serverContent.action.message.addWolfVote}
          ${action.selectedPlayerName}! --`
    );
    setRooms(rooms, game, io, roomId);
  }
};

exports.handleAddVote = (action, roomId, rooms, io) => {
  let game = rooms.find((room) => room.id === roomId);
  if (game) {
    editGame(
      game,
      "addVote",
      action,
      `DEV -- ${action.playerName}
          {serverContent.action.message.addVote} 
          ${action.selectedPlayerName}!`
    );
    setRooms(rooms, game, io, roomId);
  }
};

// ========== GAME ACTIONS UTILITIES ==========

exports.checkForWinner = (aliveList, allPlayersList) => {
  // Safety check: if no one is alive, no winner
  if (!aliveList || aliveList.length === 0) {
    return null;
  }

  // Check for Ghost Lady win condition: Last player alive
  if (aliveList.length === 1) {
    const lastPlayer = aliveList[0];
    if (lastPlayer.role.name === "Ghost Lady") {
      return {
        name: "Ghost Lady",
        image: lastPlayer.role.image,
        winnerPlayers: [lastPlayer],
      };
    }
  }

  if (aliveList.length === 2) {
    const player1 = aliveList[0];
    const player2 = aliveList[1];

    // First check: Are the last 2 alive players lovers?
    const lover1 = player1;
    const lover2 = player2;

    if (lover1.isInLove && lover2.isInLove &&
      lover1.loverPartnerId === lover2.id &&
      lover2.loverPartnerId === lover1.id) {
      // Lovers win!
      const winningTeam = teams.find((team) => team.name === "Lovers");
      const winnerPlayers = [lover1, lover2];

      // Add Cupid to winners (even if dead)
      const cupid = findCupid(allPlayersList);
      if (cupid) {
        winnerPlayers.push(cupid);
      }

      return {
        name: winningTeam.name,
        image: winningTeam.image,
        winnerPlayers: winnerPlayers,
      };
    }
  }

  // Standard winning condition: all alive players from same team
  let firstPlayerTeam = aliveList[0].role.team;
  let opponentFound = false;

  for (let i = 1; i < aliveList.length; i++) {
    let currentPlayerTeam = aliveList[i].role.team;
    if (firstPlayerTeam !== currentPlayerTeam) {
      opponentFound = true;
      break;
    }
  }

  if (!opponentFound) {
    let winningTeamName = firstPlayerTeam;
    const winningTeam = teams.find((team) => team.name == winningTeamName);

    const winnerPlayers = aliveList.filter(
      (player) => player.role.team === winningTeamName
    );

    const winner = {
      name: winningTeam.name,
      image: winningTeam.image,
      winnerPlayers: winnerPlayers,
    };
    return winner;
  } else {
    return null;
  }
};

exports.giveRandomName = () => {
  let randomName;
  randomName = shortName();
  return randomName;
};
