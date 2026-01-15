const { getCurrentTime } = require("../lib/utils");

exports.processReviveAtDayStart = (playersList, messagesHistory, registeredActions, gameStartTime) => {
  // Process revive actions at the start of the day
  // The revive action was registered during the night
  // Now we actually revive the player and add the message
  
  registeredActions.forEach((action) => {
    if (action.type === "revive") {
      const deadPlayer = playersList.find((p) => p.id === action.selectedPlayerId);
      const medium = playersList.find((p) => p.id === action.playerId);
      
      if (deadPlayer && medium && !deadPlayer.isAlive) {
        // Check if grave was looted - can't revive looted graves
        if (deadPlayer.graveLooted) {
          messagesHistory.unshift({
            time: getCurrentTime(gameStartTime),
            author: "",
            msg: `{serverContent.action.message.reviveFailedGraveLooted}`,
          });
          return; // Skip this revive
        }

        // Revive the player - just set isAlive to true, all other data is preserved
        playersList = playersList.map((player) => {
          if (player.id === action.selectedPlayerId) {
            return {
              ...player,
              isAlive: true,
            };
          }
          // Update medium's ability (decrement nbrLeftToPerform)
          if (player.id === action.playerId) {
            return {
              ...player,
              role: {
                ...player.role,
                canPerform1: {
                  ...player.role.canPerform1,
                  nbrLeftToPerform: player.role.canPerform1.nbrLeftToPerform - 1,
                },
              },
            };
          }
          return player;
        });

        // Add revive message
        messagesHistory.unshift({
          time: getCurrentTime(gameStartTime),
          author: "",
          msg: `${deadPlayer.name}{serverContent.action.message.revivedAtDayStart}`,
        });
      }
    }
  });
  
  return { playersList, messagesHistory };
};

