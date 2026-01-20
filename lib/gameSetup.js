const { shuffle } = require("lodash");
const Player = require("./Player");
const { getCurrentTime } = require("../lib/utils");
const { revealPlayer } = require("../gameActions/seer");
const { executePrisoner } = require("../gameActions/jailer");
const { heal } = require("../gameActions/doctor");
const { shootBullet } = require("../gameActions/gunner");
const { assertDuty } = require("../gameActions/captain");
const { useProtectPotion, usePoisonPotion } = require("../gameActions/witch");
const { voteAgainst, wolfVoteAgainst } = require("../gameActions/vote");
const { uncoverRole } = require("../gameActions/wolfSeer");
const { putNightmare } = require("../gameActions/nightmare");
const { generateRandomAvatar } = require("./generateRandomAvatar");
const { lootGrave } = require("../gameActions/graveRobber");
const { pourGasoline, burnThemDown } = require("../gameActions/pyro");
const { processReviveAtDayStart } = require("../gameActions/medium");
const { chooseRevengeTarget } = require("../gameActions/babyWerewolf");
const { visitPlayer } = require("../gameActions/ghostLady");

exports.initializePlayersList = (
  nbrOfPlayers,
  selectedRoles,
  usersInTheRoom,
  nbrCPUPlayers,
  isQuickGame,
  userPreferences
) => {
  let playersList = [];

  // Create empty players
  for (let i = 0; i < nbrOfPlayers; i++) {
    playersList.push(new Player(i));
  }

  // STEP 1: Assign users first
  let userIndex = 0;
  let CPUCount = 0;

  playersList.forEach((player) => {
    if (userIndex < usersInTheRoom.length) {
      const usr = usersInTheRoom[userIndex];
      player.name = usr.username;
      player.avatar = usr.avatar;
      player.isCPU = false;
      userIndex++;
    } else {
      CPUCount++;
      player.name = `CPU ${CPUCount}`;
      player.avatar = generateRandomAvatar();
      player.isCPU = true;
    }
  });

  // STEP 2: Parse preferences
  let preferredMap = {};
  userPreferences.forEach(u => {
    if (u.preferredRole) {
      preferredMap[u.username] = u.preferredRole;
    }
  });

  // STEP 3: Extract forced roles
  let forced = [];

  Object.entries(preferredMap).forEach(([username, roleName]) => {
    const foundIdx = selectedRoles.findIndex(r => r.name === roleName);
    if (foundIdx !== -1) {
      forced.push({ username, roleObj: selectedRoles[foundIdx] });
      selectedRoles.splice(foundIdx, 1);
    }
  });

  // Ensure role count matches
  const remainingPlayers = nbrOfPlayers - forced.length;

  if (selectedRoles.length < remainingPlayers) {
    throw new Error("Not enough roles selected for the number of players.");
  }

  if (selectedRoles.length > remainingPlayers) {
    selectedRoles = selectedRoles.slice(0, remainingPlayers);
  }

  // STEP 4: Shuffle
  let shuffled = shuffle(selectedRoles);

  // STEP 5: Assign random roles only to players not in forced
  let randomIndex = 0;
  playersList.forEach((p) => {
    const isForced = forced.some(f => f.username === p.name);
    if (!isForced) {
      p.role = shuffled[randomIndex];
      randomIndex++;
    }
  });

  // STEP 6: Apply forced roles
  forced.forEach(({ username, roleObj }) => {
    const idx = playersList.findIndex(p => p.name === username);
    if (idx !== -1) {
      playersList[idx].role = roleObj;
    }
  });

  // STEP 7: Randomize CPU flags (only for CPU candidates)
  const cpuCandidates = playersList.filter(p => p.isCPU);
  let shuffledCpu = shuffle(cpuCandidates).slice(0, nbrCPUPlayers);
  playersList.forEach(p => (p.isCPU = false));
  shuffledCpu.forEach(p => (p.isCPU = true));

  // STEP 8: Shuffle the entire players list for randomized display order
  playersList = shuffle(playersList);

  // STEP 9: Reassign player IDs based on new shuffled order
  playersList.forEach((player, index) => {
    player.id = index;
  });

  return playersList;
};


