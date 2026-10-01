// Lantern Hollow — interface core: HUD, toasts, dialog, sheets, minigames.

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ICONS = {};

function makeIcons() {
  ICONS.coin = iconURL(coinPB(), 3);
  ICONS.lantern = iconURL(lanternIconPB(true), 3);
  ICONS.lanternOn = iconURL(lanternIconPB(true), 2);
  ICONS.lanternOff = iconURL(lanternIconPB(false), 2);
  const sun = new PB(11, 11); sun.disc(5, 5, 3, PAL.gold); [[5, 0], [5, 10], [0, 5], [10, 5], [1, 1], [9, 1], [1, 9], [9, 9]].forEach(([x, y]) => sun.set(x, y, PAL.gold2)); sun.set(4, 4, PAL.glow);
  ICONS.sun = iconURL(sun.outlineAuto(0.6), 2);
  const moon = new PB(11, 11); moon.disc(5, 5, 4, PAL.cream); moon.disc(7, 4, 3.4, 0); moon.set(3, 6, PAL.c1);
  ICONS.moon = iconURL(moon.outlineAuto(0.6), 2);
  ICONS.clock = ICONS.sun;
  const star = new PB(9, 9); [[4, 0], [4, 1], [3, 2], [4, 2], [5, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [2, 5], [3, 5], [5, 5], [6, 5], [1, 6], [2, 6], [6, 6], [7, 6], [1, 7], [7, 7]].forEach(([x, y]) => star.set(x, y, PAL.gold)); star.set(4, 2, PAL.glow);
  ICONS.star = iconURL(star.outlineAuto(0.6), 3);
  ICONS.seed = iconURL(cropSprite('turnip', 1), 2);
  ICONS.fish = iconURL(fishSprite(FISH[1]), 2);
  ICONS.heart = iconURL(bubbleHeartPB(), 3);
  ICONS.mail = iconURL(mailboxSprite(PAL.r1, true), 2);
}
function bubbleHeartPB() { const pb = new PB(9, 8); pb.dots([[1, 1], [2, 1], [6, 1], [7, 1], [0, 2], [1, 2], [2, 2], [3, 2], [5, 2], [6, 2], [7, 2], [8, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [3, 6], [4, 6], [5, 6], [4, 7]], PAL.f_rose); pb.set(2, 2, '#ffd0dc'); return pb.outlineAuto(0.5); }

// Emote bubbles (drawn in the world above heads).
const EMOTES = ['wave', 'heart', 'note', 'exclaim', 'question', 'sleep', 'star', 'sweat'];
const _bub = new Map();
function bubbleSprite(kind) {
  if (_bub.has(kind)) return _bub.get(kind);
  const pb = new PB(13, 14);
  pb.rect(1, 1, 11, 9, PAL.white); pb.hline(2, 10, 0, PAL.white); pb.hline(2, 10, 10, PAL.white); pb.dots([[5, 11], [6, 11], [5, 12]], PAL.white);
  const px = (pts, c) => pb.dots(pts, c);
  if (kind === 'heart') px([[4, 3], [5, 3], [7, 3], [8, 3], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [5, 6], [6, 6], [7, 6], [6, 7]], PAL.f_rose);
  if (kind === 'note') px([[7, 2], [8, 2], [9, 3], [7, 3], [7, 4], [7, 5], [7, 6], [5, 6], [6, 6], [5, 7], [6, 7], [5, 5], [6, 5]], PAL.ink);
  if (kind === 'exclaim') px([[6, 2], [6, 3], [6, 4], [6, 5], [6, 7], [5, 2], [5, 3], [5, 4], [5, 5], [5, 7]], PAL.f_red);
  if (kind === 'question') px([[5, 2], [6, 2], [7, 2], [8, 3], [8, 4], [7, 5], [6, 5], [6, 6], [6, 8]], PAL.b0);
  if (kind === 'sleep') px([[3, 3], [4, 3], [5, 3], [4, 4], [3, 5], [4, 5], [5, 5], [7, 5], [8, 5], [8, 6], [7, 7], [8, 7]], PAL.b0);
  if (kind === 'star') px([[6, 2], [6, 3], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [5, 5], [6, 5], [7, 5], [4, 6], [5, 6], [7, 6], [8, 6], [4, 7], [8, 7]], PAL.gold2);
  if (kind === 'sweat') px([[7, 2], [7, 3], [6, 4], [7, 4], [8, 4], [6, 5], [7, 5], [8, 5], [7, 6]], PAL.w2);
  if (kind === 'wave') px([[4, 3], [4, 4], [4, 5], [5, 2], [5, 3], [5, 4], [5, 5], [6, 3], [6, 4], [6, 5], [7, 3], [7, 4], [7, 5], [8, 5], [9, 4], [4, 6], [5, 6], [6, 6], [7, 6], [5, 7], [6, 7]], PAL.p1);
  const c = pb.outlineAuto(0.7).canvas();
  _bub.set(kind, c);
  return c;
}

const UI = {
  dlg: null, typer: null, modalOnAct: null, reelState: null, afterModal: null,

  // ---- HUD ----
  refreshHUD() {
    $('#bits-text').textContent = G.bits;
    const bd = typeof curBuild === 'function' ? curBuild() : null;
    if (bd) {
      const pct = Math.floor((G.build.given / bd.cost) * 100);
      $('#build-name').textContent = bd.name; $('#build-bar').style.width = pct + '%'; $('#build-pct').textContent = pct + '%';
    } else { $('#build-name').textContent = 'Town complete!'; $('#build-bar').style.width = '100%'; $('#build-pct').textContent = ''; }
  },
  updateClock() {},
  radioState() {},
  roomButtons() {},
  prompt(t) {
    const el = $('#prompt');
    let label = null;
    if (G.cast) label = G.cast.phase === 'bite' ? 'Reel it in!' : 'Wait…';
    else if (player && player.sit && !G.focus) label = 'Stand up';
    else if (t) label = t.label;
    if (!label || G.paused || G.cine || G.focus) { el.hidden = true; return; }
    el.hidden = false;
    el.classList.toggle('urgent', !!(G.cast && G.cast.phase === 'bite'));
    const span = el.querySelector('span');
    if (span.textContent !== label) span.textContent = label;
  },
  toast(text, icon) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = (ICONS[icon] ? `<img src="${ICONS[icon]}" alt="">` : '') + `<span>${esc(text)}</span>`;
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), 3400);
    setTimeout(() => el.remove(), 3900);
    while ($('#toasts').children.length > 4) $('#toasts').firstChild.remove();
  },
  reward(n, reason) {
    G.bits += n;
    this.toast(`+${n} bits · ${reason}`, 'coin');
    if (G.scene === 'town' || G.scene === 'home') floatText(player.x, player.y - 40, '+' + n);
    SFX.play('coin');
    const b = $('#bits'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
    this.refreshHUD(); saveGame();
  },
  fade(fn) {
    const f = $('#fade');
    f.classList.add('on');
    setTimeout(() => { fn(); this.refreshHUD(); setTimeout(() => f.classList.remove('on'), 60); }, 380);
  },

  // ---- dialog ----
  say(name, lines, opts = {}) {
    G.paused = true;
    this.dlg = { name, lines, i: 0, shown: 0, opts, choiceIdx: 0 };
    $('#dialog').hidden = false;
    $('#dlg-name').textContent = name;
    const pt = $('#dlg-portrait');
    pt.innerHTML = '';
    if (opts.face) pt.appendChild(faceCanvas(opts.face, 2));
    pt.hidden = !opts.face;
    $('#dlg-hearts').innerHTML = opts.hearts ? Array.from({ length: 10 }, (_, i) => `<i class="${i < opts.hearts ? 'on' : ''}"></i>`).join('') : '';
    $('#dlg-choices').innerHTML = '';
    SFX.play('open');
    this.typeLine();
  },
  typeLine() {
    const d = this.dlg, text = d.lines[d.i];
    d.shown = 0;
    $('#dlg-text').textContent = '';
    $('#dlg-more').hidden = true;
    $('#dlg-choices').innerHTML = '';
    clearInterval(this.typer);
    this.typer = setInterval(() => {
      d.shown++;
      $('#dlg-text').textContent = text.slice(0, d.shown);
      if (d.shown % 2 === 0 && text[d.shown - 1] !== ' ') SFX.play('blip');
      if (d.shown >= text.length) { clearInterval(this.typer); this.lineDone(); }
    }, 22);
  },
  lineDone() {
    const d = this.dlg;
    $('#dlg-text').textContent = d.lines[d.i];
    if (d.i === d.lines.length - 1 && d.opts.choices) {
      const box = $('#dlg-choices');
      box.innerHTML = d.opts.choices.map((c, i) => c.href
        ? `<a class="choice" href="${esc(c.href)}" target="_blank" rel="noopener" data-i="${i}">${esc(c.label)}</a>`
        : `<button type="button" class="choice" data-i="${i}">${esc(c.label)}</button>`).join('');
      box.querySelectorAll('.choice').forEach((el) => el.addEventListener('click', (e) => { e.stopPropagation(); this.choose(+el.dataset.i); }));
      this.markChoice();
    } else $('#dlg-more').hidden = false;
  },
  markChoice() { $('#dlg-choices').querySelectorAll('.choice').forEach((el, i) => el.classList.toggle('sel', i === this.dlg.choiceIdx)); },
  choose(i) {
    if (!this.dlg) return;
    const c = this.dlg.opts.choices[i];
    this.closeDialog();
    if (c.fn) c.fn();
  },
  closeDialog() {
    clearInterval(this.typer);
    const d = this.dlg;
    this.dlg = null;
    $('#dialog').hidden = true; $('#dlg-choices').innerHTML = '';
    G.paused = !$('#modal').hidden;
    if (d && d.opts.onDone) d.opts.onDone();
  },
  advance() {
    const d = this.dlg;
    if (d.shown < d.lines[d.i].length) { clearInterval(this.typer); d.shown = 9999; this.lineDone(); return; }
    if (d.i < d.lines.length - 1) { d.i++; this.typeLine(); return; }
    if (d.opts.choices) {
      const c = d.opts.choices[d.choiceIdx];
      if (c.href) { const a = document.querySelector('#dlg-choices .choice.sel'); if (a) a.click(); this.closeDialog(); return; }
      this.choose(d.choiceIdx); return;
    }
    this.closeDialog();
  },
  nav(dy) {
    const d = this.dlg;
    if (d && d.opts.choices && d.i === d.lines.length - 1 && d.shown >= d.lines[d.i].length) {
      const n = d.opts.choices.length;
      d.choiceIdx = (d.choiceIdx + dy + n) % n; this.markChoice(); SFX.play('blip');
      return true;
    }
    return false;
  },
  handleAct() {
    if (this.reelState) { this.reelPress(); return true; }
    if (this.dlg) { this.advance(); return true; }
    if (!$('#modal').hidden) { if (this.modalOnAct) this.modalOnAct(); return true; }
    return false;
  },

  // ---- sheets ----
  modal(html, { onAct = null, wide = false, cls = '' } = {}) {
    G.paused = true;
    const m = $('#modal');
    m.innerHTML = `<div class="sheet box${wide ? ' wide' : ''} ${cls}" role="dialog" aria-modal="true">${html}<button type="button" class="close" aria-label="Close">×</button></div>`;
    m.hidden = false;
    m.querySelector('.close').addEventListener('click', () => this.closeModal());
    this.modalOnAct = onAct;
    SFX.play('open');
    return m.querySelector('.sheet');
  },
  closeModal() {
    $('#modal').hidden = true; $('#modal').innerHTML = '';
    this.modalOnAct = null; this.reelState = null;
    G.paused = !!this.dlg;
    SFX.play('close');
    if (this.afterModal) { const f = this.afterModal; this.afterModal = null; f(); }
  },
  tabs(sheet, names, current, onPick) {
    const bar = sheet.querySelector('.tabs');
    bar.innerHTML = names.map(([id, label]) => `<button type="button" class="tab${id === current ? ' on' : ''}" data-tab="${id}">${label}</button>`).join('');
    bar.addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (b) onPick(b.dataset.tab); });
  },

  // ---- fishing ----
  reel(fish, cb) {
    const size = fish.junk ? 0.34 : fish.rare === 1 ? 0.3 : fish.rare === 2 ? 0.21 : 0.14;
    const speed = fish.junk ? 0.8 : fish.rare === 1 ? 1 : fish.rare === 2 ? 1.35 : 1.75;
    const start = 0.1 + Math.random() * (0.8 - size);
    const sheet = this.modal(`<h2 class="center">A bite!</h2>
      <p class="lede center">Press E when the marker is in the green.</p>
      <div class="reel"><div class="zone" style="left:${start * 100}%;width:${size * 100}%"></div><div class="needle"></div></div>
      <button type="button" class="btn big" id="reel-btn">Reel in</button>`);
    sheet.querySelector('.close').remove();
    const needle = sheet.querySelector('.needle');
    const st = { pos: 0, dir: 1, done: false, zone: [start, start + size], cb };
    this.reelState = st;
    let last = performance.now();
    const anim = (now) => {
      if (st.done || this.reelState !== st) return;
      const dt = (now - last) / 1000; last = now;
      st.pos += st.dir * dt * speed;
      if (st.pos > 1) { st.pos = 1; st.dir = -1; } if (st.pos < 0) { st.pos = 0; st.dir = 1; }
      needle.style.left = st.pos * 100 + '%';
      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
    sheet.querySelector('#reel-btn').addEventListener('click', (e) => { e.stopPropagation(); this.reelPress(); });
  },
  reelPress() {
    const st = this.reelState;
    if (!st || st.done) return;
    st.done = true;
    const ok = st.pos >= st.zone[0] - 0.02 && st.pos <= st.zone[1] + 0.02;
    SFX.play(ok ? 'splash' : 'fail');
    this.reelState = null;
    this.closeModal();
    st.cb(ok);
  },
  catchCard(f, len, isNew) {
    const stars = f.junk ? '' : '★'.repeat(f.rare) + '☆'.repeat(3 - f.rare);
    const sheet = this.modal(`<div class="catch">
      <p class="eyebrow">${isNew ? 'New in your journal' : 'You caught'}</p>
      <div class="fishpv"></div>
      <h2>${esc(f.name)}</h2>
      <p class="meta">${f.junk ? esc(f.quip) : `${len} cm <span class="stars" aria-label="Rarity ${f.rare} of 3">${stars}</span>`}</p>
      <button type="button" class="btn big" id="keep">OK</button></div>`, { onAct: () => this.closeModal() });
    sheet.querySelector('.fishpv').appendChild(upscale(fishSprite(f), 5));
    sheet.querySelector('#keep').addEventListener('click', () => this.closeModal());
    SFX.play(isNew ? 'chime' : 'coin');
  },

  // ---- the start of a new day: a small gift for coming by ----
  morning() {
    if (G.lastCheckIn === G.day) return;
    G.lastCheckIn = G.day;
    G.bits += 5;
    this.toast('+5 bits for visiting today', 'coin');
    this.refreshHUD(); saveGame();
  },
};

function fmtTime(s) { s = Math.ceil(s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
