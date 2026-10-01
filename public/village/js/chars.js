// Lantern Hollow — the player and classmates: movement, routines, pathfinding.

let player = null;
let NPCS = [];
const KEYS = {};
const TOUCH = { x: 0, y: 0 };
const DIRV = [[0, 1], [-1, 0], [1, 0], [0, -1]];

function makeChar(skin, x, y, name) {
  return { skin, x, y, dir: 0, anim: 'idle', t: Math.random() * 5, moving: false, blinkT: 2 + Math.random() * 3, blink: false,
    name, emote: null, emoteT: 0, expr: null, exprT: 0, action: null, sit: null, idleT: 0 };
}

function moveChar(c, dx, dy) {
  let moved = false;
  if (dx) {
    if (free(c.x + dx, c.y)) { c.x += dx; moved = true; }
    else if (!dy) for (let k = 1; k <= 7; k++) {
      if (free(c.x + dx, c.y - k)) { c.y -= Math.min(1, Math.abs(dx)); moved = true; break; }
      if (free(c.x + dx, c.y + k)) { c.y += Math.min(1, Math.abs(dx)); moved = true; break; }
    }
  }
  if (dy) {
    if (free(c.x, c.y + dy)) { c.y += dy; moved = true; }
    else if (!dx) for (let k = 1; k <= 7; k++) {
      if (free(c.x - k, c.y + dy)) { c.x -= Math.min(1, Math.abs(dy)); moved = true; break; }
      if (free(c.x + k, c.y + dy)) { c.x += Math.min(1, Math.abs(dy)); moved = true; break; }
    }
  }
  return moved;
}

function tickChar(c, dt) {
  c.t += dt;
  c.blinkT -= dt;
  if (c.blinkT < 0) { c.blink = true; if (c.blinkT < -0.12) { c.blink = false; c.blinkT = 2 + Math.random() * 4; } }
  if (c.emote) { c.emoteT -= dt; if (c.emoteT <= 0) c.emote = null; }
  if (c.expr) { c.exprT -= dt; if (c.exprT <= 0) c.expr = null; }
  if (c.action) {
    c.action.t += dt;
    if (c.action.t >= c.action.dur) { const a = c.action; c.action = null; if (a.done) a.done(); }
  }
}

function poseOf(c) {
  if (c.action) return { dir: c.dir, anim: c.action.kind, t: c.action.t, blink: c.blink, expr: c.expr || c.action.expr, cast: c.action.cast };
  if (c.fishing) return { dir: c.dir, anim: 'fish', t: c.t, blink: c.blink, expr: c.expr };
  if (c.sit) return { dir: c.sit.dir ?? 0, anim: c.sit.sleep ? 'sleep' : 'sit', t: c.t, blink: c.blink, expr: c.expr };
  return { dir: c.dir, anim: c.moving ? (c.running ? 'run' : 'walk') : 'idle', t: c.t, blink: c.blink, expr: c.expr };
}

function emote(c, kind, secs = 2.4) { c.emote = kind; c.emoteT = secs; }
function setExpr(c, e, secs = 1.5) { c.expr = e; c.exprT = secs; }
function startAction(c, kind, dur, done, extra = {}) { c.action = { kind, t: 0, dur, done, ...extra }; c.moving = false; }

// ---- the player ---------------------------------------------------------------------

function updatePlayer(dt) {
  const p = player;
  tickChar(p, dt);
  if (G.paused || G.cine || p.action) { p.moving = false; return; }
  let ix = (KEYS.right ? 1 : 0) - (KEYS.left ? 1 : 0) + TOUCH.x;
  let iy = (KEYS.down ? 1 : 0) - (KEYS.up ? 1 : 0) + TOUCH.y;
  const len = Math.hypot(ix, iy);
  if (len > 0.2) {
    p.idleT = 0;
    if (p.sit) standUp(p);
    if (p.fishing) stopFishing();
    ix /= Math.max(1, len); iy /= Math.max(1, len);
    p.running = !!KEYS.run;
    const speed = (p.running ? 96 : 58) * (G.cozy > 0 ? 1.12 : 1);
    if (Math.abs(ix) > Math.abs(iy) + 0.05) p.dir = ix < 0 ? 1 : 2; else p.dir = iy < 0 ? 3 : 0;
    const was = p.moving;
    p.moving = moveChar(p, ix * speed * dt, iy * speed * dt);
    if (p.moving && Math.random() < dt * (p.running ? 9 : 4) && onPath(p)) puff(p.x + (Math.random() - 0.5) * 6, p.y, PAL.p2);
    if (!was && p.moving) p.t = 0;
  } else {
    p.moving = false;
    if (!p.fishing) p.idleT += dt;
    // a little life when left alone: sit on the grass, then doze
    if (p.idleT > 25 && !p.sit && G.scene === 'town') { p.sit = { x: p.x, y: p.y, dir: 0, ground: true }; emote(p, 'note'); }
    if (p.idleT > 70 && p.sit && !p.sit.sleep) { p.sit.sleep = true; emote(p, 'sleep', 4); }
    if (p.sit && p.sit.sleep && Math.random() < dt * 0.15) emote(p, 'sleep', 3);
  }
}
function onPath(c) { return pathEdge(c.x | 0, c.y | 0).d < 0 || plazaDist(c.x, c.y) < 0; }

