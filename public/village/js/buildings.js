// Lantern Hollow — buildings. One generator draws every house and shop from a
// spec, in a day version and a night version with lit windows.

const ROOFS = {
  r: [PAL.r3, PAL.r2, PAL.r1, PAL.r0], b: [PAL.b3, PAL.b2, PAL.b1, PAL.b0], m: [PAL.m3, PAL.m2, PAL.m1, PAL.m0],
  l: [PAL.l3, PAL.l2, PAL.l1, PAL.l0], y: [PAL.y3, PAL.y2, PAL.y1, PAL.y0],
};
const WALLS = {
  plaster: [PAL.c3, PAL.c2, PAL.c1], pink: [PAL.pk3, PAL.pk2, PAL.pk1], mint: ['#f2fff6', '#dcf3e4', '#bfe2cc'],
  plank: [PAL.k4, PAL.k3, PAL.k2], stone: [PAL.s4, PAL.s3, PAL.s2], blue: ['#f2f8ff', '#dbe9fb', '#bcd2ef'],
};

// Fish-scale shingles, lighter toward the ridge.
function roofScallop(pb, x0, x1, y0, y1, ramp) {
  for (let y = y0; y <= y1; y++) {
    const rel = y - y0, row = Math.floor(rel / 4), ry = rel % 4;
    const inset = rel === 0 ? 2 : rel === 1 ? 1 : 0;
    const k = (y - y0) / Math.max(1, y1 - y0);
    const base = k < 0.18 ? ramp[0] : k < 0.62 ? ramp[1] : ramp[2];
    for (let x = x0 + inset; x <= x1 - inset; x++) {
      const lx = (x - x0 + (row % 2) * 3) % 6;
      let c = base;
      if (ry === 3 && (lx === 0 || lx === 5)) c = shade(base, -0.28);
      else if (ry === 3) c = shade(base, -0.12);
      else if (ry === 0 && (lx === 2 || lx === 3)) c = shade(base, 0.2);
      if (rel < 2) c = shade(ramp[0], 0.15);
      pb.set(x, y, c);
    }
  }
  // the eave: a rounded, shadowed lip
  pb.hline(x0 + 1, x1 - 1, y1, ramp[3]);
  pb.hline(x0 + 2, x1 - 2, y1 + 1, shade(ramp[3], -0.25));
}

function wallFill(pb, x0, x1, y0, y1, kind, beams) {
  const W = WALLS[kind];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let c = W[1];
    if (kind === 'plank') c = (y - y0) % 5 === 4 ? W[2] : (x * 7 + Math.floor((y - y0) / 5) * 11) % 29 === 0 ? W[2] : W[1];
    else if (kind === 'stone') {
      const row = Math.floor((y - y0) / 5), bx = (x - x0 + (row % 2) * 4) % 9;
      c = (y - y0) % 5 === 4 || bx === 8 ? W[2] : hash2(Math.floor((x - x0 + (row % 2) * 4) / 9), row, 8) > 0.6 ? W[0] : W[1];
    } else if (hash2(x, y, 2) > 0.94) c = W[2];
    if (y === y0 || y === y0 + 1) c = shade(W[1], -0.25); // shadow under the eave
    pb.set(x, y, c);
  }
  if (beams) {
    [x0, x1].forEach((x) => { pb.vline(x, y0, y1 - 3, PAL.k1); pb.vline(x + (x === x0 ? 1 : -1), y0, y1 - 3, PAL.k2); });
    pb.hline(x0, x1, y0 + 2, PAL.k1);
  }
  for (let y = y1 - 3; y <= y1; y++) for (let x = x0; x <= x1; x++) pb.set(x, y, y === y1 - 3 ? PAL.s4 : (x + (y % 2) * 3) % 7 === 0 ? PAL.s1 : PAL.s2);
}

