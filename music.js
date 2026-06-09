const BattleMusic = (() => {
  let ctx = null;
  let timer = null;
  let loopEnd = 0;
  let muted = false;       // blijft behouden over stop()/start() heen
  let activeLevel = 1;

  const R = 0;

  // Frequenties (Hz) — gedeeld door beide thema's
  const D3 = 146.8, Eb3 = 155.6, E3 = 164.8, F3 = 174.6, G3 = 196.0;
  const A3 = 220.0, Bb3 = 233.1, B3 = 246.9;
  const F4 = 349.2, G4 = 392.0, A4 = 440.0, Bb4 = 466.2, B4 = 493.9;
  const C5 = 523.3, D5 = 587.3, Eb5 = 622.3, E5 = 659.3, F5 = 698.5;
  const G5 = 784.0, Ab5 = 830.6, A5 = 880.0, Bb5 = 932.3;

  // ── Thema 1: Level 1 — 160 BPM, G-mineur ────────────────────────────
  const S1 = 60 / 160 / 4;

  const MELODY_1 = [
    [G5, 1], [R, 1], [G5, 1], [R, 1], [G5, 1], [R, 1], [G5, 1], [Eb5, 1],
    [D5, 2], [R, 2], [Bb4, 2], [C5, 2],
    [D5, 2], [C5, 2], [Bb4, 2], [C5, 2], [D5, 2], [Eb5, 2], [D5, 2], [R, 2],
    [G5, 2], [F5, 1], [G5, 1], [Bb5, 4], [Ab5, 2], [G5, 2], [F5, 2], [Eb5, 2],
    [G5, 1], [R, 1], [G5, 1], [R, 1], [G5, 1], [R, 1], [G5, 1], [Eb5, 1],
    [D5, 2], [C5, 2], [Bb4, 4],
  ];

  const BASS_1 = [
    [G3, 4], [D3, 4], [G3, 4], [D3, 4],
    [Eb3, 4], [Bb3, 4], [Eb3, 4], [Bb3, 4],
    [Bb3, 4], [F3, 4], [Bb3, 4], [F3, 4],
    [G3, 4], [D3, 4], [G3, 4], [D3, 4],
  ];

  // ── Thema 2: Level 2 — 150 BPM, A-mineur ────────────────────────────
  const S2 = 60 / 150 / 4;

  const MELODY_2 = [
    [A4, 1], [R, 1], [C5, 1], [R, 1], [E5, 1], [R, 1], [A5, 1], [R, 1],
    [G4, 2], [E5, 2], [D5, 2], [C5, 2],
    [B4, 2], [R, 2], [A4, 2], [R, 2], [G4, 2], [F4, 2], [E5, 2], [R, 2],
    [E5, 2], [F5, 1], [E5, 1], [D5, 2], [C5, 2], [B4, 2], [A5, 4], [R, 2],
    [A4, 1], [R, 1], [C5, 1], [R, 1], [E5, 2], [D5, 2], [C5, 2], [B4, 2], [A4, 4],
  ];

  const BASS_2 = [
    [A3, 4], [E3, 4], [A3, 4], [E3, 4],
    [D3, 4], [A3, 4], [D3, 4], [A3, 4],
    [E3, 4], [B3, 4], [E3, 4], [B3, 4],
    [A3, 4], [E3, 4], [A3, 4], [E3, 4],
  ];

  const THEMES = {
    1: { melody: MELODY_1, bass: BASS_1, S: S1 },
    2: { melody: MELODY_2, bass: BASS_2, S: S2 },
  };

  function playNote(type, freq, t, ticks, S, vol) {
    if (!ctx || !freq) return;
    const dur = ticks * S;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(vol, t);
    env.gain.setTargetAtTime(0.001, t + dur * 0.75, 0.025);
    osc.connect(env);
    env.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function scheduleLoop(from) {
    const { melody, bass, S } = THEMES[activeLevel] || THEMES[1];
    let mt = from;
    for (const [f, d] of melody) {
      playNote('square', f, mt, d, S, 0.10);
      mt += d * S;
    }
    let bt = from;
    for (const [f, d] of bass) {
      playNote('triangle', f, bt, d, S, 0.16);
      bt += d * S;
    }
    return mt;
  }

  function tick() {
    if (!ctx || muted) return;
    const now = ctx.currentTime;
    if (now + 1.0 > loopEnd) {
      loopEnd = scheduleLoop(Math.max(now + 0.01, loopEnd));
    }
  }

  return {
    start(level = 1) {
      if (ctx) return;
      activeLevel = level;
      ctx = new AudioContext();
      loopEnd = ctx.currentTime;
      tick();
      timer = setInterval(tick, 500);
    },
    stop() {
      clearInterval(timer);
      timer = null;
      if (ctx) { ctx.close(); ctx = null; }
      loopEnd = 0;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    }
  };
})();
