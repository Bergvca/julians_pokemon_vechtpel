const state = {
  playerName: '',
  selectedPokemon: null,
  playerPokemon: null,
  enemyPokemon: null,
  currentLevel: 0,
  battlePhase: 'idle',
  waitingForInput: false,
  battleContext: null,   // 'wild' | null
  overworldDefeated: 0
};

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
}

function startGame() {
  state.currentLevel = 0;
  populatePokemonChoices();
  showScreen('choose-pokemon');
}

function populatePokemonChoices() {
  const level = LEVELS[state.currentLevel];
  document.getElementById('choose-pokemon-title').textContent =
    `Level ${level.id}: Kies jouw Pokémon!`;
  const container = document.getElementById('pokemon-choices');
  container.innerHTML = '';
  for (const key of level.playerChoices) {
    const p = POKEMON[key];
    const div = document.createElement('div');
    div.className = 'pokemon-card';
    div.onclick = () => selectPokemon(key);
    div.innerHTML = `
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png" alt="${p.name}">
      <p class="card-name">${p.name}</p>
      <span class="card-type type-${p.type}">${p.type}</span>
    `;
    container.appendChild(div);
  }
}

function selectPokemon(key) {
  state.selectedPokemon = key;
  const p = POKEMON[key];
  document.getElementById('chosen-pokemon-img').src =
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
  document.getElementById('chosen-pokemon-label').textContent = p.name;

  const level = LEVELS[state.currentLevel];
  if (state.currentLevel === 0) {
    showScreen('choose-name');
    document.getElementById('trainer-name-input').value = '';
  } else if (level.type === 'overworld') {
    state.overworldDefeated = 0;
    state.playerPokemon = { ...p, attacks: p.attacks, hp: p.maxHp };
    showScreen('level3');
    Overworld.start(document.getElementById('overworld-canvas'));
  } else {
    startBattle();
  }
}

function confirmName() {
  const input = document.getElementById('trainer-name-input').value.trim();
  if (!input) {
    document.getElementById('trainer-name-input').classList.add('shake');
    setTimeout(() => document.getElementById('trainer-name-input').classList.remove('shake'), 400);
    return;
  }
  state.playerName = input;
  startBattle();
}

function startBattle() {
  const level = LEVELS[state.currentLevel];
  const playerData = POKEMON[state.selectedPokemon];
  const enemyData = POKEMON[level.pokemon];

  state.playerPokemon = { ...playerData, attacks: playerData.attacks, hp: playerData.maxHp };
  state.enemyPokemon = { ...enemyData, attacks: enemyData.attacks, hp: enemyData.maxHp };

  document.getElementById('player-sprite').src =
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${playerData.id}.png`;
  document.getElementById('enemy-sprite').src =
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${enemyData.id}.png`;

  document.getElementById('player-pokemon-name').textContent = playerData.name;
  document.getElementById('player-trainer-label').textContent = state.playerName;
  document.getElementById('enemy-pokemon-name').textContent = enemyData.name;
  document.getElementById('enemy-trainer-label').textContent = level.trainerName;

  const attackButtons = document.getElementById('attack-buttons');
  attackButtons.innerHTML = '';
  playerData.attacks.forEach((attack, i) => {
    const btn = document.createElement('button');
    btn.className = 'attack-btn';
    btn.innerHTML = `<span class="attack-name">${attack.name}</span><span class="attack-type type-${attack.type}">${attack.type}</span>`;
    btn.onclick = () => playerAttack(i);
    attackButtons.appendChild(btn);
  });

  updateBattleUI();
  showScreen('battle');
  hideAttackButtons();
  BattleMusic.start(level.id);

  setMessage(level.intro);
  setTimeout(() => {
    setMessage(`${level.trainerName} stuurt ${enemyData.name}!`);
    setTimeout(() => startPlayerTurn(), 1500);
  }, 1500);
}

function startPlayerTurn() {
  state.battlePhase = 'player';
  state.waitingForInput = true;
  setMessage(`Wat doet ${state.playerPokemon.name}?`);
  showAttackButtons();
}

