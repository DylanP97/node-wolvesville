const lootGrave = (playersList, graveRobberId, deadPlayerId, deadPlayerRole) => {
  const graveRobberIndex = playersList.findIndex((p) => p.id === graveRobberId);
  
  if (graveRobberIndex !== -1) {
    // Give the Grave Robber the dead player's role
    playersList[graveRobberIndex].role = deadPlayerRole;
    
    // Mark that they've used their loot ability
    if (playersList[graveRobberIndex].role.canPerform1) {
      playersList[graveRobberIndex].role.canPerform1.nbrLeftToPerform = 0;
    }
  }
  
  return playersList;
};

module.exports = { lootGrave };