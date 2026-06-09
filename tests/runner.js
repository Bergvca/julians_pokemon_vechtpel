// Minimale browser-based test runner. Geen dependencies.
// Resultaten worden naar #results gelogd en als pass/fail-totaal getoond.

const TestRunner = (() => {
  const suites = [];
  let currentSuite = null;

  function describe(name, fn) {
    currentSuite = { name, tests: [] };
    suites.push(currentSuite);
    fn();
    currentSuite = null;
  }

  function test(name, fn) {
    if (!currentSuite) throw new Error(`test("${name}") buiten describe()`);
    currentSuite.tests.push({ name, fn });
  }

  function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'assertie mislukt');
  }

  function assertEqual(actual, expected, msg) {
    if (actual !== expected) {
      throw new Error(`${msg || 'verwacht ==='}: verwacht ${JSON.stringify(expected)}, kreeg ${JSON.stringify(actual)}`);
    }
  }

  function assertDeepEqual(actual, expected, msg) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) throw new Error(`${msg || 'verwacht deepEqual'}: verwacht ${b}, kreeg ${a}`);
  }

  function assertThrows(fn, msg) {
    let threw = false;
    try { fn(); } catch (_) { threw = true; }
    if (!threw) throw new Error(msg || 'verwachtte een exception');
  }

  // Vervangt Math.random door een reeks vaste waarden. Geeft fn-result terug.
  function withMockedRandom(values, fn) {
    const original = Math.random;
    const queue = Array.isArray(values) ? [...values] : [values];
    Math.random = () => {
      if (queue.length === 0) throw new Error('Math.random vaker aangeroepen dan gemocked');
      return queue.shift();
    };
    try {
      return fn();
    } finally {
      Math.random = original;
    }
  }

  // Vervangt Math.random met een teller. Geeft het aantal calls terug.
  function countRandomCalls(fn) {
    const original = Math.random;
    let count = 0;
    Math.random = () => { count++; return original(); };
    try { fn(); return count; }
    finally { Math.random = original; }
  }

  function run() {
    const out = document.getElementById('results');
    const log = (line, cls = '') =>
      out.insertAdjacentHTML('beforeend', `<div class="${cls}">${line}</div>`);

    let passed = 0, failed = 0;
    for (const suite of suites) {
      log(`<strong>${escape(suite.name)}</strong>`, 'suite');
      for (const t of suite.tests) {
        try {
          t.fn();
          passed++;
          log(`  ✓ ${escape(t.name)}`, 'pass');
        } catch (e) {
          failed++;
          log(`  ✗ ${escape(t.name)}`, 'fail');
          log(`      ${escape(e.message)}`, 'fail-msg');
          console.error(`[${suite.name}] ${t.name}:`, e);
        }
      }
    }
    const total = passed + failed;
    log(`<hr>${passed}/${total} geslaagd, ${failed} mislukt`, failed ? 'summary fail' : 'summary pass');
    document.title = failed ? `✗ ${failed} mislukt` : `✓ ${passed}/${total}`;
  }

  function escape(s) {
    return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }

  return {
    describe, test, run,
    assert, assertEqual, assertDeepEqual, assertThrows,
    withMockedRandom, countRandomCalls
  };
})();

// Globale aliassen voor handige import-vrije tests
const describe = TestRunner.describe;
const test = TestRunner.test;
const assert = TestRunner.assert;
const assertEqual = TestRunner.assertEqual;
const assertDeepEqual = TestRunner.assertDeepEqual;
const assertThrows = TestRunner.assertThrows;
const withMockedRandom = TestRunner.withMockedRandom;
const countRandomCalls = TestRunner.countRandomCalls;
