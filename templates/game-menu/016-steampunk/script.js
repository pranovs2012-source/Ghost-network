/* ==========================================================================
   AETHERWORKS — Steampunk Airship Game Menu Template
   Vanilla JS: SVG gears + airship, steam vents, navigation, settings (saved),
   voyage chart, engineers' guild with dial gauges, hall of inventors.
   Edit the DATA section to build your own world.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================= DATA (edit me) ======================= */
  // Ports sit on a 100 × 60 chart. `cogs` = 0–3 earned, null = locked.
  var PORTS = [
    { name: 'Gallowmere', x: 12, y: 18, cogs: 3, desc: 'A sooty harbour town where every chimney hides a workshop.', facts: { Distance: '40 mi', Winds: 'Calm', Danger: 'Low' } },
    { name: 'Rustwick Docks', x: 21, y: 34, cogs: 3, desc: 'Floating dry-docks chained to the cliffs. Mind the cranes.', facts: { Distance: '85 mi', Winds: 'Gusty', Danger: 'Low' } },
    { name: 'Copperfall', x: 37, y: 11, cogs: 2, desc: 'A waterfall of molten copper feeds the island foundries.', facts: { Distance: '130 mi', Winds: 'Hot', Danger: 'Medium' } },
    { name: 'The Fog Banks', x: 50, y: 41, cogs: 1, desc: 'Sky-pirates lurk in a sea of cloud. Navigate by lamp and bell.', facts: { Distance: '210 mi', Winds: 'Still', Danger: 'High' } },
    { name: 'Tinderspire', x: 74, y: 14, cogs: 0, desc: 'A clocktower city that resets its streets every hour.', facts: { Distance: '320 mi', Winds: 'Spiral', Danger: 'Medium' } },
    { name: 'Aurelian Reach', x: 85, y: 44, cogs: null, desc: 'Golden cliffs said to hum at sunset. Requires a reinforced hull.', facts: { Distance: '410 mi', Winds: 'Storm', Danger: 'High' } },
    { name: 'The Skyforge', x: 93, y: 27, cogs: null, desc: 'Where the Brass Armada was built — and where it waits.', facts: { Distance: '520 mi', Winds: '???', Danger: 'Extreme' } }
  ];

  // look.hat: 'top' | 'goggles' | 'bowler' | 'cap'
  var ENGINEERS = [
    { name: 'Prof. Orla Vance', trade: 'Aether Physicist', gadget: 'Lightning-in-a-jar', bio: 'Bottled her first storm at age nine. Has not stopped since.',
      look: { skin: '#f1c9a5', hair: '#a4471f', coat: '#3f6b5e', accent: '#c9a227', hat: 'goggles', bun: true }, stats: { Engineering: 74, Piloting: 52, Tinkering: 95, Nerve: 68 } },
    { name: 'Capt. Barnaby Thistle', trade: 'Aeronaut', gadget: 'Telescoping spyglass-umbrella', bio: 'Thirty years aloft and never once landed on purpose.',
      look: { skin: '#e0b48e', hair: '#d9d2c5', coat: '#6b2a2a', accent: '#c9a227', hat: 'top', mustache: true, monocle: true }, stats: { Engineering: 48, Piloting: 96, Tinkering: 40, Nerve: 90 } },
    { name: 'Wren Halloway', trade: 'Boiler Mechanic', gadget: 'Self-tightening steam wrench', bio: 'Can hear a loose rivet from three decks away.',
      look: { skin: '#8d5a3b', hair: '#1f140e', coat: '#5a4632', accent: '#d98b56', hat: 'cap' }, stats: { Engineering: 97, Piloting: 44, Tinkering: 78, Nerve: 72 } },
    { name: 'Dr. Ignatius Fenn', trade: 'Clockwork Surgeon', gadget: 'Brass homunculus assistant', bio: 'Repairs automatons, pocket watches and the occasional heart.',
      look: { skin: '#c68a5e', hair: '#5b5b5b', coat: '#2f3b5a', accent: '#b8642e', hat: 'bowler', beard: true }, stats: { Engineering: 82, Piloting: 36, Tinkering: 88, Nerve: 55 } }
  ];

  var HALL = {
    miles: [['Ada Brasswright', 'The Gilded Gull', 4210], ['Silas Ember', 'Old Thunderpot', 3988], ['Mabel Quill', 'Featherweight', 3720], ['You', 'The Wayward Kettle', 3115], ['Otto Lindqvist', 'Northern Lantern', 2804], ['Juniper Hale', 'Little Zephyr', 2450]],
    patents: [['Mabel Quill', 'Featherweight', 58], ['You', 'The Wayward Kettle', 51], ['Silas Ember', 'Old Thunderpot', 47], ['Ada Brasswright', 'The Gilded Gull', 39], ['Juniper Hale', 'Little Zephyr', 22]]
  };
  var PLAYER_NAME = 'You';
  var STORAGE_KEY = 'aetherworks-settings';

  /* ======================= Helpers ======================= */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var screens = $$('[data-screen]');
  var current = 'main';
  var stack = [];
  var toastTimer;
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function toast(msg) {
    var el = $('.toast');
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 2800);
  }
  function r1(n) { return Math.round(n * 10) / 10; }

  /* ======================= SVG builders ======================= */
  // A gear with `n` teeth, drawn in a -50..50 box.
  function gear(n) {
    var ro = 48, ri = 40, step = Math.PI * 2 / n, pts = [];
    for (var i = 0; i < n; i++) {
      var a = i * step;
      [[ri, -.27], [ro, -.15], [ro, .15], [ri, .27]].forEach(function (p) {
        var ang = a + p[1] * step;
        pts.push(r1(Math.cos(ang) * p[0]) + ' ' + r1(Math.sin(ang) * p[0]));
      });
    }
    var spokes = '';
    for (var s = 0; s < 5; s++) spokes += '<path d="M-3.5 -30 H3.5 V30 H-3.5Z" transform="rotate(' + (s * 36) + ')"/>';
    return '<svg viewBox="-50 -50 100 100" aria-hidden="true"><path d="M' + pts.join(' L') + 'Z"/>' +
      '<circle class="gear__ring" r="30"/>' + spokes + '<circle class="gear__hub" r="9"/></svg>';
  }

  var shipCount = 0;
  function airship() {
    var id = 'env' + (++shipCount);
    return '<svg viewBox="0 0 300 170" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2b98f"/><stop offset=".55" stop-color="#c46a34"/><stop offset="1" stop-color="#6e3016"/></linearGradient></defs>' +
      '<path d="M54 44 L16 14 L28 50Z M54 80 L16 110 L28 74Z M44 62 L6 54 L6 70Z" fill="#c9a227" stroke="#4d360a" stroke-width="2" stroke-linejoin="round"/>' +
      '<ellipse cx="152" cy="62" rx="120" ry="48" fill="url(#' + id + ')" stroke="#4d360a" stroke-width="2.5"/>' +
      '<ellipse cx="152" cy="62" rx="80" ry="48" fill="none" stroke="#6e3016" stroke-width="1.5" opacity=".7"/>' +
      '<ellipse cx="152" cy="62" rx="40" ry="48" fill="none" stroke="#6e3016" stroke-width="1.5" opacity=".7"/>' +
      '<path d="M152 14 V110" stroke="#6e3016" stroke-width="1.5" opacity=".7"/>' +
      '<path d="M34 62 Q152 82 270 62" fill="none" stroke="#c9a227" stroke-width="5"/>' +
      '<circle cx="272" cy="62" r="7" fill="#f3d98a" stroke="#4d360a" stroke-width="2"/>' +
      '<path d="M152 14 V-2" stroke="#4d360a" stroke-width="2"/><path class="flag" d="M152 -2 L176 3 L152 9Z" fill="#a3241a"/>' +
      '<path d="M112 104 L122 128 M192 104 L182 128 M152 110 V128" stroke="#3a240c" stroke-width="2"/>' +
      '<path d="M100 128 H204 L192 152 H112Z" fill="#5a2e1b" stroke="#c9a227" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<circle cx="128" cy="140" r="5" fill="#ffd98a"/><circle cx="152" cy="140" r="5" fill="#ffd98a"/><circle cx="176" cy="140" r="5" fill="#ffd98a"/>' +
      '<path d="M100 140 H90" stroke="#4d360a" stroke-width="3"/>' +
      '<ellipse class="prop" cx="88" cy="140" rx="3.5" ry="17" fill="#3a240c"/>' +
      '</svg>';
  }

  function portrait(l) {
    var hair = '<path d="M30 56 C28 32 72 30 70 56 C66 44 58 40 50 40 C42 40 34 44 30 56Z" fill="' + l.hair + '"/>';
    var hat = '';
    if (l.hat === 'top') hat = '<rect x="33" y="6" width="34" height="32" rx="2" fill="#1f1410"/><rect x="33" y="28" width="34" height="5" fill="' + l.accent + '"/><ellipse cx="50" cy="38" rx="27" ry="5" fill="#1f1410"/>';
    if (l.hat === 'bowler') hat = '<path d="M30 40 C30 16 70 16 70 40Z" fill="#2a1d14"/><rect x="31" y="34" width="38" height="4" fill="' + l.accent + '"/><ellipse cx="50" cy="40" rx="26" ry="4.5" fill="#2a1d14"/>';
    if (l.hat === 'cap') hat = '<path d="M27 44 C27 22 73 20 75 38 L83 43 C70 46 40 47 27 44Z" fill="#6b5a44"/><path d="M48 24 L50 22 L52 24" stroke="#3a2e22" stroke-width="2" fill="none"/>';
    if (l.hat === 'goggles') hat = '<rect x="28" y="38" width="44" height="6" fill="#3a240c"/><circle cx="41" cy="41" r="8" fill="#8fd6c6" stroke="' + l.accent + '" stroke-width="3"/><circle cx="59" cy="41" r="8" fill="#8fd6c6" stroke="' + l.accent + '" stroke-width="3"/><circle cx="39" cy="39" r="2" fill="#fff" opacity=".8"/><circle cx="57" cy="39" r="2" fill="#fff" opacity=".8"/>';
    return '<svg viewBox="0 0 100 125" aria-hidden="true">' +
      '<path d="M8 125 C10 96 30 86 50 86 C70 86 90 96 92 125Z" fill="' + l.coat + '"/>' +
      '<path d="M40 87 L50 106 L60 87Z" fill="#f2e2bd"/><path d="M45 92 L50 98 L55 92 L50 95Z" fill="' + l.accent + '"/>' +
      '<rect x="44" y="72" width="12" height="16" fill="' + l.skin + '"/>' +
      (l.bun ? '<circle cx="50" cy="30" r="10" fill="' + l.hair + '"/>' : '') +
      '<ellipse cx="50" cy="58" rx="20" ry="23" fill="' + l.skin + '"/>' + hair +
      '<circle cx="43" cy="58" r="2.2" fill="#2a1a10"/><circle cx="57" cy="58" r="2.2" fill="#2a1a10"/>' +
      '<path d="M45 70 Q50 73 55 70" stroke="#2a1a10" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      (l.mustache ? '<path d="M38 68 Q44 63 50 67 Q56 63 62 68 Q56 70 50 69 Q44 70 38 68Z" fill="' + l.hair + '"/>' : '') +
      (l.beard ? '<path d="M31 60 C32 84 68 84 69 60 C66 72 58 76 50 76 C42 76 34 72 31 60Z" fill="' + l.hair + '"/>' : '') +
      (l.monocle ? '<circle cx="57" cy="58" r="6" fill="none" stroke="#c9a227" stroke-width="1.8"/><path d="M63 60 C66 70 64 80 60 88" stroke="#c9a227" stroke-width="1" fill="none"/>' : '') +
      hat + '</svg>';
  }

  function dial(v) {
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" class="dial__rim"/><circle cx="50" cy="50" r="40" class="dial__face"/>' +
      '<path d="M25.96 74.04 A34 34 0 1 1 74.04 74.04" class="dial__track"/><path d="M74.04 25.96 A34 34 0 0 1 74.04 74.04" class="dial__red"/>' +
      '<g class="dial__needle" style="--a:-135deg" data-a="' + (-135 + v * 2.7) + '"><path d="M50 50 L48 52 L50 20 L52 52Z"/></g><circle cx="50" cy="50" r="5" class="dial__hub"/></svg>';
  }

  var LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z"/></svg>';

  /* ======================= Settings (saved) ======================= */
  var DEFAULTS = { gears: 1, steam: 6, lamp: 70, sepia: false, master: 80, music: 60, clanks: false, sens: 5, invert: false, difficulty: 'journeyman' };
  var settings = Object.assign({}, DEFAULTS);
  try { Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch (e) { /* ignore */ }

  /* ======================= Backdrop: gears + steam ======================= */
  var GEAR_LAYOUT = {
    left: [{ s: 230, n: 18, x: 0, y: 110 }, { s: 150, n: 12, x: 190, y: 60, ccw: true }, { s: 100, n: 8, x: 150, y: 210 }],
    right: [{ s: 250, n: 20, x: 110, y: 0 }, { s: 130, n: 10, x: 40, y: 200, ccw: true }, { s: 80, n: 7, x: 0, y: 120 }]
  };
  $$('[data-gears]').forEach(function (box) {
    GEAR_LAYOUT[box.getAttribute('data-gears')].forEach(function (g) {
      var el = document.createElement('div');
      el.className = 'gear' + (g.ccw ? ' gear--ccw' : '');
      el.style.cssText = 'width:' + g.s + 'px;height:' + g.s + 'px;left:' + g.x + 'px;top:' + g.y + 'px';
      el.setAttribute('data-base', g.n * 2.2); // seconds per turn: bigger gears turn slower
      el.innerHTML = gear(g.n);
      box.appendChild(el);
    });
  });
  $$('[data-cog]').forEach(function (c) { c.innerHTML = gear(10); });
  $$('[data-airship]').forEach(function (a) { a.innerHTML = airship(); });

  var VENTS = [['calc(6% + 9px)', 110], ['calc(52% + 9px)', 74], ['calc(93% - 9px)', 124]];
  function buildSteam(n) {
    var box = $('#steam');
    box.innerHTML = '';
    for (var i = 0; i < n; i++) {
      var v = VENTS[i % VENTS.length], p = document.createElement('span');
      p.className = 'puff';
      p.style.cssText = '--x:' + v[0] + ';--b:' + v[1] + 'px;--d:' + (3.2 + Math.random() * 2).toFixed(2) + 's;--delay:' + (-Math.random() * 5).toFixed(2) + 's;--drift:' + Math.round(Math.random() * 60 - 20) + 'px';
      box.appendChild(p);
    }
  }

  /* ======================= Sounds (Web Audio, no files) ======================= */
  var actx = null;
  function audio() { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); return actx; }
  function clank() {
    if (!settings.clanks) return;
    try {
      var a = audio(), t = a.currentTime, vol = .12 * settings.master / 100;
      var o = a.createOscillator(), g = a.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(70, t + .12);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .15);
      o.connect(g).connect(a.destination); o.start(t); o.stop(t + .16);
      var o2 = a.createOscillator(), g2 = a.createGain();
      o2.type = 'triangle'; o2.frequency.value = 1320;
      g2.gain.setValueAtTime(vol * .6, t); g2.gain.exponentialRampToValueAtTime(.0001, t + .08);
      o2.connect(g2).connect(a.destination); o2.start(t); o2.stop(t + .09);
    } catch (e) { /* no audio */ }
  }
  function whistle() {
    if (!settings.clanks) return;
    try {
      var a = audio(), t = a.currentTime, vol = .08 * settings.master / 100;
      var o = a.createOscillator(), g = a.createGain(), lfo = a.createOscillator(), lg = a.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(880, t); o.frequency.linearRampToValueAtTime(1180, t + .15);
      lfo.frequency.value = 9; lg.gain.value = 25; lfo.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .05); g.gain.exponentialRampToValueAtTime(.0001, t + .6);
      o.connect(g).connect(a.destination); o.start(t); lfo.start(t); o.stop(t + .62); lfo.stop(t + .62);
    } catch (e) { /* no audio */ }
  }

  /* ======================= Navigation ======================= */
  function showScreen(id, opts) {
    opts = opts || {};
    var t = document.getElementById(id);
    if (!t || !t.hasAttribute('data-screen')) return;
    if (id === current && !opts.force) return;
    if (!opts.isBack && id !== current) stack.push(current);
    if (stack.length > 20) stack.shift();
    var prev = current;
    screens.forEach(function (s) { var on = s === t; s.hidden = !on; s.classList.toggle('is-active', on); });
    current = id;
    if (!opts.fromHash) history.replaceState(null, '', '#' + id);
    if (prev !== id) onLeave(prev);
    onEnter(id);
    if (!opts.silent) {
      var f = t.querySelector('.plate, .list-btn, h1');
      if (f) f.focus({ preventScroll: true });
      if (window.scrollY > 0) window.scrollTo(0, 0);
    }
  }
  function goBack() { var p = stack.pop(); if (p) showScreen(p, { isBack: true }); }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-goto]');
    if (!btn) return;
    e.preventDefault();
    clank();
    var a = btn.getAttribute('data-action');
    if (a === 'checkpoint') toast('Returning to the last port of call.');
    if (a === 'retry') toast('Boiler patched with a frying pan. Off we go!');
    if (a === 'hire') toast(ENGINEERS[engIndex].name + ' signs the contract.');
    if (a === 'quit') toast('Ship abandoned. Fair winds, aeronaut.');
    if (btn.id === 'port-go') toast('Course plotted for ' + PORTS[portIndex].name + '.');
    if (btn.hasAttribute('data-back') && stack.length) { goBack(); return; }
    showScreen(btn.getAttribute('data-goto'));
  });

  document.addEventListener('keydown', function (e) {
    var screen = document.getElementById(current);
    if (e.key === 'Escape') {
      e.preventDefault();
      if (current === 'play') showScreen('pause');
      else if (current === 'pause') showScreen('play');
      else if (current !== 'main') { var back = $('.frame__head .valve', screen); if (back) back.click(); else showScreen('main'); }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      var items = $$('.plate, .list-btn', screen);
      if (!items.length) return;
      var idx = items.indexOf(document.activeElement);
      if (idx === -1 && document.activeElement !== document.body && !document.activeElement.matches('h1')) return;
      e.preventDefault();
      var d = e.key === 'ArrowDown' ? 1 : -1;
      items[idx === -1 ? 0 : (idx + d + items.length) % items.length].focus();
    }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.target.closest('[role="tab"], [role="radio"], input')) {
      var dir = e.key === 'ArrowRight' ? 1 : -1;
      if (current === 'levels') { e.preventDefault(); setPort(portIndex + dir); }
      if (current === 'characters') { e.preventDefault(); setEngineer(engIndex + dir); }
    }
  });

  /* ======================= Screen hooks ======================= */
  var flightTimer;
  function onEnter(id) {
    if (id === 'play') {
      var t = 0, alt = 0, dist = 0, cogs = 0, eta = 360;
      flightTimer = setInterval(function () {
        t++;
        var psi = Math.round(215 + Math.sin(t / 6) * 40 + Math.random() * 18);
        alt = Math.min(2400, alt + 60);
        dist += .1;
        if (Math.random() < .12) cogs++;
        if (t % 5 === 0) eta = Math.max(0, eta - 1);
        $('#pressure').textContent = psi;
        $('#pressure-needle').style.setProperty('--a', (-135 + psi / 400 * 270) + 'deg');
        $('#altitude').textContent = alt.toLocaleString('en-US');
        $('#distance').textContent = dist.toFixed(1);
        $('#cogs').textContent = cogs;
        $('#eta').textContent = String(eta / 60 | 0).padStart(2, '0') + ':' + String(eta % 60).padStart(2, '0');
      }, 200);
    }
    if (id === 'gameover') {
      countUp($('#go-miles'), 1284);
      countUp($('#go-cogs'), 87);
      countUp($('#go-score'), 36420);
    }
    if (id === 'characters') spinDials();
  }
  function onLeave(id) { if (id === 'play') clearInterval(flightTimer); }
  function countUp(el, to) {
    var start = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - start) / 1300);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US');
      if (k < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ======================= Tabs ======================= */
  function setupTabs(list, onChange) {
    var tabs = $$('[role="tab"]', list);
    function select(t) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; }); onChange(t); }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); clank(); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); select(n);
      });
    });
  }
  setupTabs($('#settings [role="tablist"]'), function (t) {
    $$('#settings [role="tabpanel"]').forEach(function (p) { p.hidden = p.id !== t.getAttribute('aria-controls'); });
  });
  var board = 'miles';
  setupTabs($('#leaderboard [role="tablist"]'), function (t) {
    board = t.getAttribute('data-board');
    $('#h-panel').setAttribute('aria-labelledby', t.id);
    renderHall();
  });

  /* ======================= Settings form ======================= */
  var form = $('#settings-form');
  function paintRange(input) {
    input.style.setProperty('--fill', ((input.value - input.min) / (input.max - input.min) * 100) + '%');
    var out = form.querySelector('output[for="' + input.id + '"]');
    if (out) out.textContent = input.value + (input.name === 'gears' ? '×' : '');
  }
  function fillForm() {
    Object.keys(settings).forEach(function (k) {
      var f = form.elements[k];
      if (!f) return;
      if (f instanceof RadioNodeList) f.value = settings[k];
      else if (f.type === 'checkbox') f.checked = !!settings[k];
      else f.value = settings[k];
    });
    $$('input[type="range"]', form).forEach(paintRange);
    apply();
  }
  function readForm() {
    Object.keys(DEFAULTS).forEach(function (k) {
      var f = form.elements[k];
      if (!f) return;
      if (f instanceof RadioNodeList) settings[k] = f.value;
      else if (f.type === 'checkbox') settings[k] = f.checked;
      else settings[k] = Number(f.value);
    });
  }
  var lastSteam = -1;
  function apply() {
    root.style.setProperty('--lamp', settings.lamp / 100);
    root.classList.toggle('is-sepia', !!settings.sepia);
    $$('.gears .gear').forEach(function (g) {
      if (!settings.gears) { g.style.animationPlayState = 'paused'; return; }
      g.style.animationPlayState = '';
      g.style.animationDuration = (g.getAttribute('data-base') / settings.gears) + 's';
    });
    if (settings.steam !== lastSteam) { buildSteam(reduceMotion ? 0 : settings.steam); lastSteam = settings.steam; }
  }
  form.addEventListener('input', function (e) { if (e.target.type === 'range') paintRange(e.target); readForm(); apply(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault(); readForm();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (err) { /* ignore */ }
    toast('Settings stamped and filed.'); whistle();
  });
  $('#reset-settings').addEventListener('click', function () { settings = Object.assign({}, DEFAULTS); fillForm(); toast('Factory defaults restored. Save to keep them.'); });

  /* ======================= Voyage chart ======================= */
  function smoothPath(pts) {
    // Catmull-Rom spline through the ports, converted to cubic Béziers.
    if (pts.length < 2) return '';
    var d = 'M' + pts[0].x + ' ' + pts[0].y;
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ' C' + r1(p1.x + (p2.x - p0.x) / 6) + ' ' + r1(p1.y + (p2.y - p0.y) / 6) + ' ' + r1(p2.x - (p3.x - p1.x) / 6) + ' ' + r1(p2.y - (p3.y - p1.y) / 6) + ' ' + p2.x + ' ' + p2.y;
    }
    return d;
  }
  var reached = 0;
  PORTS.forEach(function (p, i) { if (p.cogs !== null) reached = i; });
  $('#route').setAttribute('d', smoothPath(PORTS));
  $('#route-done').setAttribute('d', smoothPath(PORTS.slice(0, reached + 1)));

  var portIndex = reached, pinBox = $('#map-pins');
  PORTS.forEach(function (p, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pin' + (p.cogs === null ? ' pin--locked' : '');
    b.setAttribute('role', 'radio');
    b.style.left = p.x + '%';
    b.style.top = (p.y / 60 * 100) + '%';
    b.innerHTML = p.cogs === null ? LOCK + '<span class="visually-hidden">' + p.name + ' (locked)</span>' : (i + 1) + '<span class="visually-hidden">. ' + p.name + '</span>';
    b.addEventListener('click', function () { setPort(i); });
    b.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      setPort(portIndex + d, true);
    });
    pinBox.appendChild(b);
  });
  function setPort(i, focus) {
    portIndex = (i + PORTS.length) % PORTS.length;
    var p = PORTS[portIndex];
    $$('.pin', pinBox).forEach(function (b, n) {
      var on = n === portIndex;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    $('#port-chapter').textContent = 'Chapter ' + (portIndex + 1) + (p.cogs === null ? ' · Locked' : p.cogs === 0 ? ' · Current port' : '');
    $('#port-name').textContent = p.name;
    $('#port-desc').textContent = p.desc;
    $('#port-facts').innerHTML = Object.keys(p.facts).map(function (k) { return '<div><dt>' + k + '</dt><dd>' + p.facts[k] + '</dd></div>'; }).join('');
    var cogs = p.cogs || 0, html = '';
    for (var c = 0; c < 3; c++) html += '<span class="' + (c < cogs ? 'cog-on' : 'cog-off') + '">' + gear(8) + '</span>';
    $('#port-cogs').innerHTML = html + '<span class="visually-hidden">' + (p.cogs === null ? 'Not yet reached' : cogs + ' of 3 cogs earned') + '</span>';
    var go = $('#port-go');
    go.disabled = p.cogs === null;
    go.textContent = p.cogs === null ? 'Hull upgrade required' : p.cogs === 0 ? 'Continue voyage' : 'Sail again';
    var info = $('#port');
    info.classList.remove('is-swap'); void info.offsetWidth; info.classList.add('is-swap');
  }

  /* ======================= Engineers' guild ======================= */
  var engIndex = 0, engList = $('#eng-list');
  ENGINEERS.forEach(function (en, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'eng-btn';
    b.setAttribute('role', 'radio');
    b.innerHTML = '<span class="eng-btn__face" aria-hidden="true">' + portrait(en.look) + '</span><span class="eng-btn__text"><span class="eng-btn__name">' + en.name + '</span><span class="eng-btn__trade">' + en.trade + '</span></span>';
    b.addEventListener('click', function () {
      setEngineer(i);
      // On stacked (phone) layouts, bring the portrait into view.
      if (matchMedia('(max-width: 900px)').matches) $('#eng-detail').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    });
    b.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      setEngineer(engIndex + d, true);
    });
    engList.appendChild(b);
  });
  function setEngineer(i, focus) {
    engIndex = (i + ENGINEERS.length) % ENGINEERS.length;
    var en = ENGINEERS[engIndex];
    $$('.eng-btn', engList).forEach(function (b, n) {
      var on = n === engIndex;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    $('#eng-portrait').innerHTML = portrait(en.look);
    $('#eng-trade').textContent = en.trade;
    $('#eng-name').textContent = en.name;
    $('#eng-bio').textContent = en.bio;
    $('#eng-gadget').textContent = en.gadget;
    $('#eng-stats').innerHTML = Object.keys(en.stats).map(function (k) {
      return '<div><dt>' + k + '</dt><dd>' + dial(en.stats[k]) + '<span class="num">' + en.stats[k] + '</span></dd></div>';
    }).join('');
    var d = $('#eng-detail');
    d.classList.remove('is-swap'); void d.offsetWidth; d.classList.add('is-swap');
    spinDials();
  }
  function spinDials() {
    // Needles start at zero and swing to their value.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        $$('#eng-stats .dial__needle').forEach(function (n) { n.style.setProperty('--a', n.getAttribute('data-a') + 'deg'); });
      });
    });
  }

  /* ======================= Hall of inventors ======================= */
  function renderHall() {
    $('#h-metric').textContent = board === 'miles' ? 'Miles' : 'Patents';
    $('#h-body').innerHTML = HALL[board].slice().sort(function (a, b) { return b[2] - a[2]; }).map(function (r, i) {
      var rank = i < 3 ? '<span class="medal medal--' + (i + 1) + '">' + (i + 1) + '</span>' : '<span class="medal">' + (i + 1) + '</span>';
      return '<tr class="' + (r[0] === PLAYER_NAME ? 'is-you' : '') + '" style="animation-delay:' + (i * 0.06) + 's">' +
        '<td class="rank">' + rank + '</td>' +
        '<td>' + r[0] + (r[0] === PLAYER_NAME ? '<span class="visually-hidden"> (your airship)</span>' : '') + '</td>' +
        '<td class="col-ship">' + r[1] + '</td>' +
        '<td class="metric">' + r[2].toLocaleString('en-US') + '</td></tr>';
    }).join('');
  }

  /* ======================= Init ======================= */
  fillForm();
  setPort(portIndex);
  setEngineer(0);
  renderHall();
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    if (el && el.hasAttribute('data-screen')) showScreen(id, { fromHash: true, silent: silent, force: true });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
