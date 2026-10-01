// Lantern Hollow — your house: a room you decorate and spend quiet time in.

const ROOM = { w: 11, h: 9, wall: 3 }; // tiles; the top 3 rows are the back wall
const RW = ROOM.w * TILE, RH = ROOM.h * TILE;
let roomCv = null, decor = null; // decor = { holding: id | null, gx, gy }

function renderRoomShell() {
  const pb = new PB(RW + 8, RH + 8);
  const ox = 4, oy = 4, wallH = ROOM.wall * TILE;
  // wallpaper: soft stripes with tiny flowers
  for (let y = 0; y < wallH; y++) for (let x = 0; x < RW; x++) {
    let c = Math.floor(x / 6) % 2 ? '#fdf0e6' : '#f9e4d8';
    if ((x % 12 === 3) && (y % 10 === 4)) c = '#f6b5c4';
    if (y < 3) c = '#e9c9b8';
    pb.set(ox + x, oy + y, c);
  }
  for (let x = 0; x < RW; x++) { pb.set(ox + x, oy + wallH - 3, PAL.k3); pb.set(ox + x, oy + wallH - 2, PAL.k2); pb.set(ox + x, oy + wallH - 1, PAL.k1); }
  // wooden floor with staggered planks
  for (let y = wallH; y < RH; y++) for (let x = 0; x < RW; x++) {
    const row = Math.floor((y - wallH) / 6), off = (row % 3) * 13;
    let c = row % 2 ? '#e0a874' : '#d99d68';
    if ((y - wallH) % 6 === 5) c = '#b9794e';
    else if ((x + off) % 34 === 0) c = '#b9794e';
    else if (hash2(x >> 2, row, 5) > 0.85) c = shade(c, 0.08);
    pb.set(ox + x, oy + y, c);
  }
  // walls around the room and a doorway at the bottom
  pb.rect(0, 0, RW + 8, 4, '#b98a74'); pb.rect(0, 0, 4, RH + 8, '#b98a74'); pb.rect(RW + 4, 0, 4, RH + 8, '#b98a74'); pb.rect(0, RH + 4, RW + 8, 4, '#b98a74');
  const dx = ox + Math.floor(RW / 2) - 12;
  pb.rect(dx, RH + 4, 24, 4, '#e9cfa8');
  pb.rect(dx + 2, RH, 20, 4, '#f2b5c4'); // doormat
  return pb.outlineAuto(0.5).canvas();
}

function enterHome() {
  UI.fade(() => {
    G.scene = 'home';
    if (!roomCv) roomCv = renderRoomShell();
    player.x = RW / 2 + 4; player.y = RH - 2; player.dir = 3; player.sit = null;
    cam.x = player.x - VW / 2; cam.y = player.y - VH / 2;
    UI.roomButtons(true);
  });
}
function exitHome() {
  decor = null;
  UI.fade(() => {
    G.scene = 'town';
    const h = OBJ.find((o) => o.isHome);
    player.x = h.doorX; player.y = h.doorY + 2; player.dir = 0; player.sit = null;
    cam.x = player.x - VW / 2; cam.y = player.y - VH / 2;
    UI.roomButtons(false);
  });
}

// ---- furniture placement ---------------------------------------------------------------

