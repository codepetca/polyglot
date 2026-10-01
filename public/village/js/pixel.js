// Lantern Hollow — the pixel toolkit. Every image in the game is drawn by code
// built on this file. There are no image assets anywhere.

const TILE = 16;

// "Dream Hollow" palette. Ramps run light (high number) to dark (0).
// Shadows lean plum, highlights lean butter-yellow.
const PAL = {
  ink: '#3b2a3a', ink2: '#5a3f55', plum: '#2e2038',
  g5: '#e3f0a6', g4: '#bfe08a', g3: '#9ccb74', g2: '#7cb264', g1: '#5f975c', g0: '#477a57', gd: '#36604f',
  p4: '#fff0cc', p3: '#f4dcab', p2: '#e6c592', p1: '#cca679', p0: '#a5815f',
  w5: '#f2fdff', w4: '#c2f1f2', w3: '#90dbe3', w2: '#66bed6', w1: '#4b9cc8', w0: '#3f78ac', wd: '#365f97',
  k4: '#f6cf98', k3: '#dfa56c', k2: '#bf8052', k1: '#945f43', k0: '#6a4337',
  s4: '#f7f2f3', s3: '#ddd6e0', s2: '#bdb5c6', s1: '#958ea8', s0: '#6f6886',
  r3: '#ffc0a6', r2: '#f6957f', r1: '#dc706f', r0: '#ae5061',
  b3: '#c8e8ff', b2: '#97c9f4', b1: '#73a3e2', b0: '#5878c2',
  m3: '#d2f5de', m2: '#a1e0bb', m1: '#73c39d', m0: '#529d84',
  l3: '#ece0ff', l2: '#cdb2f4', l1: '#a98ade', l0: '#8268ba',
  y3: '#fff0b0', y2: '#fad57a', y1: '#e8b35a', y0: '#c18a47',
  c3: '#fffaf0', c2: '#f8ead0', c1: '#ead5b0', c0: '#cfb48e',
  pk3: '#fff0ee', pk2: '#ffdcd8', pk1: '#f6bfc0', pk0: '#e0a0a8',
  f_pink: '#ffa4c4', f_rose: '#ef6f9a', f_peach: '#ffc394', f_yellow: '#ffe57f', f_white: '#ffffff',
  f_lilac: '#c9a8ff', f_blue: '#92c8ff', f_red: '#ff7474', f_orange: '#ffad5c',
  glow: '#fff4bf', warm: '#ffd47e', gold: '#f8c95b', gold2: '#d39a45', cream: '#fff8ea', white: '#ffffff',
  blush: '#ff9cad', night: '#232040',
};

// ---- colour maths --------------------------------------------------------------

