// Lantern Hollow — camera, drawing, light, weather and particles.

let cv, g, lightCv, lg, reflCv, rg, VW = 320, VH = 180, SCALE = 4;
const cam = { x: 0, y: 0 };
const PARTS = [], AMB = [], DROPS = [];
let lanternSpr = null, cloudCv = null;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const dw = Math.round(innerWidth * dpr), dh = Math.round(innerHeight * dpr);
  // About 320×200 game pixels on screen, whatever shape the window is.
  SCALE = Math.max(2, Math.round(Math.sqrt((dw * dh) / 64000)));
  VW = Math.ceil(dw / SCALE); VH = Math.ceil(dh / SCALE);
  for (const c of [cv, lightCv, reflCv]) { c.width = VW; c.height = VH; }
  g.imageSmoothingEnabled = false;
}

// ---- sky and time of day --------------------------------------------------------------

const SKY = [[0, [70, 76, 150]], [300, [70, 76, 150]], [380, [236, 170, 190]], [470, [255, 246, 236]], [540, [255, 255, 255]], [960, [255, 252, 240]], [1060, [255, 196, 150]], [1140, [196, 132, 176]], [1215, [86, 86, 160]], [1440, [70, 76, 150]]];
function ambient() {
  if (G.scene === 'home') { const n = isNight(); return { c: n ? [150, 120, 150] : [255, 250, 245], nf: n ? 0.6 : 0 }; }
  const m = G.clock;
  let i = 0;
  while (i < SKY.length - 2 && SKY[i + 1][0] <= m) i++;
  const [m0, a] = SKY[i], [m1, b] = SKY[i + 1], t = clamp((m - m0) / (m1 - m0), 0, 1);
  let c = a.map((v, k) => v + (b[k] - v) * t);
  if (G.rain > 0) { const k = Math.min(1, G.rain / 3) * 0.32; c = c.map((v, j) => v * (1 - k) + [150, 165, 196][j] * k); }
  return { c, nf: clamp((255 - Math.min(...c)) / 170, 0, 1) };
}

// ---- particles -------------------------------------------------------------------------

function part(o) { if (PARTS.length < 700) PARTS.push(Object.assign({ vx: 0, vy: 0, g: 0, life: 1, age: 0 }, o)); }
function puff(x, y, c) { part({ kind: 'puff', x, y, vx: (Math.random() - 0.5) * 12, vy: -7, life: 0.5, c }); }
function splash(x, y) { for (let i = 0; i < 9; i++) part({ kind: 'drop', x, y, vx: (Math.random() - 0.5) * 44, vy: -32 - Math.random() * 30, g: 150, life: 0.5, c: PAL.w5 }); ripple(x, y); }
function ripple(x, y) { part({ kind: 'ripple', x, y, life: 1.1 }); }
function sparkle(x, y, c = PAL.gold) { part({ kind: 'spark', x: x + (Math.random() - 0.5) * 16, y: y + (Math.random() - 0.5) * 16, vy: -8, life: 0.7 + Math.random() * 0.5, c }); }
function confetti(x, y) { const cs = [PAL.f_red, PAL.gold, PAL.b2, PAL.f_pink, PAL.leaf || PAL.g4, PAL.white]; for (let i = 0; i < 90; i++) part({ kind: 'confetti', x, y, vx: (Math.random() - 0.5) * 160, vy: -70 - Math.random() * 100, g: 120, life: 2.2 + Math.random(), c: cs[i % cs.length] }); }
function popItem(x, y, spr) { part({ kind: 'item', x, y, vy: -46, g: 80, life: 1.2, spr }); }
function floatText(x, y, s, c = PAL.gold) { part({ kind: 'text', x, y, vy: -18, life: 1.4, s, c }); }

function updateParts(dt) {
  for (let i = PARTS.length - 1; i >= 0; i--) {
    const p = PARTS[i];
    p.age += dt;
    if (p.age >= p.life) { PARTS.splice(i, 1); continue; }
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.kind === 'confetti') p.vx *= 0.98;
    if (p.kind === 'leaf' || p.kind === 'petal') p.x += Math.sin(p.age * 2.6 + p.ph) * 14 * dt;
    if (p.kind === 'smoke') p.x += Math.sin(p.age * 1.4 + p.ph) * 5 * dt;
    if (p.kind === 'sky') p.x += Math.sin(p.age * 0.7 + p.ph) * 4 * dt;
  }
}

