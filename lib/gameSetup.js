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
  if (isQuickGame) {
    const chosenRole = "Serial Killer";
    userRole = selectedRoles.find((role) => role.name === chosenRole);
    selectedRoles = selectedRoles.filter((role) => role.name !== chosenRole);
    shuffledRoles = shuffle(selectedRoles);
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

  let ommittedRoleIndice;

  if (isQuickGame) {
    ommittedRoleIndice = playersList.findIndex((player) => player.role === "");
    playersList[ommittedRoleIndice].role = userRole;
  }

  let indices = [...Array(nbrOfPlayers).keys()];
  if (isQuickGame) {
    // we remove from the indices we want for the CPUs the one of the user
    indices = indices.filter((index) => index !== ommittedRoleIndice);
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
      player.avatar = undefined;
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
