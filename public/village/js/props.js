// Lantern Hollow — props, furniture and item icons.

const oa = (pb) => pb.outlineAuto(0.55).canvas();

// ---- outdoor props --------------------------------------------------------------------

function lampPostSprite(lit, flick) {
  const pb = new PB(12, 32);
  pb.rect(5, 12, 2, 18, '#4b4259'); pb.vline(5, 12, 29, '#6f6886');
  pb.rect(3, 28, 6, 3, '#4b4259'); pb.hline(3, 8, 28, '#6f6886');
  pb.hline(4, 7, 1, '#4b4259'); pb.hline(3, 8, 2, '#4b4259'); pb.set(5, 0, '#4b4259'); pb.set(6, 0, '#4b4259');
  pb.rect(3, 3, 6, 7, lit ? PAL.glow : '#8f88a8');
  if (lit) { pb.rect(4, 4, 4, 5, PAL.warm); pb.vline(5 + (flick ? 1 : 0), 5, 7, '#ffffff'); }
  else { pb.rect(4, 4, 4, 5, '#6f6886'); pb.set(4, 4, '#bdb5c6'); }
  pb.hline(3, 8, 10, '#4b4259'); pb.hline(2, 9, 11, '#4b4259');
  pb.set(2, 12, '#4b4259'); pb.set(9, 12, '#4b4259');
  return oa(pb);
}

function benchSprite(color) {
  const pb = new PB(30, 18), c = color || PAL.k3, d = shade(c, -0.25), l = shade(c, 0.2);
  pb.rect(1, 2, 28, 3, c); pb.hline(1, 28, 2, l); pb.hline(1, 28, 4, d);
  pb.rect(1, 8, 28, 3, c); pb.hline(1, 28, 8, l); pb.hline(1, 28, 10, d);
  [3, 25].forEach((x) => { pb.rect(x, 5, 2, 3, '#4b4259'); pb.rect(x, 11, 2, 6, '#4b4259'); });
  return oa(pb);
}

function picketSprite(vertical) {
  if (vertical) { const pb = new PB(6, 20); pb.rect(1, 1, 3, 18, PAL.white); pb.vline(3, 1, 18, PAL.s3); pb.set(2, 0, PAL.white); return oa(pb); }
  const pb = new PB(16, 14);
  pb.rect(0, 5, 16, 2, PAL.s4); pb.rect(0, 9, 16, 2, PAL.s4); pb.hline(0, 15, 6, PAL.s3); pb.hline(0, 15, 10, PAL.s3);
  [1, 6, 11].forEach((x) => { pb.rect(x, 2, 3, 11, PAL.white); pb.set(x + 1, 1, PAL.white); pb.vline(x + 2, 2, 12, PAL.s3); });
  return oa(pb);
}

function mailboxSprite(color, flag) {
  const pb = new PB(12, 20), c = color || PAL.b1;
  pb.rect(5, 9, 2, 10, PAL.k1); pb.hline(3, 8, 18, PAL.k1);
  pb.rect(1, 3, 9, 7, c); pb.hline(2, 8, 2, c); pb.hline(1, 9, 9, shade(c, -0.3)); pb.hline(2, 7, 3, shade(c, 0.25));
  pb.rect(1, 6, 2, 3, PAL.ink2);
  if (flag) { pb.vline(10, 1, 6, PAL.k0); pb.rect(10, 1, 2, 2, PAL.f_red); }
  return oa(pb);
}

