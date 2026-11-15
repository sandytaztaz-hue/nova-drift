// The player's ship for NOVA DRIFT: movement, aiming, firing and damage.
// Upgrades mutate the numbers on this object; upgrades.js owns what each card does.
import { FIELD, PLAYER } from './config.js';

/** A fresh ship in the middle of the arena, at full health, no upgrades. */
export function createPlayer() {
  return {
    x: FIELD.width / 2,
    y: FIELD.height / 2 + 120,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    radius: PLAYER.radius,
    hp: PLAYER.maxHp,
    maxHp: PLAYER.maxHp,
    shield: 0,
    maxShield: 0,
    speed: PLAYER.speed,
    fireInterval: PLAYER.fireInterval,
    fireTimer: 0,
    bulletDamage: PLAYER.bulletDamage,
    bulletSpeed: PLAYER.bulletSpeed,
    spreadShots: 1,
    pierce: 0,
    magnetRadius: 90,
    invulnerable: 0,
    thrusting: false,
  };
}

/** One fixed step of ship movement and firing. Returns the bullets it fired. */
export function updatePlayer(player, input, dt, fireBullet) {
  const move = input.moveVector();
  const length = Math.hypot(move.x, move.y) || 1;
  const accel = 2600;
  player.vx += (move.x / length) * accel * dt * (move.x !== 0 || move.y !== 0 ? 1 : 0);
  player.vy += (move.y / length) * accel * dt * (move.x !== 0 || move.y !== 0 ? 1 : 0);
  // Drag, then clamp to top speed so the ship feels weighty but responsive.
  const drag = Math.exp(-4.2 * dt);
  player.vx *= drag;
  player.vy *= drag;
  const speed = Math.hypot(player.vx, player.vy);
  if (speed > player.speed) {
    player.vx = (player.vx / speed) * player.speed;
    player.vy = (player.vy / speed) * player.speed;
  }
  player.x = Math.min(FIELD.width - player.radius, Math.max(player.radius, player.x + player.vx * dt));
  player.y = Math.min(FIELD.height - player.radius, Math.max(player.radius, player.y + player.vy * dt));
  player.thrusting = move.x !== 0 || move.y !== 0;

  // The ship always faces the mouse: aim is where the bullets go.
  player.angle = Math.atan2(input.mouse.y - player.y, input.mouse.x - player.x);

  if (player.invulnerable > 0) player.invulnerable -= dt;
  if (player.maxShield > 0 && player.shield < player.maxShield) {
    player.shield = Math.min(player.maxShield, player.shield + PLAYER.shieldRegenPerSecond * dt);
  }

  player.fireTimer -= dt;
  if (input.firing() && player.fireTimer <= 0) {
    player.fireTimer = player.fireInterval;
    fireBullet(player);
  }
}

/**
 * Damage the ship: the shield absorbs first, then hull. Returns true when the
 * hit landed (not while invulnerable), so the caller can flash and shake.
 */
export function damagePlayer(player, amount) {
  if (player.invulnerable > 0 || player.hp <= 0) return false;
  let rest = amount;
  if (player.shield > 0) {
    const absorbed = Math.min(player.shield, rest);
    player.shield -= absorbed;
    rest -= absorbed;
  }
  player.hp = Math.max(0, player.hp - rest);
  player.invulnerable = PLAYER.invulnerableSeconds;
  return true;
}

/** Heal the hull, never past its maximum. */
export function healPlayer(player, amount) {
  player.hp = Math.min(player.maxHp, player.hp + amount);
}
