exports.assertDuty = (playersList) => {
  console.log("assertDuty fn");

  return playersList.map((ply) => {
    if (ply && !ply.role) {
      console.log(ply);
    }
    if (ply && ply.role && ply.role.name === "Mayor") {
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
    } else {
      return ply;
    }
  });
};
