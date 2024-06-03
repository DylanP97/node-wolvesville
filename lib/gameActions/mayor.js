exports.assertDuty = (playersList) => {
  return playersList.map((ply) => {
    if (ply.role.name === "Mayor") {
      return {
        ...ply,
        isRevealed: true,
        role: {
          ...ply.role,
          canPerform: {
            ...ply.role.canPerform,
            nbrLeftToPerform: 0,
          },
        },
      };
    }
  });
};
