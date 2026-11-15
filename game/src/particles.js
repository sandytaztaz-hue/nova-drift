// Particles, floating score text and the drifting starfield for NOVA DRIFT.
// Everything here is drawn, never simulated by the DOM, and the pools are
// capped so a big explosion can never grow memory without bound.
import { FIELD } from './config.js';

const MAX_PARTICLES = 420;
const MAX_TEXTS = 24;

/** One spark: position, velocity, life, size and colour. */
function makeSpark(x, y, vx, vy, life, size, color) {
  return { x, y, vx, vy, life, maxLife: life, size, color };
}

export class ParticleField {
  constructor(random) {
    this.particles = [];
    this.texts = [];
    this.stars = [];
    for (let i = 0; i < 130; i++) {
      this.stars.push({
        x: random() * FIELD.width,
        y: random() * FIELD.height,
        size: 0.6 + random() * 1.8,
        speed: 6 + random() * 26,
        twinkle: random() * Math.PI * 2,
      });
    }
  }

  add(particle) {
    if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
    this.particles.push(particle);
  }

  /** A radial burst of sparks in the enemy's colour, plus a white flash core. */
  burst(x, y, color, count = 18, power = 260) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = power * (0.3 + Math.random() * 0.7);
      this.add(makeSpark(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.35 + Math.random() * 0.45, 1.5 + Math.random() * 2.5, color));
    }
    this.add(makeSpark(x, y, 0, 0, 0.18, 14, '#ffffff'));
  }

  /** A short cyan trail puff behind the ship's thruster. */
  thruster(x, y, angle) {
    const spread = 0.5;
    const a = angle + Math.PI + (Math.random() - 0.5) * spread;
    const speed = 120 + Math.random() * 90;
    this.add(makeSpark(x, y, Math.cos(a) * speed, Math.sin(a) * speed, 0.22 + Math.random() * 0.18, 1.5 + Math.random() * 1.5, '#38bdf8'));
  }

  /** A muzzle flash spark where a bullet is born. */
  muzzle(x, y, angle) {
    this.add(makeSpark(x + Math.cos(angle) * 18, y + Math.sin(angle) * 18, Math.cos(angle) * 120, Math.sin(angle) * 120, 0.12, 3, '#a5f3fc'));
  }

  /** A rising score label, e.g. "+150" or "x3 COMBO". */
  floatText(x, y, label, color = '#e8f6ff', size = 16) {
    if (this.texts.length >= MAX_TEXTS) this.texts.shift();
    this.texts.push({ x, y, label, color, size, life: 0.9, maxLife: 0.9 });
  }

  update(dt) {
    for (const star of this.stars) {
      star.y += star.speed * dt;
      star.twinkle += dt * 3;
      if (star.y > FIELD.height + 2) {
        star.y = -2;
        star.x = Math.random() * FIELD.width;
      }
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 2.2 * dt;
      p.vy *= 1 - 2.2 * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y -= 42 * dt;
      t.life -= dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  }

  drawStars(ctx) {
    for (const star of this.stars) {
      const alpha = 0.35 + 0.35 * Math.sin(star.twinkle);
      ctx.globalAlpha = Math.max(0.08, alpha);
      ctx.fillStyle = '#cfe9ff';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * (p.life / p.maxLife)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.font = `bold ${t.size}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = t.color;
      ctx.fillText(t.label, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