function windowAt(pb, w, night, lights) {
  const { x, y, w: ww, h: hh, shutters, box, arch, round } = w;
  if (round) {
    pb.disc(x, y, ww / 2 + 1, PAL.k1);
    pb.disc(x, y, ww / 2, night ? PAL.warm : PAL.w3);
    if (!night) { pb.set(x - 1, y - 1, PAL.w5); pb.set(x - 2, y, PAL.w4); }
    pb.hline(x - ww / 2, x + ww / 2, y, PAL.k1); pb.vline(x, y - ww / 2, y + ww / 2, PAL.k1);
    lights.push([x, y, 18]);
    return;
  }
  pb.rect(x - 1, y - 1, ww + 2, hh + 2, PAL.k1);
  for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) {
    let c = night ? (j < hh * 0.45 ? PAL.glow : PAL.warm) : j < hh * 0.5 ? PAL.w3 : PAL.w2;
    if (!night && (i + j === 2 || i + j === 3)) c = PAL.w5;
    pb.set(x + i, y + j, c);
  }
  if (night) { pb.rect(x, y, 2, hh, '#f7a8c0'); pb.rect(x + ww - 2, y, 2, hh, '#f7a8c0'); }
  if (arch) { pb.set(x, y, PAL.k1); pb.set(x + ww - 1, y, PAL.k1); pb.hline(x + 1, x + ww - 2, y - 1, PAL.k1); }
  pb.vline(x + Math.floor(ww / 2), y, y + hh - 1, PAL.k1);
  pb.hline(x, x + ww - 1, y + Math.floor(hh / 2), PAL.k1);
  if (shutters) {
    const sd = shade(shutters, -0.25);
    pb.rect(x - 4, y - 1, 3, hh + 2, shutters); pb.rect(x + ww + 1, y - 1, 3, hh + 2, shutters);
    for (let j = 1; j < hh; j += 2) { pb.hline(x - 4, x - 2, y + j, sd); pb.hline(x + ww + 1, x + ww + 3, y + j, sd); }
  }
  pb.hline(x - 2, x + ww + 1, y + hh + 1, PAL.k4);
  if (box) {
    pb.rect(x - 1, y + hh + 2, ww + 2, 3, PAL.k2); pb.hline(x - 1, x + ww, y + hh + 4, PAL.k1);
    const fl = [PAL.f_pink, PAL.f_white, PAL.f_yellow, PAL.f_lilac];
    for (let i = -1; i <= ww; i++) { pb.set(x + i, y + hh + 1, i % 2 ? PAL.g2 : fl[(i + 4) % 4]); if (i % 3 === 0) pb.set(x + i, y + hh, fl[(i + 5) % 4]); }
    pb.set(x - 1, y + hh + 5, PAL.g2); pb.set(x + ww, y + hh + 5, PAL.g2);
  }
  lights.push([x + ww / 2, y + hh / 2, 24]);
}

function doorAt(pb, d, night, lights) {
  const { x, y, w, h, color } = d;
  const c = color || PAL.k2, cd = shade(c, -0.25), cl = shade(c, 0.2);
  pb.rect(x - 2, y - 2, w + 4, h + 2, PAL.k1);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) pb.set(x + i, y + j, (i % 4 === 3) ? cd : c);
  // a rounded top
  const r = Math.floor(w / 2);
  for (let i = 0; i < w; i++) { const dy = Math.round(r - Math.sqrt(Math.max(0, r * r - (i - r + 0.5) ** 2))); for (let j = 0; j < dy; j++) pb.set(x + i, y + j, PAL.k1); }
  pb.hline(x + 2, x + w - 3, y + Math.floor(h * 0.3), cl);
  pb.rect(x + Math.floor(w / 2) - 2, y + 4, 4, 3, night ? PAL.warm : PAL.w3);
  pb.set(x + w - 3, y + Math.floor(h * 0.6), PAL.gold);
  if (d.lamp !== false) {
    const lx = x + w + 4, ly = y + 2;
    pb.vline(lx, ly - 1, ly + 1, PAL.ink2); pb.rect(lx - 1, ly + 2, 3, 4, night ? PAL.glow : PAL.y2); pb.hline(lx - 1, lx + 1, ly + 6, PAL.ink2);
    lights.push([lx, ly + 4, 22]);
  }
  pb.rect(x - 1, y + h, w + 2, 2, '#e8a4b4'); pb.hline(x - 1, x + w, y + h + 1, '#c9849a'); // doormat
}

