const { checkForWinner } = require("./lib/gameActions");
const { getCurrentTime } = require("./lib/utils");
const {
  toVoteTime,
  toNightTime,
  toVoteTimeAftermath,
  toNightTimeAftermath,
  toDayTime,
  assignCpuRandomSecondToEachCPU,
} = require("./lib/timeOfTheDay");
const {
  initializeGameObject,
  initializePlayersList,
  setRooms,
  editGame,
} = require("./lib/gameSetup");
const { getRolesDataForQuickGame } = require("./controllers/roles");

const socketManager = (io, rooms, connectedUsers) => {
  io.on("connection", (socket) => {
    console.log("currently in connectedUsers dd")
    console.log(connectedUsers.map((usr) => usr.username))
    const token = socket.handshake.query.token;

    console.log("some user trying to reconnect with token:", connectedUsers.some((usr) => usr.token === token));
    // verify if the user is already connected and having a socket change, if yes just updated his socketId
    if (connectedUsers.some((usr) => usr.token === token)) {
      console.log("reconnected user");
      let user = connectedUsers.find((usr) => usr.token === token);
      connectedUsers = connectedUsers.filter((usr) => usr.token !== token);
      connectedUsers.push({ ...user, socketId: socket.id });
      io.emit("updateUsers", connectedUsers);
      if (user.isInRoom && user.isPlaying) {
        socket.join(user.isInRoom);
        let game = rooms.find((r) => r.id === user.isInRoom);
        if (game) {
          // Send current game state to the reconnected client immediately
          socket.emit("updateGame", game);
        }
      }
    }

    socket.on("sendNewConnectedUser", (user) => {
      // console.log((user.username || user.name) + " is connected " + socket.id);

      const existingUserIndex = connectedUsers.findIndex(
        (usr) => usr.username === user.username
      );
      if (existingUserIndex !== -1) {
        connectedUsers[existingUserIndex].socketId = socket.id;
      } else {
        connectedUsers.push({ ...user, socketId: socket.id });
      }
      io.emit("updateUsers", connectedUsers);
      io.emit("updateRooms", rooms);
    });

    const updateGame = (game) => {
      if (game.hasEnded || game.showingRoleReveal) {
        console.log("the game has ended or showing role reveal");
        return;
      } else if (game.isPaused) {
        setTimeout(() => updateGame(game), 1000);
      } else {
        if (game.winningTeam === null) {
          game.timeCounter -= 1000;

          if (game.timeCounter == 0) {
            // if (game.timeOfTheDay == "nighttime") toDayTime(game);
            // else if (game.timeOfTheDay == "daytime") toVoteTime(game);
            // else if (game.timeOfTheDay == "votetime") toNightTime(game);

            if (game.timeOfTheDay == "nighttime") toNightTimeAftermath(game);
            else if (game.timeOfTheDay == "nighttimeAftermath") toDayTime(game);
            else if (game.timeOfTheDay == "daytime") toVoteTime(game);
            else if (game.timeOfTheDay == "votetime") toVoteTimeAftermath(game);
            else if (game.timeOfTheDay == "votetimeAftermath") toNightTime(game);


            // This runs every time when game.timeCounter == 0
            game.playersList = assignCpuRandomSecondToEachCPU(game.playersList);
          }
        } else {
          console.log("and the winner is...");
          console.log(game.winningTeam);
          game.isPaused = true;
        }

        const roomIndex = rooms.findIndex((r) => r.id === game.id);
        if (roomIndex !== -1) {
          rooms[roomIndex] = game;
          io.to(game.id).emit("updateGame", game);
        }

        setTimeout(() => updateGame(game), 1000);
        return;
      }
    };

    const startGame = (roomToJoin, roomId) => {
      // Pass user preferences (including preferred roles) to initialization
      const userPreferences = roomToJoin.usersInTheRoom.map(user => ({
        username: user.username,
        preferredRole: user.preferredRole || null
      }));

      const playersList = initializePlayersList(
        roomToJoin.nbrOfPlayers,
        roomToJoin.selectedRoles,
        roomToJoin.usersInTheRoom,
        roomToJoin.nbrCPUPlayers,
        roomToJoin.isQuickGame,
        userPreferences // Pass preferences to initialization
      );
      roomToJoin = initializeGameObject(roomToJoin, playersList);
      roomToJoin.playersList = assignCpuRandomSecondToEachCPU(
        roomToJoin.playersList
      );

      // Add a flag to indicate role reveal phase
      roomToJoin.showingRoleReveal = true;

      const roomIndex = rooms.findIndex((r) => r.id === roomId);
      if (roomIndex !== -1) {
        rooms[roomIndex] = roomToJoin;
        io.emit("updateRooms", rooms);
      }

      // Emit launchRoom with the flag set
      io.to(roomId).emit("launchRoom", roomToJoin);

      // After 11 seconds, start the actual game countdown
      setTimeout(() => {
        let game = rooms.find((r) => r.id === roomId);
        if (game) {
          game.showingRoleReveal = false;
          rooms[roomIndex] = game;
          io.to(roomId).emit("updateGame", game);
          updateGame(game);
        }
      }, 10000);
    };

    socket.on("createRoom", (newRoom) => {
      rooms.push(newRoom);
      io.emit("updateRooms", rooms);
      let userIndex = connectedUsers.findIndex(
        (usr) => usr.username === newRoom.createdBy
      );
      if (userIndex !== -1) {
        connectedUsers[userIndex] = {
          ...connectedUsers[userIndex],
          isInRoom: newRoom.id,
          isPlaying: true,
        };
      }
      io.emit("updateUsers", connectedUsers);
      socket.join(newRoom.id);

      if (newRoom.usersInTheRoom.length == newRoom.nbrUserPlayers) {
        startGame(newRoom, newRoom.id);
      }
    });

    socket.on("joinRoom", (roomId, userJoining) => {
      let roomToJoin = rooms.find((room) => room.id === roomId);

      if (roomToJoin) {
        roomToJoin.usersInTheRoom.push(userJoining);
        io.emit("updateRooms", rooms);
        let userIndex = connectedUsers.findIndex(
          (usr) => usr.username === userJoining.username
        );

        if (userIndex !== -1) {
          connectedUsers[userIndex] = {
            ...connectedUsers[userIndex],
            isInRoom: roomId,
            isPlaying: true,
          };
        }

        io.emit("updateUsers", connectedUsers);
        socket.join(roomId);

        if (roomToJoin.usersInTheRoom.length == roomToJoin.nbrUserPlayers) {
          startGame(roomToJoin, roomId);
        }
      } else {
        console.log("the room doesn't exist");
      }
    });

    socket.on("startQuickGame", async (username, socketId, avatar) => {
      const rolesData = await getRolesDataForQuickGame(); // Await the function call

      let newQuickRoom = {
        id: Date.now(),
        name: `Quick Game`,
        createdBy: username,
        nbrOfPlayers: 12,
        nbrUserPlayers: 1,
        nbrCPUPlayers: 11,
        selectedRoles: rolesData,
        usersInTheRoom: [{ username, socketId, avatar, preferredRole: null }],
        isLaunched: false,
        isQuickGame: true,
      };

      // update array list of users both in server and client
      let userIndex = connectedUsers.findIndex(
        (usr) => usr.username === username
      );
      if (userIndex !== -1) {
        connectedUsers[userIndex] = {
          ...connectedUsers[userIndex],
          isInRoom: newQuickRoom.id,
          isPlaying: true,
        };
      }
      io.emit("updateUsers", connectedUsers);
      socket.join(newQuickRoom.id);

      // update array list of rooms both in server and client
      rooms.push(newQuickRoom);
      io.emit("updateRooms", rooms);
      // launch game
      startGame(newQuickRoom, newQuickRoom.id);
    });

    socket.on(
      "updateUserGameState",
      (username, newIsInRoom, newIsPlaying, newGame) => {

        console.log("updateUserGameState fn")

        let userIndex = connectedUsers.findIndex(
          (usr) => usr.username === username
        );

        const prevUserState = connectedUsers[userIndex];

        if (userIndex !== -1) {
          connectedUsers[userIndex] = {
            ...connectedUsers[userIndex],
            isInRoom: newIsInRoom,
            isPlaying: newIsPlaying,
            game: newGame,
          };
        }

        // If the user left a room, check if the room needs to be deleted      
        let room = rooms.find((r) => r.id === prevUserState.isInRoom);

        if (room) {
          // Check if there are any real users left
          const hasOtherRealUsers = room.usersInTheRoom.some(
            (u) => u.username !== username
          );
          console.log("does the room have real users?", hasOtherRealUsers);

          if (!hasOtherRealUsers) {
            // Delete the room entirely if no real users are left
            let updatedRooms = rooms.filter((r) => r.id !== room.id);
            rooms = updatedRooms;
            io.emit("updateRooms", rooms);

            // Reset any users still marked in that room (it shouldn't happen normally)
            connectedUsers = connectedUsers.map((u) =>
              u.isInRoom === newIsInRoom
                ? { ...u, isInRoom: null, isPlaying: false }
                : u
            );
          }
        }

        io.emit("updateUsers", connectedUsers);
      }
    );


    socket.on("pauseGame", (roomId) => {
      let game = rooms.find((room) => room.id === roomId);
      if (game) {
        game.isPaused = true;
        setRooms(rooms, game, io, roomId);
      }
    });

    socket.on("endGame", (roomId) => {
      console.log("endGame fn");
      let game = rooms.find((room) => room.id === roomId);
      if (game) {
        game.hasEnded = true;
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
      console.log(action);
      let game = rooms.find((room) => room.id === roomId);
      if (game) {
        editGame(
          game,
          "addVote",
          action,
          `${action.playerName}
          {serverContent.action.message.addVote} 
          ${action.selectedPlayerName}!`
        );
        setRooms(rooms, game, io, roomId);
      }
    });

    socket.on("addWolfVote", (action, roomId) => {
      console.log("addWolfVote fn");
      let game = rooms.find((room) => room.id === roomId);
      if (game) {
        editGame(
          game,
          "addWolfVote",
          action,
          `DEV -- ${action.playerName}
          {serverContent.action.message.addWolfVote} --
          ${action.selectedPlayerName}!`
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
          ${action.selectedPlayerName}!
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

    socket.on("heal", (action, roomId) => {
      let game = rooms.find((room) => room.id === roomId);
      if (game) {
        editGame(game, "heal", action);
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
          `{serverContent.action.message.graveRobber} ${action.selectedPlayerName}!`
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
        console.log("game is undefined in checkForWinner");
        return;
      }
      if (game.aliveList === null) {
        game.aliveList = game.playersList.filter((p) => p.isAlive);
      }
      let winner = checkForWinner(game.aliveList);
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
      game.registeredActions.push(actionObject);
      setRooms(rooms, game, io, roomId);
    });

    socket.on("deleteRoom", (roomId) => {
      updatedRooms = rooms.filter((room) => room.id !== roomId);
      rooms = updatedRooms;
      io.emit("updateRooms", rooms);
      io.emit("updateUsers", connectedUsers);
    });

    socket.on("disconnect", () => {
      console.log(" socket.on(disconnect " + socket.id);

      console.log("connectedUsers after disconnect:");
      console.log(connectedUsers.map((usr) => usr.username))
      console.log("rooms after disconnect:")
      console.log(rooms.map((room) => room.id + " " + room.name));
    });

    socket.on("logout", () => {
      console.log("logout fn");

      const user = connectedUsers.find(
        (usr) => usr.socketId === socket.id
      );

      connectedUsers = connectedUsers.filter(
        (usr) => usr.socketId !== socket.id
      );

      // If the user left a room, check if the room needs to be deleted      
      let room = rooms.find((r) => r.id === user.isInRoom);

      if (room) {
        // Check if there are any real users left
        const hasOtherRealUsers = room.usersInTheRoom.some(
          (u) => u.username !== user.username
        );
        console.log("does the room have real users?", hasOtherRealUsers);

        if (!hasOtherRealUsers) {
          // Delete the room entirely if no real users are left
          let updatedRooms = rooms.filter((r) => r.id !== room.id);
          rooms = updatedRooms;
          io.emit("updateRooms", rooms);

          // Reset any users still marked in that room (it shouldn't happen normally)
          connectedUsers = connectedUsers.map((u) =>
            u.isInRoom === user.isInRoom
              ? { ...u, isInRoom: null, isPlaying: false }
              : u
          );
        }
      }

      io.emit("updateUsers", connectedUsers);

      console.log("connectedUsers after logout:");
      console.log(connectedUsers.map((usr) => usr.username))
      console.log("rooms after logout:")
      console.log(rooms.map((room) => room.id + " " + room.name));

    });
  });
};

module.exports = socketManager;
