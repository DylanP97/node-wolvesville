const { checkForWinner, handleAssertDuty, handleRegisterAction, handlePutNightmare, handleExecutePrisoner, handleAddWolfVote, handleChooseJuniorWolfDeathRevenge, handleUncoverRole, handleRevealPlayer, handleShootBullet, handlePourGasoline, handleBurnThemDown, handleRevive, handleHeal, handleProtectPotion, handlePoisonPotion, handleLootGrave, handleAddVote } = require("./lib/gameActions");
const { getCurrentTime } = require("./lib/utils");
const { setRooms } = require("./lib/gameSetup");

const inGameEmits = (io, socket, rooms) => {
    /*** in-game emits ****/

    socket.on("pauseGame", (roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            game.isPaused = true;
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("resumeGame", (roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            game.isPaused = false;
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("addVote", (action, roomId) => {
        handleAddVote(action, roomId, rooms, io);
    });

    socket.on("addWolfVote", (action, roomId) => {
        handleAddWolfVote(action, roomId, rooms, io);
    });

    socket.on("chooseJuniorWolfDeathRevenge", (action, roomId) => {
        handleChooseJuniorWolfDeathRevenge(action, roomId, rooms, io);
    });

    socket.on("uncoverRole", (action, roomId) => {
        handleUncoverRole(action, roomId, rooms, io);
    });

    socket.on("executePrisoner", (action, roomId) => {
        handleExecutePrisoner(action, roomId, rooms, io);
    });

    socket.on("revealPlayer", (action, roomId) => {
        handleRevealPlayer(action, roomId, rooms, io);
    });

    socket.on("shootBullet", (action, roomId) => {
        handleShootBullet(action, roomId, rooms, io);
    });

    socket.on("pourGasoline", (action, roomId) => {
        handlePourGasoline(action, roomId, rooms, io);
    });

    socket.on("burnThemDown", (action, roomId) => {
        handleBurnThemDown(action, roomId, rooms, io);
    });

    socket.on("revive", (action, roomId) => {
        handleRevive(action, roomId, rooms, io);
    });

    socket.on("heal", (action, roomId) => {
        handleHeal(action, roomId, rooms, io);
    });

    socket.on("protectPotion", (action, roomId) => {
        handleProtectPotion(action, roomId, rooms, io);
    });

    socket.on("poisonPotion", (action, roomId) => {
        handlePoisonPotion(action, roomId, rooms, io);
    });

    socket.on("lootGrave", (action, roomId) => {
        handleLootGrave(action, roomId, rooms, io);
    });

    socket.on("putNightmare", (action, roomId) => {
        handlePutNightmare(action, roomId, rooms, io);
    });

    socket.on("assertDuty", (captainName, roomId) => {
        handleAssertDuty(captainName, roomId, rooms, io);
    });

    socket.on("registerAction", (actionObject, roomId) => {
        handleRegisterAction(actionObject, roomId, rooms, io);
    });

    socket.on("checkForWinner", (roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (!game) {
            return;
        }
        if (!game.id) {
            return;
        }
        if (game.aliveList === null) {
            game.aliveList = game.playersList.filter((p) => p.isAlive);
        }
        let winner = checkForWinner(game.aliveList, game.playersList);
        if (winner !== null) {
            game.winningTeam = winner;
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on(
        "sendMessage",
        (
            msg,
            roomId,
            username,
            isWolvesChat,
            isJailerChat,
            isMediumChat,
            isJailer,
            language
        ) => {
            let game = rooms.find((room) => room.id === roomId);
            if (!game) return;

            if (isJailerChat) {
                const authorN = isJailer
                    ? language === "fr"
                        ? "Géôlier"
                        : "Jailer"
                    : username;
                game.jailNightMessages.unshift({
                    time: getCurrentTime(game.startTime),
                    author: authorN,
                    msg: msg,
                });
            } else if (isWolvesChat) {
                game.wolvesMessagesHistory.unshift({
                    time: getCurrentTime(game.startTime),
                    author: username,
                    msg: msg,
                });
            } else if (isMediumChat) {
                // Medium chat - anonymous messages (author is empty or "Dead" for dead players)
                game.mediumMessagesHistory.unshift({
                    time: getCurrentTime(game.startTime),
                    author: "", // Anonymous - medium and dead players don't show names
                    msg: msg,
                });
            } else {
                game.messagesHistory.unshift({
                    time: getCurrentTime(game.startTime),
                    author: username,
                    msg: msg,
                });
            }
            setRooms(rooms, game, io, roomId);
        }
    );

}

module.exports = inGameEmits;