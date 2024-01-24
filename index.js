// Server (Node.js)

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/user");

const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["sessionId", "Content-Type", "Authorization", "*"],
  exposedHeaders: ["sessionId"],
  preflightContinue: false,
};

const app = express();

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", async (req, res) => {
  res.status(200).json({ message: "Api Hello!!" });
});

app.use("/api/user", userRoutes);

module.exports = app;
