const LEVELS = [
  {
    id: 1,
    trainerName: "Niels",
    pokemon: "wartortle",
    intro: "Trainer Niels daagt je uit!",
    playerChoices: ["squirtle", "charmander", "bulbasaur"]
  },
  {
    id: 2,
    trainerName: "Felipe",
    pokemon: "venusaur",
    intro: "Trainer Felipe daagt je uit!",
    playerChoices: ["charmeleon", "ivysaur", "wartortle"]
  },
  {
    id: 3,
    type: "overworld",
    areaName: "het Groene Woud",
    playerChoices: ["blastoise", "charizard", "exeggutor"],
    wildPokemon: ["rattata", "pidgey", "jigglypuff", "spearow", "fearow"],
    requiredDefeats: 3
  },
  {
    id: 4,
    type: "overworld",
    areaName: "het Mystiek Woud",
    playerChoices: ["dragonite", "blastoise"],
    forestPokemon: ["mew", "fearow"],
    lakePokemon: ["gyarados"],
    requiredDefeats: 3
  },
  {
    id: 5,
    type: "maze",
    areaName: "het Spookdoolhof",
    choicesFromPokedex: true,
    playerChoices: ["blastoise", "charizard", "venusaur"]
  },
  {
    id: 6,
    type: "maze",
    areaName: "het Schaduwdoolhof",
    choicesFromPokedex: true,
    playerChoices: ["blastoise", "charizard", "venusaur"]
  }
];
