// The wave director for NOVA DRIFT: it builds each wave's spawn queue, drips
// enemies into the arena on a timer, and calls the wave clear when the queue
// is empty and the last enemy is gone.
import { BREATHER_SECONDS, WAVE } from './config.js';
import { pickSpawnKind } from './enemies.js';

/** A fresh director, waiting in the pre-wave breather. */
export function createWaveDirector() {
  return {
    wave: 0,
    phase: 'breather',
    phaseTimer: 2.5,
    queue: [],
    spawnTimer: 0,
    spawnInterval: WAVE.spawnInterval,
    totalInWave: 0,
    killedInWave: 0,
  };
}

/** How many enemies wave `n` holds. */
export function waveSize(n) {
  return WAVE.baseCount + WAVE.perWave * n;
}

/** Fill the queue for wave `n` and start spawning. */
export function beginWave(director, n, random) {
  director.wave = n;
  director.phase = 'active';
  director.spawnInterval = Math.max(WAVE.spawnIntervalMin, WAVE.spawnInterval - 0.05 * (n - 1));
  director.spawnTimer = 0.4;
  director.totalInWave = waveSize(n);
  director.killedInWave = 0;
  director.queue = [];
  for (let i = 0; i < director.totalInWave; i++) director.queue.push(pickSpawnKind(n, random));
}

/** Start the breather before the next wave. */
export function beginBreather(director) {
  director.phase = 'breather';
  director.phaseTimer = BREATHER_SECONDS;
  director.queue = [];
}

/**
 * One fixed step. Returns 'cleared' the step the wave is fully cleared,
 * 'started' the step a breather ends and a new wave begins, else null.
 */
export function updateWaveDirector(director, random, spawnEnemy) {
  if (director.phase === 'breather') {
    director.phaseTimer -= 1 / 60;
    if (director.phaseTimer <= 0) {
      beginWave(director, director.wave + 1, random);
      return 'started';
    }
    return null;
  }
  if (director.queue.length > 0) {
    director.spawnTimer -= 1 / 60;
    if (director.spawnTimer <= 0) {
      director.spawnTimer = director.spawnInterval;
      spawnEnemy(director.queue.shift());
    }
  } else if (director.killedInWave >= director.totalInWave) {
    beginBreather(director);
    return 'cleared';
  }
  return null;
}

/** Enemies still to kill this wave: queued plus alive (the caller adds alive). */
export function enemiesLeft(director, aliveCount) {
  return director.queue.length + aliveCount;
}
