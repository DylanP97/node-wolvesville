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
    const plainRole = JSON.parse(JSON.stringify(role)); // Fully detach from Mongoose
    return plainRole;
  } catch (error) {
    console.error(error);
    throw new Error("Database Error");
  }
};

/**
 * Helper function to shuffle an array (Fisher-Yates algorithm)
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Generate balanced roles for quick game / matchmaking
 * Total: 16 players
 * - 3-4 solo players (randomly chosen)
 * - 4-5 werewolves (randomly chosen)
 * - Rest villagers (to fill remaining slots)
 */
exports.getRolesDataForQuickGame = async () => {
  // Define role pools by team
  const soloRoles = ["Serial Killer", "Fool", "Arsonist", "Ghost Lady"];
  const wolfRoles = ["Alpha Werewolf", "Wolf Seer", "Nightmare Werewolf", "Baby Werewolf", "Classic Werewolf"];
  const villageRoles = [
    "Witch", "Gunner", "Seer", "Captain", "Cupid", "Medium",
    "Jailer", "Grave Robber", "Doctor", "Cursed", "Villager"
  ];

  const totalPlayers = 16;

  // Randomly decide counts (within balanced ranges)
  const soloCount = Math.random() < 0.5 ? 3 : 4; // 3 or 4 solo
  const wolfCount = Math.random() < 0.5 ? 4 : 5; // 4 or 5 wolves
  const villageCount = totalPlayers - soloCount - wolfCount; // Rest are villagers

  console.log(`Quick game balance: ${soloCount} solo, ${wolfCount} wolves, ${villageCount} village`);

  // Shuffle and pick roles from each pool
  const selectedSoloNames = shuffleArray(soloRoles).slice(0, soloCount);
  const selectedWolfNames = shuffleArray(wolfRoles).slice(0, wolfCount);

  // For village, we might need duplicates (e.g., multiple Villagers)
  let selectedVillageNames = [];
  const shuffledVillage = shuffleArray(villageRoles);

  for (let i = 0; i < villageCount; i++) {
    // Cycle through shuffled village roles, allowing duplicates of "Villager"
    const roleIndex = i % shuffledVillage.length;
    const roleName = shuffledVillage[roleIndex];

    // Only allow duplicate Villagers, otherwise pick next unique
    if (selectedVillageNames.includes(roleName) && roleName !== "Villager") {
      // Find a role not yet selected (or default to Villager)
      const available = shuffledVillage.find(r => !selectedVillageNames.includes(r) || r === "Villager");
      selectedVillageNames.push(available || "Villager");
    } else {
      selectedVillageNames.push(roleName);
    }
  }

  // Combine all selected role names
  const allSelectedNames = [...selectedSoloNames, ...selectedWolfNames, ...selectedVillageNames];

  console.log("Selected roles:", allSelectedNames);

  // Fetch role data from database
  let quickGameRolesData = [];

  try {
    const rolePromises = allSelectedNames.map(async (roleName) => {
      const role = await this.findRoleByName(roleName);
      return role;
    });

    quickGameRolesData = await Promise.all(rolePromises);
  } catch (error) {
    console.log("Error fetching roles:", error);
  }

  // Remove any undefined roles (in case some weren't found in DB)
  quickGameRolesData = quickGameRolesData.filter((role) => role);

  // Safeguard: if we don't have enough roles, fill with Villager
  if (quickGameRolesData.length < totalPlayers) {
    console.log(`Warning: Only got ${quickGameRolesData.length} roles, filling with Villagers`);
    const villagerRole = await this.findRoleByName("Villager");
    while (quickGameRolesData.length < totalPlayers && villagerRole) {
      quickGameRolesData.push({ ...villagerRole });
    }
  }

  return quickGameRolesData;
};
