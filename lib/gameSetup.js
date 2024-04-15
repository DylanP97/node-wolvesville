


const { shuffle } = require("lodash");
const Player = require("./Player");
const { getCurrentTime } = require("./utils");
const { revealPlayer } = require("./gameActions/seer");
const { killPrisoner } = require("./gameActions/jailer");
const { heal } = require("./gameActions/doctor");
const { shootBullet } = require("./gameActions/gunner");

exports.initializePlayersList = (nbrOfPlayers, selectedRoles, usersInTheRoom) => {
  let playersList = [];

  for (let i = 0; i < nbrOfPlayers; i++) {
    new Player(i);
    playersList = [...playersList, new Player(i)];
  }
  const shuffledRoles = shuffle(selectedRoles);

  playersList.map((player, index) => {
    player.role = shuffledRoles[index];
    player.name = usersInTheRoom[index].username;
    player.avatar = usersInTheRoom[index].avatar;
    return player;
  })

  return playersList;
};

exports.initializeGameObject = (roomToJoin, playersList) => {

  return {
    ...roomToJoin,
    playersList: playersList,
    aliveList: playersList.filter((p) => p.isAlive),
    dayCount: 0,
    timeOfTheDay: "nighttime",
    timeCounter: 20000,
    registeredActions: [],
    winningTeam: null,
    messagesHistory: [],
    wolvesMessagesHistory: [],
    jailNightMessages: []
  }
}

exports.setGames = (games, game, io, roomId) => {

  const newGames = games.filter((r) => r.id != roomId)
  games = newGames;
  games.push(game);
  io.to(roomId).emit("updateGame", game);

  return games
}

exports.editGame = (
  game,
  func,
  action,
  message
) => {


  switch (func) {
    case "reveal":
      game.playersList = revealPlayer(
        action.selectedPlayerId,
        action.seerId,
        game.playersList
      );
      break;

    case "execute":
      game.playersList = killPrisoner(
        game.playersList
      );
      break;

    case "heal":
      game.playersList = heal(
        action.selectedPlayerId,
        game.playersList
      );
      break;

    case "shoot":
      game.playersList = shootBullet(
        game.playersList,
        action.selectedPlayerId,
        action.gunnerId
      );
      break;

    default:
      break;
  }


  if (message) {
    game.messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: message
    })
  }

  return game
}
