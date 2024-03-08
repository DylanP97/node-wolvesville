const http = require("http");
const app = require("./index");
const socketIO = require("socket.io");
const { checkForWinner, voteAgainst, revealPlayer, wolfVoteAgainst, heal, killPrisoner } = require("./lib/gameActions");
const { getCurrentTime } = require("./lib/utils");
const { toVoteTime, toNightTime, toDayTime } = require("./lib/timeOfTheDay");
const { initializeGameObject, initializePlayersList } = require("./lib/gameSetup");

const normalizePort = (val) => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};
const port = normalizePort(process.env.PORT);
app.set("port", port);

const errorHandler = (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }
  const address = server.address();
  const bind = typeof address === "string" ? "pipe s" + address : "port: " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges.");
      process.exit(1);
    case "EADDRINUSE":
      console.error(bind + " is already in use.");
      process.exit(1);
    default:
      throw error;
  }
};

const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});


// server store
let rooms = [];
let connectedUsers = [];
let games = [];

io.on("connection", (socket) => {
  socket.on("sendNewConnectedUser", (user) => {
    connectedUsers.push(user);
    console.log("A user connected " + user.username)
    io.emit("updateUsers", connectedUsers);
    io.emit("updateRooms", rooms);
  })

  socket.on("createRoom", (newRoom) => {
    rooms.push(newRoom);
    io.emit("updateRooms", rooms);
    let userIndex = connectedUsers.findIndex((usr) => usr.username === newRoom.createdBy);
    if (userIndex !== -1) {
      connectedUsers[userIndex] = {
        ...connectedUsers[userIndex],
        isInRoom: newRoom.id
      }
    }
    io.emit("updateUsers", connectedUsers);
    socket.join(newRoom.id)
  });

  socket.on("joinRoom", (roomId, userJoining) => {
    let roomToJoin = rooms.find((room) => room.id === roomId);

    if (roomToJoin) {
      roomToJoin.usersInTheRoom.push(userJoining)
      io.emit("updateRooms", rooms);
      let userIndex = connectedUsers.findIndex((usr) => usr.username === userJoining.username);

      if (userIndex !== -1) {
        connectedUsers[userIndex] = {
          ...connectedUsers[userIndex],
          isInRoom: roomId
        }
      };

      io.emit("updateUsers", connectedUsers);
      socket.join(roomId);

      if (roomToJoin.usersInTheRoom.length == roomToJoin.nbrOfPlayers) {
        const playersList = initializePlayersList(
          roomToJoin.nbrOfPlayers,
          roomToJoin.selectedRoles,
          roomToJoin.usersInTheRoom
        );
        roomToJoin = initializeGameObject(roomToJoin, playersList)
        const newRooms = rooms.filter((r) => r.id != roomId)
        rooms = newRooms;
        rooms.push(roomToJoin)
        io.emit("updateRooms", rooms);
        games.push(roomToJoin);
        io.to(roomId).emit('launchRoom', roomToJoin);

        let game

        function updateGame() {
          game = games.find((room) => room.id === roomId);

          if (game.winningTeam == null) {
            game.timeCounter -= 1000;

            if (game.timeCounter == 0) {
              if (game.timeOfTheDay == "nighttime") toDayTime(game)
              else if (game.timeOfTheDay == "daytime") toVoteTime(game)
              else if (game.timeOfTheDay == "votetime") toNightTime(game)
            };
          }

          const newGames = games.filter((r) => r.id != roomId)
          games = newGames;
          games.push(game);
          io.to(roomId).emit('updateGame', game);
          setTimeout(updateGame, 1000);
        }
        updateGame();
      }
    } else {
      console.log("the room doesn't exist")
    }

  });

  socket.on("playerKill", (roomId, name) => {
    let gameToUpdate = games.find((room) => room.id === roomId);
    if (gameToUpdate) {
      let newPlayerList = gameToUpdate.playersList;
      newPlayerList = newPlayerList.map((ply) => {
        if (ply.name == name) {
          return {
            ...ply,
            isAlive: false,
          }
        } else {
          return ply;
        }
      });
      let newAliveList = gameToUpdate.aliveList;
      newAliveList = newPlayerList.filter((p) => p.isAlive)
      gameToUpdate = {
        ...gameToUpdate,
        playersList: newPlayerList,
        aliveList: newAliveList
      };
      const newGames = games.filter((r) => r.id != roomId)
      games = newGames;
      games.push(gameToUpdate);
      io.to(roomId).emit("updateGame", gameToUpdate);
    }
  });

  socket.on("revealPlayer", (actionObject, roomId) => {
    let gameToUpdate = games.find((room) => room.id === roomId);
    if (gameToUpdate) {
      let newPlayerList = gameToUpdate.playersList;
      newPlayerList = revealPlayer(actionObject, newPlayerList);
      let newAliveList = gameToUpdate.aliveList;
      newAliveList = newPlayerList.filter((p) => p.isAlive);
      gameToUpdate = {
        ...gameToUpdate,
        playersList: newPlayerList,
        aliveList: newAliveList
      };
      gameToUpdate.messagesHistory.unshift({ time: getCurrentTime(), author: "", msg: `The seer's magical crystal ball unveiled the identity of ${actionObject.selectedPlayerName}! 👁️` });
      const newGames = games.filter((r) => r.id != roomId)
      games = newGames;
      games.push(gameToUpdate);
      io.to(roomId).emit("updateGame", gameToUpdate);
    }
  });

  socket.on("killPrisoner", (actionObject, roomId) => {
    console.log("helloo killPrisoner function !")

    let gameToUpdate = games.find((room) => room.id === roomId);
    if (gameToUpdate) {
      let newPlayerList = gameToUpdate.playersList;
      newPlayerList = killPrisoner(newPlayerList);
      gameToUpdate.messagesHistory.unshift({ time: getCurrentTime(), author: "", msg: `The jailer executed its last night prisoner named ${actionObject.selectedPlayerName} 💀` })
      gameToUpdate.playersList = newPlayerList
      const newGames = games.filter((r) => r.id != roomId)
      games = newGames;
      games.push(gameToUpdate);
      io.to(roomId).emit("updateGame", gameToUpdate);
    }
  })

  socket.on("heal", (actionObject, roomId) => {
    console.log("helloo heal function !")

    let gameToUpdate = games.find((room) => room.id === roomId);
    if (gameToUpdate) {
      let newPlayerList = gameToUpdate.playersList;
      newPlayerList = heal(actionObject, newPlayerList);
      gameToUpdate.playersList = newPlayerList
      const newGames = games.filter((r) => r.id != roomId)
      games = newGames;
      games.push(gameToUpdate);
      io.to(roomId).emit("updateGame", gameToUpdate);
    }
  })

  socket.on("checkForWinner", (roomId) => {
    let gameToUpdate = games.find((room) => room.id === roomId);
    if (gameToUpdate.aliveList == null) {
      gameToUpdate.aliveList = gameToUpdate.playersList.filter((p) => p.isAlive)
    };
    let winner = checkForWinner(gameToUpdate.aliveList);
    if (winner != null) {
      gameToUpdate.winningTeam = winner;
      const newGames = games.filter((r) => r.id != roomId)
      games = newGames;
      games.push(gameToUpdate);
      io.to(roomId).emit("updateGame", gameToUpdate);
    }
  });

  socket.on("deleteRoom", (roomId) => {
    updatedRooms = rooms.filter((room) => room.id !== roomId)
    rooms = updatedRooms;
    io.emit("updateRooms", rooms);
  });

  socket.on("sendMessage", (msg, roomId, username, isWolvesChat, isJailerChat, isJailer) => {
    let gameToUpdate = games.find((room) => room.id === roomId);
    if (isJailerChat) {
      const authorN = isJailer ? "Jailer" : username
      gameToUpdate.jailNightMessages.unshift({ time: getCurrentTime(), author: authorN, msg: msg })
    } else if (isWolvesChat) {
      gameToUpdate.wolvesMessagesHistory.unshift({ time: getCurrentTime(), author: username, msg: msg })
    } else {
      gameToUpdate.messagesHistory.unshift({ time: getCurrentTime(), author: username, msg: msg });
    }
    const newGames = games.filter((r) => r.id != roomId)
    games = newGames;
    games.push(gameToUpdate);
    io.to(roomId).emit("updateGame", gameToUpdate);
  });

  socket.on("addVote", (selectedPlayerId, nbr, roomId) => {
    let gameToUpdate = games.find((room) => room.id === roomId);
    const newPlayersList = voteAgainst(selectedPlayerId, gameToUpdate.playersList, nbr);
    const newGames = games.filter((r) => r.id != roomId)
    games = newGames;
    gameToUpdate.playersList = newPlayersList;
    games.push(gameToUpdate);
    io.to(roomId).emit("updateGame", gameToUpdate);
  });

  socket.on("addWolfVote", (selectedPlayerId, nbr, roomId) => {
    let gameToUpdate = games.find((room) => room.id === roomId);
    const newPlayersList = wolfVoteAgainst(selectedPlayerId, gameToUpdate.playersList, nbr);
    const newGames = games.filter((r) => r.id != roomId)
    games = newGames;
    gameToUpdate.playersList = newPlayersList;
    games.push(gameToUpdate);
    io.to(roomId).emit("updateGame", gameToUpdate);
  });

  socket.on("registerAction", (actionObject, roomId) => {
    let gameToUpdate = games.find((room) => room.id === roomId);
    gameToUpdate.registeredActions.push(actionObject);
    const newGames = games.filter((r) => r.id != roomId)
    games = newGames;
    games.push(gameToUpdate);
    io.to(roomId).emit("updateGame", gameToUpdate);
  });

  socket.on("disconnect", () => {
    let user = connectedUsers.indexOf(connectedUsers.find(user => user.socketId == socket.id))
    console.log("User disconnected " + socket.id);
    connectedUsers.splice((user), 1);
    io.emit("updateUsers", connectedUsers);
  });
});

server.on("error", errorHandler);
server.on("listening", () => {
  const address = server.address();
  const bind = typeof address === "string" ? "pipe " + address : "port " + port;
  console.log("Listening on " + bind);
});

server.listen(port);