function fountainSprite(level = 1) {
  const pb = new PB(60, 70), Y = 20; // extra headroom for the lantern tower
  pb.ellipse(30, Y + 36, 28, 12, PAL.s2); pb.ellipse(30, Y + 34, 27, 10.5, PAL.s3); pb.ellipse(30, Y + 34, 23, 8, PAL.w2);
  pb.paint((x, y, v) => (v === col(PAL.w2) && y < Y + 31 ? PAL.w1 : null));
  for (let x = 6; x < 55; x += 6) pb.set(x, Y + 40 + (x % 12 === 0 ? 1 : 0), PAL.s1);
  if (level >= 2) for (let x = 5; x < 56; x += 7) { const yy = Y + 38 + Math.round(Math.sin(x) * 1); pb.set(x, yy, [PAL.f_pink, PAL.f_yellow, PAL.f_white][x % 3]); pb.set(x + 1, yy, PAL.g3); }
  const top = level >= 3 ? Y - 16 : Y + 6;
  pb.rect(27, top + 8, 6, Y + 34 - top - 8, PAL.s3); pb.vline(27, top + 8, Y + 33, PAL.s4); pb.vline(32, top + 8, Y + 33, PAL.s1);
  pb.ellipse(30, Y + 15, 10, 3.5, PAL.s3); pb.ellipse(30, Y + 14, 8, 2.4, PAL.w3); pb.hline(21, 39, Y + 17, PAL.s1);
  if (level === 1) { pb.rect(28, Y + 6, 4, 8, PAL.s4); pb.disc(30, Y + 5, 2.4, PAL.s4); pb.set(29, Y + 4, PAL.white); }
  else {
    // a golden lantern crowns the fountain (and a tall tower at level 3)
    const ly = level >= 3 ? Y - 22 : Y - 1;
    if (level >= 3) { pb.rect(25, ly + 8, 10, 4, PAL.gold2); for (let yy = ly + 12; yy < Y + 12; yy += 6) pb.hline(27, 32, yy, PAL.gold); }
    pb.hline(28, 31, ly, '#4b4259'); pb.rect(26, ly + 1, 8, 7, PAL.gold2); pb.rect(27, ly + 2, 6, 5, PAL.glow); pb.rect(28, ly + 3, 4, 3, PAL.warm);
    pb.hline(26, 33, ly + 8, '#4b4259');
    if (level >= 3) { pb.poly([[22, ly + 1], [38, ly + 1], [30, ly - 7]], PAL.r2); pb.vline(30, ly - 10, ly - 7, PAL.gold); }
  }
  return pb.outlineAuto(0.55).canvas();
}
function lighthouseSprite() {
  const pb = new PB(24, 62);
  pb.poly([[6, 60], [18, 60], [16, 16], [8, 16]], PAL.c3);
  for (let y = 22; y < 60; y += 10) pb.poly([[8 - (y - 16) * 0.05, y], [16 + (y - 16) * 0.05, y], [16 + (y - 16) * 0.05, y + 4], [8 - (y - 16) * 0.05, y + 4]], PAL.r2);
  pb.rect(6, 10, 12, 6, '#4b4259'); pb.rect(7, 11, 10, 4, PAL.glow); pb.poly([[5, 10], [19, 10], [12, 2]], PAL.r1); pb.vline(12, 0, 2, PAL.gold);
  pb.rect(10, 50, 4, 10, PAL.k2);
  return pb.outlineAuto(0.55).canvas();
}
function signpostSprite(lines) {
  const pb = new PB(64, 30);
  pb.rect(30, 4, 3, 25, PAL.k1); pb.vline(30, 4, 28, PAL.k2);
  lines.forEach((t, i) => {
    const y = 3 + i * 8, w = textWidth(t) + 8, right = i % 2 === 0, x = right ? 29 : 34 - w;
    pb.rect(x, y, w, 7, PAL.k4); pb.hline(x, x + w - 1, y + 6, PAL.k2);
    if (right) { pb.set(x + w, y + 3, PAL.k4); pb.vline(x + w, y + 2, y + 4, PAL.k4); } else pb.vline(x - 1, y + 2, y + 4, PAL.k4);
    textPB(pb, t, x + 4, y + 1, PAL.k0);
  });
  return oa(pb);
}

