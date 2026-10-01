// Lantern Hollow — trees, bushes, flowers, critters, crops and fish.

// ---- trees --------------------------------------------------------------------------
// Canopies are clusters of soft lumps lit from the upper left, with a coloured
// (never black) outline. Trunk and canopy are separate so canopies can sway.

const LEAF = {
  oak:     ['#3f7458', '#57915c', '#77ad64', '#9ccb74', '#c6e391'],
  blossom: ['#c0627f', '#e2879f', '#f7aec1', '#ffd0dc', '#fff0f4'],
  lilac:   ['#7a5ba8', '#9b7ccb', '#bea0e8', '#dbc6f8', '#f4ecff'],
  maple:   ['#a4473b', '#cf6a42', '#ec9150', '#f8b867', '#ffe0a0'],
  fruit:   ['#3f7458', '#57915c', '#77ad64', '#9ccb74', '#c6e391'],
  willow:  ['#4f7f56', '#6c9c5f', '#8fbb6c', '#b2d488', '#d6eca8'],
  birch:   ['#5e8f4f', '#7aab5c', '#9fc96d', '#c2df86', '#e2f2ac'],
};

function canopyPB(kind, rnd, w, h, lumps) {
  const T = LEAF[kind], pb = new PB(w, h);
  lumps.forEach(([x, y, r]) => pb.disc(x, y, r, T[1]));
  const lit = new PB(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!pb.has(x, y)) continue;
    let best = 0, under = 0;
    for (const [lx, ly, r] of lumps) {
      const dx = (x + 0.5 - (lx - r * 0.38)) / r, dy = (y + 0.5 - (ly - r * 0.42)) / r;
      best = Math.max(best, 1 - Math.hypot(dx, dy));
      const ux = (x + 0.5 - lx) / r, uy = (y + 0.5 - (ly + r * 0.55)) / r;
      if (ux * ux + uy * uy < 0.45) under++;
    }
    const v = best + (dither(x, y) - 0.5) * 0.16;
    let c = v > 0.66 ? T[4] : v > 0.44 ? T[3] : v > 0.18 ? T[2] : T[1];
    if (under && v < 0.2 && y > h * 0.55) c = T[0];
    lit.set(x, y, c);
  }
  // little leaf highlights
  for (let i = 0; i < Math.floor(w * h / 60); i++) {
    const x = Math.floor(rnd() * w), y = Math.floor(rnd() * h * 0.7);
    if (lit.has(x, y) && lit.has(x + 1, y)) { lit.set(x, y, T[4]); if (rnd() < 0.5) lit.set(x + 1, y, T[3]); }
  }
  return lit;
}

function trunkPB(w, h, x, top, bottom, birch) {
  const pb = new PB(w, h), c = birch ? ['#f4efe8', '#d9d0c6', '#8a7d78'] : [PAL.k2, PAL.k1, PAL.k0];
  pb.rect(x, top, 6, bottom - top, c[1]);
  pb.vline(x + 1, top, bottom - 1, c[0]); pb.vline(x + 5, top, bottom - 1, c[2]);
  pb.hline(x - 2, x + 7, bottom - 1, c[1]); pb.set(x - 1, bottom - 2, c[1]); pb.set(x + 6, bottom - 2, c[2]);
  if (birch) for (let y = top + 2; y < bottom - 2; y += 4) { pb.set(x + 2, y, '#4b4259'); pb.set(x + 3, y + 1, '#4b4259'); }
  else { pb.set(x + 3, top + 4, PAL.k0); pb.set(x + 2, top + 8, PAL.k0); }
  return pb.outlineAuto(0.5);
}

