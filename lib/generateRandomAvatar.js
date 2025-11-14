/**
 * Generates a random avatar configuration for CPU players
 * Uses Dicebear Avataaars style options
 */

// Available options for each avatar property
const avatarOptions = {
  accessories: [
    null,
    "round",
    "wayfarers",
    "kurt",
    "prescription01",
    "prescription02",
    "sunglasses",
  ],
  accessoriesColor: [
    "a7ffc4",
    "e6e6e6",
    "262e33",
    "65c9ff",
    "5199e4",
    "25557c",
    "3c4f5c",
  ],
  clothesColor: [
    "262e33",
    "3c4f5c",
    "65c9ff",
    "5199e4",
    "25557c",
    "e6e6e6",
    "f4f4f4",
  ],
  clothing: [
    "graphicShirt",
    "hoodie",
    "overall",
    "shirtCrewNeck",
    "shirtScoopNeck",
    "shirtVNeck",
  ],
  eyebrows: [
    "default",
    "defaultNatural",
    "flatNatural",
    "raisedExcited",
    "raisedExcitedNatural",
    "unibrowNatural",
    "upDown",
    "upDownNatural",
  ],
  eyes: [
    "default",
    "close",
    "cry",
    "dizzy",
    "eyeRoll",
    "happy",
    "hearts",
    "side",
    "squint",
    "surprised",
    "wink",
    "winkWacky",
  ],
  facialHair: [
    null,
    "beardLight",
    "beardMedium",
    "beardMagestic",
    "moustacheFancy",
    "moustacheMagnum",
  ],
  facialHairColor: [
    "2c1b18",
    "4a312c",
    "a55728",
    "c93305",
    "e6e6e6",
  ],
  hairColor: [
    "4a312c",
    "724133",
    "a55728",
    "c93305",
    "e6e6e6",
    "f4f4f4",
    "ffffff",
  ],
  hatColor: [
    "e6e6e6",
    "262e33",
    "3c4f5c",
    "65c9ff",
    "5199e4",
    "25557c",
  ],
  mouth: [
    "default",
    "concerned",
    "disbelief",
    "eating",
    "grimace",
    "sad",
    "screamOpen",
    "serious",
    "smile",
    "tongue",
    "twinkle",
    "vomit",
  ],
  skinColor: [
    "ffdbb4",
    "f8d25c",
    "fd9841",
    "c68642",
    "8d5524",
    "654321",
  ],
  top: [
    "shortRound",
    "shortWaved",
    "shortFlat",
    "longHair",
    "longHairBob",
    "longHairBun",
    "longHairCurly",
    "longHairCurvy",
    "longHairDreads",
    "longHairFrida",
    "longHairFro",
    "longHairFroBand",
    "longHairNotTooLong",
    "longHairShavedSides",
    "longHairMiaWallace",
    "longHairStraight",
    "longHairStraight2",
    "longHairStraightStrand",
    "noHair",
    "hat",
    "hijab",
    "turban",
    "winterHat1",
    "winterHat2",
    "winterHat3",
    "winterHat4",
  ],
};

/**
 * Gets a random element from an array
 */
const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Generates a random avatar configuration
 * @returns {Object} Random avatar configuration
 */
exports.generateRandomAvatar = () => {
  const hasAccessories = Math.random() > 0.5; // 50% chance
  const hasFacialHair = Math.random() > 0.6; // 40% chance
  const hasHat = Math.random() > 0.7; // 30% chance

  const avatar = {
    accessories: hasAccessories ? [getRandomElement(avatarOptions.accessories)] : [null],
    accessoriesColor: hasAccessories
      ? [getRandomElement(avatarOptions.accessoriesColor)]
      : [null],
    accessoriesProbability: hasAccessories ? 100 : 0,
    backgroundColor: [getRandomElement(["65c9ff", "e6e6e6", "f4f4f4", "ffffff"])],
    backgroundType: ["solid"],
    clothesColor: [getRandomElement(avatarOptions.clothesColor)],
    clothing: [getRandomElement(avatarOptions.clothing)],
    clothingGraphic: [null],
    eyebrows: [getRandomElement(avatarOptions.eyebrows)],
    eyes: [getRandomElement(avatarOptions.eyes)],
    facialHair: hasFacialHair ? [getRandomElement(avatarOptions.facialHair)] : [null],
    facialHairColor: hasFacialHair
      ? [getRandomElement(avatarOptions.facialHairColor)]
      : [null],
    facialHairProbability: hasFacialHair ? 100 : 0,
    hairColor: [getRandomElement(avatarOptions.hairColor)],
    hatColor: hasHat ? [getRandomElement(avatarOptions.hatColor)] : [null],
    mouth: [getRandomElement(avatarOptions.mouth)],
    size: 64,
    skinColor: [getRandomElement(avatarOptions.skinColor)],
    top: [getRandomElement(avatarOptions.top)],
    topProbability: 100,
  };

  return avatar;
};