function sitDown(x, y) {
  player.sit = { x, y, dir: 0 };
  player.x = x; player.y = y + 2; player.dir = 0;
  UI.toast('Time drifts by while you sit.', 'clock');
}
function standUp(c) {
  if (!c.sit) return;
  if (!c.sit.ground) c.y += 7;
  c.sit = null;
}

// ---- pathfinding on the collision grid ------------------------------------------------

let PATHGRID = null;
function pathGrid() {
  if (PATHGRID) return PATHGRID;
  PATHGRID = new Uint8Array(CW * CH);
  for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) {
    const x = cx * 8 + 4, y = cy * 8 + 4;
    PATHGRID[cy * CW + cx] = pathEdge(x, y).d < 0 || plazaDist(x, y) < 0 ? 1 : 0;
  }
  return PATHGRID;
}
function findPath(x0, y0, x1, y1) {
  const PG = pathGrid();
  const sx = Math.floor(x0 / 8), sy = Math.floor(y0 / 8), gx = Math.floor(x1 / 8), gy = Math.floor(y1 / 8);
  const N = CW * CH, cost = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), shut = new Uint8Array(N);
  const open = [[0, sy * CW + sx]];
  cost[sy * CW + sx] = 0;
  const h = (i) => Math.abs((i % CW) - gx) + Math.abs(Math.floor(i / CW) - gy);
  let found = -1, iter = 0;
  while (open.length && iter++ < 9000) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
    const [, cur] = open.splice(bi, 1)[0];
    if (shut[cur]) continue;
    shut[cur] = 1;
    if (cur === gy * CW + gx) { found = cur; break; }
    const cx = cur % CW, cy = Math.floor(cur / CW);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy, ni = ny * CW + nx;
      if (nx < 1 || ny < 1 || nx >= CW - 1 || ny >= CH - 1 || shut[ni]) continue;
      if (SOLID[ni] && ni !== gy * CW + gx) continue;
      const nc = cost[cur] + 1 + (PG[ni] ? 0 : 0.7);
      if (nc < cost[ni]) { cost[ni] = nc; from[ni] = cur; open.push([nc + h(ni), ni]); }
    }
  }
  if (found < 0) return null;
  const pts = [];
  for (let i = found; i >= 0 && i !== sy * CW + sx; i = from[i]) pts.push([(i % CW) * 8 + 4, Math.floor(i / CW) * 8 + 6]);
  pts.reverse();
  return pts.filter((_, i) => i % 2 === 1 || i === pts.length - 1);
}

// ---- classmates -----------------------------------------------------------------------

// Where each classmate likes to be, by time of day. [x, y, mode] in tiles.
const ROUTINES = {
  mira:  { morning: [22.6, 20.8, 'wander'], day: [24, 22.1, 'sit'], dusk: [29, 23, 'wander'], night: 'home' },
  jun:   { morning: [27.5, 21.2, 'wander'], day: [12.2, 24, 'wander'], dusk: [33.7, 21.9, 'sit'], night: 'home' },
  priya: { morning: [31, 21.6, 'wander'], day: [16, 33.4, 'wander'], dusk: [16, 33.4, 'wander'], night: 'home' },
  kai:   { morning: [30, 26.2, 'wander'], day: [30.1, 28.4, 'fish'], dusk: [30.1, 28.4, 'fish'], night: [30.1, 28.4, 'fish'] },
  noor:  { morning: [23.3, 28.2, 'fish'], day: [23.3, 28.2, 'fish'], dusk: [25.1, 26.6, 'sit'], night: 'home' },
  sam:   { morning: [26.3, 15, 'sit'], day: [26.3, 15, 'sit'], dusk: [35.1, 26.8, 'sit'], night: 'home' },
};

function initNPCs() {
  NPCS = CLASSMATES.map((m) => {
    const house = OBJ.find((o) => o.owner === m);
    const c = makeChar(m.skin, house.doorX, house.doorY, m.name);
    Object.assign(c, { def: m, house, route: null, wait: Math.random() * 2, goal: null, inside: false, mode: 'wander' });
    placeAtRoutine(c);
    return c;
  });
}

function routineSpot(c) {
  const r = ROUTINES[c.def.id][timeOfDay()];
  if (r === 'home') return { home: true, x: c.house.doorX, y: c.house.doorY - 2 };
  return { x: tx(r[0]), y: tx(r[1]), mode: r[2] };
}
function placeAtRoutine(c) {
  const s = routineSpot(c);
  c.x = s.x; c.y = s.y; c.goal = s; c.inside = !!s.home; c.mode = s.mode || 'wander';
  arrive(c);
}

