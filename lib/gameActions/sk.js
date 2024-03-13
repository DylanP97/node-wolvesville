const { checkIfWasHealed } = require("./doctor");
const { getCurrentTime } = require("../utils");
const { killSelectedPlayer } = require("./general");

exports.murder = (playersList, messagesHistory, action) => {
    const attackedPlayer = playersList.find((ply) => ply.id == action.selectedPlayerId)
    const wasHealed = attackedPlayer.isHealed
    checkIfWasHealed(attackedPlayer, playersList, messagesHistory)

    if (!wasHealed) {
        messagesHistory.unshift({ time: getCurrentTime(), author: "", msg: `${ply.name} was killed last night by the serial killer. 💀🔪` })
        playersList = killSelectedPlayer(action.selectedPlayerId, playersList)
        // need to add inlove outcome
    }

    const playersListEdit = playersList
    const messagesHistoryEdit = messagesHistory
    
    return { playersListEdit, messagesHistoryEdit }
}