function parasolTableSprite(color) {
  const pb = new PB(34, 40), c = color || '#ff8fb0';
  pb.ellipse(17, 31, 8, 3.5, PAL.white); pb.hline(10, 24, 33, PAL.s3); pb.rect(16, 33, 2, 5, PAL.k1);
  [[4, 32], [27, 32]].forEach(([x, y]) => { pb.rect(x, y, 5, 3, PAL.k3); pb.rect(x + 1, y + 3, 1, 3, PAL.k1); pb.rect(x + 3, y + 3, 1, 3, PAL.k1); });
  pb.vline(17, 8, 30, PAL.s1);
  for (let y = 0; y < 9; y++) { const s = Math.round(4 + y * 1.6); for (let x = 17 - s; x <= 17 + s; x++) pb.set(x, 2 + y, Math.floor((x - 17 + 30) / 4) % 2 ? c : PAL.cream); }
  for (let x = 3; x <= 31; x += 4) pb.set(x, 11, Math.floor((x - 17 + 30) / 4) % 2 ? c : PAL.cream);
  pb.set(15, 29, '#fff'); pb.rect(18, 28, 3, 3, '#b8794e');
  return oa(pb);
}

function crateSprite(fill) {
  const pb = new PB(16, 14);
  pb.rect(1, 3, 14, 10, PAL.k3); pb.hline(1, 14, 3, PAL.k4); pb.hline(1, 14, 8, PAL.k2); pb.hline(1, 14, 12, PAL.k2);
  pb.vline(1, 3, 12, PAL.k2); pb.vline(14, 3, 12, PAL.k2);
  const c = fill || PAL.f_red;
  [[3, 1], [6, 2], [9, 1], [11, 2], [4, 3], [8, 3]].forEach(([x, y]) => { pb.rect(x, y, 2, 2, c); pb.set(x, y, mix(c, '#fff', 0.5)); });
  return oa(pb);
}
function barrelSprite() {
  const pb = new PB(12, 15);
  pb.rect(1, 1, 10, 13, PAL.k2); pb.vline(1, 2, 12, PAL.k1); pb.vline(10, 2, 12, PAL.k1); pb.vline(3, 2, 12, PAL.k3);
  pb.hline(1, 10, 3, PAL.s1); pb.hline(1, 10, 11, PAL.s1); pb.ellipse(6, 1, 4, 1, PAL.k3);
  return oa(pb);
}
function potSprite(kind) {
  const pb = new PB(12, 16);
  pb.poly([[2, 9], [10, 9], [9, 15], [3, 15]], '#d9845e'); pb.hline(2, 9, 9, '#f0a57c'); pb.hline(3, 9, 14, '#b56a4a');
  if (kind === 'fern') { pb.disc(6, 6, 4, PAL.g3); pb.dots([[3, 3], [9, 3], [2, 6], [10, 6]], PAL.g4); pb.set(6, 4, PAL.g5); }
  else if (kind === 'cactus') { pb.rect(5, 2, 3, 7, PAL.g2); pb.rect(3, 4, 2, 3, PAL.g2); pb.set(5, 1, PAL.f_pink); pb.set(6, 1, PAL.f_pink); pb.vline(5, 3, 7, PAL.g3); }
  else { pb.disc(6, 6, 3.6, PAL.g3); [[4, 4, PAL.f_pink], [8, 5, PAL.f_yellow], [6, 3, PAL.f_white]].forEach(([x, y, c]) => pb.set(x, y, c)); }
  return oa(pb);
}
function hayBaleSprite() { const pb = new PB(18, 13); pb.rect(1, 2, 16, 10, PAL.y2); for (let y = 3; y < 12; y += 2) pb.hline(1, 16, y, PAL.y1); pb.hline(1, 16, 2, PAL.y3); pb.vline(5, 2, 11, PAL.k1); pb.vline(12, 2, 11, PAL.k1); return oa(pb); }
function scarecrowSprite() {
  const pb = new PB(20, 32);
  pb.vline(9, 10, 31, PAL.k1); pb.vline(10, 10, 31, PAL.k2); pb.hline(1, 18, 13, PAL.k2);
  pb.rect(5, 12, 10, 9, '#8fc5ff'); pb.rect(5, 15, 10, 1, '#5878c2'); pb.dots([[7, 17], [12, 18]], '#ffd36e');
  pb.disc(10, 7, 4, '#f6e3b0'); pb.dots([[8, 7], [12, 7]], PAL.ink); pb.hline(8, 12, 9, PAL.k1);
  pb.hline(3, 17, 3, PAL.y1); pb.rect(6, 0, 8, 3, PAL.y2); pb.dots([[1, 12], [18, 12], [2, 14], [17, 14]], PAL.y2);
  return oa(pb);
}
function boatSprite() {
  const pb = new PB(30, 14);
  pb.poly([[1, 4], [29, 4], [25, 12], [5, 12]], PAL.k3); pb.hline(1, 29, 4, PAL.k4); pb.hline(5, 25, 11, PAL.k1);
  pb.rect(4, 5, 22, 3, PAL.k2); pb.hline(12, 18, 6, PAL.k4); pb.vline(9, 5, 7, PAL.k1); pb.vline(21, 5, 7, PAL.k1);
  pb.line(3, 9, 0, 13, PAL.k1);
  return oa(pb);
}
function cartSprite() {
  const pb = new PB(44, 40);
  pb.rect(4, 20, 36, 12, PAL.k3); pb.hline(4, 39, 20, PAL.k4); pb.hline(4, 39, 31, PAL.k1);
  [[8, 18, PAL.f_red], [14, 17, '#ffd36e'], [20, 18, '#a2d881'], [26, 17, '#c9a8ff'], [32, 18, PAL.f_orange]].forEach(([x, y, c]) => { pb.disc(x, y, 2.6, c); pb.set(x - 1, y - 1, mix(c, '#fff', 0.5)); });
  pb.disc(10, 33, 4, PAL.k1); pb.disc(10, 33, 2, PAL.k3); pb.disc(34, 33, 4, PAL.k1); pb.disc(34, 33, 2, PAL.k3);
  pb.vline(5, 4, 20, PAL.k1); pb.vline(38, 4, 20, PAL.k1);
  for (let x = 2; x <= 41; x++) for (let y = 2; y < 8; y++) pb.set(x, y, Math.floor((x - 2) / 5) % 2 ? '#8fc5ff' : PAL.cream);
  for (let x = 2; x <= 41; x += 5) { pb.set(x + 1, 8, '#8fc5ff'); pb.set(x + 2, 8, '#8fc5ff'); }
  return oa(pb);
}
function boardSprite() {
  const pb = new PB(40, 34);
  pb.rect(5, 20, 3, 13, PAL.k1); pb.rect(32, 20, 3, 13, PAL.k1);
  pb.rect(1, 3, 38, 20, PAL.k2); pb.rect(3, 5, 34, 16, PAL.k4);
  pb.poly([[0, 3], [20, -2], [40, 3]], PAL.r2); pb.hline(0, 39, 3, PAL.r0);
  [[5, 7, 8, 9, PAL.white], [15, 6, 9, 7, PAL.y3], [26, 8, 8, 9, PAL.b3], [10, 14, 7, 6, PAL.pk2], [20, 13, 8, 7, PAL.m3]].forEach(([x, y, w, h, c]) => {
    pb.rect(x, y, w, h, c); for (let j = 2; j < h - 1; j += 2) pb.hline(x + 1, x + w - 2, y + j, PAL.s2); pb.set(x + Math.floor(w / 2), y, PAL.f_red);
  });
  return oa(pb);
}
function chalkMenuSprite() {
  const pb = new PB(18, 24);
  pb.line(3, 22, 7, 2, PAL.k1); pb.line(14, 22, 10, 2, PAL.k1);
  pb.rect(2, 3, 14, 15, PAL.k2); pb.rect(3, 4, 12, 13, '#3d4f48');
  pb.hline(5, 12, 6, PAL.white); pb.hline(5, 10, 9, PAL.s3); pb.hline(5, 11, 12, PAL.s3); pb.set(12, 12, PAL.f_pink);
  return oa(pb);
}
function stoneSprite(text) {
  const pb = new PB(24, 22);
  pb.rect(3, 3, 18, 17, PAL.s2); pb.hline(4, 19, 2, PAL.s2); pb.vline(3, 3, 19, PAL.s3); pb.vline(20, 3, 19, PAL.s1); pb.hline(3, 20, 20, PAL.s1);
  if (text) textPB(pb, text, 12 - Math.floor(textWidth(text) / 2), 6, PAL.s0);
  pb.hline(7, 16, 13, PAL.s1); pb.hline(8, 15, 15, PAL.s1);
  return oa(pb);
}
function constructionSprite() {
  const pb = new PB(40, 30);
  for (let x = 2; x <= 38; x += 9) pb.vline(x, 4, 28, PAL.k2);
  pb.hline(1, 39, 6, PAL.k3); pb.hline(1, 39, 16, PAL.k3);
  pb.line(2, 28, 11, 6, PAL.k1); pb.line(20, 28, 29, 6, PAL.k1);
  pb.rect(12, 20, 14, 8, '#ffd36e'); for (let x = 12; x < 26; x += 4) pb.rect(x, 20, 2, 8, '#4b4259');
  return oa(pb);
}

