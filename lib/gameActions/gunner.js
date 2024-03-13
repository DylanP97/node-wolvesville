
const { getCurrentTime } = require("../utils");
const { killSelectedPlayer } = require("./general");

exports.shootBullet = (playersList, messagesHistory, action) => {

    playersList = killSelectedPlayer(action.selectedPlayerId, playersList);
    messagesHistory.unshift({ time: getCurrentTime(), author: "", msg: `The gunner shot ${action.selectedPlayerName}. 💀` })

    playersList = playersList.map((player) => {
        if (player.id === action.gunnerId) {
            return {
                ...player,
                role: {
                    ...player.role,
                    canPerform: {
                        ...player.role.canPerform,
                        nbrLeftToPerform: player.role.canPerform.nbrLeftToPerform - 1,
                    },
                },
            };
        }
        return player;
    });
    // checkIfIsInLove(action.selectedPlayer, updatedPlayersList, setUpdatedPlayersList, displayAction);

    const playersListEdit = playersList
    const messagesHistoryEdit = messagesHistory

    return { playersListEdit, messagesHistoryEdit }
};