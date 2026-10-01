// Lantern Hollow — terrain. The map is described as shapes (paths, plaza, pond,
// river, hill), then painted pixel by pixel into one ground image.

const MW = 64, MH = 48, MPX = MW * TILE, MPY = MH * TILE;
const T = (v) => v * TILE;

// ---- the shapes, in tiles --------------------------------------------------------

// The hill's cliff edge, in tiles, as a function of x (in tiles).
function cliffY(xt) { return 11.3 + Math.sin(xt * 0.31) * 0.55 + Math.sin(xt * 0.13 + 1) * 0.4; }
const CLIFF_H = 1.35;


const MAP = {
  plaza: { x: 30, y: 19.6, r: 4.7 },
  pond: { x: 30, y: 30.6, rx: 6.4, ry: 3.9 },
  spring: { x: 46.3, rx: 1.7, ry: 0.85 },
  river: [[46.3, 12.2], [46.6, 14], [48.2, 19.6], [50.3, 25], [49.4, 31.5], [51.2, 37.5], [54.5, 43], [56.5, 49]],
  riverW: 1.25,
  stairs: { x0: 29.7, x1: 31.4 },
  bridge: { x0: 46.6, x1: 51.4, y: 19.7 },
  dock: { x0: 29.4, x1: 30.7, y0: 26.2, y1: 28.6 },
  farm: { x0: 3, y0: 22, x1: 10, y1: 28, plots: { x0: 4, y0: 23, x1: 8, y1: 26 } },
  paths: [
    { w: 1.05, pts: [[1.5, 19.6], [10, 19.6], [18, 19.5], [26, 19.6]] },
    { w: 1.05, pts: [[34, 19.6], [40, 19.6], [45.6, 19.7], [47, 19.7]] },
    { w: 0.95, pts: [[52.2, 19.8], [56, 19.2], [60, 17.5], [63.5, 16.5]], meadow: true },
    { w: 0.8, pts: [[30.5, 15.4], [30.55, cliffY(30.55) + CLIFF_H - 0.15]] },
    { w: 0.75, pts: [[30.55, cliffY(30.55) + 0.3], [30.6, 10.3], [32, 10.1]] },
    { w: 0.7, pts: [[30, 24], [30, 26.6]] },
    { w: 0.8, pts: [[11.5, 20], [11, 25], [11.8, 31], [11.3, 38], [12, 44.6]] },
    { w: 0.85, pts: [[12, 44.6], [20, 44.9], [30, 44.7], [38, 44.9], [43.4, 44.5]] },
    { w: 0.8, pts: [[43.4, 44.5], [43.7, 38], [42.6, 31], [43.3, 25], [42.8, 20]] },
    { w: 0.5, pts: [[6, 17.4], [6, 19]] }, { w: 0.5, pts: [[12.5, 17.4], [12.5, 19]] },
    { w: 0.55, pts: [[19.5, 17.4], [19.5, 19]] }, { w: 0.55, pts: [[39, 17.4], [39, 19]] },
    { w: 0.5, pts: [[15.8, 31.4], [15.8, 32.6], [11.8, 32.8]] },
    { w: 0.5, pts: [[39.5, 31.4], [39.5, 32.6], [42.8, 32.8]] },
    { w: 0.5, pts: [[6.5, 19.6], [6.5, 22.2]] },
    ...[15.5, 21.5, 27.5, 33.5, 39.5].map((x) => ({ w: 0.45, pts: [[x, 43.4], [x, 44.6]] })),
    { w: 0.6, pts: [[35, 10.2], [40, 9.8], [44, 8.6], [49, 8.9], [52.5, 9.8]], hill: true },
  ],
};


// ---- spatial lookups ---------------------------------------------------------------

