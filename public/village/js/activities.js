// Lantern Hollow — what you can do: farm, fish, focus, treats, wishes, sleep,
// and the class-project moments.

// ---- what is in front of the player ---------------------------------------------------

function probe() {
  const v = DIRV[player.dir];
  return [player.x + v[0] * 11, player.y + v[1] * 11 - 3];
}

function findTarget() {
  if (!player || G.cine || player.action) return null;
  if (G.scene === 'home') return homeTarget();
  const [px, py] = probe();
  let best = null, bd = 20;
  for (const c of NPCS) {
    if (c.inside) continue;
    const d = Math.hypot(c.x - px, c.y - 6 - py);
    if (d < bd) { bd = d; best = { label: 'Talk to ' + c.name, fn: () => talkTo(c), x: c.x, y: c.y - 34 }; }
  }
  for (const o of OBJ) {
    const it = o.interact;
    if (!it || hiddenObj(o)) continue;
    const d = Math.hypot(it.x - px, it.y - py);
    if (d < bd) { bd = d; best = { ...it, x: it.x, y: o.dy !== undefined ? Math.min(o.dy + 6, it.y - 24) : it.y - 24 }; }
  }
  if (best) return best;
  const site = siteTarget(px, py);
  if (site) return site;
  const w = waterAhead();
  if (w) return { label: 'Fish', fn: () => startFishing(w), x: w.x, y: w.y - 10 };
  return null;
}
function hiddenObj(o) {
  if (o.event) { const ev = todaysEvent(); return !ev || ev.id !== o.event; }
  if (o.site) return projectDone(o.site);
  if (o.project) return !projectDone(o.project);
  return false;
}

// ---- farming ---------------------------------------------------------------------------

function seedChoice() {
  const owned = Object.keys(CROPS).filter((k) => (G.seeds[k] || 0) > 0);
  if (!owned.includes(G.seedSel)) G.seedSel = owned[0] || null;
  return G.seedSel;
}
function cycleSeed() {
  const owned = Object.keys(CROPS).filter((k) => (G.seeds[k] || 0) > 0);
  if (!owned.length) return;
  G.seedSel = owned[(owned.indexOf(G.seedSel) + 1) % owned.length];
  UI.refreshHUD();
}

function farmTarget(x, y) {
  const p = plotAt(x, y), mx = x * TILE + 8, my = y * TILE - 8;
  if (!p || !p.tilled) return { label: 'Till the soil', fn: () => till(x, y), x: mx, y: my };
  if (!p.crop) {
    const s = seedChoice();
    if (!s) return { label: 'No seeds (Bit Shop)', fn: () => UI.say('Farm', ['You are out of seeds.', 'The Bit Shop sells them, and your mailbox sometimes has some.']), x: mx, y: my };
    return { label: `Plant ${CROPS[s].name.toLowerCase()} (${G.seeds[s]})`, fn: () => plant(x, y, s), x: mx, y: my };
  }
  const st = cropStage(p);
  if (st >= 3) return { label: 'Harvest ' + CROPS[p.crop].name.toLowerCase(), fn: () => harvest(x, y), x: mx, y: my - 8 };
  if (!p.watered && !p.rainy) return { label: 'Water', fn: () => water(x, y), x: mx, y: my };
  const left = CROPS[p.crop].days - (p.grown || 0);
  return { label: `Ready in ${left} day${left === 1 ? '' : 's'}`, fn: () => UI.toast(`Watered today. Ready in ${left} day${left === 1 ? '' : 's'}.`, 'seed'), x: mx, y: my };
}

function till(x, y) {
  startAction(player, 'hoe', 0.5, () => {
    G.farm[plotKey(x, y)] = { tilled: true };
    for (let i = 0; i < 7; i++) puff(x * TILE + 8 + (Math.random() - 0.5) * 12, y * TILE + 10, PAL.p1);
    SFX.play('hoe'); saveGame();
  });
}
function plant(x, y, s) {
  startAction(player, 'harvest', 0.35, () => {
    G.farm[plotKey(x, y)] = { tilled: true, crop: s, grown: 0, watered: false };
    addCount(G.seeds, s, -1);
    SFX.play('plant'); UI.refreshHUD(); saveGame();
  });
}
function water(x, y) {
  startAction(player, 'water', 0.75, () => {
    const tiles = [[x, y]];
    if (G.tools.can >= 2) { const side = player.dir === 0 || player.dir === 3 ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]]; side.forEach(([a, b]) => tiles.push([x + a, y + b])); }
    tiles.forEach(([a, b]) => { const p = plotAt(a, b); if (p && p.crop) p.watered = true; });
    saveGame();
  });
  setTimeout(() => { for (let i = 0; i < 12; i++) part({ kind: 'drop', x: x * TILE + 8 + (Math.random() - 0.5) * 8, y: y * TILE + 2, vx: (Math.random() - 0.5) * 20, vy: -10 - Math.random() * 20, g: 160, life: 0.5, c: PAL.w3 }); SFX.play('water'); }, 260);
}
function harvest(x, y) {
  const p = plotAt(x, y), crop = p.crop;
  startAction(player, 'harvest', 0.35, () => {
    G.farm[plotKey(x, y)] = { tilled: true };
    addCount(G.crops, crop, 1);
    popItem(x * TILE + 8, y * TILE + 2, cropSprite(crop, 3));
    setExpr(player, 'happy', 1.2);
    SFX.play('pop');
    UI.toast(`Harvested a ${CROPS[crop].name.toLowerCase()}. Sell it at the Bit Shop for ${CROPS[crop].sell} bits.`, 'seed');
    saveGame();
  });
}

