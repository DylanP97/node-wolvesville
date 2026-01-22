exports.killSelectedPlayer = (playerIdToKill, playersList, causeOfDeath = null) => {
  playersList = playersList.map((ply) => {
    if (ply.id === playerIdToKill) {
      return {
        ...ply, // Preserve all properties including isInLove, loverPartnerId, originalTeam
        isAlive: false,
        isRevealed: ply.isRevealed ? true : ply.role.team === "Werewolves",
        causeOfDeath: causeOfDeath,
      };
    }
    return ply;
  });
  return playersList;
};
