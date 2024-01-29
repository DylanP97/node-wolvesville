// Server (Node.js)

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const userRoutes = require("./routes/user");
const rolesRoutes = require("./routes/roles");

mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

const db = mongoose.connection;

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

app.use("/api/roles", rolesRoutes);
app.use("/api/user", userRoutes);

module.exports = app;
