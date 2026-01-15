// cpuMoveUtils.js - Utility functions for CPU decision making

/**
 * Get player by ID
 */
exports.getPlayerWithId = (playersList, id) => {
    return playersList.find((ply) => ply.id === id);
};

/**
 * Get the Fool player if exists
 */
exports.getFool = (playersList) => {
    return playersList.find((ply) => ply.role.name === 'Fool');
};

/**
 * Count players marked with gasoline
 */
exports.getNbrOfPlayersMarkedWithGasoline = (playersList) => {
    return playersList.filter(ply => ply.isMarkedWithGasoline && ply.isAlive).length;
};

/**
 * Get a random alive player with filtering options
 */
exports.getRandomAlivePlayer = (
    playersList,
    excludeWerewolves = false,
    excludeRevealed = false,
    excludePlayerId = null
) => {
    let potentialPlayers = playersList.filter(
        (player) =>
            player.isAlive &&
            !player.isUnderArrest &&
            player.id !== excludePlayerId &&
            (!excludeWerewolves || player.role.team !== "Werewolves") &&
            (!excludeRevealed || !player.isRevealed)
    );
    if (potentialPlayers.length === 0) return null;
    return potentialPlayers[Math.floor(Math.random() * potentialPlayers.length)];
};

/**
 * Get a random dead player
 */
exports.getRandomDeadPlayer = (playersList) => {
    let deadPlayers = playersList.filter((player) => !player.isAlive);
    if (deadPlayers.length === 0) return null;
    return deadPlayers[Math.floor(Math.random() * deadPlayers.length)];
};

/**
 * Get revealed wolves (for village team to target)
 */
exports.getRevealedWolves = (playersList) => {
    return playersList.filter(
        p => p.isAlive && p.isRevealed && p.role.team === "Werewolves"
    );
};

/**
 * Get revealed villagers (for wolves to target or village to protect)
 */
exports.getRevealedVillagers = (playersList) => {
    return playersList.filter(
        p => p.isAlive && p.isRevealed && p.role.team === "Village"
    );
};

/**
 * Get revealed solo players (threats to everyone)
 */
exports.getRevealedSoloPlayers = (playersList) => {
    return playersList.filter(
        p => p.isAlive && p.isRevealed &&
        !["Village", "Villagers", "Werewolves"].includes(p.role.team)
    );
};

/**
 * Get suspected wolves (players who voted suspiciously or are unrevealed)
 */
exports.getSuspectedWolves = (playersList, excludeId = null) => {
    // Players that are not revealed and could be wolves
    const unrevealed = playersList.filter(
        p => p.isAlive && !p.isRevealed && p.id !== excludeId
    );

    // Prioritize those with high vote against counts (they might be wolves the village suspects)
    const suspicious = unrevealed.filter(p => p.voteAgainst >= 2);

    if (suspicious.length > 0) return suspicious;
    return unrevealed;
};

/**
 * Get powerful village roles (priority targets/protections)
 */
exports.getPowerfulVillagers = (playersList, aliveOnly = true) => {
    const powerfulRoles = ["Seer", "Gunner", "Jailer", "Doctor", "Captain", "Witch", "Medium"];
    return playersList.filter(
        p => (!aliveOnly || p.isAlive) &&
        p.role.team === "Village" &&
        powerfulRoles.includes(p.role.name)
    );
};

/**
 * Get revealed powerful villagers (high priority protection targets)
 */
exports.getRevealedPowerfulVillagers = (playersList) => {
    const powerfulRoles = ["Seer", "Gunner", "Jailer", "Doctor", "Captain", "Witch", "Medium"];
    return playersList.filter(
        p => p.isAlive && p.isRevealed &&
        p.role.team === "Village" &&
        powerfulRoles.includes(p.role.name)
    );
};

/**
 * Get dead villagers (for Medium to revive)
 */
exports.getDeadVillagers = (playersList) => {
    return playersList.filter(
        p => !p.isAlive && p.role.team === "Village"
    );
};

