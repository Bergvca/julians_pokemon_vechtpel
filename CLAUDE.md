# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Vecht Pokémon Spel** — een browser-gebaseerd Pokémon-vechtspel (HTML/CSS/JS, geen build-stap). Taal van de UI en code: Nederlands.

Open het spel door `index.html` direct in een browser te openen. Er is geen server, build-tool of package manager nodig.

Live op: https://bergvca.github.io/julians_pokemon_vechtpel/

## Architectuur

Alle scripts worden als losse `<script>`-tags in `index.html` geladen, in deze volgorde:

```
data/pokemon.js  →  data/levels.js  →  music.js  →  overworld.js  →  level3.js  →  level4.js  →  maze.js  →  level5.js  →  level6.js  →  pokedex.js  →  catch.js  →  game.js
```

### `data/pokemon.js`
Definieert de globale `POKEMON`-constante: een object waarbij elke sleutel een Pokémon-id is. Elk object bevat `id` (PokeAPI sprite-nummer), `name`, `type`, `maxHp` en `attacks[]`.

Huidige Pokémon: `squirtle`, `charmander`, `bulbasaur`, `wartortle`, `charmeleon`, `ivysaur`, `venusaur`, `rattata`, `pidgey`, `jigglypuff`, `blastoise`, `charizard`, `spearow`, `fearow`, `exeggutor`, `dragonite`, `mew`, `gyarados`, `gengar`.

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
| 4 | 5 | maze | Spookdoolhof (1 Gengar) |
| 5 | 6 | maze | Schaduwdoolhof (2 Gengars) |

**Trainer-level velden:** `id`, `trainerName`, `pokemon` (sleutel in `POKEMON`), `intro`, `playerChoices[]`.

**Overworld-level velden:** `id`, `type: "overworld"`, `areaName`, `playerChoices[]`, `requiredDefeats`.
- Level 3: `wildPokemon[]` — willekeurige vijanden in hoog gras.
- Level 4: `forestPokemon[]` en `lakePokemon[]` — aparte pools voor bos en meer.

**Maze-level velden:** `id`, `type: "maze"`, `areaName`, `choicesFromPokedex: true` (speler kiest uit gevangen Pokémon; `playerChoices[]` is de fallback als de Pokédex leeg is).

### `music.js`
Exporteert het globale object `BattleMusic` met methoden `start(levelId)`, `stop()`, `toggleMute()` en `isMuted()`. Genereert procedureel een chiptune battle-theme via de Web Audio API (square wave melodie + triangle bass, 160 BPM). Geen externe audiobestanden. De mute-status blijft behouden tussen `stop()` en `start()` aanroepen, zodat de speler de muziek slechts één keer hoeft uit te zetten voor de hele sessie.

### `overworld.js`
Definieert het globale object `OverworldEngine` met:
- `OverworldEngine.create(config)` — factory die een overworld-instance produceert met `{start(canvas), pause(), resume(wonBattle), cleanup()}`.
- `OverworldEngine.TILES` — `{ T: 0, P: 1, G: 2, W: 3, E: 4 }` (boom, pad, hoog gras, water, uitgang).
- `OverworldEngine.ROWS / COLS / TILE` — afmetingen (16 × 14 × 32px).
- `defaultCanEnter`, `defaultPickPool`, `defaultIsEncounterTile` — pure helpers; geëxposeerd voor tests.

`config`-opties: `map` (vereist), `encounterRate` (default 0.20), `ids: { counter, dpad: { up, down, left, right } }`, en optioneel `canEnter(tile, state)`, `pickPool(level, tile)`, `isEncounterTile(tile)`, `tileDrawers` (per tile-type een teken-functie). De engine verzorgt movement, drawing, dpad-binding, HUD, encounters en toasts.

Generieke hooks voor level-specifiek gedrag: `onStart(api)`, `onStep(api, tile, prev)` (na elke spelerstap, vóór de encounter-check), `onResume(api, wonBattle)` (vervangt de default verslagen-teller), `drawExtras(ctx, api)` (tekenen ná de tiles, vóór de speler) en `hudText()`. Het `api`-object biedt `{getPlayer, draw, showToast, pause, cleanup, startFight(pokemonKey)}`.

