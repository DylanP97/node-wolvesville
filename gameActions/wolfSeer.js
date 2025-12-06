const { getCurrentTime } = require("../lib/utils");

exports.uncoverRole = (selectedPlayerId, wolfSeerId, playersList) => {
  const wolfSeer = playersList.find(player => player.id === wolfSeerId);
  const selectedPlayer = playersList.find(player => player.id === selectedPlayerId);
  
  // Check if wolf seer has uses left
  if (wolfSeer.role.canPerform1.nbrLeftToPerform <= 0) {
    return playersList; // No action taken
  }
  
  playersList = playersList.map((player) => {
    if (player.id === wolfSeerId) {
      return {
        ...player,
        role: {
          ...player.role,
          canPerform1: {
            ...player.role.canPerform1,
            nbrLeftToPerform: player.role.canPerform1.nbrLeftToPerform - 1,
          },
        },
        // Store the uncovered role information for the wolf seer
        uncoveredRole: {
          playerId: selectedPlayerId,
          playerName: selectedPlayer.name,
          role: selectedPlayer.role.name,
          team: selectedPlayer.role.team
        }
      };
    }
    // Mark the selected player as revealed by wolf seer
    if (player.id === selectedPlayerId) {
      return {
        ...player,
        isRevealedByWolfSeer: true
      };
    }
    // Add to wolves' knowledge
    if (player.role.team === "Werewolves" && player.isAlive) {
      return {
        ...player,
        // Add the uncovered player to the wolves' knowledge
        wolvesKnowledge: [
          ...(player.wolvesKnowledge || []),
          {
            playerId: selectedPlayerId,
            playerName: selectedPlayer.name,
            role: selectedPlayer.role.name,
            team: selectedPlayer.role.team,
            uncoveredBy: wolfSeerId
          }
        ]
      };
    }
    return player;
  });
  
  return playersList;
};