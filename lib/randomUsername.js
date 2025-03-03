const {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
  names,
  languages,
} = require("unique-names-generator");

// Function to generate a random short name
const shortName = () => {
  const option =
    Math.random() < 0.3 ? "name" : Math.random() < 0.5 ? "animal" : "origin";

  if (option === "name") {
    return uniqueNamesGenerator({
      dictionaries: [names],
    }); // e.g., Winona
  } else if (option === "origin") {
    return uniqueNamesGenerator({
      dictionaries: [languages, animals],
      separator: "_",
      length: 2,
    }); // e.g., Bengali_fish
  } else {
    return uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: "-",
      length: 2,
    }); // e.g., big-donkey
  }
};

// Export the function for use in other modules
module.exports = {
  shortName,
};
