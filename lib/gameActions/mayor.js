exports.assertDuty = (playersList) => {
  console.log("assertDuty fn");

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
    } else {
      return ply;
    }
  });
};
