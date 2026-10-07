/* ==========================================================================
   NEON//DRIFT — Neon Cyberpunk Game Menu Template
   Vanilla JS: screen navigation, keyboard control, settings (saved locally),
   level select, character select, leaderboard and demo game flow.
   Edit the DATA section to plug in your own levels, characters and scores.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================= DATA (edit me) ======================= */
  var LEVELS = [
    { name: 'Neon Alley', stars: 3 }, { name: 'Chrome Docks', stars: 3 }, { name: 'Data Spire', stars: 2 },
    { name: 'Rust Market', stars: 1 }, { name: 'Holo Bazaar', stars: 2 }, { name: 'Grid Tunnels', stars: 0 },
    { name: 'Sky Rail', stars: 0 }, { name: 'Black Ice', stars: 0 }, { name: 'Core Vault', locked: true },
    { name: 'Static Sea', locked: true }, { name: 'Zero Tower', locked: true }, { name: 'The Source', locked: true }
  ];

  var CHARACTERS = [
    { name: 'VEX', role: 'Netrunner', color: '#22f3ff', bio: 'Slips through firewalls like rain through neon. Hacks drones mid-chase.', stats: { Speed: 72, Armor: 38, Hacking: 95, Stealth: 80 }, look: 'visor' },
    { name: 'KIRA-7', role: 'Android', color: '#ff2bd6', bio: 'Factory-reset twice, still remembers everything. Perfect reflexes.', stats: { Speed: 90, Armor: 55, Hacking: 60, Stealth: 64 }, look: 'antenna' },
    { name: 'BRICK', role: 'Enforcer', color: '#f9f871', bio: 'Former corp security. Walks through walls when doors are too slow.', stats: { Speed: 40, Armor: 98, Hacking: 22, Stealth: 30 }, look: 'mohawk' },
    { name: 'NYX', role: 'Infiltrator', color: '#4dffb8', bio: 'Nobody has seen her face. Every camera in the city has tried.', stats: { Speed: 84, Armor: 42, Hacking: 70, Stealth: 99 }, look: 'hood' }
  ];

  var BOARDS = {
    global: [
      ['ZER0COOL', 'S12', 982440], ['KATANA_V', 'S12', 951200], ['GL1TCH', 'S11', 899870], ['MOTHWING', 'S11', 870015],
      ['RAINDANCER', 'S10', 802300], ['NULLPTR', 'S10', 790120], ['HEXQUEEN', 'S09', 744680], ['YOU', 'S04', 184220]
    ],
    weekly: [
      ['GL1TCH', 'S11', 412990], ['YOU', 'S04', 184220], ['SPARKPLUG', 'S07', 176400], ['NEONMOTH', 'S06', 150230],
      ['BYTEWOLF', 'S05', 120880], ['K1LOWATT', 'S05', 98450], ['DRIFTKID', 'S03', 70200], ['ECHO-9', 'S03', 51000]
    ],
    friends: [
      ['RAINDANCER', 'S10', 802300], ['YOU', 'S04', 184220], ['PIXELFOX', 'S04', 150990], ['LOWBATT', 'S03', 90500], ['OVERCLOCK', 'S02', 40100]
    ]
  };
  var PLAYER_NAME = 'YOU';
  var STORAGE_KEY = 'neon-drift-settings';

  /* ======================= Helpers ======================= */
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var screens = $$('[data-screen]');
  var historyStack = [];
  var current = 'main';
  var toastTimer;

  function toast(msg) {
    var el = $('.toast');
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 2600);
  }

  /* ======================= Sound (tiny synth, no files) ======================= */
  var audioCtx = null;
  function blip(freq, duration) {
    if (!settings.uiSounds) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      var vol = (settings.master / 100) * (settings.sfx / 100) * 0.12;
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) { /* audio not available */ }
  }

  /* ======================= Navigation ======================= */
  function showScreen(id, opts) {
    opts = opts || {};
    var target = document.getElementById(id);
    if (!target || !target.hasAttribute('data-screen') || id === current && !opts.force) return;
    if (!opts.isBack && current !== id) historyStack.push(current);
    if (historyStack.length > 20) historyStack.shift();
    screens.forEach(function (s) {
      var on = s === target;
      s.hidden = !on;
      s.classList.toggle('is-active', on);
    });
    current = id;
    if (!opts.fromHash) history.replaceState(null, '', '#' + id);
    onEnter(id);
    if (!opts.silent) {
      var focusTarget = target.querySelector('.menu__item, h1');
      if (focusTarget) focusTarget.focus({ preventScroll: true });
    }
  }

  function goBack() {
    var prev = historyStack.pop();
    if (prev) showScreen(prev, { isBack: true });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-goto]');
    if (!btn) return;
    e.preventDefault();
    blip(660, 0.08);
    var action = btn.getAttribute('data-action');
    if (action) runAction(action);
    // "Back" buttons return to wherever the player came from (e.g. pause -> settings -> pause)
    if (btn.hasAttribute('data-back') && historyStack.length) { goBack(); return; }
    showScreen(btn.getAttribute('data-goto'));
  });

  function runAction(action) {
    if (action === 'restart') { score = 0; toast('Sector restarted'); }
    if (action === 'select-character') toast(CHARACTERS[charIndex].name + ' locked in');
    if (action === 'quit') toast('Thanks for playing — see you on the grid');
  }

  /* Keyboard: arrows move between menu items, Esc pauses / goes back */
  document.addEventListener('keydown', function (e) {
    var screen = document.getElementById(current);
    if (e.key === 'Escape') {
      e.preventDefault();
      if (current === 'play') showScreen('pause');
      else if (current === 'pause') showScreen('play');
      else if (current !== 'main') {
        var back = screen.querySelector('[data-back], .back-btn');
        if (back) back.click(); else showScreen('main');
      }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      var items = $$('.menu__item', screen);
      var idx = items.indexOf(document.activeElement);
      if (!items.length || (idx === -1 && document.activeElement !== document.body && !document.activeElement.matches('h1'))) return;
      e.preventDefault();
      var next = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
      if (idx === -1) next = 0;
      items[(next + items.length) % items.length].focus();
      blip(440, 0.04);
    }
    if (current === 'characters' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      if (document.activeElement && document.activeElement.matches('input, select')) return;
      e.preventDefault();
      setCharacter(charIndex + (e.key === 'ArrowRight' ? 1 : -1));
    }
  });

  document.addEventListener('mouseover', function (e) {
    if (e.target.closest && e.target.closest('.menu__item')) blip(520, 0.03);
  });

  /* ======================= Per-screen behaviour ======================= */
  var score = 48210;
  var scoreTimer = null;
  function onEnter(id) {
    clearInterval(scoreTimer);
    if (id === 'play') {
      var out = $('#live-score');
      scoreTimer = setInterval(function () {
        score += Math.floor(Math.random() * 90) + 10;
        out.textContent = String(score).padStart(6, '0');
      }, 120);
    }
    if (id === 'gameover') countUp($('#final-score'), score || 128930);
    if (id === 'leaderboard') renderBoard(activeBoard);
  }

  function countUp(el, to) {
    var start = performance.now();
    var dur = 1200;
    (function frame(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(to * eased).toLocaleString('en-US');
      if (t < 1) requestAnimationFrame(frame);
    })(start);
  }

  /* ======================= Tabs (settings + leaderboard) ======================= */
  function setupTabs(tablist, onChange) {
    var tabs = $$('[role="tab"]', tablist);
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      onChange(tab);
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); blip(600, 0.05); });
      tab.addEventListener('keydown', function (e) {
        var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var next = tabs[(i + dir + tabs.length) % tabs.length];
        next.focus();
        select(next);
      });
    });
  }

  setupTabs($('#settings [role="tablist"]'), function (tab) {
    $$('#settings [role="tabpanel"]').forEach(function (p) { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
  });

  var activeBoard = 'global';
  setupTabs($('#leaderboard [role="tablist"]'), function (tab) {
    activeBoard = tab.getAttribute('data-board');
    $('#lb-panel').setAttribute('aria-labelledby', tab.id);
    renderBoard(activeBoard);
  });

  /* ======================= Settings (persisted) ======================= */
  var DEFAULTS = { master: 80, music: 60, sfx: 70, uiSounds: false, brightness: 100, scanlines: true, rain: true, quality: 'high', difficulty: 'normal', shake: true, subtitles: false };
  var settings = Object.assign({}, DEFAULTS);
  try { Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch (e) { /* storage unavailable */ }
  var form = $('#settings-form');

  function paintRange(input) {
    var pct = (input.value - input.min) / (input.max - input.min) * 100;
    input.style.setProperty('--fill', pct + '%');
    var out = form.querySelector('output[for="' + input.id + '"]');
    if (out) out.textContent = input.value;
  }

  function fillForm() {
    Object.keys(settings).forEach(function (key) {
      var field = form.elements[key];
      if (!field) return;
      if (field instanceof RadioNodeList) field.value = settings[key];
      else if (field.type === 'checkbox') field.checked = !!settings[key];
      else field.value = settings[key];
    });
    $$('input[type="range"]', form).forEach(paintRange);
    applySettings();
  }

  function readForm() {
    Object.keys(DEFAULTS).forEach(function (key) {
      var field = form.elements[key];
      if (!field) return;
      if (field instanceof RadioNodeList) settings[key] = field.value;
      else if (field.type === 'checkbox') settings[key] = field.checked;
      else if (field.type === 'range') settings[key] = Number(field.value);
      else settings[key] = field.value;
    });
  }

  function applySettings() {
    document.documentElement.style.setProperty('--brightness', settings.brightness / 100);
    document.body.classList.toggle('no-scanlines', !settings.scanlines);
    document.body.classList.toggle('no-rain', !settings.rain);
  }

  form.addEventListener('input', function (e) {
    if (e.target.type === 'range') paintRange(e.target);
    readForm();
    applySettings(); // live preview
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    readForm();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (err) { /* ignore */ }
    toast('Settings saved');
    blip(880, 0.12);
  });
  $('#reset-settings').addEventListener('click', function () {
    settings = Object.assign({}, DEFAULTS);
    fillForm();
    toast('Defaults restored — press Apply to save');
  });

  /* ======================= Level select ======================= */
  var grid = $('#level-grid');
  var selectedLevel = 0;
  var totalStars = 0;
  var lockSvg = '<svg class="level__lock" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  LEVELS.forEach(function (lvl, i) {
    var num = String(i + 1).padStart(2, '0');
    var li = document.createElement('li');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'level';
    btn.style.animationDelay = (i * 0.035) + 's';
    if (lvl.locked) {
      btn.disabled = true;
      btn.innerHTML = '<span class="level__num"><span class="visually-hidden">Sector </span>' + num + '</span><span><span class="level__name">' + lvl.name + '</span>' + lockSvg + '<span class="visually-hidden">, locked</span></span>';
    } else {
      totalStars += lvl.stars;
      var stars = '';
      for (var s = 0; s < 3; s++) stars += s < lvl.stars ? '★' : '<span class="off">★</span>';
      btn.setAttribute('aria-pressed', String(i === selectedLevel));
      btn.innerHTML = '<span class="level__num"><span class="visually-hidden">Sector </span>' + num + '</span><span><span class="level__name">' + lvl.name + '</span><span class="level__stars" aria-hidden="true">' + stars + '</span><span class="visually-hidden">, ' + lvl.stars + ' of 3 stars</span></span>';
      btn.addEventListener('click', function () {
        selectedLevel = i;
        $$('.level', grid).forEach(function (b) { if (!b.disabled) b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        $('#selected-level').textContent = 'Sector ' + num + ' · ' + lvl.name;
        blip(720, 0.06);
      });
    }
    li.appendChild(btn);
    grid.appendChild(li);
  });
  $('#stars-total').textContent = totalStars;

  /* ======================= Character select ======================= */
  var charIndex = 0;
  var portraits = {
    visor: '<path d="M60 30c22 0 36 16 36 38 0 14-6 26-14 32l26 14c12 6 20 18 20 32v14H2v-14c0-14 8-26 20-32l26-14c-8-6-14-18-14-32 0-22 14-38 36-38z" fill="#0c061c" stroke="currentColor" stroke-width="2.5"/><rect x="32" y="58" width="58" height="14" rx="3" fill="currentColor"/><path d="M40 136l20 24 20-24" fill="none" stroke="currentColor" stroke-width="2"/>',
    antenna: '<path d="M60 34c20 0 34 14 34 34v10c0 10-6 20-14 24l28 12c12 6 20 18 20 32v14H2v-14c0-14 8-26 20-32l28-12c-8-4-14-14-14-24V68c0-20 14-34 24-34z" fill="#0c061c" stroke="currentColor" stroke-width="2.5"/><path d="M60 34V8" stroke="currentColor" stroke-width="2.5"/><circle cx="60" cy="8" r="5" fill="currentColor"/><circle cx="46" cy="70" r="5" fill="currentColor"/><circle cx="74" cy="70" r="5" fill="currentColor"/><path d="M48 88h24" stroke="currentColor" stroke-width="2.5"/>',
    mohawk: '<path d="M60 40c24 0 40 14 40 36 0 12-6 22-14 28l30 12c12 6 22 18 22 32v12H-2v-12c0-14 10-26 22-32l30-12c-8-6-14-16-14-28 0-22 16-36 40-36z" fill="#0c061c" stroke="currentColor" stroke-width="2.5"/><path d="M52 40l4-28 4 12 4-14 4 14 4-10 2 26" fill="currentColor"/><path d="M38 72h18M66 72h18" stroke="currentColor" stroke-width="4"/><path d="M48 92h24" stroke="currentColor" stroke-width="3"/>',
    hood: '<path d="M60 18c30 0 46 24 46 52v40l16 10c6 4 10 12 10 20v22H-12v-22c0-8 4-16 10-20l16-10V70c0-28 16-52 46-52z" fill="#0c061c" stroke="currentColor" stroke-width="2.5"/><path d="M36 64c4-14 14-22 24-22s20 8 24 22v20c-6 8-14 12-24 12s-18-4-24-12z" fill="#000" stroke="currentColor" stroke-width="1.5"/><path d="M44 70h12M64 70h12" stroke="currentColor" stroke-width="3"/>'
  };
  var dots = $('#char-dots');
  CHARACTERS.forEach(function (c, i) {
    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'char-dot';
    d.setAttribute('aria-label', c.name + ', ' + c.role);
    d.addEventListener('click', function () { setCharacter(i); });
    dots.appendChild(d);
  });

  function setCharacter(i) {
    var dir = i > charIndex ? 1 : -1;
    charIndex = (i + CHARACTERS.length) % CHARACTERS.length;
    var c = CHARACTERS[charIndex];
    var card = $('#char-card');
    card.style.setProperty('--char', c.color);
    card.style.setProperty('--dir', (dir * 24) + 'px');
    $('#characters').style.setProperty('--char', c.color);
    $('#char-portrait').innerHTML = '<svg viewBox="-10 0 140 170" style="color:' + c.color + '" aria-hidden="true">' + portraits[c.look] + '</svg>';
    $('#char-name').textContent = c.name;
    $('#char-class').textContent = c.role;
    $('#char-bio').textContent = c.bio;
    $('#char-stats').innerHTML = Object.keys(c.stats).map(function (k) {
      return '<div><dt>' + k + '</dt><dd class="stat-bar"><span style="--v:' + c.stats[k] + '%"></span></dd><dd class="stat-num">' + c.stats[k] + '</dd></div>';
    }).join('');
    $$('.char-dot', dots).forEach(function (d, n) { d.setAttribute('aria-pressed', String(n === charIndex)); });
    card.classList.remove('is-swapping');
    void card.offsetWidth;
    card.classList.add('is-swapping');
    blip(500 + charIndex * 80, 0.06);
  }
  $('#char-prev').addEventListener('click', function () { setCharacter(charIndex - 1); });
  $('#char-next').addEventListener('click', function () { setCharacter(charIndex + 1); });

  // Swipe on touch screens
  var touchX = null;
  $('#char-card').addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  $('#char-card').addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) setCharacter(charIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ======================= Leaderboard ======================= */
  var tagColors = ['#22f3ff', '#ff2bd6', '#f9f871', '#4dffb8', '#a78bfa'];
  function renderBoard(key) {
    var rows = BOARDS[key].slice().sort(function (a, b) { return b[2] - a[2]; });
    $('#lb-body').innerHTML = rows.map(function (r, i) {
      var you = r[0] === PLAYER_NAME;
      var initials = r[0].replace(/[^A-Z0-9]/gi, '').slice(0, 2);
      return '<tr class="' + (you ? 'is-you' : '') + '" style="animation-delay:' + (i * 0.04) + 's">' +
        '<td class="rank rank--' + (i + 1) + '">#' + (i + 1) + '</td>' +
        '<td><span class="runner-name"><span class="tag" style="--tag-color:' + tagColors[i % tagColors.length] + '" aria-hidden="true">' + initials + '</span>' + r[0] + (you ? ' <span class="visually-hidden">(you)</span>' : '') + '</span></td>' +
        '<td class="col-sector">' + r[1] + '</td>' +
        '<td>' + r[2].toLocaleString('en-US') + '</td></tr>';
    }).join('');
  }
  $$('.board th')[2].classList.add('col-sector');

  /* ======================= Init ======================= */
  fillForm();
  setCharacter(0);
  renderBoard('global');

  function routeFromHash(silent) {
    var id = location.hash.slice(1);
    if (id && document.getElementById(id) && document.getElementById(id).hasAttribute('data-screen')) {
      showScreen(id, { fromHash: true, silent: silent, force: true });
    }
  }
  window.addEventListener('hashchange', function () { routeFromHash(false); });
  routeFromHash(true);
})();
