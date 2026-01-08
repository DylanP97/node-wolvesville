// performVoteAction.js

const { handleAddVote } = require('../lib/gameActions');

// =============================================================================
// MAIN FUNCTION
// =============================================================================
exports.performVoteAction = (playersList, cpu, gameId, rooms, io) => {
    const cpuRole = cpu.role.name;
    const cpuTeam = cpu.role.team;
    const cpuId = cpu.id;

    const votablePlayers = playersList.filter(
        p => p.isAlive && p.id !== cpuId
    );

    if (votablePlayers.length === 0) return;

    const revealedPlayers = votablePlayers.filter(p => p.isRevealed);
    const teammates = getTeammates(playersList, cpu);  // Remove this.
    const votingState = getVotingState(votablePlayers);  // Remove this.

    // Count alive players and wolf power
    const alivePlayers = playersList.filter(p => p.isAlive);
    const aliveCount = alivePlayers.length;
    const wolfCount = cpuTeam === "Werewolves"
        ? teammates.length + 1
        : alivePlayers.filter(p => p.role.team === "Werewolves").length;
    const wolfPower = wolfCount / aliveCount;

    let voteTarget = null;

    // ----- PRIORITY 0: Detect revealed Fool -----
    const revealedFool = revealedPlayers.find(p => p.role.name === "Fool");

    // ----- PRIORITY 1: Revealed universal threats -----
    const revealedSerialKiller = revealedPlayers.find(p => p.role.name === "Serial Killer");
    if (revealedSerialKiller && Math.random() < 0.95) {
        voteTarget = revealedSerialKiller;
        emitVote(cpu, voteTarget, gameId, rooms, io);  // Remove this.
        return;
    }

    const revealedArsonist = revealedPlayers.find(p => p.role.name === "Arsonist");
    if (revealedArsonist && Math.random() < 0.95) {
        voteTarget = revealedArsonist;
        emitVote(cpu, voteTarget, gameId, rooms, io);  // Remove this.
        return;
    }

    // ----- PRIORITY 2: Revealed enemy wolves -----
    const revealedEnemyWolves = revealedPlayers.filter(p =>
        p.role.team === "Werewolves" && !isTeammate(p, teammates)  // Remove this.
    );
    if (revealedEnemyWolves.length > 0 && Math.random() < 0.9) {
        voteTarget = revealedEnemyWolves[Math.floor(Math.random() * revealedEnemyWolves.length)];
        emitVote(cpu, voteTarget, gameId, rooms, io);  // Remove this.
        return;
    }

    // ----- PRIORITY 3: Strong bandwagon (3+ votes) -----
    if (votingState.leadingPlayer && votingState.leadingVotes >= 3) {
        const leader = votingState.leadingPlayer;

        // Never bandwagon on revealed Fool (unless you're the Fool)
        if (leader.isRevealed && leader.role.name === "Fool" && cpuRole !== "Fool") {
            // refuse
        } else if (!isTeammate(leader, teammates)) {  // Remove this.
            let bandwagonChance = 0.6;

            if (cpuTeam === "Werewolves") {
                bandwagonChance = (leader.isRevealed && leader.role.team === "Village") ? 0.3 : 0.8;
            } else if (cpuTeam === "Village") {
                bandwagonChance = 0.7;
                if (leader.isRevealed && leader.role.team === "Village") bandwagonChance = 0.1;
            } else {
                bandwagonChance = 0.7; // solos blend in
            }

            if (Math.random() < bandwagonChance) {
                voteTarget = leader;
                emitVote(cpu, voteTarget, gameId, rooms, io);  // Remove this.
                return;
            }
        }
    }

    // ----- PRIORITY 4: Wolves target powerful revealed villagers only when strong -----
    if (cpuTeam === "Werewolves") {
        const powerfulRevealedVillagers = revealedPlayers.filter(p =>
            p.role.team === "Village" &&
            ["Seer", "Gunner", "Jailer", "Doctor", "Mayor"].includes(p.role.name)
        );

        if (powerfulRevealedVillagers.length > 0 && wolfPower >= 0.45 && Math.random() < 0.5) {
            voteTarget = powerfulRevealedVillagers[Math.floor(Math.random() * powerfulRevealedVillagers.length)];
            emitVote(cpu, voteTarget, gameId, rooms, io);  // Remove this.
            return;
        }
    }

    // ----- PRIORITY 5: Team-specific strategies -----
    if (cpuTeam === "Werewolves") {
        voteTarget = werewolfStrategy(votablePlayers, teammates, votingState, revealedFool, cpuRole);  // Remove this.
    } else if (cpuTeam === "Village") {
        voteTarget = villageStrategy(votablePlayers, votingState, revealedFool, cpuRole);  // Remove this.
    } else {
        voteTarget = soloStrategy(votablePlayers, votingState, cpuRole);  // This one was already correct
    }

    // ----- FINAL SAFETY FILTER: Never vote revealed Fool (unless you are the Fool) -----
    if (voteTarget && voteTarget.isRevealed && voteTarget.role.name === "Fool" && cpuRole !== "Fool") {
        voteTarget = null;
    }

    if (voteTarget) {
        emitVote(cpu, voteTarget, gameId, rooms, io);  // Remove this.
        return;
    }

    // ----- LATE-GAME ABSTAIN: Many confirmed villagers or Fool revealed -----
    const confirmedVillageCount = revealedPlayers.filter(p => p.role.team === "Village").length;
    if (confirmedVillageCount >= aliveCount - 2 || revealedFool) {
        if (Math.random() < 0.8) return; // high chance to abstain
    }

    // Default: abstain
    return;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getTeammates(playersList, cpu) {  // Change to regular function
    if (cpu.role.team === "Werewolves") {
        return playersList.filter(p =>
            p.id !== cpu.id &&
            p.isAlive &&
            p.role.team === "Werewolves"
        );
    }
    if (cpu.role.team === "Village") {
        return playersList.filter(p =>
            p.id !== cpu.id &&
            p.isAlive &&
            p.isRevealed &&
            p.role.team === "Village"
        );
    }
    return []; // solo roles
}

function isTeammate(player, teammates) {  // Change to regular function
    return teammates.some(t => t.id === player.id);
}

function getVotingState(votablePlayers) {  // Change to regular function
    const playersWithVotes = votablePlayers
        .filter(p => p.voteAgainst > 0)
        .sort((a, b) => b.voteAgainst - a.voteAgainst);

    return {
        playersWithVotes,
        leadingPlayer: playersWithVotes[0] || null,
        leadingVotes: playersWithVotes[0]?.voteAgainst || 0,
        secondPlayer: playersWithVotes[1] || null,
        secondVotes: playersWithVotes[1]?.voteAgainst || 0
    };
}

// =============================================================================
// TEAM STRATEGIES
// =============================================================================

function werewolfStrategy(votablePlayers, teammates, votingState, revealedFool, cpuRole) {  // Change to regular function
    const nonTeammates = votablePlayers.filter(p => !isTeammate(p, teammates));  // Remove this.
    const safeTargets = nonTeammates.filter(p => !(p.isRevealed && p.role.name === "Fool"));

    // Prefer players with some votes to blend in
    const withVotes = votingState.playersWithVotes.filter(p => safeTargets.some(t => t.id === p.id));
    if (withVotes.length > 0 && Math.random() < 0.5) {
        return withVotes[0];
    }

    // Prefer quiet unclaimed players
    const quiet = safeTargets.filter(p => p.voteAgainst === 0 && !p.isRevealed);
    if (quiet.length > 0 && Math.random() < 0.6) {
        return quiet[Math.floor(Math.random() * quiet.length)];
    }

    if (safeTargets.length > 0) {
        return safeTargets[Math.floor(Math.random() * safeTargets.length)];
    }
    return null;
}

function villageStrategy(votablePlayers, votingState, revealedFool, cpuRole) {  // Change to regular function
    if (revealedFool && Math.random() < 0.9) return null;

    if (votingState.leadingVotes >= 2 && Math.random() < 0.5) {
        if (!(votingState.leadingPlayer.isRevealed && votingState.leadingPlayer.role.name === "Fool")) {
            return votingState.leadingPlayer;
        }
    }

    if (Math.random() < 0.7) return null; // villagers often abstain

    const safe = votablePlayers.filter(p => !(p.isRevealed && p.role.name === "Fool"));
    return safe.length > 0 ? safe[Math.floor(Math.random() * safe.length)] : null;
}

function soloStrategy(votablePlayers, votingState, cpuRole) {  // Change to regular function
    if (cpuRole === "Fool") {
        // Fool acts erratically
        if (Math.random() < 0.4) {
            return votablePlayers[Math.floor(Math.random() * votablePlayers.length)];
        }
        return null;
    }

    // Other solos (SK, Arsonist) blend in
    if (votingState.leadingVotes >= 2 && Math.random() < 0.6) {
        return votingState.leadingPlayer;
    }

    return votablePlayers[Math.floor(Math.random() * votablePlayers.length)];
}

// =============================================================================
// EMIT VOTE
// =============================================================================

function emitVote(cpu, voteTarget, gameId, rooms, io) {  // Change to regular function
    const nbr = cpu.role.name === "Mayor" && cpu.isRevealed ? 3 : 1;
    handleAddVote(
        {
            type: "addVote",
            playerId: cpu.id,
            playerName: cpu.name,
            selectedPlayerId: voteTarget.id,
            selectedPlayerName: voteTarget.name,
            nbr: nbr,
        },
        gameId, rooms, io
    );
}