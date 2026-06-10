// Vang-minigame: na het winnen van een wild gevecht kun je de Pokémon vangen
// door de Pokéball met een swipe (vinger of muis) omhoog te gooien.
const CatchGame = (() => {
  const GRAVITY = 1800;      // px/s²
  const HIT_RADIUS = 55;     // px
  const MAX_BALLS = 3;
  const MIN_UP_SPEED = 200;  // px/s omhoog, anders telt het niet als worp
  const MAX_VX = 900;
  const MAX_VY = 2600;

  // ── Pure helpers (geëxposeerd voor tests) ────────────────────────
  // samples: [{x, y, t}] van de swipe; geeft {vx, vy} in px/s of null.
  function computeThrowVelocity(samples) {
    if (!samples || samples.length < 2) return null;
    const a = samples[0];
    const b = samples[samples.length - 1];
    const dt = Math.max(b.t - a.t, 1) / 1000;
    const vx = (b.x - a.x) / dt;
    const vy = (b.y - a.y) / dt;
    if (vy > -MIN_UP_SPEED) return null;
    return {
      vx: Math.max(-MAX_VX, Math.min(MAX_VX, vx)),
      vy: Math.max(-MAX_VY, vy)
    };
  }

  function isHit(ballX, ballY, targetX, targetY, radius = HIT_RADIUS) {
    return Math.hypot(ballX - targetX, ballY - targetY) <= radius;
  }

  // ── DOM & spel-staat ─────────────────────────────────────────────
  let arena, ballEl, pokeEl, msgEl, ballsEl, flashEl;
  let arenaW = 0, arenaH = 0, homeX = 0, homeY = 0, swayAmp = 50;
  let phase = 'idle';  // aim | drag | fly | caught | done
  let ball = { x: 0, y: 0, vx: 0, vy: 0 };
  let target = { x: 0, y: 0 };
  let swayT = 0, lastT = 0, raf = null, flightTime = 0;
  let samples = [], ballsLeft = 0;
  let pokemonKey = null, onDoneCb = null;

  function start(key, onDone) {
    pokemonKey = key;
    onDoneCb = onDone;
    const p = POKEMON[key];

    arena   = document.getElementById('catch-arena');
    ballEl  = document.getElementById('catch-ball');
    pokeEl  = document.getElementById('catch-pokemon');
    msgEl   = document.getElementById('catch-message');
    ballsEl = document.getElementById('catch-balls');
    flashEl = document.getElementById('catch-flash');

    pokeEl.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
    pokeEl.style.display = '';
    flashEl.classList.remove('flash');
    ballEl.classList.remove('wobble');

    showScreen('catch');

    arenaW = arena.clientWidth;
    arenaH = arena.clientHeight;
    homeX = arenaW / 2;
    homeY = arenaH - 70;
    swayAmp = Math.min(60, arenaW * 0.18);
    target = { x: arenaW / 2, y: 110 };
    ballsLeft = MAX_BALLS;
    swayT = 0;
    lastT = 0;
    phase = 'aim';
    resetBall();
    renderBallCount();
    setMsg(`Swipe de Pokéball naar ${p.name} om te vangen!`);

    arena.addEventListener('pointerdown', onPointerDown);
    arena.addEventListener('pointermove', onPointerMove);
    arena.addEventListener('pointerup', onPointerUp);
    arena.addEventListener('pointercancel', onPointerUp);

    raf = requestAnimationFrame(loop);
  }

  function skip() {
    if (phase === 'aim' || phase === 'drag' || phase === 'fly') finish(false);
  }

  function finish(caught) {
    phase = 'idle';
    cancelAnimationFrame(raf);
    arena.removeEventListener('pointerdown', onPointerDown);
    arena.removeEventListener('pointermove', onPointerMove);
    arena.removeEventListener('pointerup', onPointerUp);
    arena.removeEventListener('pointercancel', onPointerUp);
    const cb = onDoneCb;
    onDoneCb = null;
    if (cb) cb(caught);
  }

  function setMsg(msg) {
    msgEl.textContent = msg;
  }

  function renderBallCount() {
    ballsEl.textContent = '●'.repeat(ballsLeft) + '○'.repeat(MAX_BALLS - ballsLeft);
  }

  function resetBall() {
    ball = { x: homeX, y: homeY, vx: 0, vy: 0 };
    renderBall(1);
  }

  function renderBall(scale) {
    // Bal krimpt iets naarmate hij hoger vliegt (diepte-effect).
    const s = scale ?? Math.max(0.55, 1 - ((homeY - ball.y) / Math.max(arenaH, 1)) * 0.45);
    ballEl.style.left = ball.x + 'px';
    ballEl.style.top  = ball.y + 'px';
    ballEl.style.transform = `translate(-50%, -50%) scale(${s})`;
  }

  function toLocal(e) {
    const r = arena.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() };
  }

  function onPointerDown(e) {
    if (phase !== 'aim') return;
    const p = toLocal(e);
    if (Math.hypot(p.x - ball.x, p.y - ball.y) > 80) return;
    phase = 'drag';
    samples = [p];
    if (arena.setPointerCapture) arena.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (phase !== 'drag') return;
    const p = toLocal(e);
    ball.x = Math.max(10, Math.min(arenaW - 10, p.x));
    ball.y = Math.max(arenaH * 0.4, Math.min(arenaH - 10, p.y));
    renderBall(1);
    samples.push(p);
    while (samples.length > 1 && p.t - samples[0].t > 140) samples.shift();
    e.preventDefault();
  }

  function onPointerUp(e) {
    if (phase !== 'drag') return;
    samples.push(toLocal(e));
    const v = computeThrowVelocity(samples);
    if (!v) {
      phase = 'aim';
      resetBall();
      setMsg('Swipe omhoog om de bal te gooien!');
      return;
    }
    ball.vx = v.vx;
    ball.vy = v.vy;
    flightTime = 0;
    phase = 'fly';
  }

  function loop(now) {
    if (!lastT) lastT = now;
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;

    if (phase === 'aim' || phase === 'drag' || phase === 'fly') {
      swayT += dt;
      target.x = arenaW / 2 + Math.sin(swayT * 1.6) * swayAmp;
      pokeEl.style.left = target.x + 'px';
      pokeEl.style.top  = target.y + 'px';
    }

    if (phase === 'fly') {
      flightTime += dt;
      ball.vy += GRAVITY * dt;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      renderBall();
      if (isHit(ball.x, ball.y, target.x, target.y)) {
        onCatch();
      } else if (ball.y > arenaH + 60 || ball.x < -60 || ball.x > arenaW + 60 || flightTime > 4) {
        onMiss();
      }
    }

    raf = requestAnimationFrame(loop);
  }

  function onCatch() {
    phase = 'caught';
    const p = POKEMON[pokemonKey];
    pokeEl.style.display = 'none';
    flashEl.classList.add('flash');
    ball.x = target.x;
    ball.y = target.y;
    renderBall(1);
    ballEl.classList.add('wobble');
    setMsg('De bal wiebelt...');
    setTimeout(() => {
      ballEl.classList.remove('wobble');
      Pokedex.addCaught(pokemonKey);
      setMsg(`Klik! ${p.name} is gevangen en staat nu in je Pokédex!`);
      setTimeout(() => finish(true), 2000);
    }, 1800);
  }

  function onMiss() {
    ballsLeft--;
    renderBallCount();
    if (ballsLeft <= 0) {
      phase = 'done';
      setMsg(`Oh nee, ${POKEMON[pokemonKey].name} is ontsnapt...`);
      setTimeout(() => finish(false), 1800);
    } else {
      phase = 'aim';
      resetBall();
      setMsg('Mis! Probeer het nog eens.');
    }
  }

  return {
    start,
    skip,
    // Geëxposeerd voor tests
    _logic: { computeThrowVelocity, isHit, HIT_RADIUS, MAX_BALLS, MIN_UP_SPEED, MAX_VX, MAX_VY }
  };
})();
