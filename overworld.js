// Gedeelde engine voor top-down overworld-niveaus (level 3 en level 4).
// Levels bouwen hun eigen instantie via `createOverworld({...})`.

const OverworldEngine = (() => {
  const ROWS = 16, COLS = 14, TILE = 32;
  const TILES = { T: 0, P: 1, G: 2, W: 3 };

  // ── Tile drawers ────────────────────────────────────────────────
  function drawTree(ctx, x, y) {
    ctx.fillStyle = '#1b4332';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath();
    ctx.arc(x + TILE / 2, y + TILE / 2, TILE * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b4c11';
    ctx.fillRect(x + TILE / 2 - 3, y + TILE * 0.7, 6, TILE * 0.3);
  }

  function drawPath(ctx, x, y) {
    ctx.fillStyle = '#c8d89a';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
  }

  function drawGrass(ctx, x, y) {
    ctx.fillStyle = '#52b788';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = '#40916c';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const gx = x + 4 + i * 7;
      ctx.beginPath();
      ctx.moveTo(gx, y + TILE - 2);
      ctx.lineTo(gx - 2, y + TILE / 2 + 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx + 2, y + TILE - 2);
      ctx.lineTo(gx + 4, y + TILE / 2 + 2);
      ctx.stroke();
    }
  }

  function drawWater(ctx, x, y) {
    ctx.fillStyle = '#1a78c2';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const wy = y + 7 + i * 9;
      ctx.beginPath();
      ctx.moveTo(x + 2, wy);
      ctx.bezierCurveTo(x + 9, wy - 3, x + 17, wy + 3, x + 24, wy);
      ctx.bezierCurveTo(x + 27, wy - 2, x + 30, wy + 1, x + TILE - 2, wy);
      ctx.stroke();
    }
  }

  const DEFAULT_TILE_DRAWERS = {
    [TILES.T]: drawTree,
    [TILES.P]: drawPath,
    [TILES.G]: drawGrass,
    [TILES.W]: drawWater
  };

  // ── Pure helpers (handig voor tests) ────────────────────────────
  // Geeft true terug als de speler op (nr, nc) mag stappen, of een object
  // { blocked: true, reason: '...' } als een toast getoond moet worden.
  function defaultCanEnter(tile /*, gameState */) {
    return tile !== TILES.T;
  }

  // Welke pool aan wilde Pokémon hoort bij deze tile? Default: level.wildPokemon.
  function defaultPickPool(level /*, tile */) {
    return level.wildPokemon || [];
  }

  // Welke tile triggert een wild gevecht? Default: hoog gras.
  function defaultIsEncounterTile(tile) {
    return tile === TILES.G;
  }

  function create(config) {
    const map = config.map;
    const encounterRate = config.encounterRate ?? 0.20;
    const ids = config.ids;
    const canEnter = config.canEnter || defaultCanEnter;
    const pickPool = config.pickPool || defaultPickPool;
    const isEncounterTile = config.isEncounterTile || defaultIsEncounterTile;
    const tileDrawers = { ...DEFAULT_TILE_DRAWERS, ...(config.tileDrawers || {}) };

    let canvas = null, ctx = null;
    let player = { col: 1, row: 1, dir: 'down' };
    let cooldown = 0;
    let active = false;
    let toast = null;

    function start(canvasEl) {
      canvas = canvasEl;
      ctx = canvas.getContext('2d');
      canvas.width = COLS * TILE;
      canvas.height = ROWS * TILE;
      player = { col: 1, row: 1, dir: 'down' };
      cooldown = 0;
      active = true;
      toast = null;
      document.addEventListener('keydown', handleKey);
      bindDpad();
      updateHUD();
      draw();
    }

    function bindDpad() {
      for (const dir of ['up', 'down', 'left', 'right']) {
        const id = ids.dpad[dir];
        const btn = document.getElementById(id);
        if (!btn) continue;
        btn.addEventListener('touchstart', e => { e.preventDefault(); if (active) step(dir); }, { passive: false });
        btn.addEventListener('click', () => { if (active) step(dir); });
      }
    }

    function pause() { active = false; }

    function resume(wonBattle) {
      if (wonBattle) {
        state.overworldDefeated = (state.overworldDefeated || 0) + 1;
        updateHUD();
        const needed = LEVELS[state.currentLevel].requiredDefeats;
        if (state.overworldDefeated >= needed) {
          cleanup();
          endOverworld('win');
          return;
        }
      }
      cooldown = 5;
      active = true;
      draw();
    }

    function cleanup() {
      active = false;
      document.removeEventListener('keydown', handleKey);
    }

    function handleKey(e) {
      if (!active) return;
      const dir = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
      if (!dir) return;
      e.preventDefault();
      step(dir);
    }

    function step(dir) {
      const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
      player.dir = dir;
      const nc = player.col + delta[0];
      const nr = player.row + delta[1];
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
      const tile = map[nr][nc];
      const verdict = canEnter(tile, state);
      if (verdict !== true) {
        if (verdict && verdict.reason) showToast(verdict.reason);
        draw();
        return;
      }
      player.col = nc;
      player.row = nr;
      if (cooldown > 0) cooldown--;
      draw();
      if (isEncounterTile(tile) && cooldown === 0 && Math.random() < encounterRate) {
        flashAndFight();
      }
    }

    function showToast(msg) {
      toast = { msg, timer: 120 };
    }

    function flashAndFight() {
      active = false;
      const level = LEVELS[state.currentLevel];
      const tile = map[player.row][player.col];
      const pool = pickPool(level, tile);
      let f = 0;
      const iv = setInterval(() => {
        canvas.style.filter = (f % 2 === 0) ? 'brightness(4)' : '';
        if (++f >= 6) {
          clearInterval(iv);
          canvas.style.filter = '';
          startWildBattle(pool[Math.floor(Math.random() * pool.length)]);
        }
      }, 90);
    }

    function draw() {
      if (!ctx) return;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const drawer = tileDrawers[map[r][c]];
          if (drawer) drawer(ctx, c * TILE, r * TILE);
        }
      }
      drawPlayer();
      if (toast) {
        drawToast();
        if (--toast.timer <= 0) toast = null;
      }
    }

    function drawPlayer() {
      const x = player.col * TILE, y = player.row * TILE;
      ctx.fillStyle = '#e63946';
      ctx.fillRect(x + 7, y + 8, TILE - 14, TILE - 14);
      ctx.fillStyle = 'white';
      ctx.beginPath();
      const m = TILE / 2;
      if (player.dir === 'up')    { ctx.moveTo(x + m, y + 3);        ctx.lineTo(x + m - 5, y + 13);        ctx.lineTo(x + m + 5, y + 13); }
      if (player.dir === 'down')  { ctx.moveTo(x + m, y + TILE - 3); ctx.lineTo(x + m - 5, y + TILE - 13); ctx.lineTo(x + m + 5, y + TILE - 13); }
      if (player.dir === 'left')  { ctx.moveTo(x + 3, y + m);        ctx.lineTo(x + 13, y + m - 5);        ctx.lineTo(x + 13, y + m + 5); }
      if (player.dir === 'right') { ctx.moveTo(x + TILE - 3, y + m); ctx.lineTo(x + TILE - 13, y + m - 5); ctx.lineTo(x + TILE - 13, y + m + 5); }
      ctx.closePath();
      ctx.fill();
    }

    function drawToast() {
      const msg = toast.msg;
      const alpha = Math.min(1, toast.timer / 30);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.font = 'bold 9px monospace';
      const w = ctx.measureText(msg).width + 20;
      const cx = (COLS * TILE) / 2;
      const cy = ROWS * TILE - 40;
      ctx.beginPath();
      ctx.roundRect(cx - w / 2, cy - 14, w, 24, 6);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(msg, cx, cy - 2);
      ctx.restore();
    }

    function updateHUD() {
      const count = state.overworldDefeated || 0;
      const required = LEVELS[state.currentLevel]?.requiredDefeats || 3;
      const el = document.getElementById(ids.counter);
      if (el) el.textContent = `Verslagen: ${count} / ${required}`;
    }

    return { start, pause, resume, cleanup };
  }

  return {
    create,
    TILES,
    ROWS, COLS, TILE,
    // Geëxposeerd voor tests
    defaultCanEnter,
    defaultPickPool,
    defaultIsEncounterTile
  };
})();
