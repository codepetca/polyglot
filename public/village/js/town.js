// Lantern Hollow — the town: where everything stands and what it does.

const OBJ = [];
const LIGHTS = [];
let groundCv, waterMaskCv;

function place(o) { OBJ.push(o); return o; }
const tx = (v) => v * TILE;

// Classmates. In the real game these are the other students' avatars.
const CLASSMATES = [
  { id: 'mira', name: 'Mira', home: 1, skin: 'EggGirl', pet: 'CatWhite',
    likes: 'strawberry', lines: [['Morning! I watered my strawberries before class.', 'Strawberries need three days. I check every morning.'], ['I finally get for loops.', 'Off-by-one got me twice, though.'], ['Have you seen the ducklings?', 'They follow their mum everywhere.']] },
  { id: 'jun', name: 'Jun', home: 2, skin: 'LionBoy', pet: 'DogOrange',
    likes: 'pumpkin', lines: [['Coming to class makes it rain on every farm.', 'So I never miss. My pumpkins love it.'], ['Pumpkins take five days.', 'Worth it. They sell for 36 bits.'], ['Next unit is classes.', "I'm making mine a Dragon."]] },
  { id: 'priya', name: 'Priya', home: 3, skin: 'Inspector', pet: 'Cat',
    likes: 'blueberry', lines: [['I do a focus session at the library every evening.', 'Twenty-five minutes, then cocoa.'], ['Compare Strings with .equals, not ==.', 'I keep writing that on my hand.'], ['The notes for Unit 3 are in the library.', 'Each finished lesson unlocks a page.']] },
  { id: 'kai', name: 'Kai', home: 4, skin: 'Hunter', pet: null,
    likes: 'carrot', lines: [['There is a golden koi in the pond.', 'It only bites at night.'], ['I caught a lost semicolon today.', 'That explains my compile error.'], ['Twelve lanterns rebuild the bridge.', 'I want to see the meadow.']] },
  { id: 'noor', name: 'Noor', home: 5, skin: 'MaskFrog', pet: 'Frog',
    likes: 'turnip', lines: [['Shh. Something is biting.', 'Oh. A boot again.'], ['I come here after every quiz.', 'The pond is good for thinking.'], ['Did you know rain makes the frogs sing?', 'Come to class and see.']] },
  { id: 'sam', name: 'Sam', home: 6, skin: 'Monkey', pet: 'Dog',
    likes: 'corn', lines: [['I put the lofi radio on while I study.', 'Press the radio button up top.'], ['zzz...', 'Oh! Hi. I was resting my eyes.'], ['When the festival stage is built', 'I am playing guitar on Friday night.']] },
];

// House slots: index 0 is yours. [left x in tiles, bottom row in tiles]
const HOUSE_SLOTS = [[3, 17], [9.9, 17], [12.9, 43], [18.9, 43], [24.9, 43], [30.9, 43], [36.9, 43]];
const HOUSE_STYLES = [null, ['l', 'mint', '#a98ade', '#c9a8ff'], ['y', 'plaster', '#dc706f', '#ff8f8f'], ['m', 'pink', '#529d84', '#73c39d'], ['b', 'blue', '#5878c2', '#97c9f4'], ['r', 'mint', '#ae5061', '#f6957f'], ['y', 'pink', '#8268ba', '#cdb2f4']];

function addBuilding(kind, spec, leftTiles, bottomRow, opts = {}) {
  const day = drawBuilding(spec, false), night = drawBuilding(spec, true);
  const dx = tx(leftTiles), bottom = tx(bottomRow + 1), dy = bottom - spec.h;
  const o = place({ kind, spr: day.cv, sprN: night.cv, dx, dy, x: dx + spec.w / 2, y: bottom, sortY: bottom - 4, ...opts });
  markSolid(dx + 5, bottom - 26, spec.w - 10, 24);
  o.lights = night.lights.map(([x, y, r]) => [dx + x, dy + y, r]);
  o.doorX = dx + spec.door.x + spec.door.w / 2; o.doorY = bottom + 6;
  if (spec.chimney) o.smoke = [dx + spec.chimney + 5, dy - 2];
  return o;
}

