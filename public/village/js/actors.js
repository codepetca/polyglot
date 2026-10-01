// Lantern Hollow — characters, pets and farm animals drawn from the CC0
// "Ninja Adventure" asset pack by Pixel-Boy and AAA (see assets/CREDITS.txt).
//
// A character sheet is 4 columns (down, up, left, right) x 7 rows of 16x16:
// rows 0-3 walk, row 4 tool swing, row 5 hop, row 6 = [lie down, hold item up, special, special].

const ASSETS = { chars: {}, faces: {}, pets: {}, petFaces: {}, farm: {}, emotes: {}, items: {}, manifest: null };

function loadImage(src) {
  return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
}

async function loadAssets(onProgress) {
  const man = await fetch('assets/manifest.json').then((r) => r.json()).catch(() => null);
  ASSETS.manifest = man;
  if (!man) return false;
  const jobs = [];
  const add = (p, fn) => jobs.push(loadImage(p).then(fn));
  for (const id of man.chars) {
    add(`assets/chars/${id}/sheet.png`, (im) => { ASSETS.chars[id] = im; });
    add(`assets/chars/${id}/face.png`, (im) => { ASSETS.faces[id] = im; });
  }
  for (const p of man.pets) {
    add(`assets/pets/${p.id}/sheet.png`, (im) => { ASSETS.pets[p.id] = im; });
    add(`assets/pets/${p.id}/face.png`, (im) => { ASSETS.petFaces[p.id] = im; });
  }
  for (const f of man.farm) add(`assets/farm/${f.id}.png`, (im) => { ASSETS.farm[f.id] = im; });
  for (const e of man.emotes) add(`assets/emotes/${e}.png`, (im) => { ASSETS.emotes[e] = im; });
  for (const k of Object.keys(man.items)) add(`assets/items/${k}.png`, (im) => { ASSETS.items[k] = im; });
  let done = 0;
  await Promise.all(jobs.map((j) => j.then(() => { done++; if (onProgress) onProgress(done / jobs.length); })));
  return true;
}

// ---- who you can be -------------------------------------------------------------------

// Free from the start.
const STARTERS = ['Villager', 'Villager2', 'Villager3', 'Villager4', 'Villager5', 'Villager6', 'Woman', 'Boy', 'Cavegirl', 'EggBoy', 'EggGirl', 'Hunter',
  'Monk', 'MaskFrog', 'MaskRacoon', 'LionBoy', 'Pig', 'Monkey', 'Eskimo', 'OldMan'];
// Costumes you unlock with bits earned by studying.
const COSTUMES = [
  ['Princess', 120], ['Noble', 120], ['Inspector', 100], ['Knight', 160], ['Samurai', 160], ['SamuraiBlue', 160],
  ['NinjaGreen', 140], ['NinjaBlue', 140], ['NinjaRed', 140], ['NinjaYellow', 140], ['NinjaLeaf', 180], ['NinjaWater', 180], ['NinjaFire', 180], ['NinjaThunder', 220],
  ['Master', 200], ['Shaman', 180], ['Sultan', 160], ['RobotGreen', 200], ['RobotGrey', 200],
  ['GreenPig', 90], ['CaveLion', 150], ['Lion', 150], ['LionOrange', 150], ['MonkeyBoxerRed', 150], ['Skeleton', 250], ['Vampire', 250], ['SorcererOrange', 220],
].map(([id, price]) => ({ id, price }));
const COSTUME_PRICE = Object.fromEntries(COSTUMES.map((c) => [c.id, c.price]));
const PETS = [['Cat', 80], ['CatOrange', 80], ['CatBlack', 80], ['CatWhite', 80], ['Dog', 90], ['DogOrange', 90], ['DogYellow', 90], ['DogBlack', 90], ['Dog2', 90],
  ['Hamster', 60], ['Frog', 60], ['Racoon', 120], ['LionCub', 150]].map(([id, price]) => ({ id, price }));