// ---- furniture (for decorating your house) -----------------------------------------------
// size is in tiles; wall items hang on the back wall.

const FURNITURE = {
  bed:       { name: 'Cozy bed',        price: 60, size: [2, 2] },
  bedPink:   { name: 'Strawberry bed',  price: 90, size: [2, 2] },
  rug:       { name: 'Round rug',       price: 30, size: [2, 2], floor: true },
  rugStripe: { name: 'Striped rug',     price: 40, size: [3, 2], floor: true },
  desk:      { name: 'Study desk',      price: 50, size: [2, 1] },
  chair:     { name: 'Chair',           price: 15, size: [1, 1] },
  table:     { name: 'Round table',     price: 35, size: [1, 1] },
  sofa:      { name: 'Sofa',            price: 80, size: [2, 1] },
  shelf:     { name: 'Bookshelf',       price: 55, size: [2, 1] },
  plant:     { name: 'Fern',            price: 12, size: [1, 1] },
  monstera:  { name: 'Big monstera',    price: 25, size: [1, 1] },
  lamp:      { name: 'Floor lamp',      price: 30, size: [1, 1], light: true },
  record:    { name: 'Record player',   price: 70, size: [1, 1] },
  aquarium:  { name: 'Aquarium',        price: 120, size: [2, 1] },
  catbed:    { name: 'Cat bed',         price: 25, size: [1, 1] },
  window:    { name: 'Window',          price: 0,  size: [2, 1], wall: true },
  art:       { name: 'Painting',        price: 40, size: [1, 1], wall: true },
  fairy:     { name: 'Fairy lights',    price: 45, size: [3, 1], wall: true, light: true },
  clock:     { name: 'Wall clock',      price: 30, size: [1, 1], wall: true },
};

