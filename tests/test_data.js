describe('POKEMON-data', () => {
  const KNOWN_TYPES = new Set(['water', 'vuur', 'plant', 'normaal', 'vlieg', 'draak', 'psycho']);

  test('elke Pokémon heeft id, name, type, maxHp, attacks', () => {
    for (const [key, p] of Object.entries(POKEMON)) {
      assert(typeof p.id === 'number' && p.id > 0, `${key}: id ontbreekt of <= 0`);
      assert(typeof p.name === 'string' && p.name.length > 0, `${key}: name ontbreekt`);
      assert(KNOWN_TYPES.has(p.type), `${key}: onbekend type "${p.type}"`);
      assert(typeof p.maxHp === 'number' && p.maxHp > 0, `${key}: maxHp <= 0`);
      assert(Array.isArray(p.attacks) && p.attacks.length > 0, `${key}: geen attacks`);
    }
  });

  test('elke aanval heeft name, power > 0, en geldig type', () => {
    for (const [key, p] of Object.entries(POKEMON)) {
      for (const a of p.attacks) {
        assert(typeof a.name === 'string' && a.name.length > 0, `${key}: attack zonder name`);
        assert(typeof a.power === 'number' && a.power > 0, `${key}/${a.name}: power <= 0`);
        assert(KNOWN_TYPES.has(a.type), `${key}/${a.name}: onbekend type "${a.type}"`);
      }
    }
  });
});

describe('LEVELS-data', () => {
  test('elke level heeft een uniek 1-gebaseerd id', () => {
    const ids = LEVELS.map(l => l.id);
    assertDeepEqual([...ids].sort((a, b) => a - b), ids, 'level-ids moeten oplopend zijn');
    assertEqual(new Set(ids).size, ids.length, 'level-ids moeten uniek zijn');
    assert(ids[0] === 1, 'eerste level moet id 1 hebben');
  });

  test('playerChoices verwijzen altijd naar een bekende Pokémon', () => {
    for (const level of LEVELS) {
      for (const key of level.playerChoices) {
        assert(POKEMON[key], `level ${level.id}: choice "${key}" bestaat niet`);
      }
    }
  });

  test('trainer-levels verwijzen naar een bekende vijand-Pokémon', () => {
    for (const level of LEVELS) {
      if (level.type !== 'overworld') {
        assert(POKEMON[level.pokemon], `level ${level.id}: pokemon "${level.pokemon}" bestaat niet`);
        assert(level.trainerName, `level ${level.id}: trainerName ontbreekt`);
        assert(level.intro, `level ${level.id}: intro ontbreekt`);
      }
    }
  });

  test('overworld-levels hebben minstens één wild-pool met geldige Pokémon', () => {
    for (const level of LEVELS) {
      if (level.type !== 'overworld') continue;
      const pools = [level.wildPokemon, level.forestPokemon, level.lakePokemon].filter(Boolean);
      assert(pools.length > 0, `level ${level.id}: geen wild-pool gedefinieerd`);
      assert(typeof level.requiredDefeats === 'number' && level.requiredDefeats > 0,
        `level ${level.id}: requiredDefeats ontbreekt`);
      for (const pool of pools) {
        for (const key of pool) {
          assert(POKEMON[key], `level ${level.id}: wild "${key}" bestaat niet`);
        }
      }
    }
  });
});
