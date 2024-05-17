class Player {
  constructor(id, name, role, avatar, isCPU) {
    this.id = id || 0;
    this.name = name || "";
    this.role = role || "";
    this.avatar = avatar || "";
    this.isCPU = isCPU || undefined;
    this.isAlive = true;
    this.isRevealed = false;
    this.voteAgainst = 0;
    this.isUnderArrest = false;
  }
}

module.exports = Player;
