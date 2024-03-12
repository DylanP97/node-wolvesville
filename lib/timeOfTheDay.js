const { arrestPlayer, releasePrisoners } = require("./gameActions/jailer");
const { murder } = require("./gameActions/sk");
const { handleWolvesVote, handleVote } = require("./gameActions/vote");
const { getCurrentTime } = require("./utils");

exports.toDayTime = (game) => {
    let playersList = game.playersList
    let messagesHistory = game.messagesHistory
    let winningTeam = game.winningTeam

    game.registeredActions.forEach((action) => {
        if (action.type === "murder") {
            const { playersListEdit, messagesHistoryEdit } = murder(playersList, messagesHistory, action)
            
            playersList = playersListEdit
            messagesHistory = messagesHistoryEdit
            game.aliveList = playersList.filter((p) => p.isAlive);
            game.registeredActions = [...game.registeredActions.filter((a) => a !== action)];
        }
    });

    if (game.aliveList.length > 1) {
        const { playersListEdit, messagesHistoryEdit } = handleWolvesVote(playersList, messagesHistory)

        playersList = playersListEdit;
        messagesHistory = messagesHistoryEdit
    }

    playersList = releasePrisoners(playersList);

    messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: "It's a new day here in the village ☀️"
    })

    game.playersList = playersList;
    game.aliveList = playersList.filter((p) => p.isAlive);
    game.timeOfTheDay = "daytime"
    game.timeCounter = 30000
    game.dayCount += 1
    game.jailNightMessages = []
    game.messagesHistory = messagesHistory
    game.winningTeam = winningTeam

    return game
};

exports.toVoteTime = (game) => {
    game.messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: "It's time to vote. ✉️"
    })

    game.timeCounter = 10000
    game.timeOfTheDay = "votetime"
    return game
};

exports.toNightTime = (game) => {
    let newPlayersList = game.playersList;
    let newMessagesHistory = game.messagesHistory;
    let newWinningTeam = game.winningTeam;

    game.registeredActions.forEach((action) => {
        if (action.type === "arrest") {
            newPlayersList = arrestPlayer(newPlayersList, action);
            game.registeredActions = [...game.registeredActions.filter((a) => a !== action)];
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
