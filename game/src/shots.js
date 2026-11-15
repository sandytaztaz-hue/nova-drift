// The deterministic screenshot scenes behind ?shot=start|play|upgrade|end.
// Each one plays the real rules forward from a fresh world for a fixed number
// of steps, steered by a simple autopilot, so the frame is what a short game
// really looks like and the same seed always gives the same frame.
import { FIELD, STEP } from './config.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 9;
const STEP_LIMIT = 60 * 240;

/** The autopilot's aim: the nearest living enemy, or the arena centre. */
function nearestEnemy(game) {
  let best = null;
  let bestDist = Infinity;
  for (const enemy of game.enemies) {
    const dx = enemy.x - game.player.x;
    const dy = enemy.y - game.player.y;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = enemy;
    }
  }
  return best;
}

/** Steer like a decent player: aim at the nearest enemy, fire, keep distance. */
function autopilotPlay(game) {
  const player = game.player;
  const input = game.input;
  const enemy = nearestEnemy(game);
  if (enemy) {
    input.setMouse(enemy.x, enemy.y, true);
  } else {
    input.setMouse(player.x, player.y - 200, true);
  }
  // Flee when something is close, else drift toward the nearest enemy.
  let mx = 0;
  let my = 0;
  if (enemy) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 170) {
      mx = dx / dist;
      my = dy / dist;
    } else {
      mx = -dx / dist;
      my = -dy / dist;
    }
  }
  // Stay inside the arena's middle band while chasing.
  if (player.x < 120) mx = 1;
  if (player.x > FIELD.width - 120) mx = -1;
  if (player.y < 120) my = 1;
  if (player.y > FIELD.height - 120) my = -1;
  input.setKey('KeyD', mx > 0.35);
  input.setKey('KeyA', mx < -0.35);
  input.setKey('KeyS', my > 0.35);
  input.setKey('KeyW', my < -0.35);
}

/** Steer like a careless player: fires at the swarm but drifts straight into it. */
function autopilotDoomed(game) {
  const player = game.player;
  const input = game.input;
  const enemy = nearestEnemy(game);
  // It shoots back, so the run scores a few kills before the swarm catches it.
  if (enemy) input.setMouse(enemy.x, enemy.y, true);
  else input.setMouse(player.x, player.y - 200, true);
  let mx = 0;
  let my = 0;
  if (enemy) {
    mx = (enemy.x - player.x) / (Math.hypot(enemy.x - player.x, enemy.y - player.y) || 1);
    my = (enemy.y - player.y) / (Math.hypot(enemy.x - player.x, enemy.y - player.y) || 1);
  }
  input.setKey('KeyD', mx > 0.35);
  input.setKey('KeyA', mx < -0.35);
  input.setKey('KeyS', my > 0.35);
  input.setKey('KeyW', my < -0.35);
}

/** Step the game forward with `drive` steering each step, up to `limit` steps. */
function simulate(game, drive, limit, stopWhen) {
  for (let i = 0; i < limit; i++) {
    drive(game);
    game.step(STEP);
    if (stopWhen && stopWhen(game)) break;
  }
  game.input.releaseAll();
}

/**
 * Set the game to the named scene (start, play, upgrade or end; any other name
 * is start) by playing it forward from a fresh run.
 */
export function stageShot(name, game) {
  game.reset(game.seed);
  if (name !== 'play' && name !== 'upgrade' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i++) game.step(STEP);
    return;
  }
  game.startGame();
  if (name === 'play') {
    simulate(game, autopilotPlay, PLAY_SECONDS / STEP, (g) => {
      // A wave clear mid-scene would open the upgrade cards: take the first
      // card and keep playing, so the frame stays mid-combat.
      if (g.screen === 'upgrade') g.chooseUpgrade(0);
      return false;
    });
    return;
  }
  if (name === 'upgrade') {
    simulate(
      game,
      autopilotPlay,
      STEP_LIMIT,
      (g) => {
        if (g.screen === 'upgrade') return true;
        return g.screen === 'over';
      },
    );
    // A few idle frames so the cards settle on screen.
    for (let i = 0; i < 10; i++) game.step(STEP);
    return;
  }
  // end: the careless pilot fires back but never dodges, so the swarm catches the ship.
  simulate(game, autopilotDoomed, STEP_LIMIT, (g) => {
    // A wave clear mid-run opens the upgrade cards: take the first card and
    // keep drifting into the swarm until it catches the ship.
    if (g.screen === 'upgrade') g.chooseUpgrade(0);
    return g.screen === 'over';
  });
  for (let i = 0; i < 10; i++) game.step(STEP);
}
