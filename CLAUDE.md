# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Vecht Pokémon Spel** — een browser-gebaseerd Pokémon-vechtspel (HTML/CSS/JS, geen build-stap). Taal van de UI en code: Nederlands.

Open het spel door `index.html` direct in een browser te openen. Er is geen server, build-tool of package manager nodig.

Live op: https://bergvca.github.io/julians_pokemon_vechtpel/

## Architectuur

Alle scripts worden als losse `<script>`-tags in `index.html` geladen, in deze volgorde:

```
data/pokemon.js  →  data/levels.js  →  music.js  →  level3.js  →  level4.js  →  game.js
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
Exporteert het globale object `BattleMusic` met methoden `start(levelId)`, `stop()` en `toggleMute()`. Genereert procedureel een chiptune battle-theme via de Web Audio API (square wave melodie + triangle bass, 160 BPM). Geen externe audiobestanden.

### `level3.js`
Exporteert het globale object `Overworld` met methoden `start(canvas)`, `resume(wonBattle)`, `pause()`, `cleanup()`. Beheert het top-down overworld voor level 3 op een canvas van 14×16 tegels (TILE=32px). Tegeltypes: `T` boom, `P` pad, `G` hoog gras (20% kans op wild gevecht). Besturing via pijltjestoetsen en D-pad-overlay.

### `level4.js`
Exporteert het globale object `Level4` met dezelfde interface als `Overworld`. Voegt watertegel `W` toe:
- Watertegels (blauw meertje, rechtsonder op de kaart) zijn alleen beloopbaar met **Blastoise** (`state.selectedPokemon === 'blastoise'`). Bij een poging met een ander Pokémon verschijnt een toast-melding.
- Encounters op `G`-tegels gebruiken `level.forestPokemon`; encounters op `W`-tegels gebruiken `level.lakePokemon`.

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
2. Maak een `levelN.js` aan naar het voorbeeld van `level4.js`.
3. Voeg een `screen-levelN`-div toe aan `index.html` met canvas en D-pad.
4. Breid `selectPokemon()` en `endBattle()` in `game.js` uit met een check op `level.id`.

**Type-systeem uitbreiden:** pas de `chart` in `typeEffectiveness()` in `game.js` aan en voeg een `.type-naam`-klasse toe in `style.css`.
