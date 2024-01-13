const http = require("http");
const app = require("./index");
const socketIO = require("socket.io");

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

// Maintain a global state for rooms on the server
const rooms = [];

io.on("connection", (socket) => {
  console.log("A user connected " + socket.id);

  socket.on("createRoom", (newRoom) => {
    // Handle the creation of a new room, e.g., store it in an array or database
    console.log("New room created:", newRoom);
    rooms.push(newRoom);
    io.emit("updateRooms", rooms); // Broadcast the new room to all clients
  });

  socket.on("joinRoom", (roomId) => {
    // Handle the join room logic, e.g., check if the room exists
    const roomToJoin = rooms.find((room) => room.id === roomId);
    if (roomToJoin) {
      // You may want to broadcast this information to other clients
      // io.emit("userJoinedRoom", { roomId, userId: socket.id });
    } else {
      // Handle the case where the room does not exist
    }
  });

  socket.on("chat message", (msg) => {
    console.log("Message: " + msg);
    const userId = socket.id;
    io.emit("chat message", { msg, userId });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected " + socket.id);
  });
});

server.on("error", errorHandler);
server.on("listening", () => {
  const address = server.address();
  const bind = typeof address === "string" ? "pipe " + address : "port " + port;
  console.log("Listening on " + bind);
});

server.listen(port);