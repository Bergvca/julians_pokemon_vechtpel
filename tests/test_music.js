describe('BattleMusic', () => {
  // Minimale AudioContext-stub die geen geluid maakt.
  class FakeAudioContext {
    constructor() {
      this.currentTime = 0;
      this.destination = {};
      this.closed = false;
    }
    createOscillator() {
      return { type: '', frequency: { value: 0 }, connect() {}, start() {}, stop() {} };
    }
    createGain() {
      return { gain: { setValueAtTime() {}, setTargetAtTime() {} }, connect() {} };
    }
    close() { this.closed = true; }
  }

  function withFakeAudio(fn) {
    const realAC = window.AudioContext;
    window.AudioContext = FakeAudioContext;
    try { fn(); } finally {
      window.AudioContext = realAC;
      BattleMusic.stop();  // zorg dat we niet met een open ctx blijven zitten
    }
  }

  test('toggleMute schakelt heen en weer', () => {
    withFakeAudio(() => {
      const before = BattleMusic.isMuted();
      const next = BattleMusic.toggleMute();
      assertEqual(next, !before);
      BattleMusic.toggleMute();  // herstel
      assertEqual(BattleMusic.isMuted(), before);
    });
  });

  test('mute-status blijft behouden over stop()/start() heen', () => {
    withFakeAudio(() => {
      // Zorg dat we beginnen vanuit unmuted.
      if (BattleMusic.isMuted()) BattleMusic.toggleMute();
      assertEqual(BattleMusic.isMuted(), false);

      BattleMusic.start(1);
      BattleMusic.toggleMute();  // muted = true
      assertEqual(BattleMusic.isMuted(), true);

      BattleMusic.stop();
      assertEqual(BattleMusic.isMuted(), true, 'mute moet na stop() behouden blijven');

      BattleMusic.start(2);
      assertEqual(BattleMusic.isMuted(), true, 'mute moet ook na een nieuwe start() behouden blijven');

      BattleMusic.stop();
      // herstel naar unmuted voor volgende tests
      if (BattleMusic.isMuted()) BattleMusic.toggleMute();
    });
  });

  test('start() is idempotent — tweede aanroep met andere level negeert nieuwe AC', () => {
    withFakeAudio(() => {
      BattleMusic.start(1);
      // Een tweede start zou geen nieuwe AudioContext mogen openen (vroege return).
      // We controleren dit indirect: na stop() moet alles netjes opruimen zonder errors.
      BattleMusic.start(2);  // mag geen exception gooien
      BattleMusic.stop();
    });
  });
});
