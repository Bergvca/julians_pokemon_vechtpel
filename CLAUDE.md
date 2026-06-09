# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Vecht Pokémon Spel** — een browser-gebaseerd Pokémon-vechtspel (HTML/CSS/JS, geen build-stap). Taal van de UI en code: Nederlands.

Open het spel door `index.html` direct in een browser te openen. Er is geen server, build-tool of package manager nodig.

Live op: https://bergvca.github.io/julians_pokemon_vechtpel/

## Architectuur

Alle scripts worden als losse `<script>`-tags in `index.html` geladen, in deze volgorde:

```
data/pokemon.js  →  data/levels.js  →  music.js  →  overworld.js  →  level3.js  →  level4.js  →  game.js
```

### `data/pokemon.js`
Definieert de globale `POKEMON`-constante: een object waarbij elke sleutel een Pokémon-id is. Elk object bevat `id` (PokeAPI sprite-nummer), `name`, `type`, `maxHp` en `attacks[]`.

Huidige Pokémon: `squirtle`, `charmander`, `bulbasaur`, `wartortle`, `charmeleon`, `ivysaur`, `venusaur`, `rattata`, `pidgey`, `jigglypuff`, `blastoise`, `charizard`, `spearow`, `fearow`, `exeggutor`, `dragonite`, `mew`, `gyarados`.

Sprites worden geladen van:
- Voorkant: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`
- Achterkant: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/{id}.png`

### `data/levels.js`
Definieert de globale `LEVELS`-array (0-geïndexeerd, `level.id` is 1-gebaseerd).

| Index | id | Type | Beschrijving |
|-------|----|------|--------------|
| 0 | 1 | trainer | Niels met Wartortle |
| 1 | 2 | trainer | Felipe met Venusaur |
| 2 | 3 | overworld | Groene Woud (Rattata, Pidgey, Jigglypuff, Spearow, Fearow) |
| 3 | 4 | overworld | Mystiek Woud met meertje (bos: Mew & Fearow; meer: Gyarados) |

**Trainer-level velden:** `id`, `trainerName`, `pokemon` (sleutel in `POKEMON`), `intro`, `playerChoices[]`.

**Overworld-level velden:** `id`, `type: "overworld"`, `playerChoices[]`, `requiredDefeats`.
- Level 3: `wildPokemon[]` — willekeurige vijanden in hoog gras.
- Level 4: `forestPokemon[]` en `lakePokemon[]` — aparte pools voor bos en meer.

### `music.js`
Exporteert het globale object `BattleMusic` met methoden `start(levelId)`, `stop()`, `toggleMute()` en `isMuted()`. Genereert procedureel een chiptune battle-theme via de Web Audio API (square wave melodie + triangle bass, 160 BPM). Geen externe audiobestanden. De mute-status blijft behouden tussen `stop()` en `start()` aanroepen, zodat de speler de muziek slechts één keer hoeft uit te zetten voor de hele sessie.

### `overworld.js`
Definieert het globale object `OverworldEngine` met:
- `OverworldEngine.create(config)` — factory die een overworld-instance produceert met `{start(canvas), pause(), resume(wonBattle), cleanup()}`.
- `OverworldEngine.TILES` — `{ T: 0, P: 1, G: 2, W: 3 }` (boom, pad, hoog gras, water).
- `OverworldEngine.ROWS / COLS / TILE` — afmetingen (16 × 14 × 32px).
- `defaultCanEnter`, `defaultPickPool`, `defaultIsEncounterTile` — pure helpers; geëxposeerd voor tests.

`config`-opties: `map` (vereist), `encounterRate` (default 0.20), `ids: { counter, dpad: { up, down, left, right } }`, en optioneel `canEnter(tile, state)`, `pickPool(level, tile)`, `isEncounterTile(tile)`, `tileDrawers` (per tile-type een teken-functie). De engine verzorgt movement, drawing, dpad-binding, HUD, encounters en toasts.

### `level3.js`
Roept `OverworldEngine.create()` aan met de level-3 map (Groene Woud, 20% encounter rate) en exporteert het resultaat als globale `Overworld`.

