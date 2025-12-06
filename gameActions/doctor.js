
exports.heal = (selectedPlayerId, playersList, doctorId) => {
  const doctor = playersList.find((p) => p.id === doctorId);
  // Check if doctor has nightmares - they can't use their ability
  if (doctor && doctor.willHaveNightmares) {
    // console.log("doctor can't do action because of nightmares")
    return playersList;
  }

  playersList = playersList.map((player) => {
    if (player.id === selectedPlayerId) {
      return {
        ...player,
        isHealed: true,
      };
    }
    return player;
  });
  return playersList;
};

// reinitialize heal status at the end of the night even if it was not used
exports.reinitializeHeal = (playersList) => {
  playersList = playersList.map((player) => {
    if (player.isHealed) {
      return {
        ...player,
        isHealed: false,
      };
    }
    return player;
  });
  return playersList;
};