function initTown() {
  groundCv = renderGround();
  waterMaskCv = renderWaterMask();
  buildBaseCollision();

  // ---- buildings (only a few doors do anything) ----
  const school = addBuilding('school', BUILDINGS.school(), 32 - 5.5, 9.4 - 1);
  school.interact = { x: school.doorX, y: school.doorY, label: 'School', fn: () => UI.place('school') };
  const home = addBuilding('home', homeSpecFor(G.home), HOUSE_SLOTS[0][0], HOUSE_SLOTS[0][1]);
  home.interact = { x: home.doorX, y: home.doorY, label: 'Home', fn: () => enterHome() };
  home.isHome = true;
  const cafe = addBuilding('cafe', BUILDINGS.cafe(), 16, 17);
  cafe.interact = { x: cafe.doorX, y: cafe.doorY, label: 'Café', fn: () => UI.place('cafe') };
  addBuilding('shop', BUILDINGS.shop(), 35.5, 17);
  const lib = addBuilding('library', BUILDINGS.library(), 12.3, 31);
  lib.interact = { x: lib.doorX, y: lib.doorY, label: 'Library', fn: () => UI.place('library') };
  const bout = addBuilding('boutique', BUILDINGS.boutique(), 36.5, 31);
  bout.interact = { x: bout.doorX, y: bout.doorY, label: 'Wardrobe', fn: () => UI.wardrobe() };

  CLASSMATES.forEach((c, i) => {
    const [l, b] = HOUSE_SLOTS[c.home], st = HOUSE_STYLES[c.home];
    const h = addBuilding('house', houseSpec(i * 13 + 5, st[0], st[1], st[2], st[3]), l, b);
    h.owner = c;
    h.interact = { x: h.doorX, y: h.doorY, label: `${c.name}'s house`, fn: () => UI.knock(c) };
    const mx = h.doorX + 26, my = tx(b + 1) + 10;
    place({ kind: 'mailbox', spr: mailboxSprite(st[3], false), dx: mx - 6, dy: my - 19, x: mx, y: my, sortY: my });
    place({ kind: 'plate', spr: nameplate(c.name), dx: mx - 30, dy: my - 10, x: mx - 20, y: my, sortY: my - 1 });
    markSolid(mx - 3, my - 3, 6, 4);
  });
  const myMx = tx(8.4), myMy = tx(18.4);
  place({ kind: 'mailbox', spr: mailboxSprite(PAL.r1, false), dx: myMx - 6, dy: myMy - 19, x: myMx, y: myMy, sortY: myMy });
  markSolid(myMx - 3, myMy - 3, 6, 4);

  // ---- the plaza ----
  const fx = tx(MAP.plaza.x), fy = tx(MAP.plaza.y) + 16;
  place({ kind: 'fountain', spr: fountainSprite(1), dx: fx - 30, dy: fy - 62, x: fx, y: fy, sortY: fy - 6, fountain: true });
  markSolid(fx - 26, fy - 18, 52, 16);
  place({ kind: 'sign', spr: signpostSprite(['POND', 'SCHOOL', 'MEADOW']), dx: tx(36.6) - 32, dy: tx(21.6) - 29, x: tx(36.6), y: tx(21.6), sortY: tx(21.6) });
  markSolid(tx(36.6) - 2, tx(21.6) - 3, 4, 3);
  [[22.1, 21.9, '#ff8fb0'], [24.6, 22.9, '#8fc5ff']].forEach(([x, y, c]) => { const X = tx(x), Y = tx(y); place({ kind: 'parasol', spr: parasolTableSprite(c), dx: X - 17, dy: Y - 38, x: X, y: Y, sortY: Y }); markSolid(X - 9, Y - 5, 18, 5); });
  place({ kind: 'menu', spr: chalkMenuSprite(), dx: tx(21.7) - 9, dy: tx(18.5) - 23, x: tx(21.7), y: tx(18.5), sortY: tx(18.5) });
  [[38.3, 18.6, PAL.f_red], [42.2, 18.6, '#ffd36e']].forEach(([x, y, c]) => { const X = tx(x), Y = tx(y); place({ kind: 'crate', spr: crateSprite(c), dx: X - 8, dy: Y - 13, x: X, y: Y, sortY: Y }); markSolid(X - 7, Y - 5, 14, 5); });
  place({ kind: 'barrel', spr: barrelSprite(), dx: tx(43.3) - 6, dy: tx(18.4) - 14, x: tx(43.3), y: tx(18.4), sortY: tx(18.4) });

  // benches you can sit on
  [[25.1, 26.4], [35.1, 26.6], [26.3, 14.8], [33.7, 21.3]].forEach(([x, y]) => {
    const X = tx(x), Y = tx(y);
    place({ kind: 'bench', spr: benchSprite(), dx: X - 15, dy: Y - 17, x: X, y: Y, sortY: Y, interact: { x: X, y: Y + 5, label: 'Sit', fn: () => sitDown(X, Y) } });
    markSolid(X - 13, Y - 6, 26, 6);
  });
  [[17.3, 18.2, 'flower'], [22.2, 18.2, 'fern'], [36.1, 18.2, 'cactus'], [10.2, 32.3, 'fern'], [21.2, 32.3, 'flower'], [8.9, 18.2, 'flower']].forEach(([x, y, k]) => {
    const X = tx(x), Y = tx(y); place({ kind: 'pot', spr: potSprite(k), dx: X - 6, dy: Y - 15, x: X, y: Y, sortY: Y }); markSolid(X - 4, Y - 4, 8, 4);
  });
  place({ kind: 'boat', spr: boatSprite(), dx: tx(31.2), dy: tx(28.7) - 6, x: tx(32), y: tx(28.7), sortY: tx(28.7) - 20, bob: true });

  // street lanterns (all lit)
  [[24.6, 18.1], [35.4, 18.1], [29.4, 13.9], [31.8, 13.9], [14.9, 18.2], [9.6, 18.2], [43.6, 18.2], [28.7, 25.4], [31.3, 25.4], [12.8, 37.6], [44, 37.6], [30.4, 43.7]].forEach(([x, y], i) => {
    const X = tx(x), Y = tx(y);
    place({ kind: 'lantern', idx: i, dx: X - 6, dy: Y - 30, x: X, y: Y, sortY: Y, shadow: [X, Y, 4] });
    markSolid(X - 3, Y - 3, 6, 4);
    LIGHTS.push({ x: X, y: Y - 24, r: 48, lantern: i });
  });

  // ---- what the class builds, in order (hidden until built) ----
  const obs = observatorySpec(), od = drawBuilding(obs, false), on = drawBuilding(obs, true), oX = tx(49.5), oB = tx(10.2);
  place({ kind: 'observatory', spr: od.cv, sprN: on.cv, dx: oX, dy: oB - obs.h, x: oX + 40, y: oB, sortY: oB - 4, project: 'observatory', solidRect: [oX + 6, oB - 24, 68, 22], lights: on.lights.map(([x, y, r]) => [oX + x, oB - obs.h + y, r]) });
  const gh = greenhouseSpec(), gd = drawBuilding(gh, false), gX = tx(55), gB = tx(36.5);
  place({ kind: 'greenhouse', spr: gd.cv, sprN: drawBuilding(gh, true).cv, dx: gX, dy: gB - gh.h, x: gX + 48, y: gB, sortY: gB - 4, project: 'greenhouse', solidRect: [gX + 6, gB - 22, 84, 20] });
  const stX = tx(37.6), stY = tx(24.6);
  place({ kind: 'stage', spr: stageSprite(), dx: stX - 30, dy: stY - 34, x: stX, y: stY, sortY: stY, project: 'stage', solidRect: [stX - 26, stY - 12, 52, 11] });
  const lhX = tx(46.4), lhB = tx(31.2);
  place({ kind: 'lighthouse', spr: lighthouseSprite(), dx: lhX - 12, dy: lhB - 60, x: lhX, y: lhB, sortY: lhB - 2, project: 'lighthouse', solidRect: [lhX - 7, lhB - 6, 14, 6], lights: [[lhX, lhB - 52, 70]] });
  place({ kind: 'bridge', flat: true, x: tx(MAP.bridge.x0), y: tx(MAP.bridge.y), sortY: 0 });
  const wmX = tx(58.5), wmY = tx(30.5);
  place({ kind: 'windmill', spr: windmillBody(), dx: wmX - 28, dy: wmY - 90, x: wmX, y: wmY, sortY: wmY, windmill: true });
  markSolid(wmX - 14, wmY - 10, 28, 9);
  applyBuildSolids();

  // ---- nature ----
  plantTrees();
  scatterGarden();
  addCritters();
}

