// Lantern Hollow — game state, economy, days, projects and saving.
//
// The rule that shapes everything: bits come mostly from studying (lessons,
// attendance, focus sessions). Playing earns a little. Crops grow by days, not
// by playing longer, so the best way to "win" is to study and check in daily.

const EARN = { lesson: 20, attend: 10, focus: 15, notes: 5, checkin: 5 };
const DAY_MIN = 1440, MIN_PER_SEC = 2; // one in-game day lasts 12 real minutes
const FISH_PER_DAY = 8;

// What the shops sell. Accessories and furniture are defined in their own files.
const SHOP = {
  seeds: Object.keys(CROPS).map((id) => ({ id, kind: 'seed', price: CROPS[id].seed })),
  tools: [
    { id: 'can2', kind: 'tool', name: 'Copper watering can', desc: 'Waters three plots at once.', price: 120, tool: 'can', level: 2 },
    { id: 'rod2', kind: 'tool', name: 'Willow fishing rod', desc: 'Rare fish bite more often.', price: 150, tool: 'rod', level: 2 },
    { id: 'bait', kind: 'item', name: 'Bait (5)', desc: 'The next five casts get a rarer fish.', price: 15 },
    { id: 'plot', kind: 'farm', name: 'More farm plots', desc: 'Adds a row of five plots.', price: 100 },
  ],
  paint: [
    { id: 'roof-r', name: 'Coral roof', price: 50 }, { id: 'roof-b', name: 'Sky roof', price: 50 }, { id: 'roof-m', name: 'Mint roof', price: 50 },
    { id: 'roof-l', name: 'Lilac roof', price: 50 }, { id: 'roof-y', name: 'Honey roof', price: 50 },
    { id: 'wall-plaster', name: 'Cream walls', price: 40 }, { id: 'wall-pink', name: 'Rose walls', price: 40 }, { id: 'wall-mint', name: 'Mint walls', price: 40 },
    { id: 'wall-blue', name: 'Sky walls', price: 40 }, { id: 'wall-plank', name: 'Wood walls', price: 40 },
  ],
};

// Class projects. Lanterns light when anyone in the class finishes a lesson.
const PROJECTS = {
  bridge:      { name: 'River bridge',  goal: 12, unit: 'lanterns', desc: 'Every finished lesson lights a lantern. Twelve rebuild the bridge to the meadow.' },
  greenhouse:  { name: 'Greenhouse',    goal: 600, unit: 'bits', desc: 'The class pools bits for a greenhouse in the meadow. It sells rare seeds.' },
  observatory: { name: 'Observatory',   goal: 40, unit: 'days', desc: 'Every day someone comes to class adds one. It opens stargazing nights on the hill.' },
  stage:       { name: 'Festival stage', goal: 60, unit: 'crops', desc: 'Donate harvests. When it is built, Friday nights get music in the plaza.' },
};

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EVENTS = {
  0: { id: 'market', name: 'Market day', desc: 'A travelling cart is in the plaza with things the shops do not sell.' },
  2: { id: 'derby', name: 'Pond derby', desc: 'Fish all day. Your longest fish goes on the board.' },
  4: { id: 'lanterns', name: 'Lantern night', desc: 'After dark, the class lanterns float up into the sky.' },
  6: { id: 'picnic', name: 'Sunday picnic', desc: 'The café gives everyone a free cocoa.' },
};

const STAMP_GIFTS = [
  { bits: 5, seeds: { turnip: 2 } }, { bits: 5, seeds: { carrot: 2 } }, { bits: 10, furn: 'chair' },
  { bits: 5, seeds: { strawberry: 2 } }, { bits: 10, furn: 'plant' }, { bits: 5, seeds: { tomato: 2 } },
  { bits: 20, skin: 'GreenPig' }, { bits: 10, seeds: { pumpkin: 1 } }, { bits: 10, furn: 'lamp' }, { bits: 30, pet: 'Hamster' },
];

function freshState() {
  return {
    started: false, paused: false, scene: 'town', t: 0,
    clock: 7 * 60 + 30, day: 1,
    name: 'You', skin: 'Villager3', pet: null, skinsOwned: [], petsOwned: [],
    bits: 40, bait: 0, fishToday: 0,
    build: { i: 0, given: 120, mine: 0 }, rewardMeter: 0,
    seeds: { turnip: 4, carrot: 2 }, crops: {}, fish: {},
    tools: { can: 1, rod: 1 },
    furnOwned: { bed: 1, desk: 1, chair: 1, rug: 1, plant: 1, window: 1, lamp: 0 },
    home: { roof: 'r', wall: 'plaster', placed: [{ id: 'window', x: 3, y: 0 }, { id: 'bed', x: 1, y: 1 }, { id: 'desk', x: 6, y: 1 }, { id: 'chair', x: 6, y: 2 }, { id: 'rug', x: 4, y: 3 }, { id: 'plant', x: 8, y: 1 }] },
    farmRows: 4, farm: {},
    journal: {}, derbyBest: 0,
    stamps: 0, lastCheckIn: 0, mail: [],
    lessons: 23, attended: 11, focusMin: 0, donated: 0,
    friends: {}, talkedToday: {},
    projects: { bridge: { progress: 12 } },
    capital: { square: { level: 1, given: { bits: 120, stone: 14 } }, harbor: { level: 1, given: { wood: 18 } }, farm: { level: 0, given: { bits: 60, wood: 12 } }, hill: { level: 0, given: { stone: 22 } } },
    mats: { wood: 6, stone: 4, gem: 0, egg: 0, milk: 0 }, medals: 0, builders: { Mira: 84, Jun: 66, Priya: 120, Kai: 40, Noor: 52, Sam: 30 },
    animals: {}, nodesTaken: { day: 0, ids: [] }, orders: null, raid: null,
    rain: 0, cozy: 0, buffs: {},
    settings: { sound: true, music: false, station: 0, classLock: false },
  };
}

