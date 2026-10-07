/* ==========================================================================
   Embervale — Fantasy RPG Game Menu Template
   Vanilla JS: navigation, keyboard control, options (saved), quest chapters,
   flip-card hero select, hall of legends, embers and soft chimes.
   Edit the DATA section to use your own heroes, chapters and legends.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================= DATA (edit me) ======================= */
  var EMBLEMS = {
    sword: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 6l8 10v50H42V16z" fill="url(#gilt)"/><path d="M50 12v52" stroke="#5b3a10" stroke-width="2"/><path d="M28 66h44v7H28z" fill="url(#gilt)"/><path d="M46 73h8v16h-8z" fill="#5b3a1e"/><circle cx="50" cy="93" r="5" fill="url(#gilt)"/></svg>',
    bow: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M30 8c34 14 34 70 0 84" fill="none" stroke="url(#gilt)" stroke-width="6" stroke-linecap="round"/><path d="M30 8v84" stroke="#e8dcc0" stroke-width="1.5"/><path d="M18 50h66" stroke="#d4a541" stroke-width="3"/><path d="M84 50l-10-6v12z" fill="url(#gilt)"/><path d="M22 44l-6 6 6 6" fill="none" stroke="#e8dcc0" stroke-width="2"/></svg>',
    staff: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 30v64" stroke="#7a4c22" stroke-width="7" stroke-linecap="round"/><circle cx="50" cy="20" r="13" fill="none" stroke="url(#gilt)" stroke-width="4"/><circle cx="50" cy="20" r="7" fill="#8fd3ff"><animate attributeName="opacity" values="1;.5;1" dur="2s" repeatCount="indefinite"/></circle><path d="M38 34h24" stroke="#d4a541" stroke-width="4" stroke-linecap="round"/></svg>',
    chalice: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M26 14h48c0 26-10 40-24 40S26 40 26 14z" fill="url(#gilt)"/><path d="M50 54v24" stroke="#c4922f" stroke-width="6"/><path d="M30 86h40l-6-8H36z" fill="url(#gilt)"/><path d="M40 26c2 8 6 12 10 12" fill="none" stroke="#fff6d8" stroke-width="2" stroke-linecap="round"/><circle cx="50" cy="8" r="3" fill="#ffb3b3"/></svg>'
  };

  var HEROES = [
    { name: 'Aldric', role: 'Warrior of the Pass', emblem: 'sword', tint: '#4a2a1c', bio: 'Held the northern pass for nine days with a broken shield and a borrowed sword.', stats: { Strength: 18, Agility: 11, Wisdom: 9, Faith: 12 } },
    { name: 'Wren', role: 'Ranger of the Fen', emblem: 'bow', tint: '#1f3a2c', bio: 'Speaks to herons and never misses twice. Knows every hidden path in the marsh.', stats: { Strength: 11, Agility: 18, Wisdom: 13, Faith: 8 } },
    { name: 'Isolde', role: 'Sorceress of Ash', emblem: 'staff', tint: '#2a2f5c', bio: 'Studied flame in the ruined tower until the flame began to study her back.', stats: { Strength: 7, Agility: 12, Wisdom: 19, Faith: 11 } },
    { name: 'Brother Oswin', role: 'Cleric of the Dawn', emblem: 'chalice', tint: '#4a3d14', bio: 'Heals the wounded, blesses the brave and brews a most suspicious ale.', stats: { Strength: 12, Agility: 9, Wisdom: 14, Faith: 19 } }
  ];

  var CHAPTERS = [
    { title: 'The Ember Road', desc: 'Leave the village before the bells stop.', progress: 100 },
    { title: 'Ashfall Woods', desc: 'Find the hermit who remembers the fire.', progress: 100 },
    { title: 'The Whispering Fen', desc: 'Light three beacons in the drowned marsh.', progress: 40, current: true },
    { title: 'Ironhold Keep', desc: 'Win the trust of the exiled lord.', progress: 0 },
    { title: 'The Glass Desert', desc: 'Cross the sands that sing at night.', progress: 0 },
    { title: 'Crown of Thorns', desc: 'Sealed until the keep is taken.', locked: true },
    { title: 'The Ashen Throne', desc: 'Sealed until the crown is found.', locked: true },
    { title: 'Epilogue', desc: 'Sealed until the end of all things.', locked: true }
  ];
  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  var LEGENDS = {
    renown: [
      ['Seraphine', 'the Unbroken', 98210, '#7d1a1f', '#d4a541', 'chevron'], ['Grimald', 'Wolfsbane', 91400, '#1d3b6b', '#e8e2d0', ''],
      ['Mirelle', 'of the Seven Bells', 88765, '#2f6b4f', '#d4a541', 'band'], ['Thane Corwick', 'the Grey', 80120, '#3c3c3c', '#c8c8c8', ''],
      ['Lysa', 'Stormcaller', 76040, '#4b2a6b', '#d4a541', 'chevron'], ['You', 'the Wanderer', 41230, '#8e1c1c', '#efe3c4', 'band']
    ],
    speed: [
      ['Mirelle', '3h 02m', 3.03, '#2f6b4f', '#d4a541', 'band'], ['Pip Quickfoot', '3h 18m', 3.3, '#a05a1c', '#efe3c4', 'chevron'],
      ['Seraphine', '3h 40m', 3.66, '#7d1a1f', '#d4a541', 'chevron'], ['You', '4h 12m', 4.2, '#8e1c1c', '#efe3c4', 'band']
    ],
    guild: [
      ['Brannoc', 'Guild Master', 64200, '#1d3b6b', '#d4a541', 'chevron'], ['You', 'the Wanderer', 41230, '#8e1c1c', '#efe3c4', 'band'],
      ['Elowen', 'Herbwise', 39900, '#2f6b4f', '#efe3c4', ''], ['Tamsin', 'the Bold', 22050, '#6b2a4b', '#d4a541', 'band']
    ]
  };
  var PLAYER_NAME = 'You';
  var STORAGE_KEY = 'embervale-options';

  /* ======================= Helpers ======================= */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var screens = $$('[data-screen]');
  var current = 'main';
  var stack = [];
  var toastTimer;
  function toast(msg) {
    var el = $('.toast');
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 2800);
  }

  /* ======================= Embers ======================= */
  var embers = $('#embers');
  for (var i = 0; i < 26; i++) {
    var e = document.createElement('span');
    e.style.left = (Math.random() * 100) + '%';
    e.style.animationDuration = (7 + Math.random() * 9) + 's';
    e.style.animationDelay = (-Math.random() * 16) + 's';
    e.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
    embers.appendChild(e);
  }

  /* ======================= Soft chimes ======================= */
  var actx = null;
  function chime(freq) {
    if (!settings.chimes) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08 * settings.master / 100, actx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.6);
      o.connect(g).connect(actx.destination);
      o.start(); o.stop(actx.currentTime + 0.6);
    } catch (err) { /* no audio */ }
  }

  /* ======================= Navigation ======================= */
  function showScreen(id, opts) {
    opts = opts || {};
    var target = document.getElementById(id);
    if (!target || !target.hasAttribute('data-screen')) return;
    if (id === current && !opts.force) return;
    if (!opts.isBack) stack.push(current);
    if (stack.length > 20) stack.shift();
    screens.forEach(function (s) { var on = s === target; s.hidden = !on; s.classList.toggle('is-active', on); });
    current = id;
    if (!opts.fromHash) history.replaceState(null, '', '#' + id);
    onEnter(id);
    if (!opts.silent) {
      var f = target.querySelector('.plaque, .ink-btn, h1');
      if (f) f.focus({ preventScroll: true });
    }
  }
  function goBack() { var p = stack.pop(); if (p) showScreen(p, { isBack: true }); }

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-goto]');
    if (!btn) return;
    ev.preventDefault();
    chime(660);
    var a = btn.getAttribute('data-action');
    if (a === 'save') toast('Progress inscribed in the chronicle.');
    if (a === 'revive') toast('Thou risest once more.');
    if (a === 'pick-hero') toast(HEROES[heroIndex].name + ' has sworn the oath.');
    if (a === 'quit') toast('Farewell, traveller. The realm awaits thy return.');
    if (btn.hasAttribute('data-back') && stack.length) { goBack(); return; }
    showScreen(btn.getAttribute('data-goto'));
  });

  document.addEventListener('keydown', function (ev) {
    var screen = document.getElementById(current);
    if (ev.key === 'Escape') {
      ev.preventDefault();
      if (current === 'play') showScreen('pause');
      else if (current === 'pause') showScreen('play');
      else if (current !== 'main') { var back = $('.back-btn', screen); if (back) back.click(); else showScreen('main'); }
      return;
    }
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      var items = $$('.plaque, .ink-btn', screen);
      if (!items.length) return;
      var idx = items.indexOf(document.activeElement);
      if (idx === -1 && document.activeElement !== document.body && !document.activeElement.matches('h1')) return;
      ev.preventDefault();
      var d = ev.key === 'ArrowDown' ? 1 : -1;
      items[idx === -1 ? 0 : (idx + d + items.length) % items.length].focus();
    }
  });

  /* ======================= Screen hooks ======================= */
  var beaconTimer;
  function onEnter(id) {
    clearInterval(beaconTimer);
    if (id === 'play') {
      var n = 1;
      beaconTimer = setInterval(function () { n = n % 3 + 1; $('#beacons').textContent = '(' + n + '/3)'; }, 2500);
    }
    if (id === 'gameover') { countUp($('#tally-foes'), 317); countUp($('#tally-gold'), 12840); }
  }
  function countUp(el, to) {
    var start = performance.now();
    (function step(now) {
      var t = Math.min(1, (now - start) / 1400);
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3))).toLocaleString('en-US');
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ======================= Tabs ======================= */
  function setupTabs(list, onChange) {
    var tabs = $$('[role="tab"]', list);
    function select(t) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; }); onChange(t); }
    tabs.forEach(function (t, n) {
      t.addEventListener('click', function () { select(t); chime(880); });
      t.addEventListener('keydown', function (ev) {
        var d = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        ev.preventDefault();
        var nx = tabs[(n + d + tabs.length) % tabs.length]; nx.focus(); select(nx);
      });
    });
  }
  setupTabs($('#settings [role="tablist"]'), function (t) {
    $$('#settings [role="tabpanel"]').forEach(function (p) { p.hidden = p.id !== t.getAttribute('aria-controls'); });
  });
  var board = 'renown';
  setupTabs($('#leaderboard [role="tablist"]'), function (t) {
    board = t.getAttribute('data-board');
    $('#lg-panel').setAttribute('aria-labelledby', t.id);
    renderLegends();
  });

  /* ======================= Options (saved) ======================= */
  var DEFAULTS = { master: 80, music: 65, voice: 90, chimes: false, gamma: 100, embers: true, mist: true, textSize: '1', difficulty: 'adventurer', subtitles: true, autosave: true };
  var settings = Object.assign({}, DEFAULTS);
  try { Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch (err) { /* ignore */ }
  var form = $('#settings-form');
  function paintRange(input) {
    input.style.setProperty('--fill', ((input.value - input.min) / (input.max - input.min) * 100) + '%');
    var out = form.querySelector('output[for="' + input.id + '"]');
    if (out) out.textContent = input.value;
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
      else if (f.type === 'range') settings[k] = Number(f.value);
      else settings[k] = f.value;
    });
  }
  function apply() {
    var root = document.documentElement;
    root.style.setProperty('--gamma', settings.gamma / 100);
    root.style.setProperty('--text-scale', settings.textSize);
    document.body.classList.toggle('no-embers', !settings.embers);
    document.body.classList.toggle('no-mist', !settings.mist);
  }
  form.addEventListener('input', function (ev) { if (ev.target.type === 'range') paintRange(ev.target); readForm(); apply(); });
  form.addEventListener('change', function () { readForm(); apply(); });
  form.addEventListener('submit', function (ev) {
    ev.preventDefault(); readForm();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (err) { /* ignore */ }
    toast('Thy choices are sealed.'); chime(990);
  });
  $('#reset-settings').addEventListener('click', function () { settings = Object.assign({}, DEFAULTS); fillForm(); toast('Defaults restored. Seal to keep them.'); });

  /* ======================= Quest log ======================= */
  var list = $('#chapters');
  var chosen = CHAPTERS.findIndex(function (c) { return c.current; });
  CHAPTERS.forEach(function (c, n) {
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chapter' + (c.current ? ' chapter--current' : '');
    b.style.animationDelay = (n * 0.05) + 's';
    var status = c.locked ? '' : c.progress === 100 ? 'Complete' : c.current ? 'In progress' : '';
    b.innerHTML =
      '<span class="chapter__num" aria-hidden="true">' + ROMAN[n] + '</span>' +
      '<span>' + (status ? '<span class="chapter__status" aria-hidden="true">' + status + '</span>' : '') + '<span class="visually-hidden">Chapter ' + ROMAN[n] + ': </span><span class="chapter__title">' + c.title + '</span>' +
      '<span class="chapter__desc">' + c.desc + '</span>' +
      (c.locked ? '<span class="visually-hidden">, sealed</span>' : '<span class="chapter__bar" aria-hidden="true"><span style="--p:' + c.progress + '%"></span></span><span class="visually-hidden">, ' + c.progress + '% complete</span>') +
      '</span>';
    if (c.locked) b.disabled = true;
    else {
      b.setAttribute('aria-pressed', String(n === chosen));
      b.addEventListener('click', function () {
        chosen = n;
        $$('.chapter', list).forEach(function (x) { if (!x.disabled) x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        $('#chosen-chapter').textContent = 'Chapter ' + ROMAN[n] + ' · ' + c.title;
        chime(740);
      });
    }
    li.appendChild(b);
    list.appendChild(li);
  });
  $('#chosen-chapter').textContent = 'Chapter ' + ROMAN[chosen] + ' · ' + CHAPTERS[chosen].title;

  /* ======================= Heroes ======================= */
  var heroIndex = -1, cards = $('#hero-cards');
  HEROES.forEach(function (h, n) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'card';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', 'false');
    b.tabIndex = n === 0 ? 0 : -1;
    b.style.setProperty('--card-tint', h.tint);
    b.innerHTML =
      '<span class="card__face card__front">' + EMBLEMS[h.emblem] + '<span class="card__name">' + h.name + '</span><span class="card__class">' + h.role + '</span></span>' +
      '<span class="card__face card__back"><span class="card__back-title">' + h.name + '</span><span class="card__bio">' + h.bio + '</span><span class="card__stats">' +
      Object.keys(h.stats).map(function (k) { return '<span class="card__stat"><span>' + k + '</span><strong>' + h.stats[k] + '</strong></span>'; }).join('') +
      '</span></span>';
    b.addEventListener('click', function () { setHero(n); });
    b.addEventListener('keydown', function (ev) {
      var d = (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') ? 1 : (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') ? -1 : 0;
      if (!d) return;
      ev.preventDefault();
      setHero((Math.max(heroIndex, 0) + d + HEROES.length) % HEROES.length, true);
    });
    cards.appendChild(b);
  });
  function setHero(n, focus) {
    heroIndex = n;
    $$('.card', cards).forEach(function (c, k) {
      var on = k === n;
      c.setAttribute('aria-checked', String(on));
      c.tabIndex = on ? 0 : -1;
      if (on && focus) c.focus();
    });
    $('#chosen-hero').textContent = HEROES[n].name + ', ' + HEROES[n].role;
    chime(520 + n * 90);
  }
  $('#chosen-hero').textContent = 'No champion chosen yet.';

  /* ======================= Hall of legends ======================= */
  function renderLegends() {
    var rows = LEGENDS[board].slice().sort(function (a, b) { return board === 'speed' ? a[2] - b[2] : b[2] - a[2]; });
    $('#lg-list').innerHTML = rows.map(function (r, n) {
      var score = board === 'speed' ? r[1] : r[2].toLocaleString('en-US');
      var title = board === 'speed' ? 'Completed the saga' : r[1];
      return '<li class="legend' + (r[0] === PLAYER_NAME ? ' legend--you' : '') + '" style="animation-delay:' + (n * 0.05) + 's">' +
        '<span class="legend__rank">' + (n + 1) + '</span>' +
        '<span class="shield' + (r[5] ? ' shield--' + r[5] : '') + '" style="--c1:' + r[3] + ';--c2:' + r[4] + '" aria-hidden="true"></span>' +
        '<span class="legend__name">' + r[0] + '<span class="legend__title">' + title + '</span></span>' +
        '<span class="legend__score">' + score + '</span></li>';
    }).join('');
  }

  /* ======================= Init ======================= */
  fillForm();
  renderLegends();
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    if (el && el.hasAttribute('data-screen')) showScreen(id, { fromHash: true, silent: silent, force: true });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