function drawParts(cx, cy, layer) {
  for (const p of PARTS) {
    if ((p.kind === 'sky') !== (layer === 'sky')) continue;
    const x = Math.round(p.x - cx), y = Math.round(p.y - cy), k = p.age / p.life;
    if (x < -40 || y < -40 || x > VW + 40 || y > VH + 40) continue;
    g.globalAlpha = 1;
    switch (p.kind) {
      case 'puff': { g.globalAlpha = 1 - k; g.fillStyle = p.c; const s = 2 + Math.floor(k * 3); g.fillRect(x - (s >> 1), y - (s >> 1), s, s); break; }
      case 'smoke': { g.globalAlpha = 0.5 * (1 - k); g.fillStyle = '#f2ecf4'; const s = 2 + Math.floor(k * 5); g.fillRect(x - (s >> 1), y - (s >> 1), s, s); break; }
      case 'mist': { g.globalAlpha = 0.45 * (1 - k); g.fillStyle = '#ffffff'; const s = 2 + Math.floor(k * 4); g.fillRect(x - (s >> 1), y - (s >> 1), s, s); break; }
      case 'drop': case 'confetti': g.fillStyle = p.c; g.fillRect(x, y, p.kind === 'confetti' && (p.age * 10 | 0) % 2 ? 1 : 2, 1); break;
      case 'leaf': case 'petal': g.globalAlpha = Math.min(1, (1 - k) * 3); g.fillStyle = p.c; g.fillRect(x, y, 2, 1); if (p.kind === 'leaf') g.fillRect(x + ((p.age * 4 | 0) % 2), y + 1, 1, 1); break;
      case 'ripple': {
        g.globalAlpha = 0.75 * (1 - k); g.fillStyle = PAL.w5;
        const rx = 2 + k * 9, ry = rx * 0.4;
        for (let a = 0; a < 22; a++) { const t = (a / 22) * Math.PI * 2; g.fillRect(Math.round(x + Math.cos(t) * rx), Math.round(y + Math.sin(t) * ry), 1, 1); }
        break;
      }
      case 'spark': g.globalAlpha = 1 - k; g.fillStyle = p.c; g.fillRect(x, y - 1, 1, 3); g.fillRect(x - 1, y, 3, 1); if (k < 0.5) { g.fillStyle = '#fff'; g.fillRect(x, y, 1, 1); } break;
      case 'item': g.globalAlpha = Math.min(1, (1 - k) * 2); g.drawImage(p.spr, x - (p.spr.width >> 1), y - p.spr.height); break;
      case 'text': { g.globalAlpha = Math.min(1, (1 - k) * 2.5); const w = textWidth(p.s); drawText(g, p.s, x - (w >> 1) + 1, y + 1, PAL.ink); drawText(g, p.s, x - (w >> 1), y, p.c); break; }
      case 'sky': {
        const a = Math.min(1, k * 4, (1 - k) * 3);
        g.globalAlpha = a * 0.35; g.fillStyle = '#ffd27a'; g.fillRect(x - 3, y - 4, 7, 9);
        g.globalAlpha = a; g.fillStyle = '#ffb35c'; g.fillRect(x - 2, y - 3, 5, 6); g.fillStyle = '#fff4bf'; g.fillRect(x - 1, y - 2, 3, 3); g.fillStyle = '#c86a3a'; g.fillRect(x - 2, y + 3, 5, 1);
        break;
      }
    }
  }
  g.globalAlpha = 1;
}