### `level4.js`
Roept `OverworldEngine.create()` aan met de level-4 map (Mystiek Woud met meertje, 22% encounter rate) en exporteert het resultaat als globale `Level4`. Custom config:
- `canEnter` — watertegels (`W`) zijn alleen beloopbaar met **Blastoise**; bij een ander Pokémon verschijnt een toast.
- `pickPool` — `level.forestPokemon` voor gras, `level.lakePokemon` voor water.
- `isEncounterTile` — zowel `G` als `W` triggeren wilde gevechten.

Voor tests is de level-specifieke logica beschikbaar via `Level4._logic.{canEnter, pickPool, isEncounterTile, MAP}`.

### `game.js`
Beheert de spelstatus via het globale `state`-object en manipuleert de DOM direct. Spelverloop:

1. `showScreen(name)` — wisselt tussen schermen (`start`, `choose-pokemon`, `choose-name`, `battle`, `level3`, `level4`, `result`)
2. `selectPokemon(key)`:
   - Level 0 → `choose-name` scherm
   - Overworld level → `level3` of `level4` scherm + bijbehorend `Overworld`/`Level4` object starten
   - Trainer level → `startBattle()`
3. Gevechtsloop: `startPlayerTurn()` → `playerAttack(i)` → `enemyTurn()` → herhaal
4. `endBattle('win'|'lose')`:
   - Wild gevecht (`battleContext === 'wild'`): terug naar het juiste overworld-scherm via `LEVELS[state.currentLevel].id`
   - Trainer gevecht: resultaatscherm met "Doorgaan" of "Opnieuw"
5. `endOverworld('win')` — toont resultaatscherm; bij `hasNextLevel` verschijnt "Doorgaan"-knop

**Type-effectiviteitschart** (×1.5 / ×0.67, met 80% kans dat het effect optreedt):

| Aanval | Sterk tegen | Zwak tegen |
|--------|-------------|------------|
| water  | vuur        | plant      |
| vuur   | plant       | water      |
| plant  | water       | vuur       |
| draak  | psycho      | —          |
| psycho | —           | draak      |

Aanvalschade = `power × effectiveness` met normaalverdeelde variantie (σ = 10% van power), minimaal 1.

### `index.html` / `style.css`
Zeven schermen gestapeld via `position: absolute`, alleen het actieve scherm heeft klasse `active` (`display: flex`): `start`, `choose-pokemon`, `choose-name`, `battle`, `level3`, `level4`, `result`.

Beschikbare type-klassen voor badges: `.type-water`, `.type-vuur`, `.type-plant`, `.type-normaal`, `.type-vlieg`, `.type-draak`, `.type-psycho`.

## Uitbreiden

**Nieuw Pokémon toevoegen:** voeg een entry toe aan `POKEMON` in `data/pokemon.js` met dezelfde structuur.

**Nieuw trainer-level toevoegen:** voeg een object toe aan `LEVELS` met `id`, `trainerName`, `pokemon`, `intro` en `playerChoices[]`.

**Nieuw overworld-level toevoegen:**
1. Voeg het level toe aan `LEVELS` met `type: "overworld"` en de juiste Pokémon-arrays.
2. Maak een `levelN.js` aan dat `OverworldEngine.create({...})` aanroept met de map en (indien nodig) custom `canEnter`/`pickPool`/`isEncounterTile`/`tileDrawers`.
3. Voeg een `screen-levelN`-div toe aan `index.html` met canvas en D-pad.
4. Breid `selectPokemon()` en `endBattle()` in `game.js` uit met een check op `level.id`.

**Type-systeem uitbreiden:** pas de `chart` in `typeEffectiveness()` in `game.js` aan en voeg een `.type-naam`-klasse toe in `style.css`.

## Tests

Open `tests.html` in een browser om de unit tests te draaien. De tests gebruiken een minimale, eigen testrunner (`tests/runner.js`) — geen dependencies. Resultaten verschijnen in de pagina en in de console.

Testsuites:
- `tests/test_data.js` — validatie van `POKEMON` en `LEVELS` (types, verwijzingen, vereiste velden)
- `tests/test_battle.js` — `typeEffectiveness` en `calculateDamage` met gemockte randomness
- `tests/test_music.js` — `BattleMusic` mute-persistentie en idempotente `start()`
- `tests/test_overworld.js` — `OverworldEngine`-defaults en `Level4._logic`

Helpers in de runner: `describe`, `test`, `assert`, `assertEqual`, `assertDeepEqual`, `assertThrows`, `withMockedRandom(values, fn)`, `countRandomCalls(fn)`.
