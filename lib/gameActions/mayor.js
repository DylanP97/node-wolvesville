exports.assertDuty = (playersList) => {
  return playersList.map((ply) => {
    if (!ply?.role) {
      return ply;
    }

    if (ply.role.name === "Mayor") {
      return {
        ...ply,
        isRevealed: true,
        role: {
          ...ply.role,
          canPerform1: {
            ...ply.role.canPerform1,
            nbrLeftToPerform: 0,
          },
        },
      };
    }

    return ply;
  });
};
