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

exports.initializePlayersList = (
  nbrOfPlayers,
  selectedRoles,
  usersInTheRoom,
  nbrCPUPlayers,
  isQuickGame
) => {
  let playersList = [];

  for (let i = 0; i < nbrOfPlayers; i++) {
    new Player(i);
    playersList = [...playersList, new Player(i)];
  }

  let shuffledRoles = [];
  let userRole;

  // const chosenRole = null
  const chosenRole = "Wolf Seer" // this is here for DEV -- purposes

  if (isQuickGame) {
    if (chosenRole === null) {
      shuffledRoles = shuffle(selectedRoles);
    } else {
      userRole = selectedRoles.find((role) => role.name === chosenRole);
      if (userRole) {
        selectedRoles = selectedRoles.filter((role) => role.name !== chosenRole);
        shuffledRoles = shuffle(selectedRoles);
      } else {
        console.log(`Warning: Role "${chosenRole}" not found in selectedRoles`);
        shuffledRoles = shuffle(selectedRoles);
      }
    }
  } else {
    shuffledRoles = shuffle(selectedRoles);
  }

  playersList.map((player, index) => {
    if (shuffledRoles[index]) {
      player.role = shuffledRoles[index];
      return player;
    }
    return player;
  });

  let ommittedRoleIndex;

  if (isQuickGame && chosenRole !== null && userRole) {
    // Find a player that doesn't have a role assigned yet
    ommittedRoleIndex = playersList.findIndex((player) => !player.role || player.role === "");
    if (ommittedRoleIndex !== -1) {
      playersList[ommittedRoleIndex].role = userRole;
    } else {
      console.log(`Warning: Could not find a player to assign role "${chosenRole}"`);
    }
  }

  let indices = [...Array(nbrOfPlayers).keys()];
  if (isQuickGame && chosenRole !== null && ommittedRoleIndex !== -1) {
    // we remove the chosenRole indice
    indices = indices.filter((index) => index !== ommittedRoleIndex);
  }
  let shuffledIndices = shuffle(indices);

  for (let i = 0; i < nbrCPUPlayers; i++) {
    playersList[shuffledIndices[i]].isCPU = true;
  }

  let userIndex = 0;
  let CPUCount = 0;

  playersList.map((player, index) => {
    if (!player.isCPU && userIndex < usersInTheRoom.length) {
      player.name = usersInTheRoom[userIndex].username;
      player.avatar = usersInTheRoom[userIndex].avatar;
      player.isCPU = false;
      userIndex++;
    } else if (player.isCPU) {
      CPUCount++;
      player.name = `CPU ${CPUCount}`;
      player.avatar = generateRandomAvatar();
    }
    return player;
  });

  return playersList;
};

exports.initializeGameObject = (roomToJoin, playersList) => {
  roomToJoin.playersList = playersList;
  roomToJoin.aliveList = playersList.filter((p) => p.isAlive);
  roomToJoin.dayCount = 0;
  roomToJoin.timeOfTheDay = "nighttime";
  roomToJoin.timeCounter = 20000;
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
