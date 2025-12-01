const { reinitializeHeal } = require("./doctor");
const { getCurrentTime } = require("../utils");
const { killSelectedPlayer } = require("./general");
const { checkIfIsInLove } = require("./cupid");
const { reinitializeProtection } = require("./witch");

exports.murder = (playersList, messagesHistory, killedBySK, action) => {
  const attackedPlayer = playersList.find(
    (ply) => ply.id == action.selectedPlayerId
  );

  const wasProtected = attackedPlayer.isProtected;
  const wasHealed = attackedPlayer.isHealed;

  if (wasProtected) {
    playersList = reinitializeProtection(playersList, attackedPlayer);
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `DEV -- ${attackedPlayer.name} was protected by witch from SK attack --`,
    });
  } else if (wasHealed) {
    playersList = reinitializeHeal(playersList, attackedPlayer);
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `DEV -- ${attackedPlayer.name} was healed by doctor from SK attack --`,
    });
  } else {
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `💀🔪 ${attackedPlayer.name} {serverContent.action.message.killedBySK}`,
    });
    playersList = killSelectedPlayer(action.selectedPlayerId, playersList);
    killedBySK += 1;
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `{serverContent.action.message.numberOfSKKills} ${killedBySK}`,
    });
    const { playersListE2, messagesHistoryE2 } = checkIfIsInLove(
      attackedPlayer,
      playersList,
      messagesHistory
    );
    playersList = playersListE2;
    messagesHistory = messagesHistoryE2;
  }

  const playersListEdit = playersList;
  const messagesHistoryEdit = messagesHistory;
  const killedBySKEdit = killedBySK;

  return { playersListEdit, messagesHistoryEdit, killedBySKEdit };
};
