const { reinitializeHeal } = require("./doctor");
const { getCurrentTime } = require("../utils");
const { killSelectedPlayer } = require("./general");
const { checkIfIsInLove } = require("./cupid");

exports.murder = (playersList, messagesHistory, action) => {
  const attackedPlayer = playersList.find(
    (ply) => ply.id == action.selectedPlayerId
  );
  const wasHealed = attackedPlayer.isHealed;
  if (wasHealed) reinitializeHeal(playersList, attackedPlayer);

  if (!wasHealed) {
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `💀🔪 ${attackedPlayer.name} {serverContent.action.message.killedBySK}`,
    });
    playersList = killSelectedPlayer(action.selectedPlayerId, playersList);
    const { playersListE2, messagesHistoryE2 } = checkIfIsInLove(
      attackedPlayer,
      playersList,
      messagesHistory
    );
    playersList = playersListE2;
    messagesHistory = messagesHistoryE2;
  } else {
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `DEV -- ${attackedPlayer.name} was healed by doctor from SK attack --`,
    });
  }

  const playersListEdit = playersList;
  const messagesHistoryEdit = messagesHistory;

  return { playersListEdit, messagesHistoryEdit };
};