// Returns { trunk, canopy, w, h, ax, ay, sway } with the base of the trunk at (ax, ay).
function makeTree(kind, seed) {
  const rnd = mulberry32(seed);
  if (kind === 'pine') {
    const pb = new PB(36, 52), T = ['#2f5b52', '#3f7458', '#57915c', '#77ad64', '#a8d184'];
    pb.rect(16, 42, 4, 9, PAL.k1); pb.vline(16, 42, 50, PAL.k2);
    for (let tier = 0; tier < 4; tier++) {
      const top = 3 + tier * 9, half = 6 + tier * 3.2;
      for (let y = 0; y < 13; y++) {
        const s = Math.round((y / 12) * half + Math.sin(y * 1.7 + tier) * 0.6);
        for (let x = 18 - s; x <= 18 + s; x++) {
          const rel = (x - (18 - s)) / (2 * s + 1);
          let c = rel < 0.35 ? T[3] : rel < 0.75 ? T[2] : T[1];
          if (y > 10) c = T[1];
          if (y === 12 && (x + tier) % 3 === 0) c = T[0];
          pb.set(x, top + y, c);
        }
      }
      pb.set(14 - tier, top + 6, T[4]); pb.set(15 - tier, top + 5, T[4]);
    }
    if (rnd() < 0.3) [[12, 20], [22, 30], [15, 36]].forEach(([x, y]) => pb.set(x, y, '#fff8ea'));
    const cv = pb.outlineAuto(0.5).canvas();
    return { trunk: null, canopy: cv, w: 36, h: 52, ax: 18, ay: 50, sway: 0 };
  }
  if (kind === 'willow') {
    const w = 50, h = 54;
    const can = canopyPB('willow', rnd, w, h, [[25, 16, 13], [14, 20, 9], [36, 20, 9], [25, 8, 9]]);
    const T = LEAF.willow;
    for (let i = 0; i < 16; i++) {
      const x = 6 + i * 2.6 + rnd() * 2, len = 12 + rnd() * 16, y0 = 18 + rnd() * 6;
      for (let y = 0; y < len; y++) { const xx = Math.round(x + Math.sin(y * 0.25) * 1.2); can.set(xx, y0 + y, y > len - 3 ? T[3] : i % 2 ? T[2] : T[1]); }
    }
    can.outlineAuto(0.45);
    return { trunk: trunkPB(w, h, 22, 30, 53).canvas(), canopy: can.canvas(), w, h, ax: 25, ay: 52, sway: 1 };
  }
  const w = 42, h = 50;
  const lumps = [[21, 22, 13], [10, 26, 8], [32, 26, 8], [21, 10, 9], [13, 15, 8], [29, 15, 8]].map(([x, y, r]) => [x + Math.round((rnd() - 0.5) * 2), y + Math.round((rnd() - 0.5) * 2), r]);
  const can = canopyPB(kind, rnd, w, h, lumps);
  if (kind === 'fruit') {
    const fc = rnd() < 0.5 ? '#ff6f6f' : '#ffad5c';
    for (let i = 0; i < 9; i++) { const x = 6 + Math.floor(rnd() * 30), y = 10 + Math.floor(rnd() * 22); if (can.has(x, y) && can.has(x + 1, y + 1)) { can.rect(x, y, 2, 2, fc); can.set(x, y, '#fff2e0'); } }
  }
  if (kind === 'blossom' || kind === 'lilac') {
    for (let i = 0; i < 26; i++) { const x = Math.floor(rnd() * w), y = Math.floor(rnd() * 36); if (can.has(x, y)) can.set(x, y, '#ffffff'); }
  }
  can.outlineAuto(0.45);
  return { trunk: trunkPB(w, h, 18, 30, 49, kind === 'birch').canvas(), canopy: can.canvas(), w, h, ax: 21, ay: 48, sway: 1 };
}

// ---- bushes and flowers ---------------------------------------------------------------

function bushSprite(kind, seed) {
  const rnd = mulberry32(seed), pb = new PB(22, 16);
  const T = kind === 'hydrangea' ? null : LEAF.oak;
  [[7, 10, 5.5], [15, 10, 5.5], [11, 7, 5]].forEach(([x, y, r]) => pb.disc(x, y, r, PAL.g2));
  pb.paint((x, y) => (y < 7 && x < 13 ? PAL.g4 : y > 12 ? PAL.g1 : x > 15 ? PAL.g2 : PAL.g3));
  pb.set(8, 4, PAL.g5); pb.set(6, 6, PAL.g5);
  if (kind === 'hydrangea') {
    const c = rnd() < 0.5 ? ['#9fc8ff', '#c9e0ff', '#7aa6ea'] : ['#ffb3d1', '#ffd6e6', '#e98cb5'];
    for (let i = 0; i < 7; i++) {
      const x = 4 + Math.floor(rnd() * 14), y = 4 + Math.floor(rnd() * 8);
      pb.disc(x, y, 1.8, c[0]); pb.set(x - 1, y - 1, c[1]); pb.set(x + 1, y + 1, c[2]);
    }
  } else if (kind === 'berry') {
    for (let i = 0; i < 6; i++) { const x = 4 + Math.floor(rnd() * 14), y = 5 + Math.floor(rnd() * 7); if (pb.has(x, y)) { pb.set(x, y, '#ef5f7f'); pb.set(x + 1, y, '#c94068'); } }
  } else if (kind === 'flower') {
    const fc = [PAL.f_white, PAL.f_yellow, PAL.f_pink][Math.floor(rnd() * 3)];
    for (let i = 0; i < 8; i++) { const x = 4 + Math.floor(rnd() * 14), y = 4 + Math.floor(rnd() * 8); if (pb.has(x, y)) pb.set(x, y, fc); }
  }
  return pb.outlineAuto(0.5).canvas();
}

