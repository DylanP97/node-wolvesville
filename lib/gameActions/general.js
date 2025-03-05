exports.killSelectedPlayer = (playerIdToKill, playersList) => {
  playersList = playersList.map((ply) => {
    if (ply.id === playerIdToKill) {
      return {
        ...ply,
        isAlive: false,
        isRevealed: ply.role.team === "Werewolves",
      };
    }
    return ply;
  });
  return playersList;
};
