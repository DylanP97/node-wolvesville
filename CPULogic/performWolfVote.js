
// performWolfVote.js
const { handleAddWolfVote } = require("../lib/gameActions");

exports.performWolfVote = (playersList, cpu, gameId, rooms, io) => {
    // ========== KNOWLEDGE EXTRACTION ==========
    const cpuRole = cpu.role.name;
    const cpuId = cpu.id;

    // Get all alive, killable players (non-wolves, not arrested)
    const killableTargets = playersList.filter(
        p => p.isAlive &&
            !p.isUnderArrest &&
            p.id !== cpuId &&
            p.role.team !== "Werewolves" // Can't kill fellow wolves
    );

    if (killableTargets.length === 0) return; // No one to kill

    // Revealed players (wolves know who's who from Seer or Wolf Seer)
    const revealedTargets = killableTargets.filter(p => p.isRevealed);

    // Other wolves (for coordination)
    const otherWolves = playersList.filter(p =>
        p.id !== cpuId &&
        p.isAlive &&
        p.role.team === "Werewolves"
    );

    // Current wolf voting state
    const wolfVotingState = getWolfVotingState(killableTargets);

    // Vote weight for this wolf
    const voteWeight = cpuRole === "Alpha Werewolf" ? 2 : 1;

    // ========== VOTING DECISION CASCADE ==========
    let killTarget = null;

    // PRIORITY 1: Target revealed powerful village roles (80% certainty)
    // These are high-value eliminations that help wolves win
    const revealedPowerRoles = revealedTargets.filter(p =>
        p.role.team === "Village" &&
        ["Seer", "Gunner", "Jailer", ""].includes(p.role.name)
    );

    if (revealedPowerRoles.length > 0 && Math.random() < 0.8) {
        // Prioritize: Mayor > Seer > Gunner > Jailer
        const mayor = revealedPowerRoles.find(p => p.role.name === "Mayor");
        if (mayor) {
            emitWolfVote(cpu, mayor, voteWeight, gameId, rooms, io);
            return;
        }

        const seer = revealedPowerRoles.find(p => p.role.name === "Seer");
        if (seer) {
            emitWolfVote(cpu, seer, voteWeight, gameId, rooms, io);
            return;
        }

        // Otherwise random power role
        killTarget = revealedPowerRoles[Math.floor(Math.random() * revealedPowerRoles.length)];
        emitWolfVote(cpu, killTarget, voteWeight, gameId, rooms, io);
        return;
    }

    // PRIORITY 2: Coordinate with other wolves (bandwagon if 2+ votes exist)
    // Wolves should coordinate their kills for efficiency
    if (wolfVotingState.leadingTarget && wolfVotingState.leadingVotes >= 2) {
        // 75% chance to coordinate with pack
        if (Math.random() < 0.75) {
            emitWolfVote(cpu, wolfVotingState.leadingTarget, voteWeight, gameId, rooms, io);
            return;
        }
    }

    // PRIORITY 3: Kill revealed Doctor (healing is a threat)
    const revealedDoctor = revealedTargets.find(p =>
        p.role.team === "Village" &&
        p.role.name === "Doctor"
    );
    if (revealedDoctor && Math.random() < 0.65) {
        emitWolfVote(cpu, revealedDoctor, voteWeight, gameId, rooms, io);
        return;
    }

    // PRIORITY 4: Target any revealed villager (known enemy)
    const revealedVillagers = revealedTargets.filter(p => p.role.team === "Village");
    if (revealedVillagers.length > 0 && Math.random() < 0.55) {
        killTarget = revealedVillagers[Math.floor(Math.random() * revealedVillagers.length)];
        emitWolfVote(cpu, killTarget, voteWeight, gameId, rooms, io);
        return;
    }

    // PRIORITY 5: Avoid revealed solo roles early game (let them create chaos)
    // Solo roles (Serial Killer, Arsonist) hurt the village too
    const revealedSoloRoles = revealedTargets.filter(p =>
        ["Serial Killer", "Arsonist"].includes(p.role.name)
    );

    // Get game progress (day count would help here, but we can estimate from alive count)
    const totalAlive = playersList.filter(p => p.isAlive).length;
    const isLateGame = totalAlive <= 6; // Late game: fewer players

    // Early/mid game: avoid solo roles (30% chance to kill them)
    // Late game: kill everyone (70% chance)
    if (revealedSoloRoles.length > 0) {
        const soloKillChance = isLateGame ? 0.7 : 0.3;
        if (Math.random() < soloKillChance) {
            killTarget = revealedSoloRoles[Math.floor(Math.random() * revealedSoloRoles.length)];
            emitWolfVote(cpu, killTarget, voteWeight, gameId, rooms, io);
            return;
        }
    }

    // PRIORITY 6: Follow another wolf's vote if one exists (coordination)
    if (wolfVotingState.playersWithVotes.length > 0 && Math.random() < 0.5) {
        killTarget = wolfVotingState.playersWithVotes[0];
        emitWolfVote(cpu, killTarget, voteWeight, gameId, rooms, io);
        return;
    }

    // PRIORITY 7: Strategic targeting of unrevealed players
    const unrevealedTargets = killableTargets.filter(p => !p.isRevealed);

    if (unrevealedTargets.length > 0) {
        // Check for suspicious voting patterns (potential power roles)
        const suspiciousPlayers = identifySuspiciousVillagers(unrevealedTargets, playersList);

        if (suspiciousPlayers.length > 0 && Math.random() < 0.6) {
            // Target suspicious players (might be Seer, Doctor, etc.)
            killTarget = suspiciousPlayers[Math.floor(Math.random() * suspiciousPlayers.length)];
            emitWolfVote(cpu, killTarget, voteWeight, gameId, rooms, io);
            return;
        }

        // 40% chance to target quiet players (potential power roles hiding)
        // 60% chance to target active players (remove vocal villagers)
        if (Math.random() < 0.4) {
            // Target quiet players with no votes against them
            const quietTargets = unrevealedTargets.filter(p => p.voteAgainst === 0);
            if (quietTargets.length > 0) {
                killTarget = quietTargets[Math.floor(Math.random() * quietTargets.length)];
                emitWolfVote(cpu, killTarget, voteWeight, gameId, rooms, io);
                return;
            }
        }
    }

    // FALLBACK: Random target (should rarely reach here)
    if (killableTargets.length > 0) {
        killTarget = killableTargets[Math.floor(Math.random() * killableTargets.length)];
        emitWolfVote(cpu, killTarget, voteWeight, gameId, rooms, io);
    }
}

