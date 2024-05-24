const { getCurrentTime } = require("../utils");
const { checkIfWasHealed } = require("./doctor");
const { killSelectedPlayer } = require("./general");

exports.voteAgainst = (playerId, playersList, nbr) => {
  return playersList.map((player) => {
    if (player.id === playerId) {
      return {
        ...player,
        voteAgainst: player.voteAgainst + nbr,
      };
    }
    return player;
  });
};

exports.wolfVoteAgainst = (playerId, playersList, nbr) => {
  return playersList.map((player) => {
    if (player.id === playerId) {
      return {
        ...player,
        wolfVoteAgainst: (player.wolfVoteAgainst || 0) + nbr,
      };
    }
    return player;
  });
};

exports.initializeVotes = (playersList) => {
  return playersList.map((ply) => {
    return {
      ...ply,
      voteAgainst: 0,
    };
  });
};

exports.initializeWolvesVotes = (playersList) => {
  return playersList.map((ply) => {
    return {
      ...ply,
      wolfVoteAgainst: 0,
    };
  });
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
      msg: `The town couldn't decide who to kill!`,
    });
  } else {
    playersList = killSelectedPlayer(mostVotedAgainstPlayer.id, playersList);
    if (mostVotedAgainstPlayer.role.name === "Fool") {
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `The fool won 🤡!`,
      });
      winningTeam = {
        name: "fool",
        image:
          "https://res.cloudinary.com/dnhq4fcyp/image/upload/v1706531396/roles/fool_ngedk0.png",
      };
    } else {
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `The town decided to kill ${
          playersList[mostVotedAgainstPlayer.id].name
        } has a result of the vote! 💀`,
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
  const mostVotedAgainstPlayer =
    this.findPlayerWithMostWolvesVotes(playersList);

  if (!mostVotedAgainstPlayer) {
    messagesHistory.unshift({
      time: getCurrentTime(),
      author: "",
      msg: `No one was murdered by the wolves!`,
    });
  } else {
    const wasHealed = mostVotedAgainstPlayer.isHealed;
    checkIfWasHealed(mostVotedAgainstPlayer, playersList, messagesHistory);

    if (mostVotedAgainstPlayer.role.name === "Serial Killer") {
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `The wolves couldn't kill their target (serial killer)!`,
      });
    } else if (wasHealed) {
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `The wolves couldn't kill their target! (healed by the doctor)`,
      });
    } else {
      playersList = killSelectedPlayer(mostVotedAgainstPlayer.id, playersList);
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `The wolves murdered ${
          playersList[mostVotedAgainstPlayer.id].name
        } has a result of the vote! 💀`,
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
