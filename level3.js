// Level 3 — Groene Woud. Wilde Pokémon in hoog gras.
const Overworld = (() => {
  const { T, P, G } = OverworldEngine.TILES;

  const MAP = [
    [T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    [T,P,P,P,T,T,P,P,P,P,P,P,P,T],
    [T,P,T,P,P,G,G,G,G,G,P,P,P,T],
    [T,P,T,P,P,G,G,G,G,G,P,P,P,T],
    [T,P,P,P,P,P,P,P,P,P,P,T,P,T],
    [T,P,P,P,T,P,P,P,P,P,P,T,P,T],
    [T,T,P,P,T,P,P,G,G,G,P,P,P,T],
    [T,T,P,P,P,P,P,G,G,G,P,P,P,T],
    [T,P,P,P,P,P,P,P,P,P,P,P,P,T],
    [T,P,P,T,P,P,G,G,P,P,P,P,P,T],
    [T,P,G,G,P,P,G,G,P,P,G,G,P,T],
    [T,P,G,G,P,P,P,P,P,P,G,G,P,T],
    [T,P,P,P,P,P,P,P,P,P,P,P,P,T],
    [T,P,P,T,T,P,P,P,P,T,T,P,P,T],
    [T,P,P,P,P,P,P,P,P,P,P,P,P,T],
    [T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  ];

  return OverworldEngine.create({
    map: MAP,
    encounterRate: 0.20,
    ids: {
      counter: 'overworld-counter',
      dpad: { up: 'dpad-up', down: 'dpad-down', left: 'dpad-left', right: 'dpad-right' }
    }
  });
})();
