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
    const role = await this.findRoleByName(roleName);
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

// Helper function to get role by name from the database without HTTP response
exports.findRoleByName = async (roleName) => {
  try {
    const role = await RolesModel.findOne({ name: roleName });
    return role;
  } catch (error) {
    console.error(error);
    throw new Error("Database Error");
  }
};

exports.getRolesDataForQuickGame = async () => {
  const rolesWantedForQuickGame = [
    "Jailer",
    "Gunner",
    "Seer",
    "Mayor",
    "Serial Killer",
    "Fool",
    "Alpha Werewolf",
    "Classic Werewolf",
    "Classic Werewolf",
  ];

  let quickGameRolesData = [];

  try {
    const rolePromises = rolesWantedForQuickGame.map(async (roleName) => {
      const role = await this.findRoleByName(roleName); // Use the helper function here
      return role;
    });

    quickGameRolesData = await Promise.all(rolePromises);
  } catch (error) {
    console.log(error);
  }

  return quickGameRolesData.filter(role => role); // Remove any undefined roles
};