// ========== HELPER FUNCTIONS ==========

exports.getWolfVotingState = (killableTargets) => {
    // Get targets that already have wolf votes
    const playersWithVotes = killableTargets
        .filter(p => (p.wolfVoteAgainst || 0) > 0)
        .sort((a, b) => (b.wolfVoteAgainst || 0) - (a.wolfVoteAgainst || 0));

    return {
        playersWithVotes: playersWithVotes,
        leadingTarget: playersWithVotes[0] || null,
        leadingVotes: playersWithVotes[0]?.wolfVoteAgainst || 0,
        secondTarget: playersWithVotes[1] || null,
        secondVotes: playersWithVotes[1]?.wolfVoteAgainst || 0
    };
}

exports.identifySuspiciousVillagers = (unrevealedTargets, playersList) => {
    // Identify players who might be power roles based on behavior
    const suspicious = [];

    unrevealedTargets.forEach(target => {
        // Check if they voted for revealed wolves (might be Seer)
        if (target.hasVotedFor) {
            const votedPlayer = playersList.find(p => p.id === target.hasVotedFor);
            if (votedPlayer &&
                votedPlayer.isRevealed &&
                votedPlayer.role.team === "Werewolves") {
                suspicious.push(target);
            }
        }

        // Players who consistently avoid getting voted might be protected (Doctor self-healing?)
        // This is a heuristic - would need vote history for better detection
        if (target.voteAgainst === 0 && target.survivedNights > 2) {
            // Survived multiple nights with no suspicion - might be power role
            suspicious.push(target);
        }
    });

    return [...new Set(suspicious)]; // Remove duplicates
}

// ========== EMIT WOLF VOTE ==========

exports.emitWolfVote = (cpu, target, voteWeight, gameId, rooms, io) => {
    handleAddWolfVote({
        playerId: cpu.id,
        playerName: cpu.name,
        selectedPlayerId: target.id,
        selectedPlayerName: target.name,
        nbr: voteWeight,
    }, gameId, rooms, io);
}