function arrive(c) {
  const s = c.goal;
  c.moving = false; c.route = null;
  if (s.home) { c.inside = true; return; }
  if (s.mode === 'sit') {
    const bench = OBJ.find((o) => o.kind === 'bench' && Math.hypot(o.x - s.x, o.y - s.y) < 20);
    if (bench) { c.x = bench.x; c.y = bench.y + 2; }
    c.sit = { x: c.x, y: c.y, dir: 0 };
  }
  if (s.mode === 'fish') { c.fishing = true; c.dir = c.def.id === 'kai' ? 0 : 2; }
}

function updateNPCs(dt) {
  for (const c of NPCS) {
    tickChar(c, dt);
    const s = routineSpot(c);
    const changed = !c.goal || c.goal.x !== s.x || c.goal.y !== s.y || !!c.goal.home !== !!s.home;
    if (changed) {
      c.goal = s; c.sit = null; c.fishing = false;
      if (c.inside) { c.inside = false; c.x = c.house.doorX; c.y = c.house.doorY; }
      c.route = findPath(c.x, c.y, s.x, s.y) || [[s.x, s.y]];
    }
    if (c.inside || c.talking > 0) { c.moving = false; if (c.talking > 0) c.talking -= dt; continue; }
    if (c.route && c.route.length) {
      const [wx, wy] = c.route[0], dx = wx - c.x, dy = wy - c.y, d = Math.hypot(dx, dy);
      if (d < 3) { c.route.shift(); if (!c.route.length) arrive(c); continue; }
      const sp = (isNight() ? 26 : 34) * dt;
      if (Math.abs(dx) > Math.abs(dy)) c.dir = dx < 0 ? 1 : 2; else c.dir = dy < 0 ? 3 : 0;
      c.moving = moveChar(c, (dx / d) * sp, (dy / d) * sp);
      if (!c.moving) { c.stuck = (c.stuck || 0) + dt; if (c.stuck > 1.5) { c.x = wx; c.y = wy; c.stuck = 0; } } else c.stuck = 0;
      continue;
    }
    c.moving = false;
    if (c.goal && c.goal.mode === 'wander') {
      c.wait -= dt;
      if (c.wait <= 0) {
        c.wait = 2 + Math.random() * 5;
        const nx = c.goal.x + (Math.random() - 0.5) * 40, ny = c.goal.y + (Math.random() - 0.5) * 24;
        if (free(nx, ny)) c.route = [[nx, ny]];
      }
    }
    if (Math.random() < dt * 0.03) emote(c, isNight() ? 'sleep' : ['note', 'heart', 'star', 'wave'][Math.floor(Math.random() * 4)]);
  }
}

function talkTo(c) {
  const m = c.def;
  c.talking = 999;
  if (!c.sit && !c.fishing) { const dx = player.x - c.x, dy = player.y - c.y; c.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0; }
  const f = G.friends[m.id] || 0;
  const first = !G.talkedToday[m.id];
  const lines = m.lines[(G.day + (G.talkedToday[m.id] || 0)) % m.lines.length].slice();
  G.talkedToday[m.id] = (G.talkedToday[m.id] || 0) + 1;
  setExpr(c, 'happy', 2);
  if (first) G.friends[m.id] = Math.min(10, f + 1);
  UI.say(c.name, lines, { face: c.skin, hearts: G.friends[m.id], onDone: () => { c.talking = 1.2; } });
}

// ---- pets -----------------------------------------------------------------------------------

const PETS_OUT = [];
function syncPets() {
  PETS_OUT.length = 0;
  if (G.pet) PETS_OUT.push({ owner: player, id: G.pet, x: player.x - 10, y: player.y + 2, flip: false, moving: false, t: 0 });
  for (const n of NPCS) if (n.def.pet) PETS_OUT.push({ owner: n, id: n.def.pet, x: n.x - 10, y: n.y + 2, flip: false, moving: false, t: Math.random() * 3 });
}
function updatePets(dt) {
  for (const p of PETS_OUT) {
    const o = p.owner;
    p.hidden = !!o.inside || (o === player) !== (G.scene === 'town' || o === player) || (G.scene === 'home' && o !== player);
    const v = DIRV[o.dir] || [0, 1];
    const tx = o.x - v[0] * 13 + (v[1] !== 0 ? 9 : 0), ty = o.y - v[1] * 9 + 2;
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    if (d > 80) { p.x = tx; p.y = ty; }
    p.moving = d > 3;
    if (p.moving) {
      const sp = Math.min(d, (40 + d * 2.2) * dt);
      p.x += (dx / d) * sp; p.y += (dy / d) * sp;
      if (Math.abs(dx) > 1) p.flip = dx < 0;
      p.t += dt;
    } else if (Math.random() < dt * 0.05 && o === player && !o.moving) emote(p, ['heart', 'note', 'sleep'][Math.floor(Math.random() * 3)], 1.8);
    if (p.emote) { p.emoteT -= dt; if (p.emoteT <= 0) p.emote = null; }
  }
}
