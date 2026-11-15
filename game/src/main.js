// NOVA DRIFT — the game itself: state machine, fixed-step loop, collisions,
// scoring, waves and screens. Screens: title, play, upgrade, over.
import { BEST_KEY, COMBO_MAX, COMBO_STEP, COMBO_WINDOW, CORE_SCORE, FIELD, PALETTE, STEP } from './config.js';
import { createRandom } from './random.js';
import { NovaInput } from './input.js';
import { NovaAudio } from './audio.js';
import { ParticleField } from './particles.js';
import { createPlayer, damagePlayer, updatePlayer } from './player.js';
import { createEnemy, createMini, updateEnemy } from './enemies.js';
import { beginBreather, createWaveDirector, enemiesLeft, updateWaveDirector } from './waves.js';
import { applyUpgrade, rollUpgrades } from './upgrades.js';
import { drawBackdrop, drawBullets, drawCores, drawEnemy, drawPlayer } from './render.js';
import { drawGameOver, drawHud, drawTitle, drawUpgradeScreen } from './hud.js';
import { stageShot } from './shots.js';

export class NovaGame {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new NovaInput(canvas);
    this.audio = new NovaAudio();
    this.shotMode = options.shot || null;
    this.seed = options.seed || 1;
    this.random = createRandom(this.seed);
    this.particles = new ParticleField(this.random);
    this.frozen = false;
    this.shotReady = false;
    this.reset(this.seed);
    this._attachClicks();
  }

  /** A fresh run: new ship, empty arena, wave director waiting. */
  reset(seed) {
    this.random = createRandom(seed);
    this.screen = 'title';
    this.time = 0;
    this.score = 0;
    this.cores = 0;
    this.kills = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.player = createPlayer();
    this.bullets = [];
    this.enemies = [];
    this.corePickups = [];
    this.director = createWaveDirector();
    this.upgradeChoices = [];
    this.takenUpgrades = [];
    this.hoverCard = -1;
    this.shake = 0;
    this.best = this._readBest();
    this.particles = new ParticleField(this.random);
  }

  _readBest() {
    try {
      return Number(window.localStorage.getItem(BEST_KEY) ?? 0) || 0;
    } catch {
      return 0;
    }
  }

  _saveBest() {
    try {
      window.localStorage.setItem(BEST_KEY, String(this.best));
    } catch {
      // Best score is a nicety; a blocked store must never break the game.
    }
  }

  _attachClicks() {
    this.canvas.addEventListener('click', () => {
      this.audio.unlock();
      if (this.screen === 'title') this.startGame();
      else if (this.screen === 'over') this.restart();
      else if (this.screen === 'upgrade') this._clickCard();
    });
  }

  /** The combo multiplier: +1 every 5 chained kills, capped at x5. */
  comboMultiplier() {
    return Math.min(COMBO_MAX, 1 + Math.floor(this.combo / COMBO_STEP));
  }

  enemiesLeft() {
    return enemiesLeft(this.director, this.enemies.length);
  }

  /** Leave the title screen and start wave 1's breather. */
  startGame() {
    this.reset(this.seed);
    this.screen = 'play';
    this.audio.waveHorn();
  }

  /** Back to a fresh run from the game-over screen. */
  restart() {
    this.startGame();
  }

  /** Fire one volley from the ship, spread across `spreadShots` barrels. */
  fireBullet(player) {
    const count = player.spreadShots;
    const gap = 0.11;
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * gap;
      const angle = player.angle + offset;
      this.bullets.push({
        x: player.x + Math.cos(angle) * 22,
        y: player.y + Math.sin(angle) * 22,
        vx: Math.cos(angle) * player.bulletSpeed,
        vy: Math.sin(angle) * player.bulletSpeed,
        angle,
        damage: player.bulletDamage,
        pierce: player.pierce,
        hitIds: new Set(),
      });
    }
    this.particles.muzzle(player.x, player.y, player.angle);
    this.audio.laser();
  }

  /** Apply upgrade card `index` and return to play. */
  chooseUpgrade(index) {
    const upgrade = this.upgradeChoices[index];
    if (!upgrade) return;
    applyUpgrade(this.player, upgrade, this.takenUpgrades);
    this.audio.upgrade();
    this.upgradeChoices = [];
    this.screen = 'play';
    beginBreather(this.director);
  }

  _clickCard() {
    const card = this._cardAt(this.input.mouse.x, this.input.mouse.y);
    if (card >= 0) this.chooseUpgrade(card);
  }

  /** Which upgrade card (if any) the point lies on. */
  _cardAt(x, y) {
    const cards = this.upgradeChoices;
    if (cards.length === 0) return -1;
    const cardWidth = 300;
    const cardHeight = 250;
    const gap = 36;
    const total = cards.length * cardWidth + (cards.length - 1) * gap;
    const startX = (FIELD.width - total) / 2;
    const top = 220;
    for (let i = 0; i < cards.length; i++) {
      const cx = startX + i * (cardWidth + gap);
      if (x >= cx && x <= cx + cardWidth && y >= top - 10 && y <= top + cardHeight) return i;
    }
    return -1;
  }

  /** One fixed step, dispatched by screen. */
  step(dt) {
    this.time += dt;
    if (this.screen === 'title' || this.screen === 'over') {
      this.particles.update(dt);
      this._readKeys();
      this.input.endStep();
      return;
    }
    if (this.screen === 'upgrade') {
      this.hoverCard = this._cardAt(this.input.mouse.x, this.input.mouse.y);
      this.particles.update(dt);
      this._readKeys();
      this.input.endStep();
      return;
    }
    this._updatePlay(dt);
    this.input.endStep();
  }

  /** Edge-triggered keys: Enter starts, R restarts, 1/2/3 pick a card. */
  _readKeys() {
    if (this.screen === 'title' && (this.input.wasPressed('Enter') || this.input.wasPressed('NumpadEnter'))) {
      this.audio.unlock();
      this.startGame();
    }
    if (this.screen === 'over' && this.input.wasPressed('KeyR')) this.restart();
    if (this.screen === 'upgrade') {
      if (this.input.wasPressed('Digit1')) this.chooseUpgrade(0);
      if (this.input.wasPressed('Digit2')) this.chooseUpgrade(1);
      if (this.input.wasPressed('Digit3')) this.chooseUpgrade(2);
    }
  }

  _updatePlay(dt) {
    const player = this.player;
    updatePlayer(player, this.input, dt, (p) => this.fireBullet(p));
    if (player.thrusting && Math.random() < 0.6) {
      this.particles.thruster(player.x - Math.cos(player.angle) * 14, player.y - Math.sin(player.angle) * 14, player.angle);
    }

    const waveEvent = updateWaveDirector(this.director, this.random, (kind) => {
      this.enemies.push(createEnemy(kind, this.director.wave, this.random));
    });
    if (waveEvent === 'started') this.audio.waveHorn();
    if (waveEvent === 'cleared') {
      this.upgradeChoices = rollUpgrades(this.random, this.takenUpgrades);
      this.screen = 'upgrade';
    }

    for (const enemy of this.enemies) updateEnemy(enemy, player, dt);
    this._updateBullets(dt);
    this._updateCores(dt);
    this._collidePlayer(dt);
    this.particles.update(dt);

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 26);
    if (player.hp <= 0) this._gameOver();
  }

  _updateBullets(dt) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      let dead = bullet.x < -20 || bullet.x > FIELD.width + 20 || bullet.y < -20 || bullet.y > FIELD.height + 20;
      if (!dead) {
        for (const enemy of this.enemies) {
          if (bullet.hitIds.has(enemy.id)) continue;
          const dx = enemy.x - bullet.x;
          const dy = enemy.y - bullet.y;
          if (dx * dx + dy * dy < (enemy.radius + 6) * (enemy.radius + 6)) {
            bullet.hitIds.add(enemy.id);
            enemy.hp -= bullet.damage;
            enemy.flash = 0.09;
            this.particles.floatText(enemy.x, enemy.y - enemy.radius - 6, `${Math.round(bullet.damage)}`, '#a5f3fc', 13);
            this.particles.burst(bullet.x, bullet.y, '#67e8f9', 4, 120);
            if (enemy.hp <= 0) this._killEnemy(enemy);
            if (bullet.hitIds.size > bullet.pierce) {
              dead = true;
              break;
            }
          }
        }
      }
      if (dead) this.bullets.splice(i, 1);
    }
    // Remove the dead, splitters included, after the bullet pass.
    this.enemies = this.enemies.filter((e) => e.hp > 0);
  }

  /** Kill an enemy: score, combo, particles, cores, and splitter children. */
  _killEnemy(enemy) {
    this.kills += 1;
    this.director.killedInWave += 1;
    this.combo += 1;
    this.comboTimer = COMBO_WINDOW;
    const gained = enemy.score * this.comboMultiplier();
    this.score += gained;
    this.particles.burst(enemy.x, enemy.y, enemy.color, enemy.kind === 'splitter' ? 30 : 18, 300);
    this.particles.floatText(enemy.x, enemy.y, `+${gained}`, '#ffd166', 18);
    this.audio.explosion(enemy.kind === 'splitter' || enemy.kind === 'charger');
    this.shake = Math.min(10, this.shake + (enemy.kind === 'splitter' ? 6 : 3));
    // Cores: splitters always drop two, others drop one 70% of the time.
    const drops = enemy.kind === 'splitter' ? 2 : this.random() < 0.7 ? 1 : 0;
    for (let i = 0; i < drops; i++) {
      this.corePickups.push({
        x: enemy.x + (this.random() - 0.5) * 30,
        y: enemy.y + (this.random() - 0.5) * 30,
        vx: (this.random() - 0.5) * 90,
        vy: (this.random() - 0.5) * 90,
        phase: this.random() * Math.PI * 2,
      });
    }
    if (enemy.kind === 'splitter') {
      this.enemies.push(createMini(enemy.x - 14, enemy.y, this.director.wave));
      this.enemies.push(createMini(enemy.x + 14, enemy.y, this.director.wave));
    }
  }

  _updateCores(dt) {
    const player = this.player;
    for (let i = this.corePickups.length - 1; i >= 0; i--) {
      const core = this.corePickups[i];
      const dx = player.x - core.x;
      const dy = player.y - core.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < player.magnetRadius) {
        const pull = 900 * (1 - dist / (player.magnetRadius + 40));
        core.vx += (dx / dist) * pull * dt;
        core.vy += (dy / dist) * pull * dt;
      } else {
        core.vx *= 1 - 1.5 * dt;
        core.vy *= 1 - 1.5 * dt;
      }
      core.x += core.vx * dt;
      core.y += core.vy * dt;
      if (dist < 30) {
        this.corePickups.splice(i, 1);
        this.cores += 1;
        this.score += CORE_SCORE;
        this.particles.floatText(player.x, player.y - 30, `+${CORE_SCORE} CORE`, '#ffd166', 15);
        this.audio.pickup();
      }
    }
  }

  _collidePlayer(dt) {
    const player = this.player;
    for (const enemy of this.enemies) {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < player.radius + enemy.radius - 2) {
        // Shove the enemy back so it does not sit on the ship.
        const push = 26;
        enemy.x -= (dx / dist) * push;
        enemy.y -= (dy / dist) * push;
        if (damagePlayer(player, enemy.touchDamage)) {
          this.particles.burst(player.x, player.y, '#ff4d6d', 16, 260);
          this.audio.hurt();
          this.shake = Math.min(12, this.shake + 7);
          this.combo = 0;
        }
      }
    }
  }

  _gameOver() {
    this.screen = 'over';
    if (this.score > this.best) {
      this.best = this.score;
      this._saveBest();
    }
    this.particles.burst(this.player.x, this.player.y, '#22d3ee', 60, 420);
    this.particles.burst(this.player.x, this.player.y, '#ff4d6d', 40, 320);
    this.audio.explosion(true);
    this.audio.gameOver();
    this.shake = 14;
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    if (this.shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }
    drawBackdrop(ctx, this.time);
    this.particles.drawStars(ctx);
    if (this.screen !== 'title') {
      drawCores(ctx, this.corePickups, this.time);
      for (const enemy of this.enemies) drawEnemy(ctx, enemy, this.time);
      drawBullets(ctx, this.bullets);
      if (this.screen !== 'over') drawPlayer(ctx, this.player, this.time);
    }
    this.particles.draw(ctx);
    ctx.restore();
    if (this.screen === 'play' || this.screen === 'upgrade') drawHud(ctx, this);
    if (this.screen === 'title') drawTitle(ctx, this, this.time);
    if (this.screen === 'upgrade') drawUpgradeScreen(ctx, this, this.time);
    if (this.screen === 'over') drawGameOver(ctx, this, this.time);
  }

  /** The requestAnimationFrame loop: fixed steps, then one render. */
  run() {
    let last = performance.now();
    let accumulator = 0;
    const frame = (now) => {
      const elapsed = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!this.frozen) {
        accumulator += elapsed;
        let guard = 0;
        while (accumulator >= STEP && guard < 5) {
          this.step(STEP);
          accumulator -= STEP;
          guard++;
        }
        if (guard >= 5) accumulator = 0;
      }
      this.render();
      if (!this.shotReady) {
        this.shotReady = true;
        window.__shotReady = true;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}

/** Boot the game from the page's canvas and ?shot= query. */
export function bootGame(canvas) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') ?? 1) || 1;
  const game = new NovaGame(canvas, { shot, seed });
  window.__nova = game;
  if (shot) {
    // A deterministic scene: simulate the real rules forward, then freeze.
    stageShot(shot, game);
    game.frozen = true;
    game.render();
    game.shotReady = true;
    window.__shotReady = true;
  } else {
    game.run();
  }
  return game;
}
