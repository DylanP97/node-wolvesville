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

exports.checkIfIsInLove = (deadPlayer, playersList, messagesHistory) => {
  if (deadPlayer.isInLove && deadPlayer.loverPartnerId) {
    const partner = playersList.find((ply) => ply.id === deadPlayer.loverPartnerId);
    
    if (partner && partner.isAlive) {
      playersList = killSelectedPlayer(partner.id, playersList);
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `💀💔 ${partner.name} {serverContent.action.message.dieWithLover} ${deadPlayer.name}!`,
      });
      // Reveal if the partner (who died from love) was a werewolf (only if not already revealed)
      if (partner.role.team === "Werewolves" && !partner.isRevealed) {
        messagesHistory.unshift({
          time: getCurrentTime(),
          author: "",
          msg: `{serverContent.action.message.werewolfReveal}${partner.name}{serverContent.action.message.wasWerewolf}`,
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
