// NOVA DRIFT — every tuning number and colour in one place.
// The arena is a fixed 1280x720 logical space; the renderer scales it to the
// window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Seconds of breather between waves, while the upgrade cards are offered. */
export const BREATHER_SECONDS = 5;

export const PLAYER = {
  radius: 16,
  speed: 340,
  maxHp: 100,
  fireInterval: 0.16,
  bulletSpeed: 720,
  bulletDamage: 12,
  bulletRadius: 5,
  invulnerableSeconds: 0.9,
  shieldRegenPerSecond: 3,
};

/** Enemy kinds, keyed by the id enemies.js spawns. */
export const ENEMY = {
  drifter: { hp: 22, speed: 95, radius: 18, score: 100, touchDamage: 12, color: '#ff4d6d', firstWave: 1 },
  weaver: { hp: 16, speed: 150, radius: 15, score: 150, touchDamage: 10, color: '#c084fc', firstWave: 2 },
  charger: { hp: 30, speed: 70, radius: 17, score: 200, touchDamage: 18, color: '#fb923c', firstWave: 3 },
  splitter: { hp: 40, speed: 70, radius: 24, score: 250, touchDamage: 10, color: '#34d399', firstWave: 4 },
  mini: { hp: 8, speed: 190, radius: 9, score: 50, touchDamage: 6, color: '#6ee7b7', firstWave: 4 },
};

/** How a wave is built: base count plus per-wave growth, spawn pacing, enemy speed growth. */
export const WAVE = {
  baseCount: 8,
  perWave: 4,
  spawnInterval: 0.9,
  spawnIntervalMin: 0.28,
  speedPerWave: 0.06,
  hpPerWave: 0.12,
};

/** A nova core (dropped by a killed enemy) is worth this score when collected. */
export const CORE_SCORE = 25;
/** Kills inside this window keep the combo alive; the multiplier grows every 5 combo. */
export const COMBO_WINDOW = 3;
export const COMBO_STEP = 5;
export const COMBO_MAX = 5;

export const PALETTE = {
  space: '#04081a',
  nebulaA: '#0b1030',
  nebulaB: '#1a0b2e',
  grid: 'rgba(56, 189, 248, 0.07)',
  ship: '#22d3ee',
  shipCore: '#ecfeff',
  bullet: '#67e8f9',
  core: '#ffd166',
  text: '#e8f6ff',
  muted: '#8fb3c9',
  danger: '#ff4d6d',
  panel: 'rgba(6, 16, 38, 0.88)',
  panelEdge: '#155e75',
  card: '#0a1a33',
  cardEdge: '#22d3ee',
  gold: '#ffd166',
};

export const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'nova-drift.best';

/** The four deterministic screenshot scenes, by the ?shot= name in the URL. */
export const SHOT_NAMES = ['start', 'play', 'upgrade', 'end'];
