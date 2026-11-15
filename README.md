# NOVA DRIFT

[![make.fun](https://make.fun/badge/best-game-01.svg)](https://make.fun/c/best-game-01)
[![rank](https://make.fun/badge/best-game-01/sandytaztaz-hue/nova-drift/rank.svg)](https://make.fun/c/best-game-01)
[![reward](https://make.fun/badge/best-game-01/sandytaztaz-hue/nova-drift/reward.svg)](https://make.fun/c/best-game-01)

**NOVA DRIFT** is a neon arena-survival shooter. Pilot a lone ship through
escalating waves of Drifters, Weavers, Chargers and Splitters, blast them
apart for score and nova cores, and between waves pick one of three upgrade
cards — faster fire, split shots, piercing rounds, a recharging shield, a
core magnet, ion thrusters, or a reinforced hull. How long can you drift?

- **Complete game:** title screen, escalating waves, HUD (HP, shield, wave,
  score, combo multiplier, cores, enemies left), upgrade choices between
  waves, game-over screen with final score, best score and restart.
- **Feel:** particles on every hit, screen shake, floating damage numbers,
  hit flash, muzzle glow, a twinkling starfield, and procedural WebAudio
  sound — laser, explosion, pickup, wave stinger, game over. No audio files.
- **Original:** vanilla JavaScript and 2D canvas, no library, no network.
  Every script, sound and pixel is made for this game.

## Controls

- **WASD / Arrow keys** — fly the ship
- **Mouse** — aim
- **Hold Click or Space** — fire
- **1 / 2 / 3** or click a card — pick an upgrade between waves
- **Enter** — launch, **R** — fly again after game over

## Run it

Serve `game/` with any static server and open `index.html` in desktop
Chrome. With Node 22:

```sh
node serve.ts
# then open http://localhost:8080
```

Deterministic screenshot scenes (used for the entry's screenshots) are
available as `?shot=start|play|upgrade|end&seed=1`.

## Entry

Built for the [best-game-01](https://make.fun/c/best-game-01?ref=6sv3wnda)
competition on [make.fun](https://make.fun/c/best-game-01?ref=6sv3wnda).
