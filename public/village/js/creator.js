// Lantern Hollow — pick who you are (also the wardrobe at home).

const Creator = {
  skin: 'Villager3', t: 0, running: false, onDone: null, editing: false,

  open(skin, { title = 'Lantern Hollow', button = 'Start', onDone, editing = false } = {}) {
    this.skin = skin;
    this.onDone = onDone;
    this.editing = editing;
    $('#title').hidden = false;
    $('#title-h').textContent = title;
    $('#start').textContent = button;
    $('#title').classList.toggle('editing', editing);
    $('#cr-name-row').hidden = editing;
    this.draw();
    if (!this.running) { this.running = true; requestAnimationFrame(() => this.tick()); }
  },
  close() { $('#title').hidden = true; this.running = false; },

  choices() {
    const owned = (G.skinsOwned || []).filter((id) => !STARTERS.includes(id));
    return [...STARTERS, ...owned];
  },

  draw() {
    const grid = $('#cr-grid');
    grid.innerHTML = this.choices().map((id) => `<button type="button" class="kind" data-skin="${id}" aria-pressed="${id === this.skin}" title="${prettyName(id)}"></button>`).join('');
    grid.querySelectorAll('.kind').forEach((b) => b.appendChild(faceCanvas(b.dataset.skin, 1)));
    $('#cr-who').textContent = prettyName(this.skin);
    const locked = COSTUMES.filter((c) => !(G.skinsOwned || []).includes(c.id)).length;
    $('#cr-more').textContent = locked ? `${locked} more costumes unlock with bits you earn by studying.` : 'You have unlocked every costume.';
  },

  tick() {
    if (!this.running) return;
    this.t += 1 / 60;
    const c = $('#preview'), g2 = c.getContext('2d');
    g2.clearRect(0, 0, c.width, c.height);
    g2.fillStyle = 'rgba(52,34,74,.2)'; g2.fillRect(10, 22, 12, 2); g2.fillRect(11, 21, 10, 1);
    const dir = [0, 2, 3, 1][Math.floor(this.t / 1.8) % 4];
    drawActor(g2, this.skin, 16, 22, { dir, anim: 'walk', t: this.t });
    requestAnimationFrame(() => this.tick());
  },

  pick(e) {
    const b = e.target.closest('.kind');
    if (!b) return;
    this.skin = b.dataset.skin;
    SFX.play('pop');
    this.draw();
  },

  submit() {
    const name = ($('#cr-name').value || '').trim().slice(0, 12);
    this.close();
    if (this.onDone) this.onDone(this.skin, name);
  },
};

function setupCreator() {
  $('#cr-grid').addEventListener('click', (e) => Creator.pick(e));
  $('#cr-random').addEventListener('click', () => { const ch = Creator.choices(); Creator.skin = ch[Math.floor(Math.random() * ch.length)]; Creator.draw(); SFX.play('pop'); });
  $('#title-form').addEventListener('submit', (e) => { e.preventDefault(); audioInit(); Creator.submit(); });
}
