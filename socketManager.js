const { checkForWinner } = require("./lib/gameActions");
const { getCurrentTime } = require("./lib/utils");
const { toVoteTime, toNightTime, toDayTime } = require("./lib/timeOfTheDay");
const {
  initializeGameObject,
  initializePlayersList,
  setRooms,
  editGame,
} = require("./lib/gameSetup");
const { voteAgainst, wolfVoteAgainst } = require("./lib/gameActions/vote");
const { getRolesDataForQuickGame } = require("./controllers/roles");

const socketManager = (io, rooms, connectedUsers) => {
  io.on("connection", (socket) => {
    const token = socket.handshake.query.token;

    const updateGame = (game) => {
      if (game.hasEnded) {
        console.log("the game has ended");
        return;
      } else if (game.isPaused) {
        setTimeout(() => updateGame(game), 1000);
      } else {
        if (game.winningTeam === null) {
          game.timeCounter -= 1000;

          if (game.timeCounter == 0) {
            if (game.timeOfTheDay == "nighttime") toDayTime(game);
            else if (game.timeOfTheDay == "daytime") toVoteTime(game);
            else if (game.timeOfTheDay == "votetime") toNightTime(game);
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
      const playersList = initializePlayersList(
        roomToJoin.nbrOfPlayers,
        roomToJoin.selectedRoles,
        roomToJoin.usersInTheRoom,
        roomToJoin.nbrCPUPlayers
      );
      roomToJoin = initializeGameObject(roomToJoin, playersList);
      const roomIndex = rooms.findIndex((r) => r.id === roomId);
      if (roomIndex !== -1) {
        rooms[roomIndex] = roomToJoin;
        io.emit("updateRooms", rooms);
      }
      io.to(roomId).emit("launchRoom", roomToJoin);

      let game;
      game = rooms.find((r) => r.id === roomId);
      if (game) updateGame(game);
    };

    // verify if the user is already connected and having a socket change, if yes just updated his socketId
    if (connectedUsers.some((usr) => usr.token === token)) {
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
        nbrOfPlayers: 9,
        nbrUserPlayers: 1,
        nbrCPUPlayers: 8,
        selectedRoles: rolesData,
        usersInTheRoom: [{ username, socketId, avatar }],
        isLaunched: false,
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
        // console.log("updateUserGameState fn");
        let userIndex = connectedUsers.findIndex(
          (usr) => usr.username === username
        );
        if (userIndex !== -1) {
          connectedUsers[userIndex] = {
            ...connectedUsers[userIndex],
            isInRoom: newIsInRoom,
            isPlaying: newIsPlaying,
            game: newGame,
          };
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

    socket.on("heal", (action, roomId) => {
      let game = rooms.find((room) => room.id === roomId);
      if (game) {
        editGame(game, "heal", action);
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
      }
    });

    socket.on("addVote", (selectedPlayerId, nbr, roomId) => {
      let game = rooms.find((room) => room.id === roomId);
      if (game) {
        game.playersList = voteAgainst(selectedPlayerId, game.playersList, nbr);
        setRooms(rooms, game, io, roomId);
      }
    });

    socket.on("addWolfVote", (selectedPlayerId, nbr, roomId) => {
      console.log("addWolfVote fn");
      let game = rooms.find((room) => room.id === roomId);
      if (game) {
        game.playersList = wolfVoteAgainst(
          selectedPlayerId,
          game.playersList,
          nbr
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

    socket.on("chooseJuniorWolfDeathRevenge", (actionObj, roomId) => {
      let game = rooms.find((room) => room.id === roomId);
      if (game) {
        editGame(game, "chooseJuniorWolfDeathRevenge", actionObj, null);
        setRooms(rooms, game, io, roomId);
      }
    });

    socket.on("checkForWinner", (roomId) => {
      let game = rooms.find((room) => room.id === roomId);
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
      // console.log("connectedUsers when deleteRoom:");
      // console.log(connectedUsers);
      io.emit("updateUsers", connectedUsers);
    });

    socket.on("disconnect", () => {
      // console.log("User disconnected " + socket.id);
    });

    socket.on("logout", () => {
      connectedUsers = connectedUsers.filter(
        (usr) => usr.socketId !== socket.id
      );
      io.emit("updateUsers", connectedUsers);
      // console.log("connectedUsers on logout:");
      // console.log(connectedUsers);
    });
  });
};

module.exports = socketManager;
