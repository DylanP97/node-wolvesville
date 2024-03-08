const { arrestPlayer, handleVote, releasePrisoners, murder, handleWolvesVote } = require("./gameActions");
const { getCurrentTime } = require("./utils");

exports.toDayTime = (game) => {

    let newPlayersList = game.playersList
    let newMessagesHistory = game.messagesHistory
    let newWinningTeam = game.winningTeam

    newPlayersList = releasePrisoners(newPlayersList);

    game.registeredActions.forEach((action) => {
        if (action.type === "murder") {
            const { newPlayersListEdited, newMessagesHistoryEdited } = murder(newPlayersList, newMessagesHistory, action)
            newPlayersList = newPlayersListEdited
            newMessagesHistory = newMessagesHistoryEdited
            game.aliveList = newPlayersList.filter((p) => p.isAlive);
            game.registeredActions = [...game.registeredActions.filter((a) => a !== action)];
        }
    });

    if (game.aliveList.length > 1) {
        const { playersList, messagesHistory, winningTeam } = handleWolvesVote(newPlayersList, newMessagesHistory, newWinningTeam)

        newPlayersList = playersList;
        newMessagesHistory = messagesHistory
        newWinningTeam = winningTeam
    }

    game.playersList = newPlayersList;
    game.aliveList = newPlayersList.filter((p) => p.isAlive);
    game.timeOfTheDay = "daytime"
    game.timeCounter = 30000
    game.dayCount += 1
    game.jailNightMessages = []
    newMessagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: "It's a new day here in the village.☀️"
    })
    game.messagesHistory = newMessagesHistory
    game.winningTeam = newWinningTeam

    return game
};

exports.toVoteTime = (game) => {

    game.timeCounter = 30000
    game.timeOfTheDay = "votetime"
    game.messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: "It's time to vote. ✉️"
    })

    return game
};

exports.toNightTime = (game) => {

    let newPlayersList = game.playersList;
    let newMessagesHistory = game.messagesHistory;
    let newWinningTeam = game.winningTeam;

    game.registeredActions.forEach((action) => {
        if (action.type === "arrest") {
            newPlayersList = arrestPlayer(newPlayersList, action);
        }
    });

    const { playersList, messagesHistory, winningTeam } = handleVote(newPlayersList, newMessagesHistory, newWinningTeam)

    newPlayersList = playersList;
    newMessagesHistory = messagesHistory
    newWinningTeam = winningTeam

    newMessagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: "Beware it's night... 🌒"
    })

    game.timeCounter = 30000
    game.timeOfTheDay = "nighttime"
    game.playersList = newPlayersList;
    game.aliveList = newPlayersList.filter((p) => p.isAlive);
    game.messagesHistory = newMessagesHistory;

    return game
};