// Built things block the way; unbuilt sites don't.
function applyBuildSolids() {
  for (const o of OBJ) if (o.solidRect && o.project && projectDone(o.project)) markSolid(...o.solidRect);
}

function nameplate(name) {
  const w = textWidth(name) + 6, pb = new PB(w + 2, 9);
  pb.rect(1, 1, w, 7, PAL.cream); pb.hline(1, w, 7, PAL.c1);
  textPB(pb, name, 4, 2, PAL.ink2);
  return pb.outlineAuto(0.5).canvas();
}

function stageSprite() {
  const pb = new PB(60, 36);
  pb.rect(2, 18, 56, 10, PAL.k3); pb.hline(2, 57, 18, PAL.k4); for (let x = 2; x < 58; x += 7) pb.vline(x, 19, 27, PAL.k2);
  pb.rect(2, 28, 56, 6, PAL.k1); pb.vline(3, 2, 18, PAL.k1); pb.vline(56, 2, 18, PAL.k1);
  for (let x = 4; x < 56; x++) { const y = 3 + Math.round(Math.sin(((x - 4) / 52) * Math.PI) * 4); pb.set(x, y, PAL.ink2); if (x % 6 === 0) pb.poly([[x - 2, y + 1], [x + 2, y + 1], [x, y + 5]], [PAL.f_pink, PAL.f_yellow, PAL.f_blue][(x / 6) % 3]); }
  return pb.outlineAuto(0.55).canvas();
}

