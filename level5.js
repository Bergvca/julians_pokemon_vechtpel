// Level 5 — Spookdoolhof. Vind de uitgang, ontwijk de Gengar.
const Level5 = (() => {
  const { T, P, E } = OverworldEngine.TILES;

  const MAP = [
    [T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    [T,P,P,P,P,T,P,P,P,P,P,P,P,T],
    [T,T,T,T,P,T,P,T,T,T,T,T,P,T],
    [T,P,P,P,P,P,P,P,P,P,T,P,P,T],
    [T,P,T,T,T,T,T,T,T,P,T,P,T,T],
    [T,P,P,P,P,P,P,T,P,P,P,P,P,T],
    [T,T,T,P,T,T,P,T,P,T,T,T,P,T],
    [T,P,P,P,T,P,P,P,P,P,T,P,P,T],
    [T,P,T,T,T,P,T,T,T,P,T,P,T,T],
    [T,P,P,P,T,P,P,P,T,P,P,P,P,T],
    [T,T,T,P,T,T,T,P,T,T,T,T,P,T],
    [T,P,P,P,P,P,T,P,P,P,P,T,P,T],
    [T,P,T,T,T,P,T,T,T,T,P,T,P,T],
    [T,P,T,P,P,P,P,P,T,P,P,P,P,T],
    [T,P,P,P,T,T,T,P,P,P,T,P,P,T],
    [T,T,T,T,T,T,T,E,T,T,T,T,T,T],
  ];

  const GENGAR_STARTS = [
    { row: 11, col: 4, dir: 'down' }
  ];

  const instance = MazeLevel.create({
    map: MAP,
    gengarStarts: GENGAR_STARTS,
    ids: {
      counter: 'overworld-counter-5',
      dpad: { up: 'dpad-up-5', down: 'dpad-down-5', left: 'dpad-left-5', right: 'dpad-right-5' }
    }
  });

  // Internals voor tests
  instance._logic = { MAP, GENGAR_STARTS };
  return instance;
})();
