const { getCurrentTime } = require("../lib/utils");
const { killSelectedPlayer } = require("./general");

exports.linkLovers = (playersList, action) => {
  return playersList.map((ply) => {
    if (ply.id === action.lover1Id) {
      return {
        ...ply,
        isInLove: true,
        loverPartnerId: action.lover2Id,
      };
    }
    if (ply.id === action.lover2Id) {
      return {
        ...ply,
        isInLove: true,
        loverPartnerId: action.lover1Id,
      };
    }
    if (ply.id === action.cupidId) {
      return {
        ...ply,
        role: {
          ...ply.role,
          canPerform1: {
            ...ply.role.canPerform1,
            nbrLeftToPerform: 0,
          },
        },
        linkedLovers: [action.lover1Id, action.lover2Id], // Track who Cupid linked
      };
    }
    return ply;
  });
};

exports.checkIfIsInLove = (deadPlayer, playersList, messagesHistory, gameStartTime, animationQueue = null) => {
  if (deadPlayer.isInLove && deadPlayer.loverPartnerId) {
    const partner = playersList.find((ply) => ply.id === deadPlayer.loverPartnerId);
    
    if (partner && partner.isAlive) {
      playersList = killSelectedPlayer(partner.id, playersList);
      const loverSuicideMessage = `💀💔 ${partner.name} {serverContent.action.message.dieWithLover} ${deadPlayer.name}!`;
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: loverSuicideMessage,
      });
      // Reveal if the partner (who died from love) was a werewolf (only if not already revealed)
      if (partner.role.team === "Werewolves" && !partner.isRevealed) {
        messagesHistory.unshift({
          time: getCurrentTime(gameStartTime),
          author: "",
          msg: `{serverContent.action.message.werewolfReveal}${partner.name}{serverContent.action.message.wasWerewolf}`,
        });
      }
      // Queue lover suicide animation
      // Store the message directly to avoid getting the werewolf reveal message instead
      if (animationQueue) {
        animationQueue.push({
          type: "loverSuicide",
          duration: 4000,
          message: loverSuicideMessage,
        });
      }
    }
  }

  return { playersList, messagesHistory };
};

exports.findLovers = (playersList) => {
  const lovers = playersList.filter((ply) => ply.isInLove);
  return lovers;
};

exports.findCupid = (playersList) => {
  return playersList.find((ply) => ply.role.name === "Cupid");
};
