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
    socket.on("sendNewConnectedUser", (user) => {
      console.log((user.username || user.name) + " is connected");
      // console.log("user: ", user);
      connectedUsers.push(user);
      // console.log("connectedUsers: ", connectedUsers);
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

      function updateGame() {
        game = games.find((room) => room.id === roomId);

        if (game.winningTeam === null) {
          game.timeCounter -= 1000;

          if (game.timeCounter == 0) {
            if (game.timeOfTheDay == "nighttime") toDayTime(game);
            else if (game.timeOfTheDay == "daytime") toVoteTime(game);
            else if (game.timeOfTheDay == "votetime") toNightTime(game);
          }
        }

        const newGames = games.filter((r) => r.id != roomId);
        games = newGames;
        games.push(game);
        io.to(roomId).emit("updateGame", game);
        setTimeout(updateGame, 1000);
      }
      updateGame();
    };

    socket.on("revealPlayer", (action, roomId) => {
      let game = games.find((room) => room.id === roomId);
      if (game) {
        editGame(
          game,
          "reveal",
          action,
          `The seer's magical crystal ball unveiled the identity of ${action.selectedPlayerName}! 👁️`
        );
        setGames(games, game, io, roomId);
      }
    });

    socket.on("killPrisoner", (action, roomId) => {
      let game = games.find((room) => room.id === roomId);
      if (game) {
        editGame(
          game,
          "execute",
          action,
          `The jailer executed its last night prisoner named ${action.selectedPlayerName} 💀`
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
          `The gunner shot ${action.selectedPlayerName}. 💀`
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
      console.log("addWolfVote called");

      let game = games.find((room) => room.id === roomId);
      if (game) {
        game.playersList = wolfVoteAgainst(
          selectedPlayerId,
          game.playersList,
          nbr
        );

        console.log(game.playersList);
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
      (msg, roomId, username, isWolvesChat, isJailerChat, isJailer) => {
        let game = games.find((room) => room.id === roomId);
        if (isJailerChat) {
          const authorN = isJailer ? "Jailer" : username;
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
      console.log("hi registerAction");
      let game = games.find((room) => room.id === roomId);
      game.registeredActions.push(actionObject);
      setGames(games, game, io, roomId);
    });

    socket.on("deleteRoom", (roomId) => {
      updatedRooms = rooms.filter((room) => room.id !== roomId);
      rooms = updatedRooms;
      io.emit("updateRooms", rooms);
    });

    socket.on("disconnect", () => {
      let user = connectedUsers.indexOf(
        connectedUsers.find((user) => user.socketId == socket.id)
      );
      console.log("User disconnected " + socket.id);
      connectedUsers.splice(user, 1);
      io.emit("updateUsers", connectedUsers);
    });
  });
};

module.exports = socketManager;
