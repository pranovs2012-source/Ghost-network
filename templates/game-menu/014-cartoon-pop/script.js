/* ==========================================================================
   BOUNCE BUDDIES — Cartoon Game Menu Template
   Vanilla JS: navigation, POW bursts, boing sounds, buddy drawing (SVG),
   settings (saved), sticker-book levels, buddy select with paint, podium.
   Edit the DATA section to add your own buddies, worlds and scores.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================= DATA (edit me) ======================= */
  var BUDDIES = [
    { name: 'Blip', shape: 'blob', color: '#6ac8ff', says: 'Hi! I bounce extra high!', stats: { Bounce: 90, Speed: 60, Luck: 50 } },
    { name: 'Pippa', shape: 'ears', color: '#ff8cc6', says: 'Let’s go, let’s GO!', stats: { Bounce: 60, Speed: 95, Luck: 55 } },
    { name: 'Tumble', shape: 'frog', color: '#6ee36a', says: 'Ribbit… I mean, hello.', stats: { Bounce: 75, Speed: 45, Luck: 85 } },
    { name: 'Sunny', shape: 'star', color: '#ffd84d', says: 'Shine on, buddy!', stats: { Bounce: 70, Speed: 70, Luck: 95 } }
  ];
  var PAINTS = ['#6ac8ff', '#ff8cc6', '#6ee36a', '#ffd84d', '#c3a2ff', '#ffab4d', '#ff7b7b'];

  var WORLDS = [
    { color: '#6ee36a', levels: [['Bean Sprout', 3], ['Gummy Bridge', 3], ['Jelly Jump', 2], ['Candy Cave', 1], ['Sugar Rush', 0], ['Big Wobble', 0, 'boss']] },
    { color: '#6ac8ff', levels: [['Snow Bounce', 2], ['Icicle Hop', 0], ['Penguin Path', null], ['Frozen Fizz', null], ['Blizzard Bop', null], ['Yeti Party', null]] },
    { color: '#ffab4d', levels: [['Hot Hop', null], ['Magma Pop', null], ['Ember Ride', null], ['Volcano Vroom', null], ['Fire Fizz', null], ['Lava Lord', null]] }
  ];

  var BOARD = {
    all: [['Zippy', 98400, 1], ['Mo', 91200, 0], ['Kiki', 88700, 3], ['You', 64100, 0], ['Bo', 52900, 2], ['Lulu', 48800, 1], ['Taz', 31000, 3]],
    friends: [['Kiki', 88700, 3], ['You', 64100, 0], ['Bo', 52900, 2], ['Dot', 21000, 1]]
  };
  var PLAYER_NAME = 'You';
  var POWS = ['POW!', 'BOING!', 'ZAP!', 'WHEE!', 'YAY!', 'BOP!'];
  var STORAGE_KEY = 'bounce-buddies-settings';

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
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 2400);
  }

  /* ======================= Buddy drawing ======================= */
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + amt)), g = Math.max(0, Math.min(255, (n >> 8 & 255) + amt)), b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function buddySvg(shape, color, mood) {
    var ink = '#1d1b33', dark = shade(color, -40);
    var body = {
      blob: '<path d="M60 18c28 0 46 22 46 50 0 22-18 34-46 34S14 90 14 68c0-28 18-50 46-50z"/>',
      ears: '<path d="M30 30L26 6l22 16M90 30l4-24-22 16"/><path d="M60 20c28 0 46 22 46 50 0 20-18 32-46 32S14 90 14 70c0-28 18-50 46-50z"/>',
      frog: '<circle cx="38" cy="34" r="16"/><circle cx="82" cy="34" r="16"/><path d="M60 34c30 0 50 18 50 40 0 18-20 28-50 28S10 92 10 74c0-22 20-40 50-40z"/>',
      star: '<path d="M60 8l14 28 30 4-22 21 6 30-28-15-28 15 6-30-22-21 30-4z" stroke-linejoin="round"/>'
    }[shape];
    var eyeY = shape === 'frog' ? 34 : shape === 'star' ? 50 : 56;
    var eyes;
    if (mood === 'dizzy') {
      eyes = '<path d="M38 ' + (eyeY - 7) + 'l12 12M50 ' + (eyeY - 7) + 'l-12 12M70 ' + (eyeY - 7) + 'l12 12M82 ' + (eyeY - 7) + 'l-12 12" stroke="' + ink + '" stroke-width="4" stroke-linecap="round"/>';
    } else if (mood === 'sad') {
      eyes = '<ellipse cx="44" cy="' + eyeY + '" rx="6" ry="8" fill="' + ink + '"/><ellipse cx="76" cy="' + eyeY + '" rx="6" ry="8" fill="' + ink + '"/><path d="M34 ' + (eyeY - 14) + 'l14 4M86 ' + (eyeY - 14) + 'l-14 4" stroke="' + ink + '" stroke-width="4" stroke-linecap="round"/>';
    } else {
      eyes = '<ellipse cx="44" cy="' + eyeY + '" rx="9" ry="11" fill="#fff" stroke="' + ink + '" stroke-width="3.5"/><ellipse cx="76" cy="' + eyeY + '" rx="9" ry="11" fill="#fff" stroke="' + ink + '" stroke-width="3.5"/>' +
        '<circle class="pupil" cx="46" cy="' + (eyeY + 2) + '" r="5" fill="' + ink + '"/><circle class="pupil" cx="78" cy="' + (eyeY + 2) + '" r="5" fill="' + ink + '"/>' +
        '<circle cx="48" cy="' + eyeY + '" r="1.8" fill="#fff"/><circle cx="80" cy="' + eyeY + '" r="1.8" fill="#fff"/>';
    }
    var mouthY = shape === 'frog' ? 62 : shape === 'star' ? 70 : 78;
    var mouth = mood === 'sad' ? '<path d="M50 ' + (mouthY + 6) + 'q10 -10 20 0" fill="none" stroke="' + ink + '" stroke-width="4" stroke-linecap="round"/>'
      : mood === 'dizzy' ? '<path d="M48 ' + mouthY + 'q6 6 12 0t12 0" fill="none" stroke="' + ink + '" stroke-width="4" stroke-linecap="round"/>'
      : '<path d="M48 ' + mouthY + 'q12 14 24 0z" fill="' + ink + '"/><path d="M53 ' + (mouthY + 4) + 'q7 6 14 0" fill="#ff7b9c"/>';
    var cheeks = '<ellipse cx="32" cy="' + (mouthY - 6) + '" rx="7" ry="4" fill="#ff7b9c" opacity=".55"/><ellipse cx="88" cy="' + (mouthY - 6) + '" rx="7" ry="4" fill="#ff7b9c" opacity=".55"/>';
    var feet = '<ellipse cx="42" cy="104" rx="12" ry="7" fill="' + dark + '" stroke="' + ink + '" stroke-width="4"/><ellipse cx="78" cy="104" rx="12" ry="7" fill="' + dark + '" stroke="' + ink + '" stroke-width="4"/>';
    return '<svg viewBox="0 0 120 116" aria-hidden="true">' + feet +
      '<g fill="' + color + '" stroke="' + ink + '" stroke-width="4.5">' + body + '</g>' +
      '<path d="M34 40 q8 -12 22 -14" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>' +
      cheeks + eyes + mouth + '</svg>';
  }
  function paintBuddies(ctx) {
    $$('[data-buddy]', ctx).forEach(function (el) {
      var b = BUDDIES[Number(el.getAttribute('data-buddy'))];
      el.innerHTML = buddySvg(b.shape, el.getAttribute('data-color') || b.color, el.getAttribute('data-mood'));
    });
  }

  /* ======================= Settings (saved) ======================= */
  var DEFAULTS = { music: 7, sfx: 8, wobble: 6, boing: false, pow: true, spin: true, difficulty: 'normal', buddy: 0, paint: null };
  var settings = Object.assign({}, DEFAULTS);
  try { Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch (e) { /* ignore */ }
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ } }

  /* ======================= Boing sounds + POW bursts ======================= */
  var actx = null;
  function boing() {
    if (!settings.boing) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
      o.type = 'sine';
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(620, t + 0.12);
      o.frequency.exponentialRampToValueAtTime(320, t + 0.3);
      g.gain.setValueAtTime(0.15 * settings.sfx / 10, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(actx.destination);
      o.start(t); o.stop(t + 0.36);
    } catch (e) { /* no audio */ }
  }
  var bursts = $('#bursts');
  function pow(x, y) {
    if (!settings.pow || reduceMotion) return;
    var b = document.createElement('div');
    b.className = 'burst';
    b.style.left = x + 'px';
    b.style.top = y + 'px';
    b.innerHTML = '<i></i><span>' + POWS[Math.random() * POWS.length | 0] + '</span>';
    bursts.appendChild(b);
    setTimeout(function () { b.remove(); }, 800);
  }

  /* ======================= Navigation ======================= */
  function showScreen(id, opts) {
    opts = opts || {};
    var t = document.getElementById(id);
    if (!t || !t.hasAttribute('data-screen')) return;
    if (id === current && !opts.force) return;
    if (!opts.isBack) stack.push(current);
    if (stack.length > 20) stack.shift();
    var prev = current;
    screens.forEach(function (s) { var on = s === t; s.hidden = !on; s.classList.toggle('is-active', on); });
    current = id;
    if (!opts.fromHash) history.replaceState(null, '', '#' + id);
    onLeave(prev);
    onEnter(id);
    if (!opts.silent) { var f = t.querySelector('.jelly-menu .jelly, h1'); if (f) f.focus({ preventScroll: true }); }
  }
  function goBack() { var p = stack.pop(); if (p) showScreen(p, { isBack: true }); }

  document.addEventListener('click', function (e) {
    if (e.target.closest('button')) {
      var r = e.target.closest('button').getBoundingClientRect();
      pow(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2);
    }
    var btn = e.target.closest('[data-goto]');
    if (!btn) return;
    e.preventDefault();
    boing();
    var a = btn.getAttribute('data-action');
    if (a === 'restart') { stars = 0; toast('Here we go again!'); }
    if (a === 'pick') { settings.buddy = buddyIndex; settings.paint = paint; save(); toast(BUDDIES[buddyIndex].name + ' is ready to bounce!'); paintMenuBuddy(); }
    if (a === 'quit') toast('Bye bye! Come back soon!');
    if (btn.hasAttribute('data-back') && stack.length) { goBack(); return; }
    showScreen(btn.getAttribute('data-goto'));
  });

  document.addEventListener('keydown', function (e) {
    var screen = document.getElementById(current);
    if (e.key === 'Escape') {
      e.preventDefault();
      if (current === 'play') showScreen('pause');
      else if (current === 'pause') showScreen('play');
      else if (current !== 'main') { var back = $('.card__head .round', screen); if (back) back.click(); else showScreen('main'); }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      var items = $$('.jelly-menu .jelly', screen);
      if (!items.length) return;
      var idx = items.indexOf(document.activeElement);
      if (idx === -1 && document.activeElement !== document.body && !document.activeElement.matches('h1')) return;
      e.preventDefault();
      var d = e.key === 'ArrowDown' ? 1 : -1;
      items[idx === -1 ? 0 : (idx + d + items.length) % items.length].focus();
    }
    if (current === 'characters' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.target.closest('[role="radio"], [role="tab"], input')) {
      e.preventDefault();
      setBuddy(buddyIndex + (e.key === 'ArrowRight' ? 1 : -1));
    }
  });

  /* ======================= Screen hooks ======================= */
  var stars = 0, starTimer;
  function onEnter(id) {
    if (id === 'play') {
      starTimer = setInterval(function () { stars++; $('#stars').textContent = stars; }, 700);
    }
    if (id === 'gameover') {
      var n = stars || 23;
      $('#go-stars').textContent = n + (n === 1 ? ' star' : ' stars');
    }
  }
  function onLeave(id) { if (id === 'play') clearInterval(starTimer); }

  /* ======================= Tabs ======================= */
  function setupTabs(list, onChange) {
    var tabs = $$('[role="tab"]', list);
    function select(t) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; }); onChange(t); }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); boing(); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); select(n);
      });
    });
  }

  /* ======================= Settings form ======================= */
  var form = $('#settings-form');
  function paintRange(input) {
    input.style.setProperty('--fill', (input.value / input.max * 100) + '%');
    var out = form.querySelector('output[for="' + input.id + '"]');
    if (out) out.textContent = input.value;
  }
  function fillForm() {
    ['music', 'sfx', 'wobble', 'boing', 'pow', 'spin', 'difficulty'].forEach(function (k) {
      var f = form.elements[k];
      if (f instanceof RadioNodeList) f.value = settings[k];
      else if (f.type === 'checkbox') f.checked = !!settings[k];
      else f.value = settings[k];
    });
    $$('input[type="range"]', form).forEach(paintRange);
    apply();
  }
  function readForm() {
    ['music', 'sfx', 'wobble', 'boing', 'pow', 'spin', 'difficulty'].forEach(function (k) {
      var f = form.elements[k];
      if (f instanceof RadioNodeList) settings[k] = f.value;
      else if (f.type === 'checkbox') settings[k] = f.checked;
      else settings[k] = Number(f.value);
    });
  }
  function apply() {
    root.style.setProperty('--wobble', settings.wobble);
    document.body.classList.toggle('no-spin', !settings.spin);
  }
  form.addEventListener('input', function (e) { if (e.target.type === 'range') paintRange(e.target); readForm(); apply(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); readForm(); save(); toast('Saved! Wobbly as ever.'); boing(); });
  $('#reset-settings').addEventListener('click', function () {
    ['music', 'sfx', 'wobble', 'boing', 'pow', 'spin', 'difficulty'].forEach(function (k) { settings[k] = DEFAULTS[k]; });
    fillForm(); toast('Back to defaults. Hit Save to keep them.');
  });

  /* ======================= Sticker book ======================= */
  var world = 0, picked = null, totalStars = 0;
  WORLDS.forEach(function (w) { w.levels.forEach(function (l) { if (l[1]) totalStars += l[1]; }); });
  $('#star-count').textContent = totalStars + ' ★';
  function renderStickers() {
    var list = $('#stickers');
    var w = WORLDS[world];
    list.innerHTML = '';
    w.levels.forEach(function (l, i) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sticker';
      b.style.setProperty('--fill', w.color);
      b.style.setProperty('--r', ((i * 53 % 11) - 5) + 'deg');
      var locked = l[1] === null;
      if (locked) {
        b.disabled = true;
        b.innerHTML = '<span class="sticker__num">?</span><span class="visually-hidden">Level ' + (i + 1) + ', locked</span>';
      } else {
        var s = '';
        for (var k = 0; k < 3; k++) s += k < l[1] ? '★' : '<span class="off">★</span>';
        b.innerHTML = '<span class="sticker__num">' + (l[2] === 'boss' ? 'B' : i + 1) + '</span><span class="sticker__name">' + l[0] + '</span><span class="sticker__stars" aria-hidden="true">' + s + '</span><span class="visually-hidden">, ' + l[1] + ' of 3 stars</span>';
        b.setAttribute('aria-pressed', String(picked && picked[0] === world && picked[1] === i));
        b.addEventListener('click', function () {
          picked = [world, i];
          $$('.sticker', list).forEach(function (x) { if (!x.disabled) x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          $('#picked').textContent = 'Picked: ' + l[0];
          boing();
        });
      }
      li.appendChild(b);
      list.appendChild(li);
    });
  }
  setupTabs($('#levels [role="tablist"]'), function (t) {
    world = Number(t.getAttribute('data-world'));
    $('#w-panel').setAttribute('aria-labelledby', t.id);
    renderStickers();
  });
  picked = [0, 3];
  $('#picked').textContent = 'Picked: ' + WORLDS[0].levels[3][0];

  /* ======================= Buddy select + paint ======================= */
  var buddyIndex = settings.buddy || 0, paint = settings.paint;
  var paintBox = $('#paint');
  PAINTS.forEach(function (c, i) {
    var s = document.createElement('button');
    s.type = 'button';
    s.className = 'paint-swatch';
    s.setAttribute('role', 'radio');
    s.setAttribute('aria-label', ['Sky', 'Bubblegum', 'Lime', 'Lemon', 'Grape', 'Tangerine', 'Cherry'][i]);
    s.style.background = c;
    s.addEventListener('click', function () { paint = c; drawBuddy(); boing(); });
    s.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      var sw = $$('.paint-swatch', paintBox), n = sw[(i + d + sw.length) % sw.length];
      n.focus(); n.click();
    });
    paintBox.appendChild(s);
  });
  function drawBuddy() {
    var b = BUDDIES[buddyIndex], color = paint || b.color;
    var big = $('#buddy-big');
    big.setAttribute('data-buddy', buddyIndex);
    big.setAttribute('data-color', color);
    big.innerHTML = buddySvg(b.shape, color);
    $('#characters').style.setProperty('--paint', color);
    $$('.paint-swatch', paintBox).forEach(function (s) {
      var on = s.style.background && PAINTS[$$('.paint-swatch', paintBox).indexOf(s)] === color;
      s.setAttribute('aria-checked', String(!!on));
      s.tabIndex = on ? 0 : -1;
    });
    if (!$$('.paint-swatch[aria-checked="true"]', paintBox).length) $$('.paint-swatch', paintBox)[0].tabIndex = 0;
  }
  function setBuddy(i) {
    buddyIndex = (i + BUDDIES.length) % BUDDIES.length;
    paint = null;
    var b = BUDDIES[buddyIndex];
    $('#buddy-name').textContent = b.name;
    $('#buddy-says').textContent = b.says;
    $('#buddy-stats').innerHTML = Object.keys(b.stats).map(function (k) {
      return '<div><dt>' + k + '</dt><dd><span style="--v:' + b.stats[k] + '%"></span><span class="visually-hidden">' + b.stats[k] + ' of 100</span></dd></div>';
    }).join('');
    drawBuddy();
    var sp = $('#buddy-says');
    sp.style.animation = 'none'; void sp.offsetWidth; sp.style.animation = '';
  }
  $('#buddy-prev').addEventListener('click', function () { setBuddy(buddyIndex - 1); });
  $('#buddy-next').addEventListener('click', function () { setBuddy(buddyIndex + 1); });
  function paintMenuBuddy() {
    $$('.buddy-peek, .player').forEach(function (el) {
      el.setAttribute('data-buddy', settings.buddy || 0);
      if (settings.paint) el.setAttribute('data-color', settings.paint); else el.removeAttribute('data-color');
    });
    paintBuddies(document);
  }

  /* ======================= Podium ======================= */
  var board = 'all';
  function renderBoard() {
    var rows = BOARD[board].slice().sort(function (a, b) { return b[1] - a[1]; });
    $('#podium').innerHTML = rows.slice(0, 3).map(function (r, i) {
      return '<li><span class="pod-buddy" data-buddy="' + r[2] + '"></span><span class="pod-name">' + r[0] + '</span><span class="pod-score">' + r[1].toLocaleString('en-US') + '</span><span class="block" aria-hidden="true">' + (i + 1) + '</span><span class="visually-hidden">Place ' + (i + 1) + '</span></li>';
    }).join('');
    $('#ranks').innerHTML = rows.slice(3).map(function (r, i) {
      return '<li class="' + (r[0] === PLAYER_NAME ? 'is-you' : '') + '" style="animation-delay:' + (i * 0.06) + 's"><span class="r-buddy" data-buddy="' + r[2] + '"></span><span>' + r[0] + '</span><span class="r-score">' + r[1].toLocaleString('en-US') + '</span></li>';
    }).join('');
    paintBuddies($('#lb-panel'));
  }
  setupTabs($('#leaderboard [role="tablist"]'), function (t) {
    board = t.getAttribute('data-board');
    $('#lb-panel').setAttribute('aria-labelledby', t.id);
    renderBoard();
  });

  /* ======================= Init ======================= */
  fillForm();
  paintMenuBuddy();
  renderStickers();
  setBuddy(buddyIndex);
  if (settings.paint) { paint = settings.paint; drawBuddy(); }
  renderBoard();
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    if (el && el.hasAttribute('data-screen')) showScreen(id, { fromHash: true, silent: silent, force: true });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