function buildFarmFence() {
  const F = MAP.farm, H = picketSprite(false), V = picketSprite(true);
  for (let x = F.x0; x < F.x1; x++) {
    if (x === 6) continue; // the gate
    const X = tx(x), Y = tx(F.y0) + 6;
    place({ kind: 'fence', spr: H, dx: X, dy: Y - 13, x: X + 8, y: Y, sortY: Y });
    markSolid(X, Y - 4, 16, 4);
  }
  for (let x = F.x0; x < F.x1; x++) { const X = tx(x), Y = tx(F.y1) + 2; place({ kind: 'fence', spr: H, dx: X, dy: Y - 13, x: X + 8, y: Y, sortY: Y }); markSolid(X, Y - 4, 16, 4); }
  for (let y = F.y0; y < F.y1; y++) [F.x0, F.x1].forEach((x) => { const X = tx(x) - 3, Y = tx(y) + 18; place({ kind: 'fence', spr: V, dx: X, dy: Y - 19, x: X + 3, y: Y, sortY: Y }); markSolid(X, Y - 15, 6, 15); });
  // farm plots
  for (let y = MAP.farm.plots.y0; y < MAP.farm.plots.y0 + 4; y++) for (let x = MAP.farm.plots.x0; x <= MAP.farm.plots.x1; x++)
    place({ kind: 'plot', tx: x, ty: y, x: tx(x) + 8, y: tx(y) + 14, sortY: tx(y) + 14 });
}

function plantTree(kind, x, y, seed) {
  const t = makeTree(kind, seed);
  const o = place({ kind: 'tree', tree: t, treeKind: kind, x, y, dx: x - t.ax, dy: y - t.ay, sortY: y, shadow: [x, y - 1, kind === 'pine' ? 10 : 15], phase: (seed % 100) / 16 });
  markSolid(x - 5, y - 5, 10, 6);
  return o;
}

