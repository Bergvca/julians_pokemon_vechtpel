# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Vecht Pokémon Spel** — een browser-gebaseerd Pokémon-vechtspel (HTML/CSS/JS, geen build-stap). Taal van de UI en code: Nederlands.

Open het spel door `index.html` direct in een browser te openen. Er is geen server, build-tool of package manager nodig.

## Architectuur

Alle scripts worden als losse `<script>`-tags in `index.html` geladen, in deze volgorde:

```
data/pokemon.js  →  data/levels.js  →  music.js  →  game.js
```

### `data/pokemon.js`
Definieert de globale `POKEMON`-constante: een object waarbij elke sleutel een Pokémon-id is (`squirtle`, `charmander`, `bulbasaur`, `wartortle`). Elk object bevat `id` (PokeAPI sprite-nummer), `name`, `type`, `maxHp` en `attacks[]`.

Sprites worden geladen van:
- Voorkant: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`
- Achterkant: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/{id}.png`

### `data/levels.js`
Definieert de globale `LEVELS`-array. Elk level heeft `id`, `trainerName`, `pokemon` (sleutel in `POKEMON`) en `intro`-tekst. Level 1 = Niels met Wartortle.

### `music.js`
Exporteert het globale object `BattleMusic` met methoden `start()`, `stop()` en `toggleMute()`. Genereert procedureel een chiptune battle-theme via de Web Audio API (square wave melodie + triangle bass, 160 BPM, 4-maten loop van 6 seconden). Geen externe audiobestanden.

### `game.js`
Beheert de spelstatus via het globale `state`-object en manipuleert de DOM direct. Spelverloop:

1. `showScreen(name)` — wisselt tussen schermen (`start`, `choose-pokemon`, `choose-name`, `battle`, `result`)
2. `selectPokemon(key)` → `confirmName()` → `startBattle()`
3. Gevechtsloop: `startPlayerTurn()` → `playerAttack(i)` → `enemyTurn()` → herhaal
4. `endBattle('win'|'lose')` — stopt muziek, toont resultaatscherm

Type-effectiviteitschart: water > vuur, vuur > plant, plant > water (×1.5 schade). Aanvalschade = `power ± 2 × effectiveness`, minimaal 1.

### `index.html` / `style.css`
Vijf schermen gestapeld via `position: absolute`, alleen het actieve scherm heeft klasse `active` (`display: flex`). De gevechtsscene gebruikt absolute positionering voor sprites en HP-boxes bovenop een CSS-gradiënt (lucht/gras).

## Uitbreiden

**Nieuw Pokémon toevoegen:** voeg een entry toe aan `POKEMON` in `data/pokemon.js` met dezelfde structuur.

**Nieuw level toevoegen:** voeg een object toe aan `LEVELS` in `data/levels.js`. Het `pokemon`-veld moet een bestaande sleutel in `POKEMON` zijn.

**Type-systeem uitbreiden:** pas de `chart` in `typeEffectiveness()` in `game.js` aan.
