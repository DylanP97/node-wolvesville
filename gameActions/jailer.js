/* action by the jailer role */
const { checkIfIsInLove } = require("./cupid");
const { getCurrentTime } = require("../lib/utils");

exports.arrestPlayer = (playersList, action) => {
  playersList = playersList.map((ply) => {
    if (ply.id === action.selectedPlayerId) {
      return {
        ...ply,
        isUnderArrest: true,
      };
    } else if (ply.role.name === "Jailer") {
      return {
        ...ply,
        hasHandcuffed: action.selectedPlayerId,
      };
    } else {
      return ply;
    }
  });
  return playersList;
};

exports.executePrisoner = (playersList, messagesHistory = [], gameStartTime, animationQueue = null) => {
  let executedPlayer = null;
  
  // Get the player before they're executed to check isInLove
  executedPlayer = playersList.find((ply) => ply.isUnderArrest);
  
  playersList = playersList.map((ply) => {
    if (ply.isUnderArrest) {
      return {
        ...ply,
        isUnderArrest: false,
        isAlive: false,
        isRevealed: ply.isRevealed ? true : ply.role.team === "Werewolves",
        causeOfDeath: "execution",
      };
    } else if (ply.role.name === "Jailer") {
      return {
        ...ply,
        hasHandcuffed: null,
        role: {
          ...ply.role,
          canPerform2: {
            ...ply.role.canPerform2,
            nbrLeftToPerform: 0,
          },
        },
      };
    } else {
      return ply;
    }
  });
  
  // Check if the executed player was in love and kill their partner
  if (executedPlayer) {
    // Add execution message first
    messagesHistory.unshift({
      time: getCurrentTime(gameStartTime),
      author: "",
      msg: `{serverContent.action.message.executePrisoner} ${executedPlayer.name}!`,
    });
    // Reveal if the executed player was a werewolf (only if not already revealed)
    if (executedPlayer.role.team === "Werewolves" && !executedPlayer.isRevealed) {
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `{serverContent.action.message.werewolfReveal}${executedPlayer.name}{serverContent.action.message.wasWerewolf}`,
      });
    }
    const result = checkIfIsInLove(executedPlayer, playersList, messagesHistory, gameStartTime, animationQueue);
    playersList = result.playersList;
    messagesHistory = result.messagesHistory;
  }
  
  return { playersList, messagesHistory };
};

exports.releasePrisoners = (playersList) => {
  playersList = playersList.map((ply) => {
    if (ply.isUnderArrest) {
      return {
        ...ply,
        isUnderArrest: false,
      };
    } else if (ply.role.name === "Jailer") {
      return {
        ...ply,
        hasHandcuffed: null,
      };
    } else {
      return ply;
    }
  });
  return playersList;
};