function signAt(pb, s) {
  const { x, y, w, h } = s;
  pb.hline(x - 1, x + w, y - 3, PAL.ink2);
  pb.vline(x + 2, y - 3, y - 1, PAL.ink2); pb.vline(x + w - 3, y - 3, y - 1, PAL.ink2);
  pb.rect(x, y, w, h, PAL.k4); pb.hline(x, x + w - 1, y + h - 1, PAL.k2); pb.hline(x, x + w - 1, y, shade(PAL.k4, 0.3));
  const cx = x + Math.floor(w / 2), cy = y + Math.floor(h / 2);
  if (s.text) textPB(pb, s.text, cx - Math.floor(textWidth(s.text) / 2), cy - 2, PAL.k0);
  if (s.icon === 'cup') { pb.rect(cx - 3, cy - 1, 5, 4, PAL.white); pb.set(cx + 2, cy, PAL.white); pb.hline(cx - 2, cx, cy - 1, PAL.k2); pb.set(cx - 1, cy - 3, PAL.s3); pb.set(cx, cy - 4, PAL.s3); }
  if (s.icon === 'book') { pb.rect(cx - 4, cy - 2, 8, 5, PAL.white); pb.vline(cx, cy - 2, cy + 2, PAL.k2); pb.hline(cx - 3, cx - 1, cy, PAL.s2); pb.hline(cx + 1, cx + 3, cy, PAL.s2); }
  if (s.icon === 'bow') { pb.disc(cx - 2, cy, 1.6, PAL.f_rose); pb.disc(cx + 2, cy, 1.6, PAL.f_rose); pb.set(cx, cy, '#b9475a'); }
  if (s.icon === 'bag') { pb.rect(cx - 3, cy - 1, 6, 4, PAL.y1); pb.hline(cx - 1, cx, cy - 3, PAL.k1); pb.set(cx - 2, cy - 2, PAL.k1); pb.set(cx + 1, cy - 2, PAL.k1); }
}

function chimneyAt(pb, x, y, h) {
  pb.rect(x, y, 10, h, '#c99a8a');
  for (let j = 1; j < h; j += 3) for (let i = 0; i < 10; i++) if ((i + (Math.floor(j / 3) % 2) * 2) % 5 === 0) pb.set(x + i, y + j, '#a87a6c');
  pb.rect(x - 1, y - 3, 12, 3, PAL.s3); pb.hline(x + 1, x + 8, y - 3, PAL.s0);
}

function gableAt(pb, cx, half, y0, y1, kind) {
  const W = WALLS[kind] || WALLS.plaster;
  for (let y = y0; y <= y1; y++) {
    const s = Math.round(((y - y0) / (y1 - y0)) * half);
    for (let x = cx - s; x <= cx + s; x++) pb.set(x, y, W[1]);
    pb.set(cx - s - 1, y, PAL.k1); pb.set(cx + s + 1, y, PAL.k1); pb.set(cx - s - 2, y, PAL.k2); pb.set(cx + s + 2, y, PAL.k2);
  }
  pb.vline(cx, y0 + 3, y1, PAL.k2);
}

function awningAt(pb, x0, x1, y, a, b) {
  for (let x = x0; x <= x1; x++) {
    const c = Math.floor((x - x0) / 5) % 2 ? a : b;
    for (let j = 0; j < 6; j++) pb.set(x, y + j, j === 0 ? shade(c, 0.2) : c);
    const lx = (x - x0) % 5;
    if (lx >= 1 && lx <= 3) pb.set(x, y + 6, c);
    if (lx === 2) pb.set(x, y + 7, c);
  }
  pb.hline(x0, x1, y - 1, shade(a, -0.3));
}

function vinesAt(pb, x, y0, y1, rnd) {
  for (let y = y0; y < y1; y++) {
    const xx = x + Math.round(Math.sin(y * 0.4) * 1.5);
    pb.set(xx, y, y % 3 ? PAL.g2 : PAL.g1);
    if (rnd() < 0.3) pb.set(xx + 1, y, PAL.g3);
    if (rnd() < 0.08) pb.set(xx - 1, y, PAL.f_pink);
  }
}

