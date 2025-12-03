const {
  toVoteTime,
  toNightTime,
  toVoteTimeAftermath,
  toNightTimeAftermath,
  toDayTime,
  assignRandomSecondToEachCPU,
} = require("./lib/timeOfTheDay");
const {
  initializeGameObject,
  initializePlayersList,
  setRooms,
} = require("./lib/gameSetup");
const { getRolesDataForQuickGame } = require("./controllers/roles");
const cleanupOldRooms = require("./lib/cleanupOldRooms");
const inGameEmits = require("./inGameEmits");

const socketManager = (io, rooms, connectedUsers) => {

  // Run cleanup every 3 minutes
  setInterval(() => {
    cleanupOldRooms(io, rooms, connectedUsers);
  }, 3 * 60 * 1000);

  // Also cleanup on initial load
  cleanupOldRooms(io, rooms, connectedUsers);

  io.on("connection", (socket) => {

    // console.log("connectedUsers socket connection: ", connectedUsers.map((usr) => usr.username));
    // console.log("rooms socket connection: ", rooms.map((room) => room.id + " " + room.name))

    console.log("New client connected:", socket.id);
    const token = socket.handshake.query.token;
    console.log("is it some user trying to reconnect with token ? ", (connectedUsers.some((usr) => usr.token === token)));
    // verify if the user is already connected and having a socket change, if yes just updated his socketId
    if (connectedUsers.some((usr) => usr.token === token)) {
      const userIndex = connectedUsers.findIndex((usr) => usr.token === token);
      if (userIndex !== -1) {
        const user = connectedUsers[userIndex];

        // Update socket ID
        connectedUsers[userIndex] = { ...user, socketId: socket.id };

        console.log(`User ${user.username} reconnected`);

        // Rejoin room if they were in one
        if (user.isInRoom) {
          const game = rooms.find((r) => r.id === user.isInRoom);

          if (game) {
            socket.join(user.isInRoom);

            if (user.isPlaying) {
              socket.emit("updateGame", game);
              console.log(`Restored game state for ${user.username}`);
            } else {
              console.log(`User ${user.username} is not playing but is in the room ${user.isInRoom}`);
            }
          } else {
            // Room no longer exists
            console.log(`Room ${user.isInRoom} no longer exists`);
            connectedUsers[userIndex].isInRoom = null;
            connectedUsers[userIndex].isPlaying = false;
            socket.emit("roomClosed", { message: "The room you were in has closed" });
          }
        }

        io.emit("updateUsers", connectedUsers);
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
            if (game.timeOfTheDay == "nighttime") toNightTimeAftermath(game);
            else if (game.timeOfTheDay == "nighttimeAftermath") toDayTime(game);
            else if (game.timeOfTheDay == "daytime") toVoteTime(game);
            else if (game.timeOfTheDay == "votetime") toVoteTimeAftermath(game);
            else if (game.timeOfTheDay == "votetimeAftermath") toNightTime(game);

            // This runs every time when game.timeCounter == 0
            game.playersList = assignRandomSecondToEachCPU(game.playersList);
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
      roomToJoin.playersList = assignRandomSecondToEachCPU(
        roomToJoin.playersList
      );

      // Add a flag to indicate role reveal phase
      roomToJoin.showingRoleReveal = true;

      const roomIndex = rooms.findIndex((r) => r.id === roomId);
      if (roomIndex !== -1) {
        rooms[roomIndex] = roomToJoin;
        io.emit("updateRooms", rooms);
      }

      connectedUsers.forEach((user, index) => {
        if (roomToJoin.usersInTheRoom.some((u) => u.username === user.username)) {
          connectedUsers[index] = {
            ...connectedUsers[index],
            isPlaying: true,
          };
        }
      });

      io.emit("updateUsers", connectedUsers);

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
            // isPlaying: true,
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
        name: `Quick Game ${Date.now()}`,
        createdBy: username,
        nbrOfPlayers: 15,
        nbrUserPlayers: 1,
        nbrCPUPlayers: 14,
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
      (username, newIsInRoom, newIsPlaying) => {
        console.log("updateUserGameState fn");
        console.log("parameters received:", username, newIsInRoom, newIsPlaying);

        let userIndex = connectedUsers.findIndex(
          (usr) => usr.username === username
        );

        const prevUserState = connectedUsers[userIndex];

        // console.log("previous user state:", prevUserState.isInRoom, prevUserState.isPlaying);

        if (userIndex !== -1) {
          connectedUsers[userIndex] = {
            ...connectedUsers[userIndex],
            isInRoom: newIsInRoom,
            isPlaying: newIsPlaying,
          };
        }

        if (!newIsInRoom || !newIsPlaying) {
          // If the user left a room, check if the room needs to be deleted      
          let room = rooms.find((r) => r.id === prevUserState.isInRoom);

          if (room) {
            if (room.isLaunched) {
              // IMPORTANT: Remove the user from usersInTheRoom
              room.usersInTheRoom = room.usersInTheRoom.filter(
                (u) => u.username !== username
              );

              // Check if there are any real users left
              const hasOtherRealUsers = room.usersInTheRoom.length > 0;
              console.log("does the room have real users?", hasOtherRealUsers);

              if (!hasOtherRealUsers) {
                // Delete the room entirely if no real users are left
                console.log("room deleted - no more real users");

                let updatedRooms = rooms.filter((r) => r.id !== room.id);
                rooms = updatedRooms;
                io.emit("updateRooms", rooms);

                // Reset any users still marked in that room (shouldn't happen but safety check)
                connectedUsers = connectedUsers.map((u) =>
                  u.isInRoom === prevUserState.isInRoom
                    ? { ...u, isInRoom: null, isPlaying: false }
                    : u
                );
              } else {
                // Room still has users, just update it in the rooms array
                const roomIndex = rooms.findIndex((r) => r.id === room.id);
                if (roomIndex !== -1) {
                  rooms[roomIndex] = room;
                }
                io.emit("updateRooms", rooms);
              }
            }

            io.emit("updateUsers", connectedUsers);
          }
        }
      }
    );

    socket.on("deleteRoom", (roomId) => {
      console.log(connectedUsers.map((usr) => usr.username + " " + usr.isInRoom + " " + usr.isPlaying));
      updatedRooms = rooms.filter((room) => room.id !== roomId);
      rooms = updatedRooms;
      io.emit("updateRooms", rooms);
      connectedUsers = connectedUsers.map((u) =>
        u.isInRoom === roomId ? { ...u, isInRoom: null, isPlaying: false } : u
      );

      console.log("connectedUsers after deleteRoom: ",
        connectedUsers.map((usr) => ({
          username: usr.username,
          isInRoom: usr.isInRoom,
          isPlaying: usr.isPlaying
        }))
      ); io.emit("updateUsers", connectedUsers);
    });

    socket.on("disconnect", () => {
      try {
        console.log(`User disconnected: ${socket.id}`);

        const user = connectedUsers.find((usr) => usr.socketId === socket.id);

        if (!user) return;

        // Don't immediately delete - give them time to reconnect
        setTimeout(() => {
          const stillDisconnected = !connectedUsers.find(
            (u) => u.token === user.token && u.socketId !== socket.id
          );

          if (stillDisconnected) {
            console.log(`User ${user.username} didn't reconnect, cleaning up`);

            // Clean up room
            if (user.isInRoom) {
              const roomIndex = rooms.findIndex((r) => r.id === user.isInRoom);

              if (roomIndex !== -1) {
                const room = rooms[roomIndex];
                room.usersInTheRoom = room.usersInTheRoom.filter(
                  (u) => u.username !== user.username
                );

                if (room.usersInTheRoom.length === 0 && room.isLaunched) {
                  console.log(`Deleting abandoned game room: ${room.name}`);
                  rooms.splice(roomIndex, 1);
                  io.emit("updateRooms", rooms);
                }
              }
            }

            // Remove from connectedUsers
            const userIndex = connectedUsers.findIndex(
              (u) => u.token === user.token
            );
            if (userIndex !== -1) {
              connectedUsers.splice(userIndex, 1);
              io.emit("updateUsers", connectedUsers);
            }
          }
        }, 30000); // 30 second grace period

      } catch (error) {
        console.error("Error in disconnect:", error);
      }
    });

    socket.on("logout", () => {
      console.log("logout fn");

      const user = connectedUsers.find((usr) => usr.socketId === socket.id);

      if (!user) return;

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

      console.log("connectedUsers after logout: ", connectedUsers.map((usr) => usr.username));
      console.log("rooms after logout: ", rooms.map((room) => room.id + " " + room.name))
    });

    socket.on("endGame", (roomId) => {
      console.log("endGame fn");
      let game = rooms.find((room) => room.id === roomId);
      if (game) {
        game.hasEnded = Date.now();
        setRooms(rooms, game, io, roomId);
        io.emit("updateRooms", rooms);
      }
    });



    inGameEmits(io, socket, rooms, connectedUsers);

  });
};

module.exports = socketManager;
