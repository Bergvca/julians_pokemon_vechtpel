// Minimale browser-shim om de testsuite headless te draaien in jsc
// (JavaScriptCore, standaard aanwezig op macOS). Zie CLAUDE.md → Tests.
const window = globalThis;

window.localStorage = (() => {
  const d = {};
  return {
    getItem: k => (k in d ? d[k] : null),
    setItem: (k, v) => { d[k] = String(v); }
  };
})();

const document = {
  getElementById: () => ({
    insertAdjacentHTML: (pos, html) => print(html.replace(/<[^>]*>/g, ''))
  }),
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {}
};

const console = {
  error: (...a) => print('ERR: ' + a.join(' ')),
  log: (...a) => print(a.join(' '))
};

window.setInterval = () => 0;
window.clearInterval = () => {};
const setInterval = window.setInterval;
const clearInterval = window.clearInterval;
