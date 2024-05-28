const { linkLovers } = require("./gameActions/cupid");
const { arrestPlayer, releasePrisoners } = require("./gameActions/jailer");
const { murder } = require("./gameActions/sk");
const { handleWolvesVote, handleVote } = require("./gameActions/vote");
const { getCurrentTime } = require("./utils");

exports.toDayTime = (game) => {
  let playersList = game.playersList;
  let messagesHistory = game.messagesHistory;
  let winningTeam = game.winningTeam;

  game.registeredActions.forEach((action) => {
    if (action.type === "murder") {
      const { playersListEdit, messagesHistoryEdit } = murder(
        playersList,
        messagesHistory,
        action
      );

      playersList = playersListEdit;
      messagesHistory = messagesHistoryEdit;

      game.aliveList = playersList.filter((p) => p.isAlive);
      game.registeredActions = [
        ...game.registeredActions.filter((a) => a !== action),
      ];
    } else if (action.type === "link") {
      playersList = linkLovers(playersList, action);
      game.registeredActions = [
        ...game.registeredActions.filter((a) => a !== action),
      ];
    }
  });

  if (game.aliveList.length > 1) {
    const { playersListEdit, messagesHistoryEdit } = handleWolvesVote(
      playersList,
      messagesHistory
    );

    playersList = playersListEdit;
    messagesHistory = messagesHistoryEdit;
  }

  playersList = releasePrisoners(playersList);

  game.playersList = playersList;
  game.aliveList = playersList.filter((p) => p.isAlive);
  game.timeOfTheDay = "daytime";
  game.timeCounter = 30000;
  game.dayCount += 1;
  messagesHistory.unshift({
    time: getCurrentTime(),
    author: "",
    msg: `DAYTIME N°${game.dayCount} ☀️ ------------`,
  });
  game.jailNightMessages = [];
  game.messagesHistory = messagesHistory;
  game.winningTeam = winningTeam;

  return game;
};

exports.toVoteTime = (game) => {
  game.registeredActions.forEach((action) => {
    if (action.type === "arrest") {
      game.playersList = arrestPlayer(game.playersList, action);
      game.messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `${action.selectedPlayerName} was arrested by the jailer`,
      });
      game.registeredActions = [
        ...game.registeredActions.filter((a) => a !== action),
      ];
    }
  });

  game.messagesHistory.unshift({
    time: getCurrentTime(),
    author: "",
    msg: `VOTETIME N°${game.dayCount} ✉️ ------------`,
  });

  game.timeCounter = 20000;
  game.timeOfTheDay = "votetime";
  return game;
};

exports.toNightTime = (game) => {
  let newPlayersList = game.playersList;
  let newMessagesHistory = game.messagesHistory;
  let newWinningTeam = game.winningTeam;

  const { playersList, messagesHistory, winningTeam } = handleVote(
    newPlayersList,
    newMessagesHistory,
    newWinningTeam
  );

  newPlayersList = playersList;
  newMessagesHistory = messagesHistory;
  newWinningTeam = winningTeam;

  newMessagesHistory.unshift({
    time: getCurrentTime(),
    author: "",
    msg: `${game.dayCount === 0 ? "COMMENCEMENT NIGHT" : "NIGHTTIME N°"} ${
      game.dayCount
    } 🌒 ------------`,
  });

  game.timeCounter = 30000;
  game.timeOfTheDay = "nighttime";
  game.playersList = newPlayersList;
  game.aliveList = newPlayersList.filter((p) => p.isAlive);
  game.messagesHistory = newMessagesHistory;

  return game;
};