function spawnAmbient(dt, cx, cy) {
  if (G.scene !== 'town') return;
  const inView = (x, y, m = 60) => x > cx - m && x < cx + VW + m && y > cy - m && y < cy + VH + m;
  for (const o of OBJ) {
    if (o.smoke && Math.random() < dt * 2.5 && inView(o.smoke[0], o.smoke[1], 100)) part({ kind: 'smoke', x: o.smoke[0] + Math.random() * 4, y: o.smoke[1], vy: -9, life: 2.6, ph: Math.random() * 6 });
    if (o.fountain && Math.random() < dt * 22 && inView(o.x, o.y)) part({ kind: 'drop', x: o.x + (Math.random() - 0.5) * 3, y: o.dy + 32, vx: (Math.random() - 0.5) * 30, vy: -22 - Math.random() * 12, g: 110, life: 0.66, c: Math.random() < 0.5 ? PAL.w5 : PAL.w3 });
    if (o.tree && inView(o.x, o.y)) {
      const k = o.treeKind;
      if ((k === 'blossom' || k === 'lilac') && Math.random() < dt * 0.6) part({ kind: 'petal', x: o.x + (Math.random() - 0.5) * 30, y: o.y - 34, vy: 8, vx: 6, life: 4, ph: Math.random() * 6, c: k === 'lilac' ? '#e6d6ff' : '#ffd0dc' });
      else if (Math.random() < dt * 0.04) part({ kind: 'leaf', x: o.x + (Math.random() - 0.5) * 24, y: o.y - 30, vy: 9, life: 3.2, ph: Math.random() * 6, c: k === 'maple' ? '#f8b867' : PAL.g4 });
    }
  }
  // waterfall mist
  const wx = tx(MAP.spring.x), wy = tx(cliffY(MAP.spring.x) + CLIFF_H);
  if (inView(wx, wy) && Math.random() < dt * 14) part({ kind: 'mist', x: wx + (Math.random() - 0.5) * 26, y: wy + Math.random() * 6, vy: -6 - Math.random() * 6, vx: (Math.random() - 0.5) * 8, life: 1.4 });
  // fireflies at night, butterflies by day
  const night = isNight(), kind = night ? 'firefly' : 'butterfly', want = night ? 26 : 8;
  for (let i = AMB.length - 1; i >= 0; i--) if (AMB[i].kind !== kind) AMB.splice(i, 1);
  while (AMB.length < want) {
    const zones = night ? [[23, 26, 37, 35], [52, 24, 62, 44], [3, 22, 10, 28], [44, 26, 48, 40]] : [[52, 24, 62, 44], [3, 22, 10, 28], [25, 14, 35, 24], [14, 32, 22, 38]];
    const z = zones[Math.floor(Math.random() * zones.length)];
    const x = tx(z[0] + Math.random() * (z[2] - z[0])), y = tx(z[1] + Math.random() * (z[3] - z[1]));
    AMB.push({ kind, x, y, hx: x, hy: y, t: Math.random() * 10, c: [PAL.f_white, PAL.f_yellow, PAL.f_pink, PAL.f_blue][Math.floor(Math.random() * 4)] });
  }
  for (const a of AMB) {
    a.t += dt;
    const sp = a.kind === 'firefly' ? 0.45 : 0.95;
    a.x = a.hx + Math.sin(a.t * sp * 1.3) * 22 + Math.sin(a.t * sp * 3.1) * 6;
    a.y = a.hy + Math.cos(a.t * sp) * 12 + Math.sin(a.t * sp * 2.3) * 5;
  }
  // sky lanterns on lantern night
  const ev = todaysEvent();
  if (ev && ev.id === 'lanterns' && night && Math.random() < dt * 1.2) {
    const L = OBJ.filter((o) => o.kind === 'lantern' && o.idx < G.projects.bridge.progress);
    const src = L[Math.floor(Math.random() * L.length)];
    if (src) part({ kind: 'sky', x: src.x, y: src.y - 30, vy: -10 - Math.random() * 5, life: 14, ph: Math.random() * 6 });
  }
}

// ---- drawing helpers ------------------------------------------------------------------------

function shadowEllipse(x, y, rx, a = 0.2) {
  const ry = Math.max(1, Math.round(rx * 0.34));
  g.fillStyle = `rgba(52,34,74,${a})`;
  for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(1 - (j * j) / ((ry + 0.5) * (ry + 0.5)))); g.fillRect(x - w, y + j, w * 2, 1); }
}

function drawCharAt(gg, c, cx, cy) {
  const x = Math.round(c.x - cx), y = Math.round(c.y - cy);
  if (!c.sit || c.sit.ground) shadowEllipse(x, y - 1, 5);
  drawActor(gg, c.skin, x, y, poseOf(c));
}

function drawAnimal(a, cx, cy) {
  const x = Math.round(a.x - cx), y = Math.round(a.y - cy);
  shadowEllipse(x, y - 1, a.kind === 'cow' ? 7 : 4, 0.16);
  const img = a.kind === 'cow' && a.moving ? ASSETS.farm.CowSide : ASSETS.farm[a.sheet];
  if (a.kind === 'cow' && a.moving && img) { const f = Math.floor(a.t * 6) % 3; const fw = img.width / 3; g.save(); if (!a.flip) { g.translate(x, 0); g.scale(-1, 1); g.drawImage(img, f * fw, 0, fw, img.height, -fw / 2, y - img.height, fw, img.height); } else g.drawImage(img, f * fw, 0, fw, img.height, x - fw / 2, y - img.height, fw, img.height); g.restore(); }
  else drawCritterSheet(g, img, x, y, a.moving ? Math.floor(a.t * 6) % 2 : 0, a.flip);
  if (animalReady(a)) { const ic = GOOD_ICON[a.kind === 'cow' ? 'milk' : 'egg']; if (ic) g.drawImage(ic, x - 5, y - 26 + Math.round(Math.sin(G.t * 4))); }
  else if (a.st.fedDay !== G.day && Math.sin(G.t * 2 + a.x) > 0.6) drawEmote(g, EMOTE_IDS.dots, x + 1, y - 14);
  if (a.emote) { drawEmote(g, EMOTE_IDS[a.emote] || 27, x + 1, y - 15); a.emoteT -= 1 / 60; if (a.emoteT <= 0) a.emote = null; }
}

function drawPetAt(p, cx, cy) {
  const x = Math.round(p.x - cx), y = Math.round(p.y - cy);
  shadowEllipse(x, y, 4, 0.16);
  drawCritterSheet(g, ASSETS.pets[p.id], x, y, p.moving ? Math.floor(p.t * 8) % 2 : 0, p.flip);
  if (p.emote) drawEmote(g, EMOTE_IDS[p.emote] || 27, x + 1, y - 14);
}

function lineTo(x0, y0, x1, y1, c, sag = 0) {
  g.fillStyle = c;
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) { const t = i / n; g.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag), 1, 1); }
}

