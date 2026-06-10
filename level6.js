// Level 6 — Schaduwdoolhof. Een nieuw doolhof met twee Gengars.
const Level6 = (() => {
  const { T, P, E } = OverworldEngine.TILES;

  const MAP = [
    [T,T,T,T,T,T,T,T,T,T,T,T,T,T],
    [T,P,P,P,P,P,P,P,T,P,P,P,P,T],
    [T,P,T,T,T,T,T,P,T,P,T,T,P,T],
    [T,P,T,P,P,P,T,P,P,P,T,P,P,T],
    [T,P,T,P,T,P,T,T,T,T,T,P,T,T],
    [T,P,P,P,T,P,P,P,P,P,P,P,P,T],
    [T,T,T,P,T,T,T,T,P,T,T,T,P,T],
    [T,P,P,P,P,P,P,T,P,P,P,T,P,T],
    [T,P,T,T,T,T,P,T,T,T,P,T,P,T],
    [T,P,P,P,P,T,P,P,P,T,P,P,P,T],
    [T,T,T,T,P,T,T,T,P,T,T,T,P,T],
    [T,P,P,P,P,P,P,T,P,P,P,P,P,T],
    [T,P,T,T,T,T,P,T,T,T,T,T,P,T],
    [T,P,P,P,P,T,P,P,P,P,P,P,P,T],
    [T,T,T,T,P,T,T,T,T,P,T,T,T,T],
    [T,T,T,T,E,T,T,T,T,T,T,T,T,T],
  ];

  const GENGAR_STARTS = [
    { row: 5, col: 9, dir: 'left' },
    { row: 11, col: 9, dir: 'right' }
  ];

  const instance = MazeLevel.create({
    map: MAP,
    gengarStarts: GENGAR_STARTS,
    ids: {
      counter: 'overworld-counter-6',
      dpad: { up: 'dpad-up-6', down: 'dpad-down-6', left: 'dpad-left-6', right: 'dpad-right-6' }
    }
  });

  // Internals voor tests
  instance._logic = { MAP, GENGAR_STARTS };
  return instance;
})();
