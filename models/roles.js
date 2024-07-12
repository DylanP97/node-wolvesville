const mongoose = require("mongoose");

const rolesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  team: {
    type: [String],
    required: true,
  },
  canVote: {
    type: Boolean,
    required: true,
  },
  canPerform1: {
    label: {
      type: String,
      required: false,
    },
    emoji: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: false,
    },
    needSelection: {
      type: Boolean,
      required: false,
    },
    actionTime: {
      type: String,
      required: false,
    },
    lastNight: {
      type: Boolean,
      required: false,
    },
  },
  partner: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const RolesModel = mongoose.model("roles", rolesSchema);

module.exports = RolesModel;
