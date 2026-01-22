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
  pauseForAnimation,
  processAnimationQueue,
} = require("./lib/gameSetup");
const { getRolesDataForQuickGame } = require("./controllers/roles");
const cleanupOldRooms = require("./lib/cleanupOldRooms");
const inGameEmits = require("./inGameEmits");
const { processCPUMoves } = require('./CPULogic/cpuManager');
const { recordGameStats } = require('./lib/recordGameStats');

const MAX_GAME_CYCLES = 14; // Maximum day/night cycles before stalemate

const socketManager = (io, rooms, connectedUsers) => {

  // Run cleanup every 3 minutes
  setInterval(() => {
    cleanupOldRooms(io, rooms, connectedUsers);
  }, 3 * 60 * 1000);

  // Also cleanup on initial load
  cleanupOldRooms(io, rooms, connectedUsers);

  // ============================================================================
  // MATCHMAKING QUEUE SYSTEM
  // ============================================================================
  let matchmakingQueue = {
    players: [],           // [{username, socketId, avatar, joinedAt}]
    timer: null,          // Countdown timer reference
    secondsRemaining: 20,
    isCountdownActive: false
  };

  // Start matchmaking countdown
  const startMatchmakingCountdown = () => {
    if (matchmakingQueue.isCountdownActive) return;

    matchmakingQueue.isCountdownActive = true;
    matchmakingQueue.secondsRemaining = 20;

    matchmakingQueue.timer = setInterval(() => {
      matchmakingQueue.secondsRemaining--;

      // Broadcast updated countdown to all players in queue
      broadcastMatchmakingStatus();

      // Start game when countdown reaches 0
      if (matchmakingQueue.secondsRemaining <= 0) {
        startMatchmakingGame();
      }
    }, 1000);
  };

  // Stop matchmaking countdown
  const stopMatchmakingCountdown = () => {
    if (matchmakingQueue.timer) {
      clearInterval(matchmakingQueue.timer);
      matchmakingQueue.timer = null;
    }
    matchmakingQueue.isCountdownActive = false;
    matchmakingQueue.secondsRemaining = 20;
  };

  // Broadcast matchmaking status to all players in queue
  const broadcastMatchmakingStatus = () => {
    const status = {
      playerCount: matchmakingQueue.players.length,
      players: matchmakingQueue.players,
      secondsRemaining: matchmakingQueue.secondsRemaining,
      isCountdownActive: matchmakingQueue.isCountdownActive
    };

    // Emit to all players in matchmaking
    matchmakingQueue.players.forEach(player => {
      io.to(player.socketId).emit("matchmakingUpdate", status);
    });
  };

  // Start game from matchmaking queue
  const startMatchmakingGame = async () => {
    if (matchmakingQueue.players.length < 2) {
      console.log("Not enough players to start matchmaking game");
      stopMatchmakingCountdown();
      return;
    }

    stopMatchmakingCountdown();

    // Get roles data
    const rolesData = await getRolesDataForQuickGame();

    // Calculate CPU count
    const realPlayerCount = matchmakingQueue.players.length;
    const totalPlayers = 16;
    const cpuCount = totalPlayers - realPlayerCount;

    // Create game room
    const newMatchmakingRoom = {
      id: Date.now(),
      name: `Matchmaking Game ${Date.now()}`,
      createdBy: matchmakingQueue.players[0].username,
      nbrOfPlayers: totalPlayers,
      nbrUserPlayers: realPlayerCount,
      nbrCPUPlayers: cpuCount,
      selectedRoles: rolesData,
      usersInTheRoom: matchmakingQueue.players.map(p => ({
        username: p.username,
        socketId: p.socketId,
        avatar: p.avatar,
        preferredRole: null
      })),
      isLaunched: false,
      isQuickGame: false,
      isMatchmaking: true,
    };

    // Update all players in connectedUsers
    matchmakingQueue.players.forEach(player => {
      const userIndex = connectedUsers.findIndex(u => u.username === player.username);
      if (userIndex !== -1) {
        connectedUsers[userIndex] = {
          ...connectedUsers[userIndex],
          isInRoom: newMatchmakingRoom.id,
          isPlaying: true,
        };
        console.log(`✅ Updated ${player.username}: isInRoom=${newMatchmakingRoom.id}, isPlaying=true`);
      } else {
        console.log(`❌ User ${player.username} not found in connectedUsers!`);
      }
      // Join socket room
      const playerSocket = io.sockets.sockets.get(player.socketId);
      if (playerSocket) {
        playerSocket.join(newMatchmakingRoom.id);
        console.log(`✅ ${player.username} joined socket room ${newMatchmakingRoom.id}`);
      } else {
        console.log(`❌ Socket not found for ${player.username} (socketId: ${player.socketId})`);
      }
    });

    // Notify players that match was found
    io.to(newMatchmakingRoom.id).emit("matchFound", { roomId: newMatchmakingRoom.id });

    // Clear the queue
    matchmakingQueue.players = [];

    // Add room and broadcast updates
    rooms.push(newMatchmakingRoom);
    console.log(`📢 Emitting updateUsers to all clients`);
    io.emit("updateUsers", connectedUsers);
    console.log(`📢 Emitting updateRooms to all clients`);
    io.emit("updateRooms", rooms);

    // Start the game
    console.log(`🎮 Starting matchmaking game with ${realPlayerCount} real players and ${cpuCount} CPUs`);
    startGame(newMatchmakingRoom, newMatchmakingRoom.id);
  };

  // ============================================================================
  // END MATCHMAKING QUEUE SYSTEM
  // ============================================================================

  // ============================================================================
  // GAME MANAGEMENT FUNCTIONS (Used by both matchmaking and connection handlers)
  // ============================================================================

  const updateGame = (game) => {
    if (game.hasEnded || game.showingRoleReveal) {
      console.log("the game has ended or showing role reveal");
      return;
    }

    if (game.isPaused) {
      setTimeout(() => updateGame(game), 1000);
      return;
    }

    if (game.winningTeam === null) {
      // Check for stalemate (max cycles reached)
      if (game.dayCount >= MAX_GAME_CYCLES) {
        console.log(`⚠️ Stalemate detected! Game reached ${MAX_GAME_CYCLES} cycles without a winner.`);
        game.isStalemate = true;
        game.winningTeam = {
          name: "Stalemate",
          image: null,
          winnerPlayers: []
        };
        game.isPaused = true;

        // Record stats for stalemate
        recordGameStats(game, false);
        return;
      }

      game.timeCounter -= 1000;

      // ✅ Process CPU moves on the server
      processCPUMoves(game, rooms, io);

      if (game.timeCounter === 0) {
        if (game.timeOfTheDay === "nighttime")
          toNightTimeAftermath(game);
        else if (game.timeOfTheDay === "nighttimeAftermath")
          toDayTime(game);
        else if (game.timeOfTheDay === "daytime")
          toVoteTime(game);
        else if (game.timeOfTheDay === "votetime")
          toVoteTimeAftermath(game);
        else if (game.timeOfTheDay === "votetimeAftermath")
          toNightTime(game);

        game.playersList = assignRandomSecondToEachCPU(
          game.playersList
        );
      }
    } else {
      console.log("and the winner is...");
      console.log(game.winningTeam.name);
      game.isPaused = true;

      // Record game stats when there's a winner
      if (!game.statsRecorded) {
        game.statsRecorded = true;
        recordGameStats(game, false);
      }
    }

    const roomIndex = rooms.findIndex((r) => r.id === game.id);
    if (roomIndex !== -1) {
      rooms[roomIndex] = game;
      io.to(game.id).emit("updateGame", game);

      // ✅ single call, handles ALL animations safely
      processAnimationQueue(game, io, game.id, rooms);
    }

    setTimeout(() => updateGame(game), 1000);
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
    console.log(`🚀 Emitting launchRoom to room ${roomId} with ${roomToJoin.usersInTheRoom.length} users`);
    io.to(roomId).emit("launchRoom", roomToJoin);

    // After 10 seconds, transition to roles overview phase
    setTimeout(() => {
      let game = rooms.find((r) => r.id === roomId);
      if (game) {
        game.showingRoleReveal = false;
        game.showingRolesOverview = true;
        game.readyPlayers = []; // Track who clicked ready
        game.rolesOverviewCountdown = 100; // 100 seconds countdown

        // Get unique roles in the game for display
        const uniqueRoles = [];
        const seenRoles = new Set();
        game.playersList.forEach(player => {
          if (player.role && !seenRoles.has(player.role.name)) {
            seenRoles.add(player.role.name);
            uniqueRoles.push(player.role);
          }
        });
        game.rolesInGame = uniqueRoles;

        const gameRoomIndex = rooms.findIndex((r) => r.id === roomId);
        if (gameRoomIndex !== -1) {
          rooms[gameRoomIndex] = game;
        }

        console.log(`📋 Showing roles overview for room ${roomId}`);
        io.to(roomId).emit("updateGame", game);

        // Start countdown timer for auto-start
        startRolesOverviewCountdown(roomId);
      }
    }, 10000);
  };

  // Roles overview countdown - auto-starts game after 100 seconds
  const startRolesOverviewCountdown = (roomId) => {
    const countdownInterval = setInterval(() => {
      let game = rooms.find((r) => r.id === roomId);
      if (!game || !game.showingRolesOverview) {
        clearInterval(countdownInterval);
        return;
      }

      game.rolesOverviewCountdown -= 1;

      // Emit countdown update every 10 seconds or when low
      if (game.rolesOverviewCountdown <= 10 || game.rolesOverviewCountdown % 10 === 0) {
        io.to(roomId).emit("rolesOverviewCountdown", game.rolesOverviewCountdown);
      }

      // Auto-start when countdown reaches 0
      if (game.rolesOverviewCountdown <= 0) {
        clearInterval(countdownInterval);
        startGameAfterRolesOverview(roomId);
      }
    }, 1000);
  };

  // Start actual game after roles overview
  const startGameAfterRolesOverview = (roomId) => {
    let game = rooms.find((r) => r.id === roomId);
    if (game && game.showingRolesOverview) {
      game.showingRolesOverview = false;
      delete game.readyPlayers;
      delete game.rolesOverviewCountdown;
      // Keep game.rolesInGame for the Players/Roles menu during gameplay

      const gameRoomIndex = rooms.findIndex((r) => r.id === roomId);
      if (gameRoomIndex !== -1) {
        rooms[gameRoomIndex] = game;
      }

      console.log(`🎮 Starting game for room ${roomId} after roles overview`);
      io.to(roomId).emit("updateGame", game);
      updateGame(game);
    }
  };

  // ============================================================================
  // END GAME MANAGEMENT FUNCTIONS
  // ============================================================================

  io.on("connection", (socket) => {
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
        nbrOfPlayers: 16,
        nbrUserPlayers: 1,
        nbrCPUPlayers: 15,
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

    // ============================================================================
    // ROLES OVERVIEW - PLAYER READY EVENT
    // ============================================================================

    socket.on("playerReady", (roomId, playerName) => {
      let game = rooms.find((r) => r.id === roomId);
      if (!game || !game.showingRolesOverview) return;

      // Add player to ready list if not already there
      if (!game.readyPlayers.includes(playerName)) {
        game.readyPlayers.push(playerName);
        console.log(`✅ ${playerName} is ready (${game.readyPlayers.length}/${game.usersInTheRoom.length})`);

        // Update the game state
        const gameRoomIndex = rooms.findIndex((r) => r.id === roomId);
        if (gameRoomIndex !== -1) {
          rooms[gameRoomIndex] = game;
        }

        // Emit updated ready status to all players in room
        io.to(roomId).emit("playerReadyUpdate", {
          readyPlayers: game.readyPlayers,
          totalRealPlayers: game.usersInTheRoom.length
        });

        // Check if all real players are ready
        if (game.readyPlayers.length >= game.usersInTheRoom.length) {
          console.log(`🎉 All players ready in room ${roomId}! Starting game...`);
          startGameAfterRolesOverview(roomId);
        }
      }
    });

    // ============================================================================
    // MATCHMAKING SOCKET EVENTS
    // ============================================================================

    socket.on("joinMatchmaking", (username, socketId, avatar) => {
      console.log(`${username} joined matchmaking queue`);

      // Check if player already in queue
      const alreadyInQueue = matchmakingQueue.players.find(p => p.username === username);
      if (alreadyInQueue) {
        console.log(`${username} is already in matchmaking queue`);
        return;
      }

      // Add player to queue
      matchmakingQueue.players.push({
        username,
        socketId,
        avatar,
        joinedAt: Date.now()
      });

      // Check for instant start (16 players)
      if (matchmakingQueue.players.length >= 16) {
        console.log("16 players reached - starting game immediately!");
        startMatchmakingGame();
        return;
      }

      // Start countdown if 2+ players and not already counting
      if (matchmakingQueue.players.length >= 2 && !matchmakingQueue.isCountdownActive) {
        console.log("2+ players in queue - starting 20s countdown");
        startMatchmakingCountdown();
      }

      // Broadcast updated status to all players in queue
      broadcastMatchmakingStatus();
    });

    socket.on("leaveMatchmaking", (username) => {
      console.log(`${username} left matchmaking queue`);

      // Remove player from queue
      const initialLength = matchmakingQueue.players.length;
      matchmakingQueue.players = matchmakingQueue.players.filter(p => p.username !== username);

      // If player was actually in queue
      if (matchmakingQueue.players.length < initialLength) {
        // Check if we should stop countdown (less than 2 players)
        if (matchmakingQueue.players.length < 2) {
          console.log("Less than 2 players - stopping countdown");
          stopMatchmakingCountdown();
        }

        // Broadcast updated status
        broadcastMatchmakingStatus();
      }
    });

    // ============================================================================
    // END MATCHMAKING SOCKET EVENTS
    // ============================================================================

    socket.on(
      "updateUserGameState",
      (username, newIsInRoom, newIsPlaying) => {

        let userIndex = connectedUsers.findIndex(
          (usr) => usr.username === username
        );

        const prevUserState = connectedUsers[userIndex];

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

              if (!hasOtherRealUsers) {
                // Delete the room entirely if no real users are left
                console.log("room deleted - no more real users");

                // ✅ Modifié : suppression en place au lieu de réassignation
                const roomIndexToDelete = rooms.findIndex((r) => r.id === room.id);
                if (roomIndexToDelete !== -1) {
                  rooms.splice(roomIndexToDelete, 1);
                }
                io.emit("updateRooms", rooms);

                // ✅ Modifié : modification en place au lieu de réassignation
                connectedUsers.forEach((u, index) => {
                  if (u.isInRoom === prevUserState.isInRoom) {
                    connectedUsers[index] = { ...u, isInRoom: null, isPlaying: false };
                  }
                });
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
      // ✅ Modifié : suppression en place au lieu de réassignation
      const roomIndex = rooms.findIndex((room) => room.id === roomId);
      if (roomIndex !== -1) {
        rooms.splice(roomIndex, 1);
      }

      io.emit("updateRooms", rooms);

      // ✅ Modifié : modification en place au lieu de réassignation
      connectedUsers.forEach((u, index) => {
        if (u.isInRoom === roomId) {
          connectedUsers[index] = { ...u, isInRoom: null, isPlaying: false };
        }
      });

      io.emit("updateUsers", connectedUsers);
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
                  // ✅ Modifié : suppression directe en place
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
              // ✅ Modifié : suppression directe en place
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
      const user = connectedUsers.find((usr) => usr.socketId === socket.id);

      if (!user) return;

      // ✅ Modifié : suppression en place
      const userIndex = connectedUsers.findIndex(
        (usr) => usr.socketId === socket.id
      );
      if (userIndex !== -1) {
        connectedUsers.splice(userIndex, 1);
      }

      // If the user left a room, check if the room needs to be deleted      
      let room = rooms.find((r) => r.id === user.isInRoom);

      if (room) {
        // Check if there are any real users left
        const hasOtherRealUsers = room.usersInTheRoom.some(
          (u) => u.username !== user.username
        );

        if (!hasOtherRealUsers) {
          // Delete the room entirely if no real users are left
          // ✅ Modifié : suppression en place
          const roomIndexToDelete = rooms.findIndex((r) => r.id === room.id);
          if (roomIndexToDelete !== -1) {
            rooms.splice(roomIndexToDelete, 1);
          }
          io.emit("updateRooms", rooms);

          // Reset any users still marked in that room (it shouldn't happen normally)
          // ✅ Modifié : modification en place
          connectedUsers.forEach((u, index) => {
            if (u.isInRoom === user.isInRoom) {
              connectedUsers[index] = { ...u, isInRoom: null, isPlaying: false };
            }
          });
        }
      }

      io.emit("updateUsers", connectedUsers);
    });

    socket.on("endGame", (roomId) => {
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