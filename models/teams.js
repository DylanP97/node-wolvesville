const mongoose = require("mongoose");

const teamsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    }
});

const TeamsModel = mongoose.model("teams", teamsSchema);

module.exports = TeamsModel;
