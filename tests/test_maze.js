describe('MazeLevel zicht & gedrag', () => {
  const { T, P } = OverworldEngine.TILES;
  const { isWalkable, canSee, isBehind, chaseStep, patrolStep } = MazeLevel._logic;

  // 5×5 testkaart: open ruimte met één muurblok in het midden
  const OPEN = [
    [T,T,T,T,T],
    [T,P,P,P,T],
    [T,P,T,P,T],
    [T,P,P,P,T],
    [T,T,T,T,T]
  ];

  test('isWalkable: muren en randen blokkeren', () => {
    assertEqual(isWalkable(OPEN, 1, 1), true);
    assertEqual(isWalkable(OPEN, 2, 2), false);  // muurblok
    assertEqual(isWalkable(OPEN, 0, 0), false);  // rand
    assertEqual(isWalkable(OPEN, -1, 1), false); // buiten de kaart
    assertEqual(isWalkable(OPEN, 1, 99), false);
  });

  test('canSee: ziet speler recht vooruit', () => {
    const gengar = { row: 1, col: 1, dir: 'right' };
    assertEqual(canSee(OPEN, gengar, { row: 1, col: 3 }), true);
    assertEqual(canSee(OPEN, { row: 1, col: 1, dir: 'down' }, { row: 3, col: 1 }), true);
  });

  test('canSee: ziet speler NIET achter zich of opzij', () => {
    const gengar = { row: 1, col: 3, dir: 'right' };
    assertEqual(canSee(OPEN, gengar, { row: 1, col: 1 }), false); // achter
    assertEqual(canSee(OPEN, gengar, { row: 3, col: 3 }), false); // opzij (geen rechte lijn voor hem)
  });

  test('canSee: muur blokkeert het zicht', () => {
    // Gengar kijkt naar rechts, muurblok (2,2) zit tussen hem en de speler
    const gengar = { row: 2, col: 1, dir: 'right' };
    assertEqual(canSee(OPEN, gengar, { row: 2, col: 3 }), false);
  });

  test('canSee: zicht stopt na de maximale afstand', () => {
    const lang = [
      [T,T,T,T,T,T,T,T,T,T],
      [T,P,P,P,P,P,P,P,P,T],
      [T,T,T,T,T,T,T,T,T,T]
    ];
    const gengar = { row: 1, col: 1, dir: 'right' };
    assertEqual(canSee(lang, gengar, { row: 1, col: 4 }, 3), true);
    assertEqual(canSee(lang, gengar, { row: 1, col: 5 }, 3), false);
  });

  test('isBehind: achter = tegenovergesteld aan kijkrichting', () => {
    const gengar = { row: 2, col: 2, dir: 'up' };
    assertEqual(isBehind(gengar, { row: 3, col: 2 }), true);   // onder hem = achter
    assertEqual(isBehind(gengar, { row: 1, col: 2 }), false);  // boven hem = voor
    assertEqual(isBehind(gengar, { row: 2, col: 3 }), false);  // opzij telt niet als achter
  });

  test('chaseStep: zet een stap dichter naar de speler', () => {
    const gengar = { row: 1, col: 1, dir: 'down' };
    const player = { row: 1, col: 3 };
    const next = chaseStep(OPEN, gengar, player);
    assertDeepEqual(next, { row: 1, col: 2, dir: 'right' });
  });

  test('chaseStep: kiest de andere as als de eerste geblokkeerd is', () => {
    // Gengar (2,1) wil naar rechts (grootste delta), maar (2,2) is muur → dan omlaag
    const gengar = { row: 2, col: 1, dir: 'right' };
    const player = { row: 3, col: 3 };
    const next = chaseStep(OPEN, gengar, player);
    assertDeepEqual(next, { row: 3, col: 1, dir: 'down' });
  });

  test('chaseStep: geeft null als er geen stap dichterbij mogelijk is', () => {
    // Zelfde rij, enige route geblokkeerd door de muur
    const gengar = { row: 2, col: 1, dir: 'right' };
    const player = { row: 2, col: 3 };
    assertEqual(chaseStep(OPEN, gengar, player), null);
  });

  test('chaseStep: draait nooit om', () => {
    // Speler staat links, maar Gengar kijkt naar rechts → omdraaien mag niet
    const gengar = { row: 1, col: 3, dir: 'right' };
    const player = { row: 1, col: 1 };
    assertEqual(chaseStep(OPEN, gengar, player), null);
  });

  test('patrolStep: loopt meestal rechtdoor', () => {
    const gengar = { row: 1, col: 1, dir: 'right' };
    const next = patrolStep(OPEN, gengar, () => 0.5);
    assertDeepEqual(next, { row: 1, col: 2, dir: 'right' });
  });

  test('patrolStep: kiest een nieuwe richting als rechtdoor geblokkeerd is', () => {
    const gengar = { row: 1, col: 1, dir: 'up' }; // boven is muur
    const rand = (vals => () => vals.shift())([0.5, 0]);
    const next = patrolStep(OPEN, gengar, rand);
    // omdraaien (down) mag niet en links is muur → alleen right blijft over
    assertDeepEqual(next, { row: 1, col: 2, dir: 'right' });
  });

  test('patrolStep: draait nooit om als er een andere richting is', () => {
    // Gengar (3,1) kijkt naar links (muur); terug naar rechts mag niet → omhoog
    const gengar = { row: 3, col: 1, dir: 'left' };
    const next = patrolStep(OPEN, gengar, () => 0);
    assertDeepEqual(next, { row: 2, col: 1, dir: 'up' });
  });

  test('patrolStep: draait alleen om in een doodlopend stuk', () => {
    const DEAD_END = [
      [T,T,T],
      [T,P,T],
      [T,P,T],
      [T,T,T]
    ];
    const gengar = { row: 1, col: 1, dir: 'up' }; // vooruit, links en rechts zijn muur
    const next = patrolStep(DEAD_END, gengar, () => 0);
    assertDeepEqual(next, { row: 2, col: 1, dir: 'down' });
  });
});

