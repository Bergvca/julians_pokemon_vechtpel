// Level 4 — Mystiek Woud met meertje. Water alleen toegankelijk met Blastoise.
const Level4 = (() => {
  const { T, P, G, W } = OverworldEngine.TILES;

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
    [T,P,G,G,P,P,G,G,P,W,W,W,P,T],
    [T,P,G,G,P,P,P,P,P,W,W,W,P,T],
    [T,P,P,P,P,P,P,P,P,W,W,W,P,T],
    [T,P,P,T,T,P,P,P,P,P,P,P,P,T],
    [T,P,P,P,P,P,P,P,P,P,P,P,P,T],
    [T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  ];

  function canEnter(tile, gameState) {
    if (tile === T) return false;
    if (tile === W && gameState.selectedPokemon !== 'blastoise') {
      return { blocked: true, reason: 'Alleen Blastoise kan het meer in!' };
    }
    return true;
  }

  function pickPool(level, tile) {
    return tile === W ? level.lakePokemon : level.forestPokemon;
  }

  function isEncounterTile(tile) {
    return tile === G || tile === W;
  }

  const instance = OverworldEngine.create({
    map: MAP,
    encounterRate: 0.22,
    ids: {
      counter: 'overworld-counter-4',
      dpad: { up: 'dpad-up-4', down: 'dpad-down-4', left: 'dpad-left-4', right: 'dpad-right-4' }
    },
    canEnter,
    pickPool,
    isEncounterTile
  });

  // Internals voor tests
  instance._logic = { canEnter, pickPool, isEncounterTile, MAP };
  return instance;
})();
