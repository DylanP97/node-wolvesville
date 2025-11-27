
exports.pourGasoline = (playersList, action) => {
    playersList = playersList.map((ply) => {
        if (ply.id === action.selectedPlayerId) {
            console.log("player ", ply.name, " is marked with gasoline");
            return {
                ...ply,
                isMarkedWithGasoline: true,
            };
        }
        if (ply.id === action.pyroId) {
            return {
                ...ply,
                nbrOfPouredPlayers: (ply.nbrOfPouredPlayers ?? 0) + 1,
            };
        }
        return ply;
    });

    return playersList;
};

exports.burnThemDown = (playersList, pyroId) => {
    let fireVictims = 0
    playersList = playersList.map((ply) => {
        if (ply.isMarkedWithGasoline && !ply.isUnderArrest) {
            fireVictims += 1
            return {
                ...ply,
                isAlive: false,
                isRevealed: ply.role.team === "Werewolves",
            };
        }
        // the pyro can only do one fire each game
        if (ply.id === pyroId) {
            return {
                ...ply,
                nbrOfPouredPlayers: null,
                canPerform1: null,
                canPerform2: null,
            };
        }
        return ply;
    });

    console.log("fire victims: ", fireVictims)

    return playersList
}