describe('Doolhof-maps (level 5 en 6)', () => {
  const { T, E } = OverworldEngine.TILES;
  const { isWalkable } = MazeLevel._logic;

  // BFS vanaf de startpositie van de speler (1,1)
  function reachableTiles(map) {
    const seen = new Set(['1,1']);
    const queue = [[1, 1]];
    while (queue.length) {
      const [r, c] = queue.shift();
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        const nr = r + dr, nc = c + dc;
        if (isWalkable(map, nr, nc) && !seen.has(`${nr},${nc}`)) {
          seen.add(`${nr},${nc}`);
          queue.push([nr, nc]);
        }
      }
    }
    return seen;
  }

  function findExits(map) {
    const exits = [];
    map.forEach((row, r) => row.forEach((t, c) => { if (t === E) exits.push([r, c]); }));
    return exits;
  }

  for (const [naam, level, verwachtGengars] of [['Level 5', () => Level5, 1], ['Level 6', () => Level6, 2]]) {
    test(`${naam}: map heeft de juiste afmetingen`, () => {
      const { MAP } = level()._logic;
      assertEqual(MAP.length, OverworldEngine.ROWS);
      for (const row of MAP) assertEqual(row.length, OverworldEngine.COLS);
    });

    test(`${naam}: er is precies één uitgang en die is bereikbaar vanaf de start`, () => {
      const { MAP } = level()._logic;
      const exits = findExits(MAP);
      assertEqual(exits.length, 1, 'verwacht precies één E-tegel');
      const [er, ec] = exits[0];
      assert(reachableTiles(MAP).has(`${er},${ec}`), 'uitgang moet bereikbaar zijn vanaf (1,1)');
    });

    test(`${naam}: start is begaanbaar en de Gengars staan op bereikbare tegels`, () => {
      const { MAP, GENGAR_STARTS } = level()._logic;
      assert(isWalkable(MAP, 1, 1), 'spelerstart (1,1) moet begaanbaar zijn');
      assertEqual(GENGAR_STARTS.length, verwachtGengars);
      const bereikbaar = reachableTiles(MAP);
      for (const g of GENGAR_STARTS) {
        assert(bereikbaar.has(`${g.row},${g.col}`), `Gengar op (${g.row},${g.col}) moet bereikbaar zijn`);
        assert(g.row !== 1 || g.col !== 1, 'Gengar mag niet op de spelerstart staan');
      }
    });
  }
});