function drawLine(c, bx, by, phase, cx, cy) {
  const v = DIRV[c.dir];
  const tipx = Math.round(c.x - cx + v[0] * 16 + (c.dir === 0 ? 5 : c.dir === 3 ? -5 : 0)), tipy = Math.round(c.y - cy - 26 + (c.dir === 0 ? 4 : 0));
  const bob = phase === 'bite' ? 1 + ((G.t * 12) | 0) % 2 : Math.round(Math.sin(G.t * 3));
  const X = Math.round(bx - cx), Y = Math.round(by - cy) + bob;
  g.globalAlpha = 0.75; lineTo(tipx, tipy, X, Y, PAL.white, 5); g.globalAlpha = 1;
  g.fillStyle = PAL.f_red; g.fillRect(X - 1, Y - 2, 3, 2); g.fillStyle = PAL.white; g.fillRect(X - 1, Y, 3, 1);
}

function drawObj(o, cx, cy, night) {
  const x = Math.round((o.dx ?? o.x) - cx), y = Math.round((o.dy ?? o.y) - cy);
  if (o.tree) {
    const t = o.tree, sw = t.sway ? Math.round(Math.sin(G.t * 0.9 + o.phase) * 0.6) : 0;
    if (t.trunk) g.drawImage(t.trunk, x, y);
    g.drawImage(t.canopy, x + sw, y);
    return;
  }
  if (o.kind === 'lantern') { g.drawImage(o.idx < G.projects.bridge.progress ? lanternSpr[1 + ((G.t * 5 + o.idx) | 0) % 2] : lanternSpr[0], x, y); return; }
  if (o.kind === 'plot') {
    const p = plotAt(o.tx, o.ty);
    if (p && p.crop) { const st = cropStage(p); g.drawImage(cropSprite(p.crop, st), Math.round(o.x - 8 - cx), Math.round(o.y - 25 - cy)); if (st >= 3 && Math.random() < 0.02) sparkle(o.x, o.y - 12, PAL.white); }
    return;
  }
  if (o.kind === 'mymail') { g.drawImage(G.mail.length || G.lastCheckIn !== G.day ? mailFlag[1] : mailFlag[0], x, y); return; }
  if (o.windmill) {
    g.drawImage(o.spr, x, y);
    const bl = windmillBlades(G.t * 0.6);
    g.drawImage(bl, x + 28 - 35, y + 28 - 35);
    return;
  }
  if (o.bob) { g.drawImage(o.spr, x, y + Math.round(Math.sin(G.t * 1.6))); return; }
  if (o.spr) g.drawImage(night && o.sprN ? o.sprN : o.spr, x, y);
}
let mailFlag = null;

function drawCritters(cx, cy, list) {
  for (const c of CRITTERS) {
    if (c.x === undefined) continue;
    const f = c.frames[((G.t * (c.rate || 3)) | 0) % 2];
    list.push({ sortY: c.y, draw: () => {
      const x = Math.round(c.x - cx), y = Math.round(c.y - cy) - (c.jump > 0 ? 2 : 0) - (c.fly ? 6 : 0);
      if (c.kind !== 'swim' && !c.fly) shadowEllipse(x, Math.round(c.y - cy), 3, 0.15);
      if (c.flip) { g.save(); g.translate(x, 0); g.scale(-1, 1); g.drawImage(f, -7, y - 11); g.restore(); } else g.drawImage(f, x - 7, y - 11);
      if (c.sleep && Math.random() < 0.004) part({ kind: 'text', x: c.x + 4, y: c.y - 12, vy: -6, life: 1.6, s: 'Z', c: '#ffffff' });
    } });
  }
}

// ---- the special layers ----------------------------------------------------------------------

