const { shuffle } = require("lodash");
const Player = require("./Player");
const { getCurrentTime } = require("./utils");
const { revealPlayer } = require("./gameActions/seer");
const { executePrisoner } = require("./gameActions/jailer");
const { heal } = require("./gameActions/doctor");
const { shootBullet } = require("./gameActions/gunner");
const { assertDuty } = require("./gameActions/mayor");
const { useProtectPotion, usePoisonPotion } = require("./gameActions/witch");
const { voteAgainst, wolfVoteAgainst } = require("./gameActions/vote");
const { uncoverRole } = require("./gameActions/wolfSeer");
const { generateRandomAvatar } = require("./generateRandomAvatar");
const { lootGrave } = require("./gameActions/graveRobber");

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
  const cpuCandidates = playersList.filter(p => p.isCPU); // only players already CPU
  let shuffledCpu = shuffle(cpuCandidates).slice(0, nbrCPUPlayers);
  playersList.forEach(p => (p.isCPU = false)); // reset all
  shuffledCpu.forEach(p => (p.isCPU = true));   // mark only selected CPU players

  return playersList;
};



exports.initializeGameObject = (roomToJoin, playersList) => {
  roomToJoin.playersList = playersList;
  roomToJoin.aliveList = playersList.filter((p) => p.isAlive);
  roomToJoin.dayCount = 0;
  roomToJoin.timeOfTheDay = "nighttime";
  roomToJoin.timeCounter = 25000;
  roomToJoin.registeredActions = [];
  roomToJoin.winningTeam = null;
  roomToJoin.messagesHistory = [];
  roomToJoin.wolvesMessagesHistory = [];
  roomToJoin.jailNightMessages = [];
  roomToJoin.isPaused = false;
  roomToJoin.hasEnded = false;
  roomToJoin.isLaunched = true;

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
  switch (type) {
    case "protectPotion":
      game.playersList = useProtectPotion(
        game.playersList,
        actionObj.selectedPlayerId,
        actionObj.playerId
      );
      break;

    case "poisonPotion":
      game.playersList = usePoisonPotion(
        game.playersList,
        actionObj.selectedPlayerId,
        actionObj.playerId
      );
      break;

    case "chooseJuniorWolfDeathRevenge":
      game.playersList = chooseJuniorWolfDeathRevenge(
        game.playersList,
        actionObj.juniorWolfId,
        actionObj.selectedPlayerId
      );
      break;

    case "assertDuty":
      game.playersList = assertDuty(game.playersList);
      break;

    case "reveal":
      game.playersList = revealPlayer(
        actionObj.selectedPlayerId,
        actionObj.seerId,
        game.playersList
      );
      break;

    case "loot":
      game.playersList = lootGrave(
        game.playersList,
        actionObj.graveRobberId,
        actionObj.selectedPlayerId,
        actionObj.selectedPlayerRole
      );
      break;

    case "execute":
      game.playersList = executePrisoner(game.playersList);
      break;

    case "heal":
      game.playersList = heal(actionObj.selectedPlayerId, game.playersList);
      break;

    case "shoot":
      game.playersList = shootBullet(
        game.playersList,
        actionObj.selectedPlayerId,
        actionObj.gunnerId
      );
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
        actionObj.nbr
      );
      break;

    case "addWolfVote":
      game.playersList = wolfVoteAgainst(
        actionObj.selectedPlayerId,
        game.playersList,
        actionObj.nbr
      );
      break;

    default:
      break;
  }

  if (message) {
    game.messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: message,
    });
  }

  return game;
};