const PET_PRICE = Object.fromEntries(PETS.map((p) => [p.id, p.price]));
const prettyName = (id) => id.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/(\D)(\d)$/, '$1 $2');

// ---- drawing ------------------------------------------------------------------------------

const DIR_COL = [0, 2, 3, 1]; // our dirs: 0 down, 1 left, 2 right, 3 up → sheet columns

function actorCell(pose) {
  const col = DIR_COL[pose.dir || 0], t = pose.t || 0;
  switch (pose.anim) {
    case 'walk': return [col, Math.floor(t * 7) % 4];
    case 'run': return [col, Math.floor(t * 11) % 4];
    case 'hoe': case 'water': case 'fish': case 'chop': return [col, pose.anim === 'fish' && !pose.cast ? 0 : 4];
    case 'hop': case 'wave': return [col, (t * 6 | 0) % 2 ? 5 : 0];
    case 'harvest': case 'item': return [1, 6];
    case 'sleep': return [0, 6];
    default: return [col, 0];
  }
}

// Draw a character with its feet at (x, y).
function drawActor(g, skin, x, y, pose) {
  const img = ASSETS.chars[skin] || ASSETS.chars.Villager;
  if (!img) return;
  const [c, r] = actorCell(pose);
  let dy = 0;
  if (pose.anim === 'idle' && Math.sin((pose.t || 0) * 2.4) > 0.8) dy = 1; // a breath
  if (pose.anim === 'sit') dy = -3;
  if (pose.anim === 'hop' || pose.anim === 'wave') dy = -Math.round(Math.abs(Math.sin((pose.t || 0) * 7)) * 3);
  g.drawImage(img, c * 16, r * 16, 16, 16, Math.round(x) - 8, Math.round(y) - 16 + dy, 16, 16);
}

// Pets and farm animals: two frames (rest, step), drawn facing their direction.
function drawCritterSheet(g, img, x, y, frame, flip) {
  if (!img) return;
  const fw = Math.floor(img.width / 2), fh = img.height;
  const sx = (frame % 2) * fw;
  if (flip) { g.save(); g.translate(Math.round(x), 0); g.scale(-1, 1); g.drawImage(img, sx, 0, fw, fh, -Math.floor(fw / 2), Math.round(y) - fh, fw, fh); g.restore(); }
  else g.drawImage(img, sx, 0, fw, fh, Math.round(x) - Math.floor(fw / 2), Math.round(y) - fh, fw, fh);
}

function drawEmote(g, id, x, y) {
  const im = ASSETS.emotes[id];
  if (im) g.drawImage(im, Math.round(x) - (im.width >> 1), Math.round(y) - im.height);
}

// Portraits for dialogs and menus (a crisp upscaled copy).
function faceCanvas(skin, scale = 2) {
  const im = ASSETS.faces[skin] || ASSETS.petFaces[skin];
  if (!im) return makeCanvas(1, 1);
  const c = makeCanvas(im.width * scale, im.height * scale), g = c.getContext('2d');
  g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0, c.width, c.height);
  return c;
}
function spriteCanvas(skin, scale = 3, dir = 0) {
  const c = makeCanvas(16 * scale, 16 * scale), g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const img = ASSETS.chars[skin];
  if (img) g.drawImage(img, DIR_COL[dir] * 16, 0, 16, 16, 0, 0, 16 * scale, 16 * scale);
  return c;
}
function itemCanvas(key, scale = 3) {
  const im = ASSETS.items[key];
  if (!im) return makeCanvas(1, 1);
  const c = makeCanvas(im.width * scale, im.height * scale), g = c.getContext('2d');
  g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0, c.width, c.height);
  return c;
}

// Emote ids used by the game (indexes into the pack's 30 emotes).
const EMOTE_IDS = { wave: 11, heart: 27, note: 18, exclaim: 22, question: 25, sleep: 28, star: 29, sweat: 2, happy: 6, sad: 13, shocked: 1, dots: 20, cry: 19 };
