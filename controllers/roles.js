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
 * - 3-4 solo players (randomly chosen, NO duplicates)
 * - 3-4 werewolves (randomly chosen, NO duplicates)
 * - Rest villagers (to fill remaining slots, only Villager can duplicate)
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
  const wolfCount = Math.random() < 0.5 ? 3 : 4; // 3 or 4 wolves (changed from 4-5)
  const villageCount = totalPlayers - soloCount - wolfCount; // Rest are villagers

  console.log(`Quick game balance: ${soloCount} solo, ${wolfCount} wolves, ${villageCount} village`);

  // Shuffle and pick UNIQUE roles from each pool (no duplicates allowed)
  const shuffledSolo = shuffleArray(soloRoles);
  const shuffledWolf = shuffleArray(wolfRoles);

  // Take only up to available unique roles
  const selectedSoloNames = shuffledSolo.slice(0, Math.min(soloCount, shuffledSolo.length));
  const selectedWolfNames = shuffledWolf.slice(0, Math.min(wolfCount, shuffledWolf.length));

  // For village, we might need more roles than unique available
  // Only "Villager" can be duplicated
  let selectedVillageNames = [];
  const shuffledVillage = shuffleArray(villageRoles);

  for (let i = 0; i < villageCount; i++) {
    // Find next available unique role, or use Villager as fallback
    const availableRole = shuffledVillage.find(r =>
      !selectedVillageNames.includes(r) || r === "Villager"
    );
    selectedVillageNames.push(availableRole || "Villager");
  }

  // Combine all selected role names
  const allSelectedNames = [...selectedSoloNames, ...selectedWolfNames, ...selectedVillageNames];

  // Final safety check: ensure no duplicates except Villager
  const seen = new Set();
  const deduped = [];
  for (const name of allSelectedNames) {
    if (name === "Villager" || !seen.has(name)) {
      seen.add(name);
      deduped.push(name);
    } else {
      deduped.push("Villager"); // Replace duplicate with Villager
    }
  }

  console.log("Selected roles:", deduped);

  // Fetch role data from database
  let quickGameRolesData = [];

  try {
    const rolePromises = deduped.map(async (roleName) => {
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
