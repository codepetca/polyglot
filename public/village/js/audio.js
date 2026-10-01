// Lantern Hollow — sound effects and a generative lofi radio. No audio files:
// every sound is synthesised with the Web Audio API.

let AC = null, SFX_GAIN = null, MUSIC_GAIN = null;
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    SFX_GAIN = AC.createGain(); SFX_GAIN.gain.value = 0.9; SFX_GAIN.connect(AC.destination);
    MUSIC_GAIN = AC.createGain(); MUSIC_GAIN.gain.value = 0.55; MUSIC_GAIN.connect(AC.destination);
  } catch (e) { AC = null; }
}

const SFX = {
  tone(f, dur, type = 'square', vol = 0.05, when = 0, slide = 0, out = SFX_GAIN) {
    const t = AC.currentTime + when, o = AC.createOscillator(), gn = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(vol, t + 0.008); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(out); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol = 0.05, freq = 1000, when = 0, type = 'bandpass', out = SFX_GAIN) {
    const t = AC.currentTime + when, len = Math.ceil(AC.sampleRate * dur), buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), gn = AC.createGain();
    s.buffer = buf; f.type = type; f.frequency.value = freq; gn.gain.value = vol;
    s.connect(f).connect(gn).connect(out); s.start(t);
  },
  play(n) {
    if (!AC || !G.settings.sound) return;
    if (AC.state === 'suspended') AC.resume();
    const T = this.tone.bind(this), N = this.noise.bind(this);
    switch (n) {
      case 'blip': T(640 + Math.random() * 60, 0.03, 'square', 0.014); break;
      case 'coin': T(988, 0.07, 'square', 0.035); T(1319, 0.18, 'square', 0.035, 0.07); break;
      case 'chime': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.35, 'triangle', 0.05, i * 0.08)); break;
      case 'ignite': N(0.35, 0.05, 1400); T(660, 0.5, 'triangle', 0.045, 0.05, 1320); T(1320, 0.45, 'sine', 0.03, 0.25); break;
      case 'splash': N(0.32, 0.08, 800); break;
      case 'cast': T(380, 0.2, 'sine', 0.035, 0, 900); break;
      case 'bite': T(1200, 0.05, 'square', 0.035); T(1200, 0.05, 'square', 0.035, 0.09); break;
      case 'plant': N(0.14, 0.05, 450); T(330, 0.08, 'sine', 0.03, 0.06); break;
      case 'hoe': N(0.12, 0.08, 300, 0, 'lowpass'); T(110, 0.08, 'square', 0.03); break;
      case 'water': N(0.6, 0.05, 2200, 0, 'highpass'); break;
      case 'pop': T(520, 0.06, 'sine', 0.06, 0, 1040); T(1040, 0.1, 'triangle', 0.03, 0.06); break;
      case 'place': T(260, 0.06, 'square', 0.04); N(0.06, 0.05, 500); break;
      case 'knock': T(150, 0.07, 'square', 0.05); N(0.05, 0.05, 300); break;
      case 'open': T(520, 0.06, 'triangle', 0.045); T(780, 0.09, 'triangle', 0.045, 0.05); break;
      case 'close': T(780, 0.06, 'triangle', 0.035); T(520, 0.08, 'triangle', 0.035, 0.05); break;
      case 'fail': T(330, 0.22, 'triangle', 0.045, 0, 200); break;
      case 'fanfare': [523, 659, 784, 1047, 1319].forEach((f, i) => { T(f, 0.4, 'triangle', 0.055, i * 0.11); T(f / 2, 0.4, 'square', 0.018, i * 0.11); }); break;
      case 'bird': T(2400 + Math.random() * 600, 0.07, 'sine', 0.01, 0, 3200); T(2900, 0.06, 'sine', 0.008, 0.1, 2300); break;
      case 'cricket': for (let i = 0; i < 3; i++) T(4300, 0.025, 'square', 0.004, i * 0.05); break;
      case 'frog': T(180, 0.12, 'square', 0.012, 0, 120); break;
    }
  },
};

// ---- the lofi radio ------------------------------------------------------------------------

const STATIONS = [
  { name: 'Sunny Porch', bpm: 78, root: 60, chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [2, 5, 9, 12], [7, 11, 14, 17]] },
  { name: 'Rainy Desk', bpm: 70, root: 57, chords: [[5, 9, 12, 16], [4, 7, 11, 14], [2, 5, 9, 12], [0, 4, 7, 11]], rain: true },
  { name: 'Night Pond', bpm: 66, root: 57, chords: [[0, 3, 7, 10, 14], [-4, 0, 3, 7], [3, 7, 10, 14], [-2, 2, 5, 9]] },
];
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

