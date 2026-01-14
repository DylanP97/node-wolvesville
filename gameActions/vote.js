const { getCurrentTime } = require("../lib/utils");
const { bittenByWolves } = require("./cursed");
const { killSelectedPlayer } = require("./general");
const { checkIfIsInLove } = require("./cupid");
const { redirectAttackToVisited } = require("./ghostLady");
const { executeRevengeKill } = require("./babyWerewolf");

exports.voteAgainst = (selectedPlayerId, playersList, nbr, playerId, selectedPlayerName) => {
  console.log("voteAgainst called");
  playersList = playersList.map((player) => {
    if (player.id === selectedPlayerId) {
      return {
        ...player,
        voteAgainst: (player.voteAgainst || 0) + nbr,
      };
    }
    if (player.id === playerId) {
      return {
        ...player,
        hasVotedFor: selectedPlayerName,
      };
    }
    return player;
  });
  return playersList;
};

exports.wolfVoteAgainst = (selectedPlayerId, playersList, nbr, playerId, selectedPlayerName) => {
  playersList = playersList.map((player) => {
    if (player.id === selectedPlayerId) {
      return {
        ...player,
        wolfVoteAgainst: (player.wolfVoteAgainst || 0) + nbr,
      };
    }
    if (player.id === playerId) {
      return {
        ...player,
        hasWolfVotedFor: selectedPlayerName,
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
      hasVotedFor: null,
    };
  });
  return playersList;
};

exports.initializeWolvesVotes = (playersList) => {
  playersList = playersList.map((ply) => {
    return {
      ...ply,
      wolfVoteAgainst: 0,
      hasWolfVotedFor: null,
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

exports.handleVote = (playersList, messagesHistory, winningTeam, gameStartTime, animationQueue = null) => {
  const mostVotedAgainstPlayer = this.findPlayerWithMostVotes(playersList);
  if (!mostVotedAgainstPlayer) {
    messagesHistory.unshift({
      time: getCurrentTime(gameStartTime),
      author: "",
      msg: `{serverContent.villageVote.outcome.null}`,
    });
  } else {
    playersList = killSelectedPlayer(mostVotedAgainstPlayer.id, playersList);
    if (mostVotedAgainstPlayer.role.name === "Fool") {
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
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
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `{serverContent.villageVote.outcome.basic} ${mostVotedAgainstPlayer.name}`,
      });
      // Reveal if the dead player was a werewolf (only if not already revealed)
      if (mostVotedAgainstPlayer.role.team === "Werewolves" && !mostVotedAgainstPlayer.isRevealed) {
        messagesHistory.unshift({
          time: getCurrentTime(gameStartTime),
          author: "",
          msg: `{serverContent.action.message.werewolfReveal}${mostVotedAgainstPlayer.name}{serverContent.action.message.wasWerewolf}`,
        });
      }

      // Check for Baby Werewolf revenge kill
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `DEV -- [Village Vote] Checking Baby Wolf: role=${mostVotedAgainstPlayer.role.name}, revengeTargetId=${mostVotedAgainstPlayer.revengeTargetId || "NOT SET"}`,
      });
      if (mostVotedAgainstPlayer.role.name === "Baby Werewolf" && mostVotedAgainstPlayer.revengeTargetId) {
        const revengeResult = executeRevengeKill(
          playersList,
          mostVotedAgainstPlayer.id,
          messagesHistory,
          gameStartTime,
          animationQueue
        );
        playersList = revengeResult.playersList;
        messagesHistory = revengeResult.messagesHistory;
      }

      // Check if the dead player was in love and kill their partner
      // Use the player object before death to check isInLove property
      const result = checkIfIsInLove(mostVotedAgainstPlayer, playersList, messagesHistory, gameStartTime, animationQueue);
      playersList = result.playersList;
      messagesHistory = result.messagesHistory;
    }
  }

  playersList = this.initializeVotes(playersList);

  return {
    playersList,
    messagesHistory,
    winningTeam,
  };
};

exports.handleWolvesVote = (playersList, messagesHistory, gameStartTime, animationQueue = null) => {


  const wolves = playersList.filter((ply) => ply.role.team === "Werewolves");
  const mostVotedAgainstPlayer =
    this.findPlayerWithMostWolvesVotes(playersList);

  let shouldTriggerWolvesAnimation = false; // Flag for animation

  if (!mostVotedAgainstPlayer) {
    if (wolves.length > 0) {
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `{serverContent.wolfVote.outcome.null}`,
      });
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `DEV -- unsuccessfulWolfVote`,
      });
    }
  } else {
    const wasProtected = mostVotedAgainstPlayer.isProtected;
    const wasHealed = mostVotedAgainstPlayer.isHealed;

    if (!mostVotedAgainstPlayer.isAlive) {
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `{serverContent.wolfVote.outcome.null}`,
      });
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `DEV -- is not alive anymore, killed by somebody else before wolves vote`,
      });
    } else if (mostVotedAgainstPlayer.role.name === "Serial Killer" && wolves.length > 2) {
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `{serverContent.wolfVote.outcome.null}`,
      });
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `DEV -- unableToKillSK`,
      });
    } else if (wasHealed) {
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `{serverContent.action.message.wasHealed}`,
      });
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `DEV -- ${mostVotedAgainstPlayer.name} was healed by doctor from wolf attack`,
      });
    } else if (wasProtected) {
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `{serverContent.action.message.wasProtected}`,
      });
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `DEV -- ${mostVotedAgainstPlayer.name} was protected by witch from wolf attack`,
      });
    } else if (mostVotedAgainstPlayer.role.name === "Cursed") {
      playersList = bittenByWolves(playersList, mostVotedAgainstPlayer.id, wolves[0].wolvesKnowledge);
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `{serverContent.wolfVote.outcome.null}`,
      });
      messagesHistory.unshift({
        time: getCurrentTime(gameStartTime),
        author: "",
        msg: `DEV -- cursedBittenByWolves`,
      });
    } else {
      // Check for Ghost Lady protection mechanics
      const ghostLady = playersList.find(
        (p) => p.role && p.role.name === "Ghost Lady" && p.isAlive && p.visitingPlayerId !== undefined
      );

      // Case 1: Ghost Lady is the wolf target - redirect to visited player
      if (ghostLady && mostVotedAgainstPlayer.id === ghostLady.id) {
        const visitedPlayer = playersList.find((p) => p.id === ghostLady.visitingPlayerId);
        messagesHistory.unshift({
          time: getCurrentTime(gameStartTime),
          author: "",
          msg: `DEV -- Ghost Lady was attacked by wolves while visiting ${visitedPlayer?.name}. Redirecting attack to visited player.`,
        });

        const redirectResult = redirectAttackToVisited(
          playersList,
          ghostLady.id,
          messagesHistory,
          gameStartTime,
          animationQueue
        );
        playersList = redirectResult.playersList;
        messagesHistory = redirectResult.messagesHistory;

        if (redirectResult.redirected) {
          shouldTriggerWolvesAnimation = true;
          messagesHistory.unshift({
            time: getCurrentTime(gameStartTime),
            author: "",
            msg: `DEV -- Attack redirected! ${visitedPlayer?.name} died instead of Ghost Lady.`,
          });
          // Check for lover death
          if (visitedPlayer) {
            const result = checkIfIsInLove(visitedPlayer, playersList, messagesHistory, gameStartTime, animationQueue);
            playersList = result.playersList;
            messagesHistory = result.messagesHistory;
          }
        }
      }
      // Normal kill
      else {
        playersList = killSelectedPlayer(mostVotedAgainstPlayer.id, playersList);
        const wolvesKillMessage = `{serverContent.action.message.wolvesMurdered} ${mostVotedAgainstPlayer.name}!`;
        messagesHistory.unshift({
          time: getCurrentTime(gameStartTime),
          author: "",
          msg: wolvesKillMessage,
        });

        shouldTriggerWolvesAnimation = true; // Trigger animation when wolves kill

        // Queue wolves animation BEFORE checking for lover suicide
        // This ensures wolves animation plays first, then lover suicide animation
        // Store the message directly to avoid getting the werewolf reveal message instead
        if (animationQueue) {
          animationQueue.push({
            type: "wolvesAte",
            duration: 3000,
            message: wolvesKillMessage,
          });
        }

        // Check for Baby Werewolf revenge kill
        messagesHistory.unshift({
          time: getCurrentTime(gameStartTime),
          author: "",
          msg: `DEV -- Checking Baby Wolf revenge: role=${mostVotedAgainstPlayer.role.name}, revengeTargetId=${mostVotedAgainstPlayer.revengeTargetId || "NOT SET"}`,
        });
        if (mostVotedAgainstPlayer.role.name === "Baby Werewolf" && mostVotedAgainstPlayer.revengeTargetId) {
          const revengeTarget = playersList.find(p => p.id === mostVotedAgainstPlayer.revengeTargetId);
          // Debug: check if Baby Wolf in updated playersList still has revengeTargetId
          const babyWolfInList = playersList.find(p => p.id === mostVotedAgainstPlayer.id);
          messagesHistory.unshift({
            time: getCurrentTime(gameStartTime),
            author: "",
            msg: `DEV -- Baby Wolf in playersList: revengeTargetId=${babyWolfInList?.revengeTargetId || "NOT SET"}`,
          });
          messagesHistory.unshift({
            time: getCurrentTime(gameStartTime),
            author: "",
            msg: `DEV -- Baby Werewolf ${mostVotedAgainstPlayer.name} died! Executing revenge on ${revengeTarget?.name || "unknown"}`,
          });

          const revengeResult = executeRevengeKill(
            playersList,
            mostVotedAgainstPlayer.id,
            messagesHistory,
            gameStartTime,
            animationQueue
          );
          playersList = revengeResult.playersList;
          messagesHistory = revengeResult.messagesHistory;
        }

        // Check if the dead player was in love and kill their partner
        // Use the player object before death to check isInLove property
        const result = checkIfIsInLove(mostVotedAgainstPlayer, playersList, messagesHistory, gameStartTime, animationQueue);
        playersList = result.playersList;
        messagesHistory = result.messagesHistory;
      }
    }
  }

  playersList = this.initializeWolvesVotes(playersList);

  const playersListEdit = playersList;
  const messagesHistoryEdit = messagesHistory;

  return {
    playersListEdit,
    messagesHistoryEdit,
    shouldTriggerWolvesAnimation,
  };
};