// spec → { day, night, lights: [[x, y, r]] }, positions relative to the sprite.
function drawBuilding(spec, night) {
  const pb = new PB(spec.w, spec.h), lights = [], rnd = mulberry32(spec.seed || 1);
  const W = spec.w, H = spec.h, wy = spec.wallY;
  wallFill(pb, 6, W - 7, wy, H - 1, spec.wall, spec.beams);
  if (spec.tower) spec.tower(pb, night, lights);
  roofScallop(pb, 1, W - 2, spec.roofY || 4, wy + 4, ROOFS[spec.roof]);
  if (spec.gable) {
    gableAt(pb, W / 2 | 0, spec.gable, (spec.roofY || 4) + 6, wy + 4, spec.wall === 'plank' ? 'plaster' : spec.wall);
    windowAt(pb, { x: W / 2 | 0, y: wy - 8, w: 8, round: true }, night, lights);
  }
  if (spec.chimney) chimneyAt(pb, spec.chimney, 0, (spec.roofY || 4) + 8);
  if (spec.towerFront) spec.towerFront(pb, night, lights);
  (spec.windows || []).forEach((w) => windowAt(pb, w, night, lights));
  if (spec.awning) awningAt(pb, spec.awning[0], spec.awning[1], spec.awning[2], spec.awning[3], spec.awning[4]);
  doorAt(pb, spec.door, night, lights);
  if (spec.sign) signAt(pb, spec.sign);
  if (spec.vines) vinesAt(pb, spec.vines, wy + 4, H - 4, rnd);
  if (spec.extra) spec.extra(pb, night, lights);
  pb.outlineAuto(0.55);
  return { cv: pb.canvas(), lights };
}

// ---- the specs ------------------------------------------------------------------------

function houseSpec(seed, roof, wall, doorColor, shutters) {
  return {
    w: 84, h: 88, wallY: 46, roof, wall, beams: wall !== 'plank' && wall !== 'stone', gable: 18, seed,
    chimney: 60, windows: [{ x: 13, y: 58, w: 10, h: 10, shutters, box: true }, { x: 61, y: 58, w: 10, h: 10, shutters, box: true }],
    door: { x: 35, y: 62, w: 14, h: 22, color: doorColor }, vines: seed % 3 === 0 ? 8 : 0,
  };
}

