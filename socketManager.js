const { checkForWinner } = require("./lib/gameActions");
const { getCurrentTime } = require("./lib/utils");
const { toVoteTime, toNightTime, toDayTime } = require("./lib/timeOfTheDay");
const {
  initializeGameObject,
  initializePlayersList,
  setGames,
  editGame,
} = require("./lib/gameSetup");
const { voteAgainst, wolfVoteAgainst } = require("./lib/gameActions/vote");

const socketManager = (io, rooms, connectedUsers, games) => {
  io.on("connection", (socket) => {
    // Extract the token from the query parameters
    const token = socket.handshake.query.token;

    // io.emit("updateUsers", connectedUsers);
    // io.emit("updateRooms", rooms);

    // verify if the user is already connected and having a socket change, if yes just updated his socketId
    if (connectedUsers.some((usr) => usr.token === token)) {
      let user = connectedUsers.find((usr) => usr.token === token);
      connectedUsers = connectedUsers.filter((usr) => usr.token !== token);
      connectedUsers.push({ ...user, socketId: socket.id });
      io.emit("updateUsers", connectedUsers);
    }

    socket.on("sendNewConnectedUser", (user) => {
      console.log("new connected user");
      console.log((user.username || user.name) + " is connected " + socket.id);
      const existingUserIndex = connectedUsers.findIndex(
        (usr) => usr.username === user.username
      );
      if (existingUserIndex !== -1) {
        connectedUsers[existingUserIndex].socketId = socket.id;
      } else {
        connectedUsers.push({ ...user, socketId: socket.id });
      }
      io.emit("updateUsers", connectedUsers);
      io.emit("updateRooms", rooms); // this is to send the state of all rooms to a newly connected user
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

    const startGame = (roomToJoin, roomId) => {
      const playersList = initializePlayersList(
        roomToJoin.nbrOfPlayers,
        roomToJoin.selectedRoles,
        roomToJoin.usersInTheRoom,
        roomToJoin.nbrCPUPlayers
      );
      roomToJoin = initializeGameObject(roomToJoin, playersList);
      const newRooms = rooms.filter((r) => r.id != roomId);
      rooms = newRooms;
      rooms.push(roomToJoin);
      io.emit("updateRooms", rooms);
      games.push(roomToJoin);
      io.to(roomId).emit("launchRoom", roomToJoin);

      let game;

      // console.log(`game ${roomId} is paused`);
      function updateGame() {
        game = games.find((room) => room.id === roomId);

        if (game.hasEnded) {
          console.log("the game has ended");
        } else if (game.isPaused) {
          setTimeout(updateGame, 1000);
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

          const newGames = games.filter((r) => r.id != roomId);
          games = newGames;
          games.push(game);
          io.to(roomId).emit("updateGame", game);
          setTimeout(updateGame, 1000);
        }
      }
      updateGame();
    };

    socket.on("pauseGame", (roomId) => {
      console.log("pauseGame fn");
      let game = games.find((room) => room.id === roomId);
      if (game) {
        game.isPaused = true;
        setGames(games, game, io, roomId);
      }
    });

    socket.on("endGame", (roomId) => {
      console.log("endGame fn");
      let game = games.find((room) => room.id === roomId);
      if (game) {
        game.hasEnded = true;
        setGames(games, game, io, roomId);
      }
    });

    socket.on("resumeGame", (roomId) => {
      console.log("resumeGame fn");
      let game = games.find((room) => room.id === roomId);
      if (game) {
        game.isPaused = false;
        setGames(games, game, io, roomId);
      }
    });

    socket.on("revealPlayer", (action, roomId) => {
      let game = games.find((room) => room.id === roomId);
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
        setGames(games, game, io, roomId);
      }
    });

    socket.on("executePrisoner", (action, roomId) => {
      let game = games.find((room) => room.id === roomId);
      if (game) {
        editGame(
          game,
          "execute",
          action,
          `{serverContent.action.message.executePrisoner} 
          ${action.selectedPlayerName}!`
        );
        setGames(games, game, io, roomId);
      }
    });

    socket.on("heal", (action, roomId) => {
      let game = games.find((room) => room.id === roomId);
      if (game) {
        editGame(game, "heal", action);
        setGames(games, game, io, roomId);
      }
    });

    socket.on("shootBullet", (action, roomId) => {
      let game = games.find((room) => room.id === roomId);
      if (game) {
        editGame(
          game,
          "shoot",
          action,
          `{serverContent.action.message.shootBullet} ${action.selectedPlayerName}.`
        );
        setGames(games, game, io, roomId);
      }
    });

    socket.on("addVote", (selectedPlayerId, nbr, roomId) => {
      let game = games.find((room) => room.id === roomId);
      if (game) {
        game.playersList = voteAgainst(selectedPlayerId, game.playersList, nbr);
        setGames(games, game, io, roomId);
      }
    });

    socket.on("addWolfVote", (selectedPlayerId, nbr, roomId) => {
      let game = games.find((room) => room.id === roomId);
      if (game) {
        game.playersList = wolfVoteAgainst(
          selectedPlayerId,
          game.playersList,
          nbr
        );
        setGames(games, game, io, roomId);
      }
    });

    socket.on("assertDuty", (mayorName, roomId) => {
      let game = games.find((room) => room.id === roomId);
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
        setGames(games, game, io, roomId);
      }
    });

    socket.on("chooseJuniorWolfDeathRevenge", (actionObj, roomId) => {
      let game = games.find((room) => room.id === roomId);
      if (game) {
        editGame(game, "chooseJuniorWolfDeathRevenge", actionObj, null);
        setGames(games, game, io, roomId);
      }
    });

    socket.on("checkForWinner", (roomId) => {
      let game = games.find((room) => room.id === roomId);
      if (game.aliveList == null) {
        game.aliveList = game.playersList.filter((p) => p.isAlive);
      }
      let winner = checkForWinner(game.aliveList);
      if (winner !== null) {
        game.winningTeam = winner;
        setGames(games, game, io, roomId);
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
        let game = games.find((room) => room.id === roomId);
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
        setGames(games, game, io, roomId);
      }
    );

    socket.on("registerAction", (actionObject, roomId) => {
      console.log("registerAction fn");
      let game = games.find((room) => room.id === roomId);
      game.registeredActions.push(actionObject);
      setGames(games, game, io, roomId);
    });

    socket.on("deleteRoom", (roomId) => {
      updatedRooms = rooms.filter((room) => room.id !== roomId);
      rooms = updatedRooms;
      io.emit("updateRooms", rooms);
      console.log("connectedUsers when deleteRoom:");
      console.log(connectedUsers);
      io.emit("updateUsers", connectedUsers);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected " + socket.id);
    });

    socket.on("logout", () => {
      connectedUsers = connectedUsers.filter(
        (usr) => usr.socketId !== socket.id
      );
      io.emit("updateUsers", connectedUsers);
      console.log("connectedUsers on logout:");
      console.log(connectedUsers);
    });
  });
};

module.exports = socketManager;
