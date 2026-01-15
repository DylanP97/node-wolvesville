const lootGrave = (playersList, graveRobberId, deadPlayerId, deadPlayerRole) => {
  const graveRobberIndex = playersList.findIndex((p) => p.id === graveRobberId);
  const deadPlayerIndex = playersList.findIndex((p) => p.id === deadPlayerId);

  if (graveRobberIndex !== -1) {
    // Give the Grave Robber the dead player's role
    playersList[graveRobberIndex].role = {
      ...deadPlayerRole,
      wasGraveRobber: true
    };
    // Mark that they've used their loot ability
    if (playersList[graveRobberIndex].role.canPerform1) {
      playersList[graveRobberIndex].role.canPerform1.nbrLeftToPerform = 0;
    }
  }

  // Mark the dead player's grave as looted (prevents Medium from reviving)
  if (deadPlayerIndex !== -1) {
    playersList[deadPlayerIndex].graveLooted = true;
  }

  return playersList;
};

module.exports = { lootGrave };