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

  // Release prisoners of last night
  playersList = releasePrisoners(playersList);
  game.jailNightMessages = [];

  game.playersList = playersList;
  game.aliveList = playersList.filter((p) => p.isAlive);
  game.timeOfTheDay = "daytime";
  game.timeCounter = 30000;
  game.dayCount += 1;
  messagesHistory.unshift({
    time: getCurrentTime(),
    author: "",
    msg: `{serverContent.game.daytime}${game.dayCount} ------------------------------`,
  });
  game.messagesHistory = messagesHistory;
  game.winningTeam = winningTeam;

  return game;
};

exports.toVoteTime = (game) => {
  game.messagesHistory.unshift({
    time: getCurrentTime(),
    author: "",
    msg: `{serverContent.game.votetime}${game.dayCount} ------------------------------`,
  });

  game.timeCounter = 20000;
  game.timeOfTheDay = "votetime";
  return game;
};

exports.toVoteTimeAftermath = (game) => {
  game.timeCounter = 5000;
  game.timeOfTheDay = "votetimeAftermath";

  return game;
}

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

  if (winningTeam === null) {
    game.registeredActions.forEach((action) => {
      if (action.type === "arrest") {
        jailer = newPlayersList.find((p) => p.id === action.playerId);
        prisoner = newPlayersList.find((p) => p.id === action.selectedPlayerId);
        if (jailer.isAlive && prisoner.isAlive) {
          newPlayersList = arrestPlayer(newPlayersList, action);
          newMessagesHistory.unshift({
            time: getCurrentTime(),
            author: "",
            msg: `👮‍♂️ ${action.selectedPlayerName} {serverContent.action.message.arrestPlayer}`,
          });
        }
        game.registeredActions = [
          ...game.registeredActions.filter((a) => a !== action),
        ];
      }
    });
    newMessagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `${game.dayCount === 0
        ? "{serverContent.game.commencementnight}"
        : "{serverContent.game.nighttime}"
        } ${game.dayCount} ------------------------------`,
    });

    game.timeCounter = 30000;
    game.timeOfTheDay = "nighttime";
  } else {
    game.winningTeam = winningTeam;
  }

  game.playersList = newPlayersList;
  game.aliveList = newPlayersList.filter((p) => p.isAlive);
  game.messagesHistory = newMessagesHistory;

  return game;
};

exports.toNightTimeAftermath = (game) => {
  game.timeCounter = 5000;
  game.timeOfTheDay = "nighttimeAftermath";

  return game;
}

exports.assignCpuRandomSecondToEachCPU = (playersList) => {
  playersList = playersList.map((ply) => {
    if (ply.isCPU) {
      const randomDelay = Math.floor(Math.random() * 20 + 1) * 1000;
      return {
        ...ply,
        randomSecond: randomDelay,
      };
    }
    return ply;
  });
  return playersList;
};
