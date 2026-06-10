// Pokédex: houdt in localStorage bij welke wilde Pokémon gevangen zijn
// en toont ze op het pokedex-scherm. Niet-gevangen Pokémon zijn silhouetten.
const Pokedex = (() => {
  const STORAGE_KEY = 'vechtPokemon.caught';

  // Factory zodat tests een eigen (fake) storage kunnen meegeven.
  function createCaughtStore(storage) {
    function load() {
      try {
        const parsed = JSON.parse(storage.getItem(STORAGE_KEY));
        return Array.isArray(parsed) ? parsed.filter(k => typeof k === 'string') : [];
      } catch {
        return [];
      }
    }
    function save(list) {
      try { storage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
    }
    return {
      getCaught: load,
      isCaught: key => load().includes(key),
      addCaught(key) {
        const list = load();
        if (list.includes(key)) return false;
        list.push(key);
        save(list);
        return true;
      }
    };
  }

  const store = createCaughtStore(window.localStorage);

  function render() {
    const caught = store.getCaught();
    document.getElementById('pokedex-count').textContent =
      `Gevangen: ${caught.length} / ${Object.keys(POKEMON).length}`;
    const grid = document.getElementById('pokedex-grid');
    grid.innerHTML = '';
    for (const [key, p] of Object.entries(POKEMON)) {
      const isCaught = caught.includes(key);
      const div = document.createElement('div');
      div.className = 'pokedex-entry' + (isCaught ? ' caught' : '');
      div.innerHTML = `
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png" alt="${isCaught ? p.name : '???'}">
        <span>${isCaught ? p.name : '???'}</span>
      `;
      grid.appendChild(div);
    }
  }

  function open() {
    render();
    showScreen('pokedex');
  }

  function close() {
    showScreen('start');
  }

  return {
    open,
    close,
    getCaught: store.getCaught,
    isCaught: store.isCaught,
    addCaught: store.addCaught,
    // Geëxposeerd voor tests
    createCaughtStore,
    STORAGE_KEY
  };
})();
