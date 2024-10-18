const { revengeJuniorWolf } = require("./juniorWolf");

exports.killSelectedPlayer = (playerIdToKill, playersList) => {
  console.log("killSelectedPlayer fn");
  console.log("playerIdToKill ", playerIdToKill);

  return playersList.map((ply) => {
    if (ply.id === playerIdToKill) {
      if (ply.name === "Junior Werewolf") {
        revengeJuniorWolf(playersList);
      }
      return {
        ...ply,
        isAlive: false,
        isRevealed: ply.role.team === "Werewolves",
      };
    }
    return ply;
  });
};