function drawFlat(cx, cy) {
  // farm plots: tilled soil, darker when watered
  for (const k in G.farm) {
    const p = G.farm[k];
    if (!p.tilled) continue;
    const [a, b] = k.split(',').map(Number), x = a * TILE - cx, y = b * TILE - cy;
    if (x < -16 || y < -16 || x > VW || y > VH) continue;
    const wet = p.watered || p.rainy;
    g.fillStyle = wet ? '#7a5240' : '#a5785a'; g.fillRect(x + 1, y + 2, 14, 13);
    g.fillStyle = wet ? '#5f3e33' : '#8a6248'; for (let j = 4; j < 15; j += 3) g.fillRect(x + 2, y + j, 12, 1);
    g.fillStyle = wet ? '#94654e' : '#c49674'; g.fillRect(x + 1, y + 2, 14, 1);
  }
  // the dock
  const D = MAP.dock, dx = tx(D.x0) - cx, dy = tx(D.y0) - 6 - cy, dw = tx(D.x1 - D.x0), dh = tx(D.y1 - D.y0) + 6;
  g.fillStyle = PAL.k3; g.fillRect(dx, dy, dw, dh);
  g.fillStyle = PAL.k2; for (let j = 3; j < dh; j += 4) g.fillRect(dx, dy + j, dw, 1);
  g.fillStyle = PAL.k4; for (let j = 0; j < dh; j += 8) g.fillRect(dx + 2, dy + j, 5, 1);
  g.fillStyle = PAL.k0; g.fillRect(dx - 2, dy + dh - 8, 4, 10); g.fillRect(dx + dw - 2, dy + dh - 8, 4, 10);
  // the bridge, whole or broken
  const B = MAP.bridge, bx = tx(B.x0) - cx, by = tx(B.y) - 14 - cy, bw = tx(B.x1 - B.x0), built = G.projects.bridge.done ? 99 : (G.bridgeBuild || 0);
  const planks = Math.floor(bw / 8);
  for (let i = 0; i < planks; i++) {
    const ok = i < built || i < 2 || i >= planks - 2;
    if (!ok) continue;
    g.fillStyle = i % 2 ? PAL.k3 : PAL.k4; g.fillRect(bx + i * 8, by + 4, 8, 22);
    g.fillStyle = PAL.k2; g.fillRect(bx + i * 8 + 7, by + 4, 1, 22);
  }
  if (built >= planks) { g.fillStyle = PAL.k1; g.fillRect(bx - 2, by + 1, bw + 4, 3); g.fillRect(bx - 2, by + 26, bw + 4, 3); }
  else { g.fillStyle = PAL.k3; g.fillRect(bx + bw / 2 - 6, by + 34 + Math.round(Math.sin(G.t * 2)), 12, 3); }
  for (const o of OBJ) if (o.flat && o.spr) g.drawImage(o.spr, Math.round(o.dx - cx), Math.round(o.dy - cy));
}

function drawWaterFx(cx, cy) {
  const t0 = Math.floor(cx / 8), t1 = Math.ceil((cx + VW) / 8), r0 = Math.floor(cy / 8), r1 = Math.ceil((cy + VH) / 8);
  g.fillStyle = PAL.w5;
  for (let ty = r0; ty <= r1; ty++) for (let txx = t0; txx <= t1; txx++) {
    const h = hash2(txx, ty, 13);
    if (h > 0.35) continue;
    const px = txx * 8 + Math.floor(h * 20) % 8, py = ty * 8 + Math.floor(hash2(ty, txx, 4) * 8);
    if (!waterAt(px, py)) continue;
    const s = Math.sin(G.t * 1.5 + h * 50);
    if (s > 0.9) g.fillRect(px - cx, py - cy, 2 + (h > 0.2 ? 1 : 0), 1);
  }
  // the waterfall
  const S = MAP.spring, top = tx(cliffY(S.x)) - 2, bot = tx(cliffY(S.x) + CLIFF_H) + 2, x0 = tx(S.x) - 11, x1 = tx(S.x) + 11;
  if (x1 - cx > 0 && x0 - cx < VW && bot - cy > 0 && top - cy < VH) {
    for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1, hx = hash2(x, 0, 3) * 20;
      for (let y = top; y <= bot; y++) {
        const k = (y - G.t * 70 + hx) % 9;
        g.fillStyle = edge ? PAL.w2 : k < 2 ? PAL.w5 : k < 5 ? PAL.w4 : PAL.w3;
        g.fillRect(x - cx, y - cy, 1, 1);
      }
    }
    g.fillStyle = PAL.w5; g.fillRect(x0 - 3 - cx, bot - 1 - cy, x1 - x0 + 7, 2);
  }
}

// Reflections: tall things near the water are drawn upside down into it.
function drawReflections(cx, cy, items) {
  rg.clearRect(0, 0, VW, VH);
  let any = false;
  for (const it of items) {
    const o = it.o, bx = o.x, by = o.sortY ?? o.y;
    if (!(waterAt(bx, by + 6) || waterAt(bx, by + 14) || waterAt(bx - 10, by + 10) || waterAt(bx + 10, by + 10))) continue;
    any = true;
    rg.save(); rg.translate(0, 2 * (by - cy) + 2); rg.scale(1, -1);
    const g0 = g; g = rg; it.draw(); g = g0;
    rg.restore();
  }
  if (!any) return;
  rg.globalCompositeOperation = 'destination-in';
  rg.drawImage(waterMaskCv, -cx, -cy);
  rg.globalCompositeOperation = 'source-over';
  g.globalAlpha = 0.34;
  for (let y = 0; y < VH; y += 2) { const off = Math.round(Math.sin(y * 0.35 + G.t * 2.2) * 1); g.drawImage(reflCv, 0, y, VW, 2, off, y, VW, 2); }
  g.globalAlpha = 1;
}

function makeCloudCv() {
  const c = makeCanvas(200, 110), cg = c.getContext('2d');
  [[60, 55, 50], [110, 45, 45], [150, 62, 40], [95, 70, 38]].forEach(([x, y, r]) => {
    const grd = cg.createRadialGradient(x, y, 0, x, y, r); grd.addColorStop(0, 'rgba(40,26,70,0.55)'); grd.addColorStop(1, 'rgba(40,26,70,0)');
    cg.fillStyle = grd; cg.fillRect(0, 0, 200, 110);
  });
  return c;
}

