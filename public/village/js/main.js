// Lantern Hollow — boot, input and the main loop.

function act() {
  audioInit();
  if (!$('#menu').hidden) return;
  if (UI.handleAct()) return;
  if (!G.started || G.cine) return;
  if (G.cast) return fishPress();
  if (player.sit) { standUp(player); player.idleT = 0; return; }
  const t = findTarget();
  if (t) t.fn();
}

const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ShiftLeft: 'run', ShiftRight: 'run' };
function setupInput() {
  addEventListener('keydown', (e) => {
    if (e.target.matches && e.target.matches('input')) return;
    const k = KEYMAP[e.code];
    if (G.started && (k === 'up' || k === 'down') && UI.nav(k === 'up' ? -1 : 1)) { e.preventDefault(); return; }
    if (k) { KEYS[k] = true; if (G.started) e.preventDefault(); }
    if (!G.started) return;
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
      if (e.target.closest && e.target.closest('a,button') && e.code !== 'KeyE') return;
      e.preventDefault(); if (!e.repeat) act();
    }
    if (e.code === 'Escape' || e.code === 'KeyM') {
      if (UI.reelState) return;
      if (UI.dlg) UI.closeDialog();
      else if (!$('#modal').hidden) UI.closeModal();
      else if (!$('#demo').hidden) $('#demo').hidden = true;
      else UI.menu($('#menu').hidden);
    }
    if (G.paused || e.repeat) return;
    if (/^Digit[1-8]$/.test(e.code)) { emote(player, EMOTES[+e.code.slice(5) - 1]); SFX.play('blip'); }
  });
  addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) KEYS[k] = false; });
  addEventListener('blur', () => Object.keys(KEYS).forEach((k) => (KEYS[k] = false)));
}

function setupButtons() {
  $('#btn-menu').addEventListener('click', () => UI.menu(true));
  $('#m-close').addEventListener('click', () => UI.menu(false));
  $('#m-wardrobe').addEventListener('click', () => UI.wardrobe());
  $('#m-music').addEventListener('click', () => { MUSIC.toggle(); UI.menu(true); });
  $('#m-sound').addEventListener('click', () => { G.settings.sound = !G.settings.sound; UI.menu(true); });
  $('#m-demo').addEventListener('click', () => { UI.menu(false); $('#demo').hidden = false; });
  $('#demo-lesson').addEventListener('click', () => UI.demoLesson());
  $('#demo-tomorrow').addEventListener('click', () => sleepUntilMorning());
  $('#demo-reset').addEventListener('click', () => { resetGame(); location.reload(); });
  $('#demo-close').addEventListener('click', () => { $('#demo').hidden = true; });
  $('#menu').addEventListener('click', (e) => { if (e.target.id === 'menu') UI.menu(false); });
  $('#dialog').addEventListener('click', (e) => { if (!e.target.closest('.choice')) UI.handleAct(); });
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' && !UI.reelState) UI.closeModal(); });
}

function touchControls() {
  if (!matchMedia('(pointer: coarse)').matches) return;
  const pad = $('#stick'), knob = $('#knob');
  let id = null, ox = 0, oy = 0;
  const move = (e) => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - ox, dy = e.clientY - oy; const d = Math.hypot(dx, dy), max = 38;
    if (d > max) { dx *= max / d; dy *= max / d; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    TOUCH.x = Math.abs(dx) > 8 ? dx / max : 0; TOUCH.y = Math.abs(dy) > 8 ? dy / max : 0;
  };
  pad.addEventListener('pointerdown', (e) => { id = e.pointerId; const r = pad.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2; pad.setPointerCapture(id); move(e); });
  pad.addEventListener('pointermove', move);
  const end = (e) => { if (e.pointerId !== id) return; id = null; TOUCH.x = TOUCH.y = 0; knob.style.transform = ''; };
  pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
  $('#abtn').addEventListener('pointerdown', (e) => { e.preventDefault(); act(); });
}