const RADIO = {
  on: false, station: 0, timer: null, next: 0, step: 0, bus: null, crackle: null,
  start(st) {
    audioInit();
    if (!AC) return;
    if (st !== undefined) this.station = st;
    if (this.on) return;
    this.on = true; G.settings.music = true;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2100; lp.Q.value = 0.4;
    const comp = AC.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    this.bus = AC.createGain(); this.bus.gain.value = 0; this.bus.gain.linearRampToValueAtTime(1, AC.currentTime + 1.5);
    this.bus.connect(lp).connect(comp).connect(MUSIC_GAIN);
    this.startCrackle();
    this.next = AC.currentTime + 0.1; this.step = 0;
    this.timer = setInterval(() => this.schedule(), 40);
    if (typeof UI !== 'undefined') UI.radioState();
  },
  stop() {
    if (!this.on) return;
    this.on = false; G.settings.music = false;
    clearInterval(this.timer);
    const b = this.bus, c = this.crackle;
    b.gain.setTargetAtTime(0, AC.currentTime, 0.4);
    setTimeout(() => { b.disconnect(); if (c) { try { c.stop(); } catch (e) {} } }, 1500);
    if (typeof UI !== 'undefined') UI.radioState();
  },
  toggle() { this.on ? this.stop() : this.start(); },
  tune() { this.station = (this.station + 1) % STATIONS.length; G.settings.station = this.station; if (typeof UI !== 'undefined') UI.radioState(); },
  startCrackle() {
    const len = AC.sampleRate * 2, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.6 : (Math.random() * 2 - 1) * 0.012;
    const s = AC.createBufferSource(); s.buffer = buf; s.loop = true;
    const gn = AC.createGain(); gn.gain.value = 0.35; s.connect(gn).connect(this.bus); s.start();
    this.crackle = s;
  },
  schedule() {
    const S = STATIONS[this.station], beat = 60 / S.bpm, sixteenth = beat / 4;
    while (this.next < AC.currentTime + 0.25) {
      const st = this.step, bar = Math.floor(st / 16), pos = st % 16;
      const swing = pos % 2 === 1 ? sixteenth * 0.18 : 0, t = this.next + swing;
      const chord = S.chords[bar % S.chords.length];
      if (pos === 0) this.chord(S.root, chord, t, beat * 4);
      if (pos === 0 || pos === 10) this.bass(S.root + chord[0] - 12, t, beat * (pos === 0 ? 2 : 1.5));
      if (pos === 0 || pos === 7 || (pos === 10 && bar % 2)) this.kick(t);
      if (pos === 4 || pos === 12) this.snare(t);
      if (pos % 2 === 0) this.hat(t, pos % 4 === 2 ? 0.06 : 0.035);
      if (Math.random() < 0.18 && pos % 2 === 0) {
        const scale = [0, 2, 4, 7, 9, 12, 14, 16];
        this.bell(S.root + 12 + scale[Math.floor(Math.random() * scale.length)], t, beat * 1.5);
      }
      this.next += sixteenth; this.step++;
    }
  },
  epiano(f, t, dur, vol) {
    const o = AC.createOscillator(), o2 = AC.createOscillator(), gn = AC.createGain(), trem = AC.createOscillator(), tg = AC.createGain();
    o.type = 'sine'; o.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f * 2.001;
    const wob = AC.createOscillator(), wg = AC.createGain(); wob.frequency.value = 0.35; wg.gain.value = f * 0.0025; wob.connect(wg).connect(o.frequency);
    trem.frequency.value = 4.5; tg.gain.value = vol * 0.18; trem.connect(tg).connect(gn.gain);
    const g2 = AC.createGain(); g2.gain.value = 0.12;
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(vol, t + 0.02); gn.gain.exponentialRampToValueAtTime(vol * 0.4, t + 0.6); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn); o2.connect(g2).connect(gn); gn.connect(this.bus);
    [o, o2, trem, wob].forEach((x) => { x.start(t); x.stop(t + dur + 0.1); });
  },
  chord(root, chord, t, dur) { chord.forEach((n, i) => this.epiano(midi(root + n), t + i * 0.012, dur, 0.05)); },
  bass(n, t, dur) {
    const o = AC.createOscillator(), gn = AC.createGain();
    o.type = 'sine'; o.frequency.value = midi(n);
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(0.16, t + 0.03); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(this.bus); o.start(t); o.stop(t + dur + 0.1);
  },
  bell(n, t, dur) {
    const o = AC.createOscillator(), gn = AC.createGain();
    o.type = 'triangle'; o.frequency.value = midi(n);
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(0.03, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(this.bus); o.start(t); o.stop(t + dur + 0.1);
  },
  kick(t) {
    const o = AC.createOscillator(), gn = AC.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    gn.gain.setValueAtTime(0.32, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(gn).connect(this.bus); o.start(t); o.stop(t + 0.35);
  },
  noiseHit(t, dur, vol, freq, type) {
    const len = Math.ceil(AC.sampleRate * dur), buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), gn = AC.createGain();
    s.buffer = buf; f.type = type; f.frequency.value = freq; gn.gain.value = vol;
    s.connect(f).connect(gn).connect(this.bus); s.start(t);
  },
  snare(t) { this.noiseHit(t, 0.18, 0.12, 1800, 'bandpass'); },
  hat(t, v) { this.noiseHit(t, 0.04, v, 7000, 'highpass'); },
};

// ---- music from the asset pack (calm by day, dreamy at night) --------------------------------
const MUSIC = {
  on: false, el: null, track: null,
  toggle() { this.on = !this.on; G.settings.bgm = this.on; if (!this.on && this.el) this.el.pause(); this.tick(true); },
  tick(force) {
    if (!this.on) return;
    const want = isNight() ? 'dream' : 'calm-village';
    if (this.track === want && !force) return;
    this.track = want;
    if (!this.el) { this.el = new Audio(); this.el.loop = true; this.el.volume = 0.45; }
    this.el.src = `assets/music/${want}.mp3`;
    this.el.play().catch(() => {});
  },
};