function drawSkyFx(cx, cy, amb) {
  if (G.scene !== 'town') return;
  // drifting cloud shadows by day
  if (amb.nf < 0.4) {
    g.globalAlpha = 0.16 * (1 - amb.nf * 2);
    for (let i = 0; i < 4; i++) {
      const x = ((G.t * 6 + i * 330) % (MPX + 400)) - 200 - cx, y = ((i * 237) % MPY) - cy + Math.sin(G.t * 0.05 + i) * 30;
      g.drawImage(cloudCv, Math.round(x), Math.round(y), 260, 143);
    }
    g.globalAlpha = 1;
  }
  // soft light rays in the morning and at golden hour
  const m = G.clock, ray = m > 6 * 60 && m < 9.5 * 60 ? 1 - Math.abs(m - 7.7 * 60) / 110 : m > 16 * 60 && m < 18.8 * 60 ? 1 - Math.abs(m - 17.4 * 60) / 85 : 0;
  if (ray > 0 && G.rain <= 0) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const x = ((i * 113 + G.t * 3) % (VW + 160)) - 80, w = 16 + (i % 3) * 10;
      g.globalAlpha = 0.05 * ray * (0.7 + 0.3 * Math.sin(G.t * 0.4 + i));
      g.fillStyle = m > 12 * 60 ? '#ffc890' : '#fff0c0';
      g.beginPath(); g.moveTo(x, -10); g.lineTo(x + w, -10); g.lineTo(x + w - 90, VH + 10); g.lineTo(x - 90, VH + 10); g.closePath(); g.fill();
    }
    g.restore();
  }
}

// String lights over the plaza: bulbs that glow after dark.
const STRINGS = [[[24.6, 18.1], [35.4, 18.1], 26], [[29.4, 13.9], [31.8, 13.9], 8], [[14.9, 18.2], [24.6, 18.1], 14]];
function drawStrings(cx, cy, amb) {
  for (const [[ax, ay], [bx, by], sag] of STRINGS) {
    const x0 = tx(ax) - cx, y0 = tx(ay) - 30 - cy, x1 = tx(bx) - cx, y1 = tx(by) - 30 - cy, n = Math.round(Math.abs(x1 - x0));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag);
      g.fillStyle = 'rgba(59,42,58,.7)'; g.fillRect(x, y, 1, 1);
      if (i % 7 === 3) {
        const c = ['#fff4bf', '#ffb3c8', '#bfe3ff', '#d6ffc8'][(i / 7 | 0) % 4];
        g.fillStyle = amb.nf > 0.3 ? c : mix(c, '#8a7a90', 0.4); g.fillRect(x, y + 1, 2, 2);
        if (amb.nf > 0.3) { g.globalAlpha = 0.25 * amb.nf; g.fillRect(x - 1, y, 4, 4); g.globalAlpha = 1; }
      }
    }
  }
}

function drawRain(dt) {
  if (G.rain <= 0) { DROPS.length = 0; return; }
  const k = Math.min(1, G.rain / 2);
  while (DROPS.length < 170 * k) DROPS.push({ x: Math.random() * (VW + 60), y: Math.random() * VH, s: 170 + Math.random() * 80 });
  g.fillStyle = '#dcefff';
  for (const d of DROPS) {
    d.y += d.s * dt; d.x -= d.s * 0.22 * dt;
    if (d.y > VH || d.x < -4) { if (Math.random() < 0.35) part({ kind: 'ripple', x: d.x + cam.x, y: d.y + cam.y - Math.random() * 50, life: 0.45 }); d.y = -6; d.x = Math.random() * (VW + 60); }
    g.globalAlpha = 0.5; g.fillRect(Math.round(d.x), Math.round(d.y), 1, 4);
  }
  g.globalAlpha = 1;
}