function flowerPatchSprite(kind, seed) {
  const rnd = mulberry32(seed), pb = new PB(20, 16);
  const colors = { tulip: ['#ff7f9e', '#ffd36e', '#ffffff', '#c9a8ff'], lavender: ['#a98ade', '#c6a9f0'], sunflower: ['#ffd36e'], rose: ['#ef5f7f', '#ffa4c4'] }[kind];
  const n = kind === 'sunflower' ? 3 : 6;
  for (let i = 0; i < n; i++) {
    const x = 3 + Math.floor((i / n) * 14 + rnd() * 2), h = kind === 'sunflower' ? 9 + Math.floor(rnd() * 3) : 4 + Math.floor(rnd() * 4);
    const c = colors[Math.floor(rnd() * colors.length)];
    pb.vline(x, 15 - h, 15, PAL.g1);
    pb.set(x - 1, 15 - Math.floor(h / 2), PAL.g3); pb.set(x + 1, 14 - Math.floor(h / 3), PAL.g3);
    const top = 15 - h;
    if (kind === 'tulip') { pb.rect(x - 1, top - 2, 3, 3, c); pb.set(x, top - 3, c); pb.set(x - 1, top - 2, shade(c, 0.3)); }
    else if (kind === 'lavender') { for (let k = 0; k < 4; k++) pb.set(x + (k % 2), top - k, k % 2 ? colors[1] : colors[0]); }
    else if (kind === 'sunflower') { pb.disc(x, top - 2, 2.6, c); pb.disc(x, top - 2, 1.2, PAL.k1); }
    else { pb.disc(x, top - 1, 1.5, c); pb.set(x, top - 1, shade(c, -0.2)); }
  }
  return pb.outlineAuto(0.5).canvas();
}

function rockSprite(seed, mossy) {
  const rnd = mulberry32(seed), pb = new PB(16, 12);
  pb.ellipse(8, 7, 6.5 + rnd(), 4.2, PAL.s2);
  pb.paint((x, y) => (y < 5 && x < 9 ? PAL.s3 : y > 8 ? PAL.s1 : null));
  pb.set(5, 4, PAL.s4); pb.set(6, 4, PAL.s4);
  if (mossy) { pb.hline(4, 9, 3, PAL.g3); pb.set(5, 3, PAL.g4); pb.set(10, 4, PAL.g3); }
  return pb.outlineAuto(0.55).canvas();
}

function stumpSprite() {
  const pb = new PB(16, 12);
  pb.rect(3, 4, 10, 6, PAL.k2); pb.vline(3, 4, 9, PAL.k3); pb.vline(12, 4, 9, PAL.k1);
  pb.ellipse(8, 4, 5, 2, PAL.k4); pb.ellipse(8, 4, 2.5, 1, PAL.k3); pb.hline(2, 13, 10, PAL.k1);
  pb.set(4, 2, '#ff8f8f'); pb.set(5, 2, '#ff8f8f'); pb.set(4, 3, '#fff8ea');
  return pb.outlineAuto(0.55).canvas();
}

function reedSprite(seed) {
  const rnd = mulberry32(seed), pb = new PB(12, 18);
  for (let i = 0; i < 4; i++) {
    const x = 2 + i * 2 + Math.floor(rnd() * 2), h = 8 + Math.floor(rnd() * 8);
    pb.vline(x, 17 - h, 17, i % 2 ? PAL.g2 : PAL.g3);
    if (rnd() < 0.6) pb.vline(x, 17 - h, 17 - h + 2, PAL.k1);
  }
  return pb.outlineAuto(0.5).canvas();
}

function lilySprite(seed, flower) {
  const pb = new PB(12, 8);
  pb.ellipse(6, 4, 5, 3, PAL.g3); pb.set(6, 1, 0); pb.set(6, 2, 0); pb.set(7, 2, 0);
  pb.paint((x, y) => (y >= 5 ? PAL.g2 : y <= 2 ? PAL.g4 : null));
  if (flower) { pb.disc(4, 3, 1.4, '#ffd0dc'); pb.set(4, 3, PAL.f_yellow); }
  return pb.outlineAuto(0.45).canvas();
}

