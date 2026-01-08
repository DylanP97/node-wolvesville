


const {
    handleBurnThemDown,
    handleLootGrave,
    handlePourGasoline,
    handleRegisterAction,
    handleRevive,
    handleChooseJuniorWolfDeathRevenge,
    handleUncoverRole,
    handleProtectPotion,
    handlePoisonPotion,
    handleHeal,
    handleExecutePrisoner,
} = require('../lib/gameActions');

const {
    getPlayerWithId,
    getRandomDeadPlayer,
    getNbrOfPlayersMarkedWithGasoline,
    getRandomAlivePlayer
} = require("./cpuMoveUtils");
const { performWolfVote } = require("./performWolfVote.js");

exports.performNightAction = (playersList, cpu, gameId, dayCount, rooms, io) => {
    // Check if CPU has nightmares - they can't use their ability
    if (cpu.willHaveNightmares) {
        return; // Action blocked
    }

    switch (cpu.role.name) {
        case "Classic Werewolf":
        case "Alpha Werewolf":
        case "Nightmare Werewolf":
            performWolfVote(playersList, cpu, gameId, rooms, io);
            break;
        case "Junior Werewolf":
            let juniorWolftarget = getRandomAlivePlayer(playersList, true, false, cpu.id);
            if (juniorWolftarget) {
                handleChooseJuniorWolfDeathRevenge({
                    type: "chooseJuniorWolfDeathRevenge",
                    juniorWolfId: cpu.id,
                    selectedPlayerId: juniorWolftarget.id,
                }, gameId, rooms, io);
            }
            performWolfVote(playersList, cpu, gameId, rooms, io);
            break;
        case "Wolf Seer":
            if (cpu.role.canPerform1.nbrLeftToPerform > 0 && Math.random() < 0.8) {
                let playerToUncover = playersList.find(
                    (player) =>
                        player.isAlive &&
                        !player.isUnderArrest &&
                        player.id !== cpu.id &&
                        !player.isRevealedByWolfSeer
                );
                if (playerToUncover) {
                    handleUncoverRole({
                        type: "uncoverRole",
                        wolfSeerId: cpu.id,
                        selectedPlayerId: playerToUncover.id,
                        selectedPlayerName: playerToUncover.name,
                    }, gameId, rooms, io);
                }
            }
            performWolfVote(playersList, cpu, gameId, rooms, io);
            break;
        case "Witch":
            let witchTarget = getRandomAlivePlayer(playersList, false, false, cpu.id);
            if (witchTarget) {
                if (Math.random() < 0.4) {
                    if (Math.random() < 0.5) {
                        if (cpu.role.canPerform1.nbrLeftToPerform > 0) {
                            handleProtectPotion({
                                type: cpu.role.canPerform1.type,
                                playerId: cpu.id,
                                selectedPlayerId: witchTarget.id,
                                selectedPlayerName: witchTarget.name,
                            }, gameId, rooms, io);
                        }
                    } else {
                        if (cpu.role.canPerform2.nbrLeftToPerform > 0) {
                            handlePoisonPotion({
                                type: cpu.role.canPerform2.type,
                                playerId: cpu.id,
                                selectedPlayerId: witchTarget.id,
                                selectedPlayerName: witchTarget.name,
                            }, gameId, rooms, io);
                        }
                    }
                }
            }
            break;
        case "Serial Killer":
            let victim = getRandomAlivePlayer(playersList, false, false, cpu.id);
            if (victim) {
                handleRegisterAction({
                    type: "murder",
                    killerId: cpu.id,
                    selectedPlayerId: victim.id,
                    selectedPlayerName: victim.name,
                }, gameId, rooms, io);
            }
            break;
        case "Cupid":
            // Cupid can only link lovers on the first night (dayCount === 0)
            if (dayCount === 0 && cpu.role.canPerform1.nbrLeftToPerform > 0) {
                let lover1 = getRandomAlivePlayer(playersList, false, false, cpu.id);
                let lover2 = getRandomAlivePlayer(playersList, false, false, cpu.id);
                if (lover1 && lover2 && lover1.id !== lover2.id) {
                    handleRegisterAction({
                        type: "link",
                        lover1Id: lover1.id,
                        lover2Id: lover2.id,
                        cupidId: cpu.id,
                    }, gameId, rooms, io);
                }
            }
            break;
        case "Doctor":
            let playerToHeal = getRandomAlivePlayer(playersList, false, false, cpu.id);
            if (playerToHeal) {
                if (Math.random() < 0.8) {
                    handleHeal({
                        type: "heal",
                        playerId: cpu.id,
                        selectedPlayerId: playerToHeal.id,
                        selectedPlayerName: playerToHeal.name,
                    }, gameId, rooms, io);
                }
            }
            break;
        case "Jailer":
            if (dayCount !== 0 && cpu.hasHandcuffed) {
                let handcuffedPlayerId = cpu.hasHandcuffed;
                let handcuffedPlayer = getPlayerWithId(playersList, handcuffedPlayerId);
                if (handcuffedPlayer) {
                    if (cpu.role.canPerform2.nbrLeftToPerform > 0) {
                        if (Math.random() < 0.3) {
                            handleExecutePrisoner({
                                type: "execute",
                                playerId: cpu.id,
                                selectedPlayerId: handcuffedPlayerId,
                                selectedPlayerName: handcuffedPlayer.name,
                            }, gameId, rooms, io);
                        }
                    }
                }
            }
            break;
        case "Grave Robber":
            if (Math.random() < 0.3) {
                let deadPlayer = getRandomDeadPlayer(playersList);
                if (deadPlayer) {
                    handleLootGrave({
                        type: "loot",
                        graveRobberId: cpu.id,
                        selectedPlayerId: deadPlayer.id,
                        selectedPlayerName: deadPlayer.name,
                        selectedPlayerRole: deadPlayer.role, // Send the dead player's role
                    }, gameId, rooms, io);
                }
            }
            break;
        case "Medium":
            if (cpu.role.canPerform1.nbrLeftToPerform > 0 && Math.random() < 0.5) {
                let deadPlayers = playersList.filter((player) => !player.isAlive);
                if (deadPlayers.length > 0) {
                    // Prioritize known village players (revealed as village team)
                    let knownVillageDead = deadPlayers.filter(
                        (player) => player.isRevealed && player.role.team === "Village"
                    );

                    let targetPlayer = null;
                    if (knownVillageDead.length > 0 && Math.random() < 0.7) {
                        // 70% chance to revive a known village player
                        targetPlayer = knownVillageDead[Math.floor(Math.random() * knownVillageDead.length)];
                    } else {
                        // 30% chance (or if no known village players) to revive any dead player
                        targetPlayer = deadPlayers[Math.floor(Math.random() * deadPlayers.length)];
                    }

                    if (targetPlayer) {
                        handleRevive({
                            type: "revive",
                            playerId: cpu.id,
                            selectedPlayerId: targetPlayer.id,
                            selectedPlayerName: targetPlayer.name,
                        }, gameId, rooms, io);
                    }
                }
            }
            break;
        case "Arsonist":
            if (getNbrOfPlayersMarkedWithGasoline(playersList) >= 2 && Math.random() < 0.3) {
                handleBurnThemDown({
                    type: "burn",
                    pyroId: cpu.id,
                }, gameId, rooms, io);
            } else {
                let playerToPour = getRandomAlivePlayer(playersList, false, false, cpu.id);
                if (playerToPour) {
                    handlePourGasoline({
                        type: "pour",
                        pyroId: cpu.id,
                        selectedPlayerId: playerToPour.id,
                        selectedPlayerName: playerToPour.name,
                    }, gameId, rooms, io);
                }
            }
            break;


        // Add more roles as needed
        default:
            break;
    }
}