const http = require("http");
const app = require("./index");
const socketIO = require("socket.io");
const { initializePlayersList } = require("./gameEvents");
const { checkForWinner } = require("./lib/gameActions");

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
      }
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
          timeOfTheDay: "nighttime",
          dayCount: 0,
          aliveList: null, 
          playerToPlay: playersList[0],
          registeredActions: [], 
          winningTeam: null,
        };
        const newRooms = rooms.filter((r) => r.id != roomId)
        rooms = newRooms;
        rooms.push(roomToJoin)
        io.emit("updateRooms", rooms);
        games.push(roomToJoin);
        io.to(roomId).emit('launchRoom', roomToJoin);
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
      gameToUpdate = {
        ...gameToUpdate,
        playersList: newPlayerList
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

  socket.on("chat message", (msg) => {
    console.log("Message: " + msg);
    const userId = socket.id;
    io.emit("chat message", { msg, userId });
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