class Player {
    constructor(id, name, role, avatar) {
        this.id = id || 0;
        this.name = name || "";
        this.role = role || "";
        this.avatar = avatar || "";
        this.isAlive = true;
        this.isRevealed = false;
        this.voteAgainst = 0;
        this.isUnderArrest = false;
    }
}

module.exports = Player;