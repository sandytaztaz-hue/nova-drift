// The HUD and the menu screens of NOVA DRIFT: health, shield, wave, score,
// combo, cores and enemies left during play, plus the title, upgrade-choice
// and game-over screens. Everything is drawn big and high-contrast so it
// reads at a glance, even shrunk to a contact sheet.
import { FIELD, PALETTE } from './config.js';

/** A dark translucent panel. */
export function drawPanel(ctx, x, y, width, height) {
  ctx.fillStyle = PALETTE.panel;
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 12);
  ctx.fill();
  ctx.stroke();
}

function bar(ctx, x, y, width, height, ratio, color, back) {
  ctx.fillStyle = back;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 4);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(0, width * ratio), height, 4);
  ctx.fill();
}

/** The in-play HUD: top bar with HP, wave, score, combo, cores, enemies left. */
export function drawHud(ctx, game) {
  const player = game.player;
  const director = game.director;
  ctx.fillStyle = 'rgba(4, 8, 26, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, 64);
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 64);
  ctx.lineTo(FIELD.width, 64);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('NOVA DRIFT', 20, 20);
  ctx.font = '14px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText(`WAVE ${director.wave}`, 20, 46);

  // HP and shield bars.
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('HP', 180, 20);
  bar(ctx, 210, 12, 180, 14, player.hp / player.maxHp, '#22d3ee', 'rgba(255,255,255,0.12)');
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, 398, 20);
  if (player.maxShield > 0) {
    ctx.fillStyle = PALETTE.text;
    ctx.fillText('SHIELD', 180, 46);
    bar(ctx, 210, 38, 180, 14, player.shield / player.maxShield, '#818cf8', 'rgba(255,255,255,0.12)');
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(`${Math.ceil(player.shield)}`, 398, 46);
  }

  // Score, combo, cores, enemies left — right side.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`${game.score}`, FIELD.width - 20, 24);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('SCORE', FIELD.width - 20, 48);
  const combo = game.comboMultiplier();
  if (combo > 1) {
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`COMBO x${combo}`, FIELD.width - 170, 24);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.core;
  ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`◆ ${game.cores}`, 560, 22);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '14px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`ENEMIES LEFT ${game.enemiesLeft()}`, 560, 46);

  // Wave breather countdown.
  if (director.phase === 'breather' && game.screen === 'play') {
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 30px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`WAVE ${director.wave + 1} IN ${Math.ceil(director.phaseTimer)}`, FIELD.width / 2, 120);
  }
}

/** The title screen: name, goal, controls, best score, start prompt. */
export function drawTitle(ctx, game, time) {
  ctx.fillStyle = 'rgba(4, 8, 26, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const bob = Math.sin(time * 1.4) * 8;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#a5f3fc';
  ctx.font = 'bold 84px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('NOVA DRIFT', FIELD.width / 2, 180 + bob);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#f472b6';
  ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('SURVIVE THE SWARM  •  DRIFT THE VOID  •  CHASE THE SCORE', FIELD.width / 2, 248 + bob);
  drawPanel(ctx, FIELD.width / 2 - 330, 300, 660, 150);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '18px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('WASD / Arrows — fly your ship      Mouse — aim', FIELD.width / 2, 332);
  ctx.fillText('Hold Click or Space — fire      1 / 2 / 3 — pick an upgrade', FIELD.width / 2, 364);
  ctx.fillText('Blast Drifters, Weavers, Chargers and Splitters.', FIELD.width / 2, 396);
  ctx.fillText('Grab nova cores. Survive every wave. Beat your best.', FIELD.width / 2, 424);
  if (game.best > 0) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`BEST SCORE  ${game.best}`, FIELD.width / 2, 486);
  }
  const pulse = 0.6 + 0.4 * Math.sin(time * 4);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('CLICK OR PRESS ENTER TO LAUNCH', FIELD.width / 2, 560);
  ctx.globalAlpha = 1;
}

/** The between-wave upgrade choice: three cards, click one or press 1/2/3. */
export function drawUpgradeScreen(ctx, game, time) {
  ctx.fillStyle = 'rgba(4, 8, 26, 0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 44px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`WAVE ${game.director.wave} CLEARED!`, FIELD.width / 2, 110);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('CHOOSE AN UPGRADE', FIELD.width / 2, 168);
  const cards = game.upgradeChoices;
  const cardWidth = 300;
  const cardHeight = 250;
  const gap = 36;
  const total = cards.length * cardWidth + (cards.length - 1) * gap;
  const startX = (FIELD.width - total) / 2;
  const top = 220;
  cards.forEach((upgrade, index) => {
    const x = startX + index * (cardWidth + gap);
    const hovered = game.hoverCard === index;
    const lift = hovered ? -10 : 0;
    ctx.fillStyle = hovered ? '#12365e' : PALETTE.card;
    ctx.strokeStyle = hovered ? '#a5f3fc' : upgrade.color;
    ctx.lineWidth = hovered ? 4 : 2;
    ctx.beginPath();
    ctx.roundRect(x, top + lift, cardWidth, cardHeight, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = upgrade.color;
    ctx.font = '64px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(upgrade.glyph, x + cardWidth / 2, top + lift + 70);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 24px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(upgrade.name, x + cardWidth / 2, top + lift + 140);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '19px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(upgrade.desc, x + cardWidth / 2, top + lift + 178);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`[ ${index + 1} ]`, x + cardWidth / 2, top + lift + 218);
  });
  const pulse = 0.6 + 0.4 * Math.sin(time * 4);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.text;
  ctx.font = '20px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Click a card or press 1, 2 or 3', FIELD.width / 2, 540);
  ctx.globalAlpha = 1;
}

/** The game-over screen: final score, best, wave reached, restart prompt. */
export function drawGameOver(ctx, game, time) {
  ctx.fillStyle = 'rgba(10, 4, 18, 0.62)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff4d6d';
  ctx.shadowBlur = 28;
  ctx.fillStyle = '#fda4af';
  ctx.font = 'bold 72px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('SHIP DESTROYED', FIELD.width / 2, 170);
  ctx.shadowBlur = 0;
  const isBest = game.score >= game.best && game.score > 0;
  if (isBest) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('★ NEW BEST SCORE ★', FIELD.width / 2, 232);
  }
  drawPanel(ctx, FIELD.width / 2 - 280, 270, 560, 190);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('FINAL SCORE', FIELD.width / 2, 306);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 52px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`${game.score}`, FIELD.width / 2, 352);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '20px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`Best  ${game.best}      Wave reached  ${game.director.wave}      Kills  ${game.kills}`, FIELD.width / 2, 414);
  const pulse = 0.6 + 0.4 * Math.sin(time * 4);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('PRESS R OR CLICK TO FLY AGAIN', FIELD.width / 2, 540);
  ctx.globalAlpha = 1;
}
