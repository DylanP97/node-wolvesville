const { shortName } = require("./randomUsername");
const { teams } = require("./teams");

exports.checkForWinner = (aliveList) => {
  let firstPlayerTeam = aliveList[0].role.team;
  let opponentFound = false;

  for (let i = 1; i < aliveList.length; i++) {
    const currentPlayerTeam = aliveList[i].role.team;
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
