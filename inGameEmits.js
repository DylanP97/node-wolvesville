const { checkForWinner } = require("./lib/gameActions");
const { getCurrentTime } = require("./lib/utils");
const { editGame, setRooms } = require("./lib/gameSetup");

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
                time: getCurrentTime(),
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
                `{serverContent.action.message.executePrisoner} 
          ${action.selectedPlayerName}!`
            );
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("revealPlayer", (action, roomId) => {
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(
                game,
                "reveal",
                action,
                `
          {serverContent.action.message.seer}
          ${action.selectedPlayerName} - ${action.selectedPlayerRole}!
          `
            );
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("shootBullet", (action, roomId) => {
        console.log("shootBullet fn");
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(
                game,
                "shoot",
                action,
                `{serverContent.action.message.shootBullet} ${action.selectedPlayerName}.`
            );
            setRooms(rooms, game, io, roomId);
            io.to(roomId).emit("triggerSoundForAll", "gunshot");
        }
    });

    socket.on("pourGasoline", (action, roomId) => {
        console.log("pourGasoline fn");
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
        console.log("burnThemDown fn");
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(
                game,
                "burn",
                action,
                ``
            );
            setRooms(rooms, game, io, roomId);
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
                `{serverContent.action.message.poisonPotion}${action.selectedPlayerName}
          `
            );
            setRooms(rooms, game, io, roomId);
        }
    });

    socket.on("lootGrave", (action, roomId) => {
        console.log("lootGrave fn");
        let game = rooms.find((room) => room.id === roomId);
        if (game) {
            editGame(
                game,
                "loot",
                action,
                `DEV -- {serverContent.action.message.graveRobber} ${action.selectedPlayerName}! --`
            );
            setRooms(rooms, game, io, roomId);
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
            editGame(
                game,
                "assertDuty",
                null,
                `
          {serverContent.action.message.mayorReveal}   
          ${mayorName}
          `
            );
            setRooms(rooms, game, io, roomId);
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
                    time: getCurrentTime(),
                    author: authorN,
                    msg: msg,
                });
            } else if (isWolvesChat) {
                game.wolvesMessagesHistory.unshift({
                    time: getCurrentTime(),
                    author: username,
                    msg: msg,
                });
            } else {
                game.messagesHistory.unshift({
                    time: getCurrentTime(),
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