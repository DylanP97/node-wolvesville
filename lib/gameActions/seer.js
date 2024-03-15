
exports.revealPlayer = (selectedPlayerId, seerId, playersList) => {
    return playersList.map((player) => {
        if (player.id === selectedPlayerId) {
            return {
                ...player,
                isRevealed: true,
            };
        }
        if (player.id === seerId) {
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