function playerAttack(index) {
  if (!state.waitingForInput || state.battlePhase !== 'player') return;
  state.waitingForInput = false;
  hideAttackButtons();

  const attack = state.playerPokemon.attacks[index];
  const effectiveness = typeEffectiveness(attack.type, state.enemyPokemon.type);
  const damage = calculateDamage(attack, effectiveness);

  setMessage(`${state.playerPokemon.name} gebruikt ${attack.name}!`);
  animateHit('enemy-sprite');

  setTimeout(() => {
    state.enemyPokemon.hp = Math.max(0, state.enemyPokemon.hp - damage);
    updateBattleUI();

    if (effectiveness > 1) {
      setMessage('Het is supereffectief!');
    } else if (effectiveness < 1) {
      setMessage('Niet erg effectief...');
    }

    const delay = effectiveness !== 1 ? 1200 : 800;
    setTimeout(() => {
      if (state.enemyPokemon.hp <= 0) {
        endBattle('win');
      } else {
        enemyTurn();
      }
    }, delay);
  }, 600);
}

function enemyTurn() {
  state.battlePhase = 'enemy';
  const enemy = state.enemyPokemon;
  const attack = enemy.attacks[Math.floor(Math.random() * enemy.attacks.length)];
  const effectiveness = typeEffectiveness(attack.type, state.playerPokemon.type);
  const damage = calculateDamage(attack, effectiveness);

  setMessage(`${enemy.name} gebruikt ${attack.name}!`);
  animateHit('player-sprite');

  setTimeout(() => {
    state.playerPokemon.hp = Math.max(0, state.playerPokemon.hp - damage);
    updateBattleUI();

    if (effectiveness > 1) {
      setMessage('Het is supereffectief!');
    } else if (effectiveness < 1) {
      setMessage('Niet erg effectief...');
    }

    const delay = effectiveness !== 1 ? 1200 : 800;
    setTimeout(() => {
      if (state.playerPokemon.hp <= 0) {
        endBattle('lose');
      } else {
        startPlayerTurn();
      }
    }, delay);
  }, 600);
}

function calculateDamage(attack, effectiveness) {
  // Box-Muller normaalverdeling, std = 10% van aanvalskracht
  const u1 = Math.random() || 1e-10;
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * Math.random());
  const variance = z * (attack.power * 0.10);
  return Math.max(1, Math.round((attack.power + variance) * effectiveness));
}

function typeEffectiveness(attackType, defenderType) {
  const chart = {
    water: { vuur: 1.5, plant: 0.67 },
    vuur:  { plant: 1.5, water: 0.67 },
    plant: { water: 1.5, vuur:  0.67 }
  };
  const modifier = chart[attackType]?.[defenderType] ?? 1;
  if (modifier === 1) return 1;
  return Math.random() < 0.80 ? modifier : 1;
}

function updateBattleUI() {
  updateHpBar('player', state.playerPokemon);
  updateHpBar('enemy', state.enemyPokemon);
}

function updateHpBar(who, pokemon) {
  const pct = Math.max(0, (pokemon.hp / pokemon.maxHp) * 100);
  const bar = document.getElementById(`${who}-hp-bar`);
  const num = document.getElementById(`${who}-hp-number`);

  bar.style.width = pct + '%';
  num.textContent = `${pokemon.hp}/${pokemon.maxHp}`;

  bar.className = 'hp-bar-inner';
  if (pct <= 25) bar.classList.add('hp-red');
  else if (pct <= 50) bar.classList.add('hp-yellow');
}

function animateHit(spriteId) {
  const el = document.getElementById(spriteId);
  el.classList.add('hit');
  setTimeout(() => el.classList.remove('hit'), 500);
}

function showAttackButtons() {
  document.getElementById('attack-buttons').style.display = 'grid';
  document.getElementById('battle-message').style.borderBottom = 'none';
}

function hideAttackButtons() {
  document.getElementById('attack-buttons').style.display = 'none';
}

function setMessage(msg) {
  document.getElementById('battle-message').textContent = msg;
}

