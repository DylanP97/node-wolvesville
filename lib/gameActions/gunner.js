
const { killSelectedPlayer } = require("./general");

exports.shootBullet = (playersList, selectedPlayerId, gunnerId) => {

    playersList = killSelectedPlayer(selectedPlayerId, playersList);

    playersList = playersList.map((player) => {
        if (player.id === gunnerId) {
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

    return playersList
};