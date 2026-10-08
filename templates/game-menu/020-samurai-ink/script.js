/* ==========================================================================
   INKBLADE — Ink-wash Samurai Game Menu Template
   Vanilla JS: brush-stroke menu, falling petals, koto plucks (Web Audio),
   navigation, settings (saved), hand-scroll stage path, ink warriors, rankings.
   Edit the DATA section to write your own legend.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================= DATA (edit me) ======================= */
  // seals: 0–3 earned, null = locked. The road is drawn through the stops automatically.
  var STAGES = [
    { name: 'Bamboo Crossing', season: 'Spring', seals: 3, desc: 'Learn the first cut where the bamboo grows taller than temples.' },
    { name: 'Misty Bridge', season: 'Spring', seals: 3, desc: 'A rope bridge over a valley of cloud. Every step creaks.' },
    { name: 'Cedar Shrine Steps', season: 'Summer', seals: 2, desc: 'A thousand stone steps and a guardian who never sleeps.' },
    { name: 'Crane Marsh', season: 'Summer', seals: 1, desc: 'Fight ankle-deep in water while white birds watch.' },
    { name: 'Paper Lantern Town', season: 'Autumn', seals: 0, desc: 'A festival night where every shadow might hold a blade.' },
    { name: 'Maple Falls', season: 'Autumn', seals: null, desc: 'Red leaves hide the path behind the waterfall.' },
    { name: 'Snow Pass', season: 'Winter', seals: null, desc: 'Footprints vanish within minutes. So do travelers.' },
    { name: 'Moon Gate', season: 'Winter', seals: null, desc: 'The final duel, beneath a gate that opens once a year.' }
  ];
  // look.hat: 'kasa' (straw hat) | 'topknot' | 'hood' | 'mask'; look.weapon: 'katana' | 'staff' | 'twin' | 'spear'
  var WARRIORS = [
    { name: 'Kaede of the Wind', school: 'School of Wind', desc: 'Strikes before the leaves finish falling. Never stays in one place.', look: { hat: 'kasa', weapon: 'katana' }, stats: { Speed: 92, Power: 58, Guard: 54, Focus: 80 } },
    { name: 'Old Master Tetsu', school: 'School of Stone', desc: 'Eighty winters old and has never taken a step backwards.', look: { hat: 'topknot', weapon: 'staff' }, stats: { Speed: 40, Power: 76, Guard: 96, Focus: 88 } },
    { name: 'Hana of the Lanterns', school: 'School of Fire', desc: 'Twin blades, quick temper, quicker smile.', look: { hat: 'hood', weapon: 'twin' }, stats: { Speed: 84, Power: 82, Guard: 42, Focus: 60 } },
    { name: 'The Grey Wanderer', school: 'No school', desc: 'Nobody knows the face behind the mask. Nobody has asked twice.', look: { hat: 'mask', weapon: 'spear' }, stats: { Speed: 66, Power: 88, Guard: 70, Focus: 74 } }
  ];
  var BOARD = {
    honor: [['Ayame Kuroda', 'Wind', 9820], ['Ren Morikawa', 'Stone', 9310], ['You', 'Fire', 8775], ['Sora Ishida', 'Wind', 8040], ['Juro Takeda', 'No school', 7410], ['Mio Hayashi', 'Fire', 6900]],
    duels: [['Ren Morikawa', 'Stone', 412], ['Ayame Kuroda', 'Wind', 388], ['Juro Takeda', 'No school', 301], ['You', 'Fire', 296], ['Sora Ishida', 'Wind', 250]]
  };
  var PLAYER_NAME = 'You';
  var KOTO_NOTES = [293.7, 329.6, 349.2, 440, 466.2, 587.3]; // a calm pentatonic scale
  var STORAGE_KEY = 'inkblade-settings';

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
  function fmt(n) { return n.toLocaleString('en-US'); }

  /* ======================= Settings (saved) ======================= */
  var DEFAULTS = { petals: 16, ink: 100, sun: true, mist: true, master: 80, music: 60, koto: false, sens: 5, parry: false, difficulty: 'ronin', warrior: 0 };
  var settings = Object.assign({}, DEFAULTS);
  try { Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch (e) { /* ignore */ }
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ } }

  /* ======================= SVG builders ======================= */
  function brush(i) {
    var w = i % 3;
    return '<svg viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><path d="M6 ' + (30 + w) + ' C20 ' + (10 + w * 2) + ' 60 6 150 8 C230 9 280 ' + (6 + w) + ' 294 18 C300 26 296 44 284 50 C220 ' + (56 - w) + ' 120 56 40 52 C14 50 2 44 6 ' + (30 + w) + 'Z"/></svg>';
  }
  function warrior(l) {
    var head = '<circle class="w-ink" cx="80" cy="74" r="15"/>';
    var hat = '';
    if (l.hat === 'kasa') hat = '<path class="w-ink" d="M22 72 L80 40 L138 72 Q80 82 22 72Z"/>';
    if (l.hat === 'topknot') hat = '<circle class="w-ink" cx="80" cy="54" r="7"/><path class="w-ink" d="M76 50 Q70 40 60 42 Q70 46 74 54Z"/>';
    if (l.hat === 'hood') hat = '<path class="w-ink" d="M58 92 Q56 54 80 50 Q104 54 102 92 Q94 70 80 70 Q66 70 58 92Z"/>';
    if (l.hat === 'mask') hat = '<path class="w-accent" d="M68 70 Q80 62 92 70 L92 80 Q80 86 68 80Z"/><path class="w-ink" d="M64 64 Q80 50 96 64 L96 58 Q80 44 64 58Z"/>';
    var weapon = '';
    if (l.weapon === 'katana') weapon = '<path class="w-blade" d="M36 160 L146 96"/><rect class="w-accent" x="44" y="148" width="16" height="6" transform="rotate(-30 52 151)"/>';
    if (l.weapon === 'staff') weapon = '<path class="w-blade" d="M128 30 L120 214"/>';
    if (l.weapon === 'twin') weapon = '<path class="w-blade" d="M34 130 L70 168"/><path class="w-blade" d="M126 130 L90 168"/>';
    if (l.weapon === 'spear') weapon = '<path class="w-blade" d="M34 214 L132 24"/><path class="w-ink" d="M132 24 L126 42 L140 36Z"/>';
    return '<svg viewBox="0 0 160 220" aria-hidden="true">' +
      '<ellipse class="w-wash" cx="80" cy="214" rx="64" ry="8"/>' +
      '<path class="w-wash" d="M42 104 L118 104 L140 212 L20 212Z"/>' +
      '<path class="w-ink" d="M54 94 Q80 86 106 94 L124 208 Q80 214 36 208Z"/>' +
      '<path class="w-ink" d="M54 98 L24 150 L34 156 L60 116Z"/><path class="w-ink" d="M106 98 L136 150 L126 156 L100 116Z"/>' +
      '<rect class="w-accent" x="50" y="132" width="60" height="8" rx="2"/>' +
      head + hat + weapon + '</svg>';
  }
  var LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z"/></svg>';

  $$('.ink-btn__ink').forEach(function (el, i) { el.innerHTML = brush(i); });

  /* ======================= Petals ======================= */
  function buildPetals(n) {
    var box = $('#petals');
    box.innerHTML = '';
    if (reduceMotion) return;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('span');
      p.className = 'petal';
      p.style.cssText = '--x:' + (Math.random() * 100).toFixed(1) + '%;--d:' + (9 + Math.random() * 9).toFixed(1) + 's;--delay:' + (-Math.random() * 18).toFixed(1) + 's;--sway:' + Math.round(Math.random() * 160 - 60) + 'px';
      box.appendChild(p);
    }
  }

  /* ======================= Koto plucks (Karplus–Strong, no files) ======================= */
  var actx = null, lastPluck = 0;
  function pluck(i) {
    if (!settings.koto) return;
    var now = performance.now();
    if (now - lastPluck < 60) return;
    lastPluck = now;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var sr = actx.sampleRate, freq = KOTO_NOTES[i % KOTO_NOTES.length];
      var n = Math.round(sr / freq), len = Math.floor(sr * 1.4);
      var buf = actx.createBuffer(1, len, sr), out = buf.getChannelData(0), ring = new Float32Array(n);
      for (var k = 0; k < n; k++) ring[k] = Math.random() * 2 - 1;
      for (var s = 0; s < len; s++) {
        var a = s % n, b = (s + 1) % n;
        out[s] = ring[a];
        ring[a] = .996 * .5 * (ring[a] + ring[b]);
      }
      var src = actx.createBufferSource(), g = actx.createGain();
      src.buffer = buf; g.gain.value = .35 * settings.master / 100;
      src.connect(g).connect(actx.destination); src.start();
    } catch (e) { /* no audio */ }
  }
  $$('.ink-btn').forEach(function (b, i) {
    b.addEventListener('mouseenter', function () { pluck(i); });
    b.addEventListener('focus', function () { pluck(i); });
  });

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
      var f = t.querySelector('.ink-btn, .list-btn, h1');
      if (f) f.focus({ preventScroll: true });
      if (window.scrollY > 0) window.scrollTo(0, 0);
    }
  }
  function goBack() { var p = stack.pop(); if (p) showScreen(p, { isBack: true }); }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-goto]');
    if (!btn) return;
    e.preventDefault();
    pluck(3);
    var a = btn.getAttribute('data-action');
    if (a === 'checkpoint') toast('You return to the last shrine.');
    if (a === 'retry') toast('You rise. The duel begins again.');
    if (a === 'choose') { settings.warrior = wIndex; save(); renderPlayWarrior(); toast(WARRIORS[wIndex].name + ' walks the path with you.'); }
    if (a === 'quit') toast('Farewell. The path will remember you.');
    if (btn.id === 'stage-go') toast('You set out for ' + STAGES[stageIndex].name + '.');
    if (btn.hasAttribute('data-back') && stack.length) { goBack(); return; }
    showScreen(btn.getAttribute('data-goto'));
  });

  document.addEventListener('keydown', function (e) {
    var screen = document.getElementById(current);
    if (e.key === 'Escape') {
      e.preventDefault();
      if (current === 'play') showScreen('pause');
      else if (current === 'pause') showScreen('play');
      else if (current !== 'main') { var back = $('.scroll__head .hanko-btn', screen); if (back) back.click(); else showScreen('main'); }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      var items = $$('.ink-btn, .list-btn', screen);
      if (!items.length) return;
      var idx = items.indexOf(document.activeElement);
      if (idx === -1 && document.activeElement !== document.body && !document.activeElement.matches('h1')) return;
      e.preventDefault();
      var d = e.key === 'ArrowDown' ? 1 : -1;
      items[idx === -1 ? 0 : (idx + d + items.length) % items.length].focus();
    }
  });

  /* ======================= Screen hooks ======================= */
  var duelTimer;
  function onEnter(id) {
    if (id === 'play') {
      var life = 100, spirit = 0, honor = 0, t = 0;
      duelTimer = setInterval(function () {
        t++;
        life = Math.max(15, Math.min(100, life + (Math.random() < .5 ? -6 : 4)));
        if (t % 3 === 0) spirit = (spirit + 1) % 6;
        honor += Math.round(Math.random() * 40);
        $('#h-life').style.setProperty('--v', life + '%');
        $$('#h-spirit span').forEach(function (s, i) { s.classList.toggle('is-on', i < spirit); });
        $('#h-score').textContent = fmt(honor);
      }, 500);
    }
    if (id === 'gameover') {
      countUp($('#go-duels'), 27);
      countUp($('#go-parries'), 64);
      countUp($('#go-honor'), 8775);
    }
  }
  function onLeave(id) { if (id === 'play') clearInterval(duelTimer); }
  function countUp(el, to) {
    var start = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - start) / 1300);
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ======================= Tabs ======================= */
  function setupTabs(list, onChange) {
    var tabs = $$('[role="tab"]', list);
    function select(t) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; }); onChange(t); }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); pluck(i); });
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
  var board = 'honor';
  setupTabs($('#leaderboard [role="tablist"]'), function (t) {
    board = t.getAttribute('data-board');
    $('#b-panel').setAttribute('aria-labelledby', t.id);
    renderBoard();
  });

  /* ======================= Settings form ======================= */
  var form = $('#settings-form');
  var FORM_KEYS = ['petals', 'ink', 'sun', 'mist', 'master', 'music', 'koto', 'sens', 'parry', 'difficulty'];
  function paintRange(input) {
    input.style.setProperty('--fill', ((input.value - input.min) / (input.max - input.min) * 100) + '%');
    var out = form.querySelector('output[for="' + input.id + '"]');
    if (out) out.textContent = input.value;
  }
  function fillForm() {
    FORM_KEYS.forEach(function (k) {
      var f = form.elements[k];
      if (f instanceof RadioNodeList) f.value = settings[k];
      else if (f.type === 'checkbox') f.checked = !!settings[k];
      else f.value = settings[k];
    });
    $$('input[type="range"]', form).forEach(paintRange);
    apply();
  }
  function readForm() {
    FORM_KEYS.forEach(function (k) {
      var f = form.elements[k];
      if (f instanceof RadioNodeList) settings[k] = f.value;
      else if (f.type === 'checkbox') settings[k] = f.checked;
      else settings[k] = Number(f.value);
    });
  }
  var lastPetals = -1;
  function apply() {
    root.style.setProperty('--ink-strength', settings.ink / 100);
    root.classList.toggle('no-sun', !settings.sun);
    root.classList.toggle('no-mist', !settings.mist);
    if (settings.petals !== lastPetals) { buildPetals(settings.petals); lastPetals = settings.petals; }
  }
  form.addEventListener('input', function (e) { if (e.target.type === 'range') paintRange(e.target); readForm(); apply(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); readForm(); save(); toast('Settings sealed.'); pluck(5); });
  $('#reset-settings').addEventListener('click', function () {
    FORM_KEYS.forEach(function (k) { settings[k] = DEFAULTS[k]; });
    fillForm();
    toast('Defaults restored. Save to keep them.');
  });

  /* ======================= The Path (hand scroll) ======================= */
  var stageIndex = 0, stopsBox = $('#stages');
  var pts = STAGES.map(function (s, i) { return { x: 66 + i * (808 / (STAGES.length - 1)), y: Math.round(80 + 34 * Math.sin(i * 1.15)) }; });
  (function drawRoad() {
    var d = 'M' + pts[0].x + ' ' + pts[0].y;
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ' C' + (p1.x + (p2.x - p0.x) / 6).toFixed(1) + ' ' + (p1.y + (p2.y - p0.y) / 6).toFixed(1) + ' ' + (p2.x - (p3.x - p1.x) / 6).toFixed(1) + ' ' + (p2.y - (p3.y - p1.y) / 6).toFixed(1) + ' ' + p2.x + ' ' + p2.y;
    }
    $('#road-path').setAttribute('d', d);
  })();
  STAGES.forEach(function (s, i) {
    if (s.seals !== null) stageIndex = i;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'stop' + (s.seals === null ? ' stop--locked' : '');
    b.setAttribute('role', 'radio');
    b.style.left = pts[i].x + 'px';
    b.style.top = pts[i].y + 'px';
    b.innerHTML = '<span class="stop__dot" aria-hidden="true">' + (s.seals === null ? LOCK : i + 1) + '</span><span class="stop__name">' + s.name + (s.seals === null ? '<span class="visually-hidden"> (locked)</span>' : '') + '</span>';
    b.addEventListener('click', function () { setStage(i); });
    b.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      setStage(stageIndex + d, true);
    });
    stopsBox.appendChild(b);
  });
  function setStage(i, focus) {
    stageIndex = (i + STAGES.length) % STAGES.length;
    var s = STAGES[stageIndex];
    $$('.stop', stopsBox).forEach(function (b, n) {
      var on = n === stageIndex;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus({ preventScroll: true });
    });
    // Keep the chosen stop visible inside the scroll.
    var emaki = $('#emaki'), x = pts[stageIndex].x;
    if (x < emaki.scrollLeft + 60 || x > emaki.scrollLeft + emaki.clientWidth - 60) emaki.scrollTo({ left: x - emaki.clientWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
    $('#stage-season').textContent = s.season + ' · Stage ' + (stageIndex + 1) + (s.seals === null ? ' · Locked' : s.seals === 0 ? ' · Next' : '');
    $('#stage-name').textContent = s.name;
    $('#stage-desc').textContent = s.desc;
    var n = s.seals || 0, html = '';
    for (var k = 0; k < 3; k++) html += '<span class="mini-seal' + (k < n ? ' is-on' : '') + '" aria-hidden="true"></span>';
    $('#stage-seals').innerHTML = html + '<span class="visually-hidden">' + (s.seals === null ? 'Not yet reached' : n + ' of 3 seals earned') + '</span>';
    var go = $('#stage-go');
    go.disabled = s.seals === null;
    go.textContent = s.seals === null ? 'The path is closed' : s.seals === 0 ? 'Continue the path' : 'Walk it again';
    var info = $('#stage');
    info.classList.remove('is-swap'); void info.offsetWidth; info.classList.add('is-swap');
  }

  /* ======================= Warriors ======================= */
  var wIndex = Math.min(settings.warrior, WARRIORS.length - 1), wList = $('#w-list');
  WARRIORS.forEach(function (w, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'w-btn';
    b.setAttribute('role', 'radio');
    b.innerHTML = '<span class="w-btn__name">' + w.name + '</span><span class="w-btn__school">' + w.school + '</span>';
    b.addEventListener('click', function () { setWarrior(i); });
    b.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      setWarrior(wIndex + d, true);
    });
    wList.appendChild(b);
  });
  function setWarrior(i, focus) {
    wIndex = (i + WARRIORS.length) % WARRIORS.length;
    var w = WARRIORS[wIndex];
    $$('.w-btn', wList).forEach(function (b, n) {
      var on = n === wIndex;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    var art = $('#w-art');
    art.innerHTML = warrior(w.look);
    art.classList.remove('is-swap'); void art.offsetWidth; art.classList.add('is-swap');
    $('#w-school').textContent = w.school;
    $('#w-name').textContent = w.name;
    $('#w-desc').textContent = w.desc;
    $('#w-stats').innerHTML = Object.keys(w.stats).map(function (k) {
      return '<div><dt>' + k + '</dt><dd class="bar"><span style="--v:' + w.stats[k] + '%"></span></dd><dd class="num">' + w.stats[k] + '</dd></div>';
    }).join('');
    var info = $('#w-info');
    info.classList.remove('is-swap'); void info.offsetWidth; info.classList.add('is-swap');
    pluck(wIndex);
  }
  function renderPlayWarrior() { $('#play-warrior').innerHTML = warrior(WARRIORS[settings.warrior % WARRIORS.length].look); }

  /* ======================= Scroll of honor ======================= */
  function renderBoard() {
    $('#b-metric').textContent = board === 'honor' ? 'Honor' : 'Duels';
    $('#b-body').innerHTML = BOARD[board].slice().sort(function (a, b) { return b[2] - a[2]; }).map(function (r, i) {
      return '<tr class="' + (r[0] === PLAYER_NAME ? 'is-you' : '') + '" style="animation-delay:' + (i * 0.07) + 's">' +
        '<td><span class="rank-seal' + (i < 3 ? ' rank-seal--top' : '') + '">' + (i + 1) + '</span></td>' +
        '<td>' + r[0] + (r[0] === PLAYER_NAME ? '<span class="visually-hidden"> (your record)</span>' : '') + '</td>' +
        '<td class="col-school">' + r[1] + '</td>' +
        '<td class="metric">' + fmt(r[2]) + '</td></tr>';
    }).join('');
  }

  /* ======================= Init ======================= */
  var kotoWas = settings.koto;
  settings.koto = false; // stay silent while building the screens
  fillForm();
  setStage(stageIndex);
  setWarrior(wIndex);
  settings.koto = kotoWas;
  $('#s-koto').checked = kotoWas;
  renderPlayWarrior();
  renderBoard();
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    if (el && el.hasAttribute('data-screen')) showScreen(id, { fromHash: true, silent: silent, force: true });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
