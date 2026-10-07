/* ==========================================================================
   PIXEL QUEST — 8-bit Pixel Arcade Game Menu Template
   Vanilla JS: navigation, keyboard control, pixel sprites (drawn from text maps),
   world map, hero select, continue countdown, high scores, saved options.
   Edit the DATA section to change sprites, levels, heroes and scores.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================= DATA (edit me) ======================= */
  // Sprite maps: one character per pixel, "." = transparent. Colors come from SPRITE_COLORS.
  var SPRITES = {
    knight: [
      '....KKKK....',
      '...KSSSSK...',
      '..KSSSSSSK..',
      '..KSKKKKSK..',
      '..KSSSSSSK..',
      '...KSSSSK...',
      '..KBBBBBBK..',
      '.KBBYBBYBBK.',
      '.KSBBBBBBSK.',
      '.KSKBBBBKSK.',
      '...KBBBBK...',
      '...KBKKBK...',
      '...KSK.KSK..',
      '..KKK..KKK..'
    ],
    mage: [
      '.....KK.....',
      '....KPPK....',
      '...KPPPPK...',
      '..KPPYPPPK..',
      '.KKKKKKKKKK.',
      '...KFFFFK...',
      '...KFKKFK...',
      '...KFFFFK...',
      '..KPPPPPPK..',
      '.KPPPWWPPPK.',
      '.KPPPWWPPPK.',
      '..KPPPPPPK..',
      '..KPPKKPPK..',
      '..KKK..KKK..'
    ],
    rogue: [
      '....KKKK....',
      '...KGGGGK...',
      '..KGGGGGGK..',
      '..KGKKKKGK..',
      '..KKYKKYKK..',
      '..KGKKKKGK..',
      '...KGGGGK...',
      '..KNNNNNNK..',
      '.KGKNNNNKGK.',
      '.KGKNNNNKGK.',
      '..KKNNNNKK..',
      '...KNKKNK...',
      '...KNK.KNK..',
      '..KKK..KKK..'
    ],
    robot: [
      '.....KK.....',
      '.....RK.....',
      '..KKKKKKKK..',
      '..KSSSSSSK..',
      '..KSBSSBSK..',
      '..KSSSSSSK..',
      '..KSKKKKSK..',
      '..KKKKKKKK..',
      '.KSSSSSSSSK.',
      'KSKSOOOOSKSK',
      'KSKSOOOOSKSK',
      '.KKSSSSSSKK.',
      '...KSKKSK...',
      '..KKKK.KKKK.'
    ]
  };
  var SPRITE_COLORS = { K: '#000000', S: '#c2c3c7', B: '#29adff', Y: '#ffd23f', P: '#a855f7', F: '#ffccaa', W: '#fff1e8', G: '#00a83a', N: '#8a4b2c', R: '#ff4d6d', O: '#ffa300' };

  var HEROES = [
    { id: 'knight', name: 'KNIGHT', bio: 'Heavy armor, big heart. Shield-bashes through brick walls.', stats: { POWER: 4, SPEED: 2, MAGIC: 1, LUCK: 3 } },
    { id: 'mage', name: 'MAGE', bio: 'Throws bouncing fireballs and floats over gaps for a moment.', stats: { POWER: 2, SPEED: 3, MAGIC: 5, LUCK: 2 } },
    { id: 'rogue', name: 'ROGUE', bio: 'Double jump, wall slide, and a suspicious number of coins.', stats: { POWER: 3, SPEED: 5, MAGIC: 1, LUCK: 4 } },
    { id: 'robot', name: 'ROBO-8', bio: 'Rocket boots and a laser. Battery not included.', stats: { POWER: 4, SPEED: 3, MAGIC: 3, LUCK: 1 } }
  ];

  // x / y are percentages on the map; stars 0-3; current = where the player stands
  var LEVELS = [
    { id: '1-1', name: 'GRASSY HILLS', x: 8, y: 78, stars: 3 },
    { id: '1-2', name: 'MUSHROOM PATH', x: 22, y: 56, stars: 2 },
    { id: '1-3', name: 'OLD BRIDGE', x: 38, y: 70, stars: 3, current: true },
    { id: '1-4', name: 'LAKE SHORE', x: 52, y: 44, stars: 0 },
    { id: '2-1', name: 'CAVE MOUTH', x: 66, y: 66, stars: 0 },
    { id: '2-2', name: 'CRYSTAL MINE', x: 80, y: 50, locked: true },
    { id: '2-3', name: 'LAVA STEPS', x: 88, y: 26, locked: true },
    { id: 'BOSS', name: 'SKY CASTLE', x: 70, y: 16, locked: true, boss: true }
  ];

  var SCORES = {
    all: [[98500, 'ACE', 'rogue'], [87200, 'MAX', 'knight'], [76000, 'ZED', 'mage'], [64350, 'BOB', 'robot'], [58800, 'KAT', 'rogue'], [47200, 'YOU', 'knight'], [33100, 'JIN', 'mage'], [21900, 'LOU', 'robot']],
    today: [[47200, 'YOU', 'knight'], [31000, 'PIP', 'mage'], [24400, 'DOT', 'rogue'], [9800, 'NEW', 'robot']]
  };
  var PLAYER_NAME = 'YOU';
  var STORAGE_KEY = 'pixel-quest-options';

  /* ======================= Helpers ======================= */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var screens = $$('[data-screen]');
  var current = 'title';
  var stack = [];
  var toastTimer;

  function toast(msg) {
    var el = $('.toast');
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 2200);
  }

  /* Render a sprite map as a crisp inline SVG */
  function sprite(name, scale) {
    var map = SPRITES[name];
    var w = map[0].length, h = map.length, rects = '';
    map.forEach(function (row, y) {
      row.split('').forEach(function (ch, x) {
        if (ch !== '.') rects += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + SPRITE_COLORS[ch] + '"/>';
      });
    });
    return '<svg class="sprite" viewBox="0 0 ' + w + ' ' + h + '" width="' + (w * scale) + '" height="' + (h * scale) + '" shape-rendering="crispEdges" aria-hidden="true">' + rects + '</svg>';
  }
  function paintSprites(ctx) {
    $$('[data-sprite]', ctx).forEach(function (el) { el.innerHTML = sprite(el.getAttribute('data-sprite'), Number(el.getAttribute('data-scale') || 4)); });
  }

  /* ======================= Chiptune beeps ======================= */
  var actx = null;
  function beep(freq, dur, type) {
    if (!settings.beeps) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.06 * settings.sfx / 10, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.connect(g).connect(actx.destination);
      o.start(); o.stop(actx.currentTime + dur);
    } catch (e) { /* no audio */ }
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
    var prev = current;
    current = id;
    if (!opts.fromHash) history.replaceState(null, '', '#' + id);
    onLeave(prev);
    onEnter(id);
    if (!opts.silent) {
      var f = target.querySelector('.menu__item, .press-start, h1');
      if (f) f.focus({ preventScroll: true });
    }
  }
  function goBack() { var p = stack.pop(); if (p) showScreen(p, { isBack: true }); }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-goto]');
    if (!btn) return;
    e.preventDefault();
    beep(880, 0.07);
    var action = btn.getAttribute('data-action');
    if (action === 'restart') { score = 0; toast('READY!'); }
    if (action === 'pick-hero') toast(HEROES[heroIndex].name + ' JOINS THE PARTY!');
    if (action === 'quit') toast('THANKS FOR PLAYING!');
    if (btn.hasAttribute('data-back') && stack.length) { goBack(); return; }
    showScreen(btn.getAttribute('data-goto'));
  });

  document.addEventListener('keydown', function (e) {
    var screen = document.getElementById(current);
    if (current === 'title' && (e.key === 'Enter' || e.key === ' ')) {
      if (document.activeElement === document.body || document.activeElement.matches('h1')) { e.preventDefault(); showScreen('main'); }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (current === 'play') showScreen('pause');
      else if (current === 'pause') showScreen('play');
      else if (current === 'main') showScreen('title');
      else if (current !== 'title') {
        var back = $('[data-back], .box__head .pixel-btn', screen);
        if (back) back.click(); else showScreen('main');
      }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && $('.menu--row', screen))) {
      var items = $$('.menu__item', screen);
      if (!items.length) return;
      var idx = items.indexOf(document.activeElement);
      if (idx === -1 && document.activeElement !== document.body && !document.activeElement.matches('h1')) return;
      e.preventDefault();
      var dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
      items[idx === -1 ? 0 : (idx + dir + items.length) % items.length].focus();
      beep(440, 0.04);
    }
  });
  document.addEventListener('mouseover', function (e) { if (e.target.closest && e.target.closest('.menu__item')) beep(660, 0.03); });

  /* ======================= Screen hooks ======================= */
  var score = 12450, scoreTimer, countTimer;
  function onEnter(id) {
    if (id === 'play') {
      scoreTimer = setInterval(function () {
        score += 50;
        $('#live-score').textContent = String(score).padStart(6, '0');
        if (score % 500 === 0) $('#coins').textContent = Number($('#coins').textContent) + 1;
      }, 200);
    }
    if (id === 'gameover') startContinue();
    if (id === 'levels') positionMarker();
  }
  function onLeave(id) {
    if (id === 'play') clearInterval(scoreTimer);
    if (id === 'gameover') clearInterval(countTimer);
  }

  /* CONTINUE? 9..0 — at zero it drops you on the high score table */
  function startContinue() {
    var n = 9, el = $('#countdown');
    $('#final-score').textContent = String(score || 12450).padStart(6, '0');
    el.textContent = n;
    clearInterval(countTimer);
    countTimer = setInterval(function () {
      n--;
      el.textContent = n;
      el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
      beep(n ? 330 : 110, n ? 0.08 : 0.4, n ? 'square' : 'sawtooth');
      if (n <= 0) {
        clearInterval(countTimer);
        el.textContent = 'GAME OVER';
        el.style.fontSize = 'clamp(20px, 5vw, 32px)';
        setTimeout(function () { if (current === 'gameover') { el.style.fontSize = ''; showScreen('leaderboard'); } }, 1600);
      }
    }, 1000);
  }

  /* ======================= Tabs ======================= */
  function setupTabs(list, onChange) {
    var tabs = $$('[role="tab"]', list);
    function select(t) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; }); onChange(t); }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); beep(700, 0.05); });
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
  var board = 'all';
  setupTabs($('#leaderboard [role="tablist"]'), function (t) {
    board = t.getAttribute('data-board');
    $('#hs-panel').setAttribute('aria-labelledby', t.id);
    renderScores();
  });

  /* ======================= Options (saved) ======================= */
  var DEFAULTS = { music: 7, sfx: 8, beeps: false, crt: true, parallax: true, palette: 'night', difficulty: 'normal' };
  var settings = Object.assign({}, DEFAULTS);
  try { Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch (e) { /* ignore */ }
  var form = $('#settings-form');

  function paintRange(input) {
    input.style.setProperty('--fill', (input.value / input.max * 100) + '%');
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
      else settings[k] = Number(f.value);
    });
  }
  function apply() {
    document.body.classList.toggle('no-crt', !settings.crt);
    document.body.classList.toggle('no-parallax', !settings.parallax);
    document.documentElement.setAttribute('data-palette', settings.palette);
  }
  form.addEventListener('input', function (e) { if (e.target.type === 'range') paintRange(e.target); readForm(); apply(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault(); readForm();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (err) { /* ignore */ }
    toast('OPTIONS SAVED!'); beep(1046, 0.15);
  });
  $('#reset-settings').addEventListener('click', function () { settings = Object.assign({}, DEFAULTS); fillForm(); toast('DEFAULTS LOADED'); });

  /* ======================= World map ======================= */
  var nodes = $('#map-nodes'), selected = LEVELS.findIndex(function (l) { return l.current; }), totalStars = 0;
  var marker = document.createElement('div');
  marker.className = 'map__marker';
  marker.innerHTML = sprite('knight', 2);
  $('#map').appendChild(marker);
  $('#map-path').setAttribute('points', LEVELS.map(function (l) { return l.x + ',' + (l.y * 0.6); }).join(' '));
  LEVELS.forEach(function (lvl, i) {
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'node' + (lvl.current ? ' node--current' : '') + (lvl.boss ? ' node--boss' : '');
    b.style.left = lvl.x + '%';
    b.style.top = lvl.y + '%';
    var label = lvl.boss ? '★' : lvl.id.split('-')[1];
    if (lvl.locked) {
      b.disabled = true;
      b.innerHTML = label + '<span class="visually-hidden"> level ' + lvl.id + ' ' + lvl.name + ', locked</span>';
    } else {
      totalStars += lvl.stars;
      b.setAttribute('aria-pressed', String(i === selected));
      b.innerHTML = label + '<span class="visually-hidden"> level ' + lvl.id + ' ' + lvl.name + ', ' + lvl.stars + ' of 3 stars</span>' +
        '<span class="node__stars" aria-hidden="true">' + '★'.repeat(lvl.stars) + '</span>';
      b.addEventListener('click', function () {
        selected = i;
        $$('.node', nodes).forEach(function (n) { if (!n.disabled) n.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        $('#level-info').textContent = lvl.id + ' ' + lvl.name;
        positionMarker();
        beep(523, 0.06);
      });
    }
    li.appendChild(b);
    nodes.appendChild(li);
  });
  $('#stars-total').textContent = totalStars;
  $('#level-info').textContent = LEVELS[selected].id + ' ' + LEVELS[selected].name;
  function positionMarker() {
    marker.style.left = LEVELS[selected].x + '%';
    marker.style.top = 'calc(' + LEVELS[selected].y + '% - 22px)';
  }

  /* ======================= Heroes ======================= */
  var heroIndex = 0, heroWrap = $('#heroes');
  HEROES.forEach(function (h, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'hero';
    b.setAttribute('role', 'radio');
    b.innerHTML = sprite(h.id, 4) + '<span>' + h.name + '</span>';
    b.addEventListener('click', function () { setHero(i); });
    b.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      e.stopPropagation();
      setHero(heroIndex + d, true);
    });
    heroWrap.appendChild(b);
  });
  function setHero(i, focus) {
    heroIndex = (i + HEROES.length) % HEROES.length;
    var h = HEROES[heroIndex];
    $$('.hero', heroWrap).forEach(function (b, n) {
      var on = n === heroIndex;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    $('#hero-big').innerHTML = sprite(h.id, 9);
    $('#hero-name').textContent = h.name;
    $('#hero-bio').textContent = h.bio;
    $('#hero-stats').innerHTML = Object.keys(h.stats).map(function (k) {
      var pips = '';
      for (var p = 0; p < 5; p++) pips += '<span class="pip' + (p < h.stats[k] ? ' is-on' : '') + '" aria-hidden="true"></span>';
      return '<div><dt>' + k + '</dt><dd><span class="visually-hidden">' + h.stats[k] + ' of 5</span>' + pips + '</dd></div>';
    }).join('');
    beep(600 + heroIndex * 120, 0.06);
  }
  document.addEventListener('keydown', function (e) {
    if (current === 'characters' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.target.closest('.hero, [role="tab"]')) {
      e.preventDefault();
      setHero(heroIndex + (e.key === 'ArrowRight' ? 1 : -1));
    }
  });

  /* ======================= High scores ======================= */
  var ORD = ['1ST', '2ND', '3RD'];
  function renderScores() {
    $('#hs-body').innerHTML = SCORES[board].slice().sort(function (a, b) { return b[0] - a[0]; }).map(function (r, i) {
      return '<tr class="' + (r[1] === PLAYER_NAME ? 'is-you' : '') + '" style="animation-delay:' + (i * 0.06) + 's">' +
        '<td>' + (ORD[i] || (i + 1) + 'TH') + '</td><td>' + String(r[0]).padStart(6, '0') + '</td><td>' + r[1] + '</td>' +
        '<td class="col-hero hero-cell">' + sprite(r[2], 2) + '</td></tr>';
    }).join('');
  }

  /* ======================= Init ======================= */
  paintSprites(document);
  fillForm();
  setHero(0);
  renderScores();
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    if (el && el.hasAttribute('data-screen')) showScreen(id, { fromHash: true, silent: silent, force: true });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