// ---- fishing ----------------------------------------------------------------------------

function waterAhead() {
  const v = DIRV[player.dir];
  for (const dist of [14, 22, 30]) {
    const x = player.x + v[0] * dist, y = player.y + v[1] * dist - 2;
    const D = MAP.dock;
    if (x >= tx(D.x0) && x < tx(D.x1) && y >= tx(D.y0) && y < tx(D.y1)) continue;
    if (waterAt(x, y)) return { x: x + v[0] * 8, y: y + v[1] * 8, where: x > tx(43) || isHill(x, y) ? 'river' : 'pond' };
  }
  return null;
}

function startFishing(spot) {
  const v = DIRV[player.dir];
  G.cast = { phase: 'cast', t: 0, sx: player.x + v[0] * 14, sy: player.y - 24, bx: spot.x, by: spot.y, where: spot.where, wait: (G.bait > 0 ? 1.5 : 2.5) + Math.random() * 4 };
  player.fishing = true;
  startAction(player, 'fish', 0.45, null, { cast: true });
  SFX.play('cast');
}
function stopFishing() { G.cast = null; player.fishing = false; }

function rollFish(where) {
  const tod = timeOfDay();
  const ok = (f) => (f.where === 'any' || f.where === where) && (!f.when || f.when === tod || (f.when === 'day' && tod === 'morning'));
  const pool = FISH.filter(ok);
  const lucky = (G.bait > 0 ? 1.8 : 1) * (G.tools.rod >= 2 ? 1.5 : 1);
  const weight = (f) => (f.junk ? 0.6 : f.rare === 1 ? 4 : f.rare === 2 ? 2 * lucky : 1 * lucky);
  let total = pool.reduce((s, f) => s + weight(f), 0), r = Math.random() * total;
  for (const f of pool) { r -= weight(f); if (r <= 0) return f; }
  return pool[0];
}

function updateFishing(dt) {
  const f = G.cast;
  if (!f) return;
  f.t += dt;
  if (f.phase === 'cast' && f.t > 0.45) { f.phase = 'wait'; f.t = 0; splash(f.bx, f.by); SFX.play('splash'); }
  else if (f.phase === 'wait') {
    if (Math.random() < dt * 0.7) ripple(f.bx, f.by);
    if (f.t > f.wait) { f.phase = 'bite'; f.t = 0; emote(player, 'exclaim', 1); setExpr(player, 'surprised', 1); SFX.play('bite'); splash(f.bx, f.by); }
  } else if (f.phase === 'bite' && f.t > 1.0) { stopFishing(); UI.toast('It got away. Cast again.', 'fish'); }
}

function fishPress() {
  const f = G.cast;
  if (!f) return;
  if (f.phase === 'bite') {
    const catchOf = rollFish(f.where);
    f.phase = 'reel';
    if (G.bait > 0) G.bait--;
    UI.reel(catchOf, (ok) => {
      stopFishing();
      if (!ok) { UI.toast('So close. It slipped off the hook.', 'fish'); return; }
      G.fishToday++;
      const len = catchOf.junk ? 0 : Math.round(catchOf.len[0] + Math.random() * (catchOf.len[1] - catchOf.len[0]));
      const isNew = !G.journal[catchOf.id];
      G.journal[catchOf.id] = Math.max(G.journal[catchOf.id] || 0, len || 1);
      if (!catchOf.junk) addCount(G.fish, catchOf.id, 1); else G.bits += catchOf.bits;
      if (todaysEvent() && todaysEvent().id === 'derby') G.derbyBest = Math.max(G.derbyBest, len);
      setExpr(player, 'happy', 1.5);
      UI.catchCard(catchOf, len, isNew);
      saveGame();
    });
  } else if (f.phase === 'wait' || f.phase === 'cast') { stopFishing(); UI.toast('Too early. Wait for the splash.', 'fish'); }
}

// ---- treats, wishes, sleep ----------------------------------------------------------------