function plantTrees() {
  const rnd = mulberry32(77);
  const special = [['willow', 22.4, 31.2], ['blossom', 37, 28.4], ['blossom', 36.6, 34.2], ['lilac', 19.4, 37.2], ['lilac', 41.2, 37.4], ['maple', 10.6, 29.6], ['blossom', 24.3, 36.8], ['birch', 45.3, 27.6],
    ['oak', 45.8, 33.5], ['fruit', 54.5, 24], ['fruit', 57.5, 24.5], ['fruit', 60.5, 24], ['fruit', 56, 27.5], ['fruit', 59.3, 27.6], ['blossom', 58, 39], ['blossom', 61, 41.5], ['blossom', 55.6, 42.6],
    ['willow', 47.2, 41.5], ['maple', 14.6, 26], ['oak', 2.2, 30]];
  special.forEach(([k, x, y], i) => plantTree(k, tx(x), tx(y), 500 + i * 17));
  const keepOut = [[2.5, 12.6, 46, 45.5], [25, 0, 39, 11], [48, 5, 57, 11.6], [44.5, 9, 48.5, 14], [51.6, 15.5, 63, 23], [53, 28, 63, 37.5], [38.5, 3.5, 45.5, 10.5]];
  const taken = OBJ.filter((o) => o.kind === 'tree').map((o) => [o.x / 16, o.y / 16]);
  for (let ty = 0; ty < MH; ty += 1.2) for (let tx0 = 0; tx0 < MW; tx0 += 1.3) {
    const x = tx0 + rnd() * 0.8, y = ty + rnd() * 0.8;
    const edge = x < 2.4 || x > 62 || y < 1.2 || y > 45.8;
    const hillBand = y < cliffY(x) - 0.6;
    const p = edge ? 0.85 : hillBand ? 0.55 : x > 51.6 ? 0.14 : 0.05;
    if (rnd() > p) continue;
    if (!edge && keepOut.some(([a, b, c, d]) => x >= a && x <= c && y >= b && y <= d)) continue;
    const px = tx(x), py = tx(y);
    if (waterAt(px, py) || waterAt(px, py - 8) || cliffFace(px, py + 4) >= 0 || cliffFace(px, py) >= 0 || pathEdge(px | 0, py | 0).d < 10 || plazaDist(px, py) < 12) continue;
    if (Math.abs(py - tx(cliffY(x))) < 14) continue;
    if (taken.some(([a, b]) => Math.abs(a - x) < 1.7 && Math.abs(b - y) < 1.5)) continue;
    taken.push([x, y]);
    const r = rnd();
    const kind = hillBand ? (r < 0.4 ? 'pine' : r < 0.6 ? 'birch' : r < 0.7 ? 'blossom' : 'oak') : x > 51.6 ? (r < 0.5 ? 'pine' : 'oak') : r < 0.3 ? 'pine' : r < 0.45 ? 'maple' : r < 0.55 ? 'birch' : 'oak';
    plantTree(kind, px, py, Math.floor(rnd() * 1e6));
  }
}

function scatterGarden() {
  const rnd = mulberry32(99);
  const put = (spr, X, Y, w, solid = true) => { place({ kind: 'deco', spr, dx: X - (spr.width >> 1), dy: Y - spr.height + 1, x: X, y: Y, sortY: Y }); if (solid) markSolid(X - w / 2, Y - 4, w, 4); };
  [[16.8, 21.6, 'hydrangea'], [23.1, 32.4, 'hydrangea'], [12.4, 35.2, 'berry'], [21.5, 26.5, 'flower'], [38.5, 26.2, 'hydrangea'], [26.2, 38.3, 'flower'], [34.2, 38.4, 'berry'],
    [44.6, 23.5, 'plain'], [11.6, 13.9, 'flower'], [47.6, 16.5, 'plain'], [2.6, 21.2, 'berry'], [53, 18.2, 'hydrangea'], [62, 33, 'berry']].forEach(([x, y, k], i) => put(bushSprite(k, i + 3), tx(x), tx(y), 16));
  [[27.4, 23.6, 'tulip'], [32.6, 23.6, 'tulip'], [26.7, 15.6, 'lavender'], [34.4, 15.6, 'lavender'], [18.6, 22, 'rose'], [41, 22.4, 'tulip'], [13.3, 33.5, 'sunflower'], [20.6, 33.4, 'lavender'],
    [55, 31.5, 'lavender'], [56.6, 31.5, 'lavender'], [58.2, 31.6, 'lavender'], [60, 31.6, 'lavender'], [55.2, 34, 'tulip'], [57.4, 34, 'tulip'], [59.6, 34, 'tulip']].forEach(([x, y, k], i) => put(flowerPatchSprite(k, i + 7), tx(x), tx(y), 14, false));
  [[17.5, 36.4], [42.6, 41.7], [8.4, 37], [52, 45], [27.8, 35.6]].forEach(([x, y], i) => put(rockSprite(i, i % 2 === 0), tx(x), tx(y), 12));
  put(stumpSprite(), tx(7.4), tx(38.2), 12);
  // reeds and lily pads on the pond
  for (let i = 0; i < 40; i++) {
    const a = rnd() * Math.PI * 2, P = MAP.pond;
    const X = tx(P.x + Math.cos(a) * P.rx * (0.93 + rnd() * 0.05)), Y = tx(P.y + Math.sin(a) * P.ry * (0.93 + rnd() * 0.05));
    if (Math.abs(X - tx(30)) < 30 && Y < tx(P.y)) continue;
    if (rnd() < 0.5) place({ kind: 'reed', spr: reedSprite(i), dx: X - 6, dy: Y - 16, x: X, y: Y, sortY: Y });
  }
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2, P = MAP.pond, rr = 0.3 + rnd() * 0.5;
    const X = tx(P.x + Math.cos(a) * P.rx * rr), Y = tx(P.y + Math.sin(a) * P.ry * rr);
    if (Math.abs(X - tx(30)) < 20 && Y < tx(P.y)) continue;
    place({ kind: 'lily', flat: true, spr: lilySprite(i, i % 3 === 0), dx: X - 6, dy: Y - 4, x: X, y: Y, sortY: 0 });
  }
}

