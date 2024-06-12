const { checkIfWasHealed } = require("./doctor");
const { getCurrentTime } = require("../utils");
const { killSelectedPlayer } = require("./general");
const { checkIfIsInLove } = require("./cupid");

exports.murder = (playersList, messagesHistory, action) => {
  const attackedPlayer = playersList.find(
    (ply) => ply.id == action.selectedPlayerId
  );
  const wasHealed = attackedPlayer.isHealed;
  checkIfWasHealed(attackedPlayer, playersList, messagesHistory);

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
  }

  const playersListEdit = playersList;
  const messagesHistoryEdit = messagesHistory;

  return { playersListEdit, messagesHistoryEdit };
};
