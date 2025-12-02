const { getCurrentTime } = require("../utils");
const { reinitializeHeal } = require("./doctor");
const { reinitializeProtection } = require("./witch");
const { bittenByWolves } = require("./cursed");
const { killSelectedPlayer } = require("./general");

exports.voteAgainst = (playerId, playersList, nbr) => {
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
        name: "Fool",
        image:
          "https://res.cloudinary.com/dnhq4fcyp/image/upload/v1706531396/roles/fool_ngedk0.png",
        winnerPlayers: [mostVotedAgainstPlayer],
      };
    } else {
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `{serverContent.villageVote.outcome.basic} ${playersList[mostVotedAgainstPlayer.id].name
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
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `DEV -- unsuccessfulWolfVote`,
      });
    }
  } else {
    const wasProtected = mostVotedAgainstPlayer.isProtected;
    const wasHealed = mostVotedAgainstPlayer.isHealed;

    // we reinitialize protection and heal status in any case
    if (wasHealed) playersList = reinitializeHeal(playersList, mostVotedAgainstPlayer);
    if (wasProtected) playersList = reinitializeProtection(playersList, mostVotedAgainstPlayer);

    if (!mostVotedAgainstPlayer.isAlive) {
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `DEV -- is not alive anymore, killed by somebody else before wolves vote`,
      });
    } else if (mostVotedAgainstPlayer.role.name === "Serial Killer" && wolves.length > 2) {
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `{serverContent.wolfVote.outcome.null}`,
      });
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `DEV -- unableToKillSK`,
      });
    } else if (wasHealed) {
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `{serverContent.action.message.wasHealed}`,
      });
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `DEV -- ${mostVotedAgainstPlayer.name} was healed by doctor from wolf attack`,
      });
    } else if (wasProtected) {
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `{serverContent.action.message.wasProtected}`,
      });
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `DEV -- ${mostVotedAgainstPlayer.name} was protected by witch from wolf attack`,
      });
    } else if (mostVotedAgainstPlayer.role.name === "Cursed") {
      playersList = bittenByWolves(playersList, mostVotedAgainstPlayer.id, wolves[0].wolvesKnowledge);
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `{serverContent.wolfVote.outcome.null}`,
      });
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `DEV -- cursedBittenByWolves`,
      });
    } else {
      playersList = killSelectedPlayer(mostVotedAgainstPlayer.id, playersList);
      messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `{serverContent.action.message.wolvesMurdered} ${playersList[mostVotedAgainstPlayer.id].name
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
