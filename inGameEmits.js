const { checkForWinner } = require("./lib/gameActions");
const { getCurrentTime } = require("./lib/utils");
const { editGame, setRooms, pauseForAnimation } = require("./lib/gameSetup");

const inGameEmits = (io, socket, rooms, connectedUsers) => {
    // ✅ Plus besoin de getRooms() car rooms est maintenant toujours à jour
    // grâce aux modifications en place dans socketManager

    /*** in-game emits ****/

    socket.on("pauseGame", (roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            game.isPaused = true;
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("resumeGame", (roomId) => {
        // console.log("resumeGame fn");
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            game.isPaused = false;
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("addVote", (action, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(
                game,
                "addVote",
                action,
                `DEV -- ${action.playerName}
          {serverContent.action.message.addVote} 
          ${action.selectedPlayerName}!`
            );
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("addWolfVote", (action, roomId) => {
        // console.log("addWolfVote fn");
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(
                game,
                "addWolfVote",
                action,
                `DEV -- ${action.playerName}
          {serverContent.action.message.addWolfVote}
          ${action.selectedPlayerName}! --`
            );
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("chooseJuniorWolfDeathRevenge", (actionObj, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(game, "chooseJuniorWolfDeathRevenge", actionObj, null);
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("uncoverRole", (action, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(
                game,
                "uncoverRole",
                action,
                null // Don't add message to general chat
            );
            // Add message to wolves chat instead
            game.wolvesMessagesHistory.unshift({
                time: getCurrentTime(game.startTime),
                author: "",
                msg: `{serverContent.action.message.wolfSeer} ${action.selectedPlayerName}!`,
            });
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("executePrisoner", (action, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(
                game,
                "execute",
                action,
                null
            );
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("revealPlayer", (action, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            const message = `
          {serverContent.action.message.seer}
          ${action.selectedPlayerName} - ${action.selectedPlayerRole}!
          `;
            editGame(
                game,
                "reveal",
                action,
                message
            );
            setRooms(rooms, game, io, roomId);
            // Use the message we passed to editGame (trimmed)
            const animationMessage = message.trim() || null;
            io.to(roomId).emit("triggerAnimationForAll", {
                name: "seerForesee",
                text: animationMessage
            });
            // io.to(roomId).emit("triggerCardAnimationForAll", {
            //     title: "seerForesee",
            //     cardsPlyIds: [action.selectedPlayerId]
            // });
            pauseForAnimation(game, io, roomId, 3000, rooms);
        }
    });

    socket.on("shootBullet", (action, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(
                game,
                "shoot",
                action,
                null
            );
            setRooms(rooms, game, io, roomId);
            io.to(roomId).emit("triggerSoundForAll", "gunshot");
            // Get the message stored in game object (before werewolf reveal message)
            // Fallback to first message if not stored
            const animationMessage = game.lastActionMessage || game.messagesHistory.find(m => m.msg?.includes("shootBullet"))?.msg || game.messagesHistory[0]?.msg || null;
            // Clear the stored message after use
            if (game.lastActionMessage) {
              delete game.lastActionMessage;
            }
            io.to(roomId).emit("triggerAnimationForAll", {
                name: "angryShooter",
                text: animationMessage
            });
            pauseForAnimation(game, io, roomId, 6000, rooms);
        }
    });

    socket.on("pourGasoline", (action, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(
                game,
                "pour",
                action,
                ` DEV -- {serverContent.action.message.pourGasoline} ${action.selectedPlayerName} --`
            );
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("burnThemDown", (action, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(
                game,
                "burn",
                action,
                null
            );
            setRooms(rooms, game, io, roomId);
            // Find the burnThemDown message (not the individual burn messages)
            const animationMessage = game.messagesHistory.find(m => m.msg?.includes("burnThemDown"))?.msg || game.messagesHistory[0]?.msg || null;
            io.to(roomId).emit("triggerAnimationForAll", {
                name: "arsonistPlay",
                text: animationMessage
            });
            pauseForAnimation(game, io, roomId, 6000, rooms);
        }
    });

    socket.on("revive", (action, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(
                game,
                "revive",
                action,
                null
            );
            setRooms(rooms, game, io, roomId);
            // Use the message for medium revive animation (message doesn't exist yet at this point)
            const animationMessage = "{serverContent.action.message.mediumAboutToRevive}";
            io.to(roomId).emit("triggerAnimationForAll", {
                name: "mediumRevive",
                text: animationMessage
            });
            pauseForAnimation(game, io, roomId, 6000, rooms);
        }
    });

    socket.on("heal", (action, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(game, "heal", action, `DEV -- {serverContent.action.message.heal} ${action.selectedPlayerName}! --`);
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("protectPotion", (action, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(
                game,
                "protectPotion",
                action,
                `DEV --
          ${action.selectedPlayerName}
          {serverContent.action.message.protectPotion} --
          `
            );
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("poisonPotion", (action, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(
                game,
                "poisonPotion",
                action,
                null
            );
            setRooms(rooms, game, io, roomId);
            // Get the message stored in game object (before werewolf reveal message)
            // Fallback to finding message with poisonPotion or first message
            const animationMessage = game.lastActionMessage || game.messagesHistory.find(m => m.msg?.includes("poisonPotion"))?.msg || game.messagesHistory[0]?.msg || null;
            // Clear the stored message after use
            if (game.lastActionMessage) {
              delete game.lastActionMessage;
            }
            io.to(roomId).emit("triggerAnimationForAll", {
                name: "witchPoison",
                text: animationMessage
            });
            pauseForAnimation(game, io, roomId, 6000, rooms);
        }
    });

    socket.on("lootGrave", (action, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            const message = `{serverContent.action.message.graveRobber} ${action.selectedPlayerName}!`;
            editGame(
                game,
                "loot",
                action,
                message
            );
            setRooms(rooms, game, io, roomId);
            // Use the message we passed to editGame
            const animationMessage = message || null;
            io.to(roomId).emit("triggerAnimationForAll", {
                name: "graveRobber",
                text: animationMessage
            });
            pauseForAnimation(game, io, roomId, 6000, rooms);
        }
    });

    socket.on("putNightmare", (action, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(
                game,
                "putNightmare",
                action,
                `DEV -- {serverContent.action.message.putNightmare} ${action.selectedPlayerName}! --`
            );
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("assertDuty", (mayorName, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            const message = `
          {serverContent.action.message.mayorReveal}   
          ${mayorName}
          {serverContent.action.message.mayorTripleVote}
          `;
            editGame(
                game,
                "assertDuty",
                null,
                message
            );
            setRooms(rooms, game, io, roomId);
            // Use the message we passed to editGame (trimmed)
            const animationMessage = message.trim() || null;
            io.to(roomId).emit("triggerAnimationForAll", {
                name: "theMayor",
                text: animationMessage
            });
            pauseForAnimation(game, io, roomId, 6000, rooms);
        }
    });

    socket.on("checkForWinner", (roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (!game) {
            console.log("game is undefined in checkForWinner for roomId:", roomId);
            console.log("Available rooms:", rooms.map(r => r.id));
            return;
        }
        if (!game.id) {
            console.log("game.id is undefined in checkForWinner");
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

    socket.on("registerAction", (actionObject, roomId) => {
        // console.log("registerAction fn");
        let game = rooms.find((room) => room.id === roomId);
        if (!game) return;
        game.registeredActions.push(actionObject);
        setRooms(rooms, game, io, roomId);
    });

}

module.exports = inGameEmits;