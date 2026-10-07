/* ==========================================================================
   STELLAR ATLAS — Space Exploration Game Menu Template
   Vanilla JS: canvas starfield (parallax + warp), navigation, settings (saved),
   planet carousel, crew manifest, explorers' hall.
   Edit the DATA section to chart your own universe.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================= DATA (edit me) ======================= */
  // Each planet is painted with CSS gradients (no images): `base` is the fixed globe,
  // `texture` scrolls across it to make the planet spin (shapes must stay inside 0–100% x).
  var PLANETS = [
    { name: 'Kepler Reach', type: 'Ocean world', glow: '#4fb7ff', spin: '26s',
      base: 'radial-gradient(circle at 35% 30%, #9fe3ff, #2b7fd1 45%, #0b2a63 80%)',
      texture: 'radial-gradient(ellipse 9% 16% at 15% 38%, #7fd08a 60%, transparent 64%), radial-gradient(ellipse 6% 10% at 40% 66%, #6fbf7a 60%, transparent 64%), radial-gradient(ellipse 8% 12% at 70% 30%, #86d391 60%, transparent 64%), radial-gradient(ellipse 5% 8% at 88% 72%, #6fbf7a 60%, transparent 64%)',
      desc: 'Endless oceans and floating kelp forests. Something sings beneath the waves.', facts: { Gravity: '1.1 g', Temp: '18 °C', Danger: 'Low' } },
    { name: 'Ember IV', type: 'Lava world', glow: '#ff7b47', spin: '40s',
      base: 'radial-gradient(circle at 35% 30%, #ffb27a, #c43d1c 45%, #3a0d0a 80%)',
      texture: 'repeating-linear-gradient(115deg, rgba(255, 196, 90, .55) 0 5px, transparent 5px 28px)',
      desc: 'Rivers of molten rock carve glowing canyons through obsidian plains.', facts: { Gravity: '1.4 g', Temp: '412 °C', Danger: 'High' } },
    { name: 'Halcyon', type: 'Gas giant', glow: '#e7b98c', spin: '18s', ringed: true,
      base: 'repeating-linear-gradient(0deg, #e9c79f 0 12%, #c98f63 12% 20%, #f0d8b8 20% 31%, #a8704f 31% 37%, #e2b98f 37% 52%)',
      texture: 'radial-gradient(ellipse 7% 4% at 30% 60%, rgba(160, 80, 50, .8) 60%, transparent 64%), radial-gradient(ellipse 4% 3% at 75% 30%, rgba(255, 235, 210, .7) 60%, transparent 64%)',
      desc: 'Storm bands the size of continents. Mine its rings for rare ice.', facts: { Gravity: '2.6 g', Temp: '−140 °C', Danger: 'Medium' } },
    { name: 'Glacia', type: 'Ice world', glow: '#bfe9ff', spin: '34s',
      base: 'radial-gradient(circle at 35% 30%, #ffffff, #a7d9f2 45%, #3d6f9a 82%)',
      texture: 'repeating-linear-gradient(60deg, rgba(255, 255, 255, .4) 0 2px, transparent 2px 30px), repeating-linear-gradient(-30deg, rgba(120, 170, 210, .3) 0 2px, transparent 2px 44px)',
      desc: 'Crystal plains and frozen geysers that erupt every hour on the hour.', facts: { Gravity: '0.8 g', Temp: '−96 °C', Danger: 'Medium' } },
    { name: 'Verdance', type: 'Jungle world', glow: '#7be08f', spin: '28s',
      base: 'radial-gradient(circle at 35% 30%, #c4f2a0, #4ea85a 45%, #123d22 82%)',
      texture: 'radial-gradient(ellipse 12% 14% at 18% 40%, #2f7d3a 60%, transparent 64%), radial-gradient(ellipse 10% 9% at 52% 68%, #3c9146 60%, transparent 64%), radial-gradient(ellipse 8% 12% at 82% 34%, #2a6e33 60%, transparent 64%), radial-gradient(ellipse 14% 4% at 50% 22%, rgba(255, 255, 255, .55) 60%, transparent 64%)',
      desc: 'A canopy so dense that the surface has never been photographed.', facts: { Gravity: '0.9 g', Temp: '31 °C', Danger: 'Medium' } },
    { name: 'The Void Gate', type: 'Anomaly', glow: '#c79bff', spin: '12s', locked: true,
      base: 'conic-gradient(from 0deg, #1a0f3a, #6b3fd1, #ff5fa8, #1a0f3a, #1fb5c4, #1a0f3a)',
      texture: 'radial-gradient(circle at 50% 50%, rgba(5, 4, 15, .9) 0 18%, transparent 40%)',
      desc: 'Signal source unknown. Requires a jump drive upgrade.', facts: { Gravity: '?', Temp: '?', Danger: 'Unknown' } }
  ];

  var CREW = [
    { name: 'Cmdr. Ada Okoro', role: 'Commander', suit: '#7ad3ff', bio: 'Has logged more hours in deep space than anyone alive. Calm, precise, unbeatable at chess.', skills: { Piloting: 92, Science: 64, Engineering: 58, Diplomacy: 88 } },
    { name: 'Dr. Lev Sato', role: 'Xenobiologist', suit: '#6be3c0', bio: 'Talks to every alien plant he finds. Sometimes they seem to answer.', skills: { Piloting: 38, Science: 97, Engineering: 46, Diplomacy: 72 } },
    { name: 'Rook Valdez', role: 'Engineer', suit: '#ffb46b', bio: 'Rebuilt the main reactor with a wrench and a stubborn attitude.', skills: { Piloting: 61, Science: 55, Engineering: 98, Diplomacy: 40 } },
    { name: 'Mira Chen', role: 'Navigator', suit: '#ff7fb6', bio: 'Can plot a jump through an asteroid field faster than the nav computer.', skills: { Piloting: 88, Science: 70, Engineering: 50, Diplomacy: 60 } }
  ];

  var HALL = {
    distance: [['Nova Reyes', 'Wayfarer', 4820, '#7ad3ff'], ['Juno Park', 'Lantern-7', 4610, '#c79bff'], ['Theo Brandt', 'Far Song', 4385, '#ffb46b'], ['Ida Moreau', 'Kestrel', 3990, '#6be3c0'], ['You', 'Atlas One', 3120, '#ff7fb6'], ['Sol Haddad', 'Pilgrim', 2870, '#9aa0c8']],
    worlds: [['Juno Park', 'Lantern-7', 128, '#c79bff'], ['You', 'Atlas One', 117, '#ff7fb6'], ['Nova Reyes', 'Wayfarer', 102, '#7ad3ff'], ['Theo Brandt', 'Far Song', 96, '#ffb46b'], ['Ida Moreau', 'Kestrel', 80, '#6be3c0']]
  };
  var PLAYER_NAME = 'You';
  var STORAGE_KEY = 'stellar-atlas-settings';

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
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 2600);
  }

  /* ======================= Settings (saved) ======================= */
  var DEFAULTS = { density: 450, hue: 0, parallax: true, shooting: true, master: 80, music: 65, blips: false, sens: 5, invert: false, assist: 'some' };
  var settings = Object.assign({}, DEFAULTS);
  try { Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch (e) { /* ignore */ }

  /* ======================= Starfield (canvas) ======================= */
  var canvas = $('#stars'), ctx = canvas.getContext('2d');
  var stars = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var mouse = { x: 0, y: 0 }, cam = { x: 0, y: 0 }, warp = 0, warpTarget = 0;
  function resize() {
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function makeStars(n) {
    stars = [];
    for (var i = 0; i < n; i++) {
      stars.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * .9 + .1, tw: Math.random() * Math.PI * 2 });
    }
  }
  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    cam.x += (mouse.x - cam.x) * .05;
    cam.y += (mouse.y - cam.y) * .05;
    warp += (warpTarget - warp) * .04;
    var cx = W / 2, cy = H / 2, scale = Math.max(W, H) * .6;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      if (warp > .01) {
        s.z -= .004 + warp * .03;
        if (s.z <= .05) { s.z = 1; s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; }
      }
      var px = cx + (s.x / s.z) * scale * .5 - cam.x * (1 - s.z) * 40;
      var py = cy + (s.y / s.z) * scale * .5 - cam.y * (1 - s.z) * 40;
      if (px < -50 || px > W + 50 || py < -50 || py > H + 50) { if (warp > .01) s.z = 1; continue; }
      var size = (1 - s.z) * 2.2 + .3;
      var alpha = .45 + .55 * Math.abs(Math.sin(t / 900 + s.tw));
      ctx.globalAlpha = Math.min(1, alpha * (1.1 - s.z * .6));
      if (warp > .05) {
        var len = warp * 40 * (1 - s.z);
        ctx.strokeStyle = '#cfe8ff';
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + (px - cx) / scale * len * 6, py + (py - cy) / scale * len * 6);
        ctx.stroke();
      } else {
        ctx.fillStyle = s.z < .3 ? '#ffffff' : (i % 7 === 0 ? '#ffd9a8' : i % 5 === 0 ? '#c9dcff' : '#eef0ff');
        ctx.fillRect(px, py, size, size);
      }
    }
    ctx.globalAlpha = 1;
    if (!reduceMotion) requestAnimationFrame(frame);
  }
  window.addEventListener('resize', resize);
  document.addEventListener('pointermove', function (e) {
    if (!settings.parallax) { mouse.x = mouse.y = 0; return; }
    mouse.x = (e.clientX / innerWidth - .5) * 2;
    mouse.y = (e.clientY / innerHeight - .5) * 2;
  });
  resize();
  makeStars(settings.density);
  requestAnimationFrame(frame);

  /* ======================= Blips ======================= */
  var actx = null;
  function blip(freq) {
    if (!settings.blips) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.06 * settings.master / 100, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.25);
      o.connect(g).connect(actx.destination);
      o.start(); o.stop(actx.currentTime + 0.25);
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
    if (!opts.silent) { var f = t.querySelector('.orbit, .list-btn, h1'); if (f) f.focus({ preventScroll: true }); }
  }
  function goBack() { var p = stack.pop(); if (p) showScreen(p, { isBack: true }); }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-goto]');
    if (!btn) return;
    e.preventDefault();
    blip(660);
    var a = btn.getAttribute('data-action');
    if (a === 'checkpoint') toast('Respawned at the last beacon.');
    if (a === 'relaunch') toast('Relaunching. Godspeed, explorer.');
    if (a === 'captain') toast(CREW[crewIndex].name + ' now has the bridge.');
    if (a === 'quit') toast('Course set for home. See you among the stars.');
    if (btn.id === 'dest-go') toast('Course set for ' + PLANETS[planetIndex].name + '.');
    if (btn.hasAttribute('data-back') && stack.length) { goBack(); return; }
    showScreen(btn.getAttribute('data-goto'));
  });

  document.addEventListener('keydown', function (e) {
    var screen = document.getElementById(current);
    if (e.key === 'Escape') {
      e.preventDefault();
      if (current === 'play') showScreen('pause');
      else if (current === 'pause') showScreen('play');
      else if (current !== 'main') { var back = $('.panel__head .round-btn', screen); if (back) back.click(); else showScreen('main'); }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      var items = $$('.orbit, .list-btn', screen);
      if (!items.length) return;
      var idx = items.indexOf(document.activeElement);
      if (idx === -1 && document.activeElement !== document.body && !document.activeElement.matches('h1')) return;
      e.preventDefault();
      var d = e.key === 'ArrowDown' ? 1 : -1;
      items[idx === -1 ? 0 : (idx + d + items.length) % items.length].focus();
    }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.target.closest('[role="tab"], input')) {
      var dir = e.key === 'ArrowRight' ? 1 : -1;
      if (current === 'levels') { e.preventDefault(); setPlanet(planetIndex + dir); }
      if (current === 'characters' && !e.target.closest('.crew-btn')) { e.preventDefault(); setCrew(crewIndex + dir); }
    }
  });

  /* ======================= Screen hooks ======================= */
  var flightTimer;
  function onEnter(id) {
    if (id === 'play') {
      warpTarget = reduceMotion ? 0 : 1;
      var speed = 0, eta = 252, fuel = 82;
      flightTimer = setInterval(function () {
        speed = Math.min(9.97, speed + .37);
        eta = Math.max(0, eta - 1);
        fuel = Math.max(20, fuel - .2);
        $('#speed').textContent = speed.toFixed(2);
        $('#eta').textContent = String(eta / 60 | 0).padStart(2, '0') + ':' + String(eta % 60).padStart(2, '0');
        $('#fuel').style.setProperty('--v', fuel + '%');
      }, 250);
    }
    if (id === 'gameover') {
      countUp($('#lost-years'), 214, '');
      countUp($('#lost-dist'), 3120, ' ly');
      countUp($('#lost-worlds'), 117, '');
      countUp($('#lost-score'), 48230, '');
    }
  }
  function onLeave(id) { if (id === 'play') { clearInterval(flightTimer); warpTarget = 0; } }
  function countUp(el, to, suffix) {
    var start = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - start) / 1300);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US') + suffix;
      if (k < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ======================= Tabs ======================= */
  function setupTabs(list, onChange) {
    var tabs = $$('[role="tab"]', list);
    function select(t) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; }); onChange(t); }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); blip(880); });
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
  var board = 'distance';
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
    if (out) out.textContent = input.value + (input.name === 'hue' ? '°' : '');
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
  var lastDensity = settings.density;
  function apply() {
    root.style.setProperty('--nebula-hue', settings.hue + 'deg');
    document.body.classList.toggle('no-shooting', !settings.shooting);
    if (settings.density !== lastDensity) { makeStars(settings.density); lastDensity = settings.density; }
    if (!settings.parallax) { mouse.x = mouse.y = 0; }
    if (reduceMotion) requestAnimationFrame(frame);
  }
  form.addEventListener('input', function (e) { if (e.target.type === 'range') paintRange(e.target); readForm(); apply(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault(); readForm();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (err) { /* ignore */ }
    toast('Ship settings saved.'); blip(990);
  });
  $('#reset-settings').addEventListener('click', function () { settings = Object.assign({}, DEFAULTS); fillForm(); toast('Defaults restored. Save to keep them.'); });

  /* ======================= Destinations ======================= */
  var planetIndex = 0, dots = $('#dest-dots');
  PLANETS.forEach(function (p, i) {
    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'dot';
    d.setAttribute('aria-label', p.name + (p.locked ? ' (locked)' : ''));
    d.addEventListener('click', function () { setPlanet(i); });
    dots.appendChild(d);
  });
  function setPlanet(i) {
    planetIndex = (i + PLANETS.length) % PLANETS.length;
    var p = PLANETS[planetIndex];
    $('#dest-stage').innerHTML = '<div class="planet' + (p.ringed ? ' planet--ringed' : '') + '" style="--base:' + p.base + ';--texture:' + p.texture + ';--glow:' + p.glow + ';--spin:' + p.spin + '" role="img" aria-label="' + p.name + ', ' + p.type + '"><span class="planet__surface"></span><span class="planet__shade"></span></div>';
    $('#dest-type').textContent = p.type + (p.locked ? ' · Locked' : '');
    $('#dest-name').textContent = p.name;
    $('#dest-desc').textContent = p.desc;
    $('#dest-facts').innerHTML = Object.keys(p.facts).map(function (k) { return '<div><dt>' + k + '</dt><dd>' + p.facts[k] + '</dd></div>'; }).join('');
    var go = $('#dest-go');
    go.disabled = !!p.locked;
    go.textContent = p.locked ? 'Jump drive required' : 'Set course';
    $$('.dot', dots).forEach(function (d, n) { d.setAttribute('aria-pressed', String(n === planetIndex)); });
    var info = $('#dest-info');
    info.classList.remove('is-swap'); void info.offsetWidth; info.classList.add('is-swap');
    blip(520 + planetIndex * 60);
  }
  $('#dest-prev').addEventListener('click', function () { setPlanet(planetIndex - 1); });
  $('#dest-next').addEventListener('click', function () { setPlanet(planetIndex + 1); });
  var touchX = null;
  $('#dest-stage').addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  $('#dest-stage').addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) setPlanet(planetIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ======================= Crew ======================= */
  var crewIndex = 0, list = $('#crew-list');
  function helmet(color) {
    return '<svg viewBox="0 0 160 170" aria-hidden="true"><path d="M30 150c0-26 22-40 50-40s50 14 50 40v20H30z" fill="#e8ecff" stroke="#9aa6e0" stroke-width="3"/>' +
      '<rect x="62" y="122" width="36" height="22" rx="6" fill="' + color + '"/>' +
      '<circle cx="80" cy="70" r="56" fill="#e8ecff" stroke="#9aa6e0" stroke-width="3"/>' +
      '<ellipse cx="82" cy="72" rx="40" ry="32" fill="#141a3d"/>' +
      '<ellipse cx="96" cy="60" rx="14" ry="7" fill="' + color + '" opacity=".55" transform="rotate(-20 96 60)"/>' +
      '<rect x="24" y="64" width="10" height="22" rx="4" fill="' + color + '"/><rect x="126" y="64" width="10" height="22" rx="4" fill="' + color + '"/></svg>';
  }
  CREW.forEach(function (c, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'crew-btn';
    b.setAttribute('role', 'radio');
    b.style.setProperty('--suit', c.suit);
    b.innerHTML = '<span class="crew-btn__dot" aria-hidden="true"></span><span><span class="crew-btn__name">' + c.name + '</span><span class="crew-btn__role">' + c.role + '</span></span>';
    b.addEventListener('click', function () { setCrew(i); });
    b.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      setCrew(crewIndex + d, true);
    });
    list.appendChild(b);
  });
  function setCrew(i, focus) {
    crewIndex = (i + CREW.length) % CREW.length;
    var c = CREW[crewIndex];
    $$('.crew-btn', list).forEach(function (b, n) {
      var on = n === crewIndex;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    var d = $('#crew-detail');
    d.style.setProperty('--suit', c.suit);
    $('#crew-helmet').innerHTML = helmet(c.suit);
    $('#crew-role').textContent = c.role;
    $('#crew-name').textContent = c.name;
    $('#crew-bio').textContent = c.bio;
    $('#crew-skills').innerHTML = Object.keys(c.skills).map(function (k) {
      return '<div><dt>' + k + '</dt><dd class="bar"><span style="--v:' + c.skills[k] + '%"></span></dd><dd class="num">' + c.skills[k] + '</dd></div>';
    }).join('');
    d.classList.remove('is-swap'); void d.offsetWidth; d.classList.add('is-swap');
  }

  /* ======================= Explorers' hall ======================= */
  function renderHall() {
    $('#h-metric').textContent = board === 'distance' ? 'Distance' : 'Worlds';
    $('#h-body').innerHTML = HALL[board].slice().sort(function (a, b) { return b[2] - a[2]; }).map(function (r, i) {
      return '<tr class="' + (r[0] === PLAYER_NAME ? 'is-you' : '') + '" style="animation-delay:' + (i * 0.05) + 's">' +
        '<td class="rank">' + (i + 1) + '</td>' +
        '<td><span class="who"><span class="avatar" style="--c:' + r[3] + '" aria-hidden="true"></span>' + r[0] + (r[0] === PLAYER_NAME ? '<span class="visually-hidden"> (you)</span>' : '') + '</span></td>' +
        '<td class="col-ship">' + r[1] + '</td>' +
        '<td class="metric">' + r[2].toLocaleString('en-US') + (board === 'distance' ? ' ly' : '') + '</td></tr>';
    }).join('');
  }

  /* ======================= Init ======================= */
  fillForm();
  setPlanet(0);
  setCrew(0);
  renderHall();
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    if (el && el.hasAttribute('data-screen')) showScreen(id, { fromHash: true, silent: silent, force: true });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