// Bin path segments per tile so each pixel only measures nearby segments.
let PATH_BINS = null;
function buildPathBins() {
  PATH_BINS = Array.from({ length: MW * MH }, () => []);
  MAP.paths.forEach((p, pi) => {
    for (let i = 0; i < p.pts.length - 1; i++) {
      const [ax, ay] = p.pts[i], [bx, by] = p.pts[i + 1], pad = p.w + 1.5;
      for (let ty = Math.floor(Math.min(ay, by) - pad); ty <= Math.ceil(Math.max(ay, by) + pad); ty++)
        for (let tx = Math.floor(Math.min(ax, bx) - pad); tx <= Math.ceil(Math.max(ax, bx) + pad); tx++)
          if (tx >= 0 && ty >= 0 && tx < MW && ty < MH) PATH_BINS[ty * MW + tx].push([pi, i]);
    }
  });
}
// Distance (in px) from a pixel to the nearest path edge; negative = inside.
function pathEdge(px, py) {
  const bin = PATH_BINS[(py >> 4) * MW + (px >> 4)];
  let best = 99, meadow = false;
  if (!bin) return { d: best, meadow };
  const x = px + 0.5, y = py + 0.5;
  for (const [pi, i] of bin) {
    const p = MAP.paths[pi];
    if (p.meadow && !G_BRIDGE()) continue;
    const a = p.pts[i], b = p.pts[i + 1];
    const wob = (noise2(x / 13, y / 13, 4) - 0.5) * 3;
    const d = segDist(x, y, T(a[0]), T(a[1]), T(b[0]), T(b[1])) - T(p.w) - wob;
    if (d < best) { best = d; meadow = !!p.meadow; }
  }
  return { d: best, meadow };
}
const G_BRIDGE = () => typeof G !== 'undefined' && G.projects && G.projects.bridge && G.projects.bridge.done;

function plazaDist(px, py) { return Math.hypot(px + 0.5 - T(MAP.plaza.x), py + 0.5 - T(MAP.plaza.y)) - T(MAP.plaza.r); }

function pondVal(px, py) {
  const P = MAP.pond, ex = (px + 0.5 - T(P.x)) / T(P.rx), ey = (py + 0.5 - T(P.y)) / T(P.ry);
  const wob = (noise2(px / 20, py / 20, 3) - 0.5) * 0.14 + Math.sin(Math.atan2(ey, ex) * 3) * 0.035;
  return Math.sqrt(ex * ex + ey * ey) - 1 - wob; // < 0 inside
}
function riverDist(px, py) {
  const x = px + 0.5, y = py + 0.5;
  if (x < T(43) || y < T(cliffY(46.5) + CLIFF_H) - 6) return 99;
  let d = 1e9;
  const R = MAP.river;
  for (let i = 0; i < R.length - 1; i++) d = Math.min(d, segDist(x, y, T(R[i][0]), T(R[i][1]), T(R[i + 1][0]), T(R[i + 1][1])));
  const wob = (noise2(x / 22, y / 22, 8) - 0.5) * 6;
  return d - T(MAP.riverW) - wob; // < 0 inside
}
function isHill(px, py) { return py + 0.5 < T(cliffY((px + 0.5) / TILE)); }
function cliffFace(px, py) { const c = T(cliffY((px + 0.5) / TILE)); return py + 0.5 >= c && py + 0.5 < c + T(CLIFF_H) ? (py + 0.5 - c) / T(CLIFF_H) : -1; }
function onStairs(px) { return px >= T(MAP.stairs.x0) && px < T(MAP.stairs.x1); }
function springVal(px, py) {
  const S = MAP.spring, cy = cliffY(S.x) - S.ry - 0.15;
  const ex = (px + 0.5 - T(S.x)) / T(S.rx), ey = (py + 0.5 - T(cy)) / T(S.ry);
  return ex * ex + ey * ey - 1;
}
function waterShape(px, py) {
  if (cliffFace(px, py) >= 0) return false;
  if (isHill(px, py)) return springVal(px, py) < 0;
  return pondVal(px, py) < 0 || riverDist(px, py) < 0;
}
// Water is computed once into a mask; waterAt is then a lookup.
let WMASK = null;
function computeWater() {
  WMASK = new Uint8Array(MPX * MPY);
  for (let py = 0; py < MPY; py++) for (let px = 0; px < MPX; px++) WMASK[py * MPX + px] = waterShape(px, py) ? 1 : 0;
}
function waterAt(px, py) {
  px |= 0; py |= 0;
  if (px < 0 || py < 0 || px >= MPX || py >= MPY) return false;
  return WMASK[py * MPX + px] === 1;
}

// ---- painting -----------------------------------------------------------------------

