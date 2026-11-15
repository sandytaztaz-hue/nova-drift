// The upgrade cards of NOVA DRIFT: between waves the player picks one of
// three. Each card has a visible effect on the ship and a stacking cap, so
// choices stay meaningful across a long run.
import { PLAYER } from './config.js';

/** Every upgrade: id, display name, what it does, glyph, colour and cap. */
export const UPGRADE_POOL = [
  {
    id: 'rapid',
    name: 'Rapid Cycler',
    desc: '+22% fire rate',
    glyph: '»',
    color: '#22d3ee',
    max: 5,
    apply: (player) => {
      player.fireInterval = Math.max(0.055, player.fireInterval * 0.78);
    },
  },
  {
    id: 'spread',
    name: 'Split Cannon',
    desc: '+1 bullet per shot',
    glyph: '✦',
    color: '#67e8f9',
    max: 3,
    apply: (player) => {
      player.spreadShots += 1;
    },
  },
  {
    id: 'pierce',
    name: 'Lance Rounds',
    desc: 'Bullets pierce +1 enemy',
    glyph: '➤',
    color: '#a5f3fc',
    max: 3,
    apply: (player) => {
      player.pierce += 1;
    },
  },
  {
    id: 'damage',
    name: 'Nova Rounds',
    desc: '+35% bullet damage',
    glyph: '✚',
    color: '#fb7185',
    max: 5,
    apply: (player) => {
      player.bulletDamage *= 1.35;
    },
  },
  {
    id: 'shield',
    name: 'Aegis Shield',
    desc: '+30 shield, recharges',
    glyph: '◈',
    color: '#818cf8',
    max: 4,
    apply: (player) => {
      player.maxShield += 30;
      player.shield = player.maxShield;
    },
  },
  {
    id: 'magnet',
    name: 'Core Magnet',
    desc: '+70% core pickup range',
    glyph: '◎',
    color: '#ffd166',
    max: 3,
    apply: (player) => {
      player.magnetRadius *= 1.7;
    },
  },
  {
    id: 'thrusters',
    name: 'Ion Thrusters',
    desc: '+14% ship speed',
    glyph: '≫',
    color: '#34d399',
    max: 4,
    apply: (player) => {
      player.speed *= 1.14;
    },
  },
  {
    id: 'hull',
    name: 'Reinforced Hull',
    desc: '+25 max HP and heal 25',
    glyph: '⬢',
    color: '#4ade80',
    max: 5,
    apply: (player) => {
      player.maxHp += 25;
      player.hp = Math.min(player.maxHp, player.hp + 25);
    },
  },
];

/** How many times the player already holds `id`. */
export function upgradeCount(taken, id) {
  return taken.filter((t) => t === id).length;
}

/** Roll three distinct cards the player has not maxed out yet. */
export function rollUpgrades(random, taken) {
  const available = UPGRADE_POOL.filter((u) => upgradeCount(taken, u.id) < u.max);
  const pool = available.length >= 3 ? available : UPGRADE_POOL;
  const picked = [];
  const copy = [...pool];
  while (picked.length < 3 && copy.length > 0) {
    const index = Math.floor(random() * copy.length);
    picked.push(copy.splice(index, 1)[0]);
  }
  return picked;
}

/** Apply a card to the ship and record it in the run's taken list. */
export function applyUpgrade(player, upgrade, taken) {
  upgrade.apply(player);
  taken.push(upgrade.id);
}
