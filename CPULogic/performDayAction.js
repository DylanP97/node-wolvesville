const { getRandomAlivePlayer } = require('./cpuMoveUtils');
const {
    handleAssertDuty,
    handleRegisterAction,
    handlePutNightmare,
    handleRevealPlayer,
    handleShootBullet,
} = require('../lib/gameActions');

exports.performDayAction = (playersList, cpu, gameId, rooms, io) => {
    switch (cpu.role.name) {
        case "Mayor":
            if (Math.random() < 0.3 && cpu.role.canPerform1.nbrLeftToPerform > 0) {
                handleAssertDuty(cpu.name, gameId, rooms, io);
            }
            break;
        case "Jailer":
            let arrestedPlayer = getRandomAlivePlayer(playersList, false, false, cpu.id);
            if (arrestedPlayer) {
                handleRegisterAction({
                    type: "arrest",
                    playerId: cpu.id,
                    selectedPlayerId: arrestedPlayer.id,
                    selectedPlayerName: arrestedPlayer.name,
                }, gameId, rooms, io);
            }
            break;
        case "Seer":
            let playerToReveal = getRandomAlivePlayer(playersList, false, true, cpu.id);
            if (playerToReveal) {
                handleRevealPlayer({
                    type: "reveal",
                    seerId: cpu.id,
                    selectedPlayerId: playerToReveal.id,
                    selectedPlayerName: playerToReveal.name,
                    selectedPlayerRole: playerToReveal.role.name, // Remove i18n - handle on client
                }, gameId, rooms, io);
            }
            break;
        case "Nightmare Werewolf":
            if (cpu.role.canPerform1.nbrLeftToPerform > 0 && Math.random() < 0.5) {
                let nightmareTarget = getRandomAlivePlayer(playersList, true, false, cpu.id);
                if (nightmareTarget) {
                    handlePutNightmare({
                        type: "putNightmare",
                        playerId: cpu.id,
                        playerName: cpu.name,
                        selectedPlayerId: nightmareTarget.id,
                        selectedPlayerName: nightmareTarget.name,
                    }, gameId, rooms, io);
                }
            }
            break;
        case "Gunner":
            if (cpu.role.canPerform1.nbrLeftToPerform > 0 && Math.random() < 0.7) {
                let targetToShoot = getRandomAlivePlayer(playersList, false, false, cpu.id);
                if (targetToShoot) {
                    handleShootBullet({
                        type: "shoot",
                        gunnerId: cpu.id,
                        selectedPlayerId: targetToShoot.id,
                        selectedPlayerName: targetToShoot.name,
                    }, gameId, rooms, io);
                }
            }
            break;
        default:
            break;
    }
}