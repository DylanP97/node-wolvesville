const {
    getRandomAlivePlayer,
    getRevealedWolves,
    getRevealedSoloPlayers,
    getRevealedPowerfulVillagers,
    getBestVillageTarget,
    getSuspectedWolves,
    isThreatRole,
} = require('./cpuMoveUtils');
const {
    handleAssertDuty,
    handleRegisterAction,
    handlePutNightmare,
    handleRevealPlayer,
    handleShootBullet,
} = require('../lib/gameActions');

exports.performDayAction = (playersList, cpu, gameId, rooms, io) => {
    switch (cpu.role.name) {
        case "Captain":
            if (Math.random() < 0.3 && cpu.role.canPerform1.nbrLeftToPerform > 0) {
                handleAssertDuty(cpu.name, gameId, rooms, io);
            }
            break;
        case "Jailer":
            let arrestTarget = null;

            // Priority 1: Arrest revealed wolves (prevent wolf vote)
            const revealedWolvesForArrest = getRevealedWolves(playersList);
            if (revealedWolvesForArrest.length > 0 && Math.random() < 0.8) {
                arrestTarget = revealedWolvesForArrest[Math.floor(Math.random() * revealedWolvesForArrest.length)];
            }

            // Priority 2: Arrest revealed solo threats
            if (!arrestTarget) {
                const soloThreats = getRevealedSoloPlayers(playersList).filter(p => isThreatRole(p));
                if (soloThreats.length > 0 && Math.random() < 0.7) {
                    arrestTarget = soloThreats[Math.floor(Math.random() * soloThreats.length)];
                }
            }

            // Priority 3: Arrest suspected wolves (50% chance)
            if (!arrestTarget && Math.random() < 0.5) {
                const suspected = getSuspectedWolves(playersList, cpu.id);
                if (suspected.length > 0) {
                    arrestTarget = suspected[Math.floor(Math.random() * suspected.length)];
                }
            }

            // Fallback: Random player
            if (!arrestTarget) {
                arrestTarget = getRandomAlivePlayer(playersList, false, false, cpu.id);
            }

            if (arrestTarget) {
                handleRegisterAction({
                    type: "arrest",
                    playerId: cpu.id,
                    selectedPlayerId: arrestTarget.id,
                    selectedPlayerName: arrestTarget.name,
                }, gameId, rooms, io);
            }
            break;
        case "Seer":
            let playerToReveal = null;

            // Priority 1: Reveal suspected wolves (players with votes against them)
            const suspected = getSuspectedWolves(playersList, cpu.id);
            if (suspected.length > 0 && Math.random() < 0.7) {
                playerToReveal = suspected[Math.floor(Math.random() * suspected.length)];
            }

            // Priority 2: Reveal any unrevealed player
            if (!playerToReveal) {
                playerToReveal = getRandomAlivePlayer(playersList, false, true, cpu.id);
            }

            if (playerToReveal) {
                handleRevealPlayer({
                    type: "reveal",
                    seerId: cpu.id,
                    selectedPlayerId: playerToReveal.id,
                    selectedPlayerName: playerToReveal.name,
                    selectedPlayerRole: playerToReveal.role.nameFR,
                }, gameId, rooms, io);
            }
            break;
        case "Nightmare Werewolf":
            if (cpu.role.canPerform1.nbrLeftToPerform > 0 && Math.random() < 0.6) {
                let nightmareTarget = null;

                // Priority 1: Target revealed powerful villagers (block their abilities)
                const powerfulVillagers = getRevealedPowerfulVillagers(playersList);
                if (powerfulVillagers.length > 0 && Math.random() < 0.8) {
                    nightmareTarget = powerfulVillagers[Math.floor(Math.random() * powerfulVillagers.length)];
                }

                // Fallback: Random non-wolf player
                if (!nightmareTarget) {
                    nightmareTarget = getRandomAlivePlayer(playersList, true, false, cpu.id);
                }

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
            if (cpu.role.canPerform1.nbrLeftToPerform > 0) {
                let targetToShoot = null;

                // Priority 1: Shoot revealed wolves (always shoot)
                const revealedWolves = getRevealedWolves(playersList);
                if (revealedWolves.length > 0) {
                    targetToShoot = revealedWolves[Math.floor(Math.random() * revealedWolves.length)];
                }

                // Priority 2: Shoot revealed solo threats (90% chance)
                if (!targetToShoot) {
                    const revealedSolo = getRevealedSoloPlayers(playersList);
                    const threats = revealedSolo.filter(p => isThreatRole(p));
                    if (threats.length > 0 && Math.random() < 0.9) {
                        targetToShoot = threats[Math.floor(Math.random() * threats.length)];
                    }
                }

                // Priority 3: Shoot suspected wolves (50% chance)
                if (!targetToShoot && Math.random() < 0.5) {
                    targetToShoot = getBestVillageTarget(playersList, cpu.id);
                }

                // Priority 4: Random target (20% chance - conservative)
                if (!targetToShoot && Math.random() < 0.2) {
                    targetToShoot = getRandomAlivePlayer(playersList, false, false, cpu.id);
                }

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