const RolesModel = require("../models/roles");

exports.getRoles = async (req, res) => {
  try {
    const roles = await RolesModel.find();
    res.status(200).json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getRoleByName = async (req, res) => {
  const roleName = req.params.name;

  try {
    const role = await RolesModel.findOne({ name: roleName });
    if (role) {
      res.status(200).json(role);
    } else {
      res.status(404).json({ error: "Role not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
