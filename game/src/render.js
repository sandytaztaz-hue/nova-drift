// The arena renderer for NOVA DRIFT: the starfield, the ship, the enemies,
// bullets, cores and particles. Screens (title, upgrade choice, game over)
// live in hud.js; this file draws the world itself.
import { FIELD, PALETTE } from './config.js';

/** Draw the deep-space backdrop: gradient, nebula blobs and a faint grid. */
export function drawBackdrop(ctx, time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  gradient.addColorStop(0, PALETTE.space);
  gradient.addColorStop(0.55, PALETTE.nebulaA);
  gradient.addColorStop(1, PALETTE.nebulaB);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Two slow-breathing nebula glows.
  ctx.globalAlpha = 0.16 + 0.04 * Math.sin(time * 0.4);
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.arc(240, 170, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath();
  ctx.arc(1060, 560, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Faint arena grid.
  ctx.strokeStyle = PALETTE.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 80; x < FIELD.width; x += 80) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FIELD.height);
  }
  for (let y = 80; y < FIELD.height; y += 80) {
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD.width, y);
  }
  ctx.stroke();
  // Arena edge glow.
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, FIELD.width - 12, FIELD.height - 12);
}

/** Draw the player's ship: a neon dart with a glowing core and thruster flame. */
export function drawPlayer(ctx, player, time) {
  const blink = player.invulnerable > 0 && Math.floor(time * 14) % 2 === 0;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  if (!blink) {
    ctx.shadowColor = PALETTE.ship;
    ctx.shadowBlur = 18;
    ctx.fillStyle = PALETTE.ship;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-14, -13);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-14, 13);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.shipCore;
    ctx.beginPath();
    ctx.arc(2, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Thruster flame when moving.
  if (player.thrusting) {
    const flicker = 12 + Math.random() * 10;
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.moveTo(-12, -5);
    ctx.lineTo(-12 - flicker, 0);
    ctx.lineTo(-12, 5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // Shield ring.
  if (player.maxShield > 0 && player.shield > 0) {
    ctx.globalAlpha = 0.25 + 0.45 * (player.shield / player.maxShield);
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

/** Draw one enemy in its kind's shape; chargers show their dash line while telegraphing. */
export function drawEnemy(ctx, enemy, time) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  const flash = enemy.flash > 0;
  const body = flash ? '#ffffff' : enemy.color;
  ctx.shadowColor = enemy.color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = body;
  ctx.strokeStyle = body;
  if (enemy.kind === 'drifter') {
    ctx.rotate(enemy.angle + time * 1.5);
    ctx.beginPath();
    ctx.moveTo(enemy.radius, 0);
    ctx.lineTo(0, enemy.radius * 0.7);
    ctx.lineTo(-enemy.radius, 0);
    ctx.lineTo(0, -enemy.radius * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#04081a';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 0.32, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === 'weaver') {
    ctx.rotate(enemy.angle);
    ctx.beginPath();
    ctx.moveTo(enemy.radius + 4, 0);
    ctx.lineTo(-enemy.radius * 0.7, enemy.radius * 0.8);
    ctx.lineTo(-enemy.radius * 0.3, 0);
    ctx.lineTo(-enemy.radius * 0.7, -enemy.radius * 0.8);
    ctx.closePath();
    ctx.fill();
  } else if (enemy.kind === 'charger') {
    if (enemy.state === 'telegraph') {
      ctx.restore();
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.angle);
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.7)';
      ctx.setLineDash([10, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(420, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
    }
    ctx.rotate(enemy.angle);
    ctx.beginPath();
    ctx.moveTo(enemy.radius + 6, 0);
    ctx.lineTo(-enemy.radius, enemy.radius * 0.75);
    ctx.lineTo(-enemy.radius * 0.5, 0);
    ctx.lineTo(-enemy.radius, -enemy.radius * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff7ed';
    ctx.beginPath();
    ctx.arc(enemy.radius * 0.3, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Splitter and mini: hexagons, the splitter with an inner core.
    ctx.rotate(time * 0.8);
    polygon(ctx, 0, 0, 6, enemy.radius);
    ctx.fill();
    if (enemy.kind === 'splitter') {
      ctx.fillStyle = '#064e3b';
      polygon(ctx, 0, 0, 6, enemy.radius * 0.5);
      ctx.fill();
    }
  }
  ctx.restore();
  // Health bar over hurt enemies.
  if (enemy.hp < enemy.maxHp) {
    const width = enemy.radius * 2;
    const ratio = Math.max(0, enemy.hp / enemy.maxHp);
    ctx.fillStyle = 'rgba(4, 8, 26, 0.8)';
    ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 12, width, 5);
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 12, width * ratio, 5);
  }
}

function polygon(ctx, x, y, sides, radius) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Draw the player's bullets as glowing cyan darts. */
export function drawBullets(ctx, bullets) {
  ctx.save();
  ctx.shadowColor = PALETTE.bullet;
  ctx.shadowBlur = 10;
  ctx.fillStyle = PALETTE.bullet;
  for (const bullet of bullets) {
    ctx.save();
    ctx.translate(bullet.x, bullet.y);
    ctx.rotate(bullet.angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/** Draw nova cores as spinning gold diamonds. */
export function drawCores(ctx, cores, time) {
  ctx.save();
  ctx.shadowColor = PALETTE.core;
  ctx.shadowBlur = 12;
  ctx.fillStyle = PALETTE.core;
  for (const core of cores) {
    const pulse = 1 + 0.18 * Math.sin(time * 6 + core.phase);
    const size = 8 * pulse;
    ctx.save();
    ctx.translate(core.x, core.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  }
  ctx.restore();
}
