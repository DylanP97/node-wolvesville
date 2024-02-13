const http = require("http");
const app = require("./index");
const socketIO = require("socket.io");
const { initializePlayersList } = require("./gameEvents");
const { checkForWinner, murder } = require("./lib/gameActions");

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

let rooms = [];
let connectedUsers = [];
let games = [];

io.on("connection", (socket) => {
  socket.on("sendNewConnectedUser", (user) => {
    connectedUsers.push(user);
    console.log("A user connected " + socket.id + " " + user.username)
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
        roomToJoin = {
          ...roomToJoin,
          playersList: playersList,
          newAliveList: playersList.filter((p) => p.isAlive),
          dayCount: 0,
          timeOfTheDay: "nighttime",
          timeCounter: 20000,
          registeredActions: [],
          winningTeam: null,
          messagesHistory: []
        };
        const newRooms = rooms.filter((r) => r.id != roomId)
        rooms = newRooms;
        rooms.push(roomToJoin)
        io.emit("updateRooms", rooms);
        games.push(roomToJoin);
        io.to(roomId).emit('launchRoom', roomToJoin);

        let gameToUpdate

        function updateGame() {
          gameToUpdate = games.find((room) => room.id === roomId);

          if (gameToUpdate.winningTeam == null) {
            gameToUpdate.timeCounter -= 1000;
            if (gameToUpdate.timeCounter == 0) {
              if (gameToUpdate.timeOfTheDay == "nighttime") {
                let newPlayersList
                gameToUpdate.registeredActions.forEach((action) => {
                  if (action.type === "murder") {
                    newPlayersList = gameToUpdate.playersList.map((ply) => {
                      if (ply.id === action.selectedPlayerId) {
                        return {
                          ...ply,
                          isAlive: false,
                        }
                      } else {
                        return ply;
                      }
                    })
                  }
                });
                if (newPlayersList) {
                  gameToUpdate.playersList = newPlayersList;
                  gameToUpdate.newAliveList = newPlayersList.filter((p) => p.isAlive)
                }
                gameToUpdate.timeOfTheDay = "daytime"
                gameToUpdate.timeCounter = 10000
                gameToUpdate.dayCount += 1
                gameToUpdate.messagesHistory.push({ author: "Game", msg: "It's a new day here in the village." })
              } else if (gameToUpdate.timeOfTheDay == "daytime") {
                gameToUpdate.timeCounter = 15000
                gameToUpdate.timeOfTheDay = "votetime"
                gameToUpdate.messagesHistory.push({ author: "Game", msg: "It's time to vote." })
              } else if (gameToUpdate.timeOfTheDay == "votetime") {
                gameToUpdate.timeCounter = 30000
                gameToUpdate.timeOfTheDay = "nighttime"
                gameToUpdate.messagesHistory.push({ author: "Game", msg: "Beware it's night..." })
              };
            }
            const newGames = games.filter((r) => r.id != roomId)
            games = newGames;
            games.push(gameToUpdate);
            io.to(roomId).emit('updateGame', gameToUpdate);
            setTimeout(updateGame, 1000);
          }
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

  socket.on("playerReveal", (roomId, name) => {
    let gameToUpdate = games.find((room) => room.id === roomId);
    if (gameToUpdate) {
      let newPlayerList = gameToUpdate.playersList;
      newPlayerList = newPlayerList.map((ply) => {
        if (ply.name == name) {
          return {
            ...ply,
            isRevealed: true,
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

  socket.on("sendMessage", (msg, roomId, username) => {
    let gameToUpdate = games.find((room) => room.id === roomId);
    gameToUpdate.messagesHistory.push({ author: username, msg: msg })
    const newGames = games.filter((r) => r.id != roomId)
    games = newGames;
    games.push(gameToUpdate);
    io.to(roomId).emit("updateGame", gameToUpdate);
  });

  socket.on("registerAction", (actionObject) => {
    let gameToUpdate = games.find((room) => room.id === roomId);

    gameToUpdate.registeredActions.push(actionObject);

    const newGames = games.filter((r) => r.id != roomId)
    games = newGames;
    games.push(gameToUpdate);
    io.to(roomId).emit("updateGame", gameToUpdate);
  })

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