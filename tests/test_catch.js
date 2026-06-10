describe('CatchGame swipe-fysica', () => {
  const { computeThrowVelocity, isHit, HIT_RADIUS, MIN_UP_SPEED, MAX_VX, MAX_VY } = CatchGame._logic;

  test('computeThrowVelocity geeft null bij te weinig samples', () => {
    assertEqual(computeThrowVelocity(null), null);
    assertEqual(computeThrowVelocity([]), null);
    assertEqual(computeThrowVelocity([{ x: 0, y: 0, t: 0 }]), null);
  });

  test('computeThrowVelocity geeft null bij neerwaartse of te trage swipe', () => {
    // Omlaag bewegen is geen worp
    assertEqual(computeThrowVelocity([
      { x: 100, y: 100, t: 0 },
      { x: 100, y: 200, t: 100 }
    ]), null);
    // Te langzaam omhoog (< MIN_UP_SPEED px/s)
    assertEqual(computeThrowVelocity([
      { x: 100, y: 100, t: 0 },
      { x: 100, y: 100 - (MIN_UP_SPEED / 10) * 0.5, t: 100 }
    ]), null);
  });

  test('snelle swipe omhoog levert negatieve vy', () => {
    const v = computeThrowVelocity([
      { x: 100, y: 400, t: 0 },
      { x: 110, y: 250, t: 100 }
    ]);
    assert(v !== null, 'verwacht een velocity-object');
    assert(v.vy < 0, 'vy moet negatief (omhoog) zijn');
    assertEqual(v.vx, 100);
    assertEqual(v.vy, -1500);
  });

  test('vx en vy worden geclampt op hun maxima', () => {
    const v = computeThrowVelocity([
      { x: 0, y: 1000, t: 0 },
      { x: 500, y: 0, t: 50 }
    ]);
    assertEqual(v.vx, MAX_VX);
    assertEqual(v.vy, -MAX_VY);

    const vLinks = computeThrowVelocity([
      { x: 500, y: 1000, t: 0 },
      { x: 0, y: 0, t: 50 }
    ]);
    assertEqual(vLinks.vx, -MAX_VX);
  });

  test('isHit binnen en buiten de raakstraal', () => {
    assertEqual(isHit(100, 100, 100, 100), true);
    assertEqual(isHit(100, 100, 100 + HIT_RADIUS, 100), true);
    assertEqual(isHit(100, 100, 100 + HIT_RADIUS + 1, 100), false);
    assertEqual(isHit(0, 0, 40, 40), false);  // diagonale afstand ~56,6 > 55
    assertEqual(isHit(0, 0, 30, 30), true);   // diagonale afstand ~42,4 < 55
  });
});

describe('Pokedex caught-store', () => {
  function fakeStorage(initial = {}) {
    const data = { ...initial };
    return {
      getItem: k => (k in data ? data[k] : null),
      setItem: (k, v) => { data[k] = String(v); },
      _data: data
    };
  }

  test('lege storage geeft lege lijst', () => {
    const store = Pokedex.createCaughtStore(fakeStorage());
    assertDeepEqual(store.getCaught(), []);
    assertEqual(store.isCaught('mew'), false);
  });

  test('addCaught voegt toe en persisteert als JSON', () => {
    const storage = fakeStorage();
    const store = Pokedex.createCaughtStore(storage);
    assertEqual(store.addCaught('rattata'), true);
    assertDeepEqual(store.getCaught(), ['rattata']);
    assertEqual(store.isCaught('rattata'), true);
    assertDeepEqual(JSON.parse(storage._data[Pokedex.STORAGE_KEY]), ['rattata']);
  });

  test('addCaught dedupliceert', () => {
    const store = Pokedex.createCaughtStore(fakeStorage());
    assertEqual(store.addCaught('mew'), true);
    assertEqual(store.addCaught('mew'), false);
    assertDeepEqual(store.getCaught(), ['mew']);
  });

  test('corrupte of onverwachte JSON geeft lege lijst', () => {
    const corrupt = fakeStorage({ [Pokedex.STORAGE_KEY]: '{niet geldig' });
    assertDeepEqual(Pokedex.createCaughtStore(corrupt).getCaught(), []);

    const geenArray = fakeStorage({ [Pokedex.STORAGE_KEY]: '{"a":1}' });
    assertDeepEqual(Pokedex.createCaughtStore(geenArray).getCaught(), []);

    const mixed = fakeStorage({ [Pokedex.STORAGE_KEY]: '["mew", 42, null]' });
    assertDeepEqual(Pokedex.createCaughtStore(mixed).getCaught(), ['mew']);
  });
});