// Called by newDay() in state.js.
function onNewDay() { G.pendingMorning = true; }

function start(skin, name) {
  G.skin = skin; player.skin = skin;
  if (!G.skinsOwned.includes(skin) && !STARTERS.includes(skin)) G.skin = player.skin = 'Villager3';
  syncPets();
  if (name) G.name = name;
  const first = !G.lastCheckIn;
  G.started = true;
  ['#bits', '#build', '#btn-menu'].forEach((s) => { $(s).hidden = false; });
  if (matchMedia('(pointer: coarse)').matches) $('#touch').hidden = false;
  const h = OBJ.find((o) => o.isHome);
  player.x = h.doorX; player.y = h.doorY + 4; player.dir = 0;
  cam.x = player.x - VW / 2; cam.y = player.y - VH / 2;
  $('#coin-img').src = ICONS.coin;
  UI.refreshHUD();
  SFX.play('chime');
  MUSIC.on = G.settings.bgm !== false; MUSIC.tick(true); // music on unless they turned it off
  if (first) setTimeout(() => UI.say('Lantern Hollow', [G.name === 'You' ? 'Hi!' : `Hi, ${G.name}!`, 'Study in class to earn bits.', 'Bring them to the build site. Your class builds the town together.'], { onDone: () => UI.morning() }), 600);
  else UI.morning();
  queuePicks(); // a pick left over from last time
  saveGame();
}

let lastTs = 0, ambT = 0, classT = 6;
function step(dt) {
  G.t += dt;
  const sitSpeed = player && player.sit ? (player.sit.sleep ? 12 : player.sit.ground ? 1 : 10) : 1;
  if (!G.paused || !G.started) advanceClock(dt, G.started ? sitSpeed : 1);
  if (G.pendingMorning && G.clock >= 6 * 60 && G.clock < 12 * 60 && !G.paused) { G.pendingMorning = false; UI.morning(); }
  updateCritters(dt);
  if (G.scene === 'town') updateNPCs(dt);
  if (G.started) {
    updatePlayer(dt); updateFishing(dt); updateCine(dt); updatePets(dt);
    classT -= dt;
    if (classT < 0) { classT = 12 + Math.random() * 10; classmatesGive(); }
    currentTarget = G.paused ? null : findTarget();
    UI.prompt(currentTarget);
    document.body.classList.toggle('afk', player.idleT > 30 && !G.paused);
    MUSIC.tick();
  }
  updateParts(dt);
  spawnAmbient(dt, cam.x, cam.y);
  updateCamera(dt);
  ambT -= dt;
  if (ambT < 0 && G.started && G.scene === 'town') {
    ambT = 1.5 + Math.random() * 3;
    if (isNight()) { SFX.play('cricket'); if (Math.random() < 0.3) SFX.play('frog'); }
    else if (Math.random() < 0.5) SFX.play('bird');
  }
}

function frame(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0);
  lastTs = ts;
  step(dt);
  render(dt);
  requestAnimationFrame(frame);
}

async function boot() {
  $('#loading').hidden = false;
  await loadAssets((k) => { $('#loading-bar').style.width = Math.round(k * 100) + '%'; });
  $('#loading').hidden = true;
  makeIcons();
  const had = loadGame();
  initTown();
  if (G.projects.bridge.done) openBridge();
  siteSprite = constructionSprite();
  const h = OBJ.find((o) => o.isHome);
  player = makeChar(G.skin, h.doorX, h.doorY + 4, G.name);
  initNPCs();
  initRender($('#game'));
  setupCreator(); setupInput(); setupButtons(); touchControls();
  if (had) $('#cr-name').value = G.name;
  syncPets();
  Creator.open(G.skin, { button: had ? 'Continue' : 'Start', onDone: start });
  setInterval(saveGame, 15000);
  requestAnimationFrame(frame);
}
boot();
