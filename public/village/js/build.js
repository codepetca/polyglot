// Lantern Hollow — the one core mechanic: the class builds the town together.
// Study earns bits. Give bits at the build site. Every finished building
// changes the town. Every 50 bits you give, you pick a new costume or pet.

const BUILDS = [
  { id: 'bridge',      name: 'River Bridge',   cost: 300, site: [45.6, 18.6], look: [49, 19.7], says: 'It opens the meadow across the river.' },
  { id: 'lighthouse',  name: 'Lighthouse',     cost: 400, site: [46.4, 31.2], look: [46.4, 29.5], says: 'It lights up the river at night.' },
  { id: 'observatory', name: 'Observatory',    cost: 500, site: [52, 10.2], look: [52, 8], says: 'Stargazing on the hill.' },
  { id: 'stage',       name: 'Festival Stage', cost: 600, site: [37.6, 24.6], look: [37.6, 23], says: 'Music in the square on Fridays.' },
  { id: 'greenhouse',  name: 'Greenhouse',     cost: 800, site: [58, 36.5], look: [58, 34], says: 'Flowers all year round.' },
];
const REWARD_EVERY = 50;

const curBuild = () => BUILDS[G.build.i] || null;
const built = (id) => BUILDS.findIndex((b) => b.id === id) < G.build.i;

// The rest of the game asks this to decide what is standing.
function projectDone(id) { return built(id); }

function giveBits(n) {
  const b = curBuild();
  if (!b) return 0;
  n = Math.min(n, G.bits, b.cost - G.build.given);
  if (n <= 0) return 0;
  G.bits -= n; G.build.given += n; G.build.mine += n; G.rewardMeter += n;
  const [sx, sy] = b.site;
  for (let i = 0; i < 6; i++) puff(tx(sx) + (Math.random() - 0.5) * 30, tx(sy) - Math.random() * 10, PAL.p3);
  floatText(tx(sx), tx(sy) - 30, '+' + n, PAL.gold);
  SFX.play('knock');
  checkBuildDone();
  queuePicks();
  UI.refreshHUD(); saveGame();
  return n;
}

// One picker per 50 bits given, one after another, never on top of a cutscene.
let picking = false;
function queuePicks() {
  if (picking || G.rewardMeter < REWARD_EVERY) return;
  picking = true;
  const show = () => {
    if (G.cine || UI.dlg || !$('#modal').hidden || !$('#banner').hidden) return setTimeout(show, 400);
    G.rewardMeter -= REWARD_EVERY;
    UI.pickReward((picked) => {
      picking = false;
      if (picked) queuePicks(); else G.rewardMeter += REWARD_EVERY; // closed without picking: keep it for next time
    });
  };
  setTimeout(show, 700);
}

function classmatesGive() {
  const b = curBuild();
  if (!b) return;
  const n = 8 + Math.floor(Math.random() * 18);
  G.build.given = Math.min(b.cost, G.build.given + n);
  if (G.started && Math.abs(player.x - tx(b.site[0])) < 220 && Math.abs(player.y - tx(b.site[1])) < 160) floatText(tx(b.site[0]) + 10, tx(b.site[1]) - 34, '+' + n, PAL.cream);
  checkBuildDone();
  UI.refreshHUD();
}

function checkBuildDone() {
  const b = curBuild();
  if (!b || G.build.given < b.cost || G.cine) return;
  const [lx, ly] = b.look;
  const steps = [];
  for (let i = 0; i < 6; i++) steps.push([0.4 + i * 0.22, () => { for (let k = 0; k < 4; k++) puff(tx(lx) + (Math.random() - 0.5) * 60, tx(ly) + (Math.random() - 0.5) * 30, PAL.p3); SFX.play('knock'); }]);
  steps.push([2, () => {
    G.build.i++; G.build.given = 0; G.build.mine = 0;
    if (b.id === 'bridge') { G.projects.bridge.done = true; openBridge(); groundCv = renderGround(); waterMaskCv = renderWaterMask(); }
    applyBuildSolids();
    confetti(tx(lx), tx(ly) - 20); SFX.play('fanfare');
    UI.banner(`${b.name} built!`, b.says);
    UI.refreshHUD(); saveGame();
  }]);
  if (G.started && G.scene === 'town') runCine({ x: tx(lx), y: tx(ly), end: 3.4, steps });
  else steps.forEach((s) => s[1]());
}

