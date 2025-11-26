const bittenByWolves = (playersList, cursedId, wolvesKnowledge) => {
    const cursedIndex = playersList.findIndex((p) => p.id === cursedId);

    const classicWerewolf = {
        "canPerform1": null,
        "_id": "6613fd9fdf9909d575323f1f",
        "name": "Classic Werewolf",
        "team": "Werewolves",
        "canVote": true,
        "image": "https://res.cloudinary.com/dnhq4fcyp/image/upload/v1706531401/roles/werewolf_onriov.png",
        "description": "As a werewolf, you can vote at night",
        "status": 1,
        "descriptionFR": "Chaque nuit vous devez choisir un joueur à tuer. Même si c'est un rôle basique, il peut servir de support essentiel s'il est bien joué.",
        "nameFR": "Loup-Garou Simple",
        "teamFR": "Loups-Garous"
    }

    if (cursedIndex !== -1) {
        playersList[cursedIndex] = {
            ...playersList[cursedIndex],
            role: classicWerewolf,
            wasCursed: true,
            isAlive: true,
            wolvesKnowledge: wolvesKnowledge
        }
    }

    return playersList;
};

module.exports = { bittenByWolves };

