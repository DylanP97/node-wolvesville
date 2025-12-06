const { getCurrentTime } = require("../lib/utils");
const { killSelectedPlayer } = require("./general");
const { checkIfIsInLove } = require("./cupid");

exports.murder = (playersList, messagesHistory, killedBySK, action) => {
  const attackedPlayer = playersList.find(
    (ply) => ply.id == action.selectedPlayerId
  );

  const wasProtected = attackedPlayer.isProtected;
  const wasHealed = attackedPlayer.isHealed;
  const isWolf = attackedPlayer.role.team === "Werewolves";
  const totalWolves = playersList.filter((ply) => ply.role.team === "Werewolves").length;

  if (isWolf && totalWolves > 2) {
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `DEV -- SK cannot kill a wolf when too many ${attackedPlayer.name} `,
    })
  } else if (wasProtected) {
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `{serverContent.action.message.wasProtected}`,
    });
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `DEV -- ${attackedPlayer.name} was protected by witch from SK attack`,
    });
  } else if (wasHealed) {
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `{serverContent.action.message.wasHealed}`,
    });
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `DEV -- ${attackedPlayer.name} was healed by doctor from SK attack`,
    });
  } else {
    let additionalMsg = `{serverContent.action.message.numberOfSKKills} ${killedBySK}`;
    killedBySK += 1;
    playersList = killSelectedPlayer(action.selectedPlayerId, playersList);
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `💀🔪 ${attackedPlayer.name} {serverContent.action.message.killedBySK} ${killedBySK > 2 ? additionalMsg : ""} `,
    });
    // Check if the dead player was in love and kill their partner
    // Use the player object before death to check isInLove property
    const result = checkIfIsInLove(attackedPlayer, playersList, messagesHistory);
    playersList = result.playersList;
    messagesHistory = result.messagesHistory;
  }

  const playersListEdit = playersList;
  const messagesHistoryEdit = messagesHistory;
  const killedBySKEdit = killedBySK;

  return { playersListEdit, messagesHistoryEdit, killedBySKEdit };
};