// The scaffold at the current site.
function drawSite(g, cx, cy, items) {
  const b = curBuild();
  if (!b) return;
  const x = tx(b.site[0]), y = tx(b.site[1]);
  items.push({ o: { x, y }, sortY: y, draw: () => {
    const sx = Math.round(x - cx), sy = Math.round(y - cy), pct = G.build.given / b.cost;
    g.drawImage(siteSprite, sx - 20, sy - 30);
    // a little board with the progress
    g.fillStyle = '#4b3541'; g.fillRect(sx - 15, sy - 40, 30, 7);
    g.fillStyle = PAL.k4; g.fillRect(sx - 14, sy - 39, 28, 5);
    g.fillStyle = PAL.gold; g.fillRect(sx - 14, sy - 39, Math.round(28 * pct), 5);
  } });
}
let siteSprite = null;

// While you have bits to give and the site is off screen, an arrow at the edge points the way.
let arrowSpr = null;
function drawSitePointer(cx, cy) {
  const b = curBuild();
  if (!b || !G.started || G.cine || G.paused || G.bits <= 0) return;
  const sx = tx(b.site[0]) - cx, sy = tx(b.site[1]) - 16 - cy;
  if (sx > 0 && sx < VW && sy > 0 && sy < VH) return;
  const m = 10, dx = sx - VW / 2, dy = sy - VH / 2;
  const kx = (VW / 2 - m) / Math.max(1e-3, Math.abs(dx)), ky = (VH / 2 - m) / Math.max(1e-3, Math.abs(dy));
  const dir = kx < ky ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3), k = Math.min(kx, ky);
  const bob = Math.round(Math.sin(G.t * 6) * 1.5);
  if (!arrowSpr) {
    const pb = new PB(7, 11);
    for (let i = -4; i <= 4; i++) pb.hline(1, 5 - Math.abs(i), 5 + i, i < 0 ? PAL.glow : PAL.gold);
    arrowSpr = pb.outline().canvas();
  }
  g.save();
  g.translate(Math.round(VW / 2 + dx * k) + [bob, 0, -bob, 0][dir], Math.round(VH / 2 + dy * k) + [0, bob, 0, -bob][dir]);
  g.rotate((dir * Math.PI) / 2);
  g.drawImage(arrowSpr, -4, -5);
  g.restore();
}

function siteTarget(px, py) {
  const b = curBuild();
  if (!b) return null;
  const x = tx(b.site[0]), y = tx(b.site[1]);
  if (Math.hypot(px - x, py - y) < 28) return { label: 'Build', x, y: y - 46, fn: () => UI.buildDialog() };
  return null;
}

Object.assign(UI, {
  buildDialog() {
    const b = curBuild();
    const left = b.cost - G.build.given;
    if (G.bits <= 0) return this.say(b.name, [`${left} bits to go.`, 'Finish a lesson in class to earn bits.']);
    this.say(b.name, [`${left} bits to go. You have ${G.bits}.`], {
      choices: [{ label: `Give ${Math.min(20, G.bits)}`, fn: () => giveBits(20) }, { label: `Give all ${Math.min(G.bits, left)}`, fn: () => giveBits(G.bits) }, { label: 'Not now' }],
    });
  },

  // Every 50 bits given: choose one of three new things.
  pickReward(done = () => {}) {
    const rnd = Math.random;
    const skins = COSTUMES.map((c) => c.id).filter((id) => !G.skinsOwned.includes(id));
    const pets = PETS.map((p) => p.id).filter((id) => !G.petsOwned.includes(id));
    const pool = [...skins.map((id) => ['skin', id]), ...pets.map((id) => ['pet', id])];
    if (!pool.length) return done(true);
    const pick = [];
    while (pick.length < 3 && pool.length) pick.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    let picked = false;
    const sheet = this.modal(`<h2 class="center">Thanks for building!</h2><p class="lede center">Pick one.</p><div class="picks">${pick.map(([k, id]) => `<button type="button" class="pick" data-k="${k}" data-id="${id}"><span class="pf"></span><b>${prettyName(id)}</b></button>`).join('')}</div>`,
      { onAct: () => (document.activeElement.closest('.pick') || sheet.querySelector('.pick')).click() });
    sheet.querySelector('.close').remove();
    sheet.querySelectorAll('.pick').forEach((el) => el.querySelector('.pf').appendChild(faceCanvas(el.dataset.id, 2)));
    sheet.querySelector('.pick').focus();
    this.afterModal = () => done(picked);
    sheet.addEventListener('click', (e) => {
      const el = e.target.closest('.pick'); if (!el) return;
      picked = true;
      if (el.dataset.k === 'skin') { G.skinsOwned.push(el.dataset.id); G.skin = player.skin = el.dataset.id; }
      else { G.petsOwned.push(el.dataset.id); G.pet = el.dataset.id; syncPets(); }
      SFX.play('fanfare'); for (let i = 0; i < 12; i++) sparkle(player.x, player.y - 10);
      this.closeModal(); saveGame();
    });
  },
});
