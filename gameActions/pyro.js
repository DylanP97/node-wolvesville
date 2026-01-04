const { getCurrentTime } = require("../lib/utils");

exports.pourGasoline = (playersList, action) => {
    playersList = playersList.map((ply) => {
        if (ply.id === action.selectedPlayerId) {
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

exports.burnThemDown = (game, pyroId) => {
    let fireVictims = 0;

    game.messagesHistory.unshift({
        time: getCurrentTime(),
        author: "",
        msg: `{serverContent.action.message.burnThemDown}`,
    });

    game.playersList = game.playersList.map((ply) => {
        if (ply.isMarkedWithGasoline && !ply.isUnderArrest && ply.isAlive) {

            const wasProtected = ply.isProtected;
            const wasHealed = ply.isHealed;

            if (wasProtected) {
                game.messagesHistory.unshift({
                    time: getCurrentTime(),
                    author: "",
                    msg: `{serverContent.action.message.wasProtected}`,
                });
                game.messagesHistory.unshift({
                    time: getCurrentTime(),
                    author: "",
                    msg: `DEV -- ${ply.name} was protected by witch from pyro fire`,
                });
            }

            else if (wasHealed) {
                game.messagesHistory.unshift({
                    time: getCurrentTime(),
                    author: "",
                    msg: `{serverContent.action.message.wasHealed}`,
                });
                game.messagesHistory.unshift({
                    time: getCurrentTime(),
                    author: "",
                    msg: `DEV -- ${ply.name} was healed by doctor from pyro fire`,
                });
            }

            else {
                // Add burn message first
                game.messagesHistory.unshift({
                    time: getCurrentTime(),
                    author: "",
                    msg: `{serverContent.action.message.burnByFire} ${ply.name}`,
                });
                // Add werewolf reveal message immediately after if applicable (only if not already revealed)
                if (ply.role.team === "Werewolves" && !ply.isRevealed) {
                    game.messagesHistory.unshift({
                        time: getCurrentTime(),
                        author: "",
                        msg: `{serverContent.action.message.werewolfReveal}${ply.name}{serverContent.action.message.wasWerewolf}`,
                    });
                }
                fireVictims += 1;
                return {
                    ...ply,
                    isAlive: false,
                    isRevealed: ply.isRevealed ? true : ply.role.team === "Werewolves",
                    isMarkedWithGasoline: false,
                    wasBurnedByArsonist: true, // flag for front-end animation
                };
            }

        }
        if (ply.id === pyroId) {
            return {
                ...ply,
                nbrOfPouredPlayers: 0,
            };
        }
        return ply;
    });

    return game;
}