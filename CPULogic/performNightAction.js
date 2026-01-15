/**
 * CPU Night Action Logic
 * Smart decision-making for all roles during night phase
 */

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
    handleGhostVisit,
} = require('../lib/gameActions');

const {
    getPlayerWithId,
    getRandomDeadPlayer,
    getNbrOfPlayersMarkedWithGasoline,
    getRandomAlivePlayer,
    getBestVillageTarget,
    getBestProtectionTarget,
    getBestReviveTarget,
    getRevealedWolves,
    getRevealedVillagers,
    getRevealedPowerfulVillagers,
} = require("./cpuMoveUtils");

const { performWolfVote } = require("./performWolfVote.js");

exports.performNightAction = (playersList, cpu, gameId, dayCount, rooms, io) => {
    // Check if CPU has nightmares - they can't use their ability
    if (cpu.willHaveNightmares) {
        return; // Action blocked
    }

    switch (cpu.role.name) {
        // =====================================================================
        // WEREWOLF ROLES
        // =====================================================================
        case "Classic Werewolf":
        case "Alpha Werewolf":
        case "Nightmare Werewolf":
            performWolfVote(playersList, cpu, gameId, rooms, io);
            break;

        case "Baby Werewolf":
            // Baby Werewolf chooses a revenge target (non-wolf alive player)
            // Can change target if desired
            if (cpu.role.canPerform1?.nbrLeftToPerform > 0) {
                // Get all non-wolf alive players
                const nonWolfTargets = playersList.filter(
                    p => p.isAlive &&
                    p.role.team !== "Werewolves" &&
                    p.id !== cpu.id
                );

                if (nonWolfTargets.length > 0) {
                    // Prioritize revealed powerful villagers as revenge targets
                    const powerfulTargets = nonWolfTargets.filter(
                        p => p.isRevealed &&
                        ["Seer", "Gunner", "Jailer", "Doctor", "Witch"].includes(p.role.name)
                    );

                    let target;
                    if (powerfulTargets.length > 0 && Math.random() < 0.7) {
                        target = powerfulTargets[Math.floor(Math.random() * powerfulTargets.length)];
                    } else {
                        target = nonWolfTargets[Math.floor(Math.random() * nonWolfTargets.length)];
                    }

                    handleChooseJuniorWolfDeathRevenge({
                        type: "chooseJuniorWolfDeathRevenge",
                        babyWolfId: cpu.id,
                        selectedPlayerId: target.id,
                        selectedPlayerName: target.name,
                    }, gameId, rooms, io);
                }
            }
            performWolfVote(playersList, cpu, gameId, rooms, io);
            break;

        case "Wolf Seer":
            // Wolf Seer uncovers a non-revealed player's role
            if (cpu.role.canPerform1?.nbrLeftToPerform > 0) {
                // Find unrevealed players (prioritize those the village suspects)
                let playerToUncover = playersList.find(
                    (player) =>
                        player.isAlive &&
                        !player.isUnderArrest &&
                        player.id !== cpu.id &&
                        !player.isRevealedByWolfSeer &&
                        !player.isRevealed
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

        // =====================================================================
        // VILLAGE ROLES
        // =====================================================================
        case "Witch":
            // Smart Witch logic:
            // - Protect revealed villagers (especially powerful ones)
            // - Poison revealed wolves or suspected threats
            const hasProtect = cpu.role.canPerform1?.nbrLeftToPerform > 0;
            const hasPoison = cpu.role.canPerform2?.nbrLeftToPerform > 0;

            // Check if there are revealed villagers to protect
            const revealedPowerful = getRevealedPowerfulVillagers(playersList)
                .filter(p => p.id !== cpu.id);

            // Check if there are revealed wolves to poison
            const revealedWolves = getRevealedWolves(playersList);

            // Decision making
            if (hasPoison && revealedWolves.length > 0) {
                // Priority: poison revealed wolves
                const target = revealedWolves[Math.floor(Math.random() * revealedWolves.length)];
                handlePoisonPotion({
                    type: cpu.role.canPerform2.type,
                    playerId: cpu.id,
                    selectedPlayerId: target.id,
                    selectedPlayerName: target.name,
                }, gameId, rooms, io);
            } else if (hasProtect && revealedPowerful.length > 0) {
                // Protect revealed powerful villagers
                const target = revealedPowerful[Math.floor(Math.random() * revealedPowerful.length)];
                handleProtectPotion({
                    type: cpu.role.canPerform1.type,
                    playerId: cpu.id,
                    selectedPlayerId: target.id,
                    selectedPlayerName: target.name,
                }, gameId, rooms, io);
            } else if (hasPoison && Math.random() < 0.3) {
                // Sometimes poison a suspected player
                const target = getBestVillageTarget(playersList, cpu.id);
                if (target) {
                    handlePoisonPotion({
                        type: cpu.role.canPerform2.type,
                        playerId: cpu.id,
                        selectedPlayerId: target.id,
                        selectedPlayerName: target.name,
                    }, gameId, rooms, io);
                }
            }
            break;

        case "Doctor":
            // Smart Doctor logic: protect revealed villagers
            const protectionTarget = getBestProtectionTarget(playersList, cpu.id);
            if (protectionTarget) {
                handleHeal({
                    type: "heal",
                    playerId: cpu.id,
                    selectedPlayerId: protectionTarget.id,
                    selectedPlayerName: protectionTarget.name,
                }, gameId, rooms, io);
            }
            break;

        case "Medium":
            // Smart Medium logic: prioritize reviving powerful villagers
            if (cpu.role.canPerform1?.nbrLeftToPerform > 0) {
                const deadPlayers = playersList.filter(p => !p.isAlive);
                if (deadPlayers.length > 0) {
                    const reviveTarget = getBestReviveTarget(playersList);
                    if (reviveTarget) {
                        handleRevive({
                            type: "revive",
                            playerId: cpu.id,
                            selectedPlayerId: reviveTarget.id,
                            selectedPlayerName: reviveTarget.name,
                        }, gameId, rooms, io);
                    }
                }
            }
            break;

        case "Jailer":
            // Execute prisoner if they're suspicious (revealed wolf or solo threat)
            if (dayCount !== 0 && cpu.hasHandcuffed) {
                let handcuffedPlayer = getPlayerWithId(playersList, cpu.hasHandcuffed);
                if (handcuffedPlayer && cpu.role.canPerform2?.nbrLeftToPerform > 0) {
                    // Execute if revealed as wolf or solo threat
                    const shouldExecute =
                        (handcuffedPlayer.isRevealed && handcuffedPlayer.role.team === "Werewolves") ||
                        (handcuffedPlayer.isRevealed && ["Serial Killer", "Arsonist"].includes(handcuffedPlayer.role.name)) ||
                        Math.random() < 0.2; // Small chance to execute otherwise

                    if (shouldExecute) {
                        handleExecutePrisoner({
                            type: "execute",
                            playerId: cpu.id,
                            selectedPlayerId: cpu.hasHandcuffed,
                            selectedPlayerName: handcuffedPlayer.name,
                        }, gameId, rooms, io);
                    }
                }
            }
            break;

        case "Cupid":
            // Link lovers on first night only
            if (cpu.role.canPerform1?.nbrLeftToPerform > 0 && dayCount === 0) {
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

        case "Grave Robber":
            // Loot graves to gain information
            if (Math.random() < 0.5) {
                let deadPlayer = getRandomDeadPlayer(playersList);
                if (deadPlayer) {
                    handleLootGrave({
                        type: "loot",
                        graveRobberId: cpu.id,
                        selectedPlayerId: deadPlayer.id,
                        selectedPlayerName: deadPlayer.name,
                        selectedPlayerRole: deadPlayer.role,
                    }, gameId, rooms, io);
                }
            }
            break;

        // =====================================================================
        // SOLO ROLES
        // =====================================================================
        case "Serial Killer":
            // Serial Killer tries to kill someone every night
            // Avoid revealed wolves (they're enemies of village, let them fight)
            const skTargets = playersList.filter(
                p => p.isAlive &&
                p.id !== cpu.id &&
                !p.isUnderArrest &&
                p.role.team !== "Werewolves" // Prefer non-wolves
            );

            let victim;
            if (skTargets.length > 0) {
                victim = skTargets[Math.floor(Math.random() * skTargets.length)];
            } else {
                victim = getRandomAlivePlayer(playersList, false, false, cpu.id);
            }

            if (victim) {
                handleRegisterAction({
                    type: "murder",
                    killerId: cpu.id,
                    selectedPlayerId: victim.id,
                    selectedPlayerName: victim.name,
                }, gameId, rooms, io);
            }
            break;

        case "Arsonist":
            // Arsonist: pour gasoline or burn when enough targets
            const markedCount = getNbrOfPlayersMarkedWithGasoline(playersList);

            if (markedCount >= 3 && Math.random() < 0.5) {
                // Burn when 3+ players are marked
                handleBurnThemDown({
                    type: "burn",
                    pyroId: cpu.id,
                }, gameId, rooms, io);
            } else {
                // Pour gasoline on someone new
                const unmarkedPlayers = playersList.filter(
                    p => p.isAlive && !p.isMarkedWithGasoline && p.id !== cpu.id
                );
                const target = unmarkedPlayers.length > 0
                    ? unmarkedPlayers[Math.floor(Math.random() * unmarkedPlayers.length)]
                    : getRandomAlivePlayer(playersList, false, false, cpu.id);

                if (target) {
                    handlePourGasoline({
                        type: "pour",
                        pyroId: cpu.id,
                        selectedPlayerId: target.id,
                        selectedPlayerName: target.name,
                    }, gameId, rooms, io);
                }
            }
            break;

        case "Ghost Lady":
            // Ghost Lady ALWAYS visits someone each night (that's her goal)
            // Visit any alive player except herself
            const visitTargets = playersList.filter(
                p => p.isAlive && p.id !== cpu.id && !p.isUnderArrest
            );

            if (visitTargets.length > 0) {
                // Prefer non-wolves (safer to visit)
                const safeTargets = visitTargets.filter(p => p.role.team !== "Werewolves");
                const target = safeTargets.length > 0
                    ? safeTargets[Math.floor(Math.random() * safeTargets.length)]
                    : visitTargets[Math.floor(Math.random() * visitTargets.length)];

                handleGhostVisit({
                    type: "ghostVisit",
                    ghostLadyId: cpu.id,
                    selectedPlayerId: target.id,
                    selectedPlayerName: target.name,
                }, gameId, rooms, io);
            }
            break;

        case "Fool":
            // Fool doesn't have night actions
            break;

        default:
            break;
    }
};
