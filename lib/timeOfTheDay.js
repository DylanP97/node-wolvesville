const { linkLovers } = require("./gameActions/cupid");
const { arrestPlayer, releasePrisoners } = require("./gameActions/jailer");
const { murder } = require("./gameActions/sk");
const { handleWolvesVote, handleVote } = require("./gameActions/vote");
const { getCurrentTime } = require("./utils");

exports.toDayTime = (game) => {
  let playersList = game.playersList;
  let messagesHistory = game.messagesHistory;
  let winningTeam = game.winningTeam;

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
    msg: `{serverContent.game.daytime}${game.dayCount} `,
  });
  game.messagesHistory = messagesHistory;
  game.winningTeam = winningTeam;

  return game;
};

exports.toVoteTime = (game) => {
  game.messagesHistory.unshift({
    time: getCurrentTime(),
    author: "",
    msg: `{serverContent.game.votetime}${game.dayCount} `,
  });

  game.timeCounter = 28000;
  game.timeOfTheDay = "votetime";
  return game;
};

exports.toVoteTimeAftermath = (game) => {
  let newPlayersList = game.playersList;
  let newMessagesHistory = game.messagesHistory;
  let newWinningTeam = game.winningTeam;

  newMessagesHistory.unshift({
    time: getCurrentTime(),
    author: "",
    msg: `{serverContent.game.votetimeAftermath} ${game.dayCount} `,
  });

  const { playersList, messagesHistory, winningTeam } = handleVote(
    newPlayersList,
    newMessagesHistory,
    newWinningTeam
  );

  if (winningTeam !== null) game.winningTeam = winningTeam

  game.playersList = playersList;
  game.aliveList = playersList.filter((p) => p.isAlive);
  game.timeCounter = 5000;
  game.timeOfTheDay = "votetimeAftermath";
  game.messagesHistory = messagesHistory

  return game;
}

exports.toNightTime = (game) => {
  let newPlayersList = game.playersList;
  let newMessagesHistory = game.messagesHistory;
  let winningTeam = game.winningTeam;


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
        } ${game.dayCount} `,
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
  let playersList = game.playersList;
  let messagesHistory = game.messagesHistory;
  let winningTeam = game.winningTeam;
  let killedBySK = game.killedBySK || 0;

  messagesHistory.unshift({
    time: getCurrentTime(),
    author: "",
    msg: `{serverContent.game.nighttimeAftermath} ${game.dayCount} `,
  });

  game.registeredActions.forEach((action) => {
    if (action.type === "murder") {
      const { playersListEdit, messagesHistoryEdit, killedBySKEdit } = murder(
        playersList,
        messagesHistory,
        killedBySK,
        action
      );

      playersList = playersListEdit;
      messagesHistory = messagesHistoryEdit;
      killedBySK = killedBySKEdit;

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

  game.killedBySK = killedBySK;
  game.playersList = playersList;
  game.aliveList = playersList.filter((p) => p.isAlive);
  game.timeOfTheDay = "nighttimeAftermath";
  game.timeCounter = 5000;

  game.messagesHistory = messagesHistory;
  game.winningTeam = winningTeam;

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
