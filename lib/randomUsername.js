import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
  names,
  languages,
} from "unique-names-generator";

export const shortName = () => {
  const option =
    Math.random() < 0.3 ? "name" : Math.random() < 0.5 ? "animal" : "origin";

  if (option === "name") {
    return uniqueNamesGenerator({
      dictionaries: [names],
    }); // Winona
  } else if (option === "origin") {
    return uniqueNamesGenerator({
      dictionaries: [languages, animals],
      separator: "_",
      length: 2,
    }); // Bengali_fish
  } else {
    return uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: "-",
      length: 2,
    }); // big-donkey
  }
};