/**
 * Get dead powerful villagers (priority for Medium to revive)
 */
exports.getDeadPowerfulVillagers = (playersList) => {
    const powerfulRoles = ["Seer", "Gunner", "Jailer", "Doctor", "Captain", "Witch"];
    return playersList.filter(
        p => !p.isAlive &&
        p.role.team === "Village" &&
        powerfulRoles.includes(p.role.name)
    );
};

/**
 * Check if a player is a threat (solo killer role)
 */
exports.isThreatRole = (player) => {
    const threatRoles = ["Serial Killer", "Arsonist", "Ghost Lady"];
    return threatRoles.includes(player.role.name);
};

/**
 * Get the best target for village team actions
 * Priority: Revealed wolves > Revealed solo threats > Suspected wolves
 */
exports.getBestVillageTarget = (playersList, excludeId = null) => {
    // First priority: revealed wolves
    const revealedWolves = exports.getRevealedWolves(playersList);
    if (revealedWolves.length > 0) {
        return revealedWolves[Math.floor(Math.random() * revealedWolves.length)];
    }

    // Second priority: revealed solo threats
    const revealedSolo = exports.getRevealedSoloPlayers(playersList);
    const threats = revealedSolo.filter(p => exports.isThreatRole(p));
    if (threats.length > 0) {
        return threats[Math.floor(Math.random() * threats.length)];
    }

    // Third priority: suspected wolves
    const suspected = exports.getSuspectedWolves(playersList, excludeId);
    if (suspected.length > 0) {
        return suspected[Math.floor(Math.random() * suspected.length)];
    }

    return null;
};

/**
 * Get best protection target for Doctor/Witch
 * Priority: Revealed powerful villagers > Any revealed villager
 */
exports.getBestProtectionTarget = (playersList, excludeId = null) => {
    // First priority: revealed powerful villagers
    const revealedPowerful = exports.getRevealedPowerfulVillagers(playersList)
        .filter(p => p.id !== excludeId);
    if (revealedPowerful.length > 0) {
        return revealedPowerful[Math.floor(Math.random() * revealedPowerful.length)];
    }

    // Second priority: any revealed villager
    const revealedVillagers = exports.getRevealedVillagers(playersList)
        .filter(p => p.id !== excludeId);
    if (revealedVillagers.length > 0) {
        return revealedVillagers[Math.floor(Math.random() * revealedVillagers.length)];
    }

    // Fallback: random alive player (not self)
    return exports.getRandomAlivePlayer(playersList, false, false, excludeId);
};

/**
 * Get best revive target for Medium
 * Priority: Dead powerful villagers > Dead villagers
 * Excludes players with looted graves (can't revive those)
 */
exports.getBestReviveTarget = (playersList) => {
    // Filter out players with looted graves - they can't be revived
    const revivablePlayers = playersList.filter(p => !p.isAlive && !p.graveLooted);

    // First priority: dead powerful villagers
    const deadPowerful = exports.getDeadPowerfulVillagers(playersList)
        .filter(p => !p.graveLooted);
    if (deadPowerful.length > 0) {
        return deadPowerful[Math.floor(Math.random() * deadPowerful.length)];
    }

    // Second priority: dead villagers
    const deadVillagers = exports.getDeadVillagers(playersList)
        .filter(p => !p.graveLooted);
    if (deadVillagers.length > 0) {
        return deadVillagers[Math.floor(Math.random() * deadVillagers.length)];
    }

    // Fallback: any dead player (avoid wolves if possible)
    const deadNonWolves = revivablePlayers.filter(
        p => p.role.team !== "Werewolves"
    );
    if (deadNonWolves.length > 0) {
        return deadNonWolves[Math.floor(Math.random() * deadNonWolves.length)];
    }

    // Last resort: any revivable dead player
    if (revivablePlayers.length > 0) {
        return revivablePlayers[Math.floor(Math.random() * revivablePlayers.length)];
    }

    return null; // No valid targets
};