const ROCK = ['#d8bca2', '#bf9f86', '#a1826f', '#83675b', '#684f48'];

function grassColor(px, py, hill) {
  const n = fbm(px / 46, py / 46, hill ? 21 : 1);
  const edge = Math.abs(n - 0.47) < 0.012 || Math.abs(n - 0.6) < 0.01;
  if (edge && (px + py) % 2) return PAL.g2;
  if (n > 0.6) return hill ? PAL.g4 : PAL.g4;
  if (n < 0.47) return PAL.g2;
  return PAL.g3;
}

function renderGround() {
  buildPathBins();
  if (!WMASK) computeWater();
  const pb = new PB(MPX, MPY);
  const d = pb.d;
  for (let py = 0; py < MPY; py++) for (let px = 0; px < MPX; px++) {
    let c;
    const face = cliffFace(px, py);
    const hill = isHill(px, py);
    if (face >= 0) {
      if (onStairs(px)) {
        const step = Math.floor(face * 5), sy = (face * 5) % 1;
        c = sy < 0.22 ? PAL.s4 : sy > 0.8 ? PAL.s1 : PAL.s3;
        if (px === T(MAP.stairs.x0) || px === T(MAP.stairs.x1) - 1) c = PAL.s1;
        if (step === 0 && sy < 0.3) c = PAL.s4;
      } else {
        const strata = Math.floor(face * 4 + noise2(px / 9, py / 4, 12) * 0.9);
        c = ROCK[clamp(strata, 0, 4)];
        if (hash2(px >> 2, Math.floor(face * 6), 13) > 0.86) c = shade(c, 0.12);
        if (face < 0.12 + noise2(px / 4, 0, 14) * 0.18) c = noise2(px / 3, py, 15) > 0.5 ? PAL.g2 : PAL.g1;
        if (face > 0.92) c = ROCK[4];
      }
    } else {
      const wet = waterAt(px, py);
      const pv = wet ? pondVal(px, py) : 1, rv = wet ? riverDist(px, py) : 1;
      const inPond = wet && (pv < 0 || hill), inRiver = wet && !inPond;
      const pvv = hill ? springVal(px, py) * 0.5 - 0.1 : pv;
      if (wet) {
        const depth = inPond ? -pvv * 3.2 : -rv / 9;
        const above = !waterAt(px, py - 1) || !waterAt(px, py - 2);
        if (above) c = PAL.w0;
        else if (depth < 0.12) c = PAL.w5;
        else if (depth < 0.32) c = PAL.w4;
        else if (depth < 0.65) c = PAL.w3;
        else if (depth < 1.1) c = (dither(px, py) > 0.5 && depth > 0.95) ? PAL.w1 : PAL.w2;
        else c = PAL.w1;
        if (c === PAL.w2 && noise2(px / 16, py / 10, 7) > 0.68) c = PAL.w3;
      } else {
        const below = (k) => waterAt(px, py + k);
        const pd = plazaDist(px, py);
        const pe = pathEdge(px, py);
        if (below(1)) c = PAL.p0;
        else if (below(2)) c = PAL.p1;
        else if (!hill && (waterAt(px - 1, py) || waterAt(px + 1, py) || waterAt(px, py - 1))) c = PAL.p1;
        else if (pd < 0 && !hill) c = plazaColor(px, py, pd);
        else if (pe.d < 0) c = pathColor(px, py, pe.d);
        else c = grassColor(px, py, hill);
        // a soft shadow line under the cliff
        if (!hill) { const cy = T(cliffY((px + 0.5) / TILE) + CLIFF_H); if (py + 0.5 >= cy && py + 0.5 < cy + 3 && !onStairs(px)) c = shade(c, -0.22); }
        // the field around the player's farm
        const F = MAP.farm;
        if (px >= T(F.x0) + 4 && px < T(F.x1) - 4 && py >= T(F.y0) + 4 && py < T(F.y1) - 4 && pe.d >= 0) c = fieldColor(px, py);
      }
    }
    d[py * MPX + px] = col(c);
  }
  decorate(pb);
  return pb.canvas();
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dither = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

function pathColor(px, py, d) {
  if (d > -1.2) return noise2(px / 2, py / 2, 30) > 0.45 ? PAL.g2 : PAL.p1;
  if (d > -2.6) return PAL.p2;
  const n = noise2(px / 10, py / 10, 6);
  if (n > 0.7 && (px + py) % 2) return PAL.p4;
  return n < 0.3 ? shade(PAL.p3, -0.05) : PAL.p3;
}

function plazaColor(px, py, d) {
  if (d > -2) return PAL.s1;
  const P = MAP.plaza, dx = px + 0.5 - T(P.x), dy = py + 0.5 - T(P.y);
  const r = Math.hypot(dx, dy), th = Math.atan2(dy, dx) + Math.PI;
  const ring = Math.floor(r / 5.5), rr = r % 5.5;
  const segs = Math.max(6, Math.round((ring * 5.5 * Math.PI * 2) / 8));
  const sa = (th / (Math.PI * 2)) * segs + (ring % 2) * 0.5;
  const seg = Math.floor(sa), sf = sa - seg;
  if (rr < 0.9 || sf < 0.09) return PAL.s1;
  const h = hash2(ring, seg, 40);
  let c = h > 0.66 ? PAL.s4 : h > 0.2 ? PAL.s3 : '#e9e1f0';
  if (ring === 3 || ring === 7) c = h > 0.5 ? '#f4d9c8' : '#ecc9b8';
  if (rr > 4.6) c = PAL.s2;
  else if (rr < 1.8) c = shade(c, 0.25);
  return c;
}

// Untilled farm ground is soft, short grass; tilling turns it into soil.
function fieldColor(px, py) {
  const n = noise2(px / 9, py / 9, 31);
  return n > 0.6 ? PAL.g4 : (py % 16 === 15 && n < 0.5) ? PAL.g2 : PAL.g3;
}

// Hand-placed-looking clusters: grass tufts, flower patches, clover, pebbles.
function decorate(pb) {
  const rnd = mulberry32(1234);
  const okGrass = (x, y) => !waterAt(x, y) && cliffFace(x, y) < 0 && pathEdge(x, y).d > 2 && plazaDist(x, y) > 2 &&
    !(x >= T(MAP.farm.x0) && x < T(MAP.farm.x1) && y >= T(MAP.farm.y0) && y < T(MAP.farm.y1));
  const tuft = (x, y, dark) => {
    const a = dark ? PAL.g1 : PAL.g2, b = dark ? PAL.g2 : PAL.g4;
    pb.set(x, y, a); pb.set(x - 1, y - 1, a); pb.set(x + 1, y - 1, a); pb.set(x - 1, y - 2, b); pb.set(x + 1, y - 2, b); pb.set(x, y - 2, a); pb.set(x, y - 3, b);
  };
  const FLOWERS = [PAL.f_white, PAL.f_pink, PAL.f_lilac, PAL.f_blue, PAL.f_yellow, PAL.f_peach];
  for (let i = 0; i < 1500; i++) {
    const x = Math.floor(rnd() * MPX), y = Math.floor(rnd() * MPY);
    if (!okGrass(x, y)) continue;
    const r = rnd();
    const meadow = x > T(52);
    if (r < 0.5) {
      const n = 2 + Math.floor(rnd() * 4);
      for (let k = 0; k < n; k++) tuft(x + Math.floor((rnd() - 0.5) * 12), y + Math.floor((rnd() - 0.5) * 8), rnd() < 0.4);
    } else if (r < (meadow ? 0.95 : 0.74)) {
      const fc = FLOWERS[Math.floor(rnd() * FLOWERS.length)], n = 3 + Math.floor(rnd() * 5);
      for (let k = 0; k < n; k++) {
        const fx = x + Math.floor((rnd() - 0.5) * 14), fy = y + Math.floor((rnd() - 0.5) * 9);
        if (!okGrass(fx, fy)) continue;
        pb.set(fx, fy + 1, PAL.g1); pb.set(fx, fy + 2, PAL.g1);
        pb.set(fx - 1, fy, fc); pb.set(fx + 1, fy, fc); pb.set(fx, fy - 1, fc); pb.set(fx, fy + 1 - 1, PAL.f_yellow === fc ? PAL.f_peach : PAL.f_yellow);
        if (rnd() < 0.5) pb.set(fx + 1, fy - 1, shade(fc, 0.3));
      }
    } else if (r < 0.86) {
      for (let k = 0; k < 6; k++) { const cx = x + Math.floor((rnd() - 0.5) * 10), cy = y + Math.floor((rnd() - 0.5) * 6); pb.set(cx, cy, PAL.g4); pb.set(cx + 1, cy, PAL.g4); pb.set(cx, cy + 1, PAL.g2); }
    } else {
      pb.set(x, y, PAL.s3); pb.set(x + 1, y, PAL.s2); pb.set(x, y + 1, PAL.g1); pb.set(x + 1, y + 1, PAL.g1);
    }
  }
  // pebbles along paths
  for (let i = 0; i < 700; i++) {
    const x = Math.floor(rnd() * MPX), y = Math.floor(rnd() * MPY);
    const pe = pathEdge(x, y);
    if (pe.d > -3 || plazaDist(x, y) < 1 || waterAt(x, y) || cliffFace(x, y) >= 0) continue;
    pb.set(x, y, PAL.p4); pb.set(x + 1, y, PAL.s3); pb.set(x, y + 1, PAL.p1); pb.set(x + 1, y + 1, PAL.p1);
  }
}

// A canvas the size of the map, opaque where there is water (for reflections).
function renderWaterMask() {
  const pb = new PB(MPX, MPY);
  for (let py = 0; py < MPY; py++) for (let px = 0; px < MPX; px++) if (waterAt(px, py)) pb.d[py * MPX + px] = 0xffffffff;
  return pb.canvas();
}

// ---- collision ----------------------------------------------------------------------

const CW = MW * 2, CH = MH * 2;
const SOLID = new Uint8Array(CW * CH);
function markSolid(x, y, w, h, v = 1) {
  for (let cy = Math.floor(y / 8); cy <= Math.floor((y + h - 1) / 8); cy++)
    for (let cx = Math.floor(x / 8); cx <= Math.floor((x + w - 1) / 8); cx++)
      if (cx >= 0 && cy >= 0 && cx < CW && cy < CH) SOLID[cy * CW + cx] = v;
}
function buildBaseCollision() {
  SOLID.fill(0);
  for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) {
    const px = cx * 8 + 4, py = cy * 8 + 4;
    const face = cliffFace(px, py);
    if (waterAt(px, py) || (face >= 0 && !onStairs(px))) SOLID[cy * CW + cx] = 1;
  }
  // the stair rails
  markSolid(T(MAP.stairs.x0) - 6, T(cliffY(MAP.stairs.x0)) - 2, 6, T(CLIFF_H) + 4);
  markSolid(T(MAP.stairs.x1), T(cliffY(MAP.stairs.x1)) - 2, 6, T(CLIFF_H) + 4);
  const D = MAP.dock;
  markSolid(T(D.x0), T(D.y0), T(D.x1 - D.x0), T(D.y1 - D.y0), 0);
  for (let cx = 0; cx < CW; cx++) { SOLID[cx] = 1; SOLID[(CH - 1) * CW + cx] = 1; }
  for (let cy = 0; cy < CH; cy++) { SOLID[cy * CW] = 1; SOLID[cy * CW + CW - 1] = 1; }
  if (!G_BRIDGE()) markSolid(T(51.6), 0, MPX - T(51.6), MPY); // the meadow is closed until the bridge exists
}
function openBridge() {
  const B = MAP.bridge;
  markSolid(T(B.x0) - 4, T(B.y - 0.9), T(B.x1 - B.x0) + 8, T(1.8), 0);
  for (let cy = 0; cy < CH; cy++) for (let cx = Math.floor(T(51.6) / 8); cx < CW - 1; cx++) {
    const px = cx * 8 + 4, py = cy * 8 + 4;
    if (!waterAt(px, py) && cliffFace(px, py) < 0) SOLID[cy * CW + cx] = 0;
  }
}
function free(x, y) {
  const x0 = Math.floor((x - 4) / 8), x1 = Math.floor((x + 3) / 8), y0 = Math.floor((y - 3) / 8), y1 = Math.floor(y / 8);
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++)
    if (cx < 0 || cy < 0 || cx >= CW || cy >= CH || SOLID[cy * CW + cx]) return false;
  return true;
}
