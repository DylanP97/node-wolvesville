const { getCurrentTime } = require("../utils");
const { checkIfWasHealed } = require("./doctor");
const { killSelectedPlayer } = require("./general");

exports.voteAgainst = (playerId, playersList, nbr) => {
  console.log("nbr", nbr)
  playersList = playersList.map((player) => {
    if (player.id === playerId) {
      return {
        ...player,
        voteAgainst: player.voteAgainst + nbr,
      };
    }
    return player;
  });
  return playersList;
};

exports.wolfVoteAgainst = (playerId, playersList, nbr) => {
  playersList = playersList.map((player) => {
    if (player.id === playerId) {
      return {
        ...player,
        wolfVoteAgainst: (player.wolfVoteAgainst || 0) + nbr,
      };
    }
    return player;
  });
  return playersList;
};

exports.initializeVotes = (playersList) => {
  playersList = playersList.map((ply) => {
    return {
      ...ply,
      voteAgainst: 0,
    };
  });
  return playersList;
};

exports.initializeWolvesVotes = (playersList) => {
  playersList = playersList.map((ply) => {
    return {
      ...ply,
      wolfVoteAgainst: 0,
    };
  });
  return playersList;
};

exports.findPlayerWithMostVotes = (playersList) => {
  let playerWithMostVotes = null;
  let maxVotes = 0;
  let countMaxVotes = 0;

  for (const player of playersList) {
    if (player.voteAgainst > maxVotes) {
      maxVotes = player.voteAgainst;
      playerWithMostVotes = player;
      countMaxVotes = 1;
    } else if (player.voteAgainst === maxVotes) {
      countMaxVotes++;
    }
  }

  return countMaxVotes === 1 ? playerWithMostVotes : null;
};

exports.findPlayerWithMostWolvesVotes = (playersList) => {
  let playerWithMostVotes = null;
  let maxVotes = 0;
  let countMaxVotes = 0;

  for (const player of playersList) {
    if (player.wolfVoteAgainst > maxVotes) {
      maxVotes = player.wolfVoteAgainst;
      playerWithMostVotes = player;
      countMaxVotes = 1;
    } else if (player.wolfVoteAgainst === maxVotes) {
      countMaxVotes++;
    }
  }
  return countMaxVotes === 1 ? playerWithMostVotes : null;
};

exports.handleVote = (playersList, messagesHistory, winningTeam) => {
  const mostVotedAgainstPlayer = this.findPlayerWithMostVotes(playersList);
  if (!mostVotedAgainstPlayer) {
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `{serverContent.villageVote.outcome.null}`,
    });
  } else {
    playersList = killSelectedPlayer(mostVotedAgainstPlayer.id, playersList);
    if (mostVotedAgainstPlayer.role.name === "Fool") {
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `{serverContent.villageVote.outcome.foolWins}`,
      });
      winningTeam = {
        name: "fool",
        image:
          "https://res.cloudinary.com/dnhq4fcyp/image/upload/v1706531396/roles/fool_ngedk0.png",
        winnerPlayers: [mostVotedAgainstPlayer],
      };
    } else {
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `{serverContent.villageVote.outcome.basic} ${
          playersList[mostVotedAgainstPlayer.id].name
        }`,
      });
      // checkIfIsInLove(mostVotedAgainstPlayer, updatedPlayersList, setUpdatedPlayersList, displayAction);
    }
  }

  playersList = this.initializeVotes(playersList);

  return {
    playersList,
    messagesHistory,
    winningTeam,
  };
};

exports.handleWolvesVote = (playersList, messagesHistory) => {
  // console.log("handleWolvesVote");
  // console.log(playersList);

  const wolves = playersList.filter((ply) => ply.role.team === "Werewolves");
  const mostVotedAgainstPlayer =
    this.findPlayerWithMostWolvesVotes(playersList);

  if (!mostVotedAgainstPlayer) {
    if (wolves.length > 0) {
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `{serverContent.wolfVote.outcome.null}`,
      });
    }
  } else {
    const wasHealed = mostVotedAgainstPlayer.isHealed;
    checkIfWasHealed(mostVotedAgainstPlayer, playersList, messagesHistory);

    if (mostVotedAgainstPlayer.role.name === "Serial Killer") {
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `{serverContent.wolfVote.outcome.unableToKillSK}`,
      });
    } else if (wasHealed) {
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `{serverContent.wolfVote.outcome.healedByDoctor}`,
      });
    } else {
      playersList = killSelectedPlayer(mostVotedAgainstPlayer.id, playersList);
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `{serverContent.action.message.wolvesMurdered} ${
          playersList[mostVotedAgainstPlayer.id].name
        }!`,
      });
      // checkIfIsInLove(mostVotedAgainstPlayer, updatedPlayersList, setUpdatedPlayersList, displayAction);
    }
  }

  playersList = this.initializeWolvesVotes(playersList);

  const playersListEdit = playersList;
  const messagesHistoryEdit = messagesHistory;

  return {
    playersListEdit,
    messagesHistoryEdit,
  };
};