// ---- critters (two frames each) -------------------------------------------------------

function critterFrames(kind) {
  const frames = [];
  for (let f = 0; f < 2; f++) {
    const pb = new PB(14, 12);
    if (kind === 'duck' || kind === 'duckling') {
      const s = kind === 'duckling' ? 0.7 : 1, body = kind === 'duckling' ? '#ffe57f' : '#fffaf2';
      pb.ellipse(7, 8, 5 * s, 3 * s, body); pb.disc(4, 8 - 4 * s, 2.4 * s, body);
      pb.set(2 - (s < 1 ? 0 : 1), Math.round(8 - 4 * s), '#ffad5c'); pb.set(1 - (s < 1 ? -1 : 0), Math.round(8 - 4 * s), '#ffad5c');
      pb.set(4, Math.round(7 - 4 * s), PAL.ink);
      pb.set(11 - (s < 1 ? 2 : 0), Math.round(7 - f), body);
      if (kind === 'duck') { pb.hline(5, 10, 7, '#e6e2ef'); pb.set(9, 6, '#e6e2ef'); }
      pb.hline(3, 11, 10 + f, PAL.w4);
    } else if (kind === 'frog') {
      pb.ellipse(7, 8, 4, 2.6, '#86cf68'); pb.disc(5, 6, 1.6, '#86cf68'); pb.disc(9, 6, 1.6, '#86cf68');
      pb.set(5, 6, PAL.ink); pb.set(9, 6, PAL.ink); pb.hline(5, 9, 9, '#5ea95a');
      if (f) { pb.set(3, 10, '#86cf68'); pb.set(11, 10, '#86cf68'); }
    } else if (kind === 'bird') {
      pb.ellipse(7, 8, 3.2, 2.4, '#b9876a'); pb.disc(9, 6, 2, '#b9876a'); pb.set(10, 5, PAL.ink); pb.set(12, 6, '#ffad5c');
      pb.hline(5, 8, 9, '#fff0dc'); pb.set(4, 7 - f, '#8a6450'); pb.set(3, 6 - f, '#8a6450');
      pb.set(6, 11, '#c18a47'); pb.set(8, 11, '#c18a47');
    } else if (kind === 'cat') {
      pb.ellipse(7, 9, 5, 2.6, '#ffb46a'); pb.disc(3, 7, 2.5, '#ffb46a'); pb.dots([[1, 5], [2, 4], [4, 4], [5, 5]], '#ffb46a');
      pb.dots([[2, 7], [4, 7]], PAL.ink); pb.dots([[7, 7], [9, 7]], '#e8954c');
      pb.dots([[11, 9], [12, 8], [12, 7], [11, 6]], '#ffb46a');
      if (f) pb.set(7, 6, '#ffb46a');
    } else if (kind === 'chick') {
      pb.disc(7, 8, 3, '#ffe57f'); pb.set(9, 7, PAL.ink); pb.set(10, 8, '#ffad5c'); pb.set(5, 7 - f, '#fff2b8');
      pb.set(6, 11, '#ffad5c'); pb.set(8, 11, '#ffad5c');
    }
    frames.push(pb.outlineAuto(0.55).canvas());
  }
  return frames;
}

// ---- crops ---------------------------------------------------------------------------

const CROPS = {
  turnip:     { name: 'Turnip',     days: 2, sell: 8,  seed: 4,  color: '#f3e6ee' },
  carrot:     { name: 'Carrot',     days: 3, sell: 12, seed: 6,  color: '#ff9a4d' },
  strawberry: { name: 'Strawberry', days: 3, sell: 16, seed: 8,  color: '#ff5f6f' },
  tomato:     { name: 'Tomato',     days: 4, sell: 20, seed: 10, color: '#ff6f5a' },
  corn:       { name: 'Corn',       days: 4, sell: 22, seed: 10, color: '#ffd36e' },
  blueberry:  { name: 'Blueberries', days: 4, sell: 24, seed: 12, color: '#6f8fe8' },
  pumpkin:    { name: 'Pumpkin',    days: 5, sell: 36, seed: 15, color: '#ff9a3c' },
  sunflower:  { name: 'Sunflower',  days: 5, sell: 30, seed: 14, color: '#ffd36e' },
};