const BUILDINGS = {
  home: () => ({ ...houseSpec(11, 'r', 'plaster', PAL.b1, '#7fb2e8'), w: 96, h: 92, wallY: 48, chimney: 70,
    windows: [{ x: 14, y: 60, w: 12, h: 11, shutters: '#7fb2e8', box: true }, { x: 70, y: 60, w: 12, h: 11, shutters: '#7fb2e8', box: true }],
    door: { x: 41, y: 64, w: 14, h: 24, color: PAL.b1 }, vines: 88 }),
  cafe: () => ({
    w: 112, h: 96, wallY: 46, roof: 'm', wall: 'pink', beams: true, seed: 21, chimney: 16,
    windows: [{ x: 14, y: 60, w: 26, h: 14, box: true }, { x: 72, y: 60, w: 26, h: 14, box: true }],
    awning: [10, 44, 52, '#ff8fb0', PAL.cream], door: { x: 49, y: 66, w: 14, h: 26, color: PAL.m0 },
    sign: { x: 47, y: 40, w: 18, h: 11, icon: 'cup' },
    extra: (pb) => awningAt(pb, 68, 102, 52, '#ff8fb0', PAL.cream),
  }),
  shop: () => ({
    w: 112, h: 96, wallY: 44, roof: 'b', wall: 'plank', seed: 31,
    windows: [{ x: 14, y: 58, w: 24, h: 14, box: true }, { x: 74, y: 58, w: 24, h: 14, box: true }],
    awning: [8, 103, 49, PAL.y2, PAL.cream], door: { x: 49, y: 66, w: 14, h: 26, color: PAL.k1 },
    sign: { x: 38, y: 32, w: 36, h: 10, text: 'SHOP' },
  }),
  boutique: () => ({
    w: 96, h: 92, wallY: 46, roof: 'l', wall: 'pink', beams: true, seed: 41, gable: 20,
    windows: [{ x: 13, y: 58, w: 16, h: 16, arch: true, box: true }, { x: 67, y: 58, w: 16, h: 16, arch: true, box: true }],
    door: { x: 41, y: 64, w: 14, h: 24, color: PAL.l0 }, sign: { x: 39, y: 54, w: 18, h: 8, icon: 'bow' },
  }),
  library: () => ({
    w: 112, h: 104, wallY: 52, roof: 'b', wall: 'stone', seed: 51, gable: 24,
    windows: [{ x: 16, y: 64, w: 12, h: 22, arch: true }, { x: 84, y: 64, w: 12, h: 22, arch: true }],
    door: { x: 49, y: 72, w: 14, h: 28, color: PAL.k2 }, sign: { x: 44, y: 62, w: 24, h: 9, icon: 'book' }, vines: 104,
  }),
  school: () => ({
    w: 176, h: 156, wallY: 86, roofY: 40, roof: 'r', wall: 'plaster', beams: true, seed: 61,
    windows: [{ x: 18, y: 100, w: 14, h: 18, arch: true, shutters: '#7fb2e8', box: true }, { x: 46, y: 100, w: 14, h: 18, arch: true, shutters: '#7fb2e8', box: true },
      { x: 116, y: 100, w: 14, h: 18, arch: true, shutters: '#7fb2e8', box: true }, { x: 144, y: 100, w: 14, h: 18, arch: true, shutters: '#7fb2e8', box: true }],
    door: { x: 74, y: 118, w: 28, h: 34, color: PAL.b0 }, sign: { x: 64, y: 92, w: 48, h: 10, text: 'CLASS' },
    tower: (pb, night, lights) => {
      pb.rect(68, 14, 40, 40, PAL.c2); pb.vline(68, 14, 53, PAL.k1); pb.vline(107, 14, 53, PAL.k1);
      pb.disc(88, 30, 9, PAL.cream); pb.disc(88, 30, 9, PAL.k1); pb.disc(88, 30, 8, night ? PAL.glow : PAL.white);
      for (let a = 0; a < 12; a++) pb.set(88 + Math.round(Math.cos(a * 0.5236) * 6.5), 30 + Math.round(Math.sin(a * 0.5236) * 6.5), PAL.k1);
      pb.vline(88, 24, 30, PAL.ink); pb.hline(88, 92, 30, PAL.ink);
      if (night) lights.push([88, 30, 26]);
      for (let y = 0; y < 16; y++) { const s = Math.round((y / 15) * 23); pb.hline(88 - s, 88 + s, y, y % 4 === 3 ? PAL.r0 : y < 3 ? PAL.r3 : PAL.r2); }
      pb.vline(88, 0, 3, PAL.gold);
    },
  }),
};

function homeSpecFor(look) {
  const s = BUILDINGS.home();
  if (look && look.roof) s.roof = look.roof;
  if (look && look.wall) s.wall = look.wall;
  return s;
}

// ---- landmarks drawn by hand ------------------------------------------------------------

