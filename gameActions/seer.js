const { getCurrentTime } = require("../lib/utils");


exports.revealPlayer = (selectedPlayerId, seerId, game) => {
  game.playersList = game.playersList.map((player) => {
    if (player.id === selectedPlayerId) {
      if (player.role.name === "Mayor") {
        game.messagesHistory.unshift({
          time: getCurrentTime(game.startTime),
          author: "",
          msg: `{serverContent.action.message.mayorReveal} ${player.name}`
        });
        return {
          ...player,
          isRevealed: true,
          role: {
            ...player.role,
            canPerform1: {
              ...player.role.canPerform1,
              nbrLeftToPerform: 0,
            },
          },
        };
      }
      return {
        ...player,
        isRevealed: true,
      };
    }
    return player;
  });


  return game

};