const _cropCache = new Map();
function cropSprite(type, stage) {
  const key = type + stage;
  if (_cropCache.has(key)) return _cropCache.get(key);
  const pb = new PB(16, 26), L = '#93d46d', D = '#5f975c', c = CROPS[type].color;
  if (stage === 0) { pb.hline(5, 10, 23, PAL.k0); pb.dots([[6, 22], [9, 22]], PAL.p3); }
  else if (stage === 1) { pb.vline(8, 20, 23, D); pb.hline(6, 7, 20, L); pb.hline(9, 10, 19, L); pb.set(7, 19, L); }
  else if (type === 'sunflower' || type === 'corn') {
    const top = stage === 2 ? 14 : 5;
    pb.vline(8, top + 3, 23, D); pb.vline(7, top + 6, 23, D);
    for (let y = top + 6; y < 22; y += 4) { pb.hline(4, 6, y, L); pb.hline(9, 11, y - 2, L); }
    if (stage === 3 && type === 'sunflower') { pb.disc(8, top + 2, 3.4, c); pb.disc(8, top + 2, 1.6, PAL.k1); pb.set(6, top, '#fff3c0'); }
    if (stage === 3 && type === 'corn') { pb.ellipse(10, top + 8, 1.6, 3.6, c); pb.set(10, top + 5, '#fff3c0'); pb.vline(10, top + 2, top + 4, '#e8c98a'); }
    if (stage === 2) pb.disc(8, top + 2, 1.6, L);
  } else if (type === 'pumpkin') {
    pb.ellipse(8, 20, 6, 3, D); pb.ellipse(8, 19, 5, 2, L);
    if (stage === 3) { pb.ellipse(8, 20, 5, 3.5, c); pb.vline(6, 18, 22, '#e07a2c'); pb.vline(10, 18, 22, '#e07a2c'); pb.set(5, 18, '#ffc48a'); pb.rect(8, 15, 1, 2, D); }
  } else {
    const big = stage === 3;
    pb.ellipse(8, 20, big ? 5.5 : 4.5, big ? 3.4 : 2.8, D); pb.ellipse(8, 19, big ? 4.5 : 3.5, 2.2, L); pb.set(6, 18, '#c4f0a0');
    if (type === 'tomato' || type === 'blueberry') pb.vline(8, 11, 19, D);
    if (big) {
      if (type === 'turnip') { pb.ellipse(8, 23, 3, 2.2, c); pb.hline(7, 9, 22, '#d97aa6'); pb.set(6, 23, '#ffffff'); }
      if (type === 'carrot') { pb.poly([[6, 21], [10, 21], [8, 25]], c); pb.set(7, 21, '#ffc48a'); }
      if (type === 'strawberry' || type === 'tomato' || type === 'blueberry') {
        const pts = type === 'tomato' ? [[5, 13], [10, 15], [7, 17]] : [[4, 20], [11, 19], [8, 21], [10, 22]];
        pts.forEach(([x, y]) => { pb.rect(x, y, 2, 2, c); pb.set(x, y, mix(c, '#ffffff', 0.5)); });
      }
    }
  }
  const cv = pb.outlineAuto(0.55).canvas();
  _cropCache.set(key, cv);
  return cv;
}

// ---- fish ------------------------------------------------------------------------------