const FLOOR_Y0 = ROOM.wall; // furniture grid rows start at the floor
function itemRect(p) {
  const F = FURNITURE[p.id], [w, h] = F.size;
  return F.wall ? { x: p.x, y: 0, w, h: 1, wall: true } : { x: p.x, y: p.y, w, h, wall: false };
}
function fits(id, gx, gy, ignore) {
  const F = FURNITURE[id], [w, h] = F.size;
  if (F.wall) { if (gx < 0 || gx + w > ROOM.w) return false; }
  else if (gx < 0 || gy < 0 || gx + w > ROOM.w || gy + h > ROOM.h - FLOOR_Y0 - 0) return false;
  const doorX = Math.floor(ROOM.w / 2);
  if (!F.wall && gy + h >= ROOM.h - FLOOR_Y0 && gx <= doorX && gx + w > doorX) return false;
  for (const p of G.home.placed) {
    if (p === ignore) continue;
    const r = itemRect(p), q = FURNITURE[p.id];
    if (!!q.wall !== !!F.wall) continue;
    if (!F.wall && (q.floor !== F.floor)) continue; // rugs live under furniture
    if (gx < r.x + r.w && gx + w > r.x && (F.wall || (gy < r.y + r.h && gy + h > r.y))) return false;
  }
  return true;
}
function placeItem(id, gx, gy) {
  if ((G.furnOwned[id] || 0) <= 0 || !fits(id, gx, gy)) return false;
  G.home.placed.push({ id, x: gx, y: FURNITURE[id].wall ? 0 : gy });
  addCount(G.furnOwned, id, -1);
  SFX.play('place'); saveGame();
  return true;
}
function pickItem(p) {
  G.home.placed.splice(G.home.placed.indexOf(p), 1);
  addCount(G.furnOwned, p.id, 1);
  SFX.play('pop'); saveGame();
}
function itemAt(gx, gy, wall) {
  for (let i = G.home.placed.length - 1; i >= 0; i--) {
    const p = G.home.placed[i], r = itemRect(p);
    if (r.wall !== wall) continue;
    if (gx >= r.x && gx < r.x + r.w && (wall || (gy >= r.y && gy < r.y + r.h))) return p;
  }
  return null;
}

// ---- collision in the room -----------------------------------------------------------------

function roomFree(x, y) {
  const lx = x - 4, ly = y - 4;
  if (lx < 6 || lx > RW - 6 || ly < ROOM.wall * TILE + 4 || ly > RH - 1) return ly > RH - 6 && Math.abs(lx - RW / 2) < 10 && ly < RH + 6;
  for (const p of G.home.placed) {
    const F = FURNITURE[p.id];
    if (F.wall || F.floor) continue;
    const r = itemRect(p), x0 = r.x * TILE, y0 = (r.y + FLOOR_Y0) * TILE + (r.h > 1 ? 8 : 6), x1 = x0 + r.w * TILE, y1 = (r.y + FLOOR_Y0 + r.h) * TILE;
    if (lx + 4 > x0 && lx - 4 < x1 && ly > y0 && ly - 3 < y1) return false;
  }
  return true;
}

function homeTarget() {
  const [px, py] = probe();
  const lx = px - 4, ly = py - 4;
  if (ly > RH - 12 && Math.abs(lx - RW / 2) < 14) return { label: 'Go outside', fn: exitHome, x: RW / 2 + 4, y: RH - 20 };
  const gx = Math.floor(lx / TILE), gy = Math.floor(ly / TILE) - FLOOR_Y0;
  const p = itemAt(gx, gy, false) || itemAt(gx, gy + 1, false);
  if (!p) return null;
  const F = FURNITURE[p.id], mx = (p.x + F.size[0] / 2) * TILE + 4, my = (p.y + FLOOR_Y0) * TILE - 6;
  if (p.id.startsWith('bed')) return { label: G.clock >= 18 * 60 || G.clock < 5 * 60 ? 'Sleep until morning' : 'Take a nap', fn: () => (G.clock >= 18 * 60 || G.clock < 5 * 60 ? sleepUntilMorning() : napHere(p)), x: mx, y: my };
  return null;
}
function napHere(p) {
  player.sit = { x: player.x, y: player.y, dir: 0, ground: true, sleep: true };
  emote(player, 'sleep', 4);
  UI.toast('A short nap. Time passes faster while you rest.', 'clock');
}

// ---- drawing --------------------------------------------------------------------------------

function windowView(w, h) {
  const c = makeCanvas(w, h), g = c.getContext('2d');
  const amb = ambient(), n = amb.nf;
  const top = n > 0.5 ? '#2b2d63' : mix('#a9dcff', '#ffb38a', clamp((G.clock - 16.5 * 60) / 180, 0, 1));
  g.fillStyle = top; g.fillRect(0, 0, w, h);
  g.fillStyle = n > 0.5 ? '#474b8f' : '#d6f0ff'; g.fillRect(0, h * 0.6, w, h * 0.4);
  if (n > 0.5) { g.fillStyle = '#fff6c8'; g.fillRect(w - 9, 3, 4, 4); g.fillStyle = '#fff'; [[3, 4], [10, 9], [16, 3], [6, 12]].forEach(([x, y]) => g.fillRect(x, y, 1, 1)); }
  else { g.fillStyle = '#ffffff'; g.fillRect(4 + ((G.t * 2) % (w + 10)) - 10, 5, 8, 3); g.fillRect(6 + ((G.t * 2) % (w + 10)) - 10, 4, 4, 1); g.fillStyle = PAL.g3; g.fillRect(0, h - 4, w, 4); }
  return c;
}

