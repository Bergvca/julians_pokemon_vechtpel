describe('typeEffectiveness', () => {
  test('water vs vuur is supereffectief (1.5) bij hoge kans-roll', () => {
    // Modifier wordt toegepast als Math.random() < 0.80
    withMockedRandom([0.5], () => {
      assertEqual(typeEffectiveness('water', 'vuur'), 1.5);
    });
  });

  test('water vs vuur valt terug op 1 bij lage kans-roll', () => {
    withMockedRandom([0.9], () => {
      assertEqual(typeEffectiveness('water', 'vuur'), 1);
    });
  });

  test('vuur vs plant is supereffectief (1.5) bij hoge kans-roll', () => {
    withMockedRandom([0.1], () => {
      assertEqual(typeEffectiveness('vuur', 'plant'), 1.5);
    });
  });

  test('water vs plant is niet erg effectief (0.67) bij hoge kans-roll', () => {
    withMockedRandom([0.5], () => {
      assertEqual(typeEffectiveness('water', 'plant'), 0.67);
    });
  });

  test('draak vs psycho is supereffectief bij hoge kans-roll', () => {
    withMockedRandom([0.5], () => {
      assertEqual(typeEffectiveness('draak', 'psycho'), 1.5);
    });
  });

  test('neutrale matchup geeft 1 zonder Math.random aan te roepen', () => {
    const calls = countRandomCalls(() => {
      assertEqual(typeEffectiveness('normaal', 'water'), 1);
    });
    assertEqual(calls, 0, 'neutrale matchup mag geen kans-roll doen');
  });

  test('onbekend type valt terug op modifier 1', () => {
    const calls = countRandomCalls(() => {
      assertEqual(typeEffectiveness('staal', 'vuur'), 1);
    });
    assertEqual(calls, 0);
  });
});

describe('calculateDamage', () => {
  test('schaalt schade lineair met effectiveness', () => {
    // Twee dezelfde Math.random-paren geven dezelfde variantie; effectiveness varieert.
    const dmg1 = withMockedRandom([0.5, 0.5], () => calculateDamage({ power: 20 }, 1));
    const dmg2 = withMockedRandom([0.5, 0.5], () => calculateDamage({ power: 20 }, 1.5));
    assert(dmg2 > dmg1, `verwachtte 1.5x meer schade, kreeg ${dmg2} vs ${dmg1}`);
  });

  test('geeft minimaal 1 schade, zelfs bij extreme negatieve variantie', () => {
    // u1 dicht bij 1 → log(u1) klein → kleine z (maar cos kan wel klein zijn)
    // Test grens: power 1, effectiveness 0.67 → afgerond zou < 1 kunnen worden
    const dmg = withMockedRandom([0.999999, 0.0], () => calculateDamage({ power: 1 }, 0.1));
    assert(dmg >= 1, `verwachtte >= 1, kreeg ${dmg}`);
  });

  test('rond af op een geheel getal', () => {
    const dmg = withMockedRandom([0.5, 0.5], () => calculateDamage({ power: 10 }, 1));
    assertEqual(dmg, Math.round(dmg));
  });

  test('verwerkt 100 willekeurige rolls zonder NaN of negatieve schade', () => {
    // Sanity: zonder mock, met echte random
    for (let i = 0; i < 100; i++) {
      const dmg = calculateDamage({ power: 15 }, 1.5);
      assert(Number.isFinite(dmg) && dmg >= 1, `iter ${i}: ongeldig dmg=${dmg}`);
    }
  });
});