exports.initializeGameObject = (roomToJoin, playersList) => {

  const startTime = Date.now();

  roomToJoin.playersList = playersList;
  roomToJoin.aliveList = playersList.filter((p) => p.isAlive);
  roomToJoin.dayCount = 0;
  roomToJoin.timeOfTheDay = "nighttime";
  roomToJoin.timeCounter = 25000;
  roomToJoin.registeredActions = [];
  roomToJoin.winningTeam = null;
  roomToJoin.startTime = startTime;
  roomToJoin.messagesHistory = [{
    time: getCurrentTime(startTime),
    author: "",
    msg: `{serverContent.game.commencementnight} `,
  }, {
    time: getCurrentTime(startTime),
    author: "",
    msg: `{serverContent.game.thankYouForPlaying} `,
  }];
  roomToJoin.wolvesMessagesHistory = [];
  roomToJoin.jailNightMessages = [];
  roomToJoin.mediumMessagesHistory = [];
  roomToJoin.isPaused = false;
  roomToJoin.hasEnded = null;
  roomToJoin.isLaunched = true;

  // Role action tracking for stats
  roomToJoin.roleActions = {
    doctorSaves: 0,
    witchSaves: 0,
    witchKills: 0,
    seerReveals: 0,
    gunnerKills: 0,
    jailerExecutions: 0,
    wolfKills: 0,
    skKills: 0,
    arsonistBurns: 0,
    mediumRevives: 0
  };

  return roomToJoin;
};



exports.setRooms = (rooms, game, io, roomId) => {
  const roomIndex = rooms.findIndex((r) => r.id === roomId);
  if (roomIndex !== -1) {
    rooms[roomIndex] = game;
  }
  io.to(roomId).emit("updateGame", game);
  return rooms;
};



