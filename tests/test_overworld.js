describe('OverworldEngine defaults', () => {
  const { T, P, G, W } = OverworldEngine.TILES;

  test('defaultCanEnter blokkeert bomen, staat pad/gras/water toe', () => {
    assertEqual(OverworldEngine.defaultCanEnter(T), false);
    assertEqual(OverworldEngine.defaultCanEnter(P), true);
    assertEqual(OverworldEngine.defaultCanEnter(G), true);
    assertEqual(OverworldEngine.defaultCanEnter(W), true);
  });

  test('defaultIsEncounterTile herkent alleen gras', () => {
    assertEqual(OverworldEngine.defaultIsEncounterTile(G), true);
    assertEqual(OverworldEngine.defaultIsEncounterTile(P), false);
    assertEqual(OverworldEngine.defaultIsEncounterTile(T), false);
    assertEqual(OverworldEngine.defaultIsEncounterTile(W), false);
  });

  test('defaultPickPool leest level.wildPokemon', () => {
    const fakeLevel = { wildPokemon: ['rattata', 'pidgey'] };
    assertDeepEqual(OverworldEngine.defaultPickPool(fakeLevel), ['rattata', 'pidgey']);
  });

  test('defaultPickPool geeft lege array als wildPokemon ontbreekt', () => {
    assertDeepEqual(OverworldEngine.defaultPickPool({}), []);
  });
});

describe('Level4 logica', () => {
  const { T, P, G, W } = OverworldEngine.TILES;

  test('canEnter blokkeert bomen', () => {
    assertEqual(Level4._logic.canEnter(T, { selectedPokemon: 'blastoise' }), false);
    assertEqual(Level4._logic.canEnter(T, { selectedPokemon: 'dragonite' }), false);
  });

  test('canEnter laat water toe met Blastoise', () => {
    assertEqual(Level4._logic.canEnter(W, { selectedPokemon: 'blastoise' }), true);
  });

  test('canEnter blokkeert water voor non-Blastoise met toast-reden', () => {
    const result = Level4._logic.canEnter(W, { selectedPokemon: 'dragonite' });
    assertEqual(typeof result, 'object');
    assertEqual(result.blocked, true);
    assert(result.reason && result.reason.length > 0, 'verwacht een reason-string');
  });

  test('canEnter laat gras en pad altijd toe', () => {
    assertEqual(Level4._logic.canEnter(G, { selectedPokemon: 'dragonite' }), true);
    assertEqual(Level4._logic.canEnter(P, { selectedPokemon: 'dragonite' }), true);
  });

  test('pickPool kiest lakePokemon op water, forestPokemon op gras', () => {
    const level = { forestPokemon: ['mew'], lakePokemon: ['gyarados'] };
    assertDeepEqual(Level4._logic.pickPool(level, W), ['gyarados']);
    assertDeepEqual(Level4._logic.pickPool(level, G), ['mew']);
  });

  test('isEncounterTile reageert op zowel gras als water', () => {
    assertEqual(Level4._logic.isEncounterTile(G), true);
    assertEqual(Level4._logic.isEncounterTile(W), true);
    assertEqual(Level4._logic.isEncounterTile(P), false);
    assertEqual(Level4._logic.isEncounterTile(T), false);
  });

  test('MAP heeft de juiste afmetingen', () => {
    assertEqual(Level4._logic.MAP.length, OverworldEngine.ROWS);
    assertEqual(Level4._logic.MAP[0].length, OverworldEngine.COLS);
  });

  test('MAP heeft minstens één watertegel (anders is het meertje weg)', () => {
    let waterCount = 0;
    for (const row of Level4._logic.MAP) for (const t of row) if (t === W) waterCount++;
    assert(waterCount > 0, 'er moet minstens één W-tegel zijn');
  });
});

describe('OverworldEngine.create', () => {
  test('exposeert start, pause, resume, cleanup', () => {
    const instance = OverworldEngine.create({
      map: [[OverworldEngine.TILES.P]],
      ids: { counter: 'x', dpad: { up: 'a', down: 'b', left: 'c', right: 'd' } }
    });
    assertEqual(typeof instance.start, 'function');
    assertEqual(typeof instance.pause, 'function');
    assertEqual(typeof instance.resume, 'function');
    assertEqual(typeof instance.cleanup, 'function');
  });
});