function startWildBattle(pokemonKey) {
  state.battleContext = 'wild';
  const playerData = POKEMON[state.selectedPokemon];
  const enemyData  = POKEMON[pokemonKey];

  state.playerPokemon = { ...playerData, attacks: playerData.attacks, hp: state.playerPokemon.hp };
  state.enemyPokemon  = { ...enemyData,  attacks: enemyData.attacks,  hp: enemyData.maxHp  };

  document.getElementById('player-sprite').src =
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${playerData.id}.png`;
  document.getElementById('enemy-sprite').src =
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${enemyData.id}.png`;

  document.getElementById('player-pokemon-name').textContent = playerData.name;
  document.getElementById('player-trainer-label').textContent = state.playerName;
  document.getElementById('enemy-pokemon-name').textContent = enemyData.name;
  document.getElementById('enemy-trainer-label').textContent = 'Wild';

  const attackButtons = document.getElementById('attack-buttons');
  attackButtons.innerHTML = '';
  playerData.attacks.forEach((attack, i) => {
    const btn = document.createElement('button');
    btn.className = 'attack-btn';
    btn.innerHTML = `<span class="attack-name">${attack.name}</span><span class="attack-type type-${attack.type}">${attack.type}</span>`;
    btn.onclick = () => playerAttack(i);
    attackButtons.appendChild(btn);
  });

  updateBattleUI();
  showScreen('battle');
  hideAttackButtons();
  BattleMusic.start(2);

  setMessage(`Een wilde ${enemyData.name} verschijnt!`);
  setTimeout(() => startPlayerTurn(), 1500);
}

function endOverworld(result) {
  showScreen('result');
  const title = document.getElementById('result-title');
  const msg   = document.getElementById('result-message');
  title.style.color = '#f7c948';
  title.textContent = 'Gewonnen!';
  msg.textContent   = `${state.playerName} heeft het Groene Woud doorkruist!`;
  document.getElementById('result-icon').textContent = '🏆';
  document.getElementById('result-btn-continue').style.display = 'none';
  document.getElementById('result-btn-restart').style.display  = 'inline-block';
}

function endBattle(result) {
  BattleMusic.stop();

  if (state.battleContext === 'wild') {
    state.battleContext = null;
    setTimeout(() => {
      if (result === 'win') {
        showScreen('level3');
        Overworld.resume(true);
      } else {
        Overworld.cleanup();
        showScreen('result');
        document.getElementById('result-title').textContent   = 'Verloren...';
        document.getElementById('result-title').style.color   = '#e74c3c';
        document.getElementById('result-message').textContent = `${state.playerPokemon.name} is gevallen in het woud!`;
        document.getElementById('result-icon').textContent    = '💔';
        document.getElementById('result-btn-continue').style.display = 'none';
        document.getElementById('result-btn-restart').style.display  = 'inline-block';
      }
    }, 800);
    return;
  }

  const defeatedTrainer = LEVELS[state.currentLevel].trainerName;
  const hasNextLevel = result === 'win' && state.currentLevel < LEVELS.length - 1;

  setTimeout(() => {
    showScreen('result');
    const title = document.getElementById('result-title');
    const msg = document.getElementById('result-message');
    const btnContinue = document.getElementById('result-btn-continue');
    const btnRestart = document.getElementById('result-btn-restart');

    if (result === 'win') {
      if (hasNextLevel) {
        title.textContent = 'Level gewonnen!';
        title.style.color = '#f7c948';
        msg.textContent = `${defeatedTrainer} is verslagen! Klaar voor het volgende level?`;
        document.getElementById('result-icon').textContent = '⭐';
        btnContinue.style.display = 'inline-block';
        btnRestart.style.display = 'none';
      } else {
        title.textContent = 'Gewonnen!';
        title.style.color = '#f7c948';
        msg.textContent = `${state.playerName} heeft alle trainers verslagen!`;
        document.getElementById('result-icon').textContent = '🏆';
        btnContinue.style.display = 'none';
        btnRestart.style.display = 'inline-block';
      }
    } else {
      title.textContent = 'Verloren...';
      title.style.color = '#e74c3c';
      msg.textContent = `${state.playerPokemon.name} is gevallen. Geef niet op!`;
      document.getElementById('result-icon').textContent = '💔';
      btnContinue.style.display = 'none';
      btnRestart.style.display = 'inline-block';
    }
  }, 800);
}

function continueToNextLevel() {
  state.currentLevel++;
  populatePokemonChoices();
  showScreen('choose-pokemon');
}

function restartGame() {
  BattleMusic.stop();
  Overworld.cleanup();
  state.playerName = '';
  state.selectedPokemon = null;
  state.playerPokemon = null;
  state.enemyPokemon = null;
  state.currentLevel = 0;
  state.battlePhase = 'idle';
  state.waitingForInput = false;
  state.battleContext = null;
  state.overworldDefeated = 0;
  showScreen('start');
}

function toggleMusic() {
  const muted = BattleMusic.toggleMute();
  document.getElementById('music-btn').textContent = muted ? '🔇' : '🔊';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const nameScreen = document.getElementById('screen-choose-name');
    if (nameScreen.classList.contains('active')) confirmName();
  }
});