const _furnCache = new Map();
function furnitureSprite(id) {
  if (_furnCache.has(id)) return _furnCache.get(id);
  const [tw, th] = FURNITURE[id].size, w = tw * 16, h = th * 16 + 10;
  const pb = new PB(w, h), B = h - 1; // B = bottom row
  switch (id) {
    case 'bed': case 'bedPink': {
      const q = id === 'bed' ? ['#8fc5ff', '#6f9ee0', '#c8e0ff'] : ['#ffb3c8', '#f08aa8', '#ffd8e2'];
      pb.rect(1, 2, w - 2, 9, PAL.k2); pb.rect(2, 3, w - 4, 6, PAL.k3);
      pb.rect(2, 9, w - 4, B - 10, q[0]); pb.hline(2, w - 3, 9, q[2]);
      pb.rect(5, 6, 10, 5, PAL.white); pb.rect(17, 6, 10, 5, PAL.white);
      for (let y = 14; y < B - 2; y += 4) pb.hline(3, w - 4, y, q[1]);
      if (id === 'bedPink') for (let i = 0; i < 6; i++) pb.set(5 + i * 4, 16 + (i % 2) * 5, PAL.f_red);
      pb.rect(1, B - 2, w - 2, 3, PAL.k1);
      break;
    }
    case 'rug': pb.ellipse(w / 2, h / 2 + 3, w / 2 - 1, h / 2 - 5, '#f7b5c8'); pb.ellipse(w / 2, h / 2 + 3, w / 2 - 4, h / 2 - 8, '#ffd8e2'); pb.ellipse(w / 2, h / 2 + 3, 5, 3, '#f7b5c8'); break;
    case 'rugStripe': for (let y = 8; y < h - 2; y++) for (let x = 1; x < w - 1; x++) pb.set(x, y, Math.floor((y - 8) / 3) % 2 ? '#a2d881' : PAL.cream); break;
    case 'desk':
      pb.rect(1, 9, w - 2, 4, PAL.k3); pb.hline(1, w - 2, 9, PAL.k4); pb.rect(2, 13, 2, B - 13, PAL.k1); pb.rect(w - 4, 13, 2, B - 13, PAL.k1); pb.rect(20, 13, 10, 7, PAL.k2);
      pb.rect(6, 3, 10, 6, '#5f5c7d'); pb.rect(7, 4, 8, 4, '#8fe0d0'); pb.hline(5, 16, 9, '#bdb5c6');
      pb.vline(24, 2, 8, '#4b4259'); pb.rect(22, 1, 5, 3, '#ffd36e');
      break;
    case 'chair': pb.rect(3, 2, 10, 8, PAL.k3); pb.rect(2, 10, 12, 4, PAL.k4); pb.rect(3, 14, 2, B - 14, PAL.k1); pb.rect(11, 14, 2, B - 14, PAL.k1); break;
    case 'table': pb.ellipse(8, 11, 7, 4, PAL.k3); pb.ellipse(8, 10, 6, 3, PAL.k4); pb.rect(7, 14, 2, B - 14, PAL.k1); pb.hline(4, 11, B, PAL.k1); pb.rect(6, 7, 3, 3, PAL.f_pink); break;
    case 'sofa': pb.rect(1, 4, w - 2, 9, '#a98ade'); pb.rect(1, 12, w - 2, 9, '#c6a9f0'); pb.rect(0, 8, 4, 14, '#8a6fc4'); pb.rect(w - 4, 8, 4, 14, '#8a6fc4'); pb.rect(8, 9, 7, 5, '#ffe27c'); pb.hline(2, w - 3, B, PAL.k1); break;
    case 'shelf':
      pb.rect(1, 0, w - 2, B, PAL.k2); pb.rect(3, 2, w - 6, B - 4, PAL.k1);
      [4, 12, 20].forEach((y) => { pb.hline(3, w - 4, y + 6, PAL.k3); for (let x = 4; x < w - 4; x += 3) pb.rect(x, y, 2, 6, ['#ff8f8f', '#8fc5ff', '#ffe27c', '#a2d881', '#c9a8ff'][(x + y) % 5]); });
      break;
    case 'plant': case 'monstera': {
      pb.poly([[4, B - 7], [12, B - 7], [11, B], [5, B]], '#d9845e'); pb.hline(4, 11, B - 7, '#f0a57c');
      if (id === 'monstera') { [[4, 8, 5], [11, 7, 5], [8, 3, 5]].forEach(([x, y, r]) => pb.disc(x, y, r, PAL.g2)); [[3, 7], [12, 6], [8, 2]].forEach(([x, y]) => pb.set(x, y, PAL.g4)); pb.dots([[5, 9], [10, 8]], PAL.g1); }
      else { pb.disc(8, 10, 5, PAL.g3); pb.dots([[4, 7], [12, 7], [8, 5]], PAL.g4); }
      break;
    }
    case 'lamp': pb.poly([[4, 1], [12, 1], [14, 8], [2, 8]], '#ffe27c'); pb.hline(2, 13, 8, '#e0b552'); pb.vline(8, 9, B - 1, '#4b4259'); pb.hline(5, 10, B, '#4b4259'); break;
    case 'record': pb.rect(1, 10, 14, B - 10, PAL.k2); pb.rect(2, 7, 12, 4, PAL.k3); pb.ellipse(7, 8, 5, 2, '#3b2a3a'); pb.set(7, 8, PAL.f_red); pb.line(12, 5, 10, 8, PAL.s1); pb.rect(3, 14, 10, 1, PAL.k1); break;
    case 'aquarium':
      pb.rect(1, 4, w - 2, 14, '#bfe8f4'); pb.rect(2, 6, w - 4, 11, PAL.w3); pb.hline(2, w - 3, 6, PAL.w4);
      pb.hline(2, w - 3, 16, PAL.p3); pb.vline(6, 11, 15, PAL.g2); pb.vline(24, 9, 15, PAL.g3);
      pb.rect(10, 10, 4, 2, '#ff9a4d'); pb.set(14, 10, '#ff9a4d'); pb.rect(18, 12, 3, 2, '#ffd36e');
      pb.rect(1, 18, w - 2, B - 18, PAL.k2); break;
    case 'catbed': pb.ellipse(8, B - 4, 7, 4, '#ff8fb0'); pb.ellipse(8, B - 5, 5, 2.5, '#ffd8e2'); pb.ellipse(9, B - 6, 3.5, 2, '#ffb46a'); pb.dots([[6, B - 8], [7, B - 9]], '#ffb46a'); break;
    case 'window':
      pb.rect(2, 2, w - 4, 20, PAL.k1); pb.rect(4, 4, w - 8, 16, PAL.w3); pb.vline(w / 2, 4, 19, PAL.k1); pb.hline(4, w - 5, 11, PAL.k1);
      pb.rect(0, 1, 5, 22, '#ffb3c8'); pb.rect(w - 5, 1, 5, 22, '#ffb3c8'); pb.hline(1, w - 2, 22, PAL.k3); break;
    case 'art': pb.rect(2, 3, 12, 12, PAL.gold2); pb.rect(3, 4, 10, 10, PAL.b3); pb.rect(3, 10, 10, 4, PAL.g3); pb.disc(10, 7, 1.5, PAL.f_yellow); break;
    case 'fairy': for (let x = 2; x < w - 2; x++) { const y = 6 + Math.round(Math.sin((x / (w - 4)) * Math.PI) * 3); pb.set(x, y, '#4b4259'); if (x % 5 === 2) pb.rect(x, y + 1, 2, 2, [PAL.glow, PAL.f_pink, PAL.b3][x % 3]); } break;
    case 'clock': pb.disc(8, 8, 6, PAL.k2); pb.disc(8, 8, 5, PAL.cream); pb.vline(8, 4, 8, PAL.ink); pb.hline(8, 11, 8, PAL.ink); break;
  }
  const cv = oa(pb);
  _furnCache.set(id, cv);
  return cv;
}