function drawLight(cx, cy, amb) {
  const [r, gg, b] = amb.c.map(Math.round);
  if (r > 252 && gg > 252 && b > 252) return;
  lg.globalCompositeOperation = 'source-over';
  lg.fillStyle = `rgb(${r},${gg},${b})`; lg.fillRect(0, 0, VW, VH);
  const nf = amb.nf;
  const glow = (x, y, rad, a, warm = true) => {
    if (x < -rad || y < -rad || x > VW + rad || y > VH + rad) return;
    const grd = lg.createRadialGradient(x, y, 0, x, y, rad);
    grd.addColorStop(0, warm ? `rgba(255,200,130,${a})` : `rgba(200,220,255,${a})`); grd.addColorStop(0.55, `rgba(210,150,110,${a * 0.4})`); grd.addColorStop(1, 'rgba(0,0,0,0)');
    lg.fillStyle = grd; lg.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  };
  if (nf > 0.12) {
    lg.globalCompositeOperation = 'lighter';
    if (G.scene === 'town') {
      for (const L of LIGHTS) {
        if (L.lantern !== undefined && L.lantern >= G.projects.bridge.progress) continue;
        glow(L.x - cx, L.y - cy, L.r * (1 + Math.sin(G.t * 8 + (L.lantern || 0)) * 0.03), 0.95 * nf);
      }
      for (const o of OBJ) if (o.lights && !hiddenObj(o)) for (const [x, y, rr] of o.lights) glow(x - cx, y - cy, rr, 0.75 * nf);
      for (const [[ax, ay], [bx, by], sag] of STRINGS) for (let t = 0.1; t < 1; t += 0.2) glow(tx(ax + (bx - ax) * t) - cx, tx(ay + (by - ay) * t) - 30 + Math.sin(t * Math.PI) * sag - cy, 16, 0.35 * nf);
      for (const p of PARTS) if (p.kind === 'sky') glow(p.x - cx, p.y - cy, 14, 0.6 * nf);
    } else {
      for (const p of G.home.placed) if (FURNITURE[p.id].light) glow(4 + (p.x + FURNITURE[p.id].size[0] / 2) * TILE - cx, 4 + (p.y + FLOOR_Y0) * TILE - 4 - cy, 70, 0.9);
    }
    const held = false;
    glow(player.x - cx, player.y - 16 - cy, held ? 60 : 34, (held ? 0.8 : 0.35) * nf);
  }
  g.globalCompositeOperation = 'multiply'; g.drawImage(lightCv, 0, 0);
  if (nf > 0.12 && G.scene === 'town') {
    g.globalCompositeOperation = 'lighter';
    for (const L of LIGHTS) {
      if (L.lantern !== undefined && L.lantern >= G.projects.bridge.progress) continue;
      const x = L.x - cx, y = L.y - cy;
      if (x < -20 || y < -20 || x > VW + 20 || y > VH + 20) continue;
      const grd = g.createRadialGradient(x, y, 0, x, y, 13); grd.addColorStop(0, `rgba(255,205,120,${0.45 * nf})`); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.fillRect(x - 13, y - 13, 26, 26);
    }
  }
  g.globalCompositeOperation = 'source-over';
}

function drawFireflies(cx, cy, nf) {
  for (const a of AMB) {
    const x = Math.round(a.x - cx), y = Math.round(a.y - cy);
    if (a.kind === 'butterfly') {
      const flap = (a.t * 9 | 0) % 2; g.fillStyle = a.c;
      if (flap) { g.fillRect(x - 2, y, 2, 2); g.fillRect(x + 1, y, 2, 2); } else { g.fillRect(x - 1, y - 1, 1, 2); g.fillRect(x + 1, y - 1, 1, 2); }
      g.fillStyle = PAL.ink; g.fillRect(x, y, 1, 2);
    } else {
      const pulse = 0.5 + 0.5 * Math.sin(a.t * 2.4 + a.hx);
      g.globalAlpha = (0.3 + 0.7 * pulse) * nf; g.fillStyle = '#efff9e'; g.fillRect(x, y, 1, 1);
      g.globalAlpha = 0.25 * pulse * nf; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3);
      g.globalAlpha = 1;
    }
  }
}

let currentTarget = null;
function drawOverhead(cx, cy) {
  const chars = G.scene === 'town' ? [player, ...NPCS.filter((n) => !n.inside)] : [player];
  for (const c of chars) {
    const x = Math.round(c.x - cx), y = Math.round(c.y - cy) + (c.sit && !c.sit.ground ? 0 : 0);
    if (c.emote) drawEmote(g, EMOTE_IDS[c.emote] || 11, x + 1, y - 17);
    if (c !== player && Math.hypot(c.x - player.x, c.y - player.y) < 70) {
      const w = textWidth(c.name);
      g.fillStyle = 'rgba(59,42,58,0.72)'; g.fillRect(x - (w >> 1) - 2, y + 3, w + 4, 8);
      drawText(g, c.name, x - (w >> 1), y + 4, PAL.cream);
    }
  }
  if (currentTarget && currentTarget.x !== undefined && !G.paused) {
    const x = Math.round(currentTarget.x - cx), y = Math.round(currentTarget.y - cy) + Math.round(Math.sin(G.t * 5) * 1.5);
    g.fillStyle = PAL.ink; g.fillRect(x - 3, y - 1, 7, 1); g.fillRect(x - 2, y + 2, 5, 1); g.fillRect(x - 1, y + 3, 3, 1);
    g.fillStyle = PAL.white; g.fillRect(x - 2, y, 5, 2); g.fillRect(x - 1, y + 2, 3, 1); g.fillRect(x, y + 3, 1, 1);
  }
}

// ---- the frame --------------------------------------------------------------------------------