let G = freshState();
G.projects.bridge.done = false;

// ---- days ------------------------------------------------------------------------

const hour = () => Math.floor(G.clock / 60);
const isNight = () => G.clock >= 20 * 60 || G.clock < 5 * 60;
const timeOfDay = () => (G.clock < 10 * 60 ? 'morning' : G.clock < 17 * 60 ? 'day' : G.clock < 20 * 60 ? 'dusk' : 'night');
const weekday = () => (G.day - 1) % 7;
const todaysEvent = () => EVENTS[weekday()] || null;

function advanceClock(dt, speed = 1) {
  G.clock += dt * MIN_PER_SEC * speed;
  if (G.clock >= DAY_MIN) { G.clock -= DAY_MIN; newDay(); }
}

// Everything that happens overnight.
function newDay() {
  G.day++;
  G.fishToday = 0;
  G.talkedToday = {};
  for (const key in G.farm) {
    const p = G.farm[key];
    if (p.crop && (p.watered || p.rainy)) p.grown = Math.min(CROPS[p.crop].days, (p.grown || 0) + 1);
    p.watered = false; p.rainy = false;
  }
  saveGame();
}

// The stamp card counts days you visit. It never resets.
function checkIn() {
  if (G.lastCheckIn === G.day) return null;
  G.lastCheckIn = G.day;
  const gift = STAMP_GIFTS[G.stamps % STAMP_GIFTS.length];
  G.stamps++;
  G.bits += gift.bits;
  if (gift.seeds) for (const k in gift.seeds) G.seeds[k] = (G.seeds[k] || 0) + gift.seeds[k];
  if (gift.skin && !G.skinsOwned.includes(gift.skin)) G.skinsOwned.push(gift.skin);
  if (gift.pet && !G.petsOwned.includes(gift.pet)) { G.petsOwned.push(gift.pet); if (!G.pet) G.pet = gift.pet; }
  if (gift.furn) G.furnOwned[gift.furn] = (G.furnOwned[gift.furn] || 0) + 1;
  return gift;
}

// ---- farm -------------------------------------------------------------------------

const plotKey = (tx, ty) => tx + ',' + ty;
function isFarmTile(tx, ty) {
  const P = MAP.farm.plots;
  return tx >= P.x0 && tx <= P.x1 && ty >= P.y0 && ty < P.y0 + G.farmRows;
}
function plotAt(tx, ty) { return G.farm[plotKey(tx, ty)] || null; }
function cropStage(p) {
  if (!p || !p.crop) return -1;
  const d = CROPS[p.crop].days, g = p.grown || 0;
  if (g >= d) return 3;
  return g === 0 ? 0 : g / d < 0.5 ? 1 : 2;
}

// ---- projects ----------------------------------------------------------------------

function contribute(id, amount) {
  const P = G.projects[id];
  if (P.done) return false;
  P.progress = Math.min(PROJECTS[id].goal, P.progress + amount);
  return P.progress >= PROJECTS[id].goal;
}

// ---- inventory helpers ------------------------------------------------------------

function addCount(bag, id, n = 1) { bag[id] = (bag[id] || 0) + n; if (bag[id] <= 0) delete bag[id]; }
function spend(n) { if (G.bits < n) return false; G.bits -= n; return true; }

// ---- saving -------------------------------------------------------------------------

const SAVE_KEY = 'lantern-hollow-v4';
const SKIP = new Set(['started', 'paused', 'scene', 't', 'cast', 'cine', 'focus', 'bridgeBuild']);
function saveGame() {
  if (!G.started) return;
  try {
    const o = {};
    for (const k in G) if (!SKIP.has(k)) o[k] = G[k];
    localStorage.setItem(SAVE_KEY, JSON.stringify(o));
  } catch (e) { /* storage may be blocked; the game still runs */ }
}
function loadGame() {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    if (!s) return false;
    const o = JSON.parse(s), base = freshState();
    for (const k in base) if (o[k] !== undefined && !SKIP.has(k)) G[k] = o[k];
    for (const k in o) if (!(k in base)) G[k] = o[k];
    return true;
  } catch (e) { return false; }
}
function resetGame() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
