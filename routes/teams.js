const express = require("express");
const router = express.Router();
const teamsCtrl = require("../controllers/teams");

router.get("/", teamsCtrl.getTeams);
router.get("/:name", teamsCtrl.getTeamByName);

module.exports = router;
