// The four enemy kinds of NOVA DRIFT, each with its own movement brain:
// Drifters chase, Weavers sine-wave, Chargers telegraph then dash, Splitters
// break into two minis when killed. Spawning picks a free edge of the arena.
import { ENEMY, FIELD, WAVE } from './config.js';
import { randomInt, randomPick, randomRange } from './random.js';

let nextId = 1;

/** Build one enemy of `kind` at the arena edge, scaled by the wave number. */
export function createEnemy(kind, wave, random) {
  const def = ENEMY[kind];
  const edge = randomInt(random, 0, 3);
  let x;
  let y;
  if (edge === 0) {
    x = randomRange(random, 40, FIELD.width - 40);
    y = -30;
  } else if (edge === 1) {
    x = randomRange(random, 40, FIELD.width - 40);
    y = FIELD.height + 30;
  } else if (edge === 2) {
    x = -30;
    y = randomRange(random, 40, FIELD.height - 40);
  } else {
    x = FIELD.width + 30;
    y = randomRange(random, 40, FIELD.height - 40);
  }
  const speedScale = 1 + (wave - 1) * WAVE.speedPerWave;
  const hpScale = 1 + (wave - 1) * WAVE.hpPerWave;
  return {
    id: nextId++,
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: def.radius,
    hp: Math.round(def.hp * hpScale),
    maxHp: Math.round(def.hp * hpScale),
    speed: def.speed * speedScale * randomRange(random, 0.9, 1.1),
    score: def.score,
    touchDamage: def.touchDamage,
    color: def.color,
    // Weaver weave phase, Charger dash state machine.
    phase: random() * Math.PI * 2,
    state: 'roam',
    stateTimer: randomRange(random, 0.6, 1.4),
    dashX: 0,
    dashY: 0,
    flash: 0,
  };
}

/** A mini split off a dead Splitter, born at the parent's position. */
export function createMini(x, y, wave) {
  const def = ENEMY.mini;
  const speedScale = 1 + (wave - 1) * WAVE.speedPerWave;
  return {
    id: nextId++,
    kind: 'mini',
    x,
    y,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: def.radius,
    hp: def.hp,
    maxHp: def.hp,
    speed: def.speed * speedScale,
    score: def.score,
    touchDamage: def.touchDamage,
    color: def.color,
    phase: Math.random() * Math.PI * 2,
    state: 'roam',
    stateTimer: 0,
    dashX: 0,
    dashY: 0,
    flash: 0,
  };
}

function chase(enemy, target, dt, speed) {
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const dist = Math.hypot(dx, dy) || 1;
  enemy.vx = (dx / dist) * speed;
  enemy.vy = (dy / dist) * speed;
  enemy.angle = Math.atan2(dy, dx);
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
}

/** One fixed step of one enemy's brain. Chargers use a telegraph-then-dash cycle. */
export function updateEnemy(enemy, player, dt) {
  if (enemy.flash > 0) enemy.flash -= dt;
  if (enemy.kind === 'drifter' || enemy.kind === 'mini') {
    chase(enemy, player, dt, enemy.speed);
    return;
  }
  if (enemy.kind === 'weaver') {
    enemy.phase += dt * 3.2;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;
    // Perpendicular sine offset on top of the chase: a weaving approach.
    const px = -ny * Math.sin(enemy.phase) * 0.85;
    const py = nx * Math.sin(enemy.phase) * 0.85;
    enemy.vx = (nx + px) * enemy.speed;
    enemy.vy = (ny + py) * enemy.speed;
    enemy.angle = Math.atan2(enemy.vy, enemy.vx);
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    return;
  }
  if (enemy.kind === 'charger') {
    enemy.stateTimer -= dt;
    if (enemy.state === 'roam') {
      chase(enemy, player, dt, enemy.speed);
      if (enemy.stateTimer <= 0) {
        enemy.state = 'telegraph';
        enemy.stateTimer = 0.55;
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy) || 1;
        enemy.dashX = dx / dist;
        enemy.dashY = dy / dist;
        enemy.angle = Math.atan2(dy, dx);
      }
    } else if (enemy.state === 'telegraph') {
      // Locked on, shivering in place: the dash line is the warning.
      enemy.x += Math.sin(enemy.phase * 40) * 6 * dt;
      if (enemy.stateTimer <= 0) {
        enemy.state = 'dash';
        enemy.stateTimer = 0.42;
      }
    } else {
      enemy.x += enemy.dashX * enemy.speed * 6.5 * dt;
      enemy.y += enemy.dashY * enemy.speed * 6.5 * dt;
      if (enemy.stateTimer <= 0) {
        enemy.state = 'roam';
        // Deterministic recovery pause, varied per enemy so dashes desync.
        enemy.stateTimer = 1.2 + (enemy.id % 5) * 0.24;
      }
    }
    return;
  }
  // Splitter: a slow, heavy chase.
  chase(enemy, player, dt, enemy.speed);
}

/** Which kinds may appear in `wave`, in the order the director prefers them. */
export function kindsForWave(wave) {
  const kinds = ['drifter'];
  if (wave >= ENEMY.weaver.firstWave) kinds.push('weaver');
  if (wave >= ENEMY.charger.firstWave) kinds.push('charger');
  if (wave >= ENEMY.splitter.firstWave) kinds.push('splitter');
  return kinds;
}

/** Pick the next spawn kind for a wave: drifters early, the mix widening later. */
export function pickSpawnKind(wave, random) {
  const kinds = kindsForWave(wave);
  const weights = kinds.map((kind) => {
    if (kind === 'drifter') return Math.max(1, 5 - wave);
    if (kind === 'splitter') return 1;
    return 2;
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = random() * total;
  for (let i = 0; i < kinds.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return kinds[i];
  }
  return randomPick(random, kinds);
}