// ---- critters ---------------------------------------------------------------------------

const CRITTERS = [];
function addCritters() {
  const duck = critterFrames('duck'), duckling = critterFrames('duckling');
  CRITTERS.push({ kind: 'swim', frames: duck, t: 0, speed: 0.07, rx: 4.3, ry: 2.2, lag: 0 });
  CRITTERS.push({ kind: 'swim', frames: duckling, t: 0, speed: 0.07, rx: 4.3, ry: 2.2, lag: 0.09 });
  CRITTERS.push({ kind: 'swim', frames: duckling, t: 0, speed: 0.07, rx: 4.3, ry: 2.2, lag: 0.17 });
  CRITTERS.push({ kind: 'swim', frames: duck, t: 2.6, speed: -0.05, rx: 2.6, ry: 1.3, lag: 0 });
  CRITTERS.push({ kind: 'sit', frames: critterFrames('frog'), x: tx(33.4), y: tx(31.6), rate: 0.6 });
  CRITTERS.push({ kind: 'sit', frames: critterFrames('cat'), x: tx(18.6), y: tx(33.2), rate: 0.5, sleep: true });
  const bird = critterFrames('bird');
  [[28.2, 21.8], [29.5, 22.4], [31.7, 17.2]].forEach(([x, y]) => CRITTERS.push({ kind: 'bird', frames: bird, x: tx(x), y: tx(y), hx: tx(x), hy: tx(y), hop: 0, fly: 0 }));
}

function updateCritters(dt) {
  for (const c of CRITTERS) {
    if (c.kind === 'swim') {
      c.t += dt * c.speed;
      const a = (c.t - c.lag) * Math.PI * 2, P = MAP.pond;
      const x = tx(P.x) + Math.cos(a) * tx(c.rx), y = tx(P.y + 0.4) + Math.sin(a) * tx(c.ry);
      c.flip = Math.sin(a) * (c.speed > 0 ? 1 : -1) > 0;
      if (c.x !== undefined && Math.hypot(x - c.x, y - c.y) > 0.4 && Math.random() < dt * 2) part({ kind: 'ripple', x: c.x, y: c.y + 4, life: 0.9 });
      c.x = x; c.y = y;
    } else if (c.kind === 'bird') {
      const near = typeof player !== 'undefined' && player && Math.hypot(player.x - c.x, player.y - c.y) < 34;
      if (near && !c.fly && !c.ground) { c.fly = 1; c.vx = (c.x < player.x ? -1 : 1) * 70; c.vy = -60; c.flip = c.vx > 0; }
      if (c.fly) {
        c.x += c.vx * dt; c.y += c.vy * dt; c.fly += dt;
        if (c.fly > 4) { c.fly = 0; c.x = c.hx + (Math.random() - 0.5) * 30; c.y = c.hy + (Math.random() - 0.5) * 10; }
      } else {
        c.hop -= dt;
        if (c.hop < 0) { c.hop = 0.6 + Math.random() * 2.2; const nx = c.x + (Math.random() - 0.5) * 12; if (Math.abs(nx - c.hx) < 26) { c.flip = nx > c.x; c.x = nx; c.jump = 0.18; } }
        if (c.jump > 0) c.jump -= dt;
      }
    }
  }
}