const _cc = new Map();
function col(c) {
  if (typeof c === 'number') return c;
  if (!c) return 0;
  let v = _cc.get(c);
  if (v !== undefined) return v;
  const n = parseInt(c.slice(1, 7), 16);
  const a = c.length > 7 ? parseInt(c.slice(7, 9), 16) : 255;
  v = ((a << 24) | ((n & 255) << 16) | (n & 0xff00) | ((n >> 16) & 255)) >>> 0;
  _cc.set(c, v);
  return v;
}
function rgb(hex) { const n = parseInt(hex.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function hex3(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return hex3(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
const _sh = new Map();
// k < 0 darkens toward plum, k > 0 lightens toward butter. Hue-shifted on purpose.
function shade(hex, k) {
  const key = hex + k;
  let v = _sh.get(key);
  if (!v) { v = k < 0 ? mix(hex, '#33203f', -k) : mix(hex, '#fff6d2', k); _sh.set(key, v); }
  return v;
}
// Darken a packed colour (used for automatic coloured outlines).
function darkU32(u, k) {
  const r = u & 255, g = (u >> 8) & 255, b = (u >> 16) & 255;
  const R = r + (0x33 - r) * k, G = g + (0x20 - g) * k, B = b + (0x3f - b) * k;
  return ((255 << 24) | (Math.round(B) << 16) | (Math.round(G) << 8) | Math.round(R)) >>> 0;
}

// ---- numbers ---------------------------------------------------------------------

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - (1 - t) * (1 - t);
const easeOutBack = (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(x, y, s = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise2(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s = 0) { return noise2(x, y, s) * 0.6 + noise2(x * 2.1, y * 2.1, s + 1) * 0.28 + noise2(x * 4.3, y * 4.3, s + 2) * 0.12; }

// Distance from a point to a segment, and to a polyline.
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}
function lineDist(px, py, pts) {
  let d = 1e9;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segDist(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
  return d;
}

// ---- pixel buffer ---------------------------------------------------------------

class PB {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
  set(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = col(c); }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.d[y * this.w + x]; }
  has(x, y) { return this.get(x, y) !== 0; }
  is(x, y, c) { return this.get(x, y) === col(c); }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); return this; }
  hline(x0, x1, y, c) { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, c); return this; }
  vline(x, y0, y1, c) { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.set(x, y, c); return this; }
  dots(pts, c) { for (const [x, y] of pts) this.set(x, y, c); return this; }
  line(x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c);
    return this;
  }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / (rx + 0.01), dy = (y + 0.5 - cy) / (ry + 0.01);
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    return this;
  }
  disc(cx, cy, r, c) { return this.ellipse(cx, cy, r, r, c); }
  // Fill a polygon given as [[x,y],...] (scanline, pixel centres).
  poly(pts, c) {
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = [], yc = y + 0.5;
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) this.set(x, y, c);
    }
    return this;
  }
  // Recolour filled pixels: fn(x, y, current) returns a colour or null.
  paint(fn) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const v = this.d[y * this.w + x];
      if (v) { const c = fn(x, y, v); if (c) this.d[y * this.w + x] = col(c); }
    }
    return this;
  }
  // Outline in one colour.
  outline(c = PAL.ink) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++)
      if (!this.has(x, y) && (this.has(x - 1, y) || this.has(x + 1, y) || this.has(x, y - 1) || this.has(x, y + 1))) add.push(x, y);
    const v = col(c);
    for (let i = 0; i < add.length; i += 2) this.d[add[i + 1] * this.w + add[i]] = v;
    return this;
  }
  // Soft outline: each edge pixel takes a darkened copy of the colour it touches.
  outlineAuto(k = 0.55) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.has(x, y)) continue;
      const n = this.get(x, y + 1) || this.get(x, y - 1) || this.get(x - 1, y) || this.get(x + 1, y);
      if (n) add.push(x, y, n);
    }
    for (let i = 0; i < add.length; i += 3) this.d[add[i + 1] * this.w + add[i]] = darkU32(add[i + 2], k);
    return this;
  }
  stamp(src, ox, oy) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const v = src.d[y * src.w + x];
      if (v) { const X = ox + x, Y = oy + y; if (X >= 0 && Y >= 0 && X < this.w && Y < this.h) this.d[Y * this.w + X] = v; }
    }
    return this;
  }
  flipX() { const o = new PB(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) o.d[y * this.w + this.w - 1 - x] = this.d[y * this.w + x]; return o; }
  copy() { const o = new PB(this.w, this.h); o.d.set(this.d); return o; }
  canvas() {
    const cv = makeCanvas(this.w, this.h), g = cv.getContext('2d');
    const img = g.createImageData(this.w, this.h);
    new Uint32Array(img.data.buffer).set(this.d);
    g.putImageData(img, 0, 0);
    return cv;
  }
}

function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }
function flipCanvas(src) {
  const c = makeCanvas(src.width, src.height), g = c.getContext('2d');
  g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  return c;
}
function upscale(src, s) {
  const c = makeCanvas(src.width * s, src.height * s), g = c.getContext('2d');
  g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

// ---- a 3x5 pixel font -----------------------------------------------------------
// Five rows per glyph; each row is an octal digit (4 = left, 2 = middle, 1 = right).

const GLYPHS = {
  A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755',
  I: '72227', J: '11152', K: '55655', L: '44447', M: '57755', N: '65555', O: '25552', P: '65644',
  Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557', V: '55552', W: '55775', X: '55255',
  Y: '55222', Z: '71247', 0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616',
  6: '34652', 7: '71222', 8: '25252', 9: '25316', '!': '22202', '?': '61202', '.': '00002',
  ',': '00024', "'": '22000', '-': '00700', '+': '02720', ':': '02020', '/': '11244', ' ': '00000',
  '(': '24442', ')': '21112', '#': '57575', '=': '07070', ';': '02024', '<': '05720', '&': '25356',
};
const textWidth = (s) => (s.length ? s.length * 4 - 1 : 0);
function drawText(g, s, x, y, color) {
  g.fillStyle = color;
  s = String(s).toUpperCase();
  for (let i = 0; i < s.length; i++) {
    const gl = GLYPHS[s[i]] || GLYPHS['?'];
    for (let r = 0; r < 5; r++) {
      const b = +gl[r];
      if (b & 4) g.fillRect(x + i * 4, y + r, 1, 1);
      if (b & 2) g.fillRect(x + i * 4 + 1, y + r, 1, 1);
      if (b & 1) g.fillRect(x + i * 4 + 2, y + r, 1, 1);
    }
  }
}
function textPB(pb, s, x, y, color) {
  s = String(s).toUpperCase();
  for (let i = 0; i < s.length; i++) {
    const gl = GLYPHS[s[i]] || GLYPHS['?'];
    for (let r = 0; r < 5; r++) {
      const b = +gl[r];
      if (b & 4) pb.set(x + i * 4, y + r, color);
      if (b & 2) pb.set(x + i * 4 + 1, y + r, color);
      if (b & 1) pb.set(x + i * 4 + 2, y + r, color);
    }
  }
}
