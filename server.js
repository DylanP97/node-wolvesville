const http = require("http");
const app = require("./index");
const socketIO = require("socket.io");
const { initializePlayersList } = require("./gameEvents");
const { checkForWinner, murder, voteAgainst, revealPlayer, wolfVoteAgainst, arrestPlayer, releasePrisoners, handleWolvesVote, handleVote } = require("./lib/gameActions");

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
      // console.log("user joining: ")
      // console.log(userJoining)
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
          messagesHistory: [],
          wolvesMessagesHistory: [],
          jailNightMessages: []
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
                //--------- DAYTIME ---------------------------------------------------
                let newPlayersList = gameToUpdate.playersList
                let newMessagesHistory = gameToUpdate.messagesHistory
                let newWinningTeam = gameToUpdate.winningTeam

                newPlayersList = releasePrisoners(newPlayersList);

                gameToUpdate.registeredActions.forEach((action) => {
                  if (action.type === "murder") {
                    const { newPlayersListEdited, newMessagesHistoryEdited } = murder(newPlayersList, newMessagesHistory, action)
                    newPlayersList = newPlayersListEdited
                    newMessagesHistory = newMessagesHistoryEdited
                    gameToUpdate.registeredActions = [...gameToUpdate.registeredActions.filter((a) => a !== action)];
                  }
                });

                const { playersList, messagesHistory, winningTeam } = handleWolvesVote(newPlayersList, newMessagesHistory, newWinningTeam)

                newPlayersList = playersList;
                newMessagesHistory = messagesHistory
                newWinningTeam = winningTeam

                gameToUpdate.playersList = newPlayersList;
                gameToUpdate.aliveList = newPlayersList.filter((p) => p.isAlive);
                gameToUpdate.timeOfTheDay = "daytime"
                gameToUpdate.timeCounter = 30000
                gameToUpdate.dayCount += 1
                gameToUpdate.jailNightMessages = []
                newMessagesHistory.push({ author: "", msg: "It's a new day here in the village." })
                gameToUpdate.messagesHistory = newMessagesHistory
                gameToUpdate.winningTeam = newWinningTeam

              } else if (gameToUpdate.timeOfTheDay == "daytime") {
                //---------- VOTETIME ------------------------------------------------------------
                gameToUpdate.timeCounter = 30000
                gameToUpdate.timeOfTheDay = "votetime"
                gameToUpdate.messagesHistory.push({ author: "", msg: "It's time to vote." })

              } else if (gameToUpdate.timeOfTheDay == "votetime") {
                //--------- NIGHTTIME -----------------------------------------------------------
                let newPlayersList = gameToUpdate.playersList;
                let newMessagesHistory = gameToUpdate.messagesHistory
                let newWinningTeam = gameToUpdate.winningTeam

                gameToUpdate.registeredActions.forEach((action) => {
                  if (action.type === "arrest") {
                    newPlayersList = arrestPlayer(newPlayersList, action);
                  }
                });

                const { playersList, messagesHistory, winningTeam } = handleVote(newPlayersList, newMessagesHistory, newWinningTeam)

                newPlayersList = playersList;
                newMessagesHistory = messagesHistory
                newWinningTeam = winningTeam

                newMessagesHistory.push({ author: "", msg: "Beware it's night..." })
                gameToUpdate.timeCounter = 30000
                gameToUpdate.timeOfTheDay = "nighttime"
                gameToUpdate.playersList = newPlayersList;
                gameToUpdate.aliveList = newPlayersList.filter((p) => p.isAlive);
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
      gameToUpdate.messagesHistory.push({ author: "", msg: `The seer's magical crystal ball unveiled the identity of ${actionObject.selectedPlayerName}!` });
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

  socket.on("sendMessage", (msg, roomId, username, isWolvesChat, isJailerChat, isJailer) => {
    let gameToUpdate = games.find((room) => room.id === roomId);
    if (isJailerChat) {
      const authorN = isJailer ? "Jailer" : username
      gameToUpdate.jailNightMessages.push({ author: authorN, msg: msg })
    } else if (isWolvesChat) {
      gameToUpdate.wolvesMessagesHistory.push({ author: username, msg: msg })
    } else {
      gameToUpdate.messagesHistory.push({ author: username, msg: msg });
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