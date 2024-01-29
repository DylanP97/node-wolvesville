const rolesIcons = require ("../icons/roles");
const selectionIcons = require ("../icons/selection");

exports.roles = [
  // village
  // ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  {
    name: "Villager",
    team: ["village"],
    canVote: true,
    canPerform: null,
    image: rolesIcons["villager"],
    description: "The villager is a normal person. They can vote, but can't perform any special action.",
  },
  {
    name: "Jailer",
    team: ["village"],
    canVote: true,
    canPerform: {
      label: "Handcuff a player",
      emoji: selectionIcons['handcuffs'],
      type: "arrest",
      needSelection: true,
      actionTime: "day",
    },
    image: rolesIcons["jailer"],
    description:
    "The jailer can decide to arrest the person he wants each day. The arrested person will be in jail for one night.",
  },
  {
    name: "Gunner",
    team: ["village"],
    canVote: true,
    canPerform: {
      label: "Select someone to shoot",
      emoji: selectionIcons['target'],
      type: "shoot",
      needSelection: true,
      actionTime: "day",
      nbrLeftToPerform: 2,
    },
    image: rolesIcons["gunner"],
    description: "The gunner has two bullets and can shoot instantaneously the person he wants during the day.",
  },
  {
    name: "Seer",
    team: ["village"],
    canVote: true,
    canPerform: {
      label: "Choose a player to reveal it's role.",
      emoji: selectionIcons['reveal'],
      type: "reveal",
      needSelection: true,
      actionTime: "day",
      nbrLeftToPerform: 1,
    },
    image: rolesIcons["seer"],
    description:
      "The Seer possesses the unique ability to unveil the true nature of a player. During the day, the Seer can select a player to reveal its role instantly. The Seer can only perform this action once per game.",
  },
  {
    name: "Cupid",
    team: ["village", "lovers"],
    canVote: true,
    canPerform: {
      label: "Link two players together in love",
      emoji: selectionIcons['bowAndArrow'],
      type: "love",
      needSelection: false,
      needDoubleSelection: true,
      actionTime: "night",
      nbrLeftToPerform: 1,
    },
    image: rolesIcons["cupid"],
    description:
      "Cupid is the matchmaker of the town, with the power to create a bond of love between two players. During the night, Cupid can choose two players to link together, making them 'lovers.' If one of the lovers is killed, the other will also perish from heartbreak.",
  },
  {
    name: "Doctor",
    team: ["village"],
    canVote: true,
    canPerform: {
      label: "Select someone to heal",
      emoji: selectionIcons['bandAid'],
      type: "heal",
      needSelection: true,
      actionTime: "night",
    },
    image: rolesIcons["doctor"],
    description:
      "The doctor can protect the person he wants each night. If the selected player is attacked during the night, he will be healed.",
  },
  {
    name: "Detective",
    team: ["village"],
    canVote: true,
    canPerform: {
      label: "Investigate two players.",
      emoji: selectionIcons['magnifyingGlass'],
      type: "investigate",
      needSelection: false,
      needDoubleSelection: true,
      actionTime: "night",
    },
    image: rolesIcons["detective"],
    description:
      "The detective can check two persons and see if they are in the same or different team during the night.",
  },
  {
    name: "Mayor",
    team: ["village"],
    canVote: true,
    canPerform: {
      label: "Choose a player to double vote against.",
      emoji: selectionIcons['voteAgainstIcon'],
      type: "doubleVote",
      needSelection: true,
      actionTime: "vote",
    },
    image: rolesIcons["mayor"],
    description: "The mayor vote counts double.",
  },
  {
    name: "Grumpy Grandma",
    team: ["village"],
    canVote: true,
    canPerform: {
      label: "Choose a player to prevent him to vote",
      emoji: selectionIcons['mute'],
      type: "mute",
      needSelection: true,
      actionTime: "day",
      nbrLeftToPerform: 3,
    },
    image: rolesIcons["grumpyGrandma"],
    description: "The grumpy grandma can prevent a player from voting three times in a game.",
  },
  {
    name: "Priest",
    team: ["village"],
    canVote: true,
    canPerform: {
      label: "Throw the holy water",
      emoji: selectionIcons['holyWater'],
      type: "throw",
      needSelection: true,
      actionTime: "night",
      nbrLeftToPerform: 1,
    },
    image: rolesIcons["priest"],
    description:
      "Once per game, the Priest can throw holy water at a player. If this player is against the village, he will die. Otherwise, it is the Priest who dies.",
  },
  {
    name: "Grave Robber",
    team: ["village"],
    canVote: true,
    canPerform: {
      label: "Select someone to loot its grave",
      emoji: selectionIcons['shovel'],
      type: "loot",
      needSelection: true,
      actionTime: "night",
    },
    image: rolesIcons["graveRobber"],
    description:
      "You can choose from dead players. At the start of the next day? you will take on his role, and thus potentially change teams.",
  },
  // solo or other players
  // ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  {
    name: "Serial Killer",
    team: ["serial killer"],
    canVote: true,
    canPerform: {
      label: "Select someone to murder tonight",
      emoji: selectionIcons['knife'],
      type: "murder",
      needSelection: true,
      actionTime: "night",
    },
    image: rolesIcons["serialKiller"],
    description: "The serial killer can kill one person every night!",
  },
  {
    name: "Fool",
    team: ["fool"],
    canVote: true,
    canPerform: null,
    image: rolesIcons["fool"],
    description: "The fool goal is that the people vote for him during the day! If that happens he wins the game.",
  },
  {
    name: "Pyromaniac",
    team: ["pyromaniac"],
    canVote: true,
    canPerform: {
      label: "Select someone to pour liquid at",
      emoji: selectionIcons['pouring'],
      type: "pouring",
      needSelection: true,
      actionTime: "night",
    },
    playersToSetOnFire: [],
    image: rolesIcons["pyromaniac"],
    description:
      "The pyromaniac can choose to burn the person he wants each night. The burned person will die tonight.",
  },
  {
    name: "Ghost Lady",
    team: ["ghost lady"],
    canVote: true,
    canPerform: {
      label: "Select someone to visit tonight",
      emoji: selectionIcons['whiteFlame'],
      type: "",
      needSelection: true,
      actionTime: "night",
    },
    image: rolesIcons["ghostLady"],
    description: "",
  },
  {
    name: "Bandit",
    team: ["bandits"],
    canVote: true,
    canPerform: {
      label: "Select someone to kill.",
      emoji: selectionIcons['knife'],
      type: "eliminate",
      needSelection: true,
      actionTime: "night",
      lastNight: false,
    },
    partner: undefined,
    image: rolesIcons["bandit"],
    description:
      "The bandit goal is to be the last one alive. He can choose a player to become its accomplice. A bandit can kill one person each two nights.",
  },
  {
    name: "Accomplice",
    team: ["bandits"],
    canVote: true,
    canPerform: {
      label: "Select someone to kill.",
      emoji: selectionIcons['knife'],
      type: "eliminate",
      needSelection: true,
      actionTime: "night",
      lastNight: false,
    },
    partner: undefined,
    image: rolesIcons["accomplice"],
    description:
      "The accomplice is a role that appears during the game when a player is transformed when the bandit select him as its partner. A accomplice can kill one person each two nights.",
  },
  // werewolves
  // ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  {
    name: "Alpha Werewolf",
    team: ["werewolves"],
    canVote: true,
    canPerform: {
      label: "Select a player to kill.",
      emoji: selectionIcons['wolfPaw'],
      type: "devours",
      needSelection: true,
      actionTime: "night",
    },
    image: rolesIcons["alphaWerewolf"],
    description:
      "The Alpha Wolf is a normal werewolf except that his vote counts double. He also has the particularity of having an unknown and not obscure aura. Only clairvoyants can see its role.",
  },
  {
    name: "Cursed",
    team: ["village"],
    canVote: true,
    canPerform: {
      label: "Select a player to kill.",
      emoji: selectionIcons['wolfPaw'],
      type: "devours",
      needSelection: true,
      actionTime: "night",
    },
    isTranformedIntoWolf: false,
    image: rolesIcons["cursed"],
    description:
      "This role has no particular power. He is part of the village and wins with the village. But he can get bitten and join the werewolves. He will be a simple werewolf.",
  },
  {
    name: "Junior Werewolf",
    team: ["werewolves"],
    canVote: true,
    canPerform: {
      label: "Select a player to kill.",
      emoji: selectionIcons['wolfPaw'],
      type: "devours",
      needSelection: true,
      actionTime: "night",
    },
    image: rolesIcons["juniorWerewolf"],
    description:
      "You are a young werewolf. Thanks to your charm you can choose another player to kill when you die. He can choose a player in any phase of the game, if he commits suicide his target will not die.",
  },
  {
    name: "Nightmare Werewolf",
    team: ["werewolves"],
    canVote: true,
    canPerform: {
      label: "Select a player to kill.",
      emoji: selectionIcons['wolfPaw'],
      type: "devours",
      needSelection: true,
      actionTime: "night",
    },
    image: rolesIcons["nightmareWerewolf"],
    description:
      "Twice per game, during the day, you can select a player who will 'go to sleep' during the following night. This player will then not be able to use his abilities.",
  },
  {
    name: "Wolf Seer",
    team: ["werewolves"],
    canVote: true,
    canPerform: {
      label: "Select a player to kill.",
      emoji: selectionIcons['wolfPaw'],
      type: "devours",
      needSelection: true,
      actionTime: "night",
    },
    image: rolesIcons["wolfSeer"],
    description:
      "Each night you can select a player to discover their role. If you are the last werewolf alive or if you give up your ability, you become a regular werewolf.",
  },
  {
    name: "Wolf Shaman",
    team: ["werewolves"],
    canVote: true,
    canPerform: {
      label: "Select a player to kill.",
      emoji: selectionIcons['wolfPaw'],
      type: "devours",
      needSelection: true,
      actionTime: "night",
    },
    image: rolesIcons["wolfShaman"],
    description:
      "Like other wolves, the Wolf Shaman can vote for a player to kill and speak with other wolves at night. During the day, he can enchant another player (non-wolf) who will appear as a Wolf Shaman to aura clairvoyants. The Wolf-Shaman can no longer use his power if he is the last wolf alive, and cannot enchant the first night.",
  },
];