function drawRoom(g, cx, cy) {
  const ox = -cx, oy = -cy;
  g.fillStyle = '#2a2033'; g.fillRect(0, 0, VW, VH);
  g.drawImage(roomCv, ox, oy);
  const list = [];
  for (const p of G.home.placed) {
    const F = FURNITURE[p.id], spr = furnitureSprite(p.id), x = ox + 4 + p.x * TILE;
    if (F.wall) {
      if (p.id === 'window') { const v = windowView(F.size[0] * TILE - 8, 16); g.drawImage(v, x + 4, oy + 4 + 4 + 4); }
      g.drawImage(spr, x, oy + 4 + 4);
    } else if (F.floor) g.drawImage(spr, x, oy + 4 + (p.y + FLOOR_Y0) * TILE - 10 + 2);
    else list.push({ sortY: (p.y + FLOOR_Y0 + F.size[1]) * TILE, draw: () => g.drawImage(spr, x, oy + 4 + (p.y + FLOOR_Y0) * TILE - 10) });
  }
  list.push({ sortY: player.y - 4, draw: () => drawCharAt(g, player, cx, cy) });
  list.sort((a, b) => a.sortY - b.sortY).forEach((d) => d.draw());
  // sun beams from the window during the day
  const amb = ambient();
  const win = G.home.placed.find((p) => p.id === 'window');
  if (win && amb.nf < 0.3) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.09;
    g.fillStyle = '#ffe9b0';
    const wx = ox + 4 + win.x * TILE + 4;
    g.beginPath(); g.moveTo(wx, oy + 30); g.lineTo(wx + 26, oy + 30); g.lineTo(wx + 60, oy + RH - 10); g.lineTo(wx + 22, oy + RH - 10); g.closePath(); g.fill();
    g.restore();
  }
  if (decor) drawDecorOverlay(g, ox, oy);
}

function drawDecorOverlay(g, ox, oy) {
  g.save();
  g.globalAlpha = 0.18; g.fillStyle = '#ffffff';
  for (let gy = 0; gy < ROOM.h - FLOOR_Y0; gy++) for (let gx = 0; gx < ROOM.w; gx++) if ((gx + gy) % 2) g.fillRect(ox + 4 + gx * TILE, oy + 4 + (gy + FLOOR_Y0) * TILE, TILE, TILE);
  g.restore();
  if (decor.holding && decor.gx !== undefined) {
    const F = FURNITURE[decor.holding], ok = fits(decor.holding, decor.gx, decor.gy);
    const x = ox + 4 + decor.gx * TILE, y = F.wall ? oy + 8 : oy + 4 + (decor.gy + FLOOR_Y0) * TILE - 10;
    g.globalAlpha = 0.75; g.drawImage(furnitureSprite(decor.holding), x, y); g.globalAlpha = 1;
    g.strokeStyle = ok ? '#7fe3b0' : '#ff7474'; g.lineWidth = 1;
    g.strokeRect(x + 0.5, (F.wall ? oy + 8 : oy + 4 + (decor.gy + FLOOR_Y0) * TILE) + 0.5, F.size[0] * TILE - 1, (F.wall ? 1 : F.size[1]) * TILE - 1);
  }
}

// Screen pixel → room grid cell (used by the decorate cursor).
function roomCellAt(sx, sy) {
  const x = sx + Math.round(cam.x) - 4, y = sy + Math.round(cam.y) - 4;
  return { gx: Math.floor(x / TILE), gy: Math.floor(y / TILE) - FLOOR_Y0, wall: y < FLOOR_Y0 * TILE };
}