exports.editGame = (game, type, actionObj, message) => {
  // Initialize animation queue if it doesn't exist
  if (!game.animationQueue) {
    game.animationQueue = [];
  }

  // Initialize role actions if it doesn't exist
  if (!game.roleActions) {
    game.roleActions = {
      doctorSaves: 0, witchSaves: 0, witchKills: 0, seerReveals: 0,
      gunnerKills: 0, jailerExecutions: 0, wolfKills: 0, skKills: 0,
      arsonistBurns: 0, mediumRevives: 0
    };
  }

  switch (type) {
    case "protectPotion":
      game.playersList = useProtectPotion(
        game.playersList,
        actionObj.selectedPlayerId,
        actionObj.playerId
      );
      break;

    case "poisonPotion":
      const poisonResult = usePoisonPotion(
        game.playersList,
        actionObj.selectedPlayerId,
        actionObj.playerId,
        game.messagesHistory,
        game.startTime,
        game.animationQueue
      );
      game.playersList = poisonResult.playersList;
      game.messagesHistory = poisonResult.messagesHistory;
      // Store the poison message for animation (before werewolf reveal message)
      if (poisonResult.poisonMessage) {
        game.lastActionMessage = poisonResult.poisonMessage;
        game.roleActions.witchKills++;
      }
      break;

    case "chooseJuniorWolfDeathRevenge":
      const revengeResult = chooseRevengeTarget(
        game.playersList,
        actionObj.babyWolfId,
        actionObj.selectedPlayerId
      );
      game.playersList = revengeResult.playersList;
      // Store whether this is a new target or a change for messaging
      game._isNewRevengeTarget = revengeResult.isNewTarget;
      break;

    case "ghostVisit":
      game.playersList = visitPlayer(
        game.playersList,
        actionObj.ghostLadyId,
        actionObj.selectedPlayerId
      );
      break;

    case "assertDuty":
      game.playersList = assertDuty(game.playersList);
      break;

    case "reveal":
      game = revealPlayer(
        actionObj.selectedPlayerId,
        actionObj.seerId,
        game
      );
      game.roleActions.seerReveals++;
      break;

    case "loot":
      game.playersList = lootGrave(
        game.playersList,
        actionObj.graveRobberId,
        actionObj.selectedPlayerId,
        actionObj.selectedPlayerRole
      );
      break;

    case "revive":
      // Register revive action to be processed at day start
      game.registeredActions.push(actionObj);
      game.roleActions.mediumRevives++;
      break;

    case "execute":
      const executeResult = executePrisoner(game.playersList, game.messagesHistory, game.startTime, game.animationQueue);
      game.playersList = executeResult.playersList;
      game.messagesHistory = executeResult.messagesHistory;
      game.roleActions.jailerExecutions++;
      break;

    case "heal":
      game.playersList = heal(actionObj.selectedPlayerId, game.playersList, actionObj.playerId);
      break;

    case "shoot":
      const shootResult = shootBullet(
        game.playersList,
        actionObj.selectedPlayerId,
        actionObj.gunnerId,
        game.messagesHistory,
        game.startTime,
        game.animationQueue
      );
      game.playersList = shootResult.playersList;
      game.messagesHistory = shootResult.messagesHistory;
      // Store the shoot message for animation (before werewolf reveal message)
      if (shootResult.shootMessage) {
        game.lastActionMessage = shootResult.shootMessage;
        game.roleActions.gunnerKills++;
      }
      break;

    case "uncoverRole":
      game.playersList = uncoverRole(
        actionObj.selectedPlayerId,
        actionObj.wolfSeerId,
        game.playersList
      );
      break;

    case "addVote":
      game.playersList = voteAgainst(
        actionObj.selectedPlayerId,
        game.playersList,
        actionObj.nbr,
        actionObj.playerId,
        actionObj.selectedPlayerName
      );
      break;

    case "addWolfVote":
      game.playersList = wolfVoteAgainst(
        actionObj.selectedPlayerId,
        game.playersList,
        actionObj.nbr,
        actionObj.playerId,
        actionObj.selectedPlayerName
      );
      break;

    case "pour":
      game.playersList = pourGasoline(
        game.playersList,
        actionObj
      );
      break;

    case "burn":
      game = burnThemDown(
        game,
        actionObj.pyroId
      );
      break;

    case "putNightmare":
      game.playersList = putNightmare(
        game.playersList,
        actionObj.selectedPlayerId,
        actionObj.playerId
      );
      break;

    default:
      break;
  }

  if (message) {
    game.messagesHistory.unshift({
      time: getCurrentTime(game.startTime),
      author: "",
      msg: message,
    });
  }

  return game;
};

// Helper function to pause game for animation
exports.pauseForAnimation = (game, io, roomId, duration = 6000, rooms) => {
  game.isPaused = true;
  this.setRooms(rooms, game, io, roomId);

  setTimeout(() => {
    // Find the game again in case rooms array changed
    let updatedGame = rooms.find((room) => room.id === roomId);
    if (updatedGame) {
      updatedGame.isPaused = false;
      this.setRooms(rooms, updatedGame, io, roomId);
    }
  }, duration);
};

exports.processAnimationQueue = (game, io, roomId, rooms) => {
  // ANIMATIONS DISABLED FOR NEW LAYOUT - just skip the queue
  if (!game.animationQueue || game.animationQueue.length === 0) return;

  // Clear the queue without playing animations
  game.animationQueue = [];
  this.setRooms(rooms, game, io, roomId);

  /* OLD ANIMATION CODE
  if (game.isPaused) return;
  if (!game.animationQueue || game.animationQueue.length === 0) return;

  const animation = game.animationQueue.shift();

  game.isPaused = true;
  this.setRooms(rooms, game, io, roomId);

  const animationMessage = animation.message || game.messagesHistory[0]?.msg || null;
  io.to(roomId).emit("triggerAnimationForAll", {
    name: animation.type,
    text: animationMessage
  });

  setTimeout(() => {
    const updatedGame = rooms.find((r) => r.id === roomId);
    if (!updatedGame) return;

    updatedGame.isPaused = false;
    this.setRooms(rooms, updatedGame, io, roomId);

    exports.processAnimationQueue(updatedGame, io, roomId, rooms);
  }, animation.duration);
  */
};