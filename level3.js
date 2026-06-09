const Overworld = (() => {
  const T = 0, P = 1, G = 2; // tile: boom, pad, hoog-gras

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
    [T,P,G,G,P,P,G,G,P,P,G,G,P,T],
    [T,P,G,G,P,P,P,P,P,P,G,G,P,T],
    [T,P,P,P,P,P,P,P,P,P,P,P,P,T],
    [T,P,P,T,T,P,P,P,P,T,T,P,P,T],
    [T,P,P,P,P,P,P,P,P,P,P,P,P,T],
    [T,T,T,T,T,T,T,T,T,T,T,T,T,T],
  ];

  const ROWS = 16, COLS = 14, TILE = 32;

  let canvas, ctx;
  let player = { col: 1, row: 1, dir: 'down' };
  let cooldown = 0;
  let active = false;

  function start(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    canvas.width  = COLS * TILE;
    canvas.height = ROWS * TILE;
    player = { col: 1, row: 1, dir: 'down' };
    cooldown = 0;
    active = true;
    document.addEventListener('keydown', handleKey);
    updateHUD();
    draw();
  }

  function pause()  { active = false; }

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
    const dir = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' }[e.key];
    if (!dir) return;
    e.preventDefault();
    step(dir);
  }

  function step(dir) {
    const delta = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] }[dir];
    player.dir = dir;
    const nc = player.col + delta[0];
    const nr = player.row + delta[1];
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
    if (MAP[nr][nc] === T) return;
    player.col = nc;
    player.row = nr;
    if (cooldown > 0) cooldown--;
    draw();
    if (MAP[nr][nc] === G && cooldown === 0 && Math.random() < 0.20) {
      flashAndFight();
    }
  }

  function flashAndFight() {
    active = false;
    let f = 0;
    const iv = setInterval(() => {
      canvas.style.filter = (f % 2 === 0) ? 'brightness(4)' : '';
      if (++f >= 6) {
        clearInterval(iv);
        canvas.style.filter = '';
        const wild = LEVELS[state.currentLevel].wildPokemon;
        startWildBattle(wild[Math.floor(Math.random() * wild.length)]);
      }
    }, 90);
  }

  function draw() {
    if (!ctx) return;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) drawTile(c, r, MAP[r][c]);
    }
    drawPlayer();
  }

  function drawTile(c, r, type) {
    const x = c * TILE, y = r * TILE;
    if (type === T) {
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath();
      ctx.arc(x + TILE / 2, y + TILE / 2, TILE * 0.38, 0, Math.PI * 2);
      ctx.fill();
      // stam
      ctx.fillStyle = '#6b4c11';
      ctx.fillRect(x + TILE/2 - 3, y + TILE * 0.7, 6, TILE * 0.3);
    } else if (type === P) {
      ctx.fillStyle = '#c8d89a';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = 'rgba(0,0,0,0.07)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    } else {
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
  }

  function drawPlayer() {
    const x = player.col * TILE, y = player.row * TILE;
    ctx.fillStyle = '#e63946';
    ctx.fillRect(x + 7, y + 8, TILE - 14, TILE - 14);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    const m = TILE / 2;
    if (player.dir === 'up')    { ctx.moveTo(x+m, y+3);       ctx.lineTo(x+m-5, y+13); ctx.lineTo(x+m+5, y+13); }
    if (player.dir === 'down')  { ctx.moveTo(x+m, y+TILE-3);  ctx.lineTo(x+m-5, y+TILE-13); ctx.lineTo(x+m+5, y+TILE-13); }
    if (player.dir === 'left')  { ctx.moveTo(x+3, y+m);       ctx.lineTo(x+13, y+m-5); ctx.lineTo(x+13, y+m+5); }
    if (player.dir === 'right') { ctx.moveTo(x+TILE-3, y+m);  ctx.lineTo(x+TILE-13, y+m-5); ctx.lineTo(x+TILE-13, y+m+5); }
    ctx.closePath();
    ctx.fill();
  }

  function updateHUD() {
    const count    = state.overworldDefeated || 0;
    const required = LEVELS[state.currentLevel]?.requiredDefeats || 3;
    const el = document.getElementById('overworld-counter');
    if (el) el.textContent = `Verslagen: ${count} / ${required}`;
  }

  return { start, pause, resume, cleanup };
})();
