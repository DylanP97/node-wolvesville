const { shortName } = require("./randomUsername");
const { teams } = require("./teams");
const { findLovers, findCupid } = require("../gameActions/cupid");

exports.checkForWinner = (aliveList, allPlayersList) => {
  // Safety check: if no one is alive, no winner
  if (!aliveList || aliveList.length === 0) {
    return null;
  }
  
  // First check: Are the last 2 alive players lovers?
  if (aliveList.length === 2) {
    const lover1 = aliveList[0];
    const lover2 = aliveList[1];
    
    if (lover1.isInLove && lover2.isInLove && 
        lover1.loverPartnerId === lover2.id && 
        lover2.loverPartnerId === lover1.id) {
      // Lovers win!
      const winningTeam = teams.find((team) => team.name === "Lovers");
      const winnerPlayers = [lover1, lover2];
      
      // Add Cupid to winners (even if dead)
      const cupid = findCupid(allPlayersList);
      if (cupid) {
        winnerPlayers.push(cupid);
      }
      
      return {
        name: winningTeam.name,
        image: winningTeam.image,
        winnerPlayers: winnerPlayers,
      };
    }
  }
  
  // Standard winning condition: all alive players from same team
  let firstPlayerTeam = aliveList[0].role.team;
  let opponentFound = false;
  
  for (let i = 1; i < aliveList.length; i++) {
    let currentPlayerTeam = aliveList[i].role.team;
    if (firstPlayerTeam !== currentPlayerTeam) {
      opponentFound = true;
      break;
    }
  }

  if (!opponentFound) {
    let winningTeamName = firstPlayerTeam;
    const winningTeam = teams.find((team) => team.name == winningTeamName);

    const winnerPlayers = aliveList.filter(
      (player) => player.role.team === winningTeamName
    );

    const winner = {
      name: winningTeam.name,
      image: winningTeam.image,
      winnerPlayers: winnerPlayers,
    };
    return winner;
  } else {
    return null;
  }
};

exports.giveRandomName = () => {
  let randomName;
  randomName = shortName();
  return randomName;
};
