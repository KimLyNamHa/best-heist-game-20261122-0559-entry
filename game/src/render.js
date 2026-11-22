// Magpie — The Aldermere Heist: everything the player sees. The museum is
// drawn as vector shapes on one canvas: a marble floor, dark wood walls,
// glass display cases, potted palms, red carpet, wall cameras with red
// cones, laser beams, the prize, the service door and the jewels. The HUD
// and the title, level, victory and caught screens are drawn here too.

import { FIELD, FONT, PLAYER, GUARD, DOG, CAMERA, LASER } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_LEVEL = 'level';
export const SCREEN_WIN = 'win';
export const SCREEN_CAUGHT = 'caught';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2.25;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle - halfAngle) * range, y + Math.sin(angle - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle + halfAngle) * range, y + Math.sin(angle + halfAngle) * range);
  ctx.stroke();
}

function drawGuard(ctx, g, palette) {
  // Vision cone first, so the guard stands on top of it.
  drawCone(ctx, g.x, g.y, g.angle, GUARD.coneRange, GUARD.coneHalfAngle, palette.cone, palette.coneEdge);
  // A night watchman: navy uniform, brass badge, a torch beam where he looks.
  // A pale ring lifts him off the floor so he never blends into the tiles.
  ctx.strokeStyle = 'rgba(238, 241, 245, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(g.x, g.y, g.radius + 2.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#2c3e5e';
  ctx.beginPath();
  ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8b64c';
  ctx.beginPath();
  ctx.arc(g.x, g.y, g.radius * 0.6, 0, Math.PI * 2);
  ctx.fill();
  // Brass cap: a half-disc on top, with a gold brim line.
  ctx.fillStyle = '#1f2c44';
  ctx.beginPath();
  ctx.arc(g.x, g.y - 2, g.radius * 0.62, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e8b64c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(g.x - g.radius * 0.62, g.y - 2);
  ctx.lineTo(g.x + g.radius * 0.62, g.y - 2);
  ctx.stroke();
  ctx.strokeStyle = '#ffe9a8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x + Math.cos(g.angle) * g.radius, g.y + Math.sin(g.angle) * g.radius);
  ctx.lineTo(g.x + Math.cos(g.angle) * (g.radius + 14), g.y + Math.sin(g.angle) * (g.radius + 14));
  ctx.stroke();
  // "?" while staring, "!" while hunting, outlined so it reads on any floor.
  if (g.state === 'stare' || g.state === 'hunt') {
    ctx.font = `bold 22px ${FONT}`;
    ctx.textAlign = 'center';
    const mark = g.state === 'hunt' ? '!' : '?';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillText(mark, g.x + 1, g.y - g.radius - 7);
    ctx.fillStyle = g.state === 'hunt' ? '#ff5a4e' : '#ffd76a';
    ctx.fillText(mark, g.x, g.y - g.radius - 8);
  }
}

function drawDog(ctx, dog) {
  ctx.fillStyle = '#8a6a42';
  ctx.beginPath();
  ctx.ellipse(dog.x, dog.y, dog.radius + 3, dog.radius - 2, dog.angle, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(dog.x + Math.cos(dog.angle) * 8, dog.y + Math.sin(dog.angle) * 8, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a4026';
  ctx.beginPath();
  ctx.arc(dog.x - Math.sin(dog.angle) * 5, dog.y + Math.cos(dog.angle) * 5, 3, 0, Math.PI * 2);
  ctx.arc(dog.x + Math.sin(dog.angle) * 5, dog.y - Math.cos(dog.angle) * 5, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx, p, smokeTime) {
  // Magpie in a black tailcoat and top hat, a white shirt front, gold pocket
  // watch glinting at the back. Inside smoke, only a grey puff shows.
  if (smokeTime > 0) {
    ctx.fillStyle = 'rgba(200, 200, 210, 0.55)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 8, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  // A soft gold glow lifts Magpie off the floor: he is the one you watch.
  ctx.save();
  ctx.shadowColor = 'rgba(255, 215, 106, 0.8)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#14141c';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.stroke();
  // Top hat, tall enough to read at a glance: crown, gold band, wide brim.
  ctx.fillStyle = '#0a0a10';
  ctx.fillRect(p.x - 8, p.y - p.radius - 12, 16, 12);
  ctx.fillRect(p.x - 12, p.y - p.radius - 1, 24, 4);
  ctx.fillStyle = '#d9a441';
  ctx.fillRect(p.x - 8, p.y - p.radius - 4, 16, 3);
  // Pale face turned where he moves, with two dark eyes.
  ctx.fillStyle = '#e8e4da';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.facing) * 4, p.y + Math.sin(p.facing) * 4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#14141c';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.facing) * 4 + Math.cos(p.facing + Math.PI / 2) * 2, p.y + Math.sin(p.facing) * 4 + Math.sin(p.facing + Math.PI / 2) * 2, 1.2, 0, Math.PI * 2);
  ctx.arc(p.x + Math.cos(p.facing) * 4 - Math.cos(p.facing + Math.PI / 2) * 2, p.y + Math.sin(p.facing) * 4 - Math.sin(p.facing + Math.PI / 2) * 2, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(p.x - Math.cos(p.facing) * 8, p.y - Math.sin(p.facing) * 8, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

/** The whole frame: world, HUD and the current screen overlay. */
export function render(ctx, view) {
  const { state, screen } = view;
  const pal = state.def.palette;
  const W = FIELD.width;
  const H = FIELD.height;

  // Marble floor: two-tone tiles so motion reads at a glance, with grout
  // lines between them so the floor never melts into one flat slab.
  ctx.fillStyle = pal.floor;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = pal.floorAlt;
  const tile = 80;
  for (let ty = 0; ty < H / tile; ty += 1) {
    for (let tx = 0; tx < W / tile; tx += 1) {
      if ((tx + ty) % 2 === 0) ctx.fillRect(tx * tile, ty * tile, tile, tile);
    }
  }
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += tile) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
  for (let y = 0; y <= H; y += tile) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
  ctx.stroke();

  // Red carpet: dark ground where you are half as easy to spot.
  for (const s of state.def.carpets) {
    ctx.fillStyle = pal.carpet;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(255, 215, 106, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x + 3, s.y + 3, s.w - 6, s.h - 6);
    ctx.strokeStyle = 'rgba(255, 215, 106, 0.16)';
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x + 9, s.y + 9, s.w - 18, s.h - 18);
  }

  // Lamp glow.
  for (const l of state.def.lamps) {
    const glow = ctx.createRadialGradient(l.x, l.y, 4, l.x, l.y, 90);
    glow.addColorStop(0, 'rgba(255, 179, 71, 0.30)');
    glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pal.lamp;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // The service door, glowing green once the prize is yours, padlocked before.
  const e = state.def.exit;
  const pulse = 0.75 + 0.25 * Math.sin(state.time * 3);
  ctx.fillStyle = state.prizeGot ? '#3fae5a' : '#8a6a3a';
  ctx.globalAlpha = 0.25 * pulse;
  ctx.fillRect(e.x - 8, e.y - 8, e.w + 16, e.h + 16);
  ctx.globalAlpha = 1;
  ctx.fillStyle = state.prizeGot ? '#3fae5a' : '#6b543a';
  roundRect(ctx, e.x, e.y, e.w, e.h, 6);
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = state.prizeGot ? '#bff5c9' : '#d9a441';
  ctx.stroke();
  ctx.fillStyle = '#f2f5f0';
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(state.prizeGot ? 'EXIT →' : 'LOCKED', e.x + e.w / 2, e.y + e.h / 2 + 5);
  if (!state.prizeGot) {
    // A brass padlock hanging on the wall beside the locked door.
    const lx = e.x - 17;
    const ly = e.y + e.h / 2;
    ctx.strokeStyle = '#d9a441';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(lx, ly - 4, 5, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#d9a441';
    roundRect(ctx, lx - 7, ly - 4, 14, 11, 2);
    ctx.fill();
    ctx.fillStyle = '#6b543a';
    ctx.beginPath();
    ctx.arc(lx, ly + 1, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (state.exitProgress > 0) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y + e.h / 2, 34, -Math.PI / 2, -Math.PI / 2 + (state.exitProgress / PLAYER.exitChannel) * Math.PI * 2);
    ctx.stroke();
  }

  // The prize: a big gold jewel with a pulsing halo and sparkles, labelled
  // with its name on a dark pill so the label never collides with the HUD.
  if (!state.prize.taken) {
    const bob = Math.sin(state.time * 2 + state.prize.x) * 2;
    const halo = ctx.createRadialGradient(state.prize.x, state.prize.y + bob, 4, state.prize.x, state.prize.y + bob, 48);
    halo.addColorStop(0, 'rgba(255, 215, 106, 0.45)');
    halo.addColorStop(1, 'rgba(255, 215, 106, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(state.prize.x, state.prize.y + bob, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.moveTo(state.prize.x, state.prize.y + bob - 16);
    ctx.lineTo(state.prize.x + 12, state.prize.y + bob);
    ctx.lineTo(state.prize.x, state.prize.y + bob + 16);
    ctx.lineTo(state.prize.x - 12, state.prize.y + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(state.prize.x - 6, state.prize.y + bob - 6);
    ctx.lineTo(state.prize.x + 2, state.prize.y + bob + 2);
    ctx.stroke();
    // Twinkling sparkles around the jewel.
    for (let i = 0; i < 2; i += 1) {
      const tw = (Math.sin(state.time * 3 + i * 2.4 + state.prize.x) + 1) / 2;
      if (tw < 0.55) continue;
      const sx = state.prize.x + (i === 0 ? -24 : 22);
      const sy = state.prize.y + bob + (i === 0 ? -18 : 14);
      const r = 3 + tw * 4;
      ctx.strokeStyle = `rgba(255, 240, 180, ${0.4 + tw * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx - r, sy);
      ctx.lineTo(sx + r, sy);
      ctx.moveTo(sx, sy - r);
      ctx.lineTo(sx, sy + r);
      ctx.stroke();
    }
    ctx.font = `bold 12px ${FONT}`;
    const label = state.def.prize;
    const lw = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    roundRect(ctx, state.prize.x - lw / 2 - 8, state.prize.y + bob - 46, lw + 16, 20, 10);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.textAlign = 'center';
    ctx.fillText(label, state.prize.x, state.prize.y + bob - 32);
  }

  // Small jewels: little glowing diamonds, with a glint when the light catches them.
  for (const l of state.loot) {
    if (l.taken) continue;
    const bob = Math.sin(state.time * 2 + l.x) * 2;
    ctx.fillStyle = 'rgba(180, 230, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(l.x, l.y + bob, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bfe6ff';
    ctx.beginPath();
    ctx.moveTo(l.x, l.y + bob - 10);
    ctx.lineTo(l.x + 7, l.y + bob);
    ctx.lineTo(l.x, l.y + bob + 10);
    ctx.lineTo(l.x - 7, l.y + bob);
    ctx.closePath();
    ctx.fill();
    if (Math.sin(state.time * 3 + l.x) > 0.6) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(l.x - 12, l.y + bob - 12);
      ctx.lineTo(l.x - 6, l.y + bob - 12);
      ctx.moveTo(l.x - 12, l.y + bob - 12);
      ctx.lineTo(l.x - 12, l.y + bob - 6);
      ctx.stroke();
    }
  }

  // Laser beams: a live beam glows red; a dark one is a faint dotted line.
  for (const l of state.lasers) {
    const live = ((state.time + l.phase) % (LASER.onTime + LASER.offTime)) < LASER.onTime;
    ctx.strokeStyle = live ? pal.laser : 'rgba(255, 74, 61, 0.25)';
    ctx.lineWidth = live ? 3 : 1.5;
    if (!live) ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Emitters at both ends.
    ctx.fillStyle = '#8b93a3';
    ctx.beginPath();
    ctx.arc(l.x1, l.y1, 6, 0, Math.PI * 2);
    ctx.arc(l.x2, l.y2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = live ? '#ff4a3d' : '#5a2020';
    ctx.beginPath();
    ctx.arc(l.x1, l.y1, 3, 0, Math.PI * 2);
    ctx.arc(l.x2, l.y2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Camera cones (red) and wall boxes.
  for (const c of state.cameras) {
    drawCone(ctx, c.x, c.y, c.angle, CAMERA.coneRange, CAMERA.coneHalfAngle, pal.cameraCone, pal.cameraConeEdge);
  }

  // Display cases: solid cover that blocks sight and movement, glass on top
  // with a shine streak and a glint of gold inside, brass trim on top.
  for (const c of state.def.cases) {
    ctx.fillStyle = pal.case;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = pal.caseGlass;
    ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    // Diagonal shine across the glass.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.beginPath();
    ctx.moveTo(c.x + 10, c.y + 4);
    ctx.lineTo(c.x + 22, c.y + 4);
    ctx.lineTo(c.x + 10, c.y + c.h - 4);
    ctx.lineTo(c.x + 4, c.y + c.h - 4);
    ctx.closePath();
    ctx.fill();
    // A tiny gold piece on display inside the case.
    ctx.fillStyle = '#e8b64c';
    ctx.beginPath();
    ctx.moveTo(c.x + c.w / 2, c.y + c.h / 2 - 6);
    ctx.lineTo(c.x + c.w / 2 + 5, c.y + c.h / 2);
    ctx.lineTo(c.x + c.w / 2, c.y + c.h / 2 + 6);
    ctx.lineTo(c.x + c.w / 2 - 5, c.y + c.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = pal.caseTop;
    ctx.fillRect(c.x, c.y, c.w, 9);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
  }

  // Walls, with a brass top edge and a shadow line along the far side.
  for (const w of [...state.solids]) {
    if (w.w === FIELD.width || w.h === FIELD.height) continue;
    ctx.fillStyle = pal.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = pal.wallTop;
    if (w.w >= w.h) ctx.fillRect(w.x, w.y, w.w, 6);
    else ctx.fillRect(w.x, w.y, 6, w.h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
    if (w.w >= w.h) ctx.fillRect(w.x, w.y + w.h - 3, w.w, 3);
    else ctx.fillRect(w.x + w.w - 3, w.y, 3, w.h);
  }
  // Border walls.
  ctx.fillStyle = pal.wall;
  ctx.fillRect(0, 0, W, 24);
  ctx.fillRect(0, H - 24, W, 24);
  ctx.fillRect(0, 0, 24, H);
  ctx.fillRect(W - 24, 0, 24, H);

  // The hound, and its hearing circle while you run nearby.
  if (state.dog) {
    const d = Math.hypot(state.dog.x - state.player.x, state.dog.y - state.player.y);
    if (state.player.moving && !state.player.sneaking && d < 320) {
      ctx.strokeStyle = 'rgba(255, 120, 90, 0.5)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(state.dog.x, state.dog.y, DOG.hearRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    drawDog(ctx, state.dog);
  }

  for (const g of state.guards) drawGuard(ctx, g, pal);
  for (const c of state.cameras) {
    // Wall-mounted camera: a bracket arm back toward the wall, a metal body
    // turned where it looks, and a red lens that never blinks out.
    const bx = c.x - Math.cos(c.angle) * 12;
    const by = c.y - Math.sin(c.angle) * 12;
    ctx.strokeStyle = '#565d6b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.fillStyle = '#565d6b';
    ctx.beginPath();
    ctx.arc(bx, by, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.fillStyle = '#2c313c';
    roundRect(ctx, -6, -8, 20, 16, 4);
    ctx.fill();
    ctx.fillStyle = '#4a5160';
    ctx.fillRect(-6, -8, 20, 4);
    ctx.fillStyle = '#ff4a3d';
    ctx.beginPath();
    ctx.arc(11, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8a80';
    ctx.beginPath();
    ctx.arc(11, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  drawPlayer(ctx, state.player, state.smokeTime);

  // Palm canopy over everything: a leafy crown, never a row of dots.
  for (const b of state.def.palms) {
    ctx.fillStyle = pal.palm;
    ctx.globalAlpha = 0.88;
    roundRect(ctx, b.x, b.y, b.w, b.h, 16);
    ctx.fill();
    ctx.globalAlpha = 1;
    const leaves = [
      [14, 16, 13], [34, 10, 15], [56, 14, 13], [76, 20, 12],
      [24, 32, 14], [46, 28, 15], [66, 34, 13], [36, 46, 12], [58, 48, 11],
    ];
    for (let i = 0; i < leaves.length; i += 1) {
      const [lx, ly, lr] = leaves[i];
      ctx.fillStyle = i % 2 === 0 ? pal.palmTop : pal.palm;
      ctx.beginPath();
      ctx.arc(b.x + lx, b.y + ly, lr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 2;
    roundRect(ctx, b.x + 1, b.y + 1, b.w - 2, b.h - 2, 16);
    ctx.stroke();
  }

  // A flat inner shadow just inside the walls frames the room and pulls the
  // eye inward. Flat bands, not a gradient, so the frame stays cheap to show.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.fillRect(24, 24, W - 48, 5);
  ctx.fillRect(24, H - 29, W - 48, 5);
  ctx.fillRect(24, 24, 5, H - 48);
  ctx.fillRect(W - 29, 24, 5, H - 48);

  drawHud(ctx, view);

  if (screen === SCREEN_TITLE) drawTitle(ctx, view);
  if (screen === SCREEN_LEVEL) drawLevel(ctx, view);
  if (screen === SCREEN_WIN) drawWin(ctx, view);
  if (screen === SCREEN_CAUGHT) drawCaught(ctx, view);
}

function drawHud(ctx, view) {
  const { state } = view;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, 44);
  ctx.fillStyle = 'rgba(255, 215, 106, 0.30)';
  ctx.fillRect(0, 44, FIELD.width, 1);
  // A soft shadow keeps every HUD word readable over any floor.
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = '#eef1f5';
  ctx.font = `bold 17px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(`${state.levelIndex + 1}. ${state.def.name}`, 36, 29);
  ctx.textAlign = 'center';
  ctx.fillStyle = state.prizeGot ? '#ffd76a' : '#8b93a3';
  ctx.fillText(state.prizeGot ? `★ ${state.def.prize}` : `☆ ${state.def.prize}`, FIELD.width / 2, 29);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#eef1f5';
  ctx.fillText(formatTime(view.levelTime), FIELD.width - 36, 29);
  ctx.shadowBlur = 0;
  // Alarm meter: its own row under the bar, the label beside it — never
  // under the prize name — filling green to amber to red as it climbs.
  const bw = 260;
  const bx = FIELD.width / 2 - bw / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, bx, 52, bw, 10, 5);
  ctx.fill();
  const frac = state.detection / 100;
  if (frac > 0) {
    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#58c96b');
    grad.addColorStop(0.5, '#ffd76a');
    grad.addColorStop(1, '#ff5a4e');
    ctx.save();
    roundRect(ctx, bx, 52, bw * frac, 10, 5);
    ctx.clip();
    ctx.fillStyle = grad;
    ctx.fillRect(bx, 52, bw, 10);
    ctx.restore();
  }
  ctx.fillStyle = frac > 0.7 ? '#ff8a80' : 'rgba(238,241,245,0.9)';
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(`ALARM ${Math.floor(state.detection)}%`, bx - 12, 61);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#bfe6ff';
  ctx.font = `13px ${FONT}`;
  ctx.fillText(`◆ ${state.lootGot} / ${state.loot.length} jewels   ·   smoke ${'●'.repeat(state.smokeLeft)}${'○'.repeat(PLAYER.smokePellets - state.smokeLeft)}`, 36, 76);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(238,241,245,0.65)';
  ctx.font = `13px ${FONT}`;
  ctx.fillText('WASD move · Shift sneak · Q smoke · R restart · M sound', 36, FIELD.height - 12);
  if (state.player.sneaking) {
    ctx.fillStyle = '#7fd4ff';
    ctx.textAlign = 'right';
    ctx.fillText('sneaking — slow and silent', FIELD.width - 36, FIELD.height - 12);
  }
  if (!state.prizeGot) {
    ctx.fillStyle = '#ffd76a';
    ctx.textAlign = 'center';
    ctx.fillText(`Take ${state.def.prize} — the door is locked without it`, FIELD.width / 2, FIELD.height - 12);
  }
}

function overlay(ctx) {
  ctx.fillStyle = 'rgba(8, 10, 14, 0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function drawTitle(ctx, view) {
  overlay(ctx);
  // A thin gold frame and a top hat over the title.
  ctx.strokeStyle = 'rgba(255, 215, 106, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, FIELD.width - 48, FIELD.height - 48);
  ctx.fillStyle = '#0a0a10';
  ctx.fillRect(FIELD.width / 2 - 26, 108, 52, 44);
  ctx.fillRect(FIELD.width / 2 - 40, 148, 80, 8);
  ctx.fillStyle = '#d9a441';
  ctx.fillRect(FIELD.width / 2 - 26, 138, 52, 6);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd76a';
  ctx.font = `bold 88px ${FONT}`;
  ctx.fillText('MAGPIE', FIELD.width / 2, 245);
  ctx.fillStyle = 'rgba(255, 215, 106, 0.8)';
  ctx.fillRect(FIELD.width / 2 - 110, 262, 220, 3);
  ctx.fillStyle = '#eef1f5';
  ctx.font = `28px ${FONT}`;
  ctx.fillText('— The Aldermere Heist —', FIELD.width / 2, 300);
  ctx.fillStyle = '#b9c0cc';
  ctx.font = `19px ${FONT}`;
  ctx.fillText('One thief. Three rooms. Three prizes the museum will miss by morning.', FIELD.width / 2, 352);
  ctx.fillText('Cameras sweep red cones, lasers blink, and the alarm never forgets.', FIELD.width / 2, 384);
  ctx.fillStyle = '#eef1f5';
  ctx.font = `bold 22px ${FONT}`;
  const blink = Math.sin(view.now * 3) > -0.2;
  if (blink) ctx.fillText('Press Enter or click to begin', FIELD.width / 2, 458);
  ctx.fillStyle = '#8b93a3';
  ctx.font = `16px ${FONT}`;
  ctx.fillText('WASD / arrows to move · hold Shift to sneak · Q smoke pellet · R restart · M sound', FIELD.width / 2, 516);
  if (view.best) {
    ctx.fillStyle = '#7fd4ff';
    ctx.fillText(`Best: ${formatTime(view.best.time)} · ${view.best.loot}/12 pieces`, FIELD.width / 2, 552);
  }
}

function drawLevel(ctx, view) {
  overlay(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7fd4ff';
  ctx.font = `bold 54px ${FONT}`;
  ctx.fillText('Clean getaway.', FIELD.width / 2, 295);
  ctx.fillStyle = 'rgba(255, 215, 106, 0.8)';
  ctx.fillRect(FIELD.width / 2 - 90, 315, 180, 3);
  ctx.fillStyle = '#eef1f5';
  ctx.font = `22px ${FONT}`;
  ctx.fillText(`${view.state.def.name} cleared in ${formatTime(view.levelTime)} · ${view.state.def.prize} taken · ${view.state.lootGot}/${view.state.loot.length} jewels`, FIELD.width / 2, 360);
  ctx.fillStyle = '#b9c0cc';
  ctx.font = `19px ${FONT}`;
  ctx.fillText(view.state.def.subtitle, FIELD.width / 2, 395);
  ctx.fillText('Press Enter for the next room', FIELD.width / 2, 445);
}

function drawWin(ctx, view) {
  overlay(ctx);
  ctx.textAlign = 'center';
  // A small gold crown above the headline.
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.moveTo(FIELD.width / 2 - 42, 200);
  ctx.lineTo(FIELD.width / 2 - 42, 168);
  ctx.lineTo(FIELD.width / 2 - 21, 186);
  ctx.lineTo(FIELD.width / 2, 162);
  ctx.lineTo(FIELD.width / 2 + 21, 186);
  ctx.lineTo(FIELD.width / 2 + 42, 168);
  ctx.lineTo(FIELD.width / 2 + 42, 200);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(FIELD.width / 2 - 42, 200, 84, 8);
  ctx.fillStyle = '#ffd76a';
  ctx.font = `bold 52px ${FONT}`;
  ctx.fillText('The Aldermere Crown is yours.', FIELD.width / 2, 282);
  ctx.fillStyle = 'rgba(255, 215, 106, 0.8)';
  ctx.fillRect(FIELD.width / 2 - 130, 300, 260, 3);
  ctx.fillStyle = '#eef1f5';
  ctx.font = `26px ${FONT}`;
  ctx.fillText('Magpie slips into the night with all three prizes.', FIELD.width / 2, 342);
  ctx.font = `22px ${FONT}`;
  ctx.fillText(`Total time ${formatTime(view.totalTime)} · ${view.lootTotal}/12 pieces`, FIELD.width / 2, 398);
  if (view.best) {
    ctx.fillStyle = '#7fd4ff';
    ctx.fillText(`Best: ${formatTime(view.best.time)} · ${view.best.loot}/12 pieces`, FIELD.width / 2, 438);
  }
  ctx.fillStyle = '#b9c0cc';
  ctx.font = `19px ${FONT}`;
  ctx.fillText('Press Enter to play again', FIELD.width / 2, 498);
}

function drawCaught(ctx, view) {
  const flash = Math.max(0, 1 - view.caughtTime / 0.6);
  ctx.fillStyle = `rgba(200, 30, 20, ${0.25 + flash * 0.35})`;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.strokeStyle = `rgba(255, 90, 78, ${0.5 + flash * 0.5})`;
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, FIELD.width - 48, FIELD.height - 48);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 64px ${FONT}`;
  ctx.fillText('THE ALARM SCREAMED!', FIELD.width / 2, 320);
  ctx.font = `22px ${FONT}`;
  ctx.fillText('The guards found you. The room starts over.', FIELD.width / 2, 378);
  ctx.fillStyle = '#ffd76a';
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText('Press R to try again', FIELD.width / 2, 438);
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${String(rest).padStart(2, '0')}`;
}
