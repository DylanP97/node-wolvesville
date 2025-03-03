const TeamsModel = require("../models/teams");

exports.getTeams = async (req, res) => {
  try {
    const teams = await TeamsModel.find();
    res.status(200).json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getTeamByName = async (req, res) => {
  const teamName = req.params.name;

  try {
    const team = await TeamsModel.findOne({ name: teamName });
    if (team) {
      res.status(200).json(team);
    } else {
      res.status(404).json({ error: "team not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
