const { shuffle } = require("lodash");
const Player = require("./lib/Player");

exports.initializePlayersList = (nbrOfPlayers, selectedRoles, usersInTheRoom) => {
  let playersList = [];
  
  for (let i = 0; i < nbrOfPlayers; i++) {
    new Player(i);
    playersList = [...playersList, new Player(i)];
  }
  const shuffledRoles = shuffle(selectedRoles);
  
  playersList.map((player, index) => {
    player.role = shuffledRoles[index];
    player.name = usersInTheRoom[index].username;
    return player;
  })

  return playersList;
};