const FISH = [
  { id: 'minnow',   name: 'Minnow',          body: '#b9c9d6', belly: '#f4f8fb', rare: 1, len: [4, 8],   bits: 3,  where: 'any',   hint: 'Tiny and everywhere.' },
  { id: 'bluegill', name: 'Bluegill',        body: '#6f8fd8', belly: '#ffb46a', rare: 1, len: [10, 22], bits: 5,  where: 'any',   hint: 'Common. Bites any time.' },
  { id: 'perch',    name: 'Yellow Perch',    body: '#e3c45a', belly: '#fff6dc', rare: 1, len: [15, 28], bits: 6,  where: 'pond',  hint: 'Pond, any time.', stripes: true },
  { id: 'goldfish', name: 'Goldfish',        body: '#ff9a4d', belly: '#ffe0b0', rare: 2, len: [6, 14],  bits: 10, where: 'pond',  hint: 'Pond, in the morning.', when: 'morning' },
  { id: 'carp',     name: 'Pond Carp',       body: '#b9875c', belly: '#efd8b0', rare: 2, len: [30, 60], bits: 12, where: 'pond',  hint: 'Pond, in the afternoon.', when: 'day' },
  { id: 'trout',    name: 'Rainbow Trout',   body: '#8fa79a', belly: '#ffc0d4', rare: 2, len: [25, 45], bits: 14, where: 'river', hint: 'River, any time.', stripe: true },
  { id: 'salmon',   name: 'Sunset Salmon',   body: '#ff8f7a', belly: '#ffd8c8', rare: 3, len: [50, 80], bits: 26, where: 'river', hint: 'River, at dusk.', when: 'dusk' },
  { id: 'catfish',  name: 'Catfish',         body: '#7b7488', belly: '#c9c2d6', rare: 2, len: [40, 70], bits: 16, where: 'any',   hint: 'Bites at night.', when: 'night', whiskers: true },
  { id: 'koi',      name: 'Golden Koi',      body: '#ffd36e', belly: '#fff6d0', rare: 3, len: [40, 70], bits: 30, where: 'pond',  hint: 'Pond, only at night.', when: 'night', spots: true },
  { id: 'moonfish', name: 'Moonfish',        body: '#c8d8ff', belly: '#ffffff', rare: 3, len: [20, 35], bits: 40, where: 'river', hint: 'River, at night, very rare.', when: 'night', glow: true },
  { id: 'semi',     name: 'Lost Semicolon',  junk: true, rare: 1, bits: 1, where: 'any', hint: 'Someone dropped it.', quip: 'That explains the error on line 12.' },
  { id: 'boot',     name: 'Soggy Boot',      junk: true, rare: 1, bits: 1, where: 'any', hint: 'Not a fish.', quip: 'There is a Java textbook inside. Also soggy.' },
  { id: 'bottle',   name: 'Message Bottle',  junk: true, rare: 2, bits: 5, where: 'any', hint: 'Has a note inside.', quip: 'The note says: "Read the whole error message."' },
];

const _fishCache = new Map();
function fishSprite(f) {
  if (_fishCache.has(f.id)) return _fishCache.get(f.id);
  let pb;
  if (f.id === 'semi') {
    pb = new PB(12, 18); pb.disc(6, 4, 2.5, PAL.ink2); pb.disc(6, 11, 2.5, PAL.ink2); pb.rect(6, 13, 2, 2, PAL.ink2); pb.rect(5, 15, 2, 1, PAL.ink2);
    pb.set(5, 3, PAL.s3); pb.set(5, 10, PAL.s3);
  } else if (f.id === 'boot') {
    pb = new PB(18, 16); pb.rect(4, 1, 7, 10, PAL.k2); pb.rect(4, 9, 12, 4, PAL.k2); pb.hline(4, 15, 13, PAL.k0); pb.vline(10, 1, 8, PAL.k1); pb.set(6, 4, PAL.k4);
  } else if (f.id === 'bottle') {
    pb = new PB(10, 18); pb.rect(2, 6, 6, 10, '#9fe0c8'); pb.rect(3, 2, 4, 4, '#9fe0c8'); pb.rect(3, 1, 4, 1, PAL.k2); pb.rect(3, 8, 4, 5, '#fff8ea'); pb.set(3, 7, '#d6fff0');
  } else {
    pb = new PB(24, 14);
    const dark = shade(f.body, -0.3), light = shade(f.body, 0.3), long = f.id === 'trout' || f.id === 'salmon' || f.id === 'catfish';
    pb.ellipse(11, 7, long ? 9 : 7.6, long ? 3.6 : 4.2, f.body);
    pb.paint((x, y) => (y >= 8 ? f.belly : null));
    pb.poly([[18, 7], [23, 2], [23, 12]], dark); pb.poly([[8, 3], [13, 0], [14, 3]], dark);
    pb.set(5, 6, PAL.ink); pb.set(5, 5, '#ffffff'); pb.hline(6, 11, 4, light);
    if (f.stripes) for (let x = 9; x <= 15; x += 3) pb.vline(x, 4, 8, dark);
    if (f.stripe) pb.hline(5, 17, 7, '#ff8fb0');
    if (f.spots) [[10, 4, PAL.f_orange], [13, 6, '#ffffff'], [8, 8, PAL.f_orange], [15, 4, PAL.f_orange]].forEach(([x, y, c]) => pb.set(x, y, c));
    if (f.whiskers) pb.dots([[2, 8], [1, 9], [3, 9]], dark);
    if (f.glow) pb.paint((x, y, v) => ((x + y) % 5 === 0 ? '#ffffff' : null));
  }
  const cv = pb.outlineAuto(0.55).canvas();
  _fishCache.set(f.id, cv);
  return cv;
}
