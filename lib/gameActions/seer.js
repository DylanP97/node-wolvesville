
exports.revealPlayer = (action, playersList) => {
    return playersList.map((player) => {
        if (player.id === action.selectedPlayerId) {
            return {
                ...player,
                isRevealed: true,
            };
        }
        if (player.id === action.seerId) {
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
};