function buyTreat(id) {
  const T = { cocoa: [5, 'Hot cocoa', 120], cake: [12, 'Berry cake', 0], latte: [8, 'Iced latte', 0] }[id];
  const free = id === 'cocoa' && todaysEvent() && todaysEvent().id === 'picnic' && !G.freeCocoa;
  if (!free && !spend(T[0])) return UI.say('Moonbean Café', [`That is ${T[0]} bits.`, 'Finishing a lesson earns 20.']);
  if (free) G.freeCocoa = G.day;
  if (id === 'cocoa') { G.cozy = T[2]; emote(player, 'heart', 3); UI.toast(free ? 'Free Sunday cocoa! You feel cozy.' : 'Cozy. You walk a little faster for two minutes.', 'star'); }
  if (id === 'cake') { startAction(player, 'hop', 0.45); setExpr(player, 'happy', 2); emote(player, 'heart'); UI.toast('Delicious. Your mood is great.', 'star'); }
  if (id === 'latte') { G.buffs.latte = G.day; UI.toast('Your next focus session pays 5 extra bits.', 'star'); }
  SFX.play('coin'); UI.refreshHUD(); saveGame();
}

const FORTUNES = ['Your next bug is a missing semicolon.', 'Read the whole error message. The answer is in it.', 'A loop that never ends needs a closer look at its condition.',
  'Today is a good day to rename a variable.', 'Someone will ask you for help, and you will know the answer.', 'Print the value. Then you will know.', 'Indent your code and the bug will show itself.',
  'The lesson you are avoiding is shorter than you think.'];
function makeWish() {
  if (!spend(1)) return UI.say('Fountain', ['You have no bits to toss.']);
  for (let i = 0; i < 10; i++) sparkle(tx(MAP.plaza.x), tx(MAP.plaza.y) - 12, PAL.w4);
  SFX.play('chime'); UI.refreshHUD();
  UI.say('Fountain', ['You toss a bit into the water.', FORTUNES[Math.floor(Math.random() * FORTUNES.length)]]);
}

function sleepUntilMorning() {
  UI.fade(() => {
    if (G.clock > 6 * 60) newDay();
    G.clock = 6 * 60 + 30;
    player.sit = null;
    UI.toast(`Good morning! Day ${G.day}, ${WEEK[weekday()]}.`, 'sun');
    UI.morning();
  });
}

// ---- focus sessions (lofi study timer) -------------------------------------------------

function startFocus(minutes) {
  G.focus = { total: minutes * 60, left: minutes * 60, started: Date.now() };
  player.sit = { x: player.x, y: player.y, dir: 0, ground: true };
  player.reading = true;
  UI.focusOverlay(true);
}
function updateFocus() {
  const F = G.focus;
  if (!F) return;
  F.left = Math.max(0, F.total - (Date.now() - F.started) / 1000);
  if (F.left <= 0) finishFocus(true);
}
function finishFocus(done) {
  const F = G.focus;
  G.focus = null; player.reading = false;
  UI.focusOverlay(false);
  if (!done) return UI.toast('Focus session ended early. No problem, try again later.', 'clock');
  const mins = Math.round(F.total / 60), bonus = G.buffs.latte === G.day ? 5 : 0;
  G.focusMin += mins;
  UI.reward(Math.max(5, Math.round((EARN.focus * mins) / 25)) + bonus, `${mins} minutes of focus`);
}

// ---- class moments: lanterns and finished projects ---------------------------------------

function lightLantern() {
  const B = G.projects.bridge;
  if (B.progress >= PROJECTS.bridge.goal) return;
  const i = B.progress, L = OBJ.find((o) => o.kind === 'lantern' && o.idx === i);
  runCine({ x: L.x, y: L.y - 14, end: 2.3, steps: [[0.9, () => {
    B.progress++;
    for (let k = 0; k < 16; k++) sparkle(L.x, L.y - 24);
    SFX.play('ignite'); UI.toast(`The class lit lantern ${i + 1} of 12.`, 'lantern'); UI.refreshHUD(); saveGame();
  }]], after: () => { if (B.progress >= PROJECTS.bridge.goal && !B.done) setTimeout(() => finishProject('bridge'), 300); } });
}

function finishProject(id) {
  const P = G.projects[id];
  if (P.done) return;
  const spots = { bridge: [tx(49), tx(19.7)], greenhouse: [tx(58), tx(34)], observatory: [tx(52.5), tx(8)], stage: [tx(37.6), tx(23)] };
  const [x, y] = spots[id];
  const steps = [];
  if (id === 'bridge') for (let i = 0; i < 10; i++) steps.push([0.6 + i * 0.2, () => { G.bridgeBuild = i + 1; puff(tx(MAP.bridge.x0) + (i + 0.5) * 8, y + 6, PAL.p3); SFX.play('knock'); }]);
  else steps.push([0.8, () => { for (let i = 0; i < 20; i++) puff(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 20, PAL.p3); SFX.play('knock'); }]);
  steps.push([id === 'bridge' ? 2.8 : 1.4, () => {
    P.done = true;
    if (id === 'bridge') { openBridge(); groundCv = renderGround(); waterMaskCv = renderWaterMask(); }
    confetti(x, y - 10); SFX.play('fanfare');
    UI.toast(`The class built the ${PROJECTS[id].name.toLowerCase()}!`, 'star');
    UI.refreshHUD(); saveGame();
  }]);
  runCine({ x, y, end: id === 'bridge' ? 4.4 : 3, steps });
}
