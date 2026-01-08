// cpuMoveUtils.js

exports.getPlayerWithId = (playersList, id) => {
    return playersList.find((ply) => ply.id === id);
}

exports.getFool = (playersList) => {
    const fool = playersList.find((ply) => ply.role.name === 'Fool')
    return fool;
}

exports.getNbrOfPlayersMarkedWithGasoline = (playersList) => {
    let nbr = 0
    playersList.forEach((ply) => {
        if (ply.isMarkedWithGasoline && ply.isAlive) {
            nbr += 1
        }
    })
    return nbr
}

exports.getRandomAlivePlayer = (
    playersList,
    excludeWerewolves = false,
    excludeRevealed = false,
    excludePlayerId = null, // New parameter to exclude a specific player
) => {
    let potentialPlayers = playersList.filter(
        (player) =>
            player.isAlive &&
            !player.isUnderArrest &&
            player.id !== excludePlayerId && // Exclude the specific player
            (!excludeWerewolves || player.role.team !== "Werewolves") &&
            (!excludeRevealed || !player.isRevealed)
    );
    if (potentialPlayers.length === 0) {
        return null;
    }
    let randomPlayer =
        potentialPlayers[Math.floor(Math.random() * potentialPlayers.length)];
    return randomPlayer;
}

exports.getRandomDeadPlayer = (playersList) => {
    let deadPlayers = playersList.filter((player) => !player.isAlive);
    if (deadPlayers.length === 0) {
        return null;
    }
    let randomDeadPlayer =
        deadPlayers[Math.floor(Math.random() * deadPlayers.length)];
    return randomDeadPlayer;
}