// ---- small icons --------------------------------------------------------------------------

function coinPB() {
  const pb = new PB(10, 10);
  pb.disc(5, 5, 4.5, PAL.gold); pb.disc(5, 5, 3, PAL.gold2);
  pb.vline(5, 3, 7, PAL.glow); pb.set(4, 3, PAL.glow); pb.set(2, 2, '#fff8d8');
  return pb.outlineAuto(0.6);
}
function seedPacketPB(crop) {
  const pb = new PB(12, 14), c = CROPS[crop].color;
  pb.rect(1, 1, 10, 12, PAL.cream); pb.rect(1, 1, 10, 3, c); pb.hline(1, 10, 12, PAL.c1);
  pb.disc(6, 8, 2.5, c); pb.set(6, 5, PAL.g2); pb.set(7, 5, PAL.g3);
  return pb.outlineAuto(0.6);
}
function lanternIconPB(lit) {
  const pb = new PB(8, 11);
  pb.hline(2, 5, 0, '#4b4259'); pb.rect(1, 1, 6, 1, '#4b4259');
  pb.rect(1, 2, 6, 6, lit ? PAL.glow : '#8f88a8');
  if (lit) { pb.rect(2, 3, 4, 4, PAL.warm); pb.set(3, 4, '#ffffff'); }
  pb.rect(1, 8, 6, 1, '#4b4259'); pb.set(3, 9, '#4b4259'); pb.set(4, 9, '#4b4259'); pb.set(3, 10, '#4b4259'); pb.set(4, 10, '#4b4259');
  return pb.outlineAuto(0.5);
}
function iconURL(src, scale) {
  const cv = src instanceof PB ? src.canvas() : src;
  return upscale(cv, scale).toDataURL();
}