### `level3.js`
Roept `OverworldEngine.create()` aan met de level-3 map (Groene Woud, 20% encounter rate) en exporteert het resultaat als globale `Overworld`.

### `level4.js`
Roept `OverworldEngine.create()` aan met de level-4 map (Mystiek Woud met meertje, 22% encounter rate) en exporteert het resultaat als globale `Level4`. Custom config:
- `canEnter` — watertegels (`W`) zijn alleen beloopbaar met **Blastoise**; bij een ander Pokémon verschijnt een toast.
- `pickPool` — `level.forestPokemon` voor gras, `level.lakePokemon` voor water.
- `isEncounterTile` — zowel `G` als `W` triggeren wilde gevechten.

Voor tests is de level-specifieke logica beschikbaar via `Level4._logic.{canEnter, pickPool, isEncounterTile, MAP}`.

### `maze.js`
Definieert het globale object `MazeLevel` met `MazeLevel.create({map, gengarStarts, ids})` — gedeelde laag bovenop `OverworldEngine` voor doolhof-levels. Gedrag:
- Geen wilde encounters (`encounterRate: 0`); alleen bomen (`T`) blokkeren.
- De speler wint door de uitgangstegel (`E`) te bereiken → `endOverworld('win')`.
- Eén of meer **Gengars** bewegen turn-based (één stap per spelerstap). Een Gengar **ziet** de speler alleen recht vooruit in zijn kijkrichting (`VISION_RANGE` = 6 tegels, geblokkeerd door muren); het zichtveld wordt als paarse tegels getekend. Ziet hij de speler → achtervolging (greedy, grootste delta-as eerst); anders patrouille (75% rechtdoor).
- Raakt een Gengar de speler (of stapt de speler frontaal op een Gengar) → `mazeGameOver()`. Stapt de speler **van achteren** op een Gengar (bepaald via dot-product van kijkrichting en vorige spelerpositie) → battle via `api.startFight('gengar')`; na winst verdwijnt die Gengar.

Pure helpers voor tests via `MazeLevel._logic.{isWalkable, canSee, isBehind, chaseStep, patrolStep}` en `MazeLevel.VISION_RANGE`.

### `level5.js` / `level6.js`
Roepen `MazeLevel.create()` aan en exporteren `Level5` (Spookdoolhof, 1 Gengar) en `Level6` (Schaduwdoolhof, 2 Gengars). Map en Gengar-startposities zijn per level gedefinieerd en voor tests beschikbaar via `Level5._logic.{MAP, GENGAR_STARTS}` (idem `Level6`). Unit tests valideren met BFS dat de uitgang bereikbaar is vanaf de spelerstart (1,1).

### `pokedex.js`
Definieert het globale object `Pokedex`. Houdt in `localStorage` (sleutel `vechtPokemon.caught`) bij welke wilde Pokémon gevangen zijn — dit blijft bewaard over sessies en herstarts heen. Methoden: `open()` / `close()` (pokedex-scherm tonen/verlaten), `getCaught()`, `isCaught(key)`, `addCaught(key)`. Het pokedex-scherm toont alle `POKEMON`-entries in een grid; niet-gevangen Pokémon verschijnen als zwart silhouet met "???". Te openen via de 📕-knop op het startscherm. Voor tests is `Pokedex.createCaughtStore(storage)` beschikbaar (injecteerbare storage).

### `catch.js`
Definieert het globale object `CatchGame` met `start(pokemonKey, onDone)` en `skip()`. Vang-minigame na het winnen van een wild gevecht (level 3 en 4): de speler swipet (pointer events, dus touch én muis) de Pokéball omhoog richting de heen-en-weer zwevende Pokémon. De worp krijgt de swipe-snelheid mee en valt onder zwaartekracht; raak binnen `HIT_RADIUS` = gevangen → `Pokedex.addCaught()` + wiebel-animatie. De speler heeft 3 ballen; daarna ontsnapt de Pokémon. `onDone(caught)` wordt altijd aangeroepen (ook bij de "Niet vangen"-knop). Pure helpers voor tests via `CatchGame._logic.{computeThrowVelocity, isHit, HIT_RADIUS, MAX_BALLS, MIN_UP_SPEED, MAX_VX, MAX_VY}`.

