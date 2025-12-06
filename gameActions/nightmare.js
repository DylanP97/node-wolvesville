/**
 * Nightmare Werewolf action handler
 * Puts a player to sleep for the next night, preventing them from using abilities
 */

exports.putNightmare = (playersList, selectedPlayerId, nightmareWerewolfId) => {
  const nightmareWerewolf = playersList.find((p) => p.id === nightmareWerewolfId);
  
  if (!nightmareWerewolf || nightmareWerewolf.role.canPerform1.nbrLeftToPerform <= 0) {
    return playersList;
  }

  playersList = playersList.map((player) => {
    // Set the target player to have nightmares
    if (player.id === selectedPlayerId) {
      return {
        ...player,
        willHaveNightmares: true,
      };
    }
    // Decrease the nightmare werewolf's remaining uses
    if (player.id === nightmareWerewolfId) {
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

  return playersList;
};

/**
 * Clear nightmares from all players (called after night ends)
 */
exports.clearNightmares = (playersList) => {
  return playersList.map((player) => ({
    ...player,
    willHaveNightmares: false,
  }));
};

