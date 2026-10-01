// Lantern Hollow — the few menus: places, the wardrobe, the teacher demo.

Object.assign(UI, {
  place(kind) {
    if (kind === 'school') return this.say('School', ['Finish lessons in class to earn bits.'], {
      choices: [{ label: 'Open polyglot', href: '/' }, { label: 'Demo: finish a lesson', fn: () => this.demoLesson() }, { label: 'Leave' }],
    });
    if (kind === 'library') return this.say('Library', ['Shh. Everyone is reading.']);
    if (kind === 'cafe') return this.say('Café', ['It smells like cinnamon in here.']);
  },
  knock(c) {
    const npc = NPCS.find((n) => n.def === c);
    this.say(`${c.name}'s house`, [npc && npc.inside ? `${c.name} is home.` : `${c.name} is out.`]);
  },
  lantern() {},

  menu(open = true) {
    $('#menu').hidden = !open;
    G.paused = open || !!this.dlg || !$('#modal').hidden;
    $('#m-music').textContent = `Music: ${MUSIC.on ? 'on' : 'off'}`;
    $('#m-sound').textContent = `Sound: ${G.settings.sound ? 'on' : 'off'}`;
    if (open) { SFX.play('open'); $('#m-wardrobe').focus(); }
  },

  // Everything you own, one tap to wear.
  wardrobe(tab = 'skins') {
    this.menu(false);
    const sheet = this.modal(`<h2>Wardrobe</h2><div class="tabs"></div><div class="grid" id="wr"></div>`);
    const draw = (t) => {
      const bar = sheet.querySelector('.tabs');
      bar.innerHTML = [['skins', 'Looks'], ['pets', 'Pets']].map(([id, l]) => `<button type="button" class="tab${id === t ? ' on' : ''}" data-tab="${id}">${l}</button>`).join('');
      bar.onclick = (e) => { const b = e.target.closest('.tab'); if (b) draw(b.dataset.tab); };
      const ids = t === 'skins' ? [...STARTERS, ...G.skinsOwned.filter((s) => !STARTERS.includes(s))] : ['none', ...G.petsOwned];
      const on = t === 'skins' ? G.skin : G.pet || 'none';
      const grid = sheet.querySelector('#wr');
      grid.innerHTML = ids.map((id) => `<button type="button" class="wear${id === on ? ' on' : ''}" data-id="${id}" title="${id === 'none' ? 'No pet' : prettyName(id)}">${id === 'none' ? '—' : ''}</button>`).join('');
      grid.querySelectorAll('.wear').forEach((b) => { if (b.dataset.id !== 'none') b.appendChild(faceCanvas(b.dataset.id, 1)); });
      grid.onclick = (e) => {
        const b = e.target.closest('.wear'); if (!b) return;
        if (t === 'skins') G.skin = player.skin = b.dataset.id;
        else { G.pet = b.dataset.id === 'none' ? null : b.dataset.id; syncPets(); }
        SFX.play('pop'); saveGame(); draw(t);
      };
    };
    draw(tab);
  },

  banner(title, sub) {
    const b = $('#banner');
    b.querySelector('h2').textContent = title;
    b.querySelector('p').textContent = sub || '';
    b.hidden = false;
    clearTimeout(this.bannerT);
    this.bannerT = setTimeout(() => { b.hidden = true; }, 3200);
  },

  // Stand-ins for real polyglot events.
  demoLesson() {
    G.lessons++;
    this.reward(EARN.lesson, 'Lesson finished');
  },
});