### `game.js`
Beheert de spelstatus via het globale `state`-object en manipuleert de DOM direct. Spelverloop:

1. `showScreen(name)` — wisselt tussen schermen (`start`, `choose-pokemon`, `choose-name`, `battle`, `level3`, `level4`, `level5`, `level6`, `catch`, `pokedex`, `result`)
2. `selectPokemon(key)`:
   - Level 0 → `choose-name` scherm
   - Overworld- of maze-level → `level{id}` scherm + bijbehorend object starten via `overworldForLevel(levelId)` (mapt id 3–6 op `Overworld`/`Level4`/`Level5`/`Level6`)
   - Trainer level → `startBattle()`
   - Bij `level.choicesFromPokedex` toont `populatePokemonChoices()` de gevangen Pokémon uit de Pokédex (fallback: `playerChoices[]` als er niets gevangen is)
3. Gevechtsloop: `startPlayerTurn()` → `playerAttack(i)` → `enemyTurn()` → herhaal
4. `endBattle('win'|'lose')`:
   - Wild gevecht (`battleContext === 'wild'`) gewonnen: eerst de vang-minigame (`CatchGame.start(state.wildPokemonKey, ...)`), daarna terug naar het juiste overworld-scherm via `LEVELS[state.currentLevel].id`; bij verlies het resultaatscherm
   - Trainer gevecht: resultaatscherm met "Doorgaan" of "Opnieuw"
5. `endOverworld('win')` — toont resultaatscherm; bij `hasNextLevel` verschijnt "Doorgaan"-knop
6. `mazeGameOver()` — resultaatscherm "Gepakt!" (👻) wanneer een Gengar de speler pakt; "Opnieuw" herstart het huidige level

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
Elf schermen gestapeld via `position: absolute`, alleen het actieve scherm heeft klasse `active` (`display: flex`): `start`, `choose-pokemon`, `choose-name`, `battle`, `level3`, `level4`, `level5`, `level6`, `catch`, `pokedex`, `result`. De overworld-/maze-schermen delen de klassen `.screen-overworld`, `.overworld-hud`, `.overworld-wrap`, `.overworld-canvas` en `.overworld-dpad`.

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

**Headless draaien (zonder browser):** gebruik `jsc` (JavaScriptCore, standaard op macOS) met de browser-shim `tests/headless_shim.js`. De scriptvolgorde is dezelfde als in `tests.html`:

```sh
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
$JSC tests/headless_shim.js \
  data/pokemon.js data/levels.js music.js overworld.js level3.js level4.js maze.js level5.js level6.js pokedex.js catch.js game.js \
  tests/runner.js tests/test_data.js tests/test_battle.js tests/test_music.js tests/test_overworld.js tests/test_maze.js tests/test_catch.js \
  -e 'TestRunner.run()'
```

De uitslag verschijnt op stdout (bijv. `42/42 geslaagd, 0 mislukt`). Bij een nieuw testbestand of script: voeg het toe aan zowel `tests.html` als dit commando.

Testsuites:
- `tests/test_data.js` — validatie van `POKEMON` en `LEVELS` (types, verwijzingen, vereiste velden)
- `tests/test_battle.js` — `typeEffectiveness` en `calculateDamage` met gemockte randomness
- `tests/test_music.js` — `BattleMusic` mute-persistentie en idempotente `start()`
- `tests/test_overworld.js` — `OverworldEngine`-defaults en `Level4._logic`
- `tests/test_maze.js` — `MazeLevel._logic` (zicht, achtervolging, patrouille) en BFS-validatie van de level 5/6-maps (uitgang bereikbaar, Gengar-startposities geldig)
- `tests/test_catch.js` — `CatchGame._logic` (swipe-snelheid, raakdetectie) en de `Pokedex`-store (persistentie, deduplicatie, corrupte JSON)

Helpers in de runner: `describe`, `test`, `assert`, `assertEqual`, `assertDeepEqual`, `assertThrows`, `withMockedRandom(values, fn)`, `countRandomCalls(fn)`.
