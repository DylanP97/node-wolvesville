const { linkLovers } = require("../gameActions/cupid");
const { arrestPlayer, releasePrisoners } = require("../gameActions/jailer");
const { murder } = require("../gameActions/sk");
const { handleWolvesVote, handleVote } = require("../gameActions/vote");
const { clearNightmares } = require("../gameActions/nightmare");
const { getCurrentTime } = require("../lib/utils");
const { reinitializeHeal } = require("../gameActions/doctor");
const { reinitializeProtection } = require("../gameActions/witch");
const { processReviveAtDayStart } = require("../gameActions/medium");
const { clearVisitState } = require("../gameActions/ghostLady");

exports.toDayTime = (game) => {
  let playersList = game.playersList;
  let messagesHistory = game.messagesHistory;
  let winningTeam = game.winningTeam;

  // Release prisoners of last night
  playersList = releasePrisoners(playersList);
  // Clear nightmares from all players after night ends
  playersList = clearNightmares(playersList);
  game.jailNightMessages = [];
  
  // Process revive actions (revive players at day start)
  const reviveResult = processReviveAtDayStart(playersList, messagesHistory, game.registeredActions, game.startTime);
  playersList = reviveResult.playersList;
  messagesHistory = reviveResult.messagesHistory;
  // Remove processed revive actions
  game.registeredActions = game.registeredActions.filter((a) => a.type !== "revive");

  game.playersList = playersList;
  game.aliveList = playersList.filter((p) => p.isAlive);
  game.timeOfTheDay = "daytime";
  game.timeCounter = 30000;
  game.dayCount += 1;
  messagesHistory.unshift({
    time: getCurrentTime(game.startTime),
    author: "",
    msg: `{serverContent.game.daytime} `,
  });
  game.messagesHistory = messagesHistory;
  game.winningTeam = winningTeam;

  return game;
};

exports.toVoteTime = (game) => {
  game.messagesHistory.unshift({
    time: getCurrentTime(game.startTime),
    author: "",
    msg: `{serverContent.game.votetime} `,
  });

  game.timeCounter = 28000;
  game.timeOfTheDay = "votetime";
  return game;
};

exports.toVoteTimeAftermath = (game) => {
  let newPlayersList = game.playersList;
  let newMessagesHistory = game.messagesHistory;
  let newWinningTeam = game.winningTeam;

  // Initialize animation queue if it doesn't exist
  if (!game.animationQueue) {
    game.animationQueue = [];
  }

  newMessagesHistory.unshift({
    time: getCurrentTime(game.startTime),
    author: "",
    msg: `{serverContent.game.votetimeAftermath}${game.dayCount} `,
  });

  const { playersList, messagesHistory, winningTeam } = handleVote(
    newPlayersList,
    newMessagesHistory,
    newWinningTeam,
    game.startTime,
    game.animationQueue
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
            time: getCurrentTime(game.startTime),
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
      time: getCurrentTime(game.startTime),
      author: "",
      msg: `${game.dayCount === 0
        ? "{serverContent.game.commencementnight}"
        : "{serverContent.game.nighttime}"
        }`,
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

  // ✅ animation queue (important)
  game.animationQueue = game.animationQueue || [];

  messagesHistory.unshift({
    time: getCurrentTime(game.startTime),
    author: "",
    msg: `{serverContent.game.nighttimeAftermath}${game.dayCount} `,
  });

  game.registeredActions.forEach((action) => {
    if (action.type === "murder") {
      const {
        playersListEdit,
        messagesHistoryEdit,
        killedBySKEdit,
        shouldTriggerAnimation,
      } = murder(playersList, messagesHistory, killedBySK, action, game.startTime, game.animationQueue);

      playersList = playersListEdit;
      messagesHistory = messagesHistoryEdit;
      killedBySK = killedBySKEdit;
      // Note: serialKilling animation is now queued inside murder function
      // before loverSuicide animation to ensure correct order

      game.aliveList = playersList.filter((p) => p.isAlive);
      game.registeredActions = game.registeredActions.filter(
        (a) => a !== action
      );
    }

    if (action.type === "link") {
      playersList = linkLovers(playersList, action);
      game.registeredActions = game.registeredActions.filter(
        (a) => a !== action
      );
    }
  });

  if (game.aliveList.length > 1) {
    const {
      playersListEdit,
      messagesHistoryEdit,
      shouldTriggerWolvesAnimation,
    } = handleWolvesVote(playersList, messagesHistory, game.startTime, game.animationQueue);

    playersList = playersListEdit;
    messagesHistory = messagesHistoryEdit;
    // Note: wolvesAte animation is now queued inside handleWolvesVote
    // before loverSuicide animation to ensure correct order
  }

  // reset night effects
  game.playersList = reinitializeHeal(playersList);
  game.playersList = reinitializeProtection(game.playersList);
  game.playersList = clearVisitState(game.playersList);

  game.killedBySK = killedBySK;
  game.aliveList = game.playersList.filter((p) => p.isAlive);
  game.timeOfTheDay = "nighttimeAftermath";
  game.timeCounter = 5000;

  game.messagesHistory = messagesHistory;
  game.winningTeam = winningTeam;

  return game;
};


exports.assignRandomSecondToEachCPU = (playersList) => {
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
