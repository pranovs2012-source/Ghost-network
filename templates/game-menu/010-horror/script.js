/* ==========================================================================
   WHISPERWOOD — Horror Game Menu Template
   Vanilla JS: navigation, flashlight, film grain, settings (saved) with gamma
   calibration, corkboard chapters with red string, case files, survivors' log.
   Edit the DATA section to tell your own story.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================= DATA (edit me) ======================= */
  var CHAPTERS = [
    { name: 'The Drive Up', scene: 'scene-1', done: true },
    { name: 'Cellar Door', scene: 'scene-2', done: true },
    { name: 'The Long Hall', scene: 'scene-3', done: true },
    { name: 'Nursery', scene: 'scene-4', current: true },
    { name: 'The Attic', locked: true },
    { name: 'Well House', locked: true },
    { name: 'Chapel', locked: true },
    { name: 'Morning?', locked: true }
  ];

  var SURVIVORS = [
    { name: 'June Calloway', no: 'CASE 1997-031', tone: '#6b5a48', status: 'MISSING', note: 'Last seen carrying a camcorder toward the east wing. Tapes recovered. Most of them.', traits: { Courage: 'steady', Stamina: 'good', Sanity: 'fraying' } },
    { name: 'Eli Marsh', no: 'CASE 1997-032', tone: '#4a5a62', status: 'SURVIVED', note: 'Found at dawn by the well. Refuses to say what he heard. Sleeps with the lights on.', traits: { Courage: 'low', Stamina: 'high', Sanity: 'intact' } },
    { name: 'Rosa Vint', no: 'CASE 1997-033', tone: '#5e4a52', status: 'UNKNOWN', note: 'Drew the same door forty times in her notebook. The door does not exist on any floor plan.', traits: { Courage: 'reckless', Stamina: 'average', Sanity: '???' } },
    { name: 'Father Abel', no: 'CASE 1997-034', tone: '#56503a', status: 'MISSING', note: 'Came to bless the house. His car is still in the driveway, engine warm.', traits: { Courage: 'faithful', Stamina: 'low', Sanity: 'tested' } }
  ];

  var LOG = {
    all: [['Eli M.', 7], ['Mara K.', 6], ['June C.', 5, true], ['You', 4], ['Theo R.', 3, true], ['Rosa V.', 2, true], ['Sam B.', 1, true]],
    tonight: [['You', 4], ['Ana P.', 3], ['Owen L.', 1, true]]
  };
  var PLAYER_NAME = 'You';
  var WHISPERS = ['did you hear that?', 'behind you', 'it knows your name', 'don’t look at the door', 'you left the light on'];
  var STORAGE_KEY = 'whisperwood-settings';

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

  /* ======================= Flashlight ======================= */
  var target = { x: innerWidth / 2, y: innerHeight * .4 }, pos = { x: target.x, y: target.y };
  function moveLight(x, y) { target.x = x; target.y = y; }
  document.addEventListener('pointermove', function (e) { if (settings.flashlight) moveLight(e.clientX, e.clientY); });
  document.addEventListener('focusin', function (e) {
    if (!settings.flashlight || !e.target.getBoundingClientRect) return;
    var r = e.target.getBoundingClientRect();
    moveLight(r.left + r.width / 2, r.top + r.height / 2);
  });
  (function follow() {
    pos.x += (target.x - pos.x) * .12;
    pos.y += (target.y - pos.y) * .12;
    root.style.setProperty('--fx', pos.x.toFixed(0) + 'px');
    root.style.setProperty('--fy', pos.y.toFixed(0) + 'px');
    requestAnimationFrame(follow);
  })();

  /* ======================= Film grain (generated once) ======================= */
  (function makeGrain() {
    try {
      var c = document.createElement('canvas');
      c.width = c.height = 160;
      var ctx = c.getContext('2d'), img = ctx.createImageData(160, 160);
      for (var i = 0; i < img.data.length; i += 4) {
        var v = Math.random() * 255 | 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      $('#grain').style.backgroundImage = 'url(' + c.toDataURL() + ')';
    } catch (e) { /* canvas unavailable */ }
  })();

  /* ======================= Heartbeat sounds ======================= */
  var actx = null;
  function thump() {
    if (!settings.heartbeat) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.18].forEach(function (offset) {
        var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + offset;
        o.type = 'sine';
        o.frequency.setValueAtTime(70, t);
        o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.25 * settings.master / 100, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(g).connect(actx.destination);
        o.start(t); o.stop(t + 0.22);
      });
    } catch (e) { /* no audio */ }
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
    if (!opts.silent) { var f = t.querySelector('.note-btn, .type-btn, h1'); if (f) f.focus({ preventScroll: true }); }
  }
  function goBack() { var p = stack.pop(); if (p) showScreen(p, { isBack: true }); }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-goto]');
    if (!btn) return;
    e.preventDefault();
    thump();
    var a = btn.getAttribute('data-action');
    if (a === 'checkpoint') toast('You wake beside the last candle.');
    if (a === 'retry') toast('The night begins again.');
    if (a === 'pick') toast('You are ' + SURVIVORS[fileIndex].name + ' now.');
    if (a === 'quit') toast('Sleep well. Lock the door.');
    if (btn.hasAttribute('data-back') && stack.length) { goBack(); return; }
    showScreen(btn.getAttribute('data-goto'));
  });

  document.addEventListener('keydown', function (e) {
    var screen = document.getElementById(current);
    if (e.key === 'Escape') {
      e.preventDefault();
      if (current === 'play') showScreen('pause');
      else if (current === 'pause') showScreen('play');
      else if (current !== 'main') { var back = $('.back', screen); if (back) back.click(); else showScreen('main'); }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      var items = $$('.note-btn, .type-btn', screen);
      if (!items.length) return;
      var idx = items.indexOf(document.activeElement);
      if (idx === -1 && document.activeElement !== document.body && !document.activeElement.matches('h1')) return;
      e.preventDefault();
      var d = e.key === 'ArrowDown' ? 1 : -1;
      items[idx === -1 ? 0 : (idx + d + items.length) % items.length].focus();
    }
  });

  /* ======================= Screen hooks ======================= */
  var camTimer, whisperTimer, drips = $('.drips');
  function onEnter(id) {
    if (id === 'play') {
      var seconds = 4 * 3600 + 13 * 60 + 7;
      camTimer = setInterval(function () {
        seconds++;
        var h = seconds / 3600 | 0, m = (seconds % 3600) / 60 | 0, s = seconds % 60;
        $('#cam-time').textContent = [h, m, s].map(function (n) { return String(n).padStart(2, '0'); }).join(':');
      }, 1000);
      var w = $('#whisper');
      whisperTimer = setInterval(function () {
        if (!settings.jumpScares) return;
        w.textContent = WHISPERS[Math.random() * WHISPERS.length | 0];
        w.classList.add('is-on');
        setTimeout(function () { w.classList.remove('is-on'); }, 2200);
      }, 5200);
    }
    if (id === 'gameover') {
      drips.innerHTML = '';
      for (var i = 0; i < 18; i++) {
        var d = document.createElement('span');
        d.style.left = (i / 18 * 100 + Math.random() * 4) + '%';
        d.style.setProperty('--w', (10 + Math.random() * 26) + 'px');
        d.style.setProperty('--h', (30 + Math.random() * 120) + 'px');
        d.style.setProperty('--d', (1.5 + Math.random() * 2.5) + 's');
        drips.appendChild(d);
      }
      var mins = 0, end = 47;
      var el = $('#dead-time');
      var t = setInterval(function () { mins += 1; el.textContent = mins; if (mins >= end) clearInterval(t); }, 20);
    }
    if (id === 'levels') requestAnimationFrame(drawString);
  }
  function onLeave(id) {
    if (id === 'play') { clearInterval(camTimer); clearInterval(whisperTimer); }
  }

  /* ======================= Tabs ======================= */
  function setupTabs(list, onChange) {
    var tabs = $$('[role="tab"]', list);
    function select(t, focus) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; }); if (focus) t.focus(); onChange(t); }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        e.stopPropagation();
        select(tabs[(i + d + tabs.length) % tabs.length], true);
      });
    });
    return select;
  }
  setupTabs($('#settings [role="tablist"]'), function (t) {
    $$('#settings [role="tabpanel"]').forEach(function (p) { p.hidden = p.id !== t.getAttribute('aria-controls'); });
  });
  var board = 'all';
  setupTabs($('#leaderboard [role="tablist"]'), function (t) {
    board = t.getAttribute('data-board');
    $('#l-panel').setAttribute('aria-labelledby', t.id);
    renderLog();
  });

  /* ======================= Settings (saved) ======================= */
  var DEFAULTS = { gamma: 100, flashlight: true, master: 80, ambience: 70, heartbeat: false, grain: true, lightning: true, jumpScares: true, fear: 'dread' };
  var settings = Object.assign({}, DEFAULTS);
  try { Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch (e) { /* ignore */ }
  if (reduceMotion) { settings.lightning = false; }
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
      else settings[k] = Number(f.value);
    });
  }
  function apply() {
    root.style.setProperty('--gamma', settings.gamma / 100);
    document.body.classList.toggle('no-grain', !settings.grain);
    document.body.classList.toggle('no-lightning', !settings.lightning);
    document.body.classList.toggle('no-flashlight', !settings.flashlight);
  }
  form.addEventListener('input', function (e) { if (e.target.type === 'range') paintRange(e.target); readForm(); apply(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault(); readForm();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (err) { /* ignore */ }
    toast('Saved. The dark is calibrated.'); thump();
  });
  $('#reset-settings').addEventListener('click', function () { settings = Object.assign({}, DEFAULTS); fillForm(); toast('Defaults restored. Save to keep them.'); });

  /* ======================= Corkboard chapters ======================= */
  var photos = $('#photos');
  var chosen = CHAPTERS.findIndex(function (c) { return c.current; });
  CHAPTERS.forEach(function (c, i) {
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'photo';
    b.style.setProperty('--r', ((i * 37 % 9) - 4) + 'deg');
    b.innerHTML = '<span class="photo__pin" aria-hidden="true"></span>' +
      '<span class="photo__img ' + (c.scene || '') + '" aria-hidden="true"></span>' +
      '<span class="photo__num">Chapter ' + (i + 1) + '</span>' +
      '<span class="photo__cap">' + (c.locked ? 'not yet' : c.name) + '</span>' +
      (c.locked ? '<span class="visually-hidden">, locked</span>' : c.done ? '<span class="visually-hidden">, survived</span>' : '<span class="visually-hidden">, current chapter</span>');
    if (c.locked) b.disabled = true;
    else {
      b.setAttribute('aria-pressed', String(i === chosen));
      b.addEventListener('click', function () {
        chosen = i;
        $$('.photo', photos).forEach(function (p) { if (!p.disabled) p.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        $('#chosen-chapter').textContent = 'Chapter ' + (i + 1) + ': ' + c.name;
        thump();
      });
    }
    li.appendChild(b);
    photos.appendChild(li);
  });
  $('#chosen-chapter').textContent = 'Chapter ' + (chosen + 1) + ': ' + CHAPTERS[chosen].name;

  // Red string linking the pins of every unlocked chapter
  function drawString() {
    var svg = $('#board-string');
    if (!svg || $('#levels').hidden) return;
    var box = svg.getBoundingClientRect();
    var pins = $$('.photo:not(:disabled) .photo__pin', photos).map(function (p) {
      var r = p.getBoundingClientRect();
      return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
    });
    var lines = '';
    for (var i = 1; i < pins.length; i++) lines += '<line x1="' + pins[i - 1][0] + '" y1="' + pins[i - 1][1] + '" x2="' + pins[i][0] + '" y2="' + pins[i][1] + '"/>';
    svg.innerHTML = lines;
  }
  window.addEventListener('resize', drawString);

  /* ======================= Case files ======================= */
  var fileIndex = 0;
  var fileTabs = $('#file-tabs');
  SURVIVORS.forEach(function (s, i) {
    var t = document.createElement('button');
    t.type = 'button';
    t.className = 'tab';
    t.id = 'file-tab-' + i;
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', 'casefile');
    t.textContent = s.name.split(' ')[0];
    fileTabs.appendChild(t);
  });
  var selectFile = setupTabs(fileTabs, function (t) {
    fileIndex = Number(t.id.split('-').pop());
    var s = SURVIVORS[fileIndex];
    var cf = $('#casefile');
    cf.setAttribute('aria-labelledby', t.id);
    cf.style.setProperty('--tone', s.tone);
    $('#cf-photo').style.setProperty('--tone', s.tone);
    $('#cf-no').textContent = s.no;
    $('#cf-name').textContent = s.name;
    $('#cf-note').textContent = s.note;
    $('#cf-stamp').textContent = s.status;
    $('#cf-traits').innerHTML = Object.keys(s.traits).map(function (k) { return '<div><dt>' + k + '</dt><dd>' + s.traits[k] + '</dd></div>'; }).join('');
    cf.classList.remove('is-swap'); void cf.offsetWidth; cf.classList.add('is-swap');
  });
  selectFile($$('[role="tab"]', fileTabs)[0]);
  document.addEventListener('keydown', function (e) {
    if (current !== 'characters' || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.target.closest('[role="tab"]')) return;
    e.preventDefault();
    var tabs = $$('[role="tab"]', fileTabs);
    selectFile(tabs[(fileIndex + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length], true);
  });

  /* ======================= Survivors' log ======================= */
  function renderLog() {
    $('#log').innerHTML = LOG[board].slice().sort(function (a, b) { return b[1] - a[1]; }).map(function (r, i) {
      var cls = (r[2] ? 'is-lost ' : '') + (r[0] === PLAYER_NAME ? 'is-you' : '');
      return '<li class="' + cls.trim() + '" style="animation-delay:' + (i * 0.12) + 's"><span class="entry__name">' + (i + 1) + '. ' + r[0] +
        (r[2] ? '<span class="visually-hidden"> (lost)</span>' : '') + (r[0] === PLAYER_NAME ? '<span class="visually-hidden"> (you)</span>' : '') +
        '</span><span class="entry__nights">' + r[1] + (r[1] === 1 ? ' night' : ' nights') + '</span></li>';
    }).join('');
  }

  /* ======================= Init ======================= */
  fillForm();
  renderLog();
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    if (el && el.hasAttribute('data-screen')) showScreen(id, { fromHash: true, silent: silent, force: true });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
