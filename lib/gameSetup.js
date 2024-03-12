


const { shuffle } = require("lodash");
const Player = require("./Player");

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
    player.avatar = usersInTheRoom[index].avatar;
    return player;
  })

  return playersList;
};

exports.initializeGameObject = (roomToJoin, playersList) => {

  return {
    ...roomToJoin,
    playersList: playersList,
    aliveList: playersList.filter((p) => p.isAlive),
    dayCount: 0,
    timeOfTheDay: "nighttime",
    timeCounter: 20000,
    registeredActions: [],
    winningTeam: null,
    messagesHistory: [],
    wolvesMessagesHistory: [],
    jailNightMessages: []
  }
}

// exports.assignRolesToPlayersRandomly = (excludedRoles = []) => {
//   const assignedRoles = new Set();

//   const randomRoles = initialPlayersList.map((player, index) => {
//     let randomCharacter;
//     do {
//       randomCharacter = roles[Math.floor(Math.random() * roles.length)];
//     } while (assignedRoles.has(randomCharacter.name) || excludedRoles.includes(randomCharacter.name));
//     assignedRoles.add(randomCharacter.name);
//     let randomName;
//     randomName = shortName();
//     return {
//       ...player,
//       name: randomName,
//       role: randomCharacter,
//     };
//   });

//   return randomRoles;
// };