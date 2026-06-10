// Gedeelde doolhof-laag bovenop OverworldEngine (level 5 en 6).
// Gengars patrouilleren door het doolhof. Een Gengar ziet de speler alleen
// recht voor zich (paarse tegels) en gaat dan achtervolgen. Raakt hij de
// speler, dan is het game over — tenzij de speler hém van achteren aanraakt,
// dan start een gevecht. De speler wint door de uitgang (E-tegel) te bereiken.
const MazeLevel = (() => {
  const TILES = OverworldEngine.TILES;
  const TILE = OverworldEngine.TILE;
  const VISION_RANGE = 6;
  const DELTAS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const DIRS = Object.keys(DELTAS);
  const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const GENGAR_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png';

  // ── Pure helpers (geëxposeerd voor tests) ────────────────────────
  function isWalkable(map, row, col) {
    return row >= 0 && row < map.length &&
           col >= 0 && col < map[0].length &&
           map[row][col] !== TILES.T;
  }

  // Ziet de Gengar de speler? Alleen in een rechte lijn vóór zich,
  // tot VISION_RANGE tegels ver, en muren blokkeren het zicht.
  function canSee(map, gengar, player, range = VISION_RANGE) {
    const [dx, dy] = DELTAS[gengar.dir];
    let col = gengar.col + dx, row = gengar.row + dy;
    for (let i = 0; i < range; i++) {
      if (!isWalkable(map, row, col)) return false;
      if (player.row === row && player.col === col) return true;
      col += dx;
      row += dy;
    }
    return false;
  }

  // Staat `pos` achter de Gengar (tegenovergesteld aan zijn kijkrichting)?
  function isBehind(gengar, pos) {
    const [dx, dy] = DELTAS[gengar.dir];
    return dx * (pos.col - gengar.col) + dy * (pos.row - gengar.row) < 0;
  }

  // Eén stap richting de speler (grootste afstand eerst, dan de andere as).
  // Omdraaien mag niet: zo kan de speler hem van achteren blijven besluipen.
  function chaseStep(map, gengar, player) {
    const dc = player.col - gengar.col;
    const dr = player.row - gengar.row;
    const opts = [];
    if (Math.abs(dc) >= Math.abs(dr)) {
      if (dc !== 0) opts.push(dc > 0 ? 'right' : 'left');
      if (dr !== 0) opts.push(dr > 0 ? 'down' : 'up');
    } else {
      if (dr !== 0) opts.push(dr > 0 ? 'down' : 'up');
      if (dc !== 0) opts.push(dc > 0 ? 'right' : 'left');
    }
    for (const dir of opts) {
      if (dir === OPPOSITE[gengar.dir]) continue;
      const [dx, dy] = DELTAS[dir];
      if (isWalkable(map, gengar.row + dy, gengar.col + dx)) {
        return { row: gengar.row + dy, col: gengar.col + dx, dir };
      }
    }
    return null;
  }

  // Patrouille: meestal rechtdoor, anders links of rechts — nooit omdraaien.
  // Alleen in een doodlopend stuk (geen andere uitweg) mag hij terug.
  function patrolStep(map, gengar, rand = Math.random) {
    const [dx, dy] = DELTAS[gengar.dir];
    if (rand() < 0.75 && isWalkable(map, gengar.row + dy, gengar.col + dx)) {
      return { row: gengar.row + dy, col: gengar.col + dx, dir: gengar.dir };
    }
    const options = DIRS.filter(d => {
      if (d === OPPOSITE[gengar.dir]) return false;
      const [ddx, ddy] = DELTAS[d];
      return isWalkable(map, gengar.row + ddy, gengar.col + ddx);
    });
    if (options.length === 0) {
      const back = OPPOSITE[gengar.dir];
      const [bx, by] = DELTAS[back];
      if (isWalkable(map, gengar.row + by, gengar.col + bx)) {
        return { row: gengar.row + by, col: gengar.col + bx, dir: back };
      }
      return null;
    }
    const dir = options[Math.floor(rand() * options.length)];
    const [ndx, ndy] = DELTAS[dir];
    return { row: gengar.row + ndy, col: gengar.col + ndx, dir };
  }

  // ── Factory ──────────────────────────────────────────────────────
  // cfg: { map, gengarStarts: [{row, col, dir}], ids }
  function create(cfg) {
    const map = cfg.map;
    let gengars = [];
    let fightingIndex = -1;
    let sprite = null;

    function ensureSprite(api) {
      if (sprite || typeof Image === 'undefined') return;
      sprite = new Image();
      sprite.onload = () => api.draw();
      sprite.src = GENGAR_SPRITE;
    }

    function resetGengars() {
      gengars = cfg.gengarStarts.map(s => ({ row: s.row, col: s.col, dir: s.dir || 'down', alive: true }));
      fightingIndex = -1;
    }

    function gengarIndexAt(row, col) {
      return gengars.findIndex(g => g.alive && g.row === row && g.col === col);
    }

    function playerCaught(api) {
      api.cleanup();
      mazeGameOver();
    }

    function onStart(api) {
      ensureSprite(api);
      resetGengars();
      api.showToast('Vind de uitgang! Pas op voor Gengar!');
    }

    function onStep(api, tile, prev) {
      const player = api.getPlayer();

      // 1. Uitgang bereikt → level gewonnen (met of zonder Gengar)
      if (tile === TILES.E) {
        api.cleanup();
        endOverworld('win');
        return;
      }

      // 2. Speler stapt op een Gengar-tegel
      const touched = gengarIndexAt(player.row, player.col);
      if (touched !== -1) {
        if (isBehind(gengars[touched], prev)) {
          fightingIndex = touched;
          api.startFight('gengar');
        } else {
          playerCaught(api);
        }
        return;
      }

      // 3. Gengars zetten een stap (achtervolgen bij zicht, anders patrouille)
      for (const g of gengars) {
        if (!g.alive) continue;
        const next = canSee(map, g, player)
          ? chaseStep(map, g, player)
          : patrolStep(map, g);
        if (!next) continue;
        const occupied = gengarIndexAt(next.row, next.col) !== -1;
        g.dir = next.dir;
        if (!occupied) {
          g.row = next.row;
          g.col = next.col;
        }
        if (g.row === player.row && g.col === player.col) {
          playerCaught(api);
          return;
        }
      }
      api.draw();
    }

    function onResume(api, wonBattle) {
      // Gevecht gewonnen (en eventueel gevangen): Gengar verdwijnt uit het doolhof
      if (wonBattle && fightingIndex !== -1) {
        gengars[fightingIndex].alive = false;
        fightingIndex = -1;
        api.showToast('Gengar is weg! Nu naar de uitgang!');
      }
    }

    function drawExtras(ctx, api) {
      ensureSprite(api);
      for (const g of gengars) {
        if (!g.alive) continue;
        drawVision(ctx, g);
        drawGengar(ctx, g);
      }
    }

    function drawVision(ctx, g) {
      const [dx, dy] = DELTAS[g.dir];
      let col = g.col + dx, row = g.row + dy;
      ctx.fillStyle = 'rgba(155, 89, 182, 0.32)';
      for (let i = 0; i < VISION_RANGE; i++) {
        if (!isWalkable(map, row, col)) break;
        ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
        col += dx;
        row += dy;
      }
    }

    function drawGengar(ctx, g) {
      const x = g.col * TILE, y = g.row * TILE;
      if (sprite && sprite.complete && sprite.naturalWidth) {
        ctx.drawImage(sprite, x - 4, y - 8, TILE + 8, TILE + 8);
      } else {
        ctx.fillStyle = '#6c3483';
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, TILE * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const instance = OverworldEngine.create({
      map,
      encounterRate: 0,
      ids: cfg.ids,
      canEnter: tile => tile !== TILES.T,
      isEncounterTile: () => false,
      hudText: () => 'Vind de uitgang! 👻',
      onStart,
      onStep,
      onResume,
      drawExtras
    });

    instance._maze = { getGengars: () => gengars };
    return instance;
  }

  return {
    create,
    VISION_RANGE,
    // Geëxposeerd voor tests
    _logic: { isWalkable, canSee, isBehind, chaseStep, patrolStep }
  };
})();