function render(dt) {
  const cx = Math.round(cam.x), cy = Math.round(cam.y);
  const amb = ambient();
  g.globalCompositeOperation = 'source-over';
  if (G.scene === 'home') {
    drawRoom(g, cx, cy);
    drawParts(cx, cy);
    drawLight(cx, cy, amb);
    drawOverhead(cx, cy);
    return;
  }
  g.fillStyle = PAL.g2; g.fillRect(0, 0, VW, VH);
  g.drawImage(groundCv, -cx, -cy);
  drawWaterFx(cx, cy);
  drawFlat(cx, cy);

  const night = amb.nf > 0.35;
  const inView = (o) => { const x = (o.dx ?? o.x) - cx, y = (o.dy ?? o.y) - cy; return x < VW + 16 && x > -220 && y < VH + 16 && (o.sortY ?? o.y) - cy > -10; };
  const items = [];
  for (const o of OBJ) if (!o.flat && !hiddenObj(o) && inView(o)) items.push({ o, sortY: o.sortY ?? o.y, draw: () => drawObj(o, cx, cy, night) });
  items.push({ o: player, sortY: player.y, draw: () => drawCharAt(g, player, cx, cy) });
  for (const n of NPCS) if (!n.inside) items.push({ o: n, sortY: n.y, draw: () => drawCharAt(g, n, cx, cy) });
  for (const p of PETS_OUT) if (!p.hidden) items.push({ o: p, sortY: p.y, draw: () => drawPetAt(p, cx, cy) });
  drawReflections(cx, cy, items);
  for (const o of OBJ) if (o.shadow && !hiddenObj(o) && inView(o)) shadowEllipse(Math.round(o.shadow[0] - cx), Math.round(o.shadow[1] - cy), o.shadow[2]);
  const crit = [];
  drawCritters(cx, cy, crit);
  crit.forEach((c) => items.push(c));
  drawSite(g, cx, cy, items);
  items.sort((a, b) => a.sortY - b.sortY);
  for (const it of items) it.draw();

  if (G.cast && G.cast.phase !== 'cast') drawLine(player, G.cast.bx, G.cast.by, G.cast.phase, cx, cy);
  else if (G.cast) { const f = G.cast, k = Math.min(1, f.t / 0.45); drawLine(player, f.sx + (f.bx - f.sx) * k, f.sy + (f.by - f.sy) * k - Math.sin(k * Math.PI) * 18, 'cast', cx, cy); }
  for (const n of NPCS) if (n.fishing && !n.inside) { const v = DIRV[n.dir]; drawLine(n, n.x + v[0] * 30, n.y + v[1] * 26 + 2, 'wait', cx, cy); }

  drawStrings(cx, cy, amb);
  drawParts(cx, cy);
  drawSkyFx(cx, cy, amb);
  drawRain(dt);
  drawLight(cx, cy, amb);
  drawParts(cx, cy, 'sky');
  drawFireflies(cx, cy, amb.nf);
  drawOverhead(cx, cy);
  drawSitePointer(cx, cy);
}

// ---- cinematics -----------------------------------------------------------------------------

function runCine(c) { c.t = 0; G.cine = c; }
function updateCine(dt) {
  const c = G.cine;
  if (!c) return;
  c.t += dt;
  for (const s of c.steps) if (!s.done && c.t >= s[0]) { s.done = true; s[1](); }
  if (c.t >= c.end) { G.cine = null; if (c.after) c.after(); }
}

function updateCamera(dt) {
  let tx0, ty0;
  if (G.cine) { tx0 = G.cine.x - VW / 2; ty0 = G.cine.y - VH / 2; }
  else if (G.started) { tx0 = player.x - VW / 2; ty0 = player.y - 16 - VH / 2; }
  else { const t = G.t; tx0 = tx(30) + Math.sin(t * 0.1) * 150 - VW / 2; ty0 = tx(22) + Math.sin(t * 0.07) * 80 - VH / 2; }
  const k = 1 - Math.exp(-dt * (G.cine ? 3 : G.started ? 7 : 1.2));
  cam.x += (tx0 - cam.x) * k; cam.y += (ty0 - cam.y) * k;
  const W = G.scene === 'home' ? RW + 8 : MPX, H = G.scene === 'home' ? RH + 8 : MPY;
  if (W <= VW) cam.x = (W - VW) / 2; else cam.x = clamp(cam.x, 0, W - VW);
  if (H <= VH) cam.y = (H - VH) / 2; else cam.y = clamp(cam.y, 0, H - VH);
}

function initRender(canvas) {
  cv = canvas; g = cv.getContext('2d');
  lightCv = makeCanvas(1, 1); lg = lightCv.getContext('2d');
  reflCv = makeCanvas(1, 1); rg = reflCv.getContext('2d');
  lanternSpr = [lampPostSprite(false), lampPostSprite(true, 0), lampPostSprite(true, 1)];
  mailFlag = [mailboxSprite(PAL.r1, false), mailboxSprite(PAL.r1, true)];
  cloudCv = makeCloudCv();
  resize();
  addEventListener('resize', resize);
}
