// cpuMoveUtils.js

function getPlayerWithId(playersList, id) {
    return playersList.find((ply) => ply.id === id);
}

function getFool(playersList) {
    const fool = playersList.find((ply) => ply.role.name === 'Fool')
    return fool;
}

function getNbrOfPlayersMarkedWithGasoline(playersList) {
    let nbr = 0
    playersList.forEach((ply) => {
        if (ply.isMarkedWithGasoline && ply.isAlive) {
            nbr += 1
        }
    })
    return nbr
}

function getRandomAlivePlayer(
    playersList,
    excludeWerewolves = false,
    excludeRevealed = false,
    excludePlayerId = null, // New parameter to exclude a specific player
) {
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

function getRandomDeadPlayer(playersList) {
    let deadPlayers = playersList.filter((player) => !player.isAlive);
    if (deadPlayers.length === 0) {
        return null;
    }
    let randomDeadPlayer =
        deadPlayers[Math.floor(Math.random() * deadPlayers.length)];
    return randomDeadPlayer;
}


export { getPlayerWithId, getFool, getNbrOfPlayersMarkedWithGasoline, getRandomAlivePlayer, getRandomDeadPlayer };