function windmillBody() {
  const pb = new PB(56, 92);
  pb.poly([[14, 90], [42, 90], [36, 26], [20, 26]], PAL.c2);
  pb.paint((x) => (x > 34 ? PAL.c1 : x < 20 ? PAL.c3 : null));
  for (let y = 34; y < 90; y += 7) pb.hline(16, 40, y, shade(PAL.c1, -0.08));
  pb.poly([[16, 28], [40, 28], [28, 6]], PAL.r1); pb.poly([[18, 26], [28, 9], [28, 26]], PAL.r2);
  pb.rect(24, 70, 8, 18, PAL.k2); pb.rect(25, 71, 6, 2, PAL.k3); pb.disc(28, 46, 3, PAL.w3); pb.hline(25, 31, 46, PAL.k1); pb.vline(28, 43, 49, PAL.k1);
  pb.disc(28, 28, 2.5, PAL.k1);
  return pb.outlineAuto(0.55).canvas();
}
function windmillBlades(angle) {
  const c = makeCanvas(70, 70), g = c.getContext('2d');
  g.translate(35, 35);
  for (let i = 0; i < 4; i++) {
    g.save(); g.rotate(angle + (i * Math.PI) / 2);
    g.fillStyle = PAL.k1; g.fillRect(-1, -32, 2, 30);
    g.fillStyle = PAL.c3; g.fillRect(1, -31, 7, 24);
    g.fillStyle = PAL.c1; for (let y = -29; y < -7; y += 4) g.fillRect(1, y, 7, 1);
    g.restore();
  }
  return c;
}

function observatorySpec() {
  return {
    w: 80, h: 100, wallY: 56, roofY: 50, roof: 'b', wall: 'stone', seed: 71,
    door: { x: 33, y: 74, w: 14, h: 22, color: PAL.l0 },
    windows: [{ x: 14, y: 66, w: 10, h: 14, arch: true }, { x: 56, y: 66, w: 10, h: 14, arch: true }],
    towerFront: (pb) => {
      const dome = new PB(80, 56); dome.ellipse(40, 50, 30, 30, PAL.s4); dome.paint((x, y) => (x < 30 ? PAL.white : x > 54 ? PAL.s3 : null)); dome.rect(37, 20, 6, 32, '#5878c2'); dome.vline(38, 20, 51, '#7a98da'); pb.stamp(dome, 0, 0); pb.line(44, 26, 64, 10, PAL.ink2); pb.line(45, 27, 65, 11, PAL.s1);
    },
  };
}
function greenhouseSpec() {
  return {
    w: 96, h: 72, wallY: 28, roof: 'm', wall: 'blue', seed: 81,
    door: { x: 41, y: 46, w: 14, h: 22, color: PAL.m0, lamp: false },
    extra: (pb, night) => {
      for (let x = 8; x < 88; x += 10) pb.vline(x, 30, 66, PAL.white);
      for (let y = 36; y < 66; y += 9) pb.hline(7, 88, y, PAL.white);
      [[14, 60], [26, 58], [66, 60], [78, 58]].forEach(([x, y]) => { pb.disc(x, y, 3, PAL.g3); pb.set(x, y - 2, PAL.f_pink); });
    },
  };
}

// ---- capital upgrades -------------------------------------------------------------------------

function hutSpec() {
  return { w: 40, h: 40, wallY: 18, roof: 'b', wall: 'plank', seed: 91, door: { x: 13, y: 22, w: 12, h: 16, color: PAL.b0, lamp: false },
    extra: (pb) => { pb.rect(30, 26, 7, 10, PAL.k2); pb.hline(30, 36, 26, PAL.k3); pb.rect(31, 28, 5, 2, PAL.w3); } };
}
function coopSpec() {
  return { w: 52, h: 44, wallY: 20, roof: 'r', wall: 'plank', seed: 93, door: { x: 19, y: 24, w: 12, h: 18, color: PAL.k1, lamp: false },
    windows: [{ x: 6, y: 26, w: 8, h: 7 }],
    extra: (pb) => { for (let i = 0; i < 4; i++) pb.line(36 + i * 3, 41, 39 + i * 3, 30, PAL.k3); pb.hline(36, 50, 34, PAL.k4); } };
}
function barnSpec() {
  return { w: 72, h: 60, wallY: 24, roof: 'r', wall: 'pink', beams: true, seed: 95, gable: 18,
    door: { x: 26, y: 34, w: 20, h: 24, color: '#c45650', lamp: true },
    extra: (pb) => { pb.line(26, 34, 45, 57, PAL.c3); pb.line(45, 34, 26, 57, PAL.c3); pb.rect(6, 36, 12, 10, PAL.y2); for (let y = 37; y < 46; y += 2) pb.hline(6, 17, y, PAL.y1); } };
}
